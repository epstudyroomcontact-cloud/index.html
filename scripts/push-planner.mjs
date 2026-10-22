/* =========================================================
   MÁY GỬI NHẮC VIỆC PLANNER — chạy trên GitHub Actions cùng lúc với push-live.mjs (khoảng 5 phút một lần).
   Người dùng bấm "Nhắc tôi trước giờ làm việc" trong Planner → máy đó lưu mã nhận thông báo vào users/<uid>.plPush
   ({ on, tokens:[...], tz, lang }, xem planner.js plPushSync). Mỗi lần chạy:
   1. Tìm mọi tài khoản có plPush.on == true, đọc Planner tuần này của họ (users/<uid>/planner/<năm>-W<tuần>, theo múi giờ của họ).
   2. Việc hôm nay chưa xong, sắp bắt đầu (từ LEAD phút trước tới LATE phút sau giờ bắt đầu) mà chưa nhắc → gửi tới các máy của người đó.
   3. 20:00–21:00 còn việc hôm nay chưa xong → nhắc một lần "Hôm nay còn n việc chưa xong" (giống nhắc trong trang).
   Đã nhắc gì thì ghi vào push_admin/planner để không nhắc lặp.
   ========================================================= */
import { env, NOW, DRY, DOCS, login, api, getDoc, setDoc, decodeFields, sendOne } from './fcm.mjs';

const LEAD = +(env.PL_LEAD_MIN || 12), LATE = +(env.PL_LATE_MIN || 10);   // chạy 5 phút một lần: thường đến tay khoảng 8–12 phút trước giờ bắt đầu

/* ---------- chữ của thông báo (giống pl_rem_title / pl_rem_soon / pl_rem_eve trong planner.js, planner-i18n.js) ---------- */
const TXT = {
  en:{ title:'Planner', soon:'{t} starts at {s}', eve:'{n} tasks are still open today.' },
  vi:{ title:'Planner', soon:'{t} bắt đầu lúc {s}', eve:'Hôm nay còn {n} việc chưa xong.' },
  hi:{ title:'प्लानर', soon:'{t} {s} पर शुरू होता है', eve:'आज {n} काम अभी बाकी हैं।' },
  ja:{ title:'プランナー', soon:'{t}は{s}に始まります', eve:'今日はまだ{n}件のタスクが残っています。' },
  ko:{ title:'플래너', soon:'{t}이(가) {s}에 시작해요', eve:'오늘 아직 {n}개의 할 일이 남아 있어요.' },
  zh:{ title:'计划本', soon:'{t} 将于 {s} 开始', eve:'今天还有 {n} 个任务未完成。' },
  fr:{ title:'Planificateur', soon:'{t} commence à {s}', eve:"{n} tâches sont encore ouvertes aujourd'hui." },
  es:{ title:'Planificador', soon:'{t} empieza a las {s}', eve:'Hoy aún tienes {n} tareas abiertas.' }
};
const fill = (s, v) => Object.keys(v).reduce((a, k) => a.split('{' + k + '}').join(v[k]), s);

/* ---------- giờ địa phương của người dùng (cùng cách tính với planner.js: plKey, weekday, giờ:phút) ---------- */
function localNow(tz){
  let f;
  try { f = new Intl.DateTimeFormat('en-US', { timeZone:tz, year:'numeric', month:'numeric', day:'numeric', hour:'numeric', minute:'numeric', hourCycle:'h23' }); }
  catch (e) { f = new Intl.DateTimeFormat('en-US', { timeZone:'Asia/Ho_Chi_Minh', year:'numeric', month:'numeric', day:'numeric', hour:'numeric', minute:'numeric', hourCycle:'h23' }); }
  const p = Object.fromEntries(f.formatToParts(NOW).map(x => [x.type, +x.value || 0]));
  const t = new Date(Date.UTC(p.year, p.month - 1, p.day)), wd = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - wd);                           // thứ Năm của tuần ISO → năm và số tuần (giống luxon weekYear / weekNumber)
  const wy = t.getUTCFullYear(), wn = Math.ceil(((t - Date.UTC(wy, 0, 1)) / 864e5 + 1) / 7);
  return { key:`${wy}-W${wn}`, di:wd - 1, mins:p.hour * 60 + p.minute, day:`${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}` };
}
const hm = s => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || '').trim()); return m ? +m[1] * 60 + +m[2] : null; };

/* ---------- ai đã bật nhắc việc ---------- */
async function subscribers(){
  const r = await api(`${DOCS}:runQuery`, { method:'POST', body:JSON.stringify({ structuredQuery:{
    from:[{ collectionId:'users' }], select:{ fields:[{ fieldPath:'plPush' }] },
    where:{ fieldFilter:{ field:{ fieldPath:'plPush.on' }, op:'EQUAL', value:{ booleanValue:true } } } } }) });
  if (!r.ok) throw new Error(`Tìm người bật nhắc việc: ${r.status} ${await r.text()}`);
  return (await r.json()).filter(x => x.document).map(x => ({ uid:x.document.name.split('/').pop(), ...(decodeFields(x.document.fields).plPush || {}) }));
}
async function dropTokens(uid, tokens){                            // máy đã tắt thông báo / token hết hạn: bỏ khỏi danh sách của người đó
  if (DRY) return console.log('[thử] bỏ', tokens.length, 'token của', uid.slice(0, 6));
  const r = await api(`${DOCS.replace(/\/documents$/, '/documents:commit')}`, { method:'POST', body:JSON.stringify({ writes:[{ transform:{
    document:`${DOCS.split('/v1/')[1]}/users/${uid}`, fieldTransforms:[{ fieldPath:'plPush.tokens', removeAllFromArray:{ values:tokens.map(t => ({ stringValue:t })) } }] } }] }) });
  if (!r.ok) console.warn('Bỏ token hết hạn', uid.slice(0, 6), r.status, (await r.text()).slice(0, 200));
}

/* ---------- chạy ---------- */
await login();
const users = await subscribers();
if (!users.length) { console.log('Chưa ai bật nhắc việc Planner.'); process.exit(0); }
const state = (await getDoc('push_admin/planner')) || {};
const sent = state.sent || {};
const jobs = [];                                                   // { uid, tokens, title, body, tag }
for (const u of users) {
  const tokens = [...new Set((u.tokens || []).filter(t => typeof t === 'string' && t.length >= 20))];
  if (!tokens.length) continue;
  const L = localNow(u.tz || 'Asia/Ho_Chi_Minh'), T = TXT[u.lang] || TXT.en;
  let doc;
  try { doc = await getDoc(`users/${u.uid}/planner/${encodeURIComponent(L.key)}`); }
  catch (e) { console.warn('Đọc Planner', u.uid.slice(0, 6), e.message.slice(0, 200)); continue; }
  const today = (doc && Array.isArray(doc.tasks) ? doc.tasks : []).filter(x => x && x.day === L.di && !x.done);
  today.forEach(x => {
    const st = hm(x.start), k = `${u.uid}|${x.id}|${L.day}`;
    if (st === null || sent[k] || L.mins < st - LEAD || L.mins >= st + LATE) return;
    sent[k] = NOW;
    // cùng tag với nhắc trong trang (planner.js plRemTick): đang mở web thì 2 thông báo gộp làm 1
    jobs.push({ uid:u.uid, tokens, title:T.title, body:fill(T.soon, { t:String(x.title || '—').slice(0, 120), s:x.start }), tag:`pl-${x.id}-${L.day}` });
  });
  const ke = `${u.uid}|eve|${L.day}`;
  if (today.length && L.mins >= 1200 && L.mins < 1260 && !sent[ke]) { sent[ke] = NOW; jobs.push({ uid:u.uid, tokens, title:T.title, body:fill(T.eve, { n:today.length }), tag:`pl-eve-${L.day}` }); }
}
if (!jobs.length) { console.log(`${users.length} người bật nhắc việc, chưa có việc nào cần nhắc lúc này.`); process.exit(0); }
Object.keys(sent).forEach(k => { if (NOW - sent[k] > 2 * 864e5) delete sent[k]; });
// Lưu "đã nhắc" TRƯỚC khi gửi: lần chạy có bị dừng giữa chừng thì lần sau cũng không nhắc lặp
await setDoc('push_admin/planner', { sent });
let ok = 0, fail = 0; const dead = {};
for (const j of jobs) {
  await Promise.all(j.tokens.map(async tok => {
    const res = await sendOne(tok, { title:j.title, body:j.body, tag:j.tag, path:'#/planner' }, (LEAD + LATE) * 60);
    if (res === 'ok') ok++; else { fail++; if (res === 'dead') (dead[j.uid] = dead[j.uid] || new Set()).add(tok); }
  }));
}
for (const [uid, set] of Object.entries(dead)) await dropTokens(uid, [...set]);
console.log(`Nhắc việc Planner: ${jobs.length} lời nhắc, ${ok} lần gửi thành công, ${fail} lỗi, bỏ ${Object.values(dead).reduce((a, s) => a + s.size, 0)} token hết hạn.`);
