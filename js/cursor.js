'use strict';
/* =========================================================
   HIỆU ỨNG CON TRỎ CHUỘT (con trỏ bàn chân mèo nằm trong app.css)
   - Di chuột: để lại những dấu chân mèo nhỏ, bước trái rồi phải theo hướng đi, sáng lên như bụi sao rồi tan dần, như mèo đang đi trong ngân hà.
     Mỗi dấu kèm vài hạt bụi sao bé trôi nhẹ. Cố ý thưa và mờ để không làm khách phân tán khi đọc hay học.
   - Nhấp chuột: một vòng gợn sáng mỏng toả ra từ chỗ nhấp cùng một vầng sáng nở rồi tan (ngôi sao ở nút/liên kết do core.js vẽ thêm).
   - Dùng màu chủ đạo của web (--accent-rgb); nền tối thì cộng sáng, nền trắng ("Rực rỡ") thì pha thường để vẫn thấy được.
   - Chỉ chạy trên máy có chuột (pointer:fine). Canvas trong suốt không bắt chuột; hết hiệu ứng thì dừng hẳn vòng vẽ.
   - Giảm chuyển động (máy hoặc ô ở ⚙️, html[data-calm]): không có dấu chân và gợn; con trỏ bàn chân mèo (hình tĩnh) vẫn giữ.
   ========================================================= */
(function(){
  if (!window.matchMedia || !matchMedia('(pointer: fine)').matches) return;
  const rm = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement, off = () => rm.matches || root.dataset.calm === '1';
  const STEP = 30, LIFE = 1.5, RIP = .6, MAXP = 14, MAXD = 40, SIZE = 28;   // quãng đi giữa hai dấu (px), tuổi dấu chân và gợn nhấp (giây), số dấu / hạt tối đa, cỡ dấu (px)
  let cv = null, g = null, W = 0, H = 0, raf = 0, last = 0, now = 0, tone = '', spr = null, pawSpr = null, light = false, toneAt = -9, rgbNow = '255,255,255';
  const prints = [], dust = [], rips = [];
  const m = { x:0, y:0, on:false, hx:0, hy:-1, acc:0, side:1 };

  function ensure(){
    if (cv) return;
    cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;z-index:650;pointer-events:none';
    document.body.appendChild(cv); g = cv.getContext('2d'); size();
  }
  function size(){
    if (!cv) return; const D = Math.min(2, window.devicePixelRatio || 1); W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * D); cv.height = Math.round(H * D); g.setTransform(D, 0, 0, D, 0, 0);
  }
  // đốm sáng mềm dựng sẵn một lần cho mỗi màu: gradient tròn mờ dần ra rìa (đường cong mịn, không có viền)
  function sprite(rgb, a){
    const s = document.createElement('canvas'); s.width = s.height = 96; const c = s.getContext('2d'), r = c.createRadialGradient(48, 48, 0, 48, 48, 48);
    [[0, 1], [.25, .62], [.5, .26], [.75, .07], [1, 0]].forEach(([o, k]) => r.addColorStop(o, `rgba(${rgb},${(a * k).toFixed(3)})`));
    c.fillStyle = r; c.fillRect(0, 0, 96, 96); return s;
  }
  // dấu chân mèo (cùng hình với con trỏ): một đệm lớn + bốn ngón, hướng lên trên, có quầng sáng mờ quanh
  function paw(rgb, glow){
    const s = document.createElement('canvas'); s.width = s.height = 64; const c = s.getContext('2d');
    c.translate(8, 8); c.scale(1.5, 1.5); c.fillStyle = `rgb(${rgb})`; c.shadowColor = `rgba(${rgb},${glow})`; c.shadowBlur = 9;
    c.fill(new Path2D('M16 15c-4 0-8 4.2-8 8 0 2.6 2 4 4 4 1.6 0 2.6-.8 4-.8s2.4.8 4 .8c2 0 4-1.4 4-4 0-3.8-4-8-8-8z'));
    [[6.6, 13.2, 2.7, 3.5, -22], [12.4, 7.6, 2.8, 3.7, -8], [19.6, 7.6, 2.8, 3.7, 8], [25.4, 13.2, 2.7, 3.5, 22]].forEach(([x, y, rx, ry, d]) => { c.beginPath(); c.ellipse(x, y, rx, ry, d * Math.PI / 180, 0, 6.2832); c.fill(); });
    return s;
  }
  // màu theo theme (đọc lại tối đa 2 lần/giây để đổi theme / màu chủ đạo thì đổi theo)
  function colors(){
    if (now - toneAt < .5 && spr) return; toneAt = now;
    const acc = (getComputedStyle(root).getPropertyValue('--accent-rgb') || '').trim() || '255,61,154', lt = root.dataset.theme === 'pop';
    const key = acc + '|' + lt; if (key === tone) return; tone = key; light = lt;
    // nền tối: pha màu chủ đạo 45% về phía trắng để sáng hơn, phép cộng sáng trên nền gần đen mới thấy rõ
    const rgb = lt ? acc : acc.split(',').map(v => Math.round(+v + (255 - +v) * .45)).join(',');
    rgbNow = rgb; spr = sprite(rgb, lt ? .7 : .85); pawSpr = paw(rgb, lt ? .35 : .9);
  }
  function frame(t){
    raf = 0; const dt = Math.min(.05, (t - last) / 1000 || .016); last = t; now += dt;
    g.clearRect(0, 0, W, H);
    if (off()) { prints.length = dust.length = rips.length = 0; return; }
    colors();
    g.globalCompositeOperation = light ? 'source-over' : 'lighter';
    while (prints.length && now - prints[0].t > LIFE) prints.shift();
    while (dust.length && now - dust[0].t > dust[0].life) dust.shift();
    // dấu chân: hiện nhanh rồi tan dần, nhỏ lại một chút
    for (const p of prints) {
      const u = (now - p.t) / LIFE, a = Math.min(1, (now - p.t) / .12) * Math.pow(1 - u, 1.4) * (light ? .6 : .75), s = SIZE * (1 - .12 * u);
      if (a <= .01) continue; g.globalAlpha = a; g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.drawImage(pawSpr, -s / 2, -s / 2, s, s); g.restore();
    }
    // bụi sao: hạt bé trôi chậm, nhấp nháy rồi tắt
    for (const d of dust) {
      const u = (now - d.t) / d.life, r = d.r * (1 + 2.2 * (1 - u)), a = Math.sin(Math.PI * u) * (.55 + .45 * Math.sin(now * 14 + d.ph)) * (light ? .7 : .8);
      if (a <= .01) continue; g.globalAlpha = a; g.drawImage(spr, d.x + d.vx * (now - d.t) - r, d.y + d.vy * (now - d.t) - r, r * 2, r * 2);
    }
    // gợn khi nhấp: vầng sáng nở ra rồi tan + một vòng mỏng toả ra, chậm dần (easeOut)
    while (rips.length && now - rips[0].t > RIP) rips.shift();
    for (const q of rips) {
      const u = (now - q.t) / RIP, e = 1 - Math.pow(1 - u, 3), f = 1 - u;
      g.globalAlpha = f * f * (light ? .5 : .42); const R = 8 + 20 * e; g.drawImage(spr, q.x - R, q.y - R, R * 2, R * 2);
      g.globalAlpha = f * f * (light ? .75 : .6); g.lineWidth = 1.6 - 1 * u; g.strokeStyle = `rgb(${rgbNow})`;
      g.beginPath(); g.arc(q.x, q.y, 5 + 26 * e, 0, 6.2832); g.stroke();
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    if (prints.length || dust.length || rips.length) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  // đặt một dấu chân sau con trỏ, lệch trái/phải xen kẽ, xoay theo hướng đi, kèm vài hạt bụi sao
  function step(x, y){
    const px = -m.hy, py = m.hx, x0 = x - m.hx * 14 + px * m.side * 6.5, y0 = y - m.hy * 14 + py * m.side * 6.5; m.side = -m.side;
    prints.push({ x:x0, y:y0, a:Math.atan2(m.hy, m.hx) + Math.PI / 2, t:now }); if (prints.length > MAXP) prints.shift();
    for (let i = 0; i < 3; i++) dust.push({ x:x0 + (Math.random() - .5) * 18, y:y0 + (Math.random() - .5) * 18, vx:(Math.random() - .5) * 14, vy:(Math.random() - .5) * 14 - 4, r:1.1 + Math.random() * 1.3, ph:Math.random() * 6.28, life:.9 + Math.random() * .8, t:now });
    if (dust.length > MAXD) dust.splice(0, dust.length - MAXD);
  }

  window.addEventListener('pointermove', e => {
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    if (off()) return;
    ensure();
    const px = m.x, py = m.y, first = !m.on;
    m.on = true; m.x = e.clientX; m.y = e.clientY;
    if (first) { m.acc = 0; return; }
    const d = Math.hypot(m.x - px, m.y - py); if (d < .5) return;
    m.hx += ((m.x - px) / d - m.hx) * .35; m.hy += ((m.y - py) / d - m.hy) * .35;     // hướng đi làm mượt, để dấu chân không giật khi tay rung
    const n = Math.hypot(m.hx, m.hy) || 1; m.hx /= n; m.hy /= n;
    m.acc += d;
    if (m.acc >= STEP) { m.acc = 0; step(m.x, m.y); kick(); }
  }, { passive:true });
  window.addEventListener('pointerdown', e => {
    if (e.button || (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') || off()) return;
    ensure(); rips.push({ x:e.clientX, y:e.clientY, t:now }); if (rips.length > 6) rips.shift(); kick();
  }, { passive:true });
  root.addEventListener('mouseleave', () => { m.on = false; });
  window.addEventListener('resize', size);
})();
