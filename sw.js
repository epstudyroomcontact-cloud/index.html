/* =========================================================
   SERVICE WORKER — chỉ dùng để hiện thông báo nhắc giờ live và mở trang Watch khi bấm vào.
   Không có sự kiện fetch: không lưu cache, không ảnh hưởng việc tải web.
   ========================================================= */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || self.registration.scope + '#/watch';
  e.waitUntil(self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(list => {
    const tab = list.find(c => c.url.split('#')[0] === url.split('#')[0]);
    if (tab) return tab.focus().then(c => { const w = c || tab; return w.navigate ? w.navigate(url).catch(() => {}) : null; });
    return self.clients.openWindow(url);
  }));
});
