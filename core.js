'use strict';
const BUILD = '2026-10-19 · bản 10 (đổi tên menu, báo thanh toán bắt buộc ghi tên, kiểm tra lỗi)';   // hiện ở Admin để biết web đang chạy bản nào
/* =========================================================
   CORE — cấu hình, trạng thái, dữ liệu realtime, đăng nhập, router, sự kiện
   ========================================================= */
/* Tải theo nhu cầu (không chặn lúc mở trang): EmailJS chỉ khi gửi email, admin.js chỉ khi chủ trang đăng nhập / mở #/admin */
const loadScript = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('load ' + src)); document.head.appendChild(s); });
let emailP = null;
const loadEmailJS = () => emailP || (emailP = loadScript('https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js').then(() => { emailjs.init("JKo4tonk0gQMwrHFZ"); }).catch(e => { emailP = null; console.warn('EmailJS chưa tải được', e); throw e; }));
let adminP = null;
const ASSET_V = '35';                                                // đổi cùng số ?v= trong index.html mỗi lần cập nhật, để trình duyệt không trộn file cũ với file mới
const loadAdmin = () => typeof PAGES.admin === 'function' ? Promise.resolve() : (adminP || (adminP = loadScript('admin.js?v=' + ASSET_V).catch(e => { adminP = null; throw e; })));
let plannerP = null;
const loadPlanner = () => typeof PAGES.planner === 'function' ? Promise.resolve() : (plannerP || (plannerP = Promise.all([loadScript('planner-i18n.js?v=' + ASSET_V).catch(() => {}), loadScript('planner.js?v=' + ASSET_V)]).catch(e => { plannerP = null; throw e; })));   // planner-i18n.js = bản dịch hi/ja/ko/zh/fr/es; thiếu thì dùng tiếng Anh
const EMAILJS_SERVICE = 'service_a098n5f', EMAILJS_CHALLENGE_TPL = 'template_lhv0y0n';
// Cấu hình Firebase nằm trong js/firebase-config.js (file duy nhất bạn cần sửa để nối web với Firebase)
const CONFIG_MISSING = !window.FIREBASE_CONFIG || /PASTE_|PLACEHOLDER/.test(JSON.stringify(window.FIREBASE_CONFIG));
firebase.initializeApp(window.FIREBASE_CONFIG || { apiKey:'AIzaSyPLACEHOLDER', projectId:'none', appId:'none' });
const db = firebase.firestore(), auth = firebase.auth();
try { db.settings({ experimentalForceLongPolling:true, merge:true }); } catch (e) { console.warn('firestore settings', e); }   // một số mạng/trình duyệt chặn hoặc làm chậm kết nối streaming nên lần đọc đầu báo 'unavailable' (Planner không tải được): dùng long-polling luôn, ổn định hơn cho web nhỏ này
let storage = null; try { storage = firebase.storage(); } catch (e) { console.warn('Storage chưa sẵn sàng', e); }
const TS = () => firebase.firestore.FieldValue.serverTimestamp(), DEL = () => firebase.firestore.FieldValue.delete();
const DT = luxon.DateTime, VN = 'Asia/Ho_Chi_Minh';
const QP = new URLSearchParams(location.search);
const DEMO = QP.has('demo');            // ?demo=1  → dữ liệu mẫu, không cần database
const DEMO_AS = QP.get('as');           // ?demo=1&as=admin | as=user → giả lập đăng nhập để xem giao diện

/* ---------- helpers ---------- */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const store = {
  get(k, d){ try { const v = localStorage.getItem('ep_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v){ try { localStorage.setItem('ep_' + k, JSON.stringify(v)); } catch (e) {} }
};
const ic = (n, c = '') => `<svg class="ic ${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const debounce = (fn, ms) => { let h; return (...a) => { clearTimeout(h); h = setTimeout(() => fn(...a), ms); }; };
const tsMs = ts => ts && ts.toMillis ? ts.toMillis() : (typeof ts === 'number' ? ts : Date.now());
const slugify = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const money = (n, cur) => new Intl.NumberFormat(cur === 'VND' ? 'vi-VN' : 'en-US', { style:'currency', currency:cur, maximumFractionDigits: cur === 'VND' ? 0 : 2 }).format(n || 0);
const readMins = html => Math.max(1, Math.round((html || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 200));
function youTubeId(s){
  s = String(s || '').trim(); if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:v=|youtu\.be\/|embed\/|live\/|shorts\/)([\w-]{11})/); return m ? m[1] : '';
}
function toast(msg){ const el = $('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), 2200); }

/* ---------- state ---------- */
const state = {
  lang: store.get('lang', null) || 'en',      // tiếng Anh là mặc định; khách tự đổi bằng nút ⚙️
  tz: store.get('tz', 'auto'), theme: store.get('theme', null), calm: store.get('calm', false),
  currency: store.get('currency', null), user: null, isAdmin: false, editMode: false
};
if (!['rain', 'pop', 'violet', 'teal'].includes(state.theme)) state.theme = null;   // bỏ giá trị theme cũ của các bản trước
let userTZ = state.tz === 'auto' ? DT.local().zoneName : state.tz;
let branding = { name:'EP Study Room', themeColor:'#ff3d9a', defaultTheme:'rain', font:'baloo', logoUrl:'', mascotUrl:'', ytChannelId:'', ytLiveId:'', videos:[], contacts:{}, socialLinks:{}, announcement:{}, nav:null, homeSections:{}, focusLimit:120, focusCodeHash:'', focusCodeUntil:'',
  blogCats:[
    { id:'journal', label:{ en:'Journal', vi:'Nhật ký' }, desc:{ en:'Personal notes and updates.', vi:'Ghi chép và cập nhật cá nhân.' } },
    { id:'study', label:{ en:'Study notes', vi:'Ghi chép học tập' }, desc:{ en:'Methods, routines and what works.', vi:'Phương pháp, thói quen và điều hiệu quả.' } },
    { id:'essays', label:{ en:'Essays', vi:'Tản văn' }, desc:{ en:'Longer pieces on things I think about.', vi:'Những bài dài về điều mình suy nghĩ.' } },
    { id:'books', label:{ en:'Books & films', vi:'Sách & phim' }, desc:{ en:'Things I read and watched.', vi:'Những thứ mình đọc và xem.' } },
    { id:'poems', label:{ en:'Poems', vi:'Thơ & viết ngắn' }, desc:{ en:'Short writing.', vi:'Những đoạn viết ngắn.' } }
  ], donate:{} };
let content = { texts:{}, images:{}, faq:null };
let payments = {}, posts = [], products = [], reviews = [], library = [], profile = {};
let music = { picks:[], recent:[] }, gear = { items:[] };
let supporters = { items:[] };                                       // settings/supporters: tên người đồng hành hiện ở mục cảm ơn (admin quản lý)
const thanksList = () => (supporters.items || []).filter(x => x && x.show !== false && x.name && (!x.until || x.until >= DT.now().toISODate())).sort((a, b) => String(a.since || '').localeCompare(String(b.since || '')));
/* Tự thêm https:// cho các link thanh toán nếu người dùng quên */
function fixPayUrls(p) { const o = { ...p }; ['stripe', 'paypal', 'kofi', 'companionUrl', 'momoQr'].forEach(k => { const v = (o[k] || '').trim(); o[k] = v && !/^(https?:)?\/\//i.test(v) && !/^data:/i.test(v) ? 'https://' + v : v; }); return o; }
state.companion = false; state.companionUntil = ''; state.compReq = null; state.compCheckedAt = 0;
let weekDocs = {}, weekOffset = 0;
const unsubs = {};
const route = { name:'home', args:[] };

/* ---------- i18n helpers ---------- */
const LANG_LIST = [['en','English'],['vi','Tiếng Việt'],['hi','हिन्दी'],['ja','日本語'],['ko','한국어'],['zh','中文'],['fr','Français'],['es','Español']];
function t(k, vars){
  let s = (I18N[state.lang] && I18N[state.lang][k]) ?? I18N.en[k] ?? k;
  if (vars) for (const v in vars) s = s.split('{' + v + '}').join(vars[v]);
  return s;
}
function L(o){
  if (!o) return ''; if (typeof o === 'string') return o;
  if (o[state.lang]) return o[state.lang];
  return state.lang === 'vi' ? (o.vi || o.en || '') : (o.en || o.vi || '');
}
const isNativeContent = () => state.lang === 'vi' || state.lang === 'en';
// Chữ có thể sửa trực tiếp: nội dung admin đã sửa (theo ngôn ngữ) → mặc định trong I18N
const ctext = k => {
  const o = content.texts && content.texts[k], v = o && o[state.lang];
  if (v != null && v !== '') return v;
  // admin đã viết bằng một ngôn ngữ khác nhưng bản dịch chưa kịp lưu → hiện chính chữ admin viết, không hiện câu mặc định không liên quan
  if (o) { const alt = (state.lang === 'vi' ? (o.vi || o.en) : (o.en || o.vi)) || Object.values(o).find(Boolean); if (alt) return alt; }
  return t(k);
};
const cms = k => `data-cms="${k}"`;
const cimg = (k, def) => (content.images && content.images[k]) || def || '';
const effTheme = () => state.theme || branding.defaultTheme || 'rain';
const effCurrency = () => state.currency || ((state.lang === 'vi' || userTZ === VN) ? 'VND' : 'USD');

/* =========================================================
   LOOK & FEEL
   ========================================================= */
const THEMES = {                 // ô màu nhỏ trong bảng chọn giao diện
  rain:'linear-gradient(135deg,#080b13 50%,#ff3d9a 50%)', pop:'linear-gradient(135deg,#ffffff 50%,#ff2d87 50%)',
  violet:'linear-gradient(135deg,#0f0720 50%,#ff4fd8 50%)', teal:'linear-gradient(135deg,#041317 50%,#ffb21f 50%)'
};
const FONTS = {
  baloo:{ label:'Baloo 2 + Nunito (tròn, dễ thương — mặc định)', h:"'Baloo 2'", b:"'Nunito'", q:null },
  fredoka:{ label:'Fredoka + Nunito (bo tròn, vui vẻ)', h:"'Fredoka'", b:"'Nunito'", q:'Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700;800' },
  quicksand:{ label:'Quicksand (mềm, thanh thoát)', h:"'Quicksand'", b:"'Quicksand'", q:'Quicksand:wght@500;600;700' },
  jakarta:{ label:'Plus Jakarta Sans (gọn gàng)', h:"'Plus Jakarta Sans'", b:"'Plus Jakarta Sans'", q:'Plus+Jakarta+Sans:wght@400;600;700;800' },
  serif:{ label:'DM Serif + DM Sans (nhẹ nhàng, chữ có chân)', h:"'DM Serif Display'", b:"'DM Sans'", q:'DM+Serif+Display&family=DM+Sans:wght@400;500;700' }
};
function hexToRgb(hex){ const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || ''); return m ? [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)] : [255,61,154]; }
function strongOf(hex){      // bản đậm hơn của màu chủ đạo, đủ tương phản để làm chữ/nút trên nền sáng
  let [r, g, b] = hexToRgb(hex).map(v => v / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0, s = 0, l = (mx + mn) / 2;
  if (d) { s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? ((b - r) / d + 2) : ((r - g) / d + 4); h *= 60; }
  return `hsl(${h.toFixed(0)} ${(Math.min(s, .9) * 100).toFixed(0)}% ${(Math.min(l, .42) * 100).toFixed(0)}%)`;
}
function applyLook(){
  const root = document.documentElement, th = effTheme();
  root.dataset.theme = th;
  if (state.calm) root.dataset.calm = '1'; else delete root.dataset.calm;
  if (th === 'rain' || th === 'pop') {          // màu chủ đạo do chủ trang chọn áp dụng cho theme "Đêm mưa" và "Rực rỡ"
    const c = branding.themeColor || '#ff3d9a', rgb = hexToRgb(c);
    root.style.setProperty('--accent', c); root.style.setProperty('--accent-rgb', rgb.join(','));
    if (th === 'pop') root.style.setProperty('--accent-strong', strongOf(c)); else root.style.setProperty('--accent-strong', c);
  } else ['--accent','--accent-rgb','--accent-strong'].forEach(p => root.style.removeProperty(p));
  const f = FONTS[branding.font] || FONTS.baloo;
  root.dataset.font = branding.font || 'baloo';
  root.style.setProperty('--font-h', f.h + ",'Nunito','Noto Sans Devanagari',system-ui,sans-serif"); root.style.setProperty('--font-b', f.b + ",'Noto Sans Devanagari',system-ui,sans-serif");
  if (f.q) { let l = $('font-extra'); if (!l) { l = document.createElement('link'); l.id = 'font-extra'; l.rel = 'stylesheet'; document.head.appendChild(l); } const href = `https://fonts.googleapis.com/css2?family=${f.q}&display=swap`; if (l.href !== href) l.href = href; }
  const meta = document.querySelector('meta[name=theme-color]'); if (meta) meta.content = th === 'pop' ? '#f3f1fb' : '#080b13';
  const cm = $('chk-calm'); if (cm) cm.checked = !!state.calm;
}
/* =========================================================
   SANITIZER (bài viết)
   ========================================================= */
const ALLOWED = Object.assign(Object.create(null), { P:[],BR:[],B:[],STRONG:[],I:[],EM:[],U:[],H2:[],H3:[],H4:[],UL:[],OL:[],LI:[],BLOCKQUOTE:[],HR:[],DIV:[],SPAN:[],CODE:[],PRE:[],A:['href'],IMG:['src','alt'] });
const DROP = new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','LINK','META','FORM','INPUT','BUTTON','TEXTAREA','SELECT','SVG','MATH','NOSCRIPT','TEMPLATE','TITLE']);
function sanitizeHtml(html){
  const doc = new DOMParser().parseFromString('<body>' + (html || '') + '</body>', 'text/html'), out = document.createElement('div');
  (function walk(src, dst){
    src.childNodes.forEach(n => {
      if (n.nodeType === 3) { dst.appendChild(document.createTextNode(n.nodeValue)); return; }
      if (n.nodeType !== 1) return;
      const tag = n.tagName; if (DROP.has(tag)) return;
      if (!(tag in ALLOWED)) { walk(n, dst); return; }
      const el = document.createElement(tag.toLowerCase());
      ALLOWED[tag].forEach(a => { const v = n.getAttribute(a); if (v == null) return; if ((a === 'href' || a === 'src') && !/^(https?:|mailto:)/i.test(v.trim())) return; el.setAttribute(a, v); });
      if (tag === 'A') { el.target = '_blank'; el.rel = 'noopener noreferrer'; }
      if (tag === 'IMG') el.loading = 'lazy';
      walk(n, el); dst.appendChild(el);
    });
  })(doc.body, out);
  return out.innerHTML;
}

/* =========================================================
   POMODORO PLAN + LỊCH LIVE (mô hình dữ liệu)
   ========================================================= */
const PRESETS = {
  classic:  { focus:25, short:5,  long:15, rounds:4, longEvery:4 },
  deep:     { focus:50, short:10, long:30, rounds:3, longEvery:3 },
  marathon: { focus:90, short:15, long:30, rounds:2, longEvery:2 }
};
function cleanPomo(p){
  p = p || {}; const n = (v, d, min = 1) => Math.max(min, Math.round(+v || d));
  return { focus:n(p.focus,25), short:n(p.short,5,0), long:n(p.long,15,0), rounds:n(p.rounds,4), longEvery:n(p.longEvery,4), prep:n(p.prep,0,0) };
}
function buildPlan(p){            // focus → nghỉ (nghỉ dài sau mỗi N phiên); không có nghỉ ngắn ở cuối buổi
  const segs = []; if (p.prep > 0) segs.push({ type:'prep', min:p.prep });      // phút chào & chuẩn bị ở đầu buổi (tuỳ chọn)
  for (let i = 1; i <= p.rounds; i++) {
    segs.push({ type:'focus', min:p.focus, n:i });
    if (i % p.longEvery === 0) { if (p.long) segs.push({ type:'long', min:p.long }); }
    else if (i < p.rounds && p.short) segs.push({ type:'short', min:p.short });
  }
  return segs;
}
const planMins = segs => segs.reduce((a, s) => a + s.min, 0);
function normSlot(s){ return { time:s.time || '', icon:s.icon || '', title:s.title || '', plan: Array.isArray(s.plan) && s.plan.length ? s.plan.map(x => { const b = { t:['f', 's', 'l', 'p'].includes(x.t) ? x.t : 'f', m:Math.max(1, Math.round(+x.m || 0)) }; const nm = String(x.nm || '').trim().slice(0, 40); if (nm) b.nm = nm; return b; }) : null, pomo: s.pomo ? cleanPomo(s.pomo) : null, manualH: parseFloat(s.manualH) || 2, cancelled: !!s.cancelled, cancelNote: s.cancelNote || {} }; }
function normDay(d){        // hỗ trợ cả định dạng mới {slots:[…]} lẫn định dạng cũ {m,a,e,m_h,…}
  d = d || {};
  if (Array.isArray(d.slots)) return { cancelled: !!d.cancelled, cancelNote: d.cancelNote || {}, slots: d.slots.map(normSlot) };
  const slots = [];
  [['m','☕'],['a','☀️'],['e','🌙']].forEach(([k]) => { if (d[k]) slots.push(normSlot({ time:d[k], manualH:d[k + '_h'] })); });
  return { cancelled:false, cancelNote:{}, slots };
}
// Danh sách các đoạn của một buổi: dãy tuỳ chỉnh (plan) nếu có, nếu không thì tự sinh từ mẫu Pomodoro
const SEG_TYPE = { f:'focus', s:'short', l:'long', p:'prep' };      // p = chuẩn bị & chào (không tính là tập trung hay nghỉ)
function slotSegs(slot){
  if (slot.plan && slot.plan.length) { let n = 0; return slot.plan.map(x => { const type = SEG_TYPE[x.t] || 'focus'; const seg = type === 'focus' ? { type, min:x.m, n:++n } : { type, min:x.m }; if (x.nm) seg.name = x.nm; return seg; }); }
  return slot.pomo ? buildPlan(slot.pomo) : null;
}
const slotMins = s => { const g = slotSegs(s); return g ? planMins(g) : Math.round((s.manualH || 2) * 60); };
function parseTime(str, baseVN){
  if (!str) return null; const p = String(str).trim().split(':'); if (p.length < 2) return null;
  const h = parseInt(p[0], 10), m = parseInt(p[1], 10); return (isNaN(h) || isNaN(m)) ? null : baseVN.set({ hour:h, minute:m, second:0, millisecond:0 });
}
const weekStart = off => DT.now().setZone(VN).plus({ weeks: off }).startOf('week');
const weekKeyFor = off => { const d = weekStart(off); return `${d.year}-W${d.weekNumber}`; };
function getItems(off, days){
  const ws = weekStart(off), out = [];
  (days || []).forEach((raw, i) => {
    const day = normDay(raw), dayVN = ws.plus({ days:i });
    day.slots.forEach((slot, si) => {
      const start = parseTime(slot.time, dayVN); if (!start) return; const mins = slotMins(slot);
      out.push({ off, di:i, si, day, slot, start, end:start.plus({ minutes:mins }), mins, cancelled: day.cancelled || slot.cancelled, key:`${off}-${i}-${si}` });
    });
  });
  return out;
}
const poolAll = () => [0, 1].flatMap(o => weekDocs[o] ? getItems(o, weekDocs[o]) : []);
const upcomingPool = () => poolAll().filter(x => !x.cancelled);
const watchUrl = () => branding.contacts.live || (branding.ytChannelId ? `https://www.youtube.com/channel/${branding.ytChannelId}/live` : '');

/* =========================================================
   FIRESTORE LISTENERS
   ========================================================= */
function demoWeek(off){
  const nowVN = DT.now().setZone(VN), todayIdx = nowVN.weekday - 1;
  const mk = (time, preset, extra) => ({ time, icon:'', title:'', pomo:{ ...PRESETS[preset] }, cancelled:false, cancelNote:{}, ...extra });
  const days = [0,1,2,3,4,5,6].map(() => ({ cancelled:false, cancelNote:{}, slots:[ mk('07:00','classic',{ title:'Morning focus' }), mk('14:00','deep'), mk('20:30','classic',{ title:'Night owls' }) ] }));
  days[2].slots[2] = mk('20:30','classic',{ title:'Night owls', cancelled:true, cancelNote:{ vi:'Mình bị ốm', en:'Feeling under the weather' } });
  days[5] = { cancelled:true, cancelNote:{ vi:'Đi chơi với bạn bè', en:'Out with friends' }, slots:[ mk('14:00','deep') ] };
  days[6].slots = [ mk('09:00','marathon',{ title:'Sunday deep work' }) ];
  days[3].slots[0] = { time:'07:00', icon:'', title:'Short morning', cancelled:false, cancelNote:{}, pomo:null, plan:[{ t:'f', m:25 }, { t:'s', m:5 }, { t:'f', m:25 }, { t:'l', m:15 }, { t:'f', m:40 }] };
  if (off === 0) days[todayIdx].slots[1] = mk(nowVN.minus({ minutes:20 }).toFormat('HH:mm'), 'classic', { title:'Live right now' });
  return days;
}
function listenWeek(off){
  if (unsubs['w' + off]) { unsubs['w' + off](); delete unsubs['w' + off]; }
  if (DEMO) { weekDocs[off] = demoWeek(off); render(); return; }
  if (SITE.on) {                                   // người xem: lấy từ bản gộp, tuần nằm ngoài bản gộp thì đọc 1 lần
    const key = weekKeyFor(off);
    if (SITE.weeks && key in SITE.weeks) { weekDocs[off] = SITE.weeks[key] || null; render(); return; }
    db.collection('weekly_schedules').doc(key).get().then(doc => { weekDocs[off] = doc.exists ? (doc.data().days || []) : null; render(); }).catch(() => { weekDocs[off] = null; render(); });
    return;
  }
  unsubs['w' + off] = db.collection('weekly_schedules').doc(weekKeyFor(off)).onSnapshot(
    doc => { weekDocs[off] = doc.exists ? (doc.data().days || []) : null; render(); },
    err => { console.warn('schedule', err.code); weekDocs[off] = null; render(); });
}
function listenWeeks(){
  const keep = new Set([0, 1, weekOffset]);
  Object.keys(unsubs).filter(k => k[0] === 'w').forEach(k => { const o = +k.slice(1); if (!keep.has(o)) { unsubs[k](); delete unsubs[k]; delete weekDocs[o]; } });
  keep.forEach(listenWeek);
}
const snap = (q, fn, errFn) => q.onSnapshot(fn, e => { console.warn(e.code || e); errFn && errFn(e); });
/* ---------------------------------------------------------
   TIẾT KIỆM LƯỢT ĐỌC FIREBASE (gói miễn phí giới hạn 50.000 lượt đọc / ngày)
   - Dữ liệu công khai (giao diện, chữ, nhạc, bài viết, sản phẩm, lịch live…) được admin gộp thành MỘT tài liệu
     settings/site. Người xem chỉ đọc đúng 1 tài liệu đó, rồi lưu trong trình duyệt SITE_TTL phút:
     mở lại web trong thời gian này thì tốn 0 lượt đọc. Nếu Firebase báo hết hạn mức, vẫn dùng bản đã lưu.
   - Admin (và khi chưa có bản gộp) dùng cách cũ: nghe dữ liệu trực tiếp để thấy thay đổi ngay.
   --------------------------------------------------------- */
const SITE_V = 1, SITE_TTL = 10 * 60e3;
const SITE = { on:false, weeks:null, bodies:null, failT:0 }, LEGACY = { on:false };
async function loadFallback(){                         // file tĩnh do admin tải lên GitHub (tuỳ chọn): người mới vẫn thấy nội dung dù Firebase lỗi
  try {
    const r = await fetch('site-fallback.json?d=' + DT.now().toISODate(), { cache:'no-cache' }); if (!r.ok) return false;
    const j = await r.json(); if (!j.site) return false;
    SITE.bodies = j.bodies || {}; SITE.on = true; if (!LEGACY.on) { applySite(j.site); listenWeeks(); } return true;
  } catch (e) { return false; }
}
const normBranding = (b, d) => { const a = d.announcement;
  return { ...b, ...d, name:d.name || 'EP Study Room', contacts:d.contacts || {}, socialLinks:d.socialLinks || {}, videos:d.videos || [], homeSections:d.homeSections || {}, announcement: typeof a === 'string' ? { vi:a, en:a } : (a || {}), defaultTheme: ['rain','pop','violet','teal'].includes(d.defaultTheme) ? d.defaultTheme : 'rain', font: FONTS[d.font] ? d.font : 'baloo', themeColor: ['#ff7da3','#ff7da3'].includes(d.themeColor) || !d.themeColor ? '#ff3d9a' : d.themeColor }; };
function applySite(s){
  if (s.branding && Object.keys(s.branding).length) branding = normBranding(branding, s.branding);
  content = { texts:{}, images:{}, faq:null, ...(s.content || {}) };
  payments = fixPayUrls(s.payments || {});
  const m = s.music || {}; music = { picks:m.picks || [], recent:m.recent || [] };
  gear = { items:(s.gear || {}).items || [] };
  supporters = { items:(s.supporters || {}).items || [] };
  posts = (s.posts || []).map(p => ({ ...p })).sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt));
  products = (s.products || []).map(p => ({ ...p })).sort((a, b) => tsMs(a.createdAt) - tsMs(b.createdAt));
  reviews = (s.reviews || []).map(r => ({ ...r })).sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt));
  SITE.weeks = s.weeks || {};
  applyLook(); render(); loadVideos();
}
/* Tín hiệu "vừa xuất bản": admin ghi settings/live = { t: giờ xuất bản }. Người xem nghe tài liệu nhỏ này (chỉ tốn 1 lượt đọc khi có thay đổi)
   và tự tải lại bản gộp ngay khi nó mới hơn bản đang giữ, thay vì chờ hết SITE_TTL. */
let liveUnsub = null;
function listenLive(){
  if (liveUnsub || DEMO || LEGACY.on) return;
  try {
    liveUnsub = db.collection('settings').doc('live').onSnapshot(d => {
      const t = d.exists ? +d.data().t || 0 : 0, c = store.get('site', null), have = (c && c.d && +c.d.updatedAt) || 0;
      if (t && t > have && !LEGACY.on) refreshSite(true);
    }, () => {});
  } catch (e) {}
}
async function refreshSite(force){
  if (LEGACY.on) return true;
  const c = store.get('site', null);
  if (!force && c && c.d && c.d.v >= SITE_V && Date.now() - c.t < SITE_TTL) return true;       // còn mới: không đọc gì cả
  if (!force && SITE.failT && Date.now() - SITE.failT < 5 * 60e3) return SITE.on;             // vừa lỗi: nghỉ 5 phút rồi thử lại, không dồn dập
  try {
    const d = await db.collection('settings').doc('site').get();
    if (!d.exists || !((d.data().v || 0) >= SITE_V)) return SITE.on;                           // admin chưa xuất bản: dùng cách cũ
    const data = d.data(); store.set('site', { t:Date.now(), d:data }); SITE.on = true;
    if (!LEGACY.on) { applySite(data); listenWeeks(); }
    return true;
  } catch (e) { console.warn('site', e.code || e); SITE.failT = Date.now(); if (!SITE.on) await loadFallback(); return SITE.on; }   // lỗi / hết hạn mức: giữ bản đã lưu, hoặc dùng file dự phòng
}
function goLegacy(){ if (LEGACY.on || DEMO) return; LEGACY.on = true; SITE.on = false; if (liveUnsub) { liveUnsub(); liveUnsub = null; } listenLegacy(); }       // admin: xem thay đổi ngay
async function listenAll(){
  if (DEMO) { loadDemo(); listenWeeks(); return; }
  const c = store.get('site', null);
  if (c && c.d && c.d.v >= SITE_V) { SITE.on = true; applySite(c.d); listenWeeks(); }                          // hiện ngay bản đã lưu
  const got = await refreshSite(false);
  if (!got && !SITE.on) listenLegacy(); else listenLive();
  setInterval(() => { if (!document.hidden && SITE.on && !LEGACY.on) refreshSite(false); }, 60e3);              // tự làm mới (chỉ đọc khi bản lưu đã quá 10 phút)
}
function listenLegacy(){
  snap(db.collection('settings').doc('branding'), doc => {
    if (doc.exists) branding = normBranding(branding, doc.data());
    applyLook(); render(); loadVideos();
  });
  snap(db.collection('settings').doc('content'), doc => { content = { texts:{}, images:{}, faq:null, ...(doc.exists ? doc.data() : {}) }; render(); });
  snap(db.collection('settings').doc('payments'), d => { payments = fixPayUrls(d.exists ? d.data() : {}); });
  snap(db.collection('settings').doc('music'), d => { const x = d.exists ? d.data() : {}; music = { picks:x.picks || [], recent:x.recent || [] }; if (['focus'].includes(route.name)) render(); });
  snap(db.collection('settings').doc('supporters'), d => { const x = d.exists ? d.data() : {}; supporters = { items:x.items || [] }; if (['home', 'donate'].includes(route.name)) render(); });
  snap(db.collection('settings').doc('gear'), d => { const x = d.exists ? d.data() : {}; gear = { items:x.items || [] }; if (route.name === 'gear') render(); });
  snap(db.collection('posts').where('published', '==', true), s => { posts = s.docs.map(d => ({ id:d.id, ...d.data() })).sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt)); render(); }, () => { posts = []; render(); });
  snap(db.collection('products').where('active', '==', true), s => { products = s.docs.map(d => ({ id:d.id, ...d.data() })).sort((a, b) => tsMs(a.createdAt) - tsMs(b.createdAt)); render(); }, () => { products = []; render(); });
  snap(db.collection('reviews').where('approved', '==', true), s => { reviews = s.docs.map(d => ({ id:d.id, ...d.data() })).sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt)); render(); }, () => { reviews = []; });
  listenWeeks();
}
function loadDemo(){
  branding = { ...branding, announcement:{ vi:'Chào mừng đến EP Study Room (chế độ xem thử)', en:'Welcome to EP Study Room (demo preview)' }, contacts:{ live:'https://youtube.com' }, socialLinks:{ YouTube:'https://youtube.com', Instagram:'https://instagram.com' }, ytLiveId:'jfKfPfyJRdk',
    videos:[{ url:'https://youtu.be/jfKfPfyJRdk', title:'lofi hip hop radio — beats to relax/study to' },{ url:'https://youtu.be/5qap5aO4i9A', title:'Study with me — 2 hours Pomodoro 50/10' },{ url:'https://youtu.be/lTRiuFIWV54', title:'Rainy night study session' }] };
  payments = { bankBin:'970436', accountNo:'0123456789', accountName:'NGUYEN VAN A', momoPhone:'0900000000', stripe:'https://stripe.com' };
  music = { picks:[{ title:{ en:'Rain & piano', vi:'Mưa và piano' }, note:{ en:'Soft, no lyrics', vi:'Nhẹ nhàng, không lời' }, url:'https://www.youtube.com/watch?v=jfKfPfyJRdk' }, { title:{ en:'Focus playlist', vi:'Danh sách tập trung' }, note:{}, url:'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ' }], recent:[{ title:{ en:'Late-night study mix', vi:'Mix học khuya' }, note:{ en:'What I have on repeat this week', vi:'Tuần này mình nghe đi nghe lại' }, url:'https://open.spotify.com/playlist/37i9dQZF1DX8Uebhn9wzrS' }] };
  supporters = { items:[{ id:'u1', name:'Linh', show:true, since:'2026-09-01' }, { id:'u2', name:'Daniel', show:true, since:'2026-09-20' }, { id:'u3', name:'Mai', show:true, since:'2026-10-05' }] };
  gear = { items:[{ id:'lamp', name:{ en:'Warm desk lamp', vi:'Đèn bàn ánh vàng' }, note:{ en:'Soft light for late sessions.', vi:'Ánh sáng dịu cho những buổi học khuya.' }, cat:{ en:'Desk', vi:'Bàn học' }, price:'', store:'Amazon', url:'https://example.com/lamp', img:'' }, { id:'headphones', name:{ en:'Noise-cancelling headphones', vi:'Tai nghe chống ồn' }, note:{ en:'Keeps the room quiet.', vi:'Giữ cho căn phòng yên tĩnh.' }, cat:{ en:'Audio', vi:'Âm thanh' }, price:'', store:'Shopee', url:'https://example.com/headphones', img:'' }, { id:'notebook', name:{ en:'Dotted notebook', vi:'Sổ chấm bi' }, note:{ en:'For plans and to-do lists.', vi:'Để ghi kế hoạch và việc cần làm.' }, cat:{ en:'Stationery', vi:'Văn phòng phẩm' }, price:'', store:'', url:'https://example.com/notebook', img:'' }] };
  const now = Date.now(), body = en => `<p>${en}</p><h2>Why Pomodoro?</h2><p>Short, focused sprints with <b>gentle breaks</b> make big tasks feel small.</p><blockquote>Slow progress is still progress.</blockquote><ul><li>25 minutes focus</li><li>5 minutes breathe</li><li>Repeat</li></ul>`;
  posts = [
    { id:'welcome', slug:'welcome', title:{ vi:'Chào mừng đến góc học của mình', en:'Welcome to my study corner' }, excerpt:{ vi:'Vài dòng đầu tiên cho ngôi nhà nhỏ này.', en:'The first few lines for this little home.' }, body:{ vi:body('Xin chào! Đây là bài viết thử nghiệm.'), en:body('Hello! This is a sample post.') }, tags:['life','study'], category:'journal', pinned:true, createdAt:now - 172800000, published:true },
    { id:'pomodoro-tips', slug:'pomodoro-tips', title:{ vi:'3 mẹo học Pomodoro không mệt', en:'3 gentle Pomodoro tips' }, excerpt:{ vi:'Cách chia phiên và nghỉ ngơi hợp lý.', en:'How to pace your sessions and breaks.' }, body:{ vi:body('Mẹo nhỏ cho bạn.'), en:body('A few small tips for you.') }, tags:['study'], category:'study', createdAt:now - 86400000, published:true },
    { id:'night-walk', slug:'night-walk', title:{ vi:'Đi bộ đêm', en:'A walk at night' }, excerpt:{ vi:'Một bài viết ngắn.', en:'A short piece.' }, body:{ vi:body('Bài thử.'), en:body('A sample essay.') }, tags:['essay'], category:'essays', createdAt:now - 43200000, published:true },
    { id:'small-poem', slug:'small-poem', title:{ vi:'Bài thơ nhỏ', en:'A small poem' }, excerpt:{ vi:'Vài dòng.', en:'A few lines.' }, body:{ vi:body('Vài dòng.'), en:body('A few lines.') }, tags:['poem'], category:'poems', createdAt:now - 21600000, published:true }];
  products = [
    { id:'planner', name:{ vi:'Sổ kế hoạch 30 ngày (PDF)', en:'30-Day Study Planner (PDF)' }, desc:{ vi:'Bản in được, phong cách tối giản.', en:'Printable, minimal-style planner.' }, priceVND:79000, priceUSD:3.5, type:'digital', stock:null, images:[], payLinks:{}, active:true },
    { id:'sticker', name:{ vi:'Bộ sticker mascot', en:'Mascot sticker pack' }, desc:{ vi:'20 sticker chống nước.', en:'20 waterproof stickers.' }, priceVND:55000, priceUSD:2.5, type:'physical', stock:12, images:[], payLinks:{}, active:true },
    { id:'tracker', name:{ vi:'Habit tracker (PDF)', en:'Habit tracker (PDF)' }, desc:{ vi:'Theo dõi thói quen 30 ngày.', en:'Track habits for 30 days.' }, priceVND:39000, priceUSD:1.9, type:'digital', stock:null, images:[], payLinks:{}, active:true }];
  reviews = [
    { id:'r1', name:'Linh', rating:5, text:'Phòng học này giúp mình giữ nhịp mỗi tối. Pomodoro 50/10 là chân ái!', createdAt:now - 400000000 },
    { id:'r2', name:'Daniel', rating:5, text:'Love that the schedule converts to my timezone automatically.', createdAt:now - 300000000 },
    { id:'r3', name:'Haruka', rating:4, text:'Calm, focused, and the planner is gorgeous.', createdAt:now - 200000000 }];
  content = { texts:{}, images:{}, faq:null };
  if (DEMO_AS) { state.user = { uid:'demo', email:'demo@epstudyroom.com', displayName:'Demo', emailVerified:true, metadata:{ creationTime:new Date().toUTCString() } }; state.isAdmin = DEMO_AS === 'admin'; if (state.isAdmin) loadAdmin().catch(() => {}); }
  library = [{ id:'planner', name:'30-Day Study Planner (PDF)', orderCode:'EP-DEMO1' }];
  if (DEMO_AS) { const d = []; for (let i = 11; i >= 1; i--) d.push(DT.now().minus({ days:i }).toISODate()); profile = { displayName:'Demo', moon:{ startedAt:Date.now() - 12 * 86400000, days:d, rounds:0 } }; state.companion = DEMO_AS === 'admin'; }
}

/* ---- video mới nhất từ kênh YouTube (RSS qua rss2json) + danh sách thủ công ---- */
let videos = [];
async function loadVideos(){
  const manual = (branding.videos || []).map(v => ({ id:youTubeId(v.url), title:v.title || '' })).filter(v => v.id);
  videos = manual;
  if (branding.ytChannelId && !DEMO) {
    const ck = 'yt_' + branding.ytChannelId; let cached = null;
    try { cached = JSON.parse(sessionStorage.getItem(ck) || 'null'); } catch (e) {}
    if (cached && Date.now() - cached.t < 15 * 60e3) videos = [...cached.v, ...manual];
    else try {
      const r = await fetch('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://www.youtube.com/feeds/videos.xml?channel_id=' + branding.ytChannelId));
      const j = await r.json();
      if (j.status === 'ok') { const v = j.items.slice(0, 12).map(i => ({ id:youTubeId(i.link), title:i.title })).filter(i => i.id); try { sessionStorage.setItem(ck, JSON.stringify({ t:Date.now(), v })); } catch (e) {} videos = [...v, ...manual]; }
    } catch (e) { console.warn('rss', e); }
  }
  if (['home', 'watch', 'focus'].includes(route.name)) render();
}

/* =========================================================
   AUTH + HỒ SƠ NGƯỜI DÙNG
   ========================================================= */
let unsubLib = null;
/* thư viện đã mua: chỉ nghe khi cần (mở trang Tài khoản / Thư viện) để khỏi tốn lượt đọc mỗi lần vào web */
function startLibrary(){
  if (unsubLib || !state.user || DEMO || route.name !== 'account') return;
  unsubLib = db.collection('users').doc(state.user.uid).collection('library').onSnapshot(s => { library = s.docs.map(d => ({ id:d.id, ...d.data() })); if (route.name === 'account') render(true); renderChrome(); }, () => {});
}
/* Admin = đúng email này VÀ đã xác minh email. (Quyền thật được Firestore/Storage rules kiểm tra lại — xem firestore.rules)
   Không có mật khẩu nào nằm trong mã nguồn: bạn tự đặt mật khẩu khi tạo tài khoản. */
const ADMIN_EMAIL = 'epstudyroom.contact@gmail.com';
const isAdminUser = u => !!u && (u.email || '').toLowerCase() === ADMIN_EMAIL && u.emailVerified === true;
const isAdminEmail = u => !!u && (u.email || '').toLowerCase() === ADMIN_EMAIL;
/* Mã hàng tháng của "Người đồng hành": chỉ lưu SHA-256 của mã trong settings/branding (không lưu mã gốc). */
async function sha256(text){
  try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
  catch (e) { let h = 5381; for (const c of text) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return 'f' + h.toString(16); }
}
const normCode = s => String(s || '').trim().toLowerCase();
function unlockValid(){
  const u = store.get('unlock', null) || (profile && profile.unlock) || null, today = DT.now().toISODate();
  if (!u || !branding.focusCodeHash) return false;
  return u.hash === branding.focusCodeHash && (!u.until || u.until >= today) && (!branding.focusCodeUntil || branding.focusCodeUntil >= today);
}
const localTodos = () => store.get('todos', []);
const todosGone = () => store.get('todos_gone', []);                  // id các việc đã xoá (để máy khác / lần tải sau không "sống lại" việc đã xoá)
const localFocus = () => store.get('focus', {});
auth.onAuthStateChanged(async u => {
  if (DEMO) { render(true); return; }
  state.authReady = true;
  if (typeof stopAdminWatch === 'function') stopAdminWatch();
  try { Object.keys(localStorage).filter(k => k.startsWith('ep_plw_') && !(u && k.startsWith('ep_plw_' + u.uid + '_'))).forEach(k => localStorage.removeItem(k)); } catch (e) {}   // bản nhớ planner chỉ giữ cho tài khoản đang đăng nhập
  state.user = u; state.isAdmin = false; state.companion = false; state.compReq = null; state.compCheckedAt = 0; state.profileReady = false; state.profileFailed = false; library = []; profile = {};
  if (unsubLib) { unsubLib(); unsubLib = null; }
  if (u) {
    const profileP = db.collection('users').doc(u.uid).get(); profileP.catch(() => {});      // tải hồ sơ song song với làm mới token, không chờ nhau
    try {
      const d = await profileP; profile = d.exists ? d.data() : {};
      const gone = new Set([...(profile.todosGone || []), ...todosGone()]), todos = (profile.todos || []).filter(x => !gone.has(x.id)); localTodos().forEach(x => { if (!gone.has(x.id) && !todos.find(y => y.id === x.id)) todos.push(x); });
      store.set('todos_gone', [...gone].slice(-300));
      const fl = { ...(profile.focusLog || {}) }; Object.entries(localFocus()).forEach(([k, v]) => { const o = fl[k] || { m:0, s:0 }; fl[k] = { m:Math.max(o.m, v.m), s:Math.max(o.s, v.s) }; });
      store.set('todos', todos); store.set('focus', fl); profile.todos = todos; profile.focusLog = fl;
      if (profile.unlock && !store.get('unlock', null)) store.set('unlock', profile.unlock);
      if (!d.exists || !profile.displayName) { profile.displayName = profile.displayName || u.displayName || (u.email || '').split('@')[0]; }
      state.profileReady = true;                                      // hồ sơ đã tải xong → mới được hiện/ghi Moon Journey
      store.set('moon_' + u.uid, profile.moon || null);               // nhớ để lần sau hiện ngay trong lúc chờ tải
      render(true);
      saveProfileNow();
    } catch (e) { console.warn('profile', e.code); state.profileFailed = true; render(true); }
    try { await u.reload(); await u.getIdToken(true); } catch (e) {}   // làm mới trạng thái xác minh email SAU khi hồ sơ đã hiện, để không làm chậm trang
    state.isAdmin = isAdminUser(u);
    if (state.isAdmin) { goLegacy(); loadAdmin().then(() => { if (typeof ensureSitePublished === 'function') ensureSitePublished(); if (typeof adminWatchRequests === 'function') adminWatchRequests(); }).catch(() => {}); }
    const cc = store.get('comp_' + u.uid, null);                       // tiết kiệm lượt đọc: nhớ kết quả 30 phút
    if (cc && Date.now() - cc.t < 30 * 60e3) state.companion = !!cc.v;
    else { try { const cd = await db.collection('companions').doc(u.uid).get(); state.companion = cd.exists && !(cd.data().until && cd.data().until < DT.now().toISODate()); store.set('comp_' + u.uid, { t:Date.now(), v:state.companion }); } catch (e) {} }
    startLibrary();
    if (state.companion || state.isAdmin) loadPlanner().then(() => plPrefetch()).catch(() => {});     // tải sẵn planner.js lúc rảnh để mở Planner không phải chờ tải file
  }
  render(true);
});
const saveProfileNow = () => {
  if (!state.user || DEMO) return;
  const data = { displayName: profile.displayName || state.user.displayName || '', email: state.user.email, todos: store.get('todos', []), todosGone: todosGone(), focusLog: store.get('focus', {}) };
  const sig = state.user.uid + JSON.stringify(data);
  if (store.get('profsig', '') === sig) return;          // không có gì thay đổi thì không ghi (tiết kiệm lượt ghi)
  db.collection('users').doc(state.user.uid).set({ ...data, updatedAt: TS() }, { merge:true }).then(() => store.set('profsig', sig)).catch(e => console.warn('save profile', e.code));
};
const saveProfileSoon = debounce(saveProfileNow, 1500);
document.addEventListener('visibilitychange', () => { if (document.hidden) saveProfileNow(); });     // rời tab / đóng trang: ghi ngay thay đổi còn chờ (xoá việc rồi tải lại không bị quay lại)
const displayName = () => (profile.displayName || (state.user && (state.user.displayName || (state.user.email || '').split('@')[0])) || '');
function authErr(e){
  const c = e && e.code || '';
  if (c === 'auth/email-already-in-use') return t('err_email_in_use');
  if (c === 'auth/weak-password') return t('err_weak');
  if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-login-credentials'].includes(c)) return t('err_bad_login');
  return t('err_generic') + (e.message || e);
}

/* =========================================================
   RENDER PIPELINE
   ========================================================= */
const PAGES = {};
let pendingRender = false, rq = 0;
const typingInPage = () => { const a = document.activeElement; return !!a && ['INPUT', 'TEXTAREA', 'SELECT'].includes(a.tagName) && $('page').contains(a) || (a && a.isContentEditable); };
function render(force){
  if (!force && (route.name === 'admin')) return;           // trang admin tự vẽ lại khi cần, tránh mất dữ liệu đang nhập
  if (!force && typingInPage()) { pendingRender = true; return; }
  if (rq) return;
  rq = setTimeout(() => { rq = 0; pendingRender = false; doRender(); }, 0);
}
function readRoute(){
  const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  route.name = p[0] || 'home'; route.args = p.slice(1);
  if (route.name === 'about') { route.name = 'home'; route.args = []; try { history.replaceState(null, '', '#/'); } catch (e) {} }   // link cũ /about → Overview
  if (route.name === 'library') { route.name = 'account'; route.args = ['library']; }
}
/* Mục cần đăng nhập: khách chưa đăng nhập vẫn thấy menu và tiêu đề của mọi mục,
   nhưng khi mở các mục "khoá" thì được mời đăng nhập / tạo tài khoản để tham gia (admin chỉnh ở tab Giao diện & Menu). */
const LOCKABLE = ['home', 'schedule', 'watch', 'focus', 'blog', 'club', 'planner', 'shop', 'gear', 'donate', 'about'];
const loginRequired = () => !DEMO && !CONFIG_MISSING && branding.requireLogin !== false;
const lockedPages = () => Array.isArray(branding.lockedPages) ? branding.lockedPages : ['schedule', 'watch', 'focus', 'blog', 'club', 'shop'];
const isLocked = name => loginRequired() && !state.user && lockedPages().includes(name);
/* Hỏi lại Firestore xem người dùng đã là Companion chưa (bỏ qua bản nhớ 30 phút) — gọi khi mở Planner / trang Ủng hộ, để vừa được duyệt là mở khoá ngay */
async function refreshCompanion(force){
  const u = state.user; if (!u || DEMO || (!force && Date.now() - state.compCheckedAt < 45000)) return false;
  state.compCheckedAt = Date.now(); const sig = () => state.companion + '|' + state.companionUntil + '|' + (state.compReq && state.compReq.status), before = sig();
  try {
    const cd = await db.collection('companions').doc(u.uid).get(), d = cd.exists ? cd.data() : null;
    state.companion = !!d && !(d.until && d.until < DT.now().toISODate()); state.companionUntil = d && d.until || '';
    store.set('comp_' + u.uid, { t:Date.now(), v:state.companion });
    if (!state.companion) { try { const r = await db.collection('companion_requests').doc(u.uid).get(); state.compReq = r.exists ? r.data() : null; } catch (e) {} } else state.compReq = null;
  } catch (e) { console.warn('companion check', e.code); }
  return before !== sig();
}
function doRender(){
  if (!state.booted) return;                      // chưa nạp xong các file (pages.js, admin.js) thì chưa vẽ
  readRoute();
  state.locked = isLocked(route.name);
  startLibrary();
  if (state.locked && !state.authReady) { renderChrome(); $('page').innerHTML = '<div class="gate-load"><i></i></div>'; return; }   // đợi biết đã đăng nhập hay chưa
  if (route.name === 'admin' && typeof PAGES.admin !== 'function') {            // admin.js chưa tải: tải rồi vẽ lại
    renderChrome(); $('page').innerHTML = '<div class="gate-load"><i></i></div>';
    loadAdmin().then(() => render(true)).catch(() => { $('page').innerHTML = '<p class="muted" style="padding:24px">Không tải được trang admin. Kiểm tra mạng rồi tải lại trang.</p>'; });
    return;
  }
  if (route.name === 'planner' && typeof PAGES.planner !== 'function') {        // planner.js chỉ tải khi mở #/planner
    renderChrome(); $('page').innerHTML = '<div class="gate-load"><i></i></div>';
    loadPlanner().then(() => render(true)).catch(() => { $('page').innerHTML = '<p class="muted" style="padding:24px">Could not load the planner. Check your connection and reload.</p>'; });
    return;
  }
  const fn = state.locked ? PAGES.locked : (PAGES[route.name] || PAGES.home);
  renderChrome(); fn(); afterRender();
}
function afterRender(){
  if (typeof updateTimerUI === 'function') updateTimerUI();
  updateNext(); tickClock();
  if (state.editMode) applyEditable();
}
const NAV_DEFAULT = [
  { id:'home', icon:'home', path:'/' }, { id:'schedule', icon:'calendar', path:'/schedule' }, { id:'watch', icon:'play', path:'/watch' },
  { id:'focus', icon:'timer', path:'/focus' }, { id:'blog', icon:'pen', path:'/blog' }, { id:'club', icon:'moon', path:'/club' }, { id:'planner', icon:'chart', path:'/planner' }, { id:'shop', icon:'bag', path:'/shop' }, { id:'gear', icon:'tag', path:'/gear' }, { id:'donate', icon:'heart', path:'/donate' }, { id:'about', icon:'info', path:'/about' }
];
function navItems(){
  const saved = branding.nav; if (!Array.isArray(saved) || !saved.length) return NAV_DEFAULT.map(n => ({ ...n, visible:true }));
  const out = [];
  saved.forEach(s => { const d = NAV_DEFAULT.find(n => n.id === s.id); if (d) out.push({ ...d, ...s }); else if (s.url) out.push({ id:s.id, icon:'link', url:s.url, label:s.label, visible:s.visible !== false, custom:true }); });
  NAV_DEFAULT.forEach((d, i) => { if (out.find(o => o.id === d.id)) return; const prev = NAV_DEFAULT.slice(0, i).reverse().find(p => out.find(o => o.id === p.id)), at = prev ? out.findIndex(o => o.id === prev.id) + 1 : out.length; out.splice(at, 0, { ...d, visible:true }); });   // mục mới (VD Planner) nằm cạnh mục đứng trước nó trong thứ tự mặc định, không bị đẩy xuống cuối
  return out;
}
const navLabel = n => (n.label && (n.label[state.lang] || (isNativeContent() ? '' : n.label.en) || n.label.en || n.label.vi)) || t('nav_' + n.id);
function renderChrome(){
  const items = navItems().filter(n => n.visible !== false && n.id !== 'about');   // About đã gộp vào Overview
  const cartN = cartCount();
  const logo = branding.logoUrl ? `<img src="${esc(branding.logoUrl)}" alt="">` : esc((branding.name || 'E').trim().slice(0, 2).toUpperCase());
  $('sidebar').innerHTML = `
    <a class="sb-brand" href="#/"><span class="logo-mark">${logo}</span><span>${esc(branding.name)}</span></a>
    ${items.map(n => n.url
      ? `<a class="sb-item" href="${esc(n.url)}" target="_blank" rel="noopener">${ic('link')}<span>${esc(navLabel(n))}</span></a>`
      : `<a class="sb-item ${route.name === n.id || (n.id === 'home' && route.name === 'home') ? 'active' : ''}" href="#${n.path}" data-act="closeNav">${ic(n.icon)}<span>${esc(navLabel(n))}</span>${n.id === 'shop' && cartN ? `<span class="count">${cartN}</span>` : ''}${isLocked(n.id) ? `<span class="lk" title="${esc(t('lock_title'))}">${ic('lock', 'sm')}</span>` : ''}</a>`).join('')}
    ${state.user ? `<div class="sb-label">${esc(t('nav_account'))}</div>
      <a class="sb-item ${route.name === 'account' && route.args[0] === 'library' ? 'active' : ''}" href="#/account/library" data-act="closeNav">${ic('download')}<span>${esc(t('nav_library'))}</span>${library.length ? `<span class="count">${library.length}</span>` : ''}</a>` : ''}
    ${state.isAdmin ? `<div class="sb-label">Admin</div><a class="sb-item ${route.name === 'admin' ? 'active' : ''}" href="#/admin" data-act="closeNav">${ic('shield')}<span>${esc(t('nav_admin'))}</span>${state.compPending ? `<span class="count">${state.compPending}</span>` : ''}</a>` : ''}
    <div class="sb-foot">${state.user
      ? `<a class="sb-user" href="#/account" data-act="closeNav"><span class="avatar">${esc((displayName() || '?').slice(0, 1).toUpperCase())}</span><div><b>${esc(displayName())}</b><small>${esc(state.isAdmin ? 'Admin' : t('nav_account'))}</small></div></a>`
      : `<a class="btn primary" style="width:100%" href="#/account" data-act="closeNav">${ic('user', 'sm')} ${esc(t('nav_signin'))}</a>`}</div>`;
  const titles = { home:'nav_home', schedule:'nav_schedule', watch:'nav_watch', focus:'nav_focus', blog:'nav_blog', club:'nav_club', planner:'nav_planner', shop:'nav_shop', gear:'nav_gear', donate:'nav_donate', about:'nav_about', account:'nav_account', admin:'nav_admin' };
  $('tb-title').textContent = t(titles[route.name] || 'nav_home');
  const dot = $('cart-dot'); dot.textContent = cartN; dot.classList.toggle('hidden', !cartN);
  $('btn-edit').classList.toggle('hidden', !state.isAdmin);
  $('btn-edit').classList.toggle('on', state.editMode);
  $('tab-title').textContent = branding.name + ' · Study With Me';
  const a = (CONFIG_MISSING && !DEMO) ? 'Firebase chưa được cấu hình — mở file SETUP.md, PHẦN 2, rồi điền js/firebase-config.js' : L(branding.announcement), bar = $('ann-bar'); bar.classList.toggle('hidden', !a); $('ann-text').textContent = a;
}
function renderPrefs(){
  $('sel-lang').innerHTML = LANG_LIST.map(([v, n]) => `<option value="${v}" ${state.lang === v ? 'selected' : ''}>${n}</option>`).join('');
  const zones = [['auto', t('auto')],['Asia/Ho_Chi_Minh','Vietnam (GMT+7)'],['Asia/Kolkata','India (GMT+5:30)'],['Asia/Bangkok','Bangkok'],['Asia/Singapore','Singapore'],['Asia/Tokyo','Tokyo'],['Asia/Seoul','Seoul'],['Asia/Shanghai','Shanghai'],['Australia/Sydney','Sydney'],['Asia/Dubai','Dubai'],['Europe/London','London'],['Europe/Paris','Paris'],['Europe/Berlin','Berlin'],['America/New_York','New York'],['America/Chicago','Chicago'],['America/Los_Angeles','Los Angeles']];
  if (!zones.some(z => z[0] === state.tz)) zones.push([state.tz, state.tz]);
  $('sel-tz').innerHTML = zones.map(([v, n]) => `<option value="${esc(v)}" ${state.tz === v ? 'selected' : ''}>${esc(n)}</option>`).join('');
  $('theme-grid').innerHTML = Object.keys(THEMES).map(k => `<button type="button" class="theme-chip ${effTheme() === k ? 'on' : ''}" data-act="theme" data-th="${k}"><i style="background:${THEMES[k]}"></i>${esc(t('th_' + k))}</button>`).join('');
  document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n));
  document.documentElement.lang = state.lang;
}

/* =========================================================
   LIVE / NEXT (cập nhật mỗi giây, không vẽ lại cả trang)
   ========================================================= */
function fmtDur(ms){
  const s = Math.max(0, Math.floor(ms / 1000)), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
  if (d) return `${d}d ${h}h`; if (h) return `${h}h ${String(m).padStart(2, '0')}m`; return `${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`;
}
function liveState(){
  const now = Date.now(), pool = upcomingPool();
  return { now, live: pool.find(x => now >= x.start.toMillis() && now < x.end.toMillis()), next: pool.filter(x => x.start.toMillis() > now).sort((a, b) => a.start - b.start)[0] };
}
let lastNotified = null, dismissedLive = null, lastMin = '', lastSig = '';
function updateNext(){
  const { live, next, now } = liveState(), url = watchUrl();
  const pill = $('live-pill'); pill.classList.toggle('hidden', !live); if (live) $('live-pill-t').textContent = t('live_now');
  const nc = $('next-card');
  if (nc) {
    nc.dataset.live = live ? '1' : '';
    nc.querySelector('small').textContent = live ? t('live_now') : (next ? t('next_live') : t('no_next'));
    nc.querySelector('b').textContent = live ? `${live.start.setZone(userTZ).toFormat('HH:mm')} – ${live.end.setZone(userTZ).toFormat('HH:mm')}` : (next ? fmtDur(next.start.toMillis() - now) : '—');
  }
  const toastEl = $('live-toast');
  if (live && url && dismissedLive !== live.key && !(route.name === 'watch')) {
    toastEl.classList.add('show'); $('live-toast-text').textContent = live.slot.title || t('live_now'); $('live-toast-link').href = url;
  } else toastEl.classList.remove('show');
  if (live && 'Notification' in window && Notification.permission === 'granted' && lastNotified !== live.key) { new Notification(t('notif_title'), { body:t('notif_body') }); lastNotified = live.key; }
}
function tickClock(){
  const n = DT.now().setZone(userTZ), txt = n.toFormat('hh:mm:ss a');
  document.querySelectorAll('[data-clock]').forEach(e => e.textContent = txt);
  // chỉ vẽ lại trang khi trạng thái buổi live thật sự đổi (để hiệu ứng mưa không bị khởi động lại mỗi phút)
  const mk = n.toFormat('HH:mm');
  if (mk !== lastMin) { lastMin = mk; const ms = Date.now(), sig = n.toISODate() + poolAll().map(x => x.key + (ms >= x.start.toMillis() && ms < x.end.toMillis() ? 'L' : ms >= x.end.toMillis() ? 'P' : '')).join(','); if (sig !== lastSig) { lastSig = sig; if (['home', 'schedule'].includes(route.name)) render(); } }
}
setInterval(() => { tickClock(); updateNext(); }, 1000);

/* =========================================================
   MODAL / POPOVER / NAV
   ========================================================= */
function openModal(html, narrow){ const d = $('dialog'); d.className = 'dialog' + (narrow ? ' narrow' : ''); d.innerHTML = `<button class="btn ghost icon x" data-act="closeModal" aria-label="close">${ic('x')}</button>` + html; $('modal').classList.add('open'); }
function closeModal(){ $('modal').classList.remove('open'); }

/* =========================================================
   CHỈNH SỬA TRỰC TIẾP (admin): chữ + ảnh
   ========================================================= */
function toggleEditMode(){
  if (!state.isAdmin) return;
  state.editMode = !state.editMode; document.body.classList.toggle('editing', state.editMode);
  $('edit-bar-t').textContent = `${t('editing_in')} ${state.lang.toUpperCase()} · ${t('edit_hint')}`;
  if (state.editMode) applyEditable(); else document.querySelectorAll('[data-cms]').forEach(el => el.removeAttribute('contenteditable'));
  render(true);
}
function applyEditable(){
  document.querySelectorAll('[data-cms]').forEach(el => { el.contentEditable = 'plaintext-only'; if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true'; });
}
/* Lưu chữ sửa trực tiếp. Bạn viết ở ngôn ngữ nào cũng được: chữ đó được giữ y nguyên,
   các ngôn ngữ còn lại được tự dịch từ chính câu đó (xem js/translate.js). */
async function saveCmsText(key, val){
  const def = t(key); content.texts = content.texts || {};
  const prev = content.texts[key] || {}, reset = val === '' || val === def;
  if (reset) {                                           // trả về chữ mặc định ở mọi ngôn ngữ
    delete content.texts[key];
    if (DEMO) { toast(t('saved')); return; }
    return db.collection('settings').doc('content').set({ texts:{ [key]: DEL() } }, { merge:true }).then(() => toast(t('saved'))).catch(e => alert('Lỗi lưu: ' + e.message));
  }
  if (prev[state.lang] === val) return;                  // không đổi gì
  content.texts[key] = { ...prev, [state.lang]: val };   // hiện ngay
  if (DEMO) { toast(t('saved')); return; }
  const save = obj => db.collection('settings').doc('content').set({ texts:{ [key]: obj } }, { merge:true });
  try {
    await save({ [state.lang]: val });                   // lưu ngay chữ bạn vừa viết
    toast(t('saved') + ' · ' + t('translating'));
    TR.reset();
    const full = await TR.fill(prev, { [state.lang]: val });
    content.texts[key] = full;
    await save(full);
    toast(TR.failed ? t('translate_partial', { n:TR.failed }) : t('saved') + ' · ' + t('translated_all'));
  } catch (e) { alert('Lỗi lưu: ' + e.message); }
}
function saveCmsImage(key, url){
  content.images = content.images || {}; if (url) content.images[key] = url; else delete content.images[key];
  if (DEMO) { render(true); return; }
  db.collection('settings').doc('content').set({ images:{ [key]: url || DEL() } }, { merge:true }).then(() => { toast(t('saved')); render(true); }).catch(e => alert('Lỗi lưu: ' + e.message));
}
function uploadFile(file, path, onProgress){
  return new Promise((resolve, reject) => {
    if (DEMO) return reject(new Error('Chế độ xem thử không tải được file'));
    if (!storage) return reject(new Error('Firebase Storage chưa bật — xem SETUP.md'));
    const task = storage.ref(path).put(file);
    task.on('state_changed', s => onProgress && onProgress(s.bytesTransferred / s.totalBytes), reject, async () => resolve({ path, url: await task.snapshot.ref.getDownloadURL() }));
  });
}
const safeName = n => String(n).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.\-]+/g, '_');
// hộp thoại chọn ảnh: dán link hoặc tải file lên (Firebase Storage)
function openImagePicker(title, onPick, folder = 'cms'){
  window._pick = onPick; window._pickFolder = folder;
  openModal(`<h2>${esc(title)}</h2>
    <div class="stack mt-s"><div class="field"><label class="label">Dán link ảnh</label><input class="input" id="pick-url" placeholder="https://…"></div>
    <div class="field"><label class="label">…hoặc tải ảnh từ máy</label><input class="input" type="file" id="pick-file" accept="image/*"><div class="hint" id="pick-st"></div></div>
    <div class="row"><button class="btn primary" data-act="pickOk">${esc(t('save'))}</button><button class="btn ghost" data-act="pickClear">Dùng ảnh mặc định</button></div></div>`, true);
}
const FORMS = {}, CHANGES = {};
const ACTIONS = {
  openNav: () => document.body.classList.add('nav-open'),
  closeNav: () => document.body.classList.remove('nav-open'),
  prefs: () => $('prefs').classList.toggle('open'),
  closeModal,
  theme: el => { state.theme = el.dataset.th; store.set('theme', state.theme); applyLook(); renderPrefs(); render(true); },
  editMode: toggleEditMode,
  dismissLive: () => { const { live } = liveState(); dismissedLive = live ? live.key : null; updateNext(); },
  notif: () => {
    if (!('Notification' in window)) return alert(t('notif_unsupported'));
    Notification.requestPermission().then(p => { if (p === 'granted') { $('btn-notif').classList.add('on'); toast('🔔 OK'); } });
  },
  pickOk: async () => {
    const url = $('pick-url').value.trim(), f = $('pick-file').files[0], st = $('pick-st');
    try {
      let out = url;
      if (f) { st.textContent = 'Đang tải lên…'; out = (await uploadFile(f, `public/${window._pickFolder}/${Date.now()}-${safeName(f.name)}`, p => st.textContent = `Đang tải lên… ${Math.round(p * 100)}%`)).url; }
      if (!out) return; closeModal(); window._pick(out);
    } catch (e) { st.textContent = 'Lỗi: ' + e.message; }
  },
  pickClear: () => { closeModal(); window._pick(''); }
};
document.addEventListener('click', e => {
  if (state.editMode && !e.target.closest('[data-cms]')) { const im = e.target.closest('[data-cms-img]'); if (im) { e.preventDefault(); e.stopPropagation(); const k = im.dataset.cmsImg; openImagePicker('Đổi ảnh', url => saveCmsImage(k, url)); return; } }
  const el = e.target.closest('[data-act]');
  if (!e.target.closest('#cart-drawer') && !e.target.closest('#btn-cart') && !(el && ['addCart', 'openCart'].includes(el.dataset.act))) $('cart-drawer').classList.remove('open');
  if (!el) {
    if (!e.target.closest('#prefs') && !e.target.closest('#btn-prefs')) $('prefs').classList.remove('open');
    if (e.target === $('modal')) closeModal(); return;
  }
  const fn = ACTIONS[el.dataset.act]; if (!fn) return;
  if (el.tagName !== 'A' || !el.getAttribute('href')) e.preventDefault();
  fn(el, e);
});
document.addEventListener('submit', e => { const f = e.target.dataset && e.target.dataset.form; if (f && FORMS[f]) { e.preventDefault(); FORMS[f](e.target, e); } });
document.addEventListener('change', e => { const c = e.target.dataset && e.target.dataset.change; if (c && CHANGES[c]) CHANGES[c](e.target, e); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); $('prefs').classList.remove('open'); document.body.classList.remove('nav-open'); const d = $('cart-drawer'); d && d.classList.remove('open'); }
  if (e.key === 'Enter' && state.editMode && e.target.dataset && e.target.dataset.cms && !e.shiftKey) { e.preventDefault(); e.target.blur(); }
});
document.addEventListener('focusin', e => { const el = e.target; if (state.editMode && el.dataset && el.dataset.cms) el.dataset.orig = el.textContent.trim(); });
document.addEventListener('focusout', e => {
  const el = e.target;
  if (state.editMode && el.dataset && el.dataset.cms && el.textContent.trim() !== el.dataset.orig) saveCmsText(el.dataset.cms, el.textContent.trim());   // chỉ lưu khi chữ thật sự đổi
  setTimeout(() => { if (pendingRender && !typingInPage()) render(); }, 50);
});
$('sel-lang').addEventListener('change', e => { state.lang = e.target.value; store.set('lang', state.lang); renderPrefs(); render(true); });
$('sel-tz').addEventListener('change', e => { state.tz = e.target.value; store.set('tz', state.tz); userTZ = state.tz === 'auto' ? DT.local().zoneName : state.tz; render(true); });
$('chk-calm').addEventListener('change', e => { state.calm = e.target.checked; store.set('calm', state.calm); applyLook(); });
window.addEventListener('hashchange', () => { document.body.classList.remove('nav-open'); $('cart-drawer').classList.remove('open'); render(true); window.scrollTo({ top:0 }); });

function boot(){
  state.booted = true;
  applyLook(); renderPrefs(); listenAll(); readRoute(); doRender();
  if ('Notification' in window && Notification.permission === 'granted') $('btn-notif').classList.add('on');
  if (state.user === null && DEMO && DEMO_AS) { render(true); }
}