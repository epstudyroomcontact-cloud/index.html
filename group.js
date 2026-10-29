'use strict';
/* =========================================================
   NHÓM HỌC TRỰC TIẾP (tải theo nhu cầu: khi mở Phòng tập trung, hoặc khi khách đã tham gia và bấm đồng hồ)
   Chỉ dành cho Người đồng hành, người đang dùng thử và admin (cùng điều kiện với Planner); admin bật/tắt ở tab Giao diện (branding.groupOn).
   Dữ liệu: study_group/<năm>-W<tuần> (tuần tính theo giờ Việt Nam, nên mọi người thấy cùng một tuần) = {
     live:  { <uid>: { n:tên, s:lúc bắt đầu học (ms), k:'f'|'b', b:nhịp báo gần nhất (ms) } },   ai đang học
     board: { <uid>: { n:tên, mins:tổng phút tập trung tuần này, t:giờ máy chủ lần ghi cuối } }  bảng xếp hạng tuần
   }
   Tiết kiệm lượt đọc Firestore (gói miễn phí 50.000 lượt đọc/ngày): cả nhóm nằm trong MỘT tài liệu, người xem tải lại mỗi 60 giây và chỉ khi đang
   mở Phòng tập trung; đồng hồ của từng người tính ở máy từ lúc bắt đầu (s) nên không ghi mỗi giây; người đang học báo nhịp 4 phút/lần,
   quá 9 phút không báo thì ẩn. Phút học chỉ được cộng khi xong một phiên tập trung (cùng chỗ với addFocus trong pages.js).
   Quy tắc Firestore (firestore.rules): mỗi người chỉ ghi được khoá của chính mình; số phút chỉ tăng và không nhanh hơn thời gian thật.
   Tên hiển thị là biệt danh khách tự đặt khi tham gia, không lấy từ email hay tên tài khoản.
   ========================================================= */
Object.assign(I18N.en, {
  grp_sub:'Study together: see who is studying right now and the weekly leaderboard of focus hours.',
  grp_up_title:'The study group is for companions', grp_up_text:'Companions can join a live study group: see who is studying right now and for how long, and a weekly leaderboard of focus hours. Your support also keeps this website running.',
  grp_up_login:'Sign in to see whether you can join.', grp_up_cta:'See how to become a companion',
  grp_nick:'Nickname', grp_nick_ph:'e.g. Mina', grp_nick_hint:'Everyone in the group can see your nickname, whether you are studying, and your hours this week. Please do not use your real name or email unless you want to.',
  grp_join:'Join the group', grp_save_nick:'Save nickname', grp_leave:'Leave the group', grp_leave_ask:'Leave? You will disappear from the list and your hours this week will be removed from the leaderboard.', grp_leave_yes:'Yes, leave', grp_cancel:'Cancel',
  grp_nick_bad:'The nickname needs 2 to 20 characters.', grp_joined_toast:'You joined the study group', grp_left_toast:'You left the study group', grp_saved:'Nickname saved',
  grp_me_on:'You are shown as studying', grp_me_off:'Your timer is not running, so you are not shown as studying. Start the timer to appear.',
  grp_now:'Studying now', grp_none:'Nobody is studying right now. Start your timer to be the first.',
  grp_board:'This week', grp_board_none:'No focus time yet this week. Finish a focus session to appear here.', grp_reset:'Resets every Monday at 00:00 (Vietnam time, GMT+7).',
  grp_focus:'Focus', grp_break:'Break', grp_you:'You', grp_hm:'{h} h {m} min', grp_m:'{m} min', grp_refresh:'Refresh', grp_remove:'Remove from the group',
  grp_strip_join:'Join the study group to see who is studying and your weekly rank', grp_strip_n:'{n} studying now', grp_strip_0:'Nobody studying yet', grp_rank:'Rank #{r}', grp_rank_none:'No hours this week yet', grp_home_sub:'See who is studying right now.', grp_home_join:'Join the group in the Focus room', grp_home_open:'Open the Focus room', grp_home_up:'Companions can see who is studying right now, with live timers and a weekly leaderboard.',
  grp_err:'Could not load the group. Try again in a moment.', grp_err_rules:'The group is not ready yet. The site owner still needs to publish the latest security rules.', grp_err_quota:'The group is resting for today. Please come back tomorrow.'
});
Object.assign(I18N.vi, {
  grp_sub:'Học cùng nhau: xem ai đang học ngay lúc này và bảng xếp hạng giờ tập trung trong tuần.',
  grp_up_title:'Nhóm học dành cho Người đồng hành', grp_up_text:'Người đồng hành được vào nhóm học trực tiếp: xem ai đang học ngay lúc này và đã học bao lâu, cùng bảng xếp hạng giờ tập trung mỗi tuần. Sự ủng hộ của bạn cũng giúp web được duy trì.',
  grp_up_login:'Hãy đăng nhập để xem bạn có tham gia được không.', grp_up_cta:'Xem cách trở thành Người đồng hành',
  grp_nick:'Biệt danh', grp_nick_ph:'VD: Mina', grp_nick_hint:'Mọi người trong nhóm sẽ thấy biệt danh, việc bạn có đang học không và số giờ học tuần này của bạn. Bạn đừng dùng tên thật hay email nếu không muốn nhé.',
  grp_join:'Tham gia nhóm', grp_save_nick:'Lưu biệt danh', grp_leave:'Rời nhóm', grp_leave_ask:'Rời nhóm? Bạn sẽ biến mất khỏi danh sách và số giờ tuần này sẽ bị xoá khỏi bảng xếp hạng.', grp_leave_yes:'Đúng, rời nhóm', grp_cancel:'Huỷ',
  grp_nick_bad:'Biệt danh cần từ 2 đến 20 ký tự.', grp_joined_toast:'Bạn đã vào nhóm học', grp_left_toast:'Bạn đã rời nhóm học', grp_saved:'Đã lưu biệt danh',
  grp_me_on:'Bạn đang được hiện là đang học', grp_me_off:'Đồng hồ của bạn chưa chạy nên bạn chưa hiện là đang học. Bấm bắt đầu để xuất hiện.',
  grp_now:'Đang học', grp_none:'Hiện chưa ai đang học. Bấm bắt đầu đồng hồ để làm người đầu tiên nhé.',
  grp_board:'Tuần này', grp_board_none:'Tuần này chưa ai có giờ tập trung. Xong một phiên tập trung là bạn sẽ có tên ở đây.', grp_reset:'Làm mới mỗi thứ Hai lúc 00:00 (giờ Việt Nam, GMT+7).',
  grp_focus:'Tập trung', grp_break:'Nghỉ', grp_you:'Bạn', grp_hm:'{h} giờ {m} phút', grp_m:'{m} phút', grp_refresh:'Tải lại', grp_remove:'Xoá khỏi nhóm',
  grp_strip_join:'Tham gia nhóm học để xem ai đang học và thứ hạng tuần của bạn', grp_strip_n:'{n} người đang học', grp_strip_0:'Chưa ai đang học', grp_rank:'Hạng {r}', grp_rank_none:'Tuần này chưa có giờ học', grp_home_sub:'Xem ai đang học ngay lúc này.', grp_home_join:'Tham gia nhóm ở Phòng tập trung', grp_home_open:'Mở Phòng tập trung', grp_home_up:'Người đồng hành xem được ai đang học ngay lúc này, kèm đồng hồ trực tiếp và bảng xếp hạng tuần.',
  grp_err:'Chưa tải được nhóm. Bạn thử lại sau một lát nhé.', grp_err_rules:'Nhóm chưa sẵn sàng: chủ web cần dán luật bảo mật mới nhất lên Firebase.', grp_err_quota:'Hôm nay nhóm đang nghỉ. Bạn quay lại vào ngày mai nhé.'
});
(function(){
  const TZ = 'Asia/Ho_Chi_Minh', BEAT = 4 * 60e3, STALE = 9 * 60e3, POLL = 60e3, SESS_GAP = 15 * 60e3, TOP = 20;   // nhịp báo, quá hạn thì ẩn, tải lại, nghỉ quá lâu thì tính phiên mới, số người trong bảng
  const wk = () => DT.now().setZone(TZ).toFormat("kkkk-'W'WW");
  const ref = () => db.collection('study_group').doc(wk());
  const key = () => 'grp_' + state.user.uid;
  const me = () => state.user ? store.get(key(), null) : null;                    // { n:biệt danh } khi đã tham gia
  const access = () => !!state.user && !DEMO && typeof plLinked === 'function' && plLinked();   // cùng điều kiện với Planner (chốt cuối cùng ở firestore.rules)
  const on = () => branding.groupOn === true && access();
  let live = {}, board = {}, loadedAt = 0, err = '', busy = false, leaving = false, lastSent = '', lastBeat = 0, flushing = false, timers = false;

  const fmt = ms => { const m = Math.max(0, Math.floor(ms / 60000)), h = Math.floor(m / 60); return h ? t('grp_hm', { h, m:m % 60 }) : t('grp_m', { m }); };
  const hue = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
  const nameOk = v => { v = String(v || '').replace(/\s+/g, ' ').trim(); return v.length >= 2 && v.length <= 20 ? v : ''; };

  /* ---------- ghi lên Firestore ---------- */
  const want = () => !pomo.running ? '' : pomo.mode === 'focus' ? 'f' : 'b';
  function sessStart(){      // lúc bắt đầu phiên học liên tục: các phiên tập trung/nghỉ nối nhau trong vòng 15 phút tính là một
    const now = Date.now(); let s = store.get('grp_sess', null); if (!s || now - s.last > SESS_GAP) s = { s:now }; s.last = now; store.set('grp_sess', s); return s.s;
  }
  function errNote(e){ const c = e && e.code; err = c === 'permission-denied' ? 'rules' : c === 'resource-exhausted' ? 'quota' : 'load'; renderBox(); }
  async function clearLive(){
    if (!state.user || DEMO) return; const id = state.user.uid; delete live[id];
    try { await ref().update({ ['live.' + id]: DEL() }); } catch (e) { /* tài liệu chưa có hoặc đang offline: không sao */ }
  }
  async function sync(force){            // gọi mỗi khi đồng hồ đổi trạng thái và mỗi 30 giây (để báo nhịp)
    const m = me(); if (!m || !on()) return;
    const k = want(), now = Date.now();
    if (!k) { if (lastSent) { lastSent = ''; await clearLive(); renderBox(); } return; }
    if (!force && k === lastSent && now - lastBeat < BEAT) return;
    const id = state.user.uid, entry = { n:m.n, s:sessStart(), k, b:now }; lastSent = k; lastBeat = now;
    try { await ref().set({ live:{ [id]: entry } }, { merge:true }); live[id] = entry; err = ''; renderBox(); } catch (e) { lastSent = ''; errNote(e); }
  }
  async function flush(){               // cộng phút đã xong lên bảng xếp hạng
    const m = me(); let p = Math.round(+store.get('grp_pend', 0)) || 0;
    if (!m || !on() || p <= 0 || flushing) return; flushing = true;
    const inc = Math.min(p, 180), id = state.user.uid;
    try {
      await ref().set({ board:{ [id]: { n:m.n, mins:firebase.firestore.FieldValue.increment(inc), t:TS() } } }, { merge:true });
      store.set('grp_pend', p - inc); const o = board[id] || { n:m.n, mins:0 }; board[id] = { ...o, n:m.n, mins:(o.mins | 0) + inc }; renderBox();
    } catch (e) { if (e && (e.code === 'permission-denied' || e.code === 'invalid-argument')) store.set('grp_pend', 0); errNote(e); }   // bị quy tắc từ chối thì bỏ, không thử lại mãi
    flushing = false;
  }
  function credit(min){ const m = Math.round(+min) || 0; if (m <= 0 || !me()) return; store.set('grp_pend', (Math.round(+store.get('grp_pend', 0)) || 0) + m); return flush(); }

  /* ---------- đọc ---------- */
  async function load(force){
    if (!on() || busy || (!force && Date.now() - loadedAt < 15000)) return; busy = true; renderBox();
    try {
      const d = await ref().get(), x = d.exists ? d.data() : {};
      live = x.live || {}; board = x.board || {}; loadedAt = Date.now(); err = '';
      const id = state.user.uid; if (live[id] && !want()) clearLive();          // sót lại từ lần đóng web đột ngột
    } catch (e) { errNote(e); }
    busy = false; renderBox();
  }

  /* ---------- hiển thị ---------- */
  const box = () => document.getElementById('grp-box');
  const head = () => `<div class="card-h"><h2>${ic('users', 'sm')} ${esc(t('grp_title'))}</h2></div>`;
  function upsell(){
    return `${head()}<p class="muted">${esc(t('grp_up_text'))}</p>
      <div class="row mt-s">${state.user ? `<a class="btn primary" href="#/donate">${ic('heart', 'sm')} ${esc(t('grp_up_cta'))}</a>` : `<a class="btn primary" href="#/account">${ic('user', 'sm')} ${esc(t('grp_up_login'))}</a>`}</div>`;
  }
  const nickForm = (joined, v) => `<form class="stack" data-form="grpJoin" style="gap:8px"><label class="label" for="grp-nick" style="margin:0">${esc(t('grp_nick'))}</label>
      <div class="row" style="flex-wrap:nowrap"><input class="input" id="grp-nick" maxlength="20" autocomplete="off" placeholder="${esc(t('grp_nick_ph'))}" value="${esc(v || '')}"><button class="btn primary" type="submit">${esc(t(joined ? 'grp_save_nick' : 'grp_join'))}</button></div>
      <p class="small faint">${esc(t('grp_nick_hint'))}</p></form>`;
  function liveRows(){      // người đang học (còn báo nhịp trong 9 phút), người học lâu nhất đứng đầu
    const now = Date.now();
    return Object.entries(live).filter(([, e]) => e && typeof e.s === 'number' && now - e.b < STALE).map(([id, e]) => ({ id, n:e.n || '?', s:e.s, k:e.k === 'b' ? 'b' : 'f' })).sort((a, b) => a.s - b.s);
  }
  const avatar = n => `<i class="grp-av" style="--h:${hue(n)}">${esc(String(n).slice(0, 1).toUpperCase())}</i>`;
  const kick = id => state.isAdmin && id !== state.user.uid ? `<button type="button" class="grp-x" data-act="grpKick" data-id="${esc(id)}" title="${esc(t('grp_remove'))}" aria-label="${esc(t('grp_remove'))}">${ic('x', 'sm')}</button>` : '';
  function boardHTML(){
    const id = state.user.uid, all = Object.entries(board).map(([k, e]) => ({ k, n:(e && e.n) || '?', mins:(e && e.mins) | 0 })).filter(x => x.mins > 0).sort((a, b) => b.mins - a.mins);
    const top = all.slice(0, TOP), mine = all.findIndex(x => x.k === id), row = (x, i) => `<li class="grp-row ${x.k === id ? 'me' : ''}"><span class="grp-rank r${i < 3 ? i + 1 : 0}">${i + 1}</span>${avatar(x.n)}<b class="grp-n">${esc(x.n)}${x.k === id ? ` <span class="badge">${esc(t('grp_you'))}</span>` : ''}</b><span class="grp-t">${esc(fmt(x.mins * 60000))}</span>${kick(x.k)}</li>`;
    return `<h3 class="grp-h">${esc(t('grp_board'))}</h3>` + (all.length
      ? `<ol class="grp-list">${top.map(row).join('')}${mine >= TOP ? `<li class="grp-gap" aria-hidden="true">…</li>${row(all[mine], mine)}` : ''}</ol>` : `<p class="muted small">${esc(t('grp_board_none'))}</p>`) + `<p class="small faint mt-s">${esc(t('grp_reset'))}</p>`;
  }
  function renderMain(){
    const el = box(); if (!el) return;
    if (!state.user || !on()) { el.innerHTML = upsell(); return; }
    const m = me();
    if (!m) { el.innerHTML = `${head()}<p class="muted" style="margin-bottom:10px">${esc(t('grp_sub'))}</p>${nickForm(false, '')}${errHTML()}`; return; }
    const id = state.user.uid, k = want();
    el.innerHTML = `${head()}
      <div class="row between grp-me"><span class="small ${k ? '' : 'muted'}">${k ? `<i class="grp-dot"></i> ${esc(t('grp_me_on'))}` : esc(t('grp_me_off'))}</span>
        <button type="button" class="btn secondary sm" data-act="grpRefresh" ${busy ? 'disabled' : ''}>${ic('reset', 'sm')} ${esc(t('grp_refresh'))}</button></div>
      ${errHTML()}
      <div class="grp-cols"><div>${liveCols()}</div><div>${boardHTML()}</div></div>
      <details class="grp-opts mt"><summary class="small muted">${esc(m.n)} · ${esc(t('grp_save_nick'))}</summary><div class="mt-s">${nickForm(true, m.n)}</div></details>
      <div class="mt-s">${leaving ? `<p class="small">${esc(t('grp_leave_ask'))}</p><div class="row mt-s"><button type="button" class="btn danger sm" data-act="grpLeaveYes">${esc(t('grp_leave_yes'))}</button><button type="button" class="btn secondary sm" data-act="grpLeaveNo">${esc(t('grp_cancel'))}</button></div>` : `<button type="button" class="btn ghost sm" data-act="grpLeave">${esc(t('grp_leave'))}</button>`}</div>`;
  }
  const rankOf = () => { const id = state.user.uid, all = Object.entries(board).map(([k, e]) => ({ k, mins:(e && e.mins) | 0 })).filter(x => x.mins > 0).sort((a, b) => b.mins - a.mins), i = all.findIndex(x => x.k === id); return i < 0 ? null : { r:i + 1, mins:all[i].mins }; };
  function renderStrip(){            // dải nhỏ ngay dưới đồng hồ: ai đang học + hạng tuần của mình
    const el = document.getElementById('grp-strip'); if (!el) return;
    if (!state.user || !on()) { el.innerHTML = ''; return; }
    if (!me()) { el.innerHTML = `<button type="button" class="grp-strip-join" data-act="grpGo">${ic('users', 'sm')} ${esc(t('grp_strip_join'))}</button>`; return; }
    const rows = liveRows(), rk = rankOf();
    el.innerHTML = `<div class="grp-strip"><div class="grp-strip-l"><span class="grp-avs">${rows.slice(0, 5).map(r => avatar(r.n)).join('')}</span><span class="small">${esc(rows.length ? t('grp_strip_n', { n:rows.length }) : t('grp_strip_0'))}</span></div>
      <button type="button" class="grp-strip-r small" data-act="grpGo">${rk ? `<b>${esc(t('grp_rank', { r:rk.r }))}</b> · ${esc(fmt(rk.mins * 60000))}` : esc(t('grp_rank_none'))}</button></div>`;
  }
  function renderHome(){             // thẻ ở trang Tổng quan: ai đang học (khách chưa là Người đồng hành chỉ thấy lời mời)
    const el = document.getElementById('grp-home'); if (!el) return;
    const hd = `<div class="card-h"><h2>${ic('users', 'sm')} ${esc(t('grp_title'))}</h2><a class="link" href="#/focus">${esc(t('nav_focus'))} ${ic('arrow', 'sm')}</a></div>`;
    if (!state.user || !on()) { el.innerHTML = `${hd}<p class="muted small">${esc(t('grp_home_up'))}</p><div class="row mt-s"><a class="btn secondary sm" href="${state.user ? '#/donate' : '#/account'}">${ic(state.user ? 'heart' : 'user', 'sm')} ${esc(t(state.user ? 'grp_up_cta' : 'grp_up_login'))}</a></div>`; return; }
    const rows = liveRows(), id = state.user.uid, now = Date.now();
    el.innerHTML = `${hd}${errHTML()}` + (rows.length
      ? `<ul class="grp-list">${rows.slice(0, 6).map(r => `<li class="grp-row ${r.id === id ? 'me' : ''}">${avatar(r.n)}<b class="grp-n">${esc(r.n)}</b><span class="grp-st ${r.k}">${esc(t(r.k === 'b' ? 'grp_break' : 'grp_focus'))}</span><span class="grp-t" data-s="${r.s}">${esc(fmt(now - r.s))}</span></li>`).join('')}</ul>${rows.length > 6 ? `<p class="small faint mt-s">+${rows.length - 6}</p>` : ''}`
      : `<p class="muted small">${esc(t(busy ? 'loading' : 'grp_none'))}</p>`)
      + (me() ? '' : `<div class="row mt-s"><a class="btn primary sm" href="#/focus">${ic('timer', 'sm')} ${esc(t('grp_home_join'))}</a></div>`);
  }
  function renderBox(){ renderMain(); renderStrip(); renderHome(); }
  const errHTML = () => err ? `<p class="hint grp-err">${esc(t(err === 'rules' ? 'grp_err_rules' : err === 'quota' ? 'grp_err_quota' : 'grp_err'))}</p>` : '';
  function liveCols(){
    const rows = liveRows(), id = state.user.uid, now = Date.now();
    return `<h3 class="grp-h">${esc(t('grp_now'))} <span class="badge">${rows.length}</span></h3>` + (rows.length
      ? `<ul class="grp-list">${rows.map(r => `<li class="grp-row ${r.id === id ? 'me' : ''}">${avatar(r.n)}<b class="grp-n">${esc(r.n)}${r.id === id ? ` <span class="badge">${esc(t('grp_you'))}</span>` : ''}</b><span class="grp-st ${r.k}">${esc(t(r.k === 'b' ? 'grp_break' : 'grp_focus'))}</span><span class="grp-t" data-s="${r.s}">${esc(fmt(now - r.s))}</span>${kick(r.id)}</li>`).join('')}</ul>` : `<p class="muted small">${esc(t('grp_none'))}</p>`);
  }

  /* ---------- mở / đóng ---------- */
  function mount(){
    renderBox(); if (on()) load(true);
    if (!timers) {
      timers = true;
      setInterval(() => { sync(); flush(); }, 30e3);                                                   // báo nhịp + cộng phút còn chờ
      setInterval(() => { if (document.visibilityState === 'visible' && (box() || document.getElementById('grp-strip') || document.getElementById('grp-home'))) load(); }, POLL);
      setInterval(() => { const now = Date.now(); document.querySelectorAll('#grp-box [data-s], #grp-home [data-s]').forEach(e => { e.textContent = fmt(now - +e.dataset.s); }); }, 20e3);
    }
  }
  FORMS.grpJoin = () => {
    const n = nameOk($('grp-nick').value); if (!n) return toast(t('grp_nick_bad'));
    const id = state.user.uid, first = !me(); store.set(key(), { n }); leaving = false; renderBox(); toast(t(first ? 'grp_joined_toast' : 'grp_saved'));
    sync(true);
    if (board[id]) ref().set({ board:{ [id]: { n, mins:board[id].mins | 0, t:TS() } } }, { merge:true }).then(() => { board[id].n = n; renderBox(); }).catch(() => {});   // đổi biệt danh trên bảng xếp hạng, giữ nguyên số phút
    load(true);
  };
  Object.assign(ACTIONS, {
    grpRefresh: () => load(true),
    grpGo: () => { const b = box(); if (b) b.scrollIntoView({ block:'start' }); },
    grpLeave: () => { leaving = true; renderBox(); },
    grpLeaveNo: () => { leaving = false; renderBox(); },
    grpLeaveYes: async () => {
      const id = state.user.uid; leaving = false; store.set(key(), null); store.set('grp_pend', 0); lastSent = ''; delete live[id]; delete board[id]; renderBox(); toast(t('grp_left_toast'));
      try { await ref().update({ ['live.' + id]: DEL(), ['board.' + id]: DEL() }); } catch (e) { /* chưa có tài liệu / offline */ }
    },
    grpKick: async el => { const id = el.dataset.id; if (!state.isAdmin || !id) return; delete live[id]; delete board[id]; renderBox(); try { await ref().update({ ['live.' + id]: DEL(), ['board.' + id]: DEL() }); } catch (e) { toast(t('grp_err')); } }
  });
  window.EPGroup = { mount, sync, credit };
})();
