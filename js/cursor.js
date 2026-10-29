'use strict';
/* =========================================================
   HIỆU ỨNG CON TRỎ CHUỘT: một vệt sáng mảnh như đuôi sao băng đi sau con trỏ, thỉnh thoảng một hạt sao li ti rơi lại
   - Vệt sáng: dải mảnh thon dần về đuôi, màu trắng ấm chuyển hồng nhạt rồi tan trong khoảng 0,4 giây. Vẽ cộng sáng nên trên nền tối nhìn như ánh sáng thật.
   - Hạt sao: rất nhỏ (2-4 px), thưa (cứ ~90 px di chuyển mới có một hạt), mờ, trôi chậm rồi tan. Không có "mưa sao" ồn ào.
   - Chạm vào nút / link: một vòng mảnh khẽ nở quanh con trỏ cho biết bấm được, rời ra thì thu lại.
   - Con trỏ gốc của hệ điều hành giữ nguyên. Chỉ chạy trên máy có chuột (pointer:fine). Canvas trong suốt không bắt chuột; hết vệt thì dừng hẳn vòng vẽ.
   - Giảm chuyển động (máy hoặc ô ở ⚙️, html[data-calm]): không có hiệu ứng này; bật/tắt ô ⚙️ có tác dụng ngay.
   ========================================================= */
(function(){
  if (!window.matchMedia || !matchMedia('(pointer: fine)').matches) return;
  const rm = matchMedia('(prefers-reduced-motion: reduce)');
  const off = () => rm.matches || document.documentElement.dataset.calm === '1';
  const LIFE = .42, MAXP = 40;                       // tuổi của một điểm trên vệt (giây), số điểm tối đa
  const HOT = 'a,button,select,label,summary,[data-act],input[type=checkbox],input[type=radio],input[type=range]';
  let cv = null, g = null, W = 0, H = 0, raf = 0, last = 0, now = 0;
  const trail = [], spark = [];
  const m = { x:0, y:0, on:false, lastMove:-9, acc:0, ring:0, hot:false };

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
  // sao bốn cánh li ti (cùng hình sao trên logo), vẽ quanh (x, y) bán kính r
  function star(x, y, r){
    g.save(); g.translate(x, y); g.scale(r / 10, r / 10); g.translate(-10, -10);
    g.beginPath(); g.moveTo(10, 0); g.quadraticCurveTo(11, 9, 20, 10); g.quadraticCurveTo(11, 11, 10, 20); g.quadraticCurveTo(9, 11, 0, 10); g.quadraticCurveTo(9, 9, 10, 0); g.closePath(); g.fill(); g.restore();
  }
  function frame(t){
    raf = 0; const dt = Math.min(.05, (t - last) / 1000 || .016); last = t; now += dt;
    g.clearRect(0, 0, W, H);
    if (off()) { trail.length = 0; spark.length = 0; return; }
    while (trail.length && now - trail[0].t > LIFE) trail.shift();
    g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
    // vệt sáng: nối các điểm, càng cũ càng mảnh và mờ, màu từ trắng ấm sang hồng nhạt
    for (let i = 1; i < trail.length; i++) {
      const a = trail[i - 1], b = trail[i], u = 1 - (now - b.t) / LIFE, k = Math.pow(Math.max(0, u), 1.4);
      if (k <= 0) continue;
      g.strokeStyle = `rgba(${Math.round(255)},${Math.round(190 + 50 * k)},${Math.round(210 + 20 * k)},${(.55 * k).toFixed(3)})`;
      g.lineWidth = .6 + 3.2 * k; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
    }
    // quầng sáng nhỏ ở đầu vệt, mờ dần khi con trỏ đứng yên
    const idle = now - m.lastMove, ga = m.on ? Math.max(0, 1 - Math.max(0, idle - .6) / .9) : 0;
    if (ga > .01) { const gr = g.createRadialGradient(m.x, m.y, 0, m.x, m.y, 16); gr.addColorStop(0, `rgba(255,232,200,${(.22 * ga).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,200,220,0)'); g.fillStyle = gr; g.beginPath(); g.arc(m.x, m.y, 16, 0, 7); g.fill(); }
    // hạt sao li ti
    for (let i = spark.length - 1; i >= 0; i--) {
      const s = spark[i]; s.life += dt; if (s.life >= s.max) { spark.splice(i, 1); continue; }
      const u = s.life / s.max, a = Math.sin(Math.PI * u) * .75; s.x += s.vx * dt; s.y += s.vy * dt;
      g.fillStyle = `rgba(255,236,200,${a.toFixed(3)})`; star(s.x, s.y, s.r * (1 - u * .3));
    }
    // vòng mảnh khi chạm vào nút / link
    m.ring += ((m.hot && m.on ? 1 : 0) - m.ring) * Math.min(1, dt * 12);
    if (m.ring > .02) { g.strokeStyle = `rgba(255,214,190,${(.5 * m.ring).toFixed(3)})`; g.lineWidth = 1; g.beginPath(); g.arc(m.x, m.y, 8 + 8 * m.ring, 0, 7); g.stroke(); }
    g.globalCompositeOperation = 'source-over';
    if (trail.length || spark.length || m.ring > .02 || ga > .01) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  window.addEventListener('pointermove', e => {
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    if (off()) return;
    ensure();
    const px = m.x, py = m.y, first = !m.on;
    m.on = true; m.x = e.clientX; m.y = e.clientY; m.lastMove = now;
    if (first) { trail.length = 0; } else {
      trail.push({ x:m.x, y:m.y, t:now }); if (trail.length > MAXP) trail.shift();
      m.acc += Math.hypot(m.x - px, m.y - py);
      if (m.acc > 90) { m.acc = 0; const a = Math.random() * 6.283; spark.push({ x:m.x + (Math.random() - .5) * 6, y:m.y + (Math.random() - .5) * 6, vx:Math.cos(a) * 5, vy:Math.sin(a) * 5 + 4, r:2 + Math.random() * 2, life:0, max:.8 + Math.random() * .5 }); if (spark.length > 14) spark.shift(); }
    }
    kick();
  }, { passive:true });
  document.addEventListener('pointerover', e => { m.hot = !!(e.target.closest && e.target.closest(HOT)); if (m.hot) kick(); }, { passive:true });
  document.documentElement.addEventListener('mouseleave', () => { m.on = false; m.hot = false; kick(); });
  window.addEventListener('resize', size);
})();
