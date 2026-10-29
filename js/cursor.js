'use strict';
/* =========================================================
   HIỆU ỨNG CON TRỎ CHUỘT: vệt sáng nhòe mềm đi theo con trỏ
   - Vệt gồm nhiều đốm sáng tròn mờ (gradient toả đều, không có nét cứng) rải dày dọc đường di chuột, nhỏ dần và tan trong ~0,6 giây,
     màu chuyển từ màu chủ đạo của web sang vàng ấm. Các đốm chồng lên nhau nên liền mạch như một dải khói sáng, không thấy từng nét.
   - Một vầng sáng lớn hơn đi sau con trỏ với độ trễ êm (lò xo), cho cảm giác con trỏ đang kéo theo ánh sáng.
   - Dùng màu chủ đạo của web (--accent-rgb) và tự đổi cách pha màu theo nền: nền tối thì cộng sáng (phát sáng), nền trắng ("Rực rỡ") thì pha thường
     với độ đậm vừa đủ, nên nền nào cũng nhìn thấy.
   - Chạm vào nút / link: vầng sáng ấm lên và một vòng mảnh khẽ nở quanh con trỏ cho biết bấm được. Rất thưa mới có một hạt sao li ti.
   - Con trỏ gốc của hệ điều hành giữ nguyên. Chỉ chạy trên máy có chuột (pointer:fine). Canvas trong suốt không bắt chuột; hết vệt thì dừng hẳn vòng vẽ.
   - Giảm chuyển động (máy hoặc ô ở ⚙️, html[data-calm]): không có hiệu ứng này; bật/tắt ô ⚙️ có tác dụng ngay.
   ========================================================= */
(function(){
  if (!window.matchMedia || !matchMedia('(pointer: fine)').matches) return;
  const rm = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement, off = () => rm.matches || root.dataset.calm === '1';
  const LIFE = .62, GAP = 3.2, MAXB = 90;            // tuổi một đốm (giây), khoảng cách rải đốm (px), số đốm tối đa
  const HOT = 'a,button,select,label,summary,[data-act],input[type=checkbox],input[type=radio],input[type=range]';
  let cv = null, g = null, W = 0, H = 0, raf = 0, last = 0, now = 0, tone = '', sprA = null, sprB = null, light = false, toneAt = -9;
  const blobs = [], spark = [];
  const m = { x:0, y:0, fx:0, fy:0, on:false, lastMove:-9, acc:0, ring:0, hot:false, warm:0 };

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
    if (now - toneAt < .5 && sprA) return; toneAt = now;
    const cs = getComputedStyle(root), acc = (cs.getPropertyValue('--accent-rgb') || '255,61,154').trim() || '255,61,154', lt = root.dataset.theme === 'pop';
    const key = acc + '|' + lt; if (key === tone) return; tone = key; light = lt;
    sprA = sprite(acc, lt ? .55 : .75); sprB = sprite(lt ? '255,150,40' : '255,214,140', lt ? .5 : .7);
  }
  function star(x, y, r){
    g.save(); g.translate(x, y); g.scale(r / 10, r / 10); g.translate(-10, -10);
    g.beginPath(); g.moveTo(10, 0); g.quadraticCurveTo(11, 9, 20, 10); g.quadraticCurveTo(11, 11, 10, 20); g.quadraticCurveTo(9, 11, 0, 10); g.quadraticCurveTo(9, 9, 10, 0); g.closePath(); g.fill(); g.restore();
  }
  function frame(t){
    raf = 0; const dt = Math.min(.05, (t - last) / 1000 || .016); last = t; now += dt;
    g.clearRect(0, 0, W, H);
    if (off()) { blobs.length = 0; spark.length = 0; return; }
    colors();
    while (blobs.length && now - blobs[0].t > LIFE) blobs.shift();
    g.globalCompositeOperation = light ? 'source-over' : 'lighter';
    // đốm trong vệt: càng cũ càng nhỏ, càng mờ, màu trượt từ màu chủ đạo sang vàng ấm
    for (const b of blobs) {
      const u = (now - b.t) / LIFE, k = 1 - u, r = 5 + 15 * Math.pow(k, 1.2), a = Math.pow(k, 1.5) * (light ? .8 : .7);
      if (a <= .01) continue;
      g.globalAlpha = a * (1 - u); g.drawImage(sprA, b.x - r, b.y - r, r * 2, r * 2);
      if (u > .35) { g.globalAlpha = a * Math.min(1, (u - .35) * 1.6) * .8; g.drawImage(sprB, b.x - r * .8, b.y - r * .8, r * 1.6, r * 1.6); }
    }
    // vầng sáng đi sau con trỏ với độ trễ êm; ấm lên khi chạm nút
    m.fx += (m.x - m.fx) * Math.min(1, dt * 11); m.fy += (m.y - m.fy) * Math.min(1, dt * 11);
    m.warm += ((m.hot ? 1 : 0) - m.warm) * Math.min(1, dt * 9);
    const idle = now - m.lastMove, ga = m.on ? Math.max(0, 1 - Math.max(0, idle - .8) / 1) : 0;
    if (ga > .01) { const r = 20 + 6 * m.warm; g.globalAlpha = ga * (.55 + .25 * m.warm); g.drawImage(sprA, m.fx - r, m.fy - r, r * 2, r * 2); g.globalAlpha = ga * .45; g.drawImage(sprB, m.fx - r * .45, m.fy - r * .45, r * .9, r * .9); }
    g.globalAlpha = 1;
    // hạt sao li ti, rất thưa
    g.globalCompositeOperation = 'source-over';
    for (let i = spark.length - 1; i >= 0; i--) {
      const s = spark[i]; s.life += dt; if (s.life >= s.max) { spark.splice(i, 1); continue; }
      const u = s.life / s.max, a = Math.sin(Math.PI * u) * (light ? .9 : .8); s.x += s.vx * dt; s.y += s.vy * dt;
      g.fillStyle = light ? `rgba(255,150,40,${a.toFixed(3)})` : `rgba(255,240,215,${a.toFixed(3)})`; star(s.x, s.y, s.r * (1 - u * .3));
    }
    // vòng mảnh khi chạm nút / link
    m.ring += ((m.hot && m.on ? 1 : 0) - m.ring) * Math.min(1, dt * 12);
    if (m.ring > .02) { const acc = (tone.split('|')[0] || '255,61,154'); g.strokeStyle = `rgba(${acc},${(.6 * m.ring).toFixed(3)})`; g.lineWidth = 1.5; g.beginPath(); g.arc(m.fx, m.fy, 12 + 7 * m.ring, 0, 7); g.stroke(); }
    if (blobs.length || spark.length || m.ring > .02 || ga > .01) raf = requestAnimationFrame(frame);
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
      const d = Math.hypot(m.x - px, m.y - py), n = Math.min(14, Math.floor((d + m.acc) / GAP));
      for (let i = 1; i <= n; i++) { const k = i / n; blobs.push({ x:px + (m.x - px) * k, y:py + (m.y - py) * k, t:now }); }
      m.acc = n ? (d + m.acc) - n * GAP : m.acc + d; if (blobs.length > MAXB) blobs.splice(0, blobs.length - MAXB);
      m.sp = (m.sp || 0) + d;
      if (m.sp > 160) { m.sp = 0; const a = Math.random() * 6.283; spark.push({ x:m.x + (Math.random() - .5) * 8, y:m.y + (Math.random() - .5) * 8, vx:Math.cos(a) * 5, vy:Math.sin(a) * 5 + 4, r:2.5 + Math.random() * 1.5, life:0, max:.9 + Math.random() * .5 }); if (spark.length > 8) spark.shift(); }
    }
    kick();
  }, { passive:true });
  document.addEventListener('pointerover', e => { m.hot = !!(e.target.closest && e.target.closest(HOT)); if (m.hot) kick(); }, { passive:true });
  root.addEventListener('mouseleave', () => { m.on = false; m.hot = false; kick(); });
  window.addEventListener('resize', size);
})();
