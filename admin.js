'use strict';
/* =========================================================
   ADMIN CONSOLE — #/admin/<tab>   (giao diện tiếng Việt cho chủ trang)
   Quyền admin = có tài liệu admins/<uid> trong Firestore (xem SETUP.md)
   ========================================================= */
const A_TABS = [
  ['overview', 'chart', 'Tổng quan'], ['site', 'sliders', 'Giao diện & Menu'], ['schedule', 'calendar', 'Lịch live'], ['blog', 'pen', 'Bài viết'], ['music', 'volume', 'Nhạc'],
  ['products', 'bag', 'Sản phẩm'], ['gear', 'tag', 'Đồ mình dùng'], ['orders', 'box', 'Đơn hàng'], ['coupons', 'tag', 'Mã giảm giá'], ['trials', 'timer', 'Mã dùng thử'], ['content', 'info', 'Nội dung & FAQ'],
  ['reviews', 'star', 'Đánh giá'], ['payments', 'credit', 'Thanh toán'], ['plan', 'heart', 'Gói Người đồng hành'], ['season', 'star', 'Sự kiện học chung'], ['members', 'users', 'Thành viên'], ['all', 'sliders', 'Bảng tổng hợp']
];
const A = html => { const b = $('admin-body'); if (b) b.innerHTML = html; };
const fail = e => { if (typeof AS === 'object') AS.pending = null; alert('Lỗi: ' + (e && e.message || e)); };   // lưu lỗi: thẻ vẫn giữ "Chưa lưu"
/* Mọi lần đọc Firebase của trang quản trị nên có hạn chờ: mạng chập chờn hoặc bị tiện ích chặn thì báo lỗi thay vì kẹt "Đang tải…" mãi */
const withTimeout = (pr, ms = 15000, what = 'Firebase') => new Promise((res, rej) => { const id = setTimeout(() => rej(Object.assign(new Error(what + ' không phản hồi sau ' + Math.round(ms / 1000) + ' giây'), { code:'timeout' })), ms); Promise.resolve(pr).then(v => { clearTimeout(id); res(v); }, e => { clearTimeout(id); rej(e); }); });
const loadError = (e, retry) => `<div class="card pad stack"><b>Không tải được</b><p class="small muted">${esc((e && (e.code === 'timeout' ? e.message : (e.code || e.message))) || 'Lỗi không rõ')}. Thường do mạng chập chờn hoặc trình duyệt đang chạy bản web cũ.</p><div class="row"><button class="btn primary sm" data-act="${retry}">Thử lại</button><button class="btn secondary sm" data-act="hardReload">Tải lại trang (bản mới nhất)</button></div></div>`;
/* Kiểm tra trình duyệt có đang chạy bản web cũ không: đọc lại index.html (bỏ qua bộ nhớ đệm) và so mã ?v= của core.js với bản đang chạy */
let verAt = 0;
async function checkNewVersion(){
  if (DEMO || Date.now() - verAt < 60000) return; verAt = Date.now();
  try {
    const r = await withTimeout(fetch(location.pathname + '?cb=' + Date.now(), { cache:'no-store' }), 8000, 'Kiểm tra bản mới'), m = (await r.text()).match(/core\.js\?v=([\w.-]+)/), el = $('ver-note');
    if (m && m[1] !== ASSET_V && el) el.innerHTML = `<div class="limit-box small" style="border-color:var(--accent);margin-top:8px">Có bản web mới hơn (mã ${esc(m[1])}), trình duyệt của bạn đang chạy mã ${esc(ASSET_V)}. <button class="btn primary sm" data-act="hardReload">Tải bản mới</button></div>`;
  } catch (e) { console.warn('version check', e.code || e.message); }
}
const ok = m => toast(m || 'Đã lưu ✔');
/* Lưu có dịch tự động: khoá nút + hiện "Đang dịch…" trong lúc dịch (xem js/translate.js) */
async function withTranslate(btn, work){
  TR.reset(); const old = btn && btn.textContent;
  if (btn) { btn.disabled = true; btn.textContent = 'Đang dịch…'; }
  try { return await work(); } finally { if (btn) { btn.disabled = false; btn.textContent = old; } }
}
const trMsg = base => TR.failed ? `${base} Có ${TR.failed} lần dịch lỗi (mạng?) — bấm Lưu lại để dịch tiếp.` : `${base} Đã dịch sang mọi ngôn ngữ ✔`;
const normHtml = h => { const d = document.createElement('div'); d.innerHTML = sanitizeHtml(h || ''); return sanitizeHtml(d.innerHTML); };
const dbSet = (col, id, data, merge = true) => DEMO ? (toast('Chế độ xem thử: chưa lưu thật'), Promise.resolve()) : db.collection(col).doc(id).set(data, { merge });
const val = id => { const e = $(id); return e ? e.value.trim() : ''; };
const fld = (label, id, v = '', attrs = '', hint = '') => `<div class="field"><label class="label" for="${id}">${label}</label><input class="input" id="${id}" value="${esc(v)}" ${attrs}>${hint ? `<div class="hint">${hint}</div>` : ''}</div>`;
const area = (label, id, v = '', rows = 3) => `<div class="field"><label class="label" for="${id}">${label}</label><textarea class="textarea" id="${id}" style="min-height:${rows * 26}px">${esc(v)}</textarea></div>`;
const selectF = (label, id, opts, v) => `<div class="field"><label class="label" for="${id}">${label}</label><select class="select" id="${id}">${opts.map(([k, l]) => `<option value="${esc(k)}" ${k === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>`;
const aCard = (title, inner, extra = '') => `<section class="card a-card"><div class="row between"><h3>${title}</h3>${extra}</div>${inner}</section>`;
const dateStr = ts => ts ? DT.fromMillis(tsMs(ts)).toFormat('dd/MM/yyyy HH:mm') : '';

/* =========================================================
   KHUNG TRANG QUẢN TRỊ GỌN HƠN (chỉ là giao diện, không đổi dữ liệu hay cách lưu)
   - 16 tab gộp thành 5 nhóm theo mục đích; mỗi nhóm có hàng tab con. Link #/admin/<tab> giữ nguyên như cũ.
   - Ô "Tìm nhanh" tìm theo tên mục (gõ không dấu cũng được), bấm là mở đúng tab và cuộn tới đúng thẻ.
   - Mỗi thẻ thu gọn / mở được (nhớ trên máy này); tab nhiều thẻ có hàng "Đi tới" ở đầu.
   - Gõ vào thẻ mà chưa bấm Lưu: thẻ hiện "Chưa lưu", thanh nhắc ở cuối màn hình, và hỏi lại trước khi rời tab.
     Lưu xong: thẻ hiện "Đã lưu lúc HH:mm". Ô tích lưu ngay (data-change) và thẻ không có nút Lưu thì không tính.
   ========================================================= */
const A_GROUPS = [
  ['home', 'chart', 'Tổng quan', ['overview']],
  ['all', 'sliders', 'Bảng tổng hợp', ['all']],
  ['live', 'calendar', 'Live & Lịch', ['schedule']],
  ['page', 'sliders', 'Trang web & Nội dung', ['site', 'content', 'blog', 'music', 'gear']],
  ['people', 'users', 'Thành viên & Người đồng hành', ['members', 'plan', 'trials', 'season']],
  ['shop', 'bag', 'Cửa hàng & Thanh toán', ['products', 'orders', 'coupons', 'reviews', 'payments']]
];
/* tên ngắn trong nhóm (tên cũ vẫn tìm được) + một dòng chú thích */
const A_SUB = {
  all:['Bảng tổng hợp', 'Mọi cài đặt đang dùng trên một trang, gom theo nhóm. Gõ để lọc, bấm Sửa để nhảy tới đúng mục và mở form.'],
  overview:['Tổng quan', 'Số liệu nhanh, đơn mới, xuất bản dữ liệu cho người xem, sao lưu, gửi thông báo live.'],
  schedule:['Lịch live', 'Lịch live từng tuần (giờ Việt Nam) và nút bắt đầu buổi live thật cho web và OBS.'],
  site:['Giao diện & Menu', 'Tên trang, logo, màu, font, menu bên trái, bố cục trang chủ, khoá đăng nhập, chữ chạy, mạng xã hội, YouTube.'],
  content:['Chữ, dịch & FAQ', 'Sửa chữ và ảnh trực tiếp trên trang, dịch tự động, câu hỏi thường gặp.'],
  blog:['Bài viết', 'Viết, ghim, hẹn giờ đăng bài và quản lý các mục bài viết.'],
  music:['Nhạc', 'Gợi ý nhạc cho Phòng tập trung và nhạc mình đang nghe.'],
  gear:['Đồ mình dùng', 'Danh sách đồ mình dùng (link affiliate).'],
  members:['Thành viên & duyệt', 'Duyệt yêu cầu Người đồng hành, gia hạn, danh sách thành viên, đăng ký email.'],
  plan:['Gói & quyền lợi', 'Giá và link trang Ủng hộ, thanh mục tiêu, khuyến mãi, ưu đãi Hành trình trăng, giới hạn Phòng tập trung, nhóm học.'],
  trials:['Mã dùng thử', 'Tạo mã dùng thử và theo dõi người đã kích hoạt.'],
  season:['Sự kiện học chung', 'Tạo hoặc sửa sự kiện học chung theo mùa.'],
  products:['Sản phẩm', 'Thêm, sửa, ẩn sản phẩm trong Cửa hàng.'],
  orders:['Đơn hàng', 'Đơn hàng gần đây, đổi trạng thái khi tiền về.'],
  coupons:['Mã giảm giá', 'Tạo và quản lý mã giảm giá.'],
  reviews:['Đánh giá', 'Duyệt hoặc xoá đánh giá của khách.'],
  payments:['Thanh toán', 'VietQR, PayPal / Stripe / Ko-fi và mẫu email xác nhận (EmailJS).']
};
const aGroupOf = tab => A_GROUPS.find(g => g[3].includes(tab)) || A_GROUPS[0];
/* chỉ mục cho ô Tìm nhanh: [tab, tên thẻ đúng như trên trang, từ khoá thêm] */
const A_FIND = [
  ['overview', 'Đơn hàng mới nhất', 'thống kê doanh thu số liệu'], ['overview', 'Dữ liệu cho người xem & bản sao dự phòng', 'xuất bản sao lưu backup json dự phòng fallback'], ['overview', 'Thông báo đẩy khi live', 'push notification gửi thông báo'],
  ['schedule', 'Bắt đầu buổi live', 'onair giờ thật obs lên sóng'], ['schedule', '', 'lịch tuần pomodoro buổi live huỷ live sao chép tuần trước'],
  ['site', 'Thương hiệu & màu sắc', 'tên trang logo màu font theme ảnh bìa hero'], ['site', 'Menu điều hướng (thanh bên)', 'menu ẩn mục đổi tên liên kết sidebar'], ['site', 'Bố cục trang chủ', 'trang chủ khối thứ tự home'],
  ['site', 'Quyền truy cập (bắt buộc đăng nhập)', 'khoá đăng nhập tài khoản lock'], ['site', 'Thông báo chạy chữ & Mạng xã hội', 'announcement facebook tiktok instagram'], ['site', 'YouTube', 'channel id video live kênh'],
  ['content', 'Sửa chữ & ảnh trực tiếp trên trang', 'sửa chữ ảnh giới thiệu khôi phục chữ mặc định'], ['content', 'Dịch tự động', 'dịch ngôn ngữ translate'], ['content', 'Câu hỏi thường gặp (FAQ)', 'faq hỏi đáp'],
  ['blog', 'Tất cả bài viết', 'blog viết bài đăng bài'], ['blog', 'Các mục của phần viết', 'chuyên mục danh mục category'],
  ['music', 'Gợi ý nhạc cho Phòng tập trung', 'playlist spotify youtube music'], ['music', 'Nhạc mình đang nghe gần đây', 'playlist'], ['gear', 'Đồ mình dùng (link affiliate)', 'affiliate shopee đồ dùng'],
  ['members', 'Yêu cầu Người đồng hành chờ duyệt', 'duyệt thanh toán companion'], ['members', 'Sắp hết hạn / đã hết hạn', 'gia hạn hết hạn companion'], ['members', 'Thành viên', 'tài khoản người dùng email user'], ['members', 'Đăng ký email nhắc lịch', 'challenge email'],
  ['plan', 'Giá và link thanh toán (trang Ủng hộ)', 'ủng hộ giá momo gói tháng gia hạn support'], ['plan', 'Thanh mục tiêu duy trì web (trang Ủng hộ)', 'mục tiêu goal'], ['plan', 'Khuyến mãi: tặng thêm tháng', 'khuyến mãi promo'],
  ['plan', 'Ưu đãi Hành trình trăng', 'moon 60 ngày điểm danh'], ['plan', 'Giới hạn Phòng tập trung', 'focus giới hạn miễn phí'], ['plan', 'Nhóm học trực tiếp', 'nhóm học group'],
  ['trials', 'Tạo mã dùng thử', 'trial'], ['trials', 'Người đã kích hoạt', 'trial gia hạn dừng'], ['season', 'Sự kiện hiện tại', 'sự kiện mùa season mốc chúc mừng'],
  ['products', 'Tất cả sản phẩm', 'cửa hàng shop giá'], ['orders', 'Đơn hàng gần đây', 'paid trạng thái'], ['coupons', 'Tạo mã giảm giá', 'coupon'], ['coupons', 'Các mã hiện có', 'coupon'], ['reviews', 'Đánh giá của khách', 'review sao duyệt'],
  ['payments', 'Chuyển khoản VietQR (khách Việt Nam)', 'ngân hàng số tài khoản qr bank'], ['payments', 'Thanh toán quốc tế (mặc định cho mọi sản phẩm)', 'paypal stripe kofi'],
  ['payments', 'Email xác nhận đơn (EmailJS)', 'emailjs email'], ['payments', 'Email báo cho bạn khi có người bấm', 'emailjs đã thanh toán']
];
const aNorm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/\s+/g, ' ').trim();
const aCardTitle = c => { const h = c.querySelector('h3'); return h ? (h.dataset.t || h.textContent).replace(/\s*\(\d+\+?\)\s*$/, '').trim() : ''; };
const aTab = () => (route && route.name === 'admin' && A_TABS.some(x => x[0] === route.args[0])) ? route.args[0] : 'overview';
const aKey = c => aTab() + '|' + aNorm(aCardTitle(c));
const AS = { dirty:new Set(), tab:'', saved:{}, pending:null, open:new Set() };
const aIsSaveBtn = b => !!b && b.tagName === 'BUTTON' && (/^save|Save$/.test(b.dataset.act || '') || /^Lưu/.test((b.textContent || '').trim()));
const aBodySave = b => [...b.querySelectorAll('button')].some(x => aIsSaveBtn(x) && !x.closest('.a-card'));
/* XEM TỔNG QUÁT TRƯỚC, BẤM SỬA MỚI MỞ: thẻ cài đặt (có ô nhập + nút Lưu) mặc định chỉ hiện bản tóm tắt các giá trị đang có,
   đọc thẳng từ các ô của form (nên luôn khớp với dữ liệu thật). Bấm "Sửa" (hoặc tiêu đề) để mở form. Thẻ chỉ để xem (bảng đơn hàng,
   danh sách thành viên…), thẻ tạo mới và thẻ Bắt đầu buổi live luôn mở. Thẻ đang mở / chưa lưu giữ nguyên khi tab vẽ lại. */
const aCut = (t, n) => { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
const aLabelText = el => { if (!el) return ''; const c = el.cloneNode(true); c.querySelectorAll('input,select,textarea,.hint,button').forEach(x => x.remove()); return aCut(c.textContent, 60); };
function aSummary(card){
  const lists = [...new Set([...card.querySelectorAll('[id$="-list"],#mu-picks,#mu-recent'), ...[...card.querySelectorAll('[data-i]')].filter(r => r.querySelector('input,textarea,select') && r.parentElement !== card).map(r => r.parentElement)])].filter((l, _, all) => !all.some(o => o !== l && o.contains(l)));
  const items = [], inList = el => lists.some(l => l.contains(el));
  card.querySelectorAll('.field').forEach(f => {
    if (inList(f) || f.closest('.a-sum')) return;
    const ctl = f.querySelector('input:not([type=checkbox]):not([type=hidden]):not([type=file]),select,textarea'); if (!ctl) return;
    const lab = aLabelText(f.querySelector('.label')) || aCut(ctl.placeholder, 40) || 'Ô';
    let v;
    if (ctl.tagName === 'SELECT') v = esc(aCut(ctl.selectedOptions[0] ? ctl.selectedOptions[0].text : '', 80));
    else if (ctl.type === 'color') v = `<i class="a-sw" style="background:${esc(ctl.value)}"></i> ${esc(ctl.value)}`;
    else v = ctl.value.trim() ? esc(aCut(ctl.value, 90)) : '<span class="faint">(trống)</span>';
    items.push([lab, v]);
  });
  const boxes = [...card.querySelectorAll('input[type=checkbox]')].filter(x => !inList(x) && !x.closest('.a-sum') && !x.dataset.change);
  if (boxes.length === 1) { const x = boxes[0]; items.push([aCut(aLabelText(x.closest('label')), 60) || 'Bật / tắt', x.checked ? '<b class="a-on">Bật</b>' : '<span class="faint">Tắt</span>']); }
  else if (boxes.length > 1) { const on = boxes.filter(x => x.checked).map(x => aLabelText(x.closest('label'))).filter(Boolean); items.push([`Đang bật (${on.length}/${boxes.length})`, on.length ? esc(aCut(on.join(', '), 160)) : '<span class="faint">(không mục nào)</span>']); }
  lists.forEach(l => {
    const rows = [...l.children].filter(r => r.querySelector('input,textarea,select'));
    const nameOf = r => { const t = [...r.querySelectorAll('input[type=text],input:not([type]),textarea')].map(x => x.value.trim()).find(Boolean); if (t) return aCut(t, 48); const lb = r.querySelector('label'); return lb ? aCut(aLabelText(lb), 48) : ''; };
    const chk = r => r.querySelector('input[type=checkbox]'), hasChk = rows.some(chk);
    const chips = list => list.map(nameOf).filter(Boolean).map(n => `<span class="a-sum-c">${esc(n)}</span>`).join('');
    let lab = 'Các mục'; for (let e = l.previousElementSibling; e; e = e.previousElementSibling) { if (e.classList.contains('label')) { lab = aLabelText(e); break; } if (e.querySelector && e.querySelector('input,textarea,select')) break; }
    const on = rows.filter(r => !chk(r) || chk(r).checked), off = rows.filter(r => chk(r) && !chk(r).checked);
    items.push([lab, !rows.length ? '<span class="faint">(chưa có)</span>'
      : hasChk ? `<b>${on.length}/${rows.length} đang hiện</b><span class="a-sum-cs">${chips(on)}</span>${off.length ? `<span class="small faint">Đang ẩn:</span><span class="a-sum-cs off">${chips(off)}</span>` : ''}`
      : `<b>${rows.length} mục</b><span class="a-sum-cs">${chips(rows)}</span>`, 'wide']);
  });
  return items;
}
const aEditable = c => c.id !== 'onair' && !/^(tạo|sửa)/i.test(aCardTitle(c)) && !!c.querySelector('input:not([type=hidden]),select,textarea') && ([...c.querySelectorAll('button')].some(aIsSaveBtn) || aBodySave($('admin-body') || c));
function aDrawSum(card){
  let el = card.querySelector(':scope > .a-sum'); if (!el) { el = document.createElement('div'); el.className = 'a-sum'; card.firstElementChild.after(el); }
  el.innerHTML = aSumHTML(aSummary(card), 5);
}
const aEmptyV = v => /^<span class="faint">\((trống|chưa có|không mục nào)\)<\/span>$/.test(v);
function aCompactV(v){        // danh sách -> "12/12 đang hiện (Tổng quan, Hướng dẫn, +10)"; giá trị thường giữ nguyên
  const d = document.createElement('div'); d.innerHTML = v; const cs = d.querySelector('.a-sum-cs');
  if (!cs) return v;
  const head = d.querySelector('b'), names = [...d.querySelectorAll('.a-sum-cs:not(.off) .a-sum-c')].map(x => x.textContent), n = names.length;
  return esc((head ? head.textContent : '') + (n ? ' (' + names.slice(0, 3).join(', ') + (n > 3 ? ', +' + (n - 3) : '') + ')' : ''));
}
/* Tóm tắt gọn: mỗi mục một đoạn "tên: giá trị · tên: giá trị", tối đa 3 dòng, để cả tab xem được gần như trong một màn hình */
function aSumHTML(items, max){
  const full = items.filter(i => !aEmptyV(i[1])), empty = items.filter(i => aEmptyV(i[1]));
  if (!full.length && !empty.length) return '<p class="small faint" style="margin:0">Bấm Sửa để xem chi tiết.</p>';
  const rows = full.slice(0, max).map(([l, v]) => `<span class="a-ci">${l === 'Các mục' ? '' : `<span class="a-ck">${esc(aCut(l, 36))}</span> `}<span class="a-cv">${aCompactV(v)}</span></span>`).join('')
    + (full.length > max ? `<span class="a-ci faint">+${full.length - max} mục khác</span>` : '');
  return `<div class="a-cs">${rows || '<span class="a-ci faint">Chưa điền gì</span>'}</div>` + (full.length && empty.length ? `<div class="a-kv-empty">Chưa điền: ${empty.length} ô</div>` : '');
}
function aSetFold(card, on, remember = true){
  if (on) aDrawSum(card);
  card.classList.toggle('fold', on); if (on) card.dataset.act = 'aFold'; else delete card.dataset.act;   // thu gọn: cả ô là nút bấm
  const bt = card.querySelector('.a-fold'); if (bt) { bt.setAttribute('aria-expanded', String(!on)); bt.innerHTML = on ? `${ic('pen', 'sm')} Sửa` : 'Thu gọn'; bt.classList.toggle('primary', on); }
  if (remember) { const k = aKey(card); if (on) AS.open.delete(k); else AS.open.add(k); }
}
function aMark(card){
  const key = aKey(card), head = card.firstElementChild; if (!head) return;
  let st = head.querySelector('.a-st'); if (!st) { st = document.createElement('span'); st.className = 'a-st'; const fb = head.querySelector('.a-fold'); head.insertBefore(st, fb); }
  const sv = AS.saved[key];
  if (AS.dirty.has(key)) { st.className = 'a-st dirty'; st.textContent = '● Chưa lưu'; }
  else if (sv) { st.className = 'a-st ok'; st.textContent = sv.demo ? 'Xem thử: chưa lưu thật' : '✔ Đã lưu lúc ' + sv.t; }
  else { st.className = 'a-st'; st.textContent = ''; }
}
function aBar(){
  let bar = $('a-dirty'); const b = $('admin-body');
  if (!b || !AS.dirty.size) { if (bar) bar.remove(); return; }
  const names = [...AS.dirty].map(k => { if (k.endsWith('|__tab')) return 'phần ' + ((A_SUB[aTab()] || [''])[0]); const c = [...b.querySelectorAll('.a-card')].find(x => aKey(x) === k); return c ? aCardTitle(c) : ''; }).filter(Boolean);
  if (!bar) { bar = document.createElement('div'); bar.id = 'a-dirty'; bar.className = 'a-dirty'; bar.setAttribute('role', 'status'); document.body.appendChild(bar); }
  bar.innerHTML = `<span>● Có thay đổi <b>chưa lưu</b>: ${esc(names.join(', '))}</span><button type="button" class="btn primary sm" data-act="aGoDirty">Tới chỗ cần Lưu</button>`;
}
function aEnhance(){
  const b = $('admin-body'); if (!b) return;
  const tab = aTab(), cards = [...b.querySelectorAll('.a-card')];
  cards.forEach((c, i) => {
    if (!c.id) c.id = 'ac-' + tab + '-' + i;
    const head = c.firstElementChild; if (!head || c.dataset.enh) { aMark(c); return; }
    c.dataset.enh = '1'; head.classList.add('a-head');
    const h = head.querySelector('h3'); if (h) { h.dataset.act = 'aFold'; h.setAttribute('role', 'button'); h.tabIndex = 0; }
    const k = aKey(c), ed = aEditable(c);
    if (ed) { c.classList.add('a-ed'); head.insertAdjacentHTML('beforeend', `<button type="button" class="btn sm a-fold" data-act="aFold" aria-expanded="true">Thu gọn</button>`); }
    else if (h) { delete h.dataset.act; h.removeAttribute('role'); h.removeAttribute('tabindex'); }
    if (ed) aSetFold(c, !(AS.open.has(k) || AS.dirty.has(k)), false); aMark(c);
  });
  b.classList.toggle('a-tiles', cards.some(c => c.classList.contains('a-ed')));   // thẻ cài đặt thu gọn hiện thành lưới ô, bấm vào ô mới mở chi tiết
  aBar();
}
function aFlash(el){ if (!el) return; el.scrollIntoView({ behavior:'smooth', block:'start' }); el.classList.remove('a-flash'); void el.offsetWidth; el.classList.add('a-flash'); }
/* tìm thẻ theo tên sau khi tab tải xong (tab đọc Firebase có thể mất vài giây) */
function aSeek(title, tries = 0){
  const b = $('admin-body'); if (!b) return; const n = aNorm(title);
  const c = n && [...b.querySelectorAll('.a-card')].find(x => aNorm(aCardTitle(x)).startsWith(n) || aNorm(aCardTitle(x)).includes(n));
  if (c) { if (c.classList.contains('a-ed')) aSetFold(c, false); return aFlash(c); }
  if (tries < 25) setTimeout(() => aSeek(title, tries + 1), 200);
}
function aFindHits(q){
  const n = aNorm(q); if (!n) return [];
  const words = n.split(' ');
  const rows = [...A_TABS.map(([k]) => ({ tab:k, title:'', text:(A_SUB[k] || [''])[0] + ' ' + A_TABS.find(x => x[0] === k)[2] + ' ' + (A_SUB[k] || ['', ''])[1] + ' ' + aGroupOf(k)[2] })),
    ...A_FIND.filter(r => r[1]).map(([k, t, kw]) => ({ tab:k, title:t, text:t + ' ' + kw }))];
  return rows.map(r => { const tx = aNorm(r.text); let s = 0; words.forEach(w => { if (tx.includes(w)) s += aNorm(r.title || (A_SUB[r.tab] || [''])[0]).includes(w) ? 3 : 1; else s -= 9; }); return { ...r, s }; })
    .filter(r => r.s > 0).sort((a, b) => b.s - a.s).slice(0, 8);
}
function aFindDraw(){
  const inp = $('a-find'), box = $('a-find-res'); if (!inp || !box) return;
  const hits = aFindHits(inp.value);
  box.hidden = !inp.value.trim();
  box.innerHTML = hits.length ? hits.map((h, i) => `<button type="button" class="a-hit ${i ? '' : 'first'}" data-act="aFindGo" data-tab="${esc(h.tab)}" data-t="${esc(h.title)}"><b>${esc(h.title || (A_SUB[h.tab] || [''])[0])}</b><span class="small faint">${esc(aGroupOf(h.tab)[2])} › ${esc((A_SUB[h.tab] || [''])[0])}</span></button>`).join('')
    : '<p class="small faint" style="padding:10px 12px;margin:0">Không thấy mục nào. Thử từ khác, ví dụ: logo, giá, momo, faq, lịch, nhạc.</p>';
}
function aGo(tab, title){
  const f = $('a-find'); if (f) { f.value = ''; aFindDraw(); f.blur(); }
  if (aTab() === tab && route.name === 'admin') { if (title) aSeek(title); else window.scrollTo({ top:0, behavior:'smooth' }); return; }
  if (!aLeaveOk()) return;
  location.hash = '#/admin/' + tab; if (title) setTimeout(() => aSeek(title), 150);
}
function aLeaveOk(){ if (!AS.dirty.size) return true; if (!confirm('Bạn có thay đổi CHƯA LƯU. Rời đi thì mất các thay đổi đó. Vẫn rời đi?')) return false; AS.dirty.clear(); aBar(); return true; }
Object.assign(ACTIONS, {
  aFold:el => { const c = el.closest('.a-card.a-ed'); if (!c) return; const open = c.classList.contains('fold'); aSetFold(c, !open); if (open) { const f = c.querySelector(':scope > :not(.a-head):not(.a-sum) input:not([type=hidden]):not([type=checkbox]):not([readonly]), :scope > :not(.a-head):not(.a-sum) textarea'); c.scrollIntoView({ behavior:'smooth', block:'start' }); if (f && el.classList.contains('a-fold')) f.focus({ preventScroll:true }); } },
  aFoldAll:el => { document.querySelectorAll('#admin-body .a-card.a-ed').forEach(c => aSetFold(c, el.dataset.on === '1')); },
  aJump:el => aFlash($(el.dataset.id)),
  aFindGo:el => aGo(el.dataset.tab, el.dataset.t),
  aGoDirty:() => { const b = $('admin-body'); if (!b) return; const c = [...b.querySelectorAll('.a-card')].find(x => AS.dirty.has(aKey(x))); if (c) return aFlash(c); const sb = [...b.querySelectorAll('button')].find(x => aIsSaveBtn(x) && !x.closest('.a-card')); if (sb) { sb.scrollIntoView({ behavior:'smooth', block:'center' }); sb.classList.remove('a-flash'); void sb.offsetWidth; sb.classList.add('a-flash'); } }
});
/* đánh dấu "Chưa lưu" khi gõ / đổi ô trong thẻ có nút Lưu (hoặc tab có nút Lưu chung) */
function aOnEdit(e){
  const t = e.target, b = $('admin-body'); if (!b || !t.closest || !t.closest('#admin-body')) return;
  if (!/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.dataset.change || t.readOnly || t.type === 'search' || t.type === 'file' || t.id === 'push-text' || t.id === 'onairNote' || t.closest('#a-toc')) return;
  const c = t.closest('.a-card'), bodySave = aBodySave(b);
  let key = null;
  if (c) { if ([...c.querySelectorAll('button')].some(aIsSaveBtn) || bodySave) key = aKey(c); }
  else if (bodySave) key = aTab() + '|__tab';
  if (!key || AS.dirty.has(key)) return;
  AS.dirty.add(key); delete AS.saved[key]; if (c) aMark(c); aBar();
}
document.addEventListener('input', aOnEdit); document.addEventListener('change', aOnEdit);
/* bấm nút Lưu: nhớ thẻ đó; khi web báo lưu xong (toast) thì đổi "Chưa lưu" thành "Đã lưu lúc …" */
document.addEventListener('click', e => {
  const bt = e.target.closest && e.target.closest('#admin-body button'); if (!aIsSaveBtn(bt)) return;
  const c = bt.closest('.a-card'); AS.pending = { key:c ? aKey(c) : null, at:Date.now() };
}, true);
const _aToast = toast;
toast = function (m, ms){
  try {
    const p = AS.pending, s = String(m || '');
    if (p && Date.now() - p.at < 60000 && /Đã lưu|Đã tạo|Đã dịch|xem thử|✔|✓/.test(s) && !/cho người xem|Có yêu cầu|Chưa lưu được|^Lỗi/i.test(s)) {
      const demo = p.demo || /xem thử/i.test(s), t = DT.now().toFormat('HH:mm'), b = $('admin-body');
      const keys = p.key ? [p.key] : [...AS.dirty].filter(k => k.startsWith(aTab() + '|')).concat(b ? [...b.querySelectorAll('.a-card')].filter(c => !c.querySelector('button') || ![...c.querySelectorAll('button')].some(aIsSaveBtn)).map(aKey) : []);
      keys.forEach(k => { AS.dirty.delete(k); AS.saved[k] = { t, demo }; });
      if (!p.key) AS.dirty.delete(aTab() + '|__tab');
      if (b) b.querySelectorAll('.a-card').forEach(c => { aMark(c); if (c.classList.contains('fold')) aDrawSum(c); }); aBar();
      if (demo && !p.demo) p.demo = true; else AS.pending = null;   // xem thử: web báo 2 lần ("chưa lưu thật" rồi "Đã lưu"), giữ nhãn xem thử
    }
  } catch (e) { console.warn('admin save mark', e); }
  return _aToast(m, ms);
};
/* rời tab / rời trang khi còn thay đổi chưa lưu: hỏi lại */
document.addEventListener('click', e => {
  if (!AS.dirty.size || route.name !== 'admin') return;
  const a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a || a.target === '_blank') return;
  const h = a.getAttribute('href'); if (h === location.hash || h === '#') return;
  if (!aLeaveOk()) { e.preventDefault(); e.stopPropagation(); }
}, true);
window.addEventListener('hashchange', () => setTimeout(aBar, 0));
window.addEventListener('beforeunload', e => { if (AS.dirty.size && route.name === 'admin') { e.preventDefault(); e.returnValue = ''; } });
document.addEventListener('input', e => { if (e.target && e.target.id === 'a-find') aFindDraw(); });
document.addEventListener('keydown', e => {
  const t = e.target;
  if (t && t.id === 'a-find') { if (e.key === 'Enter') { e.preventDefault(); const f = document.querySelector('#a-find-res .a-hit'); if (f) f.click(); } else if (e.key === 'Escape') { t.value = ''; aFindDraw(); t.blur(); } return; }
  if (t && t.matches && t.matches('#admin-body .a-head h3') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); t.click(); return; }
  if (e.key === '/' && route.name === 'admin' && !/^(INPUT|TEXTAREA|SELECT)$/.test((t && t.tagName) || '') && !(t && t.isContentEditable) && $('a-find')) { e.preventDefault(); $('a-find').focus(); }
});
document.addEventListener('click', e => { const box = $('a-find-res'); if (box && !box.hidden && !e.target.closest('.a-find')) box.hidden = true; });
let aObs = null;
function aWatch(){
  const b = $('admin-body'); if (!b) return;
  if (aObs) aObs.disconnect();
  let q = false; aObs = new MutationObserver(() => { if (q) return; q = true; Promise.resolve().then(() => { q = false; try { aEnhance(); } catch (e) { console.warn('admin enhance', e); } }); });
  aObs.observe(b, { childList:true });
}

/* ---------------- Bảng tổng hợp: mọi cài đặt đang dùng trên một trang ---------------- */
const A_ALL_TABS = ['site', 'content', 'music', 'gear', 'plan', 'payments'];
function aCapture(tab){        // vẽ tab vào một khung ẩn rồi đọc bản tóm tắt của từng thẻ (không đụng dữ liệu, không ghi gì)
  const real = $('admin-body'), out = []; if (!real) return out;
  real.id = 'admin-body-real';
  const tmp = document.createElement('div'); tmp.id = 'admin-body'; tmp.style.cssText = 'position:fixed;left:-9999px;top:0;width:900px;visibility:hidden';
  document.body.appendChild(tmp);
  try {
    ({ site:tabSite, content:tabContent, music:tabMusic, gear:tabGear, plan:tabPlan, payments:tabPayments })[tab]();
    tmp.querySelectorAll('.a-card').forEach(c => { if (aEditable(c)) out.push({ title:aCardTitle(c), items:aSummary(c) }); });
  } catch (e) { console.warn('admin all', tab, e); }
  finally { tmp.remove(); real.id = 'admin-body'; }
  return out;
}
function tabAll(){
  const txt = h => { const d = document.createElement('div'); d.innerHTML = h; return d.textContent; };
  const sec = A_GROUPS.filter(g => g[0] !== 'all' && g[0] !== 'home').map(g => {
    const body = g[3].map(tab => {
      const nm = A_SUB[tab][0];
      if (!A_ALL_TABS.includes(tab)) return `<a class="a-all-r lk" href="#/admin/${tab}" data-q="${esc(aNorm(nm + ' ' + A_SUB[tab][1]))}"><b>${esc(nm)}</b><small>Mở tab</small></a>`;
      return aCapture(tab).map(c => `<button type="button" class="a-all-r" data-q="${esc(aNorm(c.title + ' ' + nm + ' ' + c.items.map(i => i[0] + ' ' + txt(i[1])).join(' ')))}" data-act="aFindGo" data-tab="${tab}" data-t="${esc(c.title)}"><b>${esc(c.title)}</b><small>${esc(nm)}</small></button>`).join('');
    }).join('');
    return `<section class="a-all-g" id="ag-${g[0]}"><h2>${ic(g[1], 'sm')} ${esc(g[2])}</h2><div class="a-all-list">${body}</div></section>`;
  }).join('');
  A(`<div class="a-all-top"><input class="input" id="all-q" type="search" autocomplete="off" placeholder="Lọc bảng này… (ví dụ: logo, momo, đang tắt, 120)"><span class="small faint" id="all-n"></span></div><div class="a-all-jump">${[['all', 'Tất cả']].concat(A_GROUPS.filter(g => g[0] !== 'all' && g[0] !== 'home').map(g => [g[0], g[2]])).map(([k, l]) => `<button type="button" class="a-chip a-pill ${(AS.allG || 'page') === k ? 'on' : ''}" data-act="allGroup" data-g="${k}">${esc(l)}</button>`).join('')}</div>${sec}<p class="small faint" id="all-none" hidden>Không có mục nào khớp.</p>`);
  allFilter();
}
function allFilter(){
  const q = aNorm(($('all-q') || {}).value || ''), words = q.split(' ').filter(Boolean); let n = 0, all = 0;
  document.querySelectorAll('#admin-body .a-all-r').forEach(r => { all++; const ok = words.every(w => (r.dataset.q || '').includes(w)); r.hidden = !ok; if (ok) n++; });
  const G = AS.allG || 'page';
  document.querySelectorAll('#admin-body .a-all-g').forEach(g => { g.hidden = (!q && G !== 'all' && g.id !== 'ag-' + G) || !g.querySelector('.a-all-r:not([hidden])'); });
  document.querySelectorAll('#admin-body .a-pill').forEach(b => b.classList.toggle('on', b.dataset.g === G));
  const nn = $('all-n'); if (nn) nn.textContent = q ? `${n}/${all} mục` : `${all} mục`;
  const no = $('all-none'); if (no) no.hidden = n > 0;
}
document.addEventListener('input', e => { if (e.target && e.target.id === 'all-q') allFilter(); });
Object.assign(ACTIONS, { allGroup:el => { AS.allG = el.dataset.g; const q = $('all-q'); if (q) q.value = ''; allFilter(); } });
function aNav(tab){
  const g = aGroupOf(tab), last = store.get('a_last', {}) || {}, pend = state.compPending ? ` <span class="count">${state.compPending}</span>` : '';
  return `<div class="a-nav"><div class="a-find"><label class="sr-only" for="a-find">Tìm nhanh mục cài đặt</label><span class="a-find-ic" aria-hidden="true">⌕</span><input class="input" id="a-find" type="text" autocomplete="off" placeholder="Tìm nhanh mục cài đặt… (logo, giá, momo, FAQ)"><div class="a-find-res" id="a-find-res" hidden></div></div>
    <nav class="a-groups" aria-label="Nhóm quản trị">${A_GROUPS.map(([k, icn, l, tabs]) => { const to = tabs.includes(last[k]) ? last[k] : tabs[0]; return `<a href="#/admin/${to}" class="${g[0] === k ? 'on' : ''}">${ic(icn, 'sm')} ${esc(l)}${k === 'people' ? pend : ''}</a>`; }).join('')}</nav>
    ${g[3].length > 1 ? `<nav class="a-tabs" aria-label="${esc(g[2])}">${g[3].map(k => `<a href="#/admin/${k}" class="${tab === k ? 'on' : ''}">${ic(A_TABS.find(x => x[0] === k)[1], 'sm')} ${esc(A_SUB[k][0])}${k === 'members' ? pend : ''}</a>`).join('')}</nav>` : ''}
    ${tab === 'all' ? '' : `<p class="a-desc small muted">${esc(A_SUB[tab][1])}</p>`}</div>`;
}

PAGES.admin = function(){
  if (!state.user) return page(`<div class="auth-wrap"><div class="card pad" style="text-align:center">${emptyBox('shield', 'Cần đăng nhập', 'Đăng nhập bằng tài khoản chủ trang để vào trang quản trị.')}<a class="btn primary" href="#/account">Đăng nhập</a></div></div>`);
  if (!state.isAdmin) return page(`<div class="auth-wrap"><div class="card pad stack"><div class="empty" style="padding:10px"><div class="ico">${ic('shield', 'lg')}</div><h3>${isAdminEmail(state.user) ? 'Cần xác minh email admin' : 'Tài khoản này không phải admin'}</h3></div>
    ${isAdminEmail(state.user)
      ? `<p class="muted small">Email <b>${esc(ADMIN_EMAIL)}</b> là email của chủ trang, nhưng cần được <b>xác minh</b> trước (để không ai khác mạo danh được). Mở hộp thư, bấm vào đường link trong email xác minh, rồi bấm nút bên dưới.</p>
         <div class="row"><button class="btn primary" data-act="recheckAdmin">${ic('check', 'sm')} Tôi đã xác minh rồi</button><button class="btn secondary" data-act="resendVerify">${ic('mail', 'sm')} Gửi lại email xác minh</button></div>`
      : `<p class="muted small">Chỉ tài khoản <b>${esc(ADMIN_EMAIL)}</b> mới có quyền quản trị. Bạn đang đăng nhập bằng <b>${esc(state.user.email)}</b>.</p><button class="btn secondary" data-act="signout">${ic('logout', 'sm')} Đăng xuất</button>`}</div></div>`);  const tab = A_TABS.some(x => x[0] === route.args[0]) ? route.args[0] : 'overview';
  page(`<div class="page-head a-top"><div><h1>Trang quản trị</h1><p class="faint small">Phiên bản web: ${esc(BUILD)} · mã ${esc(ASSET_V)}</p><div id="ver-note"></div></div><button class="btn primary" data-act="startEdit">${ic('pen', 'sm')} Sửa chữ & ảnh trên trang</button></div>
    ${aNav(tab)}<div id="admin-body"></div>`);
  document.querySelectorAll('.a-groups a.on, .a-nav .a-tabs a.on').forEach(a => { const p = a.parentNode; if (p.scrollWidth > p.clientWidth) p.scrollLeft = Math.max(0, a.offsetLeft - p.offsetLeft - 16); });
  aWatch(); if (AS.tab !== tab) { AS.dirty.clear(); AS.saved = {}; AS.pending = null; AS.open.clear(); AS.tab = tab; } aBar();
  { const g = aGroupOf(tab), last = store.get('a_last', {}) || {}; if (last[g[0]] !== tab) { last[g[0]] = tab; store.set('a_last', last); } }
  checkNewVersion();
  ({ overview:tabOverview, site:tabSite, schedule:tabSchedule, blog:tabBlog, music:tabMusic, products:tabProducts, gear:tabGear, orders:tabOrders, coupons:tabCoupons, trials:tabTrials, content:tabContent, reviews:tabReviews, payments:tabPayments, plan:tabPlan, season:tabSeason, members:tabMembers, all:tabAll })[tab]();
};
const reloadTab = () => { const f = ({ overview:tabOverview, site:tabSite, schedule:tabSchedule, blog:tabBlog, music:tabMusic, products:tabProducts, gear:tabGear, orders:tabOrders, coupons:tabCoupons, trials:tabTrials, content:tabContent, reviews:tabReviews, payments:tabPayments, plan:tabPlan, season:tabSeason, members:tabMembers })[route.args[0] || 'overview']; if (f) f(); };
/* chỉ cần SỐ lượng thì đừng đọc cả tài liệu (hồ sơ người dùng khá nặng): dùng count() nếu bản Firebase có, không thì đọc tối đa 50 và ghi "50+" */
const countDocs = async col => {
  if (DEMO) return { length:0, more:false };
  try { const q = db.collection(col); if (typeof q.count === 'function') { const n = (await q.count().get()).data().count; return { length:n, more:false }; } } catch (e) { console.warn('count', e.code); }
  const l = await getAll(col, null, 50); return { length:l.length, more:l.length >= 50 };
};
const getAll = (col, order, limit = 200) => DEMO ? Promise.resolve([]) : (order ? db.collection(col).orderBy(order, 'desc').limit(limit) : db.collection(col).limit(limit)).get().then(s => s.docs.map(d => ({ id:d.id, ...d.data() })));

/* =========================================================
   XUẤT BẢN DỮ LIỆU CHO NGƯỜI XEM (tiết kiệm lượt đọc Firebase — xem core.js "TIẾT KIỆM LƯỢT ĐỌC")
   Gộp giao diện, chữ, nhạc, bài viết (không kèm nội dung), sản phẩm, đánh giá, lịch live… vào settings/site.
   Tự chạy 4 giây sau mỗi lần admin lưu bất cứ thứ gì công khai; có nút "Xuất bản ngay" ở tab Tổng quan.
   ========================================================= */
const PUBLIC_COLS = ['settings', 'posts', 'products', 'reviews', 'weekly_schedules'], SITE_WEEKS = [-1, 0, 1, 2, 3, 4];
function plain(v){
  if (v && typeof v.toMillis === 'function') return v.toMillis();
  if (Array.isArray(v)) return v.map(plain);
  if (v && typeof v === 'object') { const o = {}; Object.keys(v).forEach(k => { if (v[k] !== undefined) o[k] = plain(v[k]); }); return o; }
  return v;
}
async function gatherSite(){
  const g = async id => { const d = await db.collection('settings').doc(id).get(); return d.exists ? d.data() : {}; };
  const [br, ct, pay, mu, ge, su, se] = await Promise.all(['branding', 'content', 'payments', 'music', 'gear', 'supporters', 'season'].map(g));
  const [ps, pr, rv] = await Promise.all([db.collection('posts').where('published', '==', true).get(), db.collection('products').where('active', '==', true).get(), db.collection('reviews').where('approved', '==', true).get()]);
  const postsFull = ps.docs.map(d => ({ id:d.id, ...d.data() }));
  const idx = postsFull.map(p => ({ id:p.id, slug:p.slug || p.id, title:p.title || {}, excerpt:p.excerpt || {}, cover:p.cover || '', category:p.category || '', tags:p.tags || [], pinned:!!p.pinned, publishAt:p.publishAt ? tsMs(p.publishAt) : null, createdAt:tsMs(p.createdAt), published:true,
    rm:Object.fromEntries(Object.entries(p.body || {}).filter(([, h]) => typeof h === 'string').map(([l, h]) => [l, readMins(h)])) })).sort((a, b) => b.createdAt - a.createdAt);
  const products_ = pr.docs.map(d => { const x = d.data(); delete x.updatedAt; return { id:d.id, ...x, createdAt:tsMs(x.createdAt) }; });
  const reviews_ = rv.docs.map(d => ({ id:d.id, ...d.data() })).sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt)).slice(0, 30).map(r => ({ id:r.id, name:r.name || '', rating:r.rating || 5, text:r.text || '', createdAt:tsMs(r.createdAt) }));
  const weeks = {}; await Promise.all(SITE_WEEKS.map(async off => { const key = weekKeyFor(off); const d = await db.collection('weekly_schedules').doc(key).get(); weeks[key] = d.exists ? (d.data().days || []) : null; }));
  const site = plain({ v:SITE_V, updatedAt:Date.now(), branding:br, content:ct, payments:pay, music:mu, gear:ge, supporters:su, posts:idx, products:products_, reviews:reviews_, weeks, season:se && se.id ? se : null });
  return { site, postsFull };
}
let pubTimer = null, pubBusy = false;
function schedulePublish(){ clearTimeout(pubTimer); pubTimer = setTimeout(() => publishSite(true), 4000); }
async function publishSite(quiet){
  if (DEMO || !state.isAdmin) return;
  if (pubBusy) return schedulePublish();
  pubBusy = true;
  try {
    const { site } = await gatherSite(); let note = '';
    const size = () => new Blob([JSON.stringify(site)]).size;           // tài liệu Firestore tối đa 1 MB
    while (size() > 900000 && site.reviews.length) site.reviews.pop();
    while (size() > 900000 && site.posts.length > 20) { site.posts.pop(); note = ' (đã bớt bài cũ khỏi trang người xem vì dữ liệu quá lớn)'; }
    await db.collection('settings').doc('site').set(site);
    store.set('site', { t:Date.now(), d:site });
    try { await db.collection('settings').doc('live').set({ t:site.updatedAt }); } catch (e) { console.warn('live signal', e); }   // báo cho người xem tải lại ngay
    if (quiet) toast('Đã cập nhật cho người xem ✔'); else ok('Đã xuất bản dữ liệu cho người xem ✔' + note);
    const st = $('pub-status'); if (st) st.textContent = 'Lần xuất bản gần nhất: ' + DT.fromMillis(site.updatedAt).toFormat('dd/MM/yyyy HH:mm') + ' · dung lượng ' + Math.round(size() / 1024) + ' KB';
  } catch (e) { console.warn('publish', e); if (!quiet) fail(e); }
  pubBusy = false;
}
async function syncMemberCount(){            // cập nhật số thành viên công khai (Tổng quan), tối đa 1 lần / 6 giờ mỗi máy admin
  if (DEMO || Date.now() - (store.get('memcount_at', 0) || 0) < 6 * 3600e3) return;
  try { const c = await countDocs('users'); if (c.more) return; await db.collection('site_stats').doc('members').set({ n:c.length, t:TS() }); store.set('memcount_at', Date.now()); } catch (e) { console.warn('member count', e.code || e); }
}
async function ensureSitePublished(){        // lần đầu (hoặc khi nâng cấp bản gộp) tự xuất bản, không cần admin làm gì
  if (DEMO) return;
  try { const d = await db.collection('settings').doc('site').get(); if (!d.exists || !((d.data().v || 0) >= SITE_V)) await publishSite(true); } catch (e) { console.warn('ensure site', e); }
}
(function hookWrites(){                        // mọi lần admin ghi dữ liệu công khai → tự xuất bản lại sau 4 giây
  try {
    const DR = firebase.firestore.DocumentReference.prototype;
    ['set', 'update', 'delete'].forEach(m => { const o = DR[m]; DR[m] = function (...a) {
      const p = o.apply(this, a);
      try { if (state.isAdmin && PUBLIC_COLS.includes(this.parent.id) && !(this.parent.id === 'settings' && (this.id === 'site' || this.id === 'live'))) p.then(schedulePublish, () => {}); } catch (e) {}
      return p; }; });
  } catch (e) { console.warn('hookWrites', e); }
})();
async function fallbackNow(){
  const { site, postsFull } = await gatherSite();
  const bodies = Object.fromEntries(postsFull.filter(p => p.body).map(p => [p.id, p.body]));
  const blob = new Blob([JSON.stringify(plain({ site, bodies }))], { type:'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'site-fallback.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
async function backupNow(){
  const { site, postsFull } = await gatherSite();
  const extra = {}; for (const c of ['coupons', 'companions', 'trial_codes', 'trial_redemptions']) { try { extra[c] = (await db.collection(c).get()).docs.map(d => ({ id:d.id, ...d.data() })); } catch (e) {} }
  const blob = new Blob([JSON.stringify(plain({ exportedAt:new Date().toISOString(), site, posts:postsFull, ...extra }), null, 1)], { type:'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'epstudyroom-backup-' + DT.now().toFormat('yyyy-MM-dd') + '.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
/* ---------------- Tổng quan ---------------- */
/* Thông báo đẩy: máy gửi là GitHub Actions (scripts/push-live.mjs) tự báo theo lịch live. Nút ở đây ghi push_admin/now,
   máy gửi thấy ở lần chạy kế tiếp (thường 5–15 phút). Cần nhanh hơn thì chạy tay workflow trên GitHub (khoảng 1 phút). */
const PUSH_WF = 'https://github.com/epstudyroomcontact-cloud/index.html/actions/workflows/push-live.yml';
const pushCard = () => aCard(`${ic('bell', 'sm')} Thông báo đẩy khi live`, !PUSH_VAPID
  ? `<p class="hint">Chưa bật. Làm theo SETUP.md, phần <b>Thông báo đẩy</b> (bật Cloud Messaging, dán khoá VAPID vào <code>js/firebase-config.js</code>, thêm secret trên GitHub). Chuông nhắc trong trang vẫn chạy bình thường.</p>`
  : `<p class="hint" style="margin-bottom:10px">Khách bật trong nút chuông sẽ nhận thông báo <b>kể cả khi đã đóng web</b>. Máy gửi tự báo khi buổi live theo lịch sắp bắt đầu (khoảng 5 phút trước, có thể trễ vài phút). Live đột xuất ngoài lịch thì bấm nút dưới đây.</p>
    <p class="small muted" id="push-status">Đang kiểm tra…</p>
    <div class="field mt-s"><label class="label" for="push-text">Nội dung (tuỳ chọn)</label><input class="input" id="push-text" maxlength="200" placeholder="Để trống: dùng câu mặc định theo ngôn ngữ của khách"></div>
    <div class="row mt-s"><button class="btn primary" data-act="pushNow">${ic('bell', 'sm')} Gửi thông báo live ngay</button><a class="btn secondary" href="${PUSH_WF}" target="_blank" rel="noopener">Gửi nhanh qua GitHub</a></div>
    <p class="hint">Nút <b>Gửi thông báo live ngay</b> đến tay khách sau khoảng 5–15 phút (lần chạy kế tiếp của máy gửi). Cần nhanh hơn: bấm <b>Gửi nhanh qua GitHub</b> → <b>Run workflow</b> (khoảng 1 phút). Nội dung tự nhập chỉ có một ngôn ngữ, nên viết ngắn bằng tiếng Anh hoặc cả hai thứ tiếng.</p>`);
async function tabOverview(){
  A('<p class="muted">Đang tải…</p>');
  let orders = [], users = null, signups = null, revs = [];   // null = chưa tải được (hiện dấu –, không hiện 0 làm bạn tưởng là không có ai)
  const R = await Promise.allSettled([getAll('orders', 'createdAt', 200), countDocs('users'), countDocs('challenge_signups'), getAll('reviews')]);
  const got = i => R[i].status === 'fulfilled' ? R[i].value : null;
  orders = got(0) || []; users = got(1); signups = got(2); revs = got(3) || [];
  const bad = R.filter(r => r.status !== 'fulfilled').length; R.forEach(r => { if (r.status !== 'fulfilled') console.warn('overview', r.reason && (r.reason.code || r.reason.message || r.reason)); });
  clearTimeout(tabOverview.t);
  if (bad && (tabOverview.tries = (tabOverview.tries || 0) + 1) <= 3) tabOverview.t = setTimeout(() => { if (route.name === 'admin' && $('ov-bad')) tabOverview(); }, 4000 * tabOverview.tries);   // mạng chậm: tự thử lại tối đa 3 lần
  else if (!bad) tabOverview.tries = 0;
  if (DEMO) { orders = [{ code:'EP-DEMO1', total:79000, currency:'VND', status:'paid', buyer:{ name:'Linh', email:'linh@mail.com' }, items:[{ name:'30-Day Study Planner (PDF)', qty:1 }], createdAt:Date.now() }, { code:'EP-DEMO2', total:2.5, currency:'USD', status:'pending', buyer:{ name:'Daniel', email:'d@mail.com' }, items:[{ name:'Mascot sticker pack', qty:1 }], createdAt:Date.now() - 3600000 }]; users = [{}, {}, {}]; signups = [{}, {}]; revs = [{ approved:false }]; }
  const paid = orders.filter(o => ['paid', 'shipped'].includes(o.status)), rev = cur => paid.filter(o => o.currency === cur).reduce((a, o) => a + (+o.total || 0), 0);
  const kpi = (icn, l, v, s = '') => `<div class="card tile"><span class="t-ic">${ic(icn)}</span><span class="t-l">${l}</span><span class="t-v">${v}</span><span class="t-s">${s}</span></div>`;
  A(`${bad ? `<div class="card pad row between" id="ov-bad" style="margin-bottom:14px;border-color:#f59e0b;gap:10px;flex-wrap:wrap"><span class="small">⚠ ${bad} mục số liệu chưa tải được (mạng chậm hoặc Firebase đang bận). Ô hiện dấu <b>–</b> là chưa có số liệu, không phải bằng 0. Web tự thử lại vài lần.</span><button class="btn secondary sm" data-act="adminReload">Tải lại ngay</button></div>` : ''}<div class="row between small faint" style="margin:-4px 0 8px"><span>Số liệu lúc ${DT.now().setZone(VN).toFormat('HH:mm:ss')}</span><button class="btn ghost sm" data-act="adminReload">${ic('reset', 'sm')} Tải lại</button></div>${state.compPending ? `<div class="card pad row between" style="margin-bottom:14px;border-color:var(--accent)"><b>${ic('heart', 'sm')} ${state.compPending} yêu cầu Người đồng hành đang chờ bạn duyệt</b><a class="btn primary sm" href="#/admin/members">Xem và duyệt</a></div>` : ''}<div class="grid g4 keep2">${kpi('credit', 'Doanh thu (đã thanh toán)', money(rev('VND'), 'VND'), rev('USD') ? money(rev('USD'), 'USD') : '')}${kpi('box', 'Đơn chờ xác nhận', orders.filter(o => o.status === 'pending').length, orders.length + ' đơn gần đây')}${kpi('users', 'Thành viên', users ? users.length + (users.more ? '+' : '') : '–', (signups ? signups.length + (signups.more ? '+' : '') : '–') + ' đăng ký Challenge')}${kpi('star', 'Đánh giá chờ duyệt', revs.filter(r => !r.approved).length, revs.length + ' tổng')}</div>
    <div class="grid g2 mt">${aCard('Đơn hàng mới nhất', orders.length ? `<div class="tbl-wrap"><table class="table"><tr><th>Mã</th><th>Khách</th><th>Tổng</th><th>Trạng thái</th></tr>${orders.slice(0, 8).map(o => `<tr><td class="mono">${esc(o.code)}</td><td>${esc(o.buyer && o.buyer.name || '')}<div class="small"><b>${esc(o.buyer && o.buyer.email || '')}</b></div></td><td>${money(o.total, o.currency)}</td><td><span class="badge ${['paid', 'shipped'].includes(o.status) ? 'live' : o.status === 'cancelled' ? 'danger' : 'warn'}">${esc(o.status)}</span></td></tr>`).join('')}</table></div>` : '<p class="muted">Chưa có đơn hàng.</p>', '<a class="link" href="#/admin/orders">Xem tất cả</a>')}
    ${aCard('Dữ liệu cho người xem & bản sao dự phòng', `<p class="hint" style="margin-bottom:10px">Để web chạy nhanh và <b>không vượt hạn mức miễn phí của Firebase</b>, dữ liệu công khai (giao diện, chữ, bài viết, sản phẩm, lịch live, nhạc…) được gộp thành một bản cho người xem. Bản này <b>tự cập nhật vài giây sau mỗi lần bạn bấm Lưu</b>. Người xem thấy thay đổi trong vòng khoảng 10 phút (hoặc ngay khi họ tải lại sau đó). Bạn không cần làm gì thêm.</p>
      <p class="small muted" id="pub-status">Đang kiểm tra…</p>
      <div class="row mt-s"><button class="btn primary" data-act="publishNow">Xuất bản ngay</button><button class="btn secondary" data-act="backupNow">Tải bản sao dữ liệu (file .json)</button><button class="btn secondary" data-act="fallbackNow">Tải file dự phòng cho web</button></div>
      <p class="hint"><b>File dự phòng cho web</b> (tuỳ chọn): tải file <code>site-fallback.json</code> rồi đưa lên GitHub, để <b>cùng chỗ với file index.html</b>. Nếu Firebase hết hạn mức hoặc gặp sự cố, người mới vào web vẫn thấy đủ nội dung từ file này (không tốn lượt đọc nào). Nên tải lại khi bạn đăng bài hoặc đổi lịch nhiều.</p><p class="hint">Nên tải bản sao dữ liệu khoảng mỗi tuần và cất vào ổ đĩa của bạn: bài viết, sản phẩm, cài đặt nằm trong Firebase, đây là bản dự phòng nếu có sự cố.</p>`)}
    ${pushCard()}`);
  onairMount();
  if (!DEMO && PUSH_VAPID) db.collection('push_admin').doc('status').get().then(d => { const st = $('push-status'); if (st) st.textContent = d.exists ? `Lần gửi gần nhất: ${DT.fromMillis(d.data().at).toFormat('dd/MM/yyyy HH:mm')} (${d.data().label}) · ${d.data().ok}/${d.data().devices} máy nhận${d.data().removed ? ` · đã dọn ${d.data().removed} máy đã tắt thông báo` : ''}` : 'Chưa gửi lần nào.'; }).catch(() => {});
  if (!DEMO) db.collection('settings').doc('site').get().then(d => { const st = $('pub-status'); if (st) st.textContent = d.exists ? 'Lần xuất bản gần nhất: ' + DT.fromMillis(d.data().updatedAt).toFormat('dd/MM/yyyy HH:mm') : 'Chưa xuất bản lần nào. Bấm "Xuất bản ngay".'; }).catch(() => {});
}

/* ---------------- Giao diện & Menu ---------------- */
let adminNav = [], adminSocial = [], adminVideos = [];
const HOME_SECTIONS = [['hero', 'Khối chào (hero)'], ['about', 'Giới thiệu chủ kênh'], ['stats', 'Thẻ thống kê'], ['today', 'Buổi live hôm nay'], ['blog', 'Bài viết mới'], ['shop', 'Sản phẩm nổi bật'], ['thanks', 'Lời cảm ơn người đồng hành'], ['challenge', 'Đăng ký Challenge 30 ngày'], ['faq', 'Câu hỏi thường gặp & đánh giá']];
const homeOn = k => { const hs = branding.homeSections || {}; return k === 'faq' && hs.faq === undefined ? hs.about !== false : hs[k] !== false; };
function homeRows(order){
  const lab = Object.fromEntries(HOME_SECTIONS);
  return order.map((k, i) => `<div class="nav-edit" data-hk="${k}"><span class="row" style="gap:2px;flex-wrap:nowrap"><button type="button" class="btn ghost icon sm" data-act="homeMove" data-i="${i}" data-d="-1" aria-label="up">${ic('up', 'sm')}</button><button type="button" class="btn ghost icon sm" data-act="homeMove" data-i="${i}" data-d="1" aria-label="down">${ic('down', 'sm')}</button></span><label class="row small" style="font-weight:600;flex:1"><input type="checkbox" data-hs="${k}" ${homeOn(k) ? 'checked' : ''}> ${lab[k]}</label></div>`).join('');
}
const SWATCHES = ['#ff3d9a', '#ff2d55', '#ff4fd8', '#b45cff', '#4d7cff', '#00d4e6', '#2ee66b', '#ffb21f'];
function imgField(label, id, v, hint){ return `<div class="field"><label class="label" for="${id}">${label}</label><div class="row" style="flex-wrap:nowrap"><input class="input" id="${id}" value="${esc(v || '')}" placeholder="https://… hoặc bấm Chọn ảnh"><button type="button" class="btn secondary" data-act="pickInto" data-target="${id}">${ic('image', 'sm')} Chọn ảnh</button></div>${hint ? `<div class="hint">${hint}</div>` : ''}</div>`; }
function tabSite(){
  adminNav = navItems().map(n => ({ ...n })); adminSocial = Object.entries(branding.socialLinks || {}); adminVideos = (branding.videos || []).map(v => ({ ...v }));
  A(`${aCard('Thương hiệu & màu sắc', `<div class="f2">${fld('Tên trang', 'ad-name', branding.name)}${selectF('Theme mặc định cho khách', 'ad-theme', [['rain', 'Đêm mưa (tối, hồng neon)'], ['pop', 'Rực rỡ (sáng)'], ['violet', 'Tím neon'], ['teal', 'Xanh bão + vàng']], branding.defaultTheme || 'rain')}</div>
      <div class="f2 mt-s"><div class="field"><label class="label">Màu chủ đạo (cho theme Đêm mưa & Rực rỡ)</label><input class="input" type="color" id="ad-color" value="${/^#[0-9a-f]{6}$/i.test(branding.themeColor) ? branding.themeColor : '#ff3d9a'}"><div class="swatches mt-s">${SWATCHES.map(c => `<button type="button" style="background:${c}" data-act="swatch" data-c="${c}" aria-label="${c}"></button>`).join('')}</div></div>
      ${selectF('Cặp font chữ', 'ad-font', Object.entries(FONTS).map(([k, f]) => [k, f.label]), branding.font || 'baloo')}</div>
      <div class="f2 mt-s">${imgField('Logo (ảnh vuông)', 'ad-logo', branding.logoUrl, 'Để trống = chữ viết tắt tên trang')}${imgField('Ảnh bìa trang chủ (hero)', 'ad-mascot', branding.mascotUrl, 'Để trống = tranh phong cảnh vẽ sẵn. Bạn cũng có thể đổi ảnh của từng trang bằng nút ✏️ (sửa trực tiếp)')}</div>
      <div class="row mt"><button class="btn primary" data-act="saveBrand">Lưu thương hiệu</button></div>`)}
    ${aCard('Menu điều hướng (thanh bên)', `<div id="nav-list">${navRows()}</div><div class="row mt"><button class="btn secondary sm" data-act="navAddLink">${ic('plus', 'sm')} Thêm liên kết ngoài</button><button class="btn primary" data-act="saveNav">Lưu menu</button></div><p class="hint">Bỏ tích để ẩn mục. Ô tên để trống = dùng tên mặc định theo ngôn ngữ của khách.</p>`)}
    ${aCard('Bố cục trang chủ', `<p class="hint" style="margin-top:0">Dùng mũi tên để đổi vị trí từng khối, bỏ tích để ẩn. Chữ và ảnh trong mỗi khối sửa trực tiếp bằng nút ✏️ ở góc trang.</p><div id="home-list">${homeRows(homeOrder())}</div><div class="row mt"><button class="btn secondary sm" data-act="homeReset">Về thứ tự mặc định</button><button class="btn primary" data-act="saveHome">Lưu bố cục</button></div>`)}
    ${aCard('Quyền truy cập (bắt buộc đăng nhập)', `<label class="row" style="font-weight:700;align-items:flex-start"><input type="checkbox" id="ad-reqlogin" style="margin-top:4px" ${branding.requireLogin !== false ? 'checked' : ''}> <span>Khách phải đăng nhập / tạo tài khoản để tham gia<br><span class="hint">Khách chưa đăng nhập vẫn thấy tất cả các mục trong menu (có biểu tượng ổ khoá), nhưng khi mở mục bị khoá thì chỉ thấy tiêu đề và lời mời đăng nhập hoặc tạo tài khoản miễn phí.</span></span></label>
      <label class="label mt">Những mục cần đăng nhập (tích = khoá với khách)</label><div class="grid g3">${LOCKABLE.map(k => `<label class="row small" style="font-weight:600"><input type="checkbox" data-lp="${k}" ${lockedPages().includes(k) ? 'checked' : ''}> ${esc(t('nav_' + k))}</label>`).join('')}</div>
      <div class="row mt"><button class="btn primary" data-act="saveAccess">Lưu</button></div>`)}
    ${aCard('Thông báo chạy chữ & Mạng xã hội', `<div class="f2">${fld('Thông báo (Tiếng Việt)', 'ad-ann-vi', (branding.announcement || {}).vi || '', '', 'Để trống = ẩn. Viết ở ô nào cũng được, ô kia và mọi ngôn ngữ khác tự dịch khi bấm Lưu')}${fld('Announcement (English)', 'ad-ann-en', (branding.announcement || {}).en || '')}</div>
      <label class="label mt">Mạng xã hội (hiện ở trang Giới thiệu)</label><div id="social-list">${socialRows()}</div><div class="row mt"><button class="btn secondary sm" data-act="socialAdd">${ic('plus', 'sm')} Thêm</button><button class="btn primary" data-act="saveSocial">Lưu</button></div>`)}
    ${aCard('YouTube', `<div class="f2">${fld('Channel ID (UC…)', 'ad-ytch', branding.ytChannelId || '', '', 'Dùng để nhúng live hiện tại và tự lấy video mới nhất')}${fld('Link / ID video live cụ thể', 'ad-ytlive', branding.ytLiveId || '', '', 'Tuỳ chọn — nếu điền sẽ ưu tiên hơn Channel ID')}</div>
      ${fld('Link kênh / link live (nút "Mở trên YouTube")', 'ad-liveurl', (branding.contacts || {}).live || '')}
      <label class="label mt">Video thêm thủ công</label><div id="video-list">${videoRows()}</div><div class="row mt"><button class="btn secondary sm" data-act="videoAdd">${ic('plus', 'sm')} Thêm video</button><button class="btn primary" data-act="saveYT">Lưu YouTube</button></div>`)}`);
}
function navRows(){
  return adminNav.map((n, i) => `<div class="nav-edit" data-i="${i}"><span class="row" style="gap:2px;flex-wrap:nowrap"><button type="button" class="btn ghost icon sm" data-act="navMove" data-i="${i}" data-d="-1" aria-label="up">${ic('up', 'sm')}</button><button type="button" class="btn ghost icon sm" data-act="navMove" data-i="${i}" data-d="1" aria-label="down">${ic('down', 'sm')}</button></span>
    <label class="row small" style="font-weight:700;min-width:96px"><input type="checkbox" class="nv-vis" ${n.visible !== false ? 'checked' : ''}> ${esc(n.custom ? 'Liên kết' : t('nav_' + n.id))}</label>
    <input class="input nv-vi" placeholder="Tên (VI)" value="${esc(n.label && n.label.vi || '')}"><input class="input nv-en" placeholder="Name (EN)" value="${esc(n.label && n.label.en || '')}">
    ${n.custom ? `<input class="input nv-url" placeholder="https://…" value="${esc(n.url || '')}"><button type="button" class="btn danger icon sm" data-act="navDel" data-i="${i}" aria-label="xoá">${ic('trash', 'sm')}</button>` : ''}</div>`).join('');
}
function readNav(){
  return [...document.querySelectorAll('#nav-list .nav-edit')].map(r => { const o = adminNav[+r.dataset.i], vi = r.querySelector('.nv-vi').value.trim(), en = r.querySelector('.nv-en').value.trim(), n = { ...o, visible:r.querySelector('.nv-vis').checked }; if (vi || en) n.label = { vi, en }; else delete n.label; if (o.custom) n.url = r.querySelector('.nv-url').value.trim(); return n; });
}
const socialRows = () => adminSocial.map(([n, u], i) => `<div class="row" style="flex-wrap:nowrap;margin-bottom:8px"><input class="input so-n" style="max-width:150px" placeholder="Tên (YouTube…)" value="${esc(n)}"><input class="input so-u" placeholder="https://…" value="${esc(u)}"><button type="button" class="btn danger icon sm" data-act="socialDel" data-i="${i}" aria-label="xoá">${ic('trash', 'sm')}</button></div>`).join('') || '<div class="hint">Chưa có.</div>';
const videoRows = () => adminVideos.map((v, i) => `<div class="row" style="flex-wrap:nowrap;margin-bottom:8px"><input class="input vd-u" placeholder="https://youtu.be/…" value="${esc(v.url || '')}"><input class="input vd-t" placeholder="Tiêu đề" value="${esc(v.title || '')}"><button type="button" class="btn danger icon sm" data-act="videoDel" data-i="${i}" aria-label="xoá">${ic('trash', 'sm')}</button></div>`).join('') || '<div class="hint">Chưa có.</div>';
const readSocial = () => [...document.querySelectorAll('#social-list .row')].map(r => [r.querySelector('.so-n').value.trim(), r.querySelector('.so-u').value.trim()]);
const readVideos = () => [...document.querySelectorAll('#video-list .row')].map(r => ({ url:r.querySelector('.vd-u').value.trim(), title:r.querySelector('.vd-t').value.trim() }));

/* ---------------- Lịch live ---------------- */
let adminDays = [];
async function tabSchedule(){
  A('<p class="muted">Đang tải…</p>');
  let raw = weekDocs[weekOffset] || null;
  if (!DEMO) { try { const d = await db.collection('weekly_schedules').doc(weekKeyFor(weekOffset)).get(); raw = d.exists ? d.data().days : null; } catch (e) { raw = null; } } else raw = demoWeek(weekOffset);
  adminDays = Array.from({ length:7 }, (_, i) => { const d = normDay((raw || [])[i]); d.slots.forEach(s => { if (!s.pomo) s.pomo = cleanPomo(PRESETS.classic); }); return d; });
  drawSchedule();
}
const slotTotal = s => planMins(slotSegs({ plan:s.plan, pomo:cleanPomo(s.pomo) }));
const BLK = { f:['Tập trung', 'var(--seg-focus)', 25], s:['Nghỉ ngắn', 'var(--seg-short)', 5], l:['Nghỉ dài', 'var(--seg-long)', 15], p:['Chuẩn bị & chào', 'var(--seg-prep)', 20] };
function planEditor(di, si, s){
  return `<div class="ad-blocks mt-s"><div class="hint">Mỗi dòng là một đoạn của buổi live, theo thứ tự. Bạn thêm bao nhiêu đoạn tập trung / nghỉ ngắn / nghỉ dài tuỳ ý, độ dài mỗi đoạn khác nhau.</div>
    ${s.plan.map((b, bi) => `<div class="blk"><i class="dot" style="background:${BLK[b.t][1]}"></i><select class="select" data-d="${di}" data-s="${si}" data-b="${bi}" data-f="bt">${['f', 's', 'l', 'p'].map(k => `<option value="${k}" ${b.t === k ? 'selected' : ''}>${BLK[k][0]}</option>`).join('')}</select>
      <input class="input" maxlength="40" placeholder="Tên đoạn (tuỳ chọn)" data-d="${di}" data-s="${si}" data-b="${bi}" data-f="bn" value="${esc(b.nm || '')}">
      <input class="input" type="number" min="1" data-d="${di}" data-s="${si}" data-b="${bi}" data-f="bm" value="${b.m}" title="phút"><span class="row" style="gap:2px;flex-wrap:nowrap"><button type="button" class="btn ghost icon sm" data-act="blkMove" data-d="${di}" data-s="${si}" data-b="${bi}" data-dir="-1">${ic('up', 'sm')}</button><button type="button" class="btn ghost icon sm" data-act="blkMove" data-d="${di}" data-s="${si}" data-b="${bi}" data-dir="1">${ic('down', 'sm')}</button><button type="button" class="btn danger icon sm" data-act="blkDel" data-d="${di}" data-s="${si}" data-b="${bi}">${ic('trash', 'sm')}</button></span></div>`).join('')}
    <div class="row mt-s"><button type="button" class="btn secondary sm" data-act="blkAdd" data-d="${di}" data-s="${si}" data-t="f">+ Tập trung</button><button type="button" class="btn secondary sm" data-act="blkAdd" data-d="${di}" data-s="${si}" data-t="s">+ Nghỉ ngắn</button><button type="button" class="btn secondary sm" data-act="blkAdd" data-d="${di}" data-s="${si}" data-t="l">+ Nghỉ dài</button><button type="button" class="btn secondary sm" data-act="blkAdd" data-d="${di}" data-s="${si}" data-t="p">+ Chuẩn bị & chào</button></div></div>`;
}
const presetOf = p => Object.keys(PRESETS).find(k => Object.keys(PRESETS[k]).every(f => PRESETS[k][f] === p[f])) || 'custom';
function drawSchedule(){
  const ws = weekStart(weekOffset);
  A(`<div class="row between" style="margin-bottom:16px"><div class="week-nav"><button class="btn secondary icon" data-act="aweek" data-d="-1">${ic('chev-l')}</button><span class="lbl">${ws.toFormat('dd/MM')} – ${ws.plus({ days:6 }).toFormat('dd/MM/yyyy')}</span><button class="btn secondary icon" data-act="aweek" data-d="1">${ic('chev-r')}</button></div>
    <div class="row"><button class="btn secondary sm" data-act="copyPrev">Sao chép từ tuần trước</button><button class="btn primary" data-act="saveSched">Lưu lịch tuần này</button></div></div>
    <p class="hint" style="margin:-6px 0 14px">Giờ nhập theo giờ Việt Nam. Khách sẽ thấy giờ đã quy đổi sang múi giờ của họ.</p>
    ${adminDays.map((day, di) => `<div class="ad-day"><div class="row between"><b>${esc(DAYS.vi[di])} · ${ws.plus({ days:di }).toFormat('dd/MM')}</b><span class="row"><label class="chk row small" style="font-weight:700"><input type="checkbox" data-d="${di}" data-f="cancelled" ${day.cancelled ? 'checked' : ''}> Huỷ cả ngày</label><button type="button" class="btn secondary sm" data-act="dayAll" data-d="${di}">Áp dụng cho cả tuần</button></span></div>
      <div class="f2 mt-s"><input class="input" placeholder="Lý do (VI)" data-d="${di}" data-f="noteVi" value="${esc(day.cancelNote.vi || '')}"><input class="input" placeholder="Reason (EN)" data-d="${di}" data-f="noteEn" value="${esc(day.cancelNote.en || '')}"></div>
      ${day.slots.map((s, si) => `<div class="ad-slot"><div class="f3"><input class="input" type="time" data-d="${di}" data-s="${si}" data-f="time" value="${esc(s.time)}"><input class="input" placeholder="Tiêu đề (tuỳ chọn)" data-d="${di}" data-s="${si}" data-f="title" value="${esc(s.title)}">
        <select class="select" data-d="${di}" data-s="${si}" data-f="mode"><option value="pomo" ${s.plan ? '' : 'selected'}>Mẫu Pomodoro (tự tính)</option><option value="plan" ${s.plan ? 'selected' : ''}>Tự sắp xếp từng đoạn</option></select></div>
        ${s.plan ? planEditor(di, si, s) : `<select class="select mt-s" data-d="${di}" data-s="${si}" data-f="preset">${[['classic', 'Classic 25/5/15 ×4'], ['deep', 'Deep 50/10/30 ×3'], ['marathon', 'Marathon 90/15/30 ×2'], ['custom', 'Tuỳ chỉnh các số bên dưới']].map(([k, lb]) => `<option value="${k}" ${presetOf(s.pomo) === k ? 'selected' : ''}>${lb}</option>`).join('')}</select>
        <div class="f5 mt-s">${[['prep', 'Chào & chuẩn bị (p)'], ['focus', 'Focus (p)'], ['short', 'Nghỉ (p)'], ['long', 'Nghỉ dài (p)'], ['rounds', 'Số phiên'], ['longEvery', 'Nghỉ dài mỗi']].map(([f, lb]) => `<div class="field"><label class="label">${lb}</label><input class="input" type="number" min="0" data-d="${di}" data-s="${si}" data-f="p_${f}" value="${s.pomo[f]}"></div>`).join('')}</div>`}
        <div class="row between mt-s"><span class="small faint mono" id="tot-${di}-${si}">⏱ ${slotTotal(s)} phút ≈ ${(slotTotal(s) / 60).toFixed(2)} giờ</span><span class="row"><label class="chk row small" style="font-weight:700"><input type="checkbox" data-d="${di}" data-s="${si}" data-f="cancelled" ${s.cancelled ? 'checked' : ''}> Huỷ buổi này</label><button type="button" class="btn danger sm" data-act="rmSlot" data-d="${di}" data-s="${si}">Xoá</button></span></div>
        <div class="f2 mt-s"><input class="input" placeholder="Lý do huỷ (VI)" data-d="${di}" data-s="${si}" data-f="noteVi" value="${esc(s.cancelNote.vi || '')}"><input class="input" placeholder="Cancel reason (EN)" data-d="${di}" data-s="${si}" data-f="noteEn" value="${esc(s.cancelNote.en || '')}"></div></div>`).join('')}
      ${day.slots.length < 4 ? `<button type="button" class="btn secondary sm mt-s" data-act="addSlot" data-d="${di}">${ic('plus', 'sm')} Thêm buổi live</button>` : ''}</div>`).join('')}`);
  onairMount();
}
/* ---------------- Bắt đầu buổi live thật (settings/onair) ----------------
   Lịch chỉ là giờ dự kiến. Lúc thật sự lên sóng thì bấm "Bắt đầu buổi live bây giờ" để lưu giờ bắt đầu THẬT của buổi:
   - web (core.js) dời buổi đó theo giờ thật và chỉ lúc này mới báo "Đang live" + thông báo đẩy (scripts/push-live.mjs);
     chưa bấm thì quá giờ lịch web chỉ hiện "Sắp bắt đầu".
   - bảng lịch và bộ đếm trên OBS (overlay.html) cũng dời cả buổi theo mốc này (đọc lại khoảng 10 giây một lần). Lịch gốc trong tuần không bị sửa.
   settings/onair = { start: giờ bắt đầu thật (ms), sched: giờ bắt đầu theo lịch của buổi đó (ms), at, prev: giá trị trước lần bấm gần nhất (để hoàn tác) }
   — ai cũng đọc được, chỉ admin ghi (firestore.rules: settings). Hoàn tác ghi lại đúng at cũ, nên OBS quay về đúng giờ trước đó (kể cả giờ do bấm Start Streaming). */
let onair = null, onairUnsub = null;
// Mốc chỉ còn hiệu lực khi giờ thật lệch lịch < 12 tiếng (mốc của hôm qua, vd "trễ 1444 phút", coi như không có).
// Buổi đã bấm bắt đầu và đã chạy hết giờ thì không coi là "đang chạy" nữa: ngày có 2 buổi, ô này chuyển sang buổi kế tiếp (không bắt đầu lại buổi sáng).
// So khớp theo giờ lịch (x.sched), vì x.start của buổi đã bấm bắt đầu là giờ thật (core.js getItems).
const onairRan = () => { if (!onair || !onair.start || Math.abs(onair.start - onair.sched) > 12 * 3600e3) return null;
  return upcomingPool().find(x => x.sched.toMillis() === onair.sched) || null; };
const onairMatch = () => { const x = onairRan(); return x && Date.now() < onair.start + x.mins * 60e3 ? x : null; };
const onairNext = () => { const now = Date.now(), done = onairMatch() ? null : onairRan();
  return upcomingPool().filter(x => !(done && x.key === done.key) && x.end.toMillis() + 3600e3 > now && x.start.toMillis() - 18 * 3600e3 < now).sort((a, b) => a.start.toMillis() - b.start.toMillis())[0] || null; };
function onairCard(){
  const m = onairMatch(), x = m || onairNext(), hm = d => d.setZone(VN).toFormat('HH:mm');
  const now = Date.now(), prev = onair && onair.prev && now - (onair.at || 0) < 3 * 3600e3 ? onair.prev : null;
  const undo = prev ? `<div class="row mt-s"><button class="btn ghost sm" data-act="onairUndo">↶ Quay về giờ trước đó${prev.start ? ` (bắt đầu ${hm(DT.fromMillis(prev.start))})` : ''}</button></div>` : '';
  let body;
  if (!x) body = `<p class="muted small">Trong lịch không có buổi live nào trong khoảng 18 giờ tới. Thêm buổi ở tab Lịch live trước.</p>`;
  else if (m) {
    const st = DT.fromMillis(onair.start), d = Math.round((onair.start - onair.sched) / 60e3);
    body = `<p>Đã bắt đầu lúc <b>${hm(st)}</b> (lịch ghi ${hm(x.sched)}${d ? `, ${d > 0 ? 'trễ' : 'sớm'} ${Math.abs(d)} phút` : ''}). Web đang báo <b>Đang live</b>, lịch trên web và bộ đếm trên OBS chạy theo giờ này, kết thúc lúc <b>${hm(st.plus({ minutes:x.mins }))}</b>.</p>
      <div class="row mt-s"><span class="small muted">Chỉnh lại giờ bắt đầu:</span>${[-5, -1, 1, 5].map(n => `<button class="btn secondary sm" data-act="onairShift" data-m="${n}">${n > 0 ? '+' : '−'}${Math.abs(n)} phút</button>`).join('')}</div>
      <div class="row mt-s"><button class="btn secondary sm" data-act="onairStart">Bắt đầu lại từ bây giờ</button><button class="btn ghost sm" data-act="onairClear">Huỷ bắt đầu (chưa live)</button></div>` + undo;
  } else body = `<p>${now >= x.start.toMillis() ? `Đã tới giờ lịch nhưng <b>chưa bắt đầu</b>` : 'Buổi tiếp theo theo lịch'}: <b>${hm(x.start)} – ${hm(x.end)}</b>${x.slot.title ? ` · ${esc(x.slot.title)}` : ''}.</p>
      <p class="hint">${now >= x.start.toMillis() ? 'Web đang hiện <b>Sắp bắt đầu</b> (chưa báo đang live). ' : ''}Lúc thật sự lên sóng thì bấm nút dưới: web mới báo <b>Đang live</b> và gửi thông báo, lịch trên web và bộ đếm OBS tính lại cả buổi từ lúc bấm (khoảng 10 giây). Start Streaming trong OBS chỉ dời bộ đếm OBS, không báo live trên web.</p>
      <button class="btn primary mt-s" data-act="onairStart">${ic('play', 'sm')} Bắt đầu buổi live bây giờ</button>
      <div class="row mt-s" style="align-items:center"><span class="small muted">Đã bấm Start Streaming trong OBS cách đây</span><input class="input" id="onairAgo" type="number" min="0" max="180" value="0" style="width:84px"><span class="small muted">phút</span><button class="btn secondary sm" data-act="onairStartAgo">Bắt đầu, tính từ lúc đó</button></div>` + undo;
  const note = (onair && onair.note) || '';
  body += `<div class="mt" style="border-top:1px dashed var(--line,#ddd);padding-top:12px"><label class="small"><b>Thông báo trên OBS</b> <span class="muted">(hiện nổi bật trên bảng lịch cho người xem, ví dụ mục tiêu hôm nay, nội quy, lời nhắn; để trống là ẩn)</span></label>
      <textarea class="textarea" id="onairNote" maxlength="300" style="min-height:60px;margin-top:6px" placeholder="VD: Mục tiêu hôm nay: xong 10 phiên 🔥  ·  Nhớ uống nước nha!">${esc(note)}</textarea>
      <div class="row mt-s"><button class="btn primary sm" data-act="onairNote">Lưu thông báo</button>${note ? `<button class="btn ghost sm" data-act="onairNoteClear">Ẩn thông báo</button>` : ''}</div></div>`;
  body += obsKeyHTML();
  return `<div id="onair" style="margin-bottom:16px">${aCard(`${ic('timer', 'sm')} Bắt đầu buổi live`, body)}</div>`;
}
/* Khoá OBS: để bảng lịch / bộ đếm trong OBS tự báo web "Đang live" lúc bấm Start Streaming (xem core.js obsWatch, overlay.js tellWeb, firestore.rules obs_signal).
   Khoá nằm ở private/obs (chỉ admin đọc được). Link trong OBS thêm &k=<khoá>. */
let obsKey;   // undefined = đang tải, '' = chưa tạo, 'err' = chưa đọc được (thường do chưa dán luật bảo mật mới)
function obsKeyHTML(){
  const top = `<div class="mt" id="obs-key" style="border-top:1px dashed var(--line,#ddd);padding-top:12px"><b class="small">Tự báo live theo OBS</b>`;
  if (obsKey === undefined) return `${top}<p class="hint">Đang kiểm tra…</p></div>`;
  if (obsKey === 'err') return `${top}<p class="hint">Chưa dùng được: cần dán luật bảo mật mới nhất lên Firebase (SETUP.md, mục 22.s), rồi tải lại trang này.</p></div>`;
  if (!obsKey) return `${top}<p class="hint">Bật tính năng này thì khi bạn bấm <b>Start Streaming</b> trong OBS, web tự báo <b>Đang live</b> đúng giờ đó (khi bạn đang mở web bằng tài khoản admin), không phải bấm hay nhập phút.</p><button class="btn secondary sm" data-act="obsKeyMake">Tạo khoá OBS</button></div>`;
  return `${top}<p class="hint">Đã bật. Trong OBS, ở <b>mỗi</b> nguồn Browser (bảng lịch, bộ đếm), thêm đoạn dưới vào <b>cuối</b> link rồi lưu. Khoá chỉ bạn thấy, đừng gửi cho ai.</p>
    <div class="row" style="flex-wrap:nowrap"><input class="input mono" id="obs-key-val" readonly value="&k=${esc(obsKey)}" onclick="this.select()"><button class="btn secondary sm" data-act="obsKeyCopy">Chép</button></div>
    <p class="hint">Ví dụ: <code>…/overlay.html?view=timer<b>&k=…</b></code>. Đổi khoá mới thì phải sửa lại link trong OBS. <button type="button" class="btn ghost sm" data-act="obsKeyMake">Tạo khoá mới</button></p></div>`;
}
async function obsKeyMount(){
  if (DEMO) { obsKey = ''; } else { try { const d = await db.collection('private').doc('obs').get(); obsKey = d.exists && d.data().k ? d.data().k : ''; } catch (e) { console.warn('obs key', e.code); obsKey = 'err'; } }
  const el = $('obs-key'); if (el) el.outerHTML = obsKeyHTML();
}
function onairMount(){
  const b = $('admin-body'); if (!b) return;
  if (obsKey === undefined) obsKeyMount();
  const old = $('onair'); if (old) old.outerHTML = onairCard(); else b.insertAdjacentHTML('afterbegin', onairCard());
  if (!onairUnsub && !DEMO) onairUnsub = db.collection('settings').doc('onair').onSnapshot(d => { onair = d.exists ? d.data() : null; const el = $('onair'); if (el && document.activeElement !== $('onairNote')) el.outerHTML = onairCard(); }, e => console.warn('onair', e.code));
}
const onairSnap = () => ({ start:(onair && onair.start) || 0, sched:(onair && onair.sched) || 0, at:(onair && onair.at) || 0 });
async function onairSave(v, at){                         // at: giữ mốc cũ khi hoàn tác; bình thường là lúc bấm. Ghi kiểu merge để giữ thông báo
  v = { ...v, at:at === undefined ? Date.now() : at };
  try { if (DEMO) { onair = { ...onair, ...v }; ONAIR.v = onair; } else await db.collection('settings').doc('onair').set(v, { merge:true }); const el = $('onair'); if (el) el.outerHTML = onairCard(); return true; }
  catch (e) { console.warn(e); toast('Chưa lưu được: ' + (e.code || e.message)); return false; }
}
function onSchedField(el){
  const d = el.dataset.d, f = el.dataset.f; if (d === undefined || !f) return; const day = adminDays[+d], v = el.type === 'checkbox' ? el.checked : el.value;
  if (el.dataset.s === undefined) { if (f === 'cancelled') day.cancelled = v; else if (f === 'noteVi') day.cancelNote.vi = v; else if (f === 'noteEn') day.cancelNote.en = v; return; }
  const s = day.slots[+el.dataset.s];
  if (f === 'mode') { if (v === 'plan') { s.plan = buildPlan(cleanPomo(s.pomo)).map(g => ({ t:g.type[0], m:g.min })); } else s.plan = null; drawSchedule(); return; }
  if (f === 'bt') { s.plan[+el.dataset.b].t = v; drawSchedule(); return; }
  if (f === 'bn') { s.plan[+el.dataset.b].nm = v; return; }
  if (f === 'bm') { s.plan[+el.dataset.b].m = Math.max(1, Math.round(+v || 1)); const n = $(`tot-${d}-${el.dataset.s}`); if (n) n.textContent = `⏱ ${slotTotal(s)} phút ≈ ${(slotTotal(s) / 60).toFixed(2)} giờ`; return; }
  if (f === 'preset') { if (v !== 'custom') { s.pomo = { ...PRESETS[v], prep:s.pomo.prep || 0 }; drawSchedule(); } return; }
  if (f.startsWith('p_')) { s.pomo[f.slice(2)] = +v; const n = $(`tot-${d}-${el.dataset.s}`); if (n) n.textContent = `⏱ ${slotTotal(s)} phút ≈ ${(slotTotal(s) / 60).toFixed(2)} giờ`; return; }
  if (f === 'cancelled') s.cancelled = v; else if (f === 'noteVi') s.cancelNote.vi = v; else if (f === 'noteEn') s.cancelNote.en = v; else s[f] = v;
}
document.addEventListener('input', e => { if (e.target.closest && e.target.closest('#admin-body') && e.target.tagName !== 'SELECT') onSchedField(e.target); });
document.addEventListener('change', e => { if (e.target.closest && e.target.closest('#admin-body') && (e.target.tagName === 'SELECT' || e.target.type === 'checkbox')) onSchedField(e.target); });

/* ---------------- Sửa nhanh một buổi live (ngay trên trang Schedule) ---------------- */
let QE = null;
const hm2min = v => { const p = String(v || '').split(':'); return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0); };
const min2hm = m => { m = Math.max(0, Math.min(1439, m)); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const qeSegs = () => slotSegs({ plan:QE.s.plan, pomo:cleanPomo(QE.s.pomo) });
const qeTotal = () => planMins(qeSegs());
const clk = m => min2hm(((Math.round(m) % 1440) + 1440) % 1440);
const SEGK = { focus:'f', short:'s', long:'l', prep:'p' };
function qeSummary(){                                              // thanh màu + giờ bắt đầu/kết thúc từng đoạn, cập nhật ngay khi gõ
  const segs = qeSegs(), tot = planMins(segs), st = hm2min(QE.s.time); let at = st;
  const rows = segs.map(g => { const a = at; at += g.min; const k = SEGK[g.type] || 'f'; return `<div class="row small" style="gap:8px;flex-wrap:nowrap"><i class="dot" style="background:${BLK[k][1]}"></i><span class="mono faint">${clk(a)}–${clk(at)}</span><span>${esc(g.name || BLK[k][0] + (g.type === 'focus' ? ' ' + g.n : ''))}</span><span class="faint">${g.min}′</span></div>`; }).join('');
  return `<div style="display:flex;height:10px;border-radius:6px;overflow:hidden;gap:1px">${segs.map(g => `<i style="flex:${g.min};background:${BLK[SEGK[g.type] || 'f'][1]}"></i>`).join('')}</div>
    <div class="small mono mt-s"><b>${clk(st)} → ${clk(st + tot)}</b> <span class="faint">· ⏱ ${tot} phút ≈ ${(tot / 60).toFixed(2)} giờ</span></div>
    <div class="stack mt-s" style="gap:3px;max-height:150px;overflow:auto">${rows}</div>`;
}
function qeDraw(){
  const s = QE.s, ws = weekStart(QE.off);
  const blocks = s.plan ? `<div class="ad-blocks mt-s">${s.plan.map((b, bi) => `<div class="blk"><i class="dot" style="background:${BLK[b.t][1]}"></i>
      <select class="select" data-qe="bt" data-b="${bi}">${['f', 's', 'l', 'p'].map(k => `<option value="${k}" ${b.t === k ? 'selected' : ''}>${BLK[k][0]}</option>`).join('')}</select>
      <input class="input" maxlength="40" placeholder="Tên đoạn (tuỳ chọn)" data-qe="bn" data-b="${bi}" value="${esc(b.nm || '')}">
      <input class="input" type="number" min="1" data-qe="bm" data-b="${bi}" value="${b.m}" title="phút">
      <span class="row" style="gap:2px;flex-wrap:nowrap"><button type="button" class="btn ghost icon sm" data-act="qeBlk" data-op="up" data-b="${bi}">${ic('up', 'sm')}</button><button type="button" class="btn ghost icon sm" data-act="qeBlk" data-op="down" data-b="${bi}">${ic('down', 'sm')}</button><button type="button" class="btn danger icon sm" data-act="qeBlk" data-op="del" data-b="${bi}">${ic('trash', 'sm')}</button></span></div>`).join('')}
    <div class="row mt-s"><button type="button" class="btn secondary sm" data-act="qeBlk" data-op="add" data-t="f">+ Tập trung</button><button type="button" class="btn secondary sm" data-act="qeBlk" data-op="add" data-t="s">+ Nghỉ ngắn</button><button type="button" class="btn secondary sm" data-act="qeBlk" data-op="add" data-t="l">+ Nghỉ dài</button><button type="button" class="btn secondary sm" data-act="qeBlk" data-op="add" data-t="p">+ Chuẩn bị & chào</button></div>
    <button type="button" class="btn ghost sm mt-s" data-act="qePlanOff">Quay lại mẫu Pomodoro tự tính</button></div>`
    : `<div class="f5 mt-s">${[['prep', 'Chào & chuẩn bị (p)'], ['focus', 'Focus (p)'], ['short', 'Nghỉ (p)'], ['long', 'Nghỉ dài (p)'], ['rounds', 'Số phiên']].map(([f, lb]) => `<div class="field"><label class="label">${lb}</label><input class="input" type="number" min="${f === 'prep' || f === 'short' || f === 'long' ? 0 : 1}" data-qe="p_${f}" value="${s.pomo[f]}"></div>`).join('')}</div>
    <div class="row mt-s"><span class="small muted">Mẫu nhanh:</span>${Object.entries(PRESETS).map(([k, p]) => `<button type="button" class="chip" data-act="qePreset" data-p="${k}">${p.focus}/${p.short}/${p.long} ×${p.rounds}</button>`).join('')}<button type="button" class="btn secondary sm" data-act="qePlanOn">Tự sắp xếp từng đoạn</button></div>`;
  openModal(`<h3 style="margin-bottom:4px">Sửa buổi live</h3><p class="small faint" style="margin-bottom:12px">Chỉ lưu buổi này, khách sẽ thấy sau vài giây. Giờ nhập theo giờ Việt Nam.</p>
    <div class="f3"><select class="select" data-qe="day">${Array.from({ length:7 }, (_, i) => `<option value="${i}" ${QE.toDi === i ? 'selected' : ''}>${esc(DAYS.vi[i])} · ${ws.plus({ days:i }).toFormat('dd/MM')}</option>`).join('')}</select><input class="input" type="time" data-qe="time" value="${esc(s.time)}"><input class="input" placeholder="Tiêu đề (tuỳ chọn)" data-qe="title" value="${esc(s.title)}"></div>
    <div class="row mt-s"><span class="small muted">Dời giờ:</span>${[[-60, '−1 giờ'], [-15, '−15 phút'], [15, '+15 phút'], [60, '+1 giờ']].map(([m, l]) => `<button type="button" class="btn secondary sm" data-act="qeShift" data-m="${m}">${l}</button>`).join('')}</div>
    ${blocks}
    <div class="mt-s" id="qe-sum">${qeSummary()}</div>
    <div class="mt-s"><label class="chk row small" style="font-weight:700"><input type="checkbox" data-qe="cancelled" ${s.cancelled ? 'checked' : ''}> Huỷ buổi này</label>
      <div class="f2 mt-s"><input class="input" placeholder="Lý do huỷ (VI)" data-qe="noteVi" value="${esc(s.cancelNote.vi || '')}"><input class="input" placeholder="Cancel reason (EN)" data-qe="noteEn" value="${esc(s.cancelNote.en || '')}"></div></div>
    <div class="row mt" style="justify-content:flex-end"><button type="button" class="btn ghost" data-act="closeModal">Đóng</button><button type="button" class="btn primary" data-act="qeSave">Lưu thay đổi</button></div>`);
}
function onQeField(el){
  if (!QE) return; const f = el.dataset.qe, s = QE.s, v = el.type === 'checkbox' ? el.checked : el.value;
  if (f === 'time') s.time = v; else if (f === 'title') s.title = v; else if (f === 'cancelled') s.cancelled = v;
  else if (f === 'day') { QE.toDi = +v; return; }
  else if (f === 'noteVi') s.cancelNote.vi = v; else if (f === 'noteEn') s.cancelNote.en = v;
  else if (f === 'bt') { s.plan[+el.dataset.b].t = v; qeDraw(); return; }
  else if (f === 'bn') { s.plan[+el.dataset.b].nm = v; return; }
  else if (f === 'bm') s.plan[+el.dataset.b].m = Math.max(1, Math.round(+v || 1));
  else if (f.startsWith('p_')) s.pomo[f.slice(2)] = Math.max(0, Math.round(+v || 0));
  else return;
  const n = $('qe-sum'); if (n && /^(time|bm|p_)/.test(f)) n.innerHTML = qeSummary();
}
document.addEventListener('input', e => { if (e.target.dataset && e.target.dataset.qe && e.target.tagName !== 'SELECT' && e.target.type !== 'checkbox') onQeField(e.target); });
document.addEventListener('change', e => { if (e.target.dataset && e.target.dataset.qe && (e.target.tagName === 'SELECT' || e.target.type === 'checkbox')) onQeField(e.target); });
Object.assign(ACTIONS, {
  onairStart: async () => { const m = onairMatch(), x = m || onairNext(), now = Date.now(); if (!x) return toast('Không có buổi live nào sắp tới trong lịch.');
    const running = !!m && now >= onair.start && now < onair.start + x.mins * 60e3;
    if (running && !confirm('Buổi live đang chạy. Bắt đầu lại sẽ tính lại cả buổi từ bây giờ (bảng lịch và bộ đếm trên OBS chạy lại từ đầu). Tiếp tục?\n\nLỡ bấm nhầm thì có nút "Quay về giờ trước đó".')) return;
    if (await onairSave({ start:now, sched:x.sched.toMillis(), prev:onairSnap() })) toast('✓ Đã bắt đầu. Web báo đang live ngay, OBS tự theo trong khoảng 10 giây.', 3500); },
  onairStartAgo: async () => { const x = onairMatch() || onairNext(); if (!x) return toast('Không có buổi live nào sắp tới trong lịch.');
    const ago = Math.max(0, Math.min(180, Math.round(+($('onairAgo') || {}).value || 0), Math.max(0, x.mins - 1)));   // web và bộ đếm OBS tính cả buổi từ đúng lúc bạn bấm Start Streaming
    if (await onairSave({ start:Date.now() - ago * 60e3, sched:x.sched.toMillis(), prev:onairSnap() })) toast(`✓ Đã bắt đầu${ago ? ` (tính từ ${ago} phút trước)` : ''}. Web báo đang live ngay, OBS tự theo trong khoảng 10 giây.`, 3500); },
  obsKeyMake: async () => {
    if (obsKey && !confirm('Tạo khoá mới sẽ làm khoá cũ ngưng hoạt động, bạn phải sửa lại link trong OBS. Tiếp tục?')) return;
    const a = new Uint8Array(18); crypto.getRandomValues(a); const k = Array.from(a, v => (v % 36).toString(36)).join('');
    try { if (!DEMO) await db.collection('private').doc('obs').set({ k }); obsKey = k; const el = $('obs-key'); if (el) el.outerHTML = obsKeyHTML(); toast('Đã tạo khoá OBS. Thêm vào link trong OBS theo hướng dẫn.', 3500); }
    catch (e) { toast('Chưa tạo được: ' + (e.code || e.message) + '. Đã dán luật bảo mật mới lên Firebase chưa?'); }
  },
  obsKeyCopy: async () => { const i = $('obs-key-val'); if (!i) return; try { await navigator.clipboard.writeText(i.value); toast('Đã chép.'); } catch (e) { i.select(); toast('Bấm Ctrl+C để chép.'); } },
  onairShift: async el => { if (!onairMatch()) return; await onairSave({ start:onair.start + (+el.dataset.m) * 60e3, sched:onair.sched, prev:(onair.prev && Date.now() - onair.at < 600e3) ? onair.prev : onairSnap() }); },
  onairClear: async () => { if (await onairSave({ start:0, sched:0, prev:onairSnap() })) toast('Đã huỷ bắt đầu: web thôi báo đang live, lịch về giờ dự kiến.'); },
  onairNote: async () => { const v = ($('onairNote').value || '').trim().slice(0, 300);
    try { if (DEMO) onair = { ...onair, note:v }; else await db.collection('settings').doc('onair').set({ note:v }, { merge:true });   // không đổi at: không ảnh hưởng giờ bắt đầu
      $('onair').outerHTML = onairCard(); toast(v ? '✓ Đã lưu. OBS hiện thông báo trong khoảng 10 giây.' : 'Đã ẩn thông báo.', 3000); } catch (e) { toast('Chưa lưu được: ' + (e.code || e.message)); } },
  onairNoteClear: () => { $('onairNote').value = ''; return ACTIONS.onairNote(); },
  onairUndo: async () => { const p = onair && onair.prev; if (!p) return;
    if (await onairSave({ start:p.start || 0, sched:p.sched || 0, prev:null }, p.at || 0)) toast('↶ Đã quay về giờ trước đó. OBS sẽ tự theo trong khoảng 10 giây.', 3500); },
});
Object.assign(ACTIONS, {
  qeOpen: el => {
    const off = +el.dataset.o, di = +el.dataset.d, si = +el.dataset.s, raw = (weekDocs[off] || [])[di];
    if (!raw || !Array.isArray(raw.slots)) return alert('Ngày này đang ở định dạng cũ. Hãy sửa trong Admin, tab Lịch live, rồi lưu một lần.');
    const slot = normDay(raw).slots[si]; if (!slot) return;
    QE = { off, di, si, toDi:di, orig:slot.time, s:{ ...slot, plan: slot.plan ? slot.plan.map(b => ({ ...b })) : null, pomo: slot.pomo ? { ...slot.pomo } : cleanPomo(PRESETS.classic), cancelNote:{ ...(slot.cancelNote || {}) } } };
    qeDraw();
  },
  qeShift: el => { QE.s.time = min2hm(hm2min(QE.s.time) + +el.dataset.m); qeDraw(); },
  qePreset: el => { QE.s.pomo = { ...PRESETS[el.dataset.p], prep:QE.s.pomo.prep || 0 }; qeDraw(); },
  qePlanOff: () => { QE.s.plan = null; qeDraw(); },
  qePlanOn: () => { QE.s.plan = buildPlan(cleanPomo(QE.s.pomo)).map(g => ({ t:g.type[0], m:g.min })); qeDraw(); },
  qeBlk: el => {
    const p = QE.s.plan, i = +el.dataset.b, op = el.dataset.op;
    if (op === 'add') p.push({ t:el.dataset.t, m:BLK[el.dataset.t][2] });
    else if (op === 'prep') p.unshift({ t:'p', m:BLK.p[2], nm:'Setup & chào' });
    else if (op === 'del') { p.splice(i, 1); if (!p.length) QE.s.plan = null; }
    else { const j = i + (op === 'up' ? -1 : 1); if (j < 0 || j >= p.length) return; [p[i], p[j]] = [p[j], p[i]]; }
    qeDraw();
  },
  qeSave: el => withTranslate(el, async () => {
    const q = QE; if (!q) return; if (DEMO) return toast('Chế độ xem thử: chưa lưu thật');
    if (!/^\d{2}:\d{2}$/.test(q.s.time || '')) return alert('Hãy chọn giờ bắt đầu cho buổi live.');
    const key = weekKeyFor(q.off), d = await db.collection('weekly_schedules').doc(key).get();
    const days = d.exists ? d.data().days : null, day = days && days[q.di], to = days && days[q.toDi];
    if (!day || !Array.isArray(day.slots) || !day.slots[q.si] || day.slots[q.si].time !== q.orig) return alert('Lịch này vừa được sửa ở nơi khác. Hãy tải lại trang rồi sửa lại.');
    if (q.toDi !== q.di && (!to || !Array.isArray(to.slots) || to.slots.length >= 4)) return alert(!to || !Array.isArray(to.slots) ? 'Ngày được chọn đang ở định dạng cũ. Hãy sửa trong Admin, tab Lịch live, rồi lưu một lần.' : 'Ngày được chọn đã đủ 4 buổi. Hãy xoá bớt một buổi hoặc chọn ngày khác.');
    const s = q.s, cur = { vi:s.cancelNote.vi || '', en:s.cancelNote.en || '' };
    const out = { time:s.time, icon:s.icon || '', title:s.title || '', pomo:cleanPomo(s.pomo), plan: s.plan && s.plan.length ? s.plan.map(b => ({ t:b.t, m:Math.max(1, Math.round(+b.m || 1)), ...(String(b.nm || '').trim() ? { nm:String(b.nm).trim().slice(0, 40) } : {}) })) : [], cancelled:!!s.cancelled, cancelNote: s.cancelled && (cur.vi || cur.en) ? await TR.fill({}, cur) : cur };
    if (q.toDi === q.di) day.slots[q.si] = out; else { day.slots.splice(q.si, 1); to.slots.push(out); }     // dời sang ngày khác trong cùng tuần
    await dbSet('weekly_schedules', key, { days }, false);
    weekDocs[q.off] = days; QE = null; closeModal(); render(true);
    clearTimeout(pubTimer); publishSite(true);                              // xuất bản ngay, không chờ 4 giây như các thay đổi khác
    ok(trMsg('Đã lưu buổi live. Khách sẽ thấy sau vài giây.'));
  }).catch(fail)
});

/* ---------------- Bài viết ---------------- */
let editPost = null, editBody = { vi:'', en:'' }, editLang = 'en', adminCats = [];
async function tabBlog(){
  A('<p class="muted">Đang tải…</p>');
  let list = []; try { list = DEMO ? posts : await getAll('posts', 'createdAt'); } catch (e) { return fail(e); }
  if (window._openPostId) { const p = list.find(x => x.id === window._openPostId); window._openPostId = null; if (p) return postForm(p); }
  const cats = blogCats();
  A(`<div class="row between" style="margin-bottom:14px"><span class="muted small">${list.length} bài · ${cats.length} mục</span><span class="row"><button class="btn secondary" data-act="manageCats">${ic('sliders', 'sm')} Quản lý các mục</button><button class="btn primary" data-act="newPost">${ic('plus', 'sm')} Bài viết mới</button></span></div>
    ${aCard('Tất cả bài viết', list.length ? list.map(p => `<div class="ord-row"><div><b>${p.pinned ? '★ ' : ''}${esc(L(p.title) || p.id)}</b><div class="small muted">${p.published ? (p.publishAt && tsMs(p.publishAt) > Date.now() ? '<span class="badge warn">Hẹn giờ ' + esc(dateStr(p.publishAt)) + '</span>' : '<span class="badge live">Đã xuất bản</span>') : '<span class="badge muted">Bản nháp</span>'} ${p.category ? '<span class="badge">' + esc(catLabel(p.category)) + '</span>' : '<span class="badge muted">chưa có mục</span>'} · ${esc(dateStr(p.createdAt))}</div></div><span class="row"><button class="btn secondary sm" data-act="editPost" data-id="${esc(p.id)}">Sửa</button><button class="btn danger sm" data-act="delPost" data-id="${esc(p.id)}">Xoá</button></span></div>`).join('') : '<p class="muted">Chưa có bài viết.</p>')}`);
}
/* ---- quản lý các mục (danh mục) của phần viết ---- */
const catRows = () => adminCats.map((c, i) => `<div class="ad-slot" data-i="${i}"><div class="f2"><input class="input ct-en" placeholder="Tên mục (English)" value="${esc(c.label.en || '')}"><input class="input ct-vi" placeholder="Tên mục (Tiếng Việt)" value="${esc(c.label.vi || '')}"></div>
  <div class="f2 mt-s"><input class="input ct-den" placeholder="Mô tả ngắn (English)" value="${esc(c.desc.en || '')}"><input class="input ct-dvi" placeholder="Mô tả ngắn (Tiếng Việt)" value="${esc(c.desc.vi || '')}"></div>
  <div class="row mt-s"><button class="btn ghost sm" data-act="catMove" data-i="${i}" data-d="-1">${ic('up', 'sm')}</button><button class="btn ghost sm" data-act="catMove" data-i="${i}" data-d="1">${ic('down', 'sm')}</button><button class="btn danger sm" data-act="catDel" data-i="${i}">Xoá mục</button></div></div>`).join('');
const readCats = () => [...document.querySelectorAll('#cat-list .ad-slot')].map((r, i) => { const old = adminCats[i] || {}, en = r.querySelector('.ct-en').value.trim(), vi = r.querySelector('.ct-vi').value.trim(); return { id: old.id || slugify(en || vi) || ('muc-' + Date.now().toString(36) + i), label:{ en, vi }, desc:{ en:r.querySelector('.ct-den').value.trim(), vi:r.querySelector('.ct-dvi').value.trim() } }; });
function catsForm(){
  adminCats = blogCats().map(c => JSON.parse(JSON.stringify({ id:c.id, label:c.label || {}, desc:c.desc || {} })));
  A(aCard('Các mục của phần viết', `<p class="hint" style="margin-bottom:10px">Mỗi mục xuất hiện thành một thẻ lọc ở trang Bài viết (VD: Nhật ký, Ghi chép học tập, Tản văn, Sách &amp; phim, Thơ…). Bạn thêm, đổi tên, sắp xếp tuỳ ý. Khi xoá một mục, các bài trong mục đó vẫn còn nhưng sẽ không thuộc mục nào.</p><div id="cat-list">${catRows()}</div>
    <div class="row mt"><button class="btn secondary sm" data-act="catAdd">${ic('plus', 'sm')} Thêm mục</button><button class="btn primary" data-act="saveCats">Lưu các mục</button><a class="btn ghost" href="#/admin/blog" data-act="reloadBlog">Quay lại</a></div>`));
}
function postForm(p){
  editPost = p; editBody = { vi:(p.body || {}).vi || '', en:(p.body || {}).en || '' }; editLang = 'en';
  const cats = blogCats(), pa = p.publishAt ? DT.fromMillis(tsMs(p.publishAt)).toFormat("yyyy-LL-dd'T'HH:mm") : '';
  A(`${aCard(p.slug ? 'Sửa bài viết' : 'Bài viết mới', `<div class="f2">${fld('Title (English)', 'pb-t-en', (p.title || {}).en || '')}${fld('Tiêu đề (Tiếng Việt)', 'pb-t-vi', (p.title || {}).vi || '')}</div>
    <div class="f2 mt-s">${area('Excerpt (English)', 'pb-e-en', (p.excerpt || {}).en || '', 2)}${area('Mô tả ngắn (Tiếng Việt)', 'pb-e-vi', (p.excerpt || {}).vi || '', 2)}</div>
    <div class="f3 mt-s">${selectF('Mục', 'pb-cat', [['', '— Chưa chọn mục —'], ...cats.map(c => [c.id, L(c.label) || c.id])], p.category || '')}${fld('Tags (cách nhau dấu phẩy)', 'pb-tags', (p.tags || []).join(', '))}${fld('Slug (đường dẫn)', 'pb-slug', p.slug || '', p.slug ? 'disabled' : '', 'Để trống = tự tạo từ tiêu đề')}</div>
    <div class="mt-s">${imgField('Ảnh bìa (để trống = tranh vẽ sẵn)', 'pb-cover', p.cover)}</div>
    <label class="label mt">Nội dung <span class="faint" id="pb-wc"></span></label><div class="seg"><button type="button" class="on" id="bl-en" data-act="bodyLang" data-l="en">English</button><button type="button" id="bl-vi" data-act="bodyLang" data-l="vi">Tiếng Việt</button></div>
    <div class="rte-bar">${[['bold', 'B'], ['italic', 'I'], ['underline', 'U'], ['h2', 'H2'], ['h3', 'H3'], ['ul', '• Danh sách'], ['ol', '1. Danh sách'], ['quote', '❝'], ['link', 'Link'], ['img', 'Ảnh'], ['hr', '―'], ['clean', 'Tx']].map(([c, l]) => `<button type="button" data-act="fmt" data-c="${c}">${l}</button>`).join('')}</div>
    <div class="rte" id="pb-rte" contenteditable="true"></div><p class="hint" id="pb-draft">Bạn viết bằng ngôn ngữ nào cũng được. Khi bấm Lưu, bài được tự dịch sang mọi ngôn ngữ còn lại (Hindi, Nhật, Hàn, Trung, Pháp, Tây Ban Nha…). Bạn sửa ô nào, các ô còn lại được dịch lại từ ô đó; nếu bạn sửa cả Tiếng Anh và Tiếng Việt cùng lúc thì giữ nguyên cả hai và dịch phần còn lại từ Tiếng Anh. Bản nháp tự lưu trong trình duyệt khi bạn gõ.</p>
    <div class="f2 mt-s"><label class="row small" style="font-weight:700"><input type="checkbox" id="pb-pub" ${p.published ? 'checked' : ''}> Xuất bản (bỏ chọn = bản nháp)</label><label class="row small" style="font-weight:700"><input type="checkbox" id="pb-pin" ${p.pinned ? 'checked' : ''}> Ghim lên đầu</label></div>
    ${fld('Hẹn giờ đăng (tuỳ chọn)', 'pb-at', pa, 'type="datetime-local"', 'Để trống = hiện ngay khi xuất bản. Có thể chọn giờ trong tương lai.')}
    <div class="row mt"><button class="btn primary" data-act="savePost">Lưu bài</button><a class="btn ghost" href="#/admin/blog" data-act="reloadBlog">Huỷ</a></div>`)}`);
  const key = 'draft_' + (p.slug || 'new'), dr = store.get(key, null);
  if (dr && !p.slug && (dr.en || dr.vi) && confirm('Có bản nháp chưa lưu từ lần trước. Khôi phục?')) { editBody = { en:dr.en || '', vi:dr.vi || '' }; }
  $('pb-rte').innerHTML = sanitizeHtml(editBody.en);
  const wc = () => { const n = ($('pb-rte').innerText || '').trim().split(/\s+/).filter(Boolean).length; $('pb-wc').textContent = '· ' + n + ' từ'; };
  wc();
  $('pb-rte').addEventListener('input', () => { wc(); editBody[editLang] = $('pb-rte').innerHTML; store.set(key, { en:editBody.en, vi:editBody.vi, t:Date.now() }); const d = $('pb-draft'); if (d) d.dataset.saved = '1'; });
}
function fmtCmd(c){
  const r = $('pb-rte'); r.focus();
  const cmd = { bold:['bold'], italic:['italic'], underline:['underline'], h2:['formatBlock', 'H2'], h3:['formatBlock', 'H3'], ul:['insertUnorderedList'], ol:['insertOrderedList'], quote:['formatBlock', 'BLOCKQUOTE'], hr:['insertHorizontalRule'], clean:['removeFormat'] }[c];
  if (cmd) { document.execCommand(cmd[0], false, cmd[1]); if (c === 'clean') document.execCommand('formatBlock', false, 'P'); return; }
  if (c === 'link') { const u = prompt('Link (https://…):'); if (u) document.execCommand('createLink', false, u); }
  if (c === 'img') openImagePicker('Chèn ảnh vào bài', u => { r.focus(); if (u) document.execCommand('insertImage', false, u); }, 'blog');
}

/* ---------------- Sản phẩm ---------------- */
let editProd = null, prodImages = [], prodFile = null;
async function tabProducts(){
  A('<p class="muted">Đang tải…</p>');
  let list = []; try { list = DEMO ? products : await getAll('products'); } catch (e) { return fail(e); }
  A(`<div class="row between" style="margin-bottom:14px"><span class="muted small">${list.length} sản phẩm</span><button class="btn primary" data-act="newProd">${ic('plus', 'sm')} Sản phẩm mới</button></div>
    ${aCard('Tất cả sản phẩm', list.length ? list.map(p => `<div class="ord-row"><div class="row" style="flex-wrap:nowrap"><div class="thumbs" style="margin:0">${(p.images || [])[0] ? `<img alt="" src="${esc(p.images[0])}">` : `<span class="avatar" style="border-radius:10px;width:46px;height:46px">${ic('bag')}</span>`}</div><div><b>${esc(L(p.name) || p.id)}</b><div class="small muted">${money(p.priceVND, 'VND')} · ${money(p.priceUSD, 'USD')} · ${p.type === 'physical' ? 'Vật lý' : 'File số'}${p.hasFile ? ' · <span class="badge live">có file</span>' : ''} ${p.active === false ? '<span class="badge muted">đang ẩn</span>' : ''}</div></div></div><span class="row"><button class="btn secondary sm" data-act="editProd" data-id="${esc(p.id)}">Sửa</button><button class="btn danger sm" data-act="delProd" data-id="${esc(p.id)}">Xoá</button></span></div>`).join('') : '<p class="muted">Chưa có sản phẩm. Bấm "Sản phẩm mới" để tải lên planner đầu tiên.</p>')}`);
}
function thumbsHTML(){ return prodImages.map((u, i) => `<div><img alt="" src="${esc(u)}"><button type="button" data-act="rmImg" data-i="${i}" aria-label="xoá">×</button></div>`).join(''); }
async function prodForm(p){
  editProd = p; prodImages = [...(p.images || [])]; prodFile = null;
  let priv = {}; if (p.id && !DEMO) { try { const d = await db.collection('products_private').doc(p.id).get(); priv = d.exists ? d.data() : {}; } catch (e) {} }
  prodFile = priv.storagePath || priv.fileUrl ? { storagePath:priv.storagePath || '', fileUrl:priv.fileUrl || '', fileName:priv.fileName || '' } : null;
  const pl = p.payLinks || {};
  A(aCard(p.id ? 'Sửa sản phẩm' : 'Sản phẩm mới', `<div class="f2">${fld('Tên (VI)', 'pr-n-vi', (p.name || {}).vi || '')}${fld('Name (EN)', 'pr-n-en', (p.name || {}).en || '')}</div>
    <div class="f2 mt-s">${area('Mô tả (VI)', 'pr-d-vi', (p.desc || {}).vi || '', 3)}${area('Description (EN)', 'pr-d-en', (p.desc || {}).en || '', 3)}</div>
    <div class="f3 mt-s">${fld('Giá VND', 'pr-vnd', p.priceVND || '', 'type="number" min="0"')}${fld('Giá USD', 'pr-usd', p.priceUSD || '', 'type="number" min="0" step="0.01"')}${selectF('Loại sản phẩm', 'pr-type', [['digital', 'Sản phẩm số (planner, PDF…)'], ['physical', 'Vật lý (cần địa chỉ)']], p.type || 'digital')}</div>
    <div class="f2 mt-s">${fld('Tồn kho', 'pr-stock', p.stock ?? '', 'type="number" min="0"', 'Để trống = không giới hạn; 0 = hết hàng')}<label class="row small" style="font-weight:700;align-self:end;padding-bottom:12px"><input type="checkbox" id="pr-active" ${p.active !== false ? 'checked' : ''}> Hiển thị trong cửa hàng</label></div>
    <label class="label mt">Ảnh sản phẩm</label><div class="upl"><input type="file" id="pr-imgfiles" accept="image/*" multiple class="input" style="max-width:300px"><button type="button" class="btn secondary" data-act="uploadImgs">${ic('image', 'sm')} Tải ảnh lên</button><button type="button" class="btn secondary" data-act="addImgUrl">Thêm bằng link</button></div><div class="thumbs" id="prod-thumbs">${thumbsHTML()}</div><div class="hint" id="pr-img-st"></div>
    <div id="digital-box" class="mt" style="${(p.type || 'digital') === 'physical' ? 'display:none' : ''}"><label class="label">File sản phẩm số (chỉ người đã mua và được xác nhận mới tải được)</label>
      <div class="upl"><input type="file" id="pr-file" class="input" style="max-width:320px"><button type="button" class="btn secondary" data-act="uploadFileNow">${ic('download', 'sm')} Tải file lên</button></div><div class="hint" id="pr-file-st">${prodFile ? 'Hiện có: ' + esc(prodFile.fileName || prodFile.storagePath || prodFile.fileUrl) : 'Chưa có file.'}</div>
      ${fld('…hoặc dán link tải (Google Drive, Dropbox…)', 'pr-fileurl', priv.fileUrl || '', '', 'Link này chỉ hiện cho người mua đã được xác nhận')}</div>
    <label class="label mt">Link thanh toán riêng cho khách quốc tế (tuỳ chọn — để trống sẽ dùng link mặc định ở tab Thanh toán)</label><div class="f3">${fld('Stripe', 'pr-stripe', pl.stripe || '')}${fld('PayPal', 'pr-paypal', pl.paypal || '')}${fld('Ko-fi', 'pr-kofi', pl.kofi || '')}</div>
    <div class="row mt"><button class="btn primary" data-act="saveProd">Lưu sản phẩm</button><button class="btn ghost" data-act="reloadProducts">Huỷ</button></div>`));
  $('pr-type').addEventListener('change', e => { $('digital-box').style.display = e.target.value === 'physical' ? 'none' : ''; });
}

/* ---------------- Nhạc (gợi ý ở Phòng tập trung) ---------------- */
let adminMusic = { picks:[], recent:[] };
const muRows = key => adminMusic[key].map((m, i) => `<div class="ad-slot" data-i="${i}"><div class="f2"><input class="input mu-te" placeholder="Title (English)" value="${esc((m.title || {}).en || '')}"><input class="input mu-tv" placeholder="Tên (Tiếng Việt)" value="${esc((m.title || {}).vi || '')}"></div>
  <div class="mt-s"><input class="input mu-u" placeholder="Link YouTube / Spotify / SoundCloud…" value="${esc(m.url || '')}"></div>
  <div class="f2 mt-s"><input class="input mu-ne" placeholder="Short note (English, optional)" value="${esc((m.note || {}).en || '')}"><input class="input mu-nv" placeholder="Ghi chú ngắn (Tiếng Việt, tuỳ chọn)" value="${esc((m.note || {}).vi || '')}"></div>
  <div class="row mt-s"><button type="button" class="btn ghost sm" data-act="muMove" data-k="${key}" data-i="${i}" data-d="-1">${ic('up', 'sm')}</button><button type="button" class="btn ghost sm" data-act="muMove" data-k="${key}" data-i="${i}" data-d="1">${ic('down', 'sm')}</button><button type="button" class="btn danger sm" data-act="muDel" data-k="${key}" data-i="${i}">Xoá</button></div></div>`).join('') || '<div class="hint">Chưa có mục nào.</div>';
const readMu = key => [...document.querySelectorAll(`#mu-${key} .ad-slot`)].map(r => ({ title:{ en:r.querySelector('.mu-te').value.trim(), vi:r.querySelector('.mu-tv').value.trim() }, url:r.querySelector('.mu-u').value.trim(), note:{ en:r.querySelector('.mu-ne').value.trim(), vi:r.querySelector('.mu-nv').value.trim() } }));
const syncMu = () => { adminMusic.picks = readMu('picks'); adminMusic.recent = readMu('recent'); };
const drawMu = () => { $('mu-picks').innerHTML = muRows('picks'); $('mu-recent').innerHTML = muRows('recent'); };
function tabMusic(){
  adminMusic = { picks:JSON.parse(JSON.stringify(music.picks || [])), recent:JSON.parse(JSON.stringify(music.recent || [])) };
  A(`${aCard('Gợi ý nhạc cho Phòng tập trung', `<p class="hint" style="margin-bottom:10px">Dán link <b>YouTube</b> (video, live hoặc playlist), <b>Spotify</b> (playlist, album, bài hát) hoặc <b>SoundCloud</b>: người xem bấm "Phát tại đây" là nghe ngay trong trang. Link khác (Apple Music, Zing…) vẫn hiện, nhưng chỉ có nút "Mở". Ngoài danh sách này, trang luôn có sẵn âm thanh nền (mưa, ồn nâu, ồn trắng) và các gợi ý tìm nhạc trên YouTube.</p><div id="mu-picks">${muRows('picks')}</div><div class="row mt"><button class="btn secondary sm" data-act="muAdd" data-k="picks">${ic('plus', 'sm')} Thêm gợi ý</button></div>`)}
    ${aCard('Nhạc mình đang nghe gần đây', `<p class="hint" style="margin-bottom:10px">Các danh sách nhạc bạn đang nghe dạo này (hiện riêng một mục ở Phòng tập trung). Cập nhật bất cứ lúc nào, cùng cách dán link như trên.</p><div id="mu-recent">${muRows('recent')}</div><div class="row mt"><button class="btn secondary sm" data-act="muAdd" data-k="recent">${ic('plus', 'sm')} Thêm danh sách</button></div>`)}
    <div class="row mt"><button class="btn primary" data-act="saveMusic">Lưu nhạc</button><span class="hint">Tên và ghi chú tự dịch sang mọi ngôn ngữ khi lưu.</span></div>`);
}

/* ---------------- Đồ mình dùng (affiliate) ---------------- */
let adminGear = [];
const grRows = () => adminGear.map((g, i) => `<div class="ad-slot" data-i="${i}"><div class="f2"><input class="input gr-ne" placeholder="Name (English)" value="${esc((g.name || {}).en || '')}"><input class="input gr-nv" placeholder="Tên (Tiếng Việt)" value="${esc((g.name || {}).vi || '')}"></div>
  <div class="f2 mt-s"><textarea class="textarea gr-te" placeholder="Short note (English)">${esc((g.note || {}).en || '')}</textarea><textarea class="textarea gr-tv" placeholder="Ghi chú ngắn (Tiếng Việt)">${esc((g.note || {}).vi || '')}</textarea></div>
  <div class="f2 mt-s"><input class="input gr-ce" placeholder="Category (English) — VD: Desk, Audio" value="${esc((g.cat || {}).en || '')}"><input class="input gr-cv" placeholder="Mục (Tiếng Việt) — VD: Bàn học, Âm thanh" value="${esc((g.cat || {}).vi || '')}"></div>
  <div class="f3 mt-s"><input class="input gr-p" placeholder="Giá hiển thị (VD: $25)" value="${esc(g.price || '')}"><input class="input gr-s" placeholder="Nơi bán (VD: Amazon, Shopee)" value="${esc(g.store || '')}"><input class="input gr-u" placeholder="Link sản phẩm / link affiliate (https://…)" value="${esc(g.url || '')}"></div>
  <div class="row mt-s" style="flex-wrap:nowrap"><input class="input gr-i" id="gr-img-${i}" placeholder="Ảnh (link) hoặc bấm Chọn ảnh — để trống = tranh vẽ sẵn" value="${esc(g.img || '')}"><button type="button" class="btn secondary" data-act="pickInto" data-target="gr-img-${i}">${ic('image', 'sm')} Chọn ảnh</button></div>
  <div class="row mt-s"><button type="button" class="btn ghost sm" data-act="grMove" data-i="${i}" data-d="-1">${ic('up', 'sm')}</button><button type="button" class="btn ghost sm" data-act="grMove" data-i="${i}" data-d="1">${ic('down', 'sm')}</button><button type="button" class="btn danger sm" data-act="grDel" data-i="${i}">Xoá</button></div></div>`).join('') || '<div class="hint">Chưa có món nào.</div>';
const readGr = () => [...document.querySelectorAll('#gr-list .ad-slot')].map((r, i) => { const old = adminGear[i] || {}, en = r.querySelector('.gr-ne').value.trim(), vi = r.querySelector('.gr-nv').value.trim(); return { id:old.id || slugify(en || vi) || ('g' + Date.now().toString(36) + i), _o:old._o || null, name:{ en, vi }, note:{ en:r.querySelector('.gr-te').value.trim(), vi:r.querySelector('.gr-tv').value.trim() }, cat:{ en:r.querySelector('.gr-ce').value.trim(), vi:r.querySelector('.gr-cv').value.trim() }, price:r.querySelector('.gr-p').value.trim(), store:r.querySelector('.gr-s').value.trim(), url:r.querySelector('.gr-u').value.trim(), img:r.querySelector('.gr-i').value.trim() }; });
function tabGear(){
  adminGear = (gear.items || []).map(g => ({ ...JSON.parse(JSON.stringify(g)), _o:JSON.parse(JSON.stringify(g)) }));
  A(aCard('Đồ mình dùng (link affiliate)', `<p class="hint" style="margin-bottom:10px">Liệt kê những món bạn dùng khi học: đèn, tai nghe, sổ, bàn phím… Mỗi món có ảnh, ghi chú ngắn và <b>link mua hàng</b>. Khi bạn tham gia chương trình affiliate (Amazon Associates, Shopee Affiliate, Lazada, AccessTrade…), chỉ cần dán link affiliate của bạn vào ô "Link". Khách bấm là sang trang bán hàng và bạn nhận hoa hồng nếu họ mua. Các link tự gắn nhãn <code>sponsored</code> theo khuyến nghị của Google.</p>
    <p class="hint" style="margin-bottom:10px">Dòng thông báo "link có thể là affiliate" hiện ngay dưới tiêu đề trang. Bạn sửa chữ đó bằng nút ✏️ trên trang <b>Đồ mình dùng</b>. Nên giữ dòng này vì nhiều nền tảng và pháp luật yêu cầu nói rõ.</p>
    <div id="gr-list">${grRows()}</div><div class="row mt"><button class="btn secondary sm" data-act="grAdd">${ic('plus', 'sm')} Thêm món đồ</button><button class="btn primary" data-act="saveGear">Lưu</button><a class="btn ghost" href="#/gear">Xem trang</a></div><p class="hint">Tên, ghi chú, mục tự dịch sang mọi ngôn ngữ khi lưu.</p>`));
}
/* ---------------- Đơn hàng ---------------- */
async function tabOrders(){
  A('<p class="muted">Đang tải…</p>'); let list = []; try { list = DEMO ? [{ id:'EP-DEMO1', code:'EP-DEMO1', total:79000, currency:'VND', status:'paid', uid:'demo', buyer:{ name:'Linh', email:'linh@mail.com' }, items:[{ id:'planner', name:'30-Day Study Planner (PDF)', qty:1, type:'digital' }], createdAt:Date.now() }] : await getAll('orders', 'createdAt', 100); } catch (e) { return fail(e); }
  try { [ORD_REF.prods, ORD_REF.coupons] = await Promise.all([getAll('products'), getAll('coupons')]); } catch (e) { console.warn('order check', e.code); }
  A(aCard('Đơn hàng gần đây', list.length ? `<div class="tbl-wrap"><table class="table"><tr><th>Mã / ngày</th><th>Khách</th><th>Sản phẩm</th><th>Tổng</th><th>Trạng thái</th></tr>${list.map(o => `<tr><td><b class="mono">${esc(o.code)}</b><div class="small faint">${esc(dateStr(o.createdAt))}</div></td>
    <td>${esc(o.buyer && o.buyer.name || '')}<div class="small"><b>${esc(o.buyer && o.buyer.email || '')}</b></div>${o.buyer && o.buyer.address ? `<div class="small muted">${esc(o.buyer.address)}</div>` : ''}${o.buyer && o.buyer.note ? `<div class="small faint">“${esc(o.buyer.note)}”</div>` : ''}<div class="small faint">${o.uid ? 'Có tài khoản' : 'Khách vãng lai'}</div></td>
    <td>${(o.items || []).map(i => `${esc(i.name)} ×${esc(i.qty)}`).join('<br>')}</td><td>${money(o.total, o.currency)}${o.coupon ? `<div class="small faint">mã ${esc(o.coupon)}</div>` : ''}${orderWarn(o) ? `<div class="small" style="color:var(--danger);margin-top:2px">⚠ ${esc(orderWarn(o))}</div>` : ''}</td>
    <td><select class="select" style="min-width:120px" data-change="orderStatus" data-id="${esc(o.id)}">${['pending', 'paid', 'shipped', 'cancelled'].map(s => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>${(o.items || []).some(i => i.type !== 'physical') && o.uid && ['paid', 'shipped'].includes(o.status) ? `<button class="btn secondary sm mt-s" data-act="grant" data-id="${esc(o.id)}">Cấp lại quyền tải</button>` : ''}</td></tr>`).join('')}</table></div><p class="hint">Khi bạn chuyển sang <b>paid</b>, các sản phẩm số trong đơn tự động xuất hiện trong Thư viện của khách (nếu họ đã đăng nhập khi mua).</p>` : '<p class="muted">Chưa có đơn hàng.</p>'));
  window._orders = Object.fromEntries(list.map(o => [o.id, o]));
}
/* Đơn do trình duyệt của khách tạo nên số tiền/sản phẩm trong đơn có thể bị sửa. Tính lại theo giá thật đang lưu (sản phẩm + mã giảm giá)
   và báo đỏ nếu khác, để không lỡ bấm "paid" (mở quyền tải) cho đơn chỉ chuyển 1.000đ. Trả về '' nếu khớp. */
const ORD_REF = { prods:null, coupons:null };
function orderWarn(o){
  if (DEMO || !ORD_REF.prods) return '';
  const cur = o.currency === 'USD' ? 'USD' : 'VND', items = Array.isArray(o.items) ? o.items : [];
  let sub = 0;
  for (const i of items) {
    const p = ORD_REF.prods.find(x => x.id === i.id), q = +i.qty;
    if (!p) return `Sản phẩm "${String(i.name || i.id).slice(0, 40)}" không có trong cửa hàng: kiểm tra kỹ trước khi xác nhận.`;
    if (!Number.isInteger(q) || q < 1 || q > 99) return 'Số lượng trong đơn không hợp lệ.';
    sub += pprice(p, cur) * q;
  }
  let disc = 0;
  if (o.coupon) {
    const c = (ORD_REF.coupons || []).find(x => x.id === String(o.coupon).toUpperCase());
    if (!c) return `Mã giảm giá "${String(o.coupon).slice(0, 20)}" không tồn tại.`;
    const d = c.type === 'percent' ? Math.round(sub * (+c.value || 0)) / 100 : (cur === 'VND' ? +c.valueVND : +c.valueUSD) || 0;
    disc = Math.min(sub, cur === 'VND' ? Math.round(d) : d);
  }
  const want = Math.max(0, sub - disc);
  return Math.abs(want - (+o.total || 0)) > (cur === 'VND' ? 1 : 0.01) ? `Theo giá hiện tại, đơn này phải là ${money(want, cur)}. Chỉ xác nhận khi đã nhận đủ số này.` : '';
}
async function grantLibrary(o){
  if (!o.uid) return toast('Đơn của khách vãng lai — hãy gửi file qua email.');
  const items = (o.items || []).filter(i => i.type !== 'physical'); if (!items.length) return;
  if (DEMO) return toast('Chế độ xem thử');
  const b = db.batch(); items.forEach(i => b.set(db.collection('users').doc(o.uid).collection('library').doc(i.id), { name:i.name, orderCode:o.code, grantedAt:TS() }));
  await b.commit(); toast(`Đã cấp quyền tải ${items.length} sản phẩm`);
}
CHANGES.orderStatus = async el => {
  const w = ['paid', 'shipped'].includes(el.value) && orderWarn((window._orders || {})[el.dataset.id] || {});
  if (w && !confirm('⚠ ' + w + '\n\nVẫn xác nhận đơn này?')) { tabOrders(); return; }
  try {
    if (!DEMO) await db.collection('orders').doc(el.dataset.id).update({ status:el.value });
    const o = (window._orders || {})[el.dataset.id]; if (o) { o.status = el.value; if (['paid', 'shipped'].includes(el.value)) await grantLibrary(o); }
    ok(); tabOrders();
  } catch (e) { fail(e); }
};

/* ---------------- Mã giảm giá ---------------- */
async function tabCoupons(){
  A('<p class="muted">Đang tải…</p>'); let list = []; try { list = await getAll('coupons'); } catch (e) { return fail(e); }
  A(`${aCard('Tạo mã giảm giá', `<div class="f3">${fld('Mã (VD: WELCOME10)', 'cp-code', '', 'style="text-transform:uppercase"')}${selectF('Loại', 'cp-type', [['percent', 'Giảm theo %'], ['fixed', 'Giảm số tiền cố định']], 'percent')}${fld('Hạn dùng (tuỳ chọn)', 'cp-exp', '', 'type="date"')}</div>
    <div class="f3 mt-s">${fld('% giảm', 'cp-val', '', 'type="number" min="1" max="100"')}${fld('Giảm VND (nếu cố định)', 'cp-vnd', '', 'type="number" min="0"')}${fld('Giảm USD (nếu cố định)', 'cp-usd', '', 'type="number" min="0" step="0.01"')}</div>
    <div class="f2 mt-s">${fld('Đơn tối thiểu VND', 'cp-minvnd', '', 'type="number" min="0"')}${fld('Đơn tối thiểu USD', 'cp-minusd', '', 'type="number" min="0" step="0.01"')}</div><div class="row mt"><button class="btn primary" data-act="saveCoupon">Lưu mã</button></div>`)}
    ${aCard('Các mã hiện có', list.length ? list.map(c => `<div class="ord-row"><div><b class="mono">${esc(c.id)}</b> ${c.active === false ? '<span class="badge muted">tắt</span>' : '<span class="badge live">đang bật</span>'}<div class="small muted">${c.type === 'percent' ? c.value + '%' : money(c.valueVND, 'VND') + ' / ' + money(c.valueUSD, 'USD')}${c.expires ? ' · hết hạn ' + esc(c.expires) : ''}</div></div><span class="row"><button class="btn secondary sm" data-act="toggleCoupon" data-id="${esc(c.id)}" data-on="${c.active === false ? 1 : 0}">${c.active === false ? 'Bật' : 'Tắt'}</button><button class="btn danger sm" data-act="delCoupon" data-id="${esc(c.id)}">Xoá</button></span></div>`).join('') : '<p class="muted">Chưa có mã nào.</p>')}`);
}

/* ---------------- Mã dùng thử ----------------
   trial_codes/<MÃ>: { active, days (số ngày dùng thử tính từ lúc khách kích hoạt), maxUses (0 = không giới hạn), uses, expiresAt (hạn cuối để nhập mã, null = không hạn), label }
   trial_redemptions/<uid>: { uid, code, startedAt, email, endsAt? (hạn riêng admin đặt cho người này) }
   Quyền thật nằm ở firestore.rules: khách không đọc được danh sách mã, kích hoạt được kiểm tra trên máy chủ. */
let editTrial = null;
const TRIAL_RE = /^[A-Z0-9-]{4,32}$/;
const trialEndMs = (r, codes) => { if (r.endsAt) return tsMs(r.endsAt); const c = codes.find(x => x.id === r.code); return c && c.active === true ? tsMs(r.startedAt) + (+c.days || 0) * 864e5 : 0; };
const vnDay = ms => DT.fromMillis(ms).setZone('Asia/Ho_Chi_Minh').toISODate();
async function tabTrials(){
  A('<p class="muted">Đang tải…</p>'); let codes = [], reds = [];
  try { codes = await getAll('trial_codes'); reds = await getAll('trial_redemptions', 'startedAt', 300); } catch (e) { return fail(e); }
  window._trialCodes = codes; window._trialReds = reds;
  const e = editTrial || {}, now = Date.now();
  const form = aCard(e.id ? `Sửa mã <span class="mono">${esc(e.id)}</span>` : 'Tạo mã dùng thử', `<p class="small muted">Khách đã đăng nhập nhập mã ở trang Planner hoặc Support → được dùng như Người đồng hành (Planner tuần, Focus không giới hạn) trong số ngày bạn đặt, tính từ lúc họ kích hoạt. Mỗi tài khoản chỉ dùng thử một lần.</p>
    <div class="f3">${fld('Mã (chữ in hoa, số, dấu -)', 'tr-code', e.id || '', 'style="text-transform:uppercase" maxlength="32" autocomplete="off"', '4–32 ký tự. Đổi mã thì người đang dùng mã cũ được chuyển sang mã mới.')}${fld('Số ngày dùng thử', 'tr-days', e.days ?? 7, 'type="number" min="1" max="365"', 'Tính từ lúc khách kích hoạt.')}${fld('Số lượt tối đa', 'tr-max', e.maxUses ?? 0, 'type="number" min="0" max="100000"', '0 = không giới hạn.')}</div>
    <div class="f3 mt-s">${fld('Hạn cuối để nhập mã (tuỳ chọn)', 'tr-exp', e.expiresAt ? vnDay(tsMs(e.expiresAt)) : '', 'type="date"', 'Hết ngày này (giờ Việt Nam) thì không kích hoạt mới được nữa.')}${fld('Ghi chú (tuỳ chọn)', 'tr-label', e.label || '', 'maxlength="80"', 'Người đã kích hoạt mã có thể thấy ghi chú này, đừng ghi điều bí mật.')}<div class="field"><label class="label">Trạng thái</label><label class="row small" style="font-weight:700"><input type="checkbox" id="tr-on" ${e.active === false ? '' : 'checked'}> Đang bật</label></div></div>
    <div class="row mt"><button class="btn secondary" data-act="trialGen">${ic('sliders', 'sm')} Tạo mã ngẫu nhiên</button><button class="btn primary" data-act="trialSave">${e.id ? 'Lưu thay đổi' : 'Tạo mã'}</button>${e.id ? '<button class="btn ghost" data-act="trialCancel">Huỷ sửa</button>' : ''}</div>`);
  const using = id => reds.filter(r => r.code === id && trialEndMs(r, codes) > now).length;
  const list = aCard(`Các mã (${codes.length})`, codes.length ? codes.map(c => `<div class="ord-row"><div><b class="mono">${esc(c.id)}</b> ${c.active === true ? '<span class="badge live">đang bật</span>' : '<span class="badge muted">tắt</span>'}${c.expiresAt && tsMs(c.expiresAt) < now ? ' <span class="badge muted">hết hạn nhập</span>' : ''}
      <div class="small muted">${+c.days || 0} ngày dùng thử · đã dùng ${+c.uses || 0}${+c.maxUses ? ' / ' + c.maxUses : ' (không giới hạn)'} lượt · ${using(c.id)} người đang dùng${c.expiresAt ? ' · nhập trước hết ngày ' + esc(DT.fromISO(vnDay(tsMs(c.expiresAt))).toFormat('dd/MM/yyyy')) : ''}</div>${c.label ? `<div class="small faint">${esc(c.label)}</div>` : ''}</div>
      <span class="row"><button class="btn secondary sm" data-act="trialEdit" data-id="${esc(c.id)}">Sửa</button><button class="btn secondary sm" data-act="trialToggle" data-id="${esc(c.id)}" data-on="${c.active === true ? 0 : 1}">${c.active === true ? 'Tắt' : 'Bật'}</button><button class="btn danger sm" data-act="trialDel" data-id="${esc(c.id)}">Xoá</button></span></div>`).join('') : '<p class="muted">Chưa có mã nào.</p>',
    '<span class="small faint">Tắt hoặc xoá mã: không ai kích hoạt mới được, và người đang dùng mã đó mất quyền ngay (bật lại thì ai còn trong hạn dùng tiếp).</span>');
  const people = aCard(`Người đã kích hoạt (${reds.length})`, reds.length ? reds.map(r => { const end = trialEndMs(r, codes), live = end > now;
      return `<div class="ord-row"><div><b>${esc(r.email || r.uid || r.id)}</b> ${live ? '<span class="badge live">đang dùng thử</span>' : '<span class="badge muted">đã hết</span>'}${r.endsAt ? ' <span class="badge">hạn riêng</span>' : ''}
        <div class="small muted">mã <span class="mono">${esc(r.code || '')}</span> · kích hoạt ${esc(dateStr(r.startedAt))}${end ? ' · ' + (live ? 'đến ' : 'hết lúc ') + esc(dateStr(end)) : ''}</div></div>
        <span class="row"><button class="btn secondary sm" data-act="trialExtend" data-id="${esc(r.id)}" data-d="7">+7 ngày</button><button class="btn secondary sm" data-act="trialSetEnd" data-id="${esc(r.id)}">Đặt ngày hết</button>${r.endsAt ? `<button class="btn ghost sm" data-act="trialFollow" data-id="${esc(r.id)}">Theo mã</button>` : ''}${live ? `<button class="btn secondary sm" data-act="trialStop" data-id="${esc(r.id)}">Dừng ngay</button>` : ''}<button class="btn danger sm" data-act="trialReset" data-id="${esc(r.id)}" title="Xoá lượt kích hoạt: tài khoản này được nhập mã dùng thử lại">Xoá</button></span></div>`; }).join('') : '<p class="muted">Chưa có ai kích hoạt.</p>',
    '<span class="small faint">"Xoá" = cho tài khoản đó dùng thử lại.</span>');
  A(form + list + people);
}
const trialRed = id => (window._trialReds || []).find(r => r.id === id) || {};
const setTrialEnd = (id, data) => DEMO ? (toast('Chế độ xem thử'), Promise.resolve()) : db.collection('trial_redemptions').doc(id).update(data).then(() => { ok(); tabTrials(); }).catch(fail);
Object.assign(ACTIONS, {
  trialGen: () => { const ch = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', a = new Uint32Array(8); crypto.getRandomValues(a); const s = [...a].map(n => ch[n % ch.length]).join(''); $('tr-code').value = 'TRY-' + s.slice(0, 4) + '-' + s.slice(4); },
  trialEdit: el => { editTrial = (window._trialCodes || []).find(c => c.id === el.dataset.id) || null; tabTrials(); window.scrollTo({ top:0, behavior:'smooth' }); },
  trialCancel: () => { editTrial = null; tabTrials(); },
  trialSave: async () => {
    const id = val('tr-code').toUpperCase().replace(/\s+/g, ''), days = Math.round(+val('tr-days')), maxUses = Math.round(+val('tr-max') || 0), exp = val('tr-exp'), old = editTrial && editTrial.id;
    if (!TRIAL_RE.test(id)) return alert('Mã chỉ gồm chữ in hoa A–Z, số và dấu -, dài 4–32 ký tự.');
    if (!(days >= 1 && days <= 365)) return alert('Số ngày dùng thử phải từ 1 đến 365.');
    if (!(maxUses >= 0)) return alert('Số lượt tối đa phải từ 0 trở lên (0 = không giới hạn).');
    if (DEMO) return toast('Chế độ xem thử: chưa lưu thật');
    const data = { active:$('tr-on').checked, days, maxUses, label:val('tr-label'), expiresAt:exp ? firebase.firestore.Timestamp.fromMillis(DT.fromISO(exp, { zone:'Asia/Ho_Chi_Minh' }).endOf('day').toMillis()) : null, updatedAt:TS() };
    try {
      const ref = db.collection('trial_codes').doc(id);
      if (id !== old && (await ref.get()).exists) return alert('Mã ' + id + ' đã có rồi. Chọn mã khác.');
      if (!old) { await ref.set({ ...data, uses:0, createdAt:TS() }); }
      else if (id === old) { await ref.set(data, { merge:true }); }
      else {                                    // đổi mã: tạo mã mới giữ số lượt đã dùng, chuyển người đang dùng sang mã mới, rồi xoá mã cũ
        if (!confirm(`Đổi mã ${old} thành ${id}? Mã cũ sẽ không dùng được nữa; người đã kích hoạt mã cũ được chuyển sang mã mới.`)) return;
        await ref.set({ ...data, uses:+editTrial.uses || 0, createdAt:editTrial.createdAt || TS() });
        const rs = await db.collection('trial_redemptions').where('code', '==', old).get();
        for (let i = 0; i < rs.docs.length; i += 400) { const b = db.batch(); rs.docs.slice(i, i + 400).forEach(d => b.update(d.ref, { code:id })); await b.commit(); }
        await db.collection('trial_codes').doc(old).delete();
      }
      editTrial = null; ok(old ? 'Đã lưu mã ' + id : 'Đã tạo mã ' + id + '. Copy mã để gửi cho khách.'); tabTrials();
    } catch (e) { fail(e); }
  },
  trialToggle: el => (DEMO ? (toast('Chế độ xem thử'), Promise.resolve()) : db.collection('trial_codes').doc(el.dataset.id).update({ active:el.dataset.on === '1', updatedAt:TS() })).then(tabTrials).catch(fail),
  trialDel: el => confirm(`Xoá mã ${el.dataset.id}? Người đang dùng thử bằng mã này mất quyền ngay (trừ người có hạn riêng).`) && (DEMO ? toast('Chế độ xem thử') : db.collection('trial_codes').doc(el.dataset.id).delete().then(() => { if (editTrial && editTrial.id === el.dataset.id) editTrial = null; tabTrials(); }).catch(fail)),
  trialExtend: el => { const r = trialRed(el.dataset.id), base = Math.max(Date.now(), trialEndMs(r, window._trialCodes || [])); setTrialEnd(el.dataset.id, { endsAt:firebase.firestore.Timestamp.fromMillis(base + +el.dataset.d * 864e5) }); },
  trialSetEnd: el => {
    const r = trialRed(el.dataset.id), cur = trialEndMs(r, window._trialCodes || []), v = prompt('Dùng thử đến hết ngày nào? (YYYY-MM-DD, giờ Việt Nam)', cur ? vnDay(cur) : DT.now().plus({ days:7 }).toISODate());
    if (v === null) return; const d = DT.fromISO(v.trim(), { zone:'Asia/Ho_Chi_Minh' }); if (!d.isValid) return alert('Ngày không hợp lệ, nhập dạng 2026-12-31');
    setTrialEnd(el.dataset.id, { endsAt:firebase.firestore.Timestamp.fromMillis(d.endOf('day').toMillis()) });
  },
  trialFollow: el => setTrialEnd(el.dataset.id, { endsAt:DEL() }),
  trialStop: el => confirm('Dừng dùng thử của tài khoản này ngay?') && setTrialEnd(el.dataset.id, { endsAt:firebase.firestore.Timestamp.now() }),
  trialReset: el => confirm('Xoá lượt kích hoạt này? Tài khoản đó mất quyền dùng thử hiện tại và được nhập mã dùng thử lại.') && (DEMO ? toast('Chế độ xem thử') : db.collection('trial_redemptions').doc(el.dataset.id).delete().then(tabTrials).catch(fail)),
});

/* ---------------- Nội dung & FAQ ---------------- */
let adminFaq = [];
function tabContent(){
  adminFaq = (Array.isArray(content.faq) && content.faq.length ? content.faq : [1, 2, 3, 4].map(i => ({ q:{ vi:I18N.vi['faq' + i + 'q'], en:I18N.en['faq' + i + 'q'] }, a:{ vi:I18N.vi['faq' + i + 'a'], en:I18N.en['faq' + i + 'a'] } }))).map(f => JSON.parse(JSON.stringify(f)));
  A(`${aCard('Sửa chữ & ảnh trực tiếp trên trang', `<p class="muted small">Bật chế độ sửa, rồi bấm vào bất kỳ chữ nào có viền nét đứt (tiêu đề, mô tả, phần Giới thiệu…) để gõ lại — tự lưu khi bạn bấm ra ngoài. Bấm vào ảnh để thay. Bạn viết bằng ngôn ngữ nào cũng được (đổi ngôn ngữ ở nút <b>Tuỳ chọn</b> trên thanh trên cùng): đúng câu bạn viết sẽ được <b>tự dịch sang mọi ngôn ngữ còn lại</b> ngay khi bạn bấm ra ngoài.</p>
      <div class="row mt-s"><button class="btn primary" data-act="startEdit">${ic('pen', 'sm')} Bật chế độ sửa (trang chủ)</button><button class="btn secondary" data-act="startEditAbout">Sửa trang Giới thiệu</button><button class="btn danger" data-act="resetTexts">Khôi phục toàn bộ chữ về mặc định</button></div>`)}
    ${aCard('Dịch tự động', `<p class="muted small">Từ giờ, mọi thứ bạn viết (chữ trên trang, bài viết, sản phẩm, FAQ, thông báo, lý do huỷ live…) đều tự dịch sang Tiếng Anh, Việt, Hindi, Nhật, Hàn, Trung, Pháp, Tây Ban Nha khi bạn bấm Lưu. Nội dung bạn viết <b>trước đây</b> thì bấm nút dưới để dịch bù một lần (chỉ dịch các ngôn ngữ còn thiếu, không đụng chữ bạn đã viết).</p>
      <div class="row mt-s"><button class="btn primary" data-act="translateAll">Dịch bù toàn bộ nội dung cũ</button></div><p class="hint" id="tr-status"></p>`)}
    ${aCard('Câu hỏi thường gặp (FAQ)', `<div id="faq-list">${faqRows()}</div><div class="row mt"><button class="btn secondary sm" data-act="faqAdd">${ic('plus', 'sm')} Thêm câu hỏi</button><button class="btn primary" data-act="saveFaq">Lưu FAQ</button></div>`)}`);
}
const faqRows = () => adminFaq.map((f, i) => `<div class="ad-slot" data-i="${i}"><div class="f2"><input class="input fq-qv" placeholder="Câu hỏi (VI)" value="${esc(f.q.vi || '')}"><input class="input fq-qe" placeholder="Question (EN)" value="${esc(f.q.en || '')}"></div><div class="f2 mt-s"><textarea class="textarea fq-av" placeholder="Trả lời (VI)">${esc(f.a.vi || '')}</textarea><textarea class="textarea fq-ae" placeholder="Answer (EN)">${esc(f.a.en || '')}</textarea></div><div class="row mt-s"><button class="btn ghost sm" data-act="faqMove" data-i="${i}" data-d="-1">${ic('up', 'sm')}</button><button class="btn ghost sm" data-act="faqMove" data-i="${i}" data-d="1">${ic('down', 'sm')}</button><button class="btn danger sm" data-act="faqDel" data-i="${i}">Xoá</button></div></div>`).join('');
const readFaq = () => [...document.querySelectorAll('#faq-list .ad-slot')].map(r => ({ q:{ vi:r.querySelector('.fq-qv').value.trim(), en:r.querySelector('.fq-qe').value.trim() }, a:{ vi:r.querySelector('.fq-av').value.trim(), en:r.querySelector('.fq-ae').value.trim() } }));

/* ---------------- Đánh giá ---------------- */
async function tabReviews(){
  A('<p class="muted">Đang tải…</p>'); let list = []; try { list = DEMO ? reviews.map(r => ({ ...r, approved:true })) : await getAll('reviews', 'createdAt'); } catch (e) { return fail(e); }
  A(aCard('Đánh giá của khách', list.length ? list.map(r => `<div class="ord-row"><div style="max-width:560px"><div class="row">${stars(+r.rating || 5)}<b>${esc(r.name || '')}</b>${r.approved ? '<span class="badge live">đang hiện</span>' : '<span class="badge warn">chờ duyệt</span>'}</div><p class="small muted">${esc(r.text)}</p></div><span class="row">${r.approved ? `<button class="btn secondary sm" data-act="reviewSet" data-id="${esc(r.id)}" data-v="0">Ẩn</button>` : `<button class="btn primary sm" data-act="reviewSet" data-id="${esc(r.id)}" data-v="1">Duyệt</button>`}<button class="btn danger sm" data-act="reviewDel" data-id="${esc(r.id)}">Xoá</button></span></div>`).join('') : '<p class="muted">Chưa có đánh giá.</p>'));
}

/* ---------------- Thanh toán ---------------- */
const PAY_FIELDS = { 'py-bin':'bankBin', 'py-acc':'accountNo', 'py-name':'accountName', 'py-stripe':'stripe', 'py-paypal':'paypal', 'py-kofi':'kofi', 'py-tpl':'orderTemplate', 'py-claimtpl':'claimTemplate' };
const PLAN_FIELDS = { 'py-dvnd':'donateVND', 'py-dusd':'donateUSD', 'py-comp':'companionUrl', 'py-cvnd':'companionVND', 'py-cusd':'companionUSD' };
/* lưu một nhóm ô vào settings/payments (merge: các ô của tab kia không bị đụng tới; fixPayUrls thêm cả khoá link rỗng của tab kia nên chỉ giữ khoá của nhóm này) */
const savePayFields = fields => { const raw = {}; Object.entries(fields).forEach(([id, k]) => raw[k] = val(id)); const fixed = fixPayUrls(raw), data = Object.fromEntries(Object.keys(raw).map(k => [k, fixed[k]])); dbSet('settings', 'payments', data).then(() => { Object.assign(payments, data); Object.entries(fields).forEach(([id, k]) => { const e = $(id); if (e) e.value = data[k] || ''; }); ok(); }).catch(fail); };
function tabPayments(){
  const p = payments;
  A(`${aCard('Chuyển khoản VietQR (khách Việt Nam)', `<div class="f3">${fld('Mã ngân hàng / BIN', 'py-bin', p.bankBin, '', 'VD: 970436 (Vietcombank), 970422 (MB)…')}${fld('Số tài khoản', 'py-acc', p.accountNo)}${fld('Tên chủ tài khoản', 'py-name', p.accountName, '', 'IN HOA, không dấu')}</div><p class="hint">Mã QR tự điền số tiền + mã đơn. Quét được bằng mọi app ngân hàng.</p>`)}
    ${aCard('Thanh toán quốc tế (mặc định cho mọi sản phẩm)', `<div class="f3">${fld('Stripe Payment Link (Visa/Mastercard)', 'py-stripe', p.stripe)}${fld('PayPal.me', 'py-paypal', p.paypal)}${fld('Ko-fi (tuỳ chọn, để trống nếu bạn không dùng)', 'py-kofi', p.kofi)}</div>`)}
    ${aCard('Email xác nhận đơn (EmailJS)', `${fld('Template ID', 'py-tpl', p.orderTemplate, '', 'Biến: {{user_name}} {{user_email}} {{order_code}} {{items}} {{total}}')}`)}
    ${aCard('Email báo cho bạn khi có người bấm “Tôi đã thanh toán” (EmailJS, tuỳ chọn)', `${fld('Template ID', 'py-claimtpl', p.claimTemplate, '', 'Tạo thêm một template trên EmailJS gửi tới CHÍNH email của bạn (ô To Email gõ cố định). Biến: {{user_name}} {{user_email}} {{months}} {{method}} (kofi / bank / paypal / other) {{note}} {{message}}. Để trống = không gửi email; bạn vẫn thấy thông báo ngay trên trang này khi đang mở web.')}`)}
    <button class="btn primary" data-act="savePay">Lưu thanh toán</button>`);
}
/* ---------------- Gói Người đồng hành ---------------- */
function tabPlan(){
  const p = payments;
  A(`${aCard('Giá và link thanh toán (trang Ủng hộ)', `<p class="hint" style="margin-bottom:10px">Trang Ủng hộ dùng thông tin VietQR (khách Việt Nam) và PayPal (khách nước ngoài) bạn nhập ở tab <b>Thanh toán</b>. Ở đây chỉ chỉnh giá và các mức tiền gợi ý.</p>
      <div class="f2">${fld('Các mức tiền gợi ý — VND (cách nhau dấu phẩy)', 'py-dvnd', p.donateVND, '', 'VD: 20000, 50000, 100000, 200000')}${fld('Các mức tiền gợi ý — USD', 'py-dusd', p.donateUSD, '', 'VD: 3, 5, 10, 25')}</div>
      <div class="f2">${fld('Giá "Người đồng hành" 1 tháng — VND', 'py-cvnd', p.companionVND, '', 'VD: 59000. Để trống = 59000. Gói 3 tháng tự giảm 10%, 12 tháng giảm 25%.')}${fld('Giá "Người đồng hành" 1 tháng — USD', 'py-cusd', p.companionUSD, '', 'VD: 3. Để trống = 3. Gói 3 tháng giảm 10%, 12 tháng giảm 25% (trả một lần qua PayPal.me).')}</div>
      ${fld('Link đăng ký hằng tháng cho "Người đồng hành"', 'py-comp', p.companionUrl, '', 'Tuỳ chọn, chỉ cho gói tự gia hạn (Ko-fi Membership hoặc Patreon). Chỉ dùng PayPal thì để trống: khách trả một lần qua PayPal.me ở tab Thanh toán.')}
      <div class="row mt-s"><button class="btn primary" data-act="saveCompPlan">Lưu giá và link</button></div>`)}
    ${aCard('Thanh mục tiêu duy trì web (trang Ủng hộ)', `<p class="hint" style="margin-bottom:10px">Thanh hiện ở đầu thẻ <b>Người đồng hành</b> trên trang Ủng hộ, ví dụ “7 / 20 người đồng hành”. Bấm <b>Đếm tự động</b> để web đếm số Người đồng hành còn hạn, rồi bấm <b>Lưu mục tiêu</b>. <b>Để trống Mục tiêu hoặc nhập 0 là ẩn thanh.</b></p>
      <div class="f3">${fld('Mục tiêu (số người)', 'gl-t', p.goalTarget, 'type="number" min="0" max="100000"', 'VD: 10 hoặc 20')}${fld('Hiện đã có (số người)', 'gl-n', p.goalNow, 'type="number" min="0" max="100000"', 'Bấm "Đếm tự động" để web đếm giúp bạn')}${fld('Dòng chữ trên thanh (tuỳ chọn)', 'gl-x', p.goalText, 'maxlength="80"', 'Để trống = tự dùng câu mặc định theo ngôn ngữ của khách')}</div>
      <div class="row mt-s"><button class="btn primary" data-act="saveGoal">Lưu mục tiêu</button><button class="btn secondary" data-act="goalCount" title="Đếm Người đồng hành còn hạn rồi điền vào ô Hiện đã có">Đếm tự động</button></div>`)}
    ${aCard('Khuyến mãi: tặng thêm tháng khi thành Người đồng hành (gói 3 / 12 tháng)', `<p class="hint" style="margin-bottom:10px">Không giảm giá. Khi bật, khách thấy thông báo 🔥 kiểu “Thành Người đồng hành, được tặng thêm 1 tháng” và nhãn “+1 tháng” ở gói 3 và 12 tháng. Áp dụng cho <b>mọi cách thanh toán</b> (VND, Ko-fi, PayPal) vì khi bạn bấm <b>Duyệt</b> ở tab Thành viên, web tự cộng số tháng tặng vào ngày hết hạn (thông báo ghi rõ “đã cộng thêm N tháng tặng”). Giá và mã QR giữ nguyên như giá gói thường.</p>
      <label class="row" style="font-weight:700"><input type="checkbox" id="pm-on" ${p.promoOn === true ? 'checked' : ''}> Bật khuyến mãi</label>
      <div class="f2 mt-s">${fld('Tên chương trình (hiện cho khách)', 'pm-label', p.promoLabel || '', 'maxlength="40"', 'VD: Khuyến mãi tháng 11. Để trống = “Ưu đãi đặc biệt”')}<div></div></div>
      <div class="f2 mt-s">${fld('Tặng thêm cho gói 3 tháng (số tháng)', 'pm-m3', p.promoMonths3 === undefined ? 1 : +p.promoMonths3 || 0, 'type="number" min="0" max="12"', 'Mặc định 1 tháng. 0 = không tặng gói này')}${fld('Tặng thêm cho gói 12 tháng (số tháng)', 'pm-m12', p.promoMonths12 === undefined ? 1 : +p.promoMonths12 || 0, 'type="number" min="0" max="12"', 'Mặc định 1 tháng. 0 = không tặng gói này')}</div>
      <div class="f2 mt-s">${fld('Bắt đầu từ ngày (tuỳ chọn)', 'pm-start', p.promoStart || '', 'type="date"', 'Để trống = áp dụng ngay')}${fld('Kết thúc vào ngày (tuỳ chọn)', 'pm-end', p.promoEnd || '', 'type="date"', 'Để trống = không giới hạn. Tính theo giờ Việt Nam, gồm cả ngày này')}</div>
      <div class="row mt-s"><button class="btn primary" data-act="saveCompPromo">Lưu khuyến mãi</button></div>`)}
    ${aCard('Ưu đãi Hành trình trăng (mốc 60 ngày điểm danh)', `<p class="hint" style="margin-bottom:10px">Khi khách điểm danh đủ <b>60 ngày liên tiếp</b>, họ nhận <b>ưu đãi tặng thêm tháng Người đồng hành</b>, dùng được <b>một lần</b>, áp dụng cho <b>mọi cách thanh toán</b> (không giảm giá, giá và mã QR giữ nguyên). Khi khách bấm “Tôi đã thanh toán”, ở tab <b>Thành viên</b> bạn sẽ thấy dòng 🎁 ghi rõ ưu đãi; bấm Duyệt thì tháng tặng tự cộng vào ngày hết hạn và ưu đãi tự đánh dấu đã dùng.</p>
      <label class="row" style="font-weight:700"><input type="checkbox" id="mr-on" ${p.moonRewardOn !== false ? 'checked' : ''}> Bật ưu đãi</label>
      <div class="f2 mt-s">${fld('Tặng thêm bao nhiêu tháng (1–12)', 'mr-months', moonRewardCfg(p).months, 'type="number" min="1" max="12"', 'Mặc định 1 tháng')}${fld('Có hiệu lực bao nhiêu ngày kể từ lúc khách nhận (1–365)', 'mr-days', moonRewardCfg(p).days, 'type="number" min="1" max="365"', 'Mặc định 30 ngày. Hết hạn thì ưu đãi không dùng được nữa')}</div>
      <div class="row mt-s"><button class="btn primary" data-act="saveMoonReward">Lưu ưu đãi</button></div><p class="hint">Thay đổi chỉ áp dụng cho ưu đãi nhận SAU khi lưu; ưu đãi khách đã nhận giữ nguyên hạn lúc nhận. Ưu đãi giảm % nhận từ trước (nếu chưa dùng) được đổi thành tặng thêm số tháng đang cài đặt ở đây.</p>`)}
    ${aCard('Giới hạn Phòng tập trung (cho người xem miễn phí)', `<p class="hint" style="margin-bottom:10px">Người xem miễn phí chỉ tập trung được tối đa số phút này mỗi ngày. <b>Người đồng hành và bạn (admin) không bị giới hạn.</b> Điền <b>0</b> để bỏ giới hạn cho mọi người. Mặc định 120 phút (2 tiếng).</p>
      <div class="f2">${fld('Số phút tối đa mỗi ngày', 'py-flimit', branding.focusLimit ?? 120, 'type="number" min="0" max="1440"')}<div class="field" style="justify-content:flex-end"><button class="btn primary" data-act="saveFocusLimit">Lưu giới hạn</button></div></div>`)}
    ${aCard('Nhóm học trực tiếp (chỉ cho Người đồng hành)', `<p class="hint" style="margin-bottom:10px">Khi bật, trong <b>Phòng tập trung</b> có khung <b>Nhóm học</b>: Người đồng hành (và người đang dùng thử, và bạn) xem được ai đang học, đã học bao lâu, cùng <b>bảng xếp hạng giờ tập trung trong tuần</b> (làm mới mỗi thứ Hai 00:00 giờ Việt Nam). Khách thường chỉ thấy lời mời trở thành Người đồng hành. Mỗi người tự đặt biệt danh khi tham gia (không lấy tên hay email). Bạn xoá được một người bằng nút × cạnh tên trong bảng xếp hạng.</p>
      <label class="row" style="font-weight:700"><input type="checkbox" id="grp-on" ${branding.groupOn === true ? 'checked' : ''}> Bật nhóm học</label>
      <div class="row mt-s"><button class="btn primary" data-act="saveGroup">Lưu</button></div>
      <p class="hint">Nhóm chỉ đọc 1 tài liệu mỗi lần làm mới (60 giây) nên rất nhẹ cho gói miễn phí; nếu hôm nào hết hạn mức miễn phí của Firebase thì nhóm tạm nghỉ đến hôm sau, bạn không bị tính tiền. Tắt ô này bất cứ lúc nào để ẩn nhóm.</p>`)}`);
}

/* ---------------- Sự kiện học chung theo mùa (xem pages.js → SEV) ----------------
   settings/season = { id, on, n:{tên 8 ngôn ngữ}, s, e (ms), sd, ed ('YYYY-MM-DD' giờ Việt Nam), g:mục tiêu phút, t }.
   Phút góp nằm ở season_event/<id>.c = { uid:{ m, t, f } }. Admin xem tổng, top 10 và xoá được phần góp của một người (khi nghi gian lận). */
let sevNewMode = false;
async function tabSeason(){
  const e = season && season.id ? season : null, fresh = sevNewMode || !e, ph = e ? sevPhase(e) : '';
  const z = DT.now().setZone(SEV_TZ), today = z.toISODate();
  const f = fresh ? { vi:'Thử thách 7 ngày', en:'7-day challenge', sd:today, ed:z.plus({ days:6 }).toISODate(), g:10000, ms:'25, 50, 75, 100', pre:7, post:7, rvi:'', ren:'' } : { vi:(e.n || {}).vi || '', en:(e.n || {}).en || '', sd:e.sd, ed:e.ed, g:e.g, ms:sevMsOf(e).join(', '), pre:sevDays(e, 'pre'), post:sevDays(e, 'post'), rvi:(e.r || {}).vi || '', ren:(e.r || {}).en || '' };
  const stTxt = !e ? 'Chưa có sự kiện nào.' : e.on === false ? 'Đang ẩn (khách không thấy).' : ph === 'soon' ? 'Sắp diễn ra (khách thấy trước 7 ngày).' : ph === 'live' ? 'Đang diễn ra.' : 'Đã kết thúc (khách còn thấy kết quả 7 ngày).';
  A(`${e ? aCard('Sự kiện hiện tại', `<p><b>${esc(L(e.n) || '(không tên)')}</b> · ${esc(DT.fromISO(e.sd).toFormat('dd/MM/yyyy'))} đến ${esc(DT.fromISO(e.ed).toFormat('dd/MM/yyyy'))} · mục tiêu ${sevNum(e.g)} phút</p>
      <p class="small muted">${esc(stTxt)} Mã sự kiện: <code>${esc(e.id)}</code></p><div id="sev-stats" class="mt-s small muted">${ph === 'soon' ? 'Chưa bắt đầu nên chưa có phút góp.' : 'Đang tải số phút…'}</div>
      <div class="row mt-s">${ph !== 'end' && e.on !== false ? '<button class="btn secondary" data-act="sevEndNow">Kết thúc ngay</button>' : ''}<button class="btn secondary" data-act="sevToggle">${e.on === false ? 'Hiện lại cho khách' : 'Ẩn khỏi trang'}</button>${!sevNewMode ? '<button class="btn ghost" data-act="sevNew">Tạo sự kiện mới</button>' : ''}</div>`) : ''}
    ${aCard(fresh ? 'Tạo sự kiện mới' : 'Sửa sự kiện hiện tại', `<p class="hint" style="margin-bottom:10px">Cả cộng đồng cùng góp số phút tập trung vào một thanh tiến độ chung, hiện ở <b>Tổng quan</b> (dưới khối chào) và <b>Phòng tập trung</b> (dưới bộ đếm). Chỉ phút của <b>phiên tập trung chạy hết giờ</b> trong thời gian sự kiện được tính, và chỉ người đã đăng nhập mới góp được. Các mốc chúc mừng, số ngày hiện trước / sau và dòng phần thưởng do bạn tự đặt ở dưới. Ngày tính theo giờ Việt Nam, gồm cả ngày kết thúc. Mỗi lúc chỉ có một sự kiện.</p>
      ${fresh && e ? '<p class="small" style="color:var(--danger)">Tạo sự kiện mới sẽ thay sự kiện hiện tại (phút đã góp của sự kiện cũ vẫn còn trong Firestore nhưng không hiện nữa).</p>' : ''}
      <div class="f2">${fld('Tên sự kiện (Tiếng Việt)', 'sv-vi', f.vi, 'maxlength="60"', 'Viết ở ô nào cũng được, các ngôn ngữ khác tự dịch khi bấm Lưu')}${fld('Event name (English)', 'sv-en', f.en, 'maxlength="60"')}</div>
      <div class="f3">${fld('Ngày bắt đầu', 'sv-sd', f.sd, 'type="date"')}${fld('Ngày kết thúc', 'sv-ed', f.ed, 'type="date"', 'Tối đa 92 ngày')}${fld('Mục tiêu tổng (phút)', 'sv-g', f.g, 'type="number" min="10" max="10000000" inputmode="numeric"', 'Gợi ý: 10.000 phút ≈ 167 giờ, hợp cho khoảng 50 người học đều trong 7 ngày')}</div>
      <div class="f3 mt-s">${fld('Các mốc chúc mừng (%)', 'sv-ms', f.ms, 'inputmode="numeric"', 'Cách nhau dấu phẩy, tối đa 8 mốc, từ 1 đến 100. Mặc định 25, 50, 75, 100. Để trống = mặc định')}${fld('Hiện cho khách trước khi bắt đầu (ngày)', 'sv-pre', f.pre, 'type="number" min="0" max="60"', '0 = chỉ hiện từ ngày bắt đầu. Mặc định 7')}${fld('Còn hiện kết quả sau khi kết thúc (ngày)', 'sv-post', f.post, 'type="number" min="0" max="60"', '0 = ẩn ngay khi kết thúc. Mặc định 7')}</div>
      <div class="f2 mt-s">${fld('Phần thưởng / lời hứa (Tiếng Việt, tuỳ chọn)', 'sv-rvi', f.rvi, 'maxlength="120"', 'VD: Đạt mục tiêu, live đặc biệt tối Chủ nhật. Hiện dưới thanh tiến độ. Để trống = ẩn')}${fld('Reward (English, optional)', 'sv-ren', f.ren, 'maxlength="120"')}</div>
      <div class="row mt-s"><button class="btn primary" data-act="sevSave" data-new="${fresh ? 1 : 0}">${fresh ? 'Tạo sự kiện' : 'Lưu thay đổi'}</button>${sevNewMode ? '<button class="btn ghost" data-act="sevCancel">Huỷ</button>' : ''}</div>
      <p class="hint">Lần đầu dùng tính năng này cần <b>dán lại firestore.rules</b> (SETUP.md, PHẦN 2.3). Chưa dán thì khách vẫn thấy thanh nhưng phút góp bị từ chối.</p>`)}`);
  if (!e || ph === 'soon' || DEMO) { if (DEMO && e && ph !== 'soon') { const s = $('sev-stats'); if (s) s.textContent = 'Chế độ xem thử: không đọc Firestore.'; } return; }
  try {
    const d = await withTimeout(db.collection('season_event').doc(e.id).get()), c = (d.exists && d.data().c) || {};
    const rows = Object.entries(c).map(([u, v]) => [u, Math.max(0, +(v && v.m) || 0)]).filter(r => r[1] > 0).sort((a, b) => b[1] - a[1]);
    const tot = rows.reduce((a, r) => a + r[1], 0), top = rows.slice(0, 10), names = {};
    await Promise.all(top.map(([u]) => db.collection('users').doc(u).get().then(x => { if (x.exists) names[u] = x.data().displayName || ''; }).catch(() => {})));
    const s = $('sev-stats'); if (!s) return;
    s.innerHTML = `<b style="color:var(--ink)">${sevNum(tot)} / ${sevNum(e.g)} phút (${Math.floor(tot / e.g * 100)}%)</b> · ${sevNum(rows.length)} người đã góp
      ${top.length ? `<div class="label mt-s">Góp nhiều nhất</div><ol class="sev-top">${top.map(([u, m]) => `<li><span>${esc(names[u] || u.slice(0, 8) + '…')}</span><b>${sevNum(m)} phút</b><button class="btn ghost icon sm" data-act="sevDrop" data-u="${esc(u)}" data-n="${esc(names[u] || u.slice(0, 8))}" title="Xoá phần góp của người này (khi nghi gian lận)" aria-label="Xoá phần góp">${ic('trash', 'sm')}</button></li>`).join('')}</ol>` : ''}`;
    store.set('sev_c', { id:e.id, tot, n:rows.length, at:Date.now(), mine:state.user && c[state.user.uid] ? { [state.user.uid]:+c[state.user.uid].m || 0 } : {}, u:state.user ? state.user.uid : '' });
  } catch (x) { const s = $('sev-stats'); if (s) s.textContent = 'Không tải được số phút: ' + (x.code || x.message || x); }
}
const sevSaveCfg = async v => { if (!DEMO) await db.collection('settings').doc('season').set(v); season = v; store.set('sev_c', null); };
Object.assign(ACTIONS, {
  sevNew: () => { sevNewMode = true; tabSeason(); },
  sevCancel: () => { sevNewMode = false; tabSeason(); },
  sevSave: el => withTranslate(el, async () => {
    const sd = val('sv-sd'), ed = val('sv-ed'), g = Math.round(+val('sv-g') || 0), vi = val('sv-vi').slice(0, 60), en = val('sv-en').slice(0, 60);
    const S = DT.fromISO(sd, { zone:SEV_TZ }), E = DT.fromISO(ed, { zone:SEV_TZ });
    if (!vi && !en) return alert('Bạn nhập tên sự kiện nhé.');
    if (!S.isValid || !E.isValid || ed < sd) return alert('Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.');
    if (E.diff(S, 'days').days > 92) return alert('Sự kiện dài tối đa 92 ngày.');
    if (!(g >= 10 && g <= 10000000)) return alert('Mục tiêu từ 10 đến 10.000.000 phút.');
    const isNew = el.dataset.new === '1' || !season || !season.id, old = isNew ? {} : (season.n || {});
    if (isNew && E.endOf('day').toMillis() < Date.now()) return alert('Ngày kết thúc đã qua. Chọn ngày từ hôm nay trở đi.');
    const msRaw = val('sv-ms'), msList = msRaw ? msRaw.split(/[,\s]+/).filter(Boolean).map(Number) : [25, 50, 75, 100];
    if (msList.length > 8 || msList.some(x => !Number.isInteger(x) || x < 1 || x > 100)) return alert('Các mốc là số nguyên từ 1 đến 100, cách nhau dấu phẩy, tối đa 8 mốc.');
    const ms = [...new Set(msList)].sort((a, b) => a - b), dayOf = id => { const v = val(id); return v === '' ? 7 : Math.round(+v); }, pre = dayOf('sv-pre'), post = dayOf('sv-post');
    if (![pre, post].every(x => x >= 0 && x <= 60)) return alert('Số ngày hiện trước / sau từ 0 đến 60.');
    const n = await TR.fill(old, { vi, en }), rvi = val('sv-rvi').slice(0, 120), ren = val('sv-ren').slice(0, 120);
    const r = rvi || ren ? await TR.fill(isNew ? {} : (season.r || {}), { vi:rvi, en:ren }) : {};
    const id = isNew ? 's' + sd.replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 6) : season.id;
    await sevSaveCfg({ id, on:isNew ? true : season.on !== false, n, s:S.startOf('day').toMillis(), e:E.endOf('day').toMillis(), sd, ed, g, ms, pre, post, r, t:Date.now() });
    sevNewMode = false; ok(trMsg(isNew ? 'Đã tạo sự kiện.' : 'Đã lưu sự kiện.')); tabSeason();
  }).catch(fail),
  sevEndNow: async () => {
    const e = season; if (!e || !confirm('Kết thúc sự kiện ngay bây giờ? Khách sẽ thấy kết quả cuối trong 7 ngày, phiên tập trung sau lúc này không được cộng nữa.')) return;
    try { const now = Date.now(); await sevSaveCfg({ ...e, e:Math.max(e.s, now), ed:DT.fromMillis(Math.max(e.s, now)).setZone(SEV_TZ).toISODate(), t:now }); ok('Đã kết thúc sự kiện'); tabSeason(); } catch (x) { fail(x); }
  },
  sevToggle: async () => { const e = season; if (!e) return; try { await sevSaveCfg({ ...e, on:e.on === false, t:Date.now() }); ok(e.on === false ? 'Đã hiện lại sự kiện' : 'Đã ẩn sự kiện'); tabSeason(); } catch (x) { fail(x); } },
  sevDrop: async el => {
    const e = season, u = el.dataset.u; if (!e || !u || !confirm(`Xoá toàn bộ phút ${el.dataset.n || ''} đã góp vào sự kiện này? Không hoàn tác được.`)) return;
    try { if (!DEMO) await db.collection('season_event').doc(e.id).update({ ['c.' + u]:DEL() }); ok('Đã xoá phần góp'); tabSeason(); } catch (x) { fail(x); }
  }
});

/* ---------------- Thành viên ---------------- */
/* ---- Mục cảm ơn: settings/supporters { items:[{ id, name, show, since, until }] } — công khai, chỉ hiện tên ---- */
const supItem = id => (supporters.items || []).find(x => x.id === id);
async function supSave(items){ if (!DEMO) await db.collection('settings').doc('supporters').set({ items }); supporters = { items }; }
async function supUpsert(id, patch){ const items = [...(supporters.items || [])], i = items.findIndex(x => x.id === id); if (i >= 0) items[i] = { ...items[i], ...patch }; else items.push({ id, name:'', show:true, since:DT.now().toISODate(), ...patch }); await supSave(items); }
const supRemove = id => supSave((supporters.items || []).filter(x => x.id !== id));
/* Yêu cầu Companions: người dùng bấm "Tôi đã thanh toán" → companion_requests/<uid>. Admin nghe realtime để hiện số chờ duyệt ở menu. */
let reqUnsub = null, reqFirst = true;
function notifyNewRequest(r){                  // có người vừa bấm "Tôi đã thanh toán" khi admin đang mở web: toast + chuông + thông báo trình duyệt (nếu đã bật)
  const who = r.email || r.name || '—'; toast('Có yêu cầu Người đồng hành mới: ' + who);
  try { if (typeof soundPlay === 'function') soundPlay('admin'); } catch (e) {}
  try { if ('Notification' in window && Notification.permission === 'granted') new Notification(branding.name, { body:'Yêu cầu Companions mới: ' + who + (r.months ? ' · ' + r.months + ' tháng' : '') }); } catch (e) {}
}
function adminWatchRequests(){
  if (reqUnsub || DEMO || !state.isAdmin) return;
  reqFirst = true;
  reqUnsub = db.collection('companion_requests').where('status', '==', 'pending').onSnapshot(sn => {
    const n = sn.size;
    if (reqFirst) { reqFirst = false; if (n) toast(`Có ${n} yêu cầu Người đồng hành chờ duyệt`); }
    else (sn.docChanges ? sn.docChanges() : []).forEach(ch => { if (ch.type === 'added') notifyNewRequest(ch.doc.data()); });
    if (n !== state.compPending) { state.compPending = n; render(true); }
  }, e => console.warn('requests', e.code));
}
function stopAdminWatch(){ if (reqUnsub) { reqUnsub(); reqUnsub = null; } state.compPending = 0; reqFirst = true; }
const METHOD_VI = { kofi:'Ko-fi', bank:'Chuyển khoản', paypal:'PayPal', momo:'MoMo', other:'Khác' };      // momo: chỉ để hiện đúng yêu cầu cũ, web không còn cho chọn MoMo
/* Chuỗi điểm danh Hành trình trăng của một người, đọc từ hồ sơ users/<uid>.moon (admin đọc được): chuỗi hiện tại (còn sống nếu ngày cuối là hôm nay/hôm qua giờ VN), dài nhất, và đã đạt mốc 60 ngày chưa (cùng điều kiện với firestore.rules) */
function moonStat(m){
  const days = [...new Set(Array.isArray(m && m.days) ? m.days : [])].filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort(), last = days[days.length - 1] || '';
  let i = days.length - 1; while (i > 0 && DT.fromISO(days[i - 1]).plus({ days:1 }).toISODate() === days[i]) i--;
  const run = days.length ? days.length - i : 0, today = DT.now().setZone('Asia/Ho_Chi_Minh'), alive = !!last && (last === today.toISODate() || last === today.minus({ days:1 }).toISODate());
  return { run, from:run ? days[i] : '', to:last, alive, best:Math.max(+(m && m.best) || 0, run), reached:(+(m && m.best) || 0) >= 60 || days.length >= 60 };
}
const dMY = k => k ? k.split('-').reverse().join('/') : '';
const moonLine = m => { if (!m) return 'Chưa bắt đầu hành trình trăng'; const s = moonStat(m); return `Hành trình trăng: ${s.alive ? `chuỗi hiện tại <b>${s.run} ngày</b> (${dMY(s.from)} – ${dMY(s.to)})` : s.run ? `chuỗi đã đứt (lần cuối ${dMY(s.to)})` : 'chưa có ngày điểm danh'} · dài nhất <b>${s.best} ngày</b>${m.rounds ? ' · ' + m.rounds + ' lần trăng tròn' : ''}`; };
/* Trạng thái ưu đãi mốc 60 ngày của một người: rw = moon_rewards/<uid> (null = chưa nhận, undefined = chưa tải) */
function rewardBadge(m, rw){
  const s = moonStat(m), cfg = moonRewardCfg();
  if (rw) {
    const mo = moonRewardMonths(rw), exp = DT.fromMillis(tsMs(rw.expires)).setZone('Asia/Ho_Chi_Minh').toISODate();
    if (rw.status === 'used') return `🎁 Ưu đãi +${mo} tháng: <b>đã dùng</b>${rw.usedAt ? ' ngày ' + dMY(DT.fromMillis(tsMs(rw.usedAt)).setZone('Asia/Ho_Chi_Minh').toISODate()) : ''}`;
    return tsMs(rw.expires) > Date.now() ? `🎁 Ưu đãi +${mo} tháng: <b>đã nhận, còn hạn đến ${dMY(exp)}</b>, chưa dùng` : `🎁 Ưu đãi +${mo} tháng: đã nhận, <b>hết hạn</b> ${dMY(exp)} (chưa dùng)`;
  }
  if (s.reached) return rw === undefined ? '⭐ Đã đạt mốc 60 ngày' : `⭐ Đã đạt mốc 60 ngày, <b>chưa nhận</b> ưu đãi${cfg.on ? '' : ' (ưu đãi đang tắt)'}`;
  return s.alive || s.run ? `Còn ${Math.max(0, 60 - s.best)} ngày nữa tới mốc 60 (dài nhất ${s.best})` : '';
}
/* Tải ưu đãi của những người đã đạt mốc 60 ngày trong danh sách đang hiện (mỗi người một lần, lưu trong MEM.rw 5 phút) để tab Thành viên không phải đọc cả bộ sưu tập */
async function memRewards(users){
  MEM.rw = MEM.rw || {};
  const need = users.filter(u => u.moon && moonStat(u.moon).reached && MEM.rw[u.id] === undefined);
  await Promise.all(need.map(async u => { try { const d = await db.collection('moon_rewards').doc(u.id).get(); MEM.rw[u.id] = d.exists ? d.data() : null; } catch (e) { console.warn('rewards', e.code); } }));
  return need.length;
}
/* Số tháng tặng từ ưu đãi Hành trình trăng của một yêu cầu chờ duyệt: chỉ khi khách báo dùng, ưu đãi còn chưa dùng và còn hạn lúc họ gửi yêu cầu */
const rewardMonthsFor = r => { const w = r._rw; return r.reward && w && w.status === 'unused' && tsMs(w.expires) > tsMs(r.createdAt) ? moonRewardMonths(w) : 0; };
/* Dòng trong yêu cầu chờ duyệt: số tháng tặng sẽ được cộng khi bấm Duyệt (khuyến mãi + ưu đãi trăng) và số tiền VND đúng cần nhận (giá gói thường) */
function rewardLine(r){
  const w = r._rw, m = +r.months || 1, ms = tsMs(r.createdAt), live = !!w && w.status === 'unused' && tsMs(w.expires) > ms, warn = s => `<div class="small" style="color:var(--danger);margin-top:2px">${s}</div>`;
  let out = r._rwErr ? warn('⚠ Chưa tải được ưu đãi của khách nên tạm khoá nút Duyệt. <button class="btn secondary sm" data-act="memReload">Thử lại</button>') : '';
  if (r.reward || w) out += `<div class="small faint" style="margin-top:2px">${moonLine(r._mj)}${r._mj && !moonStat(r._mj).reached ? ' · <span style="color:var(--danger)">chưa thấy đạt 60 ngày</span>' : ''}</div>`;
  if (r.reward && !w) out += warn('⚠ Khách báo dùng ưu đãi Hành trình trăng nhưng KHÔNG có ưu đãi nào trong hệ thống: không cộng tháng tặng cho ưu đãi này');
  else if (w && !live) out += warn(`🎁 Ưu đãi Hành trình trăng ${w.status === 'used' ? 'đã dùng rồi' : 'đã hết hạn'}: không cộng tháng tặng cho ưu đãi này`);
  else if (w) out += `<div class="small" style="margin-top:2px">🎁 Có ưu đãi Hành trình trăng tặng thêm <b>${moonRewardMonths(w)} tháng</b> (đến ${esc(DT.fromMillis(tsMs(w.expires)).toISODate())}): ${r.reward ? 'khách báo đã dùng, bấm Duyệt sẽ tự cộng và đánh dấu đã dùng' : 'khách chưa báo dùng nên Duyệt sẽ không cộng'}.</div>`;
  const bd = compBonusMonths(m, ms); if (bd) out += `<div class="small" style="margin-top:2px">🎁 Khuyến mãi tặng thêm <b>${bd} tháng</b>: bấm Duyệt sẽ tự cộng vào ngày hết hạn (áp dụng mọi cách thanh toán). Nếu bạn đổi số tháng ở ô chọn thì tháng tặng tự tính lại theo gói.</div>`;
  if (r.method === 'bank' && m > 1) out += `<div class="small" style="margin-top:2px">💰 Số tiền VND đúng: <b>${money(compPrice(m), 'VND')}</b>${r.amount && +r.amount !== compPrice(m) ? ` · <span style="color:var(--danger)">khách báo ${money(+r.amount, 'VND')}</span>` : ''}</div>`;
  return out;
}
async function approveCompanion(id, name, months = 1, email = '', bonusMonths = 0){
  const ref = db.collection('companions').doc(id), cur = await ref.get(), today = DT.now().toISODate(), old = cur.exists ? cur.data().until : '';
  const base = old && old > today ? DT.fromISO(old) : DT.now(), until = base.plus({ months:months + bonusMonths }).toISODate();           // gia hạn thì cộng tiếp từ ngày hết hạn cũ
  await ref.set({ name:name || (cur.exists ? cur.data().name : '') || '', email:email || (cur.exists ? cur.data().email : '') || '', since:cur.exists && cur.data().since || TS(), until });
  if (supItem(id)) await supUpsert(id, { until }); else await supUpsert(id, { name:name || '', show:true, until, ...(cur.exists && sinceISO(cur.data().since) ? { since:sinceISO(cur.data().since) } : {}) });     // giữ ngày bắt đầu đồng hành thật (mốc người đồng hành lâu năm)
  return until;
}
Object.assign(ACTIONS, {
  compApprove: async el => {
    try { if (DEMO) return toast('Chế độ xem thử'); const sel = $('cm-' + el.dataset.id), mo = sel ? +sel.value || 1 : 1, rwm = +el.dataset.rwm || 0, bonus = compBonusMonths(mo, +el.dataset.ts || Date.now()) + rwm, until = await approveCompanion(el.dataset.id, el.dataset.name, mo, el.dataset.email, bonus); if (rwm) await db.collection('moon_rewards').doc(el.dataset.id).update({ status:'used', usedAt:TS() }).catch(e => console.warn('reward used', e.code)); await db.collection('companion_requests').doc(el.dataset.id).delete(); ok('Đã duyệt. Planner mở cho họ đến ' + until + (bonus ? ` (đã cộng thêm ${bonus} tháng tặng)` : '')); tabMembers(); } catch (e) { fail(e); }
  },
  compRenew: async el => {
    try { if (DEMO) return toast('Chế độ xem thử'); const sel = $('rn-' + el.dataset.id), until = await approveCompanion(el.dataset.id, el.dataset.name, sel ? +sel.value || 1 : 1, el.dataset.email); ok('Đã gia hạn đến ' + until); tabMembers(); } catch (e) { fail(e); }
  },
  enableNotif: async () => { try { const r = await Notification.requestPermission(); toast(r === 'granted' ? 'Đã bật thông báo' : 'Chưa bật thông báo'); tabMembers(); } catch (e) { fail(e); } },
  memMore: async () => { try { await memLoadMore(); await memRewards(MEM.users); membersView(MEM.users, window._signups || [], window._memComps || [], window._memReqs || []); } catch (e) { fail(e); } },
  memReload: () => { Object.assign(MEM, { users:[], last:null, done:false, at:0, busy:false, rw:{} }); MEM.gen++; tabMembers(); },
  hardReload: () => { location.href = location.pathname + '?r=' + Date.now() + location.hash; },
  memFind: async () => {
    const q = ($('mem-q') || {}).value; if (!q || !q.trim()) return; const m = q.trim();
    try { let sn = await db.collection('users').where('email', '==', m).limit(5).get(); if (sn.empty && m !== m.toLowerCase()) sn = await db.collection('users').where('email', '==', m.toLowerCase()).limit(5).get(); if (sn.empty) return toast('Không thấy email này'); MEM.users = sn.docs.map(d => ({ id:d.id, ...d.data() })); MEM.done = true; await memRewards(MEM.users); membersView(MEM.users, window._signups || [], window._memComps || [], window._memReqs || []); } catch (e) { fail(e); }
  },
  compReject: async el => {
    try { if (DEMO) return toast('Chế độ xem thử'); await db.collection('companion_requests').doc(el.dataset.id).update({ status:'rejected', rejectedAt:TS() }); ok('Đã từ chối'); tabMembers(); } catch (e) { fail(e); }
  }
});
/* Thành viên: mỗi hồ sơ người dùng khá nặng (việc cần làm, nhật ký tập trung, Moon Journey…) nên KHÔNG đọc hết một lúc: hiện ngay phần nhẹ (yêu cầu chờ duyệt, người sắp hết hạn), rồi tải 25 người một lần, có tìm theo email và nhớ kết quả 5 phút */
const MEM = { users:[], last:null, done:false, at:0, busy:false, gen:0 };
const MEM_PAGE = 25, userMail = u => (u.email || '').toLowerCase();
async function memLoadMore(){
  if (MEM.busy || MEM.done) return; MEM.busy = true; const g = MEM.gen = MEM.gen || 0;      // g: lần tải bị bỏ (đã bắt đầu lại) thì kết quả trễ không được chen vào danh sách
  try {
    let q = db.collection('users').orderBy(firebase.firestore.FieldPath.documentId()).limit(MEM_PAGE); if (MEM.last) q = q.startAfter(MEM.last);
    const sn = await withTimeout(q.get(), 15000, 'Danh sách thành viên'); if (g !== MEM.gen) return; MEM.users.push(...sn.docs.map(d => ({ id:d.id, ...d.data() }))); MEM.last = sn.docs[sn.docs.length - 1] || MEM.last; MEM.done = sn.size < MEM_PAGE; MEM.at = Date.now();
  } finally { if (g === MEM.gen) MEM.busy = false; }
}
async function tabMembers(){
  A('<p class="muted">Đang tải…</p>'); let signups = window._signups || [], comps = [], reqs = [];
  if (DEMO) { const dd = n => Array.from({ length:n }, (_, i) => DT.now().setZone('Asia/Ho_Chi_Minh').minus({ days:n - 1 - i }).toISODate()); MEM.users = [{ id:'u1', displayName:'Linh', email:'linh@mail.com', moon:{ days:dd(61), best:61, rounds:2 } }, { id:'u2', displayName:'Daniel', email:'d@mail.com', moon:{ days:dd(11), best:11 } }]; MEM.rw = { u1:{ months:1, status:'unused', expires:Date.now() + 20 * 864e5 } }; MEM.done = true; comps = [{ id:'u1' }]; return membersView(MEM.users, signups, comps, reqs); }
  try {
    if (Date.now() - MEM.at > 300000) Object.assign(MEM, { users:[], last:null, done:false, rw:{} });                  // quá 5 phút thì tải lại từ đầu
    MEM.busy = false; MEM.gen++;                                                                                    // lần tải trước bị treo thì không để khoá mãi
    const tm = (pr, what) => withTimeout(pr, 15000, what);
    // ba phần độc lập nên đọc song song (trước đây đọc nối tiếp nên chậm gấp ba, và một phần treo là kẹt cả trang)
    const [c, rq] = await Promise.all([
      tm(getAll('companions'), 'Danh sách Companion'),
      tm(getAll('companion_requests', 'createdAt', 100), 'Yêu cầu chờ duyệt').then(l => l.filter(r => r.status === 'pending'), e => { console.warn('requests', e.code || e.message); return null; }),
      MEM.users.length ? null : memLoadMore()
    ]);
    comps = c; reqs = rq || []; window._memReqErr = rq === null;
    // ưu đãi và chuỗi điểm danh của người báo thanh toán (để đối chiếu); lỗi thì báo rõ và khoá nút Duyệt, tránh duyệt thiếu tháng tặng
    await Promise.all(reqs.map(async r => { try { const d = await tm(db.collection('moon_rewards').doc(r.id).get(), 'Ưu đãi của khách'); r._rw = d.exists ? d.data() : null; if (r.reward || r._rw) { const ud = await tm(db.collection('users').doc(r.id).get(), 'Hồ sơ khách'); r._mj = ud.exists ? ud.data().moon || null : null; } } catch (e) { r._rwErr = true; console.warn('reward', e.code || e.message); } }));
    window._memComps = comps; window._memReqs = reqs;
    membersView(MEM.users, signups, comps, reqs, !MEM.users.length && !MEM.done);                                 // hiện ngay, phần nhẹ trước
    if (await memRewards(MEM.users)) membersView(MEM.users, signups, comps, reqs);
    signups = await tm(getAll('challenge_signups', 'timestamp', 100), 'Đăng ký email').catch(e => { console.warn('signups', e.code || e.message); return signups; });
    window._signups = signups; membersView(MEM.users, signups, comps, reqs);
  } catch (e) { console.warn('members', e.code || e.message); A(loadError(e, 'memReload')); }
}
function membersView(users, signups, comps, reqs, loadingUsers){
  const isC = id => comps.some(c => c.id === id);
  const today = DT.now().toISODate(), soon = DT.now().plus({ days:7 }).toISODate(), who = id => { const u = users.find(x => x.id === id) || {}; return u.displayName || u.email || (comps.find(c => c.id === id) || {}).name || id; };
  const expiring = comps.filter(c => c.until && c.until <= soon).sort((x, y) => x.until < y.until ? -1 : 1);      // sắp hết hạn hoặc đã hết hạn: để gia hạn kịp khi khách trả hằng tháng
  const expCard = expiring.length ? aCard(`Sắp hết hạn / đã hết hạn (${expiring.length})`, expiring.map(c => `<div class="ord-row"><div><b>${esc(c.name || who(c.id))}</b><div class="small muted">${esc((users.find(x => x.id === c.id) || {}).email || c.email || '')}</div><div class="small faint">${c.until < today ? 'Đã hết hạn ngày ' : 'Hết hạn ngày '}${esc(c.until)}</div></div><span class="row"><select class="select" id="rn-${esc(c.id)}" style="width:auto;padding:4px 8px">${[1, 3, 12].map(m => `<option value="${m}">+${m} tháng</option>`).join('')}</select><button class="btn primary sm" data-act="compRenew" data-id="${esc(c.id)}" data-name="${esc(c.name || '')}" data-email="${esc(c.email || (users.find(x => x.id === c.id) || {}).email || '')}">Gia hạn</button><select class="select" id="rl-${esc(c.id)}" style="width:auto;padding:4px 8px" title="Ngôn ngữ tin nhắn nhắc gia hạn" data-change="remindLang">${LANG_LIST.map(([v, n]) => `<option value="${v}" ${v === remindLang() ? 'selected' : ''}>${n}</option>`).join('')}</select><button class="btn secondary sm" data-act="compRemind" data-id="${esc(c.id)}" data-name="${esc(c.name || who(c.id))}" data-until="${esc(c.until)}" title="Sao chép tin nhắn nhắc gia hạn theo ngôn ngữ đã chọn">Nhắc gia hạn</button></span></div>`).join('')) : '';
  A(`${window._memReqErr ? `<div class="limit-box small" style="border-color:var(--danger);margin-bottom:12px">⚠ Chưa tải được danh sách yêu cầu chờ duyệt (có thể đang có khách báo thanh toán mà bạn chưa thấy). <button class="btn primary sm" data-act="memReload">Thử lại</button></div>` : ''}${expCard}${reqs.length ? aCard(`Yêu cầu Người đồng hành chờ duyệt (${reqs.length})`, reqs.map(r => `<div class="ord-row"><div><b>${esc(r.email || r.name || '—')}</b> <span class="badge">${esc(METHOD_VI[r.method] || r.method || '')}</span><div class="small muted">${esc(r.name || '—')}</div>${r.note ? `<div class="small faint">“${esc(r.note)}”</div>` : ''}${r.message ? `<div class="small" style="margin-top:2px">💬 ${esc(r.message)}</div>` : ''}${rewardLine(r)}<div class="small faint">${esc(dateStr(r.createdAt))}${isC(r.id) ? ' · đang là Companion (gia hạn)' : ''}</div></div>
      <span class="row"><select class="select" id="cm-${esc(r.id)}" style="width:auto;padding:4px 8px">${[1, 3, 12].map(m => `<option value="${m}" ${m === (+r.months || 1) ? 'selected' : ''}>+${m} tháng</option>`).join('')}</select><button class="btn primary sm" ${r._rwErr ? 'disabled title="Chưa tải được ưu đãi của khách, bấm Thử lại ở đầu tab"' : ''} data-act="compApprove" data-ts="${tsMs(r.createdAt)}" data-rwm="${rewardMonthsFor(r) || ''}" data-id="${esc(r.id)}" data-name="${esc(r.name || '')}" data-email="${esc(r.email || '')}">Duyệt</button><button class="btn ghost sm" data-act="compReject" data-id="${esc(r.id)}">Từ chối</button></span></div>`).join(''), '') + ('Notification' in window && Notification.permission === 'default' ? '<p style="margin:-4px 0 10px"><button class="btn secondary sm" data-act="enableNotif">Bật thông báo trên trình duyệt khi có yêu cầu mới</button></p>' : '') + '<p class="hint" style="margin:-4px 0 14px">Kiểm tra khoản thanh toán trong Ko-fi / ngân hàng / PayPal rồi bấm <b>Duyệt</b>: tài khoản đó thành Companion, mở Planner ngay (không cần tải lại trang) và tên hiện ở mục cảm ơn. Nếu không thấy tiền, bấm <b>Từ chối</b> — họ sẽ thấy thông báo và có thể gửi lại.</p>' : ''}<div class="grid g2">${aCard(`Thành viên (${users.length}${MEM.done ? '' : '+'})`, users.length ? users.map(u => { const bd = rewardBadge(u.moon, (MEM.rw || {})[u.id]); return `<div class="ord-row"><div><b>${esc(u.displayName || '—')}</b> ${isC(u.id) ? `<span class="badge">${ic('heart', 'sm')} Đồng hành</span>` : ''}<div class="small muted">${esc(u.email || '')}</div><div class="small faint">${moonLine(u.moon)}</div>${bd ? `<div class="small" style="margin-top:2px">${bd}</div>` : ''}</div>
        <span class="stack" style="gap:6px;align-items:flex-end"><label class="row small" style="font-weight:700"><input type="checkbox" data-change="companion" data-id="${esc(u.id)}" data-name="${esc(u.displayName || u.email || '')}" data-email="${esc(u.email || '')}" ${isC(u.id) ? 'checked' : ''}> Người đồng hành</label>${isC(u.id) ? `<label class="small faint">Đến ngày <input class="input" type="date" style="width:150px;padding:4px 8px" data-change="compUntil" data-id="${esc(u.id)}" value="${esc((comps.find(c => c.id === u.id) || {}).until || '')}"></label>
          <label class="row small" style="font-weight:700"><input type="checkbox" data-change="supShow" data-id="${esc(u.id)}" data-since="${esc(sinceISO((comps.find(c => c.id === u.id) || {}).since))}" data-name="${esc(u.displayName || '')}" data-until="${esc((comps.find(c => c.id === u.id) || {}).until || '')}" ${supItem(u.id) ? 'checked' : ''}> Hiện tên ở mục cảm ơn</label>${supItem(u.id) ? `<label class="small faint">Tên hiện <input class="input" style="width:150px;padding:4px 8px" maxlength="40" data-change="supName" data-id="${esc(u.id)}" value="${esc(supItem(u.id).name || '')}"></label>` : ''}` : ''}</span></div>`; }).join('') + (MEM.done ? '' : '<p class="small faint" style="margin-top:8px">Mới hiện ' + users.length + ' người đầu tiên, bấm “Tải thêm” hoặc tìm theo email.</p>') : (loadingUsers ? '<p class="muted">Đang tải danh sách thành viên…</p>' : '<p class="muted">Chưa có.</p>'), `<div class="row" style="flex-wrap:wrap"><input class="input" id="mem-q" placeholder="Tìm theo email đầy đủ" style="width:210px;padding:6px 10px"><button class="btn secondary sm" data-act="memFind">Tìm</button>${MEM.done ? '' : '<button class="btn secondary sm" data-act="memMore">Tải thêm</button>'}<button class="btn ghost sm" data-act="memReload">Tải lại</button></div>`)}
    ${aCard(`Đăng ký email nhắc lịch (${signups.length})`, signups.length ? signups.map(s => `<div class="ord-row"><div><b>${esc(s.codename || '')}</b><div class="small muted">${esc(s.email || '')}</div></div><span class="small faint">${esc(dateStr(s.timestamp))}</span></div>`).join('') : '<p class="muted">Chưa có.</p>', `<button class="btn secondary sm" data-act="copyEmails">Sao chép email</button>`)}</div>
    <p class="hint mt">"Người đồng hành" là những người ủng hộ hằng tháng của bạn. Khi bạn <b>tích</b> một người (bạn thấy họ đăng ký trên Ko-fi / PayPal / chuyển khoản), tên họ tự hiện ở <b>mục cảm ơn</b> trên trang chủ và trang Ủng hộ. Bỏ tích ô "Hiện tên ở mục cảm ơn" nếu họ muốn ẩn danh, và sửa ô "Tên hiện" nếu họ muốn dùng biệt danh. Đến ngày hết hạn thì tên tự ẩn. Chỉ tên hiện công khai, không hiện email.</p>`);
}
/* tin nhắn nhắc gia hạn: [sắp hết hạn, đã hết hạn] cho đủ 8 ngôn ngữ của web; {n} tên, {d} ngày, {l} link */
const REMIND = {
  en:['Hi {n}, your Companion plan expires on {d}. If you would like to keep your Planner, the study group and your weekly rank, you can renew here: {l}. Thank you for being part of this little study room!','Hi {n}, your Companion plan expired on {d}. If you would like to get back your Planner, the study group and your weekly rank, you can renew here: {l}. Thank you for being part of this little study room!'],
  vi:['Chào {n}, gói Người đồng hành của bạn sẽ hết hạn ngày {d}. Nếu bạn muốn tiếp tục dùng Planner, nhóm học và bảng xếp hạng tuần, bạn gia hạn tại {l} nhé. Cảm ơn bạn đã đồng hành cùng mình!','Chào {n}, gói Người đồng hành của bạn đã hết hạn ngày {d}. Nếu bạn muốn dùng lại Planner, nhóm học và bảng xếp hạng tuần, bạn gia hạn tại {l} nhé. Cảm ơn bạn đã đồng hành cùng mình!'],
  hi:['नमस्ते {n}, आपका साथी प्लान {d} को समाप्त हो रहा है। यदि आप अपना प्लानर, स्टडी ग्रुप और साप्ताहिक रैंक बनाए रखना चाहते हैं, तो यहाँ नवीनीकरण करें: {l}। इस छोटे से स्टडी रूम का हिस्सा बनने के लिए धन्यवाद!','नमस्ते {n}, आपका साथी प्लान {d} को समाप्त हो गया है। यदि आप अपना प्लानर, स्टडी ग्रुप और साप्ताहिक रैंक वापस पाना चाहते हैं, तो यहाँ नवीनीकरण करें: {l}। इस छोटे से स्टडी रूम का हिस्सा बनने के लिए धन्यवाद!'],
  ja:['{n}さん、こんにちは。仲間プランは{d}に終了します。プランナー、スタディグループ、週間ランキングを引き続きご利用の場合は、こちらから更新できます: {l}。このスタディルームを応援してくださりありがとうございます!','{n}さん、こんにちは。仲間プランは{d}に終了しました。プランナー、スタディグループ、週間ランキングを再開する場合は、こちらから更新できます: {l}。このスタディルームを応援してくださりありがとうございます!'],
  ko:['안녕하세요 {n}님, 동반자 플랜이 {d}에 만료됩니다. 플래너, 스터디 그룹, 주간 랭킹을 계속 이용하시려면 여기에서 갱신해 주세요: {l}. 이 작은 스터디 룸과 함께해 주셔서 감사합니다!','안녕하세요 {n}님, 동반자 플랜이 {d}에 만료되었습니다. 플래너, 스터디 그룹, 주간 랭킹을 다시 이용하시려면 여기에서 갱신해 주세요: {l}. 이 작은 스터디 룸과 함께해 주셔서 감사합니다!'],
  zh:['你好 {n},你的同伴计划将于 {d} 到期。如果想继续使用计划本、学习小组和每周排名,可以在这里续期:{l}。感谢你成为这间小小自习室的一员!','你好 {n},你的同伴计划已于 {d} 到期。如果想重新使用计划本、学习小组和每周排名,可以在这里续期:{l}。感谢你成为这间小小自习室的一员!'],
  fr:['Bonjour {n}, votre formule Compagnon expire le {d}. Pour conserver votre Planner, le groupe d\'étude et votre classement hebdomadaire, vous pouvez renouveler ici : {l}. Merci de faire partie de cette petite salle d\'étude !','Bonjour {n}, votre formule Compagnon a expiré le {d}. Pour retrouver votre Planner, le groupe d\'étude et votre classement hebdomadaire, vous pouvez renouveler ici : {l}. Merci de faire partie de cette petite salle d\'étude !'],
  es:['Hola {n}, tu plan Acompañante vence el {d}. Si quieres conservar tu Planner, el grupo de estudio y tu ranking semanal, puedes renovar aquí: {l}. ¡Gracias por formar parte de esta pequeña sala de estudio!','Hola {n}, tu plan Acompañante venció el {d}. Si quieres recuperar tu Planner, el grupo de estudio y tu ranking semanal, puedes renovar aquí: {l}. ¡Gracias por formar parte de esta pequeña sala de estudio!']
};
const remindLang = () => { try { return localStorage.getItem('ep_remind_lang') || 'en'; } catch (e) { return 'en'; } };
CHANGES.remindLang = el => { try { localStorage.setItem('ep_remind_lang', el.value); } catch (e) {} };
CHANGES.compUntil = async el => { try { if (DEMO) return toast('Chế độ xem thử'); await db.collection('companions').doc(el.dataset.id).update({ until:el.value || null }); if (supItem(el.dataset.id)) await supUpsert(el.dataset.id, { until:el.value || '' }); ok('Đã cập nhật ngày hết hạn'); } catch (e) { fail(e); } };
CHANGES.supShow = async el => { try { if (el.checked) await supUpsert(el.dataset.id, { name:el.dataset.name || '', show:true, until:el.dataset.until || '', ...(el.dataset.since ? { since:el.dataset.since } : {}) }); else await supRemove(el.dataset.id); ok(el.checked ? 'Đã hiện tên ở mục cảm ơn ✔' : 'Đã ẩn tên khỏi mục cảm ơn'); tabMembers(); } catch (e) { fail(e); el.checked = !el.checked; } };
CHANGES.supName = async el => { try { await supUpsert(el.dataset.id, { name:el.value.trim().slice(0, 40) }); ok('Đã lưu tên hiện ✔'); } catch (e) { fail(e); } };
CHANGES.companion = async el => {
  try {
    if (DEMO) return toast('Chế độ xem thử');
    const ref = db.collection('companions').doc(el.dataset.id);
    const until = DT.now().plus({ days:31 }).toISODate();
    if (el.checked) { await ref.set({ name:el.dataset.name, email:el.dataset.email || '', since:TS(), until }); await supUpsert(el.dataset.id, { name:el.dataset.name || '', show:true, until }); } else { await ref.delete(); await supRemove(el.dataset.id); }
    ok(el.checked ? 'Đã đánh dấu người đồng hành (hết hạn sau 31 ngày — có thể sửa ngày)' : 'Đã bỏ đánh dấu'); tabMembers();
  } catch (e) { fail(e); el.checked = !el.checked; }
};

/* =========================================================
   ACTIONS
   ========================================================= */
Object.assign(ACTIONS, {
  recheckAdmin: async () => {
    if (DEMO) return toast('Chế độ xem thử');
    try { await state.user.reload(); await state.user.getIdToken(true); state.isAdmin = isAdminUser(auth.currentUser); render(true); toast(state.isAdmin ? 'Đã xác nhận bạn là chủ trang ✔' : 'Email vẫn chưa được xác minh'); } catch (e) { alert(e.message); }
  },
  reviewDelPublic: el => { if (!confirm('Xoá đánh giá này?')) return; if (DEMO) { reviews = reviews.filter(r => r.id !== el.dataset.id); render(true); return toast('Đã xoá (xem thử)'); } db.collection('reviews').doc(el.dataset.id).delete().then(() => ok('Đã xoá đánh giá')).catch(fail); },
  editPostPage: el => { window._openPostId = el.dataset.id; location.hash = '#/admin/blog'; },
  delPostPage: el => { if (!confirm('Xoá bài viết này?')) return; if (DEMO) return toast('Chế độ xem thử'); db.collection('posts').doc(el.dataset.id).delete().then(() => { ok('Đã xoá bài'); location.hash = '#/blog'; }).catch(fail); },
  startEdit: () => { location.hash = '#/'; setTimeout(() => { if (!state.editMode) toggleEditMode(); }, 60); },
  startEditAbout: () => { location.hash = '#/about'; setTimeout(() => { if (!state.editMode) toggleEditMode(); }, 60); },
  pickInto: el => { const id = el.dataset.target; openImagePicker('Chọn ảnh', u => { $(id).value = u; toast('Đã chọn ảnh — nhớ bấm Lưu'); }, 'site'); },
  swatch: el => { $('ad-color').value = el.dataset.c; },
  saveBrand: () => {
    const data = { name:val('ad-name') || 'Ép Study Room', defaultTheme:val('ad-theme'), themeColor:$('ad-color').value, font:val('ad-font'), logoUrl:val('ad-logo'), mascotUrl:val('ad-mascot') };
    dbSet('settings', 'branding', data).then(() => { Object.assign(branding, data); applyLook(); renderChrome(); ok(); }).catch(fail);
  },
  navMove: el => { adminNav = readNav(); const i = +el.dataset.i, j = i + +el.dataset.d; if (j < 0 || j >= adminNav.length) return; [adminNav[i], adminNav[j]] = [adminNav[j], adminNav[i]]; $('nav-list').innerHTML = navRows(); },
  navDel: el => { adminNav = readNav(); adminNav.splice(+el.dataset.i, 1); $('nav-list').innerHTML = navRows(); },
  navAddLink: () => { adminNav = readNav(); adminNav.push({ id:'link-' + Date.now().toString(36), custom:true, visible:true, url:'', label:{ vi:'', en:'' } }); $('nav-list').innerHTML = navRows(); },
  saveNav: el => withTranslate(el, async () => {
    const old = branding.nav || [], nav = [];
    for (const n of readNav().filter(n => !n.custom || n.url)) {
      const o = { id:n.id, visible:n.visible !== false };
      if (n.label) o.label = await TR.fill((old.find(x => x.id === n.id) || {}).label, n.label);
      if (n.custom) { o.url = n.url; o.custom = true; }
      nav.push(o);
    }
    await dbSet('settings', 'branding', { nav }); branding.nav = nav; renderChrome(); ok(trMsg('Đã lưu menu.'));
  }).catch(fail),
  saveAccess: () => {
    const requireLogin = $('ad-reqlogin').checked, lockedPages = [...document.querySelectorAll('[data-lp]')].filter(c => c.checked).map(c => c.dataset.lp);
    dbSet('settings', 'branding', { requireLogin, lockedPages }).then(() => { branding.requireLogin = requireLogin; branding.lockedPages = lockedPages; renderChrome(); ok(requireLogin ? 'Đã lưu: khách phải đăng nhập để vào các mục đã tích ✔' : 'Đã tắt: ai cũng dùng được mọi mục ✔'); }).catch(fail);
  },
  homeMove: el => { const l = $('home-list'), rows = [...l.children], i = +el.dataset.i, j = i + +el.dataset.d; if (j < 0 || j >= rows.length) return; l.insertBefore(rows[Math.min(i, j) + 1], rows[Math.min(i, j)]); [...l.children].forEach((r, n) => r.querySelectorAll('[data-i]').forEach(b => b.dataset.i = n)); },
  homeReset: () => { $('home-list').innerHTML = homeRows(HOME_KEYS); },
  saveHome: () => { const hs = {}, order = []; document.querySelectorAll('#home-list [data-hk]').forEach(r => { const c = r.querySelector('[data-hs]'); hs[c.dataset.hs] = c.checked; order.push(r.dataset.hk); }); dbSet('settings', 'branding', { homeSections:hs, homeOrder:order }).then(() => { branding.homeSections = hs; branding.homeOrder = order; ok(); }).catch(fail); },
  socialAdd: () => { adminSocial = readSocial(); adminSocial.push(['', '']); $('social-list').innerHTML = socialRows(); },
  socialDel: el => { adminSocial = readSocial(); adminSocial.splice(+el.dataset.i, 1); $('social-list').innerHTML = socialRows(); },
  saveSocial: el => withTranslate(el, async () => {
    const sl = {}; readSocial().forEach(([n, u]) => { if (n && u) sl[n] = u; });
    const announcement = await TR.fill(branding.announcement, { vi:val('ad-ann-vi'), en:val('ad-ann-en') });
    if (DEMO) toast('Chế độ xem thử: chưa lưu thật');
    else { const ref = db.collection('settings').doc('branding'); await ref.set({}, { merge:true }); await ref.update({ announcement, socialLinks:sl }); }   // update = thay hẳn (xoá được mục / bản dịch đã bỏ)
    branding.socialLinks = sl; branding.announcement = announcement; renderChrome(); ok(trMsg('Đã lưu.'));
  }).catch(fail),
  videoAdd: () => { adminVideos = readVideos(); adminVideos.push({ url:'', title:'' }); $('video-list').innerHTML = videoRows(); },
  videoDel: el => { adminVideos = readVideos(); adminVideos.splice(+el.dataset.i, 1); $('video-list').innerHTML = videoRows(); },
  saveYT: () => {
    const vids = readVideos().filter(v => v.url), data = { ytChannelId:val('ad-ytch'), ytLiveId:val('ad-ytlive'), videos:vids, contacts:{ live:val('ad-liveurl') } };
    dbSet('settings', 'branding', data).then(() => { Object.assign(branding, data); loadVideos(); ok(); }).catch(fail);
  },
  /* lịch */
  aweek: el => { weekOffset += +el.dataset.d; listenWeeks(); tabSchedule(); },
  addSlot: el => { adminDays[+el.dataset.d].slots.push({ ...normSlot({ time:'' }), pomo:{ ...PRESETS.classic } }); drawSchedule(); },
  rmSlot: el => { adminDays[+el.dataset.d].slots.splice(+el.dataset.s, 1); drawSchedule(); },
  dayAll: el => { const src = adminDays[+el.dataset.d]; if (!confirm('Chép các buổi live của ngày này sang tất cả các ngày khác trong tuần?')) return; adminDays.forEach((d, i) => { if (i !== +el.dataset.d) d.slots = src.slots.map(s => ({ ...s, pomo:{ ...s.pomo }, plan: s.plan ? s.plan.map(b => ({ ...b })) : null, cancelled:false, cancelNote:{} })); }); drawSchedule(); },
  blkAdd: el => { const s = adminDays[+el.dataset.d].slots[+el.dataset.s], k = el.dataset.t; s.plan.push({ t:k, m:BLK[k][2] }); drawSchedule(); },
  blkDel: el => { const s = adminDays[+el.dataset.d].slots[+el.dataset.s]; s.plan.splice(+el.dataset.b, 1); if (!s.plan.length) s.plan = null; drawSchedule(); },
  blkMove: el => { const s = adminDays[+el.dataset.d].slots[+el.dataset.s], i = +el.dataset.b, j = i + +el.dataset.dir; if (j < 0 || j >= s.plan.length) return; [s.plan[i], s.plan[j]] = [s.plan[j], s.plan[i]]; drawSchedule(); },
  saveSched: el => withTranslate(el, async () => {
    // lý do huỷ: chỉ dịch những buổi / ngày đang bị huỷ (các ghi chú khác giữ nguyên)
    const note = async (n, on) => { const cur = { vi:(n && n.vi) || '', en:(n && n.en) || '' }; return on && (cur.vi || cur.en) ? TR.fill({}, cur) : cur; };
    const days = [];
    for (const d of adminDays) {
      const slots = [];
      for (const s of d.slots.filter(s => s.time)) slots.push({ time:s.time, icon:s.icon || '', title:s.title || '', pomo:cleanPomo(s.pomo), plan: s.plan && s.plan.length ? s.plan.map(b => ({ t:b.t, m:Math.max(1, Math.round(+b.m || 1)), ...(String(b.nm || '').trim() ? { nm:String(b.nm).trim().slice(0, 40) } : {}) })) : [], cancelled:s.cancelled, cancelNote:await note(s.cancelNote, s.cancelled) });
      days.push({ cancelled:d.cancelled, cancelNote:await note(d.cancelNote, d.cancelled), slots });
    }
    await dbSet('weekly_schedules', weekKeyFor(weekOffset), { days }, false); ok(trMsg('Đã lưu lịch.'));
  }).catch(fail),
  copyPrev: async () => {
    if (DEMO) return toast('Chế độ xem thử');
    try { const d = await db.collection('weekly_schedules').doc(weekKeyFor(weekOffset - 1)).get(); if (!d.exists) return alert('Tuần trước chưa có lịch');
      adminDays = Array.from({ length:7 }, (_, i) => { const x = normDay((d.data().days || [])[i]); x.cancelled = false; x.cancelNote = {}; x.slots.forEach(s => { s.cancelled = false; s.cancelNote = {}; if (!s.pomo) s.pomo = cleanPomo(PRESETS.classic); }); return x; }); drawSchedule(); } catch (e) { fail(e); }
  },
  /* bài viết */
  newPost: () => postForm({ published:true }),
  editPost: async el => { try { const p = DEMO ? posts.find(x => x.id === el.dataset.id) : (await db.collection('posts').doc(el.dataset.id).get()).data(); postForm(p); } catch (e) { fail(e); } },
  delPost: el => confirm('Xoá bài viết này?') && (DEMO ? toast('Chế độ xem thử') : db.collection('posts').doc(el.dataset.id).delete().then(tabBlog).catch(fail)),
  reloadBlog: () => setTimeout(tabBlog, 20),
  bodyLang: el => { editBody[editLang] = $('pb-rte').innerHTML; editLang = el.dataset.l; $('pb-rte').innerHTML = sanitizeHtml(editBody[editLang]); $('bl-vi').classList.toggle('on', editLang === 'vi'); $('bl-en').classList.toggle('on', editLang === 'en'); },
  manageCats: catsForm,
  catAdd: () => { adminCats = readCats(); adminCats.push({ id:'', label:{ en:'', vi:'' }, desc:{ en:'', vi:'' } }); $('cat-list').innerHTML = catRows(); },
  catDel: el => { adminCats = readCats(); adminCats.splice(+el.dataset.i, 1); $('cat-list').innerHTML = catRows(); },
  catMove: el => { adminCats = readCats(); const i = +el.dataset.i, j = i + +el.dataset.d; if (j < 0 || j >= adminCats.length) return; [adminCats[i], adminCats[j]] = [adminCats[j], adminCats[i]]; $('cat-list').innerHTML = catRows(); },
  saveCats: el => withTranslate(el, async () => {
    const old = blogCats(), cats = [];
    for (const c of readCats().filter(c => c.label.en || c.label.vi)) { const o = old.find(x => x.id === c.id) || {}; cats.push({ id:c.id, label:await TR.fill(o.label, c.label), desc:await TR.fill(o.desc, c.desc) }); }
    await dbSet('settings', 'branding', { blogCats:cats }); branding.blogCats = cats; ok(trMsg('Đã lưu các mục.')); tabBlog();
  }).catch(fail),
  fmt: el => fmtCmd(el.dataset.c),
  savePost: el => withTranslate(el, async () => {
    editBody[editLang] = $('pb-rte').innerHTML;
    const typedTitle = { vi:val('pb-t-vi'), en:val('pb-t-en') }, slug = val('pb-slug') || slugify(typedTitle.en || typedTitle.vi), at = val('pb-at') ? new Date(val('pb-at')).getTime() : 0; if (!slug || !(typedTitle.vi || typedTitle.en)) return alert('Cần có tiêu đề');
    const o = editPost || {}, ob = o.body || {};
    // viết bằng ngôn ngữ nào cũng được: phần bạn vừa viết giữ nguyên, các ngôn ngữ còn lại tự dịch từ đó
    const title = await TR.fill(o.title, typedTitle);
    const excerpt = await TR.fill(o.excerpt, { vi:val('pb-e-vi'), en:val('pb-e-en') });
    const body = await TR.fill({ ...ob, vi:normHtml(ob.vi), en:normHtml(ob.en) }, { vi:normHtml(editBody.vi), en:normHtml(editBody.en) }, { html:true });
    const data = { slug, title, excerpt, body, cover:val('pb-cover'), category:val('pb-cat'), pinned:$('pb-pin').checked, publishAt: at || null, tags:val('pb-tags').split(',').map(s => s.trim()).filter(Boolean), published:$('pb-pub').checked, updatedAt:TS() };
    if (!editPost.slug) data.createdAt = at ? firebase.firestore.Timestamp.fromMillis(at) : TS();
    store.set('draft_' + (editPost.slug || 'new'), null);
    await dbSet('posts', slug, data); ok(trMsg('Đã lưu bài.')); tabBlog();
  }).catch(fail),
  /* sản phẩm */
  newProd: () => prodForm({ active:true, type:'digital' }),
  editProd: async el => { try { const p = DEMO ? products.find(x => x.id === el.dataset.id) : { id:el.dataset.id, ...(await db.collection('products').doc(el.dataset.id).get()).data() }; prodForm(p); } catch (e) { fail(e); } },
  delProd: el => confirm('Xoá sản phẩm này?') && (DEMO ? toast('Chế độ xem thử') : Promise.all([db.collection('products').doc(el.dataset.id).delete(), db.collection('products_private').doc(el.dataset.id).delete().catch(() => {})]).then(tabProducts).catch(fail)),
  reloadProducts: () => tabProducts(),
  rmImg: el => { prodImages.splice(+el.dataset.i, 1); $('prod-thumbs').innerHTML = thumbsHTML(); },
  addImgUrl: () => { const u = prompt('Link ảnh (https://…):'); if (u) { prodImages.push(u.trim()); $('prod-thumbs').innerHTML = thumbsHTML(); } },
  uploadImgs: async () => {
    const files = [...($('pr-imgfiles').files || [])], st = $('pr-img-st'); if (!files.length) return st.textContent = 'Hãy chọn ảnh từ máy trước.';
    try { for (const f of files) { st.textContent = 'Đang tải ' + f.name + '…'; const r = await uploadFile(f, `public/products/${Date.now()}-${safeName(f.name)}`, p => st.textContent = `Đang tải ${f.name}… ${Math.round(p * 100)}%`); prodImages.push(r.url); } st.textContent = 'Đã tải xong ✔'; $('prod-thumbs').innerHTML = thumbsHTML(); } catch (e) { st.textContent = 'Lỗi: ' + e.message; }
  },
  uploadFileNow: async () => {
    const f = $('pr-file').files[0], st = $('pr-file-st'); if (!f) return st.textContent = 'Hãy chọn file từ máy trước.';
    const name = val('pr-n-en') || val('pr-n-vi'), id = editProd.id || slugify(name); if (!id) return alert('Hãy nhập tên sản phẩm trước.');
    try { st.textContent = 'Đang tải lên…'; const path = `files/${id}/${safeName(f.name)}`; await uploadFile(f, path, p => st.textContent = `Đang tải lên… ${Math.round(p * 100)}%`); prodFile = { storagePath:path, fileName:f.name, fileUrl:'' }; st.textContent = 'Đã tải lên ✔ ' + f.name; } catch (e) { st.textContent = 'Lỗi: ' + e.message; }
  },
  saveProd: el => withTranslate(el, async () => {
    const typedName = { vi:val('pr-n-vi'), en:val('pr-n-en') }, id = editProd.id || slugify(typedName.en || typedName.vi); if (!id) return alert('Cần có tên sản phẩm');
    const type = val('pr-type'), stock = val('pr-stock'), fileUrl = val('pr-fileurl');
    const hasFile = type !== 'physical' && !!(fileUrl || (prodFile && (prodFile.storagePath || prodFile.fileUrl)));
    const name = await TR.fill(editProd.name, typedName), desc = await TR.fill(editProd.desc, { vi:val('pr-d-vi'), en:val('pr-d-en') });
    const data = { name, desc, priceVND:+val('pr-vnd') || 0, priceUSD:+val('pr-usd') || 0, type, stock: stock === '' ? null : +stock, images:prodImages, payLinks:{ stripe:val('pr-stripe'), paypal:val('pr-paypal'), kofi:val('pr-kofi') }, active:$('pr-active').checked, hasFile, updatedAt:TS() };
    if (!editProd.id) data.createdAt = TS();
    await dbSet('products', id, data);
    if (type !== 'physical') await dbSet('products_private', id, { fileUrl, storagePath: (prodFile && prodFile.storagePath) || '', fileName: (prodFile && prodFile.fileName) || '', updatedAt:TS() });
    ok(trMsg('Đã lưu sản phẩm.')); tabProducts();
  }).catch(fail),
  grant: async el => { try { await grantLibrary(window._orders[el.dataset.id]); } catch (e) { fail(e); } },
  /* mã giảm giá */
  saveCoupon: () => {
    const code = val('cp-code').toUpperCase(); if (!code) return alert('Cần nhập mã');
    const type = val('cp-type'), data = { type, value:+val('cp-val') || 0, valueVND:+val('cp-vnd') || 0, valueUSD:+val('cp-usd') || 0, minVND:+val('cp-minvnd') || 0, minUSD:+val('cp-minusd') || 0, expires:val('cp-exp'), active:true };
    if (type === 'percent' && !(data.value > 0 && data.value <= 100)) return alert('% giảm phải từ 1 đến 100');
    dbSet('coupons', code, data).then(() => { ok(); tabCoupons(); }).catch(fail);
  },
  toggleCoupon: el => dbSet('coupons', el.dataset.id, { active: el.dataset.on === '1' }).then(tabCoupons).catch(fail),
  delCoupon: el => confirm('Xoá mã này?') && (DEMO ? toast('Chế độ xem thử') : db.collection('coupons').doc(el.dataset.id).delete().then(tabCoupons).catch(fail)),
  /* nội dung */
  faqAdd: () => { adminFaq = readFaq(); adminFaq.push({ q:{ vi:'', en:'' }, a:{ vi:'', en:'' } }); $('faq-list').innerHTML = faqRows(); },
  faqDel: el => { adminFaq = readFaq(); adminFaq.splice(+el.dataset.i, 1); $('faq-list').innerHTML = faqRows(); },
  faqMove: el => { adminFaq = readFaq(); const i = +el.dataset.i, j = i + +el.dataset.d; if (j < 0 || j >= adminFaq.length) return; [adminFaq[i], adminFaq[j]] = [adminFaq[j], adminFaq[i]]; $('faq-list').innerHTML = faqRows(); },
  saveFaq: el => withTranslate(el, async () => {
    const old = Array.isArray(content.faq) ? content.faq : [], faq = [];
    for (const f of readFaq().filter(f => f.q.vi || f.q.en)) {
      const o = old.find(x => x.q && ((f.q.en && x.q.en === f.q.en) || (f.q.vi && x.q.vi === f.q.vi))) || {};
      faq.push({ q:await TR.fill(o.q, f.q), a:await TR.fill(o.a, f.a) });
    }
    await dbSet('settings', 'content', { faq }); content.faq = faq; ok(trMsg('Đã lưu FAQ.'));
  }).catch(fail),
  translateAll: el => withTranslate(el, async () => {
    const say = m => { const s = $('tr-status'); if (s) s.textContent = m; };
    const n = o => Object.keys(o || {}).length, ref = db && !DEMO ? db.collection('settings') : null;
    let changed = 0;
    // 1) chữ sửa trực tiếp trên trang
    const texts = {}; for (const [i, k] of Object.keys(content.texts || {}).entries()) { say(`Chữ trên trang… ${i + 1}/${n(content.texts)}`); const full = await TR.fill(content.texts[k], {}); if (n(full) > n(content.texts[k])) { texts[k] = full; content.texts[k] = full; changed++; } }
    if (n(texts) && ref) await ref.doc('content').set({ texts }, { merge:true });
    // 2) FAQ
    if (Array.isArray(content.faq) && content.faq.length) { say('Câu hỏi thường gặp…'); const faq = []; for (const f of content.faq) faq.push({ q:await TR.fill(f.q, {}), a:await TR.fill(f.a, {}) }); content.faq = faq; if (ref) await ref.doc('content').set({ faq }, { merge:true }); changed++; }
    // 3) thông báo, menu, các mục bài viết
    say('Thông báo, menu, mục bài viết…');
    const bd = {}; if (n(branding.announcement)) bd.announcement = await TR.fill(branding.announcement, {});
    if (Array.isArray(branding.nav)) bd.nav = await Promise.all(branding.nav.map(async x => x.label ? { ...x, label:await TR.fill(x.label, {}) } : x));
    if (Array.isArray(branding.blogCats)) { bd.blogCats = []; for (const c of branding.blogCats) bd.blogCats.push({ ...c, label:await TR.fill(c.label, {}), desc:await TR.fill(c.desc, {}) }); }
    if (n(bd)) { Object.assign(branding, bd); if (ref) await ref.doc('branding').set(bd, { merge:true }); renderChrome(); changed++; }
    // 4) bài viết và sản phẩm
    if (!DEMO) {
      const ps = await getAll('posts'); for (const [i, p] of ps.entries()) { say(`Bài viết… ${i + 1}/${ps.length}`); await db.collection('posts').doc(p.id).set({ title:await TR.fill(p.title, {}), excerpt:await TR.fill(p.excerpt, {}), body:await TR.fill(p.body, {}, { html:true }) }, { merge:true }); changed++; }
      const pr = await getAll('products'); for (const [i, p] of pr.entries()) { say(`Sản phẩm… ${i + 1}/${pr.length}`); await db.collection('products').doc(p.id).set({ name:await TR.fill(p.name, {}), desc:await TR.fill(p.desc, {}) }, { merge:true }); changed++; }
    }
    say(TR.failed ? `Xong, nhưng có ${TR.failed} lần dịch lỗi (mạng?). Bấm nút lần nữa để dịch tiếp phần còn thiếu.` : 'Xong ✔ Mọi nội dung đã có đủ các ngôn ngữ.'); ok(TR.failed ? 'Dịch bù chưa trọn vẹn — bấm lại lần nữa' : 'Đã dịch bù xong ✔');
  }).catch(fail),
  resetTexts: () => { if (!confirm('Khôi phục TOÀN BỘ chữ đã sửa về mặc định? (ảnh giữ nguyên)')) return; if (DEMO) { content.texts = {}; return toast('Đã khôi phục (xem thử)'); } db.collection('settings').doc('content').update({ texts:DEL() }).then(() => { content.texts = {}; ok('Đã khôi phục'); }).catch(fail); },
  /* đánh giá */
  reviewSet: el => dbSet('reviews', el.dataset.id, { approved: el.dataset.v === '1' }).then(tabReviews).catch(fail),
  reviewDel: el => confirm('Xoá đánh giá này?') && (DEMO ? toast('Chế độ xem thử') : db.collection('reviews').doc(el.dataset.id).delete().then(tabReviews).catch(fail)),
  /* thanh toán */
  saveGroup: () => { const on = !!$('grp-on').checked; dbSet('settings', 'branding', { groupOn:on }).then(() => { branding.groupOn = on; ok(on ? 'Đã bật nhóm học' : 'Đã tắt nhóm học'); }).catch(fail); },
  saveFocusLimit: () => { const n = Math.max(0, Math.min(1440, Math.round(+val('py-flimit') || 0))); dbSet('settings', 'branding', { focusLimit:n }).then(() => { branding.focusLimit = n; ok(n ? 'Đã lưu: ' + n + ' phút/ngày' : 'Đã bỏ giới hạn'); }).catch(fail); },
  saveCompPromo: () => {
    const n = id => Math.min(12, Math.max(0, Math.round(+val(id)) || 0)), data = { promoOn:$('pm-on').checked, promoLabel:val('pm-label').slice(0, 40), promoMonths3:n('pm-m3'), promoMonths12:n('pm-m12'), promoStart:val('pm-start'), promoEnd:val('pm-end') };
    if (data.promoStart && data.promoEnd && data.promoEnd < data.promoStart) return toast('Ngày kết thúc phải sau ngày bắt đầu');
    dbSet('settings', 'payments', data).then(() => { Object.assign(payments, data); $('pm-m3').value = data.promoMonths3; $('pm-m12').value = data.promoMonths12; ok(); }).catch(fail);
  },
  saveMoonReward: () => {
    const c = moonRewardCfg({ moonRewardMonths:val('mr-months'), moonRewardDays:val('mr-days') }), data = { moonRewardOn:$('mr-on').checked, moonRewardMonths:c.months, moonRewardDays:c.days };     // ép về khoảng hợp lệ để khớp với rules
    dbSet('settings', 'payments', data).then(() => { Object.assign(payments, data); $('mr-months').value = c.months; $('mr-days').value = c.days; ok(); }).catch(fail);
  },
  saveGoal: () => { const n = id => Math.max(0, Math.min(100000, Math.round(+val(id)) || 0)), data = { goalTarget:n('gl-t'), goalNow:n('gl-n'), goalText:String(val('gl-x') || '').trim().slice(0, 80) }; dbSet('settings', 'payments', data).then(() => { Object.assign(payments, data); ok(data.goalTarget ? 'Đã lưu mục tiêu' : 'Đã lưu (mục tiêu 0: ẩn thanh)'); }).catch(fail); },
  savePay: () => savePayFields(PAY_FIELDS),
  saveCompPlan: () => savePayFields(PLAN_FIELDS),
  compRemind: el => {      // sao chép tin nhắn nhắc gia hạn (đúng ngôn ngữ khách) để dán vào Zalo / Instagram / email
    const sel = $('rl-' + el.dataset.id), lang = sel ? sel.value : remindLang(), gone = el.dataset.until < DT.now().toISODate();
    let d = el.dataset.until; try { d = DT.fromISO(d).setLocale(lang).toLocaleString(DT.DATE_FULL); } catch (e) {}
    const msg = (REMIND[lang] || REMIND.en)[gone ? 1 : 0].replace('{n}', el.dataset.name || '').replace('{d}', d).replace('{l}', location.origin + location.pathname + '#/donate');
    try { navigator.clipboard.writeText(msg); } catch (e) {} toast('Đã sao chép tin nhắn nhắc gia hạn (' + (LANG_LIST.find(l => l[0] === lang) || ['', lang])[1] + ')');
  },
  goalCount: async () => {      // đếm Người đồng hành còn hạn để điền vào ô "Hiện đã có"
    try {
      if (DEMO) return toast('Chế độ xem thử');
      const today = DT.now().toISODate(), list = await getAll('companions', null, 1000), n = list.filter(c => !c.until || c.until >= today).length;
      $('gl-n').value = n; toast(`Đang có ${n} Người đồng hành còn hạn. Bấm "Lưu mục tiêu" để lưu số này.`);
    } catch (e) { fail(e); }
  },
  copyEmails: () => { try { navigator.clipboard.writeText((window._signups || []).map(s => s.email).join(', ')); } catch (e) {} toast('Đã sao chép email'); }
});

Object.assign(ACTIONS, {
  /* nhạc */
  muAdd: el => { syncMu(); adminMusic[el.dataset.k].push({ title:{}, url:'', note:{} }); drawMu(); },
  muDel: el => { syncMu(); adminMusic[el.dataset.k].splice(+el.dataset.i, 1); drawMu(); },
  muMove: el => { syncMu(); const a = adminMusic[el.dataset.k], i = +el.dataset.i, j = i + +el.dataset.d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; drawMu(); },
  saveMusic: el => withTranslate(el, async () => {
    syncMu(); const old = [...(music.picks || []), ...(music.recent || [])], out = {};
    for (const k of ['picks', 'recent']) {
      out[k] = [];
      for (const m of adminMusic[k].filter(m => m.url)) { const o = old.find(x => x.url === m.url) || {}; out[k].push({ url:m.url, title:await TR.fill(o.title, m.title), note:await TR.fill(o.note, m.note) }); }
    }
    await dbSet('settings', 'music', out, false); music = out; ok(trMsg('Đã lưu nhạc.')); tabMusic();
  }).catch(fail),
  /* đồ mình dùng */
  grAdd: () => { adminGear = readGr(); adminGear.push({ name:{}, note:{}, cat:{}, price:'', store:'', url:'', img:'', _o:null }); $('gr-list').innerHTML = grRows(); },
  grDel: el => { adminGear = readGr(); adminGear.splice(+el.dataset.i, 1); $('gr-list').innerHTML = grRows(); },
  grMove: el => { adminGear = readGr(); const i = +el.dataset.i, j = i + +el.dataset.d; if (j < 0 || j >= adminGear.length) return; [adminGear[i], adminGear[j]] = [adminGear[j], adminGear[i]]; $('gr-list').innerHTML = grRows(); },
  saveGear: el => withTranslate(el, async () => {
    adminGear = readGr(); const items = [], catMap = {};
    for (const g of adminGear.filter(g => g.name.en || g.name.vi || g.url)) {
      const o = g._o || {}, ck = g.cat.en || g.cat.vi || '';
      if (ck && !catMap[ck]) catMap[ck] = await TR.fill(o.cat, g.cat);      // cùng một mục thì dùng cùng một bản dịch để bộ lọc không bị tách đôi
      items.push({ id:g.id, name:await TR.fill(o.name, g.name), note:await TR.fill(o.note, g.note), cat:ck ? catMap[ck] : {}, price:g.price, store:g.store, url:g.url, img:g.img });
    }
    await dbSet('settings', 'gear', { items }, false); gear = { items }; ok(trMsg('Đã lưu.')); tabGear();
  }).catch(fail)
});

Object.assign(ACTIONS, {
  adminReload: () => { tabOverview.tries = 0; tabOverview(); },
  publishNow: el => withTranslate(el, () => publishSite(false)).catch(fail),
  pushNow: el => {
    if (!confirm('Gửi thông báo "Đang live" tới mọi người đã bật thông báo?')) return;
    el.disabled = true;
    dbSet('push_admin', 'now', { at:TS(), text:val('push-text').slice(0, 200) }, false)
      .then(() => { ok('Đã xếp hàng ✔ Khách nhận sau khoảng 5–15 phút'); $('push-text').value = ''; }).catch(fail).finally(() => { el.disabled = false; });
  },
  fallbackNow: el => { const t0 = el.textContent; el.disabled = true; el.textContent = 'Đang chuẩn bị…'; return fallbackNow().then(() => ok('Đã tải site-fallback.json ✔ Đưa file này lên GitHub cùng chỗ với index.html')).catch(fail).finally(() => { el.disabled = false; el.textContent = t0; }); },
  backupNow: el => { const t0 = el.textContent; el.disabled = true; el.textContent = 'Đang chuẩn bị…'; return backupNow().then(() => ok('Đã tải bản sao dữ liệu ✔')).catch(fail).finally(() => { el.disabled = false; el.textContent = t0; }); }
});

/* Bấm nút định dạng bài viết không làm mất vùng chữ đang bôi đen (trước đây là onmousedown ngay trong nút; CSP chặt không cho thuộc tính chạy mã) */
document.addEventListener("mousedown", e => { if (e.target.closest && e.target.closest(".rte-bar button")) e.preventDefault(); });
