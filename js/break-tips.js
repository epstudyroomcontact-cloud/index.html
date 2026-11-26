/* =========================================================
   GỢI Ý VIỆC LÀM TRONG GIỜ NGHỈ — dùng chung cho Phòng tập trung (pages.js) và overlay OBS (overlay.js).
   Mỗi lần nghỉ hiện một gợi ý ngắn (uống nước, giãn cơ, nhìn xa…), lần nghỉ sau đổi sang gợi ý khác.
   Thêm gợi ý mới: thêm một dòng vào TIPS, đủ 8 tiếng (en vi hi ja ko zh fr es).
   pick(n, lang): gợi ý thứ n (n tăng 1 mỗi lần nghỉ nên 2 lần nghỉ liền nhau không bao giờ trùng).
   ========================================================= */
(function () {
  'use strict';
  const TITLE = { en:'Break idea', vi:'Gợi ý giờ nghỉ', hi:'ब्रेक का सुझाव', ja:'休憩のヒント', ko:'쉬는 시간 팁', zh:'休息小建议', fr:'Idée de pause', es:'Idea para el descanso' };
  const TIPS = [
    { e:'💧', en:'Drink a few sips of water.', vi:'Uống vài ngụm nước nhé.', hi:'कुछ घूँट पानी पी लें।', ja:'お水を数口飲みましょう。', ko:'물을 몇 모금 마셔요.', zh:'喝几口水吧。', fr:'Buvez quelques gorgées d’eau.', es:'Bebe unos sorbos de agua.' },
    { e:'🙆', en:'Stretch your neck and shoulders for 1 minute.', vi:'Giãn cổ và vai trong 1 phút.', hi:'1 मिनट गर्दन और कंधों को स्ट्रेच करें।', ja:'1分間、首と肩をのばしましょう。', ko:'1분 동안 목과 어깨를 쭉 펴요.', zh:'花 1 分钟伸展脖子和肩膀。', fr:'Étirez la nuque et les épaules pendant 1 minute.', es:'Estira el cuello y los hombros durante 1 minuto.' },
    { e:'👀', en:'Look at something far away for 20 seconds.', vi:'Nhìn ra xa trong 20 giây cho mắt nghỉ.', hi:'20 सेकंड तक किसी दूर की चीज़ को देखें।', ja:'20秒間、遠くを眺めて目を休めましょう。', ko:'20초 동안 먼 곳을 바라봐요.', zh:'看向远处 20 秒，让眼睛休息一下。', fr:'Regardez au loin pendant 20 secondes.', es:'Mira algo lejano durante 20 segundos.' },
    { e:'🌬️', en:'Breathe in for 4 seconds, out for 6. Repeat 5 times.', vi:'Hít vào 4 giây, thở ra 6 giây. Lặp lại 5 lần.', hi:'4 सेकंड साँस लें, 6 सेकंड छोड़ें। 5 बार दोहराएँ।', ja:'4秒吸って6秒吐く。5回くり返しましょう。', ko:'4초 들이쉬고 6초 내쉬어요. 5번 반복해요.', zh:'吸气 4 秒，呼气 6 秒，重复 5 次。', fr:'Inspirez 4 secondes, expirez 6. Répétez 5 fois.', es:'Inhala 4 segundos y exhala 6. Repite 5 veces.' },
    { e:'🚶', en:'Stand up and walk around a little.', vi:'Đứng dậy đi lại vài bước.', hi:'उठें और थोड़ा टहल लें।', ja:'立ち上がって少し歩きましょう。', ko:'일어나서 잠깐 걸어요.', zh:'站起来走动一下。', fr:'Levez-vous et marchez un peu.', es:'Levántate y camina un poco.' },
    { e:'📵', en:'Put your phone down and rest your eyes from screens.', vi:'Đặt điện thoại xuống, cho mắt rời màn hình một chút.', hi:'फ़ोन रख दें और आँखों को स्क्रीन से आराम दें।', ja:'スマホを置いて、画面から目を離しましょう。', ko:'휴대폰을 내려놓고 화면에서 눈을 쉬게 해요.', zh:'放下手机，让眼睛离开屏幕。', fr:'Posez votre téléphone et reposez vos yeux des écrans.', es:'Deja el móvil y descansa la vista de las pantallas.' },
    { e:'✋', en:'Roll your wrists and stretch your fingers.', vi:'Xoay cổ tay và duỗi các ngón tay.', hi:'कलाइयाँ घुमाएँ और उंगलियाँ फैलाएँ।', ja:'手首を回して、指をのばしましょう。', ko:'손목을 돌리고 손가락을 쭉 펴요.', zh:'转转手腕，伸展手指。', fr:'Faites tourner vos poignets et étirez vos doigts.', es:'Gira las muñecas y estira los dedos.' },
    { e:'😌', en:'Close your eyes and relax for 30 seconds.', vi:'Nhắm mắt thư giãn 30 giây.', hi:'30 सेकंड आँखें बंद करके आराम करें।', ja:'30秒間、目を閉じてリラックス。', ko:'30초 동안 눈을 감고 쉬어요.', zh:'闭上眼睛放松 30 秒。', fr:'Fermez les yeux et détendez-vous 30 secondes.', es:'Cierra los ojos y relájate 30 segundos.' },
    { e:'🪟', en:'Open a window or get some daylight.', vi:'Mở cửa sổ hoặc ra chỗ có ánh sáng tự nhiên.', hi:'खिड़की खोलें या थोड़ी धूप लें।', ja:'窓を開けるか、自然の光を浴びましょう。', ko:'창문을 열거나 햇빛을 쬐어요.', zh:'开开窗，或去晒晒自然光。', fr:'Ouvrez une fenêtre ou prenez un peu de lumière du jour.', es:'Abre una ventana o toma un poco de luz natural.' },
    { e:'🧹', en:'Tidy up your desk a little.', vi:'Dọn gọn bàn học một chút.', hi:'अपनी मेज़ थोड़ी साफ़ कर लें।', ja:'机の上を少し片づけましょう。', ko:'책상을 조금 정리해요.', zh:'稍微整理一下书桌。', fr:'Rangez un peu votre bureau.', es:'Ordena un poco tu escritorio.' },
    { e:'🧘', en:'Sit up straight and roll your shoulders back.', vi:'Ngồi thẳng lưng, xoay vai ra sau vài vòng.', hi:'सीधे बैठें और कंधों को पीछे की ओर घुमाएँ।', ja:'背すじをのばして、肩を後ろに回しましょう。', ko:'허리를 펴고 어깨를 뒤로 돌려요.', zh:'坐直，把肩膀向后转几圈。', fr:'Redressez-vous et roulez les épaules vers l’arrière.', es:'Siéntate derecho y gira los hombros hacia atrás.' },
    { e:'🍎', en:'Have a light snack if you feel hungry.', vi:'Đói thì ăn nhẹ một chút.', hi:'भूख लगी हो तो हल्का नाश्ता कर लें।', ja:'お腹がすいたら軽くつまみましょう。', ko:'배고프면 가볍게 간식을 먹어요.', zh:'饿了就吃点小零食。', fr:'Prenez une petite collation si vous avez faim.', es:'Si tienes hambre, toma un tentempié ligero.' }
  ];
  const N = TIPS.length;
  const pick = (n, lang) => { const x = TIPS[((Math.floor(+n) || 0) % N + N) % N]; return { e:x.e, text:x[lang] || x.en, title:TITLE[lang] || TITLE.en }; };
  window.EP_BREAK_TIPS = { N, pick };
})();
