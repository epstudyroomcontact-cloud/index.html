'use strict';
/* =========================================================
   NHÓM HỌC TRỰC TIẾP (tải theo nhu cầu: khi mở Phòng tập trung, hoặc khi khách đã tham gia và bấm đồng hồ)
   Chỉ dành cho Người đồng hành, người đang dùng thử và admin (cùng điều kiện với Planner); admin bật/tắt ở tab Giao diện (branding.groupOn).
   Dữ liệu: study_group/<năm>-W<tuần> (tuần tính theo giờ Việt Nam, nên mọi người thấy cùng một tuần) = {
     live:  { <uid>: { n:tên, s:lúc bắt đầu học (ms), k:'f'|'b', b:nhịp báo gần nhất (ms) } },   ai đang học
     board: { <uid>: { n:tên, mins:tổng phút tập trung tuần này, t:giờ máy chủ lần ghi cuối, f:giờ máy chủ lúc mục này được tạo, z:số phút lúc đó } }  bảng xếp hạng tuần
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
  grp_strip_join:'Join the study group to see who is studying and your weekly rank', grp_strip_n:'{n} studying now', grp_strip_0:'Nobody studying yet', grp_rank:'Rank #{r}', grp_rank_none:'No hours this week yet', grp_home_sub:'See who is studying right now.', grp_home_join:'Join the group in the Focus room', grp_home_open:'Open the study group', grp_home_peek:'See how it works', grp_home_up:'Companions can see who is studying right now, with live timers and a weekly leaderboard.',
  grp_trend_up:'▲ {n} today', grp_trend_dn:'▼ {n} today', grp_climb_next:'{m} more to pass {n}', grp_climb_lead:'You lead {n} by {m}', grp_climb_alone:'You are the only one on the board so far', grp_moved:'You moved up to #{r} this week!', grp_top:'You are #1 this week!',
  grp_prev:'Last week', grp_prev_you:'You were #{r} · {t}',
  grp_live_note:'Time counts from the start of the session, breaks included. The weekly board only counts focus minutes.', grp_leave_moon:"Please don't leave~ Moon will miss you so much 🥺", grp_stay:'Stay with Moon', grp_pub:'{m} joined the study group · {n} studying now', grp_pub_m:'{m} joined the study group', grp_more:'Show everyone ({n})', grp_less:'Show top {n} only', grp_live0:'Studying now · no minutes logged yet this week',
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
  grp_strip_join:'Tham gia nhóm học để xem ai đang học và thứ hạng tuần của bạn', grp_strip_n:'{n} người đang học', grp_strip_0:'Chưa ai đang học', grp_rank:'Hạng {r}', grp_rank_none:'Tuần này chưa có giờ học', grp_home_sub:'Xem ai đang học ngay lúc này.', grp_home_join:'Tham gia nhóm ở Phòng tập trung', grp_home_open:'Mở nhóm học', grp_home_peek:'Xem thử cách hoạt động', grp_home_up:'Người đồng hành xem được ai đang học ngay lúc này, kèm đồng hồ trực tiếp và bảng xếp hạng tuần.',
  grp_trend_up:'▲ {n} hạng hôm nay', grp_trend_dn:'▼ {n} hạng hôm nay', grp_climb_next:'Học thêm {m} để vượt {n}', grp_climb_lead:'Bạn hơn {n} {m}', grp_climb_alone:'Hiện mới chỉ có bạn trên bảng', grp_moved:'Bạn vừa lên hạng {r} tuần này!', grp_top:'Bạn đang đứng đầu tuần này!',
  grp_prev:'Tuần trước', grp_prev_you:'Bạn đã đứng hạng {r} · {t}',
  grp_live_note:'Thời gian tính từ lúc bắt đầu phiên, gồm cả giờ nghỉ. Bảng tuần chỉ tính phút tập trung.', grp_leave_moon:'Đừng rời đi mà~ Moon sẽ nhớ bạn lắm đó 🥺', grp_stay:'Ở lại với Moon', grp_pub:'{m} người đã tham gia nhóm học · {n} đang học', grp_pub_m:'{m} người đã tham gia nhóm học', grp_more:'Xem tất cả ({n} người)', grp_less:'Chỉ xem top {n}', grp_live0:'Đang học · tuần này chưa có phút nào được ghi',
  grp_err:'Chưa tải được nhóm. Bạn thử lại sau một lát nhé.', grp_err_rules:'Nhóm chưa sẵn sàng: chủ web cần dán luật bảo mật mới nhất lên Firebase.', grp_err_quota:'Hôm nay nhóm đang nghỉ. Bạn quay lại vào ngày mai nhé.'
});
/* Bản dịch cho khách chưa là Người đồng hành (lời mời ở Phòng tập trung và Tổng quan) bằng hi / ja / ko / zh / fr / es; phần dành cho thành viên nhóm (Y) cũng có đủ 8 ngôn ngữ; thiếu khoá nào thì tự dùng tiếng Anh. */
(function(){
  const Y = {
    hi:{ grp_sub:"साथ पढ़ें: देखें अभी कौन पढ़ रहा है और फ़ोकस घंटों का साप्ताहिक लीडरबोर्ड।", grp_up_title:"स्टडी ग्रुप साथियों के लिए है", grp_nick:"उपनाम", grp_nick_ph:"जैसे मीना", grp_nick_hint:"ग्रुप में सभी आपका उपनाम, आप पढ़ रहे हैं या नहीं, और इस हफ़्ते के आपके घंटे देख सकते हैं। चाहें तो असली नाम या ईमेल न रखें।", grp_join:"ग्रुप में शामिल हों", grp_save_nick:"उपनाम सहेजें", grp_leave:"ग्रुप छोड़ें", grp_leave_ask:"छोड़ना है? आप सूची से हट जाएँगे और इस हफ़्ते के आपके घंटे लीडरबोर्ड से हटा दिए जाएँगे।", grp_leave_yes:"हाँ, छोड़ें", grp_cancel:"रद्द करें", grp_nick_bad:"उपनाम 2 से 20 अक्षरों का होना चाहिए।", grp_joined_toast:"आप स्टडी ग्रुप में शामिल हो गए", grp_left_toast:"आपने स्टडी ग्रुप छोड़ दिया", grp_saved:"उपनाम सहेज लिया गया", grp_me_on:"आप पढ़ते हुए दिख रहे हैं", grp_me_off:"आपका टाइमर चालू नहीं है, इसलिए आप पढ़ते हुए नहीं दिख रहे। दिखने के लिए टाइमर शुरू करें।", grp_now:"अभी पढ़ रहे हैं", grp_none:"अभी कोई नहीं पढ़ रहा। टाइमर शुरू करके पहले बनें।", grp_board:"इस हफ़्ते", grp_board_none:"इस हफ़्ते अभी किसी का फ़ोकस समय नहीं है। एक फ़ोकस सत्र पूरा करें, यहाँ आपका नाम दिखेगा।", grp_reset:"हर सोमवार 00:00 बजे रीसेट (वियतनाम समय, GMT+7)।", grp_focus:"फ़ोकस", grp_break:"ब्रेक", grp_you:"आप", grp_hm:"{h} घं {m} मि", grp_m:"{m} मि", grp_refresh:"रीफ़्रेश", grp_remove:"ग्रुप से हटाएँ", grp_strip_join:"ग्रुप में शामिल हों और देखें कौन पढ़ रहा है और इस हफ़्ते आपकी रैंक क्या है", grp_strip_n:"{n} अभी पढ़ रहे हैं", grp_strip_0:"अभी कोई नहीं पढ़ रहा", grp_rank:"रैंक #{r}", grp_rank_none:"इस हफ़्ते अभी कोई घंटा नहीं", grp_home_sub:"देखें अभी कौन पढ़ रहा है।", grp_home_join:"फ़ोकस रूम में ग्रुप से जुड़ें", grp_trend_up:"▲ आज {n}", grp_trend_dn:"▼ आज {n}", grp_climb_next:"{n} से आगे निकलने के लिए {m} और", grp_climb_lead:"आप {n} से {m} आगे हैं", grp_climb_alone:"अभी बोर्ड पर सिर्फ़ आप हैं", grp_moved:"आप इस हफ़्ते #{r} पर पहुँच गए!", grp_top:"आप इस हफ़्ते #1 हैं!", grp_err:"ग्रुप लोड नहीं हो सका। थोड़ी देर बाद फिर कोशिश करें।", grp_err_rules:"ग्रुप अभी तैयार नहीं है। साइट के मालिक को नवीनतम सुरक्षा नियम प्रकाशित करने होंगे।", grp_err_quota:"आज ग्रुप आराम कर रहा है। कृपया कल फिर आइए।", grp_prev:"पिछला हफ़्ता", grp_prev_you:"आप #{r} पर थे · {t}" },
    ja:{ grp_sub:"いっしょに勉強:今だれが勉強中か、集中時間の週間ランキングが見られます。", grp_up_title:"勉強グループは仲間向けです", grp_nick:"ニックネーム", grp_nick_ph:"例:ミナ", grp_nick_hint:"グループの全員に、ニックネーム・勉強中かどうか・今週の時間が見えます。本名やメールアドレスは使わないでください。", grp_join:"グループに参加", grp_save_nick:"ニックネームを保存", grp_leave:"グループを抜ける", grp_leave_ask:"抜けますか?一覧から消え、今週の時間もランキングから削除されます。", grp_leave_yes:"はい、抜ける", grp_cancel:"キャンセル", grp_nick_bad:"ニックネームは2〜20文字で入力してください。", grp_joined_toast:"勉強グループに参加しました", grp_left_toast:"勉強グループを抜けました", grp_saved:"ニックネームを保存しました", grp_me_on:"勉強中として表示されています", grp_me_off:"タイマーが動いていないため、勉強中として表示されていません。表示するにはタイマーを開始してください。", grp_now:"勉強中", grp_none:"今はだれも勉強していません。タイマーを開始して一番乗りになりましょう。", grp_board:"今週", grp_board_none:"今週はまだ集中時間がありません。集中セッションを終えるとここに表示されます。", grp_reset:"毎週月曜0:00にリセット(ベトナム時間 GMT+7)。", grp_focus:"集中", grp_break:"休憩", grp_you:"あなた", grp_hm:"{h}時間{m}分", grp_m:"{m}分", grp_refresh:"更新", grp_remove:"グループから削除", grp_strip_join:"グループに参加して、だれが勉強中か今週の順位を見よう", grp_strip_n:"{n}人が勉強中", grp_strip_0:"まだだれも勉強していません", grp_rank:"{r}位", grp_rank_none:"今週はまだ時間がありません", grp_home_sub:"今だれが勉強中か見てみよう。", grp_home_join:"集中ルームでグループに参加", grp_trend_up:"▲ 今日{n}", grp_trend_dn:"▼ 今日{n}", grp_climb_next:"{n}さんを抜くにはあと{m}", grp_climb_lead:"{n}さんを{m}リード中", grp_climb_alone:"今のところボードにはあなただけです", grp_moved:"今週{r}位に上がりました!", grp_top:"今週1位です!", grp_err:"グループを読み込めませんでした。少ししてからもう一度お試しください。", grp_err_rules:"グループはまだ準備中です。サイト管理者が最新のセキュリティルールを公開する必要があります。", grp_err_quota:"今日はグループはお休みです。また明日来てください。", grp_prev:"先週", grp_prev_you:"先週は{r}位 · {t}" },
    ko:{ grp_sub:"함께 공부해요: 지금 누가 공부 중인지, 집중 시간 주간 순위를 볼 수 있어요.", grp_up_title:"스터디 그룹은 동반자를 위한 공간이에요", grp_nick:"닉네임", grp_nick_ph:"예: 미나", grp_nick_hint:"그룹의 모든 사람이 닉네임, 공부 중인지 여부, 이번 주 시간을 볼 수 있어요. 실명이나 이메일은 쓰지 않는 게 좋아요.", grp_join:"그룹 참여", grp_save_nick:"닉네임 저장", grp_leave:"그룹 나가기", grp_leave_ask:"나갈까요? 목록에서 사라지고 이번 주 시간도 순위에서 삭제돼요.", grp_leave_yes:"네, 나갈게요", grp_cancel:"취소", grp_nick_bad:"닉네임은 2~20자여야 해요.", grp_joined_toast:"스터디 그룹에 참여했어요", grp_left_toast:"스터디 그룹에서 나왔어요", grp_saved:"닉네임을 저장했어요", grp_me_on:"공부 중으로 표시되고 있어요", grp_me_off:"타이머가 멈춰 있어서 공부 중으로 표시되지 않아요. 타이머를 시작하면 나타나요.", grp_now:"지금 공부 중", grp_none:"지금은 아무도 공부하지 않아요. 타이머를 시작해서 첫 번째가 되어 보세요.", grp_board:"이번 주", grp_board_none:"이번 주에는 아직 집중 시간이 없어요. 집중 세션을 마치면 여기에 이름이 나타나요.", grp_reset:"매주 월요일 00:00에 초기화돼요 (베트남 시간, GMT+7).", grp_focus:"집중", grp_break:"휴식", grp_you:"나", grp_hm:"{h}시간 {m}분", grp_m:"{m}분", grp_refresh:"새로고침", grp_remove:"그룹에서 내보내기", grp_strip_join:"그룹에 참여해서 누가 공부 중인지와 이번 주 순위를 확인하세요", grp_strip_n:"{n}명 공부 중", grp_strip_0:"아직 아무도 공부하지 않아요", grp_rank:"{r}위", grp_rank_none:"이번 주 기록이 아직 없어요", grp_home_sub:"지금 누가 공부 중인지 확인해 보세요.", grp_home_join:"집중 룸에서 그룹 참여하기", grp_trend_up:"▲ 오늘 {n}", grp_trend_dn:"▼ 오늘 {n}", grp_climb_next:"{n}님을 넘으려면 {m} 더", grp_climb_lead:"{n}님보다 {m} 앞서요", grp_climb_alone:"지금까지 보드에는 나뿐이에요", grp_moved:"이번 주 {r}위로 올랐어요!", grp_top:"이번 주 1위예요!", grp_err:"그룹을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.", grp_err_rules:"그룹이 아직 준비되지 않았어요. 사이트 주인이 최신 보안 규칙을 게시해야 해요.", grp_err_quota:"오늘은 그룹이 쉬고 있어요. 내일 다시 와 주세요.", grp_prev:"지난주", grp_prev_you:"지난주 {r}위 · {t}" },
    zh:{ grp_sub:"一起学习:看看现在谁在学习,以及每周专注时长排行榜。", grp_up_title:"学习小组为同伴开放", grp_nick:"昵称", grp_nick_ph:"例如:小米", grp_nick_hint:"小组里的所有人都能看到你的昵称、你是否正在学习,以及你本周的学习时长。除非你愿意,请不要使用真名或邮箱。", grp_join:"加入小组", grp_save_nick:"保存昵称", grp_leave:"退出小组", grp_leave_ask:"要退出吗?你会从列表中消失,你本周的时长也会从排行榜中删除。", grp_leave_yes:"是的,退出", grp_cancel:"取消", grp_nick_bad:"昵称需要 2 到 20 个字符。", grp_joined_toast:"你已加入学习小组", grp_left_toast:"你已退出学习小组", grp_saved:"昵称已保存", grp_me_on:"你正显示为学习中", grp_me_off:"你的计时器没有运行,所以不会显示为学习中。开始计时即可出现。", grp_now:"正在学习", grp_none:"现在没有人在学习。开始计时,做第一个吧。", grp_board:"本周", grp_board_none:"本周还没有专注时间。完成一次专注就会出现在这里。", grp_reset:"每周一 00:00 重置(越南时间,GMT+7)。", grp_focus:"专注", grp_break:"休息", grp_you:"你", grp_hm:"{h}小时{m}分钟", grp_m:"{m}分钟", grp_refresh:"刷新", grp_remove:"移出小组", grp_strip_join:"加入学习小组,看看谁在学习以及你的本周排名", grp_strip_n:"{n} 人正在学习", grp_strip_0:"还没有人在学习", grp_rank:"第 {r} 名", grp_rank_none:"本周还没有学习时长", grp_home_sub:"看看现在谁在学习。", grp_home_join:"在专注室加入小组", grp_trend_up:"▲ 今天 {n}", grp_trend_dn:"▼ 今天 {n}", grp_climb_next:"再学 {m} 就能超过 {n}", grp_climb_lead:"你领先 {n} {m}", grp_climb_alone:"目前榜上只有你", grp_moved:"你本周升到第 {r} 名了!", grp_top:"你是本周第 1 名!", grp_err:"无法加载小组,请稍后再试。", grp_err_rules:"小组还没准备好,网站所有者需要发布最新的安全规则。", grp_err_quota:"今天小组休息啦,明天再来吧。", grp_prev:"上周", grp_prev_you:"上周你排第 {r} 名 · {t}" },
    fr:{ grp_sub:"Étudions ensemble : voyez qui étudie en ce moment et le classement hebdomadaire des heures de concentration.", grp_up_title:"Le groupe d'étude est réservé aux Compagnons", grp_nick:"Pseudo", grp_nick_ph:"ex. Mina", grp_nick_hint:"Tout le groupe voit votre pseudo, si vous étudiez, et vos heures de la semaine. Évitez d'utiliser votre vrai nom ou votre e-mail, sauf si vous le souhaitez.", grp_join:"Rejoindre le groupe", grp_save_nick:"Enregistrer le pseudo", grp_leave:"Quitter le groupe", grp_leave_ask:"Quitter ? Vous disparaîtrez de la liste et vos heures de la semaine seront retirées du classement.", grp_leave_yes:"Oui, quitter", grp_cancel:"Annuler", grp_nick_bad:"Le pseudo doit comporter de 2 à 20 caractères.", grp_joined_toast:"Vous avez rejoint le groupe d'étude", grp_left_toast:"Vous avez quitté le groupe d'étude", grp_saved:"Pseudo enregistré", grp_me_on:"Vous apparaissez comme en train d'étudier", grp_me_off:"Votre minuteur ne tourne pas, vous n'apparaissez donc pas comme en train d'étudier. Lancez le minuteur pour apparaître.", grp_now:"En train d'étudier", grp_none:"Personne n'étudie en ce moment. Lancez votre minuteur pour être le premier.", grp_board:"Cette semaine", grp_board_none:"Pas encore de temps de concentration cette semaine. Terminez une session pour apparaître ici.", grp_reset:"Réinitialisé chaque lundi à 00:00 (heure du Vietnam, GMT+7).", grp_focus:"Concentration", grp_break:"Pause", grp_you:"Vous", grp_hm:"{h} h {m} min", grp_m:"{m} min", grp_refresh:"Actualiser", grp_remove:"Retirer du groupe", grp_strip_join:"Rejoignez le groupe pour voir qui étudie et votre rang de la semaine", grp_strip_n:"{n} en train d'étudier", grp_strip_0:"Personne n'étudie encore", grp_rank:"Rang n°{r}", grp_rank_none:"Pas encore d'heures cette semaine", grp_home_sub:"Voyez qui étudie en ce moment.", grp_home_join:"Rejoindre le groupe dans la salle de focus", grp_trend_up:"▲ {n} aujourd'hui", grp_trend_dn:"▼ {n} aujourd'hui", grp_climb_next:"Encore {m} pour dépasser {n}", grp_climb_lead:"Vous devancez {n} de {m}", grp_climb_alone:"Vous êtes seul(e) au classement pour l'instant", grp_moved:"Vous êtes monté(e) au rang n°{r} cette semaine !", grp_top:"Vous êtes n°1 cette semaine !", grp_err:"Impossible de charger le groupe. Réessayez dans un instant.", grp_err_rules:"Le groupe n'est pas encore prêt. Le propriétaire du site doit publier les dernières règles de sécurité.", grp_err_quota:"Le groupe se repose aujourd'hui. Revenez demain.", grp_prev:"Semaine dernière", grp_prev_you:"Vous étiez n°{r} · {t}" },
    es:{ grp_sub:"Estudiemos juntos: mira quién estudia ahora y el ranking semanal de horas de enfoque.", grp_up_title:"El grupo de estudio es para Acompañantes", grp_nick:"Apodo", grp_nick_ph:"p. ej. Mina", grp_nick_hint:"Todos en el grupo ven tu apodo, si estás estudiando y tus horas de esta semana. Evita usar tu nombre real o tu correo si no quieres.", grp_join:"Unirme al grupo", grp_save_nick:"Guardar apodo", grp_leave:"Salir del grupo", grp_leave_ask:"¿Salir? Desaparecerás de la lista y tus horas de esta semana se quitarán del ranking.", grp_leave_yes:"Sí, salir", grp_cancel:"Cancelar", grp_nick_bad:"El apodo debe tener de 2 a 20 caracteres.", grp_joined_toast:"Te uniste al grupo de estudio", grp_left_toast:"Saliste del grupo de estudio", grp_saved:"Apodo guardado", grp_me_on:"Apareces como estudiando", grp_me_off:"Tu temporizador no está en marcha, así que no apareces como estudiando. Inícialo para aparecer.", grp_now:"Estudiando ahora", grp_none:"Nadie está estudiando ahora. Inicia tu temporizador para ser el primero.", grp_board:"Esta semana", grp_board_none:"Aún no hay tiempo de enfoque esta semana. Termina una sesión de enfoque para aparecer aquí.", grp_reset:"Se reinicia cada lunes a las 00:00 (hora de Vietnam, GMT+7).", grp_focus:"Enfoque", grp_break:"Descanso", grp_you:"Tú", grp_hm:"{h} h {m} min", grp_m:"{m} min", grp_refresh:"Actualizar", grp_remove:"Quitar del grupo", grp_strip_join:"Únete al grupo para ver quién estudia y tu puesto semanal", grp_strip_n:"{n} estudiando ahora", grp_strip_0:"Nadie estudia todavía", grp_rank:"Puesto n.º {r}", grp_rank_none:"Aún no hay horas esta semana", grp_home_sub:"Mira quién estudia ahora.", grp_home_join:"Únete al grupo en la sala de enfoque", grp_trend_up:"▲ {n} hoy", grp_trend_dn:"▼ {n} hoy", grp_climb_next:"{m} más para superar a {n}", grp_climb_lead:"Vas por delante de {n} por {m}", grp_climb_alone:"Eres el único en el ranking por ahora", grp_moved:"¡Subiste al puesto n.º {r} esta semana!", grp_top:"¡Eres el n.º 1 esta semana!", grp_err:"No se pudo cargar el grupo. Inténtalo de nuevo en un momento.", grp_err_rules:"El grupo aún no está listo. El dueño del sitio debe publicar las últimas reglas de seguridad.", grp_err_quota:"El grupo descansa hoy. Vuelve mañana.", grp_prev:"Semana pasada", grp_prev_you:"Estuviste en el puesto n.º {r} · {t}" }
  };
  const X = {
    hi:{ grp_home_open:"स्टडी ग्रुप खोलें", grp_home_peek:"देखें कैसे काम करता है", grp_title:'लाइव स्टडी ग्रुप', grp_up_text:'साथी लाइव स्टडी ग्रुप में शामिल हो सकते हैं: देखिए अभी कौन पढ़ रहा है और कितनी देर से, साथ में फ़ोकस घंटों का साप्ताहिक लीडरबोर्ड। आपका सहयोग इस वेबसाइट को चालू रखने में भी मदद करता है।', grp_up_login:'यह देखने के लिए साइन इन करें कि क्या आप जुड़ सकते हैं।', grp_up_cta:'साथी बनने का तरीक़ा देखें', grp_home_up:'साथी देख सकते हैं कि अभी कौन पढ़ रहा है, लाइव टाइमर और साप्ताहिक लीडरबोर्ड के साथ।' },
    ja:{ grp_home_open:"勉強グループを開く", grp_home_peek:"どんな機能か見てみる", grp_title:'ライブ勉強グループ', grp_up_text:'仲間はライブ勉強グループに参加できます。今だれが、どれくらい勉強しているかが見られ、集中時間の週間ランキングもあります。あなたの支援はこのサイトの運営も支えます。', grp_up_login:'参加できるか確認するにはログインしてください。', grp_up_cta:'仲間になる方法を見る', grp_home_up:'仲間は、今だれが勉強中かをライブタイマーと週間ランキングつきで見られます。' },
    ko:{ grp_home_open:"스터디 그룹 열기", grp_home_peek:"어떻게 쓰는지 보기", grp_title:'실시간 스터디 그룹', grp_up_text:'동반자는 실시간 스터디 그룹에 참여할 수 있어요. 지금 누가 얼마나 공부하고 있는지, 그리고 집중 시간 주간 순위를 볼 수 있어요. 여러분의 후원은 이 웹사이트 운영에도 보탬이 돼요.', grp_up_login:'참여할 수 있는지 보려면 로그인하세요.', grp_up_cta:'동반자가 되는 방법 보기', grp_home_up:'동반자는 지금 누가 공부 중인지 실시간 타이머와 주간 순위와 함께 볼 수 있어요.' },
    zh:{ grp_home_open:"打开学习小组", grp_home_peek:"看看怎么用", grp_title:'实时学习小组', grp_up_text:'同伴可以加入实时学习小组：看看现在谁在学习、已经学了多久，还有每周专注时长排行榜。你的支持也让这个网站得以持续运营。', grp_up_login:'登录后查看你是否可以加入。', grp_up_cta:'了解如何成为同伴', grp_home_up:'同伴可以看到现在谁在学习，附带实时计时器和每周排行榜。' },
    fr:{ grp_home_open:"Ouvrir le groupe d'étude", grp_home_peek:"Voir comment ça marche", grp_title:"Groupe d'étude en direct", grp_up_text:"Les Compagnons peuvent rejoindre un groupe d'étude en direct : voir qui étudie en ce moment et depuis combien de temps, avec un classement hebdomadaire des heures de concentration. Ton soutien aide aussi à faire vivre ce site.", grp_up_login:'Connecte-toi pour voir si tu peux le rejoindre.', grp_up_cta:'Voir comment devenir Compagnon', grp_home_up:'Les Compagnons voient qui étudie en ce moment, avec les minuteurs en direct et le classement de la semaine.' },
    es:{ grp_home_open:"Abrir el grupo de estudio", grp_home_peek:"Ver cómo funciona", grp_title:'Grupo de estudio en vivo', grp_up_text:'Los Acompañantes pueden unirse a un grupo de estudio en vivo: ver quién está estudiando ahora y desde hace cuánto, y un ranking semanal de horas de enfoque. Tu apoyo también ayuda a mantener este sitio en marcha.', grp_up_login:'Inicia sesión para ver si puedes unirte.', grp_up_cta:'Ver cómo ser Acompañante', grp_home_up:'Los Acompañantes ven quién está estudiando ahora, con temporizadores en vivo y el ranking semanal.' }
  };
  Object.keys(X).forEach(l => { I18N[l] = I18N[l] || {}; Object.assign(I18N[l], Y[l], X[l]); });   // ghi đè: các bản dịch của khách chưa là Người đồng hành nằm ở đây
  const Z = {   // các khoá bổ sung (rời nhóm có Moon nũng nịu, số người tham gia, xem tất cả, ghi chú đồng hồ) cho 6 ngôn ngữ còn lại
    hi:{ grp_leave_moon:"प्लीज़ मत जाओ~ Moon को तुम्हारी बहुत याद आएगी 🥺", grp_stay:"Moon के साथ रहें", grp_pub:"{m} लोग स्टडी ग्रुप से जुड़े · {n} अभी पढ़ रहे हैं", grp_pub_m:"{m} लोग स्टडी ग्रुप से जुड़े", grp_more:"सभी देखें ({n})", grp_less:"सिर्फ़ टॉप {n} देखें", grp_live0:"अभी पढ़ रहे हैं · इस हफ़्ते अभी कोई मिनट दर्ज नहीं", grp_live_note:"समय सत्र की शुरुआत से गिना जाता है, ब्रेक सहित। साप्ताहिक बोर्ड सिर्फ़ फ़ोकस मिनट गिनता है।" },
    ja:{ grp_leave_moon:"行かないで〜 Moonはさみしいよ 🥺", grp_stay:"Moonといっしょにいる", grp_pub:"{m}人が勉強グループに参加 · {n}人が勉強中", grp_pub_m:"{m}人が勉強グループに参加", grp_more:"全員を見る({n})", grp_less:"上位{n}人だけ表示", grp_live0:"勉強中 · 今週はまだ記録された時間がありません", grp_live_note:"時間はセッション開始からの経過で、休憩も含みます。週間ボードは集中時間だけを数えます。" },
    ko:{ grp_leave_moon:"가지 마요~ Moon이 너무 보고 싶을 거예요 🥺", grp_stay:"Moon이랑 있을게요", grp_pub:"{m}명이 스터디 그룹에 참여 · {n}명 공부 중", grp_pub_m:"{m}명이 스터디 그룹에 참여", grp_more:"모두 보기 ({n})", grp_less:"상위 {n}명만 보기", grp_live0:"공부 중 · 이번 주 기록된 시간이 아직 없어요", grp_live_note:"시간은 세션 시작부터 계산하며 휴식도 포함돼요. 주간 순위는 집중 시간만 세요." },
    zh:{ grp_leave_moon:"别走嘛~ Moon 会很想你的 🥺", grp_stay:"留下陪 Moon", grp_pub:"已有 {m} 人加入学习小组 · {n} 人正在学习", grp_pub_m:"已有 {m} 人加入学习小组", grp_more:"查看全部({n})", grp_less:"只看前 {n} 名", grp_live0:"正在学习 · 本周还没有记录时长", grp_live_note:"时间从本次学习开始计算,包含休息。每周排行榜只统计专注时长。" },
    fr:{ grp_leave_moon:"Ne pars pas~ Moon va tellement te manquer 🥺", grp_stay:"Rester avec Moon", grp_pub:"{m} personnes ont rejoint le groupe d'étude · {n} étudient en ce moment", grp_pub_m:"{m} personnes ont rejoint le groupe d'étude", grp_more:"Voir tout le monde ({n})", grp_less:"Voir seulement le top {n}", grp_live0:"En train d'étudier · aucune minute enregistrée cette semaine", grp_live_note:"Le temps compte depuis le début de la session, pauses comprises. Le classement hebdomadaire ne compte que la concentration." },
    es:{ grp_leave_moon:"No te vayas~ Moon te va a extrañar muchísimo 🥺", grp_stay:"Quedarme con Moon", grp_pub:"{m} personas se unieron al grupo de estudio · {n} estudiando ahora", grp_pub_m:"{m} personas se unieron al grupo de estudio", grp_more:"Ver a todos ({n})", grp_less:"Ver solo el top {n}", grp_live0:"Estudiando ahora · aún sin minutos esta semana", grp_live_note:"El tiempo cuenta desde el inicio de la sesión, descansos incluidos. El ranking semanal solo cuenta minutos de enfoque." }
  };
  Object.keys(Z).forEach(l => { I18N[l] = I18N[l] || {}; Object.assign(I18N[l], Z[l]); });
  const R = {
    en:{"grp_ab_h": "Not studied this week ({n})", "grp_ab_drop": "Was #{r} last week · none this week", "grp_ab_prev": "Studied last week · none this week", "grp_ab_w": "Last studied: week {w}", "grp_ab_new": "No study time yet", "grp_reset": "Minutes reset every Monday at 00:00 (Vietnam time, GMT+7). Members stay on the list, so you can see who has dropped in rank."},
    vi:{"grp_ab_h": "Chưa học tuần này ({n} người)", "grp_ab_drop": "Tuần trước hạng {r} · tuần này chưa học", "grp_ab_prev": "Tuần trước có học · tuần này chưa học", "grp_ab_w": "Học gần nhất: tuần {w}", "grp_ab_new": "Chưa có giờ học nào", "grp_reset": "Số phút làm mới mỗi thứ Hai lúc 00:00 (giờ Việt Nam, GMT+7). Tên thành viên được giữ lại, nên bạn thấy được ai đang tụt hạng."},
    hi:{"grp_ab_h": "इस हफ़्ते अभी नहीं पढ़े ({n})", "grp_ab_drop": "पिछले हफ़्ते #{r} पर थे · इस हफ़्ते कुछ नहीं", "grp_ab_prev": "पिछले हफ़्ते पढ़े · इस हफ़्ते कुछ नहीं", "grp_ab_w": "आख़िरी बार पढ़े: हफ़्ता {w}", "grp_ab_new": "अभी तक पढ़ाई का समय नहीं", "grp_reset": "मिनट हर सोमवार 00:00 बजे रीसेट होते हैं (वियतनाम समय, GMT+7)। सदस्य सूची में बने रहते हैं, इसलिए आप देख सकते हैं कि किसकी रैंक गिरी।"},
    ja:{"grp_ab_h": "今週はまだ勉強していません（{n}人）", "grp_ab_drop": "先週は{r}位 · 今週はまだ", "grp_ab_prev": "先週は勉強 · 今週はまだ", "grp_ab_w": "最後に勉強した週：第{w}週", "grp_ab_new": "まだ勉強時間がありません", "grp_reset": "分数は毎週月曜0:00にリセットされます（ベトナム時間 GMT+7）。メンバーは一覧に残るので、順位が下がった人も見えます。"},
    ko:{"grp_ab_h": "이번 주 아직 공부 안 함 ({n})", "grp_ab_drop": "지난주 {r}위 · 이번 주는 아직", "grp_ab_prev": "지난주에 공부함 · 이번 주는 아직", "grp_ab_w": "마지막으로 공부한 주: {w}주차", "grp_ab_new": "아직 공부 시간이 없어요", "grp_reset": "시간은 매주 월요일 00:00에 초기화돼요(베트남 시간, GMT+7). 멤버는 목록에 남아서 순위가 떨어진 사람도 볼 수 있어요."},
    zh:{"grp_ab_h": "本周还没学习（{n} 人）", "grp_ab_drop": "上周第 {r} 名 · 本周还没有", "grp_ab_prev": "上周学习过 · 本周还没有", "grp_ab_w": "最近一次学习：第 {w} 周", "grp_ab_new": "还没有学习时长", "grp_reset": "时长每周一 00:00 重置（越南时间，GMT+7）。成员会保留在名单中，你能看到谁的排名下滑了。"},
    fr:{"grp_ab_h": "Pas encore étudié cette semaine ({n})", "grp_ab_drop": "N° {r} la semaine dernière · rien cette semaine", "grp_ab_prev": "A étudié la semaine dernière · rien cette semaine", "grp_ab_w": "Dernière étude : semaine {w}", "grp_ab_new": "Aucun temps d’étude pour l’instant", "grp_reset": "Les minutes sont remises à zéro chaque lundi à 00:00 (heure du Vietnam, GMT+7). Les membres restent dans la liste : on voit qui a perdu des places."},
    es:{"grp_ab_h": "Aún sin estudiar esta semana ({n})", "grp_ab_drop": "Fue n.º {r} la semana pasada · nada esta semana", "grp_ab_prev": "Estudió la semana pasada · nada esta semana", "grp_ab_w": "Último estudio: semana {w}", "grp_ab_new": "Aún sin tiempo de estudio", "grp_reset": "Los minutos se reinician cada lunes a las 00:00 (hora de Vietnam, GMT+7). Los miembros siguen en la lista, así ves quién ha bajado de puesto."}
  };   // thành viên ở lại danh sách qua các tuần (người chưa học tuần này, tụt hạng)
  Object.keys(R).forEach(l => { I18N[l] = I18N[l] || {}; Object.assign(I18N[l], R[l]); });
  const C = {   // nút cổ vũ
    en:{ grp_cheer_one:"{n} just clapped for you 👏", grp_cheer_many:"{n} and {k} more just clapped for you 👏", grp_cheer:"Cheer", grp_cheer_tip:"Cheer {n} on", grp_cheered:"Cheered", grp_cheer_got:"{n} new cheer(s) for you! 👏", grp_cheer_max:"You can cheer up to {n} people a week.", grp_cheer_err:"Couldn't send the cheer. Try again." },
    vi:{ grp_cheer_one:"{n} vừa vỗ tay cho bạn 👏", grp_cheer_many:"{n} và {k} người khác vừa vỗ tay cho bạn 👏", grp_cheer:"Cổ vũ", grp_cheer_tip:"Cổ vũ {n}", grp_cheered:"Đã cổ vũ", grp_cheer_got:"Bạn nhận thêm {n} lượt cổ vũ! 👏", grp_cheer_max:"Mỗi tuần bạn cổ vũ được tối đa {n} người.", grp_cheer_err:"Chưa gửi được cổ vũ, thử lại nhé." },
    ja:{ grp_cheer_one:"{n}さんが拍手を送りました 👏", grp_cheer_many:"{n}さんほか{k}人が拍手を送りました 👏", grp_cheer:"応援", grp_cheer_tip:"{n}さんを応援", grp_cheered:"応援済み", grp_cheer_got:"新しい応援が{n}件届きました！👏", grp_cheer_max:"応援できるのは週に{n}人までです。", grp_cheer_err:"応援を送れませんでした。もう一度お試しください。" },
    ko:{ grp_cheer_one:"{n}님이 박수를 보냈어요 👏", grp_cheer_many:"{n}님 외 {k}명이 박수를 보냈어요 👏", grp_cheer:"응원", grp_cheer_tip:"{n}님 응원하기", grp_cheered:"응원함", grp_cheer_got:"새 응원 {n}개를 받았어요! 👏", grp_cheer_max:"한 주에 최대 {n}명까지 응원할 수 있어요.", grp_cheer_err:"응원을 보내지 못했어요. 다시 시도해 주세요." },
    zh:{ grp_cheer_one:"{n} 为你鼓掌了 👏", grp_cheer_many:"{n} 等 {k} 人为你鼓掌了 👏", grp_cheer:"加油", grp_cheer_tip:"为 {n} 加油", grp_cheered:"已加油", grp_cheer_got:"你收到了 {n} 个新的加油！👏", grp_cheer_max:"每周最多可以为 {n} 个人加油。", grp_cheer_err:"加油没有发出去，请再试一次。" },
    fr:{ grp_cheer_one:"{n} vient de vous applaudir 👏", grp_cheer_many:"{n} et {k} autre(s) viennent de vous applaudir 👏", grp_cheer:"Encourager", grp_cheer_tip:"Encourager {n}", grp_cheered:"Encouragé", grp_cheer_got:"{n} nouvel(s) encouragement(s) pour vous ! 👏", grp_cheer_max:"Vous pouvez encourager jusqu'à {n} personnes par semaine.", grp_cheer_err:"Impossible d'envoyer l'encouragement. Réessayez." },
    es:{ grp_cheer_one:"{n} acaba de aplaudirte 👏", grp_cheer_many:"{n} y {k} más acaban de aplaudirte 👏", grp_cheer:"Animar", grp_cheer_tip:"Animar a {n}", grp_cheered:"Animado", grp_cheer_got:"¡Tienes {n} ánimo(s) nuevo(s)! 👏", grp_cheer_max:"Puedes animar a hasta {n} personas por semana.", grp_cheer_err:"No se pudo enviar el ánimo. Inténtalo de nuevo." },
    hi:{ grp_cheer_one:"{n} ने आपके लिए ताली बजाई 👏", grp_cheer_many:"{n} और {k} अन्य ने आपके लिए ताली बजाई 👏", grp_cheer:"हौसला बढ़ाएँ", grp_cheer_tip:"{n} का हौसला बढ़ाएँ", grp_cheered:"हौसला बढ़ाया", grp_cheer_got:"आपको {n} नए चीयर मिले! 👏", grp_cheer_max:"हर हफ़्ते आप ज़्यादा से ज़्यादा {n} लोगों का हौसला बढ़ा सकते हैं।", grp_cheer_err:"चीयर नहीं भेज सके। फिर कोशिश करें।" }
  };
  Object.keys(C).forEach(l => { I18N[l] = I18N[l] || {}; Object.assign(I18N[l], C[l]); });
  const V = {   // lời nhắn cổ vũ có sẵn (grp_cv_p0..p5 đi cùng biểu tượng CV trong group.js; không cho gõ chữ tự do)
    en:{ grp_cv_p0:"Keep going!", grp_cv_p1:"You're doing great", grp_cv_p2:"Moon is cheering for you", grp_cv_p3:"You're on fire!", grp_cv_p4:"Remember to drink some water", grp_cv_p5:"We're studying together",
      grp_cv_pick:"Send {n} a cheer", grp_cv_sent:"Cheer sent to {n}", grp_cv_one:"{n} sent you {e} “{p}”", grp_cv_many:"{n} and {k} more cheered you on {e}", grp_cv_wait:"You can cheer {n} again in {m} min",
      grp_cv_held:"{k} cheer(s) waiting for your break", grp_cv_off_tip:"{n} has turned cheers off", grp_cv_lbl:"Receive cheers", grp_cv_hint:"Cheers are short preset messages with no sound. During a focus block they wait until your break.",
      grp_cv_on_t:"Cheers turned on", grp_cv_off_t:"Cheers turned off. Nobody can send you cheers now.", grp_cv_close:"Close" },
    vi:{ grp_cv_p0:"Cố lên nào!", grp_cv_p1:"Bạn đang làm rất tốt", grp_cv_p2:"Moon đang cổ vũ bạn đó", grp_cv_p3:"Bạn đang cháy hết mình!", grp_cv_p4:"Nhớ uống chút nước nha", grp_cv_p5:"Mình cùng học nè",
      grp_cv_pick:"Gửi lời cổ vũ cho {n}", grp_cv_sent:"Đã gửi cổ vũ cho {n}", grp_cv_one:"{n} gửi bạn {e} “{p}”", grp_cv_many:"{n} và {k} người khác cổ vũ bạn {e}", grp_cv_wait:"Bạn có thể cổ vũ {n} lại sau {m} phút",
      grp_cv_held:"{k} lời cổ vũ đang chờ tới giờ nghỉ", grp_cv_off_tip:"{n} đang tắt nhận cổ vũ", grp_cv_lbl:"Nhận lời cổ vũ", grp_cv_hint:"Lời cổ vũ là các câu ngắn có sẵn, không phát âm thanh. Trong khối tập trung, lời cổ vũ chờ tới giờ nghỉ mới hiện.",
      grp_cv_on_t:"Đã bật nhận cổ vũ", grp_cv_off_t:"Đã tắt nhận cổ vũ. Không ai gửi cổ vũ cho bạn được nữa.", grp_cv_close:"Đóng" },
    ja:{ grp_cv_p0:"がんばって！", grp_cv_p1:"いい調子だよ", grp_cv_p2:"Moonが応援してるよ", grp_cv_p3:"絶好調だね！", grp_cv_p4:"お水を飲むのを忘れずに", grp_cv_p5:"一緒に勉強しよう",
      grp_cv_pick:"{n}さんに応援を送る", grp_cv_sent:"{n}さんに応援を送りました", grp_cv_one:"{n}さんから {e}「{p}」", grp_cv_many:"{n}さんほか{k}人から応援が届きました {e}", grp_cv_wait:"{n}さんへの次の応援は{m}分後に送れます",
      grp_cv_held:"休憩を待っている応援が{k}件", grp_cv_off_tip:"{n}さんは応援の受け取りをオフにしています", grp_cv_lbl:"応援を受け取る", grp_cv_hint:"応援は決まった短いメッセージで、音は鳴りません。集中ブロック中は休憩になってから表示されます。",
      grp_cv_on_t:"応援の受け取りをオンにしました", grp_cv_off_t:"応援の受け取りをオフにしました。今は誰もあなたに応援を送れません。", grp_cv_close:"閉じる" },
    ko:{ grp_cv_p0:"힘내요!", grp_cv_p1:"정말 잘하고 있어요", grp_cv_p2:"Moon이 응원하고 있어요", grp_cv_p3:"불타오르네요!", grp_cv_p4:"물 마시는 거 잊지 마요", grp_cv_p5:"우리 같이 공부해요",
      grp_cv_pick:"{n}님에게 응원 보내기", grp_cv_sent:"{n}님에게 응원을 보냈어요", grp_cv_one:"{n}님의 응원: {e} “{p}”", grp_cv_many:"{n}님 외 {k}명이 응원했어요 {e}", grp_cv_wait:"{m}분 후에 {n}님을 다시 응원할 수 있어요",
      grp_cv_held:"휴식을 기다리는 응원 {k}개", grp_cv_off_tip:"{n}님은 응원 받기를 꺼 두었어요", grp_cv_lbl:"응원 받기", grp_cv_hint:"응원은 정해진 짧은 메시지이고 소리가 나지 않아요. 집중 시간에는 휴식이 시작되면 보여 드려요.",
      grp_cv_on_t:"응원 받기를 켰어요", grp_cv_off_t:"응원 받기를 껐어요. 이제 아무도 응원을 보낼 수 없어요.", grp_cv_close:"닫기" },
    zh:{ grp_cv_p0:"加油！", grp_cv_p1:"你做得很好", grp_cv_p2:"Moon 在为你加油", grp_cv_p3:"状态火热！", grp_cv_p4:"记得喝点水", grp_cv_p5:"我们一起学习",
      grp_cv_pick:"为 {n} 送上加油", grp_cv_sent:"已为 {n} 送上加油", grp_cv_one:"{n} 给你发来 {e}“{p}”", grp_cv_many:"{n} 等 {k} 人为你加油 {e}", grp_cv_wait:"{m} 分钟后可以再为 {n} 加油",
      grp_cv_held:"有 {k} 条加油等到休息时显示", grp_cv_off_tip:"{n} 已关闭接收加油", grp_cv_lbl:"接收加油", grp_cv_hint:"加油是预设的短句，不会发出声音。专注时段内会等到休息时再显示。",
      grp_cv_on_t:"已开启接收加油", grp_cv_off_t:"已关闭接收加油，现在没有人能为你加油。", grp_cv_close:"关闭" },
    fr:{ grp_cv_p0:"Courage, continuez !", grp_cv_p1:"Vous vous en sortez très bien", grp_cv_p2:"Moon vous encourage", grp_cv_p3:"Vous êtes en feu !", grp_cv_p4:"Pensez à boire un peu d’eau", grp_cv_p5:"On étudie ensemble",
      grp_cv_pick:"Encourager {n}", grp_cv_sent:"Encouragement envoyé à {n}", grp_cv_one:"{n} vous envoie {e} « {p} »", grp_cv_many:"{n} et {k} autre(s) vous encouragent {e}", grp_cv_wait:"Vous pourrez encourager {n} à nouveau dans {m} min",
      grp_cv_held:"{k} encouragement(s) en attente de votre pause", grp_cv_off_tip:"{n} a désactivé les encouragements", grp_cv_lbl:"Recevoir des encouragements", grp_cv_hint:"Les encouragements sont de courts messages prédéfinis, sans son. Pendant un bloc de concentration, ils attendent votre pause.",
      grp_cv_on_t:"Encouragements activés", grp_cv_off_t:"Encouragements désactivés. Personne ne peut plus vous en envoyer.", grp_cv_close:"Fermer" },
    es:{ grp_cv_p0:"¡Sigue así!", grp_cv_p1:"Lo estás haciendo genial", grp_cv_p2:"Moon te está animando", grp_cv_p3:"¡Estás que ardes!", grp_cv_p4:"Acuérdate de beber agua", grp_cv_p5:"Estudiamos juntos",
      grp_cv_pick:"Enviar ánimo a {n}", grp_cv_sent:"Ánimo enviado a {n}", grp_cv_one:"{n} te envía {e} «{p}»", grp_cv_many:"{n} y {k} más te animan {e}", grp_cv_wait:"Podrás animar a {n} de nuevo en {m} min",
      grp_cv_held:"{k} ánimo(s) esperando a tu descanso", grp_cv_off_tip:"{n} desactivó los ánimos", grp_cv_lbl:"Recibir ánimos", grp_cv_hint:"Los ánimos son mensajes cortos predefinidos, sin sonido. Durante un bloque de concentración esperan hasta tu descanso.",
      grp_cv_on_t:"Ánimos activados", grp_cv_off_t:"Ánimos desactivados. Ahora nadie puede enviarte ánimos.", grp_cv_close:"Cerrar" },
    hi:{ grp_cv_p0:"लगे रहो!", grp_cv_p1:"आप बहुत अच्छा कर रहे हैं", grp_cv_p2:"Moon आपका हौसला बढ़ा रहा है", grp_cv_p3:"आप तो कमाल कर रहे हैं!", grp_cv_p4:"थोड़ा पानी पीना न भूलें", grp_cv_p5:"हम साथ पढ़ रहे हैं",
      grp_cv_pick:"{n} को हौसला भेजें", grp_cv_sent:"{n} को हौसला भेजा गया", grp_cv_one:"{n} ने आपको भेजा {e} “{p}”", grp_cv_many:"{n} और {k} अन्य ने आपका हौसला बढ़ाया {e}", grp_cv_wait:"{m} मिनट बाद आप {n} को फिर से हौसला भेज सकते हैं",
      grp_cv_held:"{k} हौसला संदेश आपके ब्रेक का इंतज़ार कर रहे हैं", grp_cv_off_tip:"{n} ने हौसला संदेश बंद किए हैं", grp_cv_lbl:"हौसला संदेश पाएँ", grp_cv_hint:"हौसला संदेश पहले से तय छोटे संदेश हैं, कोई आवाज़ नहीं। फ़ोकस के दौरान ये ब्रेक शुरू होने पर दिखते हैं।",
      grp_cv_on_t:"हौसला संदेश चालू", grp_cv_off_t:"हौसला संदेश बंद। अब कोई आपको हौसला नहीं भेज सकता।", grp_cv_close:"बंद करें" }
  };
  Object.keys(V).forEach(l => { I18N[l] = I18N[l] || {}; Object.assign(I18N[l], V[l]); });
})();
(function(){
  const TZ = 'Asia/Ho_Chi_Minh', BEAT = 4 * 60e3, STALE = 9 * 60e3, POLL = 60e3, POLL_SLOW = 180e3, IDLE = 10 * 60e3, SESS_GAP = 15 * 60e3, TOP = 5, FLUSH = 3 * 60e3;   // nhịp báo, quá hạn thì ẩn, tải lại (Phòng tập trung / trang khác), ngừng tải khi không đụng vào gì, nghỉ quá lâu thì tính phiên mới, số người trong bảng
  const wk = () => DT.now().setZone(TZ).toFormat("kkkk-'W'WW"), wkPrev = () => DT.now().setZone(TZ).minus({ weeks:1 }).toFormat("kkkk-'W'WW");
  const ref = () => db.collection('study_group').doc(wk());
  const key = () => 'grp_' + state.user.uid;
  const me = () => state.user ? store.get(key(), null) : null;                    // { n:biệt danh } khi đã tham gia
  const access = () => !!state.user && !DEMO && typeof plLinked === 'function' && plLinked();   // cùng điều kiện với Planner (chốt cuối cùng ở firestore.rules)
  const on = () => branding.groupOn === true && access();
  let showAll = false, cheers = {}, live = {}, board = {}, loadedAt = 0, err = '', busy = false, leaving = false, lastSent = '', lastBeat = 0, lastWeek = '', denied = 0, timers = false, lastFlush = 0, loadedWk = '', retried = false, cvs = {}, qt = {}, pick = '';
  /* Danh sách thành viên giữ qua các tuần (study_roster/all = { m:{ uid:{ n, w:tuần học gần nhất } } }): bảng tuần về trống mỗi thứ Hai nhưng tên người tham gia thì ở lại,
     để thấy ai từng học và đang tụt hạng. Mỗi người tự ghi mục của mình tối đa một lần mỗi tuần; đọc tối đa một lần mỗi 6 giờ rồi lưu trong máy. */
  const rosRef = () => db.collection('study_roster').doc('all');
  let rosOk = false, roster = (store.get('grp_ros', null) || {}).m || {}, rosAt = +(store.get('grp_ros', null) || {}).at || 0, rosBusy = false;
  const rosSave = () => store.set('grp_ros', { at:rosAt, m:roster });
  function rosLoad(){
    if (rosBusy || DEMO) return;
    if (Date.now() - rosAt < 6 * 3600e3) { if (rosAt > 0 && !rosOk && store.get('grp_ros_ok', 0)) { rosOk = true; pushStats(); } return; }   // bản trong máy còn mới (đã tải thành công lần trước)
    rosBusy = true;
    rosRef().get().then(d => { const m = d.exists && d.data().m; roster = m && typeof m === 'object' ? m : {}; rosAt = Date.now(); rosOk = true; store.set('grp_ros_ok', 1); rosSave(); pushStats(); }).catch(() => { rosAt = Date.now() - 5.5 * 3600e3; store.set('grp_ros_ok', 0); }).then(() => { rosBusy = false; renderBox(); });   // chưa dán luật mới / offline: thử lại sau 30 phút, bảng vẫn chạy bình thường
  }
  function rosMark(){                    // sau một lần ghi thành công: ghi tên + tuần hiện tại của mình vào danh sách (một lần mỗi tuần / mỗi lần đổi tên)
    const m = me(), id = state.user && state.user.uid; if (!m || !id || DEMO) return;
    const tag = wk() + '|' + m.n; if (store.get('grp_rosw', '') === tag) return; store.set('grp_rosw', tag);
    rosRef().set({ m:{ [id]:{ n:m.n, w:wk() } } }, { merge:true }).then(() => { roster[id] = { n:m.n, w:wk() }; rosSave(); }).catch(() => store.set('grp_rosw', ''));
  }
  function rosDrop(id){ delete roster[id]; rosSave(); if (!DEMO) rosRef().update({ ['m.' + id]: DEL() }).catch(() => {}); }
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
    if (inc > 0 && loadedWk !== wkNow) {      // luật cần biết mục của bạn đã có mốc bắt đầu (f) chưa, nên đọc bảng tuần này trước khi cộng phút
      try { const d = await ref().get(), x = d.exists ? d.data() : {}; live = x.live || {}; board = x.board || {}; loadedWk = wkNow; } catch (e) { return errNote(e); }
    }
    const ent = board[id]; let sentF = false;
    if (inc > 0 && retried && ent && ent.t && typeof ent.t.toMillis === 'function') {   // sau một lần bị từ chối (thường do thiết bị khác của bạn vừa ghi): chỉ gửi phần luật cho phép theo mốc giờ máy chủ mới, phần còn lại ở lại hàng chờ
      const okMin = Math.floor((Date.now() - ent.t.toMillis() + 60e3) / 60e3); inc = Math.max(0, Math.min(inc, okMin));
    }
    if (entry) o.live = { [id]: entry };
    if (inc > 0) {   // chỉ ghi bảng khi có phút mới: nhịp báo "đang học" không đổi t, nên t luôn là lúc bạn đạt số phút hiện tại (dùng để xếp khi bằng phút: ai đạt trước đứng trên)
      const b = { n:m.n, mins:firebase.firestore.FieldValue.increment(inc), t:TS() };
      if (inc > 0 && !(ent && ent.f)) { b.f = TS(); b.z = ent ? ent.mins | 0 : 0; sentF = true; }   // mốc chống khai khống: lần đầu cộng phút trong tuần (hoặc mục cũ chưa có mốc), ghi một lần rồi giữ nguyên
      o.board = { [id]: b };
    }
    if (!o.live && !o.board) return;
    try {
      await ref().set(o, { merge:true });
      if (entry) { live[id] = entry; lastSent = entry.k; lastBeat = entry.b; }
      if (inc > 0) { store.set('grp_pend', Math.max(0, pend() - inc)); const b0 = board[id] || { n:m.n, mins:0 }; board[id] = { ...b0, n:m.n, mins:(b0.mins | 0) + inc, f:b0.f || true, z:sentF ? o.board[id].z : b0.z }; }
      lastFlush = Date.now(); lastWeek = wkNow; err = ''; denied = 0; retried = false; rankWatch(); rosMark(); renderBox();
    } catch (e) {
      if (entry) lastSent = '';
      const nope = e && (e.code === 'permission-denied' || e.code === 'invalid-argument');
      if (inc > 0 && nope) {
        if (!retried) { retried = true; loadedWk = ''; }   // có thể thiết bị khác vừa ghi (đổi mốc giờ) hoặc vừa tạo mục của bạn: đọc lại bảng rồi thử một lần nữa, GIỮ phút đang chờ (trước đây bỏ ngay nên phút học bị mất)
        else { store.set('grp_pend', Math.max(0, pend() - inc)); retried = false; }   // vẫn bị từ chối sau khi đã đọc lại thì bỏ phần này, không thử lại mãi
      }
      if (nope && ++denied < 2) { console.warn('[EP] study group write denied', e.code); renderBox(); return; }   // một lần bị từ chối (vd. quá tốc độ cộng phút) không đáng hiện lời báo "chưa dán luật"; từ lần thứ hai liên tiếp mới báo
      errNote(e);
    }
  }
  function sync(force){                  // gọi mỗi khi đồng hồ đổi trạng thái và mỗi 30 giây (để báo nhịp)
    accrue(); if (!focusing()) cvShow();
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

  /* ---------- số liệu công khai (khách chưa đăng nhập / chưa vào nhóm cũng thấy) ----------
     study_stats/current = { wk, members, live, t }: chỉ vài con số, không có tên hay phút của ai. Người trong nhóm ghi tối đa 1 lần / 5 phút (luật còn chặn nhanh hơn 4 phút);
     khách đọc đúng 1 lượt khi mở trang rồi lưu trong máy 10 phút, không tải lại liên tục, nên số lượt đọc tăng theo số lượt khách mở web chứ không theo thời gian. */
  const statsRef = () => db.collection('study_stats').doc('current');
  let pub = store.get('grp_pub', null), pubBusy = false;
  const counts = () => { const ids = new Set([...Object.keys(roster), ...Object.keys(board), ...liveRows().map(r => r.id)]); return { m:ids.size, n:liveRows().length }; };   // m = mọi người từng tham gia (danh sách study_roster giữ qua các tuần + bảng tuần này), không về 0 mỗi thứ Hai
  function pubNums(){ if (on() && known() && loadedWk === wk()) return counts(); return pub ? { m:pub.m, n:pub.n } : null; }   // tổng số người đã tham gia không phụ thuộc tuần; số người đang học đã tự về 0 nếu số liệu cũ hơn 15 phút
  function pushStats(){
    if (!on() || !lead() || (!rosOk && !DEMO)) return; const now = Date.now();   // chờ danh sách thành viên vừa tải xong, nếu không số ghi lên sẽ thấp hơn thật   // không cần đã tham gia nhóm: admin / Người đồng hành đang xem nhóm cũng cập nhật số liệu được
    if (now - (+store.get('grp_pubw', 0) || 0) < 5 * 60e3) return; store.set('grp_pubw', now);
    const c = counts();
    statsRef().set({ wk:wk(), members:c.m, live:c.n, t:TS() }).catch(() => {});   // bị luật từ chối (có người khác vừa ghi) thì bỏ qua
  }
  function pubLoad(){
    if (pubBusy || DEMO || typeof db === 'undefined') return;
    if (pub && Date.now() - pub.at < 10 * 60e3) return; pubBusy = true;
    statsRef().get().then(d => { const x = d.exists ? d.data() : null, tm = x && x.t && typeof x.t.toMillis === 'function' ? x.t.toMillis() : 0;
      pub = { at:Date.now(), wk:x && x.wk, m:(x && x.members | 0) || 0, n:(x && Date.now() - tm < 15 * 60e3) ? (x.live | 0) : 0 }; store.set('grp_pub', pub); }).catch(() => { pub = { at:Date.now(), wk:'', m:0, n:0 }; }).then(() => { pubBusy = false; renderBox(); });
  }
  const pubText = () => { const c = pubNums(); return c && c.m > 0 ? (c.n > 0 ? t('grp_pub', { m:c.m, n:c.n }) : t('grp_pub_m', { m:c.m })) : ''; };
  const pubLine = () => { const x = pubText(); return x ? `<p class="grp-pub small muted">${ic('users', 'sm')} ${esc(x)}</p>` : ''; };
  function renderHero(){ const el = document.getElementById('grp-hero'); if (!el) return; const x = pubText(); el.innerHTML = x ? `<span class="grp-hero-pill">${ic('users', 'sm')} ${esc(x)}</span>` : ''; }

  /* ---------- đọc ---------- */
  /* Bảng tuần trước: top 3 và hạng của bạn, đọc tài liệu tuần trước đúng MỘT lần mỗi tuần rồi lưu trong máy (grp_prev), nên chỉ tốn thêm một lượt đọc mỗi người mỗi tuần. */
  let prev = null, prevTry = '';
  function prevLoad(){
    if (!state.user || !on() || !me()) return; const w = wk(), id = state.user.uid, c = store.get('grp_prev', null);
    if (c && c.for === w && c.uid === id) { prev = c; return; }
    if (prevTry === w + id) return; prevTry = w + id;
    db.collection('study_group').doc(wkPrev()).get().then(d => {
      const b = (d.exists && d.data().board) || {}, tms = e => e && e.t && typeof e.t.toMillis === 'function' ? e.t.toMillis() : 0;
      const all = Object.entries(b).map(([k, e]) => ({ k, n:(e && e.n) || '?', mins:(e && e.mins) | 0, at:tms(e) })).filter(x => x.mins > 0).sort((a, z) => z.mins - a.mins || a.at - z.at || a.k.localeCompare(z.k)), i = all.findIndex(x => x.k === id);
      prev = { for:w, uid:id, rk:Object.fromEntries(all.slice(0, 300).map((x, i) => [x.k, i + 1])), top:all.slice(0, 3).map(x => ({ k:x.k, n:x.n, mins:x.mins })), me:i >= 0 ? { r:i + 1, mins:all[i].mins } : null };
      store.set('grp_prev', prev); renderBox();
    }).catch(() => {});
  }
  function prevHTML(){
    const id = state.user.uid; if (!prev || prev.uid !== id || prev.for !== wk() || !prev.top.length) return '';
    return `<div class="grp-prev"><h3 class="grp-h">${esc(t('grp_prev'))}</h3><ol class="grp-list">${prev.top.map((x, i) => `<li class="grp-row ${x.k === id ? 'me' : ''}"><span class="grp-rank r${i + 1}">${i + 1}</span>${avatar(x.n)}<b class="grp-n">${esc(x.n)}${x.k === id ? ` <span class="badge">${esc(t('grp_you'))}</span>` : ''}</b><span class="grp-t">${esc(fmt(x.mins * 60000))}</span></li>`).join('')}</ol>${prev.me && prev.me.r > 3 ? `<p class="small muted">${esc(t('grp_prev_you', { r:prev.me.r, t:fmt(prev.me.mins * 60000) }))}</p>` : ''}</div>`;
  }
  /* Vào web là thấy ngay người đang học của lần xem trước (lưu trong máy), rồi mới cập nhật từ Firestore; trong lúc chờ hiện "Đang tải" thay vì "Chưa có ai". Người báo nhịp quá 9 phút vẫn tự bị ẩn. */
  let seeded = false;
  const known = () => loadedAt > 0 || seeded;
  const ms = v => v && typeof v.toMillis === 'function' ? v.toMillis() : 0, wrapMs = n => n ? { toMillis:() => n } : undefined;
  function saveSnap(){
    try { store.set('grp_snap', { uid:state.user.uid, wk:wk(), live, board:Object.fromEntries(Object.entries(board).map(([k, e]) => [k, { ...e, t:ms(e && e.t), f:e && e.f ? ms(e.f) : undefined }])) }); } catch (e) { /* đầy bộ nhớ: bỏ qua */ }
  }
  function prime(){
    if (known() || !state.user) return; const x = store.get('grp_snap', null);
    if (!x || x.uid !== state.user.uid || x.wk !== wk()) return;
    live = x.live || {}; board = Object.fromEntries(Object.entries(x.board || {}).map(([k, e]) => [k, { ...e, t:wrapMs(e.t), f:wrapMs(e.f) }])); seeded = true;
  }
  async function load(force){
    if (!on() || busy || (!force && Date.now() - loadedAt < 15000)) return; busy = true; renderBox();
    const w0 = wk();
    try {
      const d = await ref().get(), x = d.exists ? d.data() : {};
      live = x.live || {}; board = x.board || {}; cheers = x.cheers || {}; cvs = x.cv || {}; qt = x.qt || {}; loadedAt = Date.now(); loadedWk = w0; err = ''; saveSnap(); rankWatch(); cheerWatch(); cvWatch(); qtSync(); prevLoad(); pushStats(); rosLoad();
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
    return `${head()}${pubLine()}<p class="muted">${esc(t('grp_up_text'))}</p>
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
  let dup = {};   // tên (không phân biệt hoa thường) -> số người dùng; trùng thì thêm đuôi #XYZ lấy từ mã tài khoản để phân biệt
  const nk = n => String(n).trim().toLowerCase();
  function dupCount(){ const c = {}, seen = new Set(); [board, live, roster].forEach(m => Object.entries(m).forEach(([k, e]) => { if (e && e.n && !seen.has(k)) { seen.add(k); c[nk(e.n)] = (c[nk(e.n)] || 0) + 1; } })); dup = c; }
  const dn = (k, n) => (dup[nk(n)] || 0) > 1 ? `${n} #${String(k).slice(-3).toUpperCase()}` : n;
  const avatar = n => `<i class="grp-av" style="--h:${hue(n)}">${esc(String(n).slice(0, 1).toUpperCase())}</i>`;
  /* ---------- Bể bơi đêm trăng trên bảng tuần (cùng phong cách Hành trình trăng) ----------
     Mỗi người một làn dọc (tối đa 5: top 4 + chính mình nếu ở ngoài top), bơi từ vạch xuất phát lên phía mặt trăng (đích) càng cao khi càng nhiều phút; Moon ngồi trên bờ ngắm trăng.
     Vẽ bằng chính bộ vẽ của Hành trình trăng (moon-art.js: trời sao, trăng, nước có vệt trăng, đom đóm, mèo Moon, lớp chất liệu sáp):
     file đó chỉ nạp khi cần, xong thì vẽ lại bảng. Mũ bơi cùng màu với ảnh đại diện trong danh sách bên dưới.
     Dựng từ dữ liệu bảng tuần sẵn có: không thêm lượt đọc / ghi Firestore. Hoạt hình bơi vào chỉ chạy lần đầu mỗi lần mở trang và tắt khi bật giảm chuyển động. */
  let poolPlayed = false, poolLoad = false, poolN = 0;
  const POOL_SUIT = ['#8fb4ff', '#ffb78a', '#9be3c5', '#d4b4ff', '#ffe08f', '#ff9db5'], POOL_RANK = [['#fff2c4', '#4a3a12'], ['#d7dff5', '#222c4d'], ['#f0c39a', '#4a2c14']];
  function poolSvg(rows, meId, play){
    if (!rows.length) return '';
    const W = 400, HY = 96, YN = 308, H = YN + 46, N = rows.length, HWN = N * 38, MX = W / 2, YF = HY + Math.round((YN - HY) * .42), K = 1 / (YN - HY);
    if (typeof mjCtx !== 'function' || typeof mjTexDefs !== 'function') {
      if (!poolLoad && typeof loadMoonArt === 'function') { poolLoad = true; loadMoonArt().then(() => { poolLoad = false; renderBox(); }).catch(() => { poolLoad = false; }); }
      return `<div class="grp-pool wait" style="aspect-ratio:${W}/${H}"></div>`;
    }
    poolPlayed = true;
    // phối cảnh: các làn thu dần về chân trời (nơi có mặt trăng); hw(y) = nửa bề ngang bể ở độ cao y, sc(y) = tỉ lệ vật thể theo độ xa
    const k = 'grp' + (++poolN), c = mjCtx(21 + poolN % 7, k), hw = y => HWN * (y - HY) * K, sc = y => (y - HY) * K, ex = (i, y) => MX + (i / N * 2 - 1) * hw(y), lc = (i, y) => MX + ((i + .5) / N * 2 - 1) * hw(y);
    const inPool = (x, y) => y >= YF && Math.abs(x - MX) < hw(y), inL = (x, y) => y >= YF - 4 && x < MX - hw(y) - 6, inR = (x, y) => y >= YF - 4 && x > MX + hw(y) + 6;
    let s = mjSkyN(c, '#0a1431', '#223c78', HY, { streaks:20, stars:52, sparks:4, starH:.95 });
    s += mjMoonN(c, MX, 52, 22, { halo:3.2 });
    s += `<path d="M0 ${HY}V${HY - 11}Q60 ${HY - 25} 126 ${HY - 9}T262 ${HY - 13}T400 ${HY - 8}V${HY}Z" fill="#0b1630"/>` + mjDots(c, 26, [0, HY - 7, W, HY - 1], ['#ffd27a', '#ffe9b0'], [.9, 1.6], .8);
    s += mjWater(c, HY, YN, { top:'#254a8c', bot:'#091329', path:MX, spread:150, n:240, glints:200 });
    // bể: mặt nước sáng hơn, nằm trong hình thang
    const L0 = MX - hw(YF), R0 = MX + hw(YF), pool = `M${L0} ${YF}H${R0}L${MX + HWN} ${YN}H${MX - HWN}Z`;
    s += `<path d="${pool}" fill="${mjLin(c, [[0, '#4a86d8', .32], [1, '#1d4690', .5]])}"/>` + mjS(c, 150, [0, YF, W, YN], ['#5d96e6', '#3a74c4', '#9fc4ff'], { ang:0, len:[8, 36], w:[1.2, 2.2], op:.5, jit:2, in:inPool });
    rows.forEach((x, i) => { if (x.k === meId) s += `<path d="M${ex(i, YF)} ${YF}L${ex(i + 1, YF)} ${YF}L${ex(i + 1, YN)} ${YN}L${ex(i, YN)} ${YN}Z" fill="#cfe0ff" opacity=".14"/>`; });
    // hai bờ và bờ gần (đá, cỏ, thông), có lề đá dọc bể
    const gnd = mjLin(c, [[0, '#14224a'], [1, '#0a1329']]);
    s += `<path d="M0 ${YF - 4}H${L0 - 6}L${MX - HWN - 6} ${YN}H0Z" fill="${gnd}"/><path d="M${W} ${YF - 4}H${R0 + 6}L${MX + HWN + 6} ${YN}H${W}Z" fill="${gnd}"/>`
      + mjS(c, 70, [0, YF - 4, MX - 40, YN], ['#1a2c58', '#223a6c', '#0b1531'], { ang:70, len:[8, 22], w:[2, 3.4], op:.7, jit:12, in:inL }) + mjS(c, 70, [MX + 40, YF - 4, W, YN], ['#1a2c58', '#223a6c', '#0b1531'], { ang:110, len:[8, 22], w:[2, 3.4], op:.7, jit:12, in:inR });
    s += `<path d="M${L0 - 3} ${YF}L${MX - HWN - 3} ${YN}M${R0 + 3} ${YF}L${MX + HWN + 3} ${YN}" stroke="#aebbe0" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>`;
    s += `<rect y="${YN}" width="${W}" height="${H - YN}" fill="${mjLin(c, [[0, '#16254f'], [1, '#0a1329']])}"/>` + mjS(c, 36, [0, YN, W, H], ['#1a2c58', '#223a6c', '#0b1531'], { ang:2, len:[10, 26], w:[2, 3], op:.7, jit:4 }) + `<path d="M${MX - HWN - 6} ${YN}H${MX + HWN + 6}" stroke="#aebbe0" stroke-width="2.6" opacity=".5"/>`;
    for (let x = 6; x < L0 - 22; x += 12 + c.r() * 10) s += mjPine(x, YF + 6 + c.r() * 8, 30 + c.r() * 14, c.r() < .5 ? '#0e1f3a' : '#12284a');
    // phao hạt đèn: hạt xa nhỏ và sát nhau, hạt gần to và thưa (chia đều theo độ xa thật)
    const zn = 1 / (YN - HY - 2), zf = 1 / (YF - HY), nb = 20;
    for (let i = 0; i <= N; i++) {
      const col = i % 2 ? '#a9c8ff' : '#ffd98a'; let d = '', g = '';
      for (let j = 0; j <= nb; j++) { const y = HY + 1 / (zn + (zf - zn) * j / nb), x = ex(i, y), r = .8 + 2.2 * sc(y); d += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}"/>`; if (j % 2 === 0) g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * 2.2).toFixed(1)}"/>`; }
      s += `<path d="M${ex(i, YN - 2)} ${YN - 2}L${ex(i, YF)} ${YF}" stroke="#8da2d6" stroke-width=".8" opacity=".45" fill="none"/><g fill="${col}" opacity=".17">${g}</g>` + mjA(c, 'mja-shim', `<g fill="${col}" opacity=".95">${d}</g>`, 3.4);
    }
    // đích: vạch vàng ngay dưới chân trời, hai cột đèn
    s += mjGlow(c, MX, YF, hw(YF) * 1.2, 'w', .22) + `<path d="M${L0 - 3} ${YF}H${R0 + 3}" stroke="#ffe9a0" stroke-width="1.8" stroke-dasharray="4 4" opacity=".95"/>`;
    [L0 - 8, R0 + 8].forEach(x => { s += `<path d="M${x} ${YF + 2}V${YF - 24}" stroke="#3b2d4f" stroke-width="2.6" stroke-linecap="round"/>` + mjGlow(c, x, YF - 27, 26, 'w', .85) + `<rect x="${x - 2.4}" y="${YF - 31}" width="4.8" height="8" rx="1.2" fill="#ffd27a"/>`; });
    s += mjCat(c, 46, YF + 36, .85, 'sitB', { shadow:false });
    s += mjGlow(c, 356, YF + 56, 34, 'w', .7) + `<path d="M356 ${YF + 70}V${YF + 50}" stroke="#3b2d4f" stroke-width="3" stroke-linecap="round"/><rect x="353.5" y="${YF + 44}" width="5" height="9" rx="1.3" fill="#ffd27a"/>`;
    s += mjFlies(c, 12, [30, HY + 6, W - 30, YN - 10], { sz:.85, in:(x, y) => y < YF + 40 || inPool(x, y) });
    // người bơi: nhìn từ phía sau, bơi về phía trăng; vẽ từ xa tới gần để người gần che người xa
    const zs = 1 / (YN - 40 - HY), ze = 1 / (YF + 16 - HY), lead = Math.max(1, rows[0].mins), S0 = 1.45, ys = YN - 40;
    rows.map((x, i) => ({ x, i, y:HY + 1 / (zs + (ze - zs) * (x.mins / lead)) })).sort((a, b) => a.y - b.y).forEach(({ x, i, y:py }) => {
      const cx = lc(i, py), q = S0 * sc(py), mine = x.k === meId, cap = `hsl(${hue(x.n)},78%,62%)`, [rb, rt] = POOL_RANK[x.r - 1] || ['#2c3d73', '#dfe8ff'], bx = lc(i, YN) , by = YN + 25;
      s += `<g transform="translate(${cx.toFixed(1)} ${py.toFixed(1)}) scale(${q.toFixed(3)})"><title>${esc(x.n)} · ${esc(fmt(x.mins * 60000))}</title><g class="grp-sw-i" style="--dx:${((lc(i, ys) - cx) / q).toFixed(0)}px;--dy:${((ys - py) / q).toFixed(0)}px;--k:${(sc(ys) / sc(py)).toFixed(2)}">`
        + mjGlow(c, 0, -8, 34, 'c', .55)
        + `<ellipse cx="0" cy="5" rx="23" ry="7" fill="none" stroke="#cfe0ff" stroke-width="1.5" opacity=".5"/><ellipse cx="0" cy="5" rx="34" ry="10.5" fill="none" stroke="#cfe0ff" stroke-width="1.1" opacity=".25"/>`
        + `<path d="M-7 7L-27 22M7 7L27 22" stroke="#cfe0ff" stroke-width="1.7" stroke-linecap="round" opacity=".45" fill="none"/>`
        + `<path d="M-3 7q-2 6 -4 10M3 7q2 6 4 10" fill="none" stroke="${MJN.skin}" stroke-width="3.2" stroke-linecap="round"/><path d="M-11 15q3 -4 7 0M4 15q3 -4 7 0" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".8"/>`
        + `<path d="M-8 -2Q-18 -13 -10 -26" fill="none" stroke="${MJN.skin}" stroke-width="3.6" stroke-linecap="round"/>`
        + `<ellipse cx="0" cy="0" rx="11.5" ry="6.6" fill="${POOL_SUIT[i % POOL_SUIT.length]}"/>`
        + `<path d="M9 -1Q17 -6 14 -14" fill="none" stroke="${MJN.skin}" stroke-width="3.6" stroke-linecap="round"/>`
        + `<circle cx="0" cy="-9" r="5.8" fill="${cap}" stroke="#fff2c4" stroke-width=".9"/>`
        + (mine ? `<ellipse cx="0" cy="-5" rx="27" ry="25" fill="none" stroke="#ffe9a0" stroke-width="1.6" stroke-dasharray="3.5 3.5"/>` : '') + `</g></g>`;
      if (mine) s += `<text x="${cx.toFixed(1)}" y="${(py + 20 * q + 11).toFixed(1)}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#ffe9a0" stroke="#0d1633" stroke-width="3" paint-order="stroke" font-family="inherit">${esc(t('grp_you'))}</text>`;
      if (x.r === 1) s += mjA(c, 'mja-tw', mjSpark(cx + 16 * q, py - 30 * q, 5 + 2 * q, '#fffbea'), 3);
      s += `<circle cx="${bx.toFixed(1)}" cy="${by}" r="12" fill="${rb}" stroke="#fff2c4" stroke-opacity="${x.r < 4 ? .9 : .35}" stroke-width="1.3"/>` + (x.r === 1 ? mjGlow(c, bx, by, 26, 'm', .55) : '') + `<text x="${bx.toFixed(1)}" y="${by + 4.6}" text-anchor="middle" font-size="13" font-weight="800" fill="${rt}" font-family="inherit">${x.r}</text>`;
    });
    return `<div class="grp-pool ${play ? 'play' : ''}"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('grp_board'))}" xmlns="http://www.w3.org/2000/svg"><defs>${mjTexDefs(k, (9 + poolN) % 50)}${c.d}</defs><rect width="${W}" height="${H}" fill="${MJN.navy}"/>${s}<rect width="${W}" height="${H}" fill="url(#${k}v)"/><g pointer-events="none"><rect width="${W}" height="${H}" filter="url(#${k}B)" style="mix-blend-mode:soft-light" opacity=".55"/><rect width="${W}" height="${H}" filter="url(#${k}T)" style="mix-blend-mode:soft-light"/></g></svg></div>`;
  }
  const kick = id => state.isAdmin && id !== state.user.uid ? `<button type="button" class="grp-x" data-act="grpKick" data-id="${esc(id)}" title="${esc(t('grp_remove'))}" aria-label="${esc(t('grp_remove'))}">${ic('x', 'sm')}</button>` : '';
  const plus = (id, n) => state.isAdmin ? `<button type="button" class="grp-x" data-act="grpAdd" data-id="${esc(id)}" data-n="${esc(n)}" title="Cộng bù phút" aria-label="Cộng bù phút">${ic('plus', 'sm')}</button>` : '';   // chỉ admin: cộng bù phút bị mất do lỗi cũ
  /* Cổ vũ: cheers = { <người gửi>: [<người nhận>, ...] } nằm trong cùng tài liệu tuần (không tốn thêm lượt đọc). Mỗi người chỉ ghi danh sách của chính mình,
     mỗi người nhận một lần mỗi tuần, tối đa CHEER_MAX người; số cổ vũ của một người = số danh sách có tên họ. Hết tuần tự về trống cùng bảng tuần. */
  const CHEER_MAX = 20, cheerOf = id => Object.values(cheers).reduce((a, l) => a + (Array.isArray(l) && l.includes(id) ? 1 : 0), 0);
  const myCheers = () => { const l = state.user && cheers[state.user.uid]; return Array.isArray(l) ? l : []; };
  const cheerBtn = (id, n, at) => {
    const c = cheerOf(id), cnt = c ? `<span class="grp-ch-n">${c}</span>` : '';
    if (id !== state.user.uid && isLive(id)) return cvBtn(id, n, cnt, at);
    if (id === state.user.uid) return c ? `<span class="grp-ch me${pulse ? ' pop' : ''}" title="${esc(t('grp_cheer'))}">👏${cnt}</span>` : '';
    const done = myCheers().includes(id);
    return `<button type="button" class="grp-ch${done ? ' on' : ''}" data-act="grpCheer" data-id="${esc(id)}" ${done ? 'disabled' : ''} title="${esc(done ? t('grp_cheered') : t('grp_cheer_tip', { n }))}" aria-label="${esc(done ? t('grp_cheered') : t('grp_cheer_tip', { n }))}">👏${cnt}</button>`;
  };
  /* Hiệu ứng vỗ tay: vài biểu tượng 👏 bay lên từ chỗ bấm (người gửi) hoặc từ giữa dưới màn hình (người nhận); tôn trọng chế độ giảm chuyển động */
  function clapFx(x, y, n, big){
    if (motionOff()) return;
    for (let i = 0; i < n; i++) {
      const e = document.createElement('span'); e.className = 'clap-p' + (big ? ' big' : ''); e.textContent = i % 5 === 4 ? '✨' : '👏'; e.setAttribute('aria-hidden', 'true');
      e.style.left = (x + (Math.random() - .5) * (big ? 160 : 24)) + 'px'; e.style.top = y + 'px';
      e.style.setProperty('--dx', ((Math.random() - .5) * (big ? 220 : 90)).toFixed(0) + 'px'); e.style.setProperty('--dy', (-(big ? 120 : 50) - Math.random() * (big ? 160 : 60)).toFixed(0) + 'px'); e.style.setProperty('--r', ((Math.random() - .5) * 50).toFixed(0) + 'deg');
      e.style.animationDelay = (i * (big ? 70 : 40)) + 'ms'; document.body.appendChild(e); setTimeout(() => e.remove(), 1700 + i * 80);
    }
  }
  const nameOfId = id => { const e = board[id] || live[id] || roster[id]; return e && e.n ? dn(id, e.n) : '?'; };
  const cheerFrom = id => Object.entries(cheers).filter(([, l]) => Array.isArray(l) && l.includes(id)).map(([k]) => k);
  let pulse = false;
  function cheerWatch(){                 // có người vừa vỗ tay cho mình (so với lần thấy trước) thì báo tên người đó một lần, kèm hiệu ứng
    if (!state.user || !me() || loadedWk !== wk()) return; const id = state.user.uid, w = wk(), from = cheerFrom(id), p = store.get('grp_cheer', null);
    const old = p && p.wk === w && p.id === id ? (Array.isArray(p.from) ? p.from : from) : null, fresh = old ? from.filter(k => !old.includes(k)) : [];
    const loud = fresh.filter(k => !cvTo(k, id));                    // người gửi đã dùng lời nhắn cổ vũ mới: cvWatch báo rồi, không báo hai lần
    if (loud.length && !cvOff() && !focusing() && document.visibilityState === 'visible') {
      toast(loud.length === 1 ? t('grp_cheer_one', { n:nameOfId(loud[0]) }) : t('grp_cheer_many', { n:nameOfId(loud[0]), k:loud.length - 1 }), 3600);
      clapFx(innerWidth / 2, innerHeight - 110, Math.min(14, 6 + loud.length * 2), true); pulse = true;
    }
    if (!old || old.length !== from.length || fresh.length) store.set('grp_cheer', { wk:w, id, from });
  }
  /* ---------- Lời nhắn cổ vũ (nâng cấp từ nút 👏) ----------
     Bấm 👏 cạnh một người ĐANG HỌC (còn trong live) để chọn 1 trong 6 lời có sẵn (CV + grp_cv_p0..p5). Không có ô gõ chữ nên không spam / chửi bới được.
     Dữ liệu nằm ngay trong tài liệu tuần (người nhận thấy qua lần tải lại 60 giây sẵn có, KHÔNG tốn thêm lượt đọc; mỗi lần gửi = 1 lượt ghi):
       cv: { <người gửi>: { to:<người nhận gần nhất>, h:{ <người nhận>: { e:<0..5>, t:giờ máy chủ } } } }   mỗi người nhận giữ đúng lời gần nhất
       qt: { <uid>: true }                                                                                   người tắt nhận cổ vũ
     Luật Firestore: chỉ ghi phần của chính mình; người nhận phải đang trong live, chưa tắt nhận; cùng một người nhận cách nhau ít nhất 10 phút; tối đa 30 người nhận / tuần.
     Người nhận: lời cổ vũ không phát âm thanh; đang trong khối tập trung thì để dành (chỉ hiện số nhỏ dưới đồng hồ), tới giờ nghỉ / dừng đồng hồ mới hiện. */
  const CV = ['💪', '✨', '🌙', '🔥', '🍵', '👏'], CV_GAP = 10 * 60e3, CV_MAX = 30, CV_AGE = 60 * 60e3;
  const isLive = id => { const e = live[id]; return !!(e && typeof e.s === 'number' && Date.now() - e.b < STALE); };
  const focusing = () => !!(pomo.running && pomo.mode === 'focus');
  const cvOff = () => !!(state.user && store.get('grp_cvoff_' + state.user.uid, 0));
  const cvTo = (s, to) => { const x = cvs[s], e = x && x.h && typeof x.h === 'object' ? x.h[to] : null; return e && Number.isInteger(e.e) && e.e >= 0 && e.e < CV.length ? e : null; };
  const cvMine = () => { const x = state.user && cvs[state.user.uid]; return x && x.h && typeof x.h === 'object' ? x.h : {}; };
  const cvLeft = to => { const e = cvMine()[to], at = e ? ms(e.t) : 0; return at ? Math.max(0, at + CV_GAP + 15e3 - Date.now()) : 0; };   // +15 giây cho lệch giờ máy so với máy chủ
  function cvBtn(id, n, cnt, at){
    if (qt[id]) return `<span class="grp-ch on" title="${esc(t('grp_cv_off_tip', { n }))}" aria-label="${esc(t('grp_cv_off_tip', { n }))}">🔕${cnt}</span>`;
    const left = cvLeft(id);
    if (left > 0) { const tip = t('grp_cv_wait', { n, m:Math.max(1, Math.round(left / 60000)) }); return `<button type="button" class="grp-ch on" disabled title="${esc(tip)}" aria-label="${esc(tip)}">✓${cnt}</button>`; }
    const open = pick === id + '|' + at, tip = t('grp_cv_pick', { n });
    return `<button type="button" class="grp-ch cv${open ? ' open' : ''}" data-act="grpCvPick" data-id="${esc(id)}" data-at="${at}" aria-expanded="${open}" title="${esc(tip)}" aria-label="${esc(tip)}">👏${cnt}</button>`;
  }
  function cvPick(id, n, at){
    if (pick !== id + '|' + at || id === state.user.uid || !isLive(id) || qt[id] || cvLeft(id) > 0) return '';
    return `<li class="grp-cv-pick" role="group" aria-label="${esc(t('grp_cv_pick', { n }))}">${CV.map((e, i) => `<button type="button" class="grp-cv-o" data-act="grpCvSend" data-id="${esc(id)}" data-e="${i}"><span aria-hidden="true">${e}</span> ${esc(t('grp_cv_p' + i))}</button>`).join('')}<button type="button" class="grp-cv-x" data-act="grpCvPick" data-id="${esc(id)}" data-at="${at}" aria-label="${esc(t('grp_cv_close'))}" title="${esc(t('grp_cv_close'))}">${ic('x', 'sm')}</button></li>`;
  }
  const heldKey = () => 'grp_cvheld_' + state.user.uid;
  const held = () => { const l = state.user && store.get(heldKey(), null); return Array.isArray(l) ? l : []; };
  function cvWatch(){                    // lời cổ vũ mới gửi cho mình (so với mốc đã thấy): xếp vào hàng chờ rồi hiện khi hợp lúc
    if (!state.user || !me() || loadedWk !== wk()) return;
    const id = state.user.uid, sk = 'grp_cvseen_' + id, now = Date.now(), s0 = +store.get(sk, 0) || 0, seen = s0 || now - CV_AGE; let top = seen; const got = [];
    Object.keys(cvs).forEach(s => { if (s === id) return; const e = cvTo(s, id), at = e ? ms(e.t) : 0; if (!at) return; if (at > seen && now - at < CV_AGE) got.push({ s, e:e.e, at }); if (at > top) top = at; });
    if (top !== s0) store.set(sk, top);
    if (got.length && !cvOff()) { const l = held().concat(got).filter((x, i, a) => a.findIndex(y => y.s === x.s && y.at === x.at) === i).slice(-20); store.set(heldKey(), l); }
    cvShow();
  }
  function cvShow(){                     // không làm phiền khi đang tập trung: chờ tới giờ nghỉ hoặc lúc dừng đồng hồ
    if (!state.user) return; const l = held(); if (!l.length) return;
    if (cvOff()) { store.set(heldKey(), []); return renderStrip(); }
    if (focusing() || document.visibilityState !== 'visible') return renderStrip();
    store.set(heldKey(), []);
    const g = l.sort((a, b) => a.at - b.at), z = g[g.length - 1], who = [...new Set(g.map(x => x.s))];
    toast(g.length === 1 ? t('grp_cv_one', { n:nameOfId(z.s), e:CV[z.e], p:t('grp_cv_p' + z.e) }) : t('grp_cv_many', { n:nameOfId(z.s), k:who.length - 1, e:[...new Set(g.map(x => CV[x.e]))].join('') }), 4200);
    cvFx(g.map(x => CV[x.e]));
    renderStrip();
  }
  function cvFx(list){                   // vài biểu tượng bay nhẹ lên từ giữa dưới màn hình (tắt khi khách chọn giảm chuyển động)
    if (motionOff()) return;
    for (let i = 0; i < 5; i++) {
      const e = document.createElement('span'); e.className = 'clap-p'; e.textContent = list[i % list.length]; e.setAttribute('aria-hidden', 'true');
      e.style.left = (innerWidth / 2 + (Math.random() - .5) * 120) + 'px'; e.style.top = (innerHeight - 90) + 'px';
      e.style.setProperty('--dx', ((Math.random() - .5) * 120).toFixed(0) + 'px'); e.style.setProperty('--dy', (-70 - Math.random() * 80).toFixed(0) + 'px'); e.style.setProperty('--r', ((Math.random() - .5) * 40).toFixed(0) + 'deg');
      e.style.animationDelay = (i * 90) + 'ms'; document.body.appendChild(e); setTimeout(() => e.remove(), 1700 + i * 90);
    }
  }
  function qtSync(){                     // tắt nhận cổ vũ được nhớ trong máy; tài liệu tuần mới (thứ Hai) chưa có dấu tắt thì ghi lại một lần
    if (!state.user || !me() || !on() || DEMO || loadedWk !== wk()) return; const id = state.user.uid, tag = wk() + '|' + id, w = store.get('grp_qtw', '');
    if (qt[id] && !cvOff()) { store.set('grp_cvoff_' + id, 1); store.set('grp_qtw', tag); return renderBox(); }   // thiết bị khác của bạn đã tắt
    if (!qt[id] && cvOff()) {
      if (w === tag) { store.set('grp_cvoff_' + id, 0); return renderBox(); }                                     // tuần này đã ghi dấu tắt mà giờ không còn: thiết bị khác đã bật lại
      store.set('grp_qtw', tag); ref().set({ qt:{ [id]:true } }, { merge:true }).then(() => { qt[id] = true; }).catch(() => store.set('grp_qtw', ''));
    }
  }
  const cvOpt = () => { const off = cvOff(); return `<div class="grp-cv-opt"><div><b class="small">${esc(t('grp_cv_lbl'))}</b><p class="small faint">${esc(t('grp_cv_hint'))}</p></div><button type="button" class="grp-sw${off ? '' : ' on'}" role="switch" aria-checked="${!off}" aria-label="${esc(t('grp_cv_lbl'))}" data-act="grpCvMute"><i aria-hidden="true"></i></button></div>`; };
  function boardRows(){               // bảng tuần; số phút của chính mình cộng thêm phần đang chờ ghi, nên luôn mới nhất
    const id = state.user.uid, p = me() ? pend() : 0, tms = e => e && e.t && typeof e.t.toMillis === 'function' ? e.t.toMillis() : 0, now = Date.now();
    const o = Object.entries(board).map(([k, e]) => ({ k, n:(e && e.n) || '?', mins:((e && e.mins) | 0) + (k === id ? p : 0), at:k === id && p > 0 ? now : tms(e) }));
    if (p > 0 && !board[id]) o.push({ k:id, n:me().n, mins:p, at:now });
    return o.filter(x => x.mins > 0).sort((a, b) => b.mins - a.mins || a.at - b.at || a.k.localeCompare(b.k));   // cùng số phút: ai đạt trước đứng trên (không còn đổi chỗ lung tung mỗi lần tải lại)
  }
  function boardHTML(){
    const id = state.user.uid, all = boardRows();
    const top = all.slice(0, showAll ? 1500 : TOP), mine = all.findIndex(x => x.k === id), row = (x, i) => `<li class="grp-row ${x.k === id ? 'me' : ''}"><span class="grp-rank r${i < 3 ? i + 1 : 0}">${i + 1}</span>${avatar(x.n)}<b class="grp-n">${esc(dn(x.k, x.n))}${x.k === id ? ` <span class="badge">${esc(t('grp_you'))}</span>` : ''}</b><span class="grp-t">${esc(fmt(x.mins * 60000))}</span>${cheerBtn(x.k, x.n, 'b')}${plus(x.k, x.n)}${kick(x.k)}</li>${cvPick(x.k, x.n, 'b')}`;
    const zero = liveRows().filter(r => !all.some(x => x.k === r.id));   // đang học nhưng chưa có phút trên bảng tuần này: vẫn hiện, để không ai "biến mất" khỏi bảng
    const zrow = r => `<li class="grp-row ${r.id === id ? 'me' : ''}"><span class="grp-rank r0">–</span>${avatar(r.n)}<b class="grp-n">${esc(dn(r.id, r.n))}${r.id === id ? ` <span class="badge">${esc(t('grp_you'))}</span>` : ''}</b><span class="grp-st f">${esc(t('grp_live0'))}</span>${kick(r.id)}</li>`;
    const here = new Set([...all.map(x => x.k), ...zero.map(r => r.id)]), me0 = me();
    const away = Object.entries(roster).filter(([k, e]) => e && !here.has(k) && nameOk(e.n)).map(([k, e]) => ({ k, n:e.n, w:String(e.w || '') }));
    if (me0 && !here.has(id) && !away.some(x => x.k === id)) away.push({ k:id, n:me0.n, w:'' });   // vừa vào nhóm, chưa học phút nào: vẫn có tên mình trong danh sách
    away.sort((a, b) => b.w.localeCompare(a.w) || a.n.localeCompare(b.n));
    const wnum = w => +String(w).slice(-2) || 0, rk0 = prev && prev.uid === id && prev.rk || {};
    const arow = x => `<li class="grp-row away ${x.k === id ? 'me' : ''}"><span class="grp-rank r0">–</span>${avatar(x.n)}<b class="grp-n">${esc(dn(x.k, x.n))}${x.k === id ? ` <span class="badge">${esc(t('grp_you'))}</span>` : ''}</b><span class="grp-st">${esc(x.w === wkPrev() && rk0[x.k] ? t('grp_ab_drop', { r:rk0[x.k] }) : x.w === wkPrev() ? t('grp_ab_prev') : x.w ? t('grp_ab_w', { w:wnum(x.w) }) : t('grp_ab_new'))}</span>${kick(x.k)}</li>`;
    const awayShown = showAll ? away : away.slice(0, Math.max(0, TOP - top.length - zero.length)), more = all.length > TOP || away.length > Math.max(0, TOP - Math.min(all.length, TOP) - zero.length) ? `<button type="button" class="grp-toggle ${showAll ? 'open' : ''}" data-act="grpMore" aria-expanded="${showAll}"><i class="grp-tri" aria-hidden="true"></i> ${esc(showAll ? t('grp_less', { n:TOP }) : t('grp_more', { n:all.length + zero.length + away.length }))}</button>` : '';
    const cl = climb(), sum = cl ? `<p class="grp-climb small"><b>${esc(t('grp_rank', { r:cl.r }))}</b>${trendHTML(cl)}<span class="muted">${esc(gapText(cl))}</span></p>` : '';
    const pr = (mine >= 5 ? all.slice(0, 4).concat([all[mine]]) : all.slice(0, 5)).map(x => ({ ...x, r:all.indexOf(x) + 1 })), play = !poolPlayed && pr.length > 1 && !(typeof motionOff === 'function' && motionOff());
    return `<h3 class="grp-h">${esc(t('grp_board'))}</h3>${sum}${poolSvg(pr, id, play)}` + (all.length || zero.length || away.length
      ? `<ol class="grp-list">${top.map(row).join('')}${!showAll && mine >= TOP ? `<li class="grp-gap" aria-hidden="true">…</li>${row(all[mine], mine)}` : ''}${zero.map(zrow).join('')}${awayShown.length ? `<li class="grp-gap grp-cap" role="presentation">${esc(t('grp_ab_h', { n:away.length }))}</li>${awayShown.map(arow).join('')}` : ''}</ol>${more}` : `<p class="muted small">${esc(t(known() ? 'grp_board_none' : 'loading'))}</p>`) + `<p class="small faint mt-s">${esc(t('grp_reset'))}</p>` + prevHTML();
  }
  function moonBeg(){      // Moon (con mèo động của web, dáng ngồi) hiện ra nũng nịu; dùng lại hình mèo đi dạo trong pages.js, không vẽ riêng
    try { const m = typeof MOON_WALK === 'string' && MOON_WALK.match(/<svg class="mw-svg mw-v mw-v-sit"[\s\S]*?<\/svg>/); return m ? `<span class="grp-moon-cat" aria-hidden="true">${m[0].replace(/mwH3/g, 'mwHL')}</span>` : ''; } catch (e) { return ''; }
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
      ${cvOpt()}
      <details class="grp-opts mt"><summary class="small muted">${esc(m.n)} · ${esc(t('grp_save_nick'))}</summary><div class="mt-s">${nickForm(true, m.n)}</div></details>
      <div class="mt-s grp-leave">${leaving ? `<div class="grp-moon">${moonBeg()}<div class="grp-moon-t"><b>${esc(t('grp_leave_moon'))}</b><p class="small muted">${esc(t('grp_leave_ask'))}</p><div class="row grp-moon-b"><button type="button" class="btn primary sm" data-act="grpLeaveNo">${esc(t('grp_stay'))}</button><button type="button" class="btn ghost sm" data-act="grpLeaveYes">${esc(t('grp_leave_yes'))}</button></div></div></div>` : `<button type="button" class="btn ghost sm" data-act="grpLeave">${esc(t('grp_leave'))}</button>`}</div>`;
  }
  const rankOf = () => { const id = state.user.uid, all = boardRows(), i = all.findIndex(x => x.k === id); return i < 0 ? null : { r:i + 1, mins:all[i].mins }; };
  /* Leo hạng: hạng hiện tại, tăng/giảm so với lần đầu thấy trong ngày (giờ Việt Nam), và khoảng cách tới người đứng trên (cùng điểm thì ai đạt trước đứng trên, nên cần hơn 1 phút để vượt) */
  function climb(){
    const id = state.user.uid, all = boardRows(), i = all.findIndex(x => x.k === id); if (i < 0) return null;
    const day = DT.now().setZone(TZ).toISODate(); let b = store.get('grp_rk0', null);
    if (loadedWk !== wk()) b = { day, id, r:i + 1 };   // chưa tải bảng thật của tuần này (mới có phút của riêng mình): chưa lấy làm mốc, tránh hiện "tụt hạng" ảo
    else if (!b || b.day !== day || b.id !== id) { b = { day, id, r:i + 1 }; store.set('grp_rk0', b); }
    const me0 = all[i], up = i > 0 ? all[i - 1] : null, dn = i === 0 ? all[1] : null;
    return { r:i + 1, mins:me0.mins, trend:b.r - (i + 1), upN:up && up.n, upM:up ? up.mins - me0.mins + 1 : 0, leadN:dn && dn.n, leadM:dn ? me0.mins - dn.mins : 0 };
  }
  const trendHTML = c => !c ? '' : c.trend > 0 ? `<span class="grp-trend up">${esc(t('grp_trend_up', { n:c.trend }))}</span>` : c.trend < 0 ? `<span class="grp-trend dn">${esc(t('grp_trend_dn', { n:-c.trend }))}</span>` : '';
  const gapText = c => !c ? '' : c.upN ? t('grp_climb_next', { m:fmt(c.upM * 60000), n:c.upN }) : c.leadN ? t('grp_climb_lead', { n:c.leadN, m:fmt(c.leadM * 60000) }) : t('grp_climb_alone');
  function rankWatch(){                  // lên hạng (so với lần thấy trước) thì chúc mừng một lần
    if (!state.user || !me() || !on() || loadedWk !== wk()) return; const c = rankOf(); if (!c) return;
    const w = wk(), p = store.get('grp_rk', null);
    if (p && p.wk === w && p.id === state.user.uid && c.r < p.r && document.visibilityState === 'visible') toast(t(c.r === 1 ? 'grp_top' : 'grp_moved', { r:c.r }));
    if (!p || p.wk !== w || p.id !== state.user.uid || p.r !== c.r) store.set('grp_rk', { wk:w, id:state.user.uid, r:c.r });
  }
  function renderStrip(){            // dải nhỏ ngay dưới đồng hồ: ai đang học + hạng tuần của mình
    const el = document.getElementById('grp-strip'); if (!el) return;
    if (!state.user || !on()) { el.innerHTML = ''; return; }
    if (!me()) { el.innerHTML = `<button type="button" class="grp-strip-join" data-act="grpGo">${ic('users', 'sm')} ${esc(t('grp_strip_join'))}</button>`; return; }
    const rows = liveRows(), rk = rankOf(), cl = climb();
    const hl = cvOff() ? 0 : held().length, hc = hl ? `<span class="grp-cv-held" title="${esc(t('grp_cv_held', { k:hl }))}" aria-label="${esc(t('grp_cv_held', { k:hl }))}">💌 ${hl}</span>` : '';
    el.innerHTML = `<div class="grp-strip"><div class="grp-strip-l"><span class="grp-avs">${rows.slice(0, 5).map(r => avatar(r.n)).join('')}</span><span class="small">${esc(rows.length ? t('grp_strip_n', { n:rows.length }) : known() ? t('grp_strip_0') : t('loading'))}</span>${hc}</div>
      <button type="button" class="grp-strip-r small" data-act="grpGo" title="${esc(gapText(cl))}">${rk ? `<b>${esc(t('grp_rank', { r:rk.r }))}</b> · ${esc(fmt(rk.mins * 60000))}${trendHTML(cl)}` : esc(known() ? t('grp_rank_none') : '')}</button></div>`;
  }
  function renderHome(){             // thẻ ở trang Tổng quan: ai đang học (khách chưa là Người đồng hành chỉ thấy lời mời)
    const el = document.getElementById('grp-home'); if (!el) return;
    const hd = `<div class="card-h"><h2>${ic('users', 'sm')} ${esc(t('grp_title'))}</h2><a class="link" href="#/focus" data-act="grpOpen">${esc(t('grp_home_open'))} ${ic('arrow', 'sm')}</a></div>`;
    if (!state.user || !on()) { el.innerHTML = `${hd}${pubLine()}<p class="muted small">${esc(t('grp_home_up'))}</p><div class="row mt-s"><a class="btn secondary sm" href="${state.user ? '#/donate' : '#/account'}">${ic(state.user ? 'heart' : 'user', 'sm')} ${esc(t(state.user ? 'grp_up_cta' : 'grp_up_login'))}</a><a class="btn ghost sm" href="#/focus" data-act="grpOpen">${ic('users', 'sm')} ${esc(t('grp_home_peek'))}</a></div>`; return; }
    const rows = liveRows(), id = state.user.uid, now = Date.now();
    el.innerHTML = `${hd}${errHTML()}` + (rows.length
      ? `<ul class="grp-list">${rows.slice(0, 6).map(r => `<li class="grp-row ${r.id === id ? 'me' : ''}">${avatar(r.n)}<b class="grp-n">${esc(r.n)}</b><span class="grp-st ${r.k}">${esc(t(r.k === 'b' ? 'grp_break' : 'grp_focus'))}</span><span class="grp-t" data-s="${r.s}">${esc(fmt(now - r.s))}</span></li>`).join('')}</ul>${rows.length > 6 ? `<p class="small faint mt-s">+${rows.length - 6}</p>` : ''}`
      : `<p class="muted small">${esc(t(busy || !known() ? 'loading' : 'grp_none'))}</p>`)
      + (me() ? '' : `<div class="row mt-s"><a class="btn primary sm" href="#/focus" data-act="grpOpen">${ic('timer', 'sm')} ${esc(t('grp_home_join'))}</a></div>`);
  }
  function renderBox(){ dupCount(); renderMain(); renderStrip(); renderHome(); renderHero(); pulse = false; }
  const errHTML = () => err ? `<p class="hint grp-err">${esc(t(err === 'rules' ? 'grp_err_rules' : err === 'quota' ? 'grp_err_quota' : 'grp_err'))}</p>` : '';
  function liveCols(){
    const rows = liveRows(), id = state.user.uid, now = Date.now();
    return `<h3 class="grp-h">${esc(t('grp_now'))} <span class="badge">${rows.length}</span></h3>` + (rows.length
      ? `<ul class="grp-list">${rows.map(r => `<li class="grp-row ${r.id === id ? 'me' : ''}">${avatar(r.n)}<b class="grp-n">${esc(dn(r.id, r.n))}${r.id === id ? ` <span class="badge">${esc(t('grp_you'))}</span>` : ''}</b><span class="grp-st ${r.k}">${esc(t(r.k === 'b' ? 'grp_break' : 'grp_focus'))}</span><span class="grp-t" data-s="${r.s}">${esc(fmt(now - r.s))}</span>${cheerBtn(r.id, r.n, 'l')}${kick(r.id)}</li>${cvPick(r.id, r.n, 'l')}`).join('')}</ul><p class="small faint mt-s">${esc(t('grp_live_note'))}</p>` : `<p class="muted small">${esc(t(known() ? 'grp_none' : 'loading'))}</p>`);
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
  function mount(){ if (on()) { prime(); prevLoad(); } pubLoad(); renderBox(); if (on()) load(true); startTimers(); earlyLoad(); if (store.get('grp_goto', 0) && box()) { store.set('grp_goto', 0); setTimeout(() => typeof grpScroll === 'function' && grpScroll(), 120); } }
  let early = 0;
  function earlyLoad(){                // lúc mới vào web quyền Người đồng hành đến muộn hơn trang, hoặc lần tải đầu lỗi: thử lại mỗi 2 giây (tối đa ~1 phút) thay vì đợi nhịp 60 giây
    if (early) return; early = setInterval(() => {
      if (known() && loadedAt) return clearInterval(early);
      if (++earlyN > 30) return clearInterval(early);
      if (on() && !busy && (box() || document.getElementById('grp-strip') || document.getElementById('grp-home'))) { prime(); load(true); }
    }, 2000);
  }
  let earlyN = 0;
  FORMS.grpJoin = () => {
    const n = nameOk($('grp-nick').value); if (!n) return toast(t('grp_nick_bad'));
    const id = state.user.uid, first = !me(); store.set(key(), { n }); leaving = false; renderBox(); toast(t(first ? 'grp_joined_toast' : 'grp_saved'));
    sync(true);
    if (board[id]) ref().set({ board:{ [id]: { n, mins:firebase.firestore.FieldValue.increment(0), t:TS() } } }, { merge:true }).then(() => { board[id].n = n; renderBox(); }).catch(() => {});   // đổi biệt danh trên bảng xếp hạng, giữ nguyên số phút
    load(true);
  };
  FORMS.grpAddMin = async () => {
    const id = $('grp-add-id').value, m = Math.round(+$('grp-add-m').value) || 0; if (!state.isAdmin || !id || m < 1 || m > 600) return toast('Nhập số phút từ 1 đến 600');
    try {
      const d = await ref().get(), e = ((d.exists && d.data().board) || {})[id]; if (!e) return toast('Không thấy người này trên bảng tuần này');
      const b = { n:e.n || '?', mins:firebase.firestore.FieldValue.increment(m), t:TS() };
      if (e.f && typeof e.f.toMillis === 'function') b.f = firebase.firestore.Timestamp.fromMillis(e.f.toMillis() - m * 60000);   // lùi mốc bắt đầu của họ đúng bằng số phút cộng bù, để luật chống khai khống không chặn các lần ghi sau của chính họ
      await ref().set({ board:{ [id]: b } }, { merge:true }); closeModal(); toast('Đã cộng ' + m + ' phút'); load(true);
    } catch (err) { toast(t('grp_err')); }
  };
  Object.assign(ACTIONS, {
    grpRefresh: () => load(true),
    grpCvPick: el => { const k = el.dataset.id + '|' + el.dataset.at; pick = pick === k ? '' : k; renderBox(); if (pick) { const b = document.querySelector('.grp-cv-pick .grp-cv-o'); if (b) b.focus({ preventScroll:true }); } },
    grpCvSend: async el => {
      const to = el.dataset.id, e = +el.dataset.e, id = state.user && state.user.uid, n = nameOfId(to);
      if (!id || !to || to === id || !me() || !on() || !Number.isInteger(e) || e < 0 || e >= CV.length) return;
      pick = '';
      if (qt[to]) { renderBox(); return toast(t('grp_cv_off_tip', { n })); }
      if (!isLive(to)) return renderBox();
      const left = cvLeft(to); if (left > 0) { renderBox(); return toast(t('grp_cv_wait', { n, m:Math.max(1, Math.round(left / 60000)) })); }
      const h = cvMine(); if (!(to in h) && Object.keys(h).length >= CV_MAX) { renderBox(); return toast(t('grp_cheer_max', { n:CV_MAX })); }
      const r = el.getBoundingClientRect(); if (!motionOff()) clapFx(r.left + 18, r.top + r.height / 2, 4, false);
      const prevCv = cvs[id], addList = !myCheers().includes(to) && myCheers().length < CHEER_MAX;   // vẫn tính vào số 👏 tuần (mỗi người gửi tính một lần cho mỗi người nhận)
      cvs[id] = { to, h:{ ...h, [to]:{ e, t:wrapMs(Date.now()) } } }; if (addList) cheers[id] = [...myCheers(), to]; renderBox();   // hiện ngay, lỗi thì trả lại
      const o = { cv:{ [id]:{ to, h:{ [to]:{ e, t:TS() } } } } }; if (addList) o.cheers = { [id]:firebase.firestore.FieldValue.arrayUnion(to) };
      try { await ref().set(o, { merge:true }); toast(t('grp_cv_sent', { n })); }
      catch (err) { if (prevCv) cvs[id] = prevCv; else delete cvs[id]; if (addList) cheers[id] = myCheers().filter(x => x !== to); renderBox(); toast(t('grp_cheer_err')); }
    },
    grpCvMute: async () => {
      const id = state.user && state.user.uid; if (!id || !me()) return; const off = !cvOff();
      store.set('grp_cvoff_' + id, off ? 1 : 0); store.set('grp_qtw', ''); if (off) { store.set(heldKey(), []); qt[id] = true; } else delete qt[id];
      renderBox(); toast(t(off ? 'grp_cv_off_t' : 'grp_cv_on_t'));
      const tag = wk() + '|' + id;
      if (!DEMO) ref().set({ qt:{ [id]: off ? true : DEL() } }, { merge:true }).then(() => { if (off && cvOff()) store.set('grp_qtw', tag); }).catch(() => {});   // chưa dán luật mới: người khác vẫn thấy nút, nhưng máy này vẫn không hiện lời cổ vũ
    },
    grpCheer: async el => {
      const to = el.dataset.id, id = state.user && state.user.uid; if (!id || !to || to === id || !me() || !on() || myCheers().includes(to)) return;
      if (myCheers().length >= CHEER_MAX) return toast(t('grp_cheer_max', { n:CHEER_MAX }));
      const r = el.getBoundingClientRect(); clapFx(r.left + r.width / 2, r.top + r.height / 2, 6, false);
      cheers[id] = [...myCheers(), to]; renderBox();                                       // hiện ngay, lỗi thì trả lại
      try { await ref().set({ cheers:{ [id]:firebase.firestore.FieldValue.arrayUnion(to) } }, { merge:true }); }
      catch (e) { cheers[id] = myCheers().filter(x => x !== to); renderBox(); toast(t('grp_cheer_err')); }
    },
    grpAdd: el => { if (!state.isAdmin) return; const id = el.dataset.id; openModal(`<h2>Cộng bù phút cho ${esc(el.dataset.n || '')}</h2><p class="muted small mt-s">Dùng khi khách bị mất phút học do lỗi cũ. Số phút được cộng thẳng vào bảng tuần này.</p><form class="stack mt" data-form="grpAddMin"><input type="hidden" id="grp-add-id" value="${esc(id)}"><label class="label" for="grp-add-m">Số phút (1 đến 600)</label><input class="input" id="grp-add-m" type="number" min="1" max="600" inputmode="numeric"><div class="row"><button class="btn primary" type="submit">Cộng phút</button><button class="btn ghost" type="button" data-act="closeModal">Huỷ</button></div></form>`, true); },
    grpMore: () => { showAll = !showAll; renderBox(); },
    grpGo: () => { const b = box(); if (b) b.scrollIntoView({ block:'start' }); },
    grpLeave: () => { leaving = true; renderBox(); },
    grpLeaveNo: () => { leaving = false; renderBox(); },
    grpLeaveYes: async () => {
      const id = state.user.uid; leaving = false; store.set(key(), null); store.set('grp_pend', 0); lastSent = ''; delete live[id]; delete board[id]; rosDrop(id); renderBox(); toast(t('grp_left_toast'));
      try { await ref().update({ ['live.' + id]: DEL(), ['board.' + id]: DEL(), ['cheers.' + id]: DEL(), ['cv.' + id]: DEL(), ['qt.' + id]: DEL() }); } catch (e) { /* chưa có tài liệu / offline */ }
    },
    grpKick: async el => { const id = el.dataset.id; if (!state.isAdmin || !id) return; delete live[id]; delete board[id]; rosDrop(id); renderBox(); try { await ref().update({ ['live.' + id]: DEL(), ['board.' + id]: DEL() }); } catch (e) { toast(t('grp_err')); } }
  });
  startTimers();
  window.EPGroup = { mount, sync, credit, pool:poolSvg };
})();
