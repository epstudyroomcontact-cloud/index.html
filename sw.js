/* =========================================================
   SERVICE WORKER — để cài web thành ứng dụng (điện thoại / máy tính), hiện thông báo nhắc giờ live,
   và nhận THÔNG BÁO ĐẨY khi live bắt đầu (kể cả lúc đã đóng web). Thông báo đẩy do GitHub Actions gửi qua
   Firebase Cloud Messaging (xem scripts/push-live.mjs); ở đây chỉ cần đọc nội dung và hiện lên.
   KHÔNG lưu cache file của web: mọi lần mở đều tải bản mới nhất từ mạng như bình thường,
   nên không ai bị kẹt bản cũ. Chỉ lưu sẵn một trang "Bạn đang offline" để hiện khi mất mạng.
   Đổi SW_V mỗi khi sửa file này hoặc offline.html.
   ========================================================= */
const SW_V = 'v3', OFFLINE_CACHE = 'ep-offline-' + SW_V, OFFLINE_URL = 'offline.html';
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
  e.waitUntil(self.registration.showNotification(d.title || n.title || 'EP Study Room', {
    body: d.body || n.body || '', tag: d.tag || 'live-now', renotify: true, icon: 'icons/icon-192.png',
    data: { url: self.registration.scope + (/^#\/[\w-]*$/.test(d.path || '') ? d.path : '#/watch') }   // nhắc việc Planner gửi path '#/planner'
  }));
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
