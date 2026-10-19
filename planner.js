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
  pl_review:'This week in numbers', pl_done_tasks:'Tasks done', pl_done_min:'Time done', pl_plan_min:'Time planned', pl_by_day:'By day', pl_by_cat:'By category', pl_left:'Still to do', pl_left_none:'Everything is ticked off. Nice.', pl_carry:'Move the unfinished tasks to next week', pl_carried:'Moved to next week', pl_carried_n:'{n} tasks moved to next week.', pl_uncarry:'Bring back', pl_uncarry_all:'Bring them all back to this week', pl_uncarried_n:'{n} tasks brought back to this week.',
  pl_insights:'What this says about your week', pl_i_none:'Add a few tasks and tick them off to get your weekly review.',
  pl_i_rate_hi:'You finished {p}% of the tasks that were due. That is a strong week.', pl_i_rate_mid:'You finished {p}% of the tasks that were due. A solid base to build on.', pl_i_rate_lo:'You finished {p}% of the tasks that were due. That is okay, every week has slow stretches. Next week, try fewer tasks per day so it is easier to keep the rhythm.',
  pl_i_best:'Your most productive day was {d}, with {t} done.', pl_i_part_0:'You get the most done in the morning.', pl_i_part_1:'You get the most done in the afternoon.', pl_i_part_2:'You get the most done in the evening.',
  pl_i_over:'{d} was planned for {t}. That is a lot; leave some room to rest.', pl_i_left:'{n} tasks (about {t}) from earlier days are not done yet. Move them to today, or delete the ones you no longer need.',
  pl_i_vs_up:'That is {n} points better than last week ({p}%).', pl_i_vs_down:'That is {n} points lower than last week ({p}%). One slow week does not undo your progress.', pl_i_vs_same:'About the same as last week ({p}%).',
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
  pl_review:'Tuần này qua các con số', pl_done_tasks:'Việc đã xong', pl_done_min:'Thời gian đã làm', pl_plan_min:'Thời gian dự định', pl_by_day:'Theo ngày', pl_by_cat:'Theo nhóm', pl_left:'Việc còn lại', pl_left_none:'Tất cả đã được tick xong. Giỏi quá.', pl_carry:'Chuyển các việc chưa xong sang tuần sau', pl_carried:'Đã chuyển sang tuần sau', pl_carried_n:'Đã chuyển {n} việc sang tuần sau.', pl_uncarry:'Đưa về lại', pl_uncarry_all:'Đưa tất cả về lại tuần này', pl_uncarried_n:'Đã đưa {n} việc về lại tuần này.',
  pl_insights:'Tuần này nói gì về bạn', pl_i_none:'Hãy thêm vài việc và tick xong để nhận bản tổng kết tuần.',
  pl_i_rate_hi:'Bạn xong {p}% số việc đã đến hạn. Đây là một tuần rất tốt.', pl_i_rate_mid:'Bạn xong {p}% số việc đã đến hạn. Một nền tảng vững để làm tiếp.', pl_i_rate_lo:'Bạn xong {p}% số việc đã đến hạn. Không sao, tuần nào cũng có lúc chậm. Tuần sau thử xếp ít việc hơn mỗi ngày để dễ giữ nhịp.',
  pl_i_best:'Ngày làm được nhiều nhất là {d}, xong {t}.', pl_i_part_0:'Bạn làm xong nhiều việc nhất vào buổi sáng.', pl_i_part_1:'Bạn làm xong nhiều việc nhất vào buổi chiều.', pl_i_part_2:'Bạn làm xong nhiều việc nhất vào buổi tối.',
  pl_i_over:'{d} xếp tới {t}. Hơi nhiều, nhớ chừa chỗ để nghỉ.', pl_i_left:'Còn {n} việc (khoảng {t}) của những ngày trước chưa xong. Bạn dời sang hôm nay, hoặc xoá bớt việc không còn cần.',
  pl_i_vs_up:'Cao hơn tuần trước {n} điểm ({p}%).', pl_i_vs_down:'Thấp hơn tuần trước {n} điểm ({p}%). Một tuần chậm không làm mất tiến bộ của bạn.', pl_i_vs_same:'Gần bằng tuần trước ({p}%).',
  pl_min:'{m} phút', pl_h:'{h} giờ', pl_hm:'{h} giờ {m} phút', pl_untimed:'(chưa đặt giờ)', pl_until:'Bạn là Companion đến ngày {d}.', pl_max:'Mỗi tuần chứa tối đa {n} việc.', pl_soon:'Quyền Companion của bạn hết hạn ngày {d}. Gia hạn để tiếp tục dùng planner.'
});

Object.assign(I18N.en, {
  pl_today:'Today', pl_next:'Next: {t}', pl_none_today:'Nothing planned for today. Tap an empty spot in today\'s column to add a task.',
  pl_rem_btn:'Remind me before tasks start', pl_rem_on:'Reminders are on', pl_rem_hint:'You get a reminder 10 minutes before a task starts, only while this site is open in your browser.', pl_rem_off:'Reminders off', pl_rem_denied:'Notifications are blocked for this site in your browser settings.', pl_rem_unsup:'This browser does not support notifications.', pl_rem_title:'Planner', pl_rem_test:'Reminders are on.', pl_rem_soon:'{t} starts at {s}', pl_rem_eve:'{n} tasks are still open today.',
  pl_score:'Week score', pl_lv_0:'Getting started', pl_lv_1:'Solid', pl_lv_2:'Great', pl_lv_3:'Outstanding', pl_score_how:'60% tasks done, 25% time done, 15% days with progress',
  pl_trend:'Last 6 weeks', pl_streak:'{n} weeks in a row with 70% or more done', pl_streak_0:'Finish 70% of a week\'s tasks to start a streak.', pl_streak_this:'This week counts once you reach 70%.',
  pl_goal:'Weekly goal', pl_goal_none:'No goal', pl_goal_prog:'{d} of {g} ({p}%)',
  pl_tpl_save:'Save this week as my template', pl_tpl_use:'Use my template for this week', pl_tpl_saved:'Template saved ({n} tasks).', pl_tpl_added:'Added {n} tasks from your template.', pl_tpl_hint:'A template is your usual week. Save it once, then fill any new week with one tap.',
  pl_part_0:'morning', pl_part_1:'afternoon', pl_part_2:'evening', pl_i_partrate:'Your {p} tasks get done most often ({r}%). Plan your important work then.', pl_i_empty:'Nothing planned for {d} yet. Add more whenever you are ready.', pl_i_avg:'Your average over the recent weeks is {p}%.', pl_soon_stats:'In the last weeks you ticked off {n} tasks ({t}). Keep that going.'
});

Object.assign(I18N.vi, {
  pl_today:'Hôm nay', pl_next:'Tiếp theo: {t}', pl_none_today:'Hôm nay chưa có việc. Bấm vào chỗ trống ở cột hôm nay để thêm.',
  pl_rem_btn:'Nhắc tôi trước giờ làm việc', pl_rem_on:'Đang bật nhắc việc', pl_rem_hint:'Bạn được nhắc trước giờ bắt đầu 10 phút, chỉ khi trang web này đang mở trong trình duyệt.', pl_rem_off:'Đã tắt nhắc việc', pl_rem_denied:'Trình duyệt đang chặn thông báo của trang này. Bạn mở lại trong phần cài đặt trình duyệt.', pl_rem_unsup:'Trình duyệt này không hỗ trợ thông báo.', pl_rem_title:'Planner', pl_rem_test:'Đã bật nhắc việc.', pl_rem_soon:'{t} bắt đầu lúc {s}', pl_rem_eve:'Hôm nay còn {n} việc chưa xong.',
  pl_score:'Điểm tuần', pl_lv_0:'Đang khởi động', pl_lv_1:'Ổn định', pl_lv_2:'Rất tốt', pl_lv_3:'Xuất sắc', pl_score_how:'60% số việc xong, 25% thời gian xong, 15% số ngày có tiến triển',
  pl_trend:'6 tuần gần nhất', pl_streak:'{n} tuần liên tiếp xong từ 70% việc trở lên', pl_streak_0:'Xong 70% số việc của một tuần để bắt đầu chuỗi.', pl_streak_this:'Tuần này được tính khi bạn đạt 70%.',
  pl_goal:'Mục tiêu tuần', pl_goal_none:'Chưa đặt', pl_goal_prog:'{d} trên {g} ({p}%)',
  pl_tpl_save:'Lưu tuần này làm tuần mẫu', pl_tpl_use:'Dùng tuần mẫu cho tuần này', pl_tpl_saved:'Đã lưu tuần mẫu ({n} việc).', pl_tpl_added:'Đã thêm {n} việc từ tuần mẫu.', pl_tpl_hint:'Tuần mẫu là tuần quen thuộc của bạn. Lưu một lần, rồi điền đầy tuần mới chỉ bằng một cú bấm.',
  pl_part_0:'buổi sáng', pl_part_1:'buổi chiều', pl_part_2:'buổi tối', pl_i_partrate:'Việc {p} của bạn xong nhiều nhất ({r}%). Hãy xếp việc quan trọng vào lúc đó.', pl_i_empty:'Chưa có kế hoạch cho {d}. Khi nào tiện, bạn xếp thêm nhé.', pl_i_avg:'Trung bình các tuần gần đây của bạn là {p}%.', pl_soon_stats:'Mấy tuần qua bạn đã tick xong {n} việc ({t}). Giữ nhịp này nhé.'
});

Object.assign(I18N.en, {
  pl_i_early:'The week has only just started, so there is no verdict yet. Follow your plan and your review fills in as tasks come due.', pl_score_wait:'No verdict yet: it needs at least 3 tasks that are due or ticked off', pl_prov:'so far',
  pl_dstreak_l:'Active days', pl_dstreak:'{n} days in a row. Resting one day does not break the streak.', pl_dstreak_0:'A day counts when you finish at least one task.',
  pl_dgoal:'Daily goal', pl_dlv_0:'Not started', pl_dlv_1:'Warming up', pl_dlv_2:'Steady', pl_dlv_3:'Great', pl_dlv_4:'Complete',
  pl_dv_empty:'Nothing planned for today. Pick 1 to 3 small tasks, that is enough.', pl_dv_all:'Everything for today is done. You are keeping a great rhythm.', pl_dv_goal:'Daily goal reached. Anything else is a bonus.', pl_dv_start:'Not started yet is fine. Pick the smallest task and do just 10 minutes.', pl_dv_none:'No task ticked today, and that is okay. Do not pile everything onto tomorrow: move only the 1 or 2 that matter most.', pl_dv_some:'{n} of {m} done. Every finished task counts.',
  pl_tip_overdue:'{n} tasks from earlier days are still open. Bring them to today, or delete what you no longer need.', pl_tip_over:'Today is planned for {t}. Pick the 3 most important tasks and do them first; the rest is a bonus.', pl_tip_tm:'Tasks you did not get to can move to tomorrow with one tap.', pl_mv_today:'Move them to today', pl_mv_tm:'Move unfinished to tomorrow', pl_moved:'Moved {n} tasks.',
  pl_up_expired:'Your companion access ended on {d}. Your planner data is kept safely and comes back as soon as you renew.',
  pl_s_vocab:'Review vocabulary', pl_s_listen:'Listening practice', pl_s_read:'Reading task', pl_s_gym:'Workout', pl_s_essay:'Write an essay', pl_s_book:'Read a book', pl_s_meet:'Team meeting', pl_s_speak:'Speaking practice', pl_s_movie:'Watch a movie', pl_s_clean:'Tidy up', pl_s_review:'Weekly review',
  pl_chime_on:'Chime on', pl_chime_off:'Chime off', pl_rem_inpage:'Your browser blocks notifications, so I will remind you inside this page, with a chime. Keep the tab open.', pl_preview:'Preview with sample data', pl_preview_note:'This is how the Planner looks for companions. It is locked until you become a companion.',
  pl_day_empty:'Nothing planned for this day yet.',
  pl_quick_ph:'Quick add: type a task and press Enter (try "19:30 Review vocab")', pl_quick_btn:'Add', pl_tpl_menu:'Weekly template', pl_streak_l:'Streak', pl_streak_u:'weeks at 70% or more', pl_streak_start:'Finish 70% of a week to start one', pl_ana:'Details', pl_still:'Still to do', pl_goal_set:'Goal', pl_now:'Now',
});
Object.assign(I18N.vi, {
  pl_i_early:'Tuần mới bắt đầu nên mình chưa đánh giá vội. Cứ làm theo kế hoạch, bản nhận xét sẽ đầy dần khi các việc đến hạn.', pl_score_wait:'Chưa đánh giá vội: cần ít nhất 3 việc đã đến hạn hoặc đã tick xong', pl_prov:'tạm tính',
  pl_dstreak_l:'Ngày hoạt động', pl_dstreak:'{n} ngày liên tiếp. Nghỉ 1 ngày không làm mất chuỗi.', pl_dstreak_0:'Một ngày được tính khi bạn xong ít nhất 1 việc.',
  pl_dgoal:'Mục tiêu ngày', pl_dlv_0:'Chưa bắt đầu', pl_dlv_1:'Khởi động', pl_dlv_2:'Ổn định', pl_dlv_3:'Rất tốt', pl_dlv_4:'Trọn vẹn',
  pl_dv_empty:'Hôm nay chưa có việc. Chọn 1 đến 3 việc nhỏ là đủ rồi.', pl_dv_all:'Xong hết việc hôm nay. Bạn đang giữ nhịp rất tốt.', pl_dv_goal:'Đã đạt mục tiêu ngày. Phần làm thêm là cộng thêm.', pl_dv_start:'Chưa bắt đầu cũng không sao. Chọn việc nhỏ nhất và làm 10 phút thôi.', pl_dv_none:'Hôm nay chưa tick được việc nào, không sao cả. Đừng dồn hết sang ngày mai: chỉ dời 1 đến 2 việc quan trọng nhất.', pl_dv_some:'Đã xong {n}/{m} việc. Việc nào xong cũng được tính.',
  pl_tip_overdue:'Còn {n} việc của những ngày trước chưa xong. Đưa về hôm nay, hoặc xoá bớt việc không còn cần.', pl_tip_over:'Hôm nay xếp tới {t}. Chọn 3 việc quan trọng nhất làm trước, phần còn lại là cộng thêm.', pl_tip_tm:'Việc chưa kịp làm có thể dời sang ngày mai chỉ với một cú bấm.', pl_mv_today:'Dời về hôm nay', pl_mv_tm:'Dời việc chưa xong sang mai', pl_moved:'Đã dời {n} việc.',
  pl_up_expired:'Quyền Companion của bạn đã hết hạn ngày {d}. Dữ liệu Planner vẫn được giữ nguyên và sẽ hiện lại ngay khi bạn gia hạn.',
  pl_s_vocab:'Ôn từ vựng', pl_s_listen:'Luyện nghe', pl_s_read:'Làm bài đọc', pl_s_gym:'Tập thể dục', pl_s_essay:'Viết bài luận', pl_s_book:'Đọc sách', pl_s_meet:'Họp nhóm', pl_s_speak:'Luyện nói', pl_s_movie:'Xem phim', pl_s_clean:'Dọn dẹp', pl_s_review:'Tổng kết tuần',
  pl_chime_on:'Chuông: bật', pl_chime_off:'Chuông: tắt', pl_rem_inpage:'Trình duyệt đang chặn thông báo, nên mình sẽ nhắc ngay trong trang và có chuông. Bạn để tab này mở nhé.', pl_preview:'Xem trước với dữ liệu mẫu', pl_preview_note:'Đây là giao diện Planner dành cho Companions. Planner bị khoá cho đến khi bạn trở thành Companion.',
  pl_day_empty:'Ngày này chưa có việc nào.',
  pl_quick_ph:'Thêm nhanh: gõ việc rồi bấm Enter (ví dụ "19:30 Ôn từ vựng")', pl_quick_btn:'Thêm', pl_tpl_menu:'Tuần mẫu', pl_streak_l:'Chuỗi tuần', pl_streak_u:'tuần liên tiếp xong từ 70%', pl_streak_start:'Xong 70% việc của một tuần để bắt đầu', pl_ana:'Chi tiết', pl_still:'Việc chưa xong', pl_goal_set:'Mục tiêu', pl_now:'Bây giờ',
});

const PL_MAX = 300;                                              // số việc tối đa mỗi tuần (giữ tài liệu nhỏ, tránh lỗi quá cỡ)
const PL_HOUR = 44;                                              // px cho mỗi giờ trong lưới
const PL_COLORS = ['#f2b8c6', '#c9b8ec', '#f6c9a0', '#f4e08c', '#a9dcc6', '#a8cdee'];   // 6 nhóm: màu pastel, chữ tối cho mọi giao diện
const PL = { off:0, key:'', tasks:null, state:'idle', save:'', prev:null, timer:0, sel:null, seq:0, slow:false, hist:{}, prefs:null, remTasks:null, sent:{}, remT:0, mday:null };
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
  return { id:String(x.id || plId()), title:String(x.title || '').trim().slice(0, 80), day, start:day === null ? '' : start, dur, c:Math.max(0, Math.min(5, x.c | 0)), done:!!x.done, ...(x.carried ? { carried:typeof x.carried === 'string' ? x.carried : true } : {}) };
}
/* đưa việc đã dời sang tuần sau về lại tuần này (và gỡ bản sao bên tuần sau nếu chưa làm) */
async function plUncarry(list){
  try {
    if (!DEMO) {
      const nk = plKey(PL.off + 1), d = await plRef(nk).get(), next = d.exists && Array.isArray(d.data().tasks) ? d.data().tasks.map(plClean) : [];
      list.forEach(x => {
        let i = typeof x.carried === 'string' ? next.findIndex(v => v.id === x.carried) : next.findIndex(v => !v.done && v.title === x.title && v.day === x.day && v.start === x.start && v.dur === x.dur);
        if (i >= 0) { if (next[i].done) x.done = true; next.splice(i, 1); }
      });
      await plRef(nk).set({ tasks:next, updatedAt:TS() });
    }
    list.forEach(x => { delete x.carried; }); plSave(); return true;
  } catch (e) { console.warn('uncarry', e.code); toast(t('pl_err')); return false; }
}
/* ---------- cầu nối với Phòng tập trung (Focus): xem / tick / thêm việc hôm nay mà không cần mở Planner ---------- */
const plToday0 = () => DT.now().setZone(userTZ).weekday - 1;
async function plWeek0(){                                         // việc của tuần này; dùng chung mảng với PL khi Planner đang giữ đúng tuần này
  if (PL.tasks && PL.key === plKey(0)) return PL.tasks;
  if (DEMO) return null;
  return (await plFetch(plKey(0))).map(plClean);
}
async function plTodayList(){ const l = await plWeek0(); return l ? l.filter(x => x.day === plToday0()).sort((a, b) => (a.start || '99').localeCompare(b.start || '99')) : []; }
async function plFocusEdit(fn){                                   // fn(tasks) sửa mảng và trả true nếu có đổi; trả true khi đã lưu xong
  try {
    const key = plKey(0), live = !!(PL.tasks && PL.key === key), tasks = await plWeek0(); if (!tasks || !fn(tasks)) return false;
    if (live) plSave();
    else { PL.pre = null; plCache(key, tasks); if (state.user) PL.remTasks = { uid:state.user.uid, tasks }; if (!DEMO) await plRef(key).set({ tasks:tasks.map(plClean), updatedAt:TS() }); }
    return true;
  } catch (e) { console.warn('focus-planner', e.code); return false; }
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
  pre.p.then(tasks => { plCache(key, tasks); PL.remTasks = { uid:pre.uid, tasks }; plRemStart(); }).catch(() => { if (PL.pre === pre) PL.pre = null; });
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
    if (!PL.save) { PL.tasks = tasks.map(plClean); plCache(key, tasks); PL.hist[key] = plStats(PL.tasks, PL.off); if (key === plKey(0)) PL.remTasks = { uid:state.user.uid, tasks:PL.tasks }; }      // bạn đã sửa trong lúc chờ thì giữ bản của bạn
    PL.state = 'ready'; PL.slow = false;
    if (!DEMO) { plHist(); plPrefs(); } else if (!PL.prefs) PL.prefs = {};
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
    if (!PL.tasks) return; const key = PL.key, tasks = PL.tasks.map(plClean); plCache(key, tasks); PL.hist[key] = plStats(tasks, PL.off); if (key === plKey(0)) PL.remTasks = { uid:state.user.uid, tasks };
    try { if (!DEMO) await plRef(key).set({ tasks, updatedAt:TS() }); if (PL.key === key) PL.save = 'saved'; }
    catch (e) { console.warn('planner save', e.code); PL.save = 'error'; toast(t('pl_err')); }
    const n = $('pl-status'); if (n) n.textContent = PL.save === 'saved' ? '✓ ' + t('pl_saved') : PL.save === 'error' ? t('pl_err') : t('pl_saving');
  }, 500);
  const n = $('pl-status'); if (n) n.textContent = t('pl_saving');
}
/* ---------- thống kê & nhận xét ---------- */
/* "Đến hạn": chỉ chấm những việc đã tới lúc phải xong. Tuần đã qua = tất cả; tuần này = việc của các ngày trước và việc hôm nay đã quá giờ (việc đã tick luôn được tính); tuần sau = chỉ việc đã tick. Việc ở ngày chưa tới không bị tính là "chưa làm". */
function plDueFn(off){
  const now = DT.now().setZone(userTZ), di = now.weekday - 1, m = now.hour * 60 + now.minute;
  return x => off < 0 || x.done || (off === 0 && x.day !== null && (x.day < di || (x.day === di && !!x.start && hm(x.start) + (x.dur || 0) <= m)));
}
function plStats(tasks, off = -1){
  const due = plDueFn(off), blank = () => ({ plan:0, done:0, n:0, nd:0, dn:0, dnd:0 });
  const S = { n:tasks.length, nd:tasks.filter(x => x.done).length, plan:0, done:0, dn:0, dnd:0, dplan:0, ddone:0, day:Array.from({ length:7 }, blank), cat:Array.from({ length:6 }, blank), part:[0, 0, 0], pn:[0, 0, 0], pd:[0, 0, 0] };
  tasks.forEach(x => {
    S.plan += x.dur; if (x.done) S.done += x.dur;
    const c = S.cat[x.c]; c.n++; c.plan += x.dur; if (x.done) { c.nd++; c.done += x.dur; }
    const isDue = due(x); if (isDue) { S.dn++; S.dplan += x.dur; if (x.done) { S.dnd++; S.ddone += x.dur; } }
    if (x.day !== null) { const dd = S.day[x.day]; dd.plan += x.dur; dd.n++; if (x.done) { dd.done += x.dur; dd.nd++; } if (isDue) { dd.dn++; if (x.done) dd.dnd++; } }
    if (x.start) { const pi = hm(x.start) < 720 ? 0 : hm(x.start) < 1080 ? 1 : 2; S.pn[pi]++; if (x.done) S.pd[pi]++; }
    if (x.done && x.start) S.part[hm(x.start) < 720 ? 0 : hm(x.start) < 1080 ? 1 : 2] += x.dur || 1;
  });
  S.rate = S.dn ? Math.round(S.dnd / S.dn * 100) : 0;
  return S;
}
const plOverdue = () => PL.off > 0 || !PL.tasks ? [] : PL.tasks.filter(x => !x.done && !x.carried && (PL.off < 0 || (x.day !== null && x.day < DT.now().setZone(userTZ).weekday - 1)));
function plInsights(S){
  if (!S.n) return [t('pl_i_none')];
  const out = [], early = S.dn < 3, di = DT.now().setZone(userTZ).weekday - 1;
  if (early) out.push(t('pl_i_early'));
  else {
    out.push(t(S.rate >= 80 ? 'pl_i_rate_hi' : S.rate >= 50 ? 'pl_i_rate_mid' : 'pl_i_rate_lo', { p:S.rate }));
    if (PL.prev && PL.prev.dn >= 3) { const dlt = S.rate - PL.prev.rate; out.push(t(dlt > 3 ? 'pl_i_vs_up' : dlt < -3 ? 'pl_i_vs_down' : 'pl_i_vs_same', { n:Math.abs(dlt), p:PL.prev.rate })); }
  }
  const bi = S.day.reduce((b, d, i) => d.done > S.day[b].done ? i : b, 0); if (S.day[bi].done > 0) out.push(t('pl_i_best', { d:t('pl_d' + bi), t:fmtMin(S.day[bi].done) }));
  const pm = Math.max(...S.part); if (pm > 0 && S.dnd >= 3) out.push(t('pl_i_part_' + S.part.indexOf(pm)));
  const pr = S.pn.map((n, i) => n >= 3 ? Math.round(S.pd[i] / n * 100) : -1), pm2 = Math.max(...pr);
  if (!early && pm2 > 0 && pr.filter(v => v >= 0).length >= 2) out.push(t('pl_i_partrate', { p:t('pl_part_' + pr.indexOf(pm2)), r:pm2 }));
  const earlier = [1, 2, 3].map(i => PL.hist[plKey(PL.off - i)]).filter(x => x && x.dn >= 3); if (!early && earlier.length >= 2) out.push(t('pl_i_avg', { p:Math.round(earlier.reduce((a, x) => a + x.rate, 0) / earlier.length) }));
  const empty = S.day.map((d, i) => d.n === 0 && (PL.off > 0 || (PL.off === 0 && i >= di)) ? i : -1).filter(i => i >= 0); if (S.n >= 1 && empty.length && empty.length < 7) out.push(t('pl_i_empty', { d:empty.map(i => t('pl_d' + i)).join(', ') }));
  S.day.forEach((d, i) => { if (d.plan > 600) out.push(t('pl_i_over', { d:t('pl_d' + i), t:fmtMin(d.plan) })); });
  const left = plOverdue(); if (left.length) out.push(t('pl_i_left', { n:left.length, t:fmtMin(left.reduce((a, x) => a + x.dur, 0)) }));
  return out;
}

/* ---------- lịch sử tuần, điểm, chuỗi, mục tiêu, tuần mẫu ---------- */
async function plHist(){                                          // đọc 7 tuần trước để vẽ xu hướng, tính chuỗi tuần và so sánh (mỗi tuần chỉ đọc một lần)
  const base = PL.off, key = PL.key;
  await Promise.all(Array.from({ length:7 }, (_, i) => base - 1 - i).map(async o => {
    const k = plKey(o); if (k in PL.hist) return;
    try { const d = await plRef(k).get(); PL.hist[k] = d.exists && Array.isArray(d.data().tasks) ? plStats(d.data().tasks.map(plClean), o) : null; } catch (e) { /* chưa biết: bỏ qua */ }
  }));
  if (PL.key === key) { PL.prev = PL.hist[plKey(base - 1)] || null; render(true); }
}
async function plPrefs(){                                         // goalMin + template nằm ở users/<uid>/planner/_prefs
  if (PL.prefs || PL.prefsLoading) return; PL.prefsLoading = true;
  try { const d = await plRef('_prefs').get(); PL.prefs = d.exists ? d.data() : {}; } catch (e) { PL.prefs = {}; }
  PL.prefsLoading = false; render(true);
}
const plSavePrefs = patch => { PL.prefs = { ...(PL.prefs || {}), ...patch }; if (!DEMO) plRef('_prefs').set(patch, { merge:true }).catch(e => { console.warn('planner prefs', e.code); toast(t('pl_err')); }); };
function plScore(S){                                              // 0-100 trên các việc đã đến hạn: 60% số việc xong, 25% thời gian xong, 15% số ngày có tiến triển. Chưa đủ 3 việc đến hạn thì chưa chấm.
  if (S.dn < 3) return null;
  const timeR = S.dplan ? Math.min(100, S.ddone / S.dplan * 100) : S.rate, dn = S.day.filter(d => d.dn > 0), cons = dn.length ? dn.filter(d => d.dnd > 0).length / dn.length * 100 : 0;
  return Math.round(S.rate * .6 + timeR * .25 + cons * .15);
}
function plDayStreak(S){                                          // số ngày liên tiếp có ít nhất 1 việc xong; nghỉ 1 ngày không mất chuỗi, nghỉ 2 ngày liền thì dừng; hôm nay chưa làm cũng chưa bị tính là nghỉ
  const di = DT.now().setZone(userTZ).weekday - 1, days = S.day.slice(0, di + 1).map(d => d.nd > 0).reverse();
  for (let i = 1; i <= 4; i++) { const h = PL.hist[plKey(-i)]; days.push(...(h ? h.day.map(d => d.nd > 0) : Array(7).fill(false)).reverse()); }
  let n = 0, miss = 0; for (let i = 0; i < days.length; i++) { if (days[i]) { n++; miss = 0; } else if (i > 0 && ++miss >= 2) break; }
  return n;
}
function plRecent(){                                              // tổng việc/thời gian đã xong trong tuần này và 3 tuần trước (cho lời nhắc gia hạn)
  if (PL.off !== 0 || !PL.tasks) return null;
  const all = [plStats(PL.tasks, 0), ...[1, 2, 3].map(i => PL.hist[plKey(-i)]).filter(Boolean)];
  return { n:all.reduce((a, x) => a + x.nd, 0), t:all.reduce((a, x) => a + x.done, 0) };
}
function plTrend(){
  const bars = Array.from({ length:6 }, (_, i) => { const k = PL.off - 5 + i, S = k === PL.off ? plStats(PL.tasks, PL.off) : PL.hist[plKey(k)]; return { cur:k === PL.off, w:plWeekStart(k).toFormat('dd/MM'), r:S && S.dn >= (k === 0 ? 3 : 1) ? S.rate : null }; });
  return `<div class="pl-trend">${bars.map(b => `<div class="${b.cur ? 'cur' : ''}"><i style="height:${b.r === null ? 3 : Math.max(6, b.r)}%" class="${b.r === null ? 'none' : ''}"></i><b>${b.r === null ? '–' : b.r + '%'}</b><small>${b.w}</small></div>`).join('')}</div>`;
}
/* ---------- nhắc việc (Notification của trình duyệt, chỉ chạy khi trang đang mở) ---------- */
const plRemOn = () => !!store.get('pl_rem', false);                 // nhắc ngay trong trang (toast + chuông); thông báo của trình duyệt chỉ thêm vào khi đã cho phép
const plChimeOn = () => store.get('pl_chime', true) !== false;
function plChime(){                                                 // chuông 2 tiếng tự tạo bằng Web Audio (không cần file âm thanh)
  if (!plChimeOn() || typeof audio !== 'function') return;
  const a = audio(); if (!a) return;
  [0, .55].forEach(d => [[880, .22], [1318, .09], [1760, .04]].forEach(([f, v]) => { const o = a.createOscillator(), g = a.createGain(), at = a.currentTime + d; o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(v, at + .01); g.gain.exponentialRampToValueAtTime(.0008, at + 1.1); o.connect(g); g.connect(a.destination); o.start(at); o.stop(at + 1.2); }));
}
function plRemTick(){
  const u = state.user; if (!u || !plAccess() || !plRemOn()) return;
  const tasks = PL.key === plKey(0) && PL.tasks && PL.uid === u.uid ? PL.tasks : (PL.remTasks && PL.remTasks.uid === u.uid ? PL.remTasks.tasks : null); if (!tasks) return;
  const now = DT.now().setZone(userTZ), di = now.weekday - 1, mins = now.hour * 60 + now.minute, day = now.toISODate(), say = (title, body) => { try { if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification(title, { body, silent:true }); } catch (e) {} toast(body); plChime(); };
  tasks.forEach(x => { if (x.done || x.day !== di || !x.start) return; const st = hm(x.start), k = x.id + day; if (mins >= st - 10 && mins < st + 5 && !PL.sent[k]) { PL.sent[k] = 1; say(t('pl_rem_title'), t('pl_rem_soon', { t:x.title || '—', s:x.start })); } });
  const left = tasks.filter(x => !x.done && x.day === di).length;
  if (mins >= 1200 && mins < 1260 && left && !PL.sent['eve' + day]) { PL.sent['eve' + day] = 1; say(t('pl_rem_title'), t('pl_rem_eve', { n:left })); }
}
const plRemStart = () => { if (!PL.remT && plRemOn()) PL.remT = setInterval(plRemTick, 30000); };
/* ---------- giao diện ---------- */
function plPreview(){                                              // giao diện thật với dữ liệu mẫu, chỉ để xem (dùng cho người chưa là Companion)
  const sample = [[0, '07:30', 45, 'vocab', 0], [0, '19:30', 60, 'listen', 0], [1, '09:00', 90, 'read', 0], [1, '18:00', 45, 'gym', 2], [2, '08:00', 120, 'essay', 1], [2, '20:00', 40, 'book', 3], [3, '07:30', 45, 'vocab', 0], [3, '14:00', 60, 'meet', 1], [4, '09:00', 60, 'speak', 0], [4, '19:00', 90, 'movie', 4], [5, '10:00', 60, 'clean', 5], [5, '15:00', 90, 'read', 0], [6, '09:00', 45, 'review', 0]];
  const di = DT.now().setZone(userTZ).weekday - 1, bak = { ...PL };
  try {
    PL.off = 0; PL.prefs = { goalMin:600, dayGoalMin:120 }; PL.prev = null; PL.hist = {};
    PL.tasks = sample.map(([day, start, dur, k, c], i) => ({ id:'s' + i, title:t('pl_s_' + k), day, start, dur, c, done:day < 4 && i !== 3 }));
    [8, 7, 9, 6, 7].forEach((r, i) => { PL.hist[plKey(-1 - i)] = plStats(Array.from({ length:10 }, (_, j) => ({ id:'h' + j, title:'x', day:j % 5, start:'09:00', dur:60, c:j % 4, done:j < r })), -1); });
    const S = plStats(PL.tasks, -1);
    return `${plKpis(S)}<div class="pl-main"><div class="card pad pl-gridcard">${plGrid()}</div>${plSide()}</div>${plAnalysis(S)}`;
  } finally { Object.keys(PL).forEach(k => delete PL[k]); Object.assign(PL, bak); }
}
function plUpsell(){
  const login = !state.user;
  return `${head('pl_title', '', '', 'moonwalk', 4)}<section class="card pad stack" style="max-width:640px"><div class="row"><span class="badge">${ic('heart', 'sm')} ${esc(t('comp_badge'))}</span></div>
    <h2 style="font-size:1.3rem">${esc(t('pl_up_title'))}</h2><p class="muted">${esc(login ? t('pl_up_login') : state.companionUntil ? t('pl_up_expired', { d:state.companionUntil }) : t('pl_up_text'))}</p>
    ${login ? `<a class="btn primary" href="#/account">${esc(t('club_login_btn'))}</a>` : `${compClaimHTML()}<a class="btn secondary" href="#/donate">${esc(t('pl_up_cta'))}</a>`}</section>
    <div class="pl-previewhead"><span class="badge">${ic('lock', 'sm')} ${esc(t('pl_preview'))}</span><small class="faint">${esc(t('pl_preview_note'))}</small></div>
    <div class="pl-locked" inert aria-hidden="true">${plPreview()}</div>`;
}
function plAgenda(){                                              // điện thoại: danh sách từng ngày thay cho lưới 7 cột (CSS chỉ hiện một trong hai)
  const ws = plWeekStart(PL.off), today = DT.now().setZone(userTZ), ti = PL.off === 0 ? today.weekday - 1 : 0, di = PL.mday === null || PL.mday === undefined ? ti : PL.mday;
  const tabs = Array.from({ length:7 }, (_, i) => { const n = PL.tasks.filter(x => x.day === i).length; return `<button type="button" class="pl-dt ${i === di ? 'on' : ''} ${PL.off === 0 && i === ti ? 'today' : ''}" data-act="plMday" data-d="${i}"><b>${esc(t('pl_d' + i))}</b><small>${ws.plus({ days:i }).toFormat('dd')}</small><i class="${n ? 'has' : ''}"></i></button>`; }).join('');
  const list = PL.tasks.filter(x => x.day === di).sort((a, b) => (a.start || '99:99').localeCompare(b.start || '99:99') || a.title.localeCompare(b.title));
  const row = x => `<div class="pl-ag ${x.done ? 'done' : ''}" data-act="plEdit" data-id="${esc(x.id)}"><button type="button" class="pl-ck sm" style="border-color:${PL_COLORS[x.c]}" data-act="plToggle" data-id="${esc(x.id)}" aria-label="${esc(t('pl_f_done'))}">${x.done ? ic('check', 'sm') : ''}</button><span class="pl-agc" style="background:${PL_COLORS[x.c]}"></span><div><b>${esc(x.title || '—')}</b><small>${x.start ? esc(x.start) + '–' + esc(hmStr(hm(x.start) + (x.dur || 0))) : esc(t('pl_allday'))}${x.dur && !x.start ? ' · ' + esc(fmtMin(x.dur)) : ''}</small></div></div>`;
  return `<div class="pl-agenda"><div class="pl-dtabs">${tabs}</div><div class="pl-aglist">${list.length ? list.map(row).join('') : `<p class="muted small">${esc(t('pl_day_empty'))}</p>`}</div><button type="button" class="btn secondary" data-act="plNew" data-day="${di}">${ic('plus', 'sm')} ${esc(t('pl_add'))}</button></div>`;
}
function plGrid(){
  const tasks = PL.tasks, ws = plWeekStart(PL.off), nowDT = DT.now().setZone(userTZ), today = nowDT.toISODate(), nowM = nowDT.hour * 60 + nowDT.minute;
  const timed = tasks.filter(x => x.day !== null && x.start);
  const g0 = Math.max(0, Math.min(7, ...timed.map(x => Math.floor(hm(x.start) / 60)))), g1 = Math.min(24, Math.max(21, ...timed.map(x => Math.ceil((hm(x.start) + x.dur) / 60))));
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
      col:`<div class="pl-col ${isToday ? 'today' : ''}" data-act="plNew" data-day="${di}" data-g0="${g0}" style="height:${hours.length * PL_HOUR}px">${timed.filter(x => x.day === di).map(block).join('')}${isToday && nowM >= g0 * 60 && nowM < g1 * 60 ? `<i class="pl-now" style="top:${(nowM - g0 * 60) / 60 * PL_HOUR}px"></i>` : ''}</div>` };
  });
  return `${plAgenda()}<div class="pl-scroll"><div class="pl-grid"><div class="pl-corner"></div>${cols.map(c => c.head).join('')}
    <div class="pl-corner"></div>${cols.map(c => c.strip).join('')}
    <div class="pl-hours">${hours.map(h => `<div style="height:${PL_HOUR}px">${String(h).padStart(2, '0')}:00</div>`).join('')}</div>${cols.map(c => c.col).join('')}</div></div>`;
}
const plBar = (a, b, color) => `<div class="pl-bar"><i style="width:${b ? Math.min(100, a / b * 100) : 0}%;background:${color || 'var(--accent)'}"></i></div>`;

function plToday(){
  if (PL.off !== 0) return '';
  const now = DT.now().setZone(userTZ), di = now.weekday - 1, mins = now.hour * 60 + now.minute;
  const list = PL.tasks.filter(x => x.day === di).sort((a, b) => (a.start || '99:99').localeCompare(b.start || '99:99')), nd = list.filter(x => x.done).length, undone = list.filter(x => !x.done);
  const planMin = list.reduce((a, x) => a + x.dur, 0), doneMin = list.reduce((a, x) => a + (x.done ? x.dur : 0), 0), goal = PL.prefs && PL.prefs.dayGoalMin || 0, frac = goal ? doneMin / goal : list.length ? nd / list.length : 0;
  const next = list.find(x => !x.done && x.start && hm(x.start) + (x.dur || 0) >= mins);
  const verdict = !list.length ? t('pl_dv_empty') : nd === list.length ? t('pl_dv_all') : goal && doneMin >= goal ? t('pl_dv_goal') : nd === 0 ? t(now.hour < 17 ? 'pl_dv_start' : 'pl_dv_none') : t('pl_dv_some', { n:nd, m:list.length });
  const over = plOverdue(), tip = over.length ? { k:t('pl_tip_overdue', { n:over.length }), act:'plMoveToday', btn:t('pl_mv_today') } : planMin > 360 && undone.length ? { k:t('pl_tip_over', { t:fmtMin(planMin) }) } : undone.length && now.hour >= 18 && di < 6 ? { k:t('pl_tip_tm'), act:'plMoveTomorrow', btn:t('pl_mv_tm') } : null;
  const row = x => `<div class="pl-li ${x.done ? 'done' : ''}"><button type="button" class="pl-ck sm" style="border-color:${PL_COLORS[x.c]}" data-act="plToggle" data-id="${esc(x.id)}">${x.done ? ic('check', 'sm') : ''}</button><span data-act="plEdit" data-id="${esc(x.id)}">${esc(x.title || '—')}${x.start ? ` <small class="faint">${esc(x.start)}</small>` : ''}</span></div>`;
  const rem = plRemOn() ? `<div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn ghost sm" data-act="plRem">${ic('bell', 'sm')} ${esc(t('pl_rem_on'))}</button><button type="button" class="btn ghost sm" data-act="plChimeTog">${ic('volume', 'sm')} ${esc(t(plChimeOn() ? 'pl_chime_on' : 'pl_chime_off'))}</button></div>` : `<button type="button" class="btn secondary sm" data-act="plRem">${ic('bell', 'sm')} ${esc(t('pl_rem_btn'))}</button><p class="small faint" style="margin-top:6px">${esc(t('pl_rem_hint'))}</p>`;
  const goalSel = `<select class="select" data-change="plDayGoal" aria-label="${esc(t('pl_dgoal'))}" style="width:auto;padding:3px 8px;font-size:.8rem">${[0, 30, 60, 90, 120, 180, 240].map(m => `<option value="${m}" ${goal === m ? 'selected' : ''}>${m ? fmtMin(m) : t('pl_goal_none')}</option>`).join('')}</select>`;
  return `<section class="card pad"><div class="row between"><h3>${esc(t('pl_today'))}</h3>${list.length ? `<span class="badge">${esc(t('pl_dlv_' + (frac >= 1 ? 4 : frac >= .6 ? 3 : frac >= .3 ? 2 : frac > 0 ? 1 : 0)))}</span>` : ''}</div>
    <div class="row between" style="margin:8px 0 6px"><small class="faint">${nd}/${list.length}${goal ? ' · ' + esc(fmtMin(doneMin)) + ' / ' + esc(fmtMin(goal)) : ''}</small></div>${plBar(goal ? doneMin : nd, goal || list.length)}
    <p class="small" style="margin:10px 0 4px"><b>${esc(verdict)}</b></p>
    ${next ? `<p class="small muted" style="margin:0 0 4px">${esc(t('pl_next', { t:next.start + ' ' + (next.title || '—') }))}</p>` : ''}
    ${list.length ? `<div style="margin-top:6px">${list.map(row).join('')}</div>` : ''}
    ${tip ? `<div class="pl-tip"><p class="small">${esc(tip.k)}</p>${tip.act ? `<button type="button" class="btn secondary sm" data-act="${tip.act}">${esc(tip.btn)}</button>` : ''}</div>` : ''}
    <div class="row between" style="margin-top:12px"><span class="small faint">${esc(t('pl_dgoal'))}</span>${goalSel}</div><div style="margin-top:10px">${rem}</div></section>`;
}
function plKpis(S){
  const sc = plScore(S), goal = PL.prefs && PL.prefs.goalMin || 0, lv = sc === null ? '' : t('pl_lv_' + (sc >= 85 ? 3 : sc >= 70 ? 2 : sc >= 50 ? 1 : 0)) + (PL.off === 0 ? ' · ' + t('pl_prov') : '');
  const active = S.day.filter(d => d.nd > 0).length, ds = PL.off === 0 ? plDayStreak(S) : 0;
  const goalSel = `<select class="select" data-change="plGoal" aria-label="${esc(t('pl_goal'))}">${[0, 5, 10, 15, 20, 30, 40].map(h => `<option value="${h * 60}" ${goal === h * 60 ? 'selected' : ''}>${h ? t('pl_h', { h }) : t('pl_goal_none')}</option>`).join('')}</select>`;
  return `<div class="pl-kpis4">
    <div class="pl-kpi" title="${esc(t('pl_score_how'))}"><span class="pl-kl">${esc(t('pl_score'))}</span><b>${sc === null ? '–' : sc}</b><small>${esc(sc !== null ? lv : S.n ? t('pl_score_wait') : t('pl_i_none'))}</small></div>
    <div class="pl-kpi"><span class="pl-kl">${esc(t('pl_done_tasks'))}</span><b>${S.nd}<em>/${S.n}</em></b>${plBar(S.nd, S.n)}</div>
    <div class="pl-kpi"><span class="pl-kl">${esc(t('pl_done_min'))}</span><b>${esc(fmtMin(S.done))}</b>${goal ? `${plBar(S.done, goal)}<small>${esc(t('pl_goal_prog', { d:fmtMin(S.done), g:fmtMin(goal), p:Math.min(999, Math.round(S.done / goal * 100)) }))}</small>` : `<small>${esc(t('pl_plan_min'))}: ${esc(fmtMin(S.plan))}</small>`}<div class="pl-goal"><span>${esc(t('pl_goal_set'))}</span>${goalSel}</div></div>
    <div class="pl-kpi"><span class="pl-kl">${esc(t('pl_dstreak_l'))}</span><b>${active}<em>/7</em></b><small>${esc(ds >= 2 ? t('pl_dstreak', { n:ds }) : t('pl_dstreak_0'))}</small></div></div>`;
}
function plQuickBar(){
  const tpl = PL.prefs && PL.prefs.template || [];
  return `<div class="pl-tools"><form class="pl-quick" data-form="plQuick" autocomplete="off"><input class="input" id="pl-quick" maxlength="80" placeholder="${esc(t('pl_quick_ph'))}" aria-label="${esc(t('pl_quick_btn'))}"><button class="btn secondary" type="submit">${ic('plus', 'sm')} ${esc(t('pl_quick_btn'))}</button></form>
    <details class="pl-menu"><summary class="btn ghost">${esc(t('pl_tpl_menu'))}</summary><div class="pl-pop card"><p class="small faint">${esc(t('pl_tpl_hint'))}</p><button type="button" class="btn secondary sm" data-act="plTplSave">${esc(t('pl_tpl_save'))}</button>${tpl.length ? `<button type="button" class="btn secondary sm" data-act="plTplUse">${esc(t('pl_tpl_use'))} (${tpl.length})</button>` : ''}</div></details></div>`;
}
function plSide(){
  const left = PL.tasks.filter(x => !x.done), open = left.filter(x => !x.carried), noDay = PL.tasks.filter(x => x.day === null);
  const row = x => `<div class="pl-li ${x.carried ? 'done' : ''}"><button type="button" class="pl-ck sm" style="border-color:${PL_COLORS[x.c]}" data-act="plToggle" data-id="${esc(x.id)}">${x.done ? ic('check', 'sm') : ''}</button><span data-act="plEdit" data-id="${esc(x.id)}">${esc(x.title || '—')}${x.day !== null ? ` <small class="faint">${esc(t('pl_d' + x.day))}${x.start ? ' ' + esc(x.start) : ''}</small>` : ''}</span>${x.carried ? `<div class="pl-li-x"><small class="faint">${esc(t('pl_carried'))}</small><button type="button" class="btn ghost sm" data-act="plUncarry" data-id="${esc(x.id)}">${esc(t('pl_uncarry'))}</button></div>` : ''}</div>`;
  return `<div class="pl-side">${plToday()}
    <section class="card pad"><h3>${esc(t('pl_still'))}</h3><div class="pl-list">${left.length ? left.map(row).join('') : `<p class="muted small">${esc(t('pl_left_none'))}</p>`}</div>${open.length ? `<button class="btn secondary sm mt-s" data-act="plCarry">${esc(t('pl_carry'))}</button>` : ''}${left.length - open.length > 1 ? `<button class="btn ghost sm mt-s" data-act="plUncarry">${esc(t('pl_uncarry_all'))}</button>` : ''}</section>
    ${noDay.length ? `<section class="card pad"><h3>${esc(t('pl_week_list'))}</h3><div class="pl-list">${noDay.map(row).join('')}</div></section>` : ''}</div>`;
}
function plAnalysis(S){
  const mx = Math.max(60, ...S.day.map(x => x.plan));
  return `<h2 class="pl-h2">${esc(t('pl_ana'))}</h2><div class="pl-ana">
    <section class="card pad"><h3>${esc(t('pl_trend'))}</h3>${plTrend()}</section>
    <section class="card pad"><h3>${esc(t('pl_by_day'))}</h3>${S.day.map((d, i) => `<div class="pl-row"><span>${esc(t('pl_d' + i))}</span><div class="pl-bar tall"><i class="lt" style="width:${Math.min(100, d.plan / mx * 100)}%"></i><i style="width:${Math.min(100, d.done / mx * 100)}%"></i></div><small class="faint">${esc(fmtMin(d.done))} / ${esc(fmtMin(d.plan))}</small></div>`).join('')}</section>
    <section class="card pad"><h3>${esc(t('pl_by_cat'))}</h3>${S.n ? S.cat.map((c, i) => c.n ? `<div class="pl-row"><span><i class="dot" style="background:${PL_COLORS[i]}"></i> ${esc(t('pl_c' + i))}</span>${plBar(c.nd, c.n, PL_COLORS[i])}<small class="faint">${c.nd}/${c.n}</small></div>` : '').join('') : `<p class="muted small">${esc(t('pl_i_none'))}</p>`}</section>
    <section class="card pad wide"><h3>${esc(t('pl_insights'))}</h3><ul class="pl-ins">${plInsights(S).map(s => `<li>${esc(s)}</li>`).join('')}</ul></section></div>`;
}
PAGES.planner = function(){
  if (!state.user && !state.authReady && !DEMO) return page('<div class="gate-load"><i></i></div>');
  if (!state.user && !DEMO) return page(plUpsell());
  if (!plAccess()) { refreshCompanion().then(ch => ch && render(true)); return page(plUpsell()); }
  if (PL.uid !== state.user.uid) { clearTimeout(PL.timer); PL.seq++; Object.assign(PL, { uid:state.user.uid, off:0, key:'', tasks:null, state:'idle', save:'', prev:null, sel:null, slow:false, hist:{}, prefs:null }); }   // đổi tài khoản trên cùng trình duyệt: không để lộ planner của người trước
  if (!state.companionUntil && !state.isAdmin && !DEMO) refreshCompanion().then(ch => ch && render(true));       // lấy ngày hết hạn để hiện nhắc gia hạn
  plLoad(); plRemStart();
  const ws = plWeekStart(PL.off), nav = `<div class="row between" style="margin-bottom:16px;flex-wrap:wrap;gap:10px"><div class="week-nav"><button class="btn secondary icon" data-act="plWeek" data-d="-1">${ic('chev-l')}</button><span class="lbl">${ws.toFormat('dd/MM')} – ${ws.plus({ days:6 }).toFormat('dd/MM/yyyy')}</span><button class="btn secondary icon" data-act="plWeek" data-d="1">${ic('chev-r')}</button>${PL.off ? `<button class="btn ghost sm" data-act="plWeek" data-d="0">${esc(t('pl_this'))}</button>` : ''}</div>
    <div class="row"><span class="small faint" id="pl-status">${PL.save === 'saved' ? '✓ ' + esc(t('pl_saved')) : PL.save === 'saving' ? esc(t('pl_saving')) : ''}</span><button class="btn primary" data-act="plNew">${ic('plus', 'sm')} ${esc(t('pl_add'))}</button></div></div>`;
  let body;
  if (PL.state === 'error') body = `<p class="muted">${esc(t('pl_load_err'))}</p><button class="btn primary" data-act="plRetry">${esc(t('club_retry'))}</button>${PL.err ? `<p class="small faint">${esc(PL.err)}</p>` : ''}`;
  else if (!PL.tasks) body = `<p class="muted">${esc(t(PL.slow ? 'pl_slow' : 'pl_loading'))}</p>${PL.slow ? `<button class="btn primary" data-act="plRetry">${esc(t('club_retry'))}</button>` : ''}`;
  else { const S = plStats(PL.tasks, PL.off); body = `${plKpis(S)}${plQuickBar()}<p class="small faint pl-hint" style="margin:4px 0 10px">${esc(t('pl_hint'))}</p><div class="pl-main"><div class="card pad pl-gridcard">${plGrid()}</div>${plSide()}</div>${plAnalysis(S)}`; }
  page(`${head('pl_title', 'pl_sub', '', 'moonwalk', 4)}${hintNote('new_pl')}${state.companionUntil && !state.isAdmin ? (plDaysLeft() <= 5 ? `<div class="card pad stack" style="margin-bottom:14px"><p class="small">${esc(t('pl_soon', { d:state.companionUntil }))}</p>${(() => { const r = plRecent(); return r && r.n ? `<p class="small"><b>${esc(t('pl_soon_stats', { n:r.n, t:fmtMin(r.t) }))}</b></p>` : ''; })()}${compClaimHTML()}</div>` : `<p class="small muted" style="margin:-6px 0 12px">${esc(t('pl_until', { d:state.companionUntil }))}</p>`) : ''}${nav}${body}`);
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
FORMS.plQuick = f => {
  const inp = f.querySelector('input'); let v = inp.value.trim(); if (!v || !PL.tasks) return;
  if (PL.tasks.length >= PL_MAX) return toast(t('pl_max', { n:PL_MAX }));
  const m = v.match(/^(\d{1,2})[:h](\d{2})?\s+(.+)$/i), day = PL.off === 0 ? DT.now().setZone(userTZ).weekday - 1 : null;
  PL.tasks.push(plClean(m && +m[1] < 24 && +(m[2] || 0) < 60 ? { title:m[3], day, start:m[1] + ':' + (m[2] || '00'), dur:60, c:0 } : { title:v, day, c:0 }));
  plSave(); render(true); setTimeout(() => { const n = $('pl-quick'); if (n) n.focus(); }, 30);
};
Object.assign(ACTIONS, {
  plMday: el => { PL.mday = +el.dataset.d; render(true); },
  plWeek: el => { plFlush(); PL.mday = null; const d = +el.dataset.d; PL.off = d ? PL.off + d : 0; PL.seq++; PL.tasks = null; PL.key = ''; PL.state = 'idle'; render(true); },
  plRetry: () => { PL.seq++; PL.state = 'idle'; PL.key = ''; PL.tasks = null; PL.slow = false; render(true); },
  plRem: async () => {
    if (plRemOn()) { store.set('pl_rem', false); clearInterval(PL.remT); PL.remT = 0; toast(t('pl_rem_off')); return render(true); }
    let perm = typeof Notification === 'undefined' ? 'denied' : Notification.permission; if (perm === 'default') { try { perm = await Notification.requestPermission(); } catch (e) { perm = 'denied'; } }
    store.set('pl_rem', true); plRemStart(); plChime();
    if (perm === 'granted') { try { new Notification(t('pl_rem_title'), { body:t('pl_rem_test'), silent:true }); } catch (e) {} } else toast(t('pl_rem_inpage'));
    render(true);
  },
  plChimeTog: () => { store.set('pl_chime', !plChimeOn()); if (plChimeOn()) plChime(); render(true); },
  plTplSave: () => {
    const tpl = PL.tasks.filter(x => x.title).slice(0, 100).map(x => ({ ...plClean(x), done:false, carried:false }));
    plSavePrefs({ template:tpl }); toast(t('pl_tpl_saved', { n:tpl.length })); render(true);
  },
  plTplUse: () => {
    const tpl = PL.prefs && PL.prefs.template || []; if (!tpl.length) return;
    if (PL.tasks.length + tpl.length > PL_MAX) return toast(t('pl_max', { n:PL_MAX }));
    tpl.forEach(x => PL.tasks.push(plClean({ ...x, id:plId(), done:false, carried:false }))); plSave(); render(true); toast(t('pl_tpl_added', { n:tpl.length }));
  },
  plMoveToday: () => {
    const di = DT.now().setZone(userTZ).weekday - 1, mv = plOverdue(); if (!mv.length) return;
    mv.forEach(x => { x.day = di; x.start = ''; }); plSave(); render(true); toast(t('pl_moved', { n:mv.length }));
  },
  plMoveTomorrow: () => {
    const di = DT.now().setZone(userTZ).weekday - 1, mv = PL.tasks.filter(x => x.day === di && !x.done); if (!mv.length || di > 5) return;
    mv.forEach(x => { x.day = di + 1; }); plSave(); render(true); toast(t('pl_moved', { n:mv.length }));
  },
  plNew: (el, e) => {
    if (!PL.tasks) return; let day = el.dataset.day !== undefined ? +el.dataset.day : (PL.off === 0 ? DT.now().setZone(userTZ).weekday - 1 : 0), start = '';
    if (day !== null && e && e.clientY !== undefined && el.dataset.g0 !== undefined) { const r = el.getBoundingClientRect(), mins = Math.round((e.clientY - r.top) / PL_HOUR * 2) * 30 + (+el.dataset.g0) * 60; start = hmStr(Math.max(0, Math.min(1410, mins))); }
    PL.sel = null; plForm({ title:'', day, start:'', dur:60, c:0, done:false }, true, day, start);
  },
  plEdit: el => { const x = PL.tasks.find(v => v.id === el.dataset.id); if (!x) return; PL.sel = x.id; plForm(x, false); },
  plDur: el => { const n = $('pl-dur'); if (n) n.value = el.dataset.m; },
  plCat: el => { PL.cat = +el.dataset.c; document.querySelectorAll('#pl-cats .pl-cat').forEach(b => b.classList.toggle('on', +b.dataset.c === PL.cat)); },
  plToggle: el => { const x = PL.tasks.find(v => v.id === el.dataset.id); if (!x) return; x.done = !x.done; plSave(); render(true); },
  plDel: () => { PL.tasks = PL.tasks.filter(x => x.id !== PL.sel); PL.sel = null; closeModal(); plSave(); render(true); },
  plSaveTask: async () => {
    const title = $('pl-title').value.trim(); if (!title) { $('pl-title').focus(); return; }
    const start = $('pl-start').value, dur = +$('pl-dur').value || 0, base = { title, start, dur, c:PL.cat || 0 };
    if (PL.sel) { const x = PL.tasks.find(v => v.id === PL.sel); if (x) { const d1 = $('pl-day1').value, dn = $('pl-done').checked; if (x.carried) await plUncarry([x]); Object.assign(x, plClean({ ...x, ...base, day:d1 === '' ? null : +d1, done:dn })); } }
    else {
      const days = [...document.querySelectorAll('.pl-day:checked')].map(b => +b.value);
      if (PL.tasks.length + Math.max(1, days.length) > PL_MAX) { toast(t('pl_max', { n:PL_MAX })); return; }
      (days.length ? days : [null]).forEach(day => PL.tasks.push(plClean({ ...base, day })));
    }
    PL.sel = null; closeModal(); plSave(); render(true);
  },
  plUncarry: async el => { const list = el && el.dataset.id ? PL.tasks.filter(x => x.id === el.dataset.id && x.carried) : PL.tasks.filter(x => x.carried); if (list.length && await plUncarry(list)) { render(true); toast(t('pl_uncarried_n', { n:list.length })); } },
  plCarry: async () => {
    const open = PL.tasks.filter(x => !x.done && !x.carried); if (!open.length) return;
    try {
      const nk = plKey(PL.off + 1); let next = [];
      if (!DEMO) { const d = await plRef(nk).get(); next = d.exists && Array.isArray(d.data().tasks) ? d.data().tasks.map(plClean) : []; }
      open.forEach(x => { const c = plClean({ ...x, id:plId(), done:false, carried:false }); next.push(c); x.carried = c.id; });
      if (!DEMO) await plRef(nk).set({ tasks:next, updatedAt:TS() });
      plSave(); render(true); toast(t('pl_carried_n', { n:open.length }));
    } catch (e) { console.warn('carry', e.code); toast(t('pl_err')); }
  }
});
CHANGES.plDayGoal = el => { plSavePrefs({ dayGoalMin:+el.value || 0 }); render(true); };
CHANGES.plGoal = el => { plSavePrefs({ goalMin:+el.value || 0 }); render(true); };
