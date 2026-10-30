'use strict';
const BUILD = '2026-10-25 · bản 42 (web tự sửa khi mở lỗi)';   // hiện ở Admin để biết web đang chạy bản nào
/* =========================================================
   CORE — cấu hình, trạng thái, dữ liệu realtime, đăng nhập, router, sự kiện
   ========================================================= */
/* Tải theo nhu cầu (không chặn lúc mở trang): EmailJS chỉ khi gửi email, admin.js chỉ khi chủ trang đăng nhập / mở #/admin */
const loadScript = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('load ' + src)); document.head.appendChild(s); });
let emailP = null;
const loadEmailJS = () => emailP || (emailP = loadScript('vendor/emailjs-browser-4.4.1.min.js').catch(() => loadScript('https://cdn.jsdelivr.net/npm/@emailjs/browser@4.4.1/dist/email.min.js')).then(() => { emailjs.init("JKo4tonk0gQMwrHFZ"); }).catch(e => { emailP = null; console.warn('EmailJS chưa tải được', e); throw e; }));
let adminP = null;
const ASSET_V = ((document.currentScript && /[?&]v=(\w+)/.exec(document.currentScript.src)) || [])[1] || '92';   // lấy đúng số ?v= của core.js trong index.html, để admin.js / planner.js tải cùng bản (không phải sửa tay ở đây nữa)
const loadAdmin = () => typeof PAGES.admin === 'function' ? Promise.resolve() : (adminP || (adminP = loadScript('admin.js?v=' + ASSET_V).catch(e => { adminP = null; throw e; })));
let moonArtP = null;
const loadMoonArt = () => typeof mjArt === 'function' ? Promise.resolve() : (moonArtP || (moonArtP = Promise.all(['moon-art.js', 'moon-rain.js', 'moon-fx.js'].map(f => loadScript(f + '?v=' + ASSET_V))).catch(e => { moonArtP = null; throw e; })));   // tranh + mưa + hiệu ứng của Hành trình trăng (~150 KB): chỉ tải khi mở #/club
let storageP = null;   // Firebase Storage chỉ cần khi tải file lên / tải sản phẩm về: tải lúc cần, không chặn lúc mở web
const loadStorage = () => storage ? Promise.resolve(storage) : (storageP || (storageP = (window.firebase && firebase.storage ? Promise.resolve() : loadScript('vendor/firebase-storage-compat-10.8.0.js').catch(() => loadScript('https://www.gstatic.com/firebasejs/10.8.0/firebase-storage-compat.js')))
  .then(() => (storage = firebase.storage())).catch(e => { storageP = null; console.warn('Storage chưa sẵn sàng', e); return null; })));
let langsP = null;   // js/i18n-langs.js: bản dịch lớn hi/ja/ko/zh/fr/es, khách tiếng Anh/Việt không cần tải
const loadLangs = () => window.EP_LANGS ? Promise.resolve() : (langsP || (langsP = loadScript('js/i18n-langs.js?v=' + ASSET_V).catch(e => { langsP = null; throw e; })));
const needLangs = l => l !== 'en' && l !== 'vi' && !window.EP_LANGS;
let plannerP = null;
const loadPlanner = () => typeof PAGES.planner === 'function' ? Promise.resolve() : (plannerP || (plannerP = Promise.all([loadScript('planner-i18n.js?v=' + ASSET_V).catch(() => {}), loadScript('planner.js?v=' + ASSET_V)]).catch(e => { plannerP = null; throw e; })));   // planner-i18n.js = bản dịch hi/ja/ko/zh/fr/es; thiếu thì dùng tiếng Anh
let guideP = null;   // guide.js (hướng dẫn từng bước có mèo Moon): chỉ tải khi cần chạy hoặc hỏi khách
const loadGuide = () => typeof PAGES.guide === 'function' ? Promise.resolve() : (guideP || (guideP = loadScript('guide.js?v=' + ASSET_V).catch(e => { guideP = null; throw e; })));
let groupP = null;   // group.js (Nhóm học trực tiếp): chỉ tải khi mở Phòng tập trung hoặc khi khách đã tham gia và đồng hồ đổi trạng thái
const loadGroup = () => window.EPGroup ? Promise.resolve() : (groupP || (groupP = loadScript('group.js?v=' + ASSET_V).catch(e => { groupP = null; throw e; })));
const EMAILJS_SERVICE = 'service_a098n5f', EMAILJS_CHALLENGE_TPL = 'template_lhv0y0n';
// Cấu hình Firebase nằm trong js/firebase-config.js (file duy nhất bạn cần sửa để nối web với Firebase)
const CONFIG_MISSING = !window.FIREBASE_CONFIG || /PASTE_|PLACEHOLDER/.test(JSON.stringify(window.FIREBASE_CONFIG));
firebase.initializeApp(window.FIREBASE_CONFIG || { apiKey:'AIzaSyPLACEHOLDER', projectId:'none', appId:'none' });
const db = firebase.firestore(), auth = firebase.auth();
try { db.settings({ experimentalForceLongPolling:true, merge:true }); } catch (e) { console.warn('firestore settings', e); }   // một số mạng/trình duyệt chặn hoặc làm chậm kết nối streaming nên lần đọc đầu báo 'unavailable' (Planner không tải được): dùng long-polling luôn, ổn định hơn cho web nhỏ này
let storage = null;   // tải bằng loadStorage() khi cần
const TS = () => firebase.firestore.FieldValue.serverTimestamp(), DEL = () => firebase.firestore.FieldValue.delete();
const DT = luxon.DateTime, VN = 'Asia/Ho_Chi_Minh';
const QP = new URLSearchParams(location.search);
const DEMO = QP.has('demo');            // ?demo=1  → dữ liệu mẫu, không cần database
const DEMO_AS = QP.get('as');           // ?demo=1&as=admin | as=user → giả lập đăng nhập để xem giao diện

/* ---------- helpers ---------- */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
// Link lấy từ dữ liệu (admin dán, nội dung lưu trên Firestore): chặn kiểu link chạy mã (javascript:, data:, vbscript:), link thường giữ nguyên
const safeUrl = u => /^(javascript|data|vbscript):/i.test(String(u ?? '').replace(/[\u0000-\u0020\u007f-\u009f]/g, '')) ? '#' : String(u ?? '');
const store = {
  get(k, d){ try { const v = localStorage.getItem('ep_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v){ try { localStorage.setItem('ep_' + k, JSON.stringify(v)); } catch (e) {} }
};
const ic = (n, c = '') => `<svg class="ic ${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const debounce = (fn, ms) => { let h; return (...a) => { clearTimeout(h); h = setTimeout(() => fn(...a), ms); }; };
const tsMs = ts => ts && ts.toMillis ? ts.toMillis() : (typeof ts === 'number' ? ts : Date.now());
const slugify = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const money = (n, cur) => { cur = cur === 'VND' ? 'VND' : 'USD'; return new Intl.NumberFormat(cur === 'VND' ? 'vi-VN' : 'en-US', { style:'currency', currency:cur, maximumFractionDigits: cur === 'VND' ? 0 : 2 }).format(+n || 0); };   // chỉ VND/USD: đơn có mã tiền tệ lạ không làm hỏng trang admin
const readMins = html => Math.max(1, Math.round((html || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 200));
function youTubeId(s){
  s = String(s || '').trim(); if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:v=|youtu\.be\/|embed\/|live\/|shorts\/)([\w-]{11})/); return m ? m[1] : '';
}
function toast(msg, ms){ const el = $('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), ms || 2200); }

/* ---------- state ---------- */
const state = {
  lang: store.get('lang', null) || 'en',      // tiếng Anh là mặc định; khách tự đổi bằng nút ⚙️
  tz: store.get('tz', 'auto'), theme: store.get('theme', null), calm: store.get('calm', false), sky: store.get('sky', 'galaxy'),
  currency: store.get('currency', null), user: null, isAdmin: false, editMode: false
};
if (!['galaxy', 'clouds', 'petals', 'fireflies', 'off'].includes(state.sky)) state.sky = 'galaxy';
if (!['rain', 'pop', 'violet', 'teal'].includes(state.theme)) state.theme = null;   // bỏ giá trị theme cũ của các bản trước
let userTZ = state.tz === 'auto' ? DT.local().zoneName : state.tz;
const tabName = () => branding.name + ' · Study Hub';   // tên tab: cho biết web không chỉ là lịch live
let branding = { name:'Ép Study Room', groupOn:false, themeColor:'#ff3d9a', defaultTheme:'rain', font:'baloo', logoUrl:'', mascotUrl:'', ytChannelId:'', ytLiveId:'', videos:[], contacts:{}, socialLinks:{}, announcement:{}, nav:null, homeSections:{}, focusLimit:120,  
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
/* Người đồng hành lâu năm: mốc 3 / 6 / 12 tháng tính từ ngày bắt đầu đồng hành (since) → viền và trăng nhỏ cạnh tên. Chỉ đọc dữ liệu sẵn có, không ghi gì thêm */
const COMP_TIERS = [[12, 3, '🌕'], [6, 2, '🌔'], [3, 1, '🌓']];
const sinceISO = s => !s ? '' : typeof s === 'string' ? s.slice(0, 10) : (s.toMillis || typeof s === 'number') ? DT.fromMillis(tsMs(s)).toISODate() : '';
const compAgeMonths = s => { const d = s ? DT.fromISO(sinceISO(s)) : null; return d && d.isValid ? Math.max(0, Math.floor(DT.now().diff(d, 'months').months)) : 0; };
const compTier = s => { const m = compAgeMonths(s), x = COMP_TIERS.find(x => m >= x[0]); return x ? { m, tier:x[1], moon:x[2], len:m >= 12 ? t(m < 24 ? 'ct_y1' : 'ct_y', { n:Math.floor(m / 12) }) : t('ct_m', { n:m }) } : null; };
const compBadge = (extra = '') => { const c = compTier(state.companionSince); return `<span class="badge${c ? ' ct' + c.tier : ''}"${c ? ` title="${esc(t('ct_for', { d:c.len }))}"` : ''}>${ic('heart', 'sm')} ${esc(t('comp_badge'))}${c ? ` · ${c.moon} ${esc(c.len)}` : ''}${extra}</span>`; };
/* Huy hiệu nhỏ cạnh tên Người đồng hành (thanh bên, trang tài khoản): trăng nhỏ, viền đổi theo mốc 3 / 6 / 12 tháng. Chỉ đọc dữ liệu sẵn có. */
const nameBadge = () => { if (!state.companion) return ''; const c = compTier(state.companionSince); return `<span class="nbadge${c ? ' ct' + c.tier : ''}" title="${esc(t('comp_badge') + (c ? ' · ' + c.len : ''))}">${ic('moon', 'sm')}</span>`; };
const thanksList = () => (supporters.items || []).filter(x => x && x.show !== false && x.name && (!x.until || x.until >= DT.now().toISODate())).sort((a, b) => String(a.since || '').localeCompare(String(b.since || '')));
/* Tự thêm https:// cho các link thanh toán nếu người dùng quên */
function fixPayUrls(p) { const o = { ...p }; ['stripe', 'paypal', 'kofi', 'companionUrl'].forEach(k => { const v = (o[k] || '').trim(); o[k] = v && !/^(https?:)?\/\//i.test(v) && !/^data:/i.test(v) ? 'https://' + v : v; }); return o; }
state.companion = false; state.companionUntil = ''; state.companionSince = ''; state.compReq = null; state.compCheckedAt = 0;
state.trial = null;                                                  // mã dùng thử: { code, endsAt (ms) } hoặc null — xem loadTrial
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
const SKY_FX = [['galaxy', 'linear-gradient(135deg,#3b2c78,#ff9fc8)'], ['clouds', 'linear-gradient(180deg,#b9c8ff,#fff)'], ['petals', 'radial-gradient(circle at 35% 35%,#fff,#ff9cc6)'], ['fireflies', 'radial-gradient(circle,#ffe58a 0,#ffe58a 25%,#3a3470 70%)'], ['off', 'repeating-linear-gradient(45deg,#d7d3e6,#d7d3e6 3px,#fff 3px,#fff 6px)']];   // ô màu nhỏ trong bảng chọn nền động
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
  root.dataset.sky = state.sky;
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
/* lịch lưu theo tuần giờ VN, còn trang Lịch hiện theo tuần giờ của người xem (thứ Hai 00:00 → Chủ nhật 24:00 ở userTZ) */
const localWeekStart = off => DT.now().setZone(userTZ).plus({ weeks: off }).startOf('week');
const vnOffOf = dt => Math.round(dt.setZone(VN).startOf('week').diff(weekStart(0), 'weeks').weeks);
// các tuần VN cần đọc để vẽ tuần `off` của người xem (lùi thêm 1 ngày để thấy buổi dài kéo sang từ tối Chủ nhật)
const weeksFor = off => { const ls = localWeekStart(off), a = vnOffOf(ls.minus({ days:1 })), b = vnOffOf(ls.plus({ days:7 }).minus({ milliseconds:1 })); const out = []; for (let o = a; o <= b; o++) out.push(o); return out; };
/* Giờ bắt đầu THẬT: admin bấm "Bắt đầu buổi live bây giờ" → settings/onair = { start, sched, at } (admin.js, overlay.html dùng chung).
   Lịch chỉ là giờ dự kiến: buổi có giờ theo lịch = sched được dời sang start (cả buổi dời theo, giống bảng lịch OBS),
   và web CHỈ báo "Đang live" cho buổi đã bấm bắt đầu. Quá giờ lịch mà chưa bấm thì hiện "Sắp bắt đầu", không báo live.
   Mốc lệch lịch quá 12 tiếng (gắn nhầm buổi hôm qua) thì bỏ qua. Người xem nghe tài liệu nhỏ này: 1 lượt đọc mỗi lần admin bấm. */
const ONAIR = { v:store.get('onair', null), unsub:null };
const onairOk = o => !!(o && o.start && o.sched && Math.abs(o.start - o.sched) < 12 * 3600e3);
function getItems(off, days){
  const ws = weekStart(off), out = [], o = onairOk(ONAIR.v) ? ONAIR.v : null;
  (days || []).forEach((raw, i) => {
    const day = normDay(raw), dayVN = ws.plus({ days:i });
    day.slots.forEach((slot, si) => {
      const sched = parseTime(slot.time, dayVN); if (!sched) return; const mins = slotMins(slot);
      const started = !!o && o.sched === sched.toMillis(), start = started ? DT.fromMillis(o.start, { zone:VN }) : sched;
      out.push({ off, di:i, si, day, slot, sched, start, end:start.plus({ minutes:mins }), mins, started, cancelled: day.cancelled || slot.cancelled, key:`${off}-${i}-${si}` });
    });
  });
  return out;
}
// đang live = đã bấm bắt đầu và đang trong buổi; chờ = tới giờ theo lịch rồi mà chưa bấm bắt đầu (tính tới hết giờ dự kiến của buổi)
const isLive = (x, now) => !x.cancelled && x.started && now >= x.start.toMillis() && now < x.end.toMillis();
const isWaiting = (x, now) => !x.cancelled && !x.started && now >= x.sched.toMillis() && now < x.end.toMillis();
function listenOnair(){
  if (ONAIR.unsub || DEMO) return;
  try {
    ONAIR.unsub = db.collection('settings').doc('onair').onSnapshot(d => {
      const f = d.exists ? d.data() : {}, nx = { start:+f.start || 0, sched:+f.sched || 0, at:+f.at || 0 }, cur = ONAIR.v || {};
      if (nx.start === cur.start && nx.sched === cur.sched) return;
      ONAIR.v = nx; store.set('onair', nx); lastSig = ''; render(); try { adminLiveNudge(); } catch (e) {}
    }, e => console.warn('onair', e.code || e));
  } catch (e) {}
}
const poolAll = () => [-1, 0, 1].flatMap(o => weekDocs[o] ? getItems(o, weekDocs[o]) : []);
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
  if (off === 0) { const tm = nowVN.minus({ minutes:20 }).toFormat('HH:mm'); days[todayIdx].slots[1] = mk(tm, 'classic', { title:'Live right now' });
    ONAIR.v = { start:Date.now() - 12 * 60e3, sched:parseTime(tm, nowVN).toMillis(), at:Date.now() }; }   // bản xem thử: buổi này bắt đầu trễ 8 phút
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
  const keep = new Set([-1, 0, 1, weekOffset, ...weeksFor(weekOffset)]);
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
  return { ...b, ...d, name:d.name || 'Ép Study Room', contacts:d.contacts || {}, socialLinks:d.socialLinks || {}, videos:d.videos || [], homeSections:d.homeSections || {}, announcement: typeof a === 'string' ? { vi:a, en:a } : (a || {}), defaultTheme: ['rain','pop','violet','teal'].includes(d.defaultTheme) ? d.defaultTheme : 'rain', font: FONTS[d.font] ? d.font : 'baloo', themeColor: ['#ff7da3','#ff7da3'].includes(d.themeColor) || !d.themeColor ? '#ff3d9a' : d.themeColor }; };
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
  listenOnair();
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
  branding = { ...branding, announcement:{ vi:'Chào mừng đến Ép Study Room (chế độ xem thử)', en:'Welcome to Ép Study Room (demo preview)' }, contacts:{ live:'https://youtube.com' }, socialLinks:{ YouTube:'https://youtube.com', Instagram:'https://instagram.com' }, ytLiveId:'jfKfPfyJRdk',
    videos:[{ url:'https://youtu.be/jfKfPfyJRdk', title:'lofi hip hop radio — beats to relax/study to' },{ url:'https://youtu.be/5qap5aO4i9A', title:'Study with me — 2 hours Pomodoro 50/10' },{ url:'https://youtu.be/lTRiuFIWV54', title:'Rainy night study session' }] };
  payments = { bankBin:'970436', accountNo:'0123456789', accountName:'NGUYEN VAN A', stripe:'https://stripe.com' };
  music = { picks:[{ title:{ en:'Rain & piano', vi:'Mưa và piano' }, note:{ en:'Soft, no lyrics', vi:'Nhẹ nhàng, không lời' }, url:'https://www.youtube.com/watch?v=jfKfPfyJRdk' }, { title:{ en:'Focus playlist', vi:'Danh sách tập trung' }, note:{}, url:'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ' }], recent:[{ title:{ en:'Late-night study mix', vi:'Mix học khuya' }, note:{ en:'What I have on repeat this week', vi:'Tuần này mình nghe đi nghe lại' }, url:'https://open.spotify.com/playlist/37i9dQZF1DX8Uebhn9wzrS' }] };
  supporters = { items:[{ id:'u1', name:'Linh', show:true, since:'2025-09-01' }, { id:'u2', name:'Daniel', show:true, since:'2026-03-20' }, { id:'u3', name:'Mai', show:true, since:'2026-07-05' }, { id:'u4', name:'An', show:true, since:'2026-10-05' }] };
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
  if (DEMO_AS) { const d = []; for (let i = Math.min(800, Math.max(0, +QP.get('days') || 11)); i >= 1; i--) d.push(DT.now().minus({ days:i }).toISODate()); profile = { displayName:'Demo', moon:{ startedAt:Date.now() - 12 * 86400000, days:d, rounds:0 } }; state.companion = DEMO_AS === 'admin'; }
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
/* Mã dùng thử (trial_redemptions/<uid>): quyền thật do firestore.rules kiểm (Planner); ở đây chỉ để hiện giao diện cho đúng.
   Hết hạn khi: admin đặt hạn riêng (endsAt), hoặc theo mã: startedAt + số ngày của mã; mã bị tắt/xoá thì hết quyền ngay. */
const trialActive = () => !!state.trial && state.trial.endsAt > Date.now();
async function loadTrial(u, force){
  const k = 'trial_' + u.uid, c = store.get(k, null);
  if (!force && c && Date.now() - c.t < 30 * 60e3) { state.trial = c.v; return; }     // tiết kiệm lượt đọc: nhớ kết quả 30 phút
  let v = null;
  try {
    const r = await db.collection('trial_redemptions').doc(u.uid).get();
    if (r.exists) {
      const d = r.data(); v = { code:d.code, endsAt:0 };
      if (d.endsAt) v.endsAt = tsMs(d.endsAt);
      else { const cd = await db.collection('trial_codes').doc(d.code).get().catch(() => null); if (cd && cd.exists && cd.data().active === true) v.endsAt = tsMs(d.startedAt) + (+cd.data().days || 0) * 864e5; }
    }
  } catch (e) { console.warn('trial check', e.code); return; }
  if (state.user !== u) return;
  state.trial = v; store.set(k, { t:Date.now(), v });
}
const localTodos = () => store.get('todos', []);
const todosGone = () => store.get('todos_gone', []);                  // id các việc đã xoá (để máy khác / lần tải sau không "sống lại" việc đã xoá)
/* Sổ tập trung theo ngày { 'yyyy-mm-dd': { m:phút, s:phiên } }. Một ngày không thể quá 1440 phút, và mỗi phiên ít nhất 1 phút:
   ngày nào vượt là số liệu hỏng (lỗi cộng lặp cũ) → đưa về 0 để không hiện số vô lý và không đồng bộ tiếp lên tài khoản. */
const cleanFocus = fl => { const o = {}; Object.entries(fl && typeof fl === 'object' ? fl : {}).forEach(([k, v]) => { const m = Math.round(+(v && v.m) || 0), s = Math.round(+(v && v.s) || 0); o[k] = (m >= 0 && s >= 0 && m <= 1440 && s <= m) ? { m, s } : { m:0, s:0 }; }); return o; };
const localFocus = () => cleanFocus(store.get('focus', {}));
auth.onAuthStateChanged(async u => {
  if (DEMO) { render(true); return; }
  state.authReady = true;
  if (typeof stopAdminWatch === 'function') stopAdminWatch();
  try { Object.keys(localStorage).filter(k => k.startsWith('ep_plw_') && !(u && k.startsWith('ep_plw_' + u.uid + '_'))).forEach(k => localStorage.removeItem(k)); } catch (e) {}   // bản nhớ planner chỉ giữ cho tài khoản đang đăng nhập
  state.user = u; state.isAdmin = false; state.companion = false; state.companionUntil = ''; state.companionSince = ''; state.trial = null; state.compReq = null; state.compCheckedAt = 0; state.moonReward = undefined; state.profileReady = false; state.profileFailed = false; library = []; profile = {};
  if (unsubLib) { unsubLib(); unsubLib = null; }
  if (u) {
    const profileP = db.collection('users').doc(u.uid).get(); profileP.catch(() => {});      // tải hồ sơ song song với làm mới token, không chờ nhau
    try {
      const d = await profileP; profile = d.exists ? d.data() : {};
      const gone = new Set([...(profile.todosGone || []), ...todosGone()]), todos = (profile.todos || []).filter(x => !gone.has(x.id)); localTodos().forEach(x => { if (!gone.has(x.id) && !todos.find(y => y.id === x.id)) todos.push(x); });
      store.set('todos_gone', [...gone].slice(-300));
      const fl = cleanFocus(profile.focusLog); Object.entries(localFocus()).forEach(([k, v]) => { const o = fl[k] || { m:0, s:0 }; fl[k] = { m:Math.max(o.m, v.m), s:Math.max(o.s, v.s) }; });
      store.set('todos', todos); store.set('focus', fl); profile.todos = todos; profile.focusLog = fl;
      if (!d.exists || !profile.displayName) { profile.displayName = profile.displayName || u.displayName || (u.email || '').split('@')[0]; }
      state.profileReady = true;                                      // hồ sơ đã tải xong → mới được hiện/ghi Moon Journey
      if (typeof grpPing === 'function') grpPing();                   // đã tham gia nhóm học và đồng hồ đang chạy → báo lại trạng thái
      store.set('moon_' + u.uid, profile.moon || null);               // nhớ để lần sau hiện ngay trong lúc chờ tải
      render(true);
      saveProfileNow();
    } catch (e) { console.warn('profile', e.code); state.profileFailed = true; render(true); }
    try { await u.reload(); await u.getIdToken(true); } catch (e) {}   // làm mới trạng thái xác minh email SAU khi hồ sơ đã hiện, để không làm chậm trang
    state.isAdmin = isAdminUser(u);
    if (state.isAdmin) { goLegacy(); loadAdmin().then(() => { if (typeof ensureSitePublished === 'function') ensureSitePublished(); if (typeof adminWatchRequests === 'function') adminWatchRequests(); }).catch(() => {}); }
    const cc = store.get('comp_' + u.uid, null);                       // tiết kiệm lượt đọc: nhớ kết quả 30 phút
    if (cc && Date.now() - cc.t < 30 * 60e3) { state.companion = !!cc.v; state.companionUntil = cc.u || ''; state.companionSince = cc.s || ''; }
    else { try { const cd = await db.collection('companions').doc(u.uid).get(); state.companion = cd.exists && !(cd.data().until && cd.data().until < DT.now().toISODate()); state.companionUntil = cd.exists && cd.data().until || ''; state.companionSince = cd.exists && sinceISO(cd.data().since) || ''; store.set('comp_' + u.uid, { t:Date.now(), v:state.companion, u:state.companionUntil, s:state.companionSince }); } catch (e) {} }
    await loadTrial(u);
    if (typeof grpPing === 'function') grpPing();                   // đã biết là Người đồng hành: báo lại trạng thái nhóm học (lần gọi trước còn chạy trước khi biết quyền)
    startLibrary();
    if (state.companion || state.isAdmin || trialActive()) loadPlanner().then(() => plPrefetch()).catch(() => {});     // tải sẵn planner.js lúc rảnh để mở Planner không phải chờ tải file
  }
  render(true);
});
const saveProfileNow = () => {
  if (!state.user || DEMO) return;
  const data = { displayName: profile.displayName || state.user.displayName || '', email: state.user.email, todos: store.get('todos', []), todosGone: todosGone(), focusLog: localFocus() };
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
  rq = setTimeout(() => { rq = 0; pendingRender = false; try { doRender(); } catch (e) { pageCrash(e); } }, 0);
}
/* Một trang bị lỗi khi vẽ (sau khi web đã chạy): hiện lời nhắn thân thiện ngay trong khung trang thay vì để trắng.
   Thanh menu, giỏ hàng, bộ hẹn giờ… vẫn chạy; chữ lấy từ bảng 8 ngôn ngữ EP_TXT trong index.html. Không xoá dữ liệu gì. */
function pageCrash(e){
  console.error('[EP] render ' + location.hash, e);
  const m = (window.EP_TXT && window.EP_TXT()) || [], home = route.name === 'home';
  try { renderChrome(); } catch (er) {}
  $('page').innerHTML = `<div class="empty"><div class="ico">${ic('moon')}</div><h3>${esc(m[4] || 'This page hit a snag')}</h3><p style="max-width:420px;margin:0 auto 16px">${esc(m[5] || 'Something went wrong while showing this page.')}</p>
    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button type="button" class="btn primary" data-act="pageReload">${ic('reset')} ${esc(m[2] || 'Reload')}</button>${home ? '' : `<a class="btn secondary" href="#/">${ic('home')} ${esc(m[6] || 'Back to Overview')}</a>`}</div>
    <p class="muted" style="max-width:420px;margin:16px auto 0;font-size:.8rem">${esc(m[3] || '')}</p></div>`;
}
function readRoute(){
  const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(x => { try { return decodeURIComponent(x); } catch (e) { return x; } });   // địa chỉ có % lạ không làm lỗi trang
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
  state.compCheckedAt = Date.now(); const sig = () => state.companion + '|' + state.companionUntil + '|' + state.companionSince + '|' + (state.compReq && state.compReq.status) + '|' + JSON.stringify(state.trial), before = sig();
  await loadTrial(u, true);
  try {
    const cd = await db.collection('companions').doc(u.uid).get(), d = cd.exists ? cd.data() : null;
    state.companion = !!d && !(d.until && d.until < DT.now().toISODate()); state.companionUntil = d && d.until || ''; state.companionSince = d && sinceISO(d.since) || '';
    store.set('comp_' + u.uid, { t:Date.now(), v:state.companion, u:state.companionUntil, s:state.companionSince });
    try { const r = await db.collection('companion_requests').doc(u.uid).get(); state.compReq = r.exists ? r.data() : null; } catch (e) {}     // cả Companion còn hạn: để biết đã gửi yêu cầu gia hạn chưa
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
  if (route.name === 'club' && !state.locked && typeof mjArt !== 'function') {   // moon-art.js chưa tải: tải rồi vẽ lại
    renderChrome(); $('page').innerHTML = '<div class="gate-load"><i></i></div>';
    loadMoonArt().then(() => render(true)).catch(pageCrash);
    return;
  }
  if (route.name === 'guide' && typeof PAGES.guide !== 'function') {            // #/guide (mục Hướng dẫn trên menu): tải guide.js rồi chạy lại hướng dẫn
    renderChrome(); $('page').innerHTML = '<div class="gate-load"><i></i></div>';
    loadGuide().then(() => render(true)).catch(pageCrash);
    return;
  }
  if (route.name === 'planner' && typeof PAGES.planner !== 'function') {        // planner.js chỉ tải khi mở #/planner
    renderChrome(); $('page').innerHTML = '<div class="gate-load"><i></i></div>';
    loadPlanner().then(() => render(true)).catch(pageCrash);   // không tải được planner.js (mạng chập chờn, bị chặn…)
    return;
  }
  const fn = state.locked ? PAGES.locked : (PAGES[route.name] || PAGES.home);
  renderChrome(); fn(); afterRender(); pageIn();
}
// Trang mới (đổi địa chỉ) thì nội dung hiện dần và nhích lên nhẹ; vẽ lại cùng trang (dữ liệu mới về) thì không chạy lại hiệu ứng
let pageKey = null;
function pageIn(){
  const k = route.name + '/' + route.args.join('/'), pg = $('page'); if (k === pageKey) return;
  const first = pageKey === null; pageKey = k; if (first && !$('ep-splash')) return;
  pg.classList.remove('page-in'); void pg.offsetWidth; pg.classList.add('page-in');
  clearTimeout(pageIn.t); pageIn.t = setTimeout(() => pg.classList.remove('page-in'), 700);
}
// Tắt màn chờ (logo + tên) trong index.html: mờ dần rồi gỡ hẳn
function splashOut(){
  const sp = $('ep-splash'); if (!sp) return;
  sp.classList.add('out'); setTimeout(() => sp.remove(), 650);
}
function afterRender(){
  if (typeof updateTimerUI === 'function') updateTimerUI();
  updateNext(); tickClock();
  if (typeof sofaSync === 'function') sofaSync();
  if (state.editMode) applyEditable();
}
const NAV_DEFAULT = [
  { id:'home', icon:'home', path:'/' }, { id:'guide', icon:'info', path:'/guide' }, { id:'schedule', icon:'calendar', path:'/schedule' }, { id:'watch', icon:'play', path:'/watch' },
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
  const logo = `<img src="${esc(branding.logoUrl || 'icons/logo.svg')}" alt="">`;
  $('sidebar').innerHTML = `
    <a class="sb-brand" href="#/"><span class="logo-mark${branding.logoUrl ? '' : ' is-moon'}">${logo}</span><span>${esc(branding.name)}</span></a>
    ${items.map(n => n.url
      ? `<a class="sb-item" href="${esc(safeUrl(n.url))}" target="_blank" rel="noopener">${ic('link')}<span>${esc(navLabel(n))}</span></a>`
      : `<a class="sb-item ${route.name === n.id || (n.id === 'home' && route.name === 'home') ? 'active' : ''}" href="#${n.path}" data-act="closeNav">${ic(n.icon)}<span>${esc(navLabel(n))}</span>${n.id === 'shop' && cartN ? `<span class="count">${cartN}</span>` : ''}${isLocked(n.id) ? `<span class="lk" title="${esc(t('lock_title'))}">${ic('lock', 'sm')}</span>` : ''}</a>`).join('')}
    ${state.user ? `<div class="sb-label">${esc(t('nav_account'))}</div>
      <a class="sb-item ${route.name === 'account' && route.args[0] === 'library' ? 'active' : ''}" href="#/account/library" data-act="closeNav">${ic('download')}<span>${esc(t('nav_library'))}</span>${library.length ? `<span class="count">${library.length}</span>` : ''}</a>` : ''}
    ${pwaStandalone() ? '' : `<button type="button" class="sb-item sb-install" data-act="pwaInstall">${ic('download')}<span>${esc(t('pwa_install'))}</span></button>`}
    ${state.isAdmin ? `<div class="sb-label">Admin</div><a class="sb-item ${route.name === 'admin' ? 'active' : ''}" href="#/admin" data-act="closeNav">${ic('shield')}<span>${esc(t('nav_admin'))}</span>${state.compPending ? `<span class="count">${state.compPending}</span>` : ''}</a>` : ''}
    <div class="sb-foot">${state.user
      ? `<a class="sb-user" href="#/account" data-act="closeNav"><span class="avatar">${esc((displayName() || '?').slice(0, 1).toUpperCase())}</span><div><span class="sb-name"><b>${esc(displayName())}</b>${nameBadge()}</span><small>${esc(state.isAdmin ? 'Admin' : t('nav_account'))}</small></div></a>`
      : `<a class="btn primary" style="width:100%" href="#/account" data-act="closeNav">${ic('user', 'sm')} ${esc(t('nav_signin'))}</a>`}</div>`;
  const titles = { home:'nav_home', schedule:'nav_schedule', watch:'nav_watch', focus:'nav_focus', blog:'nav_blog', club:'nav_club', planner:'nav_planner', shop:'nav_shop', gear:'nav_gear', donate:'nav_donate', about:'nav_about', account:'nav_account', admin:'nav_admin' };
  $('tb-title').textContent = t(titles[route.name] || 'nav_home');
  const dot = $('cart-dot'); dot.textContent = cartN; dot.classList.toggle('hidden', !cartN);
  $('btn-edit').classList.toggle('hidden', !state.isAdmin);
  $('btn-edit').classList.toggle('on', state.editMode);
  $('tab-title').textContent = tabName();
  const a = (CONFIG_MISSING && !DEMO) ? 'Firebase chưa được cấu hình — mở file SETUP.md, PHẦN 2, rồi điền js/firebase-config.js' : L(branding.announcement), bar = $('ann-bar'); bar.classList.toggle('hidden', !a); $('ann-text').textContent = a;
}
function renderPrefs(){
  $('sel-lang').innerHTML = LANG_LIST.map(([v, n]) => `<option value="${v}" ${state.lang === v ? 'selected' : ''}>${n}</option>`).join('');
  const zones = [['auto', t('auto')],['Asia/Ho_Chi_Minh','Vietnam (GMT+7)'],['Asia/Kolkata','India (GMT+5:30)'],['Asia/Bangkok','Bangkok'],['Asia/Singapore','Singapore'],['Asia/Tokyo','Tokyo'],['Asia/Seoul','Seoul'],['Asia/Shanghai','Shanghai'],['Australia/Sydney','Sydney'],['Asia/Dubai','Dubai'],['Europe/London','London'],['Europe/Paris','Paris'],['Europe/Berlin','Berlin'],['America/New_York','New York'],['America/Chicago','Chicago'],['America/Los_Angeles','Los Angeles']];
  if (!zones.some(z => z[0] === state.tz)) zones.push([state.tz, state.tz]);
  $('sel-tz').innerHTML = zones.map(([v, n]) => `<option value="${esc(v)}" ${state.tz === v ? 'selected' : ''}>${esc(n)}</option>`).join('');
  $('theme-grid').innerHTML = Object.keys(THEMES).map(k => `<button type="button" class="theme-chip ${effTheme() === k ? 'on' : ''}" data-act="theme" data-th="${k}"><i style="background:${THEMES[k]}"></i>${esc(t('th_' + k))}</button>`).join('');
  $('fx-grid').innerHTML = SKY_FX.map(([k, bg]) => `<button type="button" class="theme-chip ${state.sky === k ? 'on' : ''}" data-act="sky" data-sky="${k}"><i style="background:${bg}"></i>${esc(t('fx_' + k))}</button>`).join('');
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
  return { now, live: pool.find(x => isLive(x, now)), waiting: pool.find(x => isWaiting(x, now)), next: pool.filter(x => x.start.toMillis() > now).sort((a, b) => a.start - b.start)[0] };
}
let dismissedLive = null, lastMin = '', lastSig = '';
function updateNext(){
  const { live, waiting, next, now } = liveState(), url = watchUrl();
  const pill = $('live-pill'); pill.classList.toggle('hidden', !live); if (live) $('live-pill-t').textContent = t('live_now');
  const nc = $('next-card');
  if (nc) {
    nc.dataset.live = live ? '1' : '';
    nc.querySelector('small').textContent = live ? t('live_now') : waiting ? t('live_waiting') : (next ? t('next_live') : t('no_next'));
    nc.querySelector('b').textContent = live ? `${live.start.setZone(userTZ).toFormat('HH:mm')} – ${live.end.setZone(userTZ).toFormat('HH:mm')}` : waiting ? t('live_waiting_b', { t:waiting.sched.setZone(userTZ).toFormat('HH:mm') }) : (next ? fmtDur(next.start.toMillis() - now) : '—');
  }
  const toastEl = $('live-toast');
  if (live && url && dismissedLive !== live.key && !(route.name === 'watch')) {
    toastEl.classList.add('show'); $('live-toast-text').textContent = live.slot.title || t('live_now'); $('live-toast-link').href = url;
  } else toastEl.classList.remove('show');
  lrTick(live, next, now);
  const lrN = $('lr-next'); if (lrN) lrN.textContent = lrNextText(live, next, now, waiting);
}

/* =========================================================
   NHẮC GIỜ LIVE (nút chuông trên thanh trên cùng) — bảng gọn, chỉ giữ:
   - Thông báo đẩy (kể cả khi đã đóng web), xem phần THÔNG BÁO ĐẨY bên dưới.
   - Nhắc trong trang khi web còn mở (tab nền cũng được): chọn nhắc trước mấy phút, nhắc tất cả buổi hay chỉ buổi đã chọn.
     Luôn nhắc cả lúc live bắt đầu, luôn kêu chuông kèm thông báo (âm chuông/âm lượng dùng mặc định hoặc cài đặt cũ đã lưu).
   ========================================================= */
const NOTIF_OK = typeof Notification !== 'undefined';
const LR_PRESETS = [5, 10, 15, 30, 60];
const LR = (() => {
  const oldLead = +store.get('lr_lead', 10) || 0;      // đọc cài đặt của bản trước
  const leads = store.get('lr_leads', oldLead ? [oldLead] : []);
  return { on:store.get('lr_on', NOTIF_OK && Notification.permission === 'granted'), leads:Array.isArray(leads) ? leads.filter(n => n > 0 && n <= 720).slice(0, 6) : [10],
    atStart:true, style:'both',      // bảng chuông đã bỏ tuỳ chọn kiểu nhắc / tắt nhắc lúc bắt đầu, nên luôn dùng mặc định
    open:false, mode:store.get('lr_mode', 'all') === 'pick' ? 'pick' : 'all', picked:store.get('lr_picked', {}) || {} };
})();
let lrSent = store.get('lr_sent', {}), swReg = null, lrTitleBak = '';
const lrSave = () => { store.set('lr_on', LR.on); store.set('lr_leads', LR.leads); store.set('lr_mode', LR.mode); store.set('lr_picked', LR.picked); };
const lrSound = () => LR.style !== 'notif', lrPop = () => LR.style !== 'sound';
const lrWanted = x => LR.mode === 'all' || !!LR.picked[x.sched.toMillis()];      // đánh dấu theo giờ lịch: dời giờ bắt đầu vẫn giữ lựa chọn
const lrSoon = now => upcomingPool().filter(x => x.end.toMillis() > now).sort((a, b) => a.start - b.start);
const audioLocked = () => typeof actx === 'undefined' || !actx || actx.state !== 'running';
/* ---------- ÂM THÔNG BÁO: mỗi loại thông báo một tiếng riêng ----------
   Tất cả tự tạo bằng Web Audio (không tải file âm thanh). Khách bật / tắt, chọn tiếng, nghe thử và chỉnh âm lượng trong bảng chuông 🔔.
   Chỉ kêu khi web đang mở và trình duyệt đã cho phát tiếng; thông báo hiện khi đã đóng web dùng âm của máy (web không đổi được). */
const SND_CATS = [['live_soon', 'bell'], ['live_now', 'fanfare'], ['planner', 'soft'], ['goal', 'twinkle'], ['moon', 'harp'], ['focus', 'marimba'], ['break', 'pop'], ['admin', 'gong']];
const SND_TONES = ['bell', 'soft', 'alarm', 'drop', 'harp', 'marimba', 'pop', 'fanfare', 'gong', 'twinkle'];
const SND = (() => {
  const s = store.get('snd', null) || {}, cats = s.cats || {};
  const vol = +s.vol || +store.get('lr_vol', .8) || .8;                // đọc cài đặt cũ (âm lượng chuông live, chuông Planner)
  const o = { on:s.on !== false, vol:Math.min(1, Math.max(.1, vol)), cats:{}, open:false };
  SND_CATS.forEach(([id, d]) => {
    const c = cats[id] || {}, old = id === 'live_soon' ? store.get('lr_tone') : '';
    o.cats[id] = { on:c.on !== undefined ? c.on !== false : !(id === 'planner' && store.get('pl_chime', true) === false), tone:SND_TONES.includes(c.tone) ? c.tone : (SND_TONES.includes(old) ? old : d) };
  });
  return o;
})();
const sndSave = () => store.set('snd', { on:SND.on, vol:SND.vol, cats:SND.cats });
function sndNotes(a, tone){
  const v = SND.vol, t0 = a.currentTime + .02;
  const n = (f, d, peak, len, type, f2) => { const o = a.createOscillator(), g = a.createGain(), at = t0 + d; o.type = type || 'sine'; o.frequency.setValueAtTime(f, at); if (f2) o.frequency.exponentialRampToValueAtTime(f2, at + len); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(peak * v, at + .01); g.gain.exponentialRampToValueAtTime(.0008, at + len); o.connect(g); g.connect(a.destination); o.start(at); o.stop(at + len + .05); };
  const rich = (f, d, p, len, k) => [[f, p], [f * 1.5, p * .4], [f * 2, p * .3]].forEach(([x, y]) => n(x, d, y, len, k));
  switch (tone) {
    case 'soft': [0, .55].forEach(d => [[880, .22], [1318, .09], [1760, .04]].forEach(([f, p]) => n(f, d, p, 1.1))); break;
    case 'alarm': for (let r = 0; r < 3; r++) [0, .16, .32].forEach(d => n(988, r * .8 + d, .16, .12, 'triangle')); break;
    case 'drop': n(1300, 0, .3, .28, 'sine', 420); n(1700, .32, .22, .32, 'sine', 560); break;
    case 'harp': [523, 659, 784, 1047].forEach((f, i) => rich(f, i * .14, .18, .9)); break;
    case 'marimba': [659, 784, 988].forEach((f, i) => { n(f, i * .2, .3, .5, 'triangle'); n(f * 4, i * .2, .05, .12); }); break;
    case 'pop': n(500, 0, .32, .13, 'sine', 1000); n(750, .17, .26, .16, 'sine', 1300); break;
    case 'fanfare': [523, 659, 784].forEach((f, i) => n(f, i * .13, .2, .3, 'triangle')); rich(1047, .39, .2, 1.2, 'triangle'); break;
    case 'gong': n(196, 0, .38, 2.2); n(294, 0, .16, 1.8); n(392, 0, .09, 1.4); break;
    case 'twinkle': [1318, 1568, 2093, 1568, 2093, 2637].forEach((f, i) => n(f, i * .1, .1, .5)); break;
    default: [0, .5, 1].forEach((d, i) => [[i === 2 ? 1046 : 784, .28], [i === 2 ? 2092 : 1568, .08], [i === 2 ? 3138 : 2352, .03]].forEach(([f, p]) => n(f, d, p, 1.4)));   // bell
  }
}
function soundPlay(cat, o){                                          // trả về true nếu tiếng kêu được ngay (trình duyệt đã cho phát tiếng); force = nghe thử do khách bấm
  o = o || {}; const c = SND.cats[cat]; if (!c || (!o.force && !(SND.on && c.on)) || typeof audio !== 'function') return false;
  const a = audio(); if (!a) return false; const tone = o.tone || c.tone;
  if (a.state === 'running') { sndNotes(a, tone); return true; }
  if (o.force && a.resume) { a.resume().then(() => sndNotes(a, tone)).catch(() => {}); return true; }
  return false;                                                      // còn khoá tiếng (khách chưa chạm vào trang): không xếp chuông, để thông báo của máy kêu thay
}
function sndHTML(){
  const show = id => id === 'planner' || id === 'goal' ? plCan() : id === 'moon' ? !!state.user : id === 'admin' ? !!state.isAdmin : true;
  const rows = SND_CATS.filter(([id]) => show(id)).map(([id]) => { const c = SND.cats[id];
    return `<div class="snd-row ${c.on ? '' : 'off'}"><label class="snd-on"><input type="checkbox" data-change="sndCat" data-c="${id}" ${c.on ? 'checked' : ''}><span>${esc(t('snd_c_' + id))}</span></label>
      <select class="input snd-sel" data-change="sndTone" data-c="${id}" aria-label="${esc(t('snd_c_' + id))}">${SND_TONES.map(k => `<option value="${k}" ${c.tone === k ? 'selected' : ''}>${esc(t('snd_t_' + k))}</option>`).join('')}</select>
      <button type="button" class="lr-chip" data-act="sndTest" data-c="${id}" aria-label="${esc(t('snd_play'))}">▶</button></div>`; }).join('');
  return `<details class="lr-help snd" ${SND.open ? 'open' : ''}><summary data-act="sndOpen">${esc(t('snd_title'))}</summary>
    <div class="switch"><span>${esc(t('snd_master'))}</span><input type="checkbox" data-change="sndMaster" ${SND.on ? 'checked' : ''}></div>
    <div class="${SND.on ? '' : 'lr-off'}"><label class="label">${esc(t('lr_vol'))}</label><input type="range" class="snd-vol" min="10" max="100" step="5" value="${Math.round(SND.vol * 100)}" data-change="sndVol" aria-label="${esc(t('lr_vol'))}">
    <div class="snd-list">${rows}</div></div></details>`;
}
/* ---------- Dòng nhắc một lần dưới nút chuông ----------
   Khách mới vào web (chưa mở bảng chuông, chưa bật nhắc) thấy một dòng ngắn trỏ vào nút 🔔; bấm chuông hoặc bấm × là không hiện lại. */
function bellHintHide(mark){ const h = $('bell-hint'); if (h) h.remove(); if (mark) store.set('bell_hint', 1); }
function bellHintShow(){
  const b = $('btn-notif'); if (!b || !b.offsetParent || $('bell-hint') || store.get('bell_hint', 0) || store.get('tour', null) === null || LR.on || $('live-rem').classList.contains('open')) return;
  const r = b.getBoundingClientRect(), h = document.createElement('div');
  h.id = 'bell-hint'; h.setAttribute('role', 'status');
  h.style.cssText = `top:${Math.round(r.bottom + 10)}px;right:${Math.max(8, Math.round(innerWidth - r.right))}px;--ax:${Math.round(r.width / 2)}px`;
  h.innerHTML = `<span>${esc(t('bell_hint'))}</span><button type="button" data-act="bellHintX" aria-label="${esc(t('snd_close'))}">×</button>`;
  document.body.appendChild(h);
}
function swRegister(){
  if (swReg || !('serviceWorker' in navigator) || !window.isSecureContext) return Promise.resolve(swReg);
  return navigator.serviceWorker.register('sw.js', { updateViaCache:'none' }).then(r => (swReg = r)).catch(() => null);   // updateViaCache 'none': luôn kiểm tra sw.js mới, không dùng bản trong bộ nhớ đệm
}

/* ---------- Cài web thành ứng dụng (PWA) ----------
   Chrome / Edge / Android: bắt sự kiện beforeinstallprompt để nút "Cài ứng dụng" mở hộp cài của trình duyệt.
   iPhone / iPad / Safari / Firefox không có sự kiện này: nút mở hướng dẫn cài bằng tay cho đúng thiết bị. */
const PWA = { prompt:null };
const pwaStandalone = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: window-controls-overlay)').matches || navigator.standalone === true;
const pwaIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const pwaAndroid = /android/i.test(navigator.userAgent);
function pwaRefresh(){
  const show = !pwaStandalone();
  const box = $('pwa-box'); if (box) box.classList.toggle('hidden', !show);
  if (state.booted) renderChrome();
}
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); PWA.prompt = e; pwaRefresh(); });
window.addEventListener('appinstalled', () => { PWA.prompt = null; toast('✓ ' + t('pwa_done'), 4000); pwaRefresh(); });
matchMedia('(display-mode: standalone)').addEventListener?.('change', pwaRefresh);
function pwaHelp(){
  const ua = navigator.userAgent, steps = k => `<ol class="steps">${[1, 2, 3].map(i => I18N.en[k + i] ? `<li>${esc(t(k + i))}</li>` : '').join('')}</ol>`;
  const k = pwaIOS ? 'pwa_ios' : pwaAndroid ? 'pwa_and' : /firefox\//i.test(ua) ? '' : /^((?!chrome|chromium|crios|edg).)*safari/i.test(ua) ? 'pwa_mac' : 'pwa_desk';
  openModal(`<h2>${ic('download')} ${esc(t('pwa_install'))}</h2>
    <p class="muted mt-s">${esc(t('pwa_note'))}</p>
    <div class="mt-s">${k ? steps(k) : `<p>${esc(t('pwa_ff'))}</p>`}</div>
    ${pwaIOS ? `<p class="lr-note">${esc(t('pwa_ios_note'))}</p>` : ''}
    <p class="lr-note">${esc(t('pwa_update'))}</p>`, true);
}
function pwaInstall(){
  if (!PWA.prompt) return pwaHelp();
  const p = PWA.prompt; PWA.prompt = null;
  p.prompt(); (p.userChoice || Promise.resolve()).then(() => pwaRefresh()).catch(() => {});
}
async function lrNotify(title, body, tag, sticky){
  if (!NOTIF_OK || Notification.permission !== 'granted') return;
  const url = location.href.split('#')[0] + '#/watch', opts = { body, tag, renotify:true, requireInteraction:!!sticky, data:{ url } };
  try { const reg = await swRegister(); if (reg && reg.showNotification) return await reg.showNotification(title, opts); } catch (e) {}
  try { const n = new Notification(title, opts); n.onclick = () => { window.focus(); location.hash = '#/watch'; n.close(); }; } catch (e) {}   // điện thoại Android chỉ cho hiện qua service worker
}
function lrFire(title, body, tag, sticky){
  if (lrSound()) soundPlay(sticky ? 'live_now' : 'live_soon');
  toast('🔔 ' + body, 9000);
  if (lrPop()) lrNotify(title, body, tag, sticky);
  if (document.hidden) { lrTitleBak = lrTitleBak || document.title; document.title = '🔔 ' + title; }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && lrTitleBak) { document.title = lrTitleBak; lrTitleBak = ''; } });
function lrTick(live, next, now){
  if (!LR.on) return;
  let dirty = false;
  const mark = k => { lrSent[k] = now; dirty = true; };
  lrSoon(now).filter(lrWanted).forEach(x => {
    const st = x.sched.toMillis(), ms = x.start.toMillis() - now, title = x.slot.title || t('lr_cal_title');   // st: khoá "đã nhắc" theo giờ lịch nên bấm bắt đầu lại không nhắc lặp
    if (ms > 0) {                                                  // nhắc trước: nhiều mốc tới cùng lúc (vd vừa bật nhắc) thì chỉ kêu một lần
      const due = LR.leads.filter(m => ms <= m * 60e3 && !lrSent['s' + m + '-' + st]);
      if (due.length) { due.forEach(m => mark('s' + m + '-' + st)); const n = Math.max(1, Math.round(ms / 60e3)); lrFire(t('lr_soon_t', { n }), t('lr_soon_b', { t:title, s:x.start.setZone(userTZ).toFormat('HH:mm') }), 'live-soon', false); }
    } else if (LR.atStart && x.started && -ms < 15 * 60e3 && !lrSent['l' + st]) {      // "đang live" chỉ khi admin đã bấm bắt đầu
      mark('l' + st); lrFire(t('notif_title'), x.slot.title ? `${x.slot.title} · ${t('notif_body')}` : t('notif_body'), 'live-now', true); }
  });
  if (dirty) { Object.keys(lrSent).forEach(k => { if (now - lrSent[k] > 2 * 864e5) delete lrSent[k]; }); store.set('lr_sent', lrSent); }
}
function lrNextText(live, next, now, waiting){
  if (live) return `${t('live_now')} · ${live.start.setZone(userTZ).toFormat('HH:mm')} – ${live.end.setZone(userTZ).toFormat('HH:mm')}`;
  if (waiting) return `${t('live_waiting')} · ${t('live_waiting_b', { t:waiting.sched.setZone(userTZ).toFormat('HH:mm') })}`;
  if (!next) return t('lr_none');
  const s = next.start.setZone(userTZ).setLocale(state.lang);
  return t('lr_next', { d:`${s.toFormat('ccc dd/MM HH:mm')} (${fmtDur(next.start.toMillis() - now)})` });
}
const lrSessLabel = x => `${x.start.setZone(userTZ).setLocale(state.lang).toFormat('ccc dd/MM · HH:mm')}${x.slot.title ? ' · ' + x.slot.title : ''}`;
function renderLiveRem(){
  const pop = $('live-rem'); if (!pop) return;
  const { live, waiting, next, now } = liveState(), perm = NOTIF_OK ? Notification.permission : 'none', soon = lrSoon(now);
  const chip = (on, act, attrs, label, extra) => `<button type="button" class="lr-chip ${on ? 'on' : ''}" data-act="${act}" ${attrs}>${label}${extra || ''}</button>`;
  const custom = LR.leads.filter(n => !LR_PRESETS.includes(n)).sort((a, b) => a - b);
  const leadsHTML = LR_PRESETS.map(n => chip(LR.leads.includes(n), 'lrLeadTog', `data-n="${n}"`, esc(t('lr_min', { n })))).join('')
    + custom.map(n => chip(true, 'lrLeadTog', `data-n="${n}" aria-label="${esc(t('lr_min', { n }))} ×"`, esc(t('lr_min', { n })), ' ×')).join('');
  const sessHTML = LR.mode !== 'pick' ? '' : soon.length
    ? `<div class="lr-sess">${soon.map(x => `<label class="lr-sess-row"><input type="checkbox" data-change="lrPick" data-st="${x.sched.toMillis()}" ${LR.picked[x.sched.toMillis()] ? 'checked' : ''}><span>${esc(lrSessLabel(x))}</span></label>`).join('')}</div>${soon.some(lrWanted) ? '' : `<p class="lr-note warn">${esc(t('lr_pick_none'))}</p>`}`
    : `<p class="lr-note">${esc(t('lr_none'))}</p>`;
  // Quyền thông báo: mục thông báo đẩy ở trên đã tự hỏi quyền và giải thích khi bị chặn; chỉ khi web chưa bật thông báo đẩy mới cần nút riêng ở đây
  const permHTML = pushHTML() || perm === 'granted' ? '' : perm === 'default' ? `<p class="lr-note">${esc(t('lr_perm_ask_note'))}</p><button type="button" class="btn secondary sm" data-act="lrPerm">${ic('bell', 'sm')} ${esc(t('lr_perm_ask'))}</button>`
    : `<p class="lr-note">${esc(t(perm === 'denied' ? 'lr_perm_denied' : 'lr_perm_none'))}</p>`;
  pop.innerHTML = `<div class="lr-h">${ic('bell', 'sm')} <b>${esc(t('lr_title'))}</b></div>
    <p class="lr-next" id="lr-next">${esc(lrNextText(live, next, now, waiting))}</p>
    ${notifBroken() ? `<p class="lr-note warn">${esc(t('nh_blocked'))}</p>` : ''}
    ${pushHTML()}
    ${plRemHTML()}
    ${typeof mjRemHTML === 'function' ? mjRemHTML() : ''}
    <div class="switch"><span>${esc(t('lr_on'))}</span><input type="checkbox" data-change="lrOn" ${LR.on ? 'checked' : ''}></div>
    <div class="${LR.on ? '' : 'lr-off'}">
      <details class="lr-help" ${LR.open ? 'open' : ''}><summary data-act="lrOpen">${esc(t('lr_more'))}</summary>
        <label class="label">${esc(t('lr_before'))}</label>
        <div class="lr-chips">${leadsHTML}</div>
        <label class="label">${esc(t('lr_which'))}</label>
        <div class="lr-seg">${chip(LR.mode === 'all', 'lrMode', 'data-v="all"', esc(t('lr_all')))}${chip(LR.mode === 'pick', 'lrMode', 'data-v="pick"', esc(t('lr_pick')))}</div>
        ${sessHTML}
      </details>
      ${LR.on && audioLocked() ? `<p class="lr-note warn">${esc(t('lr_tap'))}</p>` : ''}
      ${permHTML}
    </div>
    ${sndHTML()}
    ${notifHelpHTML()}`;
  $('btn-notif').classList.toggle('on', LR.on); notifBadge();
}
function lrSetOn(on){
  LR.on = on; lrSave(); $('btn-notif').classList.toggle('on', on);
  if (on) {
    if (typeof audio === 'function') audio();                     // bật chuông ngay trong lần bấm này (trình duyệt chỉ cho phát tiếng sau khi khách bấm)
    swRegister();
    if (lrPop() && NOTIF_OK && Notification.permission === 'default') Notification.requestPermission().then(() => renderLiveRem()).catch(() => {});
    if (lrSound()) soundPlay('live_soon', { force:true });
  }
  toast(t(on ? 'lr_on_toast' : 'lr_off_toast')); renderLiveRem();
}
const lrSetLeads = leads => { LR.leads = [...new Set(leads)].filter(n => n > 0 && n <= 720).sort((a, b) => b - a).slice(0, 6); lrSave(); renderLiveRem(); };
/* ---------- THÔNG BÁO ĐẨY (kể cả khi đã đóng web) ----------
   Khách bật trong bảng chuông → lấy mã nhận thông báo (token) của Firebase Cloud Messaging, lưu vào push_tokens/<sha256(token)>.
   Khách chỉ ghi/xoá được token của chính mình, không ai đọc được token người khác (xem firestore.rules).
   Máy gửi là GitHub Actions chạy mỗi 5 phút (scripts/push-live.mjs): thấy buổi live sắp bắt đầu theo lịch thì gửi cho mọi token.
   Chưa dán khoá VAPID vào js/firebase-config.js thì mục này ẩn đi, chuông nhắc vẫn chạy như cũ. */
const PUSH_VAPID = String(window.FCM_VAPID_KEY || '').trim();
const PUSH = { on:store.get('push_on', false), id:store.get('push_id', ''), busy:false, err:false };
const pushSupported = () => !!PUSH_VAPID && !DEMO && !CONFIG_MISSING && NOTIF_OK && window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window;
let msgP = null;
const loadMessaging = () => msgP || (msgP = loadScript('vendor/firebase-messaging-compat-10.8.0.js').then(() => firebase.messaging()).catch(e => { msgP = null; throw e; }));
const sha256Hex = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(b => b.toString(16).padStart(2, '0')).join('');
async function pushSync(ask){
  if (!pushSupported()) throw new Error('push unsupported');
  if (Notification.permission !== 'granted') {                        // hỏi quyền ngay trong lần bấm (Safari bắt buộc)
    if (!ask || await Notification.requestPermission() !== 'granted') throw new Error('permission ' + Notification.permission);
  }
  if (!await swRegister()) throw new Error('no service worker');
  const reg = await navigator.serviceWorker.ready, m = await loadMessaging();
  const token = await m.getToken({ vapidKey:PUSH_VAPID, serviceWorkerRegistration:reg });
  if (!token) throw new Error('no token');
  const id = await sha256Hex(token), sig = id + '|' + state.lang + '|' + userTZ;
  if (store.get('push_sig', '') === sig && Date.now() - store.get('push_t', 0) < 7 * 864e5) return;   // không đổi gì: khỏi ghi (ghi lại mỗi tuần để máy gửi biết token còn dùng)
  await db.collection('push_tokens').doc(id).set({ token, lang:state.lang, tz:String(userTZ).slice(0, 64), updatedAt:TS() });
  if (PUSH.id && PUSH.id !== id) db.collection('push_tokens').doc(PUSH.id).delete().catch(() => {});   // token cũ (trình duyệt đã đổi token)
  PUSH.id = id; store.set('push_id', id); store.set('push_sig', sig); store.set('push_t', Date.now());
}
async function pushOff(){
  try { if (pushSupported()) await (await loadMessaging()).deleteToken(); } catch (e) {}
  if (PUSH.id) await db.collection('push_tokens').doc(PUSH.id).delete().catch(() => {});
  PUSH.id = ''; store.set('push_id', ''); store.set('push_sig', '');
}
async function pushSet(on){
  PUSH.busy = true; PUSH.err = false; renderLiveRem();
  try { if (on) await pushSync(true); else await pushOff(); PUSH.on = on; toast(t(on ? 'push_on_toast' : 'push_off_toast')); if (plCan() && (on || plRemIsOn())) plRemSet(true, true); else if (plCan() && plPinOn()) loadPlanner().then(() => plPushSync(true)).catch(() => {}); if (typeof mjRemOn === 'function' && mjRemOn()) mjPushSync(true).catch(() => {}); }   // bật thông báo đẩy = bật luôn nhắc việc; tắt thì token cũ bị xoá nên nhắc việc lấy token mới
  catch (e) { console.warn('push', e); PUSH.on = false; PUSH.err = NOTIF_OK && Notification.permission !== 'denied'; }
  store.set('push_on', PUSH.on); PUSH.busy = false; renderLiveRem();
}
const pushResync = () => { if (PUSH.on && pushSupported() && Notification.permission === 'granted') pushSync(false).catch(e => console.warn('push', e)); };
function pushHTML(){
  if (!PUSH_VAPID || DEMO || CONFIG_MISSING) return '';
  const ios = pwaIOS && !pwaStandalone(), sup = pushSupported(), perm = NOTIF_OK ? Notification.permission : 'none', on = PUSH.on && sup && perm === 'granted';
  const note = ios ? `<p class="lr-note">${esc(t('push_ios'))}</p><button type="button" class="btn secondary sm" data-act="pwaInstall">${ic('download', 'sm')} ${esc(t('pwa_install'))}</button>`
    : !sup ? `<p class="lr-note">${esc(t('push_unsup'))}</p>`
    : perm === 'denied' ? `<p class="lr-note">${esc(t('push_denied'))}</p>`
    : PUSH.busy ? `<p class="lr-note">${esc(t('push_busy'))}</p>`
    : PUSH.err ? `<p class="lr-note warn">${esc(t('push_err'))}</p>` : '';   // lời giải thích thường ngày bỏ đi cho bảng gọn; chỉ hiện khi có vấn đề cần xử lý
  return `<div class="switch"><span><b>${esc(t('push_on'))}</b></span><input type="checkbox" data-change="pushOn" ${on ? 'checked' : ''} ${sup && perm !== 'denied' && !PUSH.busy ? '' : 'disabled'}></div>${note}<hr class="lr-hr">`;
}
/* Cảnh báo trong bảng chuông: những gì web tự biết được (quyền thông báo, iPhone chưa thêm ra Màn hình chính, chưa cài app)
   và hướng dẫn ngắn cho phần web không biết được (Không làm phiền, tắt tiếng, pin, kiểu thông báo Im lặng) */
const notifBroken = () => NOTIF_OK && ((PUSH.on || store.get('pl_rem', false) || store.get('mj_rem', false)) && Notification.permission !== 'granted' || LR.on && lrPop() && Notification.permission === 'denied');   // đã bật nhắc mà quyền thông báo bị chặn / bị thu hồi
const notifBadge = () => { const b = $('btn-notif'); if (b) b.classList.toggle('warn', notifBroken()); };
function notifHelpHTML(){                                           // một mục thu gọn: lưu ý khi dùng chuông + cách bật lại âm / thông báo + cài ứng dụng
  const app = !pwaStandalone() && !pwaIOS && pushSupported() ? `<p class="lr-note">${esc(t('nh_app'))}</p><button type="button" class="btn ghost sm" data-act="pwaInstall">${ic('download', 'sm')} ${esc(t('pwa_install'))}</button>` : '';
  const steps = k => `<ol class="lr-steps">${[1, 2, 3].map(i => `<li>${esc(t(k + i))}</li>`).join('')}</ol>`;
  return `<details class="lr-help"><summary>${esc(t('snd_tips_t'))}</summary><ul class="lr-steps">${[1, 2, 3, 4].map(i => `<li>${esc(t('snd_tip' + i))}</li>`).join('')}</ul>
    <p class="lr-note">${esc(t('nh_intro'))}</p>${pwaIOS ? steps('nh_ios') : steps('nh_and')}${app}</details>`;
}
/* Nhắc việc Planner trong bảng chuông (chỉ người dùng được Planner): bật/tắt bằng plRemToggle trong planner.js */
const plCan = () => !DEMO && !!state.user && (state.companion || state.isAdmin || (typeof trialActive === 'function' && trialActive()));
const plRemIsOn = () => !!store.get('pl_rem', false);
function plRemHTML(){
  if (!plCan()) return '';
  const on = plRemIsOn();
  return `<div class="switch"><span><b>${esc(t('plr_on'))}</b></span><input type="checkbox" data-change="plRemOn" ${on ? 'checked' : ''}></div>${on && audioLocked() ? `<p class="lr-note warn">${esc(t('lr_tap'))}</p>` : ''}<hr class="lr-hr">${plPinHTML()}`;
}
/* Việc hôm nay ngoài màn hình: thông báo yên lặng khi thoát web (hiện bằng plPinShow trong planner.js). Mặc định tắt, khách tự bật trên từng máy */
const plPinOn = () => !!store.get('pl_pin', false);
async function plPinHide(){ try { const reg = await swRegister(); if (reg && reg.getNotifications) (await reg.getNotifications({ tag:'pl-today' })).forEach(n => n.close()); } catch (e) {} }
function plPinHTML(){
  const perm = NOTIF_OK ? Notification.permission : 'denied', on = plPinOn() && perm === 'granted';
  const note = pwaIOS && !pwaStandalone() ? 'plp_ios' : !NOTIF_OK ? 'push_unsup' : '';   // quyền bị chặn đã có cảnh báo ở mục thông báo đẩy và đầu bảng
  return `<div class="switch"><span><b>${esc(t('plp_on'))}</b></span><input type="checkbox" data-change="plPinOn" ${on ? 'checked' : ''} ${NOTIF_OK && perm !== 'denied' ? '' : 'disabled'}></div>${note ? `<p class="lr-note">${esc(t(note))}</p>` : ''}<hr class="lr-hr">`;
}
async function plPinSet(on){
  if (on && NOTIF_OK && Notification.permission === 'default') { try { await Notification.requestPermission(); } catch (e) {} }
  on = on && NOTIF_OK && Notification.permission === 'granted';
  store.set('pl_pin', on); if (!on) plPinHide();
  toast(t(on ? 'plp_on_toast' : 'plp_off_toast')); renderLiveRem();
  try {                                                              // hiện ngay + báo máy gửi (scripts/push-planner.mjs) để cập nhật cả khi đã đóng web
    await loadPlanner(); if (on) plPinShow();
    await (on || plRemIsOn() ? plPushSync(true) : plPushOff());
  } catch (e) { console.warn('planner pin', e); }
}
async function plRemSet(on, quiet){
  if (on && !quiet && typeof audio === 'function') audio();          // mở khoá chuông ngay trong lần bấm này (trình duyệt chỉ cho phát tiếng sau khi khách bấm)
  try { await loadPlanner(); if (typeof plRemToggle === 'function') await plRemToggle(on, quiet); } catch (e) { console.warn('planner rem', e); }
  renderLiveRem(); if (route.name === 'planner') render(true);
}
['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, () => { if ((LR.on && lrSound() || plRemIsOn()) && typeof audio === 'function' && audioLocked()) { audio(); if ($('live-rem').classList.contains('open')) setTimeout(renderLiveRem, 50); } }, { passive:true }));
/* Nút nổi "Bắt đầu live" chỉ cho admin: web CHỈ báo "Đang live" sau khi admin bấm bắt đầu (settings/onair), còn bấm Start Streaming trong OBS chỉ dời bộ đếm trên OBS.
   Để khỏi quên, khi tới giờ lịch mà chưa bấm (hoặc còn dưới 15 phút nữa tới giờ) thì ở mọi trang đều có nút này, bấm một lần là xong, dùng được cả trên điện thoại. */
/* Tự báo live theo OBS: overlay trong OBS ghi obs_signal/start lúc bấm Start Streaming (cần khoá &k=… trong link, xem Admin → Khoá OBS). Admin đang mở web thấy tín hiệu này
   thì tự ghi settings/onair với đúng giờ OBS bắt đầu, nên web báo "Đang live" và bộ đếm khớp OBS mà không phải bấm hay nhập phút. Chỉ admin đọc được tài liệu này (1 lượt đọc mỗi lần đổi). */
let OBS_SIG = null, obsUnsub = null;
function obsWatch(){
  if (obsUnsub || DEMO || !state.isAdmin) return;
  try { obsUnsub = db.collection('obs_signal').doc('start').onSnapshot(d => { OBS_SIG = d.exists ? d.data() : null; obsAuto(); adminLiveNudge(); }, e => { console.warn('obs_signal', e.code || e); }); } catch (e) {}
}
function obsAuto(){
  const d = OBS_SIG, now = Date.now(); if (!d || !state.isAdmin || !d.start || !d.sched) return;
  if (now - (+d.at || 0) > 5 * 60e3 || d.start > now + 60e3) return;                      // chỉ theo tín hiệu vừa mới
  const cur = ONAIR.v || {}; if (cur.sched === d.sched && cur.start) return;              // buổi này đã được báo live rồi (OBS tự báo hoặc admin bấm tay): giữ nguyên
  const x = upcomingPool().find(p => p.sched.toMillis() === +d.sched); if (!x) return;
  db.collection('settings').doc('onair').set({ start:+d.start, sched:+d.sched, at:now, prev:{ start:cur.start || 0, sched:cur.sched || 0, at:cur.at || 0 } }, { merge:true })
    .then(() => toast('✓ OBS vừa bắt đầu stream, web đã tự báo đang live.', 4500)).catch(e => console.warn(e));
}
function adminLiveNudge(){
  obsWatch();
  let b = document.getElementById('golive-fab');
  const st = state.isAdmin && !DEMO ? liveState() : null, x = st && !st.live && (st.waiting || (st.next && st.next.start.toMillis() - st.now < 15 * 60e3 ? st.next : null));
  if (!x) { if (b) b.remove(); return; }
  if (!b) { b = document.createElement('button'); b.id = 'golive-fab'; b.type = 'button'; b.className = 'btn primary golive-fab'; b.dataset.act = 'goLiveNow'; document.body.appendChild(b); }
  const late = st.waiting ? Math.max(1, Math.round((st.now - x.sched.toMillis()) / 60e3)) : 0;
  b.innerHTML = `<i class="golive-dot"></i> Bắt đầu live${late ? ` <small>(đã tới giờ, trễ ${late} phút)</small>` : ` <small>(${x.start.setZone(VN).toFormat('HH:mm')})</small>`}`;
  b.classList.toggle('late', !!late);
}
function tickClock(){
  const n = DT.now().setZone(userTZ), txt = n.toFormat('hh:mm:ss a');
  document.querySelectorAll('[data-clock]').forEach(e => e.textContent = txt);
  // chỉ vẽ lại trang khi trạng thái buổi live thật sự đổi (để hiệu ứng mưa không bị khởi động lại mỗi phút)
  const mk = n.toFormat('HH:mm');
  if (mk !== lastMin) { lastMin = mk; const ms = Date.now(), sig = n.toISODate() + poolAll().map(x => x.key + (isLive(x, ms) ? 'L' : isWaiting(x, ms) ? 'W' : ms >= x.end.toMillis() ? 'P' : '')).join(','); if (sig !== lastSig) { lastSig = sig; if (['home', 'schedule'].includes(route.name)) render(); } }
}
setInterval(() => { tickClock(); updateNext(); }, 1000);
setInterval(() => { try { adminLiveNudge(); } catch (e) {} }, 10e3);

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
async function uploadFile(file, path, onProgress){
  if (!DEMO) await loadStorage();
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
CHANGES.lrOn = el => lrSetOn(el.checked);
CHANGES.sndMaster = el => { SND.on = el.checked; sndSave(); renderLiveRem(); if (SND.on) soundPlay('live_soon', { force:true }); };
CHANGES.sndVol = el => { SND.vol = Math.min(1, Math.max(.1, (+el.value || 80) / 100)); sndSave(); soundPlay('live_soon', { force:true }); };
CHANGES.sndCat = el => { const c = SND.cats[el.dataset.c]; if (!c) return; c.on = el.checked; sndSave(); el.closest('.snd-row').classList.toggle('off', !c.on); if (c.on) soundPlay(el.dataset.c, { force:true }); };
CHANGES.sndTone = el => { const c = SND.cats[el.dataset.c]; if (!c || !SND_TONES.includes(el.value)) return; c.tone = el.value; sndSave(); soundPlay(el.dataset.c, { force:true }); };
CHANGES.pushOn = el => pushSet(el.checked);
CHANGES.plRemOn = el => plRemSet(el.checked);
CHANGES.plPinOn = el => plPinSet(el.checked);
CHANGES.lrPick = el => { const k = el.dataset.st; if (el.checked) LR.picked[k] = 1; else delete LR.picked[k]; const now = Date.now(); Object.keys(LR.picked).forEach(x => { if (+x < now - 864e5) delete LR.picked[x]; }); lrSave(); renderLiveRem(); };
const ACTIONS = {
  pageReload: () => location.reload(),
  openNav: () => document.body.classList.add('nav-open'),
  closeNav: () => document.body.classList.remove('nav-open'),
  prefs: () => { $('live-rem').classList.remove('open'); $('prefs').classList.toggle('open'); },
  goLiveNow: () => {   // hỏi "đã bấm Start Streaming cách đây bao nhiêu phút" để bộ đếm web khớp với OBS, rồi bấm Bắt đầu
    const st = liveState(), x = st.waiting || st.next; if (!x || !state.isAdmin || st.live) return;
    const sg = OBS_SIG && OBS_SIG.sched === x.sched.toMillis() && Date.now() - OBS_SIG.start < 4 * 3600e3 ? Math.max(0, Math.round((Date.now() - OBS_SIG.start) / 60e3)) : null;   // OBS đã báo giờ Start Streaming thật
    openModal(`<h3 style="margin-bottom:6px;padding-right:32px">Bắt đầu live</h3><p class="small muted">${sg !== null ? `OBS báo bạn đã bắt đầu stream cách đây <b>${sg} phút</b>, web sẽ tính theo mốc đó (bạn vẫn sửa được).` : 'Bạn đã bấm Start Streaming trong OBS cách đây bao nhiêu phút? Web sẽ tính bộ đếm khớp với OBS. Vừa bấm xong thì để 0.'}</p>
      <div class="row mt-s" style="flex-wrap:nowrap;align-items:center"><input class="input" id="golive-min" type="number" min="0" max="180" value="${sg !== null ? sg : 0}" style="width:96px"><span>phút trước</span></div>
      <div class="row mt"><button type="button" class="btn primary" data-act="goLiveGo">Bắt đầu live</button></div>`, true);
  },
  goLiveGo: async () => {   // ghi settings/onair giống nút "Bắt đầu buổi live bây giờ" trong Admin
    const st = liveState(), x = st.waiting || st.next; if (!x || !state.isAdmin || st.live) return closeModal();
    const ago = Math.max(0, Math.min(180, Math.round(+($('golive-min') || {}).value || 0), Math.max(0, (x.mins || 60) - 1))), cur = ONAIR.v || {}, now = Date.now();
    try { await db.collection('settings').doc('onair').set({ start:now - ago * 60e3, sched:x.sched.toMillis(), at:now, prev:{ start:cur.start || 0, sched:cur.sched || 0, at:cur.at || 0 } }, { merge:true }); closeModal(); toast('✓ Đã bắt đầu. Web báo đang live ngay, OBS tự theo trong khoảng 10 giây.', 3500); adminLiveNudge(); }
    catch (e) { console.warn(e); toast('Chưa lưu được: ' + (e.code || e.message)); }
  },

  closeModal,
  sky: el => { state.sky = el.dataset.sky; store.set('sky', state.sky); applyLook(); renderPrefs(); },
  theme: el => { state.theme = el.dataset.th; store.set('theme', state.theme); applyLook(); renderPrefs(); render(true); },
  editMode: toggleEditMode,
  dismissLive: () => { const { live } = liveState(); dismissedLive = live ? live.key : null; updateNext(); },
  bellHintX: () => bellHintHide(true),
  notif: () => { bellHintHide(true); const p = $('live-rem'), open = !p.classList.contains('open'); $('prefs').classList.remove('open'); if (open) renderLiveRem(); p.classList.toggle('open', open); },
  lrPerm: () => { if (NOTIF_OK) Notification.requestPermission().then(p => { if (p === 'granted') { swRegister(); toast('🔔 OK'); } renderLiveRem(); }).catch(() => {}); },
  lrLeadTog: el => { const n = +el.dataset.n; lrSetLeads(LR.leads.includes(n) ? LR.leads.filter(x => x !== n) : [...LR.leads, n]); },
  lrOpen: el => { LR.open = !LR.open; el.parentElement.open = LR.open; },
  sndOpen: el => { SND.open = !SND.open; el.parentElement.open = SND.open; },   // dispatcher chặn hành vi mặc định nên tự mở / đóng
  sndTest: el => { soundPlay(el.dataset.c, { force:true }); },
  lrMode: el => { LR.mode = el.dataset.v; lrSave(); renderLiveRem(); },
  pwaInstall: () => { document.body.classList.remove('nav-open'); $('prefs').classList.remove('open'); $('live-rem').classList.remove('open'); pwaInstall(); },
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
    if (!e.target.closest('#live-rem') && !e.target.closest('#btn-notif')) $('live-rem').classList.remove('open');
    if (e.target === $('modal')) closeModal(); return;
  }
  const fn = ACTIONS[el.dataset.act]; if (!fn) return;
  if (el.tagName !== 'A' || !el.getAttribute('href')) e.preventDefault();
  fn(el, e);
});
document.addEventListener('submit', e => { const f = e.target.dataset && e.target.dataset.form; if (f && FORMS[f]) { e.preventDefault(); FORMS[f](e.target, e); } });
document.addEventListener('change', e => { const c = e.target.dataset && e.target.dataset.change; if (c && CHANGES[c]) CHANGES[c](e.target, e); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); $('prefs').classList.remove('open'); $('live-rem').classList.remove('open'); document.body.classList.remove('nav-open'); const d = $('cart-drawer'); d && d.classList.remove('open'); }
  if (e.key === 'Enter' && state.editMode && e.target.dataset && e.target.dataset.cms && !e.shiftKey) { e.preventDefault(); e.target.blur(); }
});
document.addEventListener('focusin', e => { const el = e.target; if (state.editMode && el.dataset && el.dataset.cms) el.dataset.orig = el.textContent.trim(); });
document.addEventListener('focusout', e => {
  const el = e.target;
  if (state.editMode && el.dataset && el.dataset.cms && el.textContent.trim() !== el.dataset.orig) saveCmsText(el.dataset.cms, el.textContent.trim());   // chỉ lưu khi chữ thật sự đổi
  setTimeout(() => { if (pendingRender && !typingInPage()) render(); }, 50);
});
$('sel-lang').addEventListener('change', e => { state.lang = e.target.value; store.set('lang', state.lang); renderPrefs(); render(true); pushResync(); if (needLangs(state.lang)) loadLangs().then(() => { renderPrefs(); render(true); }).catch(e => console.warn('i18n-langs', e)); });   // chưa có bản dịch: vẽ tạm bằng tiếng Anh, tải xong vẽ lại
$('sel-tz').addEventListener('change', e => { state.tz = e.target.value; store.set('tz', state.tz); userTZ = state.tz === 'auto' ? DT.local().zoneName : state.tz; listenWeeks(); render(true); pushResync(); });
$('chk-calm').addEventListener('change', e => { state.calm = e.target.checked; store.set('calm', state.calm); applyLook(); });
// Bấm vào nút, link, ô chọn…: một ngôi sao nhỏ loé lên đúng chỗ bấm (không chạy khi bật giảm chuyển động)
const motionOff = () => state.calm || !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
document.addEventListener('pointerdown', e => {
  if (e.button || motionOff() || !e.target.closest || !e.target.closest('a,button,select,label,[data-act],input[type=checkbox],input[type=radio]')) return;
  const d = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); d.setAttribute('class', 'tap-star'); d.setAttribute('viewBox', '0 0 20 20');
  d.innerHTML = '<path d="M10 0Q11 9 20 10Q11 11 10 20Q9 11 0 10Q9 9 10 0Z"/>'; d.style.left = e.clientX + 'px'; d.style.top = e.clientY + 'px';
  document.body.appendChild(d); setTimeout(() => d.remove(), 650);
}, { passive:true });
window.addEventListener('hashchange', () => { document.body.classList.remove('nav-open'); $('cart-drawer').classList.remove('open'); render(true); window.scrollTo({ top:0 }); });

function boot(){
  state.booted = true; setTimeout(bellHintShow, 3000);
  setTimeout(() => { if (store.get('tour', null) === null) loadGuide().then(() => typeof EPTour !== 'undefined' && EPTour.auto()).catch(() => {}); }, 3500);   // khách mới: hướng dẫn tự chạy; khách cũ: được hỏi trước
  // Từng bước bắt lỗi riêng: một phần lỗi (giao diện, ngôn ngữ, dữ liệu…) không làm cả trang trắng. Chỉ khi không vẽ nổi trang thì báo cho lưới an toàn trong index.html (tự sửa + tải lại).
  const step = (nm, fn) => { try { const r = fn(); if (r && r.catch) r.catch(e => console.error('[EP] ' + nm, e)); } catch (e) { console.error('[EP] ' + nm, e); } };
  step('look', applyLook); step('prefs', renderPrefs); step('data', listenAll);
  try { readRoute(); doRender(); }
  catch (e) {                                                        // trang đang mở bị lỗi: thử về Trang chủ trước khi coi là hỏng
    console.error('[EP] render ' + location.hash, e);
    if (route.name === 'home') throw e;
    try { history.replaceState(null, '', '#/'); } catch (er) {}
    readRoute(); doRender();
  }
  window.EP_BOOTED = true; const fb = $('ep-fail'); if (fb) fb.remove();   // tắt lưới an toàn trong index.html (trang đã vẽ được)
  step('splash', splashOut);
  if (window.EP_HEALED) window.EP_HEALED();
  step('notif', () => { $('btn-notif').classList.toggle('on', LR.on); notifBadge(); });
  step('pwa', pwaRefresh);
  if (needLangs(state.lang)) step('langs', () => loadLangs().then(() => { renderPrefs(); render(true); }));   // index.html chưa tải được bản dịch (bị chặn…): tải lại rồi vẽ lại
  const afterLoad = () => { swRegister(); setTimeout(pushResync, 3000); };   // pushResync: làm mới token thông báo đẩy (trình duyệt thỉnh thoảng đổi token)
  if (document.readyState === 'complete') afterLoad(); else window.addEventListener('load', afterLoad);   // đăng ký sau khi trang tải xong để không làm chậm lúc mở web
  if (state.user === null && DEMO && DEMO_AS) { render(true); }
}