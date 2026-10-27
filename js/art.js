'use strict';
/* =========================================================
   ART — một đứa trẻ nhỏ phát sáng giữa khoảng tối rộng (nét cọ khô / phấn / gouache)

   Nhiều cảnh khác nhau để mỗi mục có tranh riêng:
     moonwalk  bé ôm trăng khuyết, để lại vệt sáng vàng phía sau
     curl      bé cuộn tròn ngủ, một khối sáng cam ở giữa
     gaze      bé ngồi nhìn lên trăng
     umbrella  bé cầm ô hồng trong mưa
     lantern   bé xách đèn lồng
     book      bé ôm cuốn sách phát sáng
   Mỗi cảnh có thể vẽ ở nhiều khung: full (trang chủ), banner (đầu trang), card (ảnh bìa nhỏ), tall (ảnh dọc).

   Tranh tĩnh (nền vệt cọ + nhân vật) được vẽ MỘT lần thành ảnh SVG rồi cache; lớp chuyển động nhẹ phía trên
   (sao lấp lánh, ánh sáng thở, bụi sáng, mưa…) là SVG thường — hiệu ứng trong app.css (class rs-*).

   paint(scene, { crop, seed, anim })  → chuỗi <svg>
   moonSVG(days, total)               → mặt trăng theo tiến độ điểm danh
   ========================================================= */
const _rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const _f = n => Math.round(n * 10) / 10;
const _pk = (r, a) => a[Math.floor(r() * a.length)];
let _artN = 0;
const _blobCache = new Map();
function _blob(key, build){ if (!_blobCache.has(key)) _blobCache.set(key, URL.createObjectURL(new Blob([build()], { type:'image/svg+xml' }))); return _blobCache.get(key); }
function _smooth(p){
  const n = p.length; let d = `M${_f(p[0][0])} ${_f(p[0][1])}`;
  for (let i = 0; i < n; i++) { const a = p[(i - 1 + n) % n], b = p[i], c = p[(i + 1) % n], e = p[(i + 2) % n]; d += `C${_f(b[0] + (c[0] - a[0]) / 6)} ${_f(b[1] + (c[1] - a[1]) / 6)} ${_f(c[0] - (e[0] - b[0]) / 6)} ${_f(c[1] - (e[1] - b[1]) / 6)} ${_f(c[0])} ${_f(c[1])}`; }
  return d + 'Z';
}
function _blobShape(r, cx, cy, rx, ry, jit, n = 12){ const pts = []; for (let i = 0; i < n; i++) { const a = i * 2 * Math.PI / n, j = 1 + (r() - .5) * jit; pts.push([cx + Math.cos(a) * rx * j, cy + Math.sin(a) * ry * j]); } return _smooth(pts); }

const CROPS = {
  full:   { v:[0, 0, 1200, 800],   fy:760, sc:1.9 },
  banner: { v:[0, 385, 1200, 330], fy:665, sc:1.1 },
  card:   { v:[300, 345, 600, 375], fy:690, sc:1.2 },
  tall:   { v:[250, 130, 700, 700], fy:735, sc:1.5 }
};
// glow = tâm ánh sáng (toạ độ cục bộ, gốc ở chân nhân vật), gr = bán kính, gc = màu
const SCENES = {
  moonwalk:{ fx:470, glow:[-42, -108], gr:170, gc:'#ffe44d', bg:'#04050a', pool:null },
  curl:    { fx:640, glow:[26, -70],  gr:190, gc:'#ff9a1f', bg:'#030409', pool:'#1b2438' },
  gaze:    { fx:520, glow:[135, -225], gr:210, gc:'#fff0a8', bg:'#050816', pool:'#141c3a' },
  umbrella:{ fx:650, glow:[0, -70],   gr:170, gc:'#ffd35a', bg:'#040a0e', pool:'#10222b' },
  lantern: { fx:470, glow:[58, -66],  gr:190, gc:'#ff9a1f', bg:'#060403', pool:null },
  book:    { fx:480, glow:[0, -108],  gr:160, gc:'#ffd35a', bg:'#04060c', pool:'#141b30' }
};
const ART_SCENES = Object.keys(SCENES);

/* ---------- bộ phận dùng chung ---------- */
function _head(x, y, r, o = {}){
  const hair = o.hair || '#9d7447', hi = o.hi || '#c79c66', face = o.face || '#f2cca8';
  if (o.back) return `<circle cx="${x}" cy="${y}" r="${_f(r * 1.08)}" fill="${hair}"/><path d="M${_f(x - r * .7)} ${_f(y - r * .5)}Q${x} ${_f(y - r * 1.3)} ${_f(x + r * .7)} ${_f(y - r * .5)}" stroke="${hi}" stroke-width="${_f(r * .18)}" fill="none" stroke-linecap="round" opacity=".7"/>`;
  const eyes = o.closed
    ? `<path d="M${_f(x - r * .48)} ${_f(y + r * .22)}q${_f(r * .16)} ${_f(r * .16)} ${_f(r * .32)} 0M${_f(x + r * .16)} ${_f(y + r * .22)}q${_f(r * .16)} ${_f(r * .16)} ${_f(r * .32)} 0" stroke="#2b1d17" stroke-width="${_f(r * .08)}" fill="none" stroke-linecap="round"/>`
    : `<circle cx="${_f(x - r * .33)}" cy="${_f(y + r * .2)}" r="${_f(r * .1)}" fill="#2b1d17"/><circle cx="${_f(x + r * .33)}" cy="${_f(y + r * .2)}" r="${_f(r * .1)}" fill="#2b1d17"/>`;
  return `<path d="M${_f(x - r * 1.12)} ${_f(y + r * .15)}Q${_f(x - r * 1.25)} ${_f(y - r * 1.25)} ${x} ${_f(y - r * 1.25)}Q${_f(x + r * 1.25)} ${_f(y - r * 1.25)} ${_f(x + r * 1.12)} ${_f(y + r * .15)}L${_f(x + r * 1.02)} ${_f(y + r * .62)}Q${x} ${_f(y + r * .78)} ${_f(x - r * 1.02)} ${_f(y + r * .62)}Z" fill="${hair}"/>
    <circle cx="${x}" cy="${_f(y + r * .15)}" r="${_f(r * .9)}" fill="${face}"/>
    <path d="M${_f(x - r)} ${_f(y - r * .1)}Q${_f(x - r * .3)} ${_f(y - r * .95)} ${x} ${_f(y - r * .55)}Q${_f(x + r * .3)} ${_f(y - r * .95)} ${_f(x + r)} ${_f(y - r * .1)}Q${_f(x + r * .9)} ${_f(y - r * .9)} ${x} ${_f(y - r * 1.12)}Q${_f(x - r * .9)} ${_f(y - r * .9)} ${_f(x - r)} ${_f(y - r * .1)}Z" fill="${hair}"/>
    <path d="M${_f(x - r * .6)} ${_f(y - r * .8)}Q${x} ${_f(y - r * 1.05)} ${_f(x + r * .5)} ${_f(y - r * .8)}" stroke="${hi}" stroke-width="${_f(r * .16)}" fill="none" stroke-linecap="round" opacity=".7"/>
    <ellipse cx="${_f(x - r * .55)}" cy="${_f(y + r * .45)}" rx="${_f(r * .2)}" ry="${_f(r * .13)}" fill="#f08560" opacity=".8"/><ellipse cx="${_f(x + r * .55)}" cy="${_f(y + r * .45)}" rx="${_f(r * .2)}" ry="${_f(r * .13)}" fill="#f08560" opacity=".8"/>
    ${eyes}<ellipse cx="${x}" cy="${_f(y + r * .6)}" rx="${_f(r * .08)}" ry="${_f(r * .06)}" fill="#b4564a"/>`;
}
function _moon(id, cx, cy, R, rot, face){
  return `<g transform="rotate(${rot} ${cx} ${cy})"><mask id="${id}"><rect x="${cx - R * 2}" y="${cy - R * 2}" width="${R * 4}" height="${R * 4}" fill="#fff"/><circle cx="${_f(cx + R * .52)}" cy="${_f(cy - R * .1)}" r="${_f(R * .86)}" fill="#000"/></mask>
    <g mask="url(#${id})" filter="url(#chalk)"><circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#moonG)"/><path d="M${_f(cx - R * .8)} ${_f(cy - R * .3)}Q${_f(cx - R * .3)} ${_f(cy - R * .9)} ${_f(cx + R * .1)} ${_f(cy - R * .7)}" stroke="#fffbd0" stroke-width="${_f(R * .1)}" fill="none" stroke-linecap="round" opacity=".7"/></g>
    ${face ? `<path d="M${_f(cx - R * .5)} ${_f(cy + R * .08)}q${_f(R * .1)} ${_f(R * .1)} ${_f(R * .2)} 0" stroke="#7a5a10" stroke-width="${_f(R * .045)}" fill="none" stroke-linecap="round"/>` : ''}</g>`;
}
/* vệt sáng vàng kéo dài phía sau bé (nét phấn) */
function _trail(r, x0, len){
  let s = '', x = x0;
  for (let i = 0; x < x0 + len; i++) { const l = 20 + r() * 80, w = 4 + r() * 9 * (1 - (x - x0) / len * .5), op = (.95 - (x - x0) / len * .5).toFixed(2); s += `<path d="M${_f(x)} ${_f(-3 + (r() - .5) * 8)}l${_f(l)} ${_f((r() - .5) * 5)}" stroke="${r() < .7 ? '#ffe94d' : '#f2cf2a'}" stroke-width="${_f(w)}" stroke-linecap="round" opacity="${op}"/>`; x += l + 8 + r() * 36; if (r() < .35) s += `<circle cx="${_f(x - 10)}" cy="${_f(-4 + (r() - .5) * 6)}" r="${_f(1.5 + r() * 2.5)}" fill="#ffe94d" opacity=".8"/>`; }
  return `<g filter="url(#chalk)">${s}</g>`;
}

/* ---------- nhân vật theo cảnh (gốc toạ độ = chân, trên là âm) ---------- */
function _kidBody(extra){
  return `<path d="M-14 -62Q-24 -34 -33 -8" stroke="#efc29c" stroke-width="15" fill="none" stroke-linecap="round"/><path d="M15 -62Q22 -34 21 -8" stroke="#e5b28a" stroke-width="15" fill="none" stroke-linecap="round"/>
    <ellipse cx="-30" cy="-3" rx="13" ry="6" fill="#ffe94d"/><ellipse cx="24" cy="-3" rx="12" ry="5.5" fill="#f2d33a"/><ellipse cx="-27" cy="-30" rx="6" ry="9" fill="#e8895a" opacity=".5"/>
    <path d="M-31 -140Q0 -151 31 -140L47 -60Q0 -50 -47 -60Z" fill="url(#coat)"/><path d="M-20 -128L-26 -72M-4 -134L-8 -66M14 -130L16 -66M28 -122L34 -70" stroke="#8fd9de" stroke-width="3.2" stroke-linecap="round" opacity=".3"/>${extra || ''}`;
}
function _fig(scene, r, id){
  if (scene === 'moonwalk') return `${_moon(id + 'm', -42, -108, 46, -25, true)}${_kidBody(`<ellipse cx="-22" cy="-92" rx="34" ry="28" fill="#ffe44d" opacity=".32"/><path d="M-27 -132Q-54 -112 -27 -90" stroke="#2c7592" stroke-width="17" fill="none" stroke-linecap="round"/><circle cx="-26" cy="-90" r="7" fill="#f2c8a4"/><path d="M26 -132Q46 -104 -6 -86" stroke="#2c7592" stroke-width="17" fill="none" stroke-linecap="round"/><circle cx="-6" cy="-86" r="7" fill="#f2c8a4"/>`)}${_head(0, -170, 27)}`;
  if (scene === 'lantern') return `${_kidBody(`<path d="M-26 -132Q-40 -108 -30 -88" stroke="#2c7592" stroke-width="16" fill="none" stroke-linecap="round"/><circle cx="-30" cy="-88" r="6.5" fill="#f2c8a4"/><path d="M27 -134Q56 -124 58 -92" stroke="#2c7592" stroke-width="16" fill="none" stroke-linecap="round"/><circle cx="58" cy="-90" r="6.5" fill="#f2c8a4"/>`)}
    <path d="M58 -90V-80" stroke="#6b4a1e" stroke-width="2"/><rect x="45" y="-80" width="26" height="34" rx="7" fill="url(#lamp)"/><path d="M45 -68H71M58 -80V-46" stroke="#a24b0a" stroke-width="1.6" opacity=".6"/>${_head(0, -170, 27)}`;
  if (scene === 'book') return `${_kidBody(`<path d="M-28 -132Q-40 -104 -14 -92" stroke="#2c7592" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M28 -132Q40 -104 14 -92" stroke="#2c7592" stroke-width="16" fill="none" stroke-linecap="round"/>`)}
    <path d="M-30 -112L0 -104L30 -112L30 -86L0 -78L-30 -86Z" fill="#fff2b8"/><path d="M0 -104V-78" stroke="#c9902a" stroke-width="2"/><path d="M-24 -104L-4 -99M-24 -97L-4 -92M4 -99L24 -104M4 -92L24 -97" stroke="#d9a84a" stroke-width="1.6" opacity=".7"/>
    <circle cx="-15" cy="-90" r="6.5" fill="#f2c8a4"/><circle cx="15" cy="-90" r="6.5" fill="#f2c8a4"/>${_head(0, -170, 27, { closed:true })}`;
  if (scene === 'gaze') return `<path d="M-46 0Q-52 -70 -22 -104Q0 -116 22 -104Q52 -70 46 0Z" fill="url(#coat)"/><path d="M-24 -90L-30 -10M0 -100V-8M22 -92L30 -10" stroke="#8fd9de" stroke-width="3.2" stroke-linecap="round" opacity=".28"/>
    ${_head(2, -134, 28, { back:true })}<path d="M-30 -2Q0 8 36 -2" stroke="#2c7592" stroke-width="10" fill="none" stroke-linecap="round"/>
    ${_moon(id + 'g', 135, -225, 62, -18, false).replace('url(#moonG)', 'url(#moonF)')}`;
  if (scene === 'umbrella') return `${_kidBody(`<path d="M-26 -132Q-34 -112 -10 -100" stroke="#2c7592" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M26 -132Q34 -112 10 -100" stroke="#2c7592" stroke-width="16" fill="none" stroke-linecap="round"/><circle cx="-8" cy="-98" r="6.5" fill="#f2c8a4"/><circle cx="8" cy="-98" r="6.5" fill="#f2c8a4"/>`)}${_head(0, -170, 27)}
    <path d="M0 -104V-210" stroke="#7a1450" stroke-width="3.4" stroke-linecap="round"/>
    <g filter="url(#chalk)"><path d="M-112 -206Q-100 -262 0 -272Q100 -262 112 -206Q94 -196 75 -206Q56 -196 37 -206Q18 -196 0 -206Q-18 -196 -37 -206Q-56 -196 -75 -206Q-94 -196 -112 -206Z" fill="url(#umb)"/><path d="M0 -272Q-40 -240 -75 -206M0 -272Q-20 -240 -37 -206M0 -272V-206M0 -272Q20 -240 37 -206M0 -272Q40 -240 75 -206" stroke="#a40b5b" stroke-width="2.4" fill="none" opacity=".5"/><path d="M-84 -232Q-50 -262 -8 -266" stroke="#ffb7dc" stroke-width="7" fill="none" stroke-linecap="round" opacity=".5"/></g>
    <ellipse cx="0" cy="4" rx="96" ry="12" fill="#ffd35a" opacity=".25" filter="url(#soft)"/><ellipse cx="6" cy="10" rx="60" ry="7" fill="#ff3d9a" opacity=".5" filter="url(#soft)"/>`;
  // curl — bé cuộn tròn, khối sáng cam ở giữa
  const lobes = []; for (let i = 0; i < 9; i++) { const a = i * 2 * Math.PI / 9, rr = 38 + (i % 2 ? 6 : -2) + r() * 3; lobes.push([26 + Math.cos(a) * rr, -70 + Math.sin(a) * rr * .92]); }
  return `<path d="M-72 -34Q-84 -118 -10 -142Q74 -152 104 -80Q114 -8 42 12Q-32 22 -72 -34Z" fill="url(#cream)"/><path d="M60 -126Q104 -96 100 -40Q92 -2 40 10" stroke="#bfb59e" stroke-width="14" fill="none" stroke-linecap="round" opacity=".45"/>
    <path d="${_smooth(lobes)}" fill="url(#orange)"/><circle cx="28" cy="-70" r="20" fill="#ffe14a" opacity=".85" filter="url(#soft)"/>
    <path d="M-30 -112Q-20 -70 -52 -34M-14 -118Q0 -76 -22 -30" stroke="#101014" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/>
    <circle cx="-64" cy="-88" r="42" fill="#fffbe6"/><path d="M-100 -98Q-96 -132 -62 -132Q-30 -130 -26 -100" stroke="#15151a" stroke-width="4" fill="none" stroke-linecap="round" opacity=".85"/>
    <circle cx="-52" cy="-72" r="25" fill="#f6dcc8"/><path d="M-76 -86Q-70 -100 -52 -98M-70 -82Q-60 -96 -46 -92" stroke="#1a1a20" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="M-62 -72q5 5 11 0" stroke="#3a2420" stroke-width="2.4" fill="none" stroke-linecap="round"/><ellipse cx="-40" cy="-62" rx="6" ry="4" fill="#f08560" opacity=".75"/>
    <path d="M62 8Q80 14 92 4Q84 -8 66 -2Z" fill="#f4ecd6"/>`;
}

/* ---------- tranh nền + nhân vật (vẽ một lần) ---------- */
function _sceneSVG(scene, crop, seed, lite){
  const C = CROPS[crop], S = SCENES[scene], [vx, vy, vw, vh] = C.v, r = _rng(seed * 131 + scene.length * 17), fx = crop === 'full' ? S.fx : crop === 'banner' ? 860 : 600, fy = C.fy, sc = C.sc;
  const id = 's' + seed, W = vw + 120, H = vh + 120, X0 = vx - 60, Y0 = vy - 60;
  const defs = `<linearGradient id="coat" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4aa3ba"/><stop offset="1" stop-color="#245f80"/></linearGradient>
    <linearGradient id="umb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7ac0"/><stop offset=".55" stop-color="#ff3d9a"/><stop offset="1" stop-color="#d70e6c"/></linearGradient>
    <radialGradient id="moonG" cx=".35" cy=".4" r=".8"><stop offset="0" stop-color="#fff7a0"/><stop offset=".6" stop-color="#ffe44d"/><stop offset="1" stop-color="#f0bf1c"/></radialGradient>
    <radialGradient id="moonF" cx=".4" cy=".4" r=".8"><stop offset="0" stop-color="#fffbe0"/><stop offset=".7" stop-color="#ffefa0"/><stop offset="1" stop-color="#e6c75a"/></radialGradient>
    <linearGradient id="lamp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#ff8a1f"/></linearGradient>
    <linearGradient id="cream" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffbe9"/><stop offset=".7" stop-color="#f1e9d2"/><stop offset="1" stop-color="#cfc6b0"/></linearGradient>
    <radialGradient id="orange" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#ffd23a"/><stop offset=".6" stop-color="#ff9a1f"/><stop offset="1" stop-color="#ff5a3c"/></radialGradient>
    <radialGradient id="gl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${S.gc}" stop-opacity=".5"/><stop offset=".4" stop-color="${S.gc}" stop-opacity=".18"/><stop offset="1" stop-color="${S.gc}" stop-opacity="0"/></radialGradient>
    <radialGradient id="pool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${S.pool || '#0b0e18'}"/><stop offset="1" stop-color="${S.pool || '#0b0e18'}" stop-opacity="0"/></radialGradient>
    <radialGradient id="vg" gradientUnits="userSpaceOnUse" cx="${fx}" cy="${_f(fy - 120 * sc)}" r="${_f(Math.max(vw, vh) * .85)}"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient>
    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="9"/></filter>
    <filter id="dry" filterUnits="userSpaceOnUse" x="${X0 - 40}" y="${Y0 - 40}" width="${W + 80}" height="${H + 80}"><feTurbulence type="fractalNoise" baseFrequency=".5 .011" numOctaves="3" seed="${seed}" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -5.2 3.5" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in" result="g"/><feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="2" seed="${seed + 2}" result="n"/><feDisplacementMap in="g" in2="n" scale="${lite ? 12 : 22}"/></filter>
    <filter id="chalk" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${seed + 4}" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3.6 2.9" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in" result="g"/><feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="2" seed="${seed + 6}" result="n"/><feDisplacementMap in="g" in2="n" scale="4"/></filter>
    <filter id="paint" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="${seed + 8}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5" result="d"/><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="${seed + 9}" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -4 3.4" result="m"/><feComposite in="d" in2="m" operator="in" result="g"/><feGaussianBlur in="g" stdDeviation=".35"/></filter>
    <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="3"/><feColorMatrix type="matrix" values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .55  0 0 0 .7 -.2"/></filter>`;
  let b = `<rect x="${X0}" y="${Y0}" width="${W}" height="${H}" fill="${S.bg}"/>`;
  // vùng sáng xanh xám phía sau nhân vật (nếu có)
  if (S.pool) b += `<g filter="url(#dry)"><path d="${_blobShape(r, fx, fy - 110 * sc, 300 * sc, 250 * sc, .35, 14)}" fill="${S.pool}"/></g>`;
  // những mảng vệt cọ dọc, to, khô — tạo khoảng tối như trong tranh
  const pal = ['#000000', '#05060a', '#0a0c13', '#10131d', '#171b29', '#0d0f16'];
  let bars = '';
  const nBars = lite ? 26 : 70;
  for (let i = 0; i < nBars; i++) {
    const w = 30 + r() * 120, x = X0 - 40 + r() * (W + 80), h = 200 + r() * 600, y = r() < .5 ? Y0 - 60 : Y0 + H - h + 60 + r() * 80, jx = () => (r() - .5) * w * .3;
    const near = Math.abs(x - fx) < 200 * sc && S.pool;       // gần nhân vật: thưa hơn để lộ vùng sáng
    if (near && r() < .7) continue;
    bars += `<path d="M${_f(x)} ${_f(y)}L${_f(x + w + jx())} ${_f(y + jx())}L${_f(x + w + jx())} ${_f(y + h)}L${_f(x + jx())} ${_f(y + h + jx())}Z" fill="${_pk(r, pal)}" opacity="${(.55 + r() * .45).toFixed(2)}"/>`;
  }
  b += `<g filter="url(#dry)">${bars}</g>`;
  // sao nhỏ
  let stars = ''; for (let i = 0; i < (lite ? 16 : 48); i++) stars += `<circle cx="${_f(X0 + r() * W)}" cy="${_f(Y0 + r() * H * .75)}" r="${_f(.8 + r() * 1.6)}" fill="#fff" opacity="${(.25 + r() * .6).toFixed(2)}"/>`;
  b += stars;
  // ánh sáng toả ra từ vật phát sáng
  const gx = fx + S.glow[0] * sc, gy = fy + S.glow[1] * sc;
  b += `<circle cx="${_f(gx)}" cy="${_f(gy)}" r="${_f(S.gr * sc * 1.5)}" fill="url(#gl)"/>`;
  // mặt đất: vệt sáng hoặc vũng
  if (scene === 'moonwalk') b += `<g transform="translate(${fx} ${fy}) scale(${sc})">${_trail(r, 50, 1100)}</g>`;
  if (scene === 'umbrella') b += `<ellipse cx="${fx}" cy="${fy + 6}" rx="${_f(200 * sc)}" ry="${_f(16 * sc)}" fill="#1b4150" opacity=".6" filter="url(#soft)"/>`;
  if (scene === 'lantern' || scene === 'book' || scene === 'curl') b += `<ellipse cx="${fx}" cy="${fy + 4}" rx="${_f(130 * sc)}" ry="${_f(10 * sc)}" fill="${S.gc}" opacity=".18" filter="url(#soft)"/>`;
  // nhân vật
  b += `<g transform="translate(${fx} ${fy}) scale(${sc})" filter="url(#paint)">${_fig(scene, r, id)}</g>`;
  // vài nét cọ sáng chồng lên để có cảm giác tô màu
  let hl = ''; for (let i = 0; i < (lite ? 5 : 12); i++) { const a = r() * 6.283, d = (40 + r() * 80) * sc; hl += `<path d="M${_f(gx + Math.cos(a) * d)} ${_f(gy + Math.sin(a) * d)}l${_f((r() - .5) * 30)} ${_f(8 + r() * 16)}" stroke="${S.gc}" stroke-width="${_f(2 + r() * 3)}" stroke-linecap="round" opacity=".35"/>`; }
  b += `<g filter="url(#chalk)">${hl}</g>`;
  b += `<rect x="${X0}" y="${Y0}" width="${W}" height="${H}" fill="url(#vg)"/><rect x="${X0}" y="${Y0}" width="${W}" height="${H}" filter="url(#grain)" opacity=".5" style="mix-blend-mode:screen"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${C.v.join(' ')}" width="${vw}" height="${vh}"><defs>${defs}</defs>${b}</svg>`;
}

/* ---------- Cảnh hoàn chỉnh: ảnh đã vẽ + lớp chuyển động ---------- */
function artScene(scene, o = {}){
  if (!SCENES[scene]) scene = 'moonwalk';
  const crop = CROPS[o.crop] ? o.crop : 'banner', seed = o.seed || 1, anim = o.anim !== false, lite = crop === 'card', C = CROPS[crop], S = SCENES[scene];
  const [vx, vy, vw, vh] = C.v, r = _rng(seed * 977 + 13 + scene.length), id = 'rs' + (++_artN);
  const fx = crop === 'full' ? S.fx : crop === 'banner' ? 860 : 600, fy = C.fy, sc = C.sc, gx = fx + S.glow[0] * sc, gy = fy + S.glow[1] * sc;
  const url = _blob(`sc|${scene}|${crop}|${seed}`, () => _sceneSVG(scene, crop, seed, lite));
  const par = crop === 'full' ? 'xMidYMax slice' : 'xMidYMid slice';
  let b = `<image href="${url}" x="${vx}" y="${vy}" width="${vw}" height="${vh}" preserveAspectRatio="none"/>`;
  b += `<defs><radialGradient id="${id}g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${S.gc}" stop-opacity=".5"/><stop offset=".5" stop-color="${S.gc}" stop-opacity=".16"/><stop offset="1" stop-color="${S.gc}" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}rn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe0f0" stop-opacity="0"/><stop offset=".75" stop-color="#cfe0f0" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity=".85"/></linearGradient></defs>`;
  b += `<circle class="rs-pulse" cx="${_f(gx)}" cy="${_f(gy)}" r="${_f(S.gr * sc * 1.1)}" fill="url(#${id}g)"/>`;
  // bụi sáng trôi quanh vật phát sáng
  let dust = '';
  for (let i = 0; i < (lite ? 8 : 22); i++) { const a = r() * 6.283, d = (30 + r() * 150) * sc, x = gx + Math.cos(a) * d * 1.2, y = gy + Math.sin(a) * d * .8, dur = 4 + r() * 5; dust += `<g class="rs-flo" style="animation-duration:${_f(dur)}s;animation-delay:${_f(-r() * 6)}s"><circle class="rs-twk" cx="${_f(x)}" cy="${_f(y)}" r="${_f(1.2 + r() * 2.6)}" fill="${S.gc}" style="animation-duration:${_f(2 + r() * 3)}s;animation-delay:${_f(-r() * 4)}s"/></g>`; }
  b += dust;
  // sao lấp lánh
  let tw = ''; for (let i = 0; i < (lite ? 8 : 26); i++) { const x = vx + r() * vw, y = vy + r() * vh * .7, rr = 1.2 + r() * 1.8; tw += `<circle class="rs-twk" cx="${_f(x)}" cy="${_f(y)}" r="${_f(rr)}" fill="#fff" style="animation-duration:${_f(2 + r() * 4)}s;animation-delay:${_f(-r() * 5)}s"/>`; }
  b += tw;
  if (scene === 'umbrella') {
    for (let i = 0; i < 3; i++) b += `<ellipse class="rs-rip" cx="${fx}" cy="${fy + 6}" rx="${_f(150 * sc)}" ry="${_f(12 * sc)}" fill="none" stroke="#ffe9a8" stroke-width="1.6" style="animation-delay:${-i * 1.4}s"/>`;
    let rain = '';
    for (let i = 0; i < (lite ? 20 : 60); i++) { const len = 50 + r() * 90, w = 1 + r() * 1.6, x = vx - 100 + r() * (vw + 200), y = anim ? vy - 200 : vy + r() * vh, sl = .09 * (.85 + r() * .3); rain += `<path class="rs-rain" d="M${_f(x)} ${_f(y)}L${_f(x + w)} ${_f(y)}L${_f(x + w - sl * len)} ${_f(y + len)}L${_f(x - sl * len)} ${_f(y + len)}Z" fill="url(#${id}rn)" opacity="${(.2 + r() * .3).toFixed(2)}" style="animation-duration:${(1 + r() * .8).toFixed(2)}s;animation-delay:${(-r() * 2).toFixed(2)}s"/>`; }
    b += `<g style="--sl:.09">${rain}</g>`;
  }
  return `<svg class="rs ${anim ? '' : 'rs-static'}" viewBox="${C.v.join(' ')}" preserveAspectRatio="${par}" style="--rh:${vh + 400}px" aria-hidden="true" focusable="false">${b}</svg>`;
}

/* ---------- Mặt trăng theo tiến độ điểm danh ---------- */
function moonSVG(days, total = 30, o = {}){
  const f = Math.max(0, Math.min(1, days / total)), R = 100, full = f >= 1, rx = Math.abs(1 - 2 * f) * R, sweep = f < .5 ? 0 : 1, id = 'mn' + (++_artN);
  const lit = full ? `<circle cx="0" cy="0" r="${R}" fill="url(#${id}f)"/>` : f <= 0 ? '' : `<path d="M0 ${-R}A${R} ${R} 0 0 1 0 ${R}A${_f(rx)} ${R} 0 0 ${sweep} 0 ${-R}Z" fill="url(#${id}f)"/>`;
  const key = `moon|${days}|${total}|${o.gold ? 1 : 0}`;
  const url = _blob(key, () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-170 -170 340 340" width="340" height="340"><defs>
    <radialGradient id="${id}f" cx=".4" cy=".4" r=".85"><stop offset="0" stop-color="#fffbc4"/><stop offset=".6" stop-color="#ffe44d"/><stop offset="1" stop-color="#f0b81c"/></radialGradient>
    <radialGradient id="${id}h" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe44d" stop-opacity="${full ? .5 : .22}"/><stop offset="1" stop-color="#ffe44d" stop-opacity="0"/></radialGradient>
    <filter id="${id}c" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="7" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3.4 2.8" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in" result="g"/><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="g" in2="n" scale="5"/></filter></defs>
    <circle cx="0" cy="0" r="165" fill="url(#${id}h)"/><circle cx="0" cy="0" r="${R}" fill="#151927"/><g filter="url(#${id}c)">${lit}</g>
    <circle cx="0" cy="0" r="${R}" fill="none" stroke="#2a3050" stroke-width="2" opacity=".7"/></svg>`);
  return `<img class="moon-img" alt="" src="${url}">`;
}

/* ---- hàm tiện dụng cho các trang ---- */
function paint(scene, opt = {}){ return artScene(scene, { crop:opt.crop || 'banner', seed:opt.seed || 1, anim:!opt.lite && opt.anim !== false }); }
function paintFor(str, opt = {}){        // tranh nhỏ tĩnh, mỗi chuỗi (slug bài viết, id sản phẩm…) một cảnh khác nhau
  let h = 7; for (const c of String(str || 'x')) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return artScene(ART_SCENES[h % ART_SCENES.length], { crop:'card', seed:1 + (h % 50), anim:false });
}
