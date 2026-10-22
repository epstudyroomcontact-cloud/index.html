/* =========================================================
   MÁY GỬI THÔNG BÁO ĐẨY KHI LIVE — chạy trên GitHub Actions (.github/workflows/push-live.yml), không cần máy chủ riêng.
   Mỗi lần chạy (khoảng 5 phút một lần):
   1. Đọc lịch live tuần này / tuần sau trong Firestore (weekly_schedules, giờ Việt Nam, giống hệt cách web tính).
   2. Có buổi sắp bắt đầu (từ PUSH_LEAD_MIN phút trước giờ bắt đầu tới PUSH_LATE_MIN phút sau) mà chưa gửi → gửi cho mọi token.
   3. Admin bấm "Gửi thông báo live ngay" (push_admin/now) → gửi ngay ở lần chạy này.
   Gửi qua Firebase Cloud Messaging HTTP v1 bằng tài khoản dịch vụ trong GitHub Secret FIREBASE_SERVICE_ACCOUNT.
   Không cần cài thêm gói nào (chỉ dùng Node có sẵn).
   ========================================================= */
import crypto from 'node:crypto';

const env = process.env;
if (!env.FIREBASE_SERVICE_ACCOUNT) { console.log('::notice::Chưa có secret FIREBASE_SERVICE_ACCOUNT nên chưa gửi gì (xem SETUP.md, phần Thông báo đẩy).'); process.exit(0); }
const SA = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
const PROJECT = SA.project_id;
const MODE = env.PUSH_MODE || 'auto';                 // auto = theo lịch | now = gửi ngay (chạy tay từ GitHub)
const LEAD = +(env.PUSH_LEAD_MIN || 5), LATE = +(env.PUSH_LATE_MIN || 45);
const DRY = env.PUSH_DRY_RUN === '1';
const VN_OFF = 7 * 3600e3;                            // Việt Nam không đổi giờ mùa hè: luôn UTC+7
const NOW = Date.now();

/* ---------- đăng nhập Google bằng tài khoản dịch vụ (JWT ký RS256) ---------- */
const b64u = b => Buffer.from(b).toString('base64url');
async function accessToken(){
  const iat = Math.floor(NOW / 1000);
  const head = b64u(JSON.stringify({ alg:'RS256', typ:'JWT' }));
  const claim = b64u(JSON.stringify({ iss:SA.client_email, aud:'https://oauth2.googleapis.com/token', iat, exp:iat + 3600,
    scope:'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase.messaging' }));
  const sig = crypto.createSign('RSA-SHA256').update(head + '.' + claim).sign(SA.private_key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method:'POST', headers:{ 'content-type':'application/x-www-form-urlencoded' },
    body:new URLSearchParams({ grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion:`${head}.${claim}.${sig}` }) });
  const j = await r.json(); if (!j.access_token) throw new Error('Không đăng nhập được Google: ' + JSON.stringify(j));
  return j.access_token;
}
let TOKEN = '';
const api = (url, opt = {}) => fetch(url, { ...opt, headers:{ authorization:'Bearer ' + TOKEN, 'content-type':'application/json', ...(opt.headers || {}) } });

/* ---------- Firestore REST ---------- */
const DOCS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
function decode(v){
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return +v.integerValue;
  if ('doubleValue' in v) return v.doubleValue;
  if ('timestampValue' in v) return Date.parse(v.timestampValue);
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decode);
  if ('mapValue' in v) return decodeFields(v.mapValue.fields);
  return null;
}
const decodeFields = f => Object.fromEntries(Object.entries(f || {}).map(([k, v]) => [k, decode(v)]));
function encode(x){
  if (x === null || x === undefined) return { nullValue:null };
  if (typeof x === 'boolean') return { booleanValue:x };
  if (typeof x === 'number') return Number.isInteger(x) ? { integerValue:String(x) } : { doubleValue:x };
  if (typeof x === 'string') return { stringValue:x };
  if (Array.isArray(x)) return { arrayValue:{ values:x.map(encode) } };
  return { mapValue:{ fields:Object.fromEntries(Object.entries(x).map(([k, v]) => [k, encode(v)])) } };
}
async function getDoc(path){
  const r = await api(`${DOCS}/${path}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Đọc ${path}: ${r.status} ${await r.text()}`);
  return decodeFields((await r.json()).fields);
}
async function setDoc(path, data){
  if (DRY) return console.log('[thử] ghi', path, JSON.stringify(data));
  const r = await api(`${DOCS}/${path}`, { method:'PATCH', body:JSON.stringify({ fields:encode(data).mapValue.fields }) });
  if (!r.ok) throw new Error(`Ghi ${path}: ${r.status} ${await r.text()}`);
}
async function listTokens(){
  const out = []; let page = '';
  do {
    const r = await api(`${DOCS}/push_tokens?pageSize=300&mask.fieldPaths=token&mask.fieldPaths=lang&mask.fieldPaths=tz${page ? '&pageToken=' + encodeURIComponent(page) : ''}`);
    if (!r.ok) throw new Error(`Đọc push_tokens: ${r.status} ${await r.text()}`);
    const j = await r.json();
    (j.documents || []).forEach(d => out.push({ id:d.name.split('/').pop(), ...decodeFields(d.fields) }));
    page = j.nextPageToken || '';
  } while (page);
  return out;
}

/* ---------- lịch live (cùng cách tính với core.js: weekKeyFor, normDay, parseTime) ---------- */
function isoWeek(y, m, d){                           // số tuần ISO của một ngày (giống luxon weekNumber)
  const t = new Date(Date.UTC(y, m - 1, d)), day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  return Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
}
function mondayVN(ms){                               // thứ Hai 00:00 (giờ VN) của tuần chứa thời điểm ms
  const v = new Date(ms + VN_OFF), wd = v.getUTCDay() || 7;
  return new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate() - (wd - 1)));
}
const weekKey = mon => `${mon.getUTCFullYear()}-W${isoWeek(mon.getUTCFullYear(), mon.getUTCMonth() + 1, mon.getUTCDate())}`;   // web dùng năm của ngày thứ Hai, không phải năm ISO
function daySlots(d){
  d = d || {};
  if (Array.isArray(d.slots)) return { cancelled:!!d.cancelled, slots:d.slots.map(s => ({ time:(s && s.time) || '', title:(s && s.title) || '', cancelled:!!(s && s.cancelled) })) };
  return { cancelled:false, slots:['m', 'a', 'e'].filter(k => d[k]).map(k => ({ time:d[k], title:'', cancelled:false })) };   // định dạng cũ {m,a,e}
}
async function sessions(){
  const mons = new Map();
  [NOW - LATE * 60e3, NOW, NOW + LEAD * 60e3].forEach(ms => { const m = mondayVN(ms); mons.set(m.getTime(), m); });
  const out = [];
  for (const mon of mons.values()) {
    const doc = await getDoc('weekly_schedules/' + encodeURIComponent(weekKey(mon)));
    (doc && doc.days || []).forEach((raw, i) => {
      const day = daySlots(raw);
      day.slots.forEach(s => {
        const p = String(s.time).trim().split(':'), h = parseInt(p[0], 10), mi = parseInt(p[1], 10);
        if (p.length < 2 || isNaN(h) || isNaN(mi) || day.cancelled || s.cancelled) return;
        out.push({ start:mon.getTime() + i * 864e5 + (h * 60 + mi) * 60e3 - VN_OFF, title:s.title });
      });
    });
  }
  return out;
}

/* ---------- chữ của thông báo (theo ngôn ngữ khách chọn trên web) ---------- */
const TXT = {
  en:{ live:'🔴 Live now', live_b:'{t} · Come study together!', soon:'⏰ Live at {s}', soon_b:'{t} is about to start. Get your desk ready!', name:'Study With Me' },
  vi:{ live:'🔴 Đang live', live_b:'{t} · Vào học cùng nhau nhé!', soon:'⏰ Live lúc {s}', soon_b:'{t} sắp bắt đầu, chuẩn bị bàn học nhé!', name:'Study With Me' },
  hi:{ live:'🔴 अभी लाइव', live_b:'{t} · आइए साथ पढ़ें!', soon:'⏰ {s} बजे लाइव', soon_b:'{t} शुरू होने वाला है। अपनी डेस्क तैयार करें!', name:'Study With Me' },
  ja:{ live:'🔴 ライブ中', live_b:'{t} · 一緒に勉強しよう！', soon:'⏰ {s} からライブ', soon_b:'{t} がもうすぐ始まります。机の準備をしよう！', name:'Study With Me' },
  ko:{ live:'🔴 지금 라이브', live_b:'{t} · 함께 공부해요!', soon:'⏰ {s} 라이브', soon_b:'{t} 곧 시작해요. 책상을 준비하세요!', name:'Study With Me' },
  zh:{ live:'🔴 正在直播', live_b:'{t} · 一起来学习吧！', soon:'⏰ {s} 开播', soon_b:'{t} 即将开始，准备好书桌吧！', name:'Study With Me' },
  fr:{ live:'🔴 En direct', live_b:'{t} · Venez étudier ensemble !', soon:'⏰ Live à {s}', soon_b:'{t} commence bientôt. Préparez votre bureau !', name:'Study With Me' },
  es:{ live:'🔴 En directo', live_b:'{t} · ¡Ven a estudiar con nosotros!', soon:'⏰ Directo a las {s}', soon_b:'{t} está por empezar. ¡Prepara tu escritorio!', name:'Study With Me' }
};
const fill = (s, v) => Object.keys(v).reduce((a, k) => a.split('{' + k + '}').join(v[k]), s);
function hhmm(ms, tz){
  try { return new Intl.DateTimeFormat('en-GB', { timeZone:tz || 'Asia/Ho_Chi_Minh', hour:'2-digit', minute:'2-digit', hour12:false }).format(ms); }
  catch (e) { return new Intl.DateTimeFormat('en-GB', { timeZone:'Asia/Ho_Chi_Minh', hour:'2-digit', minute:'2-digit', hour12:false }).format(ms); }
}
// job: { start, title } theo lịch, hoặc { custom:'chữ admin nhập' } khi gửi ngay
function textFor(job, tok){
  const T = TXT[tok.lang] || TXT.en, name = job.title || T.name;
  if (job.custom) return { title:T.live, body:job.custom };
  if (!job.start || NOW >= job.start) return { title:T.live, body:fill(T.live_b, { t:name }) };
  return { title:fill(T.soon, { s:hhmm(job.start, tok.tz) }), body:fill(T.soon_b, { t:name }) };
}

/* ---------- gửi qua FCM HTTP v1 ---------- */
async function sendAll(job, tokens){
  let ok = 0, fail = 0; const dead = [];
  const one = async tok => {
    const { title, body } = textFor(job, tok);
    // Chỉ gửi "data": service worker (sw.js) tự hiện thông báo, nên mọi trình duyệt hiện giống nhau
    const message = { token:tok.token, data:{ title, body, tag:'live-now' }, webpush:{ headers:{ Urgency:'high', TTL:String(LATE * 60) } } };
    if (DRY) { ok++; return console.log('[thử] gửi', tok.id.slice(0, 8), tok.lang, title, '|', body); }
    const r = await api(`https://fcm.googleapis.com/v1/projects/${PROJECT}/messages:send`, { method:'POST', body:JSON.stringify({ message }) });
    if (r.ok) { ok++; return; }
    fail++; const err = await r.text();
    if (r.status === 404 || (r.status === 400 && /INVALID_ARGUMENT|registration token/i.test(err)) || (r.status === 403 && /SENDER_ID_MISMATCH/.test(err))) dead.push(tok.id);   // token hết hạn / máy đã tắt thông báo
    else console.warn('FCM', r.status, err.slice(0, 300));
  };
  for (let i = 0; i < tokens.length; i += 20) await Promise.all(tokens.slice(i, i + 20).map(one));
  for (const id of dead) { if (!DRY) await api(`${DOCS}/push_tokens/${id}`, { method:'DELETE' }).catch(() => {}); }
  return { ok, fail, removed:dead.length };
}

/* ---------- chạy ---------- */
TOKEN = await accessToken();
const state = (await getDoc('push_admin/state')) || {};
const sent = state.sent || {}, nowDone0 = state.nowDone || 0;
let nowDone = nowDone0;
const jobs = [];
if (MODE === 'now') jobs.push({ custom:(env.PUSH_TITLE || '').trim(), label:'chạy tay từ GitHub' });
const req = await getDoc('push_admin/now');           // admin bấm "Gửi thông báo live ngay"
if (req && req.at > nowDone) {
  nowDone = req.at;
  if (NOW - req.at < 2 * 3600e3) jobs.push({ custom:String(req.text || '').trim().slice(0, 200), label:'nút trong Admin' });
}
if (MODE === 'auto') {
  for (const s of await sessions()) {
    if (sent[s.start] || NOW < s.start - LEAD * 60e3 || NOW >= s.start + LATE * 60e3) continue;
    sent[s.start] = NOW; jobs.push({ ...s, label:'theo lịch ' + hhmm(s.start) });
  }
}
if (!jobs.length && nowDone === nowDone0) { console.log('Không có buổi live nào cần báo lúc này.'); process.exit(0); }
Object.keys(sent).forEach(k => { if (NOW - sent[k] > 3 * 864e5) delete sent[k]; });
// Lưu "đã gửi" TRƯỚC khi gửi: lần chạy có bị dừng giữa chừng thì lần sau cũng không gửi lặp
await setDoc('push_admin/state', { sent, nowDone });
if (!jobs.length) process.exit(0);
const job = jobs.find(j => 'custom' in j) || jobs.sort((a, b) => b.start - a.start)[0];   // nhiều việc cùng lúc (hiếm): chỉ gửi 1 thông báo cho đỡ phiền
const tokens = await listTokens();
console.log(`Gửi (${job.label}) tới ${tokens.length} máy…`);
const res = await sendAll(job, tokens);
console.log(`Xong: ${res.ok} thành công, ${res.fail} lỗi, đã xoá ${res.removed} token hết hạn.`);
await setDoc('push_admin/status', { at:NOW, label:job.label, devices:tokens.length, ok:res.ok, fail:res.fail, removed:res.removed });
