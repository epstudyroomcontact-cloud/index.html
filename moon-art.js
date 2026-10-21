'use strict';
/* =========================================================
   MOON JOURNEY — TRANH ĐÊM KIỂU SÁP MÀU (vẽ bằng SVG, không cần file ảnh)
   - Màu đêm hợp với web: xanh navy, xanh lam đậm, ánh trăng vàng nhạt, ánh đom đóm và đèn vàng ấm.
   - Chất sáp mịn: nền là nhiều lớp nét ngắn theo hướng (sóng nước, cỏ theo gió, mây), mép hơi run tay (bộ lọc w),
     phủ một lớp hạt sáng và hạt tối rất nhẹ (bộ lọc g, d). Nhân vật vẽ ngoài bộ lọc run tay cho mặt rõ nét.
   - Trân: cô bé mặc áo mưa hồng dáng chữ A, ủng hồng đậm, tóc nâu dài; trời mưa thì trùm mũ áo; chiếc ô hồng 8 gọng.
   - Moon: mèo cái trắng, đỉnh đầu và hai tai màu cam, mắt cười, má hồng.
   - Mỗi trạm một cảnh riêng (MJ_SCENES). Admin có thể thay từng cảnh bằng tranh vẽ tay: bật bút chì, mở trạm, bấm vào tranh.
   ========================================================= */
const _r1 = n => Math.round(n * 10) / 10;
function mjRng(seed){ let a = seed >>> 0 || 1; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const mjPick = (r, a) => a[Math.floor(r() * a.length)];
const MJN = {
  navy:'#0d1633', moon:'#fff2c4', dress:'#eef2fb', dressS:'#a9b6d6', hair:'#16132b', hairH:'#45427a', skin:'#f6dccd', cheek:'#f3a3ad', ribbon:'#9fc4ff',
  fur:'#fdfaf3', furS:'#c9d1e6', furL:'#aab4d0', orange:'#f2a15c', pink:'#f4a9b6', eye:'#29203a'
};
let _mjN = 0;

/* ---------- khung vẽ: mỗi tranh có một bộ đếm id và chỗ gom <defs> ---------- */
function mjCtx(seed, k){ const c = { r:mjRng(seed), k, u:0, d:'', g:{} }; c.id = () => k + '_' + (++c.u); c.def = s => { c.d += s; }; return c; }
const mjStops = stops => stops.map(([o, col, a = 1]) => `<stop offset="${o}" stop-color="${col}" stop-opacity="${a}"/>`).join('');
function mjClip(c, shape){ const id = c.id(); c.def(`<clipPath id="${id}">${shape}</clipPath>`); return `url(#${id})`; }
function mjLin(c, stops, x2 = 0, y2 = 1, x1 = 0, y1 = 0){ const id = c.id(); c.def(`<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${mjStops(stops)}</linearGradient>`); return `url(#${id})`; }
function mjRad(c, stops, cx = .5, cy = .5, r = .5){ const id = c.id(); c.def(`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${mjStops(stops)}</radialGradient>`); return `url(#${id})`; }
const MJ_GLOWS = { w:['#ffd27a', .8], m:['#fff1c0', .55], f:['#ffe9a0', .95], c:['#9fc0ff', .4], p:['#ffb0cf', .45], v:['#b9a6ff', .45] };
// quầng sáng tròn: w đèn vàng ấm, m ánh trăng, f đom đóm, c ánh xanh lạnh, p hồng, v tím
function mjGlow(c, x, y, R, kind = 'w', op = 1){
  if (!c.g[kind]) { const [col, a] = MJ_GLOWS[kind]; c.g[kind] = mjRad(c, [[0, col, a], [.25, col, a * .55], [.6, col, a * .14], [1, col, 0]]); }
  return `<circle cx="${_r1(x)}" cy="${_r1(y)}" r="${_r1(R)}" fill="${c.g[kind]}" opacity="${op}"/>`;
}

/* ---------- nét sáp ---------- */
// n nét ngắn trong vùng box, theo hướng ang (độ) hoặc theo trường hướng fa(x,y); gom theo màu và độ dày thành ít path
// nét màu chỉ làm vân nhẹ, khối chính là các mảng chuyển màu mịn
const MJ_SOFT = .5;
function mjS(c, n, box, cols, o = {}){
  const r = c.r, [x0, y0, x1, y1] = box, ws = o.w || [1.6, 2.6], L = o.len || [8, 24], bend = o.bend ?? .15, jit = o.jit ?? 8, B = {};
  for (let i = 0, tries = 0; i < n && tries < n * 6; tries++) {
    const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0);
    if (o.in && !o.in(x, y)) continue; i++;
    const a = ((o.fa ? o.fa(x, y) : (o.ang || 0)) + (r() - .5) * 2 * jit) * Math.PI / 180, l = L[0] + r() * (L[1] - L[0]);
    const dx = Math.cos(a) * l, dy = Math.sin(a) * l, b = (r() - .5) * 2 * bend * l, key = Math.floor(r() * cols.length) + '|' + Math.floor(r() * ws.length);
    B[key] = (B[key] || '') + `M${_r1(x - dx / 2)} ${_r1(y - dy / 2)}q${_r1(dx / 2 - dy / l * b)} ${_r1(dy / 2 + dx / l * b)} ${_r1(dx)} ${_r1(dy)}`;
  }
  return `<g fill="none" stroke-linecap="round" opacity="${_r1((o.op ?? .45) * MJ_SOFT * 100) / 100}">${Object.entries(B).map(([key, d]) => { const [ci, wi] = key.split('|'); return `<path d="${d}" stroke="${cols[ci]}" stroke-width="${ws[wi]}"/>`; }).join('')}</g>`;
}
// chấm tròn nhỏ (sao, bụi sáng, hoa li ti)
function mjDots(c, n, box, cols, sz = [.6, 1.6], op = .85, inFn){
  const r = c.r, [x0, y0, x1, y1] = box, B = {};
  for (let i = 0, tries = 0; i < n && tries < n * 6; tries++) {
    const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0); if (inFn && !inFn(x, y)) continue; i++;
    const key = Math.floor(r() * cols.length) + '|' + Math.floor(r() * 3); B[key] = (B[key] || '') + `M${_r1(x)} ${_r1(y)}h0`;
  }
  return `<g fill="none" stroke-linecap="round" opacity="${op}">${Object.entries(B).map(([key, d]) => { const [ci, si] = key.split('|'); return `<path d="${d}" stroke="${cols[ci]}" stroke-width="${_r1(sz[0] + (sz[1] - sz[0]) * si / 2)}"/>`; }).join('')}</g>`;
}
// ngôi sao lấp lánh 4 cánh
const mjSpark = (x, y, s, col = '#fff6d6', op = 1) => { const q = s * .16; return `<path d="M${_r1(x)} ${_r1(y - s)}Q${_r1(x + q)} ${_r1(y - q)} ${_r1(x + s)} ${_r1(y)}Q${_r1(x + q)} ${_r1(y + q)} ${_r1(x)} ${_r1(y + s)}Q${_r1(x - q)} ${_r1(y + q)} ${_r1(x - s)} ${_r1(y)}Q${_r1(x - q)} ${_r1(y - q)} ${_r1(x)} ${_r1(y - s)}Z" fill="${col}" opacity="${op}"/>`; };
function mjStarfield(c, n, box, o = {}){
  const r = c.r, [x0, y0, x1, y1] = box; let s = mjDots(c, n, box, o.cols || ['#ffffff', '#fff3cf', '#cfe0ff', '#e9e4ff'], o.sz || [.5, 1.5], o.op ?? .8, o.in);
  for (let i = 0; i < (o.sparks ?? Math.round(n / 14)); i++) { const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0); if (o.in && !o.in(x, y)) continue; const z = 2 + r() * 3.4; s += mjA(c, 'mja-tw', mjGlow(c, x, y, z * 3, 'm', .7) + mjSpark(x, y, z, r() < .3 ? '#ffe7a0' : '#fffbea'), 3.2); }
  return s;
}
// đom đóm: chấm sáng có quầng
function mjFlies(c, n, box, o = {}){
  const r = c.r, [x0, y0, x1, y1] = box; let s = '';
  for (let i = 0, tries = 0; i < n && tries < n * 6; tries++) {
    const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0); if (o.in && !o.in(x, y)) continue; i++;
    const z = (o.sz || 1) * (.7 + r() * .9); s += mjA(c, 'mja-fly', mjGlow(c, x, y, 7 * z, 'f', .45 + r() * .5) + `<circle cx="${_r1(x)}" cy="${_r1(y)}" r="${_r1(1.1 * z)}" fill="#fffbe0"/>`, 7);
  }
  return s;
}

/* ---------- cảnh nền dùng chung ---------- */
// bầu trời đêm: nền chuyển màu + vệt mây sáp nằm ngang + sao
function mjSkyN(c, top, bot, h = 250, o = {}){
  let s = `<rect width="400" height="${h}" fill="${mjLin(c, [[0, top], [1, bot]])}"/>`;
  s += mjA(c, 'mja-drift', mjS(c, o.streaks ?? 70, [-30, 0, 430, h], o.cols || ['#1a2b57', '#22366a', '#101c3e', '#2b4378'], { ang:o.ang ?? -3, len:[40, 120], w:[5, 9, 13], op:o.sop ?? .35, jit:4, bend:.06 }));
  if (o.stars !== 0) s += mjStarfield(c, o.stars || 90, [0, 0, 400, h * (o.starH || .8)], { sparks:o.sparks });
  return s;
}
function mjMoonN(c, x, y, R, o = {}){
  const id = c.id(); let s = mjA(c, 'mja-breathe', mjGlow(c, x, y, R * (o.halo || 4.2), 'm', .9) + mjGlow(c, x, y, R * 1.7, 'w', .35));
  const cl = mjClip(c, `<circle cx="${x}" cy="${y}" r="${R}"/>`);
  let disk = `<circle cx="${x}" cy="${y}" r="${R}" fill="${MJN.moon}"/><g clip-path="${cl}">${mjS(c, Math.round(R * 2), [x - R, y - R, x + R, y + R], ['#ffe39a', '#fffbea', '#f6dc95'], { ang:-25, len:[R * .3, R * .7], w:[R * .1, R * .16], op:.55 })}</g>`;
  if (o.cres) {
    const [dx, dy] = o.cres; c.def(`<mask id="${id}"><circle cx="${x}" cy="${y}" r="${R + 1}" fill="#fff"/><circle cx="${_r1(x + dx * R)}" cy="${_r1(y + dy * R)}" r="${_r1(R * (o.cut || .9))}" fill="#000"/></mask>`);
    disk = `<g mask="url(#${id})">${disk}</g>`;
  }
  return s + disk;
}
// nước: nền + nét sóng ngang + (tuỳ chọn) đường trăng lấp lánh dưới mặt trăng ở x = o.path
function mjWater(c, y0, y1, o = {}){
  const r = c.r; let s = `<rect y="${y0}" width="400" height="${y1 - y0}" fill="${mjLin(c, [[0, o.top || '#13234a'], [1, o.bot || '#081129']])}"/>`;
  s += mjA(c, 'mja-flow', mjS(c, o.n ?? 260, [-20, y0, 420, y1], o.cols || ['#1c3264', '#24407a', '#0d1836', '#2e4f8c'], { ang:0, len:[10, 46], w:[1.4, 2.4, 3.4], op:.55, jit:3, bend:.1 }));
  if (o.path !== undefined) {
    // vệt trăng trên nước: xa thì vệt mảnh và ngắn, gần thì dày và dài hơn; thêm một cột sáng mờ phía dưới
    const mx = o.path, sw = o.spread || 120, B = [['', .45, .9], ['', .75, .8], ['', 1.05, .7]];
    for (let i = 0; i < (o.glints || 300) * 1.3; i++) {
      const t = Math.pow(r(), .8), y = y0 + 1.5 + (y1 - y0) * t, spread = 5 + t * sw, x = mx + (r() + r() + r() - 1.5) * spread * .9, l = 1.6 + r() * (3 + t * 13);
      if (Math.abs(x - mx) > spread) continue;
      B[t < .3 ? 0 : t < .65 ? 1 : 2][0] += `M${_r1(x - l / 2)} ${_r1(y)}h${_r1(l)}`;
    }
    const col = mjLin(c, [[0, '#fff3cf', .5], [1, '#fff3cf', 0]]);
    s += mjGlow(c, mx, y0 + (y1 - y0) * .5, (y1 - y0) * .9, 'm', .3) + `<path d="M${mx - 10} ${y0}L${mx + 10} ${y0}L${mx + sw * .7} ${y1}L${mx - sw * .7} ${y1}Z" fill="${col}" opacity=".35"/>` + B.map(([d, w, op], i) => mjA(c, 'mja-shim', `<path d="${d}" stroke="${i ? '#fff6dc' : '#f3e4b0'}" stroke-width="${w}" stroke-linecap="round" opacity="${op}" fill="none"/>`, 2.6)).join('');
  }
  return s;
}
// phản chiếu ánh đèn trên mặt đất ướt: vệt ngang chồng xuống dưới
function mjReflect(c, L, gy, col = '#ffcf73', op = .45){
  let d = ''; L.forEach(([x, y, k = 1]) => { const depth = Math.min(250 - gy, (gy - y) * .7 + 10); for (let t = 3; t < depth; t += 2.5 + c.r() * 3) { const w = (2 + c.r() * 6) * k * (1 - t / depth * .6); d += `M${_r1(x - w / 2 + (c.r() - .5) * 3)} ${_r1(gy + t)}h${_r1(w)}`; } });
  return mjA(c, 'mja-shim', `<path d="${d}" stroke="${col}" stroke-width="1.5" stroke-linecap="round" opacity="${op}" fill="none"/>`, 3);
}
// dãy nhà về đêm, cửa sổ sáng ngẫu nhiên; trả về svg và vị trí các ô sáng (để vẽ bóng phản chiếu)
function mjTown(c, gy, o = {}){
  const r = c.r, cols = o.cols || ['#0e1834', '#121e40', '#0b142d', '#15214a'], lights = []; let s = '', x = o.x0 ?? -12;
  while (x < (o.x1 ?? 412)) {
    const w = 30 + r() * 42, hh = o.h[0] + r() * (o.h[1] - o.h[0]), col = mjPick(r, cols), roof = r() < .55, top = gy - hh;
    s += `<path d="M${_r1(x)} ${gy}V${_r1(top)}${roof ? `L${_r1(x + w / 2)} ${_r1(top - w * .38)}L${_r1(x + w)} ${_r1(top)}` : `H${_r1(x + w)}`}V${gy}Z" fill="${col}"/>`;
    if (!roof && r() < .5) s += `<rect x="${_r1(x + w * .7)}" y="${_r1(top - 10)}" width="5" height="10" fill="${col}"/>`;
    for (let wy = top + 8; wy < gy - 12; wy += 15) for (let wx = x + 6; wx < x + w - 9; wx += 12) {
      if (r() < (o.lit ?? .3)) { s += mjGlow(c, wx + 2.5, wy + 3.5, 11, 'w', .55) + `<rect x="${_r1(wx)}" y="${_r1(wy)}" width="5" height="7" rx=".6" fill="${r() < .3 ? '#ffe9b0' : '#ffcb6b'}"/>`; lights.push([wx + 2.5, wy + 3.5, .8]); }
      else if (r() < .35) s += `<rect x="${_r1(wx)}" y="${_r1(wy)}" width="5" height="7" rx=".6" fill="#1d2c55"/>`;
    }
    x += w - 1 + r() * 3;
  }
  return { svg:s, lights };
}
function mjLampN(c, x, gy, h = 120, o = {}){
  const top = gy - h; let s = '';
  if (o.cone) s += `<path d="M${x - 5} ${top + 8}L${x + 5} ${top + 8}L${x + o.cone} ${gy}L${x - o.cone} ${gy}Z" fill="${mjLin(c, [[0, '#ffd98a', .38], [1, '#ffd98a', 0]])}"/>` + `<ellipse cx="${x}" cy="${gy}" rx="${o.cone * 1.1}" ry="9" fill="${mjRad(c, [[0, '#ffd98a', .45], [1, '#ffd98a', 0]])}"/>`;
  s += mjA(c, 'mja-flick', mjGlow(c, x, top + 2, o.R || 80, 'w', .9));
  s += `<path d="M${x - 2.2} ${gy}L${x - 1.4} ${top + 10}H${x + 1.4}L${x + 2.2} ${gy}Z" fill="#0a1128"/><path d="M${x - 4.5} ${gy}h9l-1.5-6h-6z" fill="#0a1128"/><path d="M${x + .6} ${gy - 6}V${top + 12}" stroke="#34497e" stroke-width=".8"/>
    <path d="M${x - 6.5} ${top + 9}L${x - 5} ${top - 4}H${x + 5}L${x + 6.5} ${top + 9}Z" fill="#fff0c0"/><path d="M${x} ${top - 4}V${top + 9}" stroke="#e8b45a" stroke-width=".7"/>
    <path d="M${x - 9} ${top - 3.5}L${x} ${top - 11}L${x + 9} ${top - 3.5}Z" fill="#0a1128"/><rect x="${x - 7.5}" y="${top + 8.5}" width="15" height="2.6" rx="1" fill="#0a1128"/>`;
  return s + mjA(c, 'mja-flick', mjGlow(c, x, top + 2, 16, 'f', .9));
}
// đèn lồng nhỏ cầm tay, móc ở (lx,ly)
function mjLantern(c, lx, ly){
  return mjA(c, 'mja-flick', mjGlow(c, lx, ly + 7, 34, 'w', .95)) + `<path d="M${lx} ${ly}v3" stroke="#2a2440" stroke-width=".8"/><path d="M${lx - 3.4} ${ly + 3}h6.8l-.8 9h-5.2z" fill="#ffe7a6"/><path d="M${lx - 4} ${ly + 2.6}h8M${lx - 3.4} ${ly + 12.2}h6.8" stroke="#2a2440" stroke-width="1.1"/>` + mjGlow(c, lx, ly + 7.5, 7, 'f', 1);
}
// chiếc ô màu hồng nhìn hơi nghiêng từ trên xuống: tán vòm 8 gọng, mép trước lượn giữa các đầu gọng, cán thẳng và móc cong.
// x,y là tâm vành tán; o.shaft: độ dài cán dưới vành (theo R), o.handle:false bỏ móc, o.lights: đèn nhỏ quanh mép, o.stars: sao trên tán, o.bent: một gọng gãy
function mjUmbC(c, x, y, R = 26, rot = 0, o = {}){
  const ry = R * .27, A = [0, -R * .6], T = a => [R * Math.cos(a * Math.PI / 180), ry * Math.sin(a * Math.PI / 180)];
  const front = [180, 135, 90, 45, 0].map(T), P = p => `${_r1(p[0])} ${_r1(p[1])}`;
  const rib = t => `Q${_r1(t[0] * .97)} ${_r1(t[1] + (A[1] - t[1]) * .74)} ${P(t)}`, ribBack = t => `Q${_r1(t[0] * .97)} ${_r1(t[1] + (A[1] - t[1]) * .74)} ${P(A)}`;
  const scal = (a, b) => { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; return `Q${_r1(m[0] + (A[0] - m[0]) * .1)} ${_r1(m[1] + (A[1] - m[1]) * .16)} ${P(b)}`; };
  const cols = ['#ffadc9', '#f791b8', '#e5739f', '#c85987'];
  let g = `<path d="M${P(front[0])}Q${_r1(-R * .98)} ${_r1(A[1] * .78)} ${P(A)}Q${_r1(R * .98)} ${_r1(A[1] * .78)} ${P(front[4])}L${P(front[0])}Z" fill="#9c3f69"/>`;
  for (let i = 0; i < 4; i++) g += `<path d="M${P(A)}${rib(front[i])}${scal(front[i], front[i + 1])}${ribBack(front[i + 1])}Z" fill="${cols[i]}"/>`;
  // ánh sáng mềm trên vòm và bóng tối dọc mép
  g += `<path d="M${_r1(-R * .78)} ${_r1(-R * .18)}Q${_r1(-R * .62)} ${_r1(-R * .5)} ${_r1(-R * .14)} ${_r1(-R * .56)}" stroke="#ffe0ec" stroke-width="${_r1(R * .09)}" stroke-linecap="round" fill="none" opacity=".45"/>`;
  g += `<path d="M${P(front[0])}${front.slice(1).map((t, i) => scal(front[i], t)).join('')}" stroke="#8e3460" stroke-width="${_r1(R * .05)}" fill="none" opacity=".55" stroke-linejoin="round"/>`;
  g += front.slice(1, 4).map(t => `<path d="M${P(A)}${rib(t)}" stroke="#a9446f" stroke-width=".6" fill="none" opacity=".75"/>`).join('');
  g += front.map(t => `<path d="M${P(t)}l0 ${_r1(R * .05)}" stroke="#5a2a40" stroke-width="1.1" stroke-linecap="round"/>`).join('');
  if (o.bent) { const t = front[3]; g += `<path d="M${P(t)}l${_r1(R * .05)} ${_r1(R * .16)}" stroke="#8e3460" stroke-width="1" stroke-linecap="round"/>`; }
  g += mjDots(c, Math.round(R * .7), [-R, A[1], R, ry], ['#ffffff', '#ffe3ee'], [.4, .9], .4, (px, py) => py < ry * .4 && Math.pow(px / R, 2) + Math.pow((py - ry * .2) / (A[1] - ry * .2), 2) < .8);
  if (o.lights) front.forEach(t => { g += mjGlow(c, t[0], t[1] + 2, 6, 'f', .8) + `<circle cx="${_r1(t[0])}" cy="${_r1(t[1] + 2)}" r=".9" fill="#fff6c8"/>`; });
  if (o.stars) for (let i = 0; i < o.stars; i++) { const px = (c.r() - .5) * R * 1.5, py = A[1] * (.15 + c.r() * .7); if (Math.pow(px / R, 2) + Math.pow(py / A[1], 2) > .75) continue; const z = 1.3 + c.r() * 2; g += mjGlow(c, px, py, z * 3.2, 'f', .7) + mjSpark(px, py, z, '#fff3b0'); }
  if (MJ_DRIP) { const T = MJ_TF || { x:0, y:0, sx:1, sy:1 }; MJ_UMBS.push([T.x + x * T.sx, T.y + y * T.sy, R * Math.abs(T.sy), rot * Math.sign(T.sx)].map(_r1).join(',')); }
  if (MJ_DRIP) { const ar = rot * Math.PI / 180, co = Math.cos(ar), si = Math.sin(ar); front.forEach(t => mjDripAt(x + t[0] * co - (t[1] + R * .05) * si, y + t[0] * si + (t[1] + R * .05) * co)); }
  const sh = R * (o.shaft ?? .9);
  if (o.shaft !== 0) g += `<path d="M0 ${_r1(ry * .9)}V${_r1(sh)}" stroke="#3e3550" stroke-width="1.1" stroke-linecap="round"/>${o.handle === false ? '' : `<path d="M0 ${_r1(sh)}v1.6q0 3.6 3.4 3.6q2.6 0 2.8-2.6" fill="none" stroke="#4a3a6a" stroke-width="1.9" stroke-linecap="round"/>`}`;
  return `<g transform="translate(${_r1(x)} ${_r1(y)}) rotate(${rot})">${mjA(c, 'mja-umb', g + `<path d="M-.8 ${_r1(A[1] + .4)}L0 ${_r1(A[1] - R * .16)}L.8 ${_r1(A[1] + .4)}Z" fill="#3e3550"/>`)}</g>`;
}
// cây thông tối nhiều tầng
function mjPine(x, gy, h, col = '#0a1430', w = .42){
  let d = `M${_r1(x - 1.2)} ${gy}V${_r1(gy - h * .2)}H${_r1(x + 1.2)}V${gy}Z`;
  for (let i = 0; i < 5; i++) { const y0 = gy - h * .12 - i * h * .17, ww = h * w * (1 - i / 5.6); d += `M${_r1(x - ww / 2)} ${_r1(y0)}Q${_r1(x - ww * .2)} ${_r1(y0 - h * .1)} ${_r1(x)} ${_r1(y0 - h * .3)}Q${_r1(x + ww * .2)} ${_r1(y0 - h * .1)} ${_r1(x + ww / 2)} ${_r1(y0)}Q${_r1(x)} ${_r1(y0 - h * .04)} ${_r1(x - ww / 2)} ${_r1(y0)}Z`; }
  return `<path d="${d}" fill="${col}"/>`;
}
// cụm lá tròn (bụi cây, tán cây) bằng nhiều nét sáp xoay quanh tâm
function mjBush(c, x, y, rx, ry, cols, n = 60, o = {}){
  return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${cols[0]}"/>` + mjS(c, n, [x - rx, y - ry, x + rx, y + ry], cols.slice(1), { fa:(px, py) => Math.atan2(py - y, px - x) * 180 / Math.PI + 90, len:[4, 11], w:[1.6, 2.6], op:o.op ?? .8, jit:20, bend:.4, in:(px, py) => ((px - x) / rx) ** 2 + ((py - y) / ry) ** 2 < 1 });
}

/* ---------- nhân vật ---------- */
// chuyển động nhẹ bằng CSS (app.css, mục .mja-*): bọc một nhóm hình, lệch pha theo số ngẫu nhiên của tranh
// org [x,y]: tâm xoay tính theo toạ độ vẽ (vd. cổ), để đầu xoay quanh cổ chứ không quanh mép dưới của khối tóc
const mjA = (c, cls, inner, dur, org) => `<g class="mja ${cls}" style="animation-delay:-${_r1(c.r() * 9)}s${dur ? `;animation-duration:${_r1(dur * (.8 + c.r() * .4))}s` : ''}${org ? `;transform-box:view-box;transform-origin:${org[0]}px ${org[1]}px` : ''}">${inner}</g>`;
const mjLn = (d, col, w, op = 1) => `<path d="${d}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="${op}"/>`;
// Trân: cô bé mặc áo mưa hồng dáng chữ A, quần xanh than, ủng hồng đậm, tóc nâu dài. Trời mưa (MJ_HOOD) thì trùm mũ áo, lọn tóc lòi ra ngoài.
// Vẽ kiểu tranh: khối màu mềm, sắc độ cùng màu, không viền đen. Chân ở (0,0), cao khoảng 52 khi s=1.
// pose: back (đứng quay lưng), side (đứng nghiêng sang phải), kneel (ngồi thụp, nhìn sang phải), sit (ngồi quay lưng), perch (ngồi thả chân, nhìn sang phải), reach (quay lưng, giơ tay)
// o: flip, wind (tóc bay), hand (điểm bàn tay phải, tay tự gập khuỷu), umb {hand,R,rot,...} (tay thứ hai cầm ô nếu khác hand), lantern [x,y], cat (bế Moon), closedUmb, legs:false, closed, shadow, hood
let MJ_HOOD = false;
// MJ_DRIP: khi vẽ tranh mưa, gom các điểm nước nhỏ giọt (mép dù, gấu áo mưa, mái hiên) theo toạ độ tranh 400x250, kèm mặt đất bên dưới.
// MJ_TF: phép dời/thu phóng của nhân vật đang vẽ, để đổi toạ độ trong người ra toạ độ tranh.
let MJ_DRIP = null, MJ_TF = null, MJ_UMBS = null, MJ_COLD = false;   // MJ_UMBS: vòm ô để mưa bắn tung trên mặt ô
const mjDripAt = (lx, ly, gy) => { if (!MJ_DRIP) return; const T = MJ_TF || { x:0, y:0, sx:1, sy:1, gy }; MJ_DRIP.push([_r1(T.x + lx * T.sx), _r1(T.y + ly * T.sy), _r1(gy ?? T.gy)]); };
function mjGirl(c, x, y, s = 1, pose = 'back', o = {}){
  const K = '#f7d9c4', KS = '#e0b19a', CO = '#f08db1', COS = '#cc6690', COL = '#ffc2d7', COD = '#a8477a', BO = '#b9395f', BOL = '#e4688f', PA = '#2b3566', HR = '#3b2729', HM = '#5a3b3d', HL = '#8e6866';
  const f = o.flip ? -1 : 1, ln = mjLn, W = o.wind || 0, hood = o.hood ?? MJ_HOOD, P = (d, fill, op) => `<path d="${d}" fill="${fill}"${op ? ` opacity="${op}"` : ''}/>`;
  const L1 = 8.2, L2 = 7.8, TF0 = MJ_TF; MJ_TF = { x, y, sx:s * f, sy:s, gy:y }; if (o.walk) MJ_DRIP = null;   // người đang đi thì không gắn điểm nhỏ giọt cố định
  // o.walk: bước đi (hai chân đưa lệch nhịp, thân nhún theo bước, tay đánh nhẹ); cả nhóm dùng chung một pha
  const wk = !!o.walk, D0 = MJ_DRIP, ph = _r1(c.r() * 2), G = (cls, inner) => `<g class="mja ${cls}" style="animation-delay:-${ph}s">${inner}</g>`;
  const reach = (S, H) => { const dx = H[0] - S[0], dy = H[1] - S[1], d = Math.hypot(dx, dy), m = L1 + L2 - .3; return d > m ? [S[0] + dx * m / d, S[1] + dy * m / d] : H; };
  // tay áo mưa: vai -> khuỷu -> bàn tay, khuỷu gập xuống
  const arm = (S, H0, far) => {
    const H = reach(S, H0), dx = H[0] - S[0], dy = H[1] - S[1], d = Math.hypot(dx, dy) || 1;
    let E; if (d >= L1 + L2 - .4) E = [S[0] + dx * L1 / d, S[1] + dy * L1 / d];
    else { const dd = Math.max(d, Math.abs(L1 - L2) + .5), a = (L1 * L1 - L2 * L2 + dd * dd) / (2 * dd), h = Math.sqrt(Math.max(0, L1 * L1 - a * a)), px = S[0] + dx * a / d, py = S[1] + dy * a / d, nx = -dy / d, ny = dx / d, e1 = [px + nx * h, py + ny * h], e2 = [px - nx * h, py - ny * h]; E = H[1] < S[1] - 4 ? (Math.abs(e1[0]) > Math.abs(e2[0]) ? e1 : e2) : (e1[1] > e2[1] ? e1 : e2); }
    // vai -> khuỷu -> cổ tay là hai đoạn nối mềm ở khuỷu, nên thấy rõ cánh tay trên, khuỷu và cẳng tay; giơ tay lên thì khuỷu chĩa ra ngoài
    const dp = `M${_r1(S[0])} ${_r1(S[1])}L${_r1(E[0])} ${_r1(E[1])}L${_r1(H[0])} ${_r1(H[1])}`, hx = H[0] - (H[0] - E[0]) * .12, hy = H[1] - (H[1] - E[1]) * .12;
    return `<path d="${dp}" fill="none" stroke="${far ? COD : COS}" stroke-width="4.1" stroke-linecap="round" stroke-linejoin="round"/>` + (far ? '' : `<path d="${dp}" fill="none" stroke="${CO}" stroke-width="3.1" stroke-linecap="round" stroke-linejoin="round"/><path d="${dp}" fill="none" stroke="${COL}" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round" opacity=".45" transform="translate(-.6 -.6)"/>`)
      + `<circle cx="${_r1(H[0])}" cy="${_r1(H[1])}" r="1.55" fill="${far ? KS : K}"/>` + `<circle cx="${_r1(hx)}" cy="${_r1(hy)}" r="1.9" fill="${far ? COD : COS}"/>`;
  };
  const bootB = bx => P(`M${_r1(bx - 1.9)} 0Q${_r1(bx - 2.1)} -1 ${_r1(bx - 1.9)} -1.8V-8.6H${_r1(bx + 1.9)}V-1.8Q${_r1(bx + 2.1)} -1 ${_r1(bx + 1.9)} 0Z`, BO) + P(`M${_r1(bx - 1.3)} -8.2H${_r1(bx - .4)}V-1.6H${_r1(bx - 1.3)}Z`, BOL, .55);
  const bootS = bx => P(`M${_r1(bx - 1.9)} 0V-8.6H${_r1(bx + 1.7)}V-2.6Q${_r1(bx + 2.1)} -1.4 ${_r1(bx + 3.6)} -1.2Q${_r1(bx + 4.4)} -.6 ${_r1(bx + 3.8)} 0Z`, BO) + P(`M${_r1(bx - 1.3)} -8.2H${_r1(bx - .5)}V-1.4H${_r1(bx - 1.3)}Z`, BOL, .55);
  // tóc bồng: nới rộng khối tóc quanh tâm đầu (cx) cho phồng, không bết sát đầu
  const wind = (cy, inner, cx = 0) => `<g transform="translate(${_r1(cx)} ${_r1(cy)}) skewX(${-W * 1.4}) scale(1.14 1) translate(${_r1(-cx)} ${_r1(-cy)})">${mjA(c, 'mja-hair', inner)}</g>`;
  // tóc dài nhìn từ sau (đầu tâm 0,hy): khối tóc dày có độ phồng ở đỉnh, lớp dưới sẫm lộ ra ở mép cho thấy độ dày,
  // đuôi tóc lượn hai sóng mềm, vầng bóng ngang đỉnh đầu và vài vệt sợi theo khối
  const HD = '#261619';
  // nơ hồng nhỏ buộc tóc (cùng tông áo), sx < 1 khi nhìn nghiêng
  const bow = (x, y, sc = 1, sx = 1) => `<g transform="translate(${_r1(x)} ${_r1(y)}) scale(${_r1(sc * sx * 100) / 100} ${_r1(sc * 100) / 100})">`
    + P('M-.4 .6L-2 3.6L-1 3.3L-.5 4.1L.2 .8ZM.4 .6L2 3.6L1 3.3L.5 4.1L-.2 .8Z', COS)
    + `<path d="M0 0C-1.4 -2.4 -4.2 -2.4 -4 0C-4.2 2.2 -1.4 2.2 0 0ZM0 0C1.4 -2.4 4.2 -2.4 4 0C4.2 2.2 1.4 2.2 0 0Z" fill="${CO}" stroke="${COD}" stroke-width=".35"/>`
    + ln('M-.8 -.2Q-2.2 -1.2 -3.2 -.4M.8 -.2Q2.2 -1.2 3.2 -.4', COS, .5, .8) + ln('M-3.4 -.9Q-3 -1.6 -2.2 -1.6M3.4 -.9Q3 -1.6 2.2 -1.6', COL, .5, .7)
    + `<ellipse cx="0" cy="0" rx=".95" ry="1.15" fill="${COS}"/><ellipse cx="-.2" cy="-.3" rx=".35" ry=".4" fill="${COL}" opacity=".7"/></g>`;
  const hairBack = (hy, len) => wind(hy, P(`M-7.6 ${hy + 2}C-8.8 ${hy + len * .4} -9.4 ${hy + len * .78} -8.6 ${hy + len * 1.02}Q-7.4 ${hy + len * 1.1} -6 ${hy + len * .96}ZM7.6 ${hy + 2}C8.8 ${hy + len * .4} 9.4 ${hy + len * .78} 8.6 ${hy + len * 1.02}Q7.4 ${hy + len * 1.1} 6 ${hy + len * .96}Z`, HD)
    + P(`M-7 ${hy}C-7.6 ${hy - 9.6} 7.6 ${hy - 9.6} 7 ${hy}C8 ${hy + len * .3} 8.6 ${hy + len * .66} 8.2 ${hy + len * .9}Q7.6 ${hy + len * 1.04} 5.6 ${hy + len * 1.02}Q2.8 ${hy + len * 1.12} 0 ${hy + len * 1.04}Q-2.8 ${hy + len * 1.12} -5.6 ${hy + len * 1.02}Q-7.6 ${hy + len * 1.04} -8.2 ${hy + len * .9}C-8.6 ${hy + len * .66} -8 ${hy + len * .3} -7 ${hy}Z`, HR)
    + ln(`M-3.4 ${hy - 3}C-4.4 ${hy + len * .4} -4.6 ${hy + len * .72} -4.4 ${hy + len * .98}M3.4 ${hy - 3}C4.4 ${hy + len * .4} 4.6 ${hy + len * .72} 4.4 ${hy + len * .98}M0 ${hy - 4}Q.4 ${hy + len * .5} 0 ${hy + len * .98}`, HM, .8, .65)
    + ln(`M-5.4 ${hy - 2.4}Q0 ${hy - 7.6} 5.4 ${hy - 2.4}`, HL, 1.7, .5) + ln(`M-3.8 ${hy - 5.2}Q0 ${hy - 7.4} 3.8 ${hy - 5.2}`, HL, .9, .45)
    + ln(`M-6 ${hy + len * .22}Q-6.8 ${hy + len * .48} -6.4 ${hy + len * .74}M6.2 ${hy + len * .24}Q7 ${hy + len * .5} 6.6 ${hy + len * .74}`, HL, .9, .35)
    + ln(`M-2.8 ${hy + len * 1.06}Q-3 ${hy + len * .9} -2.4 ${hy + len * .78}M2.8 ${hy + len * 1.06}Q3 ${hy + len * .9} 2.4 ${hy + len * .78}`, HD, .7, .7)
    + bow(0, hy + 1.4, .95), 0);
  // mũ áo mưa nối liền cổ áo (cùng màu, kéo từ vai lên trùm đầu, chóp hơi nhọn), nhìn từ sau; tóc nằm gọn trong mũ
  const hoodB = hy => P(`M-8.2 ${hy + 11.6}C-9.8 ${hy + 3.4} -8.6 ${hy - 6.6} -1.4 ${hy - 10}Q0 ${hy - 11.4} 1.4 ${hy - 10}C8.6 ${hy - 6.6} 9.8 ${hy + 3.4} 8.2 ${hy + 11.6}Q4.4 ${hy + 12.6} 0 ${hy + 16}Q-4.4 ${hy + 12.6} -8.2 ${hy + 11.6}Z`, CO)
    + P(`M2.6 ${hy - 9.8}C7.4 ${hy - 8} 9.8 ${hy + 2} 8.2 ${hy + 12.6}Q6.4 ${hy + 13.6} 4.6 ${hy + 14}C6.2 ${hy + 6} 5.8 ${hy - 3} 2.6 ${hy - 9.8}Z`, COS, .7)
    + ln(`M0 ${hy - 10}Q.6 ${hy + 1} 0 ${hy + 13.6}`, COS, .7, .75) + ln(`M-6.6 ${hy + 9.6}Q0 ${hy + 12.4} 6.6 ${hy + 9.6}M-7.6 ${hy + 11.6}Q0 ${hy + 14} 7.6 ${hy + 11.6}`, COD, .7, .55) + ln(`M-5 ${hy - 7.4}Q-2.6 ${hy - 9.4} 0 ${hy - 9.8}`, COL, 1.1, .5);
  // đầu nhìn nghiêng sang phải, tâm (hx,hy)
  const headSide = (hx, hy, len) => {
    const X = d => _r1(hx + d), Y = d => _r1(hy + d);
    // tóc nhìn nghiêng: phồng ở đỉnh và sau đầu, đổ thành khối dày xuống lưng, đuôi hai lớp lượn vào; lớp sẫm phía sau cho độ dày
    const hair = P(`M${X(-7.4)} ${Y(1)}C${X(-10.6)} ${Y(len * .4)} ${X(-11.8)} ${Y(len * .8)} ${X(-10.8)} ${Y(len * 1.02)}Q${X(-9.8)} ${Y(len * 1.12)} ${X(-8.4)} ${Y(len * .98)}Z`, HD)
      + P(`M${X(4.8)} ${Y(-4.2)}C${X(4.6)} ${Y(-9)} ${X(-3.6)} ${Y(-10.4)} ${X(-7.2)} ${Y(-5.8)}C${X(-9.4)} ${Y(-2.8)} ${X(-9.6)} ${Y(1.6)} ${X(-9.4)} ${Y(len * .3)}C${X(-9.4)} ${Y(len * .6)} ${X(-10.4)} ${Y(len * .84)} ${X(-9.8)} ${Y(len * 1)}Q${X(-8.8)} ${Y(len * 1.14)} ${X(-6.8)} ${Y(len * 1.06)}Q${X(-5.4)} ${Y(len * 1.12)} ${X(-4.2)} ${Y(len * .98)}C${X(-3.6)} ${Y(len * .7)} ${X(-2.8)} ${Y(len * .4)} ${X(-2.4)} ${Y(4.4)}C${X(-2)} ${Y(1)} ${X(.4)} ${Y(-2.2)} ${X(2.4)} ${Y(-2.8)}Q${X(3.8)} ${Y(-3)} ${X(4.8)} ${Y(-4.2)}Z`, HR)
      + ln(`M${X(-6.2)} ${Y(-1)}C${X(-7.2)} ${Y(len * .3)} ${X(-7.6)} ${Y(len * .62)} ${X(-8.4)} ${Y(len * .94)}M${X(-4)} ${Y(1.4)}C${X(-4.4)} ${Y(len * .4)} ${X(-4.8)} ${Y(len * .66)} ${X(-5.4)} ${Y(len * .96)}`, HM, .8, .7)
      + ln(`M${X(-6.6)} ${Y(-3)}Q${X(-3.8)} ${Y(-8.8)} ${X(2.6)} ${Y(-7.8)}`, HL, 1.6, .5) + ln(`M${X(-8.2)} ${Y(len * .3)}Q${X(-8.6)} ${Y(len * .55)} ${X(-8.2)} ${Y(len * .78)}`, HL, .9, .35)
      + P(`M${X(-3.2)} ${Y(2)}C${X(-1.4)} ${Y(5)} ${X(-.6)} ${Y(len * .4)} ${X(-.8)} ${Y(len * .6)}Q${X(-1.2)} ${Y(len * .72)} ${X(-2)} ${Y(len * .64)}C${X(-2.4)} ${Y(len * .4)} ${X(-3)} ${Y(len * .25)} ${X(-4.4)} ${Y(3.4)}Z`, HR)
      + ln(`M${X(-2.6)} ${Y(4)}C${X(-1.6)} ${Y(len * .3)} ${X(-1.4)} ${Y(len * .45)} ${X(-1.4)} ${Y(len * .58)}`, HL, .6, .45)
      + bow(hx - 6.6, hy - 2.6, .8, .62);
    let puff = '';
    if (MJ_COLD) { const pg = c.id(); c.def(`<radialGradient id="${pg}"><stop offset="0" stop-color="#eef3ff" stop-opacity=".85"/><stop offset=".6" stop-color="#eef3ff" stop-opacity=".3"/><stop offset="1" stop-color="#eef3ff" stop-opacity="0"/></radialGradient>`);
      puff = [0, 1.6, 3.2].map((d, i) => `<g class="mja-puff" style="animation-delay:-${d}s"><ellipse cx="${X(9.6)}" cy="${Y(2.2)}" rx="${2.4 + i * .3}" ry="${1.6 + i * .2}" fill="url(#${pg})"/></g>`).join(''); }
    // mũ áo mưa nhìn nghiêng, may liền cổ áo: chóp hơi nhọn phía sau đỉnh đầu, ôm gáy rồi đổ thẳng xuống nối vào thân áo.
    // Vẽ đè lên đầu nên phần đầu sau vành mũ bị che đúng chỗ; tóc nằm gọn trong mũ, chỉ lộ tóc mái và hai lọn ôm má dưới vành
    const cap = hood ? P(`M${X(-.4)} ${Y(-6.4)}C${X(-2.6)} ${Y(-3)} ${X(-2.4)} ${Y(2)} ${X(-1)} ${Y(5.4)}Q${X(.2)} ${Y(7.6)} ${X(1.4)} ${Y(8.4)}L${X(1.8)} ${Y(6)}Q${X(.6)} ${Y(3)} ${X(.4)} ${Y(-1)}Q${X(.4)} ${Y(-4.2)} ${X(1.4)} ${Y(-6.2)}Z`, HR)
      + P(`M${X(3.6)} ${Y(-8.2)}C${X(.4)} ${Y(-11.4)} ${X(-5.4)} ${Y(-11.6)} ${X(-8.6)} ${Y(-10.4)}Q${X(-10)} ${Y(-10)} ${X(-10)} ${Y(-8.4)}C${X(-10.8)} ${Y(-3)} ${X(-10.2)} ${Y(3)} ${X(-8.4)} ${Y(7.6)}C${X(-7.6)} ${Y(9.8)} ${X(-7.6)} ${Y(11.4)} ${X(-8)} ${Y(13.4)}L${X(5)} ${Y(13)}Q${X(5.4)} ${Y(10)} ${X(4.2)} ${Y(8.2)}Q${X(1.4)} ${Y(8.6)} ${X(-.6)} ${Y(6.6)}C${X(-2.8)} ${Y(4)} ${X(-3.2)} ${Y(-1.4)} ${X(-2.4)} ${Y(-4.6)}Q${X(-1)} ${Y(-7.6)} ${X(3.6)} ${Y(-8.2)}Z`, CO)
      + P(`M${X(-10)} ${Y(-8.4)}C${X(-10.8)} ${Y(-3)} ${X(-10.2)} ${Y(3)} ${X(-8.4)} ${Y(7.6)}C${X(-7.6)} ${Y(9.8)} ${X(-7.6)} ${Y(11.4)} ${X(-8)} ${Y(13.4)}L${X(-5.6)} ${Y(13.2)}C${X(-5.6)} ${Y(9)} ${X(-7.4)} ${Y(4)} ${X(-7.6)} ${Y(-2)}Q${X(-7.8)} ${Y(-7)} ${X(-6.4)} ${Y(-10.8)}Q${X(-8.8)} ${Y(-10.6)} ${X(-10)} ${Y(-8.4)}Z`, COS, .7)
      + ln(`M${X(3.4)} ${Y(-8)}Q${X(-1)} ${Y(-7.4)} ${X(-2.4)} ${Y(-4.4)}C${X(-3.2)} ${Y(-1.4)} ${X(-2.8)} ${Y(4)} ${X(-.6)} ${Y(6.6)}Q${X(1.4)} ${Y(8.6)} ${X(4.2)} ${Y(8.2)}`, COD, 1.1, .8)
      + ln(`M${X(3.2)} ${Y(-8.9)}Q${X(-1.6)} ${Y(-8.4)} ${X(-3.2)} ${Y(-4.8)}`, COL, .8, .6)
      + ln(`M${X(-6.4)} ${Y(4)}Q${X(-4.6)} ${Y(5.6)} ${X(-4.4)} ${Y(8.6)}M${X(-5.4)} ${Y(-6)}Q${X(-6.2)} ${Y(-2)} ${X(-5.8)} ${Y(1.6)}`, COS, .7, .6)
      + ln(`M${X(-7.4)} ${Y(11.4)}Q${X(-1)} ${Y(12.6)} ${X(4.8)} ${Y(11.6)}`, COD, .7, .5) : '';
    return puff + (hood ? '' : wind(hy, hair, hx - 2)) + P(`M${X(-3.6)} ${Y(-.6)}C${X(-3.8)} ${Y(-5.6)} ${X(-.6)} ${Y(-6.4)} ${X(1.6)} ${Y(-6)}C${X(4.4)} ${Y(-5.6)} ${X(5.6)} ${Y(-3.6)} ${X(5.6)} ${Y(-1.4)}L${X(6.6)} ${Y(.6)}Q${X(6.4)} ${Y(1.2)} ${X(5.6)} ${Y(1.2)}Q${X(5.8)} ${Y(3.4)} ${X(4.2)} ${Y(4.6)}C${X(2.4)} ${Y(5.8)} ${X(-.4)} ${Y(5.8)} ${X(-2)} ${Y(4.4)}C${X(-3.2)} ${Y(3.2)} ${X(-3.6)} ${Y(1.6)} ${X(-3.6)} ${Y(-.6)}Z`, K)
      + P(`M${X(-4.2)} ${Y(-.6)}C${X(-4.6)} ${Y(-6.4)} ${X(-.6)} ${Y(-7.6)} ${X(2)} ${Y(-7.2)}C${X(4.4)} ${Y(-6.8)} ${X(5.6)} ${Y(-5.2)} ${X(5.6)} ${Y(-3.2)}Q${X(3.8)} ${Y(-4.6)} ${X(1.6)} ${Y(-4.2)}Q${X(-.6)} ${Y(-3.4)} ${X(-1.2)} ${Y(-.8)}Q${X(-2)} ${Y(1.6)} ${X(-1.8)} ${Y(3.6)}Q${X(-3.6)} ${Y(1.8)} ${X(-4.2)} ${Y(-.6)}Z`, HR)
      + (o.closed ? ln(`M${X(2.6)} ${Y(-.4)}q.8.6 1.6.1`, '#3a2228', .5) : mjA(c, 'mja-blink', `<ellipse cx="${X(3.2)}" cy="${Y(-.3)}" rx=".6" ry=".75" fill="#2a1a20"/>`, 5.2)) + `<ellipse cx="${X(3)}" cy="${Y(2.2)}" rx="1.4" ry=".9" fill="#f29aa8" opacity=".55"/>` + ln(`M${X(4.4)} ${Y(3.2)}q.4.2.7-.1`, '#c46a78', .45) + cap;
  };
  const coatTex = box => mjS(c, 9, box, [COS, COL], { ang:88, len:[4, 9], w:[.9, 1.4], op:.6, jit:10 });
  let g = '';
  if (o.shadow !== false && pose !== 'perch') g += `<ellipse cx="0" cy="0" rx="${pose === 'sit' || pose === 'kneel' ? 13 : 10}" ry="2.2" fill="#03060f" opacity=".45"/>`;
  const umbHand = o.umb && o.umb.hand && (!o.hand || o.umb.hand[0] !== o.hand[0] || o.umb.hand[1] !== o.hand[1]) ? o.umb.hand : null;
  let SH = [0, 0];
  if (pose === 'back' || pose === 'reach') {
    SH = [5.2, -34.4];
    g += wk ? G('mja-bkA', P('M-4.2 -13.4H-1.2V-8H-4.2Z', PA) + bootB(-2.7)) + G('mja-bkB', P('M1.2 -13.4H4.2V-8H1.2Z', PA) + bootB(2.7))
      : P('M-4.2 -12.4H-1.2V-8H-4.2ZM1.2 -12.4H4.2V-8H1.2Z', PA) + bootB(-2.7) + bootB(2.7);
    g += P('M-5.6 -37C-7.4 -33 -9.4 -22 -10.6 -13Q-5 -11.2 0 -11.8Q5 -11.2 10.6 -13C9.4 -22 7.4 -33 5.6 -37Q0 -39.4 -5.6 -37Z', CO) + P('M2.6 -38.4C5.6 -32 7.4 -22 7.6 -11.8Q9.4 -12.2 10.6 -13C9.4 -22 7.4 -33 5.6 -37Z', COS, .75) + ln('M-10.4 -13.2Q0 -10.6 10.4 -13.2', COD, .8, .6) + ln('M-.2 -37.6Q.4 -25 0 -12', COS, .6, .6) + coatTex([-9, -36, 7, -14]);
    // nhìn từ sau: hai tay buông hai bên thân, vai nằm dưới tóc; tay giơ lên (chỉ sao, cầm ô) vẽ sau tóc
    const HB = pose === 'reach' ? [12.6, -46.4] : o.hand || [9.2, -19.6], up = HB[1] < -30;
    if (o.closedUmb) { const [hx, hy] = reach(SH, HB), tx = hx + 1.5, ty = -1.2, k = t => [_r1(hx + (tx - hx) * t), _r1(hy + (ty - hy) * t)], [ax, ay] = k(.2), [bx, by] = k(.55), [cx, cy] = k(.93);
      // ô gập: tay nắm cán ngay dưới tay cầm cong, cán thẳng xuống đất, vải ô cuộn gọn thành búp thon có đai cài
      g += `<path d="M${_r1(hx)} ${_r1(hy + 1)}L${_r1(tx)} ${ty}" stroke="#4a3a6a" stroke-width=".9" stroke-linecap="round"/>` + ln(`M${_r1(hx)} ${_r1(hy + .4)}V${_r1(hy - 1.2)}Q${_r1(hx)} ${_r1(hy - 3)} ${_r1(hx - 1.6)} ${_r1(hy - 3)}Q${_r1(hx - 3)} ${_r1(hy - 3)} ${_r1(hx - 3)} ${_r1(hy - 1.6)}`, '#6b4a3a', 1.1)
        + P(`M${ax - .5} ${ay}Q${bx - 2} ${by} ${cx - .3} ${cy}L${cx + .3} ${cy}Q${bx + 2} ${by} ${ax + .5} ${ay}Z`, '#e5739f') + ln(`M${ax} ${ay}Q${bx - .6} ${by} ${cx} ${cy}`, '#c9578a', .5, .8) + ln(`M${_r1(bx - 1.5)} ${_r1(by - 1.4)}L${_r1(bx + 1.5)} ${_r1(by - 1.2)}`, '#b9395f', .9) + `<circle cx="${_r1(bx + 1.5)}" cy="${_r1(by - 1.2)}" r=".45" fill="#ffc2d7"/>`; }
    g += arm([-5.2, -34.4], [-9.2, -19.6]) + (up ? '' : arm(SH, HB));
    g += mjA(c, 'mja-look', P('M-6.6 -37.8Q-7.8 -32.6 -3 -31.2Q0 -30.6 3 -31.2Q7.8 -32.6 6.6 -37.8Z', COS) + (hood ? hoodB(-44) : hairBack(-44, 18)), 11, [0, -37]);
    { mjDripAt(-10.2, -12.8); mjDripAt(10.2, -12.8); mjDripAt(-3, -11.6); }
    if (up) g += arm(SH, HB);
  } else if (pose === 'side') {
    SH = [.6, -34.2];
    const lg = o.legs !== false;
    // tay xa (sau thân) cầm ô khi tay gần đang bế Moon hay làm việc khác, để mỗi tay mọc từ một vai
    g += arm([-1.6, -34.4], umbHand || [-3.6, -21], true);
    if (lg) g += wk ? G('mja-legB', P('M-3.6 -13.4H-.8V-8H-3.6Z', PA) + bootS(-2.2)) + G('mja-legA', P('M.6 -13.4H3.4V-8H.6Z', PA) + bootS(2))
      : P('M-3.6 -12.4H-.8V-8H-3.6ZM.6 -12.4H3.4V-8H.6Z', PA) + bootS(-2.2) + bootS(2);
    { mjDripAt(-9.4, -12.8); mjDripAt(8.2, -13.2); }
    g += P('M-4.6 -37.4C-7 -32 -9 -22 -9.8 -13Q-1 -11.4 8.6 -13.4C7.6 -22 6 -32 4.4 -37Q0 -39.2 -4.6 -37.4Z', CO) + P('M-4.6 -37.4C-7 -32 -9 -22 -9.8 -13Q-7.4 -12.4 -5.4 -12.2C-5.6 -22 -4.4 -32 -2.4 -38.2Z', COS, .75) + P('M1.4 -24.6H5.4V-20.4Q3.4 -19.8 1.4 -20.4Z', COS, .8) + ln('M5 -36Q6.4 -25 7.6 -13.4', COD, .6, .6) + ln('M-9.6 -13.2Q-1 -11 8.4 -13.6', COD, .8, .6) + coatTex([-7, -36, 6, -14]);
    if (!hood) g += P('M-5.2 -37.8Q-7.8 -33.6 -5 -31.6Q-3.4 -33.6 -1.4 -36.4Z', COS);
    g += mjA(c, 'mja-look', headSide(1.2, -43.6, 20), 9, [.4, -37.6]);
    if (o.cat) g += mjCat(c, 4.6, -27, .55, 'held', { eyes:o.eyes }) + arm(SH, [7.2, -25.4]);
    if (!o.cat || o.hand) g += wk && !o.hand ? G('mja-armS', arm(SH, [3.6, -21])) : arm(SH, o.hand || [3.6, -21]);
  } else if (pose === 'kneel') {
    SH = [2.6, -20.6];
    g += bootS(7.4).replace(/V-8\.6/g, 'V-4.6');
    if (umbHand) g += arm([-.6, -21.4], umbHand, true);
    g += P('M-8.8 0C-9.6 -8 -7.6 -16 -3.6 -22.6Q1 -25.4 5.4 -22.4C9 -16 10 -8 9.6 -.6Q0 1 -8.8 0Z', CO) + P('M-8.8 0C-9.6 -8 -7.6 -16 -3.6 -22.6Q-2 -23.6 -.6 -24C-3.6 -17 -4.6 -8 -4.2 .4Z', COS, .75) + ln('M-8.6 -.2Q0 1.2 9.4 -.6', COD, .8, .6) + coatTex([-6, -22, 8, -2]);
    if (!hood) g += P('M-2.4 -23.6Q-5.4 -19.6 -2.6 -17.6Q-1 -19.8 1.2 -22.4Z', COS);
    g += headSide(3.4, -29.6, 18);
    if (o.cat) g += mjCat(c, 6.4, -13.4, .6, 'held', { eyes:o.eyes }) + arm(SH, [9.4, -10.4]);
    if (!o.cat || o.hand) g += arm(SH, o.hand || [8.6, -9]);
  } else if (pose === 'sit') {
    g += arm([-4.6, -18.6], [-8.6, -4.6], true) + arm([4.6, -18.6], [8.6, -4.6], true);
    g += P('M-10.6 0C-10.6 -6 -8 -14 -5 -20.6Q0 -22.6 5 -20.6C8 -14 10.6 -6 10.6 0Q0 1.4 -10.6 0Z', CO) + P('M2.4 -21.6C5.6 -15 7.6 -7 7.6 .8Q9.4 .5 10.6 0C10.6 -6 8 -14 5 -20.6Z', COS, .75) + ln('M0 -21.4Q.4 -10 0 1', COS, .6, .6) + coatTex([-8, -20, 8, -2]);
    g += P('M-6 -21.4Q-7 -16.6 -2.6 -15.4Q0 -15 2.6 -15.4Q7 -16.6 6 -21.4Z', COS) + (hood ? hoodB(-27.4) : hairBack(-27.4, 16));
  } else if (pose === 'perch') {
    SH = [1.4, -17];
    if (o.legs !== false) g += P('M3.4 0H6.6V6.4H3.4Z', PA) + `<g transform="translate(0 12.6)">${bootS(4.8).replace(/V-8\.6/g, 'V-6.6')}</g>`;
    g += arm([-1, -17.2], [-4.4, -4.4], true);
    g += P('M-6 1C-7 -6 -6 -14 -3.4 -19.6Q1 -22 4.6 -19.4C6.6 -14 7 -6 6.4 -1.6Q8.6 -1.4 9.8 .8Q2 2.6 -6 1Z', CO) + P('M-6 1C-7 -6 -6 -14 -3.4 -19.6Q-2 -20.6 -.6 -21C-3 -14 -3.4 -6 -2.6 1.4Z', COS, .75) + ln('M-5.8 1Q2 2.4 9.6 .8', COD, .8, .6) + coatTex([-4, -19, 6, -1]);
    if (!hood) g += P('M-2.4 -20.4Q-5.4 -16.4 -2.6 -14.6Q-1 -16.6 1.2 -19.2Z', COS);
    g += headSide(1.8, -26.2, 18) + arm(SH, o.hand || [6.6, -4]);
  }
  if (o.umb) {
    const u = o.umb, R = (u.R || 24) * .82, a = (u.rot || 0) * Math.PI / 180, L = R * (u.shaft ?? .9), hd = u.hand ? reach(SH, u.hand) : null;
    g = mjUmbC(c, hd ? hd[0] + L * Math.sin(a) : u.x, hd ? hd[1] - L * Math.cos(a) : u.y, R, u.rot || 0, u) + g;
    if (hd) g += `<circle cx="${_r1(hd[0])}" cy="${_r1(hd[1])}" r="1.55" fill="${K}"/>`;
  }
  if (o.lantern) g += mjLantern(c, ...reach(SH, o.lantern));
  MJ_TF = TF0; MJ_DRIP = D0;
  // đứng: thở và đổi trọng tâm rất chậm; đi: nhún theo bước
  const body = wk ? G('mja-step', g) : mjA(c, 'mja-sway', mjA(c, 'mja-breath', g), 8);
  return `<g transform="translate(${_r1(x)} ${_r1(y)}) scale(${_r1(s * f * 100) / 100} ${_r1(s * 100) / 100})">${body}</g>`;
}
// Moon: mèo trắng, đỉnh đầu và hai tai màu cam. Chân ở (0,0), ngồi cao khoảng 22 khi s=1.
// pose: sitB (ngồi quay lưng), sitF (ngồi nhìn thẳng, mắt cười; eyes:'open' để mở mắt), walk (đi sang phải), curl (cuộn tròn ngủ), held (đầu và hai chân trước, để bế)
function mjCat(c, x, y, s = 1, pose = 'sitB', o = {}){
  const N = MJN, F = N.fur, S = N.furS, L = N.furL, O = N.orange, f = o.flip ? -1 : 1, ln = mjLn, ph = _r1(c.r() * 2), G = (cls, inner) => `<g class="mja ${cls}" style="animation-delay:-${ph}s">${inner}</g>`;
  // tai phải thỉnh thoảng giật nhẹ
  const earsB = (hx, hy, r) => `<path d="M${_r1(hx - r * .92)} ${_r1(hy - r * .2)}L${_r1(hx - r * .86)} ${_r1(hy - r * 1.36)}L${_r1(hx - r * .2)} ${_r1(hy - r * .78)}Z" fill="${O}"/>` + mjA(c, 'mja-ear', `<path d="M${_r1(hx + r * .92)} ${_r1(hy - r * .2)}L${_r1(hx + r * .86)} ${_r1(hy - r * 1.36)}L${_r1(hx + r * .2)} ${_r1(hy - r * .78)}Z" fill="${O}"/>`, 7);
  // mảng lông cam tự nhiên: phủ đỉnh đầu và lan xuống không đều (bên trái xuống quá mắt, bên phải dừng trên mắt),
  // có vệt lông trắng hình chữ V giữa trán và vài vằn cam đậm; cắt theo đúng khối đầu để không thành dải băng ngang trán
  const OD = '#d9823f';
  const cap = (hx, hy, r, shape, side) => { const k = c.id(), X = d => _r1(hx + d * r * f2), Y = d => _r1(hy + d * r), f2 = side || 1;
    c.def(`<clipPath id="${k}">${shape}</clipPath>`);
    return `<g clip-path="url(#${k})"><path d="M${X(-1.3)} ${Y(.2)}L${X(-1.3)} ${Y(-1.4)}L${X(1.3)} ${Y(-1.4)}L${X(1.3)} ${Y(-.3)}Q${X(.86)} ${Y(-.46)} ${X(.5)} ${Y(-.36)}Q${X(.24)} ${Y(-.32)} ${X(.12)} ${Y(-.56)}Q${X(0)} ${Y(-.84)} ${X(-.12)} ${Y(-.58)}Q${X(-.22)} ${Y(-.3)} ${X(-.48)} ${Y(-.26)}Q${X(-.74)} ${Y(-.2)} ${X(-.78)} ${Y(.12)}Q${X(-.86)} ${Y(.34)} ${X(-1.3)} ${Y(.2)}Z" fill="${O}"/>`
      + ln(`M${X(-.5)} ${Y(-.86)}q${_r1(.08 * r * f2)} ${_r1(.16 * r)} ${_r1(.02 * r * f2)} ${_r1(.3 * r)}M${X(.46)} ${Y(-.88)}q${_r1(-.08 * r * f2)} ${_r1(.16 * r)} ${_r1(-.02 * r * f2)} ${_r1(.3 * r)}M${X(-.8)} ${Y(-.5)}q${_r1(.14 * r * f2)} ${_r1(.06 * r)} ${_r1(.22 * r * f2)} ${_r1(.2 * r)}`, OD, r * .09, .55) + '</g>'; };
  const faceF = (hx, hy, r, eyes) => `${earsB(hx, hy, r)}<path d="M${hx - r * .62} ${hy - r * .55}L${hx - r * .76} ${hy - r * 1.12}L${hx - r * .34} ${hy - r * .74}Z" fill="${N.pink}"/><path d="M${hx + r * .62} ${hy - r * .55}L${hx + r * .76} ${hy - r * 1.12}L${hx + r * .34} ${hy - r * .74}Z" fill="${N.pink}"/>
    <ellipse cx="${hx}" cy="${hy}" rx="${r * 1.04}" ry="${r * .94}" fill="${F}"/>${cap(hx, hy, r, `<ellipse cx="${hx}" cy="${hy}" rx="${r * 1.04}" ry="${r * .94}"/>`)}<ellipse cx="${hx}" cy="${hy}" rx="${r * 1.04}" ry="${r * .94}" fill="none" stroke="${L}" stroke-width=".45"/>
    ${eyes === 'open' ? `<g class="mja mja-blink"><ellipse cx="${hx - r * .4}" cy="${hy + r * .06}" rx="${r * .15}" ry="${r * .19}" fill="${N.eye}"/><ellipse cx="${hx + r * .4}" cy="${hy + r * .06}" rx="${r * .15}" ry="${r * .19}" fill="${N.eye}"/><circle cx="${hx - r * .35}" cy="${hy - r * .02}" r="${r * .06}" fill="#fff"/><circle cx="${hx + r * .45}" cy="${hy - r * .02}" r="${r * .06}" fill="#fff"/></g>`
      : ln(`M${hx - r * .58} ${hy + r * .1}q${r * .18} ${-r * .22} ${r * .36} 0M${hx + r * .22} ${hy + r * .1}q${r * .18} ${-r * .22} ${r * .36} 0`, N.eye, r * .11)}
    <ellipse cx="${hx - r * .62}" cy="${hy + r * .38}" rx="${r * .18}" ry="${r * .11}" fill="${N.pink}" opacity=".75"/><ellipse cx="${hx + r * .62}" cy="${hy + r * .38}" rx="${r * .18}" ry="${r * .11}" fill="${N.pink}" opacity=".75"/>
    <path d="M${hx - r * .1} ${hy + r * .27}h${r * .2}l${-r * .1} ${r * .11}z" fill="#ee8fa1"/>${ln(`M${hx - r * .18} ${hy + r * .45}q${r * .09} ${r * .08} ${r * .18} 0q${r * .09} ${r * .08} ${r * .18} 0`, '#9b7b80', r * .06)}`;
  let g = '';
  if (o.shadow !== false && pose !== 'held') g += `<ellipse cx="0" cy="0" rx="${pose === 'curl' ? 12 : 8.5}" ry="1.8" fill="#03060f" opacity=".4"/>`;
  if (pose === 'sitB' || pose === 'sitF') {
    const tail = o.tail || 'M4.5 -1.2Q11.5 -1 11.5 -6.6Q11.5 -10.4 9 -11';
    g += mjA(c, 'mja-tail', ln(tail, L, 3.6) + ln(tail, F, 2.6));
    g += `<path d="M-6.8 0C-7.8 -6 -6.4 -11 -3.2 -12.8Q0 -13.8 3.2 -12.8C6.4 -11 7.8 -6 6.8 0Q0 1 -6.8 0Z" fill="${F}" stroke="${L}" stroke-width=".45"/><path d="M2.4 -12.8C5.6 -11 7.6 -6 6.8 0Q5 .5 3.2 .6C4.6 -4.6 4.4 -9 2.4 -12.8Z" fill="${S}" opacity=".75"/>`;
    // đầu Moon nghiêng nhẹ quanh cổ; mảng lông ở cổ vẽ sau nên đầu luôn liền với thân
    if (pose === 'sitB') g += mjA(c, 'mja-tilt', `${earsB(0, -16.4, 5.7)}<circle cx="0" cy="-16.4" r="5.7" fill="${F}"/>${(k => (c.def(`<clipPath id="${k}"><circle cx="0" cy="-16.4" r="5.7"/></clipPath>`), `<g clip-path="url(#${k})"><path d="M-6 -15.2Q-4.4 -14.2 -3 -15.6Q-1.4 -17 0 -16.2Q1.8 -15.4 3.2 -16.8Q4.6 -18 6 -17.4V-23H-6Z" fill="${O}"/>${ln('M-2.4 -21.4q.4 1 .1 2M0 -21.8v2M2.4 -21.4q-.4 1 -.1 2', OD, .5, .55)}</g>`))(c.id())}<circle cx="0" cy="-16.4" r="5.7" fill="none" stroke="${L}" stroke-width=".45"/>`, 10, [0, -11.4]) + `<ellipse cx="0" cy="-11.6" rx="4.4" ry="1.8" fill="${F}"/><path d="M2.2 -21.6C4.6 -20.6 5.8 -18 5.4 -15.4" stroke="${S}" stroke-width=".9" fill="none" opacity=".7"/>`;
    else g += `<ellipse cx="-2.3" cy="-.9" rx="2.1" ry="1.3" fill="${F}" stroke="${L}" stroke-width=".45"/><ellipse cx="2.3" cy="-.9" rx="2.1" ry="1.3" fill="${F}" stroke="${L}" stroke-width=".45"/>${ln('M0 -11.6v2.4', S, .6, .7)}` + mjA(c, 'mja-tilt', faceF(0, -16.8, 6.2, o.eyes), 10, [0, -11.6]);
  } else if (pose === 'walk') {
    const tail = 'M-7 -8.4Q-12.4 -10 -11.8 -16Q-11.4 -18.6 -9.6 -18.4', leg = (d, cls) => G(cls, ln(d, L, 2.8) + ln(d, F, 1.9));
    // bốn chân bước chéo nhịp: chân sau gần với chân trước xa đi cùng nhau
    g += mjA(c, 'mja-tailw', ln(tail, L, 3.2) + ln(tail, F, 2.2)) + leg('M-2.4 -6L-2.1 -.6', 'mja-pawA') + leg('M5.6 -6L5.9 -.6', 'mja-pawB') + leg('M-5 -6L-5.3 -.6', 'mja-pawB') + leg('M3 -6L2.7 -.6', 'mja-pawA');
    g += `<ellipse cx="0" cy="-8.6" rx="8.2" ry="4.6" fill="${F}" stroke="${L}" stroke-width=".45"/><path d="M-6 -6.2Q0 -3.8 6 -6.2Q3 -4.6 0 -4.4Q-3 -4.6 -6 -6.2Z" fill="${S}" opacity=".7"/>`;
    g += `<path d="M5 -14.6L5.6 -19.8L8.2 -16.4Z" fill="${O}"/><path d="M8.8 -16.8L11.4 -20.2L11.8 -15.2Z" fill="${O}"/><circle cx="8.4" cy="-12.6" r="4.6" fill="${F}"/>${cap(8.8, -12.6, 4.4, '<circle cx="8.4" cy="-12.6" r="4.6"/>')}<circle cx="8.4" cy="-12.6" r="4.6" fill="none" stroke="${L}" stroke-width=".45"/><path d="M3.2 -12.6Q5.6 -13.6 6.8 -10.8Q6.8 -8.6 5.4 -7.8Q3.8 -8 2.8 -9.6Z" fill="${F}"/>
      ${ln('M9.6 -12.6q.7-.8 1.4 0', N.eye, .55)}<circle cx="12.7" cy="-11.4" r=".55" fill="#ee8fa1"/><ellipse cx="10.4" cy="-10.6" rx=".9" ry=".55" fill="${N.pink}" opacity=".7"/>`;
  } else if (pose === 'curl') {
    g += `<ellipse cx="0" cy="-5" rx="10.4" ry="5.6" fill="${F}" stroke="${L}" stroke-width=".45"/><path d="M-2 -10.4C4 -11 9.6 -8.6 10.2 -4.6Q6 -7.6 -.6 -8.2Z" fill="${S}" opacity=".6"/>${ln('M9.6 -2Q3 2 -7.2 -.4', L, 3)}${ln('M9.6 -2Q3 2 -7.2 -.4', F, 2.1)}`;
    g += `<path d="M-10.6 -7.4L-11.6 -12.2L-8.2 -10Z" fill="${O}"/><path d="M-6.6 -10.4L-4.4 -13.8L-3.4 -9.6Z" fill="${O}"/><ellipse cx="-6.6" cy="-6.6" rx="4.8" ry="4.2" fill="${F}"/>${cap(-7.4, -6.6, 4.4, '<ellipse cx="-6.6" cy="-6.6" rx="4.8" ry="4.2"/>')}<ellipse cx="-6.6" cy="-6.6" rx="4.8" ry="4.2" fill="none" stroke="${L}" stroke-width=".45"/>
      ${ln('M-9.4 -6q.8.7 1.6 0M-6 -6q.8.7 1.6 0', N.eye, .5)}<ellipse cx="-9.8" cy="-4.4" rx=".8" ry=".5" fill="${N.pink}" opacity=".7"/>`;
  } else if (pose === 'held') {
    g += `<ellipse cx="0" cy="2" rx="6.4" ry="6" fill="${F}" stroke="${L}" stroke-width=".45"/><ellipse cx="-2.6" cy="5.6" rx="2" ry="1.4" fill="${F}" stroke="${L}" stroke-width=".45"/><ellipse cx="2.6" cy="5.6" rx="2" ry="1.4" fill="${F}" stroke="${L}" stroke-width=".45"/>` + faceF(0, -5.4, 6, o.eyes);
  }
  return `<g class="mj-cat" transform="translate(${_r1(x)} ${_r1(y)}) scale(${_r1(s * f * 100) / 100} ${_r1(s * 100) / 100})">${pose === 'walk' ? G('mja-catstep', g) : mjA(c, 'mja-breath', g, 5)}</g>`;
}
// nhân vật đi tới theo hướng (gx,gy) rồi mờ đi và quay lại từ đầu (vòng lặp dài, xem mjaGo trong app.css)
const mjGo = (gx, gy, inner) => `<g class="mja-go" style="--gx:${gx}px;--gy:${gy}px">${inner}</g>`;
// các khóm cỏ nhỏ lay theo gió, mỗi khóm một nhịp
function mjTufts(c, n, box, cols){
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = box[0] + c.r() * (box[2] - box[0]), y = box[1] + c.r() * (box[3] - box[1]), h = 3 + c.r() * 4 * (y / 250), col = cols[i % cols.length];
    let d = ''; for (let k = -1; k <= 1; k++) d += `M${_r1(x + k * 1.2)} ${_r1(y)}q${_r1(k * .8 + .4)} ${_r1(-h * .6)} ${_r1(k * 2 + .8)} ${_r1(-h * (1 - Math.abs(k) * .25))}`;
    s += mjA(c, 'mja-grass', `<path d="${d}" stroke="${col}" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".55"/>`, 3.6);
  }
  return s;
}
// dấu chân người và dấu chân mèo dọc theo một đường (mảng điểm)
function mjPrints(pts, kind = 'foot', col = '#0a1a3d', op = .7, sz = 1){
  let s = '';
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], a = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI, side = i % 2 ? 1 : -1, nx = -(y1 - y0), ny = x1 - x0, L = Math.hypot(nx, ny) || 1, off = (kind === 'foot' ? 2.6 : 1.6) * sz * side;
    const px = x1 + nx / L * off, py = y1 + ny / L * off;
    s += kind === 'foot' ? `<ellipse cx="${_r1(px)}" cy="${_r1(py)}" rx="${_r1(2.4 * sz)}" ry="${_r1(1.1 * sz)}" transform="rotate(${_r1(a)} ${_r1(px)} ${_r1(py)})"/>`
      : `<g transform="translate(${_r1(px)} ${_r1(py)}) rotate(${_r1(a + 90)}) scale(${sz})"><ellipse cy="1" rx="1.3" ry="1.1"/><circle cx="-1.4" cy="-1" r=".55"/><circle cx="0" cy="-1.6" r=".55"/><circle cx="1.4" cy="-1" r=".55"/></g>`;
  }
  return `<g fill="${col}" opacity="${op}">${s}</g>`;
}
const mjCurve = (p, n) => Array.from({ length:n + 1 }, (_, i) => { const t = i / n, u = 1 - t; return [0, 1].map(k => u * u * u * p[0][k] + 3 * u * u * t * p[1][k] + 3 * u * t * t * p[2][k] + t * t * t * p[3][k]); });
const mjPoly = P => 'M' + P.map(p => p.map(_r1).join(' ')).join('L');
// dây leo có lá dọc theo đường cong
function mjVine(P, col = '#1e4a3e'){
  let s = `<path d="${mjPoly(P)}" stroke="${col}" stroke-width="2" fill="none"/>`;
  P.forEach(([x, y], i) => { if (i % 2) { const lx = x + (i % 4 ? 5 : -5); s += `<g class="mja mja-leaf" style="animation-delay:-${_r1((x * .37 + y * .11) % 6)}s"><ellipse cx="${_r1(lx)}" cy="${_r1(y)}" rx="4.6" ry="2.4" fill="${i % 3 ? '#245a49' : '#2f6e58'}" transform="rotate(${i % 4 ? 30 : -30} ${_r1(lx)} ${_r1(y)})"/></g>`; } });
  return s;
}
const mjMini = (x, y, col, z = 1) => `<g class="mja mja-grass" style="animation-delay:-${_r1((x * .29 + y * .13) % 4)}s"><g transform="translate(${_r1(x)} ${_r1(y)}) scale(${z})">${[0, 72, 144, 216, 288].map(a => `<circle cx="${_r1(Math.cos(a * Math.PI / 180) * 1.7)}" cy="${_r1(Math.sin(a * Math.PI / 180) * 1.7)}" r="1.3" fill="${col}"/>`).join('')}<circle r=".8" fill="#ffe08a"/></g></g>`;
const mjMirror = (y, inner, op = .25) => `<g opacity="${op}" transform="translate(0 ${y * 2}) scale(1 -1)">${inner}</g>`;

/* ---------- 21 cảnh, mỗi trạm một nơi khác nhau ----------
   mỗi hàm trả về [nền (có run tay), phía trước (nhân vật, rõ nét)] */
const MJ_SCENES = {
  // Lời mở đầu: phố đêm mưa, cô gái che ô đứng dưới ngọn đèn
  start:c => {
    const gy = 176, T = mjTown(c, gy, { h:[46, 112], lit:.32 }); let bg = mjSkyN(c, '#050919', '#15264c', gy, { stars:0, streaks:90 });
    bg += T.svg + `<rect y="${gy}" width="400" height="${250 - gy}" fill="${mjLin(c, [[0, '#101b3a'], [1, '#080f24']])}"/>` + mjS(c, 170, [-10, gy, 410, 250], ['#1a2a52', '#22355f', '#0c152f', '#2b4170'], { ang:0, len:[14, 54], w:[1.6, 2.6, 3.6], op:.6, jit:2 });
    bg += mjReflect(c, T.lights, gy) + `<path d="M-5 ${gy + 1}H405" stroke="#2c4071" stroke-width="2" opacity=".8"/>` + mjLampN(c, 300, gy + 10, 136, { cone:58, R:100 }) + mjReflect(c, [[300, gy - 124, 2.2]], gy + 10, '#ffe3a0', .5);
    bg += `<ellipse cx="236" cy="218" rx="70" ry="10" fill="#0b1532"/>` + mjS(c, 30, [170, 210, 300, 226], ['#2a4278', '#ffd98a'], { ang:0, len:[6, 16], w:[1], op:.6, jit:2, in:(x, y) => ((x - 236) / 70) ** 2 + ((y - 218) / 10) ** 2 < .8 });
    const id = c.id(); c.def(`<clipPath id="${id}"><ellipse cx="236" cy="218" rx="70" ry="10"/></clipPath>`);
    const girl = sh => mjGirl(c, 250, 206, 1.4, 'back', { umb:{ hand:[8.6, -47.4], R:30, rot:-6, lights:true, shaft:.6 }, hand:[8.6, -47.4], shadow:sh });
    return [bg, `<g clip-path="url(#${id})">${mjMirror(206, girl(false), .3)}</g>${girl(true)}`];
  },
  // Đêm mưa ấy: hộp các-tông dưới mái hiên, Moon bé xíu ướt mưa, cô gái quỳ xuống che ô
  d1:c => {
    const gy = 198; let bg = `<rect width="400" height="${gy}" fill="${mjLin(c, [[0, '#0b1430'], [1, '#132347']])}"/>` + mjS(c, 260, [0, 0, 400, gy], ['#16244a', '#1c2c56', '#0f1a39'], { ang:0, len:[10, 18], w:[5, 6.5], op:.5, jit:1, bend:0 });
    bg += mjGlow(c, 70, 74, 120, 'w', .65) + `<rect x="28" y="30" width="86" height="88" rx="3" fill="#0a1126"/><rect x="34" y="36" width="74" height="76" fill="${mjLin(c, [[0, '#ffe7a8'], [1, '#f2b25e']])}"/><path d="M71 36v76M34 74h74" stroke="#0a1126" stroke-width="3"/><path d="M38 40q12 20 4 70" stroke="#f6c98a" stroke-width="6" opacity=".6" fill="none"/>`;
    bg += `<path d="M34 112L108 112L190 ${gy}L-10 ${gy}Z" fill="${mjLin(c, [[0, '#ffd98a', .22], [1, '#ffd98a', 0]])}"/>`;
    for (let x = 140; x < 400; x += 17 + c.r() * 14) mjDripAt(x, 75, gy + 4 + c.r() * 30);
    bg += `<path d="M130 58H410V74H130Z" fill="#081022"/><path d="M130 74H410" stroke="#2c4071" stroke-width="1.4"/>` + mjS(c, 30, [134, 76, 400, 84], ['#9fb8e6'], { ang:90, len:[2, 5], w:[1.2], op:.5, jit:2 });
    bg += `<rect y="${gy}" width="400" height="${250 - gy}" fill="${mjLin(c, [[0, '#121e40'], [1, '#090f24']])}"/>` + mjS(c, 120, [-10, gy, 410, 250], ['#1d2d58', '#26396a', '#0c152f'], { ang:0, len:[14, 50], w:[1.6, 2.8], op:.6, jit:2 }) + mjReflect(c, [[71, 74, 3]], gy, '#ffd98a', .4);
    bg += `<ellipse cx="320" cy="228" rx="60" ry="8" fill="#0a1330"/>` + mjS(c, 16, [270, 222, 370, 234], ['#3a5486'], { ang:0, len:[6, 14], w:[.8], op:.7, jit:2 });
    const box = `<path d="M118 ${gy}V${gy - 32}H180V${gy}Z" fill="#6a5442"/><path d="M118 ${gy - 32}L104 ${gy - 44}L126 ${gy - 40}Z" fill="#7d6450"/><path d="M180 ${gy - 32}L196 ${gy - 42}L176 ${gy - 39}Z" fill="#5d4838"/>
      <path d="M118 ${gy - 32}H180" stroke="#8d735c" stroke-width="1.4"/>${mjS(c, 24, [120, gy - 30, 178, gy - 2], ['#7a604c', '#57432f'], { ang:90, len:[6, 14], w:[1.4], op:.5, jit:6 })}<path d="M150 ${gy - 26}v18" stroke="#4e3c2e" stroke-width="1" opacity=".7"/>`;
    return [bg, mjGlow(c, 149, gy - 40, 34, 'w', .5) + mjCat(c, 149, gy - 18, 1.2, 'sitF', { eyes:'open', shadow:false, tail:'M4 -1Q9 -1 9 -4' }) + box + mjGirl(c, 212, gy, 1.6, 'kneel', { flip:true, hand:[14, -18.6], umb:{ hand:[16.6, -23], R:28, rot:40, shaft:1.1, handle:false } })];
  },
  // Chiếc ô cong gọng: ôm Moon đi về dưới mưa, ô nghiêng về phía em
  d3:c => {
    const gy = 168, T = mjTown(c, gy, { h:[60, 120], lit:.28 }); let bg = mjSkyN(c, '#060b1d', '#172a52', gy, { stars:0, streaks:80 });
    bg += T.svg + `<rect y="${gy}" width="400" height="${250 - gy}" fill="${mjLin(c, [[0, '#111c3c'], [1, '#080f24']])}"/>` + mjS(c, 150, [-10, gy, 410, 250], ['#1a2a52', '#22355f', '#0c152f'], { ang:0, len:[14, 54], w:[1.6, 2.8], op:.6, jit:2 }) + mjReflect(c, T.lights, gy, '#ffcf73', .35);
    bg += mjLampN(c, 60, gy + 6, 118, { R:70 }) + mjReflect(c, [[60, gy - 110, 1.6]], gy + 6, '#ffe3a0', .45);
    [[120, 222, 34], [300, 236, 40], [360, 206, 22]].forEach(([x, y, w]) => { bg += `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${w * .16}" fill="#0a1330"/><ellipse cx="${x - w * .2}" cy="${y}" rx="${w * .3}" ry="${w * .06}" fill="none" stroke="#5a78b3" stroke-width=".7" opacity=".7"/><ellipse cx="${x + w * .3}" cy="${y + 1}" rx="${w * .18}" ry="${w * .04}" fill="none" stroke="#5a78b3" stroke-width=".6" opacity=".6"/>`; });
    return [bg, mjGo(18, 0, mjGirl(c, 214, 224, 1.6, 'side', { cat:true, umb:{ hand:[10.4, -31.6], R:30, rot:22, bent:true, shaft:1.25, handle:false }, wind:6, walk:true }))];
  },
  // Ngọn đèn ở góc phố: mưa tạnh, trăng ló khỏi mây, Moon ngồi nhìn trăng
  d7:c => {
    const gy = 182; let bg = mjSkyN(c, '#070d24', '#1d3363', gy, { stars:50, streaks:30 }) + mjMoonN(c, 300, 54, 24);
    bg += mjS(c, 60, [170, 86, 420, 112], ['#1b2b58', '#24386c', '#2f4680'], { ang:-6, len:[50, 120], w:[10, 14], op:.8, jit:3 }) + mjS(c, 40, [200, 106, 420, 136], ['#1b2b58', '#24386c'], { ang:-4, len:[50, 120], w:[10, 14], op:.85, jit:3 }) + mjS(c, 40, [180, 80, 420, 104], ['#e9dcae'], { ang:-5, len:[20, 60], w:[1.2], op:.4, jit:3 });
    bg += `<path d="M-5 ${gy}V40H34L40 30L120 30V${gy}Z" fill="#0c1531"/><path d="M120 30V${gy}" stroke="#22356a" stroke-width="2"/>` + mjS(c, 140, [0, 32, 120, gy], ['#131f43', '#0a1228'], { ang:0, len:[10, 18], w:[5], op:.55, jit:1, bend:0 });
    bg += mjGlow(c, 70, 92, 40, 'w', .5) + `<rect x="54" y="74" width="34" height="40" fill="#ffcf73"/><path d="M71 74v40M54 94h34" stroke="#0c1531" stroke-width="2.4"/>`;
    bg += mjLampN(c, 150, gy + 4, 118, { R:70 });
    bg += `<rect y="${gy}" width="400" height="${250 - gy}" fill="${mjLin(c, [[0, '#13214a'], [1, '#090f26']])}"/>` + mjS(c, 140, [-10, gy, 410, 250], ['#1d2d58', '#26396a', '#0c152f'], { ang:0, len:[14, 50], w:[1.6, 2.8], op:.6, jit:2 }) + `<path d="M-5 ${gy + 1}H405" stroke="#34497e" stroke-width="2.4"/>`;
    bg += `<ellipse cx="300" cy="222" rx="74" ry="11" fill="#0d1838"/>` + mjGlow(c, 300, 222, 34, 'm', .6) + mjS(c, 26, [270, 214, 330, 230], ['#fff2c4', '#ffe39a'], { ang:0, len:[4, 14], w:[1.2, 1.8], op:.8, jit:2 }) + mjReflect(c, [[150, gy - 112, 1.4]], gy + 4, '#ffe3a0', .4);
    return [bg, mjCat(c, 224, gy + 16, 1.8, 'sitB') + mjGirl(c, 264, gy + 20, 1.4, 'back', { closedUmb:true })];
  },
  // Cái bóng nhỏ theo sau: nhìn từ trên cao, dấu chân trên nền xanh, Moon lẽo đẽo theo sau
  d10:c => {
    let bg = `<rect width="400" height="250" fill="${mjLin(c, [[0, '#0d2150'], [1, '#183c79']], 1, 1)}"/>`;
    const fa = (x, y) => -30 + 28 * Math.sin(x * .016 + y * .02);
    bg += mjS(c, 520, [-30, -30, 430, 280], ['#1f4688', '#2a58a0', '#14336b', '#3a6cb5'], { fa, len:[30, 80], w:[2, 3.6, 5], op:.5, jit:4, bend:.2 }) + mjS(c, 90, [-30, -30, 430, 280], ['#6f9ad6', '#8fb3e6'], { fa, len:[30, 90], w:[1], op:.35, jit:3, bend:.2 });
    bg += mjGlow(c, 420, -20, 260, 'm', .55) + mjDots(c, 80, [0, 0, 400, 250], ['#cfe0ff', '#fff3cf'], [.6, 1.2], .5);
    const P = mjCurve([[20, 260], [90, 200], [170, 150], [272, 82]], 26), Q = mjCurve([[60, 270], [120, 220], [190, 170], [240, 112]], 22);
    const sh = (x, y, len, w) => `<ellipse cx="${x - len * .45}" cy="${y + len * .3}" rx="${len * .55}" ry="${w}" transform="rotate(32 ${x - len * .45} ${y + len * .3})" fill="#061031" opacity=".45"/>`;
    return [bg, mjPrints(P.slice(0, -2), 'foot', '#061133', .85, 1.5) + mjPrints(Q.slice(0, -2), 'paw', '#061133', .8, 1.5) + mjGo(15, -10, sh(274, 94, 80, 8) + sh(238, 122, 32, 5) + mjCat(c, 236, 122, 1.5, 'walk') + mjGirl(c, 274, 94, 1.3, 'side', { wind:4, walk:true }))];
  },
  // Mặt nước xoáy: mặt nước tối cuộn sóng, trăng khuyết, cô gái nhỏ đứng giữa
  d14:c => {
    const cx = 220, cy = 168; let bg = `<rect width="400" height="250" fill="${mjLin(c, [[0, '#0a1f2e'], [.5, '#103446'], [1, '#081a26']])}"/>`;
    bg += mjS(c, 420, [-20, -10, 420, 260], ['#0e2a3a', '#174256', '#1f5468', '#0a2230'], { ang:0, len:[30, 90], w:[4, 7, 10], op:.65, jit:5, bend:.12 });
    bg += mjS(c, 260, [-20, -10, 420, 260], ['#2a6878', '#3a8090', '#1c4e60'], { fa:(x, y) => 10 * Math.sin((x - cx) * .018) * Math.sign(y - cy), len:[20, 60], w:[1.6, 3], op:.55, jit:6, bend:.25 });
    bg += mjS(c, 120, [-20, -10, 420, 260], ['#7fc4c4', '#9ad6d0'], { ang:0, len:[20, 80], w:[.6], op:.45, jit:1, bend:.02 });
    bg += mjMoonN(c, 112, 86, 17, { cres:[.42, -.2], halo:3.2 }) + mjDots(c, 50, [80, 54, 144, 118], ['#fff2c4', '#ffe39a'], [.6, 1.4], .8, (x, y) => { const d = Math.hypot(x - 112, y - 86); return d > 19 && d < 30; });
    bg += mjS(c, 70, [250, 100, 420, 150], ['#fff2c4', '#e9dcae'], { ang:0, len:[10, 40], w:[1, 1.6], op:.55, jit:2 });
    bg += `<ellipse cx="${cx}" cy="${cy + 2}" rx="20" ry="3.4" fill="none" stroke="#9ad6d0" stroke-width=".8" opacity=".6"/><ellipse cx="${cx}" cy="${cy + 2}" rx="32" ry="5.4" fill="none" stroke="#7fc4c4" stroke-width=".6" opacity=".4"/>`;
    const g = mjGirl(c, cx, cy, 1.1, 'side', { flip:true, shadow:false, wind:-3, walk:true });
    return [bg, mjGo(-16, 0, mjMirror(cy, g) + g)];
  },
  // Ngôi sao rơi vào ô: chiếc ô trong suốt hứng đầy sao, bụi sao chảy xuống
  d21:c => {
    let bg = `<rect width="400" height="250" fill="${mjRad(c, [[0, '#121a3a'], [.6, '#080d22'], [1, '#04060f']], .5, .45, .7)}"/>` + mjStarfield(c, 320, [0, 0, 400, 250], { sz:[.4, 1.3], sparks:14, op:.7 }) + mjGlow(c, 200, 120, 120, 'w', .45);
    let drip = ''; for (let i = 0; i < 9; i++) { const a = Math.PI * (.04 + i * .115), px = 200 + Math.cos(a) * 56, py = 128 - Math.sin(a) * 18 + 4; for (let k = 0; k < 6 + c.r() * 8; k++) { const yy = py + k * (4 + c.r() * 3); drip += mjGlow(c, px + (c.r() - .5) * 2, yy, 4, 'f', .7 - k * .05) + `<circle cx="${_r1(px)}" cy="${_r1(yy)}" r="${_r1(.5 + c.r() * .8)}" fill="#fff3c0"/>`; } }
    return [bg, drip + mjGirl(c, 196, 222, 1.45, 'back', { umb:{ hand:[8.6, -47.4], R:40, rot:-4, lights:true, stars:18, shaft:.5, handle:false }, hand:[8.6, -47.4] }) + mjCat(c, 236, 222, 1.35, 'sitB')];
  },
  // Đêm trăng tròn: trăng tròn trên biển, đường trăng lấp lánh, hai bóng nhỏ đi trên đó
  d30:c => {
    const hz = 118; let bg = mjSkyN(c, '#08102a', '#1d3461', hz, { stars:60, streaks:40 }) + mjMoonN(c, 200, 70, 30, { halo:4.6 });
    bg += mjS(c, 90, [-30, 80, 120, 122], ['#16244c', '#1e2f5c', '#0f1b3d'], { ang:-6, len:[30, 90], w:[9, 13], op:.85, jit:4 }) + mjS(c, 90, [282, 74, 430, 122], ['#16244c', '#1e2f5c', '#0f1b3d'], { ang:4, len:[30, 90], w:[9, 13], op:.85, jit:4 });
    bg += mjS(c, 40, [-20, 76, 110, 100], ['#d9d1a6'], { ang:-6, len:[20, 60], w:[1.2], op:.3, jit:3 }) + mjS(c, 40, [290, 70, 420, 96], ['#d9d1a6'], { ang:4, len:[20, 60], w:[1.2], op:.3, jit:3 });
    bg += `<path d="M60 26L118 8" stroke="${mjLin(c, [[0, '#fff', 0], [1, '#fff', .9]], 1, 0)}" stroke-width="1.6" stroke-linecap="round"/>` + mjSpark(118, 8, 3);
    bg += mjWater(c, hz, 250, { top:'#0f1c3e', bot:'#070e24', path:200, spread:150, glints:520 });
    const who = mjGirl(c, 192, 212, 1.15, 'back', { shadow:false }) + mjCat(c, 217, 212, 1.1, 'sitB', { shadow:false });
    return [bg, mjMirror(212, who) + who];
  },
  // Chiếc bát trên kệ: căn phòng đêm, ánh trăng chiếu lên chiếc bát nhỏ của Moon
  d45:c => {
    const fy = 188; let bg = `<rect width="400" height="${fy}" fill="${mjLin(c, [[0, '#0e1736'], [1, '#16244a']])}"/>` + mjS(c, 160, [0, 0, 400, fy], ['#131f43', '#1a2a55', '#0d1633'], { ang:90, len:[20, 50], w:[4, 7], op:.4, jit:2 });
    bg += `<rect x="262" y="34" width="104" height="112" rx="3" fill="#081022"/><rect x="268" y="40" width="92" height="100" fill="${mjLin(c, [[0, '#0a1430'], [1, '#22397a']])}"/>` + mjStarfield(c, 30, [270, 42, 358, 120], { sparks:2 }) + mjMoonN(c, 330, 66, 11, { cres:[-.4, -.2], halo:2.6 }) + `<path d="M314 40v100M268 90h92" stroke="#081022" stroke-width="3"/>`;
    bg += `<path d="M258 30Q250 90 262 150" stroke="#2e3f78" stroke-width="10" fill="none"/><path d="M370 30Q378 90 366 150" stroke="#2e3f78" stroke-width="10" fill="none"/>`;
    for (let i = 0; i < 12; i++) { const x = 250 + i * 11, y = 26 + Math.sin(i * .9) * 3 + (i - 5.5) ** 2 * .12; bg += mjGlow(c, x, y, 7, 'f', .7) + `<circle cx="${_r1(x)}" cy="${_r1(y)}" r="1.4" fill="#ffe7a0"/>`; }
    bg += `<path d="M240 26Q300 36 386 24" stroke="#0a1126" stroke-width=".7" fill="none"/><path d="M268 140L360 140L230 ${fy + 40}L80 ${fy + 40}Z" fill="${mjLin(c, [[0, '#cfe0ff', .16], [1, '#cfe0ff', .04]])}"/>`;
    bg += `<rect y="${fy}" width="400" height="${250 - fy}" fill="${mjLin(c, [[0, '#14203f'], [1, '#0a1128']])}"/>` + mjS(c, 90, [-10, fy, 410, 250], ['#1c2b52', '#0f1834', '#243663'], { ang:0, len:[30, 90], w:[2, 3], op:.6, jit:1 }) + `<path d="M0 ${fy}H400" stroke="#24366a" stroke-width="2"/>`;
    bg += mjGlow(c, 112, 86, 70, 'm', .55) + `<path d="M40 98H184V104H40Z" fill="#3a3150"/><path d="M40 98H184" stroke="#5a4d70" stroke-width="1.2"/><path d="M52 104l6 12M172 104l-6 12" stroke="#2a2440" stroke-width="3"/>`;
    bg += `<rect x="50" y="70" width="10" height="28" fill="#5b6aa8"/><rect x="61" y="76" width="8" height="22" fill="#a07a8e"/><rect x="70" y="72" width="9" height="26" fill="#3e4f8a"/>`;
    bg += `<rect x="150" y="70" width="22" height="28" rx="2" fill="#2a2440"/><rect x="153" y="73" width="16" height="22" fill="#1c2f66"/>` + mjCat(c, 161, 94, .7, 'sitB', { shadow:false });
    bg += `<path d="M86 98q0-6 6-6h28q6 0 6 6z" fill="#e6edf9"/><path d="M84 92h44" stroke="#8fb3e6" stroke-width="2.4" stroke-linecap="round"/><path d="M89 95h34" stroke="#c1d3f2" stroke-width="1"/><g fill="#f2a15c" transform="translate(106 95.6) scale(.55)"><ellipse cy="1" rx="1.6" ry="1.3"/><circle cx="-1.8" cy="-1.4" r=".7"/><circle cx="0" cy="-2.2" r=".7"/><circle cx="1.8" cy="-1.4" r=".7"/></g>`;
    bg += `<path d="M132 98q2-14 4-16M138 98q-1-12 6-18M134 98q-6-8-10-10" stroke="#3f7d68" stroke-width="2" stroke-linecap="round" fill="none"/><rect x="129" y="92" width="12" height="6" rx="1" fill="#a0675a"/>`;
    return [bg, mjGirl(c, 186, 226, 1.35, 'sit')];
  },
  // Cánh đồng sao: đồng cỏ đêm nhìn từ trên cao, cỏ rạp theo gió, đom đóm khắp nơi
  d60:c => {
    const fa = (x, y) => -64 + 24 * Math.sin(x * .02 + y * .016);
    let bg = `<rect width="400" height="250" fill="${mjLin(c, [[0, '#0b2228'], [1, '#0f2f33']], 1, 1)}"/>`;
    bg += mjS(c, 900, [-20, -20, 420, 270], ['#123330', '#1a443d', '#225448', '#0d2827'], { fa, len:[16, 38], w:[1.4, 2.2, 3], op:.8, jit:6, bend:.45 });
    bg += mjS(c, 300, [-20, -20, 420, 270], ['#3a7a63', '#4f9378', '#2e6852'], { fa, len:[12, 30], w:[.9, 1.4], op:.7, jit:6, bend:.5 });
    bg += mjGlow(c, 380, -10, 230, 'm', .4) + mjDots(c, 120, [0, 0, 400, 250], ['#e9f1ff', '#bcd6ff', '#9fc4ff'], [1.2, 2.4], .8) + mjFlies(c, 46, [0, 0, 400, 250]);
    return [bg, mjTufts(c, 34, [0, 60, 400, 250], ['#2e6852', '#3a7a63', '#4f9378']) + mjGo(16, -6, `<ellipse cx="216" cy="150" rx="22" ry="5" fill="#04110f" opacity=".5" transform="rotate(30 216 150)"/>` + mjCat(c, 176, 180, 1.2, 'walk') + mjGirl(c, 230, 150, 1.15, 'side', { wind:10, walk:true }))];
  },
  // Tiếng gọi cửa: trước cánh cửa hé sáng, Moon ngồi chờ
  d80:c => {
    const gy = 206; let bg = `<rect width="400" height="${gy}" fill="${mjLin(c, [[0, '#101a3c'], [1, '#18264f']])}"/>` + mjS(c, 220, [0, 0, 400, gy], ['#14214a', '#1c2b58', '#0f1a3c'], { ang:0, len:[30, 70], w:[4, 6], op:.5, jit:1, bend:0 });
    for (let y = 14; y < gy; y += 13) bg += `<path d="M0 ${y}H400" stroke="#0c1533" stroke-width="1" opacity=".6"/>`;
    bg += mjGlow(c, 190, 140, 150, 'w', .45) + `<rect x="138" y="58" width="110" height="${gy - 58}" fill="#0a1126"/><rect x="146" y="66" width="94" height="${gy - 66}" fill="#ffd27a"/>`;
    bg += `<path d="M146 66L226 74V${gy + 2}L146 ${gy}Z" fill="#3a2c3e"/><path d="M146 66L226 74V${gy + 2}" stroke="#5a4660" stroke-width="1.2" fill="none"/>` + mjS(c, 40, [150, 76, 222, gy - 4], ['#46364b', '#2f2434'], { ang:90, len:[20, 50], w:[2], op:.6, jit:2 });
    bg += `<rect x="158" y="88" width="56" height="44" rx="2" fill="none" stroke="#2a2030" stroke-width="2"/><rect x="158" y="146" width="56" height="44" rx="2" fill="none" stroke="#2a2030" stroke-width="2"/><circle cx="216" cy="140" r="2.6" fill="#f3c25a"/>`;
    bg += `<path d="M226 74L240 66V${gy}L226 ${gy + 2}Z" fill="#ffe7a8"/><path d="M226 ${gy + 2}L240 ${gy}L330 250H250Z" fill="${mjLin(c, [[0, '#ffd27a', .5], [1, '#ffd27a', 0]])}"/>`;
    bg += mjGlow(c, 105, 108, 46, 'w', .9) + `<path d="M105 92v4" stroke="#0a1126" stroke-width="2"/><path d="M96 96h18l-2 24h-14z" fill="#0a1126"/><rect x="99" y="99" width="12" height="18" fill="#ffe7a8"/>`;
    bg += `<rect y="${gy}" width="400" height="${250 - gy}" fill="${mjLin(c, [[0, '#1c2244'], [1, '#0d1230']])}"/><rect x="120" y="${gy}" width="150" height="8" fill="#262d55"/><rect x="104" y="${gy + 8}" width="182" height="8" fill="#20264b"/>` + mjS(c, 80, [-10, gy, 410, 250], ['#262c55', '#151a3a'], { ang:0, len:[20, 60], w:[2, 3], op:.6, jit:1 });
    [[62, gy], [330, gy]].forEach(([x, y]) => { bg += `<path d="M${x - 12} ${y}l3-16h18l3 16z" fill="#7a4e46"/>` + mjBush(c, x, y - 26, 20, 16, ['#123a33', '#1e5446', '#2a6a55', '#0d2a26'], 70); for (let i = 0; i < 7; i++) bg += mjMini(x - 14 + c.r() * 28, y - 38 + c.r() * 22, mjPick(c.r, ['#9fc4ff', '#cfe0ff', '#f3a3ad'])); });
    bg += `<ellipse cx="200" cy="${gy + 6}" rx="44" ry="7" fill="#5a3b46"/><ellipse cx="200" cy="${gy + 6}" rx="38" ry="5" fill="none" stroke="#7a5560" stroke-width="1" stroke-dasharray="2 2"/>`;
    bg += `<rect x="290" y="70" width="54" height="64" rx="3" fill="#081022"/><rect x="295" y="75" width="44" height="54" fill="${mjLin(c, [[0, '#0a1430'], [1, '#22397a']])}"/>` + mjStarfield(c, 16, [296, 76, 338, 128], { sparks:1 }) + mjMoonN(c, 324, 92, 8, { cres:[.4, -.2], halo:2.2 }) + `<path d="M317 75v54M295 102h44" stroke="#081022" stroke-width="2.4"/>`;
    return [bg, mjGlow(c, 214, gy - 20, 50, 'w', .5) + mjCat(c, 200, gy + 4, 1.9, 'sitB')];
  },
  // Bờ bên kia: chiếc thuyền nhỏ trên hồ, đèn lồng ở mũi thuyền, bờ xa có căn nhà sáng đèn
  d100:c => {
    const hz = 120; let bg = mjSkyN(c, '#060c22', '#1a2c58', hz, { stars:90 }) + mjMoonN(c, 86, 50, 13, { cres:[.42, -.18], halo:3.6 });
    for (let x = -10; x < 410; x += 9 + c.r() * 10) bg += mjPine(x, hz + 2, 22 + c.r() * 30, c.r() < .5 ? '#0a1430' : '#0c1736');
    bg += `<rect x="262" y="${hz - 16}" width="22" height="16" fill="#0c1736"/><path d="M258 ${hz - 16}L273 ${hz - 28}L288 ${hz - 16}Z" fill="#0c1736"/><rect x="268" y="${hz - 12}" width="6" height="6" fill="#ffcf73"/>` + mjGlow(c, 271, hz - 9, 16, 'w', .8);
    bg += mjWater(c, hz, 250, { top:'#122346', bot:'#070e24', path:86, spread:60, glints:220 }) + mjReflect(c, [[271, hz - 22, 1]], hz, '#ffcf73', .5);
    bg += mjS(c, 50, [-20, hz - 8, 420, hz + 12], ['#3a5486', '#4f69a0'], { ang:0, len:[40, 120], w:[4, 7], op:.18, jit:2 }) + mjFlies(c, 12, [180, 96, 400, 126], { sz:.7 });
    const bx = 228, by = 194, boat = `<path d="M${bx - 48} ${by - 8}Q${bx} ${by + 18} ${bx + 52} ${by - 10}L${bx + 46} ${by - 4}Q${bx} ${by + 10} ${bx - 42} ${by - 2}Z" fill="#2a2240"/><path d="M${bx - 48} ${by - 8}Q${bx} ${by + 6} ${bx + 52} ${by - 10}" stroke="#7a6a8e" stroke-width="2" fill="none"/>`;
    const ripple = `<path d="M${bx - 70} ${by + 10}Q${bx} ${by + 24} ${bx + 74} ${by + 8}" stroke="#5a78b3" stroke-width=".8" fill="none" opacity=".6"/><path d="M${bx - 90} ${by + 18}Q${bx} ${by + 34} ${bx + 96} ${by + 16}" stroke="#5a78b3" stroke-width=".6" fill="none" opacity=".4"/>`;
    // thuyền trôi dần sang phải, mái chèo khua nước
    return [bg, mjGo(24, -2, ripple + mjMirror(by + 6, boat, .3) + mjA(c, 'mja-bob', `<path d="M${bx + 44} ${by - 6}L${bx + 50} ${by - 40}" stroke="#4a3d5e" stroke-width="1.6"/>` + mjGirl(c, bx - 4, by - 2, 1.3, 'perch', { legs:false, hand:[15.4, -14.6] }) + mjA(c, 'mja-row', `<path d="M${bx + 14} ${by - 24}L${bx - 26} ${by + 16}" stroke="#7a6a8e" stroke-width="1.8"/>`) + boat + mjLantern(c, bx + 50, by - 40)) + mjReflect(c, [[bx + 50, by - 32, 1.2]], by + 6, '#ffd27a', .55))];
  },
  // Bậu cửa sổ: cửa sổ sáng đèn, Moon ngồi trên bậu, chậu hoa nhỏ
  d130:c => {
    let bg = mjSkyN(c, '#070d24', '#13214a', 40, { stars:24, streaks:6 }) + `<path d="M-10 40L410 34V44L-10 52Z" fill="#070c1d"/>`;
    bg += `<rect y="48" width="400" height="202" fill="${mjLin(c, [[0, '#121d40'], [1, '#0b132c']])}"/>` + mjS(c, 300, [0, 48, 400, 250], ['#16234c', '#1b2a57', '#0e1835'], { ang:0, len:[10, 18], w:[5, 6.5], op:.5, jit:1, bend:0 });
    bg += mjGlow(c, 200, 120, 190, 'w', .55) + `<rect x="108" y="58" width="184" height="136" rx="4" fill="#0a1126"/><rect x="116" y="66" width="168" height="124" fill="${mjLin(c, [[0, '#ffe2a0'], [1, '#f2a85a']])}"/>`;
    bg += mjS(c, 50, [118, 68, 282, 188], ['#ffe9b8', '#f6c27a'], { ang:-60, len:[10, 30], w:[3, 5], op:.4 }) + `<path d="M200 66v124M116 128h168" stroke="#2a2030" stroke-width="3" opacity=".9"/>`;
    bg += `<g clip-path="${mjClip(c, '<rect x="116" y="66" width="168" height="124"/>')}"><path d="M116 66H158Q146 110 154 190H116Z" fill="#f0b9a6"/><path d="M284 66H242Q254 110 246 190H284Z" fill="#f0b9a6"/>` + mjS(c, 30, [116, 66, 158, 190], ['#d48f84', '#fbd3c2'], { ang:88, len:[30, 70], w:[2, 3], op:.6, jit:3, in:(x, y) => x < 156 - (y - 66) * .05 }) + mjS(c, 30, [242, 66, 284, 190], ['#d48f84', '#fbd3c2'], { ang:92, len:[30, 70], w:[2, 3], op:.6, jit:3, in:(x, y) => x > 244 + (y - 66) * .05 }) + '</g>';
    bg += `<path d="M150 124q8 4 12 0M250 124q-8 4-12 0" stroke="#9fc4ff" stroke-width="3" fill="none"/>`;
    bg += `<path d="M96 192H304L298 204H102Z" fill="#33467c"/><path d="M96 192H304" stroke="#5a72b0" stroke-width="2"/><rect x="112" y="206" width="176" height="26" rx="2" fill="#5a3b3b"/>` + mjS(c, 30, [112, 206, 288, 232], ['#6d4848', '#4a2f30'], { ang:0, len:[20, 40], w:[2], op:.5 });
    bg += mjVine(mjCurve([[60, 250], [40, 180], [90, 120], [70, 50]], 30)) + mjVine(mjCurve([[350, 250], [372, 190], [320, 130], [346, 60]], 30));
    let fl = ''; for (let i = 0; i < 26; i++) { const x = 118 + i * 6.6 + c.r() * 3, y = 204 - c.r() * 12; fl += `<path d="M${_r1(x)} 208q${_r1((c.r() - .5) * 6)} -6 0 ${_r1(y - 208)}" stroke="#2a6a55" stroke-width="1.2" fill="none"/>`; }
    for (let i = 0; i < 22; i++) fl += mjMini(118 + c.r() * 164, 190 + c.r() * 14, mjPick(c.r, ['#9fc4ff', '#cfe0ff', '#f3a3ad', '#ffffff']));
    return [bg, fl + mjCat(c, 200, 193, 3, 'sitF', { shadow:false })];
  },
  // Chiếc ô cho người lạ: trạm xe buýt đêm mưa, cô gái để lại chiếc ô che cho chú cún nhỏ
  d200:c => {
    const gx = 296, gy = 150; let bg = `<rect width="400" height="250" fill="${mjRad(c, [[0, '#2a2266'], [.45, '#121640'], [1, '#04060f']], .64, .38, .75)}"/>` + mjGlow(c, gx, gy, 150, 'v', .9);
    for (let k = 0; k < 2; k++) for (let i = 0; i < 260; i++) { const t = i / 260 * 3.2, rr = 6 + t * 34, a = t * 1.9 + k * Math.PI + (c.r() - .5) * .5, x = gx + Math.cos(a) * rr * 1.3 + (c.r() - .5) * 10, y = gy + Math.sin(a) * rr * .56 + (c.r() - .5) * 6; bg += mjS(c, 1, [x, y, x + .01, y + .01], [mjPick(c.r, ['#6b6fd6', '#9a8be6', '#c7b8ff', '#4a5bc4'])], { ang:(a + Math.PI / 2) * 180 / Math.PI, len:[8, 22], w:[2, 3.4], op:.5, jit:6, bend:.2 }); }
    bg += mjGlow(c, gx, gy, 40, 'm', 1) + mjDots(c, 220, [gx - 150, gy - 70, gx + 150, gy + 70], ['#e9e4ff', '#ffffff', '#c7b8ff'], [.4, 1.2], .8, (x, y) => ((x - gx) / 170) ** 2 + ((y - gy) / 70) ** 2 < 1) + mjStarfield(c, 160, [0, 0, 400, 250], { sz:[.4, 1.2], sparks:10, op:.7 });
    const P = [[-16, 30], [-15, 8], [-12, -4], [-14, -16], [-8, -10], [0, -10], [6, -16], [5, -4], [8, 8], [10, 30]].map(([x, y]) => [176 + x * 2.5, 58 + y * 2.5]), T = [P[9][0] + 30, P[9][1] - 26];
    let cons = `<path d="${mjPoly(P)}M${_r1(P[9][0])} ${_r1(P[9][1])}Q${_r1(P[9][0] + 40)} ${_r1(P[9][1] + 4)} ${_r1(T[0])} ${_r1(T[1])}" stroke="#dbe6ff" stroke-width=".9" fill="none" opacity=".6"/>`;
    P.concat([T]).forEach(([x, y], i) => { const warm = i >= 3 && i <= 6; cons += mjGlow(c, x, y, 10, warm ? 'w' : 'm', .9) + mjSpark(x, y, warm ? 3.4 : 2.6, warm ? '#ffcf8a' : '#fffbea'); });
    return [bg, cons + mjGirl(c, 104, 270, 2.2, 'reach', { shadow:false, wind:-4 })];
  },
  // Mùa mưa lại về: rừng đêm mưa, cô gái cầm đèn lồng đi giữa những thân cây
  d250:c => {
    let bg = `<rect width="400" height="250" fill="${mjLin(c, [[0, '#0a142e'], [.6, '#16284e'], [1, '#0c1530']])}"/>`;
    const trunks = (n, w, col, y0, y1) => { let s = ''; for (let i = 0; i < n; i++) { const x = (i + c.r() * .8) * 400 / n, ww = w * (.7 + c.r() * .6); s += `<path d="M${_r1(x - ww / 2)} ${y1}C${_r1(x - ww * .4)} ${(y0 + y1) / 2} ${_r1(x - ww * .3)} ${y0} ${_r1(x - ww * .2)} ${y0 - 10}H${_r1(x + ww * .2)}C${_r1(x + ww * .3)} ${y0} ${_r1(x + ww * .4)} ${(y0 + y1) / 2} ${_r1(x + ww / 2)} ${y1}Z" fill="${col}"/>`; } return s; };
    bg += trunks(14, 8, '#1e3160', -10, 170) + mjS(c, 60, [-20, 120, 420, 180], ['#3a5486', '#4f69a0'], { ang:0, len:[60, 140], w:[8, 14], op:.18, jit:2 });
    bg += trunks(9, 16, '#132247', -10, 196) + mjS(c, 120, [-20, -20, 420, 60], ['#0f1d40', '#162a55', '#1d3366'], { ang:-10, len:[10, 26], w:[4, 6], op:.8, jit:30, bend:.4 });
    bg += `<path d="M150 250Q190 200 196 170Q200 150 210 140L222 140Q214 160 222 180Q240 220 300 250Z" fill="#1d2d5a"/>` + mjS(c, 60, [150, 140, 300, 250], ['#26396a', '#2f4680'], { ang:0, len:[10, 30], w:[2, 3], op:.6, in:(x, y) => Math.abs(x - (205 + (y - 140) * .1)) < 8 + (y - 140) * .6 });
    bg += trunks(5, 34, '#08102a', -20, 250) + mjBush(c, 30, 236, 60, 26, ['#0a1d24', '#123330', '#1a443d'], 90) + mjBush(c, 380, 240, 60, 28, ['#0a1d24', '#123330', '#1a443d'], 90) + mjFlies(c, 22, [0, 60, 400, 230], { sz:.8 });
    return [bg, mjGo(0, -7, mjGlow(c, 210, 190, 90, 'w', .5) + mjGirl(c, 206, 214, 1.25, 'back', { hand:[10.4, -28.4], lantern:[10.4, -28.4], walk:true }))];
  },
  // Lá thư gửi Moon: gấp lá thư thành thuyền giấy, thả trôi trên mặt nước có ngọn nến nhỏ
  d300:c => {
    let bg = `<rect width="400" height="250" fill="${mjLin(c, [[0, '#091535'], [1, '#050b20']])}"/>` + mjS(c, 300, [-20, 0, 420, 250], ['#132652', '#1a3060', '#0c1a3e', '#22397a'], { ang:0, len:[16, 60], w:[1.6, 2.6, 3.6], op:.6, jit:3, bend:.1 });
    bg += mjGlow(c, 340, 50, 90, 'm', .5) + mjS(c, 60, [290, 30, 400, 70], ['#fff2c4', '#e9dcae'], { ang:0, len:[6, 26], w:[1.2, 1.8], op:.6, jit:3 }) + mjDots(c, 50, [0, 0, 400, 250], ['#cfe0ff'], [.5, 1], .4);
    const bx = 248, by = 150; for (let i = 1; i <= 5; i++) bg += `<ellipse cx="${bx}" cy="${by + 6}" rx="${i * 22}" ry="${i * 5}" fill="none" stroke="#5a78b3" stroke-width="${_r1(1.1 - i * .15)}" opacity="${_r1(.7 - i * .1)}"/>`;
    bg += `<path d="M-10 250V196Q40 180 90 192Q130 200 168 250Z" fill="#0c1a22"/>` + mjS(c, 80, [-10, 176, 170, 250], ['#16342f', '#1f4a3c', '#2a5f4c'], { ang:-75, len:[8, 22], w:[1.4, 2], op:.85, jit:12, bend:.3, in:(x, y) => y > 192 + (x - 40) * .2 && y > 186 });
    for (let i = 0; i < 14; i++) { const x = c.r() * 150, y = 200 + c.r() * 40; if (y > 198 + (x - 40) * .2) bg += mjMini(x, y, mjPick(c.r, ['#9fc4ff', '#cfe0ff', '#f3a3ad'])); }
    bg += mjFlies(c, 14, [140, 40, 400, 200], { sz:.8 });
    const boat = `<path d="M${bx - 22} ${by}L${bx + 22} ${by}L${bx + 14} ${by + 8}H${bx - 14}Z" fill="#eef2fb" stroke="#a9b6d6" stroke-width=".7"/><path d="M${bx - 12} ${by}L${bx} ${by - 20}L${bx + 12} ${by}Z" fill="#dde4f4"/><path d="M${bx} ${by - 20}L${bx + 12} ${by}H${bx + 4}Z" fill="#a9b6d6"/>
      <path d="M${bx - 14} ${by + 3}h20M${bx - 12} ${by + 5.5}h16M${bx - 7} ${by - 6}h8M${bx - 5} ${by - 9}h6" stroke="#7a8ab4" stroke-width=".5" opacity=".8"/><rect x="${bx - 2}" y="${by - 30}" width="4" height="10" rx="1" fill="#fff6dc"/><path d="M${bx} ${by - 31}q-2.6-3.6 0-7.4q2.6 3.8 0 7.4z" fill="#ffd27a"/>`;
    return [bg, mjGo(26, 0, mjA(c, 'mja-bob', mjA(c, 'mja-flick', mjGlow(c, bx, by - 34, 50, 'w', .9)) + boat + mjA(c, 'mja-flick', mjGlow(c, bx, by - 34, 10, 'f', 1))) + mjReflect(c, [[bx, by - 20, 1.4]], by + 8, '#ffd27a', .55)) + mjGirl(c, 104, 200, 1.5, 'kneel', { hand:[17.4, -16] })];
  },
  // Gặp lại: bờ cát dưới trăng tròn, ngọn hải đăng quét sáng, ôm Moon trong vòng tay
  d365:c => {
    const hz = 128; let bg = mjSkyN(c, '#09122e', '#25396b', hz + 10, { stars:110, sparks:12 }) + mjMoonN(c, 104, 62, 32, { halo:4.8 });
    bg += mjA(c, 'mja-beam', `<path d="M330 42L-40 4L-40 96Z" fill="${mjLin(c, [[0, '#ffe7a8', .5], [1, '#ffe7a8', 0]], 0, 0, 1, 0)}"/>`);
    bg += mjWater(c, hz, 200, { top:'#1a2c58', bot:'#0e1a3a', path:104, spread:90, glints:280, n:160 });
    bg += `<path d="M300 200L310 130Q340 96 410 86V200Z" fill="#0b1330"/>` + mjS(c, 60, [300, 90, 410, 200], ['#141f45', '#1b2a58', '#070d22'], { ang:-20, len:[8, 20], w:[3, 5], op:.7, jit:20, in:(x, y) => y > 130 - (x - 310) * .5 && y > 88 });
    bg += `<path d="M322 120L328 50H352L358 120Z" fill="#d5ddf0"/><path d="M340 50H352L358 120H340Z" fill="#9aa8cc"/><path d="M324.4 92H355.6L356.4 102H323.6ZM326.6 66H353.4L354 74H326Z" fill="#3a5492"/><rect x="326" y="34" width="28" height="16" fill="#ffe7a8"/>` + mjGlow(c, 340, 42, 60, 'w', .9) + `<path d="M322 34L340 22L358 34Z" fill="#0b1330"/><rect x="322" y="48" width="36" height="3" fill="#0b1330"/><path d="M330 34v16M340 34v16M350 34v16" stroke="#0b1330" stroke-width="1"/>`;
    bg += `<path d="M-10 200Q100 188 200 196T410 192V250H-10Z" fill="${mjLin(c, [[0, '#2b3360'], [1, '#1a2048']])}"/>` + mjS(c, 220, [-10, 188, 410, 250], ['#353e6e', '#23295a', '#414b7c'], { ang:-4, len:[6, 20], w:[1.6, 2.4], op:.6, jit:6, in:(x, y) => y > 196 });
    bg += `<path d="M-10 199Q60 192 120 198T260 196T410 192" stroke="#d5e2ff" stroke-width="1.6" fill="none" opacity=".55"/><path d="M-10 203Q80 197 160 202T410 197" stroke="#9fb8e6" stroke-width="1" fill="none" opacity=".4"/>`;
    bg += mjPrints(mjCurve([[10, 250], [60, 236], [120, 234], [186, 228]], 12), 'foot', '#11163a', .6, 1.1) + mjPrints(mjCurve([[110, 200], [150, 206], [190, 214], [214, 224]], 12), 'paw', '#11163a', .6, 1.2);
    return [bg, mjGlow(c, 216, 200, 90, 'w', .6) + mjFlies(c, 12, [130, 130, 300, 240], { sz:.9 }) + mjSpark(252, 150, 4.4, '#ffe7a0') + mjSpark(176, 160, 3.2) + mjSpark(236, 128, 2.4) + mjGirl(c, 206, 242, 2.1, 'kneel', { cat:true })];
  },
  // Ngủ cạnh nhau: phòng ngủ đêm, Moon cuộn tròn ngủ sát bên mặt cô gái
  d400:c => {
    let bg = `<rect width="400" height="250" fill="${mjLin(c, [[0, '#0f1838'], [1, '#18264f']])}"/>` + mjS(c, 160, [0, 0, 400, 250], ['#141f45', '#1a2a55', '#0e1736'], { ang:90, len:[20, 50], w:[4, 7], op:.4, jit:2 }) + mjDots(c, 40, [0, 0, 400, 150], ['#3a5090'], [1.6, 2.4], .6);
    bg += `<rect x="30" y="30" width="96" height="100" rx="3" fill="#081022"/><rect x="36" y="36" width="84" height="88" fill="${mjLin(c, [[0, '#0a1430'], [1, '#22397a']])}"/>` + mjStarfield(c, 26, [38, 38, 118, 110], { sparks:2 }) + mjMoonN(c, 92, 62, 12, { halo:2.4 }) + `<path d="M78 36v88M36 80h84" stroke="#081022" stroke-width="3"/>`;
    bg += `<path d="M24 26Q14 80 26 140" stroke="#2e3f78" stroke-width="12" fill="none"/><path d="M132 26Q142 80 130 140" stroke="#2e3f78" stroke-width="12" fill="none"/><path d="M120 124L36 124L170 250H320Z" fill="${mjLin(c, [[0, '#cfe0ff', .14], [1, '#cfe0ff', .03]])}"/>`;
    for (let i = 0; i < 16; i++) { const x = 150 + i * 15, y = 22 + Math.sin(i * .7) * 3 + (i - 7.5) ** 2 * .1; bg += mjGlow(c, x, y, 8, 'f', .7) + `<circle cx="${_r1(x)}" cy="${_r1(y)}" r="1.5" fill="#ffe7a0"/>`; }
    bg += `<path d="M140 20Q260 32 390 18" stroke="#0a1126" stroke-width=".7" fill="none"/><rect x="350" y="84" width="44" height="150" rx="6" fill="#3a2c48"/><rect x="355" y="90" width="34" height="138" rx="4" fill="#4a3a5a"/><rect x="96" y="150" width="12" height="84" rx="3" fill="#3a2c48"/>`;
    bg += `<rect x="100" y="176" width="256" height="36" fill="#2a2440"/><rect y="226" width="400" height="24" fill="#0c1430"/>` + `<rect x="30" y="182" width="44" height="44" rx="3" fill="#2a2240"/>` + mjGlow(c, 52, 170, 40, 'w', .9) + `<path d="M52 182v-8" stroke="#5a4a6e" stroke-width="2"/><path d="M42 174h20l-4-12h-12z" fill="#ffe7a6"/>`;
    const N = MJN, hx = 300, hy = 134, Q = `M110 176Q112 156 140 152Q200 140 250 146Q282 150 296 148Q306 150 312 158Q326 166 350 168V214H110Z`;
    const pillow = `<path d="M282 146Q284 128 304 126H338Q352 128 350 146Q348 156 336 156H296Q284 156 282 146Z" fill="#e9eef8"/><path d="M288 150q24 6 56 0" stroke="#b9c6e4" stroke-width="2" fill="none"/>`;
    const head = `<g transform="translate(${hx} ${hy + 4}) rotate(-12) scale(1.75)"><path d="M-2 -7C6 -10 15 -7 19 0C22 5 26 8 30 9Q24 11 18 9Q20 12 24 15Q17 15 12 11C8 10 3 8 1 4Z" fill="#33232a"/>${mjLn('M4 -6C11 -6 16 -2 20 3M6 3C12 6 18 9 26 13', '#4d353b', .7, .9)}${mjLn('M3 -7C9 -8.4 14 -6 17 -2', '#86656a', .6, .7)}
      <ellipse rx="5" ry="6" fill="#f5dccb"/><path d="M-5.2 -.6C-5.6 -6.4 -1 -7.8 2.4 -7.2C5.4 -6.6 6.4 -3.6 5.6 .4Q4.4 -2.4 2.2 -2.8Q-.4 -3.4 -2 -1.6Q-3.6 -.6 -5.2 -.6Z" fill="#33232a"/>${mjLn('M-3.4 1.2q.9.6 1.8.1M.9 1.2q.9.6 1.8.1', '#3a2228', .4)}
      <ellipse cx="-2.6" cy="3" rx="1" ry=".6" fill="#f29aa8" opacity=".5"/><ellipse cx="2.6" cy="3" rx="1" ry=".6" fill="#f29aa8" opacity=".5"/>${mjLn('M-.4 4.2q.4.3.8 0', '#c46a78', .35)}</g>`;
    const quilt = `<path d="${Q}" fill="#3a59a8"/>` + mjS(c, 120, [110, 140, 350, 214], ['#4a6cc0', '#2f4a92', '#5a7cd0'], { ang:-4, len:[10, 30], w:[2, 3], op:.6, jit:6, in:(x, y) => y > 150 + Math.max(0, (x - 250) * .2) }) + `<path d="M110 176Q112 156 140 152Q200 140 250 146Q282 150 296 148Q306 150 312 158Q326 166 350 168" stroke="#7a96e0" stroke-width="2" fill="none"/>`;
    let pat = ''; for (let i = 0; i < 10; i++) pat += mjSpark(126 + i * 22 + (i % 2) * 6, 176 + (i % 3) * 12, 2.4, '#ffe7a0', .8);
    return [bg, pillow + mjA(c, 'mja-sleep', head + quilt + pat + mjCat(c, 262, 152, 1.9, 'curl', { shadow:false })) + mjA(c, 'mja-zzz', `<text x="238" y="118" font-size="13" font-weight="700" fill="#9fc4ff" opacity=".8" font-family="Baloo 2, sans-serif">z z</text>`)];
  },
  // Mẩu ánh trăng: ngồi trên vầng trăng khuyết giữa biển mây và sao
  d450:c => {
    let bg = `<rect width="400" height="250" fill="${mjLin(c, [[0, '#04071a'], [1, '#13204a']])}"/>` + mjStarfield(c, 220, [0, 0, 400, 200], { sparks:16 }) + mjGlow(c, 200, 106, 160, 'm', .7);
    const cloud = (y, cols, n, op) => mjS(c, n, [-30, y - 14, 430, y + 40], cols, { ang:0, len:[30, 90], w:[10, 16, 22], op, jit:3, bend:.1 });
    bg += cloud(196, ['#1a2a5c', '#22356e', '#14224c'], 70, .95) + mjS(c, 50, [-20, 186, 420, 200], ['#c9c4e8', '#e9dcae'], { ang:0, len:[20, 60], w:[1.4], op:.35, jit:2 }) + cloud(226, ['#101a40', '#16234e', '#0c1636'], 70, 1);
    const id = c.id(); c.def(`<mask id="${id}"><circle cx="200" cy="98" r="64" fill="#fff"/><circle cx="200" cy="66" r="62" fill="#000"/></mask>`);
    bg += `<g mask="url(#${id})"><circle cx="200" cy="98" r="64" fill="${MJN.moon}"/>${mjS(c, 140, [136, 100, 264, 164], ['#ffe39a', '#fffbea', '#f3d98a'], { ang:-10, len:[10, 30], w:[3, 5], op:.6 })}</g>`;
    bg += `<path d="M146 60l2 22" stroke="#d9cfa4" stroke-width=".8"/>` + mjGlow(c, 148, 88, 22, 'w', .9) + mjSpark(148, 88, 5, '#ffe7a0');
    return [bg, mjGirl(c, 190, 129, 1.05, 'perch', { hand:[12.4, -11.6] }) + mjCat(c, 214, 130, 1, 'sitB', { shadow:false })];
  },
  // Những đêm sau đó: ngồi trên mái nhà ngắm mưa sao băng, hũ đom đóm bên cạnh
  after:c => {
    let bg = mjSkyN(c, '#050a1f', '#1d3061', 200, { stars:130, sparks:10 });
    for (let i = 0; i < 8; i++) { const x = 60 + c.r() * 320, y = 10 + c.r() * 90, l = 30 + c.r() * 50; bg += `<path d="M${_r1(x)} ${_r1(y)}l${_r1(-l)} ${_r1(l * .45)}" stroke="${mjLin(c, [[0, '#fff', .9], [1, '#fff', 0]], 1, 0)}" stroke-width="1.4" stroke-linecap="round"/>` + mjSpark(x, y, 2.4); }
    bg += mjDots(c, 70, [0, 150, 400, 200], ['#ffcf73', '#ffe3a0', '#ffb44d'], [1.4, 2.6], .8) + mjGlow(c, 200, 200, 220, 'w', .25);
    bg += `<path d="M-10 200L410 176V250H-10Z" fill="#141a3a"/>`; for (let i = 0; i < 6; i++) bg += `<path d="M-10 ${208 + i * 9}L410 ${184 + i * 9}" stroke="#0c1130" stroke-width="2"/>`;
    bg += mjS(c, 160, [-10, 176, 410, 250], ['#1c2348', '#232b55', '#0f1434'], { ang:-3, len:[6, 14], w:[4, 6], op:.6, jit:2, in:(x, y) => y > 200 - x * .057 });
    bg += `<path d="M-10 200L410 176" stroke="#2c3668" stroke-width="3"/><rect x="330" y="140" width="24" height="44" fill="#1a2046"/><rect x="326" y="136" width="32" height="7" fill="#232a55"/>`;
    const jar = `<path d="M134 192q-6-2-6-10v-10q0-4 4-5h12q4 1 4 5v10q0 8-6 10z" fill="#ffe08a" opacity=".35"/><rect x="132" y="164" width="12" height="4" rx="1" fill="#8a7a9e"/><path d="M134 192q-6-2-6-10v-10q0-4 4-5h12q4 1 4 5v10q0 8-6 10z" fill="none" stroke="#e9eef8" stroke-width=".8" opacity=".7"/>`;
    let flies = ''; for (let i = 0; i < 9; i++) { const x = 132 + c.r() * 12, y = 172 + c.r() * 18; flies += mjGlow(c, x, y, 5, 'f', .9) + `<circle cx="${_r1(x)}" cy="${_r1(y)}" r=".9" fill="#fffbe0"/>`; }
    for (let i = 0; i < 10; i++) { const y = 160 - i * 10 - c.r() * 6, x = 138 + Math.sin(i) * 10 + (c.r() - .5) * 8; flies += mjGlow(c, x, y, 5, 'f', _r1(.8 - i * .06)) + `<circle cx="${_r1(x)}" cy="${_r1(y)}" r=".9" fill="#fffbe0"/>`; }
    return [bg, mjGlow(c, 138, 180, 50, 'w', .8) + jar + flies + mjGirl(c, 186, 191, 1.25, 'sit') + mjCat(c, 216, 189, 1.3, 'sitB')];
  }
};
// chất liệu tranh vẽ phủ lên toàn bộ tranh (bộ lọc SVG, không cần ảnh):
//  - P: mép khối hơi run như nét cọ; màu loang đậm nhạt theo từng mảng như màu bột; vân nét cọ quét ngang và vân giấy nổi nhẹ
function mjTexDefs(k, seed){
  return `<filter id="${k}w" x="-2%" y="-2%" width="104%" height="104%"><feGaussianBlur stdDeviation=".6"/></filter>
    <filter id="${k}P" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="3" seed="${seed}" result="wob"/>
      <feDisplacementMap in="SourceGraphic" in2="wob" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="dis"/>
      <feTurbulence type="fractalNoise" baseFrequency=".011 .03" numOctaves="3" seed="${seed + 1}" result="blot"/>
      <feColorMatrix in="blot" type="matrix" values=".33 .33 .33 0 0  .33 .33 .33 0 0  .33 .33 .33 0 0  0 0 0 0 1" result="bg"/>
      <feComposite in="dis" in2="bg" operator="arithmetic" k1=".55" k2=".74" k3="0" k4="0" result="tone"/>
      <feTurbulence type="fractalNoise" baseFrequency=".014 .26" numOctaves="3" seed="${seed + 2}" result="brush"/>
      <feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="${seed + 4}" result="paper"/>
      <feComposite in="brush" in2="paper" operator="arithmetic" k1="0" k2=".7" k3=".45" k4="0" result="hmap"/>
      <feDiffuseLighting in="hmap" surfaceScale=".95" diffuseConstant="1" lighting-color="#ffffff" result="lit0"><feDistantLight azimuth="235" elevation="58"/></feDiffuseLighting>
      <feColorMatrix in="lit0" type="matrix" values=".6 0 0 0 0  0 .6 0 0 0  0 0 .6 0 0  0 0 0 0 1" result="lit"/>
      <feBlend in="lit" in2="tone" mode="soft-light" result="tex"/>
      <feComposite in="tex" in2="SourceGraphic" operator="in"/>
    </filter>
    <filter id="${k}T" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".014 .26" numOctaves="3" seed="${seed + 2}" result="brush"/>
      <feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="${seed + 4}" result="paper"/>
      <feComposite in="brush" in2="paper" operator="arithmetic" k1="0" k2=".7" k3=".45" k4="0" result="hmap"/>
      <feDiffuseLighting in="hmap" surfaceScale=".95" diffuseConstant="1" lighting-color="#ffffff" result="lit0"><feDistantLight azimuth="235" elevation="58"/></feDiffuseLighting>
      <feColorMatrix in="lit0" type="matrix" values=".6 0 0 0 0  0 .6 0 0 0  0 0 .6 0 0  0 0 0 0 1"/>
    </filter>
    <filter id="${k}B" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".011 .03" numOctaves="3" seed="${seed + 1}"/>
      <feColorMatrix type="matrix" values=".33 .33 .33 0 0  .33 .33 .33 0 0  .33 .33 .33 0 0  0 0 0 0 1"/>
    </filter>
    <radialGradient id="${k}v" cx="50%" cy="46%" r="72%"><stop offset=".55" stop-color="#02040c" stop-opacity="0"/><stop offset="1" stop-color="#02040c" stop-opacity=".55"/></radialGradient>`;
}
// tranh có mưa và vị trí mặt đất (tỉ lệ theo chiều cao tranh) để hạt mưa rơi chạm đất; mưa chạy bằng moon-rain.js
const MJ_RAINY = { start:.84, d1:.86, d3:.9, d250:.86 };
// đêm lạnh: hơi thở thành làn khói nhẹ trước miệng (cảnh nhìn nghiêng)
const MJ_COLDS = { d1:1, d3:1, d14:1, d10:1 };
// full: bộ lọc chất liệu phủ lên mọi thứ (đẹp nhất, dùng cho ảnh xuất và phim). Trên web dùng lớp chất liệu tĩnh đặt chồng lên
// (pha trộn soft-light) để các chuyển động CSS bên trong không bắt máy tính lại bộ lọc mỗi khung hình.
function mjScene(id, seed = 7, full = false){
  const k = 'mjs' + (++_mjN), c = mjCtx(seed, k); MJ_HOOD = !!MJ_RAINY[id]; MJ_COLD = !!MJ_COLDS[id]; MJ_DRIP = MJ_RAINY[id] ? [] : null; MJ_UMBS = MJ_DRIP && []; const [bg, fg] = (MJ_SCENES[id] || MJ_SCENES.after)(c), drip = MJ_DRIP && [...new Set(MJ_DRIP.map(p => p.join(',')))], umbs = MJ_UMBS && [...new Set(MJ_UMBS)]; MJ_HOOD = false; MJ_COLD = false; MJ_DRIP = null; MJ_UMBS = null;
  return `<svg class="mj-scene" viewBox="0 0 400 250"${drip && drip.length ? ` data-drip="${drip.join(' ')}"` : ''}${umbs && umbs.length ? ` data-umb="${umbs.join(' ')}"` : ''} role="img" aria-label="${esc(mjTitle(mjStop(id)))}" preserveAspectRatio="xMidYMid slice"><defs>${mjTexDefs(k, seed % 50)}${c.d}</defs>
    ${full ? `<g filter="url(#${k}P)">` : '<g>'}<rect width="400" height="250" fill="${MJN.navy}"/><g class="mj-bg"><g filter="url(#${k}w)">${bg}</g></g><g class="mj-fg">${fg}</g><rect width="400" height="250" fill="url(#${k}v)"/></g>
    ${full ? '' : `<g pointer-events="none"><rect width="400" height="250" filter="url(#${k}B)" style="mix-blend-mode:soft-light" opacity=".55"/><rect width="400" height="250" filter="url(#${k}T)" style="mix-blend-mode:soft-light"/></g>`}</svg>`;
}
// fresh: trạm vừa mở lần đầu, chạy màn "mở trạm" (moon-fx.js); hiệu ứng nền của từng trạm ở MJ_FX
const mjArt = (s, fresh) => { const u = cimg('mj_art_' + s.id), rain = !u && MJ_RAINY[s.id] && mjRainOn() ? ` data-mjrain="${MJ_RAINY[s.id]}"` : '', fx = typeof MJ_FX !== 'undefined' && MJ_FX[s.id] ? ` data-mjfx="${MJ_FX[s.id]}"` : '';
  return `<div class="mj-art"${rain}${fx}${fresh ? ' data-mjburst="1"' : ''} data-cms-img="mj_art_${s.id}">${u ? `<img alt="" src="${esc(u)}" loading="lazy">` : mjScene(s.id, 11 + MJ_STOPS.indexOf(s) * 7)}</div>`; };

/* ---------- nền bản đồ con đường: đi từ dưới lên, qua nhiều cảnh đêm ----------
   yOf(i) = toạ độ y của trạm i. Các vùng: phố mưa (trạm 0–4), mặt nước (5–7), đồng đom đóm (8–10), rừng thông và hồ (11–13),
   biển sao (14–16), bờ biển có hải đăng (17, nơi gặp lại Moon), trên mây (18–20). Không dùng bộ lọc để cuộn mượt trên điện thoại. */
function mjMapBg(c, W, H, yOf, o = {}){
  const r = c.r, mid = (a, b) => (yOf(a) + yOf(b)) / 2, Z = [H, mid(4, 5), mid(7, 8), mid(10, 11), mid(12, 13), mid(15, 16), mid(16, 17), 0];
  const band = (i, pad = 0) => [-10, Z[i + 1] - pad, W + 10, Z[i] + pad];
  const off = y => _r1(Math.min(1, Math.max(0, y / H)));
  let s = `<rect width="${W}" height="${H}" fill="${mjLin(c, [[0, '#04071a'], [off(Z[6]), '#0d1638'], [off(Z[5] - 40), '#14234c'], [off(Z[5] + 30), '#120f36'], [off(Z[4] + 30), '#0d1a2c'], [off(Z[3] + 30), '#0c2329'], [off(Z[2] + 30), '#0d2340'], [off(Z[1] + 30), '#0e1834'], [1, '#0a1228']])}"/>`;
  // phố mưa: nhà hai bên đường, cửa sổ sáng, đèn đường
  for (let y = Z[0] + 10; y > Z[1] + 40; y -= 120 + r() * 40) {
    [[-14, 70], [W - 70, W + 14]].forEach(([x0, x1]) => { const T = mjTown(c, y, { x0, x1, h:[30, 70], lit:.3 }); s += T.svg + mjReflect(c, T.lights.slice(0, 4), y, '#ffcf73', .3); });
  }
  s += mjS(c, 260, band(0), ['#1a2a52', '#22355f', '#0c152f'], { ang:0, len:[14, 50], w:[1.6, 2.6], op:.4, jit:2 });
  // mặt nước: sóng ngang, đường trăng
  s += mjS(c, 420, band(1, -20), ['#1c3264', '#24407a', '#10204a', '#2e4f8c'], { ang:0, len:[10, 46], w:[1.4, 2.4, 3.4], op:.55, jit:3, bend:.1 });
  { const y0 = Z[2] + 40, y1 = Z[1] - 20; s += mjMoonN(c, 270, y0 + 40, 16, { cres:[.42, -.2], halo:3.4 }); let d = ''; for (let i = 0; i < 160; i++) { const t = r(), y = y0 + 70 + t * (y1 - y0 - 70), x = 270 + (r() + r() - 1) * (10 + t * 60), l = 3 + r() * 12; d += `M${_r1(x - l / 2)} ${_r1(y)}h${_r1(l)}`; } s += `<path d="${d}" stroke="#fff2c4" stroke-width="1.3" stroke-linecap="round" opacity=".6"/>`; }
  // đồng đom đóm: cỏ rạp theo gió, hoa li ti
  const fa = (x, y) => -64 + 24 * Math.sin(x * .02 + y * .016);
  s += mjS(c, 700, band(2, -10), ['#123330', '#1a443d', '#225448', '#0d2827'], { fa, len:[14, 34], w:[1.4, 2.2], op:.75, jit:6, bend:.45 }) + mjS(c, 200, band(2, -10), ['#3a7a63', '#4f9378'], { fa, len:[10, 26], w:[1], op:.6, jit:6, bend:.5 });
  s += mjDots(c, 90, band(2, -20), ['#e9f1ff', '#bcd6ff', '#9fc4ff'], [1.4, 2.4], .8) + mjFlies(c, 40, band(2, -20));
  // rừng thông, sương mù
  for (let y = Z[3] - 10; y > Z[4] + 30; y -= 34) { for (let x = -10; x < 72; x += 10 + r() * 10) s += mjPine(x, y, 40 + r() * 34, r() < .5 ? '#10233a' : '#163049'); for (let x = W - 72; x < W + 10; x += 10 + r() * 10) s += mjPine(x, y, 40 + r() * 34, r() < .5 ? '#10233a' : '#163049'); }
  s += mjS(c, 70, band(3, -20), ['#3a5486', '#4f69a0'], { ang:0, len:[60, 140], w:[8, 14], op:.12, jit:2 }) + mjFlies(c, 24, band(3, -20), { sz:.8 });
  // biển sao, dải ngân hà xoáy
  { const gx = W / 2, gy = (Z[4] + Z[5]) / 2; s += mjGlow(c, gx, gy, 220, 'v', .8); for (let k = 0; k < 2; k++) for (let i = 0; i < 140; i++) { const t = i / 140 * 3, rr = 8 + t * 40, a = t * 1.9 + k * Math.PI + (r() - .5) * .5, x = gx + Math.cos(a) * rr * 1.4, y = gy + Math.sin(a) * rr * 1.1; s += mjS(c, 1, [x, y, x + .01, y + .01], [mjPick(r, ['#6b6fd6', '#9a8be6', '#c7b8ff'])], { ang:(a + Math.PI / 2) * 180 / Math.PI, len:[8, 20], w:[2, 3], op:.45, jit:6, bend:.2 }); } }
  s += mjStarfield(c, 260, band(4, -10), { sparks:18 });
  // bờ biển và hải đăng (trạm gặp lại)
  { const y = yOf(16), sea = y - 70; s += mjS(c, 200, [-10, sea, W + 10, y + 40], ['#1c3264', '#24407a', '#2e4f8c'], { ang:0, len:[10, 40], w:[1.4, 2.4], op:.55, jit:3 });
    s += `<path d="M-10 ${y + 30}Q${W / 2} ${y + 6} ${W + 10} ${y + 26}V${Z[5] + 40}H-10Z" fill="${mjLin(c, [[0, '#262e5c'], [.6, '#1d2450'], [1, '#1d2450', 0]])}"/>` + mjS(c, 120, [-10, y + 6, W + 10, Z[5]], ['#353e6e', '#2b3462'], { ang:-4, len:[6, 18], w:[1.6, 2.4], op:.6, jit:6, in:(px, py) => py > y + 26 }) + `<path d="M-10 ${y + 29}Q${W / 2} ${y + 5} ${W + 10} ${y + 25}" stroke="#d5e2ff" stroke-width="1.4" fill="none" opacity=".5"/>`;
    const lx = W - 40, ly = y - 40; s += `<path d="M${lx} ${ly - 54}L-60 ${ly - 110}L-60 ${ly - 10}Z" fill="${mjLin(c, [[0, '#ffe7a8', .35], [1, '#ffe7a8', 0]], 0, 0, 1, 0)}"/><path d="M${lx - 24} ${ly + 40}Q${lx} ${ly + 10} ${W + 10} ${ly + 6}V${ly + 60}H${lx - 30}Z" fill="#0b1330"/>`;
    s += `<path d="M${lx - 9} ${ly + 20}L${lx - 6} ${ly - 46}H${lx + 6}L${lx + 9} ${ly + 20}Z" fill="#d5ddf0"/><path d="M${lx} ${ly - 46}H${lx + 6}L${lx + 9} ${ly + 20}H${lx}Z" fill="#9aa8cc"/><path d="M${lx - 8} ${ly - 4}H${lx + 8}L${lx + 8.4} ${ly + 4}H${lx - 8.4}ZM${lx - 6.6} ${ly - 28}H${lx + 6.6}L${lx + 7} ${ly - 22}H${lx - 7}Z" fill="#3a5492"/><rect x="${lx - 7}" y="${ly - 60}" width="14" height="14" fill="#ffe7a8"/>` + mjGlow(c, lx, ly - 54, 60, 'w', .9) + `<path d="M${lx - 9} ${ly - 60}L${lx} ${ly - 70}L${lx + 9} ${ly - 60}Z" fill="#0b1330"/>`;
    s += mjMoonN(c, 70, y - 120, 22, { halo:4 });
  }
  // trên mây: mây bông, vầng trăng khuyết lớn
  { const y1 = Z[6]; s += mjStarfield(c, 160, [0, 0, W, y1], { sparks:14 }); for (let k = 0; k < 4; k++) { const cy = y1 - 30 - k * 120; s += mjS(c, 60, [-30, cy - 16, W + 30, cy + 26], ['#1a2a5c', '#22356e', '#14224c'], { ang:0, len:[30, 90], w:[10, 16, 22], op:.85, jit:3, bend:.1 }) + mjS(c, 26, [-20, cy - 18, W + 20, cy - 6], ['#c9c4e8', '#e9dcae'], { ang:0, len:[20, 60], w:[1.4], op:.3, jit:2 }); }
    s += mjMoonN(c, W / 2, 80, 40, { cres:[.36, -.28], halo:3.6 }); }
  return s;
}
