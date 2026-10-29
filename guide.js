'use strict';
/* =========================================================
   TOUR — hướng dẫn từng bước kiểu "chỉ vào đúng nút" (mèo Moon dẫn đường), thay cho trang hướng dẫn dài.
   - Khách mới vào lần đầu: tự chạy. Khách cũ (đã đăng nhập hoặc đã dùng web): hiện một thẻ hỏi "Bạn có muốn xem hướng dẫn không?".
   - Xem lại bất cứ lúc nào: mục "Hướng dẫn" trên menu (#/guide) → chạy lại từ đầu.
   - Chỉ tải khi cần (core.js: loadGuide). Đủ 8 ngôn ngữ ngay trong file này; thiếu thì dùng tiếng Anh. Hình mèo là ảnh chụp sẵn của mjCat (moon-art.js) nên không phải tải moon-art.js.
   - Kết quả lưu ở localStorage 'ep_tour' = 'done' hoặc 'skip'; chưa có = chưa trả lời.
   ========================================================= */
const TOUR_CAT = `<svg class="tour-cat" viewBox="-10 -27 24 29" aria-hidden="true"><defs><clipPath id="tc_1"><ellipse cx="0" cy="-16.8" rx="6.448" ry="5.827999999999999"/></clipPath></defs><g class="mj-cat" transform="translate(0 0) scale(1 1)"><g class="mja mja-breath" style="animation-delay:-0.7s;animation-duration:5.1s"><g class="mja mja-tail" style="animation-delay:-4.8s"><path d="M4.5 -1.2Q11.5 -1 11.5 -6.6Q11.5 -10.4 9 -11" stroke="#aab4d0" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="1"/><path d="M4.5 -1.2Q11.5 -1 11.5 -6.6Q11.5 -10.4 9 -11" stroke="#fdfaf3" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="1"/></g><path d="M-6.8 0C-7.8 -6 -6.4 -11 -3.2 -12.8Q0 -13.8 3.2 -12.8C6.4 -11 7.8 -6 6.8 0Q0 1 -6.8 0Z" fill="#fdfaf3" stroke="#aab4d0" stroke-width=".45"/><path d="M2.4 -12.8C5.6 -11 7.6 -6 6.8 0Q5 .5 3.2 .6C4.6 -4.6 4.4 -9 2.4 -12.8Z" fill="#c9d1e6" opacity=".75"/><ellipse cx="-2.3" cy="-.9" rx="2.1" ry="1.3" fill="#fdfaf3" stroke="#aab4d0" stroke-width=".45"/><ellipse cx="2.3" cy="-.9" rx="2.1" ry="1.3" fill="#fdfaf3" stroke="#aab4d0" stroke-width=".45"/><path d="M0 -11.6v2.4" stroke="#c9d1e6" stroke-width="0.6" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.7"/><g class="mja mja-tilt" style="animation-delay:-7.7s;animation-duration:10.2s;transform-box:view-box;transform-origin:0px -11.6px"><path d="M-5.7 -18L-5.3 -25.2L-1.2 -21.6Z" fill="#f2a15c"/><g class="mja mja-ear" style="animation-delay:-5.5s;animation-duration:7.3s"><path d="M5.7 -18L5.3 -25.2L1.2 -21.6Z" fill="#f2a15c"/></g><path d="M-3.844 -20.21L-4.712000000000001 -23.744L-2.108 -21.388Z" fill="#f4a9b6"/><path d="M3.844 -20.21L4.712000000000001 -23.744L2.108 -21.388Z" fill="#f4a9b6"/>    <ellipse cx="0" cy="-16.8" rx="6.448" ry="5.827999999999999" fill="#fdfaf3"/><g clip-path="url(#tc_1)"><path d="M-8.1 -15.6L-8.1 -25.5L8.1 -25.5L8.1 -18.7Q5.3 -19.7 3.1 -19Q1.5 -18.8 0.7 -20.3Q0 -22 -0.7 -20.4Q-1.4 -18.7 -3 -18.4Q-4.6 -18 -4.8 -16.1Q-5.3 -14.7 -8.1 -15.6Z" fill="#f2a15c"/><path d="M-3.1 -22.1q0.5 1 0.1 1.9M2.9 -22.3q-0.5 1 -0.1 1.9M-5 -19.9q0.9 0.4 1.4 1.2" stroke="#d9823f" stroke-width="0.5579999999999999" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.55"/></g><ellipse cx="0" cy="-16.8" rx="6.448" ry="5.827999999999999" fill="none" stroke="#aab4d0" stroke-width=".45"/>    <g class="mja mja-blink"><ellipse cx="-2.4800000000000004" cy="-16.428" rx="0.9299999999999999" ry="1.1780000000000002" fill="#29203a"/><ellipse cx="2.4800000000000004" cy="-16.428" rx="0.9299999999999999" ry="1.1780000000000002" fill="#29203a"/><circle cx="-2.17" cy="-16.924" r="0.372" fill="#fff"/><circle cx="2.79" cy="-16.924" r="0.372" fill="#fff"/></g>    <ellipse cx="-3.844" cy="-14.444" rx="1.1159999999999999" ry="0.682" fill="#f4a9b6" opacity=".75"/><ellipse cx="3.844" cy="-14.444" rx="1.1159999999999999" ry="0.682" fill="#f4a9b6" opacity=".75"/>    <path d="M-0.6200000000000001 -15.126000000000001h1.2400000000000002l-0.6200000000000001 0.682z" fill="#ee8fa1"/><path d="M-1.1159999999999999 -14.010000000000002q0.5579999999999999 0.49600000000000005 1.1159999999999999 0q0.5579999999999999 0.49600000000000005 1.1159999999999999 0" stroke="#9b7b80" stroke-width="0.372" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="1"/></g></g></g></svg>`;

const TOUR_T = {
  en: { w:"Hi, I'm Moon! Let me show you around. It takes less than a minute.", a:"Your account lives here. Signing in is free and keeps your tasks and progress on every device.", v:"Tap here to join the live study stream. The Live schedule right above shows when we start, in your own time zone.", f:"Your own Pomodoro timer and to-do list. Study alongside the stream any time.", c:"Check in here each day you study. Every day is one step on the road to find me.", o:"Choose your language, theme and time zone here.", b:"Tap the bell to get a little chime when we go live.", p:"Companions get My planner: a private weekly planner with an automatic weekly review of how your focus adds up.", g:"Companions get a live study group here: see who is studying right now and climb the weekly leaderboard.", u:"Companions have no daily limit here (free accounts get {m} minutes a day).", s:"Ready for the extras? Become a Companion here. You also get a small badge and early access to new planners. Have a trial code? Enter it here to try it free.", e:"That's all! You can play this tour again any time from “Guide” in the menu.", next:"Next", back:"Back", skip:"Skip", done:"Got it", ask:"Welcome back! Would you like a quick tour of how things work?", yes:"Show me", no:"I know it" },
  vi: { w:"Chào bạn, mình là Moon! Để mình dẫn bạn đi một vòng, chưa tới một phút thôi.", a:"Tài khoản của bạn ở đây. Đăng nhập miễn phí, và việc cần làm cùng tiến độ của bạn được lưu trên mọi thiết bị.", v:"Bấm vào đây để vào buổi học live. Mục Lịch live ngay phía trên cho biết khi nào bắt đầu, theo múi giờ của bạn.", f:"Đồng hồ Pomodoro và danh sách việc cần làm của riêng bạn. Học song song với buổi live bất cứ lúc nào.", c:"Điểm danh ở đây mỗi ngày bạn học. Mỗi ngày là một bước trên con đường đi tìm mình.", o:"Chọn ngôn ngữ, giao diện và múi giờ ở đây.", b:"Bấm chuông để nghe tiếng chuông nhỏ khi bắt đầu live.", p:"Người đồng hành có Planner của tôi: sổ kế hoạch tuần riêng tư, có tổng kết tuần tự động cho thấy giờ tập trung của bạn cộng dồn ra sao.", g:"Người đồng hành có nhóm học trực tiếp ở đây: xem ai đang học ngay lúc này và leo bảng xếp hạng tuần.", u:"Người đồng hành không bị giới hạn mỗi ngày ở đây (tài khoản miễn phí được {m} phút mỗi ngày).", s:"Muốn có thêm tiện ích? Trở thành Người đồng hành ở đây. Bạn còn có huy hiệu nhỏ và được dùng sớm các planner mới. Có mã dùng thử? Nhập ở đây để dùng thử miễn phí.", e:"Xong rồi! Bạn có thể xem lại hướng dẫn này bất cứ lúc nào ở mục “Hướng dẫn” trên menu.", next:"Tiếp", back:"Quay lại", skip:"Bỏ qua", done:"Đã hiểu", ask:"Chào mừng bạn quay lại! Bạn có muốn xem nhanh cách web hoạt động không?", yes:"Xem hướng dẫn", no:"Tôi hiểu rồi" },
  hi: { w:"नमस्ते, मैं मून हूँ! चलिए, मैं आपको घुमाकर दिखाती हूँ। एक मिनट से भी कम लगेगा।", a:"आपका खाता यहाँ है। साइन इन मुफ़्त है और आपके कार्य और प्रगति हर डिवाइस पर सहेजे रहते हैं।", v:"लाइव स्टडी स्ट्रीम से जुड़ने के लिए यहाँ दबाएँ। ठीक ऊपर का लाइव शेड्यूल बताता है कि हम कब शुरू करते हैं, आपके समय क्षेत्र में।", f:"आपका अपना पोमोडोरो टाइमर और टू-डू सूची। जब चाहें स्ट्रीम के साथ पढ़ें।", c:"जिस दिन पढ़ें, यहाँ चेक-इन करें। हर दिन मुझे खोजने वाले रास्ते पर एक कदम है।", o:"यहाँ अपनी भाषा, थीम और समय क्षेत्र चुनें।", b:"घंटी दबाएँ, लाइव शुरू होने पर छोटी सी घंटी की आवाज़ आएगी।", p:"साथियों को मेरा प्लानर मिलता है: अपने आप बनी साप्ताहिक समीक्षा वाला निजी साप्ताहिक प्लानर, जो दिखाता है कि आपका फ़ोकस कैसे जुड़ता है।", g:"साथियों को यहाँ लाइव स्टडी ग्रुप मिलता है: देखें अभी कौन पढ़ रहा है और साप्ताहिक लीडरबोर्ड पर ऊपर चढ़ें।", u:"साथियों के लिए यहाँ कोई दैनिक सीमा नहीं है (मुफ़्त खातों को प्रतिदिन {m} मिनट मिलते हैं)।", s:"अतिरिक्त सुविधाएँ चाहिए? यहाँ साथी बनें। साथ में एक छोटा बैज और नए प्लानरों तक जल्दी पहुँच भी मिलती है। ट्रायल कोड है? मुफ़्त आज़माने के लिए यहीं डालें।", e:"बस इतना ही! यह परिचय आप कभी भी मेनू के “गाइड” से दोबारा देख सकते हैं।", next:"आगे", back:"पीछे", skip:"छोड़ें", done:"समझ गया", ask:"वापसी पर स्वागत है! क्या आप सब कुछ कैसे चलता है, इसका छोटा परिचय देखना चाहेंगे?", yes:"दिखाइए", no:"मुझे पता है" },
  ja: { w:"こんにちは、Moonだよ！ 1分もかからないから、案内させてね。", a:"ここがあなたのアカウント。ログインは無料で、タスクや進み具合がどの端末でも引き継がれるよ。", v:"ここをタップすると、ライブの勉強配信に参加できるよ。すぐ上のライブスケジュールで、あなたのタイムゾーンの開始時間がわかるよ。", f:"自分だけのポモドーロタイマーとToDoリスト。いつでも配信といっしょに勉強できるよ。", c:"勉強した日はここでチェックイン。1日が、私を探す道の一歩になるよ。", o:"ここで言語、テーマ、タイムゾーンを選べるよ。", b:"ベルをタップすると、ライブが始まるときに小さなチャイムでお知らせするよ。", p:"仲間はマイプランナーが使えるよ。集中時間がどう積み上がるかを自動の週間レビューで見られる、自分だけの週間プランナー。", g:"仲間はここでライブ勉強グループが使えるよ：いま誰が勉強中か見られて、週間ランキングを登れる。", u:"仲間はここで1日の制限がないよ（無料アカウントは1日{m}分まで）。", s:"もっと使いたい？ ここから仲間になれるよ。小さなバッジと、新しいプランナーの先行利用もついてくるよ。トライアルコードがあるなら、ここで入力して無料で試してね。", e:"以上だよ！ このツアーは、メニューの「ガイド」からいつでももう一度見られるよ。", next:"次へ", back:"戻る", skip:"スキップ", done:"わかった", ask:"おかえりなさい！ 使い方をさっと案内しましょうか？", yes:"見てみる", no:"わかってる" },
  ko: { w:"안녕, 나는 Moon이야! 1분도 안 걸리니까 둘러보는 걸 도와줄게.", a:"여기가 내 계정이야. 로그인은 무료고, 할 일과 진행 상황이 모든 기기에 저장돼.", v:"여기를 눌러 라이브 스터디 방송에 참여해. 바로 위의 라이브 일정에서 내 시간대로 시작 시간을 볼 수 있어.", f:"나만의 뽀모도로 타이머와 할 일 목록이야. 언제든 방송과 함께 공부할 수 있어.", c:"공부한 날마다 여기서 체크인해. 하루하루가 나를 찾는 길의 한 걸음이야.", o:"여기서 언어, 테마, 시간대를 고를 수 있어.", b:"종을 누르면 라이브가 시작될 때 작은 알림음으로 알려 줄게.", p:"동반자는 내 플래너를 쓸 수 있어요: 집중 시간이 어떻게 쌓이는지 자동 주간 리뷰로 보여 주는 나만의 주간 플래너예요.", g:"동반자는 여기서 라이브 스터디 그룹을 쓸 수 있어요: 지금 누가 공부 중인지 보고 주간 순위를 올려 보세요.", u:"동반자는 여기서 일일 한도가 없어요 (무료 계정은 하루 {m}분).", s:"추가 기능이 필요하세요? 여기서 동반자가 되어 보세요. 작은 배지와 새 플래너 먼저 써 보기도 함께 드려요. 체험 코드가 있나요? 여기에 입력해서 무료로 써 보세요.", e:"이게 전부야! 이 안내는 메뉴의 “안내”에서 언제든 다시 볼 수 있어.", next:"다음", back:"이전", skip:"건너뛰기", done:"알겠어요", ask:"다시 오신 걸 환영해요! 어떻게 쓰는지 빠르게 안내해 드릴까요?", yes:"보여 주세요", no:"알고 있어요" },
  zh: { w:"嗨，我是 Moon！让我带你逛一圈，不到一分钟。", a:"你的账户在这里。登录是免费的，任务和进度会在所有设备上保存。", v:"点这里加入直播学习。正上方的直播日程会按你的时区显示开始时间。", f:"你自己的番茄钟和待办清单。随时可以陪着直播一起学。", c:"学习的日子来这里打卡。每一天都是寻找我的路上的一步。", o:"在这里选择语言、主题和时区。", b:"点铃铛，开播时会用小小的提示音提醒你。", p:"同伴可以使用我的计划本：私人的每周计划本，并有自动每周回顾，看你的专注时间是怎么累积的。", g:"同伴在这里可以使用实时学习小组：看看现在谁在学习，并爬上每周排行榜。", u:"同伴在这里没有每日限制（免费账户每天 {m} 分钟）。", s:"想要更多功能？在这里成为同伴。还有一枚小徽章，并能抢先用到新的计划本。有试用码吗？在这里输入，免费试用。", e:"就这些！你随时可以在菜单的“使用指南”里重新观看这个导览。", next:"下一步", back:"上一步", skip:"跳过", done:"明白了", ask:"欢迎回来！想快速了解一下这里是怎么用的吗？", yes:"带我看看", no:"我知道了" },
  fr: { w:"Salut, je suis Moon ! Je te fais faire le tour, ça prend moins d'une minute.", a:"Ton compte est ici. La connexion est gratuite et garde tes tâches et ta progression sur tous tes appareils.", v:"Touche ici pour rejoindre le live d'étude. Le programme des lives, juste au-dessus, indique quand on commence, dans ton fuseau horaire.", f:"Ton propre minuteur Pomodoro et ta liste de tâches. Étudie à côté du live quand tu veux.", c:"Fais ton check-in ici chaque jour où tu étudies. Chaque jour est un pas sur la route pour me retrouver.", o:"Choisis ici ta langue, ton thème et ton fuseau horaire.", b:"Touche la cloche pour entendre un petit carillon quand le live commence.", p:"Les Compagnons ont Mon planner : un planning hebdomadaire privé, avec un bilan de la semaine automatique qui montre comment ta concentration s'additionne.", g:"Les Compagnons ont ici un groupe d'étude en direct : vois qui étudie en ce moment et grimpe dans le classement de la semaine.", u:"Les Compagnons n'ont ici aucune limite quotidienne (les comptes gratuits ont {m} minutes par jour).", s:"Envie des extras ? Deviens Compagnon ici. Tu reçois aussi un petit badge et un accès anticipé aux nouveaux planners. Un code d'essai ? Saisis-le ici pour essayer gratuitement.", e:"C'est tout ! Tu peux revoir ce tour à tout moment depuis « Guide » dans le menu.", next:"Suivant", back:"Retour", skip:"Passer", done:"Compris", ask:"Content de te revoir ! Veux-tu un petit tour pour voir comment tout fonctionne ?", yes:"Montre-moi", no:"Je connais" },
  es: { w:"¡Hola, soy Moon! Te enseño todo, lleva menos de un minuto.", a:"Tu cuenta está aquí. Iniciar sesión es gratis y guarda tus tareas y tu progreso en todos tus dispositivos.", v:"Toca aquí para unirte al directo de estudio. El horario de directos, justo encima, te dice cuándo empezamos, en tu zona horaria.", f:"Tu propio temporizador Pomodoro y tu lista de tareas. Estudia junto al directo cuando quieras.", c:"Haz check-in aquí cada día que estudies. Cada día es un paso en el camino para encontrarme.", o:"Elige aquí tu idioma, tema y zona horaria.", b:"Toca la campana para oír un pequeño sonido cuando empiece el directo.", p:"Los acompañantes tienen Mi planificador: un planificador semanal privado, con un resumen semanal automático que muestra cómo se suma tu concentración.", g:"Los acompañantes tienen aquí un grupo de estudio en directo: mira quién estudia ahora mismo y sube en la clasificación semanal.", u:"Los acompañantes no tienen aquí límite diario (las cuentas gratuitas tienen {m} minutos al día).", s:"¿Quieres los extras? Hazte Acompañante aquí. También recibes una pequeña insignia y acceso anticipado a nuevos planificadores. ¿Tienes un código de prueba? Introdúcelo aquí para probar gratis.", e:"¡Eso es todo! Puedes ver este recorrido otra vez cuando quieras desde «Guía» en el menú.", next:"Siguiente", back:"Atrás", skip:"Saltar", done:"Entendido", ask:"¡Qué bueno verte de nuevo! ¿Quieres un recorrido rápido de cómo funciona todo?", yes:"Enséñame", no:"Ya lo sé" }
};

const EPTour = (() => {
  const STEPS = [
    { k:'w' },
    { k:'a', sel:'.sb-foot a', nav:true },
    { k:'v', sel:'#sidebar a[href="#/watch"]', nav:true },
    { k:'f', sel:'#sidebar a[href="#/focus"]', nav:true },
    { k:'c', sel:'#sidebar a[href="#/club"]', nav:true },
    { k:'o', sel:'#btn-prefs' },
    { k:'b', sel:'#btn-notif' },
    { k:'p', sel:'#sidebar a[href="#/planner"]', nav:true },
    { k:'g', sel:'#sidebar a[href="#/focus"]', nav:true, text:() => { const a = [branding.groupOn === true && 'g', Math.round(+branding.focusLimit) > 0 && 'u'].filter(Boolean); return a.map(tx).join(' '); } },   // quyền lợi ở Phòng tập trung: nhóm học (nếu bật) và không giới hạn (nếu có giới hạn)
    { k:'s', sel:'#sidebar a[href="#/donate"]', nav:true },
    { k:'e' }
  ];
  const L = () => TOUR_T[state.lang] || TOUR_T.en, tx = k => String(L()[k] != null ? L()[k] : TOUR_T.en[k]).replace('{m}', Math.round(+branding.focusLimit) || 0);
  const stepText = s => s.text ? s.text() : tx(s.k);
  const mobile = () => window.innerWidth <= 960;
  let cur = null;   // { steps, i }
  const el = id => document.getElementById(id);
  function close(mark){
    ['tour-card', 'tour-ring', 'tour-shade', 'tour-ask'].forEach(id => { const n = el(id); if (n) n.remove(); });
    window.removeEventListener('resize', place); window.removeEventListener('keydown', onKey, true);
    document.body.classList.remove('nav-open'); cur = null;
    if (mark) { store.set('tour', mark); store.set('bell_hint', 1); }
  }
  const target = s => s && s.sel ? document.querySelector(s.sel) : null;
  function place(){
    if (!cur) return;
    const s = cur.steps[cur.i], t = target(s), card = el('tour-card'), ring = el('tour-ring'), shade = el('tour-shade'); if (!card) return;
    const W = innerWidth, H = innerHeight, cw = Math.min(310, W - 24);
    if (!t) { ring.style.opacity = 0; shade.classList.remove('t-hole'); card.style.cssText = `left:${Math.round((W - cw) / 2)}px;top:${Math.round(Math.max(64, (H - card.offsetHeight) / 2))}px;width:${cw}px`; return; }
    const r = t.getBoundingClientRect(), pad = 6;
    ring.style.opacity = 1; shade.classList.add('t-hole');
    ring.style.cssText = `opacity:1;left:${Math.round(r.left - pad)}px;top:${Math.round(r.top - pad)}px;width:${Math.round(r.width + pad * 2)}px;height:${Math.round(r.height + pad * 2)}px`;
    const ch = card.offsetHeight; let left, top;
    if (mobile() && r.left < 320 && s.nav) { left = 12; top = r.bottom + 16 > H - ch - 14 ? 60 : H - ch - 14; }   // thanh bên mở: thẻ ở dưới cùng màn hình, hoặc lên trên nếu mục cần chỉ nằm thấp
    else if (s.nav) { left = r.right + 20; top = r.top + r.height / 2 - ch / 2; }                                      // mục ở thanh bên: thẻ bên phải
    else { left = r.right - cw; top = r.bottom + 22; }                                                                          // nút ở thanh trên: thẻ bên dưới, canh phải
    left = Math.max(12, Math.min(left, W - cw - 12)); top = Math.max(60, Math.min(top, H - ch - 14));
    card.style.cssText = `left:${Math.round(left)}px;top:${Math.round(top)}px;width:${cw}px`;
  }
  function show(){
    const s = cur.steps[cur.i], n = cur.steps.length, last = cur.i === n - 1, first = cur.i === 0;
    if (mobile()) document.body.classList.toggle('nav-open', !!s.nav); else document.body.classList.remove('nav-open');
    if (s.k === 'b' || s.k === 'o') { $('prefs').classList.remove('open'); $('live-rem').classList.remove('open'); }
    el('tour-card').innerHTML = `${TOUR_CAT}<p class="tour-tx">${esc(stepText(s))}</p>
      <div class="tour-foot"><span class="tour-dots" aria-hidden="true">${cur.steps.map((_, j) => `<i class="${j === cur.i ? 'on' : ''}"></i>`).join('')}</span>
      <span class="row" style="gap:6px">${first ? `<button type="button" class="btn ghost sm" data-tour="skip">${esc(tx('skip'))}</button>` : `<button type="button" class="btn ghost sm" data-tour="back">${esc(tx('back'))}</button>`}<button type="button" class="btn primary sm" data-tour="next" id="tour-next">${esc(last ? tx('done') : tx('next'))}</button></span></div>`;
    place(); setTimeout(place, 140); setTimeout(place, 420);   // thanh bên trượt ra trên điện thoại: đo lại sau khi xong
    const nb = el('tour-next'); if (nb) nb.focus({ preventScroll:true });
  }
  function go(d){
    if (!cur) return;
    const i = cur.i + d;
    if (i < 0) return;
    if (i >= cur.steps.length) return close('done');
    cur.i = i;
    if (!stepText(cur.steps[i])) return go(d || 1);   // bước không còn nội dung (cài đặt đổi giữa chừng): bỏ qua
    show();
  }
  function onKey(e){ if (!cur) return; if (e.key === 'Escape') { e.stopPropagation(); close('skip'); } else if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1); }
  function start(){
    close();
    if (route.name === 'admin') return;
    $('prefs').classList.remove('open'); $('live-rem').classList.remove('open'); closeModal();
    const sh = document.createElement('div'); sh.id = 'tour-shade'; const ring = document.createElement('div'); ring.id = 'tour-ring'; ring.style.opacity = 0;
    const card = document.createElement('div'); card.id = 'tour-card'; card.setAttribute('role', 'dialog'); card.setAttribute('aria-live', 'polite');
    document.body.append(sh, ring, card);
    // thanh bên phải mở ra (điện thoại) thì mới đo được các mục trong đó
    if (mobile()) document.body.classList.add('nav-open');
    cur = { i:0, steps:[] };
    setTimeout(() => {
      cur.steps = STEPS.filter(s => (!s.sel || (target(s) && target(s).getClientRects().length)) && (!s.text || s.text())); // bỏ bước nếu admin đã ẩn mục đó khỏi menu
      show();
    }, mobile() ? 320 : 0);
    sh.addEventListener('click', e => e.stopPropagation());
    card.addEventListener('click', e => { const b = e.target.closest('[data-tour]'); if (!b) return; const a = b.dataset.tour; if (a === 'next') go(1); else if (a === 'back') go(-1); else close('skip'); });
    window.addEventListener('resize', place); window.addEventListener('keydown', onKey, true);
  }
  // khách cũ: đã đăng nhập, hoặc đã có việc / giờ tập trung lưu trên máy này
  const returning = () => {
    if (state.user) return true;
    const f = store.get('focus', null), td = store.get('todos', null);
    return !!((f && typeof f === 'object' && Object.keys(f).length) || (Array.isArray(td) && td.length) || store.get('bell_hint', 0) || store.get('unlock', null));
  };
  function ask(){
    if (el('tour-ask')) return;
    const d = document.createElement('div'); d.id = 'tour-ask'; d.setAttribute('role', 'dialog');
    d.innerHTML = `${TOUR_CAT}<p class="tour-tx">${esc(tx('ask'))}</p><div class="tour-foot"><span></span><span class="row" style="gap:6px"><button type="button" class="btn ghost sm" data-ask="no">${esc(tx('no'))}</button><button type="button" class="btn primary sm" data-ask="yes">${esc(tx('yes'))}</button></span></div>`;
    d.addEventListener('click', e => { const b = e.target.closest('[data-ask]'); if (!b) return; if (b.dataset.ask === 'yes') start(); else close('skip'); });
    document.body.appendChild(d);
  }
  let tries = 0;
  function auto(){
    if (store.get('tour', null) !== null || cur || el('tour-ask') || route.name === 'admin') return;
    if (!state.authReady && tries++ < 6) return setTimeout(auto, 1000);   // đợi biết đã đăng nhập chưa để chọn "tự chạy" hay "hỏi trước"
    returning() ? ask() : start();
  }
  return { start, auto, close };
})();
PAGES.guide = function(){ location.replace('#/'); setTimeout(() => EPTour.start(), 400); };   // mục "Hướng dẫn" trên menu: về Tổng quan rồi chạy lại từ đầu
