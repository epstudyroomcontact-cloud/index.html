/* =========================================================
   HIỆU ỨNG CHUYỂN ĐỘNG CHO TỪNG TRẠM (canvas đè lên tranh)
   - <div class="mj-art" data-mjfx="fireflies,petals"> : các hiệu ứng nền chạy liên tục, mỗi trạm một kiểu (MJ_FX ở cuối file).
   - data-mjburst="1" : trạm vừa mở lần đầu, chạy thêm một màn "mở trạm" (vòng sáng loé ra và bụi sao bung).
   - Trạm gặp lại Moon (finale) là màn lớn nhất: ánh vàng lan ra, sóng sáng vàng toả nhẹ trên mặt đất, đom đóm bay lên,
     cánh hoa rơi và sao băng, sau đó giữ nhịp sáng ấm.
   - Thêm: sương mù trôi (fog), hơi mưa (haze), tia sáng xiên (rays), mây trôi che trăng (clouds), lá rơi (leaves), hạt bồ công anh (seeds).
   - Máy bật "giảm chuyển động" thì chỉ vẽ một khung đứng yên (không có màn mở trạm). Ngoài màn hình thì dừng vẽ.
   ========================================================= */
const MJF = { list:new Set(), raf:0, last:0 };
const mjfReduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const mjfIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => { es.forEach(e => { const st = e.target._mjf; if (st) st.vis = e.isIntersecting; }); mjfKick(); }) : null;
const mjfR = (a, b) => a + Math.random() * (b - a);
const MJ_FX = {
  start:'fog,haze', d1:'fog,haze', d3:'fog,haze', d7:'clouds,motes', d10:'fireflies,fog', d14:'ripples,glints,fog', d21:'starfall,clouds', d30:'glints,meteors,clouds',
  d45:'motes,rays', d60:'fireflies,stars,seeds', d80:'motes,fireflies,fog', d100:'ripples,fireflies,fog,leaves', d130:'petals,rays', d200:'stars,meteors',
  d250:'rays,fog,haze', d300:'ripples,fireflies,seeds,leaves', d365:'finale', d400:'dreamdust,rays', d450:'dreamdust,stars,clouds', after:'meteorshower,stars,fog'
};

// ----- từng loại hạt: make tạo hạt, step cập nhật, draw vẽ -----
const MJF_KIND = {
  fireflies:{ n:st => Math.max(10, st.w * st.h / 7000), make:st => ({ x:mjfR(0, st.w), y:mjfR(st.h * .25, st.h), p:mjfR(0, 9), sp:mjfR(.25, .6), r:mjfR(1.2, 2.4) }),
    step:(q, st, dt, t) => { q.x += Math.sin(t * q.sp + q.p) * 9 * dt; q.y += Math.cos(t * q.sp * .8 + q.p * 1.7) * 6 * dt - 2.4 * dt; if (q.y < st.h * .15) q.y = st.h; },
    draw:(g, q, st, t) => { const a = .35 + .65 * Math.pow(.5 + .5 * Math.sin(t * 1.6 + q.p * 3), 2); mjfGlow(g, q.x, q.y, q.r * 5, `rgba(255,228,140,${(a * .5).toFixed(3)})`); g.fillStyle = `rgba(255,246,200,${a.toFixed(3)})`; g.beginPath(); g.arc(q.x, q.y, q.r * .55, 0, 7); g.fill(); } },
  motes:{ n:st => st.w * st.h / 4500, make:st => ({ x:mjfR(0, st.w), y:mjfR(0, st.h), p:mjfR(0, 9), r:mjfR(.5, 1.3), v:mjfR(2, 6) }),
    step:(q, st, dt, t) => { q.y -= q.v * dt; q.x += Math.sin(t * .4 + q.p) * 3 * dt; if (q.y < -4) { q.y = st.h + 4; q.x = mjfR(0, st.w); } },
    draw:(g, q, st, t) => { const a = .25 + .3 * Math.sin(t * .9 + q.p); g.fillStyle = `rgba(255,236,190,${Math.max(0, a).toFixed(3)})`; g.beginPath(); g.arc(q.x, q.y, q.r, 0, 7); g.fill(); } },
  petals:{ n:st => Math.max(12, st.w * st.h / 5000), make:(st, first) => ({ x:mjfR(-20, st.w), y:first ? mjfR(0, st.h) : mjfR(-40, -10), p:mjfR(0, 9), v:mjfR(10, 20), s:mjfR(3, 5.4), rot:mjfR(0, 6) }),
    step:(q, st, dt, t) => { q.y += q.v * dt; q.x += (Math.sin(t * .8 + q.p) * 14 + 6) * dt; q.rot += dt * 1.2; if (q.y > st.h + 10) Object.assign(q, MJF_KIND.petals.make(st)); },
    draw:(g, q, st, t) => { g.save(); g.translate(q.x, q.y); g.rotate(q.rot); g.scale(1, .45 + .4 * Math.abs(Math.sin(t * 1.3 + q.p))); g.fillStyle = 'rgba(255,170,200,.85)'; g.beginPath(); g.ellipse(0, 0, q.s, q.s * .62, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,220,232,.6)'; g.beginPath(); g.ellipse(-q.s * .25, -q.s * .1, q.s * .4, q.s * .25, 0, 0, 7); g.fill(); g.restore(); } },
  stars:{ n:st => st.w * st.h / 6000, make:st => ({ x:mjfR(0, st.w), y:mjfR(0, st.h * .65), p:mjfR(0, 9), sp:mjfR(.6, 1.6), s:mjfR(1.6, 3.4) }),
    step:() => {}, draw:(g, q, st, t) => { const a = Math.max(0, Math.sin(t * q.sp + q.p)); if (a < .05) return; mjfSpark(g, q.x, q.y, q.s * a, `rgba(255,248,215,${(a * .9).toFixed(3)})`); } },
  glints:{ n:st => st.w * st.h / 3000, make:st => ({ x:mjfR(st.w * .2, st.w * .8), y:mjfR(st.h * .55, st.h), p:mjfR(0, 9), sp:mjfR(1.2, 2.6) }),
    step:() => {}, draw:(g, q, st, t) => { const a = Math.max(0, Math.sin(t * q.sp + q.p)); if (a < .2) return; const l = 2 + 5 * (q.y / st.h); g.strokeStyle = `rgba(255,248,220,${(a * .7).toFixed(3)})`; g.lineWidth = 1; g.beginPath(); g.moveTo(q.x - l, q.y); g.lineTo(q.x + l, q.y); g.stroke(); } },
  ripples:{ n:st => 7, make:st => ({ x:mjfR(0, st.w), y:mjfR(st.h * .62, st.h), age:mjfR(0, 3), dur:mjfR(2.4, 3.6), m:mjfR(8, 18) * st.h / 250 }),
    step:(q, st, dt) => { q.age += dt; if (q.age > q.dur) Object.assign(q, MJF_KIND.ripples.make(st), { age:0 }); },
    draw:(g, q) => { const u = q.age / q.dur, a = (1 - u) * .4; for (let k = 0; k < 2; k++) { const r = q.m * (u + k * .25); if (r <= 0) continue; g.strokeStyle = `rgba(200,220,255,${(a * (1 - k * .4)).toFixed(3)})`; g.lineWidth = .8; g.beginPath(); g.ellipse(q.x, q.y, r, r * .28, 0, 0, 7); g.stroke(); } } },
  starfall:{ n:st => Math.max(12, st.w * st.h / 8000), make:(st, first) => ({ x:mjfR(st.w * .2, st.w * .8), y:first ? mjfR(0, st.h) : -10, v:mjfR(12, 26), p:mjfR(0, 9), s:mjfR(1.6, 3) }),
    step:(q, st, dt, t) => { q.y += q.v * dt; q.x += Math.sin(t + q.p) * 4 * dt; if (q.y > st.h * .85) Object.assign(q, MJF_KIND.starfall.make(st)); },
    draw:(g, q, st, t) => { const a = .6 + .4 * Math.sin(t * 3 + q.p); mjfGlow(g, q.x, q.y, q.s * 4, `rgba(255,214,120,${(a * .35).toFixed(3)})`); mjfSpark(g, q.x, q.y, q.s, `rgba(255,243,176,${a.toFixed(3)})`); } },
  dreamdust:{ n:st => st.w * st.h / 3500, make:(st, first) => ({ x:mjfR(0, st.w), y:first ? mjfR(0, st.h) : st.h + 4, v:mjfR(4, 9), p:mjfR(0, 9), r:mjfR(.6, 1.6), c:Math.random() < .5 ? '255,230,170' : '220,200,255' }),
    step:(q, st, dt, t) => { q.y -= q.v * dt; q.x += Math.sin(t * .6 + q.p) * 5 * dt; if (q.y < -4) Object.assign(q, MJF_KIND.dreamdust.make(st)); },
    draw:(g, q, st, t) => { const a = .3 + .5 * Math.abs(Math.sin(t + q.p)); mjfGlow(g, q.x, q.y, q.r * 4, `rgba(${q.c},${(a * .3).toFixed(3)})`); g.fillStyle = `rgba(${q.c},${a.toFixed(3)})`; g.beginPath(); g.arc(q.x, q.y, q.r * .7, 0, 7); g.fill(); } },
  // sương mù: vài dải mờ trôi chậm sát mặt đất và lưng chừng
  fog:{ n:() => 5, make:st => ({ x:mjfR(-st.w * .2, st.w * 1.2), y:st.h * mjfR(.55, .98), r:st.w * mjfR(.22, .42), v:mjfR(4, 10) * (Math.random() < .5 ? -1 : 1), p:mjfR(0, 9) }),
    step:(q, st, dt) => { q.x += q.v * dt * st.w / 700; if (q.x > st.w + q.r) q.x = -q.r; if (q.x < -q.r) q.x = st.w + q.r; },
    draw:(g, q, st, t) => { const a = .045 + .025 * Math.sin(t * .3 + q.p); g.save(); g.translate(q.x, q.y); g.scale(1, .22); mjfGlow(g, 0, 0, q.r, `rgba(170,190,230,${a.toFixed(3)})`); g.restore(); } },
  // hơi mưa bốc lên quanh đèn và cửa sổ: lớp mờ rất nhẹ phía trên
  haze:{ n:() => 3, make:st => ({ x:mjfR(0, st.w), y:st.h * mjfR(.1, .5), r:st.w * mjfR(.3, .5), v:mjfR(2, 5), p:mjfR(0, 9) }),
    step:(q, st, dt) => { q.x += q.v * dt * st.w / 700; if (q.x > st.w + q.r) q.x = -q.r; },
    draw:(g, q, st, t) => { g.save(); g.translate(q.x, q.y); g.scale(1, .35); mjfGlow(g, 0, 0, q.r, `rgba(150,170,215,${(.03 + .015 * Math.sin(t * .4 + q.p)).toFixed(3)})`); g.restore(); } },
  // tia sáng xiên chiếu xuống, khẽ đổi độ sáng và lệch chậm
  rays:{ n:() => 4, make:st => ({ x:mjfR(st.w * .15, st.w * .9), w:st.w * mjfR(.04, .09), p:mjfR(0, 9), sk:mjfR(.25, .4) }),
    step:() => {}, draw:(g, q, st, t) => { const a = .035 + .03 * Math.sin(t * .35 + q.p), dx = Math.sin(t * .08 + q.p) * st.w * .02, x = q.x + dx, gr = g.createLinearGradient(0, 0, 0, st.h);
      gr.addColorStop(0, `rgba(255,236,190,${a.toFixed(3)})`); gr.addColorStop(1, 'rgba(255,236,190,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + q.w, 0); g.lineTo(x + q.w + st.h * q.sk, st.h); g.lineTo(x + st.h * q.sk - q.w * .6, st.h); g.closePath(); g.fill(); } },
  // mây mỏng trôi ngang bầu trời, có lúc che bớt trăng
  clouds:{ over:true, n:() => 4, make:(st, first) => ({ x:first ? mjfR(0, st.w) : -st.w * .3, y:st.h * mjfR(.04, .36), r:st.w * mjfR(.12, .22), v:mjfR(5, 11), p:mjfR(0, 9) }),
    step:(q, st, dt) => { q.x += q.v * dt * st.w / 700; if (q.x > st.w + q.r * 1.6) Object.assign(q, MJF_KIND.clouds.make(st)); },
    draw:(g, q, st, t) => { g.save(); g.translate(q.x, q.y); g.scale(1.6, .42); for (let k = -1; k <= 1; k++) mjfGlow(g, k * q.r * .45, Math.abs(k) * q.r * .12, q.r * (1 - Math.abs(k) * .25), 'rgba(22,32,66,.55)'); g.restore(); } },
  // lá cây rơi chao nghiêng theo gió
  leaves:{ over:true, n:st => Math.max(6, st.w * st.h / 16000), make:(st, first) => ({ x:mjfR(-20, st.w), y:first ? mjfR(0, st.h) : -12, v:mjfR(14, 26), p:mjfR(0, 9), s:mjfR(2.6, 4.4) * st.h / 250, rot:mjfR(0, 6), c:Math.random() < .5 ? '#2f6e58' : '#1f4f45' }),
    step:(q, st, dt, t) => { q.y += q.v * dt; q.x += (Math.sin(t * 1.1 + q.p) * 22 + 12) * dt; q.rot += Math.sin(t + q.p) * 2.4 * dt; if (q.y > st.h + 10) Object.assign(q, MJF_KIND.leaves.make(st)); },
    draw:(g, q, st, t) => { g.save(); g.translate(q.x, q.y); g.rotate(q.rot); g.scale(1, .35 + .6 * Math.abs(Math.sin(t * 1.7 + q.p))); g.fillStyle = q.c; g.beginPath(); g.moveTo(-q.s, 0); g.quadraticCurveTo(0, -q.s * .7, q.s, 0); g.quadraticCurveTo(0, q.s * .7, -q.s, 0); g.fill(); g.restore(); } },
  // hạt bồ công anh bay lơ lửng
  seeds:{ n:st => Math.max(8, st.w * st.h / 12000), make:(st, first) => ({ x:first ? mjfR(0, st.w) : -8, y:mjfR(st.h * .2, st.h * .9), v:mjfR(8, 16), p:mjfR(0, 9), s:mjfR(1.6, 2.6) * st.h / 250 }),
    step:(q, st, dt, t) => { q.x += q.v * dt; q.y += Math.sin(t * .9 + q.p) * 8 * dt - 2 * dt; if (q.x > st.w + 8) Object.assign(q, MJF_KIND.seeds.make(st)); },
    draw:(g, q, st, t) => { g.strokeStyle = 'rgba(235,240,255,.5)'; g.lineWidth = .6; for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + t * .3; g.beginPath(); g.moveTo(q.x, q.y); g.lineTo(q.x + Math.cos(a) * q.s, q.y + Math.sin(a) * q.s); g.stroke(); } g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(q.x, q.y, .7, 0, 7); g.fill(); } },
  meteors:{ n:() => 1, make:st => mjfMeteor(st, mjfR(3, 7)), step:(q, st, dt) => mjfMeteorStep(q, st, dt, () => mjfR(4, 9)), draw:(g, q) => mjfMeteorDraw(g, q) },
  meteorshower:{ n:() => 7, make:st => mjfMeteor(st, mjfR(0, 4)), step:(q, st, dt) => mjfMeteorStep(q, st, dt, () => mjfR(.4, 2.6)), draw:(g, q) => mjfMeteorDraw(g, q) }
};
function mjfMeteor(st, wait){ const s = st.h / 250; return { wait, x:mjfR(st.w * .1, st.w * .9), y:mjfR(0, st.h * .3), vx:-mjfR(140, 220) * s, vy:mjfR(70, 110) * s, age:0, dur:mjfR(.7, 1.2), len:mjfR(40, 80) * s }; }
function mjfMeteorStep(q, st, dt, next){ if (q.wait > 0) { q.wait -= dt; return; } q.age += dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.age > q.dur) Object.assign(q, mjfMeteor(st, next())); }
function mjfMeteorDraw(g, q){
  if (q.wait > 0) return; const u = q.age / q.dur, a = Math.sin(Math.PI * Math.min(1, u)), n = Math.hypot(q.vx, q.vy), tx = q.x - q.vx / n * q.len, ty = q.y - q.vy / n * q.len;
  const gr = g.createLinearGradient(q.x, q.y, tx, ty); gr.addColorStop(0, `rgba(255,250,230,${a.toFixed(3)})`); gr.addColorStop(1, 'rgba(255,250,230,0)');
  g.strokeStyle = gr; g.lineWidth = 1.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(q.x, q.y); g.lineTo(tx, ty); g.stroke(); mjfGlow(g, q.x, q.y, 5, `rgba(255,240,200,${(a * .6).toFixed(3)})`);
}
function mjfGlow(g, x, y, r, col){ const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
function mjfSpark(g, x, y, s, col){ g.fillStyle = col; g.beginPath(); g.moveTo(x, y - s * 2); g.quadraticCurveTo(x, y, x + s * 2, y); g.quadraticCurveTo(x, y, x, y + s * 2); g.quadraticCurveTo(x, y, x - s * 2, y); g.quadraticCurveTo(x, y, x, y - s * 2); g.fill(); }

// ----- màn "mở trạm": vòng sáng loé ra và bụi sao bung, khoảng 2,4 giây -----
function mjfBurstInit(st, cx = .5, cy = .5, gold = true){
  const x = st.w * cx, y = st.h * cy, s = st.h / 250; st.burst = { x, y, age:0, dur:2.6, s, bits:[] };
  for (let i = 0; i < 46; i++) { const a = mjfR(0, Math.PI * 2), v = mjfR(30, 120) * s; st.burst.bits.push({ x, y, vx:Math.cos(a) * v, vy:Math.sin(a) * v - 20 * s, sz:mjfR(1.2, 2.8), c:gold ? (Math.random() < .5 ? '255,232,150' : '255,200,220') : '230,235,255' }); }
}
function mjfBurstDraw(g, st, dt){
  const b = st.burst; if (!b) return; b.age += dt; const u = b.age / b.dur; if (u >= 1) { st.burst = null; return; }
  const flash = Math.max(0, 1 - u * 2.4); if (flash > 0) { g.fillStyle = `rgba(255,236,190,${(flash * .28).toFixed(3)})`; g.fillRect(0, 0, st.w, st.h); }
  const r = Math.max(1, b.s * 200 * (1 - Math.pow(1 - Math.min(1, u * 1.4), 3))); g.strokeStyle = `rgba(255,226,150,${((1 - u) * .7).toFixed(3)})`; g.lineWidth = 2.2 * b.s * (1 - u) + .5; g.beginPath(); g.arc(b.x, b.y, r, 0, 7); g.stroke();
  mjfGlow(g, b.x, b.y, b.s * 90 * (.4 + u), `rgba(255,220,150,${((1 - u) * .45).toFixed(3)})`);
  for (const q of b.bits) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= .985; q.vy = q.vy * .985 + 14 * b.s * dt; mjfSpark(g, q.x, q.y, q.sz * (1 - u * .6), `rgba(${q.c},${(1 - u).toFixed(3)})`); }
}

// ----- màn lớn nhất: gặp lại Moon -----
function mjfFinaleInit(st){
  const s = st.h / 250, cx = st.w * .52, cy = st.h * .52; st.fin = { age:0, s, cx, cy, rise:[], petals:[], meteors:[mjfMeteor(st, 2.6), mjfMeteor(st, 3.8), mjfMeteor(st, 5.2)] };
  for (let i = 0; i < Math.max(26, st.w * st.h / 5000); i++) st.fin.rise.push({ x:mjfR(0, st.w), y:mjfR(st.h * .6, st.h * 1.3), v:mjfR(10, 24) * s, p:mjfR(0, 9), r:mjfR(1.2, 2.4) });
  for (let i = 0; i < 18; i++) st.fin.petals.push(MJF_KIND.petals.make(st, false)), st.fin.petals[i].y -= mjfR(0, st.h);
}
function mjfFinaleDraw(g, st, dt, t){
  const F = st.fin; if (!F) return; F.age += dt; const A = F.age, s = F.s;
  // ánh vàng ấm lan ra rồi thở nhẹ
  const glow = Math.min(1, A / 2.2) * (.75 + .25 * Math.sin(t * 1.1));
  mjfGlow(g, F.cx, F.cy + 40 * s, Math.max(1, (70 + 130 * Math.min(1, A / 3)) * s), `rgba(255,214,140,${(glow * .38).toFixed(3)})`);
  // sóng ánh sáng vàng lan nhẹ trên mặt đất từ chỗ cô bé ôm Moon ra xung quanh, vài giây một lần
  if (A > .6) for (let k = 0; k < 3; k++) { const u = ((A - .6) / 3.6 + k / 3) % 1, R = (12 + 180 * u) * s, a = (1 - u) * Math.min(1, (A - .6) / 1.2) * .24; if (a < .01) continue; g.strokeStyle = `rgba(255,222,150,${a.toFixed(3)})`; g.lineWidth = Math.max(.5, (3.2 - 2.4 * u) * s); g.beginPath(); g.ellipse(st.w * .515, st.h * .95, R, R * .32, 0, 0, Math.PI * 2); g.stroke(); }
  // đom đóm bay lên từ mặt đất
  if (A > 1.4) for (const q of F.rise) { q.y -= q.v * dt; q.x += Math.sin(t * .7 + q.p) * 8 * dt; if (q.y < -6) { q.y = st.h + mjfR(0, 30); q.x = mjfR(0, st.w); } const a = .4 + .6 * Math.pow(.5 + .5 * Math.sin(t * 1.8 + q.p * 2), 2); mjfGlow(g, q.x, q.y, q.r * 5, `rgba(255,228,140,${(a * .45).toFixed(3)})`); g.fillStyle = `rgba(255,248,210,${a.toFixed(3)})`; g.beginPath(); g.arc(q.x, q.y, q.r * .55, 0, 7); g.fill(); }
  // cánh hoa hồng rơi
  if (A > 2) for (const q of F.petals) { MJF_KIND.petals.step(q, st, dt, t); MJF_KIND.petals.draw(g, q, st, t); }
  // vài vệt sao băng
  for (const q of F.meteors) { mjfMeteorStep(q, st, dt, () => mjfR(5, 11)); mjfMeteorDraw(g, q); }
}

// ----- vòng lặp chung -----
function mjfSize(st){ const r = st.host.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1); st.w = Math.max(1, r.width); st.h = Math.max(1, r.height); st.cv.width = Math.round(st.w * d); st.cv.height = Math.round(st.h * d); st.ctx.setTransform(d, 0, 0, d, 0, 0); }
function mjfFill(st){ st.parts = []; for (const k of st.kinds) { const K = MJF_KIND[k]; if (!K) continue; const n = Math.round(K.n(st)); for (let i = 0; i < n; i++) st.parts.push([K, K.make(st, true)]); } }
function mjfFrame(st, dt, t){
  const g = st.ctx; g.clearRect(0, 0, st.w, st.h);
  // lớp tối (mây, lá) vẽ thường trước, lớp sáng cộng màu sau
  g.globalCompositeOperation = 'source-over'; for (const [K, q] of st.parts) if (K.over) { if (dt) K.step(q, st, dt, t); K.draw(g, q, st, t); }
  g.globalCompositeOperation = 'lighter'; for (const [K, q] of st.parts) if (!K.over) { if (dt) K.step(q, st, dt, t); K.draw(g, q, st, t); }
  if (st.fin) mjfFinaleDraw(g, st, dt, t);
  g.globalCompositeOperation = 'source-over'; if (st.burst) mjfBurstDraw(g, st, dt);
}
function mjfLoop(now){
  MJF.raf = 0; const dt = Math.min(.05, MJF.last ? (now - MJF.last) / 1000 : .016); MJF.last = now; let any = false;
  for (const st of MJF.list) {
    if (!st.host.isConnected) { MJF.list.delete(st); mjfIO && mjfIO.unobserve(st.host); continue; }
    if (!st.vis || document.hidden) continue; any = true; st.t += dt; mjfFrame(st, dt, st.t);
  }
  if (any) MJF.raf = requestAnimationFrame(mjfLoop); else MJF.last = 0;
}
function mjfKick(){ if (!MJF.raf && !mjfReduced() && MJF.list.size) MJF.raf = requestAnimationFrame(mjfLoop); }
function mjfAttach(host){
  if (host._mjf) return; const cv = document.createElement('canvas'); cv.className = 'mj-rainfx mj-fx'; cv.setAttribute('aria-hidden', 'true'); host.appendChild(cv);
  const kinds = (host.dataset.mjfx || '').split(',').filter(Boolean), st = { host, cv, ctx:cv.getContext('2d'), kinds:kinds.filter(k => k !== 'finale'), parts:[], w:0, h:0, vis:true, t:Math.random() * 50 };
  host._mjf = st; MJF.list.add(st); mjfSize(st); mjfFill(st);
  const still = mjfReduced();
  if (kinds.includes('finale')) { mjfFinaleInit(st); if (still) st.fin.age = 6; }
  if (host.dataset.mjburst && !still) mjfBurstInit(st, .5, .5);
  mjfIO && mjfIO.observe(host);
  if (still) mjfFrame(st, 0, st.t); else mjfKick();
}
function mjfScan(){ document.querySelectorAll('[data-mjfx],[data-mjburst]').forEach(mjfAttach); }
new MutationObserver(() => mjfScan()).observe(document.documentElement, { childList:true, subtree:true });
document.addEventListener('visibilitychange', mjfKick);
window.addEventListener('resize', () => MJF.list.forEach(st => { mjfSize(st); if (mjfReduced()) mjfFrame(st, 0, st.t); }));
