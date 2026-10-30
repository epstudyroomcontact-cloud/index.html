/* Lời chào lần đầu (gọi từ boot() trong core.js):
   1) Khách mới (chưa chọn ngôn ngữ, chưa xem hướng dẫn) được hỏi dùng ngôn ngữ nào; chọn xong hướng dẫn mới chạy.
   2) Máy đang tắt animation (Windows: Hiệu ứng hoạt hình / Animation effects tắt, iPhone: Giảm chuyển động) thì web tự giữ yên mọi hiệu ứng
      và khách không biết là có. Báo một lần và cho bật lại (store 'motion' = 'on'; html[data-motion="on"] gỡ các luật prefers-reduced-motion trong app.css).
   Chữ nằm ngay trong file này (8 tiếng) vì lúc khách chưa chọn ngôn ngữ thì gói dịch chưa chắc đã có. */
const WEL_T = {
  en:{ motion:"Your device has animations turned off, so the sky, rain and cursor effects are paused. Want to see them?", on:"Turn on effects", keep:"Keep them off", chk:"Show effects even if my device reduces motion" },
  vi:{ motion:"Máy bạn đang tắt hiệu ứng chuyển động nên bầu trời, mưa và con trỏ đang đứng yên. Bạn có muốn bật lên xem không?", on:"Bật hiệu ứng", keep:"Giữ nguyên", chk:"Vẫn hiện hiệu ứng dù máy đã giảm chuyển động" },
  hi:{ motion:"आपके डिवाइस में एनिमेशन बंद हैं, इसलिए आसमान, बारिश और कर्सर के इफ़ेक्ट रुके हुए हैं। क्या आप उन्हें देखना चाहेंगे?", on:"इफ़ेक्ट चालू करें", keep:"बंद रहने दें", chk:"डिवाइस में मोशन कम होने पर भी इफ़ेक्ट दिखाएँ" },
  ja:{ motion:"お使いの端末ではアニメーションがオフになっているため、空や雨、カーソルの演出が止まっています。表示しますか？", on:"演出をオンにする", keep:"オフのままにする", chk:"端末が動きを減らす設定でも演出を表示する" },
  ko:{ motion:"기기에서 애니메이션이 꺼져 있어 하늘, 비, 커서 효과가 멈춰 있어요. 켜서 볼까요?", on:"효과 켜기", keep:"그대로 두기", chk:"기기가 동작 줄이기여도 효과 표시" },
  zh:{ motion:"你的设备关闭了动画效果，所以星空、雨和光标特效处于暂停状态。要打开看看吗？", on:"打开特效", keep:"保持关闭", chk:"即使设备已减少动态效果也显示特效" },
  fr:{ motion:"Les animations sont désactivées sur votre appareil : le ciel, la pluie et le curseur restent immobiles. Voulez-vous les voir ?", on:"Activer les effets", keep:"Laisser désactivé", chk:"Afficher les effets même si l'appareil réduit les animations" },
  es:{ motion:"Tu dispositivo tiene las animaciones desactivadas, así que el cielo, la lluvia y el cursor están quietos. ¿Quieres verlos?", on:"Activar efectos", keep:"Dejar desactivados", chk:"Mostrar efectos aunque el dispositivo reduzca el movimiento" }
};
const welT = k => (WEL_T[state.lang] || WEL_T.en)[k] || WEL_T.en[k];
const welDeviceCalm = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const tourAuto = () => loadGuide().then(() => typeof EPTour !== 'undefined' && EPTour.auto()).catch(() => {});

function langAsk(){
  if (store.get('lang', null) !== null || store.get('tour', null) !== null || store.get('lang_asked', 0) || $('lang-ask')) return;
  const nav = String(navigator.language || '').slice(0, 2).toLowerCase(), guess = LANG_LIST.some(l => l[0] === nav) ? nav : 'en';
  const d = document.createElement('div'); d.id = 'lang-ask'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', 'Language');
  d.innerHTML = `<div class="la-card"><h2>Choose your language · Chọn ngôn ngữ</h2><div class="la-grid">${LANG_LIST.map(([v, n]) => `<button type="button" class="la-btn${v === guess ? ' on' : ''}" data-lang="${v}" lang="${v}">${esc(n)}</button>`).join('')}</div></div>`;
  const done = code => {
    store.set('lang_asked', 1); d.remove(); window.removeEventListener('keydown', onKey, true);
    if (code) { const sel = $('sel-lang'); sel.value = code; sel.dispatchEvent(new Event('change')); }   // đi đúng đường của ô chọn ở ⚙️ (lưu, tải gói ngôn ngữ, vẽ lại)
    setTimeout(() => { if (store.get('tour', null) === null) tourAuto(); }, 700);
  };
  const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); done(''); } };
  d.addEventListener('click', e => { const b = e.target.closest('[data-lang]'); if (b) done(b.dataset.lang); else if (e.target === d) done(''); });
  window.addEventListener('keydown', onKey, true);
  document.body.appendChild(d);
  const f = d.querySelector('.la-btn.on'); if (f) f.focus({ preventScroll:true });
}

let motionTries = 0;
function motionNote(){
  if (!welDeviceCalm() || state.calm || state.motion !== null || store.get('motion_note', 0) || $('motion-note')) return;
  if (store.get('tour', null) === null || $('tour-card') || $('tour-ask') || $('lang-ask')) { if (motionTries++ < 8) setTimeout(motionNote, 7000); return; }   // không chen vào lúc đang chào hay đang hướng dẫn
  const d = document.createElement('div'); d.id = 'motion-note'; d.setAttribute('role', 'status');
  d.innerHTML = `<p>${esc(welT('motion'))}</p><div class="row"><button type="button" class="btn ghost sm" data-m="keep">${esc(welT('keep'))}</button><button type="button" class="btn primary sm" data-m="on">${esc(welT('on'))}</button></div>`;
  d.addEventListener('click', e => {
    const b = e.target.closest('[data-m]'); if (!b) return;
    store.set('motion_note', 1); d.remove();
    if (b.dataset.m === 'on') setMotion('on');
  });
  document.body.appendChild(d);
}
function setMotion(v){ state.motion = v; store.set('motion', v); applyLook(); const c = $('chk-motion'); if (c) c.checked = v === 'on'; render(true); }

function motionRow(){   // dòng trong ⚙️: chỉ hiện khi máy thật sự đang giảm chuyển động
  const r = $('row-motion'); if (!r) return;
  r.classList.toggle('hidden', !welDeviceCalm());
  const l = $('lbl-motion'); if (l) l.textContent = welT('chk');
  const c = $('chk-motion'); if (c) c.checked = state.motion === 'on';
}
function welcomeInit(){
  const c = $('chk-motion'); if (c && !c._wel) { c._wel = 1; c.addEventListener('change', e => setMotion(e.target.checked ? 'on' : null)); }
  motionRow(); langAsk(); setTimeout(motionNote, 6000);
}
