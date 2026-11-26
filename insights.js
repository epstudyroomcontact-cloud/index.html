'use strict';
/* =========================================================
   PHÂN TÍCH GIỜ HỌC HIỆU QUẢ (#/insights) — chỉ tải khi mở trang này (core.js loadInsights).
   Mọi con số được tính ngay trong trình duyệt, từ dữ liệu đã có sẵn, không đọc / ghi thêm Firestore:
   - localFocus(): sổ theo ngày { 'yyyy-mm-dd': { m:phút, s:phiên } } (có từ trước, đi theo tài khoản)
   - localSess(): sổ từng phiên [{ t, p, d, c }] (mới, ghi ở pages.js khi xong / dừng phiên, đi kèm hồ sơ users/<uid>.focusSess)
   Ai cũng xem được phần cơ bản (tổng phút, ngày học, theo thứ trong tuần, theo tuần, 1 lời khuyên).
   Người đồng hành (và admin, người đang dùng mã dùng thử) xem thêm phần sâu: khung giờ trong ngày, độ dài phiên hợp nhất,
   tỉ lệ làm trọn phiên, theo tháng và tối đa 3 lời khuyên.
   ========================================================= */
(function(){
  const G = {
    en:{
      ins_title:'Your best study hours', ins_sub:'When and how you focus best, worked out from your own focus sessions.',
      ins_empty_h:'Not enough data yet', ins_empty_p:'Finish a few focus sessions in the Focus room. After about a week your strongest days, best hours and tips will show up here.', ins_go_focus:'Go to Focus room',
      ins_t_28:'Minutes in 28 days', ins_t_days:'Study days in 28 days', ins_t_avg:'Average per study day', ins_t_rate:'Sessions finished', ins_vs:'{p} vs the 28 days before', ins_rate_n:'of {n} sessions',
      ins_wd_h:'By day of the week', ins_wd_note:'Average minutes on each weekday over the last 12 weeks.',
      ins_wk_h:'Week by week', ins_wk_note:'Total minutes in each of the last 8 weeks.', ins_mo_h:'Month by month', ins_mo_note:'Total minutes in each of the last 6 months.',
      ins_hr_h:'Time of day', ins_hr_note:'Minutes of finished sessions in each hour of the day.', ins_best_win:'Your best window: {w}',
      ins_pt_h:'Day × time of day', ins_part_0:'Morning', ins_part_1:'Afternoon', ins_part_2:'Evening', ins_part_3:'Late night',
      ins_len_h:'Session length', ins_len_note:'How often you finish sessions of each length.', ins_len_b0:'≤ 15 min', ins_len_b1:'16–30 min', ins_len_b2:'31–50 min', ins_len_b3:'> 50 min', ins_len_n:'{n} sessions', ins_best_len:'Suits you best: {l}',
      ins_tips_h:'Tips for you', ins_tip_none:'Keep going! Tips appear once there is a little more to compare.',
      ins_need:'Needs {n} more sessions to show.', ins_need_days:'Needs about {n} more days of studying to show.',
      ins_since:'Times and session lengths are recorded from {d}. Sessions before that only count in the day totals.',
      ins_lock_h:'Deeper insights for Companions', ins_lock_p:'Companions also see their best time of day, the session length that suits them, how often they finish sessions, monthly trends and up to 3 personal tips.', ins_lock_cta:'Become a Companion', ins_comp:'Companion perk',
      ins_local:'Worked out right in your browser from your own data. When you are signed in it follows your account to other devices.',
      ins_tip_win:'You focus best around {w}. Save that time for your hardest task of the day.',
      ins_tip_len:'You finish {r}% of {a} sessions but only {r2}% of {b} ones. Try setting the focus timer to about {m} minutes.',
      ins_tip_short:'You stop {r}% of sessions before the end. Try a timer 5 minutes shorter, then build back up.',
      ins_tip_good:'You finish {r}% of your sessions. Great focus! You could try sessions 5 minutes longer.',
      ins_tip_day:'{d} is your strongest day (about {m} min). {w} is usually your quietest, so even one short session there helps.',
      ins_tip_up:'So far this week you have studied {p}% more than at this point last week. Keep the rhythm!',
      ins_tip_down:'This week is {p}% behind the same point last week. One 25-minute session today is enough to get back on track.',
      ins_tip_late:'{p}% of your focus time is after 10 PM. Moving some of it earlier helps you sleep and remember better.',
      ins_tip_even:'You studied on {n} of the last 14 days. A little every day sticks better than one long day, so aim for one short session daily.'
    },
    vi:{
      ins_title:'Giờ học hiệu quả của bạn', ins_sub:'Bạn tập trung tốt nhất lúc nào và theo cách nào, tính từ chính các phiên tập trung của bạn.',
      ins_empty_h:'Chưa đủ dữ liệu', ins_empty_p:'Bạn hãy làm vài phiên tập trung ở Phòng tập trung. Sau khoảng một tuần, ngày học tốt nhất, khung giờ hợp nhất và lời khuyên sẽ hiện ở đây.', ins_go_focus:'Tới Phòng tập trung',
      ins_t_28:'Phút trong 28 ngày', ins_t_days:'Ngày có học (28 ngày)', ins_t_avg:'Trung bình mỗi ngày học', ins_t_rate:'Phiên làm trọn', ins_vs:'{p} so với 28 ngày trước', ins_rate_n:'trên {n} phiên',
      ins_wd_h:'Theo ngày trong tuần', ins_wd_note:'Số phút trung bình của mỗi thứ trong 12 tuần gần đây.',
      ins_wk_h:'Theo từng tuần', ins_wk_note:'Tổng số phút của 8 tuần gần đây.', ins_mo_h:'Theo từng tháng', ins_mo_note:'Tổng số phút của 6 tháng gần đây.',
      ins_hr_h:'Khung giờ trong ngày', ins_hr_note:'Số phút của các phiên làm trọn, theo từng giờ trong ngày.', ins_best_win:'Khung giờ tốt nhất: {w}',
      ins_pt_h:'Thứ × buổi trong ngày', ins_part_0:'Sáng', ins_part_1:'Chiều', ins_part_2:'Tối', ins_part_3:'Khuya',
      ins_len_h:'Độ dài phiên', ins_len_note:'Tỉ lệ bạn làm trọn phiên theo từng độ dài.', ins_len_b0:'≤ 15 phút', ins_len_b1:'16–30 phút', ins_len_b2:'31–50 phút', ins_len_b3:'> 50 phút', ins_len_n:'{n} phiên', ins_best_len:'Hợp với bạn nhất: {l}',
      ins_tips_h:'Lời khuyên cho bạn', ins_tip_none:'Cứ tiếp tục nhé! Khi có thêm chút dữ liệu để so sánh, lời khuyên sẽ hiện ở đây.',
      ins_need:'Cần thêm {n} phiên nữa để hiện.', ins_need_days:'Cần học thêm khoảng {n} ngày nữa để hiện.',
      ins_since:'Giờ và độ dài từng phiên được ghi từ {d}. Các phiên trước đó chỉ được tính vào tổng phút theo ngày.',
      ins_lock_h:'Phân tích sâu dành cho Người đồng hành', ins_lock_p:'Người đồng hành xem thêm được khung giờ tập trung tốt nhất, độ dài phiên hợp với mình, tỉ lệ làm trọn phiên, xu hướng theo tháng và tối đa 3 lời khuyên riêng.', ins_lock_cta:'Trở thành Người đồng hành', ins_comp:'Đặc quyền Người đồng hành',
      ins_local:'Mọi thứ được tính ngay trên trình duyệt từ dữ liệu của chính bạn. Khi đăng nhập, dữ liệu đi theo tài khoản sang máy khác.',
      ins_tip_win:'Bạn tập trung tốt nhất khoảng {w}. Hãy dành khung giờ này cho việc khó nhất trong ngày.',
      ins_tip_len:'Bạn làm trọn {r}% phiên {a} nhưng chỉ {r2}% phiên {b}. Thử đặt bộ đếm tập trung khoảng {m} phút.',
      ins_tip_short:'Bạn dừng giữa chừng {r}% số phiên. Thử đặt bộ đếm ngắn hơn 5 phút, quen rồi hãy tăng dần.',
      ins_tip_good:'Bạn làm trọn {r}% số phiên. Tập trung rất tốt! Bạn có thể thử phiên dài thêm 5 phút.',
      ins_tip_day:'{d} là ngày bạn học nhiều nhất (khoảng {m} phút). {w} thường ít nhất, chỉ cần một phiên ngắn vào ngày đó cũng giúp nhiều.',
      ins_tip_up:'Tuần này tới giờ bạn đã học nhiều hơn {p}% so với cùng thời điểm tuần trước. Giữ nhịp nhé!',
      ins_tip_down:'Tuần này đang ít hơn {p}% so với cùng thời điểm tuần trước. Chỉ cần một phiên 25 phút hôm nay là lấy lại nhịp.',
      ins_tip_late:'{p}% thời gian tập trung của bạn rơi vào sau 22 giờ. Dời bớt lên sớm hơn sẽ giúp bạn ngủ đủ và nhớ bài tốt hơn.',
      ins_tip_even:'Bạn học {n} trên 14 ngày gần đây. Học ít mà đều mỗi ngày nhớ lâu hơn dồn một ngày, hãy đặt mục tiêu một phiên ngắn mỗi ngày.'
    },
    ja:{
      ins_title:'あなたの集中しやすい時間', ins_sub:'あなた自身の集中セッションから、いつ・どのように一番集中できるかを分析します。',
      ins_empty_h:'まだデータが足りません', ins_empty_p:'Focusルームで集中セッションをいくつか完了しましょう。1週間ほどで、得意な曜日や時間帯、アドバイスがここに表示されます。', ins_go_focus:'Focusルームへ',
      ins_t_28:'28日間の分数', ins_t_days:'28日間の学習日数', ins_t_avg:'学習日あたりの平均', ins_t_rate:'完了したセッション', ins_vs:'前の28日間比 {p}', ins_rate_n:'{n}セッション中',
      ins_wd_h:'曜日別', ins_wd_note:'直近12週間の曜日ごとの平均分数。',
      ins_wk_h:'週ごと', ins_wk_note:'直近8週間の合計分数。', ins_mo_h:'月ごと', ins_mo_note:'直近6か月の合計分数。',
      ins_hr_h:'時間帯', ins_hr_note:'完了したセッションの分数を1日の時間ごとに表示。', ins_best_win:'ベストな時間帯：{w}',
      ins_pt_h:'曜日 × 時間帯', ins_part_0:'朝', ins_part_1:'午後', ins_part_2:'夜', ins_part_3:'深夜',
      ins_len_h:'セッションの長さ', ins_len_note:'長さごとにセッションを最後までやり切れた割合。', ins_len_b0:'15分以下', ins_len_b1:'16〜30分', ins_len_b2:'31〜50分', ins_len_b3:'50分超', ins_len_n:'{n}セッション', ins_best_len:'あなたに合う長さ：{l}',
      ins_tips_h:'あなたへのアドバイス', ins_tip_none:'その調子！比べられるデータがもう少し集まるとアドバイスが表示されます。',
      ins_need:'表示まであと{n}セッション必要です。', ins_need_days:'表示まであと約{n}日の学習が必要です。',
      ins_since:'時刻と長さの記録は{d}から始まりました。それ以前のセッションは日別の合計にのみ含まれます。',
      ins_lock_h:'Companion向けの詳しい分析', ins_lock_p:'Companionは、集中しやすい時間帯、合ったセッションの長さ、完了率、月ごとの推移、最大3つの個別アドバイスも見られます。', ins_lock_cta:'Companionになる', ins_comp:'Companion特典',
      ins_local:'すべてあなたのブラウザ内で、あなた自身のデータから計算しています。ログイン中はアカウントに保存され、他の端末でも見られます。',
      ins_tip_win:'{w}ごろが一番集中できています。その時間は一日で一番難しい課題に使いましょう。',
      ins_tip_len:'{a}のセッションは{r}%完了できていますが、{b}は{r2}%だけです。タイマーを約{m}分にしてみましょう。',
      ins_tip_short:'{r}%のセッションを途中で止めています。タイマーを5分短くして、慣れたら少しずつ伸ばしましょう。',
      ins_tip_good:'セッションの{r}%を完了しています。素晴らしい集中力！5分長いセッションにも挑戦できそうです。',
      ins_tip_day:'{d}が一番勉強している曜日です（約{m}分）。{w}は少なめなので、短いセッション1回だけでも効果があります。',
      ins_tip_up:'今週は先週の同じ時点より{p}%多く勉強しています。このリズムを続けましょう！',
      ins_tip_down:'今週は先週の同じ時点より{p}%少なめです。今日25分のセッションを1回するだけで調子を取り戻せます。',
      ins_tip_late:'集中時間の{p}%が22時以降です。少し早い時間に移すと、よく眠れて記憶にも残りやすくなります。',
      ins_tip_even:'直近14日のうち{n}日勉強しました。まとめて1日より毎日少しずつの方が身につきます。毎日短いセッション1回を目標にしましょう。'
    },
    ko:{
      ins_title:'나에게 맞는 공부 시간', ins_sub:'내 집중 세션을 바탕으로 언제, 어떻게 가장 잘 집중하는지 알려 드려요.',
      ins_empty_h:'아직 데이터가 부족해요', ins_empty_p:'집중 룸에서 집중 세션을 몇 번 마쳐 보세요. 일주일쯤 지나면 잘 되는 요일과 시간대, 조언이 여기에 나타나요.', ins_go_focus:'집중 룸으로',
      ins_t_28:'28일간 분', ins_t_days:'28일 중 공부한 날', ins_t_avg:'공부한 날 평균', ins_t_rate:'끝까지 마친 세션', ins_vs:'이전 28일 대비 {p}', ins_rate_n:'{n}세션 중',
      ins_wd_h:'요일별', ins_wd_note:'최근 12주 동안 요일별 평균 분.',
      ins_wk_h:'주별', ins_wk_note:'최근 8주 동안 주별 총 분.', ins_mo_h:'월별', ins_mo_note:'최근 6개월 동안 월별 총 분.',
      ins_hr_h:'하루 중 시간대', ins_hr_note:'끝까지 마친 세션의 분을 시간대별로 보여 줘요.', ins_best_win:'가장 좋은 시간대: {w}',
      ins_pt_h:'요일 × 시간대', ins_part_0:'아침', ins_part_1:'오후', ins_part_2:'저녁', ins_part_3:'늦은 밤',
      ins_len_h:'세션 길이', ins_len_note:'길이별로 세션을 끝까지 마친 비율.', ins_len_b0:'15분 이하', ins_len_b1:'16–30분', ins_len_b2:'31–50분', ins_len_b3:'50분 초과', ins_len_n:'{n}세션', ins_best_len:'나에게 가장 맞는 길이: {l}',
      ins_tips_h:'맞춤 조언', ins_tip_none:'잘하고 있어요! 비교할 데이터가 조금 더 쌓이면 조언이 나타나요.',
      ins_need:'표시하려면 {n}세션이 더 필요해요.', ins_need_days:'표시하려면 약 {n}일 더 공부해야 해요.',
      ins_since:'세션 시각과 길이는 {d}부터 기록돼요. 그 전 세션은 일별 합계에만 들어가요.',
      ins_lock_h:'Companion을 위한 심층 분석', ins_lock_p:'Companion은 가장 집중이 잘 되는 시간대, 나에게 맞는 세션 길이, 세션 완료율, 월별 추세와 최대 3개의 맞춤 조언도 볼 수 있어요.', ins_lock_cta:'Companion 되기', ins_comp:'Companion 혜택',
      ins_local:'모든 계산은 내 데이터로 브라우저 안에서 이뤄져요. 로그인하면 계정에 저장되어 다른 기기에서도 볼 수 있어요.',
      ins_tip_win:'{w} 무렵에 가장 집중이 잘 돼요. 이 시간은 하루 중 가장 어려운 일에 써 보세요.',
      ins_tip_len:'{a} 세션은 {r}% 끝까지 마치지만 {b} 세션은 {r2}%뿐이에요. 집중 타이머를 약 {m}분으로 맞춰 보세요.',
      ins_tip_short:'세션의 {r}%를 중간에 멈췄어요. 타이머를 5분 줄였다가 익숙해지면 조금씩 늘려 보세요.',
      ins_tip_good:'세션의 {r}%를 끝까지 마쳤어요. 대단한 집중력이에요! 5분 더 긴 세션에 도전해 봐도 좋아요.',
      ins_tip_day:'{d}에 가장 많이 공부해요(약 {m}분). {w}은 보통 가장 적으니, 그날 짧은 세션 한 번만 해도 큰 도움이 돼요.',
      ins_tip_up:'이번 주는 지난주 같은 시점보다 {p}% 더 공부했어요. 이 리듬을 유지해요!',
      ins_tip_down:'이번 주는 지난주 같은 시점보다 {p}% 적어요. 오늘 25분 세션 한 번이면 다시 리듬을 찾을 수 있어요.',
      ins_tip_late:'집중 시간의 {p}%가 밤 10시 이후예요. 조금 더 일찍 옮기면 잠도 잘 자고 기억에도 더 잘 남아요.',
      ins_tip_even:'최근 14일 중 {n}일 공부했어요. 하루에 몰아서 하기보다 매일 조금씩이 더 오래 남아요. 매일 짧은 세션 하나를 목표로 해 보세요.'
    },
    zh:{
      ins_title:'你的高效学习时段', ins_sub:'根据你自己的专注记录，看看你在什么时候、以什么方式最专注。',
      ins_empty_h:'数据还不够', ins_empty_p:'先在专注室完成几次专注。大约一周后，你最好的学习日、最佳时段和建议就会显示在这里。', ins_go_focus:'前往专注室',
      ins_t_28:'近28天分钟数', ins_t_days:'近28天学习天数', ins_t_avg:'每个学习日平均', ins_t_rate:'完整完成的专注', ins_vs:'较前28天 {p}', ins_rate_n:'共 {n} 次',
      ins_wd_h:'按星期', ins_wd_note:'近12周每个星期几的平均分钟数。',
      ins_wk_h:'按周', ins_wk_note:'近8周每周的总分钟数。', ins_mo_h:'按月', ins_mo_note:'近6个月每月的总分钟数。',
      ins_hr_h:'一天中的时段', ins_hr_note:'完整完成的专注在每个小时的分钟数。', ins_best_win:'最佳时段：{w}',
      ins_pt_h:'星期 × 时段', ins_part_0:'上午', ins_part_1:'下午', ins_part_2:'晚上', ins_part_3:'深夜',
      ins_len_h:'专注时长', ins_len_note:'不同时长的专注被完整完成的比例。', ins_len_b0:'≤ 15 分钟', ins_len_b1:'16–30 分钟', ins_len_b2:'31–50 分钟', ins_len_b3:'> 50 分钟', ins_len_n:'{n} 次', ins_best_len:'最适合你：{l}',
      ins_tips_h:'给你的建议', ins_tip_none:'继续加油！再多一点数据可以比较时，建议就会出现。',
      ins_need:'还需要 {n} 次专注才能显示。', ins_need_days:'还需要大约 {n} 天的学习才能显示。',
      ins_since:'从 {d} 起开始记录每次专注的时间和时长，之前的专注只计入每日总数。',
      ins_lock_h:'为同行者准备的深度分析', ins_lock_p:'同行者还可以看到最专注的时段、适合自己的专注时长、完成率、按月趋势以及最多3条个人建议。', ins_lock_cta:'成为同行者', ins_comp:'同行者专属',
      ins_local:'所有数据都在你的浏览器里根据你自己的记录计算。登录后会随账号同步到其他设备。',
      ins_tip_win:'你在 {w} 左右最专注。把这段时间留给一天中最难的任务吧。',
      ins_tip_len:'{a}的专注你能完成 {r}%，而{b}的只有 {r2}%。试着把专注计时设为约 {m} 分钟。',
      ins_tip_short:'你有 {r}% 的专注中途停下了。试着把计时缩短 5 分钟，习惯后再慢慢加长。',
      ins_tip_good:'你完成了 {r}% 的专注，专注力很棒！可以试试再长 5 分钟。',
      ins_tip_day:'{d}是你学习最多的一天（约 {m} 分钟）。{w}通常最少，那天哪怕只做一次短专注也很有帮助。',
      ins_tip_up:'本周到目前为止比上周同期多学了 {p}%。保持这个节奏！',
      ins_tip_down:'本周比上周同期少了 {p}%。今天只要完成一次25分钟的专注，就能找回节奏。',
      ins_tip_late:'你有 {p}% 的专注时间在晚上10点以后。把一部分挪早一些，睡得更好，也记得更牢。',
      ins_tip_even:'近14天你学习了 {n} 天。每天学一点比集中学一天记得更牢，试着每天完成一次短专注。'
    },
    fr:{
      ins_title:'Vos meilleures heures d\'étude', ins_sub:'Quand et comment vous vous concentrez le mieux, calculé à partir de vos propres sessions.',
      ins_empty_h:'Pas encore assez de données', ins_empty_p:'Terminez quelques sessions dans la salle de concentration. Après environ une semaine, vos meilleurs jours, vos meilleures heures et des conseils apparaîtront ici.', ins_go_focus:'Aller à la salle de concentration',
      ins_t_28:'Minutes sur 28 jours', ins_t_days:'Jours d\'étude sur 28', ins_t_avg:'Moyenne par jour d\'étude', ins_t_rate:'Sessions terminées', ins_vs:'{p} par rapport aux 28 jours précédents', ins_rate_n:'sur {n} sessions',
      ins_wd_h:'Par jour de la semaine', ins_wd_note:'Minutes moyennes par jour de la semaine sur les 12 dernières semaines.',
      ins_wk_h:'Semaine par semaine', ins_wk_note:'Total des minutes des 8 dernières semaines.', ins_mo_h:'Mois par mois', ins_mo_note:'Total des minutes des 6 derniers mois.',
      ins_hr_h:'Moment de la journée', ins_hr_note:'Minutes des sessions terminées pour chaque heure de la journée.', ins_best_win:'Votre meilleur créneau : {w}',
      ins_pt_h:'Jour × moment de la journée', ins_part_0:'Matin', ins_part_1:'Après-midi', ins_part_2:'Soir', ins_part_3:'Nuit',
      ins_len_h:'Durée des sessions', ins_len_note:'À quelle fréquence vous terminez les sessions de chaque durée.', ins_len_b0:'≤ 15 min', ins_len_b1:'16–30 min', ins_len_b2:'31–50 min', ins_len_b3:'> 50 min', ins_len_n:'{n} sessions', ins_best_len:'Vous convient le mieux : {l}',
      ins_tips_h:'Conseils pour vous', ins_tip_none:'Continuez ! Les conseils apparaîtront quand il y aura un peu plus à comparer.',
      ins_need:'Encore {n} sessions pour l\'afficher.', ins_need_days:'Encore environ {n} jours d\'étude pour l\'afficher.',
      ins_since:'Les heures et durées des sessions sont enregistrées depuis le {d}. Les sessions plus anciennes ne comptent que dans les totaux par jour.',
      ins_lock_h:'Analyse détaillée pour les Compagnons', ins_lock_p:'Les Compagnons voient aussi leur meilleur moment de la journée, la durée de session qui leur convient, leur taux de sessions terminées, l\'évolution par mois et jusqu\'à 3 conseils personnels.', ins_lock_cta:'Devenir Compagnon', ins_comp:'Avantage Compagnon',
      ins_local:'Tout est calculé dans votre navigateur à partir de vos propres données. Une fois connecté, cela suit votre compte sur vos autres appareils.',
      ins_tip_win:'Vous vous concentrez le mieux vers {w}. Gardez ce créneau pour la tâche la plus difficile de la journée.',
      ins_tip_len:'Vous terminez {r} % des sessions de {a} mais seulement {r2} % de celles de {b}. Essayez un minuteur d\'environ {m} minutes.',
      ins_tip_short:'Vous arrêtez {r} % des sessions avant la fin. Essayez un minuteur 5 minutes plus court, puis rallongez peu à peu.',
      ins_tip_good:'Vous terminez {r} % de vos sessions. Superbe concentration ! Vous pourriez essayer des sessions 5 minutes plus longues.',
      ins_tip_day:'Le {d} est votre meilleur jour (environ {m} min). Le {w} est souvent le plus calme : même une courte session ce jour-là aide beaucoup.',
      ins_tip_up:'Cette semaine, vous avez étudié {p} % de plus qu\'au même moment la semaine dernière. Gardez le rythme !',
      ins_tip_down:'Cette semaine a {p} % de retard sur la même période la semaine dernière. Une session de 25 minutes aujourd\'hui suffit pour reprendre le rythme.',
      ins_tip_late:'{p} % de votre temps de concentration est après 22 h. En avancer une partie aide à mieux dormir et à mieux retenir.',
      ins_tip_even:'Vous avez étudié {n} des 14 derniers jours. Un peu chaque jour vaut mieux qu\'une longue journée : visez une courte session par jour.'
    },
    es:{
      ins_title:'Tus mejores horas de estudio', ins_sub:'Cuándo y cómo te concentras mejor, calculado a partir de tus propias sesiones.',
      ins_empty_h:'Aún no hay suficientes datos', ins_empty_p:'Completa algunas sesiones en la sala de enfoque. En más o menos una semana verás aquí tus mejores días, tus mejores horas y consejos.', ins_go_focus:'Ir a la sala de enfoque',
      ins_t_28:'Minutos en 28 días', ins_t_days:'Días de estudio en 28', ins_t_avg:'Promedio por día de estudio', ins_t_rate:'Sesiones completadas', ins_vs:'{p} frente a los 28 días anteriores', ins_rate_n:'de {n} sesiones',
      ins_wd_h:'Por día de la semana', ins_wd_note:'Minutos promedio de cada día de la semana en las últimas 12 semanas.',
      ins_wk_h:'Semana a semana', ins_wk_note:'Minutos totales de las últimas 8 semanas.', ins_mo_h:'Mes a mes', ins_mo_note:'Minutos totales de los últimos 6 meses.',
      ins_hr_h:'Hora del día', ins_hr_note:'Minutos de sesiones completadas en cada hora del día.', ins_best_win:'Tu mejor franja: {w}',
      ins_pt_h:'Día × momento del día', ins_part_0:'Mañana', ins_part_1:'Tarde', ins_part_2:'Noche', ins_part_3:'Madrugada',
      ins_len_h:'Duración de la sesión', ins_len_note:'Con qué frecuencia completas las sesiones de cada duración.', ins_len_b0:'≤ 15 min', ins_len_b1:'16–30 min', ins_len_b2:'31–50 min', ins_len_b3:'> 50 min', ins_len_n:'{n} sesiones', ins_best_len:'La que mejor te va: {l}',
      ins_tips_h:'Consejos para ti', ins_tip_none:'¡Sigue así! Los consejos aparecerán cuando haya un poco más para comparar.',
      ins_need:'Faltan {n} sesiones para mostrarlo.', ins_need_days:'Faltan unos {n} días de estudio para mostrarlo.',
      ins_since:'La hora y la duración de cada sesión se registran desde el {d}. Las sesiones anteriores solo cuentan en los totales por día.',
      ins_lock_h:'Análisis a fondo para Compañeros', ins_lock_p:'Los Compañeros también ven su mejor momento del día, la duración de sesión que les va, cuántas sesiones completan, la tendencia por mes y hasta 3 consejos personales.', ins_lock_cta:'Hazte Compañero', ins_comp:'Ventaja de Compañero',
      ins_local:'Todo se calcula en tu navegador con tus propios datos. Con la sesión iniciada, te acompaña en tus otros dispositivos.',
      ins_tip_win:'Te concentras mejor hacia las {w}. Guarda esa franja para la tarea más difícil del día.',
      ins_tip_len:'Completas el {r}% de las sesiones de {a} pero solo el {r2}% de las de {b}. Prueba a poner el temporizador en unos {m} minutos.',
      ins_tip_short:'Detienes el {r}% de las sesiones antes de terminar. Prueba un temporizador 5 minutos más corto y ve alargándolo.',
      ins_tip_good:'Completas el {r}% de tus sesiones. ¡Gran concentración! Podrías probar sesiones 5 minutos más largas.',
      ins_tip_day:'El {d} es tu mejor día (unos {m} min). El {w} suele ser el más flojo: incluso una sesión corta ese día ayuda mucho.',
      ins_tip_up:'Esta semana llevas un {p}% más de estudio que a estas alturas de la semana pasada. ¡Mantén el ritmo!',
      ins_tip_down:'Esta semana vas un {p}% por debajo de la semana pasada a estas alturas. Una sesión de 25 minutos hoy basta para retomar el ritmo.',
      ins_tip_late:'El {p}% de tu tiempo de enfoque es después de las 22:00. Adelantar una parte te ayuda a dormir y recordar mejor.',
      ins_tip_even:'Estudiaste {n} de los últimos 14 días. Un poco cada día se queda mejor que un solo día largo: apunta a una sesión corta diaria.'
    },
    hi:{
      ins_title:'आपके पढ़ाई के सबसे अच्छे घंटे', ins_sub:'आपके अपने फ़ोकस सत्रों से निकाला गया कि आप कब और कैसे सबसे अच्छा ध्यान लगाते हैं।',
      ins_empty_h:'अभी पर्याप्त डेटा नहीं है', ins_empty_p:'फ़ोकस रूम में कुछ फ़ोकस सत्र पूरे करें। लगभग एक हफ़्ते बाद आपके सबसे अच्छे दिन, सबसे अच्छे घंटे और सुझाव यहाँ दिखेंगे।', ins_go_focus:'फ़ोकस रूम पर जाएँ',
      ins_t_28:'28 दिनों के मिनट', ins_t_days:'28 में पढ़ाई के दिन', ins_t_avg:'हर पढ़ाई वाले दिन का औसत', ins_t_rate:'पूरे किए गए सत्र', ins_vs:'पिछले 28 दिनों की तुलना में {p}', ins_rate_n:'{n} सत्रों में से',
      ins_wd_h:'हफ़्ते के दिन के अनुसार', ins_wd_note:'पिछले 12 हफ़्तों में हर दिन के औसत मिनट।',
      ins_wk_h:'हफ़्ते दर हफ़्ते', ins_wk_note:'पिछले 8 हफ़्तों के कुल मिनट।', ins_mo_h:'महीने दर महीने', ins_mo_note:'पिछले 6 महीनों के कुल मिनट।',
      ins_hr_h:'दिन का समय', ins_hr_note:'दिन के हर घंटे में पूरे किए गए सत्रों के मिनट।', ins_best_win:'आपका सबसे अच्छा समय: {w}',
      ins_pt_h:'दिन × समय', ins_part_0:'सुबह', ins_part_1:'दोपहर', ins_part_2:'शाम', ins_part_3:'देर रात',
      ins_len_h:'सत्र की लंबाई', ins_len_note:'हर लंबाई के सत्र आप कितनी बार पूरे करते हैं।', ins_len_b0:'≤ 15 मिनट', ins_len_b1:'16–30 मिनट', ins_len_b2:'31–50 मिनट', ins_len_b3:'> 50 मिनट', ins_len_n:'{n} सत्र', ins_best_len:'आपके लिए सबसे सही: {l}',
      ins_tips_h:'आपके लिए सुझाव', ins_tip_none:'लगे रहें! तुलना के लिए थोड़ा और डेटा होते ही सुझाव दिखेंगे।',
      ins_need:'दिखाने के लिए {n} और सत्र चाहिए।', ins_need_days:'दिखाने के लिए लगभग {n} और दिन पढ़ाई चाहिए।',
      ins_since:'सत्रों का समय और लंबाई {d} से दर्ज हो रही है। उससे पहले के सत्र केवल रोज़ के कुल में गिने जाते हैं।',
      ins_lock_h:'साथियों के लिए गहरा विश्लेषण', ins_lock_p:'साथी अपना सबसे अच्छा समय, अपने लिए सही सत्र लंबाई, सत्र पूरे करने की दर, महीने का रुझान और अधिकतम 3 निजी सुझाव भी देख सकते हैं।', ins_lock_cta:'साथी बनें', ins_comp:'साथी विशेषाधिकार',
      ins_local:'सब कुछ आपके ब्राउज़र में आपके अपने डेटा से निकाला जाता है। साइन इन होने पर यह दूसरे डिवाइस पर भी आपके खाते के साथ रहता है।',
      ins_tip_win:'आप {w} के आसपास सबसे अच्छा ध्यान लगाते हैं। यह समय दिन के सबसे कठिन काम के लिए रखें।',
      ins_tip_len:'आप {a} के {r}% सत्र पूरे करते हैं लेकिन {b} के सिर्फ़ {r2}%। फ़ोकस टाइमर लगभग {m} मिनट पर रखकर देखें।',
      ins_tip_short:'आप {r}% सत्र बीच में रोक देते हैं। टाइमर 5 मिनट छोटा करके देखें, फिर धीरे-धीरे बढ़ाएँ।',
      ins_tip_good:'आप अपने {r}% सत्र पूरे करते हैं। बढ़िया ध्यान! आप 5 मिनट लंबे सत्र आज़मा सकते हैं।',
      ins_tip_day:'{d} आपका सबसे मज़बूत दिन है (लगभग {m} मिनट)। {w} आमतौर पर सबसे कम होता है, उस दिन एक छोटा सत्र भी बहुत मदद करता है।',
      ins_tip_up:'इस हफ़्ते अब तक आपने पिछले हफ़्ते इसी समय से {p}% ज़्यादा पढ़ाई की है। यही लय बनाए रखें!',
      ins_tip_down:'यह हफ़्ता पिछले हफ़्ते इसी समय से {p}% पीछे है। आज 25 मिनट का एक सत्र लय वापस पाने के लिए काफ़ी है।',
      ins_tip_late:'आपके फ़ोकस समय का {p}% रात 10 बजे के बाद है। इसका कुछ हिस्सा पहले करने से नींद और याददाश्त दोनों बेहतर होंगी।',
      ins_tip_even:'आपने पिछले 14 में से {n} दिन पढ़ाई की। एक लंबे दिन से बेहतर है रोज़ थोड़ा पढ़ना, रोज़ एक छोटे सत्र का लक्ष्य रखें।'
    }
  };
  Object.keys(G).forEach(l => { I18N[l] = I18N[l] || {}; Object.keys(G[l]).forEach(k => { if (I18N[l][k] === undefined) I18N[l][k] = G[l][k]; }); });
})();

/* ---------- Tính toán (thuần, không đụng tới giao diện) ---------- */
const INS_LEN = [15, 30, 50, Infinity], INS_LEN_REC = [15, 25, 45, 60];   // nhóm độ dài phiên và số phút gợi ý cho từng nhóm
const insLenB = p => INS_LEN.findIndex(x => p <= x);
const insPart = h => h >= 5 && h < 12 ? 0 : h >= 12 && h < 17 ? 1 : h >= 17 && h < 22 ? 2 : 3;   // sáng / chiều / tối / khuya
const insPct = (a, b) => b ? Math.round(a / b * 100) : 0;
const insWin = h => `${String(h % 24).padStart(2, '0')}:00–${String((h + 2) % 24).padStart(2, '0')}:00`;

/* Dữ liệu mẫu cho chế độ xem thử (?demo=1): 10 tuần, học nhiều buổi tối, phiên dài hay bỏ dở */
function insDemo(){
  const out = [], now = DT.now().setZone(userTZ); let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 70; i >= 0; i--) {
    const day = now.minus({ days:i }).startOf('day'); if (rnd() < (day.weekday >= 6 ? .5 : .2)) continue;
    const n = 1 + Math.floor(rnd() * 4); let h = rnd() < .65 ? 19 + rnd() * 3 : 8 + rnd() * 6;
    for (let j = 0; j < n; j++) {
      const p = rnd() < .3 ? 50 : 25, c = rnd() < (p === 50 ? .55 : .9) ? 1 : 0, d = c ? p : 3 + Math.floor(rnd() * (p - 5));
      const st = day.plus({ minutes:Math.round(h * 60) }); if (st > now) break;
      out.push({ t:Math.round(st.toMillis() / 60000), p, d, c }); h += (d + 7) / 60;
    }
  }
  return out;
}

function insCompute(){
  let fl = localFocus(), ss = localSess();
  if (DEMO && !ss.length) { ss = insDemo(); fl = {}; ss.forEach(x => { if (!x.c) return; const k = DT.fromMillis(x.t * 60000).setZone(userTZ).toISODate(), o = fl[k] || { m:0, s:0 }; fl[k] = { m:o.m + x.d, s:o.s + 1 }; }); }
  const now = DT.now().setZone(userTZ), today = now.startOf('day'), mOf = d => (fl[d.toISODate()] || { m:0 }).m;
  const days = Object.keys(fl).filter(k => fl[k].m > 0).sort(), first = days.length ? DT.fromISO(days[0], { zone:userTZ }) : null;
  const sum = (from, n) => { let s = 0, a = 0; for (let i = 0; i < n; i++) { const m = mOf(from.plus({ days:i })); s += m; if (m > 0) a++; } return { s, a }; };
  const cur = sum(today.minus({ days:27 }), 28), prev = sum(today.minus({ days:55 }), 28);
  const R = { now, today, fl, ss, total:days.reduce((a, k) => a + fl[k].m, 0), activeDays:days.length, first, cur, prev };
  R.span = first ? Math.round(today.diff(first, 'days').days) + 1 : 0;
  // theo thứ trong tuần: 12 tuần gần đây, tính từ ngày đầu tiên có học (không chia cho các tuần trước khi bắt đầu dùng web)
  const wdFrom = DT.max(today.minus({ days:83 }), first || today), wd = Array.from({ length:7 }, () => ({ m:0, n:0 }));
  for (let d = wdFrom; d <= today; d = d.plus({ days:1 })) { const w = wd[d.weekday - 1]; w.m += mOf(d); w.n++; }
  R.wd = wd.map(w => w.n ? Math.round(w.m / w.n) : 0); R.wdOk = R.span >= 14 && R.activeDays >= 5;
  // theo tuần (8 tuần) và theo tháng (6 tháng)
  const ws = now.startOf('week');
  R.weeks = Array.from({ length:8 }, (_, i) => { const s = ws.minus({ weeks:7 - i }); return { d:s, m:sum(s, 7).s }; });
  const ms = now.startOf('month');
  R.months = Array.from({ length:6 }, (_, i) => { const s = ms.minus({ months:5 - i }); return { d:s, m:sum(s, s.daysInMonth).s }; });
  // tuần này so với cùng thời điểm tuần trước
  const doneDays = now.weekday; R.wkNow = sum(ws, doneDays).s; R.wkPrev = sum(ws.minus({ weeks:1 }), doneDays).s;
  R.last14 = sum(today.minus({ days:13 }), 14).a;
  // phần sâu: từ sổ từng phiên
  R.n = ss.length; R.nc = ss.filter(x => x.c).length; R.rate = insPct(R.nc, R.n); R.sessFrom = ss.length ? DT.fromMillis(ss[0].t * 60000).setZone(userTZ) : null;
  const hr = Array(24).fill(0), grid = Array.from({ length:7 }, () => [0, 0, 0, 0]);
  ss.forEach(x => {
    if (!x.c) return;
    for (let m = 0; m < x.d; m += 5) { const at = DT.fromMillis((x.t + m) * 60000).setZone(userTZ), k = Math.min(5, x.d - m); hr[at.hour] += k; grid[at.weekday - 1][insPart(at.hour)] += k; }   // chia phút của phiên vào đúng các giờ nó kéo dài
  });
  R.hr = hr; R.grid = grid; R.hrTot = hr.reduce((a, b) => a + b, 0);
  let bw = -1, bv = 0; for (let h = 0; h < 24; h++) { const v = hr[h] + hr[(h + 1) % 24]; if (v > bv) { bv = v; bw = h; } }
  R.bestWin = R.nc >= 8 && bv > 0 ? bw : -1;
  R.late = R.hrTot ? insPct(hr.slice(22).reduce((a, b) => a + b, 0) + hr.slice(0, 5).reduce((a, b) => a + b, 0), R.hrTot) : 0;
  R.len = INS_LEN.map(() => ({ n:0, c:0 })); ss.forEach(x => { const b = R.len[insLenB(x.p)]; b.n++; b.c += x.c; });
  const lenOk = R.len.map((b, i) => ({ i, n:b.n, r:insPct(b.c, b.n) })).filter(b => b.n >= 3);
  R.bestLen = R.n >= 8 && lenOk.length ? lenOk.sort((a, b) => b.r - a.r || b.i - a.i)[0].i : -1;
  R.tips = insTips(R);
  return R;
}

/* Lời khuyên: mỗi quy tắc trả về { k:khoá, v:biến, deep:true nếu cần sổ từng phiên }, xếp theo độ hữu ích */
function insTips(R){
  const out = [], wdName = i => DT.local().set({ weekday:i + 1 }).setLocale(state.lang).toFormat('cccc'), lab = i => t('ins_len_b' + i);
  if (R.bestWin >= 0) out.push({ deep:true, k:'ins_tip_win', v:{ w:insWin(R.bestWin) } });
  const curB = insLenB(pomo && pomo.cfg ? pomo.cfg.focus : 25), cb = R.len[curB], bb = R.bestLen >= 0 ? R.len[R.bestLen] : null;
  if (bb && R.bestLen !== curB && cb.n >= 3 && insPct(bb.c, bb.n) - insPct(cb.c, cb.n) >= 15) out.push({ deep:true, k:'ins_tip_len', v:{ r:insPct(bb.c, bb.n), a:lab(R.bestLen), r2:insPct(cb.c, cb.n), b:lab(curB), m:INS_LEN_REC[R.bestLen] } });
  else if (R.n >= 8 && R.rate < 65) out.push({ deep:true, k:'ins_tip_short', v:{ r:100 - R.rate } });
  if (R.wdOk) { const mx = Math.max(...R.wd), mn = Math.min(...R.wd); if (mx > 0 && mx - mn >= 15) out.push({ k:'ins_tip_day', v:{ d:wdName(R.wd.indexOf(mx)), m:mx, w:wdName(R.wd.indexOf(mn)) } }); }
  if (R.wkPrev >= 30) { const p = Math.round((R.wkNow - R.wkPrev) / R.wkPrev * 100); if (p >= 15) out.push({ k:'ins_tip_up', v:{ p } }); else if (p <= -15) out.push({ k:'ins_tip_down', v:{ p:-p } }); }
  if (R.hrTot >= 300 && R.late >= 30) out.push({ deep:true, k:'ins_tip_late', v:{ p:R.late } });
  if (R.span >= 14 && R.last14 >= 1 && R.last14 <= 5) out.push({ k:'ins_tip_even', v:{ n:R.last14 } });
  if (R.n >= 8 && R.rate >= 85) out.push({ deep:true, k:'ins_tip_good', v:{ r:R.rate } });
  return out;
}

/* ---------- Giao diện ---------- */
const insDeep = () => !!(state.companion || state.isAdmin || (typeof trialActive === 'function' && trialActive()));
const insBars = (list, cls = '') => { const mx = Math.max(1, ...list.map(x => x.v)); return `<div class="bars ins-bars ${cls}">${list.map(x => `<div${x.on ? ' class="today"' : ''}><i style="height:${Math.max(3, x.v / mx * 100)}%" title="${esc(x.tip || x.v)}"></i><small>${esc(x.l)}</small></div>`).join('')}</div>`; };
const insCardH = (title, note, extra = '') => `<div class="card-h"><h2>${esc(title)}</h2>${extra}</div>${note ? `<p class="small muted ins-note">${esc(note)}</p>` : ''}`;
const insNeed = (n, days) => `<div class="ins-need small muted">${ic('timer', 'sm')} ${esc(t(days ? 'ins_need_days' : 'ins_need', { n }))}</div>`;
const insTile = (l, v, s = '') => `<div class="card tile"><span class="t-l">${esc(l)}</span><span class="t-v">${esc(v)}</span>${s ? `<span class="t-s">${s}</span>` : ''}</div>`;

function insLocked(){
  const ghost = `<div class="ins-ghost" aria-hidden="true">${insBars(Array.from({ length:12 }, (_, i) => ({ v:[2, 3, 5, 8, 6, 4, 3, 5, 9, 12, 8, 4][i], l:'' })))}</div>`;
  return `<section class="card pad ins-lock">${ghost}<div class="ins-lock-tx"><span class="ins-lock-ic">${ic('lock')}</span><h2>${esc(t('ins_lock_h'))}</h2><p class="muted">${esc(t('ins_lock_p'))}</p>
    <div class="row" style="justify-content:center"><a class="btn primary" href="#/donate">${ic('heart', 'sm')} ${esc(t('ins_lock_cta'))}</a></div>${typeof trialBox === 'function' && state.user && !state.trial ? `<div class="mt">${trialBox()}</div>` : ''}</div></section>`;
}

PAGES.insights = function(){
  const R = insCompute(), deep = insDeep(), loc = d => d.setLocale(state.lang), min = t('min');
  const top = head('ins_title', 'ins_sub', '', 'moonwalk', 6);
  if (!R.activeDays && !R.n) {
    page(`${top}<section class="card pad">${emptyBox('chart', t('ins_empty_h'), t('ins_empty_p'))}<div class="row" style="justify-content:center"><a class="btn primary" href="#/focus">${ic('timer', 'sm')} ${esc(t('ins_go_focus'))}</a></div></section>`);
    return;
  }
  const ch = R.prev.s ? Math.round((R.cur.s - R.prev.s) / R.prev.s * 100) : null;
  const chTxt = ch === null ? '' : `<span class="${ch >= 0 ? 'ins-up' : 'ins-down'}">${esc(t('ins_vs', { p:(ch > 0 ? '+' : '') + ch + '%' }))}</span>`;
  const tiles = `<div class="grid ${deep ? 'g4' : 'g3'} keep2 ins-tiles">${insTile(t('ins_t_28'), R.cur.s, chTxt)}${insTile(t('ins_t_days'), `${R.cur.a}/28`)}${insTile(t('ins_t_avg'), R.cur.a ? `${Math.round(R.cur.s / R.cur.a)} ${min}` : '–')}${deep ? insTile(t('ins_t_rate'), R.n ? R.rate + '%' : '–', R.n ? esc(t('ins_rate_n', { n:R.n })) : '') : ''}</div>`;
  // lời khuyên: người thường 1 (chỉ từ sổ ngày), Người đồng hành tối đa 3
  const tips = (deep ? R.tips : R.tips.filter(x => !x.deep)).slice(0, deep ? 3 : 1);
  const tipsCard = `<section class="card pad ins-tips">${insCardH(t('ins_tips_h'), '', deep ? compBadgeIns() : '')}${tips.length ? `<ul>${tips.map(x => `<li><span aria-hidden="true">💡</span><span>${esc(t(x.k, x.v))}</span></li>`).join('')}</ul>` : `<p class="muted small">${esc(t('ins_tip_none'))}</p>`}</section>`;
  const wdCard = `<section class="card pad">${insCardH(t('ins_wd_h'), t('ins_wd_note'))}${R.wdOk ? insBars(R.wd.map((v, i) => ({ v, l:loc(DT.local().set({ weekday:i + 1 })).toFormat('ccc'), tip:`${v} ${min}`, on:i === R.now.weekday - 1 }))) : insNeed(Math.max(1, 14 - R.span, 5 - R.activeDays), true)}</section>`;
  const wkCard = `<section class="card pad">${insCardH(t('ins_wk_h'), t('ins_wk_note'))}${insBars(R.weeks.map((w, i) => ({ v:w.m, l:loc(w.d).toFormat('dd/MM'), tip:`${w.m} ${min}`, on:i === 7 })))}</section>`;
  let deepHTML = '';
  if (deep) {
    const need = Math.max(0, 8 - R.nc);
    const hrCard = `<section class="card pad">${insCardH(t('ins_hr_h'), t('ins_hr_note'))}${R.bestWin >= 0 ? `<p class="ins-hl">${ic('star', 'sm')} ${esc(t('ins_best_win', { w:insWin(R.bestWin) }))}</p>${insBars(R.hr.map((v, h) => ({ v, l:h % 3 ? '' : String(h), tip:`${String(h).padStart(2, '0')}:00 · ${v} ${min}`, on:h === R.bestWin || h === (R.bestWin + 1) % 24 })), 'ins-hr')}` : insNeed(need)}</section>`;
    const gmx = Math.max(1, ...R.grid.flat());
    const ptCard = R.bestWin < 0 ? '' : `<section class="card pad">${insCardH(t('ins_pt_h'), '')}<div class="ins-grid" role="table"><div role="row"><span></span>${[0, 1, 2, 3].map(p => `<b role="columnheader">${esc(t('ins_part_' + p))}</b>`).join('')}</div>${R.grid.map((row, i) => `<div role="row"><b role="rowheader">${esc(loc(DT.local().set({ weekday:i + 1 })).toFormat('ccc'))}</b>${row.map(v => `<i role="cell" style="--a:${(v / gmx).toFixed(2)}" title="${v} ${esc(min)}">${v ? v : ''}</i>`).join('')}</div>`).join('')}</div></section>`;
    const lenCard = `<section class="card pad">${insCardH(t('ins_len_h'), t('ins_len_note'))}${R.n >= 8 ? `${R.bestLen >= 0 ? `<p class="ins-hl">${ic('star', 'sm')} ${esc(t('ins_best_len', { l:t('ins_len_b' + R.bestLen) }))}</p>` : ''}<div class="ins-len">${R.len.map((b, i) => `<div class="${i === R.bestLen ? 'on' : ''}"><span class="small"><b>${esc(t('ins_len_b' + i))}</b> <span class="faint">${esc(t('ins_len_n', { n:b.n }))}</span></span><div class="progress"><i style="width:${insPct(b.c, b.n)}%"></i></div><b class="small">${b.n ? insPct(b.c, b.n) + '%' : '–'}</b></div>`).join('')}</div>` : insNeed(8 - R.n)}</section>`;
    const moCard = `<section class="card pad">${insCardH(t('ins_mo_h'), t('ins_mo_note'))}${insBars(R.months.map((m, i) => ({ v:m.m, l:loc(m.d).toFormat('LLL'), tip:`${m.m} ${min}`, on:i === 5 })))}</section>`;
    deepHTML = `<div class="grid g2 ins-deep">${hrCard}${lenCard}${ptCard}${moCard}</div>${R.sessFrom && R.first && R.first < R.sessFrom.startOf('day') ? `<p class="small faint ins-foot">${esc(t('ins_since', { d:loc(R.sessFrom).toLocaleString(DT.DATE_MED) }))}</p>` : ''}`;
  }
  page(`${top}${tiles}${tipsCard}<div class="grid g2">${wdCard}${wkCard}</div>${deep ? deepHTML : insLocked()}<p class="small faint ins-foot">${ic('shield', 'sm')} ${esc(t('ins_local'))}</p>`);
};
const compBadgeIns = () => state.companion && typeof compBadge === 'function' ? compBadge() : `<span class="badge">${ic('heart', 'sm')} ${esc(t('ins_comp'))}</span>`;
