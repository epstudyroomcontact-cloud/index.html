/* =========================================================
   SERVICE WORKER — để cài web thành ứng dụng (điện thoại / máy tính), hiện thông báo nhắc giờ live,
   và nhận THÔNG BÁO ĐẨY khi live bắt đầu (kể cả lúc đã đóng web). Thông báo đẩy do GitHub Actions gửi qua
   Firebase Cloud Messaging (xem scripts/push-live.mjs); ở đây chỉ cần đọc nội dung và hiện lên.
   KHÔNG lưu cache file của web: mọi lần mở đều tải bản mới nhất từ mạng như bình thường,
   nên không ai bị kẹt bản cũ. Chỉ lưu sẵn một trang "Bạn đang offline" để hiện khi mất mạng.
   Đổi SW_V mỗi khi sửa file này hoặc offline.html.
   ========================================================= */
const SW_V = 'v6', OFFLINE_CACHE = 'ep-offline-' + SW_V, OFFLINE_URL = 'offline.html';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(OFFLINE_CACHE).then(c => c.add(new Request(OFFLINE_URL, { cache:'reload' }))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => e.waitUntil(
  Promise.resolve(self.registration.navigationPreload && self.registration.navigationPreload.enable()).catch(() => {})   // tải trang song song lúc service worker khởi động: mở web không chậm hơn
    .then(() => caches.keys()).then(keys => Promise.all(keys.filter(k => k.startsWith('ep-') && k !== OFFLINE_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
// Chỉ xử lý lúc mở trang (navigate): có mạng thì đi thẳng ra mạng, mất mạng mới trả trang offline.
// File js/css/ảnh, Firebase, YouTube… không đi qua đây nên vẫn chạy y như khi chưa có service worker.
self.addEventListener('fetch', e => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(Promise.resolve(e.preloadResponse).then(r => r || fetch(e.request)).catch(() => caches.open(OFFLINE_CACHE).then(c => c.match(OFFLINE_URL)).then(r => r || Response.error())));
});
// Thông báo đẩy: máy gửi chỉ gửi dữ liệu { title, body, tag } nên tự hiện ở đây (mọi trình duyệt, kể cả iPhone đã cài ra Màn hình chính).
// Cùng tag với nhắc trong trang ('live-now', nhắc việc Planner 'pl-…'), nên đang mở web cũng không bị hiện 2 thông báo giống nhau.
self.addEventListener('push', e => {
  let j = {}; try { j = e.data ? e.data.json() : {}; } catch (err) {}
  const d = j.data || {}, n = j.notification || {};
  // "Việc hôm nay" (tag 'pl-today', planner.js plPinShow) của ngày đã qua: đóng luôn, để không còn danh sách cũ ngoài màn hình
  const stale = self.registration.getNotifications({ tag:'pl-today' }).then(l => l.forEach(x => { if (x.data && x.data.until && Date.now() > x.data.until) x.close(); })).catch(() => {});
  const url = self.registration.scope + (/^#\/[\w-]*$/.test(d.path || '') ? d.path : '#/watch');   // nhắc việc Planner gửi path '#/planner'
  // pin = "việc hôm nay" (scripts/push-planner.mjs): yên lặng, không rung, chỉ cập nhật thông báo 'pl-today' đang có
  const opts = d.pin ? { body: d.body || '', tag: 'pl-today', renotify: false, silent: true, icon: 'icons/icon-192.png', data: { url, until: +d.until || 0 } }
    : { body: d.body || n.body || '', tag: d.tag || 'live-now', renotify: true, silent: false, icon: 'icons/icon-192.png',
        vibrate: [200, 100, 200, 100, 300],                      // rung trên Android (tiếng chuông do cài đặt thông báo của máy quyết định)
        data: { url } };
  e.waitUntil(stale.then(() => self.registration.showNotification(d.title || n.title || 'EP Study Room', opts)));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || self.registration.scope + '#/watch';
  e.waitUntil(self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(list => {
    const tab = list.find(c => c.url.split('#')[0] === url.split('#')[0]);
    if (tab) return tab.focus().then(c => { const w = c || tab; return w.navigate ? w.navigate(url).catch(() => {}) : null; });
    return self.clients.openWindow(url);
  }));
});
