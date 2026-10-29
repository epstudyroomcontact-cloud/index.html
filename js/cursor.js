'use strict';
/* =========================================================
   HIỆU ỨNG CON TRỎ CHUỘT: một vệt sáng rất nhẹ, mềm, tan nhanh sau con trỏ
   - Cố ý để kín đáo: vệt ngắn (~0,3 giây), nhỏ và mờ, một vầng sáng bé ở đầu vệt, không hạt sao, không vòng, không đổi hình khi chạm nút.
     Chỉ để con trỏ có chút ánh sáng hợp với nền thiên hà, không làm khách bị phân tán khi đọc hay học.
   - Vệt gồm các đốm gradient tròn mờ rải đều dọc đường di chuột nên liền mạch, không có nét cứng.
   - Dùng màu chủ đạo của web (--accent-rgb); nền tối thì cộng sáng, nền trắng ("Rực rỡ") thì pha thường để vẫn thấy được.
   - Con trỏ gốc của hệ điều hành giữ nguyên. Chỉ chạy trên máy có chuột (pointer:fine). Canvas trong suốt không bắt chuột; hết vệt thì dừng hẳn vòng vẽ.
   - Giảm chuyển động (máy hoặc ô ở ⚙️, html[data-calm]): không có hiệu ứng này; bật/tắt ô ⚙️ có tác dụng ngay.
   ========================================================= */
(function(){
  if (!window.matchMedia || !matchMedia('(pointer: fine)').matches) return;
  const rm = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement, off = () => rm.matches || root.dataset.calm === '1';
  const LIFE = .32, GAP = 4, MAXB = 40;              // tuổi một đốm (giây), khoảng cách rải đốm (px), số đốm tối đa
  let cv = null, g = null, W = 0, H = 0, raf = 0, last = 0, now = 0, tone = '', spr = null, light = false, toneAt = -9;
  const blobs = [];
  const m = { x:0, y:0, fx:0, fy:0, on:false, lastMove:-9, acc:0 };

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
  // màu theo theme (đọc lại tối đa 2 lần/giây để đổi theme / màu chủ đạo thì đổi theo)
  function colors(){
    if (now - toneAt < .5 && spr) return; toneAt = now;
    const acc = (getComputedStyle(root).getPropertyValue('--accent-rgb') || '').trim() || '255,61,154', lt = root.dataset.theme === 'pop';
    const key = acc + '|' + lt; if (key === tone) return; tone = key; light = lt;
    // nền tối: pha màu chủ đạo 45% về phía trắng để sáng hơn, phép cộng sáng trên nền gần đen mới thấy rõ
    const rgb = lt ? acc : acc.split(',').map(v => Math.round(+v + (255 - +v) * .45)).join(',');
    spr = sprite(rgb, lt ? .7 : .85);
  }
  function frame(t){
    raf = 0; const dt = Math.min(.05, (t - last) / 1000 || .016); last = t; now += dt;
    g.clearRect(0, 0, W, H);
    if (off()) { blobs.length = 0; return; }
    colors();
    while (blobs.length && now - blobs[0].t > LIFE) blobs.shift();
    g.globalCompositeOperation = light ? 'source-over' : 'lighter';
    // đốm trong vệt: càng cũ càng nhỏ và mờ
    for (const b of blobs) {
      const k = 1 - (now - b.t) / LIFE, r = 2.5 + 6.5 * Math.pow(k, 1.2), a = Math.pow(k, 1.6) * (light ? .45 : .42);
      if (a <= .01) continue; g.globalAlpha = a; g.drawImage(spr, b.x - r, b.y - r, r * 2, r * 2);
    }
    // vầng sáng bé đi sau con trỏ với độ trễ êm, mờ dần khi con trỏ đứng yên
    m.fx += (m.x - m.fx) * Math.min(1, dt * 11); m.fy += (m.y - m.fy) * Math.min(1, dt * 11);
    const idle = now - m.lastMove, ga = m.on ? Math.max(0, 1 - Math.max(0, idle - .5) / .5) : 0;
    if (ga > .01) { g.globalAlpha = ga * .24; g.drawImage(spr, m.fx - 11, m.fy - 11, 22, 22); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    if (blobs.length || ga > .01) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  window.addEventListener('pointermove', e => {
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    if (off()) return;
    ensure();
    const px = m.x, py = m.y, first = !m.on;
    m.on = true; m.x = e.clientX; m.y = e.clientY; m.lastMove = now;
    if (first) { m.fx = m.x; m.fy = m.y; blobs.length = 0; } else {
      // rải đốm đều dọc đoạn vừa đi qua để đi nhanh vẫn liền mạch
      const d = Math.hypot(m.x - px, m.y - py), n = Math.min(12, Math.floor((d + m.acc) / GAP));
      for (let i = 1; i <= n; i++) { const k = i / n; blobs.push({ x:px + (m.x - px) * k, y:py + (m.y - py) * k, t:now }); }
      m.acc = n ? (d + m.acc) - n * GAP : m.acc + d; if (blobs.length > MAXB) blobs.splice(0, blobs.length - MAXB);
    }
    kick();
  }, { passive:true });
  root.addEventListener('mouseleave', () => { m.on = false; kick(); });
  window.addEventListener('resize', size);
})();
