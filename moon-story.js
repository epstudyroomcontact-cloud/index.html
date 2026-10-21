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
  { id:'d130', day:130, g:'moon' }, { id:'d160', day:160, g:'umb' }, { id:'d200', day:200, g:'spiral' }, { id:'d250', day:250, g:'lamp' },
  { id:'d300', day:300, g:'letter' }, { id:'d365', day:365, g:'heart', big:true }, { id:'d400', day:400, g:'moon' }, { id:'d450', day:450, g:'crown', big:true }, { id:'after', day:480, g:'paw' }
];
const mjStop = id => MJ_STOPS.find(s => s.id === id);
const mjTitle = s => ctext('mjc_' + s.id + '_t');
const mjOpen = (s, best) => s.day <= best;
const mjSeenKey = () => 'mj_seen_' + (state.user ? state.user.uid : 'guest');
const mjSeen = () => +store.get(mjSeenKey(), -1);
const mjRainOn = () => store.get('mj_rain', true) !== false;
let mjScroll = null, _mjN = 0;

/* tranh và nhân vật: moon-art.js */

/* ---------- bản đồ con đường ---------- */
const MJ_W = 340, MJ_GAP = 132, MJ_TOP = 190, MJ_BOT = 80;
const mjH = () => MJ_TOP + (MJ_STOPS.length - 1) * MJ_GAP + MJ_BOT;
const mjXY = i => [i === 0 ? 170 : i % 2 ? 84 : 256, mjH() - MJ_BOT - i * MJ_GAP];
const mjBez = (p, t) => { const u = 1 - t; return [0, 1].map(k => u * u * u * p[0][k] + 3 * u * u * t * p[1][k] + 3 * u * t * t * p[2][k] + t * t * t * p[3][k]); };
const mjSeg = i => { const a = mjXY(i), b = mjXY(i + 1), c = MJ_GAP * .62; return [a, [a[0], a[1] - c], [b[0], b[1] + c], b]; };
function mjAt(i, f){                         // điểm ở phần f (0–1) theo chiều dài đoạn i
  const p = mjSeg(i), N = 40, pts = [[0, mjBez(p, 0)]]; let L = 0;
  for (let k = 1; k <= N; k++) { const q = mjBez(p, k / N), o = pts[k - 1][1]; L += Math.hypot(q[0] - o[0], q[1] - o[1]); pts.push([L, q]); }
  const want = f * L; for (let k = 1; k <= N; k++) if (pts[k][0] >= want) { const [l0, q0] = pts[k - 1], [l1, q1] = pts[k], u = l1 > l0 ? (want - l0) / (l1 - l0) : 0; return [q0[0] + (q1[0] - q0[0]) * u, q0[1] + (q1[1] - q0[1]) * u]; }
  return pts[N][1];
}
// vị trí theo số ngày của chuỗi: [đoạn, phần trong đoạn]
function mjPos(n){
  const last = MJ_STOPS.length - 1; if (n >= MJ_STOPS[last].day) return [last, 0];
  for (let i = 0; i < last; i++) if (n < MJ_STOPS[i + 1].day) return [i, (n - MJ_STOPS[i].day) / (MJ_STOPS[i + 1].day - MJ_STOPS[i].day)];
  return [last, 0];
}
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
  const H = mjH(), r = mjRng(42), [si, sf] = mjPos(n), seen = mjSeen(); let road = '', lit = '', dots = '', stops = '', deco = '';
  // nền kiểu bút sáp: đồng cỏ đầy hoa ở dưới, bầu trời đêm xanh có mây, sao và trăng ở trên cùng
  const gy = Math.round(H * .44);
  deco += mjHatch(r, 160, [-10, 0, MJ_W + 10, gy], ['#ffffff', '#9fb6f2', '#5b7ee0', '#c8d4fa'], -8, [4, 8], .22, [30, 70]);
  deco += mjStars(r, 70, [0, 150, MJ_W, gy - 40]);
  for (let i = 0; i < 9; i++) { const cx = 20 + r() * 300, cy = 200 + r() * (gy - 260); deco += `<g fill="#fff" opacity=".85"><ellipse cx="${_r1(cx)}" cy="${_r1(cy)}" rx="26" ry="10"/><circle cx="${_r1(cx - 9)}" cy="${_r1(cy - 6)}" r="9"/><circle cx="${_r1(cx + 7)}" cy="${_r1(cy - 8)}" r="11"/></g>`; }
  deco += mjMoon('mjmap', 170, 86, 42, 1);
  deco += mjHill(r, `M0 ${gy}Q90 ${gy - 30} 170 ${gy - 10}T340 ${gy - 20}V${H}H0z`, [0, gy - 20, MJ_W, H], '#6cc94f', 420);
  deco += mjField(r, 140, [0, gy, MJ_W, H], [.7, 1.1]);
  for (let i = 0; i < MJ_STOPS.length - 1; i++) {
    const p = mjSeg(i), d = `M${p[0].join(' ')}C${p[1].join(' ')} ${p[2].join(' ')} ${p[3].join(' ')}`, a = MJ_STOPS[i].day, b = MJ_STOPS[i + 1].day;
    road += `<path d="${d}"/>`;
    if (i < si) lit += `<path d="${d}"/>`; else if (i === si && sf > 0) lit += `<path d="${d}" pathLength="1000" stroke-dasharray="${Math.round(sf * 1000)} 2000"/>`;
    const span = b - a, step = Math.max(1, Math.ceil((span - 1) / 22));
    for (let k = step; k < span; k += step) { const [x, y] = mjAt(i, k / span), on = a + k <= n; dots += `<circle cx="${_r1(x)}" cy="${_r1(y)}" r="${on ? 2.6 : 2}" class="${on ? 'on' : ''}"/>`; }
  }
  MJ_STOPS.forEach((s, i) => {
    const [x, y] = mjXY(i), open = preview || mjOpen(s, best), reached = s.day <= n, isNew = mjOpen(s, best) && s.day > seen && !!state.user, nextUp = !open && MJ_STOPS.filter(z => !mjOpen(z, best))[0] === s;
    const R = s.big ? 21 : 17, side = i === 0 ? 0 : x < 170 ? 1 : -1, lx = side === 0 ? x : x + side * (R + 10), anchor = side === 0 ? 'middle' : side > 0 ? 'start' : 'end', ly = side === 0 ? y + R + 18 : y - 2;
    const label = open || nextUp ? esc(mjTitle(s)) : '• • •', cls = `mj-stop ${open ? 'is-open' : 'is-locked'} ${reached ? 'is-reached' : ''} ${s.big ? 'is-big' : ''}`;
    stops += `<g class="${cls}" data-act="mjOpen" data-id="${s.id}" tabindex="0" role="button" aria-label="${esc(mjTitle(s))} · ${esc(t('mjs_day', { n:s.day }))}">
      <circle cx="${x}" cy="${y}" r="${R + 14}" fill="transparent"/>${reached ? `<circle cx="${x}" cy="${y}" r="${R + 9}" class="halo"/>` : ''}<circle cx="${x}" cy="${y}" r="${R}" class="disc"/>
      <g transform="translate(${x} ${y}) scale(${s.big ? 1.25 : 1})" class="gl">${open ? MJ_GLYPH[s.g] : '<rect x="-5" y="-2" width="10" height="8" rx="1.5"/><path d="M-3-2v-2.5a3 3 0 0 1 6 0V-2" fill="none" stroke="currentColor" stroke-width="1.6"/>'}</g>
      ${isNew ? `<circle cx="${x + R * .72}" cy="${y - R * .72}" r="5" class="new"/>` : ''}
      <text x="${lx}" y="${ly}" text-anchor="${anchor}" class="lb">${label}</text><text x="${lx}" y="${ly + 14}" text-anchor="${anchor}" class="dy">${esc(s.day ? t('mjs_day', { n:s.day }) : t('mjs_start'))}</text></g>`;
  });
  const [wx, wy] = si >= MJ_STOPS.length - 1 ? mjXY(si) : mjAt(si, sf), walker = state.user && n ? `<g class="mj-walker" transform="translate(${_r1(wx)} ${_r1(wy)})"><circle r="22" class="pulse"/>${mjGirl(0, 8, .62, 'umb')}${sf > .18 && sf < .82 ? `<text x="${wx < 170 ? 26 : -26}" y="4" text-anchor="${wx < 170 ? 'start' : 'end'}" class="here">${esc(t('mjs_here'))}</text>` : ''}</g>` : '';
  return `<svg class="mj-map" viewBox="0 0 ${MJ_W} ${H}" data-wy="${_r1(wy)}" role="group" aria-label="${esc(t('mjs_road'))}"><defs>
    <linearGradient id="mjmapbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a55c0"/><stop offset=".3" stop-color="#7b96ea"/><stop offset=".44" stop-color="#c3cff8"/><stop offset=".45" stop-color="#6cc94f"/><stop offset="1" stop-color="#5fbf4b"/></linearGradient>
    <pattern id="mjspk" width="23" height="19" patternUnits="userSpaceOnUse"><circle cx="3" cy="4" r=".9" fill="#fff"/><circle cx="14" cy="2" r=".6" fill="#fff"/><circle cx="19" cy="12" r="1" fill="#fff"/><circle cx="8" cy="15" r=".7" fill="#fff"/><circle cx="11" cy="9" r=".5" fill="#fff"/></pattern></defs>
    <rect width="${MJ_W}" height="${H}" fill="url(#mjmapbg)"/>
    ${deco}<g class="road-edge">${road}</g><g class="road">${road}</g><g class="road-dash">${road}</g><g class="lit-glow">${lit}</g><g class="lit">${lit}</g><g class="days">${dots}</g><rect width="${MJ_W}" height="${H}" fill="url(#mjspk)" opacity=".55" pointer-events="none"/>${stops}${walker}</svg>`;
}

/* ---------- các khối trên trang ---------- */
function mjMapCard(m){
  const n = m ? m.days.length : 0, best = m ? m.best : 0, preview = !!state.isAdmin, nxt = MJ_STOPS.find(s => !mjOpen(s, best));
  const rain = mjRainOn();
  return `<section class="card mj-road"><div class="mj-road-h"><div><h2>${esc(t('mjs_road'))}</h2><p class="small muted">${esc(t('mjs_road_sub'))}</p></div>
      <button type="button" class="mj-toggle ${rain ? 'on' : ''}" data-act="mjRain" aria-pressed="${rain}">${esc(t('mjs_rain'))}</button></div>
    <div class="mj-frame ${rain ? 'rain' : ''}"><div class="mj-scroll" id="mj-scroll">${mjMap(n, best, preview)}</div></div>
    <div class="mj-road-f small">${nxt && state.user ? `<span>${esc(t('mjs_next', { name:mjTitle(nxt), n:nxt.day - best }))}</span>` : ''}${m && m.broken ? `<span class="faint">${esc(t('mjs_kept'))}</span>` : ''}${preview ? `<span class="faint">${esc(t('mjs_preview'))}</span>` : ''}${t('mjs_lang') ? `<span class="faint">${esc(t('mjs_lang'))}</span>` : ''}</div></section>`;
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
  return `<article class="mj-chapter">${mjArt(s)}<div class="mj-ch-body"><span class="label">${esc(s.day ? t('mjs_day', { n:s.day }) : t('mjs_start'))}${preview && !mjOpen(s, best) ? ' · ' + esc(t('mjs_preview')) : ''}</span>
    <h2 ${cms('mjc_' + s.id + '_t')}>${esc(mjTitle(s))}</h2>${body || state.editMode ? `<div class="mj-text" ${cms('mjc_' + s.id + '_b')} data-ph="${esc(t('mjs_write'))}">${esc(body)}</div>` : ''}
    <div class="row between mj-ch-nav">${prev ? `<button class="btn ghost sm" data-act="mjOpen" data-id="${prev.id}">${ic('chev-l', 'sm')} ${esc(t('mjs_prev'))}</button>` : '<span></span>'}${next ? `<button class="btn ghost sm" data-act="mjOpen" data-id="${next.id}">${esc(t('mjs_nextc'))} ${ic('chev-r', 'sm')}</button>` : ''}</div></div></article>`;
}
function mjOpenChapter(id){
  const s = mjStop(id); if (!s) return; const m = moonData(), best = m ? m.best : 0, preview = !!state.isAdmin;
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
