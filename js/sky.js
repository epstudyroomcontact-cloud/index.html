'use strict';
/* =========================================================
   THIÊN HÀ SAU LƯNG CẢ TRANG (.sky trong index.html)
   Vẽ cùng nét với tranh trong web (js/art.js): mảng màu cọ khô (dry), nét phấn (chalk), hạt sần (grain).
   - Dải Ngân Hà chéo màn hình: quầng chàm tím mờ, vệt cọ khô chạy dọc dải, vệt bụi tối ở giữa, lõi sáng vàng hồng,
     bụi sao dày dọc dải và sao lẻ khắp trời. Vẽ MỘT lần thành ảnh SVG rồi in ra canvas (giới hạn độ phân giải
     để điện thoại không tốn sức), vẽ lại khi xoay màn hình.
   - Lớp chuyển động (app.css, mục "Thiên hà"): cả dải trôi rất chậm, lõi sáng thở, vài ngôi sao bốn cánh
     giống sao trên logo lấp lánh lệch nhịp, vài hạt bụi sáng bay lên.
   - Chạy sau khi trang đã tải xong và lúc máy rảnh, nên không làm chậm lúc mở web.
   ========================================================= */
(function(){
  const sky = document.getElementById('sky'); if (!sky) return;
  const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const f = n => Math.round(n * 10) / 10;
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const gauss = r => (r() + r() + r() - 1.5) / 1.5;                        // gần chuẩn, -1..1, dày ở giữa
  const SEED = 29;
  // hình mảng cọ: elip méo, mép mềm (cùng cách js/art.js vẽ _blobShape)
  function blob(r, cx, cy, rx, ry, jit, n = 10){
    const p = []; for (let i = 0; i < n; i++) { const a = i * 2 * Math.PI / n, j = 1 + (r() - .5) * jit; p.push([cx + Math.cos(a) * rx * j, cy + Math.sin(a) * ry * (1 + (r() - .5) * jit * 1.4)]); }
    let d = `M${f(p[0][0])} ${f(p[0][1])}`;
    for (let i = 0; i < n; i++) { const a = p[(i - 1 + n) % n], b = p[i], c = p[(i + 1) % n], e = p[(i + 2) % n]; d += `C${f(b[0] + (c[0] - a[0]) / 6)} ${f(b[1] + (c[1] - a[1]) / 6)} ${f(c[0] - (e[0] - b[0]) / 6)} ${f(c[1] - (e[1] - b[1]) / 6)} ${f(c[0])} ${f(c[1])}`; }
    return d + 'Z';
  }

  // Hướng dải sao: đi từ góc dưới trái lên góc trên phải, đi qua điểm (W*.5, H*.48)
  function band(W, H){
    const cx = W * .5, cy = H * .48, ang = Math.atan2(-(H * .78), W * 1.0), len = Math.hypot(W, H) * 1.25;
    return { cx, cy, ang, deg:ang * 180 / Math.PI, len, wid:Math.min(W, H) * .26, core:[W * .62, H * .38] };
  }

  function galaxySVG(W, H){
    const r = rng(SEED), B = band(W, H), ca = Math.cos(B.ang), sa = Math.sin(B.ang);
    const at = (u, v) => [B.cx + ca * u - sa * v, B.cy + sa * u + ca * v];  // u dọc dải, v ngang dải
    const defs = `<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f(B.wid * .22)}"/></filter>
      <filter id="dry" x="-20%" y="-60%" width="140%" height="220%"><feTurbulence type="fractalNoise" baseFrequency=".011 .5" numOctaves="3" seed="${SEED}" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -5.2 3.5" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in" result="g"/><feTurbulence type="fractalNoise" baseFrequency=".02" numOctaves="2" seed="${SEED + 2}" result="n"/><feDisplacementMap in="g" in2="n" scale="18"/></filter>
      <filter id="chalk" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${SEED + 4}" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3.6 2.9" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in" result="g"/><feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="2" seed="${SEED + 6}" result="n"/><feDisplacementMap in="g" in2="n" scale="4"/></filter>
      <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="3"/><feColorMatrix type="matrix" values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .6  0 0 0 .7 -.2"/></filter>
      <linearGradient id="bandM" gradientUnits="userSpaceOnUse" x1="${f(at(0, -B.wid * 1.6)[0])}" y1="${f(at(0, -B.wid * 1.6)[1])}" x2="${f(at(0, B.wid * 1.6)[0])}" y2="${f(at(0, B.wid * 1.6)[1])}"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <mask id="bm"><rect width="${W}" height="${H}" fill="url(#bandM)"/></mask>
      <radialGradient id="coreG" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe2b0" stop-opacity=".55"/><stop offset=".35" stop-color="#ff9fc8" stop-opacity=".22"/><stop offset="1" stop-color="#8a5cff" stop-opacity="0"/></radialGradient>`;
    let b = '';
    // 1. quầng chàm tím mờ dọc dải
    const haze = ['#241a55', '#2e1f62', '#1c2458', '#3a1f5e'];
    let hz = ''; for (let i = 0; i < 9; i++) { const [x, y] = at((i / 8 - .5) * B.len, gauss(r) * B.wid * .25); hz += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(B.wid * (1.1 + r() * .8))}" ry="${f(B.wid * (.45 + r() * .3))}" transform="rotate(${f(B.deg)} ${f(x)} ${f(y)})" fill="${pick(r, haze)}" opacity="${(.5 + r() * .3).toFixed(2)}"/>`; }
    b += `<g filter="url(#soft)">${hz}</g>`;
    // 2. vệt cọ khô chạy dọc dải (vẽ nằm ngang rồi xoay theo dải, để thớ cọ chạy theo chiều dài)
    const pal = ['#33286e', '#3f2c78', '#4d2c7a', '#263a7a', '#5e3482', '#a9488a', '#d48a7c', '#e3b47a'];
    let st = ''; for (let i = 0; i < 54; i++) { const u = (r() - .5) * B.len, v = gauss(r) * B.wid * .75, w = B.len * (.05 + r() * .13), h = B.wid * (.06 + r() * .2);
      const warm = Math.abs(v) < B.wid * .22 && r() < .4;
      st += `<path d="${blob(r, B.cx + u, B.cy + v, w / 2, h / 2, .35)}" fill="${warm ? pick(r, pal.slice(5)) : pick(r, pal.slice(0, 5))}" opacity="${(warm ? .14 + r() * .18 : .16 + r() * .28).toFixed(2)}"/>`; }
    b += `<g transform="rotate(${f(B.deg)} ${f(B.cx)} ${f(B.cy)})"><g filter="url(#dry)">${st}</g></g>`;
    // 3. vệt bụi tối lượn giữa dải
    let dk = ''; for (let i = 0; i < 10; i++) { const u = (r() - .5) * B.len * .85, v = B.wid * (.03 + gauss(r) * .07), w = B.len * (.05 + r() * .1), h = B.wid * (.04 + r() * .07);
      dk += `<path d="${blob(r, B.cx + u, B.cy + v, w / 2, h / 2, .4)}" fill="#05060c" opacity="${(.35 + r() * .3).toFixed(2)}"/>`; }
    b += `<g transform="rotate(${f(B.deg)} ${f(B.cx)} ${f(B.cy)})"><g filter="url(#dry)">${dk}</g></g>`;
    // 4. lõi sáng vàng hồng + vài nét phấn sáng quanh lõi
    const [kx, ky] = B.core, kr = B.wid * 1.5;
    b += `<ellipse cx="${f(kx)}" cy="${f(ky)}" rx="${f(kr)}" ry="${f(kr * .55)}" transform="rotate(${f(B.deg)} ${f(kx)} ${f(ky)})" fill="url(#coreG)"/>`;
    let hl = ''; for (let i = 0; i < 16; i++) { const a = B.ang + gauss(r) * .35, d = kr * (.1 + r() * .7) * (r() < .5 ? -1 : 1), x = kx + Math.cos(a) * d, y = ky + Math.sin(a) * d, l = 10 + r() * 34;
      hl += `<path d="M${f(x)} ${f(y)}l${f(Math.cos(B.ang) * l)} ${f(Math.sin(B.ang) * l)}" stroke="${pick(r, ['#ffe2b0', '#ffc8dc', '#fff4d6'])}" stroke-width="${f(1.5 + r() * 2.5)}" stroke-linecap="round" opacity="${(.2 + r() * .25).toFixed(2)}"/>`; }
    b += `<g filter="url(#chalk)">${hl}</g>`;
    // 5. bụi sao dày dọc dải (che bằng mặt nạ cho mép dải tan dần) + sao lẻ khắp trời
    const dens = Math.round(W * H / 650), sc = ['#ffffff', '#fff4d6', '#ffe2b0', '#ffd0e6', '#d8d4ff'];
    let du = ''; for (let i = 0; i < dens; i++) { const [x, y] = at((r() - .5) * B.len, gauss(r) * B.wid * 1.1); du += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(.35 + r() * r() * 1.3)}" fill="${pick(r, sc)}" opacity="${(.25 + r() * .6).toFixed(2)}"/>`; }
    b += `<g mask="url(#bm)">${du}</g>`;
    let fs = ''; for (let i = 0; i < Math.round(W * H / 5200); i++) fs += `<circle cx="${f(r() * W)}" cy="${f(r() * H)}" r="${f(.4 + r() * r() * 1.4)}" fill="${pick(r, sc)}" opacity="${(.2 + r() * .55).toFixed(2)}"/>`;
    b += fs;
    // 6. hạt sần như giấy vẽ, chỉ trong dải
    b += `<rect width="${W}" height="${H}" filter="url(#grain)" opacity=".38" mask="url(#bm)" style="mix-blend-mode:screen"/>`;
    return { svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>${defs}</defs>${b}</svg>`, B };
  }

  // Sao bốn cánh giống sao trên logo (path chuẩn hoá trong ô 20x20)
  const STAR = 'M10 0Q11 9 20 10Q11 11 10 20Q9 11 0 10Q9 9 10 0Z';
  function twinkles(W, H, B){
    const r = rng(SEED + 5), small = W < 700, n = small ? 11 : 20, out = [];
    const ca = Math.cos(B.ang), sa = Math.sin(B.ang);
    for (let i = 0; i < n; i++) {
      const near = r() < .7, u = (r() - .5) * B.len * .9, v = gauss(r) * B.wid * 1.2;
      const x = near ? B.cx + ca * u - sa * v : r() * W, y = near ? B.cy + sa * u + ca * v : r() * H;
      if (x < 0 || y < 0 || x > W || y > H) { i--; continue; }
      const s = 7 + r() * r() * 14, c = pick(r, ['#fff4d6', '#ffe08a', '#ffd0e6', '#ffffff']);
      out.push(`<svg class="sky-tw" viewBox="0 0 20 20" style="left:${f(x / W * 100)}%;top:${f(y / H * 100)}%;width:${f(s)}px;height:${f(s)}px;animation-duration:${f(3.5 + r() * 5)}s;animation-delay:${f(-r() * 8)}s"><path d="${STAR}" fill="${c}"/></svg>`);
    }
    for (let i = 0; i < (small ? 5 : 9); i++) out.push(`<i class="sky-mote" style="left:${f(r() * 100)}%;top:${f(40 + r() * 60)}%;animation-duration:${f(24 + r() * 26)}s;animation-delay:${f(-r() * 40)}s"></i>`);
    return out.join('');
  }

  let img = null, cv = null, lastAspect = 0;
  function paint(){
    const vw = window.innerWidth, vh = window.innerHeight; if (!vw || !vh) return;
    const aspect = vw / vh, port = aspect < 1;
    const d = Math.min(1.25, window.devicePixelRatio || 1);
    if (!cv) { cv = document.createElement('canvas'); cv.className = 'sky-gal'; sky.insertBefore(cv, sky.firstChild); }
    // canvas rộng hơn màn hình 8% để cả dải trôi chậm mà không lộ mép
    const cw = Math.round(vw * 1.08 * d), ch = Math.round(vh * 1.08 * d);
    const redo = !img || (lastAspect < 1) !== port;
    const draw = () => { if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; } const g = cv.getContext('2d'); g.clearRect(0, 0, cw, ch);
      const s = Math.max(cw / img.width, ch / img.height), w = img.width * s, h = img.height * s; g.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h); sky.classList.add('on'); };
    if (!redo) { draw(); return; }
    lastAspect = aspect;
    const W = port ? 900 : 1600, H = Math.round(W / Math.max(.45, Math.min(2.4, aspect))), G = galaxySVG(W, H);
    const im = new Image(); im.width = W; im.height = H;
    im.onload = () => { img = im; draw(); URL.revokeObjectURL(im.src); };
    im.src = URL.createObjectURL(new Blob([G.svg], { type:'image/svg+xml' }));
    sky.querySelectorAll('.sky-tw,.sky-mote').forEach(e => e.remove());
    const core = sky.querySelector('.sky-core'); if (core) { core.style.left = f(G.B.core[0] / W * 100) + '%'; core.style.top = f(G.B.core[1] / H * 100) + '%'; core.style.transform = `rotate(${f(G.B.deg)}deg)`; }
    sky.insertAdjacentHTML('beforeend', twinkles(W, H, G.B));
  }
  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(paint, 250); });
  const start = () => (window.requestIdleCallback ? requestIdleCallback(paint, { timeout:1500 }) : setTimeout(paint, 200));
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
})();
