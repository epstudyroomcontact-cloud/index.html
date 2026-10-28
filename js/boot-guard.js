/* Lưới an toàn: web không khởi động được thì TỰ SỬA cho khách, không bắt khách làm gì.
   Viết kiểu JS cũ (ES5) để chạy được cả trên trình duyệt cũ. boot() trong core.js đặt window.EP_BOOTED = true khi đã vẽ xong.
   Khởi động lỗi → lần 1: xoá dữ liệu web lưu trong máy (localStorage ep_* trừ bản nhớ Planner, service worker, cache) rồi tự tải lại;
   lần 2: xoá thêm IndexedDB (đăng xuất) rồi tự tải lại; vẫn lỗi mới hiện trang báo lỗi thân thiện (8 ngôn ngữ, nút Tải lại, cách xoá dữ liệu web) + dòng lỗi ngắn.
   Giữ lại ep_lang (ngôn ngữ khách đã chọn) để trang báo lỗi nói đúng tiếng của khách.
   Số lần đã thử nhớ trong sessionStorage (chặn được thì ghi lên địa chỉ ?heal=N), nên không bao giờ tải lại vòng vòng. */
(function(){
  var errs = [], KEY = 'ep_heal';
  var tag = function(e){ return (e && (e.message || e.reason && (e.reason.message || e.reason))) || 'error'; };
  window.addEventListener('error', function(e){ errs.push(tag(e) + (e.filename ? ' @ ' + String(e.filename).split('/').pop().split('?')[0] + ':' + e.lineno : (e.target && e.target.src ? ' @ ' + String(e.target.src).split('/').pop() : ''))); }, true);
  window.addEventListener('unhandledrejection', function(e){ errs.push('promise: ' + tag(e)); });
  var level = function(){ var v = null; try { v = sessionStorage.getItem(KEY); } catch (e) {} if (v === null) { var m = /[?&]heal=(\d)/.exec(location.search); v = m ? m[1] : 0; } return +v || 0; };
  var setLevel = function(n){ try { sessionStorage.setItem(KEY, String(n)); return ''; } catch (e) { return (location.search ? location.search.replace(/[?&]heal=\d/, '') + '&' : '?') .replace(/^&/, '?') + 'heal=' + n; } };
  window.EP_HEALED = function(){ try { sessionStorage.removeItem(KEY); } catch (e) {} if (/[?&]heal=\d/.test(location.search) && history.replaceState) history.replaceState(null, '', location.pathname + location.search.replace(/[?&]heal=\d/, '').replace(/^&/, '?') + location.hash); };
  /* Lời nhắn khi lỗi, 8 ngôn ngữ: [tiêu đề, lời xin lỗi, nút tải lại, gợi ý xoá dữ liệu web, tiêu đề lỗi 1 trang, lời nhắn lỗi 1 trang, nút về Tổng quan].
     Dùng chung cho trang báo lỗi lúc mở web (ở đây) và lúc một trang bị lỗi sau khi web đã chạy (pageCrash trong core.js). */
  var TXT = {
    en:['The page did not load','Sorry, something went wrong while opening Ép Study Room. Tap Reload and the site will tidy itself up and try again.','Reload',"Still not working? Turn off ad blockers for this site, try a private window, or clear this site's data in your browser settings. Your account and synced planner stay safe online.",'This page hit a snag','Something went wrong while showing this page. The rest of the site still works.','Back to Overview'],
    vi:['Trang chưa tải được','Xin lỗi bạn, web gặp lỗi khi mở. Bạn bấm Tải lại để web tự dọn dẹp và thử lại nhé.','Tải lại','Vẫn chưa được? Bạn thử tắt chặn quảng cáo cho trang này, mở bằng cửa sổ ẩn danh, hoặc xoá dữ liệu của trang này trong cài đặt trình duyệt. Tài khoản và planner đã đồng bộ vẫn an toàn trên mạng.','Trang này gặp trục trặc','Có lỗi khi hiển thị trang này. Các phần khác của web vẫn dùng bình thường.','Về trang Tổng quan'],
    hi:['पेज लोड नहीं हुआ','माफ़ कीजिए, Ép Study Room खोलते समय कुछ गड़बड़ हो गई। दोबारा लोड करें दबाएँ, साइट खुद ठीक होकर फिर कोशिश करेगी।','दोबारा लोड करें','अब भी नहीं चल रहा? इस साइट के लिए ऐड ब्लॉकर बंद करें, प्राइवेट विंडो में खोलें, या ब्राउज़र सेटिंग में इस साइट का डेटा साफ़ करें। आपका खाता और सिंक हुआ प्लानर ऑनलाइन सुरक्षित रहता है।','इस पेज में दिक्कत आई','यह पेज दिखाते समय कुछ गड़बड़ हो गई। साइट के बाकी हिस्से ठीक चल रहे हैं।','अवलोकन पर लौटें'],
    ja:['ページを読み込めませんでした','申し訳ありません、Ép Study Room を開くときに問題が起きました。「再読み込み」を押すと、サイトが自動で整理してもう一度試します。','再読み込み','それでも直らない場合は、このサイトの広告ブロックをオフにする、シークレットウィンドウで開く、またはブラウザの設定でこのサイトのデータを削除してみてください。アカウントと同期済みのプランナーはオンラインで安全に保存されています。','このページで問題が起きました','このページの表示中にエラーが起きました。サイトのほかの部分は通常どおり使えます。','ホームに戻る'],
    ko:['페이지를 불러오지 못했어요','죄송해요, Ép Study Room을 여는 중에 문제가 생겼어요. 새로고침을 누르면 사이트가 스스로 정리하고 다시 시도해요.','새로고침','그래도 안 되면 이 사이트의 광고 차단을 끄거나, 시크릿 창으로 열거나, 브라우저 설정에서 이 사이트의 데이터를 삭제해 보세요. 계정과 동기화된 플래너는 온라인에 안전하게 저장돼 있어요.','이 페이지에 문제가 생겼어요','이 페이지를 표시하는 중에 오류가 났어요. 사이트의 다른 부분은 정상적으로 작동해요.','홈으로 돌아가기'],
    zh:['页面没有加载出来','抱歉，打开 Ép Study Room 时出了点问题。点“重新加载”，网站会自动清理并再试一次。','重新加载','还是不行？试试为本站关闭广告拦截、用无痕窗口打开，或在浏览器设置中清除本站数据。你的账号和已同步的计划都安全地保存在线上。','这个页面出了点问题','显示这个页面时出错了。网站的其他部分仍可正常使用。','返回概览'],
    fr:["La page ne s'est pas chargée","Désolé, un problème est survenu à l'ouverture d'Ép Study Room. Appuyez sur Recharger : le site fera le ménage et réessaiera.",'Recharger',"Toujours rien ? Désactivez le bloqueur de pubs pour ce site, essayez une fenêtre privée ou effacez les données de ce site dans les réglages du navigateur. Votre compte et votre planner synchronisé restent en sécurité en ligne.",'Cette page a rencontré un souci',"Un problème est survenu à l'affichage de cette page. Le reste du site fonctionne normalement.","Retour à l'aperçu"],
    es:['La página no se cargó','Lo sentimos, algo salió mal al abrir Ép Study Room. Pulsa Recargar y el sitio se ordenará solo y lo intentará de nuevo.','Recargar','¿Sigue sin funcionar? Desactiva el bloqueador de anuncios para este sitio, prueba una ventana privada o borra los datos de este sitio en los ajustes del navegador. Tu cuenta y tu planner sincronizado siguen a salvo en línea.','Esta página tuvo un problema','Algo salió mal al mostrar esta página. El resto del sitio funciona con normalidad.','Volver al resumen']
  };
  var EP_TXT = window.EP_TXT = function(){
    var l = null; try { l = JSON.parse(localStorage.getItem('ep_lang')); } catch (e) {}
    if (!TXT[l]) l = String(navigator.language || 'en').slice(0, 2).toLowerCase();
    return TXT[l] || TXT.en;
  };
  var EP_MOON = '<svg width="76" height="76" viewBox="0 0 128 128" aria-hidden="true"><defs><linearGradient id="ep-fail-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF7AB8"/><stop offset="1" stop-color="#E8368F"/></linearGradient></defs><path d="M60.51 20.22 A46 46 0 1 0 95.33 89.86 A39 39 0 0 1 60.51 20.22Z" fill="url(#ep-fail-g)"/><path d="M104 17 Q105.62 24.38 113 26 Q105.62 27.62 104 35 Q102.38 27.62 95 26 Q102.38 24.38 104 17Z" fill="#FFC94D"/><path d="M116 39.5 Q116.81 43.19 120.5 44 Q116.81 44.81 116 48.5 Q115.19 44.81 111.5 44 Q115.19 43.19 116 39.5Z" fill="#FFC94D"/></svg>';
  function heal(n, done){
    var jobs = 0, end = function(){ if (--jobs <= 0) done(); };
    jobs++;
    try { var ks = []; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf('ep_') === 0 && k !== 'ep_lang' && (n >= 2 || !/^ep_(plw_|todos)/.test(k))) ks.push(k); } for (i = 0; i < ks.length; i++) localStorage.removeItem(ks[i]); } catch (e) {}   // lần 1 giữ bản nhớ Planner / việc cần làm chưa kịp lưu
    try { if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) { jobs++; navigator.serviceWorker.getRegistrations().then(function(rs){ for (var i = 0; i < rs.length; i++) rs[i].unregister(); }).then(end, end); } } catch (e) {}
    try { if (window.caches && caches.keys) { jobs++; caches.keys().then(function(ks){ return Promise.all(ks.map(function(k){ return caches.delete(k); })); }).then(end, end); } } catch (e) {}
    try { if (n >= 2 && window.indexedDB && indexedDB.databases) { jobs++; indexedDB.databases().then(function(ds){ for (var i = 0; i < ds.length; i++) if (ds[i].name) indexedDB.deleteDatabase(ds[i].name); }).then(end, end); } } catch (e) {}
    setTimeout(done, 3000);   // trình duyệt treo một bước nào đó thì vẫn tải lại
    end();
  }
  var healing = false;
  window.EP_FAIL = function(err){
    if (err) errs.push(tag(err));
    if (window.EP_BOOTED || healing || document.getElementById('ep-fail')) return;
    if (window.console) console.error('[EP] khởi động lỗi:', errs.join(' | '));
    var n = level();
    if (n < 2) {                                         // tự sửa: xoá dữ liệu cũ trong máy rồi tải lại
      healing = true; var q = setLevel(n + 1), go = false;
      heal(n + 1, function(){ if (go) return; go = true; if (q) location.replace(location.pathname + q + location.hash); else location.reload(); });
      return;
    }
    var m = EP_TXT(), d = document.createElement('div');
    d.id = 'ep-fail'; d.setAttribute('role', 'alert');
    d.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;overflow:auto;display:flex;align-items:center;justify-content:center;padding:24px 16px;box-sizing:border-box;background:#080b13;color:#f7f3ff;font:16px/1.5 Nunito,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;text-align:center';
    d.innerHTML = '<div style="max-width:400px;margin:auto">' + EP_MOON
      + '<h2 style="font-size:1.3rem;margin:16px 0 8px">' + m[0] + '</h2>'
      + '<p style="color:#c0c8de;margin:0 0 18px">' + m[1] + '</p>'
      + '<button type="button" id="ep-fail-btn" style="font:inherit;font-weight:800;border:0;border-radius:99px;padding:11px 26px;color:#fff;cursor:pointer;background:linear-gradient(180deg,#ff8fb1,#ff3d9a 55%,#e0247f);box-shadow:0 6px 20px rgba(255,61,154,.45)">' + m[2] + '</button>'
      + '<p style="color:#c0c8de;opacity:.85;font-size:13px;margin:18px 0 0">' + m[3] + '</p>'
      + '<p style="opacity:.45;font-size:11px;margin:14px 0 0;word-break:break-word">' + (errs.slice(0, 3).join(' · ').replace(/[<>&]/g, '') || 'timeout') + '</p></div>';
    (document.body || document.documentElement).appendChild(d);
    document.getElementById('ep-fail-btn').onclick = function(){ var q = setLevel(0); heal(2, function(){ if (q) location.replace(location.pathname + q + location.hash); else location.reload(); }); };
  };
  setTimeout(function(){ if (!window.EP_BOOTED) window.EP_FAIL(errs.length ? null : 'timeout'); }, 20000);   // 20 giây vẫn chưa vẽ được gì
})();
