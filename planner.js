'use strict';
/* =========================================================
   PLANNER — lịch tuần riêng tư cho Companions (tải theo nhu cầu khi mở #/planner)
   Dữ liệu: users/<uid>/planner/<năm>-W<tuần> = { tasks:[{ id, title, day:0-6|null, start:'HH:MM'|'', dur:phút, c:0-5, done, carried? }], gone?:[…], updatedAt }
   gone = dấu vết kế hoạch ban đầu của từng ngày: việc bị dời khỏi ngày ('m', to = ngày mới) hoặc bị bỏ ('x') sau khi ngày đó đã bắt đầu.
   Tuần cũ chưa có gone thì được chấm như trước (không có gì để ghi nhận thêm), dữ liệu cũ không bị sửa.
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
  pl_rem_btn:'Remind me before tasks start', pl_rem_on:'Reminders are on', pl_rem_hint:'You get a reminder about 10 minutes before a task starts, even when this site is closed (it can be a few minutes late). Turn it on on each device you use.', pl_rem_bell:'Turn reminders on or off with the bell 🔔 at the top of the page.', pl_rem_bg:'This device gets reminders even when the site is closed (they can be a few minutes late).', pl_rem_fg:'On this device, reminders only work while the site is open.', pl_rem_ios:'iPhone/iPad: add this site to your Home Screen, open it from there and turn reminders on again to get them when the site is closed.', pl_rem_off:'Reminders off', pl_rem_denied:'Notifications are blocked for this site in your browser settings.', pl_rem_unsup:'This browser does not support notifications.', pl_rem_title:'Planner', pl_rem_test:'Reminders are on.', pl_rem_soon:'{t} starts at {s}', pl_rem_eve:'{n} tasks are still open today.',
  pl_score:'Week score', pl_lv_0:'Getting started', pl_lv_1:'Solid', pl_lv_2:'Great', pl_lv_3:'Outstanding', pl_score_how:'60% tasks done, 25% time done, 15% days with progress',
  pl_trend:'Last 6 weeks', pl_streak:'{n} weeks in a row with 70% or more done', pl_streak_0:'Finish 70% of a week\'s tasks to start a streak.', pl_streak_this:'This week counts once you reach 70%.',
  pl_goal:'Weekly goal', pl_goal_none:'No goal', pl_goal_prog:'{d} of {g} ({p}%)',
  pl_tpl_save:'Save this week as my template', pl_tpl_use:'Use my template for this week', pl_tpl_saved:'Template saved ({n} tasks).', pl_tpl_added:'Added {n} tasks from your template.', pl_tpl_hint:'A template is your usual week. Save it once, then fill any new week with one tap.',
  pl_part_0:'morning', pl_part_1:'afternoon', pl_part_2:'evening', pl_i_partrate:'Your {p} tasks get done most often ({r}%). Plan your important work then.', pl_i_empty:'Nothing planned for {d} yet. Add more whenever you are ready.', pl_i_avg:'Your average over the recent weeks is {p}%.', pl_soon_stats:'In the last weeks you ticked off {n} tasks ({t}). Keep that going.'
});

Object.assign(I18N.vi, {
  pl_today:'Hôm nay', pl_next:'Tiếp theo: {t}', pl_none_today:'Hôm nay chưa có việc. Bấm vào chỗ trống ở cột hôm nay để thêm.',
  pl_rem_btn:'Nhắc tôi trước giờ làm việc', pl_rem_on:'Đang bật nhắc việc', pl_rem_hint:'Bạn được nhắc trước giờ bắt đầu khoảng 10 phút, kể cả khi đã đóng web (có thể trễ vài phút). Bật riêng trên từng máy bạn dùng.', pl_rem_bell:'Bật hoặc tắt nhắc việc ở nút chuông 🔔 trên đầu trang.', pl_rem_bg:'Máy này nhận nhắc cả khi đã đóng web (có thể trễ vài phút).', pl_rem_fg:'Trên máy này, nhắc việc chỉ chạy khi web đang mở.', pl_rem_ios:'iPhone/iPad: thêm web ra Màn hình chính, mở web từ biểu tượng đó rồi bật lại nhắc việc để được nhắc cả khi đã đóng web.', pl_rem_off:'Đã tắt nhắc việc', pl_rem_denied:'Trình duyệt đang chặn thông báo của trang này. Bạn mở lại trong phần cài đặt trình duyệt.', pl_rem_unsup:'Trình duyệt này không hỗ trợ thông báo.', pl_rem_title:'Planner', pl_rem_test:'Đã bật nhắc việc.', pl_rem_soon:'{t} bắt đầu lúc {s}', pl_rem_eve:'Hôm nay còn {n} việc chưa xong.',
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
  pl_tip_overdue:'{n} tasks from earlier days are still open. Bring them to today, or delete what you no longer need.', pl_tip_over:'Today is planned for {t}. Pick the 3 most important tasks and do them first; the rest is a bonus.', pl_tip_tm:'Tasks you did not get to can move to tomorrow with one tap.', pl_mv_today:'Move them to today', pl_mv_tm:'Move unfinished to tomorrow', pl_carry_tm:"Move today's unfinished tasks to tomorrow", pl_tm_title:'Move to tomorrow', pl_tm_sub:'They will go to {d}. Change the start time and duration for each task if you like, or untick the ones you want to keep today.', pl_tm_have:'Already planned for tomorrow: {l}', pl_tm_go:'Move to tomorrow', pl_tm_none:'Tick at least one task to move.', pl_goal_custom:'Custom…', pl_goal_custom_sub:'Set your own goal in hours and minutes.', pl_goal_hh:'Hours', pl_goal_mm:'Minutes', pl_moved:'Moved {n} tasks.',
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
  pl_tip_overdue:'Còn {n} việc của những ngày trước chưa xong. Đưa về hôm nay, hoặc xoá bớt việc không còn cần.', pl_tip_over:'Hôm nay xếp tới {t}. Chọn 3 việc quan trọng nhất làm trước, phần còn lại là cộng thêm.', pl_tip_tm:'Việc chưa kịp làm có thể dời sang ngày mai chỉ với một cú bấm.', pl_mv_today:'Dời về hôm nay', pl_mv_tm:'Dời việc chưa xong sang mai', pl_carry_tm:'Dời việc chưa xong hôm nay sang ngày mai', pl_tm_title:'Dời sang ngày mai', pl_tm_sub:'Các việc sẽ được dời sang {d}. Bạn có thể đổi giờ bắt đầu và thời lượng cho từng việc, hoặc bỏ tick việc muốn giữ lại hôm nay.', pl_tm_have:'Ngày mai đã có: {l}', pl_tm_go:'Dời sang ngày mai', pl_tm_none:'Hãy tick ít nhất một việc để dời.', pl_goal_custom:'Tự chọn…', pl_goal_custom_sub:'Tự đặt mục tiêu theo giờ và phút.', pl_goal_hh:'Giờ', pl_goal_mm:'Phút', pl_moved:'Đã dời {n} việc.',
  pl_up_expired:'Quyền Companion của bạn đã hết hạn ngày {d}. Dữ liệu Planner vẫn được giữ nguyên và sẽ hiện lại ngay khi bạn gia hạn.',
  pl_s_vocab:'Ôn từ vựng', pl_s_listen:'Luyện nghe', pl_s_read:'Làm bài đọc', pl_s_gym:'Tập thể dục', pl_s_essay:'Viết bài luận', pl_s_book:'Đọc sách', pl_s_meet:'Họp nhóm', pl_s_speak:'Luyện nói', pl_s_movie:'Xem phim', pl_s_clean:'Dọn dẹp', pl_s_review:'Tổng kết tuần',
  pl_chime_on:'Chuông: bật', pl_chime_off:'Chuông: tắt', pl_rem_inpage:'Trình duyệt đang chặn thông báo, nên mình sẽ nhắc ngay trong trang và có chuông. Bạn để tab này mở nhé.', pl_preview:'Xem trước với dữ liệu mẫu', pl_preview_note:'Đây là giao diện Planner dành cho Companions. Planner bị khoá cho đến khi bạn trở thành Companion.',
  pl_day_empty:'Ngày này chưa có việc nào.',
  pl_quick_ph:'Thêm nhanh: gõ việc rồi bấm Enter (ví dụ "19:30 Ôn từ vựng")', pl_quick_btn:'Thêm', pl_tpl_menu:'Tuần mẫu', pl_streak_l:'Chuỗi tuần', pl_streak_u:'tuần liên tiếp xong từ 70%', pl_streak_start:'Xong 70% việc của một tuần để bắt đầu', pl_ana:'Chi tiết', pl_still:'Việc chưa xong', pl_goal_set:'Mục tiêu', pl_now:'Bây giờ',
});

/* thời lượng giờ + phút, đánh giá theo kế hoạch ban đầu (đã dời / đã bỏ) */
Object.assign(I18N.en, {
  pl_f_len:"Duration",
  pl_dv_adj:"Today you finished {n} of {m} planned tasks, and you chose to move or drop the other {k}. Adjusting a plan is a skill, not a failure.",
  pl_k_d:"done {n}",
  pl_k_mv:"moved {n}",
  pl_k_x2:"dropped {n}",
  pl_k_o2:"not done {n}",
  pl_k_m:"{n} moved to next week",
  pl_k_x:"{n} dropped",
  pl_k_o:"{n} not done yet",
  pl_st_w:"moved to next week",
  pl_st_x:"dropped",
  pl_st_to:"moved to {d}",
  pl_st_m:"moved",
  pl_score_how2:"Based on your original plan (including dropped tasks and tasks moved to next week): 50% minutes done, 35% tasks done, 15% days with progress",
  pl_i_r_hi:"You finished {p}% of the work you planned so far (about {d} of {t}, {n}/{m} tasks). That is a strong week.",
  pl_i_r_mid:"You finished {p}% of the work you planned so far (about {d} of {t}, {n}/{m} tasks). A solid base to build on.",
  pl_i_r_lo:"You finished {p}% of the work you planned so far (about {d} of {t}, {n}/{m} tasks). That is okay: a low number usually means the plan was too full, not that you did badly. Almost everyone underestimates how long things take, and people with ADHD even more so. Next week, try adding about half again to each estimate, or plan fewer tasks.",
  pl_i_mix:"What is not done yet: {l}.",
  pl_i_drop:"You dropped {n} tasks (about {t}). Letting go of what no longer matters is a good call. They stay in your original plan so the numbers reflect your week honestly.",
  pl_i_rep:"\"{t}\" has been moved {n} times. Tasks that keep moving are usually too big or have an unclear first step. Write down the smallest step you can do in 10 minutes and plan just that.",
  pl_i_moved:"You moved tasks to another day {n} times this week. Moving on purpose beats forgetting, but if you move things every day, your days may be planned a bit too full.",
  pl_how:"How this is counted: each day keeps its original plan. A deleted task counts as \"dropped\" and a task moved to another day counts as \"moved\" on its original day, so the percentage does not jump to 100% when you delete or move unfinished tasks. Longer tasks weigh more than short ones, by minutes (a task without minutes counts as 30). Changing the plan before that day starts is not counted.",
  pl_del_q:"This task is not done yet. How do you want to record it?",
  pl_del_sub:"Dropping a task you no longer need is normal. Recording it as \"dropped\" keeps your review honest; it does not cost you more than a task that is simply not done.",
  pl_del_drop:"Drop it (record as \"dropped\")",
  pl_del_wipe:"I added it by mistake, delete it completely"
});
Object.assign(I18N.vi, {
  pl_f_len:"Thời lượng",
  pl_dv_adj:"Hôm nay bạn xong {n}/{m} việc đã lên kế hoạch, {k} việc còn lại bạn đã chủ động dời hoặc bỏ. Điều chỉnh kế hoạch là một kỹ năng, không phải thất bại.",
  pl_k_d:"xong {n}",
  pl_k_mv:"đã dời {n}",
  pl_k_x2:"đã bỏ {n}",
  pl_k_o2:"chưa làm {n}",
  pl_k_m:"{n} việc dời sang tuần sau",
  pl_k_x:"{n} việc đã bỏ",
  pl_k_o:"{n} việc chưa làm",
  pl_st_w:"đã dời sang tuần sau",
  pl_st_x:"đã bỏ",
  pl_st_to:"đã dời sang {d}",
  pl_st_m:"đã dời",
  pl_score_how2:"Tính trên kế hoạch ban đầu (kể cả việc đã bỏ hoặc dời sang tuần sau): 50% số phút đã xong, 35% số việc đã xong, 15% số ngày có tiến triển",
  pl_i_r_hi:"Bạn đã làm xong {p}% khối lượng đã lên kế hoạch tới lúc này (khoảng {d} trên {t}, {n}/{m} việc). Một tuần rất tốt.",
  pl_i_r_mid:"Bạn đã làm xong {p}% khối lượng đã lên kế hoạch tới lúc này (khoảng {d} trên {t}, {n}/{m} việc). Một nền tảng vững để làm tiếp.",
  pl_i_r_lo:"Bạn đã làm xong {p}% khối lượng đã lên kế hoạch tới lúc này (khoảng {d} trên {t}, {n}/{m} việc). Không sao cả: con số thấp thường là do kế hoạch quá dày chứ không phải do bạn. Hầu như ai cũng ước lượng thiếu thời gian, người có ADHD càng dễ gặp, nên tuần sau thử cộng thêm khoảng một nửa thời gian cho mỗi việc hoặc xếp ít việc hơn.",
  pl_i_mix:"Phần chưa xong gồm: {l}.",
  pl_i_drop:"Bạn đã bỏ {n} việc (khoảng {t}). Bỏ việc không còn cần là một quyết định tốt. Chúng vẫn được giữ trong kế hoạch ban đầu để con số phản ánh đúng tuần của bạn.",
  pl_i_rep:"\"{t}\" đã bị dời {n} lần. Việc hay bị dời thường là việc quá to hoặc chưa rõ bắt đầu từ đâu. Thử viết ra bước nhỏ nhất làm được trong 10 phút và chỉ xếp bước đó.",
  pl_i_moved:"Tuần này bạn đã dời việc sang ngày khác {n} lần. Dời có chủ đích vẫn tốt hơn bỏ quên, nhưng nếu ngày nào cũng phải dời thì có lẽ mỗi ngày đang xếp hơi dày.",
  pl_how:"Cách tính: mỗi ngày giữ lại kế hoạch ban đầu. Việc bị xoá được ghi là \"đã bỏ\", việc dời sang ngày khác được ghi là \"đã dời\" ở ngày gốc, nên phần trăm không tự nhảy lên 100% khi bạn xoá hoặc dời việc chưa xong. Việc dài được tính nặng hơn việc ngắn theo số phút (việc chưa ghi phút tính như 30 phút). Sửa kế hoạch trước khi tới ngày đó thì không bị tính.",
  pl_del_q:"Việc này chưa xong. Bạn muốn ghi nhận thế nào?",
  pl_del_sub:"Bỏ một việc không còn cần là chuyện bình thường. Ghi là \"đã bỏ\" giúp bản đánh giá phản ánh đúng ngày của bạn, và không bị trừ nhiều hơn một việc chưa làm.",
  pl_del_drop:"Bỏ việc này (ghi nhận là \"đã bỏ\")",
  pl_del_wipe:"Mình nhập nhầm, xoá hẳn"
});

/* thống kê tuần / tháng */
Object.assign(I18N.en, {
  pl_ps_title:"Week & month stats",
  pl_ps_w:"Week",
  pl_ps_m:"Month",
  pl_ps_focus:"Focus time",
  pl_ps_focus_sub:"Sessions: {s} · Focus days: {d}",
  pl_ps_rate:"Tasks completed",
  pl_ps_rate_sub:"{n} of {m} due tasks done",
  pl_ps_chart:"Focus time per day",
  pl_ps_loading:"Loading this month…",
  pl_ps_rate_none:"No tasks due yet",
  pl_ps_how:"Focus time comes from the focus sessions you finish in the Focus room. The completion rate counts the tasks that were due, including ones you moved or dropped, so it matches the review above.",
  pl_ps_c_empty:"Nothing recorded here yet. Finish a focus session or tick off a task and your stats will start to show.",
  pl_ps_c_nofocus:"No focus sessions recorded yet. Pairing a task with a 25-minute timer can make it easier to start.",
  pl_ps_c_new:"You logged {t} of focus. A lovely start.",
  pl_ps_c_up_w:"That is {t} more focus than the same days last week. Lovely momentum.",
  pl_ps_c_up_m:"That is {t} more focus than the same days last month. Lovely momentum.",
  pl_ps_c_down_w:"That is {t} less focus than the same days last week. Slow stretches happen; one short session is a good way back in.",
  pl_ps_c_down_m:"That is {t} less focus than the same days last month. Slow stretches happen; one short session is a good way back in.",
  pl_ps_c_same_w:"Your focus time is about the same as the same days last week. Nice and steady.",
  pl_ps_c_same_m:"Your focus time is about the same as the same days last month. Nice and steady.",
  pl_ps_c_hi:"You finished {r}% of your due tasks. Great follow-through.",
  pl_ps_c_mid:"You finished {r}% of your due tasks. A steady base to keep building on.",
  pl_ps_c_lo:"You finished {r}% of your due tasks. Try planning a little less per day so it feels lighter."
});
Object.assign(I18N.vi, {
  pl_ps_title:"Thống kê tuần & tháng",
  pl_ps_w:"Tuần",
  pl_ps_m:"Tháng",
  pl_ps_focus:"Giờ tập trung",
  pl_ps_focus_sub:"{s} phiên · {d} ngày có tập trung",
  pl_ps_rate:"Tỉ lệ hoàn thành",
  pl_ps_rate_sub:"Xong {n}/{m} việc đã đến hạn",
  pl_ps_chart:"Giờ tập trung mỗi ngày",
  pl_ps_loading:"Đang tải tháng này…",
  pl_ps_rate_none:"Chưa có việc nào đến hạn",
  pl_ps_how:"Giờ tập trung lấy từ các phiên tập trung bạn hoàn thành ở Phòng tập trung. Tỉ lệ hoàn thành đếm các việc đã đến hạn, kể cả việc đã dời hoặc đã bỏ, nên khớp với phần đánh giá ở trên.",
  pl_ps_c_empty:"Chưa có gì được ghi lại. Hoàn thành một phiên tập trung hoặc tick xong một việc là số liệu sẽ bắt đầu hiện ở đây.",
  pl_ps_c_nofocus:"Chưa có phiên tập trung nào. Thử ghép một việc với đồng hồ 25 phút, bắt đầu sẽ dễ hơn nhiều.",
  pl_ps_c_new:"Bạn đã tập trung được {t}. Một khởi đầu thật dễ thương.",
  pl_ps_c_up_w:"Bạn tập trung nhiều hơn {t} so với cùng những ngày tuần trước. Đà đang lên rồi đó.",
  pl_ps_c_up_m:"Bạn tập trung nhiều hơn {t} so với cùng những ngày tháng trước. Đà đang lên rồi đó.",
  pl_ps_c_down_w:"Bạn tập trung ít hơn {t} so với cùng những ngày tuần trước. Ai cũng có lúc chậm lại, một phiên ngắn là đủ để bắt nhịp lại.",
  pl_ps_c_down_m:"Bạn tập trung ít hơn {t} so với cùng những ngày tháng trước. Ai cũng có lúc chậm lại, một phiên ngắn là đủ để bắt nhịp lại.",
  pl_ps_c_same_w:"Giờ tập trung gần bằng cùng những ngày tuần trước. Đều đặn lắm.",
  pl_ps_c_same_m:"Giờ tập trung gần bằng cùng những ngày tháng trước. Đều đặn lắm.",
  pl_ps_c_hi:"Bạn đã xong {r}% số việc đến hạn. Theo kế hoạch rất tốt.",
  pl_ps_c_mid:"Bạn đã xong {r}% số việc đến hạn. Một nền vững để làm tiếp.",
  pl_ps_c_lo:"Bạn đã xong {r}% số việc đến hạn. Thử xếp ít việc hơn mỗi ngày cho nhẹ nhàng hơn nhé."
});
const PL_MAX = 300;                                              // số việc tối đa mỗi tuần (giữ tài liệu nhỏ, tránh lỗi quá cỡ)
const PL_HOUR = 44;                                              // px cho mỗi giờ trong lưới
const PL_COLORS = ['#f2b8c6', '#c9b8ec', '#f6c9a0', '#f4e08c', '#a9dcc6', '#a8cdee'];   // 6 nhóm: màu pastel, chữ tối cho mọi giao diện
const PL = { off:0, key:'', tasks:null, gone:[], state:'idle', save:'', prev:null, timer:0, sel:null, seq:0, slow:false, hist:{}, prefs:null, remTasks:null, sent:{}, remT:0, pinT:0, mday:null, raw:{}, moff:0 };
const plWeekStart = off => DT.now().setZone(userTZ).plus({ weeks:off }).startOf('week');
const plKey = off => { const d = plWeekStart(off); return `${d.weekYear}-W${d.weekNumber}`; };
const plAccess = () => DEMO || state.companion || state.isAdmin || trialActive();
const plRef = key => db.collection('users').doc(state.user.uid).collection('planner').doc(key);
const plId = () => Math.random().toString(36).slice(2, 9);
const hm = v => { const p = String(v || '').split(':'); return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0); };
const hmStr = m => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
const fmtMin = m => { m = Math.round(m); const h = Math.floor(m / 60), r = m % 60; return h ? (r ? t('pl_hm', { h, m:r }) : t('pl_h', { h })) : t('pl_min', { m }); };
const plW = x => x.dur > 0 ? x.dur : 30;                         // trọng số khi chấm = số phút dự định; việc chưa ghi phút tính như 30 phút
/* ô nhập thời lượng: giờ + phút (vẫn lưu tổng số phút như cũ). Gõ 90 vào ô phút cũng được, tự cộng dồn */
const plDurIn = (v, id) => `<div class="pl-dur"${id ? ` id="${id}"` : ''}>${[['h', v ? Math.floor(v / 60) : '', 'pl_goal_hh', ' max="24" step="1"'], ['m', v ? v % 60 : '', 'pl_goal_mm', ' step="5"']].map(([u, val, k, a]) => `<label><input class="input" type="number" min="0"${a} inputmode="numeric" data-u="${u}" value="${val}" placeholder="0" aria-label="${esc(t(k))}"><small>${esc(t(k))}</small></label>`).join('')}</div>`;
const plDurGet = el => el ? Math.max(0, Math.min(1440, Math.round((+el.querySelector('[data-u=h]').value || 0) * 60 + (+el.querySelector('[data-u=m]').value || 0)))) : 0;
function plGoneClean(g){
  const day = Number.isInteger(g.day) && g.day >= 0 && g.day <= 6 ? g.day : null, to = g.to === 'w' || (Number.isInteger(g.to) && g.to >= 0 && g.to <= 6) ? g.to : null;
  return { id:String(g.id || ''), t:String(g.t || '').slice(0, 80), day, dur:Math.max(0, Math.min(1440, Math.round(+g.dur || 0))), c:Math.max(0, Math.min(5, g.c | 0)), s:g.s === 'm' ? 'm' : 'x', ...(to !== null ? { to } : {}) };
}
/* Chỉ đổi kế hoạch của một ngày đã bắt đầu (hôm nay hoặc trước đó, hay tuần đã qua) mới được ghi nhận. Sửa trước khi tới ngày đó là xếp lại kế hoạch, không tính. */
const plStarted = day => PL.off < 0 || (PL.off === 0 && day !== null && day <= DT.now().setZone(userTZ).weekday - 1);
function plMark(x, s, to){                                         // ghi "đã dời" / "đã bỏ" cho ngày gốc của việc x (việc đã xong thì không cần)
  if (x.done || !plStarted(x.day)) return;
  PL.gone = [...(PL.gone || []).filter(g => !(g.id === x.id && g.day === x.day)), plGoneClean({ id:x.id, t:x.title, day:x.day, dur:x.dur, c:x.c, s, to })].slice(-PL_MAX);
}
const plLand = x => { PL.gone = (PL.gone || []).filter(g => !(g.id === x.id && g.day === x.day && g.s === 'm')); };   // dời về lại đúng ngày cũ: ngày đó không còn tính là "đã dời"
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
      await plRef(nk).set({ tasks:next, updatedAt:TS() }, { merge:true });
    }
    list.forEach(x => { delete x.carried; }); plSave(); return true;
  } catch (e) { console.warn('uncarry', e.code); toast(t('pl_err')); return false; }
}
/* ---------- cầu nối với Phòng tập trung (Focus): xem / tick / thêm việc hôm nay mà không cần mở Planner ---------- */
const plToday0 = () => DT.now().setZone(userTZ).weekday - 1;
async function plWeek0(){                                         // việc của tuần này; dùng chung mảng với PL khi Planner đang giữ đúng tuần này
  if (PL.tasks && PL.key === plKey(0)) return PL.tasks;
  if (DEMO) return null;
  return (await plFetch(plKey(0))).tasks.map(plClean);
}
async function plTodayList(){ const l = await plWeek0(); return l ? l.filter(x => x.day === plToday0()).sort((a, b) => (a.start || '99').localeCompare(b.start || '99')) : []; }
async function plFocusEdit(fn){                                   // fn(tasks) sửa mảng và trả true nếu có đổi; trả true khi đã lưu xong
  try {
    const key = plKey(0), live = !!(PL.tasks && PL.key === key), tasks = await plWeek0(); if (!tasks || !fn(tasks)) return false;
    if (live) plSave();
    else { PL.pre = null; delete PL.raw[key]; plCache(key, tasks); if (state.user) PL.remTasks = { uid:state.user.uid, tasks }; plPinShow(); if (!DEMO) await plRef(key).set({ tasks:tasks.map(plClean), updatedAt:TS() }, { merge:true }); }   // merge: giữ nguyên gone
    return true;
  } catch (e) { console.warn('focus-planner', e.code); return false; }
}
/* ---------- tải / lưu ---------- */
/* Đọc nhanh: lần mở sau hiện ngay bản nhớ trong máy (xoá khi đăng xuất / đổi tài khoản, xem core.js), rồi cập nhật từ máy chủ ở nền */
async function plFetch(key){                                      // 'unavailable' = kết nối Firebase chưa kịp lên: thử lại vài lần trước khi báo lỗi
  for (let i = 0; ; i++) {
    try { const d = await plRef(key).get(), v = d.exists ? d.data() : {}; return { tasks:Array.isArray(v.tasks) ? v.tasks : [], gone:Array.isArray(v.gone) ? v.gone : [] }; }
    catch (e) { if (e.code !== 'unavailable' || i >= 2) throw e; await new Promise(r => setTimeout(r, 1500 * (i + 1))); }
  }
}
const plCK = key => 'plw_' + state.user.uid + '_' + key;
const plCache = (key, tasks, gone) => { if (DEMO || !state.user) return; const o = gone ? null : store.get(plCK(key), null); store.set(plCK(key), { tasks, gone:gone || (o && o.gone) || [] }); };
function plPrefetch(){                                            // gọi sớm lúc đăng nhập: lấy sẵn tuần này để mở Planner là có ngay
  if (DEMO || !state.user || !plAccess() || (PL.pre && PL.pre.uid === state.user.uid && Date.now() - PL.pre.at < 60000)) return;
  const key = plKey(0), pre = PL.pre = { uid:state.user.uid, key, at:Date.now(), p:plFetch(key) };
  pre.p.then(r => { plCache(key, r.tasks, r.gone); PL.remTasks = { uid:pre.uid, tasks:r.tasks }; plPinShow(); if (store.get('pl_rem', null) === null && PUSH.on) store.set('pl_rem', true); plRemStart(); })   // đã bật thông báo đẩy ở 🔔 từ trước: tự bật nhắc việc.catch(() => { if (PL.pre === pre) PL.pre = null; });
}
async function plLoad(){
  const key = plKey(PL.off); if ((PL.key === key && PL.tasks) || PL.state === 'loading' || PL.state === 'error') return;
  const seq = ++PL.seq, t0 = Date.now(); PL.state = 'loading'; PL.key = key; PL.tasks = null; PL.gone = []; PL.prev = null; PL.slow = false; PL.save = '';
  const hit = DEMO ? null : store.get(plCK(key), null);
  if (hit && Array.isArray(hit.tasks)) { PL.tasks = hit.tasks.map(plClean); PL.gone = (hit.gone || []).map(plGoneClean); PL.state = 'ready'; }      // có bản nhớ: hiện ngay, không bắt chờ mạng
  else setTimeout(() => { if (PL.seq === seq && PL.state === 'loading') { PL.slow = true; render(true); } }, 8000);   // quá 8 giây: báo mạng chậm và cho bấm thử lại
  try {
    let r = { tasks:[], gone:[] };
    const pre = PL.pre; PL.pre = null;                             // bản lấy sẵn chỉ dùng một lần và chỉ khi còn mới
    if (!DEMO) r = await (pre && pre.uid === state.user.uid && pre.key === key && Date.now() - pre.at < 60000 ? pre.p : plFetch(key));
    const tasks = r.tasks, gone = r.gone.map(plGoneClean);
    if (PL.seq !== seq) return;                                   // đã đổi tuần / bấm thử lại trong lúc tải
    console.info('planner load', Date.now() - t0, 'ms', hit ? '(có bản nhớ)' : '');
    if (!PL.save) { PL.tasks = tasks.map(plClean); PL.gone = gone; plCache(key, tasks, gone); PL.hist[key] = plStats(PL.tasks, PL.off, PL.gone); if (key === plKey(0)) { PL.remTasks = { uid:state.user.uid, tasks:PL.tasks }; plPinShow(); } }      // bạn đã sửa trong lúc chờ thì giữ bản của bạn
    else { const mine = new Set(PL.gone.map(g => g.id + '|' + g.day)); PL.gone = [...gone.filter(g => !mine.has(g.id + '|' + g.day)), ...PL.gone].slice(-PL_MAX); }   // …nhưng không làm mất dấu dời/bỏ đã có trên máy chủ
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
  clearTimeout(PL.timer); const key = PL.key, tasks = PL.tasks.map(plClean), gone = (PL.gone || []).map(plGoneClean); plCache(key, tasks, gone);
  if (!DEMO) plRef(key).set({ tasks, gone, updatedAt:TS() }).catch(e => { console.warn('planner save', e.code); toast(t('pl_err')); });
  PL.save = '';
}
function plSave(){
  PL.save = 'saving'; clearTimeout(PL.timer);
  PL.timer = setTimeout(async () => {
    if (!PL.tasks) return; const key = PL.key, tasks = PL.tasks.map(plClean), gone = (PL.gone || []).map(plGoneClean); plCache(key, tasks, gone); PL.hist[key] = plStats(tasks, PL.off, gone); PL.raw[key] = { tasks, gone }; if (key === plKey(0)) { PL.remTasks = { uid:state.user.uid, tasks }; plPinShow(); }
    try { if (!DEMO) await plRef(key).set({ tasks, gone, updatedAt:TS() }); if (PL.key === key) PL.save = 'saved'; }
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
/* Chấm theo KẾ HOẠCH BAN ĐẦU, không chỉ theo những gì còn lại trên lịch:
   - Cả tuần: mỗi việc tính một lần. Việc bị xoá vẫn nằm trong mẫu số với nhãn "đã bỏ", việc dời sang tuần sau là "đã dời" (chưa xong ở tuần này).
     Dời sang ngày khác trong tuần thì việc vẫn được chấm ở ngày mới, không bị tính hai lần.
   - Từng ngày: ngày gốc giữ lại việc đã dời / đã bỏ, nên dời hết việc sang mai không còn hiện "xong 100%".
   - Phần trăm chính (rate) tính theo số phút dự định (plW), vì một việc 2 giờ không ngang một việc 10 phút; crate là tỉ lệ theo số việc. */
function plStats(tasks, off = -1, gone = []){
  const due = plDueFn(off), blank = () => ({ plan:0, done:0, n:0, nd:0, dn:0, dnd:0, mv:0, x:0 });
  const S = { n:0, nd:0, plan:0, done:0, dn:0, dnd:0, dplan:0, ddone:0, dw:0, dwd:0, nm:0, wm:0, nx:0, wx:0, no:0, wo:0, mvIn:0, rep:null, day:Array.from({ length:7 }, blank), cat:Array.from({ length:6 }, blank), part:[0, 0, 0], pn:[0, 0, 0], pd:[0, 0, 0] };
  tasks.forEach(x => {
    const out = !!x.carried && !x.done, isDue = out || due(x), w = plW(x);
    S.n++; S.plan += x.dur; if (x.done) { S.nd++; S.done += x.dur; }
    const c = S.cat[x.c]; c.n++; c.plan += x.dur; if (x.done) { c.nd++; c.done += x.dur; }
    if (isDue) { S.dn++; S.dplan += x.dur; S.dw += w; if (x.done) { S.dnd++; S.ddone += x.dur; S.dwd += w; } else if (out) { S.nm++; S.wm += w; } else { S.no++; S.wo += w; } }
    if (x.day !== null) { const dd = S.day[x.day]; dd.plan += x.dur; dd.n++; if (x.done) { dd.done += x.dur; dd.nd++; } if (isDue) { dd.dn++; if (x.done) dd.dnd++; } if (out) dd.mv++; }
    if (x.start) { const pi = hm(x.start) < 720 ? 0 : hm(x.start) < 1080 ? 1 : 2; S.pn[pi]++; if (x.done) S.pd[pi]++; }
    if (x.done && x.start) S.part[hm(x.start) < 720 ? 0 : hm(x.start) < 1080 ? 1 : 2] += x.dur || 1;
  });
  const moves = {};
  gone.forEach(g => {                                              // dấu vết chỉ được ghi khi ngày đó đã bắt đầu, nên luôn tính là đến hạn
    const dd = g.day !== null ? S.day[g.day] : null;
    if (dd) { dd.plan += g.dur; dd.n++; dd.dn++; }
    if (g.s === 'x') { S.n++; S.plan += g.dur; S.dn++; S.dplan += g.dur; S.dw += plW(g); S.nx++; S.wx += plW(g); S.cat[g.c].n++; S.cat[g.c].plan += g.dur; if (dd) dd.x++; }
    else { S.mvIn++; moves[g.id] = moves[g.id] || { t:g.t, n:0 }; moves[g.id].n++; if (dd) dd.mv++; }
  });
  Object.values(moves).forEach(m => { if (m.n >= 2 && (!S.rep || m.n > S.rep.n)) S.rep = m; });
  S.rate = S.dw ? Math.round(S.dwd / S.dw * 100) : 0;
  S.crate = S.dn ? Math.round(S.dnd / S.dn * 100) : 0;
  return S;
}
const plOverdue = () => PL.off > 0 || !PL.tasks ? [] : PL.tasks.filter(x => !x.done && !x.carried && (PL.off < 0 || (x.day !== null && x.day < DT.now().setZone(userTZ).weekday - 1)));
function plInsights(S){
  if (!S.n) return [t('pl_i_none')];
  const out = [], early = S.dn < 3, di = DT.now().setZone(userTZ).weekday - 1;
  if (early) out.push(t('pl_i_early'));
  else {
    out.push(t(S.rate >= 80 ? 'pl_i_r_hi' : S.rate >= 50 ? 'pl_i_r_mid' : 'pl_i_r_lo', { p:S.rate, d:fmtMin(S.dwd), t:fmtMin(S.dw), n:S.dnd, m:S.dn }));
    const mix = [S.nm && t('pl_k_m', { n:S.nm }), S.nx && t('pl_k_x', { n:S.nx }), S.no && t('pl_k_o', { n:S.no })].filter(Boolean);
    if (mix.length && (S.nm || S.nx)) out.push(t('pl_i_mix', { l:mix.join(', ') }));
    if (PL.prev && PL.prev.dn >= 3) { const dlt = S.rate - PL.prev.rate; out.push(t(dlt > 3 ? 'pl_i_vs_up' : dlt < -3 ? 'pl_i_vs_down' : 'pl_i_vs_same', { n:Math.abs(dlt), p:PL.prev.rate })); }
  }
  const bi = S.day.reduce((b, d, i) => d.done > S.day[b].done ? i : b, 0); if (S.day[bi].done > 0) out.push(t('pl_i_best', { d:t('pl_d' + bi), t:fmtMin(S.day[bi].done) }));
  const pm = Math.max(...S.part); if (pm > 0 && S.dnd >= 3) out.push(t('pl_i_part_' + S.part.indexOf(pm)));
  const pr = S.pn.map((n, i) => n >= 3 ? Math.round(S.pd[i] / n * 100) : -1), pm2 = Math.max(...pr);
  if (!early && pm2 > 0 && pr.filter(v => v >= 0).length >= 2) out.push(t('pl_i_partrate', { p:t('pl_part_' + pr.indexOf(pm2)), r:pm2 }));
  const earlier = [1, 2, 3].map(i => PL.hist[plKey(PL.off - i)]).filter(x => x && x.dn >= 3); if (!early && earlier.length >= 2) out.push(t('pl_i_avg', { p:Math.round(earlier.reduce((a, x) => a + x.rate, 0) / earlier.length) }));
  const empty = S.day.map((d, i) => d.n === 0 && (PL.off > 0 || (PL.off === 0 && i >= di)) ? i : -1).filter(i => i >= 0); if (S.n >= 1 && empty.length && empty.length < 7) out.push(t('pl_i_empty', { d:empty.map(i => t('pl_d' + i)).join(', ') }));
  if (S.nx) out.push(t('pl_i_drop', { n:S.nx, t:fmtMin(S.wx) }));
  if (S.rep) out.push(t('pl_i_rep', { t:S.rep.t || '—', n:S.rep.n })); else if (S.mvIn >= 3) out.push(t('pl_i_moved', { n:S.mvIn }));
  S.day.forEach((d, i) => { if (d.plan > 600) out.push(t('pl_i_over', { d:t('pl_d' + i), t:fmtMin(d.plan) })); });
  const left = plOverdue(); if (left.length) out.push(t('pl_i_left', { n:left.length, t:fmtMin(left.reduce((a, x) => a + x.dur, 0)) }));
  return out;
}

/* ---------- lịch sử tuần, điểm, chuỗi, mục tiêu, tuần mẫu ---------- */
async function plHist(){                                          // đọc 7 tuần trước để vẽ xu hướng, tính chuỗi tuần và so sánh (mỗi tuần chỉ đọc một lần)
  const base = PL.off, key = PL.key, raw = PL.raw;
  await Promise.all(Array.from({ length:7 }, (_, i) => base - 1 - i).map(async o => {
    const k = plKey(o); if (k in PL.hist) return;
    try { const d = await plRef(k).get(), v = d.exists ? d.data() : {}, tasks = Array.isArray(v.tasks) ? v.tasks.map(plClean) : null, gone = (Array.isArray(v.gone) ? v.gone : []).map(plGoneClean); PL.hist[k] = tasks ? plStats(tasks, o, gone) : null; raw[k] = { tasks:tasks || [], gone }; } catch (e) { /* chưa biết: bỏ qua */ }
  }));
  if (PL.key === key) { PL.prev = PL.hist[plKey(base - 1)] || null; render(true); }
}
async function plPrefs(){                                         // goalMin + template nằm ở users/<uid>/planner/_prefs
  if (PL.prefs || PL.prefsLoading) return; PL.prefsLoading = true;
  try { const d = await plRef('_prefs').get(); PL.prefs = d.exists ? d.data() : {}; } catch (e) { PL.prefs = {}; }
  PL.prefsLoading = false; render(true);
}
const plSavePrefs = patch => { PL.prefs = { ...(PL.prefs || {}), ...patch }; if (!DEMO) plRef('_prefs').set(patch, { merge:true }).catch(e => { console.warn('planner prefs', e.code); toast(t('pl_err')); }); };
function plScore(S){                                              // 0-100 trên kế hoạch đã đến hạn (kể cả việc đã bỏ / dời sang tuần sau): 50% số phút xong, 35% số việc xong, 15% số ngày có tiến triển. Chưa đủ 3 việc đến hạn thì chưa chấm.
  if (S.dn < 3) return null;
  const dn = S.day.filter(d => d.dn > 0), cons = dn.length ? dn.filter(d => d.dnd > 0).length / dn.length * 100 : 0;
  return Math.round(S.rate * .5 + S.crate * .35 + cons * .15);
}
function plDayStreak(S){                                          // số ngày liên tiếp có ít nhất 1 việc xong; nghỉ 1 ngày không mất chuỗi, nghỉ 2 ngày liền thì dừng; hôm nay chưa làm cũng chưa bị tính là nghỉ
  const di = DT.now().setZone(userTZ).weekday - 1, days = S.day.slice(0, di + 1).map(d => d.nd > 0).reverse();
  for (let i = 1; i <= 4; i++) { const h = PL.hist[plKey(-i)]; days.push(...(h ? h.day.map(d => d.nd > 0) : Array(7).fill(false)).reverse()); }
  let n = 0, miss = 0; for (let i = 0; i < days.length; i++) { if (days[i]) { n++; miss = 0; } else if (i > 0 && ++miss >= 2) break; }
  return n;
}
function plRecent(){                                              // tổng việc/thời gian đã xong trong tuần này và 3 tuần trước (cho lời nhắc gia hạn)
  if (PL.off !== 0 || !PL.tasks) return null;
  const all = [plStats(PL.tasks, 0, PL.gone), ...[1, 2, 3].map(i => PL.hist[plKey(-i)]).filter(Boolean)];
  return { n:all.reduce((a, x) => a + x.nd, 0), t:all.reduce((a, x) => a + x.done, 0) };
}
function plTrend(){
  const bars = Array.from({ length:6 }, (_, i) => { const k = PL.off - 5 + i, S = k === PL.off ? plStats(PL.tasks, PL.off, PL.gone) : PL.hist[plKey(k)]; return { cur:k === PL.off, w:plWeekStart(k).toFormat('dd/MM'), r:S && S.dn >= (k === 0 ? 3 : 1) ? S.rate : null }; });
  return `<div class="pl-trend">${bars.map(b => `<div class="${b.cur ? 'cur' : ''}"><i style="height:${b.r === null ? 3 : Math.max(6, b.r)}%" class="${b.r === null ? 'none' : ''}"></i><b>${b.r === null ? '–' : b.r + '%'}</b><small>${b.w}</small></div>`).join('')}</div>`;
}
/* ---------- thống kê tuần / tháng ----------
   Giờ tập trung: đọc sổ Focus theo ngày (localFocus, đã làm sạch ngày hỏng > 1440 phút ở core.js), ngày theo múi giờ của bạn như addFocus.
   Tỉ lệ việc xong: dùng lại plStats (đếm việc đã đến hạn, kể cả việc đã dời / đã bỏ), không tính lại theo cách khác.
   Tháng: gộp các tuần chạm tháng; việc gắn ngày tính theo ngày thật, việc chưa gắn ngày tính cho tháng chứa thứ Năm của tuần (như cách đánh số tuần ISO). */
const plFocusLog = () => PL.fdemo || localFocus();
const plOffOf = ws => Math.round(ws.diff(plWeekStart(0), 'weeks').weeks);
const plWeekData = k => k === PL.key && PL.tasks ? { tasks:PL.tasks, gone:PL.gone || [] } : PL.raw[k];
const plMonthWeeks = ms => { const out = [], end = ms.endOf('month'); for (let w = ms.startOf('week'); w <= end; w = w.plus({ weeks:1 })) out.push(w); return out; };
function plFocusSum(days){
  const fl = plFocusLog(), v = days.map(d => (fl[d.toISODate()] || { m:0 }).m);
  return { v, m:v.reduce((a, x) => a + x, 0), s:days.reduce((a, d) => a + (fl[d.toISODate()] || { s:0 }).s, 0), act:v.filter(x => x > 0).length };
}
function plMonthTasks(ms){
  const T = { n:0, nd:0, dn:0, dnd:0, miss:0 };
  plMonthWeeks(ms).forEach(ws => {
    const o = plOffOf(ws), r = plWeekData(plKey(o)); if (!r) { T.miss++; return; }
    const inM = day => ws.plus({ days:day === null ? 3 : day }).hasSame(ms, 'month');
    const S = plStats(r.tasks.filter(x => inM(x.day)), o, r.gone.filter(g => inM(g.day)));
    T.n += S.n; T.nd += S.nd; T.dn += S.dn; T.dnd += S.dnd;
  });
  return T;
}
async function plMonthLoad(ms){                                    // đọc các tuần của tháng chưa có trong bộ nhớ (mỗi tuần một lần)
  if (DEMO || PL.preview || PL.mload || !state.user) return;
  const raw = PL.raw, keys = plMonthWeeks(ms).map(ws => plKey(plOffOf(ws))).filter(k => k !== PL.key && !(k in raw)); if (!keys.length) return;
  PL.mload = true;
  await Promise.all(keys.map(async k => { try { const r = await plFetch(k); raw[k] = { tasks:r.tasks.map(plClean), gone:r.gone.map(plGoneClean) }; } catch (e) { raw[k] = null; } }));   // raw giữ đúng đối tượng của tài khoản lúc bắt đầu đọc
  PL.mload = false; if (route.name === 'planner') render(true);
}
const plHShort = m => m < 60 ? m + 'm' : (Math.round(m / 6) / 10) + 'h';
function plPeriod(S){
  const now = DT.now().setZone(userTZ), today = now.toISODate(), wk = (PL.sv || store.get('pl_sv', 'w')) !== 'm', loc = d => d.setLocale(state.lang);
  let days, prev, T, head;
  if (wk) {
    const ws = plWeekStart(PL.off); days = Array.from({ length:7 }, (_, i) => ws.plus({ days:i }));
    prev = days.slice(0, PL.off === 0 ? now.weekday : 7).map(d => d.minus({ weeks:1 }));         // tuần này: so với đúng các ngày đã qua của tuần trước
    T = S; head = `<span class="lbl small faint">${ws.toFormat('dd/MM')} – ${ws.plus({ days:6 }).toFormat('dd/MM')}</span>`;
  } else {
    const mo = PL.moff || 0, ms = now.startOf('month').plus({ months:mo }), pm = ms.minus({ months:1 });
    days = Array.from({ length:ms.daysInMonth }, (_, i) => ms.plus({ days:i }));
    prev = Array.from({ length:Math.min(mo ? ms.daysInMonth : now.day, pm.daysInMonth) }, (_, i) => pm.plus({ days:i }));   // tháng này: so với cùng số ngày đầu của tháng trước
    T = plMonthTasks(ms); plMonthLoad(ms);
    head = `<div class="week-nav"><button type="button" class="btn secondary icon sm" data-act="plMon" data-d="-1" aria-label="‹">${ic('chev-l', 'sm')}</button><span class="lbl">${esc(loc(ms).toLocaleString({ month:'long', year:'numeric' }).replace(/^\p{Ll}/u, c => c.toUpperCase()))}</span><button type="button" class="btn secondary icon sm" data-act="plMon" data-d="1" aria-label="›" ${mo >= 0 ? 'disabled' : ''}>${ic('chev-r', 'sm')}</button></div>`;
  }
  const F = plFocusSum(days), P = plFocusSum(prev), mx = Math.max(60, ...F.v), r = T.dn ? Math.round(T.dnd / T.dn * 100) : null, k = wk ? 'w' : 'm', wait = !wk && (PL.mload || T.miss) && !PL.preview && !DEMO;
  const cm = [];
  if (!F.m && !T.n) cm.push(t('pl_ps_c_empty'));
  else {
    if (!F.m) cm.push(t('pl_ps_c_nofocus'));
    else if (!P.m) cm.push(t('pl_ps_c_new', { t:fmtMin(F.m) }));
    else { const d = F.m - P.m; cm.push(Math.abs(d) < Math.max(15, P.m * .1) ? t('pl_ps_c_same_' + k) : t((d > 0 ? 'pl_ps_c_up_' : 'pl_ps_c_down_') + k, { t:fmtMin(Math.abs(d)) })); }
    if (T.dn >= 3) cm.push(t(r >= 80 ? 'pl_ps_c_hi' : r >= 50 ? 'pl_ps_c_mid' : 'pl_ps_c_lo', { r }));
  }
  const bars = days.map((d, i) => { const v = F.v[i], iso = d.toISODate(); return `<div class="${iso === today ? 'cur' : ''}" title="${esc(loc(d).toFormat('ccc dd/MM') + ' · ' + fmtMin(v))}">${wk ? `<b>${v ? plHShort(v) : ''}</b>` : ''}<i class="${v ? '' : 'none'}" style="height:${v ? Math.max(4, v / mx * 78) : 2}%"></i><small>${wk ? esc(loc(d).toFormat('ccc')) : d.day === 1 || d.day % 5 === 0 ? d.day : ''}</small></div>`; }).join('');
  return `<section class="card pad wide pl-ps"><div class="pl-ps-h"><h3>${esc(t('pl_ps_title'))}</h3><div class="pl-ps-ctl"><div class="seg"><button type="button" class="${wk ? 'on' : ''}" data-act="plSv" data-v="w">${esc(t('pl_ps_w'))}</button><button type="button" class="${wk ? '' : 'on'}" data-act="plSv" data-v="m">${esc(t('pl_ps_m'))}</button></div>${head}</div></div>
    <div class="pl-ps-body"><div class="pl-ps-kpis">
      <div class="pl-kpi"><span class="pl-kl">${esc(t('pl_ps_focus'))}</span><b>${esc(fmtMin(F.m))}</b><small>${esc(t('pl_ps_focus_sub', { s:F.s, d:F.act }))}</small></div>
      <div class="pl-kpi"><span class="pl-kl">${esc(t('pl_ps_rate'))}</span><b>${r === null ? '–' : r + '%'}</b>${plBar(T.dnd, T.dn)}<small>${esc(wait ? t('pl_ps_loading') : T.dn ? t('pl_ps_rate_sub', { n:T.dnd, m:T.dn }) : t('pl_ps_rate_none'))}</small></div></div>
      <div class="pl-ps-chart"><p class="small faint">${esc(t('pl_ps_chart'))}</p><div class="pl-fbars ${wk ? '' : 'm'}">${bars}</div></div></div>
    <p class="pl-ps-c">${esc(cm.join(' '))}</p><p class="small faint">${esc(t('pl_ps_how'))}</p></section>`;
}
/* ---------- nhắc việc ----------
   Khi trang đang mở: plRemTick nhắc ngay trong trang (toast + chuông) và hiện thông báo của trình duyệt nếu đã cho phép.
   Khi đã đóng web: máy này lưu mã nhận thông báo (FCM token) vào users/<uid>.plPush, GitHub Actions (scripts/push-planner.mjs)
   đọc Planner khoảng 5 phút một lần và gửi thông báo đẩy. Hai đường dùng cùng tag nên đang mở web cũng chỉ hiện 1 thông báo. */
const plRemOn = () => !!store.get('pl_rem', false);
async function plNotify(title, body, tag, rang){                    // điện thoại Android chỉ cho hiện thông báo qua service worker (new Notification bị lỗi)
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const opts = { body, tag, silent:!!rang, renotify:true, vibrate:[200, 100, 200, 100, 300], icon:'icons/icon-192.png', data:{ url:location.href.split('#')[0] + '#/planner' } };
  try { const reg = await swRegister(); if (reg && reg.showNotification) return await reg.showNotification(title, opts); } catch (e) {}
  try { new Notification(title, opts); } catch (e) {}
}
const plPushOk = () => typeof pushSupported === 'function' && pushSupported() && Notification.permission === 'granted';
async function plPushSync(force){                                   // lưu token của máy này cho máy gửi nhắc việc (ghi lại mỗi tuần, hoặc khi token / ngôn ngữ / múi giờ đổi)
  const u = state.user, rem = plRemOn(), pin = plPinOn(); if (!u || DEMO || !(rem || pin) || !plPushOk() || !await swRegister()) return false;
  const reg = await navigator.serviceWorker.ready, m = await loadMessaging();
  const token = await m.getToken({ vapidKey:PUSH_VAPID, serviceWorkerRegistration:reg }); if (!token) return false;
  const old = store.get('pl_push', null), sig = u.uid + '|' + token + '|' + state.lang + '|' + userTZ + '|' + rem + '|' + pin;
  if (!force && old && old.sig === sig && Date.now() - old.t < 7 * 864e5) return true;
  const F = firebase.firestore.FieldValue, ref = db.collection('users').doc(u.uid);
  if (old && old.uid === u.uid && old.token !== token) await ref.update({ 'plPush.tokens':F.arrayRemove(old.token), 'plPush.pinTokens':F.arrayRemove(old.token) }).catch(() => {});   // token cũ (trình duyệt đã đổi token)
  // tokens = máy nhận nhắc trước giờ làm việc, pinTokens = máy nhận "việc hôm nay" (scripts/push-planner.mjs); mỗi máy bật / tắt riêng
  await ref.set({ plPush:{ on:true, tokens:rem ? F.arrayUnion(token) : F.arrayRemove(token), pinTokens:pin ? F.arrayUnion(token) : F.arrayRemove(token), tz:String(userTZ).slice(0, 64), lang:state.lang, at:TS() } }, { merge:true });
  store.set('pl_push', { uid:u.uid, token, sig, t:Date.now() });
  return true;
}
async function plPushOff(){                                         // tắt nhắc việc / đăng xuất: máy này thôi nhận nhắc khi đã đóng web
  const old = store.get('pl_push', null); store.set('pl_push', null);
  if (!old || DEMO || !state.user || state.user.uid !== old.uid) return;
  const F = firebase.firestore.FieldValue;
  await db.collection('users').doc(old.uid).update({ 'plPush.tokens':F.arrayRemove(old.token), 'plPush.pinTokens':F.arrayRemove(old.token) }).catch(() => {});
}
const plPushHere = () => { const p = store.get('pl_push', null); return !!(p && state.user && p.uid === state.user.uid && plPushOk()); };
const plChimeOn = () => store.get('pl_chime', true) !== false;
function plChime(){                                                 // chuông 2 tiếng tự tạo bằng Web Audio (không cần file âm thanh); trả về true nếu chuông kêu được
  if (!plChimeOn() || typeof audio !== 'function') return false;
  const a = audio(); if (!a || a.state !== 'running') return false;   // trình duyệt còn khoá tiếng (khách chưa chạm vào trang): không xếp chuông, để thông báo của máy kêu thay
  [0, .55].forEach(d => [[880, .22], [1318, .09], [1760, .04]].forEach(([f, v]) => { const o = a.createOscillator(), g = a.createGain(), at = a.currentTime + d; o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(v, at + .01); g.gain.exponentialRampToValueAtTime(.0008, at + 1.1); o.connect(g); g.connect(a.destination); o.start(at); o.stop(at + 1.2); }));
  return true;
}
const plWeekNow = u => PL.key === plKey(0) && PL.tasks && PL.uid === u.uid ? PL.tasks : (PL.remTasks && PL.remTasks.uid === u.uid ? PL.remTasks.tasks : null);   // việc tuần này đang có trong máy (không cần tải)
function plRemTick(){
  const u = state.user; if (!u || !plAccess() || !plRemOn()) return;
  const tasks = plWeekNow(u); if (!tasks) return;
  const now = DT.now().setZone(userTZ), di = now.weekday - 1, mins = now.hour * 60 + now.minute, day = now.toISODate(), say = (title, body, tag) => { const rang = plChime(); plNotify(title, body, tag, rang); toast(body); };
  tasks.forEach(x => { if (x.done || x.day !== di || !x.start) return; const st = hm(x.start), k = x.id + day; if (mins >= st - 10 && mins < st + 5 && !PL.sent[k]) { PL.sent[k] = 1; say(t('pl_rem_title'), t('pl_rem_soon', { t:x.title || '—', s:x.start }), 'pl-' + x.id + '-' + day); } });
  const left = tasks.filter(x => !x.done && x.day === di).length;
  if (mins >= 1200 && mins < 1260 && left && !PL.sent['eve' + day]) { PL.sent['eve' + day] = 1; say(t('pl_rem_title'), t('pl_rem_eve', { n:left }), 'pl-eve-' + day); }
}
/* Bật / tắt nhắc việc: gọi từ bảng chuông 🔔 (core.js plRemSet), không còn nút riêng trong Planner */
async function plRemToggle(on, quiet){
  if (!on) { store.set('pl_rem', false); clearInterval(PL.remT); PL.remT = 0; PL.pushU = ''; await (plPinOn() ? plPushSync(true).catch(() => {}) : plPushOff()); if (!quiet) toast(t('pl_rem_off')); return; }
  let perm = typeof Notification === 'undefined' ? 'denied' : Notification.permission; if (perm === 'default' && !quiet) { try { perm = await Notification.requestPermission(); } catch (e) { perm = 'denied'; } }
  store.set('pl_rem', true); PL.pushU = state.user && state.user.uid; plRemStart();
  if (!quiet && perm !== 'granted') toast(t('pl_rem_inpage'));
  if (perm === 'granted') { try { await plPushSync(true); } catch (e) { console.warn('planner push', e); } }
}
const plRemStart = () => {
  if (!plRemOn() && !plPinOn()) return;
  if (plRemOn() && !PL.remT) PL.remT = setInterval(plRemTick, 30000);
  const uid = state.user && state.user.uid; if (uid && PL.pushU !== uid) { PL.pushU = uid; plPushSync().then(ok => ok && route.name === 'planner' && render(true)).catch(e => console.warn('planner push', e)); }
};
/* ---------- việc hôm nay ngoài màn hình (bật ở bảng chuông 🔔, core.js plPinSet) ----------
   Web không vẽ chồng lên màn hình / màn hình khoá được, nên cách gần nhất là một thông báo YÊN LẶNG (không chuông, không rung), luôn cùng tag 'pl-today'.
   Điện thoại: thông báo nằm luôn trên thanh thông báo / màn hình khoá, tự cập nhật mỗi khi thêm / tick / dời việc và mỗi lần mở / thoát web;
   khách có vuốt đi thì lần sau lại hiện. Máy tính: chỉ hiện khi thoát / chuyển khỏi web (để không che trang), quay lại thì đóng.
   Đã đóng hẳn web: máy gửi (scripts/push-planner.mjs) gửi lại danh sách khi đổi và mỗi sáng. Hết ngày thì tự đóng. */
const PL_PIN_MAX = 6;
const plPinKeep = () => pwaIOS || /android|mobile/i.test(navigator.userAgent);   // điện thoại / máy tính bảng: giữ luôn, kể cả khi đang mở web
function plPinText(){
  const u = state.user, tasks = u && plWeekNow(u); if (!tasks) return null;
  const now = DT.now().setZone(userTZ), di = now.weekday - 1;
  const left = tasks.filter(x => !x.done && x.day === di).sort((a, b) => (a.start || '99').localeCompare(b.start || '99')); if (!left.length) return null;
  const lines = left.slice(0, PL_PIN_MAX).map(x => (x.start || '•') + '  ' + (x.title || '—'));
  if (left.length > PL_PIN_MAX) lines.push(t('plp_more', { n:left.length - PL_PIN_MAX }));
  return { title:t('plp_title', { n:left.length }), body:lines.join('\n'), until:now.endOf('day').toMillis() };
}
async function plPinShow(){
  clearTimeout(PL.pinT);
  if (!plPinOn() || !state.user || !plAccess() || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  if (!document.hidden && !plPinKeep()) return plPinHide();
  const v = plPinText(); if (!v) return plPinHide();
  const reg = await swRegister(); if (!reg || !reg.showNotification) return;
  await reg.showNotification(v.title, { body:v.body, tag:'pl-today', silent:true, renotify:false, icon:'icons/icon-192.png', data:{ url:location.href.split('#')[0] + '#/planner', until:v.until } }).catch(() => {});
  PL.pinT = setTimeout(plPinShow, Math.min(v.until - Date.now() + 5000, 2147483647));   // qua ngày mới mà trang vẫn còn chạy: đổi sang việc của ngày mới (hoặc đóng)
}
document.addEventListener('visibilitychange', plPinShow);
/* ---------- giao diện ---------- */
function plPreview(){                                              // giao diện thật với dữ liệu mẫu, chỉ để xem (dùng cho người chưa là Companion)
  const sample = [[0, '07:30', 45, 'vocab', 0], [0, '19:30', 60, 'listen', 0], [1, '09:00', 90, 'read', 0], [1, '18:00', 45, 'gym', 2], [2, '08:00', 120, 'essay', 1], [2, '20:00', 40, 'book', 3], [3, '07:30', 45, 'vocab', 0], [3, '14:00', 60, 'meet', 1], [4, '09:00', 60, 'speak', 0], [4, '19:00', 90, 'movie', 4], [5, '10:00', 60, 'clean', 5], [5, '15:00', 90, 'read', 0], [6, '09:00', 45, 'review', 0]];
  const di = DT.now().setZone(userTZ).weekday - 1, bak = { ...PL };
  try {
    PL.off = 0; PL.key = plKey(0); PL.preview = true; PL.raw = {}; PL.moff = 0; PL.prefs = { goalMin:600, dayGoalMin:120 }; PL.prev = null; PL.hist = {};
    PL.fdemo = {}; const ws = plWeekStart(0); [50, 75, 100, 25, 50, 0, 75, 100, 50, 125, 75, 25, 50, 0].forEach((m, i) => { if (i < 7 + di + 1) PL.fdemo[ws.minus({ days:7 }).plus({ days:i }).toISODate()] = { m, s:Math.round(m / 25) }; });   // giờ tập trung mẫu: tuần trước + tuần này tới hôm nay PL.gone = [plGoneClean({ id:'g0', t:t('pl_s_clean'), day:1, dur:30, c:5, s:'x' })];
    PL.tasks = sample.map(([day, start, dur, k, c], i) => ({ id:'s' + i, title:t('pl_s_' + k), day, start, dur, c, done:day < 4 && i !== 3 }));
    [8, 7, 9, 6, 7].forEach((r, i) => { PL.hist[plKey(-1 - i)] = plStats(Array.from({ length:10 }, (_, j) => ({ id:'h' + j, title:'x', day:j % 5, start:'09:00', dur:60, c:j % 4, done:j < r })), -1); });
    const S = plStats(PL.tasks, -1, PL.gone);
    return `${plKpis(S)}<div class="pl-main"><div class="card pad pl-gridcard">${plGrid()}</div>${plSide()}</div>${plAnalysis(S)}`;
  } finally { Object.keys(PL).forEach(k => delete PL[k]); Object.assign(PL, bak); }
}
function plUpsell(){
  const login = !state.user;
  return `${head('pl_title', '', '', 'moonwalk', 4)}<section class="card pad stack" style="max-width:640px"><div class="row">${compBadge()}</div>
    <h2 style="font-size:1.3rem">${esc(t('pl_up_title'))}</h2><p class="muted">${esc(login ? t('pl_up_login') : state.companionUntil ? t('pl_up_expired', { d:DT.fromISO(state.companionUntil).toFormat('dd/MM/yyyy') }) : t('pl_up_text'))}</p>
    ${login ? `<a class="btn primary" href="#/account">${esc(t('club_login_btn'))}</a>` : `${trialBox()}${compClaimHTML()}<a class="btn secondary" href="#/donate">${esc(t('pl_up_cta'))}</a>`}</section>
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
/* thanh nhiều đoạn: xong (màu chính) · đã dời (nhạt) · đã bỏ (xám); phần còn trống là chưa làm */
const plBar3 = (segs, total) => { let at = 0; return `<div class="pl-bar">${segs.map(([v, cls]) => { if (!total || v <= 0) return ''; const w = Math.min(100 - at, v / total * 100), h = `<i class="${cls}" style="left:${at}%;width:${w}%"></i>`; at += w; return h; }).join('')}</div>`; };
const plBar = (a, b, color) => `<div class="pl-bar"><i style="width:${b ? Math.min(100, a / b * 100) : 0}%;background:${color || 'var(--accent)'}"></i></div>`;

/* chọn mục tiêu: các mức có sẵn + mức bạn tự đặt (nếu khác các mức đó) + "Tự chọn…" để nhập giờ/phút */
function plGoalSel(change, label, cur, opts, style){
  const list = cur && !opts.includes(cur) ? [...opts, cur].sort((a, b) => a - b) : opts;
  return `<select class="select" data-change="${change}" aria-label="${esc(label)}"${style ? ` style="${style}"` : ''}>${list.map(m => `<option value="${m}" ${cur === m ? 'selected' : ''}>${esc(m ? fmtMin(m) : t('pl_goal_none'))}</option>`).join('')}<option value="custom">${esc(t('pl_goal_custom'))}</option></select>`;
}
function plToday(){
  if (PL.off !== 0) return '';
  const now = DT.now().setZone(userTZ), di = now.weekday - 1, mins = now.hour * 60 + now.minute;
  const list = PL.tasks.filter(x => x.day === di).sort((a, b) => (a.start || '99:99').localeCompare(b.start || '99:99')), nd = list.filter(x => x.done).length, undone = list.filter(x => !x.done);
  const gone = (PL.gone || []).filter(g => g.day === di), out = [...undone.filter(x => x.carried), ...gone], all = list.length + gone.length, open = undone.length - undone.filter(x => x.carried).length;   // kế hoạch ban đầu của hôm nay = việc còn trên lịch + việc đã dời / bỏ khỏi hôm nay
  const planMin = list.reduce((a, x) => a + x.dur, 0), doneMin = list.reduce((a, x) => a + (x.done ? x.dur : 0), 0), goal = PL.prefs && PL.prefs.dayGoalMin || 0;
  const wAll = list.reduce((a, x) => a + plW(x), 0) + gone.reduce((a, g) => a + plW(g), 0), wDone = list.reduce((a, x) => a + (x.done ? plW(x) : 0), 0), wMv = out.filter(g => g.s !== 'x').reduce((a, g) => a + plW(g), 0), frac = goal ? doneMin / goal : wAll ? wDone / wAll : 0;
  const next = list.find(x => !x.done && x.start && hm(x.start) + (x.dur || 0) >= mins);
  const verdict = !all ? t('pl_dv_empty') : nd === all ? t('pl_dv_all') : goal && doneMin >= goal ? t('pl_dv_goal') : !open ? t('pl_dv_adj', { n:nd, m:all, k:out.length }) : nd === 0 ? t(now.hour < 17 ? 'pl_dv_start' : 'pl_dv_none') : t('pl_dv_some', { n:nd, m:all });
  const nMv = out.filter(g => g.s !== 'x').length, nX = gone.filter(g => g.s === 'x').length, mixD = nMv || nX ? [t('pl_k_d', { n:nd }), nMv && t('pl_k_mv', { n:nMv }), nX && t('pl_k_x2', { n:nX }), open && t('pl_k_o2', { n:open })].filter(Boolean).join(' · ') : '';
  const over = plOverdue(), tip = over.length ? { k:t('pl_tip_overdue', { n:over.length }), act:'plMoveToday', btn:t('pl_mv_today') } : planMin > 360 && undone.length ? { k:t('pl_tip_over', { t:fmtMin(planMin) }) } : undone.filter(x => !x.carried).length && now.hour >= 18 ? { k:t('pl_tip_tm'), act:'plMoveTomorrow', btn:t('pl_mv_tm') } : null;
  const row = x => `<div class="pl-li ${x.done ? 'done' : ''}"><button type="button" class="pl-ck sm" style="border-color:${PL_COLORS[x.c]}" data-act="plToggle" data-id="${esc(x.id)}">${x.done ? ic('check', 'sm') : ''}</button><span data-act="plEdit" data-id="${esc(x.id)}">${esc(x.title || '—')}${x.start ? ` <small class="faint">${esc(x.start)}</small>` : ''}${x.carried && !x.done ? ` <small class="faint">· ${esc(t('pl_st_w'))}</small>` : ''}</span></div>`;
  const gRow = g => `<div class="pl-li pl-gone"><i class="pl-gi" style="border-color:${PL_COLORS[g.c]}">${g.s === 'x' ? '×' : '→'}</i><span>${esc(g.t || '—')} <small class="faint">· ${esc(g.s === 'x' ? t('pl_st_x') : g.to === 'w' ? t('pl_st_w') : g.to !== undefined ? t('pl_st_to', { d:t('pl_d' + g.to) }) : t('pl_st_m'))}</small></span></div>`;
  const rem = `<button type="button" class="btn ${plRemOn() ? 'ghost' : 'secondary'} sm" data-act="plBell">${ic('bell', 'sm')} ${esc(t(plRemOn() ? 'pl_rem_on' : 'pl_rem_btn'))}</button><p class="small faint" style="margin-top:6px">${esc(t(plRemOn() ? (plPushHere() ? 'pl_rem_bg' : pwaIOS && !pwaStandalone() ? 'pl_rem_ios' : 'pl_rem_fg') : 'pl_rem_bell'))}</p>`;
  const goalSel = plGoalSel('plDayGoal', t('pl_dgoal'), goal, [0, 30, 60, 90, 120, 180, 240], 'width:auto;padding:3px 8px;font-size:.8rem');
  return `<section class="card pad"><div class="row between"><h3>${esc(t('pl_today'))}</h3>${all ? `<span class="badge">${esc(t('pl_dlv_' + (frac >= 1 ? 4 : frac >= .6 ? 3 : frac >= .3 ? 2 : frac > 0 ? 1 : 0)))}</span>` : ''}</div>
    <div class="row between" style="margin:8px 0 6px"><small class="faint">${nd}/${all}${goal ? ' · ' + esc(fmtMin(doneMin)) + ' / ' + esc(fmtMin(goal)) : wAll ? ' · ' + Math.round(frac * 100) + '%' : ''}</small></div>${goal ? plBar(doneMin, goal) : plBar3([[wDone, ''], [wMv, 'mv'], [wAll - wDone - wMv - list.reduce((a, x) => a + (!x.done && !x.carried ? plW(x) : 0), 0), 'gx']], wAll)}
    ${mixD ? `<p class="small faint" style="margin:6px 0 0">${esc(mixD)}</p>` : ''}
    <p class="small" style="margin:10px 0 4px"><b>${esc(verdict)}</b></p>
    ${next ? `<p class="small muted" style="margin:0 0 4px">${esc(t('pl_next', { t:next.start + ' ' + (next.title || '—') }))}</p>` : ''}
    ${all ? `<div style="margin-top:6px">${list.map(row).join('')}${gone.map(gRow).join('')}</div>` : ''}
    ${tip ? `<div class="pl-tip"><p class="small">${esc(tip.k)}</p>${tip.act ? `<button type="button" class="btn secondary sm" data-act="${tip.act}">${esc(tip.btn)}</button>` : ''}</div>` : ''}
    <div class="row between" style="margin-top:12px"><span class="small faint">${esc(t('pl_dgoal'))}</span>${goalSel}</div><div style="margin-top:10px">${rem}</div></section>`;
}
function plKpis(S){
  const sc = plScore(S), goal = PL.prefs && PL.prefs.goalMin || 0, lv = sc === null ? '' : t('pl_lv_' + (sc >= 85 ? 3 : sc >= 70 ? 2 : sc >= 50 ? 1 : 0)) + (PL.off === 0 ? ' · ' + t('pl_prov') : '');
  const active = S.day.filter(d => d.nd > 0).length, ds = PL.off === 0 ? plDayStreak(S) : 0;
  const goalSel = plGoalSel('plGoal', t('pl_goal'), goal, [0, 5, 10, 15, 20, 30, 40].map(h => h * 60));
  return `<div class="pl-kpis4">
    <div class="pl-kpi" title="${esc(t('pl_score_how2'))}"><span class="pl-kl">${esc(t('pl_score'))}</span><b>${sc === null ? '–' : sc}</b><small>${esc(sc !== null ? lv : S.n ? t('pl_score_wait') : t('pl_i_none'))}</small></div>
    <div class="pl-kpi"><span class="pl-kl">${esc(t('pl_done_tasks'))}</span><b>${S.nd}<em>/${S.n}</em></b>${plBar(S.nd, S.n)}${S.nm || S.nx ? `<small>${esc([S.nm && t('pl_k_mv', { n:S.nm }), S.nx && t('pl_k_x2', { n:S.nx })].filter(Boolean).join(' · '))}</small>` : ''}</div>
    <div class="pl-kpi"><span class="pl-kl">${esc(t('pl_done_min'))}</span><b>${esc(fmtMin(S.done))}</b>${goal ? `${plBar(S.done, goal)}<small>${esc(t('pl_goal_prog', { d:fmtMin(S.done), g:fmtMin(goal), p:Math.min(999, Math.round(S.done / goal * 100)) }))}</small>` : `<small>${esc(t('pl_plan_min'))}: ${esc(fmtMin(S.plan))}</small>`}<div class="pl-goal"><span>${esc(t('pl_goal_set'))}</span>${goalSel}</div></div>
    <div class="pl-kpi"><span class="pl-kl">${esc(t('pl_dstreak_l'))}</span><b>${active}<em>/7</em></b><small>${esc(ds >= 2 ? t('pl_dstreak', { n:ds }) : t('pl_dstreak_0'))}</small></div></div>`;
}
function plQuickBar(){
  const tpl = PL.prefs && PL.prefs.template || [];
  return `<div class="pl-tools"><form class="pl-quick" data-form="plQuick" autocomplete="off"><input class="input" id="pl-quick" maxlength="80" placeholder="${esc(t('pl_quick_ph'))}" aria-label="${esc(t('pl_quick_btn'))}"><button class="btn secondary" type="submit">${ic('plus', 'sm')} ${esc(t('pl_quick_btn'))}</button></form>
    <details class="pl-menu"><summary class="btn ghost">${esc(t('pl_tpl_menu'))}</summary><div class="pl-pop card"><p class="small faint">${esc(t('pl_tpl_hint'))}</p><button type="button" class="btn secondary sm" data-act="plTplSave">${esc(t('pl_tpl_save'))}</button>${tpl.length ? `<button type="button" class="btn secondary sm" data-act="plTplUse">${esc(t('pl_tpl_use'))} (${tpl.length})</button>` : ''}</div></details></div>`;
}
function plSide(){
  const left = PL.tasks.filter(x => !x.done), open = left.filter(x => !x.carried), noDay = PL.tasks.filter(x => x.day === null), di = DT.now().setZone(userTZ).weekday - 1, tmN = PL.off === 0 ? open.filter(x => x.day === di).length : 0;
  const row = x => `<div class="pl-li ${x.carried ? 'done' : ''}"><button type="button" class="pl-ck sm" style="border-color:${PL_COLORS[x.c]}" data-act="plToggle" data-id="${esc(x.id)}">${x.done ? ic('check', 'sm') : ''}</button><span data-act="plEdit" data-id="${esc(x.id)}">${esc(x.title || '—')}${x.day !== null ? ` <small class="faint">${esc(t('pl_d' + x.day))}${x.start ? ' ' + esc(x.start) : ''}</small>` : ''}</span>${x.carried ? `<div class="pl-li-x"><small class="faint">${esc(t('pl_carried'))}</small><button type="button" class="btn ghost sm" data-act="plUncarry" data-id="${esc(x.id)}">${esc(t('pl_uncarry'))}</button></div>` : ''}</div>`;
  return `<div class="pl-side">${plToday()}
    <section class="card pad"><h3>${esc(t('pl_still'))}</h3><div class="pl-list">${left.length ? left.map(row).join('') : `<p class="muted small">${esc(t('pl_left_none'))}</p>`}</div>${tmN ? `<button class="btn secondary sm mt-s" data-act="plMoveTomorrow">${esc(t('pl_carry_tm'))}</button>` : ''}${left.length - open.length > 1 ? `<button class="btn ghost sm mt-s" data-act="plUncarry">${esc(t('pl_uncarry_all'))}</button>` : ''}</section>
    ${noDay.length ? `<section class="card pad"><h3>${esc(t('pl_week_list'))}</h3><div class="pl-list">${noDay.map(row).join('')}</div></section>` : ''}</div>`;
}
function plAnalysis(S){
  const mx = Math.max(60, ...S.day.map(x => x.plan));
  return `<h2 class="pl-h2">${esc(t('pl_ana'))}</h2><div class="pl-ana">
    ${plPeriod(S)}
    <section class="card pad"><h3>${esc(t('pl_trend'))}</h3>${plTrend()}</section>
    <section class="card pad"><h3>${esc(t('pl_by_day'))}</h3>${S.day.map((d, i) => `<div class="pl-row"><span>${esc(t('pl_d' + i))}</span><div class="pl-bar tall"><i class="lt" style="width:${Math.min(100, d.plan / mx * 100)}%"></i><i style="width:${Math.min(100, d.done / mx * 100)}%"></i></div><small class="faint">${esc(fmtMin(d.done))} / ${esc(fmtMin(d.plan))}${d.mv || d.x ? ' · ' + esc([d.mv && t('pl_k_mv', { n:d.mv }), d.x && t('pl_k_x2', { n:d.x })].filter(Boolean).join(' · ')) : ''}</small></div>`).join('')}</section>
    <section class="card pad"><h3>${esc(t('pl_by_cat'))}</h3>${S.n ? S.cat.map((c, i) => c.n ? `<div class="pl-row"><span><i class="dot" style="background:${PL_COLORS[i]}"></i> ${esc(t('pl_c' + i))}</span>${plBar(c.nd, c.n, PL_COLORS[i])}<small class="faint">${c.nd}/${c.n}</small></div>` : '').join('') : `<p class="muted small">${esc(t('pl_i_none'))}</p>`}</section>
    <section class="card pad wide"><h3>${esc(t('pl_insights'))}</h3><ul class="pl-ins">${plInsights(S).map(s => `<li>${esc(s)}</li>`).join('')}</ul><p class="small faint" style="margin-top:10px">${esc(t('pl_how'))}</p></section></div>`;
}
PAGES.planner = function(){
  if (!state.user && !state.authReady && !DEMO) return page('<div class="gate-load"><i></i></div>');
  if (!state.user && !DEMO) return page(plUpsell());
  if (!plAccess()) { refreshCompanion().then(ch => ch && render(true)); return page(plUpsell()); }
  if (PL.uid !== state.user.uid) { clearTimeout(PL.timer); PL.seq++; Object.assign(PL, { uid:state.user.uid, off:0, key:'', tasks:null, gone:[], state:'idle', save:'', prev:null, sel:null, slow:false, hist:{}, raw:{}, moff:0, prefs:null }); }   // đổi tài khoản trên cùng trình duyệt: không để lộ planner của người trước
  if (!state.companionUntil && !state.isAdmin && !DEMO && !trialActive()) refreshCompanion().then(ch => ch && render(true));       // lấy ngày hết hạn để hiện nhắc gia hạn
  plLoad(); plRemStart();
  const ws = plWeekStart(PL.off), nav = `<div class="row between" style="margin-bottom:16px;flex-wrap:wrap;gap:10px"><div class="week-nav"><button class="btn secondary icon" data-act="plWeek" data-d="-1">${ic('chev-l')}</button><span class="lbl">${ws.toFormat('dd/MM')} – ${ws.plus({ days:6 }).toFormat('dd/MM/yyyy')}</span><button class="btn secondary icon" data-act="plWeek" data-d="1">${ic('chev-r')}</button>${PL.off ? `<button class="btn ghost sm" data-act="plWeek" data-d="0">${esc(t('pl_this'))}</button>` : ''}</div>
    <div class="row"><span class="small faint" id="pl-status">${PL.save === 'saved' ? '✓ ' + esc(t('pl_saved')) : PL.save === 'saving' ? esc(t('pl_saving')) : ''}</span><button class="btn primary" data-act="plNew">${ic('plus', 'sm')} ${esc(t('pl_add'))}</button></div></div>`;
  let body;
  if (PL.state === 'error') body = `<p class="muted">${esc(t('pl_load_err'))}</p><button class="btn primary" data-act="plRetry">${esc(t('club_retry'))}</button>${PL.err ? `<p class="small faint">${esc(PL.err)}</p>` : ''}`;
  else if (!PL.tasks) body = `<p class="muted">${esc(t(PL.slow ? 'pl_slow' : 'pl_loading'))}</p>${PL.slow ? `<button class="btn primary" data-act="plRetry">${esc(t('club_retry'))}</button>` : ''}`;
  else { const S = plStats(PL.tasks, PL.off, PL.gone); body = `${plKpis(S)}${plQuickBar()}<p class="small faint pl-hint" style="margin:4px 0 10px">${esc(t('pl_hint'))}</p><div class="pl-main"><div class="card pad pl-gridcard">${plGrid()}</div>${plSide()}</div>${plAnalysis(S)}`; }
  page(`${head('pl_title', 'pl_sub', '', 'moonwalk', 4)}${hintNote('new_pl')}${trialActive() && !state.companion && !state.isAdmin ? `<p class="small muted" style="margin:-6px 0 12px">${esc(t('trial_active', { d:trialEnd() }))} <a href="#/donate">${esc(t('pl_up_cta'))}</a></p>` : ''}${state.companion && state.companionUntil && !state.isAdmin ? (compRenewOpen() ? `<div class="card pad stack" style="margin-bottom:14px"><p class="small">${esc(t('pl_soon', { d:compUntilDay() }))}</p>${(() => { const r = plRecent(); return r && r.n ? `<p class="small"><b>${esc(t('pl_soon_stats', { n:r.n, t:fmtMin(r.t) }))}</b></p>` : ''; })()}${compClaimHTML()}</div>` : `<p class="small muted" style="margin:-6px 0 12px">${esc(compUntilText())}</p>`) : ''}${nav}${body}`);
};
/* ---------- hộp thoại thêm / sửa ---------- */
function plForm(x, isNew, day, start){
  const dayChips = isNew
    ? `<div class="field"><label class="label">${esc(t('pl_f_days'))}</label><div class="row" style="gap:6px">${Array.from({ length:7 }, (_, i) => `<label class="chip pl-dchip"><input type="checkbox" class="pl-day" value="${i}" ${i === day ? 'checked' : ''}> ${esc(t('pl_d' + i))}</label>`).join('')}</div><p class="small faint" style="margin-top:4px">${esc(t('pl_f_noday'))}: ${esc(t('pl_empty_list'))}</p></div>`
    : `<div class="field"><label class="label">${esc(t('pl_f_day'))}</label><select class="select" id="pl-day1"><option value="">${esc(t('pl_f_noday'))}</option>${Array.from({ length:7 }, (_, i) => `<option value="${i}" ${x.day === i ? 'selected' : ''}>${esc(t('pl_d' + i))}</option>`).join('')}</select></div>`;
  openModal(`<h3 style="margin-bottom:12px">${esc(t(isNew ? 'pl_new' : 'pl_edit'))}</h3>
    <div class="field"><label class="label">${esc(t('pl_f_title'))}</label><input class="input" id="pl-title" maxlength="80" value="${esc(x.title)}"></div>
    <div class="mt-s">${dayChips}</div>
    <div class="f2 mt-s"><div class="field"><label class="label">${esc(t('pl_f_start'))}</label><input class="input" type="time" id="pl-start" value="${esc(start !== undefined ? start : x.start)}"></div><div class="field"><label class="label">${esc(t('pl_f_len'))}</label>${plDurIn(x.dur, 'pl-dur')}</div></div>
    <div class="row mt-s" style="gap:6px;flex-wrap:wrap">${[15, 30, 45, 60, 90, 120, 180].map(m => `<button type="button" class="chip" data-act="plDur" data-m="${m}">${esc(fmtMin(m))}</button>`).join('')}</div>
    <div class="field mt-s"><label class="label">${esc(t('pl_f_cat'))}</label><div class="row" style="gap:8px" id="pl-cats">${PL_COLORS.map((c, i) => `<button type="button" class="pl-cat ${x.c === i ? 'on' : ''}" data-act="plCat" data-c="${i}" style="background:${c}" title="${esc(t('pl_c' + i))}"><span>${esc(t('pl_c' + i))}</span></button>`).join('')}</div></div>
    ${isNew ? '' : `<label class="chk row small mt-s" style="font-weight:700"><input type="checkbox" id="pl-done" ${x.done ? 'checked' : ''}> ${esc(t('pl_f_done'))}</label>`}
    <div class="row mt" style="justify-content:space-between">${isNew ? '<span></span>' : `<button type="button" class="btn danger" data-act="plDel">${esc(t('pl_delete'))}</button>`}<span class="row"><button type="button" class="btn ghost" data-act="closeModal">${esc(t('cancel'))}</button><button type="button" class="btn primary" data-act="plSaveTask">${esc(t('pl_save'))}</button></span></div>`, true);
  PL.cat = x.c;
  setTimeout(() => { const el = $('pl-title'); if (el && isNew) el.focus(); }, 30);
}
/* dời việc chưa xong hôm nay sang ngày mai: chỉnh giờ bắt đầu / số phút cho từng việc trước khi dời */
function plTmForm(){
  if (PL.off !== 0 || !PL.tasks) return;
  const now = DT.now().setZone(userTZ), di = now.weekday - 1, byStart = (a, b) => (a.start || '99:99').localeCompare(b.start || '99:99');
  const mv = PL.tasks.filter(x => x.day === di && !x.done && !x.carried).sort(byStart); if (!mv.length) return;
  const have = di < 6 ? PL.tasks.filter(x => x.day === di + 1 && x.start && !x.done).sort(byStart) : [];      // Chủ nhật: ngày mai thuộc tuần sau, chưa tải nên không liệt kê
  const row = x => `<div class="pl-mv" data-id="${esc(x.id)}" style="padding:10px 0;border-bottom:1px solid var(--line)">
    <label class="chk row small" style="font-weight:700;gap:8px;flex-wrap:nowrap"><input type="checkbox" class="pl-mv-on" checked><i style="flex:none;width:10px;height:10px;border-radius:4px;background:${PL_COLORS[x.c]}"></i><span>${esc(x.title || '—')}</span></label>
    <div class="row" style="gap:8px;margin-top:6px;padding-left:26px;flex-wrap:nowrap"><input class="input pl-mv-start" type="time" value="${esc(x.start)}" aria-label="${esc(t('pl_f_start'))}" style="flex:1;min-width:0;max-width:150px">${plDurIn(x.dur)}</div></div>`;
  openModal(`<h3 style="margin-bottom:6px">${esc(t('pl_tm_title'))}</h3><p class="small muted">${esc(t('pl_tm_sub', { d:t('pl_d' + (di + 1) % 7) + ' ' + now.plus({ days:1 }).toFormat('dd/MM') }))}</p>
    ${have.length ? `<p class="small faint mt-s">${esc(t('pl_tm_have', { l:have.map(x => x.start + ' ' + (x.title || '—')).join(', ') }))}</p>` : ''}
    <div class="mt-s">${mv.map(row).join('')}</div>
    <div class="row mt" style="justify-content:flex-end"><button type="button" class="btn ghost" data-act="closeModal">${esc(t('cancel'))}</button><button type="button" class="btn primary" data-act="plTmGo">${esc(t('pl_tm_go'))}</button></div>`, true);
}
/* tự đặt mục tiêu (ngày: dayGoalMin, tuần: goalMin) bằng giờ + phút */
function plGoalForm(k){
  const day = k === 'dayGoalMin', cur = PL.prefs && PL.prefs[k] || 0;
  render(true);                                                   // đưa ô chọn về mức đang dùng, phòng khi bấm Huỷ
  openModal(`<h3 style="margin-bottom:6px">${esc(t(day ? 'pl_dgoal' : 'pl_goal'))}</h3><p class="small muted">${esc(t('pl_goal_custom_sub'))}</p>
    <div class="row mt-s" style="flex-wrap:nowrap"><div class="field" style="flex:1"><label class="label" for="pl-gh">${esc(t('pl_goal_hh'))}</label><input class="input" type="number" id="pl-gh" min="0" max="${day ? 24 : 168}" step="1" inputmode="numeric" value="${Math.floor(cur / 60)}"></div><div class="field" style="flex:1"><label class="label" for="pl-gm">${esc(t('pl_goal_mm'))}</label><input class="input" type="number" id="pl-gm" min="0" max="59" step="5" inputmode="numeric" value="${cur % 60}"></div></div>
    <div class="row mt" style="justify-content:flex-end"><button type="button" class="btn ghost" data-act="closeModal">${esc(t('cancel'))}</button><button type="button" class="btn primary" data-act="plGoalSave" data-k="${k}">${esc(t('pl_save'))}</button></div>`, true);
  setTimeout(() => { const el = $('pl-gh'); if (el) el.focus(); }, 30);
}
FORMS.plQuick = f => {
  const inp = f.querySelector('input'); let v = inp.value.trim(); if (!v || !PL.tasks) return;
  if (PL.tasks.length >= PL_MAX) return toast(t('pl_max', { n:PL_MAX }));
  const m = v.match(/^(\d{1,2})[:h](\d{2})?\s+(.+)$/i), day = PL.off === 0 ? DT.now().setZone(userTZ).weekday - 1 : null;
  PL.tasks.push(plClean(m && +m[1] < 24 && +(m[2] || 0) < 60 ? { title:m[3], day, start:m[1] + ':' + (m[2] || '00'), dur:60, c:0 } : { title:v, day, c:0 }));
  plSave(); render(true); setTimeout(() => { const n = $('pl-quick'); if (n) n.focus(); }, 30);
};
Object.assign(ACTIONS, {
  plSv: el => { PL.sv = el.dataset.v === 'm' ? 'm' : 'w'; store.set('pl_sv', PL.sv); render(true); },
  plMon: el => { PL.moff = Math.max(-36, Math.min(0, (PL.moff || 0) + (+el.dataset.d || 0))); render(true); },
  plBell: () => { window.scrollTo({ top:0, behavior:'smooth' }); if (!$('live-rem').classList.contains('open')) ACTIONS.notif(); },   // mở bảng chuông 🔔, nơi bật/tắt nhắc việc
  plMday: el => { PL.mday = +el.dataset.d; render(true); },
  plWeek: el => { plFlush(); PL.mday = null; const d = +el.dataset.d; PL.off = d ? PL.off + d : 0; PL.seq++; PL.tasks = null; PL.key = ''; PL.state = 'idle'; render(true); },
  plRetry: () => { PL.seq++; PL.state = 'idle'; PL.key = ''; PL.tasks = null; PL.slow = false; render(true); },
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
    mv.forEach(x => { plMark(x, 'm', di); x.day = di; x.start = ''; plLand(x); }); plSave(); render(true); toast(t('pl_moved', { n:mv.length }));
  },
  plMoveTomorrow: () => plTmForm(),
  plTmGo: async () => {
    if (PL.off !== 0 || !PL.tasks || PL.key !== plKey(0)) return closeModal();
    const di = DT.now().setZone(userTZ).weekday - 1;
    const picks = [...document.querySelectorAll('.pl-mv')].filter(r => r.querySelector('.pl-mv-on').checked)
      .map(r => ({ x:PL.tasks.find(v => v.id === r.dataset.id), start:r.querySelector('.pl-mv-start').value, dur:plDurGet(r.querySelector('.pl-dur')) }))
      .filter(p => p.x && !p.x.done && !p.x.carried);
    if (!picks.length) return toast(t('pl_tm_none'));
    if (di < 6) picks.forEach(p => { plMark(p.x, 'm', di + 1); Object.assign(p.x, plClean({ ...p.x, day:di + 1, start:p.start, dur:p.dur })); plLand(p.x); });
    else {                                                        // Chủ nhật: ngày mai là thứ Hai tuần sau, chép sang tuần sau như cũ để còn bấm "Đưa về" được
      try {
        const nk = plKey(1); let next = [];
        if (!DEMO) { const d = await plRef(nk).get(); next = d.exists && Array.isArray(d.data().tasks) ? d.data().tasks.map(plClean) : []; }
        if (next.length + picks.length > PL_MAX) return toast(t('pl_max', { n:PL_MAX }));
        picks.forEach(p => { const c = plClean({ ...p.x, id:plId(), day:0, start:p.start, dur:p.dur, done:false, carried:false }); next.push(c); p.x.carried = c.id; });
        if (!DEMO) await plRef(nk).set({ tasks:next, updatedAt:TS() }, { merge:true });
      } catch (e) { console.warn('move tomorrow', e.code); return toast(t('pl_err')); }
    }
    closeModal(); plSave(); render(true); toast(t('pl_moved', { n:picks.length }));
  },
  plGoalSave: el => {
    const k = el.dataset.k; if (k !== 'dayGoalMin' && k !== 'goalMin') return;
    const v = Math.max(0, Math.min(k === 'dayGoalMin' ? 1440 : 10080, Math.round((+$('pl-gh').value || 0) * 60 + (+$('pl-gm').value || 0))));
    plSavePrefs({ [k]:v }); closeModal(); render(true);
  },
  plNew: (el, e) => {
    if (!PL.tasks) return; let day = el.dataset.day !== undefined ? +el.dataset.day : (PL.off === 0 ? DT.now().setZone(userTZ).weekday - 1 : 0), start = '';
    if (day !== null && e && e.clientY !== undefined && el.dataset.g0 !== undefined) { const r = el.getBoundingClientRect(), mins = Math.round((e.clientY - r.top) / PL_HOUR * 2) * 30 + (+el.dataset.g0) * 60; start = hmStr(Math.max(0, Math.min(1410, mins))); }
    PL.sel = null; plForm({ title:'', day, start:'', dur:60, c:0, done:false }, true, day, start);
  },
  plEdit: el => { const x = PL.tasks.find(v => v.id === el.dataset.id); if (!x) return; PL.sel = x.id; plForm(x, false); },
  plDur: el => { const n = $('pl-dur'), m = +el.dataset.m; if (!n) return; n.querySelector('[data-u=h]').value = Math.floor(m / 60); n.querySelector('[data-u=m]').value = m % 60; },
  plCat: el => { PL.cat = +el.dataset.c; document.querySelectorAll('#pl-cats .pl-cat').forEach(b => b.classList.toggle('on', +b.dataset.c === PL.cat)); },
  plToggle: el => { const x = PL.tasks.find(v => v.id === el.dataset.id); if (!x) return; x.done = !x.done; plSave(); render(true); },
  plDel: () => {
    const x = PL.tasks.find(v => v.id === PL.sel); if (!x) return closeModal();
    if (x.done || x.carried || !plStarted(x.day)) return ACTIONS.plDelGo({ dataset:{ s:'' } });   // việc đã xong / chưa tới ngày: xoá luôn như trước, không có gì cần ghi nhận
    openModal(`<h3 style="margin-bottom:6px;padding-right:32px">${esc(t('pl_del_q'))}</h3><p class="small muted">${esc(t('pl_del_sub'))}</p>
      <div class="stack mt"><button type="button" class="btn primary" data-act="plDelGo" data-s="x">${esc(t('pl_del_drop'))}</button><button type="button" class="btn ghost" data-act="plDelGo" data-s="">${esc(t('pl_del_wipe'))}</button><button type="button" class="btn ghost" data-act="closeModal">${esc(t('cancel'))}</button></div>`, true);
  },
  plDelGo: el => { const x = PL.tasks.find(v => v.id === PL.sel); if (x && el.dataset.s === 'x') plMark(x, 'x'); PL.tasks = PL.tasks.filter(v => v.id !== PL.sel); PL.sel = null; closeModal(); plSave(); render(true); },
  plSaveTask: async () => {
    const title = $('pl-title').value.trim(); if (!title) { $('pl-title').focus(); return; }
    const start = $('pl-start').value, dur = plDurGet($('pl-dur')), base = { title, start, dur, c:PL.cat || 0 };
    if (PL.sel) { const x = PL.tasks.find(v => v.id === PL.sel); if (x) { const d1 = $('pl-day1').value, dn = $('pl-done').checked, day = d1 === '' ? null : +d1; if (x.carried) await plUncarry([x]); if (day !== x.day && !dn) plMark(x, 'm', day === null ? undefined : day); Object.assign(x, plClean({ ...x, ...base, day, done:dn })); plLand(x); } }
    else {
      const days = [...document.querySelectorAll('.pl-day:checked')].map(b => +b.value);
      if (PL.tasks.length + Math.max(1, days.length) > PL_MAX) { toast(t('pl_max', { n:PL_MAX })); return; }
      (days.length ? days : [null]).forEach(day => PL.tasks.push(plClean({ ...base, day })));
    }
    PL.sel = null; closeModal(); plSave(); render(true);
  },
  plUncarry: async el => { const list = el && el.dataset.id ? PL.tasks.filter(x => x.id === el.dataset.id && x.carried) : PL.tasks.filter(x => x.carried); if (list.length && await plUncarry(list)) { render(true); toast(t('pl_uncarried_n', { n:list.length })); } },
});
CHANGES.plDayGoal = el => { if (el.value === 'custom') return plGoalForm('dayGoalMin'); plSavePrefs({ dayGoalMin:+el.value || 0 }); render(true); };
CHANGES.plGoal = el => { if (el.value === 'custom') return plGoalForm('goalMin'); plSavePrefs({ goalMin:+el.value || 0 }); render(true); };
