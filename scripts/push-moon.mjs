/* =========================================================
   MÁY GỬI NHẮC GIỮ CHUỖI HÀNH TRÌNH TRĂNG — chạy trên GitHub Actions cùng lúc với push-live.mjs (khoảng 5 phút một lần).
   Người dùng bật "Nhắc mình lúc 21:00 để giữ chuỗi" (bảng chuông 🔔 hoặc trang Hành trình trăng) → máy đó lưu mã nhận thông báo
   vào users/<uid>.mjPush ({ on, tokens:[...], tz, lang }, xem pages.js mjPushSync). Mỗi lần chạy:
   1. Tìm mọi tài khoản có mjPush.on == true, đọc users/<uid>.moon (các ngày đã điểm danh).
   2. Từ AT (21:00) tới trước nửa đêm theo múi giờ của họ, hôm nay chưa điểm danh → nhắc MỘT lần trong ngày (giống pages.js mjRemText):
      chuỗi còn (lần cuối là hôm qua) thì nhắc điểm danh, có trăng tích trữ thì nói thêm; chuỗi vừa đứt mà đủ trăng để vá thì nhắc vào dùng trăng.
   Đã nhắc ai thì ghi vào push_admin/moon để không nhắc lặp.
   ========================================================= */
import { env, NOW, DRY, DOCS, login, api, getDoc, setDoc, decodeFields, sendOne } from './fcm.mjs';

const AT = +(env.MJ_REM_MIN || 21 * 60), EARN = 14, TOTAL = 30;    // EARN, TOTAL giống MOON_EARN, MOON_TOTAL trong pages.js

/* ---------- chữ của thông báo (giống nav_club / mjr_keep / mjr_moon / mjr_rescue trong i18n-extra.js) ---------- */
const TXT = {
  en:{ title:'Moon Journey', keep:"You haven't checked in today. Check in before midnight to keep your {n}-day streak.", moon:'If you miss today, you can still keep it with a saved full moon (you have 🌕 × {b}).',
    rescue:'Your {n}-day streak broke, but you can keep it with 🌕 × {g}. Open Moon Journey to use them, then check in.' },
  vi:{ title:'Hành trình trăng', keep:'Hôm nay bạn chưa điểm danh. Điểm danh trước nửa đêm để giữ chuỗi {n} ngày nhé.', moon:'Lỡ quên thì vẫn giữ được chuỗi bằng một trăng tròn tích trữ (bạn đang có 🌕 × {b}).',
    rescue:'Chuỗi {n} ngày vừa đứt, nhưng bạn giữ lại được bằng 🌕 × {g}. Mở Hành trình trăng để dùng trăng rồi điểm danh nhé.' },
  hi:{ title:'चंद्रमा यात्रा', keep:'आपने आज अभी तक चेक इन नहीं किया। अपनी {n} दिन की स्ट्रीक बनाए रखने के लिए आधी रात से पहले चेक इन करें।', moon:'आज छूट भी जाए तो एक जमा पूर्णिमा से इसे बचा सकते हैं (आपके पास 🌕 × {b} हैं)।',
    rescue:'आपकी {n} दिन की स्ट्रीक टूट गई, पर 🌕 × {g} से इसे बचा सकते हैं। चंद्रमा यात्रा खोलकर पूर्णिमा इस्तेमाल करें, फिर चेक इन करें।' },
  ja:{ title:'月の旅', keep:'今日はまだチェックインしていません。{n}日の連続記録を守るため、0時までにチェックインしましょう。', moon:'もし忘れても、貯めた満月で守れます（いま 🌕 × {b}）。',
    rescue:'{n}日の連続記録が途切れましたが、🌕 × {g} で守れます。月の旅を開いて満月を使ってから、チェックインしましょう。' },
  ko:{ title:'달 여행', keep:'오늘 아직 체크인하지 않았어요. 자정 전에 체크인하고 {n}일 연속 기록을 지켜요.', moon:'혹시 놓쳐도 모아 둔 보름달로 지킬 수 있어요(지금 🌕 × {b}).',
    rescue:'{n}일 연속 기록이 끊겼지만 🌕 × {g}로 지킬 수 있어요. 달 여행을 열어 보름달을 쓴 뒤 체크인하세요.' },
  zh:{ title:'月亮之旅', keep:'你今天还没签到。午夜前签到，就能保住 {n} 天的连续记录。', moon:'就算错过了，也可以用存下的满月保住它（你现在有 🌕 × {b}）。',
    rescue:'你 {n} 天的连续记录中断了，但可以用 🌕 × {g} 保住它。打开月亮之旅使用满月，然后再签到。' },
  fr:{ title:'Voyage lunaire', keep:"Vous n'avez pas encore pointé aujourd'hui. Pointez avant minuit pour garder votre série de {n} jours.", moon:'Si vous oubliez, vous pourrez encore la garder avec une pleine lune en réserve (vous avez 🌕 × {b}).',
    rescue:'Votre série de {n} jours est interrompue, mais vous pouvez la garder avec 🌕 × {g}. Ouvrez le Voyage lunaire pour les utiliser, puis pointez.' },
  es:{ title:'Viaje a la luna', keep:'Hoy aún no te has registrado. Regístrate antes de medianoche para mantener tu racha de {n} días.', moon:'Si se te pasa, aún puedes mantenerla con una luna llena guardada (tienes 🌕 × {b}).',
    rescue:'Tu racha de {n} días se rompió, pero puedes mantenerla con 🌕 × {g}. Abre el Viaje a la luna para usarlas y luego regístrate.' }
};
const fill = (s, v) => Object.keys(v).reduce((a, k) => a.split('{' + k + '}').join(v[k]), s);

/* ---------- ngày giờ địa phương của người dùng ---------- */
function localNow(tz){
  const opt = { year:'numeric', month:'numeric', day:'numeric', hour:'numeric', minute:'numeric', hourCycle:'h23' };
  let f; try { f = new Intl.DateTimeFormat('en-US', { timeZone:tz, ...opt }); } catch (e) { f = new Intl.DateTimeFormat('en-US', { timeZone:'Asia/Ho_Chi_Minh', ...opt }); }
  const p = Object.fromEntries(f.formatToParts(NOW).map(x => [x.type, +x.value || 0]));
  return { mins:p.hour * 60 + p.minute, day:`${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}` };
}
const shift = (k, n) => { const d = new Date(k + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

/* ---------- chuỗi điểm danh: cùng cách tính với pages.js moonData ---------- */
function streak(m, today){
  const all = [...new Set(Array.isArray(m.days) ? m.days : [])].filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort();
  if (!all.length) return null;
  let i = all.length - 1; while (i > 0 && shift(all[i - 1], 1) === all[i]) i--;
  const run = all.slice(i), last = run[run.length - 1];
  if (last >= today) return null;                                  // hôm nay đã điểm danh
  const best = Math.max(+m.best || 0, run.length), saved = Array.isArray(m.saved) ? m.saved : [];
  const moons = Math.max(+m.moons || 0, (+m.rounds || 0) + (all.length >= TOTAL ? 1 : 0), Math.floor(best / EARN)), balance = Math.max(0, moons - saved.length);
  if (last === shift(today, -1)) return { n:run.length, balance };
  let gap = 0; for (let k = shift(last, 1); k < today && gap <= 31; k = shift(k, 1)) gap++;     // các ngày đã lỡ, tính tới hôm qua
  return gap && gap <= balance ? { n:run.length, balance, rescue:gap } : null;
}

/* ---------- ai đã bật nhắc giữ chuỗi ---------- */
async function subscribers(){
  const r = await api(`${DOCS}:runQuery`, { method:'POST', body:JSON.stringify({ structuredQuery:{
    from:[{ collectionId:'users' }], select:{ fields:[{ fieldPath:'mjPush' }, { fieldPath:'moon' }] },
    where:{ fieldFilter:{ field:{ fieldPath:'mjPush.on' }, op:'EQUAL', value:{ booleanValue:true } } } } }) });
  if (!r.ok) throw new Error(`Tìm người bật nhắc giữ chuỗi: ${r.status} ${await r.text()}`);
  return (await r.json()).filter(x => x.document).map(x => { const f = decodeFields(x.document.fields); return { uid:x.document.name.split('/').pop(), ...(f.mjPush || {}), moon:f.moon }; });
}
async function dropTokens(uid, tokens){                            // máy đã tắt thông báo / token hết hạn: bỏ khỏi danh sách của người đó
  if (DRY) return console.log('[thử] bỏ', tokens.length, 'token của', uid.slice(0, 6));
  const r = await api(`${DOCS.replace(/\/documents$/, '/documents:commit')}`, { method:'POST', body:JSON.stringify({ writes:[{ transform:{
    document:`${DOCS.split('/v1/')[1]}/users/${uid}`, fieldTransforms:[{ fieldPath:'mjPush.tokens', removeAllFromArray:{ values:tokens.map(t => ({ stringValue:t })) } }] } }] }) });
  if (!r.ok) console.warn('Bỏ token hết hạn', uid.slice(0, 6), r.status, (await r.text()).slice(0, 200));
}

/* ---------- chạy ---------- */
await login();
const users = await subscribers();
if (!users.length) { console.log('Chưa ai bật nhắc giữ chuỗi Hành trình trăng.'); process.exit(0); }
const sent = ((await getDoc('push_admin/moon')) || {}).sent || {};
const jobs = [];
for (const u of users) {
  const tokens = [...new Set((u.tokens || []).filter(t => typeof t === 'string' && t.length >= 20))];
  const L = localNow(u.tz || 'Asia/Ho_Chi_Minh'), k = `${u.uid}|${L.day}`;
  if (!tokens.length || !u.moon || L.mins < AT || sent[k]) continue;
  const s = streak(u.moon, L.day); if (!s) continue;
  const T = TXT[u.lang] || TXT.en;
  const body = s.rescue ? fill(T.rescue, { n:s.n, g:s.rescue }) : fill(T.keep, { n:s.n }) + (s.balance ? ' ' + fill(T.moon, { b:s.balance }) : '');
  sent[k] = NOW;
  // cùng tag với nhắc trong trang (pages.js mjRemTick): đang mở web thì 2 thông báo gộp làm 1
  jobs.push({ uid:u.uid, tokens, title:T.title, body, tag:`mj-${L.day}`, ttl:Math.max(600, (1440 - L.mins) * 60) });
}
console.log(`${users.length} người bật nhắc giữ chuỗi, ${jobs.length} người cần nhắc lúc này.`);
if (!jobs.length) process.exit(0);
Object.keys(sent).forEach(k => { if (NOW - sent[k] > 2 * 864e5) delete sent[k]; });
// Lưu "đã nhắc" TRƯỚC khi gửi: lần chạy có bị dừng giữa chừng thì lần sau cũng không nhắc lặp
await setDoc('push_admin/moon', { sent });
let ok = 0, fail = 0; const dead = {};
for (const j of jobs) {
  await Promise.all(j.tokens.map(async tok => {
    const res = await sendOne(tok, { title:j.title, body:j.body, tag:j.tag, path:'#/club' }, j.ttl);   // hết ngày thì thôi, không giao trễ sang hôm sau
    if (res === 'ok') ok++; else { fail++; if (res === 'dead') (dead[j.uid] = dead[j.uid] || new Set()).add(tok); }
  }));
}
for (const [uid, set] of Object.entries(dead)) await dropTokens(uid, [...set]);
console.log(`Nhắc giữ chuỗi: ${jobs.length} lời nhắc, ${ok} lần gửi thành công, ${fail} lỗi, bỏ ${Object.values(dead).reduce((a, s) => a + s.size, 0)} token hết hạn.`);
