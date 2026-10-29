'use strict';
/* =========================================================
   NỀN ĐỘNG SAU LƯNG CẢ TRANG (.sky trong index.html). Khách chọn kiểu ở ⚙️ (html[data-sky]): Thiên hà (mặc định), Mây trôi,
   Cánh hoa, Đom đóm, hoặc Tắt. Mọi kiểu đều có bản cho nền tối ("Đêm mưa") và nền sáng ("Rực rỡ"), tự đổi khi khách đổi giao diện.
   Vẽ cùng nét với tranh trong web (js/art.js): mảng màu cọ khô (dry), nét phấn (chalk), hạt sần (grain).
   - Dải Ngân Hà chéo màn hình: quầng chàm tím mờ, vệt cọ khô chạy dọc dải, vệt bụi tối ở giữa, lõi sáng vàng hồng,
     bụi sao dày dọc dải và sao lẻ khắp trời. Vẽ MỘT lần thành ảnh SVG rồi in ra canvas (giới hạn độ phân giải
     để điện thoại không tốn sức), vẽ lại khi xoay màn hình.
   - Lớp chuyển động (app.css, mục "Thiên hà"): cả dải trôi rất chậm, lõi sáng thở, vài ngôi sao bốn cánh
     giống sao trên logo lấp lánh lệch nhịp, vài hạt bụi sáng bay lên.
   - Nền sáng: dải Ngân Hà pastel (hồng, tím, đào, xanh nhạt) trên nền trắng; sao và bụi mang màu chủ đạo vì sao trắng không thấy được.
   - Mây trôi: vài đám mây vẽ cọ khô trôi ngang rất chậm. Cánh hoa: cánh hoa nhỏ rơi nhẹ, lật nhẹ khi rơi.
     Đom đóm: chấm sáng bay lượn quanh chỗ cũ và nhấp nháy lệch nhịp. Hình mây / cánh hoa dựng một lần thành ảnh nhỏ rồi dùng lại.
   - Giảm chuyển động (máy hoặc ⚙️): mây và cánh hoa đứng yên rải khắp màn hình, đom đóm chỉ nhấp nháy tại chỗ (app.css).
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

  function galaxySVG(W, H, lt){
    const r = rng(SEED), B = band(W, H), ca = Math.cos(B.ang), sa = Math.sin(B.ang);
    const at = (u, v) => [B.cx + ca * u - sa * v, B.cy + sa * u + ca * v];  // u dọc dải, v ngang dải
    const defs = `<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f(B.wid * .22)}"/></filter>
      <filter id="dry" x="-20%" y="-60%" width="140%" height="220%"><feTurbulence type="fractalNoise" baseFrequency=".011 .5" numOctaves="3" seed="${SEED}" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -5.2 3.5" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in" result="g"/><feTurbulence type="fractalNoise" baseFrequency=".02" numOctaves="2" seed="${SEED + 2}" result="n"/><feDisplacementMap in="g" in2="n" scale="18"/></filter>
      <filter id="chalk" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${SEED + 4}" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3.6 2.9" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in" result="g"/><feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="2" seed="${SEED + 6}" result="n"/><feDisplacementMap in="g" in2="n" scale="4"/></filter>
      <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="3"/><feColorMatrix type="matrix" values="${lt ? '0 0 0 0 .55  0 0 0 0 .5  0 0 0 0 .75  0 0 0 .5 -.15' : '0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .6  0 0 0 .7 -.2'}"/></filter>
      <linearGradient id="bandM" gradientUnits="userSpaceOnUse" x1="${f(at(0, -B.wid * 1.6)[0])}" y1="${f(at(0, -B.wid * 1.6)[1])}" x2="${f(at(0, B.wid * 1.6)[0])}" y2="${f(at(0, B.wid * 1.6)[1])}"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <mask id="bm"><rect width="${W}" height="${H}" fill="url(#bandM)"/></mask>
      <radialGradient id="coreG" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${lt ? '#ffd0a0' : '#ffe2b0'}" stop-opacity="${lt ? .7 : .55}"/><stop offset=".35" stop-color="#ff9fc8" stop-opacity="${lt ? .38 : .22}"/><stop offset="1" stop-color="${lt ? '#c9b3ff' : '#8a5cff'}" stop-opacity="0"/></radialGradient>`;
    let b = '';
    // 1. quầng chàm tím mờ dọc dải
    const haze = lt ? ['#d9c9ff', '#ffd3e6', '#cfe0ff', '#ffe3c9'] : ['#241a55', '#2e1f62', '#1c2458', '#3a1f5e'];
    let hz = ''; for (let i = 0; i < 9; i++) { const [x, y] = at((i / 8 - .5) * B.len, gauss(r) * B.wid * .25); hz += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(B.wid * (1.1 + r() * .8))}" ry="${f(B.wid * (.45 + r() * .3))}" transform="rotate(${f(B.deg)} ${f(x)} ${f(y)})" fill="${pick(r, haze)}" opacity="${(lt ? .45 + r() * .3 : .5 + r() * .3).toFixed(2)}"/>`; }
    b += `<g filter="url(#soft)">${hz}</g>`;
    // 2. vệt cọ khô chạy dọc dải (vẽ nằm ngang rồi xoay theo dải, để thớ cọ chạy theo chiều dài)
    const pal = lt ? ['#c8b6ff', '#b9c8ff', '#e0b8ff', '#bcd2ff', '#d6b8ff', '#ffb0d0', '#ffc2a0', '#ffe0a0'] : ['#33286e', '#3f2c78', '#4d2c7a', '#263a7a', '#5e3482', '#a9488a', '#d48a7c', '#e3b47a'];
    let st = ''; for (let i = 0; i < 54; i++) { const u = (r() - .5) * B.len, v = gauss(r) * B.wid * .75, w = B.len * (.05 + r() * .13), h = B.wid * (.06 + r() * .2);
      const warm = Math.abs(v) < B.wid * .22 && r() < .4;
      st += `<path d="${blob(r, B.cx + u, B.cy + v, w / 2, h / 2, .35)}" fill="${warm ? pick(r, pal.slice(5)) : pick(r, pal.slice(0, 5))}" opacity="${((warm ? .14 + r() * .18 : .16 + r() * .28) * (lt ? 1.25 : 1)).toFixed(2)}"/>`; }
    b += `<g transform="rotate(${f(B.deg)} ${f(B.cx)} ${f(B.cy)})"><g filter="url(#dry)">${st}</g></g>`;
    // 3. vệt bụi tối lượn giữa dải
    let dk = ''; for (let i = 0; i < 10; i++) { const u = (r() - .5) * B.len * .85, v = B.wid * (.03 + gauss(r) * .07), w = B.len * (.05 + r() * .1), h = B.wid * (.04 + r() * .07);
      dk += `<path d="${blob(r, B.cx + u, B.cy + v, w / 2, h / 2, .4)}" fill="${lt ? '#8f86b3' : '#05060c'}" opacity="${(lt ? .1 + r() * .12 : .35 + r() * .3).toFixed(2)}"/>`; }
    b += `<g transform="rotate(${f(B.deg)} ${f(B.cx)} ${f(B.cy)})"><g filter="url(#dry)">${dk}</g></g>`;
    // 4. lõi sáng vàng hồng + vài nét phấn sáng quanh lõi
    const [kx, ky] = B.core, kr = B.wid * 1.5;
    b += `<ellipse cx="${f(kx)}" cy="${f(ky)}" rx="${f(kr)}" ry="${f(kr * .55)}" transform="rotate(${f(B.deg)} ${f(kx)} ${f(ky)})" fill="url(#coreG)"/>`;
    let hl = ''; for (let i = 0; i < 16; i++) { const a = B.ang + gauss(r) * .35, d = kr * (.1 + r() * .7) * (r() < .5 ? -1 : 1), x = kx + Math.cos(a) * d, y = ky + Math.sin(a) * d, l = 10 + r() * 34;
      hl += `<path d="M${f(x)} ${f(y)}l${f(Math.cos(B.ang) * l)} ${f(Math.sin(B.ang) * l)}" stroke="${pick(r, lt ? ['#ff9fc8', '#ffc59a', '#b9a8ff'] : ['#ffe2b0', '#ffc8dc', '#fff4d6'])}" stroke-width="${f(1.5 + r() * 2.5)}" stroke-linecap="round" opacity="${(lt ? .25 + r() * .25 : .2 + r() * .25).toFixed(2)}"/>`; }
    b += `<g filter="url(#chalk)">${hl}</g>`;
    // 5. bụi sao dày dọc dải (che bằng mặt nạ cho mép dải tan dần) + sao lẻ khắp trời
    const dens = Math.round(W * H / 650), sc = lt ? ['#ff8fbf', '#b79cff', '#8fb4ff', '#ffb27a', '#c7a7ff'] : ['#ffffff', '#fff4d6', '#ffe2b0', '#ffd0e6', '#d8d4ff'];
    let du = ''; for (let i = 0; i < dens; i++) { const [x, y] = at((r() - .5) * B.len, gauss(r) * B.wid * 1.1); du += `<circle cx="${f(x)}" cy="${f(y)}" r="${f((lt ? .5 : .35) + r() * r() * 1.3)}" fill="${pick(r, sc)}" opacity="${(lt ? .3 + r() * .55 : .25 + r() * .6).toFixed(2)}"/>`; }
    b += `<g mask="url(#bm)">${du}</g>`;
    let fs = ''; for (let i = 0; i < Math.round(W * H / 5200); i++) fs += `<circle cx="${f(r() * W)}" cy="${f(r() * H)}" r="${f((lt ? .6 : .4) + r() * r() * 1.4)}" fill="${pick(r, sc)}" opacity="${(lt ? .3 + r() * .5 : .2 + r() * .55).toFixed(2)}"/>`;
    b += fs;
    // 6. hạt sần như giấy vẽ, chỉ trong dải
    b += `<rect width="${W}" height="${H}" filter="url(#grain)" opacity="${lt ? .3 : .38}" mask="url(#bm)" style="mix-blend-mode:${lt ? 'multiply' : 'screen'}"/>`;
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

  /* ---------- mây trôi: vài đám mây cọ khô, dựng một lần thành ảnh nhỏ ---------- */
  function cloudSVG(seed, lt){
    const r = rng(seed), W = 640, H = 320, n = 4 + Math.floor(r() * 3), shapes = [blob(r, 320, 222, 270, 56, .2)];
    for (let i = 0; i < n; i++) { const k = i / (n - 1); shapes.push(blob(r, 140 + k * 360 + (r() - .5) * 40, 176 - Math.sin(k * Math.PI) * 46 - r() * 34, 66 + r() * 44, 54 + r() * 40, .3)); }
    const C = lt ? { sh:'#cfc2f2', mid:'#ffffff', hi:'#ffffff', blush:'#ffd2e6' } : { sh:'#161a46', mid:'#343b82', hi:'#8b95f0', blush:'#5a3a86' };
    const defs = `<filter id="soft" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="9"/></filter>
      <filter id="dry" x="-10%" y="-30%" width="120%" height="160%"><feTurbulence type="fractalNoise" baseFrequency=".012 .45" numOctaves="3" seed="${seed}" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -4.2 3.6" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in" result="g"/><feTurbulence type="fractalNoise" baseFrequency=".02" numOctaves="2" seed="${seed + 2}" result="n"/><feDisplacementMap in="g" in2="n" scale="14"/></filter>
      <filter id="chalk" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${seed + 4}" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3.6 2.9" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in" result="g"/><feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="2" seed="${seed + 6}" result="n"/><feDisplacementMap in="g" in2="n" scale="4"/></filter>`;
    const all = c => shapes.map(d => `<path d="${d}" fill="${c}"/>`).join('');
    let b = `<g filter="url(#soft)" transform="translate(0 16)" opacity="${lt ? .7 : .8}">${all(C.sh)}</g>`;
    b += `<g filter="url(#dry)" opacity="${lt ? .92 : .85}">${all(C.mid)}</g>`;
    b += `<g filter="url(#dry)" transform="translate(0 22)" opacity=".4">${shapes.slice(0, 1).map(d => `<path d="${d}" fill="${C.blush}"/>`).join('')}</g>`;
    let hl = ''; for (let i = 1; i < shapes.length; i++) { const k = (i - 1) / (n - 1), x = 140 + k * 360, y = 176 - Math.sin(k * Math.PI) * 46; hl += `<path d="M${f(x - 52)} ${f(y - 8)}q${f(30 + r() * 20)} ${f(-46 - r() * 20)} ${f(86 + r() * 20)} ${f(-14)}" fill="none" stroke="${C.hi}" stroke-width="${f(3 + r() * 3)}" stroke-linecap="round" opacity="${lt ? 0 : .22}"/>`; }
    b += `<g filter="url(#chalk)">${hl}</g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>${defs}</defs>${b}</svg>`;
  }
  /* ---------- cánh hoa: bốn màu, một ảnh nhỏ mỗi màu ---------- */
  function petalSVG(color, seed){
    const defs = `<filter id="dry" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".05 .35" numOctaves="2" seed="${seed}" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3.4 3.0" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in" result="g"/><feTurbulence type="fractalNoise" baseFrequency=".07" numOctaves="2" seed="${seed + 3}" result="n"/><feDisplacementMap in="g" in2="n" scale="3"/></filter>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><defs>${defs}</defs><g filter="url(#dry)"><path d="M32 3C47 13 56 31 32 61C8 31 17 13 32 3Z" fill="${color}"/></g><path d="M32 12C33 28 33 40 32 52" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.6" stroke-linecap="round"/></svg>`;
  }
  // svg -> ảnh PNG nhỏ (data URL) để dùng lại cho nhiều phần tử; trả về Promise
  const toPNG = (svg, w, h) => new Promise(res => {
    const im = new Image(); im.width = w; im.height = h; const u = URL.createObjectURL(new Blob([svg], { type:'image/svg+xml' }));
    im.onload = () => { try { const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h); res(c.toDataURL('image/png')); } catch (e) { res(''); } URL.revokeObjectURL(u); };
    im.onerror = () => { URL.revokeObjectURL(u); res(''); }; im.src = u;
  });
  const accent = () => (getComputedStyle(root).getPropertyValue('--accent-rgb') || '').trim() || '255,61,154';

  async function cloudsHTML(lt, small){
    const urls = (await Promise.all([11, 23, 37].map(sd => toPNG(cloudSVG(sd, lt), 640, 320)))).filter(Boolean); if (!urls.length) return '';
    const r = rng(SEED + 41), n = small ? 4 : 7; let out = '';
    for (let i = 0; i < n; i++) {
      const w = (small ? 48 : 30) + r() * (small ? 26 : 24), dur = 150 + r() * 130;
      out += `<img class="sky-cloud" alt="" src="${urls[i % urls.length]}" style="--t:${f(2 + r() * 70)}%;--w:${f(w)}vw;--o:${f(lt ? .78 + r() * .15 : .3 + r() * .12)};--cx:${f(r() * 90)}vw;--dur:${f(dur)}s;--dl:${f(-r() * dur)}s">`;
    }
    return out;
  }
  async function petalsHTML(lt, small){
    const cols = lt ? ['#ff9cc6', '#ffb8d6', '#ffc8a8', '#cdb8ff', `rgb(${accent()})`] : ['#ffd0e6', '#e3d8ff', '#ffe6b8', '#ffc2dc'];
    const urls = (await Promise.all(cols.map((c, i) => toPNG(petalSVG(c, 5 + i * 7), 64, 64)))).filter(Boolean); if (!urls.length) return '';
    const r = rng(SEED + 63), n = small ? 9 : 16; let out = '';
    for (let i = 0; i < n; i++) {
      const dur = 22 + r() * 22;
      out += `<span class="sky-petal" style="--x0:${f(r() * 96)}vw;--s:${f(16 + r() * 18)}px;--o:${f((lt ? .75 : .55) + r() * .2)};--dur:${f(dur)}s;--dl:${f(-r() * dur)}s;--flip:${f(1.4 + r() * 2)}s;--ty:${f(4 + r() * 90)}%;--r0:${Math.round(r() * 300)}deg"><img alt="" src="${urls[i % urls.length]}"></span>`;
    }
    return out;
  }
  function firefliesHTML(lt, small){
    const r = rng(SEED + 87), n = small ? 12 : 22, a = accent();
    const cols = lt ? [[`rgb(${a})`, `rgba(${a},.5)`], ['#ffa94d', 'rgba(255,169,77,.5)'], ['#a98bff', 'rgba(169,139,255,.5)']] : [['#ffe58a', 'rgba(255,214,120,.65)'], ['#ffd0e6', 'rgba(255,170,210,.55)'], ['#cfe0ff', 'rgba(170,200,255,.5)']];
    let out = '';
    for (let i = 0; i < n; i++) {
      const c = pick(r, cols), dur = 12 + r() * 16, bl = 2.6 + r() * 4;
      out += `<span class="sky-fly" style="--x:${f(r() * 100)}%;--y:${f(r() * 100)}%;--dx:${f((r() - .5) * 16)}vw;--dy:${f((r() - .5) * 18)}vh;--dur:${f(dur)}s;--dl:${f(-r() * dur)}s"><i style="--sz:${f(3 + r() * 3)}px;--c:${c[0]};--g:${c[1]};--bl:${f(bl)}s;--bd:${f(-r() * bl)}s"></i></span>`;
    }
    return out;
  }

  /* ---------- chọn kiểu theo ⚙️ (html[data-sky]) + giao diện (html[data-theme]) ---------- */
  const MODES = ['galaxy', 'clouds', 'petals', 'fireflies', 'off'];
  const mode = () => { let m = root.dataset.sky; if (!m) { try { m = JSON.parse(localStorage.getItem('ep_sky')); } catch (e) {} } return MODES.includes(m) ? m : 'galaxy'; };
  const root = document.documentElement, isLight = () => root.dataset.theme === 'pop';
  const imgs = {};                    // ảnh dải Ngân Hà đã dựng, theo "sáng/tối|dọc/ngang"
  let cv = null, gen = 0, lastKey = '', started = false;
  function clear(){ sky.querySelectorAll('.sky-dyn').forEach(e => e.remove()); cv = null; }
  function galaxy(lt){
    const vw = window.innerWidth, vh = window.innerHeight, aspect = vw / vh, port = aspect < 1, d = Math.min(1.25, window.devicePixelRatio || 1), k = (lt ? 'l' : 'd') + (port ? 'p' : 'w');
    cv = document.createElement('canvas'); cv.className = 'sky-gal sky-dyn'; sky.insertBefore(cv, sky.firstChild);
    // canvas rộng hơn màn hình 8% để cả dải trôi chậm mà không lộ mép
    const cw = Math.round(vw * 1.08 * d), ch = Math.round(vh * 1.08 * d), me = gen;
    const draw = im => { if (me !== gen) return; cv.width = cw; cv.height = ch; const g = cv.getContext('2d'), s = Math.max(cw / im.img.width, ch / im.img.height), w = im.img.width * s, h = im.img.height * s; g.drawImage(im.img, (cw - w) / 2, (ch - h) / 2, w, h); sky.classList.add('on'); };
    const W = port ? 900 : 1600, H = Math.round(W / Math.max(.45, Math.min(2.4, aspect)));
    const place = G => {
      const core = sky.querySelector('.sky-core'); if (core) { core.style.left = f(G.B.core[0] / W * 100) + '%'; core.style.top = f(G.B.core[1] / H * 100) + '%'; core.style.transform = `rotate(${f(G.B.deg)}deg)`; }
      sky.insertAdjacentHTML('beforeend', twinkles(W, H, G.B).replace(/class="sky-(tw|mote)"/g, 'class="sky-$1 sky-dyn"'));
    };
    if (imgs[k]) { draw(imgs[k]); place(imgs[k].G); return; }
    const G = galaxySVG(W, H, lt), im = new Image(); im.width = W; im.height = H;
    im.onload = () => { imgs[k] = { img:im, G }; URL.revokeObjectURL(im.src); draw(imgs[k]); };
    im.src = URL.createObjectURL(new Blob([G.svg], { type:'image/svg+xml' }));
    place(G);
  }
  async function paint(){
    const vw = window.innerWidth, vh = window.innerHeight; if (!vw || !vh) return;
    const m = mode(), lt = isLight(), small = vw < 700, key = [m, lt, vw < vh, small].join('|');
    if (key === lastKey) return; lastKey = key; started = true; const me = ++gen;
    sky.dataset.m = m; clear();
    if (m === 'off') { sky.classList.remove('on'); return; }
    if (m === 'galaxy') { galaxy(lt); return; }
    const html = await (m === 'clouds' ? cloudsHTML(lt, small) : m === 'petals' ? petalsHTML(lt, small) : firefliesHTML(lt, small));
    if (me !== gen) return;                       // khách đã đổi kiểu khác trong lúc đang dựng
    sky.insertAdjacentHTML('beforeend', html.replace(/class="(sky-[a-z]+)"/g, 'class="$1 sky-dyn"')); sky.classList.add('on');
  }
  let rt = 0; const later = ms => { clearTimeout(rt); rt = setTimeout(paint, ms); };
  window.addEventListener('resize', () => later(250));
  new MutationObserver(() => { if (started) later(60); }).observe(root, { attributes:true, attributeFilter:['data-sky', 'data-theme'] });
  const start = () => (window.requestIdleCallback ? requestIdleCallback(paint, { timeout:1500 }) : setTimeout(paint, 200));
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
})();
