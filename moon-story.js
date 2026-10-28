'use strict';
/* =========================================================
   MOON JOURNEY — CON ĐƯỜNG TÌM MOON
   Vẽ trên trang Hành trình trăng (pages.js → PAGES.club). Chỉ ĐỌC chuỗi điểm danh (moonData()), không ghi thêm gì lên Firebase.
   - Con đường: mỗi ngày của chuỗi hiện tại là một bước, đi đến đâu đường sáng đến đó.
   - Trạm dừng (MJ_STOPS): mở khi chuỗi DÀI NHẤT (best) đạt số ngày của trạm, nên đứt chuỗi vẫn giữ các trạm đã mở (giống huy hiệu).
     Ngày 365 là trạm gặp lại Moon.
   - Mỗi trạm có một bức tranh (moon-art.js), tên trạm và lời Trân tự viết (moon-story-text.js, để trống thì chỉ hiện tranh).
     Thay tranh thật: bật bút chì, mở trạm, bấm vào tranh để tải ảnh (lưu ở settings/content.images.mj_art_<trạm>).
   - Trạm nào đã xem thì nhớ trong máy (localStorage mj_seen_<uid>), chỉ để hiện chấm "Mới".
   ========================================================= */
const MJ_STOPS = [
  { id:'start', day:0, g:'umb' }, { id:'d1', day:1, g:'moon' }, { id:'d3', day:3, g:'umb' }, { id:'d7', day:7, g:'lamp' },
  { id:'d10', day:10, g:'book' }, { id:'d14', day:14, g:'half' }, { id:'d21', day:21, g:'star' }, { id:'d30', day:30, g:'full' },
  { id:'d45', day:45, g:'candle' }, { id:'d60', day:60, g:'star' }, { id:'d80', day:80, g:'door' }, { id:'d100', day:100, g:'paw' },
  { id:'d130', day:130, g:'moon' }, { id:'d200', day:200, g:'spiral' }, { id:'d250', day:250, g:'lamp' },
  { id:'d300', day:300, g:'letter' }, { id:'d365', day:365, g:'heart', big:true }, { id:'d400', day:400, g:'moon' }, { id:'d450', day:450, g:'crown', big:true }, { id:'after', day:480, g:'paw' }
];
const mjStop = id => MJ_STOPS.find(s => s.id === id);
const mjTitle = s => ctext('mjc_' + s.id + '_t');
const mjOpen = (s, best) => s.day <= best;
// admin luôn xem được mọi trạm (để duyệt và viết lời); khách chỉ thấy trạm đã tới
const mjPreview = () => !!state.isAdmin;
const mjSeenKey = () => 'mj_seen_' + (state.user ? state.user.uid : 'guest');
const mjSeen = () => +store.get(mjSeenKey(), -1);
const mjRainOn = () => store.get('mj_rain', true) !== false;
let mjScroll = null;

/* tranh và nhân vật: moon-art.js */

/* ---------- bản đồ con đường: kiểu sơ đồ tuyến tàu ----------
   Con đường là một tuyến tàu: nét dày bo tròn, chỉ đi thẳng đứng, ngang hoặc chéo 45°, mỗi vùng cảnh (khớp với nền ở moon-art.js) là một màu tuyến.
   Ở trạm đổi vùng có ga đổi tuyến: một tuyến phụ chạy ra mép bản đồ, cuối tuyến có một ga nhỏ hình con vật / đồ vật (chỉ để trang trí). */
const MJ_W = 340, MJ_GAP = 132, MJ_TOP = 190, MJ_BOT = 80;
const mjH = () => MJ_TOP + (MJ_STOPS.length - 1) * MJ_GAP + MJ_BOT;
// các trạm nằm trên lưới 6 cột; tên trạm luôn viết về phía giữa bản đồ (cột trái ghi sang phải, cột phải ghi sang trái)
const MJ_XS = [170, 104, 236, 284, 220, 104, 56, 150, 236, 236, 104, 150, 284, 220, 56, 104, 236, 150, 236, 150];
const mjXY = i => { const j = Math.max(0, Math.min(MJ_STOPS.length - 1, i)); return [MJ_XS[j % MJ_XS.length], mjH() - MJ_BOT - j * MJ_GAP]; };
// màu tuyến theo vùng cảnh: phố mưa, mặt nước, đồng đom đóm, rừng thông, biển sao, bờ biển gặp Moon, trên mây
const MJ_LINE = ['#ff6fae', '#42c8f5', '#8ee06a', '#ffd23f', '#a98bff', '#ff8a5c', '#ffb3dc'];
const MJ_ZONE = [0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 4, 5, 6, 6, 6];
const mjZone = i => MJ_ZONE[Math.max(0, Math.min(MJ_ZONE.length - 1, i))];
const mjSide = x => x < 170 ? 1 : x > 170 ? -1 : 0;            // phía ghi tên trạm
// tuyến phụ ở ga đổi tuyến: chạy ngang về mép bên kia tên trạm rồi rẽ chéo lên/xuống dọc mép, cuối tuyến là một ga nhỏ có hình
const MJ_BRANCH = { 5:{ ic:'house', up:0 }, 8:{ ic:'cup', up:1 }, 11:{ ic:'tree', up:0 }, 13:{ ic:'tent', up:1 }, 16:{ ic:'boat', up:1 }, 17:{ ic:'wheel', up:0 } };
const mjBranchPts = i => { const [x, y] = mjXY(i), e = mjSide(x) > 0 ? 18 : MJ_W - 18, dir = e < x ? -1 : 1, k = MJ_BRANCH[i].up ? -1 : 1;
  return [[x, y], [e - dir * 22, y], [e, y + k * 22], [e, y + k * 74]]; };
// đường gấp khúc có góc bo tròn → path SVG + các điểm lấy mẫu (để đặt chấm ngày và người đi đường)
function mjRoute(pts, R = 18){
  const P = pts.filter((p, k) => !k || p[0] !== pts[k - 1][0] || p[1] !== pts[k - 1][1]), smp = [P[0]]; let d = `M${P[0].join(' ')}`;
  for (let k = 1; k < P.length - 1; k++) {
    const a = P[k - 1], b = P[k], c = P[k + 1], la = Math.hypot(b[0] - a[0], b[1] - a[1]), lc = Math.hypot(c[0] - b[0], c[1] - b[1]), r = Math.min(R, la / 2, lc / 2);
    const p1 = [b[0] - (b[0] - a[0]) / la * r, b[1] - (b[1] - a[1]) / la * r], p2 = [b[0] + (c[0] - b[0]) / lc * r, b[1] + (c[1] - b[1]) / lc * r];
    d += `L${_r1(p1[0])} ${_r1(p1[1])}Q${b.join(' ')} ${_r1(p2[0])} ${_r1(p2[1])}`;
    smp.push(p1); for (let t = .2; t < 1; t += .2) { const u = 1 - t; smp.push([u * u * p1[0] + 2 * u * t * b[0] + t * t * p2[0], u * u * p1[1] + 2 * u * t * b[1] + t * t * p2[1]]); } smp.push(p2);
  }
  const z = P[P.length - 1]; d += `L${z.join(' ')}`; smp.push(z);
  return { d, smp };
}
// đoạn i (trạm i → trạm i+1): đi thẳng lên một chút, chéo 45° sang cột của trạm sau rồi lại thẳng lên; lệch cột xa quá thì đi ngang ở giữa
const mjSegCache = {};
function mjSeg(i){
  if (mjSegCache[i]) return mjSegCache[i];
  const a = mjXY(i), b = mjXY(i + 1), dx = b[0] - a[0], g = a[1] - b[1], ad = Math.abs(dx); let pts;
  if (!dx) pts = [a, b];
  else if (ad <= g - 24) { const v = (g - ad) / 2; pts = [a, [a[0], a[1] - v], [b[0], b[1] + v], b]; }
  else pts = [a, [a[0], a[1] - g / 2], [b[0], a[1] - g / 2], b];
  return (mjSegCache[i] = mjRoute(pts));
}
function mjAt(i, f){                         // điểm ở phần f (0–1) theo chiều dài đoạn i
  const q = mjSeg(i).smp, L = [0]; for (let k = 1; k < q.length; k++) L.push(L[k - 1] + Math.hypot(q[k][0] - q[k - 1][0], q[k][1] - q[k - 1][1]));
  const want = Math.max(0, Math.min(1, f)) * L[L.length - 1];
  for (let k = 1; k < q.length; k++) if (L[k] >= want) { const u = L[k] > L[k - 1] ? (want - L[k - 1]) / (L[k] - L[k - 1]) : 0; return [q[k - 1][0] + (q[k][0] - q[k - 1][0]) * u, q[k - 1][1] + (q[k][1] - q[k - 1][1]) * u]; }
  return q[q.length - 1];
}
// vị trí theo số ngày của chuỗi: [đoạn, phần trong đoạn]
function mjPos(n){
  const last = MJ_STOPS.length - 1; if (n >= MJ_STOPS[last].day) return [last, 0];
  for (let i = 0; i < last; i++) if (n < MJ_STOPS[i + 1].day) return [i, (n - MJ_STOPS[i].day) / (MJ_STOPS[i + 1].day - MJ_STOPS[i].day)];
  return [last, 0];
}
// hình nhỏ ở ga cuối các tuyến phụ (vẽ trong ô 16×16, màu theo currentColor)
const MJ_ICON = {
  house:'<path d="M-6.5 0L0-6l6.5 6v6.5h-13z"/><rect x="-1.6" y="2" width="3.2" height="4.5" fill="#fff"/>',
  cup:'<path d="M-6-3h9v3.5a4.5 4.5 0 0 1-9 0z"/><path d="M3-1.5h1.6a2 2 0 0 1 0 4H3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M-4-5.5q1-1.5 0-3M-1-5.5q1-1.5 0-3" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>',
  tree:'<path d="M0-7.5l5 6.5h-2.6l3.8 5h-12.4l3.8-5H-5z"/><rect x="-1.1" y="4" width="2.2" height="3.5"/>',
  tent:'<path d="M0-6.5l7.5 12h-15z"/><path d="M0-1l2.6 5.5h-5.2z" fill="#fff"/>',
  boat:'<path d="M-7.5 2h15l-3.2 4.5h-8.6z"/><path d="M-.6 1V-7.5L5.5 1z"/>',
  wheel:'<circle r="5.6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M0-5.6V5.6M-5.6 0H5.6M-4-4L4 4M-4 4L4-4" stroke="currentColor" stroke-width="1"/><path d="M-3.5 7.5L0 1l3.5 6.5" fill="none" stroke="currentColor" stroke-width="1.5"/>'
};
const MJ_GLYPH = {
  moon:'<path d="M5 -6a7 7 0 1 0 2 11a6 6 0 0 1-2-11z"/>', half:'<path d="M0-7a7 7 0 0 1 0 14z"/><circle r="7" fill="none" stroke="currentColor" stroke-width="1.4"/>', full:'<circle r="7"/>',
  umb:'<path d="M-8 0q0-8 8-8t8 8q-2-2-4 0q-2-2-4 0q-2-2-4 0q-2-2-4 0z"/><path d="M0 0v6q0 2-2 2" fill="none" stroke="currentColor" stroke-width="1.5"/>', lamp:'<path d="M-4-7h8l-2 5h-4z"/><path d="M0-2v10" stroke="currentColor" stroke-width="1.6"/>',
  book:'<path d="M-8-5q4-2 8 0v10q-4-2-8 0zM8-5q-4-2-8 0v10q4-2 8 0z"/>', star:'<path d="M0-8l2.3 5 5.4.6-4 3.7 1.1 5.3L0 4l-4.8 2.6 1.1-5.3-4-3.7 5.4-.6z"/>',
  candle:'<rect x="-2.5" y="-2" width="5" height="9" rx="1"/><path d="M0-3q-3-3 0-7q3 4 0 7z"/>', bell:'<path d="M-6 4q0-11 6-11t6 11z"/><circle cy="6" r="1.8"/>',
  heart:'<path d="M0 7l-6-6a3.6 3.6 0 0 1 6-4a3.6 3.6 0 0 1 6 4z"/>', spiral:'<path d="M0 0a2 2 0 0 1 4 0a4 4 0 0 1-8 0a6 6 0 0 1 12 0" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  letter:'<rect x="-8" y="-5" width="16" height="11" rx="1.5"/><path d="M-8-4l8 6 8-6" fill="none" stroke="#0d1d36" stroke-width="1.2"/>', crown:'<path d="M-8 5v-9l4 4 4-6 4 6 4-4v9z"/>', door:'<rect x="-5.5" y="-8" width="11" height="16" rx="1.5"/><circle cx="2.6" r="1.2" fill="#f6c64a"/>',
  paw:'<ellipse cy="3" rx="4" ry="3.4"/><circle cx="-5" cy="-3" r="1.8"/><circle cx="-1.7" cy="-6" r="1.8"/><circle cx="1.7" cy="-6" r="1.8"/><circle cx="5" cy="-3" r="1.8"/>'
};
function mjMap(n, best, preview){
  const H = mjH(), c = mjCtx(42, 'mjmap'), [si, sf] = mjPos(n), seen = mjSeen(), last = MJ_STOPS.length - 1;
  let casing = '', off = '', lit = '', glow = '', flow = '', dots = '', stops = '', branch = '';
  // nền đêm: phố mưa → mặt nước → đồng đom đóm → rừng thông → biển sao → hải đăng → trên mây (moon-art.js)
  const deco = mjMapBg(c, MJ_W, H, i => mjXY(i)[1]);
  // tuyến phụ ở các ga đổi tuyến: sáng màu khi trạm đã mở, có đoàn tàu nhỏ chạy ra mép
  Object.keys(MJ_BRANCH).forEach(k => {
    const i = +k, s = MJ_STOPS[i], on = preview || mjOpen(s, best), col = MJ_LINE[(mjZone(i) + 3) % MJ_LINE.length], pts = mjBranchPts(i), { d } = mjRoute(pts), [ex, ey] = pts[3], [x, y] = pts[0], hx = pts[1][0] - x;
    branch += `<g class="mj-branch ${on ? 'on' : ''}" style="--lc:${col}"><path class="cs" d="${d}"/><path class="ln" d="${d}"/>
      ${on ? `<g class="mja-go" style="--gx:${hx}px;--gy:0px"><g transform="translate(${x + Math.sign(hx) * 26} ${y})"><rect x="-9" y="-5" width="18" height="10" rx="4" class="tr"/><rect x="${hx > 0 ? 2 : -7}" y="-3" width="5" height="3.4" rx="1" fill="#0b1430"/></g></g>` : ''}
      <circle cx="${ex}" cy="${ey}" r="11" class="end"/><g transform="translate(${ex} ${ey})" class="ic">${MJ_ICON[MJ_BRANCH[i].ic]}</g></g>`;
  });
  for (let i = 0; i < last; i++) {
    const { d } = mjSeg(i), col = MJ_LINE[mjZone(i)], a = MJ_STOPS[i].day, b = MJ_STOPS[i + 1].day;
    casing += `<path d="${d}"/>`; off += `<path d="${d}" stroke="${col}"/>`;
    if (i < si) { lit += `<path d="${d}" stroke="${col}"/>`; glow += `<path d="${d}" stroke="${col}"/>`; flow += `<path d="${d}"/>`; }
    else if (i === si && sf > 0) { const da = `pathLength="1000" stroke-dasharray="${Math.round(sf * 1000)} 2000"`; lit += `<path d="${d}" stroke="${col}" ${da}/>`; glow += `<path d="${d}" stroke="${col}" ${da}/>`; }
    const span = b - a, step = Math.max(1, Math.ceil((span - 1) / 22));
    for (let k = step; k < span; k += step) { const [x, y] = mjAt(i, k / span), on = a + k <= n; dots += `<circle cx="${_r1(x)}" cy="${_r1(y)}" r="${on ? 2.2 : 1.6}" class="${on ? 'on' : ''}"/>`; }
  }
  MJ_STOPS.forEach((s, i) => {
    const [x, y] = mjXY(i), open = preview || mjOpen(s, best), reached = s.day <= n, isNew = mjOpen(s, best) && s.day > seen && !!state.user, bx = MJ_BRANCH[i] ? Math.sign(mjBranchPts(i)[1][0] - x) : 0;
    const R = s.big ? 21 : 17, side = i === 0 ? 0 : mjSide(x), lx = side === 0 ? x : x + side * (R + 10), anchor = side === 0 ? 'middle' : side > 0 ? 'start' : 'end', ly = side === 0 ? y + R + 18 : y - 2;
    const label = open ? esc(mjTitle(s)) : '• • •', cls = `mj-stop ${open ? 'is-open' : 'is-locked'} ${reached ? 'is-reached' : ''} ${s.big ? 'is-big' : ''} ${bx ? 'is-x' : ''}`;
    // ga đổi tuyến: hình viên thuốc nối sang tuyến phụ, đầu bên kia có vòng màu của tuyến phụ
    const disc = bx ? `<rect x="${bx > 0 ? x - R : x - R - 22}" y="${y - R}" width="${R * 2 + 22}" height="${R * 2}" rx="${R}" class="disc"/><circle cx="${x + bx * 22}" cy="${y}" r="5" class="xr" style="stroke:${MJ_LINE[(mjZone(i) + 3) % MJ_LINE.length]}"/>` : `<circle cx="${x}" cy="${y}" r="${R}" class="disc"/>`;
    stops += `<g class="${cls}" style="--lc:${MJ_LINE[mjZone(i)]}" data-act="mjOpen" data-id="${s.id}" tabindex="0" role="button" aria-label="${open ? esc(mjTitle(s)) + ' · ' : ''}${esc(t('mjs_day', { n:s.day }))}">
      <circle cx="${x}" cy="${y}" r="${R + 14}" fill="transparent"/>${open && reached ? mjGlow(c, x, y, R * 2.4, 'w', .55) : ''}${reached ? `<circle cx="${x}" cy="${y}" r="${R + 6}" class="halo"/>` : ''}${disc}
      <g transform="translate(${x} ${y}) scale(${s.big ? 1.25 : 1})" class="gl">${open ? MJ_GLYPH[s.g] : '<rect x="-5" y="-2" width="10" height="8" rx="1.5"/><path d="M-3-2v-2.5a3 3 0 0 1 6 0V-2" fill="none" stroke="currentColor" stroke-width="1.6"/>'}</g>
      ${isNew ? `<circle cx="${x + R * .72}" cy="${y - R * .72}" r="5" class="new"/>` : ''}
      <text x="${lx}" y="${ly}" text-anchor="${anchor}" class="lb">${label}</text><text x="${lx}" y="${ly + 14}" text-anchor="${anchor}" class="dy">${esc(s.day ? t('mjs_day', { n:s.day }) : t('mjs_start'))}</text></g>`;
  });
  // Moon chờ ở bờ biển cạnh trạm gặp lại; khi đã tới ngày 365 thì Moon ngồi sát bên trạm
  const [rx, ry] = mjXY(MJ_STOPS.findIndex(s => s.id === 'd365')), ms = rx < 170 ? 1 : -1, moonCat = best >= 365 ? mjGlow(c, rx - ms * 44, ry + 26, 30, 'w', .7) + mjCat(c, rx - ms * 44, ry + 36, 1.3, 'sitF') : `<g opacity=".8">${mjGlow(c, rx + ms * 150, ry + 26, 26, 'm', .8)}${mjCat(c, rx + ms * 150, ry + 34, 1.1, 'sitB')}</g>`;
  const [wx, wy] = si >= last ? mjXY(si) : mjAt(si, sf), flat = si < last && Math.abs(mjAt(si, sf + .03)[1] - mjAt(si, sf - .03)[1]) < 2, walker = state.user && n ? `<g class="mj-walker" transform="translate(${_r1(wx)} ${_r1(wy)})"><circle r="22" class="pulse"/><g class="mja mja-walk">${mjGirl(c, 0, 12, .5, 'back', { hand:[10.4, -28.4], lantern:[10.4, -28.4] })}</g>${sf > .18 && sf < .82 ? (flat ? `<text y="-34" text-anchor="middle" class="here">` : `<text x="${wx < 170 ? 26 : -26}" y="4" text-anchor="${wx < 170 ? 'start' : 'end'}" class="here">`) + `${esc(t('mjs_here'))}</text>` : ''}</g>` : '';
  return `<svg class="mj-map" viewBox="0 0 ${MJ_W} ${H}" data-wy="${_r1(wy)}" role="group" aria-label="${esc(t('mjs_road'))}"><defs>${c.d}</defs>
    ${deco}<rect width="${MJ_W}" height="${H}" class="wash"/>${branch}<g class="road-edge">${casing}</g><g class="road">${off}</g><g class="lit-glow">${glow}</g><g class="lit">${lit}</g><g class="lit-flow">${flow}</g><g class="days">${dots}</g>${moonCat}${stops}${walker}</svg>`;
}

/* ---------- các khối trên trang ---------- */
function mjMapCard(m){
  const n = m ? m.days.length : 0, best = m ? m.best : 0, preview = mjPreview(), nxt = MJ_STOPS.find(s => !mjOpen(s, best));
  const rain = mjRainOn();
  return `<section class="card mj-road"><div class="mj-road-h"><div><h2>${esc(t('mjs_road'))}</h2><p class="small muted">${esc(t('mjs_road_sub'))}</p></div>
      <button type="button" class="mj-toggle ${rain ? 'on' : ''}" data-act="mjRain" aria-pressed="${rain}">${esc(t('mjs_rain'))}</button></div>
    <div class="mj-frame"${rain ? ' data-mjrain="map"' : ''}><div class="mj-scroll" id="mj-scroll">${mjMap(n, best, preview)}</div></div>
    <div class="mj-road-f small">${nxt && state.user ? `<span>${esc(t('mjs_next', { n:nxt.day - best }))}</span>` : ''}${m && m.broken ? `<span class="faint">${esc(t('mjs_kept'))}</span>` : ''}${preview ? `<span class="faint">${esc(t('mjs_preview'))}</span>` : ''}${t('mjs_lang') ? `<span class="faint">${esc(t('mjs_lang'))}</span>` : ''}</div></section>`;
}
function mjLatestCard(m){
  const best = m ? m.best : 0, open = MJ_STOPS.filter(s => mjOpen(s, best)), s = open[open.length - 1], isNew = state.user && s.day > mjSeen();
  const body = ctext('mjc_' + s.id + '_b').split(/\n\s*\n/)[0];       // lời Trân viết cho trạm (nếu có)
  return `<section class="card mj-latest">${mjArt(s)}<div class="pad stack"><div class="row between"><span class="label">${esc(t('mjs_latest'))} · ${esc(s.day ? t('mjs_day', { n:s.day }) : t('mjs_start'))}</span>${isNew ? `<span class="badge">${esc(t('mjs_new'))}</span>` : ''}</div>
    <h3>${esc(mjTitle(s))}</h3>${body ? `<p class="mj-excerpt">${esc(body)}</p>` : ''}<button class="btn primary" data-act="mjOpen" data-id="${s.id}">${esc(t('mjs_read'))}</button></div></section>`;
}
function mjChapterHTML(s, best, preview){
  const list = MJ_STOPS.filter(z => preview || mjOpen(z, best)), i = list.indexOf(s), prev = list[i - 1], next = list[i + 1];
  const body = ctext('mjc_' + s.id + '_b');                               // trống thì khách chỉ thấy tranh và tên trạm; admin bật bút chì sẽ thấy ô để viết
  return `<article class="mj-chapter">${mjArt(s, !!state.user && mjOpen(s, best) && s.day > mjSeen())}<div class="mj-ch-body"><span class="label">${esc(s.day ? t('mjs_day', { n:s.day }) : t('mjs_start'))}${preview && !mjOpen(s, best) ? ' · ' + esc(t('mjs_preview')) : ''}</span>
    <h2 ${cms('mjc_' + s.id + '_t')}>${esc(mjTitle(s))}</h2>${body || state.editMode ? `<div class="mj-text" ${cms('mjc_' + s.id + '_b')} data-ph="${esc(t('mjs_write'))}">${esc(body)}</div>` : ''}
    <div class="row between mj-ch-nav">${prev ? `<button class="btn ghost sm" data-act="mjOpen" data-id="${prev.id}">${ic('chev-l', 'sm')} ${esc(t('mjs_prev'))}</button>` : '<span></span>'}${next ? `<button class="btn ghost sm" data-act="mjOpen" data-id="${next.id}">${esc(t('mjs_nextc'))} ${ic('chev-r', 'sm')}</button>` : ''}</div></div></article>`;
}
function mjOpenChapter(id){
  const s = mjStop(id); if (!s) return; const m = moonData(), best = m ? m.best : 0, preview = mjPreview();
  if (!preview && !mjOpen(s, best)) { toast(t('mjs_lock', { n:s.day, k:s.day - best })); return; }
  openModal(mjChapterHTML(s, best, preview)); $('dialog').classList.add('mj-dialog'); $('dialog').scrollTop = 0;
  if (state.editMode) applyEditable();
  if (state.user && mjOpen(s, best) && s.day > mjSeen()) { store.set(mjSeenKey(), s.day); render(true); }     // bỏ chữ "Mới" trên trang (hộp xem trạm không bị vẽ lại)
}
// gọi sau khi điểm danh lưu xong: có trạm mới mở thì mở ra xem luôn
function mjAfterCheckin(best){
  const fresh = MJ_STOPS.filter(s => s.day <= best && s.day > mjSeen()); if (!fresh.length) return;
  setTimeout(() => mjOpenChapter(fresh[fresh.length - 1].id), 700);
}
// sau khi vẽ trang: cuộn bản đồ tới chỗ đang đứng (lần đầu), các lần vẽ lại thì giữ chỗ người dùng đã cuộn
function mjMount(){
  const el = $('mj-scroll'); if (!el) return; const svg = el.querySelector('svg');
  if (mjScroll !== null) el.scrollTop = mjScroll;
  else { const k = el.clientWidth / MJ_W, wy = +svg.dataset.wy || mjH(); el.scrollTop = Math.max(0, wy * k - el.clientHeight * .55); }
  el.addEventListener('scroll', () => { mjScroll = el.scrollTop; }, { passive:true });
}
Object.assign(ACTIONS, {
  mjOpen: el => mjOpenChapter(el.dataset.id),
  mjRain: () => { store.set('mj_rain', !mjRainOn()); render(true); }
});
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('.mj-stop')) { e.preventDefault(); mjOpenChapter(e.target.closest('.mj-stop').dataset.id); } });
window.addEventListener('hashchange', () => { mjScroll = null; });
