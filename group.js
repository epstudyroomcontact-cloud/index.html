'use strict';
/* =========================================================
   NHÓM HỌC TRỰC TIẾP (tải theo nhu cầu: khi mở Phòng tập trung, hoặc khi khách đã tham gia và bấm đồng hồ)
   Chỉ dành cho Người đồng hành, người đang dùng thử và admin (cùng điều kiện với Planner); admin bật/tắt ở tab Giao diện (branding.groupOn).
   Dữ liệu: study_group/<năm>-W<tuần> (tuần tính theo giờ Việt Nam, nên mọi người thấy cùng một tuần) = {
     live:  { <uid>: { n:tên, s:lúc bắt đầu học (ms), k:'f'|'b', b:nhịp báo gần nhất (ms) } },   ai đang học
     board: { <uid>: { n:tên, mins:tổng phút tập trung tuần này, t:giờ máy chủ lần ghi cuối } }  bảng xếp hạng tuần
   }
   Tiết kiệm lượt đọc Firestore (gói miễn phí 50.000 lượt đọc/ngày): cả nhóm nằm trong MỘT tài liệu, người xem tải lại mỗi 60 giây ở Phòng tập trung (3 phút ở Tổng quan),
   chỉ khi tab đang hiện và người xem còn đụng vào trang trong 10 phút gần nhất; đồng hồ của từng người tính ở máy từ lúc bắt đầu (s) nên không ghi mỗi giây; người đang học báo nhịp 4 phút/lần,
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
  grp_trend_up:'▲ {n} today', grp_trend_dn:'▼ {n} today', grp_climb_next:'{m} more to pass {n}', grp_climb_lead:'You lead {n} by {m}', grp_climb_alone:'You are the only one on the board so far', grp_moved:'You moved up to #{r} this week!', grp_top:'You are #1 this week!',
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
  grp_trend_up:'▲ {n} hạng hôm nay', grp_trend_dn:'▼ {n} hạng hôm nay', grp_climb_next:'Học thêm {m} để vượt {n}', grp_climb_lead:'Bạn hơn {n} {m}', grp_climb_alone:'Hiện mới chỉ có bạn trên bảng', grp_moved:'Bạn vừa lên hạng {r} tuần này!', grp_top:'Bạn đang đứng đầu tuần này!',
  grp_err:'Chưa tải được nhóm. Bạn thử lại sau một lát nhé.', grp_err_rules:'Nhóm chưa sẵn sàng: chủ web cần dán luật bảo mật mới nhất lên Firebase.', grp_err_quota:'Hôm nay nhóm đang nghỉ. Bạn quay lại vào ngày mai nhé.'
});
/* Bản dịch cho khách chưa là Người đồng hành (lời mời ở Phòng tập trung và Tổng quan) bằng hi / ja / ko / zh / fr / es; phần dành cho thành viên nhóm còn en / vi, thiếu thì tự dùng tiếng Anh. */
(function(){
  const X = {
    hi:{ grp_title:'लाइव स्टडी ग्रुप', grp_up_text:'साथी लाइव स्टडी ग्रुप में शामिल हो सकते हैं: देखिए अभी कौन पढ़ रहा है और कितनी देर से, साथ में फ़ोकस घंटों का साप्ताहिक लीडरबोर्ड। आपका सहयोग इस वेबसाइट को चालू रखने में भी मदद करता है।', grp_up_login:'यह देखने के लिए साइन इन करें कि क्या आप जुड़ सकते हैं।', grp_up_cta:'साथी बनने का तरीक़ा देखें', grp_home_up:'साथी देख सकते हैं कि अभी कौन पढ़ रहा है, लाइव टाइमर और साप्ताहिक लीडरबोर्ड के साथ।' },
    ja:{ grp_title:'ライブ勉強グループ', grp_up_text:'仲間はライブ勉強グループに参加できます。今だれが、どれくらい勉強しているかが見られ、集中時間の週間ランキングもあります。あなたの支援はこのサイトの運営も支えます。', grp_up_login:'参加できるか確認するにはログインしてください。', grp_up_cta:'仲間になる方法を見る', grp_home_up:'仲間は、今だれが勉強中かをライブタイマーと週間ランキングつきで見られます。' },
    ko:{ grp_title:'실시간 스터디 그룹', grp_up_text:'동반자는 실시간 스터디 그룹에 참여할 수 있어요. 지금 누가 얼마나 공부하고 있는지, 그리고 집중 시간 주간 순위를 볼 수 있어요. 여러분의 후원은 이 웹사이트 운영에도 보탬이 돼요.', grp_up_login:'참여할 수 있는지 보려면 로그인하세요.', grp_up_cta:'동반자가 되는 방법 보기', grp_home_up:'동반자는 지금 누가 공부 중인지 실시간 타이머와 주간 순위와 함께 볼 수 있어요.' },
    zh:{ grp_title:'实时学习小组', grp_up_text:'同伴可以加入实时学习小组：看看现在谁在学习、已经学了多久，还有每周专注时长排行榜。你的支持也让这个网站得以持续运营。', grp_up_login:'登录后查看你是否可以加入。', grp_up_cta:'了解如何成为同伴', grp_home_up:'同伴可以看到现在谁在学习，附带实时计时器和每周排行榜。' },
    fr:{ grp_title:"Groupe d'étude en direct", grp_up_text:"Les Compagnons peuvent rejoindre un groupe d'étude en direct : voir qui étudie en ce moment et depuis combien de temps, avec un classement hebdomadaire des heures de concentration. Ton soutien aide aussi à faire vivre ce site.", grp_up_login:'Connecte-toi pour voir si tu peux le rejoindre.', grp_up_cta:'Voir comment devenir Compagnon', grp_home_up:'Les Compagnons voient qui étudie en ce moment, avec les minuteurs en direct et le classement de la semaine.' },
    es:{ grp_title:'Grupo de estudio en vivo', grp_up_text:'Los Acompañantes pueden unirse a un grupo de estudio en vivo: ver quién está estudiando ahora y desde hace cuánto, y un ranking semanal de horas de enfoque. Tu apoyo también ayuda a mantener este sitio en marcha.', grp_up_login:'Inicia sesión para ver si puedes unirte.', grp_up_cta:'Ver cómo ser Acompañante', grp_home_up:'Los Acompañantes ven quién está estudiando ahora, con temporizadores en vivo y el ranking semanal.' }
  };
  Object.keys(X).forEach(l => { I18N[l] = I18N[l] || {}; Object.assign(I18N[l], X[l]); });   // ghi đè: các bản dịch của khách chưa là Người đồng hành nằm ở đây
})();
(function(){
  const TZ = 'Asia/Ho_Chi_Minh', BEAT = 4 * 60e3, STALE = 9 * 60e3, POLL = 60e3, POLL_SLOW = 180e3, IDLE = 10 * 60e3, SESS_GAP = 15 * 60e3, TOP = 20, FLUSH = 3 * 60e3;   // nhịp báo, quá hạn thì ẩn, tải lại (Phòng tập trung / trang khác), ngừng tải khi không đụng vào gì, nghỉ quá lâu thì tính phiên mới, số người trong bảng
  const wk = () => DT.now().setZone(TZ).toFormat("kkkk-'W'WW");
  const ref = () => db.collection('study_group').doc(wk());
  const key = () => 'grp_' + state.user.uid;
  const me = () => state.user ? store.get(key(), null) : null;                    // { n:biệt danh } khi đã tham gia
  const access = () => !!state.user && !DEMO && typeof plLinked === 'function' && plLinked();   // cùng điều kiện với Planner (chốt cuối cùng ở firestore.rules)
  const on = () => branding.groupOn === true && access();
  let live = {}, board = {}, loadedAt = 0, err = '', busy = false, leaving = false, lastSent = '', lastBeat = 0, lastWeek = '', denied = 0, timers = false, lastFlush = 0;
  const TAB = Math.random().toString(36).slice(2), LEASE = 90e3;
  /* Mở nhiều tab cùng lúc: chỉ MỘT tab được ghi lên nhóm (tab giữ "quyền ghi" trong localStorage, hết hạn sau 90 giây nếu tab đó đóng), còn phút đang học
     được tính chung cho cả trình duyệt (grp_acc) nên không tab nào cộng thêm lần hai. Trước đây mỗi tab tự cộng, phút bị gấp đôi rồi bị luật Firestore từ chối. */
  const lead = () => { const l = store.get('grp_lead', null), now = Date.now(); if (l && l.id !== TAB && now - l.t < LEASE) return false; if (!l || l.id !== TAB || now - l.t > 30e3) store.set('grp_lead', { id:TAB, t:now }); return true; };

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
  let q = Promise.resolve();                                           // mọi lần ghi xếp hàng một, để phút đang chờ không bị cộng hai lần
  const enqueue = fn => (q = q.then(fn, fn));
  const liveEntry = () => { const k = want(), m = me(); return k && m ? { n:m.n, s:sessStart(), k, b:Date.now() } : null; };
  async function write(entry, inc){      // MỘT lần ghi gộp trạng thái đang học + phút tuần: luật Firestore kiểm tra cả hai phần mỗi lần ghi
    const id = state.user.uid, m = me(), o = {}, wkNow = wk();
    if (entry) o.live = { [id]: entry };
    if (inc > 0 || (entry && board[id])) o.board = { [id]: { n:m.n, mins:firebase.firestore.FieldValue.increment(inc), t:TS() } };
    if (!o.live && !o.board) return;
    try {
      await ref().set(o, { merge:true });
      if (entry) { live[id] = entry; lastSent = entry.k; lastBeat = entry.b; }
      if (inc > 0) { store.set('grp_pend', Math.max(0, pend() - inc)); const b0 = board[id] || { n:m.n, mins:0 }; board[id] = { ...b0, n:m.n, mins:(b0.mins | 0) + inc }; }
      lastFlush = Date.now(); lastWeek = wkNow; err = ''; denied = 0; rankWatch(); renderBox();
    } catch (e) {
      if (entry) lastSent = '';
      const nope = e && (e.code === 'permission-denied' || e.code === 'invalid-argument');
      if (inc > 0 && nope) store.set('grp_pend', Math.max(0, pend() - inc));   // bị quy tắc từ chối thì bỏ phần này, không thử lại mãi
      if (nope && ++denied < 2) { console.warn('[EP] study group write denied', e.code); renderBox(); return; }   // một lần bị từ chối (vd. quá tốc độ cộng phút) không đáng hiện lời báo "chưa dán luật"; từ lần thứ hai liên tiếp mới báo
      errNote(e);
    }
  }
  function sync(force){                  // gọi mỗi khi đồng hồ đổi trạng thái và mỗi 30 giây (để báo nhịp)
    accrue();
    const m = me(); if (!m || !on() || !lead()) return;
    const k = want(), now = Date.now();
    if (!k) { flush(true); return enqueue(async () => { if (lastSent) { lastSent = ''; await clearLive(); renderBox(); } }); }
    if (!force && k === lastSent && now - lastBeat < BEAT && lastWeek === wk()) return;   // sang tuần mới (thứ Hai 00:00) thì tài liệu mới còn trống: báo ngay, không đợi nhịp kế
    return enqueue(() => write(liveEntry(), Math.min(pend(), 180)));
  }
  const pend = () => Math.round(+store.get('grp_pend', 0)) || 0;     // phút đã học nhưng chưa ghi lên bảng
  const blkDone = () => Math.round(+store.get('grp_blk', 0)) || 0;   // phút của khối tập trung đang chạy đã được cộng sẵn
  const blkTotal = () => Math.max(1, Math.round(pomo.blockMin || pomo.cfg.focus));
  function accrue(){                    // cộng dồn phút đang học (không đợi hết khối), để hạng tuần cập nhật cả khi bạn đang giữa phiên
    const now = Date.now(), a = store.get('grp_acc', null) || { acc:0, last:0 };   // dùng chung mọi tab: nhiều tab cùng mở thì tổng vẫn đúng bằng thời gian thật
    const fresh = pomo.mode !== 'focus' || (!pomo.running && pomo.remaining >= blkTotal() * 60000 - 1000);   // khối mới tinh (vừa đặt lại / đổi chế độ)
    if (fresh && blkDone()) store.set('grp_blk', 0);
    if (!me() || !on() || !pomo.running || pomo.mode !== 'focus') { if (a.last) store.set('grp_acc', { acc:a.acc, last:0 }); return; }   // tạm dừng: giữ phần lẻ dưới một phút cho lần sau, không bỏ mất
    let acc = a.acc + (a.last ? Math.min(now - a.last, 5 * 60e3) : 0);        // tab bị trình duyệt làm chậm vẫn không mất phút
    let w = Math.floor(acc / 60000); acc -= w * 60000;
    store.set('grp_acc', { acc, last:now });
    w = Math.min(w, Math.max(0, blkTotal() - blkDone())); if (w <= 0) return;
    store.set('grp_blk', blkDone() + w); store.set('grp_pend', pend() + w); renderBox();
  }
  function flush(force){                // ghi phút đã học lên bảng xếp hạng (phiên đang chạy: 3 phút một lần để đỡ tốn lượt ghi; hết khối / tạm dừng: ghi ngay)
    if (!me() || !on() || pend() <= 0 || (!force && Date.now() - lastFlush < FLUSH) || !lead()) return;
    return enqueue(() => { if (pend() > 0) return write(liveEntry(), Math.min(pend(), 180)); });
  }
  function credit(min){               // hết khối tập trung: chỉ cộng phần còn thiếu, vì phần đã học đã được cộng dần
    const m = Math.round(+min) || 0; if (m <= 0 || !me()) return;
    const rest = Math.max(0, m - blkDone()); store.set('grp_blk', 0); store.set('grp_acc', { acc:0, last:0 });
    if (rest > 0) store.set('grp_pend', pend() + rest);
    return flush(true);
  }

  /* ---------- đọc ---------- */
  async function load(force){
    if (!on() || busy || (!force && Date.now() - loadedAt < 15000)) return; busy = true; renderBox();
    try {
      const d = await ref().get(), x = d.exists ? d.data() : {};
      live = x.live || {}; board = x.board || {}; loadedAt = Date.now(); err = ''; rankWatch();
      const id = state.user.uid, mine = board[id] || live[id], nn = mine && nameOk(mine.n);
      if (nn && !me()) { store.set(key(), { n:nn }); sync(true); }                // đã tham gia ở thiết bị khác của tài khoản này: nhận lại biệt danh, nếu không thiết bị này không báo "đang học" và không cộng phút
      if (live[id] && !want()) clearLive();          // sót lại từ lần đóng web đột ngột
    } catch (e) { errNote(e); }
    busy = false; renderBox();
  }

  /* ---------- hiển thị ---------- */
  const box = () => document.getElementById('grp-box');
  const head = () => `<div class="card-h"><h2>${ic('users', 'sm')} ${esc(t('grp_title'))}</h2></div>`;
  let pvHTML = '', pvLang = '';   // bản xem thử cho khách chưa là Người đồng hành: dữ liệu mẫu nằm trong guide.js (tải riêng, không đọc Firestore)
  function pvFill(){
    const n = document.getElementById('grp-pv'); if (!n || (pvHTML && pvLang === state.lang)) return;
    loadGuide().then(() => { if (typeof EPTour === 'undefined') return; pvHTML = EPTour.preview(); pvLang = state.lang; const m = document.getElementById('grp-pv'); if (m) m.innerHTML = pvHTML; }).catch(() => {});
  }
  function upsell(){
    setTimeout(pvFill, 0);
    return `${head()}<p class="muted">${esc(t('grp_up_text'))}</p>
      <div class="grp-pv" id="grp-pv">${pvLang === state.lang ? pvHTML : ''}</div>
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
  function boardRows(){               // bảng tuần; số phút của chính mình cộng thêm phần đang chờ ghi, nên luôn mới nhất
    const id = state.user.uid, p = me() ? pend() : 0, tms = e => e && e.t && typeof e.t.toMillis === 'function' ? e.t.toMillis() : 0, now = Date.now();
    const o = Object.entries(board).map(([k, e]) => ({ k, n:(e && e.n) || '?', mins:((e && e.mins) | 0) + (k === id ? p : 0), at:k === id && p > 0 ? now : tms(e) }));
    if (p > 0 && !board[id]) o.push({ k:id, n:me().n, mins:p, at:now });
    return o.filter(x => x.mins > 0).sort((a, b) => b.mins - a.mins || a.at - b.at || a.k.localeCompare(b.k));   // cùng số phút: ai đạt trước đứng trên (không còn đổi chỗ lung tung mỗi lần tải lại)
  }
  function boardHTML(){
    const id = state.user.uid, all = boardRows();
    const top = all.slice(0, TOP), mine = all.findIndex(x => x.k === id), row = (x, i) => `<li class="grp-row ${x.k === id ? 'me' : ''}"><span class="grp-rank r${i < 3 ? i + 1 : 0}">${i + 1}</span>${avatar(x.n)}<b class="grp-n">${esc(x.n)}${x.k === id ? ` <span class="badge">${esc(t('grp_you'))}</span>` : ''}</b><span class="grp-t">${esc(fmt(x.mins * 60000))}</span>${kick(x.k)}</li>`;
    const cl = climb(), sum = cl ? `<p class="grp-climb small"><b>${esc(t('grp_rank', { r:cl.r }))}</b>${trendHTML(cl)}<span class="muted">${esc(gapText(cl))}</span></p>` : '';
    return `<h3 class="grp-h">${esc(t('grp_board'))}</h3>${sum}` + (all.length
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
  const rankOf = () => { const id = state.user.uid, all = boardRows(), i = all.findIndex(x => x.k === id); return i < 0 ? null : { r:i + 1, mins:all[i].mins }; };
  /* Leo hạng: hạng hiện tại, tăng/giảm so với lần đầu thấy trong ngày (giờ Việt Nam), và khoảng cách tới người đứng trên (cùng điểm thì ai đạt trước đứng trên, nên cần hơn 1 phút để vượt) */
  function climb(){
    const id = state.user.uid, all = boardRows(), i = all.findIndex(x => x.k === id); if (i < 0) return null;
    const day = DT.now().setZone(TZ).toISODate(); let b = store.get('grp_rk0', null);
    if (!b || b.day !== day || b.id !== id) { b = { day, id, r:i + 1 }; store.set('grp_rk0', b); }
    const me0 = all[i], up = i > 0 ? all[i - 1] : null, dn = i === 0 ? all[1] : null;
    return { r:i + 1, mins:me0.mins, trend:b.r - (i + 1), upN:up && up.n, upM:up ? up.mins - me0.mins + 1 : 0, leadN:dn && dn.n, leadM:dn ? me0.mins - dn.mins : 0 };
  }
  const trendHTML = c => !c ? '' : c.trend > 0 ? `<span class="grp-trend up">${esc(t('grp_trend_up', { n:c.trend }))}</span>` : c.trend < 0 ? `<span class="grp-trend dn">${esc(t('grp_trend_dn', { n:-c.trend }))}</span>` : '';
  const gapText = c => !c ? '' : c.upN ? t('grp_climb_next', { m:fmt(c.upM * 60000), n:c.upN }) : c.leadN ? t('grp_climb_lead', { n:c.leadN, m:fmt(c.leadM * 60000) }) : t('grp_climb_alone');
  function rankWatch(){                  // lên hạng (so với lần thấy trước) thì chúc mừng một lần
    if (!state.user || !me() || !on()) return; const c = rankOf(); if (!c) return;
    const w = wk(), p = store.get('grp_rk', null);
    if (p && p.wk === w && p.id === state.user.uid && c.r < p.r && document.visibilityState === 'visible') toast(t(c.r === 1 ? 'grp_top' : 'grp_moved', { r:c.r }));
    if (!p || p.wk !== w || p.id !== state.user.uid || p.r !== c.r) store.set('grp_rk', { wk:w, id:state.user.uid, r:c.r });
  }
  function renderStrip(){            // dải nhỏ ngay dưới đồng hồ: ai đang học + hạng tuần của mình
    const el = document.getElementById('grp-strip'); if (!el) return;
    if (!state.user || !on()) { el.innerHTML = ''; return; }
    if (!me()) { el.innerHTML = `<button type="button" class="grp-strip-join" data-act="grpGo">${ic('users', 'sm')} ${esc(t('grp_strip_join'))}</button>`; return; }
    const rows = liveRows(), rk = rankOf(), cl = climb();
    el.innerHTML = `<div class="grp-strip"><div class="grp-strip-l"><span class="grp-avs">${rows.slice(0, 5).map(r => avatar(r.n)).join('')}</span><span class="small">${esc(rows.length ? t('grp_strip_n', { n:rows.length }) : t('grp_strip_0'))}</span></div>
      <button type="button" class="grp-strip-r small" data-act="grpGo" title="${esc(gapText(cl))}">${rk ? `<b>${esc(t('grp_rank', { r:rk.r }))}</b> · ${esc(fmt(rk.mins * 60000))}${trendHTML(cl)}` : esc(t('grp_rank_none'))}</button></div>`;
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
  function startTimers(){            // chạy ngay khi group.js được tải (không chờ mở Phòng tập trung): đang học ở trang khác vẫn báo nhịp và cộng phút
    if (!timers) {
      timers = true;
      setInterval(() => { sync(); flush(); }, 30e3);                                                   // báo nhịp + cộng dồn phút đang học + ghi phút còn chờ
      let act = Date.now(), idle = false;                                                              // không đụng vào gì 10 phút (và đồng hồ không chạy) thì ngừng tải lại cho đỡ tốn lượt đọc
      const wake = () => { act = Date.now(); if (idle) { idle = false; if (document.visibilityState === 'visible') load(); } };
      ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(ev => addEventListener(ev, wake, { passive:true, capture:true }));
      setInterval(() => {
        const here = box() || document.getElementById('grp-strip') || document.getElementById('grp-home'); if (!here || document.visibilityState !== 'visible') return;
        if (!pomo.running && Date.now() - act > IDLE) { idle = true; return; }
        if (box() || Date.now() - loadedAt >= POLL_SLOW - 5e3) load();                                  // Phòng tập trung: mỗi 60 giây; Tổng quan: mỗi 3 phút
      }, POLL);
      setInterval(() => { const now = Date.now(); document.querySelectorAll('#grp-box [data-s], #grp-home [data-s]').forEach(e => { e.textContent = fmt(now - +e.dataset.s); }); }, 20e3);
    }
  }
  function mount(){ renderBox(); if (on()) load(true); startTimers(); }
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
  startTimers();
  window.EPGroup = { mount, sync, credit };
})();
