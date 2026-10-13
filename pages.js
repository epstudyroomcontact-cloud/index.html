'use strict';
/* =========================================================
   PAGES — Tổng quan, Lịch, Xem live, Phòng tập trung, Blog, Shop + giỏ hàng, Giới thiệu, Tài khoản
   ========================================================= */
const page = html => { $('page').innerHTML = html; };
const fmtDate = ts => DT.fromMillis(tsMs(ts)).setLocale(state.lang).toLocaleString(DT.DATE_MED);
const stars = n => `<span class="stars" aria-label="${n}/5">${[1,2,3,4,5].map(i => `<svg class="ic ${i <= n ? '' : 'off'}"><use href="#i-star"/></svg>`).join('')}</span>`;
const emptyBox = (icon, title, sub) => `<div class="empty"><div class="ico">${ic(icon, 'lg')}</div><h3>${esc(title)}</h3><p>${esc(sub || '')}</p></div>`;
/* tranh: ảnh do admin đặt (cimg) hoặc tranh vẽ sẵn bằng paint(cảnh, {crop, seed}) */
const artOr = (key, scene, opt) => { const u = cimg(key); return u ? `<img class="art" alt="" src="${esc(u)}">` : paint(scene, opt); };
const head = (titleKey, subKey, right = '', scene = 'moonwalk', seed = 1) => `<section class="art-head" data-cms-img="banner_${titleKey}">${artOr('banner_' + titleKey, scene, { crop:'banner', seed })}<div class="glass"><h1 ${cms(titleKey)}>${esc(ctext(titleKey))}</h1>${subKey ? `<p ${cms(subKey)}>${esc(ctext(subKey))}</p>` : ''}</div></section>${right ? `<div class="row between" style="margin-bottom:18px">${right}</div>` : ''}`;
const labelOf = s => s.type === 'focus' ? `${t('focus')} ${s.n}` : s.type === 'short' ? t('short_break') : t('long_break');
const segBar = (segs, total) => `<div class="pomo-bar">${segs.map(s => `<i class="${s.type[0]}" style="width:${(s.min / total * 100).toFixed(2)}%" title="${esc(labelOf(s))} · ${s.min}′"></i>`).join('')}</div>`;
const expanded = new Set();

/* =========================================================
   SCHEDULE blocks
   ========================================================= */
// dòng tóm tắt một buổi: dãy tuỳ chỉnh, mẫu Pomodoro, hoặc số giờ
function slotChip(s, mins){
  const segs = slotSegs(s);
  if (s.plan && s.plan.length) { const f = segs.filter(g => g.type === 'focus'), fm = f.reduce((a, g) => a + g.min, 0), tot = planMins(segs); return t('plan_chip', { n:f.length, f:fm, b:tot - fm }); }
  if (s.pomo) return t('pomo_chip', { n:s.pomo.rounds, f:s.pomo.focus, s:s.pomo.short, l:s.pomo.long });
  return t('session_h', { h:+(mins / 60).toFixed(2) });
}
function slotCard(x){
  const s = x.slot, su = x.start.setZone(userTZ), eu = x.end.setZone(userTZ), nowMs = Date.now();
  const live = !x.cancelled && nowMs >= x.start.toMillis() && nowMs < x.end.toMillis();
  const dayVN = weekStart(x.off).plus({ days:x.di });
  const diff = Math.round(DT.fromISO(su.toISODate()).diff(DT.fromISO(dayVN.toISODate()), 'days').days);
  const mark = diff ? `<span class="daymark" title="${esc(t(diff > 0 ? 'next_day' : 'prev_day'))}">${diff > 0 ? '+' : '−'}1d</span>` : '';
  let bar = '', plan = '', toggle = '';
  const segs = slotSegs(s);
  if (segs) {
    const total = planMins(segs); let cur = su;
    bar = segBar(segs, total);
    plan = `<ol class="plan ${expanded.has(x.key) ? 'open' : ''}">` + segs.map(g => { const a = cur; cur = cur.plus({ minutes:g.min }); return `<li><i style="background:var(--seg-${g.type === 'focus' ? 'focus' : g.type})"></i><span>${a.toFormat('HH:mm')}</span><span>${esc(labelOf(g))}</span><span>${g.min}′</span></li>`; }).join('') + `<li><i></i><span></span><span class="faint">${esc(t('total_min', { m:total }))}</span><span></span></li></ol>`;
    toggle = `<button type="button" class="plan-toggle" data-act="plan" data-k="${x.key}">${esc(expanded.has(x.key) ? t('hide_plan') : t('show_plan'))}</button>`;
  }
  const chip = `<div class="pomo-chip">${esc(slotChip(s, x.mins))}</div>`;
  const reason = s.cancelled && L(s.cancelNote) ? ': ' + esc(L(s.cancelNote)) : '';
  const url = watchUrl();
  return `<div class="slot ${live ? 'is-live' : ''} ${x.cancelled ? 'is-cancel' : ''}">
    <div class="slot-top"><span class="s-time">${su.toFormat('HH:mm')} – ${eu.toFormat('HH:mm')}</span>${mark}${live ? `<span class="badge live">${esc(t('live_now'))}</span>` : ''}</div>
    ${s.title ? `<div class="s-title">${esc(s.title)}</div>` : ''}${bar}${chip}${plan}${toggle}
    ${live && url ? `<a class="btn primary sm mt-s" style="width:100%" href="#/watch">${ic('play', 'sm')} ${esc(t('watch'))}</a>` : ''}
    ${s.cancelled ? `<div class="ribbon">${esc(t('cancelled'))}${reason}</div>` : ''}</div>`;
}
const legendHTML = () => `<div class="legend"><span><i style="background:var(--seg-focus)"></i>${esc(t('focus'))}</span><span><i style="background:var(--seg-short)"></i>${esc(t('short_break'))}</span><span><i style="background:var(--seg-long)"></i>${esc(t('long_break'))}</span></div>`;

PAGES.schedule = function(){
  const ws = weekStart(weekOffset), we = ws.plus({ days:6 }), items = getItems(weekOffset, weekDocs[weekOffset]), todayVN = DT.now().setZone(VN).toISODate();
  let rows = '';
  for (let i = 0; i < 7; i++) {
    const dayVN = ws.plus({ days:i }), day = normDay((weekDocs[weekOffset] || [])[i]), its = items.filter(x => x.di === i);
    const isToday = dayVN.toISODate() === todayVN;
    rows += `<div class="arow ${isToday ? 'today' : ''} ${day.cancelled ? 'is-off' : ''}">
      <div class="a-day"><b>${esc((DAYS[state.lang] || DAYS.en)[i])}</b><span>${dayVN.toFormat('dd/MM')}</span>${isToday ? `<span class="badge">${esc(t('today'))}</span>` : ''}</div>
      ${its.length || day.cancelled ? `<div class="a-slots">${day.cancelled ? `<div class="a-off">${esc(t('day_off'))}${L(day.cancelNote) ? ' — ' + esc(L(day.cancelNote)) : ''}</div>` : ''}${its.map(slotCard).join('')}</div>` : `<div class="a-none">${esc(t('rest'))}</div>`}</div>`;
  }
  page(`${head('sch_title', 'sch_sub', `<div class="week-nav"><button class="btn secondary icon" data-act="week" data-d="-1" aria-label="prev">${ic('chev-l')}</button><span class="lbl">${ws.toFormat('dd/MM')} – ${we.toFormat('dd/MM')}</span><button class="btn secondary icon" data-act="week" data-d="1" aria-label="next">${ic('chev-r')}</button></div>`, 'curl', 2)}
    <div class="row between" style="margin-bottom:16px">${legendHTML()}<span class="small faint mono">${esc(t('tz_label'))}: ${esc(userTZ)}</span></div>
    <div class="agenda">${rows}</div>`);
};
function changeWeek(d){ weekOffset += d; listenWeeks(); render(true); }

/* =========================================================
   HOME / OVERVIEW
   ========================================================= */
function todayItems(){
  const now = DT.now().setZone(userTZ);
  return poolAll().filter(x => x.start.setZone(userTZ).hasSame(now, 'day')).sort((a, b) => a.start - b.start);
}
function focusToday(){ const d = localFocus()[DT.now().setZone(userTZ).toISODate()]; return d ? d.m : 0; }
const ratingAvg = () => reviews.length ? (reviews.reduce((a, r) => a + (+r.rating || 0), 0) / reviews.length) : 0;
function secHead(titleKey, href){ return `<div class="card-h" style="margin:34px 0 14px"><h2 style="font-size:1.2rem" ${cms(titleKey)}>${esc(ctext(titleKey))}</h2>${href ? `<a class="link" href="${href}">${esc(t('view_all'))} ${ic('arrow', 'sm')}</a>` : ''}</div>`; }
function blogCard(p){
  return `<a class="pcard" href="#/blog/${encodeURIComponent(p.slug || p.id)}"><div class="cv">${p.cover ? `<img loading="lazy" alt="" src="${esc(p.cover)}">` : paintFor(p.slug || p.id, { lite:true })}</div>
    <div class="bd"><div class="meta"><span>${esc(fmtDate(p.createdAt))}</span><span>${esc(t('min_read', { m:postMins(p) }))}</span></div><h3>${esc(L(p.title))}</h3><p>${esc(L(p.excerpt))}</p>
    <div class="tags">${p.pinned ? `<span class="badge">${ic('star', 'sm')} ${esc(t('featured'))}</span>` : ''}${p.category ? `<span class="badge muted">${esc(catLabel(p.category))}</span>` : ''}</div></div></a>`;
}
function reviewCard(r){ return `<div class="card review"><div class="row between">${stars(+r.rating || 5)}<span class="small faint">${esc(fmtDate(r.createdAt))}</span></div><p>${esc(r.text)}</p><div class="row between"><b class="small">${esc(r.name || '—')}</b>${state.isAdmin ? `<button type="button" class="btn danger sm" data-act="reviewDelPublic" data-id="${esc(r.id)}">${ic('trash', 'sm')} Xoá</button>` : ''}</div></div>`; }
function challengeCard(){
  return `<section class="card pad" style="margin-top:34px"><div class="grid g2" style="align-items:center"><div><span class="badge">${ic('check', 'sm')} 30 days</span><h2 style="font-size:1.5rem;margin:10px 0 6px" ${cms('ch_title')}>${esc(ctext('ch_title'))}</h2><p class="muted" ${cms('ch_desc')}>${esc(ctext('ch_desc'))}</p></div>
    <form class="stack" data-form="challenge"><input class="input" id="ch-name" placeholder="${esc(t('ch_name'))}" required maxlength="60" value="${esc(state.user ? displayName() : '')}"><input class="input" id="ch-email" type="email" placeholder="${esc(t('ch_email'))}" required maxlength="160" value="${esc(state.user ? state.user.email : '')}"><button class="btn primary" type="submit" id="ch-btn">${esc(t('ch_btn'))}</button></form></div></section>`;
}
PAGES.home = function(){
  const hs = branding.homeSections || {}, on = k => hs[k] !== false, nowUser = DT.now().setZone(userTZ), hr = nowUser.hour;
  const hello = t(hr < 12 ? 'hello_m' : hr < 18 ? 'hello_a' : 'hello_e') + (state.user ? ', ' + displayName() : '');
  const wk = getItems(0, weekDocs[0]).filter(x => !x.cancelled), hours = wk.reduce((a, x) => a + x.mins, 0) / 60, fm = focusToday(), avg = ratingAvg(), tItems = todayItems();
  const heroImg = cimg('hero_img') || branding.mascotUrl;
  let html = '';
  if (on('hero')) html += `<section class="hero" data-cms-img="hero_img">${heroImg ? `<img class="art" alt="" src="${esc(heroImg)}">` : paint('moonwalk', { crop:'full', seed:1 })}<div class="hero-copy">
      <span class="badge">${esc(hello)}</span>
      <h1 ${cms('home_title')}>${esc(ctext('home_title'))}</h1>
      <p class="lead" ${cms('home_sub')}>${esc(ctext('home_sub'))}</p>
      <div class="cta"><a class="btn primary lg" href="#/watch">${ic('play', 'sm')} ${esc(t('btn_watch_live'))}</a><a class="btn secondary lg" href="#/schedule">${ic('calendar', 'sm')} ${esc(t('btn_see_schedule'))}</a></div>
      <div class="clock mt" data-clock>--:--:--</div></div>
      <div class="next-card" id="next-card"><span class="live-pill" style="padding:5px 8px"><i></i></span><div><small></small><b>—</b></div></div></section>`;
  if (on('stats')) html += `<div class="grid g4 keep2 mt">
      <div class="card tile"><span class="t-ic">${ic('calendar')}</span><span class="t-l">${esc(t('stat_lives'))}</span><span class="t-v">${wk.length}</span></div>
      <div class="card tile"><span class="t-ic">${ic('timer')}</span><span class="t-l">${esc(t('stat_hours'))}</span><span class="t-v">${+hours.toFixed(1)}<small style="font-size:.9rem;font-weight:600"> ${esc(t('h'))}</small></span></div>
      <div class="card tile"><span class="t-ic">${ic('check')}</span><span class="t-l">${esc(t('stat_focus_today'))}</span><span class="t-v">${fm}<small style="font-size:.9rem;font-weight:600"> ${esc(t('min'))}</small></span></div>
      <div class="card tile"><span class="t-ic">${ic('star')}</span><span class="t-l">${esc(t('stat_rating'))}</span><span class="t-v">${avg ? avg.toFixed(1) : '—'}</span><span class="t-s">${reviews.length ? reviews.length + ' ' + esc(t('reviews_title')).toLowerCase() : ''}</span></div></div>`;
  if (on('today')) {
    const v0 = videos[0];
    html += `<div class="grid g-main mt">
      <section class="card pad"><div class="card-h"><h2 ${cms('sec_today')}>${esc(ctext('sec_today'))}</h2><a class="link" href="#/schedule">${esc(t('nav_schedule'))} ${ic('arrow', 'sm')}</a></div>
        ${tItems.length ? tItems.map(x => { const su = x.start.setZone(userTZ), eu = x.end.setZone(userTZ), live = !x.cancelled && Date.now() >= x.start.toMillis() && Date.now() < x.end.toMillis();
          return `<div class="today-item ${live ? 'live' : ''} ${x.cancelled ? 'off' : ''}"><span class="tm">${su.toFormat('HH:mm')} – ${eu.toFormat('HH:mm')}</span><div style="flex:1;min-width:0">${x.slot.title ? `<div style="font-weight:600;font-size:.9rem">${esc(x.slot.title)}</div>` : ''}<div class="pomo-chip">${esc(slotChip(x.slot, x.mins))}</div></div>${live ? `<span class="badge live">${esc(t('live_now'))}</span>` : x.cancelled ? `<span class="badge danger">${esc(t('cancelled'))}</span>` : ''}</div>`; }).join('') : emptyBox('calendar', t('nothing_today'), '')}</section>
      <div class="stack">
        <section class="card pad"><div class="card-h"><h2>${esc(t('nav_focus'))}</h2><span class="badge" data-pomo-mode>${esc(t('mode_focus'))}</span></div>
          <div class="mono" style="font-size:2.6rem;font-weight:700;letter-spacing:-.04em" data-pomo-time>25:00</div><a class="btn primary mt-s" href="#/focus">${ic('timer', 'sm')} ${esc(t('btn_start_focus'))}</a></section>
        ${v0 ? `<a class="card vcard" href="#/watch" data-act="playVideo" data-id="${esc(v0.id)}" style="padding:12px"><div class="th"><img loading="lazy" alt="" src="https://i.ytimg.com/vi/${esc(v0.id)}/hqdefault.jpg"></div><h4>${esc(v0.title || t('latest_videos'))}</h4></a>` : ''}
      </div></div>`;
  }
  if (on('blog') && livePosts().length) html += secHead('sec_blog', '#/blog') + `<div class="pgrid">${livePosts().slice(0, 3).map(blogCard).join('')}</div>`;
  if (on('shop') && products.length) html += secHead('sec_shop', '#/shop') + `<div class="pgrid">${products.slice(0, 3).map(prodCard).join('')}</div>`;
  if (on('reviews') && reviews.length) html += secHead('sec_reviews', '#/about') + `<div class="grid g3">${reviews.slice(0, 3).map(reviewCard).join('')}</div>`;
  if (on('thanks') && thanksList().length) html += thanksCard();
  if (on('challenge')) html += clubPromo();
  page(html);
};

/* =========================================================
   WATCH
   ========================================================= */
let playingId = null;
const liveEmbedSrc = () => branding.ytLiveId ? `https://www.youtube.com/embed/${youTubeId(branding.ytLiveId)}?rel=0` : (branding.ytChannelId ? `https://www.youtube.com/embed/live_stream?channel=${encodeURIComponent(branding.ytChannelId)}` : '');
PAGES.watch = function(){
  const liveSrc = liveEmbedSrc();
  const src = playingId ? `https://www.youtube-nocookie.com/embed/${playingId}?autoplay=1&rel=0` : liveSrc, { live, next } = liveState(), url = watchUrl();
  page(`${head('watch_title', 'watch_sub', url ? `<a class="btn secondary" target="_blank" rel="noopener" href="${esc(url)}">${ic('link', 'sm')} ${esc(t('open_youtube'))}</a>` : '', 'gaze', 5)}
    <div class="grid g-main"><div class="player">${src ? `<iframe src="${esc(src)}" title="YouTube" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin"></iframe>` : `<div class="ph">${paint('gaze', { crop:'banner', seed:4 })}<div class="glass" style="position:relative"><h3 style="margin-bottom:4px">${esc(t('offline'))}</h3><p class="muted small">${esc(t('offline_sub'))}</p></div></div>`}</div>
      <aside class="card pad stack"><div class="row between"><b>${esc(live ? t('live_now') : t('nav_schedule'))}</b>${live ? `<span class="badge live">LIVE</span>` : ''}</div>
        <div class="card pad" style="background:var(--surface2)"><div class="small muted">${esc(live ? t('live_now') : next ? t('next_live') : t('no_next'))}</div><div class="mono" id="next-card-w" style="font-size:1.5rem;font-weight:700;color:var(--accent-strong)">${live ? `${live.start.setZone(userTZ).toFormat('HH:mm')} – ${live.end.setZone(userTZ).toFormat('HH:mm')}` : next ? `${next.start.setZone(userTZ).toFormat('ccc HH:mm')}` : '—'}</div></div>
        ${playingId ? `<button class="btn secondary" data-act="playLive">${ic('play', 'sm')} ${esc(t('nav_watch'))}</button>` : ''}
        <a class="btn primary" href="#/schedule">${ic('calendar', 'sm')} ${esc(t('btn_see_schedule'))}</a><a class="btn secondary" href="#/focus">${ic('timer', 'sm')} ${esc(t('btn_start_focus'))}</a></aside></div>
    <h2 style="font-size:1.2rem;margin:30px 0 14px">${esc(t('latest_videos'))}</h2>
    ${videos.length ? `<div class="vgrid">${videos.map(v => `<button type="button" class="vcard" data-act="playVideo" data-id="${esc(v.id)}"><div class="th"><img loading="lazy" alt="" src="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg"></div><h4>${esc(v.title || 'YouTube')}</h4></button>`).join('')}</div>` : emptyBox('video', t('no_videos'), '')}`);
};

/* =========================================================
   FOCUS ROOM — Pomodoro + to-do (cho người xem)
   ========================================================= */
const pomoDefault = () => ({ cfg:{ focus:25, short:5, long:15, every:4, auto:false, noise:false }, mode:'focus', running:false, endAt:0, remaining:25 * 60e3, cycle:0 });
let pomo = { ...pomoDefault(), ...store.get('pomo', {}) }; pomo.cfg = { ...pomoDefault().cfg, ...(pomo.cfg || {}) };
const pomoDur = m => (pomo.cfg[m] || 25) * 60e3;
const pomoSave = () => store.set('pomo', pomo);
let actx = null;
function audio(){ if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (actx && actx.state === 'suspended') actx.resume(); return actx; }
function beep(){
  const a = audio(); if (!a) return;
  [0, .25, .5].forEach((d, i) => { const o = a.createOscillator(), g = a.createGain(), at = a.currentTime + d; o.type = 'sine'; o.frequency.value = i === 2 ? 988 : 784; g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(.2, at + .02); g.gain.exponentialRampToValueAtTime(.001, at + .22); o.connect(g); g.connect(a.destination); o.start(at); o.stop(at + .25); });
}
/* ---- Âm thanh nền tự tạo (không cần mạng, không bản quyền): mưa / ồn nâu / ồn trắng ---- */
const AMB = ['off', 'rain', 'brown', 'white'];
let ambType = 'off', ambVol = store.get('ambvol', .5), ambNode = null;
const ambGain = type => ambVol * ({ rain:.55, brown:.45, white:.16 }[type] || .3);
function setAmbient(type){
  ambType = type;
  if (ambNode) { try { ambNode.src.stop(); ambNode.g.disconnect(); } catch (e) {} ambNode = null; }
  document.querySelectorAll('#amb-chips [data-k]').forEach(b => b.classList.toggle('on', b.dataset.k === type));
  if (type === 'off') return;
  const a = audio(); if (!a) return;
  const len = a.sampleRate * 4, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  if (type === 'brown') { let last = 0; for (let i = 0; i < len; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; } }
  else for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource(), g = a.createGain(); src.buffer = buf; src.loop = true;
  let out = src;
  if (type === 'rain') { const hp = a.createBiquadFilter(), lp = a.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 450; lp.type = 'lowpass'; lp.frequency.value = 7500; src.connect(hp); hp.connect(lp); out = lp; }
  g.gain.value = ambGain(type); out.connect(g); g.connect(a.destination); src.start(); ambNode = { src, g };
}
CHANGES.ambVol = el => { ambVol = Math.max(0, Math.min(1, +el.value / 100)); store.set('ambvol', ambVol); if (ambNode) ambNode.g.gain.value = ambGain(ambType); };
document.addEventListener('input', e => { if (e.target.dataset && e.target.dataset.change === 'ambVol') CHANGES.ambVol(e.target); });

/* ---- Nhạc gợi ý: tự đổi link YouTube / Spotify / SoundCloud thành khung phát ngay trong trang ---- */
function musicEmbed(u){
  u = String(u || '').trim(); let m;
  if ((m = u.match(/youtube\.com\/playlist\?(?:.*&)?list=([\w-]+)/))) return { kind:'youtube', src:`https://www.youtube.com/embed/videoseries?list=${m[1]}&rel=0` };
  if ((m = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/))) { const list = (u.match(/[?&]list=([\w-]+)/) || [])[1]; return { kind:'youtube', src:`https://www.youtube.com/embed/${m[1]}?rel=0${list ? '&list=' + list : ''}` }; }
  if ((m = u.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(playlist|album|track|episode|show|artist)\/([A-Za-z0-9]+)/))) return { kind:'spotify', h:/track|episode/.test(m[1]) ? 152 : 352, src:`https://open.spotify.com/embed/${m[1]}/${m[2]}` };
  if (/soundcloud\.com\//.test(u)) return { kind:'soundcloud', h:300, src:'https://w.soundcloud.com/player/?url=' + encodeURIComponent(u) + '&color=%23ff3d9a&auto_play=false' };
  return null;
}
const MOODS = [['lofi', 'lofi study music'], ['piano', 'soft piano for studying'], ['jazz', 'cafe jazz study music'], ['rain', 'rain and thunder sounds for studying'], ['classical', 'classical music for studying focus'], ['nature', 'nature sounds forest for studying']];
let musicSel = null;
const playerHTML = () => !musicSel ? '' : `<div class="mplayer"><div class="row between"><b class="small">${esc(musicSel.title)}</b><button type="button" class="btn ghost sm" data-act="musicClose">${ic('x', 'sm')} ${esc(t('music_close'))}</button></div>
  <iframe title="${esc(musicSel.title)}" src="${esc(musicSel.src)}" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen style="${musicSel.kind === 'youtube' ? 'aspect-ratio:16/9;height:auto' : 'height:' + musicSel.h + 'px'}"></iframe></div>`;
const musicRow = (it, kind, i) => { const e = musicEmbed(it.url); return `<div class="mrow"><div class="mi"><b>${esc(L(it.title))}</b>${L(it.note) ? `<span class="small muted">${esc(L(it.note))}</span>` : ''}</div><span class="row">${e ? `<button type="button" class="btn primary sm" data-act="musicPlay" data-k="${kind}" data-i="${i}">${ic('play', 'sm')} ${esc(t('music_play'))}</button>` : ''}<a class="btn secondary sm" target="_blank" rel="noopener" href="${esc(it.url)}">${esc(t('music_open'))}</a></span></div>`; };
function musicCard(){
  const picks = (music.picks || []).filter(x => x.url), recent = (music.recent || []).filter(x => x.url);
  return `<section class="card pad music-card"><div class="card-h"><h2>${ic('volume')} ${esc(t('music_title'))}</h2></div><p class="small muted">${esc(t('music_sub'))}</p>
    <div class="label mt-s">${esc(t('amb_title'))}</div>
    <div class="row" id="amb-chips">${AMB.map(k => `<button type="button" class="chip ${ambType === k ? 'on' : ''}" data-act="ambSet" data-k="${k}">${esc(t('amb_' + k))}</button>`).join('')}<label class="row small" style="margin-left:auto;gap:8px">${esc(t('amb_vol'))}<input type="range" min="0" max="100" value="${Math.round(ambVol * 100)}" data-change="ambVol" style="width:120px"></label></div>
    ${picks.length ? `<div class="label mt">${esc(t('music_picks'))}</div>${picks.map((it, i) => musicRow(it, 'picks', i)).join('')}` : ''}
    ${recent.length ? `<div class="label mt">${esc(t('music_recent'))}</div>${recent.map((it, i) => musicRow(it, 'recent', i)).join('')}` : ''}
    <div id="mplayer-box">${playerHTML()}</div>
    <div class="label mt">${esc(t('music_more'))}</div><div class="row">${MOODS.map(([k, q]) => `<a class="chip" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(q)}">${esc(t('mood_' + k))}</a>`).join('')}</div></section>`;
}
Object.assign(ACTIONS, {
  ambSet: el => setAmbient(el.dataset.k),
  musicPlay: el => { const it = (music[el.dataset.k] || [])[+el.dataset.i]; if (!it) return; const e = musicEmbed(it.url); if (!e) return; musicSel = { ...e, title:L(it.title) }; const b = $('mplayer-box'); if (b) { b.innerHTML = playerHTML(); b.scrollIntoView({ block:'nearest', behavior:'smooth' }); } },
  musicClose: () => { musicSel = null; const b = $('mplayer-box'); if (b) b.innerHTML = ''; }
});function addFocus(min){
  const k = DT.now().setZone(userTZ).toISODate(), fl = localFocus(), o = fl[k] || { m:0, s:0 };
  fl[k] = { m:o.m + min, s:o.s + 1 }; store.set('focus', fl); saveProfileSoon();
}
/* Giới hạn thời gian tập trung mỗi ngày cho người xem miễn phí. Người đồng hành (Companions) và admin không bị giới hạn.
   Đếm bằng bộ nhớ trình duyệt nên đây là giới hạn "nhẹ nhàng" (có thể vượt bằng cách xoá dữ liệu trình duyệt). */
const focusUnlimited = () => !!(state.companion || state.isAdmin || unlockValid());
const focusLimit = () => focusUnlimited() ? 0 : Math.max(0, Math.round(+branding.focusLimit || 0));
const focusUsed = () => (localFocus()[DT.now().setZone(userTZ).toISODate()] || { m:0 }).m;
/* ô nhập mã đồng hành (dùng ở Focus room, hộp thoại hết giờ và trang Support) */
const unlockBox = () => `<form class="stack" data-form="unlock" style="gap:8px"><label class="label" style="margin:0">${esc(t('unlock_title'))}</label><div class="row" style="flex-wrap:nowrap"><input class="input" autocomplete="off" spellcheck="false" placeholder="${esc(t('unlock_ph'))}" maxlength="60"><button class="btn secondary" type="submit">${ic('check', 'sm')} ${esc(t('unlock_btn'))}</button></div></form>`;
FORMS.unlock = async form => {
  const code = normCode(form.querySelector('input').value); if (!code) return;
  const h = await sha256(code), today = DT.now().toISODate();
  if (!branding.focusCodeHash || h !== branding.focusCodeHash) return toast(t('unlock_bad'));
  if (branding.focusCodeUntil && branding.focusCodeUntil < today) return toast(t('unlock_expired'));
  const u = { hash:h, until:branding.focusCodeUntil || '' };
  store.set('unlock', u); profile.unlock = u;
  if (state.user && !DEMO) db.collection('users').doc(state.user.uid).set({ unlock:u }, { merge:true }).catch(() => {});
  closeModal(); toast(t('unlock_ok')); render(true);
};
function limitModal(){
  const L0 = focusLimit();
  openModal(`<h2>${esc(t('focus_limit_title'))}</h2><p class="muted mt-s">${esc(t('focus_limit_text', { l:L0 }))}</p>
    <div class="mt">${unlockBox()}</div>
    <div class="row mt"><a class="btn primary" href="#/donate" data-act="closeModal">${ic('heart', 'sm')} ${esc(t('focus_limit_cta'))}</a>${state.user ? '' : `<a class="btn secondary" href="#/account" data-act="closeModal">${esc(t('signin'))}</a>`}<button class="btn ghost" data-act="closeModal">${esc(t('close'))}</button></div>`, true);
}
function pomoStart(){
  if (pomo.running) return;
  const lim = focusLimit();
  if (pomo.mode === 'focus' && lim) {
    const allow = lim - focusUsed();
    if (allow <= 0) { limitModal(); return; }
    if (pomo.remaining / 60000 > allow) { pomo.remaining = allow * 60e3; pomo.blockMin = allow; toast(t('focus_last_block', { m:allow })); }
  }
  audio(); pomo.endAt = Date.now() + pomo.remaining; pomo.running = true; pomoSave(); updateTimerUI();
}
function pomoPause(){ if (!pomo.running) return; pomo.remaining = Math.max(0, pomo.endAt - Date.now()); pomo.running = false; pomoSave(); updateTimerUI(); }
function pomoReset(){ pomo.running = false; pomo.blockMin = 0; pomo.remaining = pomoDur(pomo.mode); pomoSave(); updateTimerUI(); }
function pomoMode(m){ pomo.mode = m; pomo.running = false; pomo.blockMin = 0; pomo.remaining = pomoDur(m); pomoSave(); updateTimerUI(); }
function pomoComplete(natural, silent){
  const wasFocus = pomo.mode === 'focus';
  if (wasFocus && natural) { addFocus(pomo.blockMin || pomo.cfg.focus); pomo.cycle++; }
  pomo.blockMin = 0;
  pomo.mode = wasFocus ? ((pomo.cycle % pomo.cfg.every === 0 && natural) ? 'long' : 'short') : 'focus';
  pomo.remaining = pomoDur(pomo.mode); pomo.running = !!(pomo.cfg.auto && natural) && !(pomo.mode === 'focus' && focusLimit() && focusUsed() >= focusLimit()); if (pomo.running) pomo.endAt = Date.now() + pomo.remaining;
  pomoSave();
  if (natural && !silent) {
    beep(); toast(t(wasFocus ? 'notify_done_focus' : 'notify_done_break'));
    if ('Notification' in window && Notification.permission === 'granted') new Notification(branding.name, { body:t(wasFocus ? 'notify_done_focus' : 'notify_done_break') });
  }
  if (route.name === 'focus' || route.name === 'home') render(true); else updateTimerUI();
}
function pomoTick(){ if (!pomo.running) return; if (pomo.endAt - Date.now() <= 0) pomoComplete(true); else updateTimerUI(); }
const RING_C = 2 * Math.PI * 54;
function updateTimerUI(){
  const left = pomo.running ? Math.max(0, pomo.endAt - Date.now()) : pomo.remaining, total = pomoDur(pomo.mode);
  const txt = `${String(Math.floor(left / 60000)).padStart(2, '0')}:${String(Math.floor(left % 60000 / 1000)).padStart(2, '0')}`;
  document.querySelectorAll('[data-pomo-time]').forEach(e => e.textContent = txt);
  document.querySelectorAll('[data-pomo-mode]').forEach(e => e.textContent = t('mode_' + pomo.mode));
  const fg = $('tm-fg'); if (fg) fg.style.strokeDashoffset = (RING_C * (1 - left / total)).toFixed(2);
  const ring = $('tm-ring'); if (ring) ring.className = 'ring m-' + pomo.mode;
  const main = $('tm-main'); if (main) main.innerHTML = pomo.running ? `${ic('pause')} ${esc(t('pause'))}` : `${ic('play')} ${esc(left < total ? t('resume') : t('start'))}`;
  document.querySelectorAll('[data-seg]').forEach(b => b.classList.toggle('on', b.dataset.seg === pomo.mode));
  const cyc = $('tm-cycle'); if (cyc) { const f = pomo.cycle % pomo.cfg.every || (pomo.mode === 'long' ? pomo.cfg.every : 0); cyc.innerHTML = Array.from({ length:pomo.cfg.every }, (_, i) => `<i class="${i < f ? 'on' : ''}"></i>`).join(''); }
  document.title = pomo.running ? `${txt} · ${t('mode_' + pomo.mode)} — ${branding.name}` : `${branding.name} · Study With Me`;
}
setInterval(pomoTick, 250);
if (pomo.running && pomo.endAt <= Date.now()) pomoComplete(true, true);     // hết giờ khi đang đóng tab

const todos = () => store.get('todos', []);
const saveTodos = l => { store.set('todos', l); saveProfileSoon(); };
function renderTodos(){
  const box = $('todo-list'); if (!box) return; const l = todos();
  box.innerHTML = l.length ? l.map(x => `<div class="todo-item ${x.done ? 'done' : ''}"><label><input type="checkbox" data-change="todoToggle" data-id="${esc(x.id)}" ${x.done ? 'checked' : ''}><span>${esc(x.text)}</span></label><button type="button" class="btn ghost icon sm" data-act="todoDel" data-id="${esc(x.id)}" aria-label="${esc(t('remove'))}">${ic('trash', 'sm')}</button></div>`).join('') : `<div class="small faint" style="padding:12px 0">${esc(t('todo_empty'))}</div>`;
}
/* ô xem stream nhỏ ngay trong Phòng tập trung (Watch live giữ nguyên) */
let fsPick = 'auto';                 // auto = đang live thì xem live, chưa live thì xem video mới nhất; 'live' = luôn xem live; hoặc id video đã live
function streamCard(){
  const open = store.get('fs_open', true), liveSrc = liveEmbedSrc(), url = watchUrl(), { live } = liveState();
  const vids = videos.filter(v => v.id).slice(0, 12);
  let pick = fsPick;
  if (pick === 'auto') pick = (live && liveSrc) || !vids.length ? 'live' : vids[0].id;       // chưa live → hiện video đã live gần nhất, khỏi trống
  if (pick !== 'live' && !vids.some(v => v.id === pick)) pick = 'live';
  const src = pick === 'live' ? liveSrc : `https://www.youtube-nocookie.com/embed/${pick}?rel=0${fsPick === 'auto' ? '' : '&autoplay=1'}`;
  const sel = vids.length ? `<select class="select fs-sel" data-change="fsPick" aria-label="${esc(t('focus_stream'))}"><option value="live" ${pick === 'live' ? 'selected' : ''}>● ${esc(t('focus_stream_live'))}</option><optgroup label="${esc(t('focus_stream_past'))}">${vids.map(v => `<option value="${esc(v.id)}" ${pick === v.id ? 'selected' : ''}>${esc((v.title || 'YouTube').slice(0, 64))}</option>`).join('')}</optgroup></select>` : '';
  return `<section class="card pad fstream"><div class="row between"><b class="row" style="gap:8px">${ic('play', 'sm')} ${esc(t('focus_stream'))} ${live && pick === 'live' ? '<span class="badge live">LIVE</span>' : ''}</b>
    <span class="row" style="gap:4px"><button type="button" class="btn ghost sm" data-act="fsToggle">${esc(open ? t('focus_stream_hide') : t('focus_stream_show'))}</button>${url ? `<a class="btn ghost sm" target="_blank" rel="noopener" href="${esc(url)}" aria-label="${esc(t('open_youtube'))}" title="${esc(t('open_youtube'))}">${ic('link', 'sm')}</a>` : ''}</span></div>
    ${open ? `${sel ? `<div class="mt-s">${sel}</div>` : ''}${src ? `<div class="player mt-s"><iframe src="${esc(src)}" title="YouTube" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>` : `<p class="small muted mt-s"><b>${esc(t('offline'))}.</b> ${esc(t('offline_sub'))}</p>`}` : ''}</section>`;
}
CHANGES.fsPick = el => { fsPick = el.value; render(true); };ACTIONS.fsToggle = () => { store.set('fs_open', !store.get('fs_open', true)); render(true); };
PAGES.focus = function(){
  const fl = localFocus(), today = DT.now().setZone(userTZ), days = Array.from({ length:7 }, (_, i) => today.minus({ days:6 - i })), vals = days.map(d => (fl[d.toISODate()] || { m:0 }).m), mx = Math.max(30, ...vals), td = fl[today.toISODate()] || { m:0, s:0 };
  const c = pomo.cfg, num = (k, lab) => `<div class="field"><label class="label">${esc(lab)}</label><input class="input" type="number" min="1" max="180" value="${c[k]}" data-change="cfg" data-k="${k}"></div>`;
  page(`${head('focus_title', 'focus_sub', '', 'umbrella', 4)}
    <div class="grid g-main"><section class="card timer-card">
      <div class="seg"><button type="button" data-seg="focus" data-act="pmode" data-m="focus">${esc(t('mode_focus'))}</button><button type="button" data-seg="short" data-act="pmode" data-m="short">${esc(t('mode_short'))}</button><button type="button" data-seg="long" data-act="pmode" data-m="long">${esc(t('mode_long'))}</button></div>
      <div class="ring" id="tm-ring"><svg viewBox="0 0 120 120"><circle class="bg" cx="60" cy="60" r="54" stroke-width="7"/><circle class="fg" id="tm-fg" cx="60" cy="60" r="54" stroke-width="7" stroke-dasharray="${RING_C.toFixed(2)}" stroke-dashoffset="0"/></svg><div class="center"><div class="tt" data-pomo-time>25:00</div><div class="md" data-pomo-mode></div></div></div>
      <div class="cycle" id="tm-cycle"></div>
      ${focusLimit() ? `<div class="limit-box"><div class="row between small"><b>${esc(t('focus_limit_used', { u:Math.min(focusUsed(), focusLimit()), l:focusLimit() }))}</b><span class="faint">${esc(t('focus_limit_note', { l:focusLimit() }))}</span></div><div class="progress mt-s"><i style="width:${Math.min(100, focusUsed() / focusLimit() * 100)}%"></i></div><div class="mt-s">${unlockBox()}</div></div>` : (state.companion ? `<div class="limit-box"><span class="badge">${ic('heart', 'sm')} ${esc(t('comp_badge'))} · ${esc(t('focus_nolimit'))}</span></div>` : '')}
      <div class="row"><button class="btn primary lg" id="tm-main" data-act="pstart"></button><button class="btn secondary icon" style="width:48px;height:48px" data-act="preset-reset" title="${esc(t('reset'))}">${ic('reset')}</button><button class="btn secondary icon" style="width:48px;height:48px" data-act="pskip" title="${esc(t('skip'))}">${ic('skip')}</button></div>
      <div class="divider" style="width:100%;margin:2px 0"></div>
      <div class="row" style="width:100%"><span class="small muted">${esc(t('presets'))}:</span>${Object.entries(PRESETS).map(([k, p]) => `<button type="button" class="chip" data-act="ppreset" data-p="${k}">${p.focus}/${p.short}/${p.long}</button>`).join('')}</div>
      <div class="cfg-grid">${num('focus', t('cfg_focus'))}${num('short', t('cfg_short'))}${num('long', t('cfg_long'))}${num('every', t('cfg_every'))}</div>
      <div class="row between" style="width:100%"><label class="row small" style="font-weight:600"><input type="checkbox" data-change="cfgAuto" ${c.auto ? 'checked' : ''}> ${esc(t('auto_start'))}</label></div>
    </section>
    <div class="stack">${streamCard()}<section class="card pad"><div class="card-h"><h2>${esc(t('todo_title'))}</h2></div>
        <form class="row" style="flex-wrap:nowrap" data-form="todo"><input class="input" id="todo-in" placeholder="${esc(t('todo_ph'))}" maxlength="140" autocomplete="off"><button class="btn primary icon" type="submit" aria-label="add">${ic('plus')}</button></form>
        <div id="todo-list" class="mt-s"></div>${!state.user ? `<p class="hint mt-s">${esc(t('sync_note'))} <a class="link" href="#/account">${esc(t('signin'))}</a></p>` : ''}</section>
      <div class="grid g2 keep2"><div class="card tile"><span class="t-l">${esc(t('sessions_today'))}</span><span class="t-v">${td.s}</span></div><div class="card tile"><span class="t-l">${esc(t('minutes_today'))}</span><span class="t-v">${td.m}</span></div></div>
      <section class="card pad"><div class="card-h"><h2>${esc(t('week_chart'))}</h2></div><div class="bars">${days.map((d, i) => `<div><i style="height:${Math.max(3, vals[i] / mx * 100)}%" title="${vals[i]} ${esc(t('min'))}"></i><small>${esc(d.setLocale(state.lang).toFormat('ccc'))}</small></div>`).join('')}</div></section></div></div><div class="mt">${musicCard()}</div>`);
  renderTodos();
};
CHANGES.cfg = el => { const k = el.dataset.k, v = Math.max(1, Math.min(180, parseInt(el.value, 10) || 1)); pomo.cfg[k] = v; if (!pomo.running && (k === pomo.mode)) pomo.remaining = pomoDur(pomo.mode); pomoSave(); updateTimerUI(); };
CHANGES.cfgAuto = el => { pomo.cfg.auto = el.checked; pomoSave(); };
CHANGES.todoToggle = el => { saveTodos(todos().map(x => x.id === el.dataset.id ? { ...x, done:el.checked } : x)); renderTodos(); };
FORMS.todo = () => { const i = $('todo-in'), v = i.value.trim(); if (!v) return; saveTodos([{ id:Date.now().toString(36), text:v, done:false }, ...todos()]); i.value = ''; renderTodos(); i.focus(); };

/* =========================================================
   BLOG
   ========================================================= */
let blogTag = '', blogQ = '', blogCat = '';
/* Bản gộp chỉ chứa phần giới thiệu bài (không kèm nội dung). Nội dung bài chỉ được đọc khi người xem mở bài, rồi lưu trong trình duyệt 30 phút. */
const postMins = p => (p.rm && (p.rm[state.lang] || p.rm.en || p.rm.vi)) || readMins(L(p.body));
const postBodyCache = store.get('pbodies', {});
function ensurePostBody(p){
  if (p.body) return;
  if (SITE.bodies && SITE.bodies[p.id]) { p.body = SITE.bodies[p.id]; return; }
  const c = postBodyCache[p.id]; if (c && Date.now() - c.t < 30 * 60e3) { p.body = c.body; return; }
  if (p._loading || DEMO) return; p._loading = true;
  db.collection('posts').doc(p.id).get().then(d => {
    const b = d.exists ? d.data().body : null;
    if (b) { p.body = b; postBodyCache[p.id] = { t:Date.now(), body:b }; const ks = Object.keys(postBodyCache); if (ks.length > 8) delete postBodyCache[ks.sort((x, y) => postBodyCache[x].t - postBodyCache[y].t)[0]]; store.set('pbodies', postBodyCache); }
    if (!b) p._err = true;
    p._loading = false; if (route.name === 'blog') render(true);
  }).catch(() => { p._loading = false; p._err = true; if (route.name === 'blog') render(true); });
}
const livePosts = () => posts.filter(p => !(p.publishAt && tsMs(p.publishAt) > Date.now())).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || tsMs(b.createdAt) - tsMs(a.createdAt));
const blogCats = () => (branding.blogCats || []);
const catOf = id => blogCats().find(c => c.id === id);
const catLabel = id => { const c = catOf(id); return c ? L(c.label) : (id || ''); };
function blogListHTML(){
  const q = blogQ.toLowerCase(), shown = livePosts().filter(p => (!blogCat || p.category === blogCat) && (!blogTag || (p.tags || []).includes(blogTag)) && (!q || (L(p.title) + ' ' + L(p.excerpt)).toLowerCase().includes(q)));
  return shown.length ? shown.map(blogCard).join('') : `<div style="grid-column:1/-1">${emptyBox('pen', blogCat ? t('cat_empty') : t('no_posts'), blogCat ? '' : t('no_posts_sub'))}</div>`;
}
PAGES.blog = function(){
  if (route.args[0] === 'c') { blogCat = route.args[1] || ''; }
  else if (route.args[0]) return renderPost(route.args.join('/'));
  else blogCat = '';
  const lp = livePosts(), tags = [...new Set(lp.flatMap(p => p.tags || []))], cats = blogCats().filter(c => lp.some(p => p.category === c.id) || c.id === blogCat), cur = catOf(blogCat);
  page(`${head('blog_title', 'blog_sub', '', 'book', 6)}
    <div class="catbar"><a class="cat ${!blogCat ? 'on' : ''}" href="#/blog">${esc(t('cat_all'))} <small>${lp.length}</small></a>${cats.map(c => `<a class="cat ${blogCat === c.id ? 'on' : ''}" href="#/blog/c/${esc(c.id)}">${esc(L(c.label))} <small>${lp.filter(p => p.category === c.id).length}</small></a>`).join('')}</div>
    ${cur && L(cur.desc) ? `<p class="muted" style="margin:-4px 0 16px">${esc(L(cur.desc))}</p>` : ''}
    <div class="row" style="margin-bottom:18px"><input class="input" style="max-width:300px" id="blog-q" data-input="blogQ" placeholder="${esc(t('search'))}" value="${esc(blogQ)}">
    ${tags.length ? tags.map(g => `<button type="button" class="chip ${blogTag === g ? 'on' : ''}" data-act="tag" data-tag="${blogTag === g ? '' : esc(g)}">#${esc(g)}</button>`).join('') : ''}</div>
    <div class="pgrid" id="blog-list">${blogListHTML()}</div>`);
};
function renderPost(slug){
  const lp = livePosts(), i = lp.findIndex(p => (p.slug || p.id) === slug), p = lp[i];
  if (!p) return page(`<a class="btn secondary sm" href="#/blog">${ic('chev-l', 'sm')} ${esc(t('back'))}</a>${emptyBox('pen', posts.length ? t('not_found') : t('loading'), '')}`);
  ensurePostBody(p);
  const same = lp.filter(x => x.category === p.category && x.id !== p.id).slice(0, 3), prev = lp[i + 1], next = lp[i - 1];
  const tr = (!isNativeContent() && p.body && !p.body[state.lang]) ? `<a class="badge" target="_blank" rel="noopener" href="https://translate.google.com/translate?sl=auto&tl=${state.lang}&u=${encodeURIComponent(location.href.split('#')[0] + '#/blog/' + encodeURIComponent(slug))}">${ic('globe', 'sm')} ${esc(t('translate'))}</a>` : '';
  page(`<article class="post"><a class="btn secondary sm" href="#/blog${p.category ? '/c/' + esc(p.category) : ''}">${ic('chev-l', 'sm')} ${esc(p.category ? catLabel(p.category) : t('back'))}</a><h1>${esc(L(p.title))}</h1>
    <div class="meta"><span>${esc(fmtDate(p.createdAt))}</span><span>${esc(t('min_read', { m:postMins(p) }))}</span>${tr}</div>
    <div class="tags mt-s">${p.category ? `<a class="badge" href="#/blog/c/${esc(p.category)}">${esc(catLabel(p.category))}</a>` : ''}${(p.tags || []).map(g => `<span class="badge muted">#${esc(g)}</span>`).join('')}</div>
    ${state.isAdmin ? `<div class="row mt-s"><button type="button" class="btn secondary sm" data-act="editPostPage" data-id="${esc(p.id)}">${ic('pen', 'sm')} Sửa bài này</button><button type="button" class="btn danger sm" data-act="delPostPage" data-id="${esc(p.id)}">${ic('trash', 'sm')} Xoá bài</button></div>` : ''}
    ${p.cover ? `<div class="cover"><img alt="" src="${esc(p.cover)}"></div>` : ''}<div class="prose">${p.body ? sanitizeHtml(L(p.body)) : `<p class="muted">${esc(p._err ? t('not_found') : t('loading'))}</p>`}</div>
    ${same.length ? `<h3 style="margin:40px 0 14px">${esc(t('more_in', { c:catLabel(p.category) }))}</h3><div class="pgrid">${same.map(blogCard).join('')}</div>` : ''}
    <div class="row between mt" style="margin-top:36px">${prev ? `<a class="btn secondary sm" href="#/blog/${encodeURIComponent(prev.slug || prev.id)}">${ic('chev-l', 'sm')} ${esc(L(prev.title))}</a>` : '<span></span>'}${next ? `<a class="btn secondary sm" href="#/blog/${encodeURIComponent(next.slug || next.id)}">${esc(L(next.title))} ${ic('chev-r', 'sm')}</a>` : ''}</div></article>`);
}
document.addEventListener('input', e => { if (e.target.dataset && e.target.dataset.input === 'blogQ') { blogQ = e.target.value; const l = $('blog-list'); if (l) l.innerHTML = blogListHTML(); } });

/* =========================================================
   SHOP + GIỎ HÀNG + THANH TOÁN
   ========================================================= */
let cart = store.get('cart', []), coupon = null;
const saveCart = () => { store.set('cart', cart); renderChrome(); renderCart(); };
const cartCount = () => cart.reduce((a, c) => a + c.qty, 0);
const pprice = (p, cur) => cur === 'VND' ? +p.priceVND || 0 : +p.priceUSD || 0;
const pcur = p => { const c = effCurrency(); return pprice(p, c) ? c : (c === 'VND' ? 'USD' : 'VND'); };
function cartLines(){
  const cur = effCurrency();
  return cart.map(c => { const p = products.find(x => x.id === c.id); if (!p) return null; const unit = pprice(p, cur); return { p, qty:c.qty, unit, line:unit * c.qty, ok: unit > 0 && p.stock !== 0 }; }).filter(Boolean);
}
function couponDiscount(sub, cur){
  if (!coupon) return 0;
  const d = coupon.type === 'percent' ? Math.round(sub * (+coupon.value || 0)) / 100 : (cur === 'VND' ? +coupon.valueVND : +coupon.valueUSD) || 0;
  return Math.min(sub, cur === 'VND' ? Math.round(d) : d);
}
function cartTotals(){ const cur = effCurrency(), lines = cartLines(), sub = lines.reduce((a, l) => a + l.line, 0), disc = couponDiscount(sub, cur); return { cur, lines, sub, disc, total: Math.max(0, sub - disc) }; }
function prodCard(p){
  const cur = pcur(p), out = p.stock === 0, inCart = cart.some(c => c.id === p.id);
  return `<article class="pcard prod" data-act="product" data-id="${esc(p.id)}"><div class="cv">${(p.images || [])[0] ? `<img loading="lazy" alt="" src="${esc(p.images[0])}">` : paintFor('p' + p.id, { lite:true })}</div>
    <div class="bd"><div class="row"><span class="badge ${p.type === 'physical' ? 'warn' : ''}">${esc(t(p.type === 'physical' ? 'physical' : 'digital'))}</span>${out ? `<span class="badge danger">${esc(t('sold_out'))}</span>` : ''}</div>
    <h3>${esc(L(p.name))}</h3><p>${esc(L(p.desc))}</p>
    <div class="row between" style="margin-top:auto"><span class="price">${money(pprice(p, cur), cur)}</span><button type="button" class="btn ${inCart ? 'secondary' : 'primary'} sm" data-act="addCart" data-id="${esc(p.id)}" ${out ? 'disabled' : ''}>${esc(inCart ? t('in_cart') : t('add_cart'))}</button></div></div></article>`;
}
PAGES.shop = function(){
  const cur = effCurrency();
  page(`${head('shop_title', 'shop_sub', `<div class="seg" id="cur-toggle"><button type="button" class="${cur === 'VND' ? 'on' : ''}" data-act="cur" data-c="VND">VND ₫</button><button type="button" class="${cur === 'USD' ? 'on' : ''}" data-act="cur" data-c="USD">USD $</button></div>`, 'lantern', 2)}
    ${products.length ? `<div class="pgrid">${products.map(prodCard).join('')}</div>` : emptyBox('bag', t('soon'), t('soon_sub'))}`);
};
function openProduct(id){
  const p = products.find(x => x.id === id); if (!p) return;
  const cur = pcur(p), imgs = p.images || [], out = p.stock === 0;
  openModal(`<div class="pdetail"><div>${imgs[0] ? `<img class="gal-main" id="gal-main" alt="" src="${esc(imgs[0])}"><div class="gal-th">${imgs.map(u => `<img alt="" src="${esc(u)}" data-act="gal" data-u="${esc(u)}">`).join('')}</div>` : `<div class="gal-main" style="position:relative;overflow:hidden">${paintFor('p' + p.id, { lite:true })}</div>`}</div>
    <div class="stack"><div class="row"><span class="badge ${p.type === 'physical' ? 'warn' : ''}">${esc(t(p.type === 'physical' ? 'physical' : 'digital'))}</span></div><h2 style="padding:0">${esc(L(p.name))}</h2><div class="price" style="font-size:1.5rem">${money(pprice(p, cur), cur)}</div>
    <p class="muted">${esc(L(p.desc))}</p>${p.type !== 'physical' ? `<div class="small faint">${ic('download', 'sm')} ${esc(t('instant_download'))}</div>` : ''}
    <button class="btn primary lg" data-act="addCart" data-id="${esc(p.id)}" data-close="1" ${out ? 'disabled' : ''}>${ic('cart', 'sm')} ${esc(out ? t('sold_out') : t('add_cart'))}</button></div></div>`);
}
function cartAdd(id){ const c = cart.find(x => x.id === id); if (c) c.qty = Math.min(20, c.qty + 1); else cart.push({ id, qty:1 }); saveCart(); toast(t('in_cart')); if (route.name === 'shop' || route.name === 'home') render(true); }
function renderCart(){
  const d = $('cart-drawer'); if (!d) return; const T = cartTotals();
  d.innerHTML = `<div class="drawer-h"><h2 style="font-size:1.1rem">${esc(t('cart'))} (${cartCount()})</h2><button class="btn ghost icon" data-act="closeCart" aria-label="close">${ic('x')}</button></div>
    <div class="drawer-b">${T.lines.length ? T.lines.map(l => `<div class="cart-item"><div class="thumb">${(l.p.images || [])[0] ? `<img alt="" src="${esc(l.p.images[0])}">` : ic('bag')}</div>
      <div style="min-width:0"><b style="font-size:.9rem">${esc(L(l.p.name))}</b><div class="small ${l.ok ? 'muted' : ''}" style="${l.ok ? '' : 'color:var(--danger)'}">${l.ok ? money(l.unit, T.cur) : esc(t('na_currency'))}</div>
        <div class="qty mt-s"><button type="button" data-act="cartQty" data-id="${esc(l.p.id)}" data-d="-1">−</button><span>${l.qty}</span><button type="button" data-act="cartQty" data-id="${esc(l.p.id)}" data-d="1" ${l.p.type !== 'physical' ? 'disabled style="opacity:.35"' : ''}>+</button></div></div>
      <div style="text-align:right"><b>${l.ok ? money(l.line, T.cur) : '—'}</b><br><button type="button" class="btn ghost icon sm" data-act="cartDel" data-id="${esc(l.p.id)}" aria-label="${esc(t('remove'))}">${ic('trash', 'sm')}</button></div></div>`).join('') : emptyBox('cart', t('cart_empty'), '')}</div>
    ${T.lines.length ? `<div class="drawer-f"><form class="row" style="flex-wrap:nowrap;margin-bottom:12px" data-form="coupon"><input class="input" id="coupon-in" placeholder="${esc(t('coupon_ph'))}" value="${esc(coupon ? coupon.code : '')}" style="text-transform:uppercase"><button class="btn secondary" type="submit">${esc(t('apply'))}</button></form>
      <div class="sumrow"><span>${esc(t('subtotal'))}</span><span>${money(T.sub, T.cur)}</span></div>${T.disc ? `<div class="sumrow" style="color:var(--live)"><span>${esc(t('discount'))} (${esc(coupon.code)})</span><span>−${money(T.disc, T.cur)}</span></div>` : ''}
      <div class="sumrow total"><span>${esc(t('total'))}</span><span>${money(T.total, T.cur)}</span></div>
      <button class="btn primary lg mt" style="width:100%" data-act="checkout" ${T.lines.every(l => l.ok) ? '' : 'disabled'}>${esc(t('checkout'))}</button></div>` : ''}`;
}
async function applyCoupon(code){
  code = code.trim().toUpperCase(); if (!code) { coupon = null; return renderCart(); }
  try {
    let c; if (DEMO) c = code === 'WELCOME10' ? { type:'percent', value:10, active:true } : null; else { const d = await db.collection('coupons').doc(code).get(); c = d.exists ? d.data() : null; }
    const cur = effCurrency(), sub = cartTotals().sub, min = cur === 'VND' ? +c?.minVND : +c?.minUSD;
    if (!c || c.active === false || (c.expires && new Date(c.expires + 'T23:59:59') < new Date()) || (min && sub < min)) { coupon = null; toast(t('coupon_bad')); } else { coupon = { code, ...c }; toast(t('coupon_ok')); }
  } catch (e) { coupon = null; toast(t('coupon_bad')); }
  renderCart();
}
function startCheckout(){
  const T = cartTotals(); if (!T.lines.length || !T.lines.every(l => l.ok)) return;
  $('cart-drawer').classList.remove('open');
  const hasDigital = T.lines.some(l => l.p.type !== 'physical'), phys = T.lines.some(l => l.p.type === 'physical');
  if (hasDigital && !state.user) return openModal(`<h2>${esc(t('signin'))}</h2><p class="muted">${esc(t('login_to_buy'))}</p><div class="row mt"><a class="btn primary" href="#/account" data-act="closeModal">${esc(t('signin'))} / ${esc(t('signup'))}</a></div>`, true);
  openModal(`<h2>${esc(t('checkout'))}</h2><form class="stack mt-s" data-form="order">
    <div class="f2"><div class="field"><label class="label">${esc(t('your_name'))}</label><input class="input" id="b-name" required maxlength="80" value="${esc(state.user ? displayName() : '')}"></div><div class="field"><label class="label">${esc(t('your_email'))}</label><input class="input" id="b-email" type="email" required maxlength="160" value="${esc(state.user ? state.user.email : '')}"></div></div>
    ${phys ? `<div class="field"><label class="label">${esc(t('address'))}</label><textarea class="textarea" id="b-addr" required maxlength="400"></textarea><div class="hint">${esc(t('ship_note'))}</div></div>` : ''}
    <div class="field"><label class="label">${esc(t('note'))}</label><textarea class="textarea" id="b-note" maxlength="400" style="min-height:60px"></textarea></div>
    <div class="card pad" style="background:var(--surface2)">${T.lines.map(l => `<div class="sumrow"><span>${esc(L(l.p.name))} × ${l.qty}</span><span>${money(l.line, T.cur)}</span></div>`).join('')}${T.disc ? `<div class="sumrow" style="color:var(--live)"><span>${esc(t('discount'))}</span><span>−${money(T.disc, T.cur)}</span></div>` : ''}<div class="sumrow total"><span>${esc(t('total'))}</span><span>${money(T.total, T.cur)}</span></div></div>
    <button class="btn primary lg" type="submit">${esc(t('continue'))}</button><div class="small" style="color:var(--danger)" id="b-err"></div></form>`);
}
FORMS.order = async () => {
  const T = cartTotals(), code = 'EP-' + Math.random().toString(36).slice(2, 7).toUpperCase(), phys = T.lines.some(l => l.p.type === 'physical');
  const order = { code, uid: state.user ? state.user.uid : null, items: T.lines.map(l => ({ id:l.p.id, name:L(l.p.name), qty:l.qty, unit:l.unit, type:l.p.type || 'digital' })), subtotal:T.sub, discount:T.disc, coupon: coupon ? coupon.code : '', total:T.total, currency:T.cur,
    buyer:{ name:$('b-name').value.trim(), email:$('b-email').value.trim(), address: phys ? $('b-addr').value.trim() : '', note:$('b-note').value.trim() }, method: T.cur === 'VND' ? 'vietqr' : 'link', status:'pending', lang:state.lang };
  try { if (!DEMO) await db.collection('orders').doc(code).set({ ...order, createdAt:TS() }); } catch (err) { $('b-err').textContent = t('order_err') + (err.message || err); return; }
  if (payments.orderTemplate && !DEMO) emailjs.send(EMAILJS_SERVICE, payments.orderTemplate, { user_name:order.buyer.name, user_email:order.buyer.email, order_code:code, items:order.items.map(i => `${i.name} × ${i.qty}`).join(', '), total:money(order.total, order.currency) }).catch(() => {});
  cart = []; coupon = null; saveCart(); paymentStep(order);
};
function paymentStep(o){
  const links = { ...(payments.stripe ? { stripe:payments.stripe } : {}), ...(payments.paypal ? { paypal:payments.paypal } : {}), ...(payments.kofi ? { kofi:payments.kofi } : {}) };
  const linkBtns = Object.entries(links).map(([k, u]) => `<a class="btn ${o.currency === 'VND' ? 'secondary' : 'primary'}" target="_blank" rel="noopener" href="${esc(u)}">${ic('credit', 'sm')} ${esc(k === 'stripe' ? t('pay_card') : k === 'paypal' ? 'PayPal' : 'Ko-fi')}</a>`).join(' ');
  const row = (l, v, copy) => `<div class="kvr"><span>${esc(l)}</span><b>${esc(v)}</b>${copy ? `<button type="button" class="btn secondary sm" data-act="copy" data-v="${esc(copy)}">${esc(t('copy'))}</button>` : ''}</div>`;
  let body = '';
  if (o.currency === 'VND') {
    if (payments.bankBin && payments.accountNo) {
      const qr = `https://img.vietqr.io/image/${encodeURIComponent(payments.bankBin)}-${encodeURIComponent(payments.accountNo)}-compact2.png?amount=${o.total}&addInfo=${encodeURIComponent(o.code)}&accountName=${encodeURIComponent(payments.accountName || '')}`;
      body = `<p class="muted">${esc(t('scan_qr'))}</p><img class="qr" alt="VietQR" src="${esc(qr)}"><div class="kv">${row(t('bank'), payments.bankBin)}${row(t('acc_no'), payments.accountNo, payments.accountNo)}${row(t('acc_name'), payments.accountName || '')}${row(t('amount'), money(o.total, 'VND'), String(o.total))}${row(t('content'), o.code, o.code)}</div>
        ${payments.momoPhone ? `<div class="kv">${row(t('momo'), payments.momoPhone, payments.momoPhone)}</div>${payments.momoQr ? `<img class="qr" style="max-width:200px" alt="MoMo" src="${esc(payments.momoQr)}">` : ''}` : ''}`;
    } else body = `<p>${esc(t('pay_none'))}</p>`;
  } else body = linkBtns ? `<div class="row mt">${linkBtns}</div>` : `<p>${esc(t('pay_none'))}</p>`;
  openModal(`<h2>${esc(t('order_code'))}: <span class="mono">${esc(o.code)}</span></h2><div class="price" style="font-size:1.4rem;margin:6px 0 10px">${esc(t('total'))}: ${money(o.total, o.currency)}</div>${body}${o.currency === 'VND' && linkBtns ? `<div class="mt-s">${linkBtns}</div>` : ''}
    <p class="hint" style="margin-top:12px">${esc(t(o.currency === 'VND' ? 'pay_wait' : 'pay_wait_link', { code:o.code }))}</p>`);
}
FORMS.coupon = () => applyCoupon($('coupon-in').value);

/* =========================================================
   ABOUT / FAQ / REVIEWS
   ========================================================= */
const faqList = () => Array.isArray(content.faq) && content.faq.length ? content.faq.map(f => ({ q:L(f.q), a:L(f.a) })) : [1, 2, 3, 4].map(i => ({ q:ctext('faq' + i + 'q'), a:ctext('faq' + i + 'a'), k:i }));
let reviewRating = 5;
PAGES.about = function(){
  const avg = ratingAvg();
  page(`<section class="about-hero"><div><span class="badge" ${cms('about_badge')}>${esc(ctext('about_badge'))}</span><h1 style="font-size:clamp(1.8rem,4vw,2.6rem);margin:12px 0" ${cms('about_h')}>${esc(ctext('about_h'))}</h1><p class="muted" style="font-size:1.05rem;white-space:pre-line" ${cms('about_text')}>${esc(ctext('about_text'))}</p>
      <div class="row mt"><a class="btn primary" href="#/watch">${ic('play', 'sm')} ${esc(t('btn_watch_live'))}</a>${Object.entries(branding.socialLinks || {}).filter(([, u]) => u).map(([n, u]) => `<a class="btn secondary" target="_blank" rel="noopener" href="${esc(u)}">${esc(n)}</a>`).join('')}</div></div>
      <div class="about-img" data-cms-img="about_img">${artOr('about_img', 'moonwalk', { crop:'tall', seed:2 })}</div></section>
    <div class="grid g3 mt" style="margin-top:34px">${[['timer', 1], ['globe', 2], ['sliders', 3]].map(([icn, i]) => `<div class="card pad feat"><div class="tile" style="padding:0"><span class="t-ic">${ic(icn)}</span></div><h3 style="font-size:1.05rem;margin:10px 0 4px" ${cms('about_c' + i + '_t')}>${esc(ctext('about_c' + i + '_t'))}</h3><p class="muted small" ${cms('about_c' + i + '_d')}>${esc(ctext('about_c' + i + '_d'))}</p></div>`).join('')}</div>
    <h2 style="font-size:1.3rem;margin:40px 0 14px" ${cms('faq_title')}>${esc(ctext('faq_title'))}</h2>
    <div>${faqList().map(f => `<details class="faq"><summary>${esc(f.q)}</summary><div class="a">${esc(f.a)}</div></details>`).join('')}</div>
    <div class="row between" style="margin:40px 0 14px"><h2 style="font-size:1.3rem" ${cms('reviews_title')}>${esc(ctext('reviews_title'))}</h2>${avg ? `<div class="row">${stars(Math.round(avg))}<b>${avg.toFixed(1)}</b><span class="small faint">(${reviews.length})</span></div>` : ''}</div>
    <div class="grid g-main" style="align-items:start"><div class="grid g2">${reviews.length ? reviews.map(reviewCard).join('') : `<div style="grid-column:1/-1">${emptyBox('star', t('no_reviews'), '')}</div>`}</div>
    <section class="card pad"><h3 style="margin-bottom:10px">${esc(t('review_write'))}</h3>${state.user ? `<form class="stack" data-form="review"><div><label class="label">${esc(t('rating_label'))}</label><div class="seg" id="rev-stars">${[1, 2, 3, 4, 5].map(i => `<button type="button" class="${i === reviewRating ? 'on' : ''}" data-act="rate" data-n="${i}">${i}★</button>`).join('')}</div></div><textarea class="textarea" id="rev-text" required maxlength="600" placeholder="${esc(t('review_ph'))}"></textarea><button class="btn primary" type="submit">${esc(t('review_submit'))}</button></form>` : `<p class="muted small">${esc(t('review_login'))}</p><a class="btn primary mt-s" href="#/account">${esc(t('signin'))}</a>`}</section></div>`);
};
FORMS.review = async () => {
  const text = $('rev-text').value.trim(); if (!text) return;
  try {
    if (!DEMO) await db.collection('reviews').add({ uid:state.user.uid, name:displayName(), rating:reviewRating, text, approved:false, createdAt:TS() });
    toast(t('review_pending')); $('rev-text').value = '';
  } catch (e) { alert(t('err_generic') + e.message); }
};

/* =========================================================
   GEAR — những món đồ mình dùng (sẵn sàng gắn link affiliate)
   Dữ liệu: settings/gear { items:[{ id, name{}, note{}, cat{}, price, store, url, img }] } — admin sửa ở tab "Đồ mình dùng"
   ========================================================= */
let gearFilter = '';
const gearCard = g => `<article class="pcard gear-card"><div class="cv">${g.img ? `<img loading="lazy" alt="" src="${esc(g.img)}">` : paintFor('g' + (g.id || L(g.name)), { lite:true })}</div>
  <div class="bd"><h3>${esc(L(g.name))}</h3>${L(g.note) ? `<p>${esc(L(g.note))}</p>` : ''}${L(g.cat) ? `<span class="badge">${esc(L(g.cat))}</span>` : ''}
    <div class="row between" style="margin-top:auto;gap:10px"><span class="small faint">${esc([g.price, g.store].filter(Boolean).join(' · '))}</span><a class="btn primary sm" target="_blank" rel="sponsored nofollow noopener" href="${esc(g.url || '#')}">${esc(t('gear_view'))} ${ic('link', 'sm')}</a></div></div></article>`;
PAGES.gear = function(){
  const items = (gear.items || []).filter(g => g.url || g.name), cats = [...new Set(items.map(g => L(g.cat)).filter(Boolean))];
  if (gearFilter && !cats.includes(gearFilter)) gearFilter = '';
  const shown = items.filter(g => !gearFilter || L(g.cat) === gearFilter);
  page(`${head('gear_title', 'gear_sub', '', 'lantern', 6)}
    <p class="small muted" style="margin-bottom:16px" ${cms('gear_disclose')}>${esc(ctext('gear_disclose'))}</p>
    ${cats.length > 1 ? `<div class="catbar"><button type="button" class="cat ${!gearFilter ? 'on' : ''}" data-act="gearCat" data-c="">${esc(t('cat_all'))} <small>${items.length}</small></button>${cats.map(c => `<button type="button" class="cat ${gearFilter === c ? 'on' : ''}" data-act="gearCat" data-c="${esc(c)}">${esc(c)} <small>${items.filter(g => L(g.cat) === c).length}</small></button>`).join('')}</div>` : ''}
    ${shown.length ? `<div class="grid g3 gear-grid">${shown.map(gearCard).join('')}</div>` : emptyBox('tag', t('gear_empty'), '')}`);
};
ACTIONS.gearCat = el => { gearFilter = el.dataset.c || ''; render(true); };
/* =========================================================
   ACCOUNT (đăng nhập / đăng ký / hồ sơ / đơn hàng / thư viện)
   ========================================================= */
let authTab = 'signin', myOrders = null;
// khung đăng nhập / tạo tài khoản — dùng cho trang Tài khoản và cho cổng đăng nhập
const authCard = (title, sub, strip = true) => `<div class="card">${strip ? `<div class="art-strip">${paint('moonwalk', { crop:'banner', seed:7 })}</div>` : ''}<div class="stack"><div style="text-align:center"><h2 style="font-size:1.4rem">${esc(title)}</h2><p class="muted small mt-s">${esc(sub)}</p></div>
      <div class="seg" style="align-self:center"><button type="button" class="${authTab === 'signin' ? 'on' : ''}" data-act="authTab" data-t="signin">${esc(t('signin'))}</button><button type="button" class="${authTab === 'signup' ? 'on' : ''}" data-act="authTab" data-t="signup">${esc(t('signup'))}</button></div>
      <form class="stack" data-form="${authTab}">${authTab === 'signup' ? `<input class="input" id="au-name" placeholder="${esc(t('name_ph'))}" required maxlength="60" autocomplete="nickname">` : ''}
        <input class="input" id="au-email" type="email" placeholder="${esc(t('email'))}" required autocomplete="email"><input class="input" id="au-pass" type="password" placeholder="${esc(t('password'))}" required minlength="6" autocomplete="${authTab === 'signup' ? 'new-password' : 'current-password'}">
        <button class="btn primary lg" type="submit">${esc(authTab === 'signin' ? t('signin') : t('signup'))}</button><div class="small" style="color:var(--danger)" id="au-err"></div>
        ${authTab === 'signin' ? `<button type="button" class="link" style="align-self:center" data-act="forgot">${esc(t('forgot'))}</button>` : ''}</form></div></div>`;
// mục đang bị khoá với khách chưa đăng nhập: vẫn hiện tiêu đề + tranh của mục đó, kèm lời mời đăng nhập / tạo tài khoản
const LOCK_HEAD = { home:['nav_home', null, 'moonwalk'], schedule:['sch_title', 'sch_sub', 'curl'], watch:['watch_title', 'watch_sub', 'gaze'], focus:['focus_title', 'focus_sub', 'umbrella'], blog:['blog_title', 'blog_sub', 'book'], club:['club_title', 'club_sub', 'gaze'], shop:['shop_title', 'shop_sub', 'lantern'], gear:['gear_title', 'gear_sub', 'lantern'], donate:['donate_title', 'donate_sub', 'lantern'], about:['about_title', null, 'moonwalk'] };
PAGES.locked = function(){
  const h = LOCK_HEAD[route.name] || LOCK_HEAD.home;
  page(`${head(h[0], h[1], '', h[2], 3)}<div class="auth-wrap lock-wrap"><div class="lock-note">${ic('lock')}<div><b>${esc(t('lock_title'))}</b><p class="small muted">${esc(t('lock_sub'))}</p></div></div>${authCard(authTab === 'signin' ? t('signin') : t('signup'), t('lock_note'), false)}</div>`);
};
PAGES.account = function(){
  if (!state.user) return page(`<div class="auth-wrap">${authCard(authTab === 'signin' ? t('signin') : t('signup'), t('sync_note'))}</div>`);
  const tab = route.args[0] || 'profile', u = state.user;
  const tabs = [['profile', 'user', t('profile')], ['orders', 'box', t('my_orders')], ['library', 'download', t('my_library')]];
  let body = '';
  if (tab === 'profile') body = `<section class="card pad"><h3 style="margin-bottom:12px">${esc(t('profile'))}</h3><form class="stack" data-form="profile" style="max-width:420px"><div class="field"><label class="label">${esc(t('display_name'))}</label><input class="input" id="pf-name" value="${esc(displayName())}" maxlength="60"></div><div class="field"><label class="label">${esc(t('email'))}</label><input class="input" value="${esc(u.email)}" disabled></div><button class="btn primary" style="align-self:flex-start" type="submit">${esc(t('save'))}</button></form></section>`;
  if (tab === 'profile') body += clubPromo();
  if (tab === 'orders') {
    if (myOrders === null) loadMyOrders();
    body = `<section class="card pad"><h3 style="margin-bottom:6px">${esc(t('my_orders'))}</h3>${myOrders === null ? `<p class="muted">${esc(t('loading'))}</p>` : myOrders.length ? myOrders.map(o => `<div class="ord-row"><div><b class="mono">${esc(o.code)}</b><div class="small muted">${esc((o.items || []).map(i => i.name + ' ×' + i.qty).join(', '))}</div></div><div style="text-align:right"><b>${money(o.total, o.currency)}</b><br><span class="badge ${o.status === 'paid' || o.status === 'shipped' ? 'live' : o.status === 'cancelled' ? 'danger' : 'warn'}">${esc(o.status)}</span></div></div>`).join('') : `<p class="muted">${esc(t('no_orders'))}</p>`}</section>`;
  }
  if (tab === 'library') body = `<section class="card pad"><h3 style="margin-bottom:6px">${esc(t('my_library'))}</h3>${library.length ? library.map(l => `<div class="dl-row"><div><b>${esc(l.name)}</b><div class="small muted mono">${esc(l.orderCode || '')}</div></div><button class="btn primary sm" data-act="download" data-id="${esc(l.id)}">${ic('download', 'sm')} ${esc(t('download'))}</button></div>`).join('') : `<p class="muted">${esc(t('no_library'))}</p>`}</section>`;
  page(`${!u.emailVerified ? `<div class="banner">${ic('mail', 'sm')} <span style="flex:1">${esc(t('verify_banner'))}</span><button class="btn secondary sm" data-act="resendVerify">${esc(t('resend'))}</button></div>` : ''}
    <div class="acct-grid"><aside class="card pad stack" style="align-items:center;text-align:center"><span class="avatar" style="width:64px;height:64px;font-size:1.5rem">${esc((displayName() || '?').slice(0, 1).toUpperCase())}</span><div><h2 style="font-size:1.15rem">${esc(displayName())}</h2><div class="small muted">${esc(u.email)}</div>${state.isAdmin ? `<span class="badge mt-s">Admin</span>` : ''}</div>
      <div class="stack" style="width:100%">${tabs.map(([k, icn, l]) => `<a class="btn ${tab === k ? 'primary' : 'secondary'}" href="#/account/${k}">${ic(icn, 'sm')} ${esc(l)}</a>`).join('')}${state.isAdmin ? `<a class="btn secondary" href="#/admin">${ic('shield', 'sm')} ${esc(t('nav_admin'))}</a>` : ''}<button class="btn ghost" data-act="signout">${ic('logout', 'sm')} ${esc(t('signout'))}</button></div></aside><div>${body}</div></div>`);
};
async function loadMyOrders(){
  if (DEMO) { myOrders = [{ code:'EP-DEMO1', items:[{ name:'30-Day Study Planner (PDF)', qty:1 }], total:79000, currency:'VND', status:'paid' }]; return render(true); }
  try { const s = await db.collection('orders').where('uid', '==', state.user.uid).get(); myOrders = s.docs.map(d => d.data()).sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt)); } catch (e) { myOrders = []; }
  if (route.name === 'account') render(true);
}
FORMS.signin = async () => { try { const stay = state.locked; await auth.signInWithEmailAndPassword($('au-email').value.trim(), $('au-pass').value); if (!stay) location.hash = '#/account'; } catch (e) { $('au-err').textContent = authErr(e); } };
FORMS.signup = async () => {
  try {
    const c = await auth.createUserWithEmailAndPassword($('au-email').value.trim(), $('au-pass').value), name = $('au-name').value.trim();
    await c.user.updateProfile({ displayName:name }); profile.displayName = name;
    await db.collection('users').doc(c.user.uid).set({ displayName:name, email:c.user.email, createdAt:TS() }, { merge:true });
    c.user.sendEmailVerification().then(() => toast(t('verify_sent'))).catch(() => {}); render(true);
  } catch (e) { $('au-err').textContent = authErr(e); }
};
FORMS.profile = async () => {
  const name = $('pf-name').value.trim(); profile.displayName = name;
  try { await state.user.updateProfile({ displayName:name }); if (!DEMO) await db.collection('users').doc(state.user.uid).set({ displayName:name }, { merge:true }); toast(t('saved')); render(true); } catch (e) { toast(e.message); }
};
FORMS.challenge = async () => {
  const btn = $('ch-btn'), codename = $('ch-name').value.trim(), email = $('ch-email').value.trim().toLowerCase();
  btn.disabled = true; btn.textContent = t('ch_sending');
  try {
    if (!DEMO) { await db.collection('challenge_signups').doc(email).set({ codename, email, timestamp:TS() }); await emailjs.send(EMAILJS_SERVICE, EMAILJS_CHALLENGE_TPL, { user_name:codename, user_email:email }); }
    alert(t('ch_ok'));
  } catch (err) { console.error(err); alert(err && err.code === 'permission-denied' ? t('ch_dup') : t('ch_err') + (err.text || err.message || err)); }
  finally { btn.disabled = false; btn.textContent = t('ch_btn'); }
};

/* =========================================================
   ACTIONS của các trang
   ========================================================= */
Object.assign(ACTIONS, {
  week: el => changeWeek(+el.dataset.d),
  plan: el => { const k = el.dataset.k; expanded.has(k) ? expanded.delete(k) : expanded.add(k); render(true); },
  tag: el => { blogTag = el.dataset.tag; render(true); },
  cur: el => { state.currency = el.dataset.c; store.set('currency', state.currency); render(true); renderCart(); },
  product: el => openProduct(el.dataset.id),
  gal: el => { $('gal-main').src = el.dataset.u; },
  addCart: (el, e) => { e.stopPropagation(); cartAdd(el.dataset.id); if (el.dataset.close) closeModal(); },
  openCart: () => { renderCart(); $('cart-drawer').classList.add('open'); },
  closeCart: () => $('cart-drawer').classList.remove('open'),
  cartQty: el => { const c = cart.find(x => x.id === el.dataset.id); if (!c) return; c.qty += +el.dataset.d; if (c.qty <= 0) cart = cart.filter(x => x !== c); else c.qty = Math.min(c.qty, 20); saveCart(); },
  cartDel: el => { cart = cart.filter(x => x.id !== el.dataset.id); saveCart(); },
  checkout: startCheckout,
  copy: el => { try { navigator.clipboard.writeText(el.dataset.v); } catch (e) {} toast(t('copied')); },
  playVideo: el => { playingId = el.dataset.id; if (route.name === 'watch') { render(true); window.scrollTo({ top:0, behavior:'smooth' }); } },
  playLive: () => { playingId = null; render(true); },
  pstart: () => pomo.running ? pomoPause() : pomoStart(),
  'preset-reset': pomoReset,
  pskip: () => pomoComplete(false),
  pmode: el => pomoMode(el.dataset.m),
  ppreset: el => { const p = PRESETS[el.dataset.p]; Object.assign(pomo.cfg, { focus:p.focus, short:p.short, long:p.long, every:p.longEvery }); pomo.cycle = 0; pomoMode('focus'); render(true); },
  todoDel: el => { saveTodos(todos().filter(x => x.id !== el.dataset.id)); renderTodos(); },
  rate: el => { reviewRating = +el.dataset.n; document.querySelectorAll('#rev-stars button').forEach(b => b.classList.toggle('on', +b.dataset.n === reviewRating)); },
  authTab: el => { authTab = el.dataset.t; render(true); },
  forgot: async () => { const m = $('au-email').value.trim(); if (!m) return $('au-err').textContent = t('email') + '?'; try { await auth.sendPasswordResetEmail(m); toast(t('reset_sent')); } catch (e) { $('au-err').textContent = authErr(e); } },
  signout: async () => { if (DEMO) return toast('Demo'); await auth.signOut(); myOrders = null; location.hash = '#/account'; },
  resendVerify: () => state.user.sendEmailVerification().then(() => toast(t('verify_sent'))).catch(e => toast(e.message)),
  download: async el => {
    try {
      if (DEMO) return toast('Demo: không có file');
      const d = await db.collection('products_private').doc(el.dataset.id).get(); if (!d.exists) return alert('Chưa có file cho sản phẩm này — hãy liên hệ chủ trang.');
      const f = d.data(); let url = f.fileUrl; if (f.storagePath && storage) url = await storage.ref(f.storagePath).getDownloadURL();
      if (!url) return alert('Chưa có file cho sản phẩm này — hãy liên hệ chủ trang.'); window.open(url, '_blank', 'noopener');
    } catch (e) { alert(t('err_generic') + e.message); }
  }
});
renderCart();

/* =========================================================
   MOON JOURNEY — điểm danh 30 ngày: trăng khuyết dần đầy, đủ 30 ngày thì trăng tròn
   Dữ liệu lưu trong users/<uid>.moon = { startedAt, days:['YYYY-MM-DD',…], rounds }
   ========================================================= */
const MOON_TOTAL = 30;
const moonData = () => { const m = profile && profile.moon; return m ? { startedAt:m.startedAt || Date.now(), days:Array.isArray(m.days) ? m.days : [], rounds:m.rounds || 0 } : null; };
const todayKey = () => DT.now().setZone(userTZ).toISODate();
async function moonSave(m){
  profile.moon = m;
  if (!DEMO) await db.collection('users').doc(state.user.uid).set({ moon:m }, { merge:true });
  render(true);
}
function clubPromo(){
  const m = moonData(), d = m ? m.days.length : 0;
  return `<section class="card pad club-promo" style="margin-top:34px"><div class="moon-sm">${moonSVG(state.user ? d : 8, MOON_TOTAL)}</div>
    <div><h2 style="font-size:1.4rem" ${cms('club_title')}>${esc(ctext('club_title'))}</h2><p class="muted mt-s" ${cms('club_sub')}>${esc(ctext('club_sub'))}</p>
    <a class="btn primary mt" href="#/club">${state.user && m ? esc(t('club_day', { d:Math.min(d, MOON_TOTAL), t:MOON_TOTAL })) : esc(t('club_start'))}</a></div></section>`;
}
PAGES.club = function(){
  const m = moonData(), d = m ? Math.min(m.days.length, MOON_TOTAL) : 0, full = d >= MOON_TOTAL, doneToday = m && m.days.includes(todayKey());
  let main = '';
  if (!state.user) main = `<div class="card pad stack" style="align-items:center;text-align:center"><div class="moon-big">${moonSVG(6, MOON_TOTAL)}</div><p class="muted">${esc(t('club_login'))}</p><a class="btn primary" href="#/account">${esc(t('club_login_btn'))}</a></div>`;
  else if (!m) main = `<div class="card pad stack" style="align-items:center;text-align:center"><div class="moon-big">${moonSVG(0, MOON_TOTAL)}</div><button class="btn primary lg" data-act="moonStart">${esc(t('club_start'))}</button></div>`;
  else main = `<div class="card pad stack" style="align-items:center;text-align:center"><div class="moon-big ${full ? 'full' : ''}">${moonSVG(d, MOON_TOTAL)}</div>
      <h2 style="font-size:1.5rem">${esc(full ? t('club_full') : t('club_day', { d, t:MOON_TOTAL }))}</h2>
      ${full ? `<p class="muted">${esc(t('club_full_sub'))}</p><button class="btn primary" data-act="moonAgain">${esc(t('club_again'))}</button>` : `<div class="progress" style="width:100%;max-width:300px"><i style="width:${d / MOON_TOTAL * 100}%"></i></div><button class="btn primary lg" data-act="moonCheckin" ${doneToday ? 'disabled' : ''}>${ic('check', 'sm')} ${esc(doneToday ? t('club_done_today') : t('club_checkin'))}</button>`}
      ${m.rounds ? `<div class="small faint">${esc(t('club_rounds', { n:m.rounds }))}</div>` : ''}${state.companion ? `<span class="badge">${ic('heart', 'sm')} ${esc(t('comp_badge'))}</span>` : ''}</div>`;
  const cells = Array.from({ length:MOON_TOTAL }, (_, i) => { const on = m && i < d, next = m && !full && i === d && !doneToday; return `<div class="day-cell ${on ? 'on' : ''} ${next ? 'next' : ''}" title="${on && m.days[i] ? esc(m.days[i]) : ''}">${on ? ic('check', 'sm') : i + 1}</div>`; }).join('');
  page(`${head('club_title', 'club_sub', '', 'gaze', 9)}
    <div class="grid g2" style="align-items:start">${main}
      <div class="stack"><section class="card pad"><div class="card-h"><h3>${esc(t('club_calendar'))}</h3></div><div class="days30">${cells}</div></section>
        <section class="card pad"><h3 style="margin-bottom:10px">${esc(t('club_how'))}</h3><ol class="steps"><li>${esc(t('club_how1'))}</li><li>${esc(t('club_how2'))}</li><li>${esc(t('club_how3'))}</li></ol></section></div></div>
    <h2 style="font-size:1.2rem;margin:34px 0 14px">${esc(t('club_remind'))}</h2>${challengeCard()}`);
};

/* =========================================================
   DONATE / COMPANIONS
   ========================================================= */
let donAmt = null, donCur = null;
const parseAmts = (s, d) => { const a = String(s || '').split(/[,\s]+/).map(Number).filter(n => n > 0); return a.length ? a : d; };
/* mục cảm ơn những người đồng hành (tên do admin chọn hiện, xem tab Thành viên) */
const thanksCard = () => { const l = thanksList(); return l.length ? `<section class="card pad thanks mt"><div class="card-h"><h2 ${cms('thanks_title')}>${ic('heart', 'sm')} ${esc(ctext('thanks_title'))}</h2></div><p class="muted small" ${cms('thanks_text')}>${esc(ctext('thanks_text'))}</p><div class="thanks-list">${l.map(x => `<span class="thanks-chip">${ic('heart', 'sm')} ${esc(x.name)}</span>`).join('')}</div></section>` : ''; };
PAGES.donate = function(){
  const cur = donCur || effCurrency(), amts = cur === 'VND' ? parseAmts(payments.donateVND, [20000, 50000, 100000, 200000]) : parseAmts(payments.donateUSD, [3, 5, 10, 25]);
  const amt = donAmt && donAmt.cur === cur ? donAmt.v : amts[1] || amts[0], hasBank = payments.bankBin && payments.accountNo;
  let pay = '';
  if (cur === 'VND') {
    pay = hasBank ? `<img class="qr" alt="VietQR" src="https://img.vietqr.io/image/${encodeURIComponent(payments.bankBin)}-${encodeURIComponent(payments.accountNo)}-compact2.png?amount=${amt}&addInfo=${encodeURIComponent('EP DONATE')}&accountName=${encodeURIComponent(payments.accountName || '')}"><p class="small muted" style="text-align:center">${esc(t('donate_scan'))}</p>
      <div class="kv"><div class="kvr"><span>${esc(t('acc_no'))}</span><b>${esc(payments.accountNo)}</b><button type="button" class="btn secondary sm" data-act="copy" data-v="${esc(payments.accountNo)}">${esc(t('copy'))}</button></div><div class="kvr"><span>${esc(t('donate_note'))}</span><b>EP DONATE</b><button type="button" class="btn secondary sm" data-act="copy" data-v="EP DONATE">${esc(t('copy'))}</button></div></div>${payments.momoPhone ? `<div class="small muted">MoMo: <b>${esc(payments.momoPhone)}</b></div>` : ''}` : '';
  } else {
    const pp = payments.paypal ? (/paypal\.me\//i.test(payments.paypal) ? payments.paypal.replace(/\/+$/, '') + '/' + amt + 'USD' : payments.paypal) : '';
    pay = [pp && `<a class="btn primary lg" target="_blank" rel="noopener" href="${esc(pp)}">PayPal · $${amt}</a>`, payments.kofi && `<a class="btn secondary lg" target="_blank" rel="noopener" href="${esc(payments.kofi)}">Ko-fi</a>`, payments.stripe && `<a class="btn secondary lg" target="_blank" rel="noopener" href="${esc(payments.stripe)}">${ic('credit', 'sm')} Card</a>`].filter(Boolean).join(' ');
    pay = pay ? `<div class="row">${pay}</div>` : '';
  }
  page(`${head('donate_title', 'donate_sub', '', 'lantern', 3)}
    <div class="grid g2" style="align-items:start">
      <section class="card pad stack"><div class="row between"><h2 style="font-size:1.2rem">${esc(t('donate_once'))}</h2><div class="seg"><button type="button" class="${cur === 'VND' ? 'on' : ''}" data-act="donCur" data-c="VND">VND</button><button type="button" class="${cur === 'USD' ? 'on' : ''}" data-act="donCur" data-c="USD">USD</button></div></div>
        <div class="row">${amts.map(a => `<button type="button" class="chip ${a === amt ? 'on' : ''}" data-act="donAmt" data-v="${a}">${money(a, cur)}</button>`).join('')}</div>
        <div class="field"><label class="label">${esc(t('donate_custom'))}</label><input class="input" type="number" min="1" id="don-custom" data-change="donCustom" placeholder="${cur === 'VND' ? '30000' : '7'}"></div>
        ${pay || `<p class="muted">${esc(t('donate_none'))}</p>`}<p class="small faint">${esc(t('donate_thanks'))}</p></section>
      <section class="card pad stack"><div class="row between"><h2 style="font-size:1.2rem" ${cms('comp_title')}>${esc(ctext('comp_title'))}</h2>${state.companion ? `<span class="badge">${ic('heart', 'sm')} ${esc(t('comp_badge'))}</span>` : ''}</div>
        <p class="muted" ${cms('comp_text')}>${esc(ctext('comp_text'))}</p><div><div class="label">${esc(t('comp_perks'))}</div><ul class="perks"><li ${cms('comp_perk1')}>${esc(ctext('comp_perk1'))}</li><li ${cms('comp_perk2')}>${esc(ctext('comp_perk2'))}</li><li ${cms('comp_perk3')}>${esc(ctext('comp_perk3'))}</li></ul></div>
        ${branding.focusCodeHash ? `<div><div class="label">${esc(t('comp_steps_title'))}</div><ol class="steps"><li>${esc(t('comp_step1'))}</li><li>${esc(t('comp_step2'))}</li><li>${esc(t('comp_step3'))}</li></ol></div>${unlockBox()}` : ''}${state.companion || unlockValid() ? `<p class="small" style="color:var(--live)">${esc(t('comp_active'))}</p>` : ''}${payments.companionUrl ? `<a class="btn primary lg" target="_blank" rel="noopener" href="${esc(payments.companionUrl)}">${ic('heart', 'sm')} ${esc(t('comp_cta'))}</a>` : ''}</section></div>${thanksCard()}`);
};
CHANGES.donCustom = el => { const v = Math.round(+el.value); if (v > 0) { donAmt = { cur:donCur || effCurrency(), v }; render(true); } };
Object.assign(ACTIONS, {
  donCur: el => { donCur = el.dataset.c; donAmt = null; render(true); },
  donAmt: el => { donAmt = { cur:donCur || effCurrency(), v:+el.dataset.v }; render(true); },
  moonStart: () => moonSave({ startedAt:Date.now(), days:[], rounds:0 }),
  moonAgain: () => { const m = moonData(); moonSave({ startedAt:Date.now(), days:[], rounds:(m ? m.rounds : 0) + 1 }); },
  moonCheckin: () => {
    const m = moonData(); if (!m) return; const k = todayKey(); if (m.days.includes(k)) return toast(t('club_done_today'));
    m.days.push(k); moonSave(m).then(() => { if (m.days.length >= MOON_TOTAL) toast(t('club_full')); });
  }
});