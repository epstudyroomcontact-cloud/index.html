'use strict';
/* =========================================================
   CON TRỎ CHUỘT: CHÂN MÈO BIẾT XOAY + DẤU CHÂN NHƯ ĐI TRONG NGÂN HÀ
   - Con trỏ là một bàn chân mèo nhỏ: xoay êm theo hướng chuột đang đi, chụm lại khi nhấp, hồng lên khi chỉ vào nút/liên kết,
     và dựng thẳng lại khi chuột đứng yên. Vị trí cập nhật ngay trong sự kiện chuột nên không bị trễ.
   - Di chuột: để lại những dấu chân nhỏ, thưa, bước trái rồi phải theo hướng đi, sáng mờ như bụi sao rồi tan.
   - Nhấp chuột: một vòng gợn sáng mỏng toả ra từ chỗ nhấp (ngôi sao ở nút/liên kết do core.js vẽ thêm).
   - Dùng màu chủ đạo của web (--accent-rgb); nền tối thì cộng sáng, nền trắng ("Rực rỡ") thì pha thường để vẫn thấy được.
   - Chỉ phản ứng với chuột (không phải cảm ứng). Ô nhập chữ và khung nhúng (YouTube…) giữ con trỏ gốc của trình duyệt.
     Canvas trong suốt không bắt chuột; hết hiệu ứng thì dừng hẳn vòng vẽ.
   - Giảm chuyển động (máy hoặc ô ở ⚙️, html[data-calm]): không xoay, không dấu chân, không gợn; app.css giữ con trỏ chân mèo
     hình tĩnh. JS lỗi / chưa chạy thì cũng dùng bản tĩnh đó.
   ========================================================= */
(function(){
  if (!window.matchMedia) return;
  const rm = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement, off = () => (rm.matches && root.dataset.motion !== 'on') || root.dataset.calm === '1';
  const STEP = 38, LIFE = 1.3, RIP = .6, MAXP = 12, MAXD = 24, SIZE = 20;   // quãng đi giữa hai dấu (px), tuổi dấu chân (giây), tuổi gợn nhấp (giây), số dấu / hạt tối đa, cỡ dấu (px)
  const HOT = 'a,button,summary,label,select,[role=button],[data-act],.pcard,.gal-th img,.mj-stop,input[type=checkbox],input[type=radio],input[type=range],input[type=submit],input[type=button]';
  const TXT = 'textarea,input:not([type=checkbox],[type=radio],[type=range],[type=submit],[type=button],[type=file],[type=color]),[contenteditable=""],[contenteditable="true"],body.editing [data-cms],iframe';
  const PAW_D = ['M16 15c-4 0-8 4.2-8 8 0 2.6 2 4 4 4 1.6 0 2.6-.8 4-.8s2.4.8 4 .8c2 0 4-1.4 4-4 0-3.8-4-8-8-8z'], TOES = [[6.6, 13.2, 2.7, 3.5, -22], [12.4, 7.6, 2.8, 3.7, -8], [19.6, 7.6, 2.8, 3.7, 8], [25.4, 13.2, 2.7, 3.5, 22]];
  let cv = null, g = null, W = 0, H = 0, raf = 0, last = 0, now = 0, tone = '', spr = null, pawSpr = null, light = false, toneAt = -9, rgbNow = '255,255,255';
  let el = null, svg = null, live = false, hot = false, press = false, ang = 0, lastT = null, idle = 0;
  const prints = [], dust = [], rips = [];
  const m = { x:0, y:0, on:false, sx:0, sy:0, hx:0, hy:-1, acc:0, side:1 };

  function ensure(){
    if (cv) return;
    cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;z-index:650;pointer-events:none';
    document.body.appendChild(cv); g = cv.getContext('2d'); size();
    el = document.createElement('div'); el.className = 'ep-paw'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<svg viewBox="0 0 32 32"><g><path d="' + PAW_D[0] + '"/>' + TOES.map(([x, y, rx, ry, d]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${d} ${x} ${y})"/>`).join('') + '</g></svg>';
    svg = el.firstChild; document.body.appendChild(el);
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
    c.translate(8, 8); c.scale(1.5, 1.5); c.fillStyle = `rgb(${rgb})`; c.shadowColor = `rgba(${rgb},${glow})`; c.shadowBlur = 7;
    c.fill(new Path2D(PAW_D[0]));
    TOES.forEach(([x, y, rx, ry, d]) => { c.beginPath(); c.ellipse(x, y, rx, ry, d * Math.PI / 180, 0, 6.2832); c.fill(); });
    return s;
  }
  // màu theo theme (đọc lại tối đa 2 lần/giây để đổi theme / màu chủ đạo thì đổi theo)
  function colors(){
    if (now - toneAt < .5 && spr) return; toneAt = now;
    const acc = (getComputedStyle(root).getPropertyValue('--accent-rgb') || '').trim() || '255,61,154', lt = root.dataset.theme === 'pop';
    const key = acc + '|' + lt; if (key === tone) return; tone = key; light = lt;
    // nền tối: pha màu chủ đạo 45% về phía trắng để sáng hơn, phép cộng sáng trên nền gần đen mới thấy rõ
    const rgb = lt ? acc : acc.split(',').map(v => Math.round(+v + (255 - +v) * .45)).join(',');
    rgbNow = rgb; spr = sprite(rgb, lt ? .7 : .85); pawSpr = paw(rgb, lt ? .3 : .8);
  }
  function frame(t){
    raf = 0; const dt = Math.min(.05, (t - last) / 1000 || .016); last = t; now += dt;
    g.clearRect(0, 0, W, H);
    if (off()) { prints.length = dust.length = rips.length = 0; return; }
    colors();
    g.globalCompositeOperation = light ? 'source-over' : 'lighter';
    while (prints.length && now - prints[0].t > LIFE) prints.shift();
    while (dust.length && now - dust[0].t > dust[0].life) dust.shift();
    // dấu chân: hiện lên nhẹ (to dần một chút) rồi tan dần
    for (const p of prints) {
      const age = now - p.t, u = age / LIFE, a = Math.min(1, age / .15) * Math.pow(1 - u, 1.5) * (light ? .5 : .55), s = SIZE * (.75 + .25 * Math.min(1, age / .15)) * (1 - .1 * u);
      if (a <= .01) continue; g.globalAlpha = a; g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.drawImage(pawSpr, -s / 2, -s / 2, s, s); g.restore();
    }
    // bụi sao: hạt bé trôi chậm, nhấp nháy rồi tắt
    for (const d of dust) {
      const u = (now - d.t) / d.life, r = d.r * (1 + 2 * (1 - u)), a = Math.sin(Math.PI * u) * (.55 + .45 * Math.sin(now * 14 + d.ph)) * (light ? .6 : .7);
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
    const px = -m.hy, py = m.hx, x0 = x - m.hx * 18 + px * m.side * 6, y0 = y - m.hy * 18 + py * m.side * 6; m.side = -m.side;
    prints.push({ x:x0, y:y0, a:Math.atan2(m.hy, m.hx) + Math.PI / 2, t:now }); if (prints.length > MAXP) prints.shift();
    for (let i = 0; i < 2; i++) dust.push({ x:x0 + (Math.random() - .5) * 16, y:y0 + (Math.random() - .5) * 16, vx:(Math.random() - .5) * 12, vy:(Math.random() - .5) * 12 - 4, r:.9 + Math.random() * .9, ph:Math.random() * 6.28, life:.8 + Math.random() * .6, t:now });
    if (dust.length > MAXD) dust.splice(0, dust.length - MAXD);
  }
  // chân mèo con trỏ: xoay + chụm khi nhấp + hồng khi chỉ vào nút
  const pose = () => { svg.style.transform = `rotate(${ang}deg) scale(${press ? .78 : hot ? 1.1 : 1})`; };
  function enable(on){
    if (on === live) return; live = on; root.classList.toggle('paw-live', on);
    if (!on && el) el.classList.remove('on');
  }

  window.addEventListener('pointermove', e => {
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    if (off()) { enable(false); return; }
    ensure(); enable(true);
    const px = m.x, py = m.y, first = !m.on, x = e.clientX, y = e.clientY;
    m.on = true; m.x = x; m.y = y;
    el.style.transform = `translate3d(${x}px,${y}px,0)`; el.classList.remove('settle'); el.classList.add('on');
    if (e.target !== lastT) {                     // đổi phần tử dưới con trỏ: hồng lên trên nút, nhường con trỏ gốc cho ô nhập chữ / khung nhúng
      lastT = e.target; const c = e.target.closest ? e.target : null;
      hot = !!(c && c.closest(HOT)); el.classList.toggle('hot', hot); el.classList.toggle('off', !!(c && c.closest(TXT))); pose();
    }
    clearTimeout(idle); idle = setTimeout(() => { el.classList.add('settle'); ang = Math.round(ang / 360) * 360; pose(); }, 900);   // đứng yên thì dựng thẳng lại
    if (first) { m.sx = x; m.sy = y; m.acc = 0; return; }
    const d = Math.hypot(x - px, y - py); if (d < .5) return;
    const hd = Math.hypot(x - m.sx, y - m.sy);
    if (hd >= 5) {                                // hướng đi lấy mẫu mỗi ~5px, làm mượt, để chuột rung hay tốc độ quét cao cũng không làm chân giật
      m.hx += ((x - m.sx) / hd - m.hx) * .5; m.hy += ((y - m.sy) / hd - m.hy) * .5; m.sx = x; m.sy = y;
      const n = Math.hypot(m.hx, m.hy) || 1; m.hx /= n; m.hy /= n;
      const target = Math.atan2(m.hy, m.hx) * 180 / Math.PI + 90, diff = ((target - ang) % 360 + 540) % 360 - 180;
      ang += diff * .5; pose();
    }
    m.acc += d;
    if (m.acc >= STEP) { m.acc = 0; step(x, y); kick(); }
  }, { passive:true });
  window.addEventListener('pointerdown', e => {
    if ((e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') || off()) return;
    if (live && el) { press = true; pose(); }
    if (e.button) return;
    ensure(); rips.push({ x:e.clientX, y:e.clientY, t:now }); if (rips.length > 6) rips.shift(); kick();
  }, { passive:true });
  const release = () => { if (press) { press = false; if (svg) pose(); } };
  window.addEventListener('pointerup', release); window.addEventListener('pointercancel', release); window.addEventListener('blur', release);
  root.addEventListener('mouseleave', () => { m.on = false; lastT = null; if (el) el.classList.remove('on'); });
  window.addEventListener('resize', size);
})();
