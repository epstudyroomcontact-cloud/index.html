'use strict';
/* =========================================================
   MOON JOURNEY — CÂU CHUYỆN "ĐI TÌM MOON"
   Lớp câu chuyện vẽ trên trang Hành trình trăng (pages.js → PAGES.club). Chỉ ĐỌC chuỗi điểm danh (moonData()), không ghi thêm gì lên Firebase.
   - Con đường: mỗi ngày của chuỗi hiện tại là một bước, đi đến đâu đường sáng đến đó.
   - Trạm dừng (MJ_STOPS): mở khi chuỗi DÀI NHẤT (best) đạt số ngày của trạm, nên đứt chuỗi vẫn giữ các chương đã mở (giống huy hiệu).
   - Sau trạm 365 ngày: cứ mỗi 30 ngày mở thêm một mẩu "Những đêm sau đó" (mjn_1…6, hết thì lặp lại).
   - Chữ truyện ở moon-story-text.js. Tranh vẽ bằng SVG (mjScene); muốn thay tranh thật: bật bút chì, mở chương, bấm vào tranh
     để tải ảnh (lưu ở settings/content.images.mj_art_<trạm>).
   - Chương nào đã đọc thì nhớ trong máy (localStorage mj_seen_<uid>), chỉ để hiện chữ "Mới".
   ========================================================= */
const MJ_STOPS = [
  { id:'start', day:0, g:'umb' }, { id:'d1', day:1, g:'moon' }, { id:'d3', day:3, g:'umb' }, { id:'d7', day:7, g:'lamp' },
  { id:'d10', day:10, g:'book' }, { id:'d14', day:14, g:'half' }, { id:'d21', day:21, g:'star' }, { id:'d30', day:30, g:'full' },
  { id:'d45', day:45, g:'candle' }, { id:'d60', day:60, g:'star' }, { id:'d80', day:80, g:'bell' }, { id:'d100', day:100, g:'heart', big:true },
  { id:'d130', day:130, g:'moon' }, { id:'d160', day:160, g:'umb' }, { id:'d200', day:200, g:'spiral' }, { id:'d250', day:250, g:'lamp' },
  { id:'d300', day:300, g:'letter' }, { id:'d365', day:365, g:'crown', big:true }, { id:'after', day:395, g:'paw' }
];
const MJ_NOTES = 6, MJ_NOTE_EVERY = 30;
const mjStop = id => MJ_STOPS.find(s => s.id === id);
const mjTitle = s => ctext('mjc_' + s.id + '_t');
const mjOpen = (s, best) => s.day <= best;
const mjNotesOpen = best => best >= 365 + MJ_NOTE_EVERY ? Math.floor((best - 365) / MJ_NOTE_EVERY) : 0;
const mjSeenKey = () => 'mj_seen_' + (state.user ? state.user.uid : 'guest');
const mjSeen = () => +store.get(mjSeenKey(), -1);
const mjRainOn = () => store.get('mj_rain', true) !== false;
let mjScroll = null, _mjN = 0;

/* ---------- vẽ: tiện ích ---------- */
const _r1 = n => Math.round(n * 10) / 10;
function mjRng(seed){ let a = seed >>> 0 || 1; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const mjPick = (r, a) => a[Math.floor(r() * a.length)];
// nét cọ: những vệt cong ngắn, màu lệch nhau một chút, như lớp sơn quét chồng lên nhau
function mjStrokes(r, n, box, cols, w = [3, 8], op = .32, len = [18, 54]){
  const [x0, y0, x1, y1] = box; let s = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), l = len[0] + r() * (len[1] - len[0]), b = (r() - .5) * l * .35;
    s += `<path d="M${_r1(x)} ${_r1(y)}q${_r1(l / 2)} ${_r1(b)} ${_r1(l)} ${_r1(b * .3)}" stroke="${mjPick(r, cols)}" stroke-width="${_r1(w[0] + r() * (w[1] - w[0]))}" opacity="${_r1(op * (.6 + r() * .8) * 100) / 100}"/>`;
  }
  return `<g fill="none" stroke-linecap="round">${s}</g>`;
}
function mjStars(r, n, box, big = .12){
  const [x0, y0, x1, y1] = box; let s = '';
  for (let i = 0; i < n; i++) {
    const x = _r1(x0 + r() * (x1 - x0)), y = _r1(y0 + Math.pow(r(), 1.4) * (y1 - y0)), z = r();
    s += z < big ? `<path d="M${x} ${_r1(y - 4)}L${_r1(x + 1)} ${_r1(y - 1)}L${_r1(x + 4)} ${y}L${_r1(x + 1)} ${_r1(y + 1)}L${x} ${_r1(y + 4)}L${_r1(x - 1)} ${_r1(y + 1)}L${_r1(x - 4)} ${y}L${_r1(x - 1)} ${_r1(y - 1)}Z" fill="#fff6d6"/>`
      : `<circle cx="${x}" cy="${y}" r="${_r1(.5 + z * 1.3)}" fill="#fff6d6" opacity="${_r1((.4 + z * .6) * 10) / 10}"/>`;
  }
  return s;
}
// trăng: f = độ tròn (0–1), có quầng sáng
function mjMoon(id, x, y, R, f = 1, glow = 1){
  const off = f >= 1 ? 0 : _r1(R * 2 * f + R * .15), mk = id + 'm' + Math.round(x);
  return `<circle cx="${x}" cy="${y}" r="${R * 3}" fill="url(#${id}g)" opacity="${glow}"/>${f >= 1 ? '' : `<mask id="${mk}"><rect x="${x - R - 2}" y="${y - R - 2}" width="${R * 2 + 4}" height="${R * 2 + 4}" fill="#fff"/><circle cx="${_r1(x - off)}" cy="${y}" r="${R}" fill="#000"/></mask>`}<g ${f >= 1 ? '' : `mask="url(#${mk})"`}><circle cx="${x}" cy="${y}" r="${R}" fill="#fbe7a1"/><circle cx="${_r1(x + R * .25)}" cy="${_r1(y - R * .2)}" r="${_r1(R * .22)}" fill="#efd27e" opacity=".6"/><circle cx="${_r1(x - R * .3)}" cy="${_r1(y + R * .3)}" r="${_r1(R * .14)}" fill="#efd27e" opacity=".5"/></g>`;
}
// mặt nước xoáy: các vòng elip ghép từ nét cọ ngắn, xen hạt sáng
function mjSwirl(r, cx, cy, rmax, cols, flat = .42, n = 26){
  let s = '';
  for (let i = 1; i <= n; i++) {
    const R = rmax * i / n, ry = R * flat, segs = 3 + Math.floor(R / 18);
    for (let k = 0; k < segs; k++) {
      const a0 = (k / segs) * Math.PI * 2 + r() * .4, a1 = a0 + (Math.PI * 2 / segs) * (.45 + r() * .5);
      const p = a => `${_r1(cx + Math.cos(a) * R)} ${_r1(cy + Math.sin(a) * ry)}`;
      s += `<path d="M${p(a0)}A${_r1(R)} ${_r1(ry)} 0 0 1 ${p(a1)}" stroke="${mjPick(r, cols)}" stroke-width="${_r1(2 + r() * 5)}" opacity="${_r1((.5 + r() * .5) * 10) / 10}"/>`;
    }
    if (i % 3 === 0) for (let k = 0; k < 3; k++) { const a = r() * Math.PI * 2; s += `<ellipse cx="${_r1(cx + Math.cos(a) * R)}" cy="${_r1(cy + Math.sin(a) * ry)}" rx="${_r1(1 + r() * 2.5)}" ry="${_r1(.6 + r())}" fill="#d8ecff" opacity=".55"/>`; }
  }
  return `<g fill="none" stroke-linecap="round">${s}</g>`;
}
function mjRain(r, W, H, n = 46){
  let s = '';
  for (let i = 0; i < n; i++) { const x = r() * (W + 40) - 20, y0 = r() * 60, l = 8 + r() * 10; for (let y = y0 - 60; y < H; y += 60) s += `M${_r1(x)} ${_r1(y)}l-2 ${_r1(l)}`; }
  return `<g class="mj-rain"><path d="${s}" stroke="#bcd6f0" stroke-width="1.1" stroke-linecap="round" opacity=".38"/></g>`;
}
function mjLamp(id, x, gy, h = 120, on = 1){
  const top = gy - h;
  return `<ellipse cx="${x}" cy="${gy}" rx="70" ry="12" fill="url(#${id}w)" opacity="${.7 * on}"/><path d="M${x - 30} ${gy} L${x - 9} ${top + 8} L${x + 9} ${top + 8} L${x + 30} ${gy}Z" fill="#ffd27a" opacity="${.1 * on}"/><circle cx="${x}" cy="${top + 4}" r="34" fill="url(#${id}w)" opacity="${.85 * on}"/>
    <path d="M${x} ${gy}V${top + 6}" stroke="#0c1424" stroke-width="4"/><path d="M${x - 9} ${top + 8}h18l-3 -10h-12z" fill="#0c1424"/><rect x="${x - 6}" y="${top + 8}" width="12" height="6" rx="2" fill="#ffe2a0" opacity="${on}"/>`;
}
const MJ_UMB = 'M-30 0Q-30-26 0-28Q30-26 30 0Q22.5-6 15 0Q7.5-6 0 0Q-7.5-6-15 0Q-22.5-6-30 0Z';
function mjUmbrella(x, y, s = 1, rot = 0, col = '#ff5fa0', handle = true){
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="${MJ_UMB}" fill="${col}"/><path d="M-30 0Q-30-26 0-28" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2"/>${handle ? '<path d="M0-28V24q0 6-6 6" fill="none" stroke="#0c1424" stroke-width="2.4" stroke-linecap="round"/>' : ''}</g>`;
}
// mèo đen ngồi (nhìn thẳng), cuộn tròn ngủ, hoặc chỉ thấy hai mắt trong bóng tối; (0,0) = chân
function mjCat(x, y, s = 1, pose = 'sit', o = {}){
  const fur = o.fur || '#0b0d14', eye = o.eye || '#f6c64a', glow = o.glow ? `<ellipse cx="0" cy="-30" rx="48" ry="44" fill="url(#${o.glow}w)" opacity=".9"/>` : '';
  let b;
  if (pose === 'curl') b = `<ellipse cx="0" cy="-11" rx="27" ry="12" fill="${fur}"/><circle cx="-19" cy="-14" r="10" fill="${fur}"/><path d="M-27-20l1-11 7 7zM-14-21l3-10 4 8z" fill="${fur}"/><path d="M24-6q10 2 4 8q-14 4-36 0" fill="none" stroke="${fur}" stroke-width="5" stroke-linecap="round"/><path d="M-24-14q2 2 4 0M-17-15q2 2 4 0" stroke="${eye}" stroke-width="1.2" fill="none" opacity=".8"/>`;
  else if (pose === 'eyes') b = `<ellipse cx="0" cy="-22" rx="18" ry="20" fill="${fur}" opacity=".55"/><circle cx="-6" cy="-30" r="4" fill="${eye}"/><circle cx="6" cy="-30" r="4" fill="${eye}"/><circle cx="-6" cy="-30" r="1.6" fill="#111"/><circle cx="6" cy="-30" r="1.6" fill="#111"/>`;
  else b = `<path d="M-16 0C-21-18-14-33 0-33C14-33 21-18 16 0Z" fill="${fur}"/><path d="M14-3C30-5 33-21 26-30" fill="none" stroke="${fur}" stroke-width="5" stroke-linecap="round"/><circle cx="0" cy="-41" r="14" fill="${fur}"/><path d="M-13-46l1-16 9 9zM13-46l-1-16-9 9z" fill="${fur}"/>
    <circle cx="-5.6" cy="-42" r="4.6" fill="${eye}"/><circle cx="5.6" cy="-42" r="4.6" fill="${eye}"/><circle cx="-5" cy="-41.6" r="1.8" fill="#111"/><circle cx="6.2" cy="-41.6" r="1.8" fill="#111"/><circle cx="-6.6" cy="-43.4" r=".9" fill="#fff"/><circle cx="4.6" cy="-43.4" r=".9" fill="#fff"/><path d="M-1-37.5h2l-1 1.2z" fill="#e88"/>
    <path d="M-8-37h-9M-8-36l-8 2M8-37h9M8-36l8 2" stroke="#c9d6ea" stroke-width=".5" opacity=".7"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})">${glow}${o.shadow ? `<ellipse cx="${o.shadow}" cy="2" rx="22" ry="5" fill="#04101e" opacity=".5"/>` : ''}${b}</g>`;
}
// người (nhìn từ sau lưng), có thể cầm ô
function mjPerson(x, y, s = 1, o = {}){
  const c = o.col || '#121c33', u = o.umb === false ? '' : mjUmbrella(4, -62, .95, o.tilt || -6, o.umbCol || '#ff5fa0', false);
  return `<g transform="translate(${x} ${y}) scale(${s})">${u}${o.umb === false ? '' : '<path d="M4-62L2-34" stroke="#0a1222" stroke-width="2.4"/>'}<g stroke="#4a6a9a" stroke-width=".8"><path d="M-11 0L-9-34Q0-40 9-34L11 0Z" fill="${c}"/><circle cx="0" cy="-43" r="7.5" fill="${c}"/></g><path d="M-7-44q0-9 7-9t7 9q-3-4-7-4t-7 4z" fill="${c}"/><path d="M-6 0v5M6 0v5" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/></g>`;
}
function mjRoom(r, id, o = {}){        // phòng tối: tường, sàn/bàn, cửa sổ có trăng
  const wx = o.wx ?? 236, wy = o.wy ?? 30, ww = o.ww ?? 120, wh = o.wh ?? 120;
  return `<rect width="400" height="250" fill="url(#${id}room)"/>${mjStrokes(r, 46, [0, 0, 400, 250], ['#1b2a45', '#22355a', '#141f36', '#2a3c62'], [4, 10], .35)}
    <rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="4" fill="url(#${id}sky)"/>${mjStars(r, 14, [wx + 4, wy + 4, wx + ww - 4, wy + wh - 4])}${o.moon !== false ? mjMoon(id, wx + ww * .62, wy + wh * .34, o.mr || 16, o.mf ?? 1) : ''}
    ${o.rain ? `<g clip-path="url(#${id}win)">${mjRain(r, 400, 250, 30).replace('mj-rain', 'mj-rain-still')}</g><clipPath id="${id}win"><rect x="${wx}" y="${wy}" width="${ww}" height="${wh}"/></clipPath>` : ''}
    <path d="M${wx + ww / 2} ${wy}v${wh}M${wx} ${wy + wh / 2}h${ww}" stroke="#0d1628" stroke-width="5"/><rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="4" fill="none" stroke="#0d1628" stroke-width="8"/>
    <path d="M${wx - 10} ${wy + wh + 6}h${ww + 20}" stroke="#0d1628" stroke-width="7" stroke-linecap="round"/>
    ${o.beam !== false ? `<path d="M${wx} ${wy + wh} L${wx + ww} ${wy + wh} L${wx + ww - 60} 250 L${wx - 150} 250Z" fill="#cfe3ff" opacity=".07"/>` : ''}`;
}
function mjDesk(r, y = 196){ return `<rect x="0" y="${y}" width="400" height="${250 - y}" fill="#0f182b"/>${mjStrokes(r, 18, [0, y + 2, 400, 250], ['#1a2740', '#0b1322', '#22324f'], [3, 7], .5, [30, 80])}<path d="M0 ${y}h400" stroke="#2a3a5c" stroke-width="2"/>`; }

/* ---------- các cảnh (400×250). Mỗi cảnh là một hàm vẽ phần thân; khung + bộ lọc cọ vẽ ở mjScene ---------- */
const MJ_SKY = { rain:['#08111f', '#1c3554'], night:['#071228', '#1f4a76'], star:['#050a1a', '#18305e'], warm:['#0d1e3d', '#3d6d96'] };
const MJ_BLUES = ['#16395c', '#1f4d78', '#2b6797', '#3c82b5', '#5c9fcd', '#123050'];
const MJ_SCENES = {
  start:(r, id) => `${mjStrokes(r, 70, [0, 0, 400, 190], ['#17304f', '#22416a', '#0e2036', '#2c4f7a'], [5, 12], .4, [30, 90])}${mjMoon(id, 92, 52, 15, .35, .5)}${mjStrokes(r, 14, [40, 36, 170, 70], ['#1d3858', '#26476e'], [8, 14], .8, [40, 80])}
    <rect y="190" width="400" height="60" fill="#0b1527"/>${mjStrokes(r, 30, [0, 192, 400, 250], ['#183252', '#0f2038', '#2a4a70'], [2, 6], .6, [30, 90])}${mjLamp(id, 312, 196, 128)}<ellipse cx="312" cy="222" rx="40" ry="6" fill="#ffd27a" opacity=".22"/>${mjPerson(150, 214, 1.25)}`,
  d1:(r, id) => `${mjStrokes(r, 70, [0, 0, 400, 190], ['#162c48', '#1f3d63', '#0d1d33'], [5, 12], .4, [30, 90])}${mjMoon(id, 300, 50, 22, 1, .9)}${mjStrokes(r, 10, [200, 30, 380, 60], ['#1d3858', '#26476e', '#122440'], [8, 14], .7, [40, 90])}
    <path d="M0 96h190l20 22H0z" fill="#060c18"/><rect y="118" width="196" height="80" fill="#0a1222" opacity=".8"/><rect y="194" width="400" height="56" fill="#0b1527"/>${mjStrokes(r, 30, [0, 196, 400, 250], ['#183252', '#0f2038', '#2a4a70'], [2, 6], .6, [30, 90])}
    ${mjCat(150, 204, .62, 'sit', { shadow:-10 })}${mjLamp(id, 360, 198, 140, .7)}`,
  d3:(r, id) => `${mjRoom(r, id, { wx:40, wy:26, ww:96, wh:92, rain:1, moon:false, beam:false })}${mjDesk(r, 188)}<circle cx="300" cy="80" r="80" fill="url(#${id}w)" opacity=".35"/>
    ${mjUmbrella(110, 200, 1.5, -18)}<path d="M120 172l14-6" stroke="#ff9cc4" stroke-width="2"/><ellipse cx="262" cy="214" rx="38" ry="9" fill="#e8708f" opacity=".85"/>${mjCat(262, 214, 1.05, 'curl')}`,
  d7:(r, id) => `${mjStrokes(r, 60, [0, 0, 400, 180], ['#152b47', '#1d3a5f', '#0d1c31'], [5, 12], .4, [30, 90])}<rect y="180" width="400" height="70" fill="#0b1527"/>${mjStrokes(r, 26, [0, 182, 400, 250], ['#183252', '#0f2038'], [2, 6], .6, [30, 90])}
    ${mjLamp(id, 200, 186, 150)}<ellipse cx="236" cy="222" rx="64" ry="13" fill="#2b5580" opacity=".8"/><ellipse cx="236" cy="222" rx="64" ry="13" fill="url(#${id}w)" opacity=".5"/><path d="M200 214v18" stroke="#ffe2a0" stroke-width="3" opacity=".4"/>
    <g transform="translate(252 220)" fill="#0b0d14" opacity=".85"><ellipse rx="5" ry="4"/><circle cx="-6" cy="-6" r="2"/><circle cx="-2" cy="-9" r="2"/><circle cx="3" cy="-9" r="2"/><circle cx="7" cy="-6" r="2"/></g>`,
  d10:(r, id) => `${mjRoom(r, id, { wx:220, wy:24, ww:130, wh:110, mf:.6 })}${mjDesk(r, 168)}<rect x="40" y="132" width="86" height="36" rx="3" fill="#18233a"/><rect x="46" y="128" width="74" height="6" fill="#273657"/>
    <path d="M150 160l90-6 10 10-92 6z" fill="#e8e2d0" opacity=".85"/><path d="M160 162l70-4M162 166l60-4" stroke="#9aa8c4" stroke-width=".8"/><path d="M262 156l38-6" stroke="#ff5fa0" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="330" cy="176" rx="42" ry="9" fill="#cfe3ff" opacity=".22"/>`,
  d14:(r, id) => `${mjStrokes(r, 50, [0, 0, 400, 104], ['#0d1f3a', '#173156', '#22477a'], [4, 10], .45, [30, 80])}${mjStars(r, 26, [0, 0, 400, 90])}${mjMoon(id, 92, 46, 18, .5)}
    <rect y="100" width="400" height="150" fill="#123050"/>${mjSwirl(r, 236, 182, 250, MJ_BLUES, .36, 30)}<ellipse cx="236" cy="184" rx="26" ry="7" fill="#9cc8ec" opacity=".35"/>${mjCat(236, 188, .62, 'sit', { shadow:14 })}`,
  d21:(r, id) => `${mjStrokes(r, 50, [0, 0, 400, 200], ['#0a1630', '#13285a', '#1c3a72'], [4, 10], .45, [30, 80])}${mjStars(r, 70, [0, 0, 400, 190], .2)}
    <path d="M0 214Q120 182 220 196T400 190V250H0z" fill="#0a1426"/>${mjStrokes(r, 18, [0, 200, 400, 250], ['#132544', '#0b1730'], [3, 7], .6)}
    <circle cx="200" cy="168" r="60" fill="url(#${id}w)"/>${mjUmbrella(200, 188, 1.5, 180, '#ff5fa0', false)}<circle cx="200" cy="170" r="9" fill="#fff3c4"/><path d="M200 156l3 10 10 4-10 4-3 10-3-10-10-4 10-4z" fill="#fffbe8"/>`,
  d30:(r, id) => `${mjRoom(r, id, { wx:150, wy:16, ww:150, wh:140, mr:30 })}${mjDesk(r, 200)}<path d="M150 156L300 156L340 250L60 250Z" fill="#fbe7a1" opacity=".08"/>
    <ellipse cx="206" cy="214" rx="64" ry="14" fill="#2c3f66"/><ellipse cx="206" cy="210" rx="54" ry="10" fill="#3b5486"/>${mjCat(212, 214, 1.05, 'curl', { fur:'#0b0d14' })}<ellipse cx="206" cy="204" rx="60" ry="12" fill="#fbe7a1" opacity=".1"/>`,
  d45:(r, id) => `${mjRoom(r, id, { wx:262, wy:30, ww:100, wh:96, mr:12, mf:.8 })}<rect x="30" y="140" width="210" height="8" fill="#26375a"/><rect x="30" y="148" width="210" height="4" fill="#0b1322"/>
    <circle cx="150" cy="120" r="50" fill="url(#${id}w)"/><path d="M84 140q0-18 26-18t26 18z" fill="#e8708f"/><path d="M84 140h52" stroke="#ff9cc4" stroke-width="2"/><rect x="160" y="112" width="10" height="28" rx="2" fill="#efe6d2"/><path d="M165 112q-5-8 0-16q5 8 0 16z" fill="#ffcf6b"/>
    <rect x="190" y="104" width="34" height="36" rx="2" fill="#16233c" stroke="#2c3f66" stroke-width="2"/>${mjMoon(id, 207, 122, 7, 1, .4)}${mjDesk(r, 214)}`,
  d60:(r, id) => `${mjStrokes(r, 50, [0, 0, 400, 150], ['#0a1630', '#13285a', '#1c3a72'], [4, 10], .45, [30, 80])}${mjStars(r, 60, [0, 0, 400, 140], .15)}
    <path d="M0 150Q200 130 400 152V250H0z" fill="#0b1a33"/>${mjStrokes(r, 30, [0, 150, 400, 250], ['#132a4a', '#0e2140', '#1a3660'], [3, 7], .6)}${mjStars(r, 46, [0, 156, 400, 248], .3)}
    <g transform="translate(250 214)"><ellipse cx="0" cy="-16" rx="44" ry="30" fill="url(#${id}w)" opacity=".8"/><path d="M-26 0v-14q0-10 10-12h22q8-10 14-10l4 6q6 2 4 8l-6 2v20M-20 0v-8M12 0v-10M-26-18q-10-4-10-12" fill="none" stroke="#fff3c4" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/></g>${mjPerson(150, 220, 1.1, { umb:false })}`,
  d80:(r, id) => `${mjStrokes(r, 60, [0, 0, 400, 250], ['#0c1a35', '#173062', '#0a1530'], [5, 12], .45, [30, 90])}${mjStars(r, 40, [0, 0, 400, 160])}${mjMoon(id, 330, 46, 20, .85)}
    <path d="M0 250L0 220Q160 210 260 120T400 60V250z" fill="#0a1426"/><path d="M20 238Q170 214 270 128T392 72" stroke="#f6c64a" stroke-width="2" stroke-dasharray="3 7" fill="none" opacity=".6"/>${mjPerson(176, 202, .7, { umb:false })}
    <path d="M330 66V112" stroke="#ff5fa0" stroke-width="2"/><circle cx="330" cy="124" r="26" fill="url(#${id}w)"/><path d="M318 132q0-20 12-20t12 20z" fill="#f6c64a"/><circle cx="330" cy="134" r="3" fill="#b8892a"/>`,
  d100:(r, id) => `<rect width="400" height="250" fill="url(#${id}warm)"/>${mjStrokes(r, 60, [0, 0, 400, 140], ['#1b3762', '#25497a', '#36639a'], [5, 12], .4, [30, 90])}${mjStars(r, 30, [0, 0, 400, 100])}${mjMoon(id, 200, 70, 42, 1, 1)}
    <rect y="140" width="400" height="110" fill="#1d4670"/>${mjSwirl(r, 200, 198, 230, ['#2a5f8f', '#3c7bb0', '#5c9fcd', '#f3d58c', '#21507e'], .26, 22)}<ellipse cx="200" cy="168" rx="30" ry="40" fill="#fbe7a1" opacity=".22"/>
    ${mjCat(214, 206, .78, 'sit', { glow:id })}${mjPerson(140, 220, 1.05, { umb:false })}`,
  d130:(r, id) => `${mjRoom(r, id, { wx:120, wy:22, ww:160, wh:130, mr:20 })}${mjDesk(r, 176)}<ellipse cx="200" cy="164" rx="34" ry="6" fill="#fbe7a1" opacity=".45"/>
    <g opacity=".45">${mjCat(200, 162, .55, 'sit', { fur:'#cfe3ff', eye:'#fff3c4' })}</g><rect x="60" y="150" width="70" height="26" rx="2" fill="#18233a"/><path d="M300 168h50" stroke="#e8e2d0" stroke-width="5"/>`,
  d160:(r, id) => `${mjStrokes(r, 60, [0, 0, 400, 190], ['#152b47', '#1d3a5f', '#0d1c31'], [5, 12], .4, [30, 90])}<rect y="190" width="400" height="60" fill="#0b1527"/>${mjStrokes(r, 26, [0, 192, 400, 250], ['#183252', '#0f2038'], [2, 6], .6, [30, 90])}
    ${mjLamp(id, 70, 196, 130)}<path d="M250 70h150v120H250z" fill="#070d1a"/><path d="M240 70h160l-10 14H250z" fill="#05090f"/><rect x="280" y="100" width="40" height="40" fill="#ffd27a" opacity=".25"/>
    ${mjPerson(196, 220, 1.2, { umb:false })}${mjPerson(226, 222, 1.05, { umb:false, col:'#101a30' })}${mjUmbrella(214, 150, 1.6, 4, '#ff5fa0', false)}<path d="M214 150V178" stroke="#0a1222" stroke-width="2.4"/>`,
  d200:(r, id) => { let g = ''; for (let i = 0; i < 260; i++) { const a = i * .11, k = i % 2 ? Math.PI : 0, rr = 4 + i * .55, x = 220 + Math.cos(a + k) * rr * 1.5, y = 96 + Math.sin(a + k) * rr * .62; g += `<circle cx="${_r1(x + (r() - .5) * 8)}" cy="${_r1(y + (r() - .5) * 5)}" r="${_r1(.6 + r() * 2.2)}" fill="${mjPick(r, ['#fff3c4', '#cfe3ff', '#f6c64a', '#9cc8ec'])}" opacity="${_r1((.4 + r() * .6) * 10) / 10}"/>`; }
    return `${mjStrokes(r, 60, [0, 0, 400, 250], ['#070f26', '#101f48', '#1a2f66'], [5, 12], .5, [30, 90])}${mjStars(r, 40, [0, 0, 400, 200])}<ellipse cx="220" cy="96" rx="150" ry="60" fill="url(#${id}w)" opacity=".5"/>${g}<circle cx="220" cy="96" r="8" fill="#fff6d6"/>
      <path d="M0 214h180q30 0 40 36H0z" fill="#070d1a"/>${mjPerson(96, 214, 1, { umb:false })}${mjCat(132, 214, .5, 'sit')}`; },
  d250:(r, id) => `${mjStrokes(r, 60, [0, 0, 400, 180], ['#162e4d', '#204268', '#0e1f36'], [5, 12], .4, [30, 90])}${mjMoon(id, 300, 54, 20, 1, .8)}<rect y="180" width="400" height="70" fill="#0c1729"/>${mjStrokes(r, 26, [0, 182, 400, 250], ['#183252', '#0f2038'], [2, 6], .6, [30, 90])}
    <ellipse cx="290" cy="220" rx="70" ry="12" fill="#21466e"/>${mjMoon(id, 300, 220, 8, 1, .5)}${mjLamp(id, 80, 186, 130)}${mjPerson(196, 212, 1.2, { tilt:4 })}`,
  d300:(r, id) => `${mjRoom(r, id, { wx:250, wy:20, ww:110, wh:100, mr:12, mf:.9 })}${mjDesk(r, 150)}<g transform="rotate(-6 170 196)"><rect x="96" y="160" width="150" height="76" rx="2" fill="#efe6d2"/><path d="M110 178h110M110 190h120M110 202h96M110 214h60" stroke="#8b97b1" stroke-width="1.2"/>
    <g transform="translate(222 220)" fill="#e8708f"><ellipse rx="5" ry="4"/><circle cx="-6" cy="-6" r="2"/><circle cx="-2" cy="-9" r="2"/><circle cx="3" cy="-9" r="2"/><circle cx="7" cy="-6" r="2"/></g></g><path d="M270 190l70-26" stroke="#ff5fa0" stroke-width="4" stroke-linecap="round"/>`,
  d365:(r, id) => `${mjStrokes(r, 60, [0, 0, 400, 180], ['#0c1a35', '#173062', '#22447e'], [5, 12], .45, [30, 90])}${mjStars(r, 50, [0, 0, 400, 170], .18)}${mjMoon(id, 300, 60, 30, 1)}
    <path d="M0 200Q200 170 400 204V250H0z" fill="#0a1426"/>${mjStrokes(r, 18, [0, 196, 400, 250], ['#132544', '#0b1730'], [3, 7], .6)}${mjPerson(170, 222, 1.2, { umb:false })}<circle cx="182" cy="168" r="30" fill="url(#${id}w)"/><circle cx="182" cy="168" r="7" fill="#fff3c4"/>${mjCat(222, 222, .55, 'sit')}`,
  after:(r, id) => `${mjRoom(r, id, { wx:140, wy:20, ww:140, wh:120, mr:14, mf:.7 })}${mjDesk(r, 170)}<path d="M330 182q16-12 30-2q-14 10-30 2z" fill="#c98a3a"/><path d="M330 182l30-2" stroke="#7a4f1f" stroke-width="1"/>`
};
function mjScene(id, seed){
  const k = 'mjs' + (++_mjN), r = mjRng(seed || 7), sky = MJ_SKY[{ start:'rain', d1:'rain', d7:'rain', d160:'rain', d250:'rain', d100:'warm' }[id] || 'night'];
  const rainy = { start:1, d1:1, d7:1, d160:1, d250:.6 }[id];
  return `<svg class="mj-scene" viewBox="0 0 400 250" role="img" aria-label="${esc(mjTitle(mjStop(id)))}" preserveAspectRatio="xMidYMid slice"><defs>
    <linearGradient id="${k}bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient>
    <linearGradient id="${k}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1836"/><stop offset="1" stop-color="#26507e"/></linearGradient>
    <linearGradient id="${k}room" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1528"/><stop offset="1" stop-color="#18243e"/></linearGradient>
    <linearGradient id="${k}warm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1e3d"/><stop offset=".55" stop-color="#2d5b88"/><stop offset="1" stop-color="#1d4670"/></linearGradient>
    <radialGradient id="${k}g"><stop offset="0" stop-color="#fbe7a1" stop-opacity=".5"/><stop offset=".35" stop-color="#fbe7a1" stop-opacity=".14"/><stop offset="1" stop-color="#fbe7a1" stop-opacity="0"/></radialGradient>
    <radialGradient id="${k}w"><stop offset="0" stop-color="#ffd98a" stop-opacity=".75"/><stop offset=".5" stop-color="#ffc35e" stop-opacity=".18"/><stop offset="1" stop-color="#ffc35e" stop-opacity="0"/></radialGradient>
    <filter id="${k}f" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="${seed || 3}"/><feDisplacementMap in="SourceGraphic" scale="5"/></filter>
    <filter id="${k}n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="1" seed="2"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0"/><feComposite in2="SourceGraphic" operator="in"/></filter></defs>
    <rect width="400" height="250" fill="url(#${k}bg)"/><g filter="url(#${k}f)">${(MJ_SCENES[id] || MJ_SCENES.after)(r, k)}</g>
    ${rainy && mjRainOn() ? `<g opacity="${rainy}">${mjRain(r, 400, 250)}</g>` : ''}<rect width="400" height="250" fill="#fff" filter="url(#${k}n)" opacity=".07" style="mix-blend-mode:overlay"/></svg>`;
}
const mjArt = s => { const u = cimg('mj_art_' + s.id); return `<div class="mj-art" data-cms-img="mj_art_${s.id}">${u ? `<img alt="" src="${esc(u)}" loading="lazy">` : mjScene(s.id, 11 + MJ_STOPS.indexOf(s) * 7)}</div>`; };

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
  letter:'<rect x="-8" y="-5" width="16" height="11" rx="1.5"/><path d="M-8-4l8 6 8-6" fill="none" stroke="#0d1d36" stroke-width="1.2"/>', crown:'<path d="M-8 5v-9l4 4 4-6 4 6 4-4v9z"/>',
  paw:'<ellipse cy="3" rx="4" ry="3.4"/><circle cx="-5" cy="-3" r="1.8"/><circle cx="-1.7" cy="-6" r="1.8"/><circle cx="1.7" cy="-6" r="1.8"/><circle cx="5" cy="-3" r="1.8"/>'
};
function mjMap(n, best, preview){
  const H = mjH(), r = mjRng(42), [si, sf] = mjPos(n), seen = mjSeen(); let road = '', lit = '', dots = '', stops = '', deco = '';
  // nền: mưa ở dưới, sao dày dần khi lên cao, trăng lớn ở trên cùng
  deco += mjStrokes(r, 120, [-20, 0, MJ_W + 20, H], ['#14294a', '#1a3560', '#0f2140', '#21426f'], [6, 16], .35, [40, 120]);
  deco += mjStars(r, 150, [0, 0, MJ_W, H * .7], .1);
  deco += mjMoon('mjmap', 170, 86, 40, 1, 1);
  for (let i = 1; i < MJ_STOPS.length - 1; i += 3) { const [x, y] = mjXY(i), lx = x < 170 ? x + 64 : x - 64; if (i < 8) deco += `<g opacity=".8">${mjLamp('mjmap', lx, y + 50, 46, .6)}</g>`; }
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
  const [wx, wy] = si >= MJ_STOPS.length - 1 ? mjXY(si) : mjAt(si, sf), walker = state.user && n ? `<g class="mj-walker" transform="translate(${_r1(wx)} ${_r1(wy)})"><circle r="22" class="pulse"/>${mjUmbrella(0, -8, .5, -8)}${sf > .18 && sf < .82 ? `<text x="${wx < 170 ? 26 : -26}" y="4" text-anchor="${wx < 170 ? 'start' : 'end'}" class="here">${esc(t('mjs_here'))}</text>` : ''}</g>` : '';
  return `<svg class="mj-map" viewBox="0 0 ${MJ_W} ${H}" data-wy="${_r1(wy)}" role="group" aria-label="${esc(t('mjs_road'))}"><defs><radialGradient id="mjmapg"><stop offset="0" stop-color="#fbe7a1" stop-opacity=".5"/><stop offset=".35" stop-color="#fbe7a1" stop-opacity=".14"/><stop offset="1" stop-color="#fbe7a1" stop-opacity="0"/></radialGradient>
    <radialGradient id="mjmapw"><stop offset="0" stop-color="#ffd98a" stop-opacity=".75"/><stop offset=".5" stop-color="#ffc35e" stop-opacity=".18"/><stop offset="1" stop-color="#ffc35e" stop-opacity="0"/></radialGradient>
    <linearGradient id="mjmapbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050b1c"/><stop offset=".5" stop-color="#0c1d3a"/><stop offset="1" stop-color="#0b1626"/></linearGradient></defs>
    <rect width="${MJ_W}" height="${H}" fill="url(#mjmapbg)"/>
    ${deco}<g class="road-edge">${road}</g><g class="road">${road}</g><g class="road-dash">${road}</g><g class="lit-glow">${lit}</g><g class="lit">${lit}</g><g class="days">${dots}</g>${stops}${walker}</svg>`;
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
  const body = ctext('mjc_' + s.id + '_b').split(/\n\s*\n/)[0];
  return `<section class="card mj-latest">${mjArt(s)}<div class="pad stack"><div class="row between"><span class="label">${esc(t('mjs_latest'))} · ${esc(s.day ? t('mjs_day', { n:s.day }) : t('mjs_start'))}</span>${isNew ? `<span class="badge">${esc(t('mjs_new'))}</span>` : ''}</div>
    <h3>${esc(mjTitle(s))}</h3><p class="mj-excerpt">${esc(body)}</p><button class="btn primary" data-act="mjOpen" data-id="${s.id}">${esc(t('mjs_read'))}</button></div></section>`;
}
function mjChapterHTML(s, best, preview){
  const list = MJ_STOPS.filter(z => preview || mjOpen(z, best)), i = list.indexOf(s), prev = list[i - 1], next = list[i + 1];
  let notes = '';
  if (s.id === 'after') { const k = preview ? MJ_NOTES : mjNotesOpen(best); notes = k ? `<p class="small faint">${esc(t('mjs_notes', { n:k }))}</p><ol class="mj-notes">${Array.from({ length:k }, (_, j) => `<li ${cms('mjn_' + (j % MJ_NOTES + 1))}>${esc(ctext('mjn_' + (j % MJ_NOTES + 1)))}</li>`).join('')}</ol>` : ''; }
  return `<article class="mj-chapter">${mjArt(s)}<div class="mj-ch-body"><span class="label">${esc(s.day ? t('mjs_day', { n:s.day }) : t('mjs_start'))}${preview && !mjOpen(s, best) ? ' · ' + esc(t('mjs_preview')) : ''}</span>
    <h2 ${cms('mjc_' + s.id + '_t')}>${esc(mjTitle(s))}</h2><div class="mj-text" ${cms('mjc_' + s.id + '_b')}>${esc(ctext('mjc_' + s.id + '_b'))}</div>${notes}
    <div class="row between mj-ch-nav">${prev ? `<button class="btn ghost sm" data-act="mjOpen" data-id="${prev.id}">${ic('chev-l', 'sm')} ${esc(t('mjs_prev'))}</button>` : '<span></span>'}${next ? `<button class="btn ghost sm" data-act="mjOpen" data-id="${next.id}">${esc(t('mjs_nextc'))} ${ic('chev-r', 'sm')}</button>` : ''}</div></div></article>`;
}
function mjOpenChapter(id){
  const s = mjStop(id); if (!s) return; const m = moonData(), best = m ? m.best : 0, preview = !!state.isAdmin;
  if (!preview && !mjOpen(s, best)) { toast(t('mjs_lock', { n:s.day, k:s.day - best })); return; }
  openModal(mjChapterHTML(s, best, preview)); $('dialog').classList.add('mj-dialog'); $('dialog').scrollTop = 0;
  if (state.editMode) applyEditable();
  if (state.user && mjOpen(s, best) && s.day > mjSeen()) { store.set(mjSeenKey(), s.day); render(true); }     // bỏ chữ "Mới" trên trang (hộp đọc truyện không bị vẽ lại)
}
// gọi sau khi điểm danh lưu xong: có chương mới mở thì mở ra đọc luôn
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
