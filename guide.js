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
  /* Mỗi bước là một mảng: [tiêu đề, mô tả, các ý nhỏ…]. g (nhóm học) có thêm ub (ý "không giới hạn mỗi ngày" khi web đang giới hạn) và gp (lời dẫn trước bản xem thử); s (Người đồng hành) có sg (ý nhóm học, chỉ khi nhóm học đang bật). {m} = số phút miễn phí mỗi ngày. */
  en: {
    w:["Meow! Welcome","I'm Moon, the cat in charge of this study room. The sofa is mine, but you can use everything else.","The tour takes about a minute.","Use Next, or the ← → keys. Esc skips it.","Most of the site is free. I'll point out what is for Companions."],
    a:["Your account","Think of it as the collar I put on you: proof that you're one of ours. Signing in is free.","Saves your to-dos, focus time and check-ins.","Follows you to your phone, laptop and tablet.","Not signed in? The timer still works on this device."],
    v:["Watch live","Our study-with-me stream. Press play, grab a snack, and pretend we all share one very quiet library.","The Live schedule right above shows start times in your own time zone.","No need to talk or turn on a camera. Just study next to us.","Studying in silence is fully allowed. Cats do it all the time."],
    f:["Focus room","Your own Pomodoro desk: focus, break, repeat. I won't judge you. Much.","Pick your own focus and break lengths.","A to-do list sits next to the timer so you can tick things off.","Your focus minutes add up in your total for today."],
    c:["Daily check-in","Moon Journey: I'm hiding at the end of a long road, and every day you study with the stream is one step closer to me.","Join a stream (live or a recording), then press check in. Once a day is enough.","Skip a day and your streak goes back to day 1. I will pretend I didn't notice.","Every stop on the road opens a new picture."],
    o:["Settings","Your language, look and time zone. I hear there are 8 languages. I speak meow in all of them.","Pick one of 8 languages for the whole site.","Change the theme and the background effect.","Set your time zone so the live schedule shows your own time."],
    b:["Live bell","Tap the bell and when we go live I'll tap your screen. Gently. With a paw.","Turn it on and choose how many minutes before we start you get the ping.","Remind yourself of every session, or only the ones you pick.","If your browser asks about notifications, choose Allow."],
    p:["My planner (Companion)","Your private weekly planner, so forgetting things stays a cat-only hobby.","A time grid for the whole week, plus a to-do list for tasks without a time.","Automatic weekly review: tasks done, time spent, by day and by category.","Today's tasks also show up in the Focus room. Only your account can open it."],
    g:["Live study group (Companion)","Study “together” even at 3 a.m. The moment someone starts a timer, their name lights up.","See who is studying right now and for how long.","Weekly leaderboard of focus hours. It resets every Monday at 00:00 (Vietnam time).","Only the nickname you choose is shown, never your real name or email."],
    ub:"No daily limit on the timer (free accounts: {m} min a day).",
    gp:"Below is a preview with made-up names, so you can see what the group looks like:",
    u:["No daily limit (Companion)","Free accounts can focus {m} minutes a day. Companions can keep going until their brain (and the cat) gives up.","As many focus blocks as you like, every day."],
    s:["Become a Companion","Your support keeps the lights on in this study room. And my snacks stocked.","A private weekly planner with an automatic review.","A small badge and early access to new planners. Have a trial code? Enter it here to try it free."],
    sg:"The live study group and weekly leaderboard.",
    e:["That's the tour!","You now know this room better than a cat knows its own tail.","Replay it any time from “Guide” in the menu.","See you at the next live. I'll save you a spot by the sofa."],
    next:"Next", back:"Back", skip:"Skip", done:"Got it", ask:"Welcome back! I've learned some new tricks. Would you like a quick tour of how things work?", yes:"Show me", no:"I know it",
    pv:"Preview", pn:"Studying now", pw:"This week", pf:"Focus", pb:"Break", hm:"{h} h {m} min", mm:"{m} min"
  },
  vi: {
    w:["Meo! Chào mừng bạn","Mình là Moon, mèo quản lý phòng học này. Ghế sofa là của mình, còn lại bạn cứ dùng thoải mái.","Chuyến tham quan chỉ mất khoảng một phút.","Bấm Tiếp, hoặc dùng phím ← →. Nhấn Esc để bỏ qua.","Phần lớn web miễn phí. Mục nào dành cho Người đồng hành, mình sẽ nói rõ."],
    a:["Tài khoản của bạn","Coi như chiếc vòng cổ mình đeo cho bạn: chứng tỏ bạn là người nhà. Đăng nhập hoàn toàn miễn phí.","Lưu việc cần làm, giờ tập trung và điểm danh của bạn.","Mang theo sang điện thoại, laptop, máy tính bảng.","Chưa đăng nhập? Đồng hồ vẫn chạy trên máy này."],
    v:["Xem live","Buổi học cùng mình. Bấm phát, lấy đồ ăn vặt, rồi coi như chúng ta ngồi chung một thư viện rất yên tĩnh.","Mục Lịch live ngay phía trên cho biết giờ bắt đầu, theo múi giờ của bạn.","Không cần nói chuyện, không cần bật camera. Chỉ cần học bên cạnh bọn mình.","Học trong im lặng là hợp lệ. Mèo cũng vậy mà."],
    f:["Phòng tập trung","Bàn Pomodoro riêng của bạn: tập trung, nghỉ, lặp lại. Mình sẽ không phán xét đâu. Chắc vậy.","Tự chọn độ dài phiên tập trung và giờ nghỉ.","Danh sách việc cần làm nằm cạnh đồng hồ để bạn gạch dần.","Số phút tập trung cộng dồn vào tổng của hôm nay."],
    c:["Điểm danh mỗi ngày","Hành trình Moon: mình trốn ở cuối một con đường dài, mỗi ngày bạn học cùng buổi live là một bước lại gần mình hơn.","Tham gia một buổi học (live hoặc bản ghi) rồi bấm điểm danh. Mỗi ngày một lần là đủ.","Bỏ lỡ một ngày thì chuỗi về lại ngày 1. Mình sẽ giả vờ không thấy.","Mỗi chặng trên đường sẽ mở ra một bức tranh mới."],
    o:["Cài đặt","Ngôn ngữ, giao diện và múi giờ của bạn. Nghe nói web có 8 ngôn ngữ, còn mình ngôn ngữ nào cũng chỉ biết “meo”.","Chọn 1 trong 8 ngôn ngữ cho cả web.","Đổi giao diện và hiệu ứng nền.","Đặt múi giờ để lịch live hiện đúng giờ ở chỗ bạn."],
    b:["Chuông nhắc live","Bấm chuông, đến giờ lên sóng mình sẽ khẽ chạm vào màn hình bạn. Bằng chân mèo.","Bật lên và chọn nhắc trước bao nhiêu phút.","Nhắc mọi buổi, hoặc chỉ những buổi bạn chọn.","Trình duyệt hỏi quyền thông báo thì bạn chọn Cho phép nhé."],
    p:["Planner của tôi (Người đồng hành)","Sổ kế hoạch tuần riêng tư, để việc đãng trí chỉ còn là đặc quyền của loài mèo.","Lưới giờ cho cả tuần, cộng danh sách việc không cần giờ cụ thể.","Tổng kết tuần tự động: xong bao nhiêu việc, mất bao nhiêu giờ, chia theo ngày và nhóm.","Việc hôm nay hiện luôn ở Phòng tập trung. Chỉ tài khoản của bạn mở được."],
    g:["Nhóm học trực tiếp (Người đồng hành)","Học “cùng nhau” kể cả lúc 3 giờ sáng. Bạn bè vừa bấm đồng hồ là tên họ sáng lên ngay.","Xem ai đang học lúc này và đã học được bao lâu.","Bảng xếp hạng giờ tập trung mỗi tuần, làm mới lúc 00:00 thứ Hai (giờ Việt Nam).","Chỉ hiện biệt danh bạn tự đặt, không hiện tên thật hay email."],
    ub:"Đồng hồ không giới hạn mỗi ngày (tài khoản miễn phí: {m} phút/ngày).",
    gp:"Bên dưới là bản xem thử với tên giả, để bạn hình dung nhóm trông như thế nào:",
    u:["Không giới hạn mỗi ngày (Người đồng hành)","Tài khoản miễn phí tập trung tối đa {m} phút mỗi ngày. Người đồng hành thì cứ học đến khi não (và mèo) hết pin.","Tập trung bao nhiêu khối cũng được, mỗi ngày."],
    s:["Trở thành Người đồng hành","Sự ủng hộ của bạn giữ đèn phòng học luôn sáng. Và giữ cho kho đồ ăn vặt của mình không cạn.","Planner tuần riêng tư cùng tổng kết tự động.","Huy hiệu nhỏ và được dùng sớm các planner mới. Có mã dùng thử? Nhập ở đây để dùng thử miễn phí."],
    sg:"Nhóm học trực tiếp và bảng xếp hạng tuần.",
    e:["Xong rồi!","Giờ bạn hiểu căn phòng này hơn cả việc mèo hiểu cái đuôi của chính nó.","Xem lại bất cứ lúc nào ở mục “Hướng dẫn” trên menu.","Hẹn gặp bạn ở buổi live tới. Mình giữ chỗ cạnh sofa."],
    next:"Tiếp", back:"Quay lại", skip:"Bỏ qua", done:"Đã hiểu", ask:"Chào mừng bạn quay lại! Mình mới học thêm vài trò mới. Bạn có muốn xem nhanh cách web hoạt động không?", yes:"Xem hướng dẫn", no:"Tôi hiểu rồi",
    pv:"Xem thử", pn:"Đang học", pw:"Tuần này", pf:"Tập trung", pb:"Nghỉ", hm:"{h} giờ {m} phút", mm:"{m} phút"
  },
  hi: {
    w:["म्याऊँ! स्वागत है","मैं मून हूँ, इस स्टडी रूम की मालिक बिल्ली। सोफ़ा मेरा है, बाकी सब आप इस्तेमाल कर सकते हैं।","यह टूर करीब एक मिनट का है।","आगे दबाएँ या ← → कुंजियाँ इस्तेमाल करें। Esc से छोड़ दें।","साइट का ज़्यादातर हिस्सा मुफ़्त है। साथी वाले हिस्सों के बारे में रास्ते में बता दिया जाएगा।"],
    a:["आपका अकाउंट","इसे मेरा पहनाया हुआ पट्टा समझिए: यह बताता है कि आप हमारे अपने हैं। साइन इन मुफ़्त है।","आपके टू-डू, फ़ोकस समय और चेक-इन सेव रहते हैं।","फ़ोन, लैपटॉप और टैबलेट पर आपके साथ चलते हैं।","साइन इन नहीं किया? टाइमर इसी डिवाइस पर फिर भी चलेगा।"],
    v:["लाइव देखें","हमारी साथ-पढ़ाई वाली लाइव स्ट्रीम। प्ले दबाइए, कुछ खाने को ले आइए और मान लीजिए कि हम सब एक बहुत शांत लाइब्रेरी में हैं।","ठीक ऊपर का लाइव शेड्यूल आपके अपने टाइम ज़ोन में शुरू होने का समय बताता है।","बात करने या कैमरा चलाने की ज़रूरत नहीं। बस हमारे बगल में पढ़िए।","चुपचाप पढ़ना बिल्कुल ठीक है, बिल्लियाँ भी यही करती हैं।"],
    f:["फ़ोकस रूम","आपकी अपनी पोमोडोरो मेज़: फ़ोकस, ब्रेक, दोहराएँ। कोई ताना नहीं मारेगा। ज़्यादा नहीं।","फ़ोकस और ब्रेक की लंबाई खुद चुनें।","टाइमर के पास टू-डू सूची है, काम पूरे होते जाएँ तो टिक करें।","आपके फ़ोकस मिनट आज के कुल समय में जुड़ते जाते हैं।"],
    c:["रोज़ का चेक-इन","मून जर्नी: मुझे ढूँढने का रास्ता लंबा है, और स्ट्रीम के साथ पढ़ाई का हर दिन आपको मेरे एक क़दम और पास ले आता है।","किसी स्ट्रीम (लाइव या रिकॉर्डिंग) में जुड़िए, फिर चेक-इन दबाइए। दिन में एक बार काफ़ी है।","एक दिन छूटा तो स्ट्रीक वापस दिन 1 पर आ जाती है। इसे अनदेखा करने का नाटक कर लिया जाएगा।","रास्ते का हर पड़ाव एक नई तस्वीर खोलता है।"],
    o:["सेटिंग्स","आपकी भाषा, लुक और टाइम ज़ोन। सुना है 8 भाषाएँ हैं; मुझे तो सबमें बस म्याऊँ आता है।","पूरी साइट के लिए 8 में से कोई एक भाषा चुनें।","थीम और बैकग्राउंड इफ़ेक्ट बदलें।","टाइम ज़ोन सेट करें ताकि लाइव शेड्यूल आपके समय में दिखे।"],
    b:["लाइव घंटी","घंटी दबाइए, और लाइव शुरू होते ही आपकी स्क्रीन पर हल्की सी दस्तक आ जाएगी। बिल्ली के पंजे वाली।","इसे चालू करें और चुनें कि लाइव से कितने मिनट पहले याद दिलाना है।","सभी सेशन के लिए, या सिर्फ़ चुने हुए सेशन के लिए।","ब्राउज़र नोटिफ़िकेशन की अनुमति माँगे तो अनुमति दें चुनिए।"],
    p:["मेरा प्लानर (साथी)","आपका निजी साप्ताहिक प्लानर, ताकि भूलना सिर्फ़ बिल्लियों का शौक़ रहे।","पूरे हफ़्ते के लिए समय-ग्रिड, और बिना समय वाले कामों की सूची।","अपने आप बनने वाली साप्ताहिक समीक्षा: कितने काम हुए, कितना समय लगा, दिन और श्रेणी के हिसाब से।","आज के काम फ़ोकस रूम में भी दिखते हैं। इसे सिर्फ़ आपका अकाउंट खोल सकता है।"],
    g:["लाइव स्टडी ग्रुप (साथी)","रात के 3 बजे भी “साथ-साथ” पढ़िए। किसी के टाइमर शुरू करते ही उसका नाम जगमगा उठता है।","देखिए अभी कौन पढ़ रहा है और कितनी देर से।","फ़ोकस घंटों का साप्ताहिक लीडरबोर्ड, हर सोमवार 00:00 (वियतनाम समय) पर नया।","सिर्फ़ आपका चुना हुआ उपनाम दिखता है, असली नाम या ईमेल नहीं।"],
    ub:"टाइमर पर रोज़ की सीमा नहीं (मुफ़्त अकाउंट: {m} मिनट प्रतिदिन)।",
    gp:"नीचे दिखावटी नामों वाला नमूना है, ताकि आप देख सकें ग्रुप कैसा दिखता है:",
    u:["रोज़ की सीमा नहीं (साथी)","मुफ़्त अकाउंट में रोज़ {m} मिनट फ़ोकस मिलता है। साथी तब तक पढ़ सकते हैं जब तक दिमाग (और बिल्ली) थक न जाएँ।","जितने चाहें उतने फ़ोकस ब्लॉक, हर दिन।"],
    s:["साथी बनिए","आपका सहयोग इस स्टडी रूम की बत्ती जलाए रखता है, और मेरे स्नैक्स का स्टॉक भी।","निजी साप्ताहिक प्लानर और अपने आप बनने वाली समीक्षा।","एक छोटा बैज और नए प्लानर पहले इस्तेमाल करने का मौका। ट्रायल कोड है? यहीं डालकर मुफ़्त आज़माइए।"],
    sg:"लाइव स्टडी ग्रुप और साप्ताहिक लीडरबोर्ड।",
    e:["बस इतना ही!","अब आप इस कमरे को उतना जानते हैं जितना बिल्ली अपनी पूँछ को भी नहीं जानती।","मेनू के “गाइड” से इसे कभी भी दोबारा देखें।","अगली लाइव में मिलते हैं। सोफ़े के पास आपकी जगह रखी है।"],
    next:"आगे", back:"पीछे", skip:"छोड़ें", done:"समझ गया", ask:"वापसी पर स्वागत है! कुछ नई चालें सीखी हैं। क्या सब कुछ कैसे चलता है, इसका छोटा परिचय देखना चाहेंगे?", yes:"दिखाइए", no:"मुझे पता है",
    pv:"नमूना", pn:"अभी पढ़ रहे हैं", pw:"इस हफ़्ते", pf:"फ़ोकस", pb:"ब्रेक", hm:"{h} घं {m} मि", mm:"{m} मि"
  },
  ja: {
    w:["にゃー！ようこそ","私はムーン、この自習室を仕切っている猫です。ソファは私専用ですが、ほかは自由に使ってください。","ツアーは1分ほどです。","「次へ」か ← → キーで進めます。Esc でスキップ。","サイトの大半は無料です。仲間向けの機能はそのつど教えますね。"],
    a:["アカウント","私があなたにつける首輪みたいなもの。「うちの子」の証です。ログインは無料です。","やることリスト、集中時間、チェックインが保存されます。","スマホ・PC・タブレットにもついてきます。","ログインしなくても、この端末ではタイマーが使えます。"],
    v:["ライブを見る","一緒に勉強する配信です。再生してお菓子を用意すれば、みんなで静かな図書館にいる気分に。","すぐ上のライブスケジュールで、開始時刻があなたのタイムゾーンで見られます。","話さなくても、カメラをつけなくても大丈夫。隣で勉強するだけです。","無言で勉強するのも立派な参加です。猫もそうです。"],
    f:["集中ルーム","あなた専用のポモドーロデスク。集中、休憩、くり返し。ジャッジはしません。たぶん。","集中と休憩の長さを自分で決められます。","タイマーの横にやることリストがあり、終わったらチェックできます。","集中した分数は今日の合計にたまっていきます。"],
    c:["毎日のチェックイン","ムーンジャーニー：私を探す道はずっと先まで続いていて、配信で勉強した日は1歩ずつ近づきます。","配信（ライブか録画）に参加して、チェックインを押します。1日1回でOK。","1日休むと連続記録は1日目に戻ります。見なかったことにしますね。","道の途中の各ポイントで、新しい絵が開きます。"],
    o:["設定","言語、見た目、タイムゾーンを変えられます。8言語あるそうですが、私はどれでも「にゃー」です。","サイト全体の言語を8つから選べます。","テーマと背景エフェクトを変えられます。","タイムゾーンを設定すると、ライブの時間が現地時間で表示されます。"],
    b:["ライブ通知のベル","ベルを押しておけば、ライブが始まるときに画面をそっとポンとします。肉球で。","オンにして、開始の何分前に知らせるか選べます。","すべての回、または選んだ回だけ通知できます。","ブラウザが通知の許可を聞いてきたら「許可」を選んでください。"],
    p:["マイプランナー（仲間）","自分だけの週間プランナー。忘れ物をするのは猫だけで十分です。","1週間の時間グリッドと、時間の決まっていないやることリスト。","自動の週次レビュー：終わったタスク数、かかった時間、日別・カテゴリ別。","今日の予定は集中ルームにも出ます。開けるのはあなたのアカウントだけ。"],
    g:["ライブ勉強グループ（仲間）","夜中の3時でも「一緒に」勉強。誰かがタイマーを始めると、その人の名前がぱっと光ります。","今だれが勉強中で、どれくらい経ったかが見えます。","集中時間の週間ランキング。毎週月曜0:00（ベトナム時間）にリセット。","表示されるのは自分で決めたニックネームだけ。本名やメールは出ません。"],
    ub:"タイマーに1日の上限なし（無料アカウントは1日{m}分）。",
    gp:"下は架空の名前のサンプルです。グループがどんな感じか見てみてください：",
    u:["1日の上限なし（仲間）","無料アカウントは1日{m}分まで集中できます。仲間なら、頭（と猫）が疲れるまでどうぞ。","集中ブロックは1日に何回でも。"],
    s:["仲間になる","あなたの支援がこの自習室の灯りを守ります。私のおやつ棚も。","自分だけの週間プランナーと自動レビュー。","小さなバッジと、新しいプランナーの先行利用。トライアルコードをお持ちなら、ここで入力して無料で試せます。"],
    sg:"ライブ勉強グループと週間ランキング。",
    e:["以上です！","これでこの部屋のことは、猫が自分のしっぽを知っているより詳しくなりました。","メニューの「ガイド」からいつでも見直せます。","次のライブで会いましょう。ソファの隣を空けておきます。"],
    next:"次へ", back:"戻る", skip:"スキップ", done:"わかった", ask:"おかえりなさい！ 新しい芸も覚えました。使い方をさっと案内しましょうか？", yes:"見てみる", no:"わかってる",
    pv:"サンプル", pn:"勉強中", pw:"今週", pf:"集中", pb:"休憩", hm:"{h}時間{m}分", mm:"{m}分"
  },
  ko: {
    w:["야옹! 어서 와요","저는 이 공부방을 맡고 있는 고양이 Moon이에요. 소파는 제 거지만 나머지는 마음껏 쓰세요.","안내는 1분 정도 걸려요.","‘다음’을 누르거나 ← → 키를 쓰세요. Esc로 건너뛸 수 있어요.","대부분은 무료예요. 동반자 전용은 그때그때 알려 드릴게요."],
    a:["내 계정","제가 달아 주는 목줄 같은 거예요. 우리 식구라는 표시죠. 로그인은 무료예요.","할 일, 집중 시간, 출석 체크가 저장돼요.","휴대폰, 노트북, 태블릿에서도 이어져요.","로그인하지 않아도 이 기기에서는 타이머를 쓸 수 있어요."],
    v:["라이브 보기","함께 공부하는 방송이에요. 재생을 누르고 간식을 챙기면, 다 같이 아주 조용한 도서관에 있는 기분이 나요.","바로 위 라이브 일정에서 시작 시간을 내 시간대로 볼 수 있어요.","말하거나 카메라를 켤 필요 없어요. 옆에서 공부만 하면 돼요.","조용히 공부해도 완전 환영이에요. 고양이도 그래요."],
    f:["집중 방","나만의 뽀모도로 책상이에요: 집중, 휴식, 반복. 저는 평가 안 해요. 아마도요.","집중 시간과 휴식 시간을 직접 정할 수 있어요.","타이머 옆 할 일 목록에서 끝낸 일을 체크하세요.","집중한 시간은 오늘의 합계에 차곡차곡 쌓여요."],
    c:["매일 출석 체크","Moon 여정: 저는 긴 길의 끝에 숨어 있고, 방송과 함께 공부한 날마다 한 걸음씩 가까워져요.","방송(라이브나 녹화)에 참여한 뒤 출석 체크를 누르세요. 하루 한 번이면 충분해요.","하루를 거르면 연속 기록이 1일차로 돌아가요. 못 본 척해 드릴게요.","길의 지점마다 새 그림이 열려요."],
    o:["설정","언어, 모습, 시간대를 바꿀 수 있어요. 8개 국어가 있다는데, 저는 전부 야옹으로 말해요.","사이트 전체 언어를 8개 중에서 고르세요.","테마와 배경 효과를 바꿔요.","시간대를 맞추면 라이브 일정이 내 현지 시간으로 보여요."],
    b:["라이브 알림 종","종을 눌러 두면 방송이 시작될 때 화면을 살짝 톡 칠게요. 발바닥으로요.","켜고, 시작 몇 분 전에 알릴지 고르세요.","모든 방송 또는 고른 방송만 알려 줄 수 있어요.","브라우저가 알림 권한을 물으면 ‘허용’을 눌러 주세요."],
    p:["내 플래너 (동반자)","나만 보는 주간 플래너예요. 깜빡하는 건 고양이만으로 충분하니까요.","한 주의 시간표 칸과, 시간 없는 할 일 목록.","자동 주간 리뷰: 끝낸 일 수, 걸린 시간, 요일별·분류별로.","오늘 할 일은 집중 방에도 나와요. 내 계정만 열 수 있어요."],
    g:["실시간 스터디 그룹 (동반자)","새벽 3시에도 ‘같이’ 공부해요. 누가 타이머를 켜면 이름이 반짝 켜져요.","지금 누가 얼마나 공부 중인지 볼 수 있어요.","집중 시간 주간 순위. 매주 월요일 00:00(베트남 시간)에 초기화돼요.","내가 정한 닉네임만 보여요. 실명이나 이메일은 안 보여요."],
    ub:"타이머에 하루 한도가 없어요(무료 계정은 하루 {m}분).",
    gp:"아래는 가짜 이름으로 만든 미리보기예요. 그룹이 어떻게 보이는지 확인해 보세요:",
    u:["하루 한도 없음 (동반자)","무료 계정은 하루 {m}분까지 집중할 수 있어요. 동반자는 머리(와 고양이)가 지칠 때까지요.","집중 블록을 하루에 몇 번이든 할 수 있어요."],
    s:["동반자 되기","여러분의 후원이 이 공부방의 불을 켜 두고, 제 간식 창고도 채워 줘요.","나만의 주간 플래너와 자동 리뷰.","작은 배지와 새 플래너 먼저 쓰기. 체험 코드가 있나요? 여기에 입력하면 무료로 써 볼 수 있어요."],
    sg:"실시간 스터디 그룹과 주간 순위.",
    e:["이상이에요!","이제 이 방을 고양이가 자기 꼬리를 아는 것보다 잘 알게 됐어요.","메뉴의 ‘안내’에서 언제든 다시 볼 수 있어요.","다음 라이브에서 만나요. 소파 옆자리 맡아 둘게요."],
    next:"다음", back:"이전", skip:"건너뛰기", done:"알겠어요", ask:"다시 오신 걸 환영해요! 새 재주도 배웠어요. 어떻게 쓰는지 빠르게 안내해 드릴까요?", yes:"보여 주세요", no:"알고 있어요",
    pv:"미리보기", pn:"공부 중", pw:"이번 주", pf:"집중", pb:"휴식", hm:"{h}시간 {m}분", mm:"{m}분"
  },
  zh: {
    w:["喵！欢迎","我是 Moon，这间自习室的管理员猫。沙发是我的，其余的随便用。","导览大约一分钟。","点“下一步”，或用 ← → 键。按 Esc 可跳过。","网站大部分功能免费，同伴专属的部分我会特别说明。"],
    a:["你的账号","就当是我给你戴的项圈：证明你是自己人。登录完全免费。","会保存你的待办、专注时长和打卡记录。","手机、电脑、平板之间都能同步。","没登录也行，这台设备上计时器照样能用。"],
    v:["看直播","陪你一起学习的直播。点播放，备好零食，假装我们都在一间特别安静的图书馆里。","正上方的直播日程会按你的时区显示开始时间。","不用说话，也不用开摄像头，在旁边安静学习就行。","默默学习完全可以，猫咪也是这样。"],
    f:["专注室","你自己的番茄钟书桌：专注、休息、重复。我不会评判你。大概。","专注和休息的时长可以自己设定。","计时器旁边有待办清单，做完就勾掉。","专注的分钟数会累计到今天的总时长里。"],
    c:["每日打卡","Moon 之旅：我躲在一条长路的尽头，每天跟着直播学习，你就离我近一步。","加入一场直播（现场或回放），然后点打卡，每天一次就够。","漏掉一天，连续天数会回到第 1 天。我会假装没看见。","路上的每一站都会解锁一张新图片。"],
    o:["设置","语言、外观和时区都在这里。听说有 8 种语言，我用哪种都只会“喵”。","为整个网站选择 8 种语言之一。","更换主题和背景特效。","设置时区后，直播日程会显示你本地的时间。"],
    b:["直播提醒铃","点一下小铃铛，开播时我会轻轻碰一下你的屏幕，用肉垫。","打开后选择开播前多少分钟提醒你。","可以提醒全部场次，或只提醒你选的场次。","浏览器询问通知权限时，请选择“允许”。"],
    p:["我的计划本（同伴）","只属于你的每周计划本，健忘这件事交给猫就好。","整周的时间格，加上不限时间的待办清单。","自动周报：完成了多少任务、用了多少时间，按天和类别统计。","今天的任务也会出现在专注室里。只有你的账号能打开。"],
    g:["实时学习小组（同伴）","凌晨三点也能“一起”学。有人开始计时，他的名字就会亮起来。","看看现在谁在学习，已经学了多久。","每周专注时长排行榜，每周一 00:00（越南时间）重置。","只显示你自己取的昵称，不显示真名或邮箱。"],
    ub:"计时器没有每日上限（免费账号每天 {m} 分钟）。",
    gp:"下面是用虚构昵称做的预览，让你看看小组长什么样：",
    u:["没有每日上限（同伴）","免费账号每天最多专注 {m} 分钟。同伴可以一直学到脑子（和猫）累了为止。","每天想专注多少个时段都行。"],
    s:["成为同伴","你的支持让这间自习室一直亮着灯，也让我的零食柜不空。","专属的每周计划本和自动周报。","一枚小徽章，还能抢先用上新的计划本。有试用码？在这里输入，免费体验。"],
    sg:"实时学习小组和每周排行榜。",
    e:["导览结束！","现在你对这间屋子的了解，比猫对自己尾巴的了解还多。","随时可以在菜单的“使用指南”里重看。","下次直播见，沙发旁边给你留了位置。"],
    next:"下一步", back:"上一步", skip:"跳过", done:"明白了", ask:"欢迎回来！我又学会了几招。想快速了解一下这里是怎么用的吗？", yes:"带我看看", no:"我知道了",
    pv:"预览", pn:"正在学习", pw:"本周", pf:"专注", pb:"休息", hm:"{h} 小时 {m} 分", mm:"{m} 分钟"
  },
  fr: {
    w:["Miaou ! Bienvenue","Je suis Moon, le chat qui gère cette salle d'étude. Le canapé est à moi, mais tu peux utiliser tout le reste.","La visite dure environ une minute.","Utilise Suivant, ou les touches ← →. Échap pour passer.","Presque tout est gratuit. Je te dirai ce qui est réservé aux Compagnons."],
    a:["Ton compte","Vois-le comme le collier que je te passe : la preuve que tu es des nôtres. La connexion est gratuite.","Il garde tes tâches, ton temps de concentration et tes pointages.","Il te suit sur téléphone, ordinateur et tablette.","Pas connecté ? Le minuteur marche quand même sur cet appareil."],
    v:["Regarder le live","Notre stream pour étudier ensemble. Appuie sur lecture, prends un en-cas et fais comme si on partageait une bibliothèque très silencieuse.","Le planning live juste au-dessus indique les horaires dans ton fuseau.","Pas besoin de parler ni d'allumer la caméra. Étudie simplement à côté de nous.","Étudier en silence est tout à fait permis. Les chats font pareil."],
    f:["Salle de concentration","Ton bureau Pomodoro à toi : concentration, pause, on recommence. Je ne te juge pas. Presque pas.","Choisis toi-même la durée des sessions et des pauses.","Une liste de tâches à côté du minuteur, à cocher au fur et à mesure.","Tes minutes de concentration s'additionnent dans le total du jour."],
    c:["Pointage quotidien","Le Voyage de Moon : je me cache au bout d'un long chemin, et chaque jour d'étude avec le stream te rapproche de moi d'un pas.","Rejoins un stream (en direct ou en replay), puis appuie sur pointer. Une fois par jour suffit.","Si tu rates un jour, la série repart au jour 1. Je ferai semblant de ne rien voir.","Chaque étape du chemin ouvre une nouvelle image."],
    o:["Réglages","Ta langue, l'apparence et le fuseau horaire. Il paraît qu'il y a 8 langues ; moi, je miaule dans les 8.","Choisis l'une des 8 langues pour tout le site.","Change le thème et l'effet d'arrière-plan.","Règle ton fuseau pour voir le planning live à ton heure."],
    b:["Cloche du live","Appuie sur la cloche et, au début du live, je tapote ton écran. Doucement, avec la patte.","Active-la et choisis combien de minutes avant le live être prévenu.","Pour toutes les sessions, ou seulement celles que tu choisis.","Si le navigateur demande l'autorisation des notifications, choisis Autoriser."],
    p:["Mon planner (Compagnon)","Ton planning hebdomadaire privé, pour que les oublis restent l'affaire des chats.","Une grille horaire pour la semaine, plus une liste de tâches sans horaire.","Bilan hebdo automatique : tâches faites, temps passé, par jour et par catégorie.","Les tâches du jour apparaissent aussi dans la salle de concentration. Seul ton compte peut l'ouvrir."],
    g:["Groupe d'étude en direct (Compagnon)","Étudie « ensemble » même à 3 h du matin. Dès que quelqu'un lance son minuteur, son nom s'allume.","Vois qui étudie en ce moment et depuis combien de temps.","Classement hebdo des heures de concentration, remis à zéro le lundi à 00:00 (heure du Vietnam).","Seul le pseudo que tu choisis est visible, jamais ton vrai nom ni ton e-mail."],
    ub:"Pas de limite quotidienne sur le minuteur (comptes gratuits : {m} min par jour).",
    gp:"Voici un aperçu avec des pseudos inventés, pour voir à quoi ressemble le groupe :",
    u:["Sans limite quotidienne (Compagnon)","Les comptes gratuits peuvent se concentrer {m} minutes par jour. Les Compagnons continuent tant que leur cerveau (et le chat) tiennent le coup.","Autant de blocs de concentration que tu veux, chaque jour."],
    s:["Devenir Compagnon","Ton soutien garde la salle d'étude allumée, et mon placard à croquettes rempli.","Un planner hebdo privé avec bilan automatique.","Un petit badge et un accès anticipé aux nouveaux planners. Un code d'essai ? Saisis-le ici pour essayer gratuitement."],
    sg:"Le groupe d'étude en direct et le classement hebdo.",
    e:["C'est fini !","Tu connais maintenant cette salle mieux qu'un chat ne connaît sa queue.","Reviens ici quand tu veux via « Guide » dans le menu.","À bientôt pour le prochain live. Je te garde une place près du canapé."],
    next:"Suivant", back:"Retour", skip:"Passer", done:"Compris", ask:"Content de te revoir ! J'ai appris de nouveaux tours. Veux-tu un petit tour pour voir comment tout fonctionne ?", yes:"Montre-moi", no:"Je connais",
    pv:"Aperçu", pn:"En train d'étudier", pw:"Cette semaine", pf:"Focus", pb:"Pause", hm:"{h} h {m} min", mm:"{m} min"
  },
  es: {
    w:["¡Miau! Te damos la bienvenida","Soy Moon, la gata a cargo de esta sala de estudio. El sofá es mío, pero todo lo demás puedes usarlo.","El recorrido dura un minuto aproximadamente.","Usa Siguiente o las teclas ← →. Esc para saltarlo.","Casi todo es gratis. Te iré diciendo qué es solo para Acompañantes."],
    a:["Tu cuenta","Piénsalo como el collar que te pongo: demuestra que eres de los nuestros. Iniciar sesión es gratis.","Guarda tus tareas, tu tiempo de enfoque y tus registros diarios.","Te acompaña en el móvil, el portátil y la tableta.","¿Sin iniciar sesión? El temporizador funciona igual en este dispositivo."],
    v:["Ver el directo","Nuestro stream para estudiar juntos. Dale a reproducir, trae algo de picar y haz como si compartiéramos una biblioteca muy silenciosa.","El horario de directos justo encima muestra la hora de inicio en tu zona horaria.","No hace falta hablar ni encender la cámara. Solo estudia a nuestro lado.","Estudiar en silencio está totalmente permitido. Los gatos lo hacemos siempre."],
    f:["Sala de enfoque","Tu escritorio Pomodoro personal: enfoque, descanso, repetir. No te juzgo. Casi nada.","Elige tú la duración del enfoque y del descanso.","Una lista de tareas junto al temporizador para ir tachando.","Tus minutos de enfoque se suman al total del día."],
    c:["Registro diario","El Viaje de Moon: me escondo al final de un camino largo, y cada día que estudias con el stream das un paso hacia mí.","Únete a un stream (en directo o grabado) y pulsa registrar. Con una vez al día basta.","Si te saltas un día, la racha vuelve al día 1. Haré como que no he visto nada.","Cada parada del camino abre una imagen nueva."],
    o:["Ajustes","Tu idioma, el aspecto y la zona horaria. Dicen que hay 8 idiomas; yo en los 8 solo sé maullar.","Elige uno de los 8 idiomas para toda la web.","Cambia el tema y el efecto de fondo.","Pon tu zona horaria y el horario de directos saldrá a tu hora."],
    b:["Campana del directo","Pulsa la campana y, cuando empecemos, te daré un toquecito en la pantalla. Con la patita.","Actívala y elige cuántos minutos antes quieres el aviso.","Para todas las sesiones o solo las que elijas.","Si el navegador pide permiso para notificaciones, elige Permitir."],
    p:["Mi planificador (Acompañante)","Tu planificador semanal privado, para que olvidarse de cosas siga siendo cosa de gatos.","Una cuadrícula horaria para la semana y una lista de tareas sin hora.","Resumen semanal automático: tareas hechas, tiempo empleado, por día y por categoría.","Las tareas de hoy también aparecen en la sala de enfoque. Solo tu cuenta puede abrirlo."],
    g:["Grupo de estudio en vivo (Acompañante)","Estudia «juntos» incluso a las 3 de la madrugada. En cuanto alguien arranca su temporizador, su nombre se ilumina.","Mira quién está estudiando ahora y desde hace cuánto.","Ranking semanal de horas de enfoque, que se reinicia cada lunes a las 00:00 (hora de Vietnam).","Solo se ve el apodo que eliges, nunca tu nombre real ni tu correo."],
    ub:"Sin límite diario en el temporizador (cuentas gratis: {m} min al día).",
    gp:"Esto es una vista previa con apodos inventados, para que veas cómo es el grupo:",
    u:["Sin límite diario (Acompañante)","Las cuentas gratis pueden enfocarse {m} minutos al día. Los Acompañantes siguen hasta que el cerebro (y la gata) aguanten.","Todos los bloques de enfoque que quieras, cada día."],
    s:["Hazte Acompañante","Tu apoyo mantiene encendida la luz de la sala de estudio, y mi despensa de golosinas llena.","Un planificador semanal privado con resumen automático.","Una pequeña insignia y acceso anticipado a los nuevos planificadores. ¿Tienes un código de prueba? Introdúcelo aquí para probar gratis."],
    sg:"El grupo de estudio en vivo y el ranking semanal.",
    e:["¡Eso es todo!","Ahora conoces esta sala mejor que un gato su propia cola.","Vuelve a verlo cuando quieras en «Guía», en el menú.","Nos vemos en el próximo directo. Te guardo sitio junto al sofá."],
    next:"Siguiente", back:"Atrás", skip:"Saltar", done:"Entendido", ask:"¡Qué bueno verte de nuevo! He aprendido trucos nuevos. ¿Quieres un recorrido rápido de cómo funciona todo?", yes:"Enséñame", no:"Ya lo sé",
    pv:"Vista previa", pn:"Estudiando ahora", pw:"Esta semana", pf:"Enfoque", pb:"Descanso", hm:"{h} h {m} min", mm:"{m} min"
  }
};

const EPTour = (() => {
  /* ---------- Moon đổi nét mặt, cử chỉ và đạo cụ theo từng bước ----------
     TOUR_CAT là ảnh chụp sẵn của mjCat; ở đây thay mắt/miệng (hoặc vẽ thêm) và thêm tay, đạo cụ. Toạ độ cùng hệ với mjCat: tâm đầu (0,-16.8), mắt (±2.48,-16.4). */
  const INK = '#29203a', FUR = '#fdfaf3', EDGE = '#aab4d0', PINK = '#f4a9b6', RED = '#ef4b5f', GOLD = '#f6c744';
  const line = (d, w) => `<path d="${d}" stroke="${INK}" stroke-width="${w || .55}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  const arc = x => line(`M${x - 1.05} -15.9Q${x} -17.5 ${x + 1.05} -15.9`, .6);                                  // mắt cười ^
  const openEye = (x, big) => `<ellipse cx="${x}" cy="-16.4" rx="${big ? 1.3 : .93}" ry="${big ? 1.65 : 1.18}" fill="${INK}"/><circle cx="${x + .32}" cy="-16.95" r="${big ? .5 : .37}" fill="#fff"/>`;
  const heart = (x, y, s, c, cls) => `<g class="${cls || ''}"><path transform="translate(${x} ${y}) scale(${s})" d="M0 1C-2.1-.5-1.9-2.2-.7-2.2C-.2-2.2 0-1.8 0-1.5C0-1.8.2-2.2.7-2.2C1.9-2.2 2.1-.5 0 1Z" fill="${c}"/></g>`;
  const star = (x, y, s, c, cls) => `<g class="${cls || ''}"><path transform="translate(${x} ${y}) scale(${s})" d="M0-2Q.25-.25 2 0Q.25.25 0 2Q-.25.25-2 0Q-.25-.25 0-2Z" fill="${c}"/></g>`;
  const smile = (w, o) => `<path d="M${-w} -14.1Q0 ${o || -12.7} ${w} -14.1" stroke="#9b7b80" stroke-width=".4" stroke-linecap="round" fill="none"/>`;
  const grin = tongue => `<path d="M-1.5 -14.2Q0 -11.9 1.5 -14.2Z" fill="#8a3550"/>${tongue ? `<path d="M-.6 -13.1Q0 -12.4 .6 -13.1Q0 -13.5 -.6 -13.1Z" fill="${PINK}"/>` : ''}`;
  const note = (x, y, cls) => `<g class="${cls || ''}"><g transform="translate(${x} ${y})"><path d="M0 0V-3.4l2-.5v3.1" stroke="#7c6cf0" stroke-width=".55" fill="none" stroke-linecap="round"/><ellipse cx="-.5" cy=".1" rx="1" ry=".7" fill="#7c6cf0"/><ellipse cx="1.5" cy="-.7" rx="1" ry=".7" fill="#7c6cf0"/></g></g>`;
  // gương mặt: e = thay mắt gốc, m = thay miệng gốc; svg vẽ đè lên mặt (nằm trong nhóm đầu nên nghiêng theo đầu)
  const FACES = {
    hi:    { e:1, m:1, svg: arc(-2.48) + arc(2.48) + grin() },
    wink:  { e:1, m:1, svg: openEye(-2.48) + arc(2.48) + grin(true) },
    wow:   { e:1, m:1, svg: openEye(-2.48, 1) + openEye(2.48, 1) + `<ellipse cx="0" cy="-13.7" rx=".8" ry="1" fill="#8a3550"/>` + line('M-4 -19.1Q-2.5 -20 -1.2 -19.3M4 -19.1Q2.5 -20 1.2 -19.3', .45) },
    love:  { e:1, m:1, svg: heart(-2.48, -16.2, 1.25, RED) + heart(2.48, -16.2, 1.25, RED) + smile(1.2, -12.9) },
    det:   { svg: `<path d="M-6.2 -19.7Q0 -21.1 6.2 -19.7L6 -18.4Q0 -19.6 -6 -18.4Z" fill="${RED}"/><path d="M5.6 -19.4L8.2 -18.2L7.3 -20.6ZM5.6 -19.4L8 -21.2L8.6 -18.9Z" fill="${RED}"/>` },
    think: { e:1, m:1, svg: `<ellipse cx="-2.48" cy="-16.4" rx=".93" ry="1.18" fill="${INK}"/><ellipse cx="2.48" cy="-16.4" rx=".93" ry="1.18" fill="${INK}"/><circle cx="-2.1" cy="-17.1" r=".38" fill="#fff"/><circle cx="2.86" cy="-17.1" r=".38" fill="#fff"/>` + line('M-.9 -13.9H.9', .45) + `<text class="tc-float" x="8.6" y="-22.5" font-size="4.6" font-weight="800" fill="#7c6cf0" font-family="inherit">?</text>` },
    ding:  { e:1, m:1, svg: arc(-2.48) + arc(2.48) + `<ellipse cx="0" cy="-13.7" rx=".75" ry=".9" fill="#8a3550"/>` + note(-9.5, -23, 'tc-float') },
    proud: { e:1, m:1, svg: arc(-2.48) + arc(2.48) + smile(1.3, -12.7) + `<ellipse cx="-3.84" cy="-14.44" rx="1.4" ry=".85" fill="${PINK}" opacity=".9"/><ellipse cx="3.84" cy="-14.44" rx="1.4" ry=".85" fill="${PINK}" opacity=".9"/>` + star(-8.8, -23, 1.1, GOLD, 'tc-float') },
    cheer: { e:1, m:1, svg: line('M-3.7 -17.5L-1.7 -16.4L-3.7 -15.3M3.7 -17.5L1.7 -16.4L3.7 -15.3', .6) + grin(true) },
    cool:  { e:1, m:1, svg: `<rect x="-5.4" y="-18.1" width="4.6" height="3.2" rx="1.3" fill="${INK}"/><rect x=".8" y="-18.1" width="4.6" height="3.2" rx="1.3" fill="${INK}"/><path d="M-.8 -17.2H.8M-5.4 -17.5L-6.3 -18.2M5.4 -17.5L6.3 -18.2" stroke="${INK}" stroke-width=".5" stroke-linecap="round"/><path d="M-4.6 -17.5l1.2-.1M1.6 -17.5l1.2-.1" stroke="#fff" stroke-width=".4" stroke-linecap="round" opacity=".8"/>` + `<path d="M-1.3 -14Q.2 -13 1.5 -14.5" stroke="#9b7b80" stroke-width=".45" stroke-linecap="round" fill="none"/>` },
    party: { e:1, m:1, svg: arc(-2.48) + arc(2.48) + grin(true) }
  };
  const CROWN = `<path d="M-2.9 -22.1L-3 -25.4L-1.4 -23.9L0 -26.1L1.4 -23.9L3 -25.4L2.9 -22.1Z" fill="${GOLD}" stroke="#d49a1a" stroke-width=".3" stroke-linejoin="round"/><circle cx="0" cy="-23.2" r=".45" fill="${RED}"/>`;
  const HAT = `<path d="M-2.8 -22.2L.4 -29.3L3 -22.2Z" fill="#7c6cf0"/><path d="M-1.6 -25.2L2.1 -24.6M-.9 -27.2L1.4 -26.8" stroke="#fff" stroke-width=".5" stroke-linecap="round" opacity=".85"/><circle cx=".4" cy="-29.5" r=".9" fill="${GOLD}"/>`;
  // tay: nét đôi (viền + lông) như cái đuôi, bàn chân tròn ở cuối
  const arm = (d, px, py, cls, st) => `<g class="${cls || ''}" ${st ? `style="${st}"` : ''}><path d="${d}" stroke="${EDGE}" stroke-width="3.4" stroke-linecap="round" fill="none"/><path d="${d}" stroke="${FUR}" stroke-width="2.5" stroke-linecap="round" fill="none"/><circle cx="${px}" cy="${py}" r="1.55" fill="${FUR}" stroke="${EDGE}" stroke-width=".4"/></g>`;
  const ARMS = {
    wave:   arm('M5.4 -9Q10.5 -10.5 11.8 -15.6', 11.8, -16.2, 'tc-wave'),
    pointL: arm('M-5.4 -8.2Q-9.6 -9.6 -13.6 -10.2', -13.8, -10.2, 'tc-nudge'),
    pointU: arm('M5.4 -9Q10.8 -12 12 -19.6', 12, -20.2, 'tc-nudgeU'),
    cheer:  arm('M-5.4 -9Q-10.5 -11 -11 -18.5', -11, -19.2, 'tc-cheer') + arm('M5.4 -9Q10.5 -11 11 -18.5', 11, -19.2, 'tc-cheer r'),
    bell:   arm('M5.4 -9Q10.5 -11 11.4 -16.6', 11.4, -17.2, 'tc-cheer r') + `<g class="tc-swing"><path d="M9.9 -12.6Q9.9 -15.8 11.4 -15.8Q12.9 -15.8 12.9 -12.6Z" fill="${GOLD}" stroke="#d49a1a" stroke-width=".3"/><path d="M9.5 -12.6H13.3" stroke="#d49a1a" stroke-width=".5" stroke-linecap="round"/><circle cx="11.4" cy="-12" r=".5" fill="#d49a1a"/></g><path d="M14.6 -15Q15.8 -13.8 14.6 -12.6M16.2 -16.4Q18 -13.8 16.2 -11.2" stroke="#d49a1a" stroke-width=".45" stroke-linecap="round" fill="none" class="tc-float"/>`,
    hold:   arm('M5.4 -8Q9 -7.6 9.7 -5.4', 9.9, -5.1)
  };
  const PROPS = {
    live:   `<circle cx="13.6" cy="-7.2" r="3.3" fill="${RED}"/><path d="M12.6 -8.9L15.4 -7.2L12.6 -5.5Z" fill="#fff"/><circle class="tc-blink" cx="16.4" cy="-10" r=".8" fill="${RED}"/>`,
    tomato: `<circle cx="13.4" cy="-6.6" r="3.1" fill="#ef4b3f"/><path d="M13.4 -9.5Q12.2 -11 11 -10Q12.2 -9.5 13.4 -9.5ZM13.4 -9.5Q14.6 -11 15.8 -10Q14.6 -9.5 13.4 -9.5Z" fill="#4fae5a"/><path d="M11.6 -8Q12.2 -8.9 13 -9" stroke="#fff" stroke-width=".5" stroke-linecap="round" fill="none" opacity=".7"/>`,
    cal:    `<rect x="9.9" y="-11.4" width="7.2" height="7.8" rx="1.1" fill="#fff" stroke="${EDGE}" stroke-width=".4"/><path d="M9.9 -10.3Q9.9 -11.4 11 -11.4H16Q17.1 -11.4 17.1 -10.3V-9.4H9.9Z" fill="#f2a15c"/><path d="M11.8 -6.6L13 -5.3L15.4 -8" stroke="#3fae6a" stroke-width=".8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
    gear:   `<g class="tc-spin"><circle cx="14" cy="-7" r="2.9" fill="none" stroke="#8a94a6" stroke-width="1.5" stroke-dasharray=".95 .95"/><circle cx="14" cy="-7" r="1.9" fill="none" stroke="#8a94a6" stroke-width=".9"/></g>`,
    book:   `<rect x="9.8" y="-11.6" width="7.4" height="8.8" rx="1" fill="#7c6cf0"/><path d="M11.2 -9.6H15.8M11.2 -8H15.8M11.2 -6.4H14" stroke="#fff" stroke-width=".5" stroke-linecap="round" opacity=".85"/><path d="M16.4 -12.3L12.6 -4.4" stroke="${GOLD}" stroke-width=".8" stroke-linecap="round"/>`,
    hearts: heart(-12.5, -24, 1.1, RED, 'tc-float') + heart(13.5, -25, 1, PINK, 'tc-float d2') + heart(15, -17.5, .8, RED, 'tc-float d3'),
    heart:  heart(13.4, -6.4, 3, RED) + `<circle cx="16.6" cy="-10.2" r="1.7" fill="${GOLD}" stroke="#d49a1a" stroke-width=".3"/><path d="M16.6 -11.2V-9.2" stroke="#d49a1a" stroke-width=".4"/>`,
    confetti: [[-12, -26, '#ef4b5f'], [-9, -29, GOLD], [11, -27, '#4fae5a'], [14, -22, '#7c6cf0'], [-13.5, -17, PINK], [8.5, -29, '#f2a15c'], [16, -14, GOLD]].map((c, i) => `<g class="tc-float d${i % 3 + 1}"><rect x="${c[0]}" y="${c[1]}" width="1.5" height="1.5" rx=".3" fill="${c[2]}" transform="rotate(${i * 40} ${c[0]} ${c[1]})"/></g>`).join('') + star(-10.5, -21, 1, GOLD, 'tc-float')
  };
  // mỗi bước: f = nét mặt, a = tay, p = đạo cụ, crown / hat = đội gì trên đầu
  const POSES = {
    w:{ f:'hi', a:'wave' }, ask:{ f:'hi', a:'wave' },
    a:{ f:'wink', a:'pointL' }, v:{ f:'wow', a:'pointL', p:'live' }, f:{ f:'det', a:'pointL', p:'tomato' }, c:{ f:'love', a:'pointL', p:'cal' },
    o:{ f:'think', a:'pointU', p:'gear' }, b:{ f:'ding', a:'bell' },
    p:{ f:'proud', a:'pointL', p:'book', crown:1 }, g:{ f:'cheer', a:'cheer', p:'hearts', crown:1 }, u:{ f:'cool', a:'cheer', crown:1 },
    s:{ f:'love', a:'pointL', p:'heart', crown:1 }, e:{ f:'party', a:'cheer', p:'confetti', hat:1 }
  };
  const EYES_RE = /<g class="mja mja-blink">[\s\S]*?<\/g>/, MOUTH_RE = /<path d="M-1\.1159[^>]*stroke="#9b7b80"[^>]*\/>/, TAIL = '</g></g></g></svg>';
  function cat(k){
    const P = POSES[k] || POSES.w, F = FACES[P.f] || {};
    let s = TOUR_CAT.replace('viewBox="-10 -27 24 29"', 'viewBox="-16 -30 34 32"').replace('class="tour-cat"', 'class="tour-cat tc-pop"');
    if (F.e) s = s.replace(EYES_RE, () => ''); if (F.m) s = s.replace(MOUTH_RE, () => '');
    const head = (F.svg || '') + (P.crown ? CROWN : '') + (P.hat ? HAT : ''), body = (P.p ? PROPS[P.p] : '') + (P.a ? ARMS[P.a] : '');
    return s.slice(0, -TAIL.length) + head + '</g>' + body + '</g></g></svg>';
  }
  /* ---------- Bản xem thử nhóm học: tên giả, số liệu mẫu, không đọc Firestore (dùng cả trong tour lẫn ở Phòng tập trung cho khách chưa là Người đồng hành) ---------- */
  const PV_LIVE = [['Kenji', 'f', 78 * 60 + 5], ['Sofía', 'b', 63 * 60 + 44], ['Mina', 'f', 42 * 60 + 10]], PV_BOARD = [['Kenji', 760], ['Mina', 555], ['Linh', 425]];   // [tên, f|b, giây đã học] · [tên, phút trong tuần]
  const raw = k => String(L()[k] != null ? L()[k] : TOUR_T.en[k]);
  const hue = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
  const pvAv = n => `<i class="grp-av" style="--h:${hue(n)}">${esc(n.slice(0, 1).toUpperCase())}</i>`;
  const pvT = sec => { const m = Math.floor(sec / 60), h = Math.floor(m / 60); return raw(h ? 'hm' : 'mm').replace('{h}', h).replace('{m}', h ? m % 60 : m); };
  let tick = 0;
  function startTick(){   // đồng hồ mẫu chạy tiếp cho có sức sống; tự dừng khi bản xem thử không còn trên trang
    if (tick) return;
    tick = setInterval(() => {
      const ns = document.querySelectorAll('.tpv [data-pv]'); if (!ns.length) { clearInterval(tick); tick = 0; return; }
      const now = Date.now(); ns.forEach(n => { n.textContent = pvT(+n.dataset.pv + (now - +n.dataset.t0) / 1000); });
    }, 5000);
  }
  function preview(){
    startTick(); const t0 = Date.now();
    return `<p class="small muted tpv-cap">${esc(raw('gp'))}</p><div class="tpv"><span class="tpv-chip">${esc(raw('pv'))}</span>
      <div><h5 class="grp-h"><i class="grp-dot"></i> ${esc(raw('pn'))} <span class="badge">${PV_LIVE.length}</span></h5>
      <ul class="grp-list">${PV_LIVE.map(r => `<li class="grp-row">${pvAv(r[0])}<b class="grp-n">${esc(r[0])}</b><span class="grp-st ${r[1]}">${esc(raw(r[1] === 'b' ? 'pb' : 'pf'))}</span><span class="grp-t" data-pv="${r[2]}" data-t0="${t0}">${esc(pvT(r[2]))}</span></li>`).join('')}</ul></div>
      <div><h5 class="grp-h">${esc(raw('pw'))}</h5>
      <ol class="grp-list">${PV_BOARD.map((r, i) => `<li class="grp-row"><span class="grp-rank r${i + 1}">${i + 1}</span>${pvAv(r[0])}<b class="grp-n">${esc(r[0])}</b><span class="grp-t">${esc(pvT(r[1] * 60))}</span></li>`).join('')}</ol></div></div>`;
  }
  const STEPS = [
    { k:'w' },
    { k:'a', sel:'.sb-foot a', nav:true },
    { k:'v', sel:'#sidebar a[href="#/watch"]', nav:true },
    { k:'f', sel:'#sidebar a[href="#/focus"]', nav:true },
    { k:'c', sel:'#sidebar a[href="#/club"]', nav:true },
    { k:'o', sel:'#btn-prefs' },
    { k:'b', sel:'#btn-notif' },
    { k:'p', sel:'#sidebar a[href="#/planner"]', nav:true },
    { k:'g', sel:'#sidebar a[href="#/focus"]', nav:true },   // quyền lợi ở Phòng tập trung: nhóm học (nếu bật) hoặc không giới hạn mỗi ngày (nếu web đang giới hạn); không có gì thì bỏ bước
    { k:'s', sel:'#sidebar a[href="#/donate"]', nav:true },
    { k:'e' }
  ];
  const lim = () => Math.round(+branding.focusLimit) || 0;
  const L = () => TOUR_T[state.lang] || TOUR_T.en, tx = k => String(L()[k] != null ? L()[k] : TOUR_T.en[k]).replace('{m}', lim());
  const ta = k => (L()[k] || TOUR_T.en[k]).map(x => String(x).replace('{m}', lim()));
  // nội dung một bước: { pose, h:tiêu đề, d:mô tả, l:[các ý], pv:có xem thử nhóm học } hoặc null nếu bước không còn nội dung
  function content(s){
    if (s.k === 'g') {
      const grp = branding.groupOn === true, lm = lim() > 0;
      if (!grp && !lm) return null;
      const a = ta(grp ? 'g' : 'u'), l = a.slice(2); if (grp && lm) l.push(tx('ub'));
      return { pose:grp ? 'g' : 'u', h:a[0], d:a[1], l, pv:grp };
    }
    const a = ta(s.k), l = a.slice(2); if (s.k === 's' && branding.groupOn === true) l.splice(1, 0, tx('sg'));
    return { pose:s.k, h:a[0], d:a[1], l };
  }
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
    const W = innerWidth, H = innerHeight, cw = Math.min(content(s).pv ? 470 : 330, W - 24);
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
    const s = cur.steps[cur.i], c = content(s), n = cur.steps.length, last = cur.i === n - 1, first = cur.i === 0;
    if (mobile()) document.body.classList.toggle('nav-open', !!s.nav); else document.body.classList.remove('nav-open');
    if (s.k === 'b' || s.k === 'o') { $('prefs').classList.remove('open'); $('live-rem').classList.remove('open'); }
    el('tour-card').innerHTML = `${cat(c.pose)}<div class="tour-body"><h4 class="tour-h">${esc(c.h)}</h4><p class="tour-tx">${esc(c.d)}</p>${c.pv ? preview() : ''}${c.l.length ? `<ul class="tour-ul">${c.l.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div>
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
    if (!content(cur.steps[i])) return go(d || 1);   // bước không còn nội dung (cài đặt đổi giữa chừng): bỏ qua
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
      cur.steps = STEPS.filter(s => (!s.sel || (target(s) && target(s).getClientRects().length)) && content(s)); // bỏ bước nếu admin đã ẩn mục đó khỏi menu
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
    d.innerHTML = `${cat('ask')}<p class="tour-tx">${esc(tx('ask'))}</p><div class="tour-foot"><span></span><span class="row" style="gap:6px"><button type="button" class="btn ghost sm" data-ask="no">${esc(tx('no'))}</button><button type="button" class="btn primary sm" data-ask="yes">${esc(tx('yes'))}</button></span></div>`;
    d.addEventListener('click', e => { const b = e.target.closest('[data-ask]'); if (!b) return; if (b.dataset.ask === 'yes') start(); else close('skip'); });
    document.body.appendChild(d);
  }
  let tries = 0;
  function auto(){
    if (store.get('tour', null) !== null || cur || el('tour-ask') || route.name === 'admin') return;
    if (!state.authReady && tries++ < 6) return setTimeout(auto, 1000);   // đợi biết đã đăng nhập chưa để chọn "tự chạy" hay "hỏi trước"
    returning() ? ask() : start();
  }
  return { start, auto, close, preview };
})();
PAGES.guide = function(){ location.replace('#/'); setTimeout(() => EPTour.start(), 400); };   // mục "Hướng dẫn" trên menu: về Tổng quan rồi chạy lại từ đầu
