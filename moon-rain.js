/* =========================================================
   MƯA THẬT CHO HÀNH TRÌNH TRĂNG (vẽ bằng canvas, đè lên tranh)
   - Tranh mưa: <div class="mj-art" data-mjrain="0.82"> (số là vị trí mặt đất, tính theo chiều cao tranh).
   - Bản đồ: <div class="mj-frame" data-mjrain="map">.
   - Ba lớp mưa theo độ xa: xa thì mảnh, chậm, mờ; gần thì dài và rõ hơn. Mưa rơi chậm cho êm. Mỗi hạt có tốc độ riêng,
     gió đổi nhẹ theo thời gian nên không lặp lại. Hạt chạm đất để lại vòng gợn nước và vài giọt bắn.
   - Máy bật "giảm chuyển động" thì chỉ vẽ một khung đứng yên. Tranh nằm ngoài màn hình thì dừng vẽ.
   ========================================================= */
const MJR = { list:new Set(), raf:0, last:0, t:Math.random() * 100 };
const mjrReduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const mjrIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => { es.forEach(e => { const st = e.target._mjr; if (st) st.vis = e.isIntersecting; }); mjrKick(); }) : null;
const mjrRO = 'ResizeObserver' in window ? new ResizeObserver(es => es.forEach(e => { const st = e.target._mjr; if (st) { mjrSize(st); if (mjrReduced()) mjrStill(st); } })) : null;
const MJR_LAYERS = [{ z:.38, k:.42 }, { z:.68, k:.36 }, { z:1, k:.22 }];

function mjrWind(t){ return .2 + .07 * Math.sin(t * .31) + .045 * Math.sin(t * 1.13 + 1.7) + .02 * Math.sin(t * 2.9); }
function mjrSize(st){
  const r = st.host.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
  st.w = Math.max(1, r.width); st.h = Math.max(1, r.height); st.cv.width = Math.round(st.w * d); st.cv.height = Math.round(st.h * d); st.ctx.setTransform(d, 0, 0, d, 0, 0);
  const want = Math.min(280, Math.round(st.w * st.h / 1000));
  while (st.drops.length < want) st.drops.push(mjrDrop(st, true));
  st.drops.length = want;
}
// một hạt mưa mới; first: rải khắp khung lúc mới gắn
function mjrDrop(st, first){
  const u = Math.random(); let acc = 0, L = MJR_LAYERS[2]; for (const l of MJR_LAYERS) { acc += l.k; if (u <= acc) { L = l; break; } }
  const z = L.z * (.9 + Math.random() * .2), v = st.h * (.42 + z * .95) * (.85 + Math.random() * .3);   // mưa rơi chậm, êm
  const end = st.map ? (z > .6 ? st.h * (.08 + Math.random() * .92) : st.h * 1.2)
    : z > .6 ? st.h * (st.gy + (1 - st.gy) * Math.min(1, (z - .5) * 1.6) * Math.random() + .01) : st.h * (st.gy - .03 + Math.random() * .06);
  const y = first ? Math.random() * end : -Math.random() * st.h * .5 - 10;
  return { x:Math.random() * (st.w + st.h * .4) - st.h * .2, y, z, v, end, len:v * (.05 + Math.random() * .02) };
}
function mjrSplash(st, d){
  const s = st.h / 250;
  st.rip.push({ x:d.x, y:d.end, r:0, max:(1.6 + d.z * 3.6) * s * (.8 + Math.random() * .5), age:0, dur:.8 + Math.random() * .5, z:d.z });
  if (d.z > .8 && Math.random() < .6) for (let i = 0; i < 2; i++) st.bits.push({ x:d.x, y:d.end, vx:(Math.random() - .5) * 40 * s, vy:-(18 + Math.random() * 26) * s, age:0, dur:.28 + Math.random() * .12 });
}
function mjrStep(st, dt, t){
  const wind = mjrWind(t);
  for (let i = 0; i < st.drops.length; i++) {
    const d = st.drops[i]; d.y += d.v * dt; d.x += d.v * dt * wind * (.75 + d.z * .35);
    if (d.y >= d.end) { if (d.end < st.h) mjrSplash(st, d); st.drops[i] = mjrDrop(st); }
  }
  st.rip = st.rip.filter(r => (r.age += dt) < r.dur); st.rip.forEach(r => { r.r = r.max * (1 - Math.pow(1 - r.age / r.dur, 2.2)); });
  st.bits = st.bits.filter(b => (b.age += dt) < b.dur); st.bits.forEach(b => { b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 160 * (st.h / 250) * dt; });
  st.wind = wind;
}
function mjrDraw(st){
  const g = st.ctx, wind = st.wind ?? mjrWind(MJR.t); g.clearRect(0, 0, st.w, st.h); g.lineCap = 'round';
  MJR_LAYERS.forEach((L, li) => {
    g.beginPath();
    for (const d of st.drops) { if ((li === 0 && d.z > .53) || (li === 1 && (d.z <= .53 || d.z > .84)) || (li === 2 && d.z <= .84)) continue; const dx = d.len * wind * (.75 + d.z * .35); g.moveTo(d.x, d.y); g.lineTo(d.x - dx, d.y - d.len); }
    g.strokeStyle = li === 2 ? 'rgba(225,235,255,.42)' : li === 1 ? 'rgba(196,214,250,.3)' : 'rgba(170,192,240,.2)'; g.lineWidth = li === 2 ? 1.15 : li === 1 ? .8 : .55; g.stroke();
  });
  for (const r of st.rip) { const a = (1 - r.age / r.dur) * (.25 + r.z * .35); g.beginPath(); g.ellipse(r.x, r.y, r.r, r.r * .3, 0, 0, Math.PI * 2); g.strokeStyle = `rgba(215,228,255,${a.toFixed(3)})`; g.lineWidth = .7; g.stroke(); }
  g.fillStyle = 'rgba(225,235,255,.55)'; for (const b of st.bits) { g.beginPath(); g.arc(b.x, b.y, .7, 0, Math.PI * 2); g.fill(); }
}
// khung đứng yên cho máy giảm chuyển động: hạt rải sẵn, vài vòng gợn
function mjrStill(st){ st.rip = []; st.bits = []; st.drops.forEach(d => { if (d.z > .6 && Math.random() < .25) { const r = { x:d.x, y:d.end, max:(1.6 + d.z * 3.6) * st.h / 250, age:.2, dur:.6, z:d.z }; r.r = r.max * .7; st.rip.push(r); } }); mjrDraw(st); }
function mjrLoop(now){
  MJR.raf = 0; const dt = Math.min(.05, MJR.last ? (now - MJR.last) / 1000 : .016); MJR.last = now; MJR.t += dt;
  let any = false;
  for (const st of MJR.list) {
    if (!st.host.isConnected) { MJR.list.delete(st); mjrIO && mjrIO.unobserve(st.host); mjrRO && mjrRO.unobserve(st.host); continue; }
    if (!st.vis || document.hidden) continue; any = true; mjrStep(st, dt, MJR.t); mjrDraw(st);
  }
  if (any) MJR.raf = requestAnimationFrame(mjrLoop); else MJR.last = 0;
}
function mjrKick(){ if (!MJR.raf && !mjrReduced() && MJR.list.size) MJR.raf = requestAnimationFrame(mjrLoop); }
function mjrAttach(host){
  if (host._mjr) return; const v = host.dataset.mjrain, cv = document.createElement('canvas');
  cv.className = 'mj-rainfx'; cv.setAttribute('aria-hidden', 'true'); host.appendChild(cv);
  const st = { host, cv, ctx:cv.getContext('2d'), map:v === 'map', gy:+v || .8, drops:[], rip:[], bits:[], w:0, h:0, vis:true };
  host._mjr = st; MJR.list.add(st); mjrSize(st);
  mjrIO && mjrIO.observe(host); mjrRO && mjrRO.observe(host);
  if (mjrReduced()) mjrStill(st); else mjrKick();
}
function mjrScan(){ document.querySelectorAll('[data-mjrain]').forEach(mjrAttach); }
new MutationObserver(() => mjrScan()).observe(document.documentElement, { childList:true, subtree:true });
document.addEventListener('visibilitychange', mjrKick);
