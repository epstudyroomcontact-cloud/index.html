'use strict';
/* =========================================================
   PLANNER — lịch tuần riêng tư cho Companions (tải theo nhu cầu khi mở #/planner)
   Dữ liệu: users/<uid>/planner/<năm>-W<tuần> = { tasks:[{ id, title, day:0-6|null, start:'HH:MM'|'', dur:phút, c:0-5, done, carried? }], updatedAt }
   Quy tắc Firestore: chỉ chính chủ đọc/ghi và chỉ khi có companions/<uid> (xem firestore.rules). Admin không đọc được planner của người khác.
   ========================================================= */
Object.assign(I18N.en, {
  pl_title:'My weekly planner', pl_sub:'Your own private planner: plan your week, tick things off, and see how productive the week really was. Only your account can open it on this website.',
  pl_up_title:'The Planner is for companions', pl_up_text:'Companions get a private weekly planner: a time grid for your week, a to-do list for things without a time, and an automatic review of how much you finished. Support the channel monthly and I will unlock it for your account.',
  pl_up_login:'Sign in to use the Planner.', pl_up_cta:'See how to become a companion',
  pl_d0:'Mon', pl_d1:'Tue', pl_d2:'Wed', pl_d3:'Thu', pl_d4:'Fri', pl_d5:'Sat', pl_d6:'Sun',
  pl_c0:'Study', pl_c1:'Work', pl_c2:'Health', pl_c3:'Personal', pl_c4:'Fun', pl_c5:'Other',
  pl_this:'This week', pl_add:'Add task', pl_edit:'Edit task', pl_new:'New task', pl_saving:'Saving…', pl_saved:'Saved', pl_err:'Could not save. Check your connection and try again.', pl_loading:'Loading your week…', pl_slow:'Still loading. Your connection to the database is slow right now. You can wait a little longer or try again.', pl_load_err:'Could not load your planner. Reload the page to try again.',
  pl_f_title:'What do you want to do?', pl_f_day:'Day', pl_f_days:'Days', pl_f_noday:'No specific day', pl_f_start:'Start time (optional)', pl_f_dur:'Minutes', pl_f_cat:'Category', pl_f_done:'Done', pl_save:'Save', pl_delete:'Delete',
  pl_allday:'No time', pl_week_list:'To do this week (no day)', pl_empty_list:'Nothing here. Tasks without a day show up in this list.', pl_hint:'Tap an empty spot in a day to add a task there. Tap a task to edit it, tap the circle to tick it off.',
  pl_review:'This week in numbers', pl_done_tasks:'Tasks done', pl_done_min:'Time done', pl_plan_min:'Time planned', pl_by_day:'By day', pl_by_cat:'By category', pl_left:'Still to do', pl_left_none:'Everything is ticked off. Nice.', pl_carry:'Move the unfinished tasks to next week', pl_carried:'Moved to next week', pl_carried_n:'{n} tasks moved to next week.',
  pl_insights:'What this says about your week', pl_i_none:'Add a few tasks and tick them off to get your weekly review.',
  pl_i_rate_hi:'You finished {p}% of your tasks. That is a strong week.', pl_i_rate_mid:'You finished {p}% of your tasks. A solid base to build on.', pl_i_rate_lo:'You finished {p}% of your tasks. Maybe the plan was a bit big: try fewer tasks per day next week.',
  pl_i_best:'Your most productive day was {d}, with {t} done.', pl_i_part_0:'You get the most done in the morning.', pl_i_part_1:'You get the most done in the afternoon.', pl_i_part_2:'You get the most done in the evening.',
  pl_i_over:'{d} was planned for {t}. That is a lot; leave some room to rest.', pl_i_left:'{n} tasks (about {t}) are still open. You can move them to next week with one tap.',
  pl_i_vs_up:'That is {n} points better than last week ({p}%).', pl_i_vs_down:'That is {n} points lower than last week ({p}%).', pl_i_vs_same:'About the same as last week ({p}%).',
  pl_min:'{m} min', pl_h:'{h} h', pl_hm:'{h} h {m} min', pl_untimed:'(no time set)', pl_until:'You are a companion until {d}.', pl_max:'A week can hold up to {n} tasks.', pl_soon:'Your companion access ends on {d}. Renew to keep using the planner.'
});
Object.assign(I18N.vi, {
  pl_title:'Planner riêng của bạn', pl_sub:'Planner riêng của chính bạn: lên kế hoạch cho tuần, tick những việc đã xong và xem tuần này bạn thật sự làm được bao nhiêu. Chỉ tài khoản của bạn mở được trên trang web này.',
  pl_up_title:'Planner dành cho Companions', pl_up_text:'Companions có một planner tuần riêng tư: lưới giờ cho cả tuần, danh sách việc chưa có giờ và bản tổng kết tự động bạn đã làm xong bao nhiêu. Ủng hộ kênh hằng tháng là mình mở nó cho tài khoản của bạn.',
  pl_up_login:'Hãy đăng nhập để dùng Planner.', pl_up_cta:'Xem cách trở thành Companion',
  pl_d0:'T2', pl_d1:'T3', pl_d2:'T4', pl_d3:'T5', pl_d4:'T6', pl_d5:'T7', pl_d6:'CN',
  pl_c0:'Học tập', pl_c1:'Công việc', pl_c2:'Sức khoẻ', pl_c3:'Cá nhân', pl_c4:'Giải trí', pl_c5:'Khác',
  pl_this:'Tuần này', pl_add:'Thêm việc', pl_edit:'Sửa việc', pl_new:'Việc mới', pl_saving:'Đang lưu…', pl_saved:'Đã lưu', pl_err:'Chưa lưu được. Bạn kiểm tra mạng rồi thử lại nhé.', pl_loading:'Đang tải tuần của bạn…', pl_slow:'Vẫn đang tải. Kết nối tới cơ sở dữ liệu của bạn đang chậm. Bạn có thể chờ thêm hoặc bấm thử lại.', pl_load_err:'Chưa tải được planner. Bạn tải lại trang để thử lại nhé.',
  pl_f_title:'Bạn muốn làm gì?', pl_f_day:'Ngày', pl_f_days:'Các ngày', pl_f_noday:'Không gắn ngày', pl_f_start:'Giờ bắt đầu (không bắt buộc)', pl_f_dur:'Số phút', pl_f_cat:'Nhóm', pl_f_done:'Đã xong', pl_save:'Lưu', pl_delete:'Xoá',
  pl_allday:'Chưa có giờ', pl_week_list:'Việc cả tuần (chưa gắn ngày)', pl_empty_list:'Chưa có gì. Việc không gắn ngày sẽ hiện ở danh sách này.', pl_hint:'Bấm vào chỗ trống trong một ngày để thêm việc ở đó. Bấm vào việc để sửa, bấm vào vòng tròn để tick xong.',
  pl_review:'Tuần này qua các con số', pl_done_tasks:'Việc đã xong', pl_done_min:'Thời gian đã làm', pl_plan_min:'Thời gian dự định', pl_by_day:'Theo ngày', pl_by_cat:'Theo nhóm', pl_left:'Việc còn lại', pl_left_none:'Tất cả đã được tick xong. Giỏi quá.', pl_carry:'Chuyển các việc chưa xong sang tuần sau', pl_carried:'Đã chuyển sang tuần sau', pl_carried_n:'Đã chuyển {n} việc sang tuần sau.',
  pl_insights:'Tuần này nói gì về bạn', pl_i_none:'Hãy thêm vài việc và tick xong để nhận bản tổng kết tuần.',
  pl_i_rate_hi:'Bạn hoàn thành {p}% số việc. Đây là một tuần rất tốt.', pl_i_rate_mid:'Bạn hoàn thành {p}% số việc. Một nền tảng vững để làm tiếp.', pl_i_rate_lo:'Bạn hoàn thành {p}% số việc. Có thể kế hoạch hơi nhiều: tuần sau thử xếp ít việc mỗi ngày hơn.',
  pl_i_best:'Ngày làm được nhiều nhất là {d}, xong {t}.', pl_i_part_0:'Bạn làm xong nhiều việc nhất vào buổi sáng.', pl_i_part_1:'Bạn làm xong nhiều việc nhất vào buổi chiều.', pl_i_part_2:'Bạn làm xong nhiều việc nhất vào buổi tối.',
  pl_i_over:'{d} xếp tới {t}. Hơi nhiều, nhớ chừa chỗ để nghỉ.', pl_i_left:'Còn {n} việc (khoảng {t}) chưa xong. Bạn chuyển sang tuần sau chỉ với một cú bấm.',
  pl_i_vs_up:'Cao hơn tuần trước {n} điểm ({p}%).', pl_i_vs_down:'Thấp hơn tuần trước {n} điểm ({p}%).', pl_i_vs_same:'Gần bằng tuần trước ({p}%).',
  pl_min:'{m} phút', pl_h:'{h} giờ', pl_hm:'{h} giờ {m} phút', pl_untimed:'(chưa đặt giờ)', pl_until:'Bạn là Companion đến ngày {d}.', pl_max:'Mỗi tuần chứa tối đa {n} việc.', pl_soon:'Quyền Companion của bạn hết hạn ngày {d}. Gia hạn để tiếp tục dùng planner.'
});

const PL_MAX = 300;                                              // số việc tối đa mỗi tuần (giữ tài liệu nhỏ, tránh lỗi quá cỡ)
const PL_HOUR = 48;                                              // px cho mỗi giờ trong lưới
const PL_COLORS = ['#f2b8c6', '#c9b8ec', '#f6c9a0', '#f4e08c', '#a9dcc6', '#a8cdee'];   // 6 nhóm: màu pastel, chữ tối cho mọi giao diện
const PL = { off:0, key:'', tasks:null, state:'idle', save:'', prev:null, timer:0, sel:null, seq:0, slow:false };
const plWeekStart = off => DT.now().setZone(userTZ).plus({ weeks:off }).startOf('week');
const plKey = off => { const d = plWeekStart(off); return `${d.weekYear}-W${d.weekNumber}`; };
const plDaysLeft = () => Math.ceil(DT.fromISO(state.companionUntil, { zone:userTZ }).endOf('day').diff(DT.now().setZone(userTZ), 'days').days);
const plAccess = () => DEMO || state.companion || state.isAdmin;
const plRef = key => db.collection('users').doc(state.user.uid).collection('planner').doc(key);
const plId = () => Math.random().toString(36).slice(2, 9);
const hm = v => { const p = String(v || '').split(':'); return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0); };
const hmStr = m => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
const fmtMin = m => { m = Math.round(m); const h = Math.floor(m / 60), r = m % 60; return h ? (r ? t('pl_hm', { h, m:r }) : t('pl_h', { h })) : t('pl_min', { m }); };
function plClean(x){                                              // chuẩn hoá một việc trước khi lưu / hiện
  const start = /^\d{1,2}:\d{2}$/.test(x.start || '') ? hmStr(Math.min(1439, hm(x.start))) : '';
  let dur = Math.max(0, Math.min(1440, Math.round(+x.dur || 0))); if (start && !dur) dur = 30; if (start) dur = Math.min(dur, 1440 - hm(start));
  const day = Number.isInteger(x.day) && x.day >= 0 && x.day <= 6 ? x.day : null;
  return { id:String(x.id || plId()), title:String(x.title || '').trim().slice(0, 80), day, start:day === null ? '' : start, dur, c:Math.max(0, Math.min(5, x.c | 0)), done:!!x.done, ...(x.carried ? { carried:true } : {}) };
}
/* ---------- tải / lưu ---------- */
/* Đọc nhanh: lần mở sau hiện ngay bản nhớ trong máy (xoá khi đăng xuất / đổi tài khoản, xem core.js), rồi cập nhật từ máy chủ ở nền */
async function plFetch(key){                                      // 'unavailable' = kết nối Firebase chưa kịp lên: thử lại vài lần trước khi báo lỗi
  for (let i = 0; ; i++) {
    try { const d = await plRef(key).get(); return d.exists && Array.isArray(d.data().tasks) ? d.data().tasks : []; }
    catch (e) { if (e.code !== 'unavailable' || i >= 2) throw e; await new Promise(r => setTimeout(r, 1500 * (i + 1))); }
  }
}
const plCK = key => 'plw_' + state.user.uid + '_' + key;
const plCache = (key, tasks) => { if (!DEMO && state.user) store.set(plCK(key), { tasks }); };
function plPrefetch(){                                            // gọi sớm lúc đăng nhập: lấy sẵn tuần này để mở Planner là có ngay
  if (DEMO || !state.user || !plAccess() || (PL.pre && PL.pre.uid === state.user.uid && Date.now() - PL.pre.at < 60000)) return;
  const key = plKey(0), pre = PL.pre = { uid:state.user.uid, key, at:Date.now(), p:plFetch(key) };
  pre.p.then(tasks => plCache(key, tasks)).catch(() => { if (PL.pre === pre) PL.pre = null; });
}
async function plLoad(){
  const key = plKey(PL.off); if ((PL.key === key && PL.tasks) || PL.state === 'loading' || PL.state === 'error') return;
  const seq = ++PL.seq, t0 = Date.now(); PL.state = 'loading'; PL.key = key; PL.tasks = null; PL.prev = null; PL.slow = false; PL.save = '';
  const hit = DEMO ? null : store.get(plCK(key), null);
  if (hit && Array.isArray(hit.tasks)) { PL.tasks = hit.tasks.map(plClean); PL.state = 'ready'; }      // có bản nhớ: hiện ngay, không bắt chờ mạng
  else setTimeout(() => { if (PL.seq === seq && PL.state === 'loading') { PL.slow = true; render(true); } }, 8000);   // quá 8 giây: báo mạng chậm và cho bấm thử lại
  try {
    let tasks = [];
    const pre = PL.pre; PL.pre = null;                             // bản lấy sẵn chỉ dùng một lần và chỉ khi còn mới
    if (!DEMO) tasks = await (pre && pre.uid === state.user.uid && pre.key === key && Date.now() - pre.at < 60000 ? pre.p : plFetch(key));
    if (PL.seq !== seq) return;                                   // đã đổi tuần / bấm thử lại trong lúc tải
    console.info('planner load', Date.now() - t0, 'ms', hit ? '(có bản nhớ)' : '');
    if (!PL.save) { PL.tasks = tasks.map(plClean); plCache(key, tasks); }      // bạn đã sửa trong lúc chờ thì giữ bản của bạn
    PL.state = 'ready'; PL.slow = false;
    if (!DEMO) plRef(plKey(PL.off - 1)).get().then(d => { if (PL.key === key && d.exists) { PL.prev = plStats((d.data().tasks || []).map(plClean)); render(true); } }).catch(() => {});
  } catch (e) {
    if (PL.seq !== seq) return; console.warn('planner load', e.code, Date.now() - t0, 'ms');
    if (!PL.tasks) { PL.state = 'error'; PL.key = ''; PL.err = e.code || ''; }     // có bản nhớ thì cứ để người dùng xem tiếp
  }
  render(true);
}
function plFlush(){                                                // lưu ngay việc đang chờ lưu (trước khi đổi tuần), để không mất thay đổi
  if (PL.save !== 'saving' || !PL.tasks) return;
  clearTimeout(PL.timer); const key = PL.key, tasks = PL.tasks.map(plClean); plCache(key, tasks);
  if (!DEMO) plRef(key).set({ tasks, updatedAt:TS() }).catch(e => { console.warn('planner save', e.code); toast(t('pl_err')); });
  PL.save = '';
}
function plSave(){
  PL.save = 'saving'; clearTimeout(PL.timer);
  PL.timer = setTimeout(async () => {
    if (!PL.tasks) return; const key = PL.key, tasks = PL.tasks.map(plClean); plCache(key, tasks);
    try { if (!DEMO) await plRef(key).set({ tasks, updatedAt:TS() }); if (PL.key === key) PL.save = 'saved'; }
    catch (e) { console.warn('planner save', e.code); PL.save = 'error'; toast(t('pl_err')); }
    const n = $('pl-status'); if (n) n.textContent = PL.save === 'saved' ? '✓ ' + t('pl_saved') : PL.save === 'error' ? t('pl_err') : t('pl_saving');
  }, 500);
  const n = $('pl-status'); if (n) n.textContent = t('pl_saving');
}
/* ---------- thống kê & nhận xét ---------- */
function plStats(tasks){
  const S = { n:tasks.length, nd:tasks.filter(x => x.done).length, plan:0, done:0, day:Array.from({ length:7 }, () => ({ plan:0, done:0 })), cat:Array.from({ length:6 }, () => ({ plan:0, done:0, n:0, nd:0 })), part:[0, 0, 0] };
  tasks.forEach(x => {
    S.plan += x.dur; if (x.done) S.done += x.dur;
    const c = S.cat[x.c]; c.n++; c.plan += x.dur; if (x.done) { c.nd++; c.done += x.dur; }
    if (x.day !== null) { S.day[x.day].plan += x.dur; if (x.done) S.day[x.day].done += x.dur; }
    if (x.done && x.start) S.part[hm(x.start) < 720 ? 0 : hm(x.start) < 1080 ? 1 : 2] += x.dur || 1;
  });
  S.rate = S.n ? Math.round(S.nd / S.n * 100) : 0;
  return S;
}
function plInsights(S){
  if (!S.n) return [t('pl_i_none')];
  const out = [t(S.rate >= 80 ? 'pl_i_rate_hi' : S.rate >= 50 ? 'pl_i_rate_mid' : 'pl_i_rate_lo', { p:S.rate })];
  if (PL.prev && PL.prev.n) { const dlt = S.rate - PL.prev.rate; out.push(t(dlt > 3 ? 'pl_i_vs_up' : dlt < -3 ? 'pl_i_vs_down' : 'pl_i_vs_same', { n:Math.abs(dlt), p:PL.prev.rate })); }
  const bi = S.day.reduce((b, d, i) => d.done > S.day[b].done ? i : b, 0); if (S.day[bi].done > 0) out.push(t('pl_i_best', { d:t('pl_d' + bi), t:fmtMin(S.day[bi].done) }));
  const pm = Math.max(...S.part); if (pm > 0) out.push(t('pl_i_part_' + S.part.indexOf(pm)));
  S.day.forEach((d, i) => { if (d.plan > 600) out.push(t('pl_i_over', { d:t('pl_d' + i), t:fmtMin(d.plan) })); });
  const left = (PL.tasks || []).filter(x => !x.done && !x.carried); if (left.length) out.push(t('pl_i_left', { n:left.length, t:fmtMin(left.reduce((a, x) => a + x.dur, 0)) }));
  return out;
}
/* ---------- giao diện ---------- */
function plUpsell(){
  const login = !state.user;
  return `${head('pl_title', '', '', 'moonwalk', 4)}<section class="card pad stack" style="max-width:640px"><div class="row"><span class="badge">${ic('heart', 'sm')} ${esc(t('comp_badge'))}</span></div>
    <h2 style="font-size:1.3rem">${esc(t('pl_up_title'))}</h2><p class="muted">${esc(login ? t('pl_up_login') : t('pl_up_text'))}</p>
    ${login ? `<a class="btn primary" href="#/account">${esc(t('club_login_btn'))}</a>` : `${compClaimHTML()}<a class="btn secondary" href="#/donate">${esc(t('pl_up_cta'))}</a>`}</section>`;
}
function plGrid(){
  const tasks = PL.tasks, ws = plWeekStart(PL.off), today = DT.now().setZone(userTZ).toISODate();
  const timed = tasks.filter(x => x.day !== null && x.start);
  const g0 = Math.max(0, Math.min(6, ...timed.map(x => Math.floor(hm(x.start) / 60)))), g1 = Math.min(24, Math.max(22, ...timed.map(x => Math.ceil((hm(x.start) + x.dur) / 60))));
  const hours = Array.from({ length:g1 - g0 }, (_, i) => g0 + i);
  const block = x => {
    const top = (hm(x.start) - g0 * 60) / 60 * PL_HOUR, h = Math.max(24, x.dur / 60 * PL_HOUR - 2);
    return `<div class="pl-b ${x.done ? 'done' : ''}" style="top:${top}px;height:${h}px;background:${PL_COLORS[x.c]}" data-act="plEdit" data-id="${esc(x.id)}"><button type="button" class="pl-ck" data-act="plToggle" data-id="${esc(x.id)}" aria-label="${esc(t('pl_f_done'))}">${x.done ? ic('check', 'sm') : ''}</button><div class="pl-bt">${esc(x.title || '—')}</div>${h >= 62 ? `<div class="pl-bm">${esc(x.start)}–${esc(hmStr(hm(x.start) + x.dur))}</div>` : ''}</div>`;
  };
  const chip = x => `<div class="pl-chip ${x.done ? 'done' : ''}" style="background:${PL_COLORS[x.c]}" data-act="plEdit" data-id="${esc(x.id)}"><button type="button" class="pl-ck sm" data-act="plToggle" data-id="${esc(x.id)}">${x.done ? ic('check', 'sm') : ''}</button><span>${esc(x.title || '—')}</span></div>`;
  const cols = Array.from({ length:7 }, (_, di) => {
    const d = ws.plus({ days:di }), isToday = d.toISODate() === today;
    return { head:`<div class="pl-dh ${isToday ? 'today' : ''}"><b>${esc(t('pl_d' + di))}</b><small>${d.toFormat('dd/MM')}</small></div>`,
      strip:`<div class="pl-strip">${tasks.filter(x => x.day === di && !x.start).map(chip).join('')}</div>`,
      col:`<div class="pl-col" data-act="plNew" data-day="${di}" data-g0="${g0}" style="height:${hours.length * PL_HOUR}px">${timed.filter(x => x.day === di).map(block).join('')}</div>` };
  });
  return `<div class="pl-scroll"><div class="pl-grid"><div class="pl-corner"></div>${cols.map(c => c.head).join('')}
    <div class="pl-corner"></div>${cols.map(c => c.strip).join('')}
    <div class="pl-hours">${hours.map(h => `<div style="height:${PL_HOUR}px">${String(h).padStart(2, '0')}:00</div>`).join('')}</div>${cols.map(c => c.col).join('')}</div></div>`;
}
const plBar = (a, b, color) => `<div class="pl-bar"><i style="width:${b ? Math.min(100, a / b * 100) : 0}%;background:${color || 'var(--accent)'}"></i></div>`;
function plReview(){
  const S = plStats(PL.tasks), left = PL.tasks.filter(x => !x.done), open = left.filter(x => !x.carried);
  const row = x => `<div class="pl-li ${x.carried ? 'done' : ''}"><button type="button" class="pl-ck sm" style="border-color:${PL_COLORS[x.c]}" data-act="plToggle" data-id="${esc(x.id)}"></button><span data-act="plEdit" data-id="${esc(x.id)}">${esc(x.title || '—')}${x.day !== null ? ` <small class="faint">${esc(t('pl_d' + x.day))}${x.start ? ' ' + esc(x.start) : ''}</small>` : ''}</span>${x.carried ? `<small class="faint">${esc(t('pl_carried'))}</small>` : ''}</div>`;
  const noDay = PL.tasks.filter(x => x.day === null);
  return `<div class="stack">
    <section class="card pad"><h3 style="margin-bottom:12px">${esc(t('pl_review'))}</h3>
      <div class="pl-kpis"><div><b>${S.rate}%</b><small>${esc(t('pl_done_tasks'))} · ${S.nd}/${S.n}</small></div><div><b>${esc(fmtMin(S.done))}</b><small>${esc(t('pl_done_min'))}</small></div><div><b>${esc(fmtMin(S.plan))}</b><small>${esc(t('pl_plan_min'))}</small></div></div>
      ${plBar(S.nd, S.n)}
      <div class="label" style="margin-top:16px">${esc(t('pl_by_day'))}</div>${S.day.map((d, i) => `<div class="pl-row"><span>${esc(t('pl_d' + i))}</span><div class="pl-bar tall"><i class="lt" style="width:${Math.min(100, d.plan / Math.max(60, ...S.day.map(x => x.plan)) * 100)}%"></i><i style="width:${Math.min(100, d.done / Math.max(60, ...S.day.map(x => x.plan)) * 100)}%"></i></div><small class="faint">${esc(fmtMin(d.done))} / ${esc(fmtMin(d.plan))}</small></div>`).join('')}
      <div class="label" style="margin-top:16px">${esc(t('pl_by_cat'))}</div>${S.cat.map((c, i) => c.n ? `<div class="pl-row"><span><i class="dot" style="background:${PL_COLORS[i]}"></i> ${esc(t('pl_c' + i))}</span>${plBar(c.nd, c.n, PL_COLORS[i])}<small class="faint">${c.nd}/${c.n}</small></div>` : '').join('')}</section>
    <section class="card pad"><h3 style="margin-bottom:10px">${esc(t('pl_insights'))}</h3><ul class="pl-ins">${plInsights(S).map(s => `<li>${esc(s)}</li>`).join('')}</ul></section>
    <section class="card pad"><h3 style="margin-bottom:10px">${esc(t('pl_left'))}</h3>${left.length ? left.map(row).join('') : `<p class="muted small">${esc(t('pl_left_none'))}</p>`}${open.length ? `<button class="btn secondary mt-s" data-act="plCarry">${esc(t('pl_carry'))}</button>` : ''}</section>
    <section class="card pad"><h3 style="margin-bottom:10px">${esc(t('pl_week_list'))}</h3>${noDay.length ? noDay.map(row).join('') : `<p class="muted small">${esc(t('pl_empty_list'))}</p>`}</section></div>`;
}
PAGES.planner = function(){
  if (!state.user && !state.authReady && !DEMO) return page('<div class="gate-load"><i></i></div>');
  if (!state.user && !DEMO) return page(plUpsell());
  if (!plAccess()) { refreshCompanion().then(ch => ch && render(true)); return page(plUpsell()); }
  if (PL.uid !== state.user.uid) { clearTimeout(PL.timer); PL.seq++; Object.assign(PL, { uid:state.user.uid, off:0, key:'', tasks:null, state:'idle', save:'', prev:null, sel:null, slow:false }); }   // đổi tài khoản trên cùng trình duyệt: không để lộ planner của người trước
  if (!state.companionUntil && !state.isAdmin && !DEMO) refreshCompanion().then(ch => ch && render(true));       // lấy ngày hết hạn để hiện nhắc gia hạn
  plLoad();
  const ws = plWeekStart(PL.off), nav = `<div class="row between" style="margin-bottom:16px;flex-wrap:wrap;gap:10px"><div class="week-nav"><button class="btn secondary icon" data-act="plWeek" data-d="-1">${ic('chev-l')}</button><span class="lbl">${ws.toFormat('dd/MM')} – ${ws.plus({ days:6 }).toFormat('dd/MM/yyyy')}</span><button class="btn secondary icon" data-act="plWeek" data-d="1">${ic('chev-r')}</button>${PL.off ? `<button class="btn ghost sm" data-act="plWeek" data-d="0">${esc(t('pl_this'))}</button>` : ''}</div>
    <div class="row"><span class="small faint" id="pl-status">${PL.save === 'saved' ? '✓ ' + esc(t('pl_saved')) : PL.save === 'saving' ? esc(t('pl_saving')) : ''}</span><button class="btn primary" data-act="plNew">${ic('plus', 'sm')} ${esc(t('pl_add'))}</button></div></div>`;
  let body;
  if (PL.state === 'error') body = `<p class="muted">${esc(t('pl_load_err'))}</p><button class="btn primary" data-act="plRetry">${esc(t('club_retry'))}</button>${PL.err ? `<p class="small faint">${esc(PL.err)}</p>` : ''}`;
  else if (!PL.tasks) body = `<p class="muted">${esc(t(PL.slow ? 'pl_slow' : 'pl_loading'))}</p>${PL.slow ? `<button class="btn primary" data-act="plRetry">${esc(t('club_retry'))}</button>` : ''}`;
  else body = `<p class="small faint" style="margin-bottom:10px">${esc(t('pl_hint'))}</p><div class="pl-layout"><div class="card pad" style="padding:12px">${plGrid()}</div>${plReview()}</div>`;
  page(`${head('pl_title', 'pl_sub', '', 'moonwalk', 4)}${state.companionUntil && !state.isAdmin ? (plDaysLeft() <= 5 ? `<div class="card pad stack" style="margin-bottom:14px"><p class="small">${esc(t('pl_soon', { d:state.companionUntil }))}</p>${compClaimHTML()}</div>` : `<p class="small muted" style="margin:-6px 0 12px">${esc(t('pl_until', { d:state.companionUntil }))}</p>`) : ''}${nav}${body}`);
};
/* ---------- hộp thoại thêm / sửa ---------- */
function plForm(x, isNew, day, start){
  const dayChips = isNew
    ? `<div class="field"><label class="label">${esc(t('pl_f_days'))}</label><div class="row" style="gap:6px">${Array.from({ length:7 }, (_, i) => `<label class="chip pl-dchip"><input type="checkbox" class="pl-day" value="${i}" ${i === day ? 'checked' : ''}> ${esc(t('pl_d' + i))}</label>`).join('')}</div><p class="small faint" style="margin-top:4px">${esc(t('pl_f_noday'))}: ${esc(t('pl_empty_list'))}</p></div>`
    : `<div class="field"><label class="label">${esc(t('pl_f_day'))}</label><select class="select" id="pl-day1"><option value="">${esc(t('pl_f_noday'))}</option>${Array.from({ length:7 }, (_, i) => `<option value="${i}" ${x.day === i ? 'selected' : ''}>${esc(t('pl_d' + i))}</option>`).join('')}</select></div>`;
  openModal(`<h3 style="margin-bottom:12px">${esc(t(isNew ? 'pl_new' : 'pl_edit'))}</h3>
    <div class="field"><label class="label">${esc(t('pl_f_title'))}</label><input class="input" id="pl-title" maxlength="80" value="${esc(x.title)}"></div>
    <div class="mt-s">${dayChips}</div>
    <div class="f2 mt-s"><div class="field"><label class="label">${esc(t('pl_f_start'))}</label><input class="input" type="time" id="pl-start" value="${esc(start !== undefined ? start : x.start)}"></div><div class="field"><label class="label">${esc(t('pl_f_dur'))}</label><input class="input" type="number" min="0" max="1440" step="5" id="pl-dur" value="${x.dur || ''}" placeholder="60"></div></div>
    <div class="row mt-s">${[30, 60, 90, 120].map(m => `<button type="button" class="chip" data-act="plDur" data-m="${m}">${m}′</button>`).join('')}</div>
    <div class="field mt-s"><label class="label">${esc(t('pl_f_cat'))}</label><div class="row" style="gap:8px" id="pl-cats">${PL_COLORS.map((c, i) => `<button type="button" class="pl-cat ${x.c === i ? 'on' : ''}" data-act="plCat" data-c="${i}" style="background:${c}" title="${esc(t('pl_c' + i))}"><span>${esc(t('pl_c' + i))}</span></button>`).join('')}</div></div>
    ${isNew ? '' : `<label class="chk row small mt-s" style="font-weight:700"><input type="checkbox" id="pl-done" ${x.done ? 'checked' : ''}> ${esc(t('pl_f_done'))}</label>`}
    <div class="row mt" style="justify-content:space-between">${isNew ? '<span></span>' : `<button type="button" class="btn danger" data-act="plDel">${esc(t('pl_delete'))}</button>`}<span class="row"><button type="button" class="btn ghost" data-act="closeModal">${esc(t('cancel'))}</button><button type="button" class="btn primary" data-act="plSaveTask">${esc(t('pl_save'))}</button></span></div>`, true);
  PL.cat = x.c;
  setTimeout(() => { const el = $('pl-title'); if (el && isNew) el.focus(); }, 30);
}
Object.assign(ACTIONS, {
  plWeek: el => { plFlush(); const d = +el.dataset.d; PL.off = d ? PL.off + d : 0; PL.seq++; PL.tasks = null; PL.key = ''; PL.state = 'idle'; render(true); },
  plRetry: () => { PL.seq++; PL.state = 'idle'; PL.key = ''; PL.tasks = null; PL.slow = false; render(true); },
  plNew: (el, e) => {
    if (!PL.tasks) return; let day = el.dataset.day !== undefined ? +el.dataset.day : (PL.off === 0 ? DT.now().setZone(userTZ).weekday - 1 : 0), start = '';
    if (day !== null && e && e.clientY !== undefined) { const r = el.getBoundingClientRect(), mins = Math.round((e.clientY - r.top) / PL_HOUR * 2) * 30 + (+el.dataset.g0) * 60; start = hmStr(Math.max(0, Math.min(1410, mins))); }
    PL.sel = null; plForm({ title:'', day, start:'', dur:60, c:0, done:false }, true, day, start);
  },
  plEdit: el => { const x = PL.tasks.find(v => v.id === el.dataset.id); if (!x) return; PL.sel = x.id; plForm(x, false); },
  plDur: el => { const n = $('pl-dur'); if (n) n.value = el.dataset.m; },
  plCat: el => { PL.cat = +el.dataset.c; document.querySelectorAll('#pl-cats .pl-cat').forEach(b => b.classList.toggle('on', +b.dataset.c === PL.cat)); },
  plToggle: el => { const x = PL.tasks.find(v => v.id === el.dataset.id); if (!x) return; x.done = !x.done; plSave(); render(true); },
  plDel: () => { PL.tasks = PL.tasks.filter(x => x.id !== PL.sel); PL.sel = null; closeModal(); plSave(); render(true); },
  plSaveTask: () => {
    const title = $('pl-title').value.trim(); if (!title) { $('pl-title').focus(); return; }
    const start = $('pl-start').value, dur = +$('pl-dur').value || 0, base = { title, start, dur, c:PL.cat || 0 };
    if (PL.sel) { const x = PL.tasks.find(v => v.id === PL.sel); if (x) { const d1 = $('pl-day1').value; Object.assign(x, plClean({ ...x, ...base, day:d1 === '' ? null : +d1, done:$('pl-done').checked })); } }
    else {
      const days = [...document.querySelectorAll('.pl-day:checked')].map(b => +b.value);
      if (PL.tasks.length + Math.max(1, days.length) > PL_MAX) { toast(t('pl_max', { n:PL_MAX })); return; }
      (days.length ? days : [null]).forEach(day => PL.tasks.push(plClean({ ...base, day })));
    }
    PL.sel = null; closeModal(); plSave(); render(true);
  },
  plCarry: async () => {
    const open = PL.tasks.filter(x => !x.done && !x.carried); if (!open.length) return;
    try {
      const nk = plKey(PL.off + 1); let next = [];
      if (!DEMO) { const d = await plRef(nk).get(); next = d.exists && Array.isArray(d.data().tasks) ? d.data().tasks.map(plClean) : []; }
      open.forEach(x => next.push(plClean({ ...x, id:plId(), done:false, carried:false })));
      if (!DEMO) await plRef(nk).set({ tasks:next, updatedAt:TS() });
      open.forEach(x => { x.carried = true; }); plSave(); render(true); toast(t('pl_carried_n', { n:open.length }));
    } catch (e) { console.warn('carry', e.code); toast(t('pl_err')); }
  }
});
