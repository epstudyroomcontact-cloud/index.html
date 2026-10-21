'use strict';
/* =========================================================
   MOON JOURNEY — TRANH KIỂU BÚT SÁP MÀU (vẽ bằng SVG, không cần file ảnh)
   - Chất liệu sáp: bộ lọc mjCrayon làm mép hơi run tay và lốm đốm hạt giấy trắng, cộng thêm các nét sáp ngắn chồng lên nhau.
   - Moon: mèo trắng tròn trĩnh, tai và đỉnh đầu màu cam, mắt tròn to có điểm sáng, má hồng.
   - Mỗi trạm một cảnh (MJ_SCENES). Admin có thể thay từng cảnh bằng tranh vẽ tay: bật bút chì, mở trạm, bấm vào tranh.
   ========================================================= */
const _r1 = n => Math.round(n * 10) / 10;
function mjRng(seed){ let a = seed >>> 0 || 1; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const mjPick = (r, a) => a[Math.floor(r() * a.length)];
const MJC = {
  paper:'#fffaf0', line:'#3b4a86', white:'#fffdf8', fur:'#fffdf8', furLine:'#aab6d3', orange:'#f6a65c', orangeD:'#e07f35', cheek:'#f8a3b7', eye:'#3a2b28',
  hair:'#2f2734', skin:'#ffe3cf', blue:'#86bdf5', blueD:'#2f6fd6', pink:'#f6a2c9', pinkD:'#d45893', purple:'#b48ae0', purpleD:'#7b4fbf',
  yellow:'#ffd84a', yellowD:'#f2a91d', moon:'#fff2a8', moonD:'#f2c13a', grass:['#5fbf4b', '#86d15a', '#a9e06a', '#3f9e3c', '#6cc94f'], umb:'#ff7fb4', umbD:'#e0447f'
};
const MJ_SKIES = { dusk:['#5b7ee0', '#b9c6f7'], night:['#3c58c4', '#8aa2ec'], rain:['#6a86d0', '#b8c7ee'], deep:['#2f45a8', '#6f86df'], room:['#ffe9c8', '#ffd9a8'] };

/* ---------- nét sáp ---------- */
// nét sáp ngắn, hơi nghiêng, chồng lên nhau (tạo cảm giác tô bằng bút sáp)
function mjHatch(r, n, box, cols, ang = -20, w = [2, 4], op = .35, len = [8, 22]){
  const [x0, y0, x1, y1] = box; let s = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), l = len[0] + r() * (len[1] - len[0]), a = (ang + (r() - .5) * 16) * Math.PI / 180;
    s += `<path d="M${_r1(x)} ${_r1(y)}l${_r1(Math.cos(a) * l)} ${_r1(Math.sin(a) * l)}" stroke="${mjPick(r, cols)}" stroke-width="${_r1(w[0] + r() * (w[1] - w[0]))}" opacity="${_r1(op * (.6 + r() * .8) * 100) / 100}"/>`;
  }
  return `<g fill="none" stroke-linecap="round">${s}</g>`;
}
function mjSky(r, k, kind = 'dusk', h = 250){
  const c = MJ_SKIES[kind];
  return `<rect width="400" height="${h}" fill="url(#${k}${kind})"/>${mjHatch(r, 90, [-10, 0, 410, h], kind === 'room' ? ['#fff4dc', '#ffd59c', '#ffe2b8'] : ['#ffffff', c[0], c[1], '#9fb6f2'], kind === 'room' ? -70 : -8, [3, 6], .22, [20, 50])}`;
}
function mjStars(r, n, box){
  const [x0, y0, x1, y1] = box; let s = '';
  for (let i = 0; i < n; i++) {
    const x = _r1(x0 + r() * (x1 - x0)), y = _r1(y0 + r() * (y1 - y0)), z = r();
    s += z < .3 ? `<path d="M${x} ${_r1(y - 5)}Q${_r1(x + 1)} ${_r1(y - 1)} ${_r1(x + 5)} ${y}Q${_r1(x + 1)} ${_r1(y + 1)} ${x} ${_r1(y + 5)}Q${_r1(x - 1)} ${_r1(y + 1)} ${_r1(x - 5)} ${y}Q${_r1(x - 1)} ${_r1(y - 1)} ${x} ${_r1(y - 5)}Z" fill="${MJC.yellow}" stroke="#fff" stroke-width="1"/>`
      : `<circle cx="${x}" cy="${y}" r="${_r1(1 + z * 1.4)}" fill="#fffbe0"/>`;
  }
  return s;
}
// trăng: f = độ tròn (1 = trăng tròn, nhỏ hơn = trăng khuyết)
function mjMoon(k, x, y, R, f = 1){
  const id = k + 'm' + Math.round(x) + Math.round(y), off = _r1(R * 2 * f + R * .2);
  return `<circle cx="${x}" cy="${y}" r="${_r1(R * 1.9)}" fill="#fff6c9" opacity=".22"/><circle cx="${x}" cy="${y}" r="${_r1(R * 1.4)}" fill="#fff6c9" opacity=".3"/>
    ${f < 1 ? `<mask id="${id}"><circle cx="${x}" cy="${y}" r="${R + 3}" fill="#fff"/><circle cx="${_r1(x - off)}" cy="${_r1(y - R * .15)}" r="${R + 1}" fill="#000"/></mask>` : ''}
    <g ${f < 1 ? `mask="url(#${id})"` : ''}><circle cx="${x}" cy="${y}" r="${R}" fill="${MJC.moon}" stroke="${MJC.moonD}" stroke-width="2.2"/><circle cx="${_r1(x + R * .3)}" cy="${_r1(y - R * .25)}" r="${_r1(R * .18)}" fill="#ffe27a" opacity=".7"/><circle cx="${_r1(x - R * .25)}" cy="${_r1(y + R * .3)}" r="${_r1(R * .12)}" fill="#ffe27a" opacity=".7"/></g>`;
}
// đồi cỏ: phần tô + nét cỏ
function mjHill(r, d, box, base = '#6cc94f', blades = 70){
  return `<path d="${d}" fill="${base}"/>${mjHatch(r, blades, box, MJC.grass, -80, [2, 3.5], .7, [6, 14])}`;
}
// hoa lưu ly 5 cánh như tranh mẫu: cánh xanh viền đậm, nhuỵ vàng, viền trắng lốm đốm
const MJ_FL = { blue:[MJC.blue, MJC.blueD], pink:[MJC.pink, MJC.pinkD], purple:[MJC.purple, MJC.purpleD], white:['#ffffff', '#9fb0d8'], yellow:['#ffe680', MJC.yellowD] };
function mjFlower(x, y, s, col = 'blue', rot = 0){
  const [f, d] = MJ_FL[col]; let p = '';
  for (let i = 0; i < 5; i++) { const a = (i * 72 - 90) * Math.PI / 180; p += `<circle cx="${_r1(Math.cos(a) * 5.4)}" cy="${_r1(Math.sin(a) * 5.4)}" r="5.2"/>`; }
  return `<g transform="translate(${_r1(x)} ${_r1(y)}) rotate(${Math.round(rot)}) scale(${_r1(s * 100) / 100})"><circle r="11.5" fill="#fff" opacity=".75"/><g fill="${f}" stroke="${d}" stroke-width="1.3">${p}</g>
    <path d="M0-4.6V4.6M-4.4-1.4L4.4 1.4M-2.7 3.7L2.7-3.7M4.4-1.4L-4.4 1.4M2.7 3.7L-2.7-3.7" stroke="#fff" stroke-width="1.1" opacity=".9"/><circle r="2.4" fill="${MJC.yellow}"/><circle r="1" fill="${MJC.yellowD}"/></g>`;
}
function mjBud(x, y, s, col = 'pink'){ const [f, d] = MJ_FL[col]; return `<g transform="translate(${_r1(x)} ${_r1(y)}) scale(${_r1(s * 100) / 100})"><ellipse rx="3.4" ry="4.6" fill="${f}" stroke="${d}" stroke-width="1"/><path d="M0 4v7" stroke="#4fa840" stroke-width="1.4"/></g>`; }
// cánh đồng hoa: hoa xa nhỏ, hoa gần to, sắp theo chiều sâu
function mjField(r, n, box, sz = [.5, 1.3], cols = ['blue', 'blue', 'blue', 'pink', 'purple', 'white']){
  const [x0, y0, x1, y1] = box, items = [];
  for (let i = 0; i < n; i++) { const y = y0 + r() * (y1 - y0), t = (y - y0) / Math.max(1, y1 - y0), x = x0 + r() * (x1 - x0), s = sz[0] + (sz[1] - sz[0]) * t * (.7 + r() * .5); items.push([y, r() < .22 ? mjBud(x, y, s * 1.1, mjPick(r, ['pink', 'purple'])) : `<path d="M${_r1(x)} ${_r1(y)}v${_r1(10 * s)}" stroke="#4fa840" stroke-width="${_r1(1.6 * s)}"/>${mjFlower(x, y, s, mjPick(r, cols), r() * 70)}`]); }
  return items.sort((a, b) => a[0] - b[0]).map(i => i[1]).join('');
}
function mjLamp(x, gy, h = 110){
  const t = gy - h;
  return `<circle cx="${x}" cy="${t + 6}" r="30" fill="#fff3b0" opacity=".35"/><circle cx="${x}" cy="${t + 6}" r="18" fill="#fff3b0" opacity=".45"/><ellipse cx="${x}" cy="${gy}" rx="34" ry="7" fill="#fff3b0" opacity=".5"/>
    <path d="M${x} ${gy}V${t + 12}" stroke="#4b7d8f" stroke-width="5" stroke-linecap="round"/><path d="M${x - 10} ${t + 12}h20l-4-14h-12z" fill="#ffe36b" stroke="#4b7d8f" stroke-width="2.4" stroke-linejoin="round"/><path d="M${x - 7} ${t - 2}h14l-7-6z" fill="#4b7d8f"/>`;
}
const MJ_UMB = 'M-30 0Q-30-26 0-28Q30-26 30 0Q22.5-6 15 0Q7.5-6 0 0Q-7.5-6-15 0Q-22.5-6-30 0Z';
function mjUmbrella(x, y, s = 1, rot = 0, handle = true){
  return `<g transform="translate(${_r1(x)} ${_r1(y)}) rotate(${rot}) scale(${s})"><path d="${MJ_UMB}" fill="${MJC.umb}" stroke="${MJC.umbD}" stroke-width="1.8" stroke-linejoin="round"/><path d="M0-28Q-10-14-15 0M0-28Q10-14 15 0" fill="none" stroke="${MJC.umbD}" stroke-width="1.2" opacity=".7"/><path d="M-22-14Q-20-22-10-25" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".7" fill="none"/>${handle ? `<path d="M0 0V22q0 6-6 6" fill="none" stroke="#8a5a3c" stroke-width="2.4" stroke-linecap="round"/>` : ''}</g>`;
}
function mjRain(r, W, H, n = 26, cls = 'mj-rain'){
  let s = '';
  for (let i = 0; i < n; i++) { const x = r() * (W + 30) - 15, y0 = r() * 60, l = 6 + r() * 6; for (let y = y0 - 60; y < H; y += 60) s += `M${_r1(x)} ${_r1(y)}l-1.6 ${_r1(l)}`; }
  return `<g class="${cls}"><path d="${s}" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".55"/><path d="${s}" stroke="#7fa4e8" stroke-width="1.6" stroke-linecap="round"/></g>`;
}

/* ---------- nhân vật ---------- */
// Moon: (0,0) = chân. pose: sit (mắt mở), happy (mắt cười), sleep (cuộn tròn ngủ)
function mjCat(x, y, s = 1, pose = 'sit', o = {}){
  const L = MJC.furLine, F = MJC.fur, O = MJC.orange, flip = o.flip ? -1 : 1;
  const ears = (hx, hy) => `<path d="M${hx - 12} ${hy - 6}Q${hx - 13} ${hy - 19} ${hx - 9} ${hy - 20}Q${hx - 5} ${hy - 17} ${hx - 2} ${hy - 12}Z" fill="${O}" stroke="${MJC.orangeD}" stroke-width="1.3" stroke-linejoin="round"/><path d="M${hx + 12} ${hy - 6}Q${hx + 13} ${hy - 19} ${hx + 9} ${hy - 20}Q${hx + 5} ${hy - 17} ${hx + 2} ${hy - 12}Z" fill="${O}" stroke="${MJC.orangeD}" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M${hx - 9} ${hy - 9}l1-7 3 4zM${hx + 9} ${hy - 9}l-1-7-3 4z" fill="#ffc2cf"/>`;
  const head = (hx, hy, eyes) => `${ears(hx, hy)}<circle cx="${hx}" cy="${hy}" r="13.5" fill="${F}" stroke="${L}" stroke-width="1.5"/><path d="M${hx - 10} ${hy - 7}Q${hx} ${hy - 16} ${hx + 10} ${hy - 7}Q${hx + 5} ${hy - 9} ${hx} ${hy - 6.5}Q${hx - 5} ${hy - 9} ${hx - 10} ${hy - 7}Z" fill="${O}"/>
    ${eyes === 'open' ? `<circle cx="${hx - 5}" cy="${hy + 1}" r="3" fill="${MJC.eye}"/><circle cx="${hx + 5}" cy="${hy + 1}" r="3" fill="${MJC.eye}"/><circle cx="${hx - 4}" cy="${hy - .2}" r="1.1" fill="#fff"/><circle cx="${hx + 6}" cy="${hy - .2}" r="1.1" fill="#fff"/>`
      : `<path d="M${hx - 7.5} ${hy + 1.5}q2.5-3 5 0M${hx + 2.5} ${hy + 1.5}q2.5-3 5 0" stroke="${MJC.eye}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`}
    <ellipse cx="${hx - 8.5}" cy="${hy + 5}" rx="2.6" ry="1.6" fill="${MJC.cheek}" opacity=".85"/><ellipse cx="${hx + 8.5}" cy="${hy + 5}" rx="2.6" ry="1.6" fill="${MJC.cheek}" opacity=".85"/>
    <path d="M${hx - 1.2} ${hy + 3.6}h2.4l-1.2 1.4z" fill="#f08aa0"/><path d="M${hx - 2.4} ${hy + 6}q1.2 1.3 2.4 0q1.2 1.3 2.4 0" stroke="#8a6a62" stroke-width=".9" fill="none" stroke-linecap="round"/>`;
  let b;
  if (pose === 'sleep') b = `<path d="M14-6q12 2 8 10q-10 4-26 1" fill="none" stroke="${L}" stroke-width="7.4" stroke-linecap="round"/><path d="M14-6q12 2 8 10q-10 4-26 1" fill="none" stroke="${F}" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="2" cy="-9" rx="19" ry="10.5" fill="${F}" stroke="${L}" stroke-width="1.5"/><ellipse cx="9" cy="-14" rx="6" ry="3.4" fill="${O}" opacity=".9"/>${head(-11, -14, 'closed')}`;
  else b = `<path d="M10-4q16 1 13-15" fill="none" stroke="${L}" stroke-width="7.4" stroke-linecap="round"/><path d="M10-4q16 1 13-15" fill="none" stroke="${F}" stroke-width="5" stroke-linecap="round"/><path d="M22-17q2-3 0-4" stroke="${O}" stroke-width="5" stroke-linecap="round" fill="none"/>
      <ellipse cx="0" cy="-10" rx="12.5" ry="11" fill="${F}" stroke="${L}" stroke-width="1.5"/><ellipse cx="-5" cy="-1" rx="4" ry="2.6" fill="${F}" stroke="${L}" stroke-width="1.2"/><ellipse cx="5" cy="-1" rx="4" ry="2.6" fill="${F}" stroke="${L}" stroke-width="1.2"/>${head(0, -28, pose === 'happy' ? 'closed' : 'open')}`;
  return `<g transform="translate(${_r1(x)} ${_r1(y)}) scale(${_r1(s * flip * 100) / 100} ${_r1(s * 100) / 100})">${o.heart ? '<path d="M14-52c-2-4-8-3-7 2c1 3 7 7 7 7s6-4 7-7c1-5-5-6-7-2z" fill="#ff7fa8" stroke="#fff" stroke-width="1"/>' : ''}${b}</g>`;
}
// cô bé (Trân): tóc đen ngắn, váy trắng, má hồng, mắt cười. pose: stand, umb (che ô), open (dang tay), hug (ôm Moon), wave
function mjGirl(x, y, s = 1, pose = 'stand', o = {}){
  const S = MJC.skin, H = MJC.hair, arm = d => `<path d="${d}" stroke="${S}" stroke-width="3.6" stroke-linecap="round" fill="none"/>`;
  const arms = { stand:arm('M-7-19l-4 10') + arm('M7-19l4 10'), umb:arm('M-7-19l-4 10') + arm('M7-19l6-8'), open:arm('M-7-19l-12-6') + arm('M7-19l12-6'), hug:arm('M-7-20q-3 9 5 10') + arm('M7-20q3 9-5 10'), wave:arm('M-7-19l-4 10') + arm('M7-19l8-11') }[pose] || '';
  s *= 1.2;
  return `<g transform="translate(${_r1(x)} ${_r1(y)}) scale(${s})">${pose === 'umb' ? mjUmbrella(13, -50, .8, 6, false) + '<path d="M13-50V-27" stroke="#8a5a3c" stroke-width="2"/>' : ''}
    <path d="M-4-3v4M4-3v4" stroke="${S}" stroke-width="3.6" stroke-linecap="round"/>${o.cat ? '' : arms}
    <path d="M-7-22Q0-25 7-22L11-4Q0 0-11-4Z" fill="${MJC.white}" stroke="#c3cbe2" stroke-width="1.4" stroke-linejoin="round"/>
    ${o.cat ? mjCat(0, -3, .46, 'happy') + arms : ''}
    <path d="M-11-31Q-13-47 0-47Q13-47 11-31L12-24Q9-26 8-29L-8-29Q-9-26-12-24Z" fill="${H}"/><circle cx="0" cy="-33" r="10" fill="${S}"/><path d="M-10-35Q-9-45 0-45Q9-45 10-35Q4-40-1-37Q-5-40-10-35Z" fill="${H}"/>
    <path d="M-6-32q2 1.8 4 0M2-32q2 1.8 4 0" stroke="${H}" stroke-width="1.2" fill="none" stroke-linecap="round"/><ellipse cx="-6.5" cy="-28.5" rx="2.4" ry="1.5" fill="${MJC.cheek}"/><ellipse cx="6.5" cy="-28.5" rx="2.4" ry="1.5" fill="${MJC.cheek}"/><path d="M-1.6-27.6q1.6 1.4 3.2 0" stroke="#b05a5a" stroke-width="1" fill="none" stroke-linecap="round"/></g>`;
}
function mjBunny(x, y, s = 1){ return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="-3" cy="-24" rx="2.6" ry="7" fill="#fff" stroke="${MJC.furLine}" stroke-width="1.2"/><ellipse cx="3" cy="-24" rx="2.6" ry="7" fill="#fff" stroke="${MJC.furLine}" stroke-width="1.2"/><ellipse cx="0" cy="-7" rx="8" ry="7.5" fill="#fff" stroke="${MJC.furLine}" stroke-width="1.2"/><circle cx="0" cy="-16" r="6.4" fill="#fff" stroke="${MJC.furLine}" stroke-width="1.2"/><circle cx="-2.2" cy="-16" r="1" fill="${MJC.eye}"/><circle cx="2.2" cy="-16" r="1" fill="${MJC.eye}"/><ellipse cx="-4" cy="-13.5" rx="1.4" ry=".9" fill="${MJC.cheek}"/><ellipse cx="4" cy="-13.5" rx="1.4" ry=".9" fill="${MJC.cheek}"/></g>`; }
function mjPuppy(x, y, s = 1){ const c = '#f3c991', d = '#c98d4c'; return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M10-8q8-4 6-12" stroke="${d}" stroke-width="4" stroke-linecap="round" fill="none"/><ellipse cx="0" cy="-8" rx="11" ry="8.5" fill="${c}" stroke="${d}" stroke-width="1.3"/><circle cx="-6" cy="-20" r="9" fill="${c}" stroke="${d}" stroke-width="1.3"/><ellipse cx="-14" cy="-19" rx="3.4" ry="6" fill="${d}"/><ellipse cx="2" cy="-19" rx="3.4" ry="6" fill="${d}"/><circle cx="-9" cy="-21" r="1.4" fill="${MJC.eye}"/><circle cx="-3" cy="-21" r="1.4" fill="${MJC.eye}"/><ellipse cx="-6" cy="-17" rx="2" ry="1.4" fill="${MJC.eye}"/><ellipse cx="-11.5" cy="-16" rx="1.8" ry="1.1" fill="${MJC.cheek}"/><ellipse cx="-.5" cy="-16" rx="1.8" ry="1.1" fill="${MJC.cheek}"/></g>`; }

/* ---------- khung cảnh hay dùng ---------- */
const mjMeadow = (r, k, sky = 'dusk', gy = 160, o = {}) => `${mjSky(r, k, sky)}${o.stars !== false ? mjStars(r, o.stars || 16, [0, 0, 400, gy - 30]) : ''}${o.moon ? mjMoon(k, ...o.moon) : ''}
  ${mjHill(r, `M0 ${gy}Q120 ${gy - 22} 230 ${gy - 6}T400 ${gy - 10}V250H0z`, [0, gy - 20, 400, 250], '#6cc94f', 120)}${o.flowers !== false ? mjField(r, o.flowers || 26, [0, gy - 4, 400, 262], [.55, 2.1]) : ''}`;
function mjWindowRoom(r, k, o = {}){
  const wx = o.wx ?? 210, wy = o.wy ?? 26, ww = o.ww ?? 150, wh = o.wh ?? 120;
  return `${mjSky(r, k, 'room')}<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="14" fill="url(#${k}night)"/>${mjStars(r, 8, [wx + 8, wy + 8, wx + ww - 8, wy + wh * .7])}${mjMoon(k, wx + ww * .66, wy + wh * .36, o.mr || 17, o.mf ?? 1)}
    ${o.flowers ? mjField(r, 7, [wx + 6, wy + wh - 26, wx + ww - 6, wy + wh - 10], [.5, .7]) : ''}<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="14" fill="none" stroke="#c48c56" stroke-width="7"/><path d="M${wx + ww / 2} ${wy}v${wh}" stroke="#c48c56" stroke-width="5"/>
    <rect x="${wx - 12}" y="${wy + wh}" width="${ww + 24}" height="9" rx="4" fill="#d9a06a" stroke="#b07a46" stroke-width="1.5"/>`;
}

/* ---------- các cảnh (400×250) ---------- */
const MJ_SCENES = {
  start:(r, k) => `${mjMeadow(r, k, 'rain', 170, { moon:[70, 50, 16, .5], stars:6, flowers:30 })}${mjLamp(320, 182, 118)}${mjGirl(180, 206, 1.7, 'umb')}`,
  d1:(r, k) => `${mjMeadow(r, k, 'rain', 168, { moon:[320, 50, 22, 1], stars:6, flowers:22 })}${mjLamp(70, 178, 112)}${mjCat(196, 198, 1.25, 'sit')}`,
  d3:(r, k) => `${mjMeadow(r, k, 'rain', 160, { stars:4, flowers:24 })}${mjUmbrella(200, 150, 2.6, -8)}${mjCat(205, 206, 1.25, 'sleep')}`,
  d7:(r, k) => `${mjMeadow(r, k, 'dusk', 166, { moon:[86, 48, 18, .7], stars:10, flowers:20 })}${mjLamp(210, 186, 140)}<ellipse cx="290" cy="214" rx="54" ry="13" fill="#8fc1f5" stroke="#4f8be0" stroke-width="2"/><ellipse cx="282" cy="210" rx="16" ry="3" fill="#fff" opacity=".7"/>
    ${[[270, 212], [292, 206], [314, 212]].map(([x, y]) => `<g transform="translate(${x} ${y})" fill="#fff"><ellipse rx="3.6" ry="3"/><circle cx="-4" cy="-4.5" r="1.4"/><circle cx="-1.3" cy="-6" r="1.4"/><circle cx="1.3" cy="-6" r="1.4"/><circle cx="4" cy="-4.5" r="1.4"/></g>`).join('')}`,
  d10:(r, k) => `${mjMeadow(r, k, 'dusk', 150, { moon:[330, 46, 18, 1], stars:14, flowers:18 })}<path d="M-10 250Q160 200 210 170T420 150" stroke="#fff1cf" stroke-width="30" fill="none" stroke-linecap="round"/><path d="M-10 250Q160 200 210 170T420 150" stroke="#f3d39a" stroke-width="2" stroke-dasharray="2 8" fill="none"/>${mjGirl(246, 176, 1.35, 'stand')}${mjCat(170, 210, 1.05, 'sit')}`,
  d14:(r, k) => { let w = ''; for (let i = 1; i <= 7; i++) w += `<ellipse cx="200" cy="196" rx="${i * 24}" ry="${i * 7}" fill="none" stroke="${i % 2 ? '#fff' : '#5c9ae8'}" stroke-width="${i % 2 ? 2.4 : 3}" stroke-dasharray="${18 + i * 4} ${6 + i}" opacity=".85"/>`;
    return `${mjSky(r, k, 'night')}${mjStars(r, 18, [0, 0, 400, 120])}${mjMoon(k, 300, 52, 22, .5)}${mjHill(r, 'M0 150Q200 132 400 150V250H0z', [0, 140, 400, 250])}<ellipse cx="200" cy="196" rx="180" ry="46" fill="#8cc0f6" stroke="#3f7fdb" stroke-width="3"/>${w}${mjField(r, 10, [0, 228, 400, 250], [.9, 1.2])}${mjCat(200, 196, 1.15, 'sit')}`; },
  d21:(r, k) => `${mjMeadow(r, k, 'night', 172, { stars:34, flowers:24 })}<circle cx="200" cy="146" r="40" fill="#fff6c9" opacity=".45"/>${mjUmbrella(200, 166, 2, 180, false)}<path d="M200 128Q203 141 216 144Q203 147 200 160Q197 147 184 144Q197 141 200 128Z" fill="${MJC.yellow}" stroke="#fff" stroke-width="2"/>${mjGirl(118, 214, 1.3, 'wave')}`,
  d30:(r, k) => `${mjMeadow(r, k, 'night', 176, { moon:[200, 80, 44, 1], stars:24, flowers:22 })}${mjGirl(200, 216, 1.6, 'hug', { cat:true })}`,
  d45:(r, k) => `${mjWindowRoom(r, k, { wx:40, wy:24, ww:150, wh:118, mf:.8 })}<rect x="0" y="196" width="400" height="54" fill="#e9b47f"/>${mjHatch(r, 30, [0, 198, 400, 250], ['#d99a5e', '#f3c897'], -10, [3, 5], .5, [20, 40])}
    <path d="M232 196q0-30 36-30t36 30z" fill="${MJC.pink}" stroke="${MJC.pinkD}" stroke-width="2"/>${mjFlower(252, 160, 1.2, 'blue', 10)}${mjFlower(272, 154, 1.3, 'white', 40)}${mjFlower(292, 162, 1.1, 'blue', 70)}<rect x="330" y="160" width="14" height="36" rx="3" fill="#fff" stroke="#d8c3a5" stroke-width="1.5"/><path d="M337 160q-7-10 0-20q7 10 0 20z" fill="${MJC.yellow}" stroke="${MJC.yellowD}" stroke-width="1.3"/>`,
  d60:(r, k) => `${mjMeadow(r, k, 'night', 158, { stars:30, flowers:20 })}${mjStars(r, 16, [0, 168, 400, 240])}${mjPuppy(130, 214, 1.4)}${mjBunny(268, 218, 1.4)}${mjGirl(200, 206, 1.3, 'open')}`,
  d80:(r, k) => `${mjSky(r, k, 'dusk')}${mjStars(r, 14, [0, 0, 400, 100])}${mjMoon(k, 80, 52, 18, .85)}${mjHill(r, 'M0 250V210Q170 200 250 110Q300 60 420 70V250z', [0, 70, 400, 250], '#6cc94f', 110)}${mjField(r, 16, [60, 150, 400, 250], [.5, 1.1])}
    <circle cx="318" cy="96" r="40" fill="#fff3b0" opacity=".45"/><path d="M300 118V92a18 18 0 0 1 36 0v26z" fill="#c4874f" stroke="#8a5a3c" stroke-width="2.4"/><path d="M306 118V94a12 12 0 0 1 24 0v24z" fill="#ffe27a"/><circle cx="325" cy="106" r="1.8" fill="#8a5a3c"/>${mjCat(286, 124, .9, 'sit')}`,
  d100:(r, k) => `${mjSky(r, k, 'night')}${mjStars(r, 18, [0, 0, 400, 90])}${mjMoon(k, 90, 44, 18, .9)}${mjHill(r, 'M0 112Q200 98 400 112V140H0z', [0, 100, 400, 140], '#6cc94f', 40)}${mjField(r, 10, [0, 106, 400, 132], [.35, .5])}
    <rect y="136" width="400" height="56" fill="#8cc0f6"/>${mjHatch(r, 50, [0, 138, 400, 190], ['#fff', '#5c9ae8', '#b8dafc'], 0, [2, 4], .7, [16, 40])}${mjCat(300, 126, .62, 'sit')}
    ${mjHill(r, 'M0 194Q200 180 400 196V250H0z', [0, 186, 400, 250])}${mjField(r, 14, [0, 200, 400, 250], [.8, 1.2])}${mjGirl(110, 226, 1.25, 'wave')}`,
  d130:(r, k) => `${mjWindowRoom(r, k, { wx:110, wy:20, ww:180, wh:130, mr:20 })}<rect x="0" y="196" width="400" height="54" fill="#e9b47f"/>${mjHatch(r, 30, [0, 198, 400, 250], ['#d99a5e', '#f3c897'], -10, [3, 5], .5, [20, 40])}
    <ellipse cx="190" cy="156" rx="46" ry="6" fill="#fff6c9" opacity=".8"/>${mjCat(190, 158, .95, 'sleep')}<path d="M300 150h40l-5 -22h-30z" fill="${MJC.pink}" stroke="${MJC.pinkD}" stroke-width="2"/>${mjFlower(312, 120, .9, 'blue')}${mjFlower(328, 116, .9, 'purple', 30)}`,
  d160:(r, k) => `${mjMeadow(r, k, 'rain', 166, { stars:4, flowers:24 })}${mjLamp(70, 176, 110)}${mjUmbrella(214, 140, 2.2, 0, false)}<path d="M214 140v24" stroke="#8a5a3c" stroke-width="2.4"/>${mjGirl(196, 214, 1.4, 'stand')}<g transform="translate(234 214) scale(1.3)"><path d="M-4-3v4M4-3v4" stroke="${MJC.skin}" stroke-width="3.6" stroke-linecap="round"/><path d="M-7-22Q0-25 7-22L11-4Q0 0-11-4Z" fill="#ffd36b" stroke="#e0a83a" stroke-width="1.4"/><circle cx="0" cy="-33" r="10" fill="${MJC.skin}"/><path d="M-10-35Q-9-46 0-46Q9-46 10-35L11-25Q8-28 7-35Q0-40-7-35Q-8-28-11-25Z" fill="#7a4a2a"/><path d="M-6-32q2 1.8 4 0M2-32q2 1.8 4 0" stroke="#4a2a1a" stroke-width="1.2" fill="none"/><ellipse cx="-6.5" cy="-28.5" rx="2.4" ry="1.5" fill="${MJC.cheek}"/><ellipse cx="6.5" cy="-28.5" rx="2.4" ry="1.5" fill="${MJC.cheek}"/><rect x="-14" y="-20" width="9" height="11" rx="2" fill="${MJC.blue}" stroke="${MJC.blueD}" stroke-width="1"/></g>`,
  d200:(r, k) => { let g = ''; for (let i = 0; i < 200; i++) { const a = i * .12, kk = i % 2 ? Math.PI : 0, rr = 4 + i * .62, x = 200 + Math.cos(a + kk) * rr * 1.5, y = 92 + Math.sin(a + kk) * rr * .6; g += `<circle cx="${_r1(x + (r() - .5) * 8)}" cy="${_r1(y + (r() - .5) * 5)}" r="${_r1(1 + r() * 2.2)}" fill="${mjPick(r, ['#fff6c9', '#ffffff', MJC.yellow, '#c8d8ff', MJC.pink])}"/>`; }
    return `${mjSky(r, k, 'deep')}${mjStars(r, 26, [0, 0, 400, 200])}<ellipse cx="200" cy="92" rx="150" ry="58" fill="#c8d8ff" opacity=".25"/>${g}${mjStars(r, 3, [180, 80, 220, 100])}
      ${mjHill(r, 'M0 210Q200 186 400 210V250H0z', [0, 196, 400, 250])}${mjField(r, 12, [0, 210, 400, 250], [.8, 1.2])}${mjGirl(186, 222, 1.3, 'stand')}${mjCat(218, 222, .9, 'sit')}`; },
  d250:(r, k) => `${mjMeadow(r, k, 'rain', 160, { moon:[316, 54, 20, 1], stars:6, flowers:20 })}<ellipse cx="290" cy="222" rx="70" ry="14" fill="#8fc1f5" stroke="#4f8be0" stroke-width="2"/>${mjMoon(k, 300, 222, 7, 1)}${mjGirl(150, 214, 1.5, 'umb')}`,
  d300:(r, k) => `${mjMeadow(r, k, 'dusk', 130, { moon:[330, 44, 18, 1], stars:12, flowers:34 })}<g transform="rotate(-6 200 190)"><rect x="140" y="152" width="124" height="80" rx="6" fill="#fffdf8" stroke="#c3cbe2" stroke-width="2"/><path d="M140 156l62 40 62-40" fill="none" stroke="#c3cbe2" stroke-width="2"/>
    <path d="M202 196c-3-6-12-4-10 3c1 4 10 10 10 10s9-6 10-10c2-7-7-9-10-3z" fill="#ff7fa8"/><g transform="translate(240 222)" fill="${MJC.orange}"><ellipse rx="4" ry="3.2"/><circle cx="-4.5" cy="-4.8" r="1.6"/><circle cx="-1.5" cy="-6.6" r="1.6"/><circle cx="1.5" cy="-6.6" r="1.6"/><circle cx="4.5" cy="-4.8" r="1.6"/></g></g>`,
  d365:(r, k) => `${mjMeadow(r, k, 'night', 170, { moon:[200, 74, 46, 1], stars:30, flowers:36 })}${mjField(r, 8, [0, 200, 400, 250], [1.6, 2.2])}<path d="M175 130c-3-6-11-5-10 2c1 4 10 9 10 9s9-5 10-9c1-7-7-8-10-2z" fill="#ff7fa8" stroke="#fff" stroke-width="1.2"/><path d="M226 120c-2-4-7-3-6 1c0 3 6 6 6 6s6-3 6-6c1-4-4-5-6-1z" fill="#ff9fc0" stroke="#fff" stroke-width="1"/>${mjGirl(200, 214, 1.7, 'hug', { cat:true })}`,
  d400:(r, k) => `${mjWindowRoom(r, k, { wx:236, wy:18, ww:130, wh:104, mr:15 })}<rect x="30" y="140" width="330" height="90" rx="16" fill="#c48c56" stroke="#8a5a3c" stroke-width="2"/><rect x="44" y="118" width="96" height="40" rx="16" fill="#fff" stroke="#c3cbe2" stroke-width="1.8"/>
    <g transform="translate(92 134) scale(1.7)"><circle r="12" fill="${MJC.skin}"/><path d="M-12 0Q-12-14 0-14Q12-14 12 0Q6-6 0-4Q-6-6-12 0Z" fill="${MJC.hair}"/><path d="M-6 2q2 1.6 4 0M2 2q2 1.6 4 0" stroke="${MJC.hair}" stroke-width="1.2" fill="none" stroke-linecap="round"/><ellipse cx="-7" cy="6" rx="2.4" ry="1.4" fill="${MJC.cheek}"/><ellipse cx="7" cy="6" rx="2.4" ry="1.4" fill="${MJC.cheek}"/></g>
    <path d="M60 156Q170 134 250 150T360 148V222H60z" fill="#ffb347" stroke="#e08a2a" stroke-width="2"/>${mjHatch(r, 40, [64, 154, 356, 218], ['#ffd36b', '#ff9f3a', '#ffe08a'], -30, [3, 5], .6, [10, 24])}${mjCat(270, 160, 1.5, 'sleep')}<text x="296" y="112" font-size="16" font-weight="700" fill="#5b7ee0" font-family="Baloo 2, sans-serif">z z</text>`,
  d450:(r, k) => `${mjMeadow(r, k, 'night', 176, { moon:[316, 56, 26, 1], stars:28, flowers:30 })}<circle cx="196" cy="168" r="22" fill="#fff6c9" opacity=".6"/><circle cx="196" cy="168" r="9" fill="${MJC.moon}" stroke="${MJC.moonD}" stroke-width="2"/>${mjGirl(180, 214, 1.5, 'wave')}${mjCat(232, 214, 1, 'happy', { heart:true })}`,
  after:(r, k) => `${mjMeadow(r, k, 'deep', 180, { moon:[310, 52, 20, .8], stars:36, flowers:28 })}${mjGirl(176, 212, 1.3, 'stand')}${mjCat(208, 212, .9, 'sit')}`
};
function mjCrayonDefs(k, seed){
  return `<filter id="${k}c" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="2" seed="${seed}" result="w"/><feDisplacementMap in="SourceGraphic" in2="w" scale="3" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="${seed + 5}" result="g"/><feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -8 0 0 0 6.6" result="m"/><feComposite in="d" in2="m" operator="in"/></filter>
    ${Object.entries(MJ_SKIES).map(([n, c]) => `<linearGradient id="${k}${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></linearGradient>`).join('')}`;
}
const MJ_RAINY = { start:1, d1:1, d3:1, d160:1, d250:1 };
function mjScene(id, seed = 7){
  const k = 'mjs' + (++_mjN), r = mjRng(seed);
  return `<svg class="mj-scene" viewBox="0 0 400 250" role="img" aria-label="${esc(mjTitle(mjStop(id)))}" preserveAspectRatio="xMidYMid slice"><defs>${mjCrayonDefs(k, seed % 50)}</defs><rect width="400" height="250" fill="${MJC.paper}"/>
    <g filter="url(#${k}c)">${(MJ_SCENES[id] || MJ_SCENES.after)(r, k)}</g>${MJ_RAINY[id] && mjRainOn() ? mjRain(r, 400, 250) : ''}</svg>`;
}
const mjArt = s => { const u = cimg('mj_art_' + s.id); return `<div class="mj-art" data-cms-img="mj_art_${s.id}">${u ? `<img alt="" src="${esc(u)}" loading="lazy">` : mjScene(s.id, 11 + MJ_STOPS.indexOf(s) * 7)}</div>`; };
