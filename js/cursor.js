'use strict';
/* =========================================================
   HIỆU ỨNG CON TRỎ CHUỘT: vệt bụi sao đi theo con trỏ (cùng kiểu sao bốn cánh của logo và thiên hà)
   - Chỉ chạy trên máy có chuột (pointer:fine). Điện thoại / máy tính bảng không có con trỏ nên không tải gì thêm.
   - Con trỏ gốc của hệ điều hành vẫn giữ nguyên (không ẩn, không thay), chỉ thêm vầng sáng mờ và sao nhỏ rơi theo vệt di chuột.
   - Một canvas trong suốt phủ cả màn hình, không bắt chuột. Chỉ vẽ lúc có hạt, hết hạt thì dừng hẳn vòng vẽ (không tốn pin).
   - Giảm chuyển động (máy hoặc ô ở ⚙️, html[data-calm]): không có hiệu ứng này; bật/tắt ô ⚙️ có tác dụng ngay.
   ========================================================= */
(function(){
  if (!window.matchMedia || !matchMedia('(pointer: fine)').matches) return;
  const rm = matchMedia('(prefers-reduced-motion: reduce)');
  const off = () => rm.matches || document.documentElement.dataset.calm === '1';
  const COLORS = ['255,244,214', '255,224,138', '255,208,230', '255,255,255'];
  const MAX = 70;
  let cv = null, g = null, W = 0, H = 0, D = 1, raf = 0, last = 0;
  const P = [];                                    // sao đang bay
  const m = { x:-99, y:-99, gx:-99, gy:-99, on:false, lx:0, ly:0, acc:0 };

  function ensure(){
    if (cv) return;
    cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;z-index:650;pointer-events:none';
    document.body.appendChild(cv); g = cv.getContext('2d'); size();
  }
  function size(){
    if (!cv) return;
    D = Math.min(2, window.devicePixelRatio || 1); W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * D); cv.height = Math.round(H * D); g.setTransform(D, 0, 0, D, 0, 0);
  }
  // sao bốn cánh: hai nét cong lõm như path của logo (M10 0Q11 9 20 10Q11 11 10 20Q9 11 0 10Q9 9 10 0Z), vẽ theo bán kính r
  function star(x, y, r, rot){
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(r / 10, r / 10); g.translate(-10, -10);
    g.beginPath(); g.moveTo(10, 0); g.quadraticCurveTo(11, 9, 20, 10); g.quadraticCurveTo(11, 11, 10, 20); g.quadraticCurveTo(9, 11, 0, 10); g.quadraticCurveTo(9, 9, 10, 0); g.closePath(); g.fill(); g.restore();
  }
  function spawn(x, y, speed){
    if (P.length >= MAX) P.shift();
    const a = Math.random() * 6.283, v = 6 + Math.random() * 14;
    P.push({ x:x + (Math.random() - .5) * 6, y:y + (Math.random() - .5) * 6, vx:Math.cos(a) * v, vy:Math.sin(a) * v + 8 + Math.random() * 10,
      r:2.5 + Math.random() * 4.5 + Math.min(speed / 400, 2), rot:Math.random() * 3, vr:(Math.random() - .5) * 3, life:0, max:.7 + Math.random() * .7, c:COLORS[Math.floor(Math.random() * COLORS.length)] });
  }
  function frame(t){
    raf = 0; const dt = Math.min(.05, (t - last) / 1000 || .016); last = t;
    if (off()) { P.length = 0; g.clearRect(0, 0, W, H); return; }
    g.clearRect(0, 0, W, H);
    // vầng sáng mờ trễ nhẹ sau con trỏ
    m.gx += (m.x - m.gx) * Math.min(1, dt * 9); m.gy += (m.y - m.gy) * Math.min(1, dt * 9);
    if (m.on) { const gr = g.createRadialGradient(m.gx, m.gy, 0, m.gx, m.gy, 34); gr.addColorStop(0, 'rgba(255,214,170,.20)'); gr.addColorStop(.5, 'rgba(255,150,200,.08)'); gr.addColorStop(1, 'rgba(255,150,200,0)'); g.fillStyle = gr; g.beginPath(); g.arc(m.gx, m.gy, 34, 0, 7); g.fill(); }
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.life += dt; if (p.life >= p.max) { P.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - dt * 1.6; p.vy *= 1 - dt * .8; p.rot += p.vr * dt;
      const u = p.life / p.max, a = Math.sin(Math.PI * Math.min(1, u * 1.15)) * .9, r = p.r * (1 - u * .45);
      g.fillStyle = `rgba(${p.c},${a.toFixed(3)})`; g.shadowColor = `rgba(255,214,150,${(a * .8).toFixed(3)})`; g.shadowBlur = 6; star(p.x, p.y, r, p.rot);
    }
    g.shadowBlur = 0;
    if (P.length || m.on) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  window.addEventListener('pointermove', e => {
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    if (off()) return;
    ensure(); if (!m.on) { m.gx = e.clientX; m.gy = e.clientY; m.lx = e.clientX; m.ly = e.clientY; }
    m.on = true; m.x = e.clientX; m.y = e.clientY;
    const d = Math.hypot(m.x - m.lx, m.y - m.ly); m.acc += d; m.lx = m.x; m.ly = m.y;
    while (m.acc > 26) { m.acc -= 26; spawn(m.x, m.y, d * 60); }    // cứ 26px di chuyển thì rơi một ngôi sao: di chậm thì thưa, di nhanh thì dày
    kick();
  }, { passive:true });
  document.addEventListener('pointerleave', () => { m.on = false; }, { passive:true });
  document.documentElement.addEventListener('mouseleave', () => { m.on = false; });
  window.addEventListener('resize', size);
})();
