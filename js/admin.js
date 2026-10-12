'use strict';
/* =========================================================
   ADMIN CONSOLE — #/admin/<tab>   (giao diện tiếng Việt cho chủ trang)
   Quyền admin = có tài liệu admins/<uid> trong Firestore (xem SETUP.md)
   ========================================================= */
const A_TABS = [
  ['overview', 'chart', 'Tổng quan'], ['site', 'sliders', 'Giao diện & Menu'], ['schedule', 'calendar', 'Lịch live'], ['blog', 'pen', 'Bài viết'],
  ['products', 'bag', 'Sản phẩm'], ['orders', 'box', 'Đơn hàng'], ['coupons', 'tag', 'Mã giảm giá'], ['content', 'info', 'Nội dung & FAQ'],
  ['reviews', 'star', 'Đánh giá'], ['payments', 'credit', 'Thanh toán & Ủng hộ'], ['members', 'users', 'Thành viên']
];
const A = html => { const b = $('admin-body'); if (b) b.innerHTML = html; };
const fail = e => alert('Lỗi: ' + (e && e.message || e));
const ok = m => toast(m || 'Đã lưu ✔');
const dbSet = (col, id, data, merge = true) => DEMO ? (toast('Chế độ xem thử: chưa lưu thật'), Promise.resolve()) : db.collection(col).doc(id).set(data, { merge });
const val = id => { const e = $(id); return e ? e.value.trim() : ''; };
const fld = (label, id, v = '', attrs = '', hint = '') => `<div class="field"><label class="label" for="${id}">${label}</label><input class="input" id="${id}" value="${esc(v)}" ${attrs}>${hint ? `<div class="hint">${hint}</div>` : ''}</div>`;
const area = (label, id, v = '', rows = 3) => `<div class="field"><label class="label" for="${id}">${label}</label><textarea class="textarea" id="${id}" style="min-height:${rows * 26}px">${esc(v)}</textarea></div>`;
const selectF = (label, id, opts, v) => `<div class="field"><label class="label" for="${id}">${label}</label><select class="select" id="${id}">${opts.map(([k, l]) => `<option value="${esc(k)}" ${k === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>`;
const aCard = (title, inner, extra = '') => `<section class="card a-card"><div class="row between"><h3>${title}</h3>${extra}</div>${inner}</section>`;
const dateStr = ts => ts ? DT.fromMillis(tsMs(ts)).toFormat('dd/MM/yyyy HH:mm') : '';

PAGES.admin = function(){
  if (!state.user) return page(`<div class="auth-wrap"><div class="card pad" style="text-align:center">${emptyBox('shield', 'Cần đăng nhập', 'Đăng nhập bằng tài khoản chủ trang để vào trang quản trị.')}<a class="btn primary" href="#/account">Đăng nhập</a></div></div>`);
  if (!state.isAdmin) return page(`<div class="auth-wrap"><div class="card pad stack"><div class="empty" style="padding:10px"><div class="ico">${ic('shield', 'lg')}</div><h3>${isAdminEmail(state.user) ? 'Cần xác minh email admin' : 'Tài khoản này không phải admin'}</h3></div>
    ${isAdminEmail(state.user)
      ? `<p class="muted small">Email <b>${esc(ADMIN_EMAIL)}</b> là email của chủ trang, nhưng cần được <b>xác minh</b> trước (để không ai khác mạo danh được). Mở hộp thư, bấm vào đường link trong email xác minh, rồi bấm nút bên dưới.</p>
         <div class="row"><button class="btn primary" data-act="recheckAdmin">${ic('check', 'sm')} Tôi đã xác minh rồi</button><button class="btn secondary" data-act="resendVerify">${ic('mail', 'sm')} Gửi lại email xác minh</button></div>`
      : `<p class="muted small">Chỉ tài khoản <b>${esc(ADMIN_EMAIL)}</b> mới có quyền quản trị. Bạn đang đăng nhập bằng <b>${esc(state.user.email)}</b>.</p><button class="btn secondary" data-act="signout">${ic('logout', 'sm')} Đăng xuất</button>`}</div></div>`);  const tab = A_TABS.some(x => x[0] === route.args[0]) ? route.args[0] : 'overview';
  page(`<div class="page-head"><div><h1>Trang quản trị</h1><p>Tuỳ chỉnh giao diện, nội dung, sản phẩm và đơn hàng của bạn.</p></div><button class="btn primary" data-act="startEdit">${ic('pen', 'sm')} Sửa chữ & ảnh trực tiếp trên trang</button></div>
    <nav class="a-tabs">${A_TABS.map(([k, icn, l]) => `<a href="#/admin/${k}" class="${tab === k ? 'on' : ''}">${ic(icn, 'sm')} ${esc(l)}</a>`).join('')}</nav><div id="admin-body"></div>`);
  ({ overview:tabOverview, site:tabSite, schedule:tabSchedule, blog:tabBlog, products:tabProducts, orders:tabOrders, coupons:tabCoupons, content:tabContent, reviews:tabReviews, payments:tabPayments, members:tabMembers })[tab]();
};
const reloadTab = () => { const f = ({ overview:tabOverview, site:tabSite, schedule:tabSchedule, blog:tabBlog, products:tabProducts, orders:tabOrders, coupons:tabCoupons, content:tabContent, reviews:tabReviews, payments:tabPayments, members:tabMembers })[route.args[0] || 'overview']; if (f) f(); };
const getAll = (col, order, limit = 200) => DEMO ? Promise.resolve([]) : (order ? db.collection(col).orderBy(order, 'desc').limit(limit) : db.collection(col).limit(limit)).get().then(s => s.docs.map(d => ({ id:d.id, ...d.data() })));

/* ---------------- Tổng quan ---------------- */
async function tabOverview(){
  A('<p class="muted">Đang tải…</p>');
  let orders = [], users = [], signups = [], revs = [];
  try { [orders, users, signups, revs] = await Promise.all([getAll('orders', 'createdAt', 200), getAll('users'), getAll('challenge_signups'), getAll('reviews')]); } catch (e) { console.warn(e); }
  if (DEMO) { orders = [{ code:'EP-DEMO1', total:79000, currency:'VND', status:'paid', buyer:{ name:'Linh', email:'linh@mail.com' }, items:[{ name:'30-Day Study Planner (PDF)', qty:1 }], createdAt:Date.now() }, { code:'EP-DEMO2', total:2.5, currency:'USD', status:'pending', buyer:{ name:'Daniel', email:'d@mail.com' }, items:[{ name:'Mascot sticker pack', qty:1 }], createdAt:Date.now() - 3600000 }]; users = [{}, {}, {}]; signups = [{}, {}]; revs = [{ approved:false }]; }
  const paid = orders.filter(o => ['paid', 'shipped'].includes(o.status)), rev = cur => paid.filter(o => o.currency === cur).reduce((a, o) => a + (+o.total || 0), 0);
  const kpi = (icn, l, v, s = '') => `<div class="card tile"><span class="t-ic">${ic(icn)}</span><span class="t-l">${l}</span><span class="t-v">${v}</span><span class="t-s">${s}</span></div>`;
  A(`<div class="grid g4 keep2">${kpi('credit', 'Doanh thu (đã thanh toán)', money(rev('VND'), 'VND'), rev('USD') ? money(rev('USD'), 'USD') : '')}${kpi('box', 'Đơn chờ xác nhận', orders.filter(o => o.status === 'pending').length, orders.length + ' đơn gần đây')}${kpi('users', 'Thành viên', users.length, signups.length + ' đăng ký Challenge')}${kpi('star', 'Đánh giá chờ duyệt', revs.filter(r => !r.approved).length, revs.length + ' tổng')}</div>
    <div class="grid g2 mt">${aCard('Đơn hàng mới nhất', orders.length ? `<div class="tbl-wrap"><table class="table"><tr><th>Mã</th><th>Khách</th><th>Tổng</th><th>Trạng thái</th></tr>${orders.slice(0, 8).map(o => `<tr><td class="mono">${esc(o.code)}</td><td>${esc(o.buyer && o.buyer.name || '')}<div class="small faint">${esc(o.buyer && o.buyer.email || '')}</div></td><td>${money(o.total, o.currency)}</td><td><span class="badge ${['paid', 'shipped'].includes(o.status) ? 'live' : o.status === 'cancelled' ? 'danger' : 'warn'}">${esc(o.status)}</span></td></tr>`).join('')}</table></div>` : '<p class="muted">Chưa có đơn hàng.</p>', '<a class="link" href="#/admin/orders">Xem tất cả</a>')}
    ${aCard('Bắt đầu nhanh', `<div class="stack"><a class="btn secondary" href="#/admin/schedule">${ic('calendar', 'sm')} Thêm lịch live tuần này</a><a class="btn secondary" href="#/admin/blog">${ic('pen', 'sm')} Viết bài mới</a><a class="btn secondary" href="#/admin/products">${ic('bag', 'sm')} Tải lên sản phẩm (planner, PDF…)</a><a class="btn secondary" href="#/admin/site">${ic('sliders', 'sm')} Đổi màu, font, logo, menu</a></div>`)}</div>`);
}

/* ---------------- Giao diện & Menu ---------------- */
let adminNav = [], adminSocial = [], adminVideos = [];
const HOME_SECTIONS = [['hero', 'Khối chào (hero)'], ['stats', 'Thẻ thống kê'], ['today', 'Buổi live hôm nay'], ['blog', 'Bài viết mới'], ['shop', 'Sản phẩm nổi bật'], ['reviews', 'Đánh giá'], ['challenge', 'Đăng ký Challenge 30 ngày']];
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
    ${aCard('Các khối ở trang chủ', `<div class="grid g2">${HOME_SECTIONS.map(([k, l]) => `<label class="row small" style="font-weight:600"><input type="checkbox" data-hs="${k}" ${(branding.homeSections || {})[k] !== false ? 'checked' : ''}> ${l}</label>`).join('')}</div><div class="row mt"><button class="btn primary" data-act="saveHome">Lưu</button></div>`)}
    ${aCard('Thông báo chạy chữ & Mạng xã hội', `<div class="f2">${fld('Thông báo (Tiếng Việt)', 'ad-ann-vi', (branding.announcement || {}).vi || '', '', 'Để trống = ẩn')}${fld('Announcement (English)', 'ad-ann-en', (branding.announcement || {}).en || '')}</div>
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
const BLK = { f:['Tập trung', 'var(--seg-focus)', 25], s:['Nghỉ ngắn', 'var(--seg-short)', 5], l:['Nghỉ dài', 'var(--seg-long)', 15] };
function planEditor(di, si, s){
  return `<div class="ad-blocks mt-s"><div class="hint">Mỗi dòng là một đoạn của buổi live, theo thứ tự. Bạn thêm bao nhiêu đoạn tập trung / nghỉ ngắn / nghỉ dài tuỳ ý, độ dài mỗi đoạn khác nhau.</div>
    ${s.plan.map((b, bi) => `<div class="blk"><i class="dot" style="background:${BLK[b.t][1]}"></i><select class="select" data-d="${di}" data-s="${si}" data-b="${bi}" data-f="bt">${['f', 's', 'l'].map(k => `<option value="${k}" ${b.t === k ? 'selected' : ''}>${BLK[k][0]}</option>`).join('')}</select>
      <input class="input" type="number" min="1" data-d="${di}" data-s="${si}" data-b="${bi}" data-f="bm" value="${b.m}" title="phút"><span class="row" style="gap:2px;flex-wrap:nowrap"><button type="button" class="btn ghost icon sm" data-act="blkMove" data-d="${di}" data-s="${si}" data-b="${bi}" data-dir="-1">${ic('up', 'sm')}</button><button type="button" class="btn ghost icon sm" data-act="blkMove" data-d="${di}" data-s="${si}" data-b="${bi}" data-dir="1">${ic('down', 'sm')}</button><button type="button" class="btn danger icon sm" data-act="blkDel" data-d="${di}" data-s="${si}" data-b="${bi}">${ic('trash', 'sm')}</button></span></div>`).join('')}
    <div class="row mt-s"><button type="button" class="btn secondary sm" data-act="blkAdd" data-d="${di}" data-s="${si}" data-t="f">+ Tập trung</button><button type="button" class="btn secondary sm" data-act="blkAdd" data-d="${di}" data-s="${si}" data-t="s">+ Nghỉ ngắn</button><button type="button" class="btn secondary sm" data-act="blkAdd" data-d="${di}" data-s="${si}" data-t="l">+ Nghỉ dài</button></div></div>`;
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
        <div class="f5 mt-s">${[['focus', 'Focus (p)'], ['short', 'Nghỉ (p)'], ['long', 'Nghỉ dài (p)'], ['rounds', 'Số phiên'], ['longEvery', 'Nghỉ dài mỗi']].map(([f, lb]) => `<div class="field"><label class="label">${lb}</label><input class="input" type="number" min="0" data-d="${di}" data-s="${si}" data-f="p_${f}" value="${s.pomo[f]}"></div>`).join('')}</div>`}
        <div class="row between mt-s"><span class="small faint mono" id="tot-${di}-${si}">⏱ ${slotTotal(s)} phút ≈ ${(slotTotal(s) / 60).toFixed(2)} giờ</span><span class="row"><label class="chk row small" style="font-weight:700"><input type="checkbox" data-d="${di}" data-s="${si}" data-f="cancelled" ${s.cancelled ? 'checked' : ''}> Huỷ buổi này</label><button type="button" class="btn danger sm" data-act="rmSlot" data-d="${di}" data-s="${si}">Xoá</button></span></div>
        <div class="f2 mt-s"><input class="input" placeholder="Lý do huỷ (VI)" data-d="${di}" data-s="${si}" data-f="noteVi" value="${esc(s.cancelNote.vi || '')}"><input class="input" placeholder="Cancel reason (EN)" data-d="${di}" data-s="${si}" data-f="noteEn" value="${esc(s.cancelNote.en || '')}"></div></div>`).join('')}
      ${day.slots.length < 4 ? `<button type="button" class="btn secondary sm mt-s" data-act="addSlot" data-d="${di}">${ic('plus', 'sm')} Thêm buổi live</button>` : ''}</div>`).join('')}`);
}
function onSchedField(el){
  const d = el.dataset.d, f = el.dataset.f; if (d === undefined || !f) return; const day = adminDays[+d], v = el.type === 'checkbox' ? el.checked : el.value;
  if (el.dataset.s === undefined) { if (f === 'cancelled') day.cancelled = v; else if (f === 'noteVi') day.cancelNote.vi = v; else if (f === 'noteEn') day.cancelNote.en = v; return; }
  const s = day.slots[+el.dataset.s];
  if (f === 'mode') { if (v === 'plan') { s.plan = buildPlan(cleanPomo(s.pomo)).map(g => ({ t:g.type[0], m:g.min })); } else s.plan = null; drawSchedule(); return; }
  if (f === 'bt') { s.plan[+el.dataset.b].t = v; drawSchedule(); return; }
  if (f === 'bm') { s.plan[+el.dataset.b].m = Math.max(1, Math.round(+v || 1)); const n = $(`tot-${d}-${el.dataset.s}`); if (n) n.textContent = `⏱ ${slotTotal(s)} phút ≈ ${(slotTotal(s) / 60).toFixed(2)} giờ`; return; }
  if (f === 'preset') { if (v !== 'custom') { s.pomo = { ...PRESETS[v] }; drawSchedule(); } return; }
  if (f.startsWith('p_')) { s.pomo[f.slice(2)] = +v; const n = $(`tot-${d}-${el.dataset.s}`); if (n) n.textContent = `⏱ ${slotTotal(s)} phút ≈ ${(slotTotal(s) / 60).toFixed(2)} giờ`; return; }
  if (f === 'cancelled') s.cancelled = v; else if (f === 'noteVi') s.cancelNote.vi = v; else if (f === 'noteEn') s.cancelNote.en = v; else s[f] = v;
}
document.addEventListener('input', e => { if (e.target.closest && e.target.closest('#admin-body') && e.target.tagName !== 'SELECT') onSchedField(e.target); });
document.addEventListener('change', e => { if (e.target.closest && e.target.closest('#admin-body') && (e.target.tagName === 'SELECT' || e.target.type === 'checkbox')) onSchedField(e.target); });

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
    <div class="rte-bar">${[['bold', 'B'], ['italic', 'I'], ['underline', 'U'], ['h2', 'H2'], ['h3', 'H3'], ['ul', '• Danh sách'], ['ol', '1. Danh sách'], ['quote', '❝'], ['link', 'Link'], ['img', 'Ảnh'], ['hr', '―'], ['clean', 'Tx']].map(([c, l]) => `<button type="button" data-act="fmt" data-c="${c}" onmousedown="event.preventDefault()">${l}</button>`).join('')}</div>
    <div class="rte" id="pb-rte" contenteditable="true"></div><p class="hint" id="pb-draft">Tiếng Anh là ngôn ngữ chính của trang. Viết thêm bản Tiếng Việt nếu bạn muốn; ngôn ngữ khác sẽ hiện bản English kèm nút dịch. Bản nháp tự lưu trong trình duyệt khi bạn gõ.</p>
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

/* ---------------- Đơn hàng ---------------- */
async function tabOrders(){
  A('<p class="muted">Đang tải…</p>'); let list = []; try { list = DEMO ? [{ id:'EP-DEMO1', code:'EP-DEMO1', total:79000, currency:'VND', status:'paid', uid:'demo', buyer:{ name:'Linh', email:'linh@mail.com' }, items:[{ id:'planner', name:'30-Day Study Planner (PDF)', qty:1, type:'digital' }], createdAt:Date.now() }] : await getAll('orders', 'createdAt', 100); } catch (e) { return fail(e); }
  A(aCard('Đơn hàng gần đây', list.length ? `<div class="tbl-wrap"><table class="table"><tr><th>Mã / ngày</th><th>Khách</th><th>Sản phẩm</th><th>Tổng</th><th>Trạng thái</th></tr>${list.map(o => `<tr><td><b class="mono">${esc(o.code)}</b><div class="small faint">${esc(dateStr(o.createdAt))}</div></td>
    <td>${esc(o.buyer && o.buyer.name || '')}<div class="small faint">${esc(o.buyer && o.buyer.email || '')}</div>${o.buyer && o.buyer.address ? `<div class="small muted">${esc(o.buyer.address)}</div>` : ''}${o.buyer && o.buyer.note ? `<div class="small faint">“${esc(o.buyer.note)}”</div>` : ''}<div class="small faint">${o.uid ? 'Có tài khoản' : 'Khách vãng lai'}</div></td>
    <td>${(o.items || []).map(i => `${esc(i.name)} ×${i.qty}`).join('<br>')}</td><td>${money(o.total, o.currency)}${o.coupon ? `<div class="small faint">mã ${esc(o.coupon)}</div>` : ''}</td>
    <td><select class="select" style="min-width:120px" data-change="orderStatus" data-id="${esc(o.id)}">${['pending', 'paid', 'shipped', 'cancelled'].map(s => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>${(o.items || []).some(i => i.type !== 'physical') && o.uid && ['paid', 'shipped'].includes(o.status) ? `<button class="btn secondary sm mt-s" data-act="grant" data-id="${esc(o.id)}">Cấp lại quyền tải</button>` : ''}</td></tr>`).join('')}</table></div><p class="hint">Khi bạn chuyển sang <b>paid</b>, các sản phẩm số trong đơn tự động xuất hiện trong Thư viện của khách (nếu họ đã đăng nhập khi mua).</p>` : '<p class="muted">Chưa có đơn hàng.</p>'));
  window._orders = Object.fromEntries(list.map(o => [o.id, o]));
}
async function grantLibrary(o){
  if (!o.uid) return toast('Đơn của khách vãng lai — hãy gửi file qua email.');
  const items = (o.items || []).filter(i => i.type !== 'physical'); if (!items.length) return;
  if (DEMO) return toast('Chế độ xem thử');
  const b = db.batch(); items.forEach(i => b.set(db.collection('users').doc(o.uid).collection('library').doc(i.id), { name:i.name, orderCode:o.code, grantedAt:TS() }));
  await b.commit(); toast(`Đã cấp quyền tải ${items.length} sản phẩm`);
}
CHANGES.orderStatus = async el => {
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

/* ---------------- Nội dung & FAQ ---------------- */
let adminFaq = [];
function tabContent(){
  adminFaq = (Array.isArray(content.faq) && content.faq.length ? content.faq : [1, 2, 3, 4].map(i => ({ q:{ vi:I18N.vi['faq' + i + 'q'], en:I18N.en['faq' + i + 'q'] }, a:{ vi:I18N.vi['faq' + i + 'a'], en:I18N.en['faq' + i + 'a'] } }))).map(f => JSON.parse(JSON.stringify(f)));
  A(`${aCard('Sửa chữ & ảnh trực tiếp trên trang', `<p class="muted small">Bật chế độ sửa, rồi bấm vào bất kỳ chữ nào có viền nét đứt (tiêu đề, mô tả, phần Giới thiệu…) để gõ lại — tự lưu khi bạn bấm ra ngoài. Bấm vào ảnh để thay. Mỗi ngôn ngữ được sửa riêng: đổi ngôn ngữ ở nút <b>Tuỳ chọn</b> trên thanh trên cùng.</p>
      <div class="row mt-s"><button class="btn primary" data-act="startEdit">${ic('pen', 'sm')} Bật chế độ sửa (trang chủ)</button><button class="btn secondary" data-act="startEditAbout">Sửa trang Giới thiệu</button><button class="btn danger" data-act="resetTexts">Khôi phục toàn bộ chữ về mặc định</button></div>`)}
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
const PAY_FIELDS = { 'py-bin':'bankBin', 'py-acc':'accountNo', 'py-name':'accountName', 'py-momo':'momoPhone', 'py-momoqr':'momoQr', 'py-stripe':'stripe', 'py-paypal':'paypal', 'py-kofi':'kofi', 'py-tpl':'orderTemplate', 'py-dvnd':'donateVND', 'py-dusd':'donateUSD', 'py-comp':'companionUrl' };
function tabPayments(){
  const p = payments;
  A(`${aCard('Chuyển khoản VietQR (khách Việt Nam)', `<div class="f3">${fld('Mã ngân hàng / BIN', 'py-bin', p.bankBin, '', 'VD: 970436 (Vietcombank), 970422 (MB)…')}${fld('Số tài khoản', 'py-acc', p.accountNo)}${fld('Tên chủ tài khoản', 'py-name', p.accountName, '', 'IN HOA, không dấu')}</div><p class="hint">Mã QR tự điền số tiền + mã đơn. Quét được bằng mọi app ngân hàng và bằng MoMo (Chuyển tiền → Quét mã).</p>
      <div class="f2 mt-s">${fld('SĐT MoMo (tuỳ chọn)', 'py-momo', p.momoPhone)}${imgField('Ảnh QR MoMo (tuỳ chọn)', 'py-momoqr', p.momoQr)}</div>`)}
    ${aCard('Thanh toán quốc tế (mặc định cho mọi sản phẩm)', `<div class="f3">${fld('Stripe Payment Link (Visa/Mastercard)', 'py-stripe', p.stripe)}${fld('PayPal.me', 'py-paypal', p.paypal)}${fld('Ko-fi', 'py-kofi', p.kofi)}</div>`)}
    ${aCard('Ủng hộ & Người đồng hành (trang "Support")', `<p class="hint" style="margin-bottom:10px">Trang Support dùng chính thông tin VietQR (khách Việt Nam) và PayPal / Ko-fi / Stripe (khách nước ngoài) ở trên. Chỉ cần thêm các mục dưới đây.</p>
      <div class="f2">${fld('Các mức tiền gợi ý — VND (cách nhau dấu phẩy)', 'py-dvnd', p.donateVND, '', 'VD: 20000, 50000, 100000, 200000')}${fld('Các mức tiền gợi ý — USD', 'py-dusd', p.donateUSD, '', 'VD: 3, 5, 10, 25')}</div>
      ${fld('Link đăng ký hằng tháng cho "Người đồng hành"', 'py-comp', p.companionUrl, '', 'VD: link Ko-fi Membership hoặc Patreon. Để trống = ẩn nút. PayPal.me nên có dạng https://paypal.me/tencuaban')}`)}
    ${aCard('Email xác nhận đơn (EmailJS)', `${fld('Template ID', 'py-tpl', p.orderTemplate, '', 'Biến: {{user_name}} {{user_email}} {{order_code}} {{items}} {{total}}')}`)}
    <button class="btn primary" data-act="savePay">Lưu thanh toán</button>`);
}

/* ---------------- Thành viên ---------------- */
async function tabMembers(){
  A('<p class="muted">Đang tải…</p>'); let users = [], signups = [], comps = []; try { [users, signups, comps] = await Promise.all([getAll('users'), getAll('challenge_signups', 'timestamp', 500), getAll('companions')]); } catch (e) { return fail(e); }
  if (DEMO) { users = [{ id:'u1', displayName:'Linh', email:'linh@mail.com', moon:{ days:new Array(30).fill('x'), rounds:1 } }, { id:'u2', displayName:'Daniel', email:'d@mail.com', moon:{ days:new Array(11).fill('x') } }]; comps = [{ id:'u1' }]; }
  const isC = id => comps.some(c => c.id === id);
  A(`<div class="grid g2">${aCard(`Thành viên (${users.length})`, users.length ? users.map(u => { const d = u.moon && u.moon.days ? u.moon.days.length : 0; return `<div class="ord-row"><div><b>${esc(u.displayName || '—')}</b> ${isC(u.id) ? `<span class="badge">${ic('heart', 'sm')} Đồng hành</span>` : ''}<div class="small muted">${esc(u.email || '')}</div><div class="small faint">${u.moon ? `Hành trình trăng: ${d}/30${u.moon.rounds ? ' · ' + u.moon.rounds + ' lần trăng tròn' : ''}` : 'Chưa bắt đầu hành trình trăng'}</div></div>
        <label class="row small" style="font-weight:700"><input type="checkbox" data-change="companion" data-id="${esc(u.id)}" data-name="${esc(u.displayName || u.email || '')}" ${isC(u.id) ? 'checked' : ''}> Người đồng hành</label></div>`; }).join('') : '<p class="muted">Chưa có.</p>', '')}
    ${aCard(`Đăng ký email nhắc lịch (${signups.length})`, signups.length ? signups.map(s => `<div class="ord-row"><div><b>${esc(s.codename || '')}</b><div class="small muted">${esc(s.email || '')}</div></div><span class="small faint">${esc(dateStr(s.timestamp))}</span></div>`).join('') : '<p class="muted">Chưa có.</p>', `<button class="btn secondary sm" data-act="copyEmails">Sao chép email</button>`)}</div>
    <p class="hint mt">"Người đồng hành" là những người ủng hộ hằng tháng của bạn. Khi bạn tích chọn, họ sẽ có huy hiệu nhỏ trên tài khoản. Bạn tự đối chiếu với nơi nhận ủng hộ (Ko-fi, Patreon…).</p>`);
  window._signups = signups;
}
CHANGES.companion = async el => {
  try {
    if (DEMO) return toast('Chế độ xem thử');
    const ref = db.collection('companions').doc(el.dataset.id);
    if (el.checked) await ref.set({ name:el.dataset.name, since:TS() }); else await ref.delete();
    ok(el.checked ? 'Đã đánh dấu người đồng hành' : 'Đã bỏ đánh dấu');
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
    const data = { name:val('ad-name') || 'EP Study Room', defaultTheme:val('ad-theme'), themeColor:$('ad-color').value, font:val('ad-font'), logoUrl:val('ad-logo'), mascotUrl:val('ad-mascot') };
    dbSet('settings', 'branding', data).then(() => { Object.assign(branding, data); applyLook(); renderChrome(); ok(); }).catch(fail);
  },
  navMove: el => { adminNav = readNav(); const i = +el.dataset.i, j = i + +el.dataset.d; if (j < 0 || j >= adminNav.length) return; [adminNav[i], adminNav[j]] = [adminNav[j], adminNav[i]]; $('nav-list').innerHTML = navRows(); },
  navDel: el => { adminNav = readNav(); adminNav.splice(+el.dataset.i, 1); $('nav-list').innerHTML = navRows(); },
  navAddLink: () => { adminNav = readNav(); adminNav.push({ id:'link-' + Date.now().toString(36), custom:true, visible:true, url:'', label:{ vi:'', en:'' } }); $('nav-list').innerHTML = navRows(); },
  saveNav: () => {
    const nav = readNav().filter(n => !n.custom || n.url).map(n => { const o = { id:n.id, visible:n.visible !== false }; if (n.label) o.label = n.label; if (n.custom) { o.url = n.url; o.custom = true; } return o; });
    dbSet('settings', 'branding', { nav }).then(() => { branding.nav = nav; renderChrome(); ok('Đã lưu menu ✔'); }).catch(fail);
  },
  saveHome: () => { const hs = {}; document.querySelectorAll('[data-hs]').forEach(c => hs[c.dataset.hs] = c.checked); dbSet('settings', 'branding', { homeSections:hs }).then(() => { branding.homeSections = hs; ok(); }).catch(fail); },
  socialAdd: () => { adminSocial = readSocial(); adminSocial.push(['', '']); $('social-list').innerHTML = socialRows(); },
  socialDel: el => { adminSocial = readSocial(); adminSocial.splice(+el.dataset.i, 1); $('social-list').innerHTML = socialRows(); },
  saveSocial: async () => {
    const sl = {}; readSocial().forEach(([n, u]) => { if (n && u) sl[n] = u; }); const announcement = { vi:val('ad-ann-vi'), en:val('ad-ann-en') };
    try {
      if (DEMO) toast('Chế độ xem thử: chưa lưu thật');
      else { const ref = db.collection('settings').doc('branding'); await ref.set({ announcement }, { merge:true }); await ref.update({ socialLinks:sl }); }   // update = thay hẳn danh sách (xoá được mục đã bỏ)
      branding.socialLinks = sl; branding.announcement = announcement; renderChrome(); ok();
    } catch (e) { fail(e); }
  },
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
  saveSched: () => {
    const days = adminDays.map(d => ({ cancelled:d.cancelled, cancelNote:{ vi:d.cancelNote.vi || '', en:d.cancelNote.en || '' }, slots:d.slots.filter(s => s.time).map(s => ({ time:s.time, icon:s.icon || '', title:s.title || '', pomo:cleanPomo(s.pomo), plan: s.plan && s.plan.length ? s.plan.map(b => ({ t:b.t, m:Math.max(1, Math.round(+b.m || 1)) })) : [], cancelled:s.cancelled, cancelNote:{ vi:s.cancelNote.vi || '', en:s.cancelNote.en || '' } })) }));
    dbSet('weekly_schedules', weekKeyFor(weekOffset), { days }, false).then(() => ok('Đã lưu lịch ✔')).catch(fail);
  },
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
  saveCats: () => { const cats = readCats().filter(c => c.label.en || c.label.vi); dbSet('settings', 'branding', { blogCats:cats }).then(() => { branding.blogCats = cats; ok('Đã lưu các mục'); tabBlog(); }).catch(fail); },
  fmt: el => fmtCmd(el.dataset.c),
  savePost: () => {
    editBody[editLang] = $('pb-rte').innerHTML;
    const title = { vi:val('pb-t-vi'), en:val('pb-t-en') }, slug = val('pb-slug') || slugify(title.en || title.vi), at = val('pb-at') ? new Date(val('pb-at')).getTime() : 0; if (!slug || !(title.vi || title.en)) return alert('Cần có tiêu đề');
    const data = { slug, title, excerpt:{ vi:val('pb-e-vi'), en:val('pb-e-en') }, body:{ vi:sanitizeHtml(editBody.vi), en:sanitizeHtml(editBody.en) }, cover:val('pb-cover'), category:val('pb-cat'), pinned:$('pb-pin').checked, publishAt: at || null, tags:val('pb-tags').split(',').map(s => s.trim()).filter(Boolean), published:$('pb-pub').checked, updatedAt:TS() };
    if (!editPost.slug) data.createdAt = at ? firebase.firestore.Timestamp.fromMillis(at) : TS();
    store.set('draft_' + (editPost.slug || 'new'), null);
    dbSet('posts', slug, data).then(() => { ok(); tabBlog(); }).catch(fail);
  },
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
  saveProd: async () => {
    const name = { vi:val('pr-n-vi'), en:val('pr-n-en') }, id = editProd.id || slugify(name.en || name.vi); if (!id) return alert('Cần có tên sản phẩm');
    const type = val('pr-type'), stock = val('pr-stock'), fileUrl = val('pr-fileurl');
    const hasFile = type !== 'physical' && !!(fileUrl || (prodFile && (prodFile.storagePath || prodFile.fileUrl)));
    const data = { name, desc:{ vi:val('pr-d-vi'), en:val('pr-d-en') }, priceVND:+val('pr-vnd') || 0, priceUSD:+val('pr-usd') || 0, type, stock: stock === '' ? null : +stock, images:prodImages, payLinks:{ stripe:val('pr-stripe'), paypal:val('pr-paypal'), kofi:val('pr-kofi') }, active:$('pr-active').checked, hasFile, updatedAt:TS() };
    if (!editProd.id) data.createdAt = TS();
    try {
      await dbSet('products', id, data);
      if (type !== 'physical') await dbSet('products_private', id, { fileUrl, storagePath: (prodFile && prodFile.storagePath) || '', fileName: (prodFile && prodFile.fileName) || '', updatedAt:TS() });
      ok('Đã lưu sản phẩm ✔'); tabProducts();
    } catch (e) { fail(e); }
  },
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
  saveFaq: () => { const faq = readFaq().filter(f => f.q.vi || f.q.en); dbSet('settings', 'content', { faq }).then(() => { content.faq = faq; ok(); }).catch(fail); },
  resetTexts: () => { if (!confirm('Khôi phục TOÀN BỘ chữ đã sửa về mặc định? (ảnh giữ nguyên)')) return; if (DEMO) { content.texts = {}; return toast('Đã khôi phục (xem thử)'); } db.collection('settings').doc('content').update({ texts:DEL() }).then(() => { content.texts = {}; ok('Đã khôi phục'); }).catch(fail); },
  /* đánh giá */
  reviewSet: el => dbSet('reviews', el.dataset.id, { approved: el.dataset.v === '1' }).then(tabReviews).catch(fail),
  reviewDel: el => confirm('Xoá đánh giá này?') && (DEMO ? toast('Chế độ xem thử') : db.collection('reviews').doc(el.dataset.id).delete().then(tabReviews).catch(fail)),
  /* thanh toán */
  savePay: () => { const data = {}; Object.entries(PAY_FIELDS).forEach(([id, k]) => data[k] = val(id)); dbSet('settings', 'payments', data).then(() => { Object.assign(payments, data); ok(); }).catch(fail); },
  copyEmails: () => { try { navigator.clipboard.writeText((window._signups || []).map(s => s.email).join(', ')); } catch (e) {} toast('Đã sao chép email'); }
});
