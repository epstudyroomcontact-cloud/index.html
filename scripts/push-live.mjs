/* =========================================================
   MÁY GỬI THÔNG BÁO ĐẨY KHI LIVE — chạy trên GitHub Actions (.github/workflows/push-live.yml), không cần máy chủ riêng.
   Mỗi lần chạy (khoảng 5 phút một lần):
   1. Đọc lịch live tuần này / tuần sau trong Firestore (weekly_schedules, giờ Việt Nam, giống hệt cách web tính).
   2. Lịch chỉ là giờ dự kiến: chỉ báo buổi admin ĐÃ bấm "Bắt đầu buổi live bây giờ" (settings/onair = { start, sched }),
      tính theo giờ bắt đầu thật (tới PUSH_LATE_MIN phút sau đó) và chưa gửi → gửi cho mọi token. Chưa bấm thì không báo, dù đã quá giờ lịch.
   3. Admin bấm "Gửi thông báo live ngay" (push_admin/now) → gửi ngay ở lần chạy này.
   Gửi qua Firebase Cloud Messaging HTTP v1 bằng tài khoản dịch vụ trong GitHub Secret FIREBASE_SERVICE_ACCOUNT (phần dùng chung ở fcm.mjs).
   ========================================================= */
import { env, NOW, DRY, DOCS, login, api, getDoc, setDoc, decodeFields, sendOne } from './fcm.mjs';

const MODE = env.PUSH_MODE || 'auto';                 // auto = theo lịch | now = gửi ngay (chạy tay từ GitHub)
const LEAD = +(env.PUSH_LEAD_MIN || 5), LATE = +(env.PUSH_LATE_MIN || 45);
const VN_OFF = 7 * 3600e3;                            // Việt Nam không đổi giờ mùa hè: luôn UTC+7

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
  [NOW - 13 * 3600e3, NOW - LATE * 60e3, NOW, NOW + LEAD * 60e3].forEach(ms => { const m = mondayVN(ms); mons.set(m.getTime(), m); });
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

/* ---------- gửi cho mọi máy ---------- */
async function sendAll(job, tokens){
  let ok = 0, fail = 0; const dead = [];
  const one = async tok => {
    const { title, body } = textFor(job, tok);
    const res = await sendOne(tok.token, { title, body, tag:'live-now' }, LATE * 60);
    if (res === 'ok') ok++; else { fail++; if (res === 'dead') dead.push(tok.id); }
  };
  for (let i = 0; i < tokens.length; i += 20) await Promise.all(tokens.slice(i, i + 20).map(one));
  for (const id of dead) { if (!DRY) await api(`${DOCS}/push_tokens/${id}`, { method:'DELETE' }).catch(() => {}); }
  return { ok, fail, removed:dead.length };
}

/* ---------- chạy ---------- */
await login();
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
  // giờ bắt đầu thật do admin bấm (cùng điều kiện với core.js / overlay.html: lệch lịch quá 12 tiếng là mốc cũ, bỏ qua)
  const oa = (await getDoc('settings/onair')) || {}, o = { start:+oa.start || 0, sched:+oa.sched || 0 };
  if (o.start && o.sched && Math.abs(o.start - o.sched) < 12 * 3600e3) {
    for (const s of await sessions()) {
      if (s.start !== o.sched || sent[s.start] || NOW < o.start - LEAD * 60e3 || NOW >= o.start + LATE * 60e3) continue;   // "đã gửi" vẫn khoá theo giờ lịch: bấm bắt đầu lại không gửi lặp
      sent[s.start] = NOW; jobs.push({ ...s, start:o.start, label:`bắt đầu lúc ${hhmm(o.start)} (lịch ${hhmm(s.start)})` });
    }
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
