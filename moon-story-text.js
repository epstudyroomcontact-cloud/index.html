'use strict';
/* =========================================================
   CHỮ CỦA HÀNH TRÌNH TRĂNG
   mjc_<trạm>_t = tên trạm (chú thích ngắn), mjc_<trạm>_b = lời của Trân cho trạm đó (để trống: khách chỉ thấy tranh và tên trạm).
   Viết trên web: bật bút chì (chế độ sửa), mở một trạm rồi bấm vào ô chữ dưới tranh. Shift+Enter để xuống dòng.
   Chữ viết trên web được lưu ở settings/content và tự dịch sang các ngôn ngữ khác.
   mjs_* = chữ giao diện của bản đồ (có đủ 8 ngôn ngữ).
   ========================================================= */
(function () {
  const vi = {
    mjc_start_t: 'Lời mở đầu', mjc_start_b: '',
    mjc_d1_t: 'Đêm mưa ấy', mjc_d1_b: '',
    mjc_d3_t: 'Chiếc ô cong gọng', mjc_d3_b: '',
    mjc_d7_t: 'Ngọn đèn ở góc phố', mjc_d7_b: '',
    mjc_d10_t: 'Cái bóng nhỏ theo sau', mjc_d10_b: '',
    mjc_d14_t: 'Mặt nước xoáy', mjc_d14_b: '',
    mjc_d21_t: 'Ngôi sao rơi vào ô', mjc_d21_b: '',
    mjc_d30_t: 'Đêm trăng tròn', mjc_d30_b: '',
    mjc_d45_t: 'Chiếc bát trên kệ', mjc_d45_b: '',
    mjc_d60_t: 'Cánh đồng sao', mjc_d60_b: '',
    mjc_d80_t: 'Tiếng gọi cửa', mjc_d80_b: '',
    mjc_d100_t: 'Bờ bên kia', mjc_d100_b: '',
    mjc_d130_t: 'Bậu cửa sổ', mjc_d130_b: '',
    mjc_d160_t: 'Chiếc ô cho người lạ', mjc_d160_b: '',
    mjc_d200_t: 'Thiên hà nhỏ', mjc_d200_b: '',
    mjc_d250_t: 'Mùa mưa lại về', mjc_d250_b: '',
    mjc_d300_t: 'Lá thư gửi Moon', mjc_d300_b: '',
    mjc_d365_t: 'Gặp lại', mjc_d365_b: '',
    mjc_d400_t: 'Ngủ cạnh nhau', mjc_d400_b: '',
    mjc_d450_t: 'Mẩu ánh trăng', mjc_d450_b: '',
    mjc_after_t: 'Những đêm sau đó', mjc_after_b: ''
  };
  const en = {
    mjc_start_t: 'Before we begin', mjc_start_b: '',
    mjc_d1_t: 'That rainy night', mjc_d1_b: '',
    mjc_d3_t: 'The bent umbrella', mjc_d3_b: '',
    mjc_d7_t: 'The lamp on the corner', mjc_d7_b: '',
    mjc_d10_t: 'A small shadow behind me', mjc_d10_b: '',
    mjc_d14_t: 'The swirling water', mjc_d14_b: '',
    mjc_d21_t: 'A star in my umbrella', mjc_d21_b: '',
    mjc_d30_t: 'The full moon night', mjc_d30_b: '',
    mjc_d45_t: 'The bowl on the shelf', mjc_d45_b: '',
    mjc_d60_t: 'The field of stars', mjc_d60_b: '',
    mjc_d80_t: 'A knock at the door', mjc_d80_b: '',
    mjc_d100_t: 'The far shore', mjc_d100_b: '',
    mjc_d130_t: 'The windowsill', mjc_d130_b: '',
    mjc_d160_t: 'An umbrella for a stranger', mjc_d160_b: '',
    mjc_d200_t: 'A small galaxy', mjc_d200_b: '',
    mjc_d250_t: 'The rains come back', mjc_d250_b: '',
    mjc_d300_t: 'A letter to Moon', mjc_d300_b: '',
    mjc_d365_t: 'Together again', mjc_d365_b: '',
    mjc_d400_t: 'Sleeping side by side', mjc_d400_b: '',
    mjc_d450_t: 'A piece of moonlight', mjc_d450_b: '',
    mjc_after_t: 'The nights after', mjc_after_b: ''
  };
  /* chữ giao diện bản đồ */
  const UI = {
    en:{ mjs_road:'The road to Moon', mjs_road_sub:'Each check-in is one step along the road. Every stop opens a new picture.', mjs_here:'You are here', mjs_day:'Day {n}', mjs_lock:'This stop opens when your streak reaches {n} days. {k} more to go.', mjs_latest:'Latest stop', mjs_read:'Open', mjs_new:'New', mjs_rain:'Rain', mjs_kept:'Stops you have opened stay open, even if your streak starts over.', mjs_next:'Next stop: “{name}” · days left: {n}', mjs_preview:'Admin preview: you can open every stop', mjs_prev:'Previous', mjs_nextc:'Next', mjs_notes:'{n} of the nights after are open', mjs_start:'Start', mjs_lang:'' },
    vi:{ mjs_road:'Con đường tìm Moon', mjs_road_sub:'Mỗi lần điểm danh là một bước trên đường. Mỗi trạm dừng mở ra một bức tranh mới.', mjs_here:'Bạn ở đây', mjs_day:'Ngày {n}', mjs_lock:'Trạm này mở khi chuỗi của bạn đạt {n} ngày. Còn {k} ngày nữa.', mjs_latest:'Trạm mới nhất', mjs_read:'Xem', mjs_new:'Mới', mjs_rain:'Mưa', mjs_kept:'Những trạm bạn đã mở vẫn còn, kể cả khi chuỗi bắt đầu lại.', mjs_next:'Trạm kế tiếp: “{name}”, còn {n} ngày', mjs_preview:'Admin xem trước: mở được mọi trạm', mjs_prev:'Trước', mjs_nextc:'Tiếp', mjs_notes:'Đã mở {n} mẩu của những đêm sau đó', mjs_start:'Khởi hành', mjs_lang:'' },
    hi:{ mjs_road:'मून तक का रास्ता', mjs_road_sub:'हर चेक-इन रास्ते पर एक कदम है। हर पड़ाव एक नई तस्वीर खोलता है।', mjs_here:'आप यहाँ हैं', mjs_day:'दिन {n}', mjs_lock:'यह पड़ाव तब खुलेगा जब आपकी लगातार श्रृंखला {n} दिन की होगी। {k} दिन बाकी।', mjs_latest:'नया पड़ाव', mjs_read:'पढ़ें', mjs_new:'नया', mjs_rain:'बारिश', mjs_kept:'खुले अध्याय आपके पास रहते हैं, भले ही श्रृंखला फिर से शुरू हो।', mjs_next:'अगला पड़ाव: “{name}”, {n} दिन में', mjs_preview:'एडमिन पूर्वावलोकन: सभी अध्याय पढ़ सकते हैं', mjs_prev:'पिछला', mjs_nextc:'अगला', mjs_notes:'बाद की रातों के {n} हिस्से खुले हैं', mjs_start:'शुरुआत', mjs_lang:'' },
    ja:{ mjs_road:'ムーンへの道', mjs_road_sub:'チェックインするたびに道を一歩進みます。立ち寄る場所ごとに新しい絵が開きます。', mjs_here:'現在地', mjs_day:'{n}日目', mjs_lock:'連続記録が{n}日になると開きます。あと{k}日。', mjs_latest:'最新の場所', mjs_read:'読む', mjs_new:'NEW', mjs_rain:'雨', mjs_kept:'一度開いた章は、連続記録がリセットされても残ります。', mjs_next:'次の場所：「{name}」まであと{n}日', mjs_preview:'管理者プレビュー：すべての章を読めます', mjs_prev:'前へ', mjs_nextc:'次へ', mjs_notes:'その後の夜：{n}つ開いています', mjs_start:'出発', mjs_lang:'' },
    ko:{ mjs_road:'문을 찾아가는 길', mjs_road_sub:'출석할 때마다 길을 한 걸음 걸어요. 머무는 곳마다 새 그림이 열려요.', mjs_here:'현재 위치', mjs_day:'{n}일째', mjs_lock:'연속 기록이 {n}일이 되면 열려요. {k}일 남았어요.', mjs_latest:'최근 장소', mjs_read:'읽기', mjs_new:'NEW', mjs_rain:'비', mjs_kept:'한 번 연 장은 연속 기록이 다시 시작되어도 남아 있어요.', mjs_next:'다음 장소: “{name}”까지 {n}일', mjs_preview:'관리자 미리보기: 모든 장을 읽을 수 있어요', mjs_prev:'이전', mjs_nextc:'다음', mjs_notes:'그 후의 밤 {n}개가 열렸어요', mjs_start:'출발', mjs_lang:'' },
    zh:{ mjs_road:'寻找 Moon 的路', mjs_road_sub:'每次签到都是路上的一步，每一站都会打开一幅新画。', mjs_here:'你在这里', mjs_day:'第 {n} 天', mjs_lock:'连续签到满 {n} 天时开启，还差 {k} 天。', mjs_latest:'最新一站', mjs_read:'阅读', mjs_new:'新', mjs_rain:'雨', mjs_kept:'已打开的章节会一直保留，即使连续记录重新开始。', mjs_next:'下一站：“{name}”，还有 {n} 天', mjs_preview:'管理员预览：可阅读所有章节', mjs_prev:'上一章', mjs_nextc:'下一章', mjs_notes:'已打开 {n} 段之后的夜晚', mjs_start:'出发', mjs_lang:'' },
    fr:{ mjs_road:'Le chemin vers Moon', mjs_road_sub:'Chaque check-in est un pas sur le chemin. Chaque étape ouvre une nouvelle image.', mjs_here:'Vous êtes ici', mjs_day:'Jour {n}', mjs_lock:'Cette étape s’ouvre quand votre série atteint {n} jours. Encore {k}.', mjs_latest:'Dernière étape', mjs_read:'Lire', mjs_new:'Nouveau', mjs_rain:'Pluie', mjs_kept:'Les chapitres ouverts restent avec vous, même si votre série recommence.', mjs_next:'Prochaine étape : « {name} » dans {n} jours', mjs_preview:'Aperçu admin : tous les chapitres sont lisibles', mjs_prev:'Précédent', mjs_nextc:'Suivant', mjs_notes:'{n} des nuits d’après sont ouvertes', mjs_start:'Départ', mjs_lang:'' },
    es:{ mjs_road:'El camino hacia Moon', mjs_road_sub:'Cada registro es un paso en el camino. Cada parada abre un dibujo nuevo.', mjs_here:'Estás aquí', mjs_day:'Día {n}', mjs_lock:'Esta parada se abre cuando tu racha llegue a {n} días. Faltan {k}.', mjs_latest:'Última parada', mjs_read:'Leer', mjs_new:'Nuevo', mjs_rain:'Lluvia', mjs_kept:'Los capítulos que abriste se quedan contigo, aunque tu racha empiece de nuevo.', mjs_next:'Próxima parada: «{name}» en {n} días', mjs_preview:'Vista previa de admin: puedes leer todos los capítulos', mjs_prev:'Anterior', mjs_nextc:'Siguiente', mjs_notes:'{n} de las noches de después están abiertas', mjs_start:'Salida', mjs_lang:'' }
  };
  UI.en.mjs_write = 'Write something for this stop'; UI.vi.mjs_write = 'Bấm vào đây để viết cho trạm này';
  Object.assign(UI.en, en); Object.assign(UI.vi, vi);
  Object.keys(UI).forEach(l => { I18N[l] = I18N[l] || {}; Object.assign(I18N[l], UI[l]); });
})();
