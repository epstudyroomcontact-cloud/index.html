'use strict';
/* =========================================================
   PAGES — Tổng quan, Lịch, Xem live, Phòng tập trung, Blog, Shop + giỏ hàng, Giới thiệu, Tài khoản
   ========================================================= */
const isPhone = () => window.matchMedia && window.matchMedia('(max-width:760px)').matches;
const phoneNote = () => isPhone() && !store.get('phone_note_off', false) ? `<aside class="phone-note" role="note"><div><b>${esc(t('phone_note_title'))}</b><p>${esc(t('phone_note_text'))}</p></div><button type="button" class="btn secondary sm" data-act="phoneNoteOff">${esc(t('phone_note_ok'))}</button></aside>` : '';   // giải thích vì sao web ưu tiên máy tính, chỉ hiện trên điện thoại và bấm "Đã hiểu" là không hiện nữa
/* ghi chú "có gì mới" đóng được (nhớ trong máy): key = new_focus / new_tease / new_pl; có href thì thêm nút dẫn tới trang đó */
const hintNote = (key, href) => store.get('hint_' + key, false) ? '' : `<aside class="phone-note hint-note" role="note"><div><b>${esc(t(key + '_title'))}</b><p>${esc(t(key + '_text'))}</p></div><span class="row" style="flex:none;gap:6px">${href ? `<a class="btn primary sm" href="${esc(safeUrl(href))}" data-act="hintOff" data-key="${key}">${esc(t(key + '_link'))}</a>` : ''}<button type="button" class="btn secondary sm" data-act="hintOff" data-key="${key}">${esc(t('phone_note_ok'))}</button></span></aside>`;
const page = html => { const el = $('page'); el.dataset.route = route.name; el.innerHTML = phoneNote() + html; };   // data-route: CSS chỉnh riêng từng trang (vd. ảnh đầu trang thấp hơn)
/* gom vài thẻ thành tab, mỗi lần chỉ hiện 1 thẻ cho đỡ phải cuộn. TABS nhớ tab đang mở của từng nhóm nên trang vẽ lại vẫn giữ đúng tab.
   list: [[khoá, nhãn, html], ...]; cls: lớp thêm cho khung ngoài */
const TABS = {};
function tabsHTML(id, list, cls = ''){
  const cur = list.some(x => x[0] === TABS[id]) ? TABS[id] : list[0][0];
  return `<div class="tabset ${cls}" data-tabs="${id}"><div class="tab-bar" role="tablist">${list.map(([k, l]) => `<button type="button" role="tab" class="chip ${k === cur ? 'on' : ''}" aria-selected="${k === cur}" data-act="tabPick" data-g="${id}" data-k="${k}">${esc(l)}</button>`).join('')}</div>
    ${list.map(([k, , h]) => `<div class="tab-pane" role="tabpanel" data-k="${k}"${k === cur ? '' : ' hidden'}>${h}</div>`).join('')}</div>`;
}
const fmtDate = ts => DT.fromMillis(tsMs(ts)).setLocale(state.lang).toLocaleString(DT.DATE_MED);
const stars = n => `<span class="stars" aria-label="${n}/5">${[1,2,3,4,5].map(i => `<svg class="ic ${i <= n ? '' : 'off'}"><use href="#i-star"/></svg>`).join('')}</span>`;
const emptyBox = (icon, title, sub) => `<div class="empty"><div class="ico">${ic(icon, 'lg')}</div><h3>${esc(title)}</h3><p>${esc(sub || '')}</p></div>`;
/* tranh: ảnh do admin đặt (cimg) hoặc tranh vẽ sẵn bằng paint(cảnh, {crop, seed}) */
const artOr = (key, scene, opt) => { const u = cimg(key); return u ? `<img class="art" alt="" src="${esc(u)}">` : paint(scene, opt); };
const helpBtn = () => ['home', 'watch'].includes(route.name) ? '' : `<button type="button" class="moon-help" data-act="pageHelp" data-p="${route.name}" title="${esc(t('nav_guide'))}" aria-label="${esc(t('nav_guide'))}">${ic('info', 'sm')}<span>${esc(t('nav_guide'))}</span></button>`;   // nút hướng dẫn riêng của trang, Moon chỉ nhanh bằng hình (guide.js)
const head = (titleKey, subKey, right = '', scene = 'moonwalk', seed = 1) => `<section class="art-head" data-cms-img="banner_${titleKey}">${artOr('banner_' + titleKey, scene, { crop:'banner', seed })}${helpBtn()}<div class="glass"><h1 ${cms(titleKey)}>${esc(ctext(titleKey))}</h1>${subKey ? `<p ${cms(subKey)}>${esc(ctext(subKey))}</p>` : ''}</div></section>${right ? `<div class="row between" style="margin-bottom:18px">${right}</div>` : ''}`;
const labelOf = s => s.name || (s.type === 'focus' ? `${t('focus')} ${s.n}` : s.type === 'short' ? t('short_break') : s.type === 'prep' ? t('prep_break') : t('long_break'));
const segBar = (segs, total) => `<div class="pomo-bar">${segs.map(s => `<i class="${s.type[0]}" style="width:${(s.min / total * 100).toFixed(2)}%" title="${esc(labelOf(s))} · ${s.min}′"></i>`).join('')}</div>`;
const expanded = new Set();

/* =========================================================
   SCHEDULE blocks
   ========================================================= */
// dòng tóm tắt một buổi: dãy tuỳ chỉnh, mẫu Pomodoro, hoặc số giờ
function slotChip(s, mins){
  const segs = slotSegs(s);
  if (s.plan && s.plan.length) { const f = segs.filter(g => g.type === 'focus'), fm = f.reduce((a, g) => a + g.min, 0), bm = segs.filter(g => g.type === 'short' || g.type === 'long').reduce((a, g) => a + g.min, 0); return t('plan_chip', { n:f.length, f:fm, b:bm }); }
  if (s.pomo) return t('pomo_chip', { n:s.pomo.rounds, f:s.pomo.focus, s:s.pomo.short, l:s.pomo.long });
  return t('session_h', { h:+(mins / 60).toFixed(2) });
}
function slotCard(x){
  const s = x.slot, su = x.start.setZone(userTZ), eu = x.end.setZone(userTZ), nowMs = Date.now();
  const live = isLive(x, nowMs) && nowMs < su.plus({ days:1 }).startOf('day').toMillis(), wait = !live && isWaiting(x, nowMs);   // sau nửa đêm thì thẻ "tiếp nối" ở ngày sau báo live
  // đã bấm bắt đầu trễ/sớm: giờ trên thẻ là giờ thật, ghi thêm giờ dự kiến cho người xem đối chiếu
  const moved = x.started && x.start.toMillis() !== x.sched.toMillis() ? `<span class="daymark">${esc(t('live_moved', { t:x.sched.setZone(userTZ).toFormat('HH:mm') }))}</span>` : '';
  // buổi kéo qua nửa đêm (giờ của người xem): ghi rõ ngày kết thúc, phần sau nửa đêm cũng hiện ở ngày hôm sau (contCard)
  const mark = eu.toISODate() !== su.toISODate() ? `<span class="daymark">${esc(t('ends_on', { d:eu.setLocale(state.lang).toFormat('ccc'), t:eu.toFormat('HH:mm') }))}</span>` : '';
  let bar = '', plan = '', toggle = '';
  const segs = slotSegs(s);
  if (segs) {
    const total = planMins(segs); let cur = su;
    bar = segBar(segs, total);
    plan = `<ol class="plan ${expanded.has(x.key) ? 'open' : ''}">` + segs.map(g => { const a = cur; cur = cur.plus({ minutes:g.min }); return `<li><i style="background:var(--seg-${g.type === 'focus' ? 'focus' : g.type})"></i><span>${a.toFormat('HH:mm')}</span><span>${esc(labelOf(g))}</span><span>${g.min}′</span></li>`; }).join('') + `<li><i></i><span></span><span class="faint">${esc(t('total_min', { m:total }))}</span><span></span></li></ol>`;
    toggle = `<button type="button" class="plan-toggle" data-act="plan" data-k="${x.key}">${esc(expanded.has(x.key) ? t('hide_plan') : t('show_plan'))}</button>`;
  }
  const chip = `<div class="pomo-chip">${esc(slotChip(s, x.mins))}</div>`;
  const note = L(s.cancelNote) || L(x.day.cancelNote), reason = x.cancelled && note ? ': ' + esc(note) : '';   // huỷ cả ngày (giờ VN) thì báo trên từng buổi, vì ở giờ người xem các buổi có thể rơi vào ngày khác
  const url = watchUrl();
  return `<div class="slot ${live ? 'is-live' : ''} ${x.cancelled ? 'is-cancel' : ''}">
    <div class="slot-top"><span class="s-time">${su.toFormat('HH:mm')} – ${eu.toFormat('HH:mm')}</span>${mark}${moved}${live ? `<span class="badge live">${esc(t('live_now'))}</span>` : wait ? `<span class="badge warn">${esc(t('live_waiting'))}</span>` : ''}</div>
    ${s.title ? `<div class="s-title">${esc(s.title)}</div>` : ''}${bar}${chip}${plan}${toggle}
    ${state.isAdmin ? `<button type="button" class="btn secondary sm mt-s" style="width:100%" data-act="qeOpen" data-o="${x.off}" data-d="${x.di}" data-s="${x.si}">${ic('pen', 'sm')} Sửa buổi này</button>` : ''}
    ${live && url ? `<a class="btn primary sm mt-s" style="width:100%" href="#/watch">${ic('play', 'sm')} ${esc(t('watch'))}</a>` : ''}
    ${x.cancelled ? `<div class="ribbon">${esc(t('cancelled'))}${reason}</div>` : ''}</div>`;
}
// phần còn lại của một buổi bắt đầu từ hôm trước (theo giờ người xem), hiện ở đầu ngày `d`
function contCard(x, d){
  const su = x.start.setZone(userTZ), eu = x.end.setZone(userTZ), nowMs = Date.now(), dEnd = d.plus({ days:1 });
  const live = isLive(x, nowMs) && nowMs >= d.toMillis() && nowMs < dEnd.toMillis(), url = watchUrl();
  return `<div class="slot is-cont ${live ? 'is-live' : ''} ${x.cancelled ? 'is-cancel' : ''}">
    <div class="slot-top"><span class="s-time">00:00 – ${eu < dEnd ? eu.toFormat('HH:mm') : '24:00'}</span>${live ? `<span class="badge live">${esc(t('live_now'))}</span>` : ''}</div>
    <div class="pomo-chip">${esc(t('cont_from', { d:su.setLocale(state.lang).toFormat('ccc'), t:su.toFormat('HH:mm') }))}${x.slot.title ? ' · ' + esc(x.slot.title) : ''}</div>
    ${live && url ? `<a class="btn primary sm mt-s" style="width:100%" href="#/watch">${ic('play', 'sm')} ${esc(t('watch'))}</a>` : ''}
    ${x.cancelled ? `<div class="ribbon">${esc(t('cancelled'))}</div>` : ''}</div>`;
}
const tzName = dt => `${dt.zoneName.replace(/_/g, ' ')} (GMT${dt.toFormat('Z')})`;
const legendHTML = () => `<div class="legend"><span><i style="background:var(--seg-focus)"></i>${esc(t('focus'))}</span><span><i style="background:var(--seg-short)"></i>${esc(t('short_break'))}</span><span><i style="background:var(--seg-long)"></i>${esc(t('long_break'))}</span><span><i style="background:var(--seg-prep)"></i>${esc(t('prep_break'))}</span></div>`;

PAGES.schedule = function(){
  // mọi giờ đổi sang múi giờ của người xem: mỗi buổi nằm đúng ngày nó bắt đầu ở chỗ họ, "Hôm nay" cũng theo giờ của họ
  const ls = localWeekStart(weekOffset), we = ls.plus({ days:6 }), nowL = DT.now().setZone(userTZ), todayL = nowL.toISODate();
  const offs = weeksFor(weekOffset), all = offs.flatMap(o => weekDocs[o] ? getItems(o, weekDocs[o]) : []).sort((a, b) => a.start - b.start);
  const offDays = {};                              // ngày nghỉ (đặt theo ngày VN) gắn vào ngày cùng ngày-tháng ở trang này
  offs.forEach(o => (weekDocs[o] || []).forEach((raw, i) => { const day = normDay(raw); if (day.cancelled) offDays[weekStart(o).plus({ days:i }).toISODate()] = day; }));
  let rows = '';
  for (let i = 0; i < 7; i++) {
    const d = ls.plus({ days:i }), dEnd = d.plus({ days:1 }), key = d.toISODate(), isToday = key === todayL, off = offDays[key];
    const conts = all.filter(x => x.start < d && x.end > d), its = all.filter(x => x.start >= d && x.start < dEnd);
    const has = conts.length || its.length;
    rows += `<div class="arow ${isToday ? 'today' : ''} ${off && !has ? 'is-off' : ''}">
      <div class="a-day"><b>${esc((DAYS[state.lang] || DAYS.en)[i])}</b><span>${d.toFormat('dd/MM')}</span>${isToday ? `<span class="badge">${esc(t('today'))}</span>` : ''}</div>
      ${has || off ? `<div class="a-slots">${off ? `<div class="a-off">${esc(t('day_off'))}${L(off.cancelNote) ? ' — ' + esc(L(off.cancelNote)) : ''}</div>` : ''}${conts.map(x => contCard(x, d)).join('')}${its.map(slotCard).join('')}</div>` : `<div class="a-none">${esc(t('rest'))}</div>`}</div>`;
  }
  page(`${head('sch_title', 'sch_sub', `<div class="week-nav"><button class="btn secondary icon" data-act="week" data-d="-1" aria-label="prev">${ic('chev-l')}</button><span class="lbl">${ls.toFormat('dd/MM')} – ${we.toFormat('dd/MM')}</span><button class="btn secondary icon" data-act="week" data-d="1" aria-label="next">${ic('chev-r')}</button></div>`, 'curl', 2)}
    <div class="row between" style="margin-bottom:16px">${legendHTML()}<span class="small faint">${esc(t('tz_label'))}: <b class="mono">${esc(tzName(nowL))}</b>${/Ho_Chi_Minh|Saigon/.test(userTZ) ? '' : ' · ' + esc(t('tz_auto'))}</span></div>
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
const HOME_KEYS = ['hero', 'about', 'stats', 'today', 'blog', 'shop', 'thanks', 'challenge', 'faq'];
function homeOrder(){ const o = (Array.isArray(branding.homeOrder) ? branding.homeOrder : []).filter(k => HOME_KEYS.includes(k)); return [...new Set(o), ...HOME_KEYS.filter(k => !o.includes(k))]; }
PAGES.home = function(){
  const hs = branding.homeSections || {}, on = k => hs[k] !== false, nowUser = DT.now().setZone(userTZ), hr = nowUser.hour;
  const hello = t(hr < 12 ? 'hello_m' : hr < 18 ? 'hello_a' : 'hello_e') + (state.user ? ', ' + displayName() : '');
  const wk = getItems(0, weekDocs[0]).filter(x => !x.cancelled), hours = wk.reduce((a, x) => a + x.mins, 0) / 60, fm = focusToday(), avg = ratingAvg(), tItems = todayItems();
  const heroImg = cimg('hero_img') || branding.mascotUrl;
  const S = {}; let html = '';   // mỗi khối vào S[khoá] rồi ghép theo thứ tự admin chọn (branding.homeOrder)
  if (on('about')) { html += `<div class="home-about">${aboutIntroHTML()}</div>`; S.about = html; html = ''; }   // giới thiệu về chủ kênh (mặc định ngay dưới khối chào)
  if (on('hero')) html += `<section class="hero" data-cms-img="hero_img">${heroImg ? `<img class="art" alt="" src="${esc(heroImg)}">` : paint('moonwalk', { crop:'full', seed:1 })}${helpBtn()}<div class="hero-copy">
      <span class="badge">${esc(hello)}</span>
      <h1 ${cms('home_title')}>${esc(ctext('home_title'))}</h1>
      <p class="lead" ${cms('home_sub')}>${esc(ctext('home_sub'))}</p>
      <div class="cta"><a class="btn primary lg" href="#/watch">${ic('play', 'sm')} ${esc(t('btn_watch_live'))}</a><a class="btn secondary lg" href="#/schedule">${ic('calendar', 'sm')} ${esc(t('btn_see_schedule'))}</a></div>
      <div class="clock mt" data-clock>--:--:--</div></div>
      <div class="next-card" id="next-card"><span class="live-pill" style="padding:5px 8px"><i></i></span><div><small></small><b>—</b></div></div></section>`;
  if (branding.groupOn === true) html += `<section class="card pad grp grp-home mt" id="grp-home"><div class="card-h"><h2>${ic('users', 'sm')} ${esc(t('grp_title'))}</h2></div><p class="muted small">${esc(t('loading'))}</p></section>`;   // ai đang học: nằm ngay dưới khối chào
  if (html) html += trialNudge();
  S.hero = html; html = '';
  if (on('stats')) html += `<div class="grid g4 keep2 mt">
      <div class="card tile"><span class="t-ic">${ic('calendar')}</span><span class="t-l">${esc(t('stat_lives'))}</span><span class="t-v">${wk.length}</span></div>
      <div class="card tile"><span class="t-ic">${ic('timer')}</span><span class="t-l">${esc(t('stat_hours'))}</span><span class="t-v">${+hours.toFixed(1)}<small style="font-size:.9rem;font-weight:600"> ${esc(t('h'))}</small></span></div>
      <div class="card tile"><span class="t-ic">${ic('check')}</span><span class="t-l">${esc(t('stat_focus_today'))}</span><span class="t-v">${fm}<small style="font-size:.9rem;font-weight:600"> ${esc(t('min'))}</small></span></div>
      <div class="card tile"><span class="t-ic">${ic('star')}</span><span class="t-l">${esc(t('stat_rating'))}</span><span class="t-v">${avg ? avg.toFixed(1) : '—'}</span><span class="t-s">${reviews.length ? reviews.length + ' ' + esc(t('reviews_title')).toLowerCase() : ''}</span></div></div>`;
  S.stats = html; html = '';
  if (on('today')) {
    const v0 = videos[0];
    html += `<div class="grid g-main mt">
      <section class="card pad"><div class="card-h"><h2 ${cms('sec_today')}>${esc(ctext('sec_today'))}</h2><a class="link" href="#/schedule">${esc(t('nav_schedule'))} ${ic('arrow', 'sm')}</a></div>
        ${tItems.length ? tItems.map(x => { const su = x.start.setZone(userTZ), eu = x.end.setZone(userTZ), live = isLive(x, Date.now()), wait = isWaiting(x, Date.now());
          return `<div class="today-item ${live ? 'live' : ''} ${x.cancelled ? 'off' : ''}"><span class="tm">${su.toFormat('HH:mm')} – ${eu.toFormat('HH:mm')}</span><div style="flex:1;min-width:0">${x.slot.title ? `<div style="font-weight:600;font-size:.9rem">${esc(x.slot.title)}</div>` : ''}<div class="pomo-chip">${esc(slotChip(x.slot, x.mins))}</div></div>${live ? `<span class="badge live">${esc(t('live_now'))}</span>` : wait ? `<span class="badge warn">${esc(t('live_waiting'))}</span>` : x.cancelled ? `<span class="badge danger">${esc(t('cancelled'))}</span>` : ''}</div>`; }).join('') : emptyBox('calendar', t('nothing_today'), '')}</section>
      <div class="stack">
        <section class="card pad"><div class="card-h"><h2>${esc(t('nav_focus'))}</h2><span class="badge" data-pomo-mode>${esc(t('mode_focus'))}</span></div>
          <div class="mono" style="font-size:2.6rem;font-weight:700;letter-spacing:-.04em" data-pomo-time>25:00</div><a class="btn primary mt-s" href="#/focus">${ic('timer', 'sm')} ${esc(t('btn_start_focus'))}</a></section>
        ${v0 ? `<a class="card vcard" href="#/watch" data-act="playVideo" data-id="${esc(v0.id)}" style="padding:12px"><div class="th"><img loading="lazy" alt="" src="https://i.ytimg.com/vi/${esc(v0.id)}/hqdefault.jpg"></div><h4>${esc(v0.title || t('latest_videos'))}</h4></a>` : ''}
      </div></div>`;
  }
  S.today = html; html = '';
  if (branding.groupOn === true) loadGroup().then(() => window.EPGroup.mount()).catch(() => { const b = $('grp-home'); if (b) b.remove(); });
  if (on('blog') && livePosts().length) S.blog = secHead('sec_blog', '#/blog') + `<div class="pgrid home-peek">${livePosts().slice(0, 3).map(blogCard).join('')}</div>`;
  if (on('shop') && products.length) S.shop = secHead('sec_shop', '#/shop') + `<div class="pgrid home-peek">${products.slice(0, 3).map(prodCard).join('')}</div>`;
  if (on('thanks') && thanksList().length) S.thanks = thanksCard();
  if (on('challenge')) S.challenge = clubPromo();
  if (hs.faq !== undefined ? hs.faq : on('about')) S.faq = aboutFaqHTML() + aboutReviewsHTML();   // FAQ rồi đánh giá (mặc định nằm cuối trang)
  html = homeOrder().map(k => S[k] || '').join('');
  page(html);
};

/* =========================================================
   WATCH
   ========================================================= */
let playingId = null, watchLive = false;
/* Chưa tới giờ live: đừng nhúng khung live (YouTube báo "video không hoạt động"). Thay vào đó chiếu video đã live gần nhất mà YouTube cho nhúng (hỏi oEmbed, nhớ kết quả trong phiên); không có video nào dùng được thì hiện thông báo chưa phát sóng. */
const ytOK = (() => { try { return JSON.parse(sessionStorage.getItem('yt_ok') || '{}'); } catch (e) { return {}; } })();
let ytBusy = false;
function pickPlayable(){
  const ids = videos.filter(v => v.id).slice(0, 6).map(v => v.id), good = ids.find(id => ytOK[id] === true); if (good) return good;
  const pending = ids.filter(id => ytOK[id] === undefined);
  if (pending.length && !ytBusy) {
    ytBusy = true;
    (async () => {
      for (const id of pending) {
        try { const r = await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + id)); ytOK[id] = r.ok; }
        catch (e) { ytOK[id] = true; }                          // không hỏi được (mạng / chặn) thì cứ thử phát
        if (ytOK[id]) break;
      }
      ytBusy = false; try { sessionStorage.setItem('yt_ok', JSON.stringify(ytOK)); } catch (e) {}
      if (route.name === 'watch' || route.name === 'focus') render(true);
    })();
  }
  return null;
}
const liveEmbedSrc = () => branding.ytLiveId ? `https://www.youtube.com/embed/${youTubeId(branding.ytLiveId)}?rel=0` : (branding.ytChannelId ? `https://www.youtube.com/embed/live_stream?channel=${encodeURIComponent(branding.ytChannelId)}` : '');
PAGES.watch = function(){
  const liveSrc = liveEmbedSrc(), { live, waiting, next } = liveState(), url = watchUrl(), replay = !playingId && !live && !watchLive, pv = replay ? pickPlayable() : null;
  const src = playingId ? `https://www.youtube-nocookie.com/embed/${playingId}?autoplay=1&rel=0` : (live || watchLive) ? liveSrc : pv ? `https://www.youtube-nocookie.com/embed/${pv}?rel=0` : '';
  page(`${head('watch_title', 'watch_sub', url ? `<a class="btn secondary" target="_blank" rel="noopener" href="${esc(safeUrl(url))}">${ic('link', 'sm')} ${esc(t('open_youtube'))}</a>` : '', 'gaze', 5)}
    <div class="grid g-main"><div><div class="player">${src ? `<iframe src="${esc(src)}" title="YouTube" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin"></iframe>` : `<div class="ph">${paint('gaze', { crop:'banner', seed:4 })}<div class="glass" style="position:relative"><h3 style="margin-bottom:4px">${esc(t('offline'))}</h3><p class="muted small">${esc(t('offline_sub'))}</p></div></div>`}</div>${replay && pv ? `<p class="small muted mt-s">${esc(t('stream_replay'))}</p>` : ''}</div>
      <aside class="card pad stack"><div class="row between"><b>${esc(live ? t('live_now') : t('nav_schedule'))}</b>${live ? `<span class="badge live">LIVE</span>` : ''}</div>
        <div class="card pad" style="background:var(--surface2)"><div class="small muted">${esc(live ? t('live_now') : waiting ? t('live_waiting') : next ? t('next_live') : t('no_next'))}</div><div class="mono" id="next-card-w" style="font-size:1.5rem;font-weight:700;color:var(--accent-strong)">${live ? `${live.start.setZone(userTZ).toFormat('HH:mm')} – ${live.end.setZone(userTZ).toFormat('HH:mm')}` : waiting ? esc(t('live_waiting_b', { t:waiting.sched.setZone(userTZ).toFormat('HH:mm') })) : next ? `${next.start.setZone(userTZ).toFormat('ccc HH:mm')}` : '—'}</div></div>
        ${playingId ? `<button class="btn secondary" data-act="playLive">${ic('play', 'sm')} ${esc(t('nav_watch'))}</button>` : replay ? `<button class="btn secondary" data-act="watchCheckLive">${ic('play', 'sm')} ${esc(t('watch_check_live'))}</button>` : ''}
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
function audio(){ if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (actx && actx.state !== 'running' && actx.state !== 'closed') { const r = actx.resume(); if (r && r.catch) r.catch(() => {}); } return actx; }
/* ---- Âm thanh nền tự tạo (không cần mạng, không bản quyền): mưa / ồn nâu / ồn trắng ----
   Mỗi âm được "thu" một lần bằng OfflineAudioContext thành một đoạn stereo 16 giây rồi phát lặp liền mạch (hai đầu hoà vào nhau 2 giây,
   không nghe thấy chỗ nối), nên lúc phát gần như không tốn máy. Hai tai nghe hai luồng nhiễu độc lập nên có độ rộng, không bị "dẹt" như một luồng mono.
   - Mưa: lớp mưa rì rào mịn (nhiễu hồng lọc 600-6500 Hz, độ to nhấp nhô chậm) + hàng nghìn giọt riêng lẻ mỗi giọt một cao độ, độ to, độ tắt dần và vị trí trái/phải
     ngẫu nhiên + vài giọt to trầm + tiếng ào xa rất trầm. Không còn tiếng "xì" the thé của nhiễu trắng thô.
   - Ồn nâu: nhiễu nâu lọc 40-1100 Hz, ấm và sâu như thác nước xa / tiếng quạt trầm.
   - Ồn trắng: nhiễu trắng cắt 60 Hz - 11 kHz rồi hạ nhẹ dải chói trên 5 kHz, vẫn đều phẳng nhưng không chói tai.
   Cả ba chuẩn hoá cùng một độ to (RMS) nên đổi qua lại không bị chói hay nhỏ đột ngột; đổi âm và đổi âm lượng đều có lướt mượt, không bị "tách". */
const AMB = ['off', 'rain', 'brown', 'white'];
let ambType = 'off', ambVol = store.get('ambvol', .5), ambNode = null, ambTok = 0;
const AMB_LEN = 16, AMB_X = 2, AMB_RMS = .16, ambCache = {};
const ambGain = () => Math.pow(ambVol, 1.3);
function ambNoise(len, kind){
  const d = new Float32Array(len);
  if (kind === 'brown') { let last = 0; for (let i = 0; i < len; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; } }
  else if (kind === 'pink') { let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; b0 = .99886 * b0 + w * .0555179; b1 = .99332 * b1 + w * .0750759; b2 = .969 * b2 + w * .153852; b3 = .8665 * b3 + w * .3104856; b4 = .55 * b4 + w * .5329522; b5 = -.7616 * b5 - w * .016898; d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362) * .11; b6 = w * .115926; } }
  else for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return d;
}
// Rải các giọt mưa vào hai kênh: mỗi giọt là một cụm nhiễu ngắn qua bộ lọc dải (cao độ, độ nhọn, độ to, độ tắt dần, vị trí trái/phải ngẫu nhiên)
function ambDrops(dat, sr, rate, fr, qr, pk, dc){
  const N = dat[0].length;
  for (let t = 0; t < N / sr - .1; t += -Math.log(1 - Math.random()) / rate) {
    const f = fr[0] + Math.pow(Math.random(), fr[2]) * (fr[1] - fr[0]), q = qr[0] + Math.random() * (qr[1] - qr[0]), peak = pk[0] + Math.pow(Math.random(), pk[2]) * (pk[1] - pk[0]), decay = dc[0] + Math.random() * (dc[1] - dc[0]);
    const pan = (Math.random() * 1.8 - .9 + 1) * Math.PI / 4, gl = Math.cos(pan), gr = Math.sin(pan);
    const w0 = 2 * Math.PI * f / sr, al = Math.sin(w0) / (2 * q), a0 = 1 + al, b0 = al / a0, b2 = -al / a0, a1 = -2 * Math.cos(w0) / a0, a2 = (1 - al) / a0;
    const n = Math.round((decay + .02) * sr), i0 = Math.round(t * sr), k = Math.log(1e-4 / peak) / (decay * sr); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < n && i0 + i < N; i++) {
      const x = Math.random() * 2 - 1, y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y;
      const env = i < sr * .0015 ? peak * i / (sr * .0015) : peak * Math.exp(k * (i - sr * .0015)), v = y * env; dat[0][i0 + i] += v * gl; dat[1][i0 + i] += v * gr;
    }
  }
}
function ambRender(type, sr){
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!OAC) return Promise.reject(new Error('no offline'));
  const total = Math.round((AMB_LEN + AMB_X) * sr), dur = total / sr, off = new OAC(2, total, sr);
  const flt = (ty, f, q) => { const n = off.createBiquadFilter(); n.type = ty; n.frequency.value = f; if (q) n.Q.value = q; return n; };
  const noise = (kind, n = total) => { const b = off.createBuffer(1, n, sr); b.getChannelData(0).set(ambNoise(n, kind)); const sc = off.createBufferSource(); sc.buffer = b; return sc; };
  const master = off.createGain(), merger = off.createChannelMerger(2); master.connect(off.destination);
  const lpMaster = flt('lowpass', 9500, .5); lpMaster.connect(master);
  if (type === 'brown' || type === 'white') {
    for (let ch = 0; ch < 2; ch++) {
      const sc = noise(type); let n = sc;
      const chain = type === 'brown' ? [flt('highpass', 40, .7), flt('lowpass', 1100, .6)] : [flt('highpass', 60, .7), flt('lowpass', 11000, .6), flt('highshelf', 5000)];
      chain.forEach(f => { if (f.type === 'highshelf') f.gain.value = -5; n.connect(f); n = f; });
      n.connect(merger, 0, ch); sc.start();
    }
    merger.connect(master);
  } else {                                                   // mưa
    for (let ch = 0; ch < 2; ch++) {
      const bed = noise('pink'), hp = flt('highpass', 600, .7), lp = flt('lowpass', 6500, .6), am = off.createGain(), gb = off.createGain();
      const curve = new Float32Array(48); let v = 1; for (let i = 0; i < curve.length; i++) { v += (Math.random() - .5) * .22; v = Math.max(.7, Math.min(1.2, v)); curve[i] = v; }
      curve[curve.length - 1] = curve[0];
      am.gain.setValueCurveAtTime(curve, 0, dur); gb.gain.value = .5;
      bed.connect(hp); hp.connect(lp); lp.connect(am); am.connect(gb); gb.connect(merger, 0, ch); bed.start();
      const rum = noise('brown'), rl = flt('lowpass', 220, .7), rg = off.createGain(); rg.gain.value = .22; rum.connect(rl); rl.connect(rg); rg.connect(merger, 0, ch); rum.start();
    }
    merger.connect(lpMaster);
  }
  return off.startRendering().then(r => {
    const L = Math.round(AMB_LEN * sr), X = Math.round(AMB_X * sr), out = [new Float32Array(L), new Float32Array(L)];
    const dat = [r.getChannelData(0), r.getChannelData(1)];
    if (type === 'rain') {                                       // giọt mưa tổng hợp thẳng bằng mã (nhanh hơn dựng hàng nghìn nút âm thanh)
      ambDrops(dat, sr, 55, [1200, 7000, 1.6], [1.5, 6.5], [.02, .27, 3], [.012, .052]);                 // giọt nhỏ ~55 giọt/giây
      ambDrops(dat, sr, 2.5, [500, 1400, 1], [1, 3], [.06, .14, 1], [.05, .12]);                          // giọt to trầm, thưa
    }
    let sum = 0;
    for (let c = 0; c < 2; c++) {
      const d = dat[c], o = out[c];
      for (let i = 0; i < L; i++) o[i] = d[i];
      for (let i = 0; i < X; i++) { const w = i / X; o[i] = d[i] * Math.sin(w * Math.PI / 2) + d[L + i] * Math.cos(w * Math.PI / 2); }   // hoà đuôi vào đầu: nối liền mạch
      for (let i = 0; i < L; i++) sum += o[i] * o[i];
    }
    const k = AMB_RMS / (Math.sqrt(sum / (2 * L)) || 1);
    for (let c = 0; c < 2; c++) for (let i = 0; i < L; i++) out[c][i] = Math.tanh(out[c][i] * k);   // chuẩn hoá cùng độ to, tanh để đỉnh nhọn không vượt 1
    return out;
  });
}
function ambFallback(type, sr){                                // máy không có OfflineAudioContext: nhiễu đơn giản
  const L = Math.round(AMB_LEN * sr);
  return [0, 1].map(() => { const d = ambNoise(L, type === 'white' ? 'white' : type === 'brown' ? 'brown' : 'pink'); let s = 0; for (let i = 0; i < L; i++) s += d[i] * d[i]; const k = AMB_RMS / (Math.sqrt(s / L) || 1); for (let i = 0; i < L; i++) d[i] = Math.tanh(d[i] * k); return d; });
}
function ambBuffer(type, a){
  const key = type + a.sampleRate; if (ambCache[key]) return ambCache[key];
  return ambCache[key] = ambRender(type, a.sampleRate).catch(() => ambFallback(type, a.sampleRate)).then(ch => { const b = a.createBuffer(2, ch[0].length, a.sampleRate); b.copyToChannel(ch[0], 0); b.copyToChannel(ch[1], 1); return b; }).catch(e => { delete ambCache[key]; throw e; });
}
function setAmbient(type){
  ambType = type; const tok = ++ambTok;
  const a0 = actx;
  if (ambNode) { const o = ambNode; ambNode = null; try { o.g.gain.setTargetAtTime(0, a0.currentTime, .12); o.src.stop(a0.currentTime + .7); } catch (e) {} }   // cũ lướt nhỏ dần rồi dừng
  document.querySelectorAll('#amb-chips [data-k]').forEach(b => b.classList.toggle('on', b.dataset.k === type));
  if (type === 'off') return;
  const a = audio(); if (!a) return;
  ambBuffer(type, a).then(buf => {
    if (tok !== ambTok) return;                                // trong lúc chờ đã đổi sang âm khác
    const src = a.createBufferSource(), g = a.createGain(); src.buffer = buf; src.loop = true; g.gain.value = 0; src.connect(g); g.connect(a.destination); src.start();
    g.gain.setTargetAtTime(ambGain(), a.currentTime, .35); ambNode = { src, g };                 // lướt to dần
  }).catch(e => console.warn('ambient', e));
}
CHANGES.ambVol = el => { ambVol = Math.max(0, Math.min(1, +el.value / 100)); store.set('ambvol', ambVol); if (ambNode && actx) ambNode.g.gain.setTargetAtTime(ambGain(), actx.currentTime, .05); };
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
const musicRow = (it, kind, i) => { const e = musicEmbed(it.url); return `<div class="mrow"><div class="mi"><b>${esc(L(it.title))}</b>${L(it.note) ? `<span class="small muted">${esc(L(it.note))}</span>` : ''}</div><span class="row">${e ? `<button type="button" class="btn primary sm" data-act="musicPlay" data-k="${kind}" data-i="${i}">${ic('play', 'sm')} ${esc(t('music_play'))}</button>` : ''}<a class="btn secondary sm" target="_blank" rel="noopener" href="${esc(safeUrl(it.url))}">${esc(t('music_open'))}</a></span></div>`; };
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
  tabPick: el => {                                     // đổi tab tại chỗ, không vẽ lại trang (giữ nguyên vị trí cuộn)
    const box = el.closest('[data-tabs]'), k = el.dataset.k; TABS[el.dataset.g] = k;
    box.querySelectorAll(':scope > .tab-bar > [data-k]').forEach(b => { b.classList.toggle('on', b.dataset.k === k); b.setAttribute('aria-selected', b.dataset.k === k); });
    box.querySelectorAll(':scope > .tab-pane').forEach(x => { x.hidden = x.dataset.k !== k; });
  },
  passToggle: el => { const i = el.closest('.pass-wrap').querySelector('input'), show = i.type === 'password'; i.type = show ? 'text' : 'password'; el.setAttribute('aria-pressed', show); el.setAttribute('aria-label', t(show ? 'pass_hide' : 'pass_show')); el.title = t(show ? 'pass_hide' : 'pass_show'); el.innerHTML = ic(show ? 'eye-off' : 'eye'); i.focus(); },
  hintOff: el => { store.set('hint_' + el.dataset.key, true); const n = el.closest('.hint-note'); if (n && !el.href) n.remove(); },
  phoneNoteOff: el => { store.set('phone_note_off', true); const n = el.closest('.phone-note'); if (n) n.remove(); },
  ambSet: el => setAmbient(el.dataset.k),
  musicPlay: el => { const it = (music[el.dataset.k] || [])[+el.dataset.i]; if (!it) return; const e = musicEmbed(it.url); if (!e) return; musicSel = { ...e, title:L(it.title) }; const b = $('mplayer-box'); if (b) { b.innerHTML = playerHTML(); b.scrollIntoView({ block:'nearest', behavior:'smooth' }); } },
  musicClose: () => { musicSel = null; const b = $('mplayer-box'); if (b) b.innerHTML = ''; }
});/* Nhóm học trực tiếp (group.js): chỉ chạy khi admin bật và khách đã tham gia. Báo trạng thái đồng hồ lên nhóm / cộng phút lên bảng xếp hạng tuần. */
const grpJoined = () => !!(state.user && branding.groupOn === true && store.get('grp_' + state.user.uid, null));
const grpScroll = () => { const b = $('grp-box'); if (b) b.scrollIntoView({ block:'start', behavior:motionOff() ? 'auto' : 'smooth' }); };   // lối vào nhóm học (menu, Tổng quan): mở Phòng tập trung và kéo xuống khung nhóm học
ACTIONS.pageHelp = el => { loadGuide().then(() => EPTour.page(el.dataset.p)).catch(() => {}); };
ACTIONS.grpSeen = () => { store.set('grp_seen', 1); document.body.classList.remove('nav-open'); document.querySelectorAll('.sb-new').forEach(e => e.remove()); };   // bấm Phòng tập trung ở menu: chấm "mới" của nhóm học tắt
ACTIONS.grpOpen = () => { store.set('grp_seen', 1); document.body.classList.remove('nav-open'); document.querySelectorAll('.sb-new').forEach(e => e.remove()); if (route.name === 'focus') grpScroll(); else store.set('grp_goto', 1); };
const grpPing = () =>  { if (grpJoined()) loadGroup().then(() => window.EPGroup.sync()).catch(() => {}); };
const grpCredit = m => { if (grpJoined()) loadGroup().then(() => window.EPGroup.credit(m)).catch(() => {}); };
function addFocus(min){
  const k = DT.now().setZone(userTZ).toISODate(), fl = localFocus(), o = fl[k] || { m:0, s:0 };
  fl[k] = { m:o.m + min, s:o.s + 1 }; store.set('focus', fl);
  const cur = typeof curTodo === 'function' && curTodo();      // phiên tập trung xong: cộng 1 🍅 cho việc đang chọn (việc của Planner thì đếm trong máy này, ô pl_pomos)
  if (cur && cur.pl) { const m = plPomos(); m[cur.id] = (m[cur.id] || 0) + 1; store.set('pl_pomos', m); }
  else if (cur) store.set('todos', todos().map(x => x.id === cur.id ? { ...x, p:(x.p || 0) + 1 } : x));
  saveProfileSoon(); if (typeof renderTodos === 'function') renderTodos();
  grpCredit(min);
  if (typeof plStudyCheck === 'function') plStudyCheck().catch(() => {});   // vừa đạt mục tiêu giờ học tuần (Planner) thì chúc mừng
}
/* Giới hạn thời gian tập trung mỗi ngày cho người xem miễn phí. Người đồng hành (Companions) và admin không bị giới hạn.
   Đếm bằng bộ nhớ trình duyệt nên đây là giới hạn "nhẹ nhàng" (có thể vượt bằng cách xoá dữ liệu trình duyệt). */
const focusUnlimited = () => !!(state.companion || state.isAdmin || trialActive());
const focusLimit = () => focusUnlimited() ? 0 : Math.max(0, Math.round(+branding.focusLimit || 0));
const focusUsed = () => (localFocus()[DT.now().setZone(userTZ).toISODate()] || { m:0 }).m;
(function(){
  const G = {
    en:{ trial_title:'Have a trial code?', trial_sub:'Enter it to try Companion perks (Weekly Planner, unlimited focus) for free for a limited time. Each account can use one trial.', trial_ph:'e.g. TRY-ABCD-1234', trial_btn:'Activate',
      trial_login:'Sign in to use a trial code.', trial_bad:'This code is not valid, has expired or has no uses left.', trial_used:'This account has already used a trial.', trial_ok:'Trial activated! Enjoy until {d}.',
      trial_active:'Your trial is active until {d}.', trial_over:'Your trial has ended. Become a Companion to keep using these perks.' },
    vi:{ trial_title:'Bạn có mã dùng thử?', trial_sub:'Nhập mã để dùng thử miễn phí quyền lợi của Người đồng hành (Planner tuần, tập trung không giới hạn) trong một thời gian. Mỗi tài khoản dùng thử một lần.', trial_ph:'VD: TRY-ABCD-1234', trial_btn:'Kích hoạt',
      trial_login:'Đăng nhập để dùng mã dùng thử.', trial_bad:'Mã không đúng, đã hết hạn hoặc đã hết lượt dùng.', trial_used:'Tài khoản này đã dùng thử rồi.', trial_ok:'Đã kích hoạt dùng thử! Bạn dùng được đến {d}.',
      trial_active:'Bạn đang dùng thử đến {d}.', trial_over:'Lượt dùng thử của bạn đã kết thúc. Trở thành Người đồng hành để dùng tiếp nhé.' }
  };
  Object.keys(G).forEach(l => { I18N[l] = I18N[l] || {}; Object.keys(G[l]).forEach(k => { if (I18N[l][k] === undefined) I18N[l][k] = G[l][k]; }); });
})();
/* Ô nhập mã dùng thử (Planner chưa mở khoá, trang Support). Rules chỉ cho kích hoạt khi mã có thật, đang bật, còn hạn nhập, còn lượt,
   và mỗi tài khoản một lần; ghi lượt kích hoạt và cộng 1 lượt dùng của mã trong CÙNG một lần ghi (batch). */
const trialEnd = () => DT.fromMillis(state.trial.endsAt).setZone(userTZ).toFormat('dd/MM/yyyy HH:mm');
function trialBox(){
  if (DEMO) return '';
  if (!state.user) return `<div class="limit-box stack"><b>${esc(t('trial_title'))}</b><p class="small muted">${esc(t('trial_login'))}</p><a class="btn secondary" href="#/account">${esc(t('nav_signin'))}</a></div>`;
  if (trialActive()) return `<div class="limit-box stack"><b>${esc(t('trial_title'))}</b><p class="small" style="color:var(--live)">${esc(t('trial_active', { d:trialEnd() }))}</p></div>`;
  if (state.trial) return `<div class="limit-box stack"><b>${esc(t('trial_title'))}</b><p class="small muted">${esc(t('trial_over'))}</p></div>`;
  return `<form class="limit-box stack" data-form="trial" style="gap:8px"><b>${esc(t('trial_title'))}</b><p class="small muted" style="margin:0">${esc(t('trial_sub'))}</p><div class="row" style="flex-wrap:nowrap"><input class="input" autocomplete="off" spellcheck="false" autocapitalize="characters" placeholder="${esc(t('trial_ph'))}" maxlength="40" style="text-transform:uppercase"><button class="btn secondary" type="submit">${ic('check', 'sm')} ${esc(t('trial_btn'))}</button></div></form>`;
}
FORMS.trial = async form => {
  if (!state.user || DEMO) return;
  const code = form.querySelector('input').value.toUpperCase().replace(/\s+/g, ''), btn = form.querySelector('button');
  if (!/^[A-Z0-9-]{4,32}$/.test(code)) return toast(t('trial_bad'));
  const u = state.user, F = firebase.firestore.FieldValue, b = db.batch();
  b.set(db.collection('trial_redemptions').doc(u.uid), { uid:u.uid, code, startedAt:F.serverTimestamp(), email:u.email || '' });
  b.update(db.collection('trial_codes').doc(code), { uses:F.increment(1) });
  btn.disabled = true;
  try { await b.commit(); }
  catch (e) { btn.disabled = false; await loadTrial(u, true); if (state.trial) render(true); return toast(t(state.trial ? 'trial_used' : 'trial_bad')); }
  await loadTrial(u, true);
  toast(trialActive() ? t('trial_ok', { d:trialEnd() }) : t('trial_bad'));
  if (trialActive()) loadPlanner().catch(() => {});
  render(true);
};
function limitModal(){
  const L0 = focusLimit();
  openModal(`<h2>${esc(t('focus_limit_title'))}</h2><p class="muted mt-s">${esc(t('focus_limit_text', { l:L0 }))}</p>
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
  audio(); pomo.endAt = Date.now() + pomo.remaining; pomo.running = true; pomoSave(); updateTimerUI(); grpPing();
}
function pomoPause(){ if (!pomo.running) return; pomo.remaining = Math.max(0, pomo.endAt - Date.now()); pomo.running = false; pomoSave(); updateTimerUI(); grpPing(); }
function pomoReset(){ pomo.running = false; pomo.blockMin = 0; pomo.remaining = pomoDur(pomo.mode); pomoSave(); updateTimerUI(); grpPing(); }
function pomoMode(m){ pomo.mode = m; pomo.running = false; pomo.blockMin = 0; pomo.remaining = pomoDur(m); pomoSave(); updateTimerUI(); grpPing(); }
function pomoComplete(natural, silent){
  const wasFocus = pomo.mode === 'focus', doneMin = pomo.blockMin || pomo.cfg.focus;
  if (wasFocus && natural) pomo.cycle++;
  pomo.blockMin = 0; pomo.running = false;
  pomo.mode = wasFocus ? ((pomo.cycle % pomo.cfg.every === 0 && natural) ? 'long' : 'short') : 'focus';
  pomo.remaining = pomoDur(pomo.mode);
  pomoSave();                                                          // chốt trạng thái TRƯỚC khi cộng phút: lỗi phía sau không làm phiên bị cộng lặp mỗi 250ms
  if (wasFocus && natural) { try { addFocus(doneMin); } catch (e) { console.warn('addFocus', e); } }
  pomo.running = !!(pomo.cfg.auto && natural) && !(pomo.mode === 'focus' && focusLimit() && focusUsed() >= focusLimit()); if (pomo.running) { pomo.endAt = Date.now() + pomo.remaining; pomoSave(); }
  if (natural && !silent) {
    soundPlay(wasFocus ? 'focus' : 'break'); toast(t(wasFocus ? 'notify_done_focus' : 'notify_done_break'));
    if ('Notification' in window && Notification.permission === 'granted') new Notification(branding.name, { body:t(wasFocus ? 'notify_done_focus' : 'notify_done_break') });
  }
  grpPing();
  if (route.name === 'focus' || route.name === 'home') render(true); else updateTimerUI();
}
/* Nhiều tab cùng mở: đồng hồ là MỘT, lưu ở localStorage. Tab khác đổi (bắt đầu / dừng / hết khối) thì tab này nhận lại trạng thái, và chỉ một tab được "hoàn tất" khối
   (trước đây tab nào cũng tự hoàn tất: cộng phút tập trung, 🍅 và điểm nhóm học hai lần). */
function pomoAdopt(){
  const s = store.get('pomo', null); if (!s || typeof s !== 'object') return false;
  pomo = { ...pomoDefault(), ...s }; pomo.cfg = { ...pomoDefault().cfg, ...(pomo.cfg || {}) }; return true;
}
window.addEventListener('storage', e => { if (e.key === 'ep_pomo' && pomoAdopt()) { updateTimerUI(); grpPing(); } });
function pomoTick(){
  if (!pomo.running) return;
  if (pomo.endAt - Date.now() > 0) { updateTimerUI(); return; }
  const s = store.get('pomo', null);
  if (s && (!s.running || s.endAt !== pomo.endAt || s.mode !== pomo.mode)) { if (pomoAdopt()) { updateTimerUI(); grpPing(); } return; }   // tab khác đã hoàn tất khối này rồi
  pomoComplete(true);
}
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
  document.title = pomo.running ? `${txt} · ${t('mode_' + pomo.mode)} — ${branding.name}` : tabName();
}
setInterval(pomoTick, 250);

const todos = () => store.get('todos', []);
const saveTodos = l => { store.set('todos', l); saveProfileSoon(); };
const dropTodos = ids => { const s = new Set(ids), l = todos(); store.set('todos_gone', [...new Set([...todosGone(), ...ids])].slice(-300)); store.set('todos', l.filter(x => !s.has(x.id))); if (store.get('todo_cur', '') && s.has(store.get('todo_cur', ''))) store.set('todo_cur', ''); saveProfileNow(); };   // xoá thật: ghi ngay lên hồ sơ, kèm dấu "đã xoá"
let FX_PL = [], fxEdit = '';          // việc hôm nay của Planner đang hiện trong Phòng tập trung (để chọn "đang làm" và cộng 🍅); id việc đang sửa
const plPomos = () => store.get('pl_pomos', {});
const curTodo = () => { const id = store.get('todo_cur', ''); if (!id) return null; const x = todos().find(v => v.id === id && !v.done); if (x) return x; const q = FX_PL.find(v => v.id === id && !v.done); return q ? { id:q.id, text:q.title, pl:true } : null; };
const curLabel = () => { const cur = curTodo(), tmc = $('tm-cur'); if (tmc) tmc.innerHTML = cur ? `${ic('timer', 'sm')} ${esc(t('todo_cur_now'))}: <b>${esc(cur.text)}</b>` : ''; return cur; };
if (pomo.running && pomo.endAt <= Date.now()) pomoComplete(true, true);     // hết giờ khi đang đóng tab (đặt sau todos/curTodo: gọi sớm hơn sẽ lỗi "before initialization")
const plLinked = () => state.companion || state.isAdmin || trialActive() || DEMO;           // có quyền dùng Planner → Focus liên kết với Planner
function renderTodos(){
  const box = $('todo-list'); if (!box) return;
  if (plLinked() && typeof plFocusEdit !== 'function') { loadPlanner().then(() => renderTodos()).catch(() => {}); }
  const l = todos(), toPl = plLinked() && typeof plFocusEdit === 'function';
  const cur = curLabel(), nDone = l.filter(x => x.done).length;
  box.innerHTML = (l.length && plLinked() ? `<div class="small muted fx-sub">${esc(t('fx_local'))}</div>` : '') + (l.length ? `<div class="todo-prog"><div class="row between small"><span class="muted">${esc(t('todo_progress', { d:nDone, n:l.length }))}</span>${nDone ? `<button type="button" class="btn ghost sm" data-act="todoClear">${esc(t('todo_clear'))}</button>` : ''}</div><div class="progress mt-s"><i style="width:${Math.round(nDone / l.length * 100)}%"></i></div></div>` : '') + (l.length ? l.map(x => `<div class="todo-item ${x.done ? 'done' : ''} ${cur && cur.id === x.id ? 'cur' : ''}"><label><input type="checkbox" data-change="todoToggle" data-id="${esc(x.id)}" ${x.done ? 'checked' : ''}><span>${esc(x.text)}${x.p ? ` <small class="faint" title="${esc(t('todo_pomos'))}">🍅×${x.p}</small>` : ''}</span></label>${x.done ? '' : `<button type="button" class="btn ghost icon sm ${cur && cur.id === x.id ? 'on' : ''}" data-act="todoCur" data-id="${esc(x.id)}" title="${esc(t('todo_cur'))}" aria-label="${esc(t('todo_cur'))}">${ic('timer', 'sm')}</button>`}${toPl ? `<button type="button" class="btn ghost icon sm" data-act="todoToPl" data-id="${esc(x.id)}" title="${esc(t('todo_to_pl'))}" aria-label="${esc(t('todo_to_pl'))}">${ic('calendar', 'sm')}</button>` : ''}<button type="button" class="btn ghost icon sm" data-act="todoDel" data-id="${esc(x.id)}" aria-label="${esc(t('remove'))}">${ic('trash', 'sm')}</button></div>`).join('') : (plLinked() ? '' : `<div class="small faint" style="padding:12px 0">${esc(t('todo_empty'))}</div>`));
  renderFocusPl();
}
/* việc hôm nay của Planner hiện ngay dưới danh sách việc của Focus (chỉ cho người có quyền dùng Planner); tick ở đây = tick bên Planner */
function renderFocusPl(){
  const box = $('todo-pl'); if (!box) return;
  if (!plLinked() || typeof plWeek0 !== 'function') { box.innerHTML = ''; FX_PL = []; return; }
  plWeek0().then(wk => {
    const b = $('todo-pl'); if (!b) return;
    wk = wk || [];
    const d0 = plToday0(), l = wk.filter(x => x.day === d0).sort((x, y) => (x.start || '99').localeCompare(y.start || '99')), pm = plPomos(), ids = new Set(wk.map(x => x.id));
    FX_PL = l;
    if (Object.keys(pm).some(k => !ids.has(k))) store.set('pl_pomos', Object.fromEntries(Object.entries(pm).filter(([k]) => ids.has(k))));   // việc đã xoá / tuần đã qua: bỏ đếm 🍅 cũ
    const cur = curLabel(), nDone = l.filter(x => x.done).length;
    const row = x => fxEdit === x.id
      ? `<form class="todo-item fx-edit" data-form="fxPlEdit" data-id="${esc(x.id)}"><input class="input" name="ti" maxlength="80" value="${esc(x.title)}" aria-label="${esc(t('fx_edit'))}" autocomplete="off"><input class="input fx-time" type="time" name="st" value="${esc(x.start)}" aria-label="${esc(t('fx_time'))}"><button class="btn primary icon sm" type="submit" aria-label="${esc(t('save'))}">${ic('check', 'sm')}</button><button type="button" class="btn ghost icon sm" data-act="fxPlEditEnd" aria-label="${esc(t('cancel'))}">${ic('x', 'sm')}</button></form>`
      : `<div class="todo-item ${x.done ? 'done' : ''} ${cur && cur.id === x.id ? 'cur' : ''}"><label><input type="checkbox" data-change="focusPlToggle" data-id="${esc(x.id)}" ${x.done ? 'checked' : ''}><span>${esc(x.title || '—')}${x.start ? ` <small class="faint">${esc(x.start)}</small>` : ''}${pm[x.id] ? ` <small class="faint" title="${esc(t('todo_pomos'))}">🍅×${pm[x.id]}</small>` : ''}</span></label>`
        + `${x.done ? '' : `<button type="button" class="btn ghost icon sm ${cur && cur.id === x.id ? 'on' : ''}" data-act="todoCur" data-id="${esc(x.id)}" title="${esc(t('todo_cur'))}" aria-label="${esc(t('todo_cur'))}">${ic('timer', 'sm')}</button>`}`
        + `<button type="button" class="btn ghost icon sm" data-act="fxPlEdit" data-id="${esc(x.id)}" title="${esc(t('fx_edit'))}" aria-label="${esc(t('fx_edit'))}">${ic('pen', 'sm')}</button><button type="button" class="btn ghost icon sm" data-act="fxPlDel" data-id="${esc(x.id)}" aria-label="${esc(t('remove'))}">${ic('trash', 'sm')}</button></div>`;
    b.innerHTML = `<div class="row between fx-head"><b class="small">${ic('calendar', 'sm')} ${esc(t('focus_pl_title'))}</b><a class="link small" href="#/planner">${esc(t('focus_pl_open'))}</a></div>`
      + (l.length ? `<div class="todo-prog"><div class="small muted">${esc(t('todo_progress', { d:nDone, n:l.length }))}</div><div class="progress mt-s"><i style="width:${Math.round(nDone / l.length * 100)}%"></i></div></div><div class="mt-s">${l.map(row).join('')}</div>` : `<div class="small faint mt-s">${esc(t('focus_pl_empty'))}</div>`);
  }).catch(() => { const b = $('todo-pl'); if (b) b.innerHTML = ''; });
}
/* ô xem stream nhỏ ngay trong Phòng tập trung (Watch live giữ nguyên) */
let fsPick = 'auto';                 // auto = đang live thì xem live, chưa live thì xem video mới nhất; 'live' = luôn xem live; hoặc id video đã live
function streamCard(){
  const open = store.get('fs_open', true), liveSrc = liveEmbedSrc(), url = watchUrl(), { live } = liveState();
  const vids = videos.filter(v => v.id).slice(0, 12);
  let pick = fsPick;
  if (pick === 'auto') pick = live && liveSrc ? 'live' : (pickPlayable() || 'none');       // chưa live → chiếu video đã live gần nhất dùng được; không có thì báo chưa phát sóng (không nhúng khung live chết)
  if (pick !== 'live' && pick !== 'none' && !vids.some(v => v.id === pick)) pick = 'none';
  const src = pick === 'live' ? liveSrc : pick === 'none' ? '' : `https://www.youtube-nocookie.com/embed/${pick}?rel=0${fsPick === 'auto' ? '' : '&autoplay=1'}`;
  const sel = vids.length ? `<select class="select fs-sel" data-change="fsPick" aria-label="${esc(t('focus_stream'))}"><option value="live" ${pick === 'live' ? 'selected' : ''}>● ${esc(t('focus_stream_live'))}</option><optgroup label="${esc(t('focus_stream_past'))}">${vids.map(v => `<option value="${esc(v.id)}" ${pick === v.id ? 'selected' : ''}>${esc((v.title || 'YouTube').slice(0, 64))}</option>`).join('')}</optgroup></select>` : '';
  return `<section class="card pad fstream"><div class="row between"><b class="row" style="gap:8px">${ic('play', 'sm')} ${esc(t('focus_stream'))} ${live && pick === 'live' ? '<span class="badge live">LIVE</span>' : ''}</b>
    <span class="row" style="gap:4px"><button type="button" class="btn ghost sm" data-act="fsToggle">${esc(open ? t('focus_stream_hide') : t('focus_stream_show'))}</button>${url ? `<a class="btn ghost sm" target="_blank" rel="noopener" href="${esc(safeUrl(url))}" aria-label="${esc(t('open_youtube'))}" title="${esc(t('open_youtube'))}">${ic('link', 'sm')}</a>` : ''}</span></div>
    ${open ? `${sel ? `<div class="mt-s">${sel}</div>` : ''}${src ? `<div class="player mt-s"><iframe src="${esc(src)}" title="YouTube" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>` : `<p class="small muted mt-s"><b>${esc(t('offline'))}.</b> ${esc(t('offline_sub'))}</p>`}` : ''}</section>`;
}
CHANGES.fsPick = el => { fsPick = el.value; render(true); };ACTIONS.fsToggle = () => { store.set('fs_open', !store.get('fs_open', true)); render(true); };
/* Ô mời nhỏ ở Phòng tập trung: giới thiệu Planner của Người đồng hành cho ai chưa có quyền lợi (không hiện với Người đồng hành, admin, người đang dùng thử / có mã).
   Bấm X thì ẩn 7 ngày. */
(function(){
  const G = {
    en:{ fn_title:'Your own weekly Planner', fn_text:'Companions get a private Planner with a weekly focus summary.', fn_cta:'Become a Companion', fn_peek:'Take a look' },
    vi:{ fn_title:'Planner tuần của riêng bạn', fn_text:'Người đồng hành có Planner riêng, tự tổng kết năng suất mỗi tuần.', fn_cta:'Trở thành Người đồng hành', fn_peek:'Xem thử' },
    hi:{ fn_title:'आपका अपना साप्ताहिक Planner', fn_text:'साथियों को हर हफ़्ते फ़ोकस सारांश के साथ निजी Planner मिलता है।', fn_cta:'साथी बनें', fn_peek:'एक नज़र देखें' },
    ja:{ fn_title:'自分だけの週間プランナー', fn_text:'仲間たちは毎週の集中まとめ付きの専用プランナーを使えます。', fn_cta:'仲間になる', fn_peek:'見てみる' },
    ko:{ fn_title:'나만의 주간 플래너', fn_text:'동반자는 매주 집중 요약이 담긴 개인 플래너를 쓸 수 있어요.', fn_cta:'동반자 되기', fn_peek:'살펴보기' },
    zh:{ fn_title:'专属于你的每周计划表', fn_text:'同伴可使用专属计划表，每周自动汇总专注情况。', fn_cta:'成为同伴', fn_peek:'看一看' },
    fr:{ fn_title:'Ton propre Planner de la semaine', fn_text:'Les Compagnons ont un Planner privé avec un bilan de concentration chaque semaine.', fn_cta:'Devenir Compagnon', fn_peek:'Jeter un œil' },
    es:{ fn_title:'Tu propio Planner semanal', fn_text:'Los Acompañantes tienen un Planner privado con un resumen de concentración cada semana.', fn_cta:'Hazte Acompañante', fn_peek:'Echar un vistazo' }
  };
  Object.keys(G).forEach(l => { I18N[l] = I18N[l] || {}; Object.keys(G[l]).forEach(k => { if (I18N[l][k] === undefined) I18N[l][k] = G[l][k]; }); });
})();
const FN_SNOOZE = 7 * 864e5;
function focusNudge(){
  if (focusUnlimited() || !compPayMode() || Date.now() - (+store.get('fn_off', 0) || 0) < FN_SNOOZE) return '';
  return `<section class="card pad fn-card"><button type="button" class="fn-x" data-act="fnOff" aria-label="${esc(t('close'))}" title="${esc(t('close'))}">${ic('x', 'sm')}</button>
    <div class="fn-top"><span class="don-ic">${ic('moon')}</span><div><b>${esc(t('fn_title'))}</b><p class="small muted">${esc(t('fn_text'))}</p></div></div>
    <div class="row"><a class="btn primary sm" href="#/donate" data-act="fnGo">${ic('heart', 'sm')} ${esc(t('fn_cta'))}</a><a class="btn ghost sm" href="#/planner">${esc(t('fn_peek'))}</a></div></section>`;
}
Object.assign(ACTIONS, {
  fnOff: el => { store.set('fn_off', Date.now()); const c = el.closest('.fn-card'); if (c) c.remove(); },
  fnGo: () => { TABS.don = 'comp'; }
});
PAGES.focus = function(){
  const fl = localFocus(), today = DT.now().setZone(userTZ), days = Array.from({ length:7 }, (_, i) => today.minus({ days:6 - i })), vals = days.map(d => (fl[d.toISODate()] || { m:0 }).m), mx = Math.max(30, ...vals), td = fl[today.toISODate()] || { m:0, s:0 };
  const fxTabs = [['todo', t('fx_tab_todo'), 'check'], ['music', t('fx_tab_music'), 'volume']], fsTabs = [...(branding.groupOn === true ? [['group', t('fx_tab_group'), 'users']] : []), ['live', t('fx_tab_stream'), 'play']];   // Việc + Nhạc cạnh bộ đếm; Nhóm + Live ở khung riêng để xem song song
  const fxCur = [TABS.fx, store.get('fx_tab', 'todo')].find(k => fxTabs.some(x => x[0] === k)) || 'todo', fsCur = [TABS.fs, store.get('fs_tab', 'group')].find(k => fsTabs.some(x => x[0] === k)) || fsTabs[0][0], fxCfgOpen = store.get('fx_cfg', null) ?? matchMedia('(min-width:1101px)').matches;   // bộ đếm: cài đặt mở sẵn trên màn rộng, gập trên điện thoại để danh sách việc không bị đẩy xuống
  const c = pomo.cfg, num = (k, lab) => `<div class="field"><label class="label">${esc(lab)}</label><input class="input" type="number" min="1" max="180" value="${c[k]}" data-change="cfg" data-k="${k}"></div>`;
  page(`${head('focus_title', 'focus_sub', '', 'umbrella', 4)}${state.user ? (plLinked() ? hintNote('new_focus2') : hintNote('new_tease', '#/planner')) : ''}${trialNudge()}
    <div class="grid g-main fx3"><section class="card timer-card fx-timer">
      <div class="seg"><button type="button" data-seg="focus" data-act="pmode" data-m="focus">${esc(t('mode_focus'))}</button><button type="button" data-seg="short" data-act="pmode" data-m="short">${esc(t('mode_short'))}</button><button type="button" data-seg="long" data-act="pmode" data-m="long">${esc(t('mode_long'))}</button></div>
      <div class="ring" id="tm-ring"><svg viewBox="0 0 120 120"><circle class="bg" cx="60" cy="60" r="54" stroke-width="7"/><circle class="fg" id="tm-fg" cx="60" cy="60" r="54" stroke-width="7" stroke-dasharray="${RING_C.toFixed(2)}" stroke-dashoffset="0"/></svg><div class="center"><div class="tt" data-pomo-time>25:00</div><div class="md" data-pomo-mode></div></div></div>
      <div class="cycle" id="tm-cycle"></div><div class="small muted" id="tm-cur" style="text-align:center;min-height:1.2em"></div>
      ${focusLimit() ? `<div class="limit-box"><div class="row between small"><b>${esc(t('focus_limit_used', { u:Math.min(focusUsed(), focusLimit()), l:focusLimit() }))}</b><span class="faint">${esc(t('focus_limit_note', { l:focusLimit() }))}</span></div><div class="progress mt-s"><i style="width:${Math.min(100, focusUsed() / focusLimit() * 100)}%"></i></div></div>` : (state.companion ? `<div class="limit-box">${compBadge(' · ' + esc(t('focus_nolimit')))}</div>` : '')}
      <div class="row"><button class="btn primary lg" id="tm-main" data-act="pstart"></button><button class="btn secondary icon" style="width:48px;height:48px" data-act="preset-reset" title="${esc(t('reset'))}">${ic('reset')}</button><button class="btn secondary icon" style="width:48px;height:48px" data-act="pskip" title="${esc(t('skip'))}">${ic('skip')}</button></div>
      ${branding.groupOn === true ? '<div id="grp-strip" class="grp-strip-wrap"></div>' : ''}
      <details class="tm-cfg" ${fxCfgOpen ? 'open' : ''}><summary>${ic('sliders', 'sm')} ${esc(t('fx_cfg'))}</summary>
      <div class="divider" style="width:100%;margin:2px 0"></div>
      <div class="row" style="width:100%"><span class="small muted">${esc(t('presets'))}:</span>${Object.entries(PRESETS).map(([k, p]) => `<button type="button" class="chip" data-act="ppreset" data-p="${k}">${p.focus}/${p.short}/${p.long}</button>`).join('')}</div>
      <div class="cfg-grid">${num('focus', t('cfg_focus'))}${num('short', t('cfg_short'))}${num('long', t('cfg_long'))}${num('every', t('cfg_every'))}</div>
      <div class="row between" style="width:100%"><label class="row small" style="font-weight:600"><input type="checkbox" data-change="cfgAuto" ${c.auto ? 'checked' : ''}> ${esc(t('auto_start'))}</label></div>
      </details>
    </section>
    <div class="stack fx-main"><div class="tabset fx-tabs" data-tabs="fx"><div class="tab-bar" role="tablist">${fxTabs.map(([k, l, i]) => `<button type="button" role="tab" class="chip ${k === fxCur ? 'on' : ''}" aria-selected="${k === fxCur}" data-act="fxTab" data-g="fx" data-k="${k}">${ic(i, 'sm')} ${esc(l)}</button>`).join('')}</div>
      <div class="tab-pane" role="tabpanel" data-k="todo"${fxCur === 'todo' ? '' : ' hidden'}><section class="card pad ${plLinked() ? 'todo-linked' : ''}"><div class="card-h"><h2>${esc(t('todo_title'))}</h2></div>
        <form class="row fx-add" style="flex-wrap:nowrap" data-form="todo"><input class="input" id="todo-in" placeholder="${esc(t('todo_ph'))}" maxlength="140" autocomplete="off">${plLinked() ? `<input class="input fx-time" type="time" id="todo-time" aria-label="${esc(t('fx_time'))}" title="${esc(t('fx_time'))}">` : ''}<button class="btn primary icon" type="submit" aria-label="add">${ic('plus')}</button></form>
        <div id="todo-list" class="mt-s"></div><div id="todo-pl"></div>${!state.user ? `<p class="hint mt-s">${esc(t('sync_note'))} <a class="link" href="#/account">${esc(t('signin'))}</a></p>` : ''}</section></div>
      <div class="tab-pane" role="tabpanel" data-k="music"${fxCur === 'music' ? '' : ' hidden'}>${musicCard()}</div></div>
      </div>
    <aside class="stack fx-side" aria-label="${esc(t('fx_side'))}"><div class="tabset fx-tabs" data-tabs="fs">${fsTabs.length > 1 ? `<div class="tab-bar" role="tablist">${fsTabs.map(([k, l, i]) => `<button type="button" role="tab" class="chip ${k === fsCur ? 'on' : ''}" aria-selected="${k === fsCur}" data-act="fsTab" data-g="fs" data-k="${k}">${ic(i, 'sm')} ${esc(l)}</button>`).join('')}</div>` : ''}
      ${branding.groupOn === true ? `<div class="tab-pane" role="tabpanel" data-k="group"${fsCur === 'group' ? '' : ' hidden'}><section class="card pad grp" id="grp-box"><div class="card-h"><h2>${ic('users', 'sm')} ${esc(t('grp_title'))}</h2></div><p class="muted">${esc(t('loading'))}</p></section></div>` : ''}
      <div class="tab-pane" role="tabpanel" data-k="live"${fsCur === 'live' ? '' : ' hidden'}>${streamCard()}</div></div>${focusNudge()}</aside>
    <div class="fx-stats"><div class="grid g2 keep2"><div class="card tile"><span class="t-l">${esc(t('sessions_today'))}</span><span class="t-v">${td.s}</span></div><div class="card tile"><span class="t-l">${esc(t('minutes_today'))}</span><span class="t-v">${td.m}</span></div></div><section class="card pad"><div class="card-h"><h2>${esc(t('week_chart'))}</h2></div><div class="bars">${days.map((d, i) => `<div><i style="height:${Math.max(3, vals[i] / mx * 100)}%" title="${vals[i]} ${esc(t('min'))}"></i><small>${esc(d.setLocale(state.lang).toFormat('ccc'))}</small></div>`).join('')}</div></section></div>
    </div>
    <h2 class="mt" style="font-size:1.3rem;margin:40px 0 14px">${ic('heart', 'sm')} ${esc(t('nav_donate'))}</h2>${donateHTML()}`);   // phần Support nằm ngay trong Focus room
  renderTodos();
  if (branding.groupOn === true) loadGroup().then(() => window.EPGroup.mount()).catch(() => { for (const id of ['grp-box', 'grp-strip']) { const b = $(id); if (b) b.remove(); } });
};
CHANGES.cfg = el => { const k = el.dataset.k, v = Math.max(1, Math.min(180, parseInt(el.value, 10) || 1)); pomo.cfg[k] = v; if (!pomo.running && (k === pomo.mode)) pomo.remaining = pomoDur(pomo.mode); pomoSave(); updateTimerUI(); };
CHANGES.cfgAuto = el => { pomo.cfg.auto = el.checked; pomoSave(); };
CHANGES.todoToggle = el => { saveTodos(todos().map(x => x.id === el.dataset.id ? { ...x, done:el.checked } : x)); renderTodos(); };
CHANGES.focusPlToggle = async el => {
  const id = el.dataset.id, done = el.checked;
  if (!await plFocusEdit(ts => { const x = ts.find(v => v.id === id); if (!x) return false; x.done = done; return true; })) toast(t('pl_err'));
  renderFocusPl();
};
FORMS.todo = async () => {
  const i = $('todo-in'), v = i.value.trim(); if (!v) return;
  if (plLinked()) {                                                // có Planner: thêm thẳng vào việc hôm nay của Planner (giờ không bắt buộc)
    try { if (typeof plFocusEdit !== 'function') await loadPlanner(); } catch (e) {}
    if (typeof plFocusEdit === 'function') {
      const tm = $('todo-time'), start = tm ? tm.value : '';
      const ok = await plFocusEdit(ts => { if (ts.length >= PL_MAX) return false; ts.push(plClean({ title:v, day:plToday0(), start, dur:0, c:0, done:false })); return true; });
      if (ok) { i.value = ''; if (tm) tm.value = ''; renderFocusPl(); } else toast(t('pl_err'));
      i.focus(); return;
    }
  }
  saveTodos([{ id:Date.now().toString(36), text:v, done:false }, ...todos()]); i.value = ''; renderTodos(); i.focus();
};
FORMS.fxPlEdit = async f => {
  const id = f.dataset.id, title = f.elements.ti.value.trim().slice(0, 80), start = f.elements.st.value; if (!title) { f.elements.ti.focus(); return; }
  const ok = await plFocusEdit(ts => { const x = ts.find(v => v.id === id); if (!x) return false; x.title = title; x.start = start; return true; });
  fxEdit = ''; if (!ok) toast(t('pl_err')); renderFocusPl();
};

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
if (!Array.isArray(cart)) cart = []; cart = cart.filter(x => x && typeof x === 'object' && x.id);   // giỏ hàng lưu trong máy bị hỏng thì bỏ, không làm lỗi cả trang
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
    <div class="f2"><div class="field"><label class="label">${esc(t('your_name'))}</label><input class="input" id="b-name" required maxlength="80" value="${esc(state.user ? displayName() : '')}"></div><div class="field"><label class="label">${esc(t('your_email'))}</label><input class="input" id="b-email" type="email" required maxlength="160" ${state.user && state.user.email ? 'readonly' : ''} value="${esc(state.user ? state.user.email : '')}"></div></div>
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
  if (payments.orderTemplate && !DEMO) loadEmailJS().then(() => emailjs.send(EMAILJS_SERVICE, payments.orderTemplate, { user_name:order.buyer.name, user_email:order.buyer.email, order_code:code, items:order.items.map(i => `${i.name} × ${i.qty}`).join(', '), total:money(order.total, order.currency) })).catch(() => {});
  cart = []; coupon = null; saveCart(); paymentStep(order);
};
function paymentStep(o){
  const links = { ...(payments.stripe ? { stripe:payments.stripe } : {}), ...(payments.paypal ? { paypal:payments.paypal } : {}), ...(payments.kofi ? { kofi:payments.kofi } : {}) };
  const linkBtns = Object.entries(links).map(([k, u]) => `<a class="btn ${o.currency === 'VND' ? 'secondary' : 'primary'}" target="_blank" rel="noopener" href="${esc(safeUrl(u))}">${ic('credit', 'sm')} ${esc(k === 'stripe' ? t('pay_card') : k === 'paypal' ? 'PayPal' : 'Ko-fi')}</a>`).join(' ');
  const row = (l, v, copy) => `<div class="kvr"><span>${esc(l)}</span><b>${esc(v)}</b>${copy ? `<button type="button" class="btn secondary sm" data-act="copy" data-v="${esc(copy)}">${esc(t('copy'))}</button>` : ''}</div>`;
  let body = '';
  if (o.currency === 'VND') {
    if (payments.bankBin && payments.accountNo) {
      const note = mailNote(state.user && state.user.email || o.buyer && o.buyer.email) || o.code, qr = `https://img.vietqr.io/image/${encodeURIComponent(payments.bankBin)}-${encodeURIComponent(payments.accountNo)}-compact2.png?amount=${o.total}&addInfo=${encodeURIComponent(note)}&accountName=${encodeURIComponent(payments.accountName || '')}`;
      body = `<p class="muted">${esc(t('scan_qr'))}</p><img class="qr" alt="VietQR" src="${esc(qr)}"><div class="kv">${row(t('bank'), payments.bankBin)}${row(t('acc_no'), payments.accountNo, payments.accountNo)}${row(t('acc_name'), payments.accountName || '')}${row(t('amount'), money(o.total, 'VND'), String(o.total))}${row(t('content'), note, note)}</div><p class="small faint">${esc(t('pay_mail_hint'))}</p>`;
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
const aboutIntroHTML = function(){
  return `<section class="about-hero"><div><span class="badge" ${cms('about_badge')}>${esc(ctext('about_badge'))}</span><h1 style="font-size:clamp(1.8rem,4vw,2.6rem);margin:12px 0" ${cms('about_h')}>${esc(ctext('about_h'))}</h1><p class="muted" style="font-size:1.05rem;white-space:pre-line" ${cms('about_text')}>${esc(ctext('about_text'))}</p>
      <div class="row mt"><a class="btn primary" href="#/watch">${ic('play', 'sm')} ${esc(t('btn_watch_live'))}</a>${Object.entries(branding.socialLinks || {}).filter(([, u]) => u).map(([n, u]) => `<a class="btn secondary" target="_blank" rel="noopener" href="${esc(safeUrl(u))}">${esc(n)}</a>`).join('')}</div></div>
      <div class="about-img" data-cms-img="about_img">${artOr('about_img', 'moonwalk', { crop:'tall', seed:2 })}</div></section>
    <div class="grid g3 mt about-feats" style="margin-top:34px">${[['timer', 1], ['globe', 2], ['sliders', 3]].map(([icn, i]) => `<div class="card pad feat"><div class="tile" style="padding:0"><span class="t-ic">${ic(icn)}</span></div><h3 style="font-size:1.05rem;margin:10px 0 4px" ${cms('about_c' + i + '_t')}>${esc(ctext('about_c' + i + '_t'))}</h3><p class="muted small" ${cms('about_c' + i + '_d')}>${esc(ctext('about_c' + i + '_d'))}</p></div>`).join('')}</div>`;
};
const aboutFaqHTML = function(){
  return `<h2 style="font-size:1.3rem;margin:40px 0 14px" ${cms('faq_title')}>${esc(ctext('faq_title'))}</h2>
    <div>${faqList().map(f => `<details class="faq"><summary>${esc(f.q)}</summary><div class="a">${esc(f.a)}</div></details>`).join('')}</div>`;
};
const aboutReviewsHTML = function(){
  const avg = ratingAvg();
  return `<div class="row between" style="margin:40px 0 14px"><h2 style="font-size:1.3rem" ${cms('reviews_title')}>${esc(ctext('reviews_title'))}</h2>${avg ? `<div class="row">${stars(Math.round(avg))}<b>${avg.toFixed(1)}</b><span class="small faint">(${reviews.length})</span></div>` : ''}</div>
    <div class="grid g-main" style="align-items:start"><div class="grid g2">${reviews.length ? reviews.map(reviewCard).join('') : `<div style="grid-column:1/-1">${emptyBox('star', t('no_reviews'), '')}</div>`}</div>
    <section class="card pad"><h3 style="margin-bottom:10px">${esc(t('review_write'))}</h3>${state.user ? `<form class="stack" data-form="review"><div><label class="label">${esc(t('rating_label'))}</label><div class="seg" id="rev-stars">${[1, 2, 3, 4, 5].map(i => `<button type="button" class="${i === reviewRating ? 'on' : ''}" data-act="rate" data-n="${i}">${i}★</button>`).join('')}</div></div><textarea class="textarea" id="rev-text" required maxlength="600" placeholder="${esc(t('review_ph'))}"></textarea><button class="btn primary" type="submit">${esc(t('review_submit'))}</button></form>` : `<p class="muted small">${esc(t('review_login'))}</p><a class="btn primary mt-s" href="#/account">${esc(t('signin'))}</a>`}</section></div>`;
};
const aboutHTML = () => aboutIntroHTML() + aboutFaqHTML() + aboutReviewsHTML();
PAGES.about = function(){ page(aboutHTML()); };   // trang About đã gộp vào Overview; giữ lại để phần chỉnh sửa vẫn dùng được
FORMS.review = async () => {
  const text = $('rev-text').value.trim(); if (!text) return;
  try {
    if (!DEMO) await db.collection('reviews').add({ uid:state.user.uid, name:displayName().slice(0, 80), rating:reviewRating, text, approved:false, createdAt:TS() });
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
    <div class="row between" style="margin-top:auto;gap:10px"><span class="small faint">${esc([g.price, g.store].filter(Boolean).join(' · '))}</span><a class="btn primary sm" target="_blank" rel="sponsored nofollow noopener" href="${esc(safeUrl(g.url || '#'))}">${esc(t('gear_view'))} ${ic('link', 'sm')}</a></div></div></article>`;
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
        <input class="input" id="au-email" type="email" placeholder="${esc(t('email'))}" required autocomplete="email"><div class="pass-wrap"><input class="input" autocapitalize="off" spellcheck="false" id="au-pass" type="password" placeholder="${esc(t('password'))}" required minlength="6" autocomplete="${authTab === 'signup' ? 'new-password' : 'current-password'}"><button type="button" class="pass-eye" data-act="passToggle" aria-label="${esc(t('pass_show'))}" title="${esc(t('pass_show'))}" aria-pressed="false">${ic('eye')}</button></div>
        <button class="btn primary lg" type="submit">${esc(authTab === 'signin' ? t('signin') : t('signup'))}</button><div class="small" style="color:var(--danger)" id="au-err"></div>
        ${authTab === 'signin' ? `<button type="button" class="link" style="align-self:center" data-act="forgot">${esc(t('forgot'))}</button>` : ''}</form></div></div>`;
// mục đang bị khoá với khách chưa đăng nhập: vẫn hiện tiêu đề + tranh của mục đó, kèm lời mời đăng nhập / tạo tài khoản
const LOCK_HEAD = { home:['nav_home', null, 'moonwalk'], schedule:['sch_title', 'sch_sub', 'curl'], watch:['watch_title', 'watch_sub', 'gaze'], focus:['focus_title', 'focus_sub', 'umbrella'], blog:['blog_title', 'blog_sub', 'book'], club:['club_title', 'club_sub', 'gaze'], planner:['pl_title', 'pl_sub', 'moonwalk'], shop:['shop_title', 'shop_sub', 'lantern'], gear:['gear_title', 'gear_sub', 'lantern'], donate:['donate_title', 'donate_sub', 'lantern'], about:['about_title', null, 'moonwalk'] };
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
    <div class="acct-grid"><aside class="card pad stack" style="align-items:center;text-align:center"><span class="avatar" style="width:64px;height:64px;font-size:1.5rem">${esc((displayName() || '?').slice(0, 1).toUpperCase())}</span><div><h2 style="font-size:1.15rem">${esc(displayName())}${nameBadge()}</h2><div class="small muted">${esc(u.email)}</div>${state.isAdmin ? `<span class="badge mt-s">Admin</span>` : ''}${state.companion ? `<div class="mt-s">${compBadge()}</div>` : ''}</div>
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
    if (!DEMO) { await db.collection('challenge_signups').doc(email).set({ codename, email, timestamp:TS() }); await loadEmailJS(); await emailjs.send(EMAILJS_SERVICE, EMAILJS_CHALLENGE_TPL, { user_name:codename, user_email:email }); }
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
  playLive: () => { playingId = null; watchLive = true; render(true); },
  watchCheckLive: () => { playingId = null; watchLive = true; render(true); },
  pstart: () => pomo.running ? pomoPause() : pomoStart(),
  'preset-reset': pomoReset,
  pskip: () => pomoComplete(false),
  pmode: el => pomoMode(el.dataset.m),
  ppreset: el => { const p = PRESETS[el.dataset.p]; Object.assign(pomo.cfg, { focus:p.focus, short:p.short, long:p.long, every:p.longEvery }); pomo.cycle = 0; pomoMode('focus'); render(true); },
  todoToPl: async el => {                                          // chuyển việc của Focus thành việc hôm nay trong Planner (chuyển hẳn, không nhân đôi)
    const x = todos().find(v => v.id === el.dataset.id); if (!x || typeof plFocusEdit !== 'function') return;
    if (await plFocusEdit(ts => { if (ts.length >= PL_MAX) return false; ts.push(plClean({ title:x.text, day:plToday0(), start:'', dur:0, c:0, done:!!x.done })); return true; })) { saveTodos(todos().filter(v => v.id !== x.id)); renderTodos(); toast(t('todo_to_pl_done')); }
    else toast(t('pl_err'));
  },
  todoDel: el => { dropTodos([el.dataset.id]); renderTodos(); },
  todoClear: () => { dropTodos(todos().filter(x => x.done).map(x => x.id)); renderTodos(); },
  todoCur: el => { store.set('todo_cur', store.get('todo_cur', '') === el.dataset.id ? '' : el.dataset.id); renderTodos(); },
  fxTab: el => { ACTIONS.tabPick(el); store.set('fx_tab', el.dataset.k); },
  fsTab: el => { ACTIONS.tabPick(el); store.set('fs_tab', el.dataset.k); },
  fxPlEdit: el => { fxEdit = el.dataset.id; renderFocusPl(); setTimeout(() => { const f = document.querySelector('form.fx-edit input[name=ti]'); if (f) f.focus(); }, 30); },
  fxPlEditEnd: () => { fxEdit = ''; renderFocusPl(); },
  fxPlDel: el => {                                                  // như Planner: việc chưa xong của ngày đã bắt đầu thì hỏi ghi nhận "đã bỏ" hay xoá hẳn (nhập nhầm)
    const id = el.dataset.id, x = FX_PL.find(v => v.id === id); if (!x) return;
    if (x.done || x.carried) return ACTIONS.fxPlDelGo({ dataset:{ id, s:'' } });
    openModal(`<h3 style="margin-bottom:6px;padding-right:32px">${esc(t('pl_del_q'))}</h3><p class="small muted">${esc(t('pl_del_sub'))}</p>
      <div class="stack mt"><button type="button" class="btn primary" data-act="fxPlDelGo" data-id="${esc(id)}" data-s="x">${esc(t('pl_del_drop'))}</button><button type="button" class="btn ghost" data-act="fxPlDelGo" data-id="${esc(id)}" data-s="">${esc(t('pl_del_wipe'))}</button><button type="button" class="btn ghost" data-act="closeModal">${esc(t('cancel'))}</button></div>`, true);
  },
  fxPlDelGo: async el => {
    closeModal(); const id = el.dataset.id;
    if (!await plFocusRemove(id, el.dataset.s === 'x')) toast(t('pl_err'));
    if (store.get('todo_cur', '') === id) store.set('todo_cur', '');
    renderFocusPl();
  },
  rate: el => { reviewRating = +el.dataset.n; document.querySelectorAll('#rev-stars button').forEach(b => b.classList.toggle('on', +b.dataset.n === reviewRating)); },
  authTab: el => { authTab = el.dataset.t; render(true); },
  forgot: async () => { const m = $('au-email').value.trim(); if (!m) return $('au-err').textContent = t('email') + '?'; try { await auth.sendPasswordResetEmail(m); toast(t('reset_sent')); } catch (e) { $('au-err').textContent = authErr(e); } },
  signout: async () => { if (DEMO) return toast('Demo'); if (typeof plPushOff === 'function') await plPushOff(); await mjPushOff(); await auth.signOut(); myOrders = null; location.hash = '#/account'; },
  resendVerify: () => state.user.sendEmailVerification().then(() => toast(t('verify_sent'))).catch(e => toast(e.message)),
  download: async el => {
    try {
      if (DEMO) return toast('Demo: không có file');
      const d = await db.collection('products_private').doc(el.dataset.id).get(); if (!d.exists) return alert('Chưa có file cho sản phẩm này — hãy liên hệ chủ trang.');
      const f = d.data(); let url = f.fileUrl; if (f.storagePath && await loadStorage()) url = await storage.ref(f.storagePath).getDownloadURL();
      if (!url) return alert('Chưa có file cho sản phẩm này — hãy liên hệ chủ trang.'); window.open(url, '_blank', 'noopener');
    } catch (e) { alert(t('err_generic') + e.message); }
  }
});
renderCart();

/* =========================================================
   MOON JOURNEY — điểm danh đi theo con đường 480 ngày (moon-story.js, MJ_STOPS): mỗi ngày là một bước, chặng = đoạn giữa hai trạm.
   Mặt trăng đầy dần theo cả hành trình và chỉ tròn khi đi hết 480 ngày; thanh tiến độ nhỏ đếm ngày tới trạm kế tiếp. Cứ 14 ngày liên tiếp được +1 trăng tròn tích trữ,
   Thẻ "Kho trăng" cho biết số trăng còn dùng được, chuỗi hiện tại, chuỗi dài nhất và số ngày tới trăng kế tiếp (chỉ để vui, không đổi quyền lợi gói). Dữ liệu không đổi, mọi thứ tính lại từ chuỗi ngày.
   Dữ liệu lưu trong users/<uid>.moon = { startedAt, days:['YYYY-MM-DD',…], rounds (cũ), moons, best, saved:['YYYY-MM-DD',…] }
   Trăng tích trữ: moons = số trăng tròn đã nhận (14 ngày liên tiếp được 1), saved = những ngày lỡ đã được "vá" bằng trăng.
   Số trăng còn dùng được = moons − saved.length. Lỡ điểm danh mà còn đủ trăng thì được dùng trăng vá các ngày lỡ để giữ chuỗi
   (phải dùng trước khi điểm danh hôm nay; ngày vá được thêm vào days nên chuỗi tính tiếp như bình thường).
   ========================================================= */
const MOON_TOTAL = 30;
const MOON_EARN = 14;                                              // cứ đủ 14 ngày liên tiếp được +1 trăng tròn tích trữ (trước đây là 30)
const todayKey = () => DT.now().setZone(userTZ).toISODate();
const dayShift = (k, n) => DT.fromISO(k, { zone:userTZ }).plus({ days:n }).toISODate();
/* Chuỗi điểm danh kiểu Duolingo: chỉ tính các ngày liên tiếp kết thúc ở hôm nay hoặc hôm qua.
   Bỏ lỡ một ngày thì chuỗi đứt và về ngày 1 (broken = true, lost = độ dài chuỗi đã mất); số trăng tròn và huy hiệu (theo chuỗi dài nhất) vẫn giữ nguyên.
   Qua 30 ngày chuỗi vẫn cộng tiếp (chặng 2, 3…). */
const moonData = () => {
  const m = profile && profile.moon; if (!m) return null;
  let days = [...new Set(Array.isArray(m.days) ? m.days : [])].filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort(), broken = false, lost = 0, gap = [];
  const raw = days.length;
  if (days.length) {
    let i = days.length - 1; while (i > 0 && dayShift(days[i - 1], 1) === days[i]) i--;
    const run = days.slice(i), last = run[run.length - 1], today = todayKey();
    if (last === today || last === dayShift(today, -1)) days = run; else { lost = run.length; days = []; broken = true; }
    if (broken) for (let k = dayShift(last, 1); k < today && gap.length <= 31; k = dayShift(k, 1)) gap.push(k);   // các ngày đã lỡ, tính tới hôm qua
  }
  // đổi từ 30 sang 14 ngày: chuỗi dài nhất đã có được tính lại theo 14 ngày, nên không ai bị bớt trăng
  const best = Math.max(m.best || 0, days.length, lost), saved = Array.isArray(m.saved) ? m.saved : [], moons = Math.max(m.moons || 0, (m.rounds || 0) + (raw >= MOON_TOTAL ? 1 : 0), Math.floor(best / MOON_EARN)), balance = Math.max(0, moons - saved.length);
  const rescue = broken && gap.length && gap.length <= balance ? gap : null;      // đủ trăng để vá hết các ngày lỡ thì mới đề nghị
  return { startedAt:m.startedAt || Date.now(), days, rounds:m.rounds || 0, moons, best, saved, broken, lost, balance, rescue };
};
async function moonSave(m){
  const prev = profile.moon;
  profile.moon = m;
  let ok = true;
  if (!DEMO) try { await db.collection('users').doc(state.user.uid).set({ moon:m }, { merge:true }); store.set('moon_' + state.user.uid, m); }
  catch (e) { ok = false; profile.moon = prev; console.warn('moon save', e.code); toast(t('err_generic') + (e.code || e.message)); }   // lưu lỗi thì trả lại như cũ và báo cho người dùng
  render(true);
  return ok;
}
/* Ưu đãi mốc 60 ngày: tặng thêm tháng Người đồng hành (mọi cách thanh toán), dùng một lần, có hạn. Không giảm giá.
   Lưu ở moon_rewards/<uid> = { uid, months, expires, status:'unused'|'used', createdAt }; khách chỉ tạo được 1 lần (rules kiểm số tháng và hạn theo cài đặt của admin),
   admin duyệt thanh toán thì tự cộng tháng tặng và đánh dấu 'used'. Số tháng và số ngày hiệu lực do admin chỉnh ở tab Thanh toán (settings/payments.moonRewardMonths / moonRewardDays / moonRewardOn).
   Ưu đãi nhận trước đây (có pct, không có months) vẫn dùng được: tính theo số tháng đang cài đặt. */
const MOON_REWARD_AT = 60;
let mrLoading = false;
const moonRewardCfg = (src = payments) => ({ on:src.moonRewardOn !== false, months:Math.min(12, Math.max(1, Math.round(+src.moonRewardMonths) || 1)), days:Math.min(365, Math.max(1, Math.round(+src.moonRewardDays) || 30)) });
const moonRewardActive = () => { const r = state.moonReward; return r && r.status === 'unused' && tsMs(r.expires) > Date.now() ? r : null; };
const moonRewardMonths = (r, src = payments) => r && r.months !== undefined ? Math.min(12, Math.max(1, Math.round(+r.months) || 1)) : moonRewardCfg(src).months;     // ưu đãi cũ (giảm %) không có months: tặng theo số tháng đang cài đặt
const fmtDay = ms => DT.fromMillis(ms).setZone(userTZ).toFormat('dd/MM/yyyy');
async function loadMoonReward(force){
  if (!state.user || DEMO || mrLoading || (!force && state.moonReward !== undefined)) return;
  mrLoading = true;
  try { const d = await db.collection('moon_rewards').doc(state.user.uid).get(); state.moonReward = d.exists ? d.data() : null; }
  catch (e) { console.warn('moon reward', e.code); state.moonReward = null; }
  mrLoading = false; render(true);
}
async function claimMoonReward(){
  const u = state.user; if (!u || state.moonReward) return false;
  try {
    const c = moonRewardCfg(DEMO ? payments : (await db.collection('settings').doc('payments').get()).data() || {});      // đọc cài đặt mới nhất để khớp với rules
    if (!c.on) return false;
    const r = { uid:u.uid, months:c.months, expires:DEMO ? Date.now() + c.days * 864e5 : firebase.firestore.Timestamp.fromMillis(Date.now() + c.days * 864e5), status:'unused', createdAt:DEMO ? Date.now() : TS() };
    if (!DEMO) await db.collection('moon_rewards').doc(u.uid).set(r);
    state.moonReward = { ...r, createdAt:Date.now() }; return true;
  } catch (e) { console.warn('claim reward', e.code); return false; }
}
function moonRewardCard(m){
  const c = moonRewardCfg(); if (!c.on && !state.moonReward) return '';
  if (m.best < MOON_REWARD_AT) return `<p class="small faint" style="text-align:center">🎁 ${esc(t('mr_teaser', { n:MOON_REWARD_AT, x:bonusText(c.months) }))}</p>`;
  const r = state.moonReward; if (r === undefined && !DEMO) { loadMoonReward(); return ''; }
  let inner;
  if (!r) inner = `<p class="small">${esc(t('mr_can', { x:bonusText(c.months), d:c.days }))}</p><button class="btn primary" data-act="moonReward">🎁 ${esc(t('mr_claim'))}</button>`;
  else if (r.status === 'used') inner = `<p class="small muted">${esc(t('mr_used'))}</p>`;
  else if (tsMs(r.expires) <= Date.now()) inner = `<p class="small muted">${esc(t('mr_expired'))}</p>`;
  else inner = `<p class="small">${esc(t('mr_have', { x:bonusText(moonRewardMonths(r)), d:fmtDay(tsMs(r.expires)) }))}</p><a class="btn primary" href="#/donate">${ic('heart', 'sm')} ${esc(t('mr_use'))}</a>`;
  return `<section class="card pad stack"><div class="card-h"><h3>🎁 ${esc(t('mr_title'))}</h3></div>${inner}<p class="small faint">${esc(t('mr_note'))}</p></section>`;
}
const moonRoad = () => MJ_STOPS[MJ_STOPS.length - 1].day;           // độ dài con đường (480 ngày)
/* Chặng đang đi: đoạn giữa hai trạm chứa ngày cần tới (hôm nay đã điểm danh thì là ngày n, chưa thì n + 1).
   Đi hết đường thì cứ 30 ngày là một chặng thêm. a = ngày của trạm trước, b = ngày của trạm kế tiếp. */
function moonLeg(n, doneToday){
  const S = MJ_STOPS, end = moonRoad(), want = Math.max(1, doneToday ? n : n + 1);
  if (want > end) { const k = Math.floor((want - end - 1) / MOON_TOTAL); return { i:S.length - 1 + k, a:end + k * MOON_TOTAL, b:end + (k + 1) * MOON_TOTAL }; }
  const i = S.findIndex((s, j) => j < S.length - 1 && want <= S[j + 1].day);
  return { i, a:S[i].day, b:S[i + 1].day };
}
const moonDayText = n => n <= moonRoad() ? t('club_day', { d:n, t:moonRoad() }) : t('mjs_day', { n });
function clubPromo(){
  const m = moonData(), n = m ? m.days.length : 0;
  return `<section class="card pad club-promo" style="margin-top:34px"><div class="moon-sm">${moonSVG(state.user && m ? Math.min(n, moonRoad()) : 8, state.user && m ? moonRoad() : MOON_TOTAL)}</div>
    <div><h2 style="font-size:1.4rem" ${cms('club_title')}>${esc(ctext('club_title'))}</h2><p class="muted mt-s" ${cms('club_sub')}>${esc(ctext('club_sub'))}</p>
    <a class="btn primary mt" href="#/club">${state.user && m ? esc(moonDayText(n)) : esc(t('club_start'))}</a></div></section>`;
}
/* lịch cả hành trình: mỗi chấm một ngày, màu theo tuyến của chặng đó (giống bản đồ), trạm dừng là vòng tròn to hơn */
/* kho trăng: số trăng còn dùng được, chuỗi hiện tại / dài nhất, còn mấy ngày tới trăng kế tiếp (đủ MOON_EARN ngày liên tiếp) */
function moonBankCard(m, doneToday){
  const n = m.days.length, k = MOON_EARN - (n % MOON_EARN) || MOON_EARN, row = (a, b) => `<div class="mj-bank-r"><span class="faint">${esc(a)}</span><b>${esc(b)}</b></div>`;
  return `<section class="card pad mj-bank-c"><div class="card-h"><h3>${esc(t('mj_bank_t'))}</h3></div>
    <div class="mj-bank-top"><span class="mj-bank-n">🌕 × ${m.balance}</span><span class="small faint">${esc(t('mj_bank_note'))}</span></div>
    ${row(t('mj_cur'), t('mj_locked', { n }))}${row(t('mj_best_l'), t('mj_locked', { n:m.best }))}${row(t('mj_nextmoon'), t(k === 1 ? (doneToday ? 'mj_nextmoon_tmr' : 'mj_nextmoon_today') : 'mj_nextmoon_v', { n:k }))}${m.saved.length ? row(t('mj_used'), String(m.saved.length)) : ''}</section>`;
}
function moonGrid(m, doneToday){
  const n = m.days.length, end = moonRoad(), total = Math.max(end, Math.ceil(n / 24) * 24), C = 24, G = 13.5, rows = Math.ceil(total / C), stopAt = {};
  MJ_STOPS.forEach((s, i) => { if (s.day) stopAt[s.day] = i; });
  let leg = 0, out = '';
  for (let d = 1; d <= total; d++) {
    while (leg < MJ_STOPS.length - 1 && d > MJ_STOPS[leg + 1].day) leg++;
    const x = ((d - 1) % C) * G + G / 2, y = Math.floor((d - 1) / C) * G + G / 2, on = d <= n, col = d > end ? '#ffe44d' : MJ_LINE[mjZone(leg)], st = stopAt[d] !== undefined, next = d === n + 1 && !doneToday, sv = on && m.saved.includes(m.days[d - 1]);
    out += `<circle cx="${x}" cy="${y}" r="${st ? 5.4 : 3.6}" style="--c:${col}" class="${on ? 'on' : ''}${st ? ' st' : ''}${next ? ' nx' : ''}${sv ? ' sv' : ''}">${on && m.days[d - 1] ? `<title>${esc(t('mjs_day', { n:d }))} · ${esc(m.days[d - 1])}${sv ? ' · 🌕' : ''}</title>` : ''}</circle>`;
  }
  return `<svg class="mj-grid" viewBox="0 0 ${C * G} ${rows * G}" role="img" aria-label="${esc(moonDayText(n))}">${out}</svg>`;
}
const mjHowCard = () => `<section class="card pad"><h3 style="margin-bottom:10px">${esc(t('club_how'))}</h3><ol class="steps"><li>${esc(t('mj_h1'))}</li><li>${esc(t('mj_h2', { t:moonRoad() }))}</li><li>${esc(t('mj_h3', { e:MOON_EARN }))}</li></ol></section>`;
PAGES.club = function(){
  const m = moonData(), n = m ? m.days.length : 0, doneToday = !!(m && m.days.includes(todayKey())), L = moonLeg(n, doneToday), d = n - L.a, span = L.b - L.a,
    arrived = doneToday && d >= span, full = n >= moonRoad();      // arrived: hôm nay vừa tới một trạm; full: trăng chỉ tròn khi đi hết con đường
  let main = '';
  if (!state.user) main = `<div class="card pad stack" style="align-items:center;text-align:center"><div class="moon-big">${moonSVG(6, MOON_TOTAL)}</div><p class="muted">${esc(t('club_login'))}</p><a class="btn primary" href="#/account">${esc(t('club_login_btn'))}</a></div>`;
  else if (!DEMO && !state.profileReady) {                       // chưa tải xong hồ sơ: hiện bản đã nhớ (chỉ xem), không cho bấm
    const cm = store.get('moon_' + state.user.uid, null), cn = cm && Array.isArray(cm.days) ? cm.days.length : 0;
    main = `<div class="card pad stack" style="align-items:center;text-align:center"><div class="moon-big">${moonSVG(Math.min(cn, moonRoad()), moonRoad())}</div>${state.profileFailed ? `<p class="muted">${esc(t('club_load_fail'))}</p>${state.profileErr ? `<p class="small faint">${esc(state.profileErr)}</p>` : ''}<button class="btn primary" data-act="moonRetry">${esc(t('club_retry'))}</button>` : `<p class="muted">${cm ? esc(moonDayText(cn)) + ' · ' : ''}${esc(t('loading'))}</p>`}</div>`;
  }   // chưa tải xong hồ sơ: không hiện nút Bắt đầu (bấm nhầm sẽ xoá các ngày đã điểm danh)
  else if (!m) main = `<div class="card pad stack" style="align-items:center;text-align:center"><div class="moon-big">${moonSVG(0, MOON_TOTAL)}</div><button class="btn primary lg" data-act="moonStart">${esc(t('club_start'))}</button></div>`;
  else {
    const left = span - d;                                            // số ngày còn lại tới trạm kế tiếp
    main = `<div class="card pad stack" style="align-items:center;text-align:center"><div class="moon-big ${full ? 'full' : ''}">${moonSVG(Math.min(n, moonRoad()), moonRoad())}</div>
      <h2 style="font-size:1.5rem">${esc(full ? t('club_full') : moonDayText(n))}</h2>
      <span class="badge">${esc(t('mj_stage', { n:L.i + 1 }))}${full ? ' · ' + esc(moonDayText(n)) : ''}</span>
      ${arrived ? `<p class="muted">${esc(n > moonRoad() ? t('mj_after') : t('club_full_sub'))}</p>` : `<div class="progress" style="width:100%;max-width:300px"><i style="width:${d / span * 100}%"></i></div><p class="small faint">${esc(L.a >= moonRoad() ? t('mj_after') : left > 1 ? t('mj_leg', { n:left }) : t(doneToday ? 'mj_leg_one' : 'mj_leg_today'))}</p>`}
      ${!doneToday && m.rescue ? `<div class="mj-rescue stack"><p class="small"><b>🌕 ${esc(t('mj_rescue', { g:m.rescue.length, n:m.lost }))}</b></p><button class="btn primary" data-act="moonRescue">${esc(t('mj_rescue_btn', { g:m.rescue.length }))}</button><p class="small faint">${esc(t('mj_rescue_note'))}</p></div>` : ''}
      <button class="btn ${m.rescue && !doneToday ? 'ghost' : 'primary'} lg" data-act="moonCheckin" ${doneToday ? 'disabled' : ''}>${ic('check', 'sm')} ${esc(doneToday ? t('club_done_today') : t('club_checkin'))}</button>
      ${mjRemHTML(true)}
      ${!doneToday && !m.rescue ? `<p class="small" style="color:${m.broken ? 'var(--danger)' : 'var(--ink3)'}">${esc(m.broken ? t('club_broken', { n:m.lost }) : n ? t('club_keep') : '')}</p>` : ''}
      ${state.companion ? `${compBadge()}${state.companionUntil ? `<div class="small faint">${esc(compUntilText())}</div>` : ''}` : ''}</div>`;
  }
  /* bố cục: thẻ điểm danh + con đường tìm Moon (moon-story.js) + chương mới nhất, rồi lịch cả hành trình, kho trăng, ưu đãi */
  page(`${head('club_title', 'club_sub', '', 'gaze', 9)}
    <div class="mj-layout"><div class="mj-a-status">${main}</div><div class="mj-a-map">${mjMapCard(m)}</div>
      <div class="mj-a-side stack">${mjLatestCard(m)}</div>
      <div class="mj-a-tabs">${m ? tabsHTML('mj', [   // lịch 480 ngày · kho trăng · cách chơi: gom thành tab, đỡ một đoạn cuộn dài
          ['grid', t('mj_grid', { t:moonRoad() }), `<section class="card pad"><div class="card-h"><h3>${esc(t('mj_grid', { t:moonRoad() }))}</h3><span class="small faint">${esc(t('mj_cal', { n:L.i + 1, a:L.a + 1, b:L.b }))}</span></div>${moonGrid(m, doneToday)}<p class="small faint mt-s">${esc(t('mj_grid_note'))}</p></section>`],
          ['bank', t('mj_bank_t'), `<div class="stack">${moonBankCard(m, doneToday)}${moonRewardCard(m)}</div>`],
          ['how', t('club_how'), mjHowCard()]]) : mjHowCard()}</div></div>
    ${challengeCard()}`);   // thẻ đã có tiêu đề riêng (ch_title), không thêm tiêu đề trùng phía trên
  mjMount();
};
/* ---------- nhắc giữ chuỗi (bật ở bảng chuông 🔔 hoặc ngay dưới nút điểm danh; mặc định tắt, mỗi máy bật riêng) ----------
   Từ MJ_REM_AT (21:00 theo múi giờ của khách) mà hôm nay chưa điểm danh thì nhắc MỘT lần trong ngày:
   - chuỗi còn (lần cuối điểm danh là hôm qua): điểm danh trước nửa đêm để giữ chuỗi; còn trăng tích trữ thì nói thêm là lỡ quên vẫn giữ được bằng trăng;
   - chuỗi vừa đứt nhưng đủ trăng để vá (m.rescue): mở Hành trình trăng dùng trăng rồi điểm danh.
   Đang mở web: mjRemTick nhắc trong trang (toast + chuông + thông báo trình duyệt). Đã đóng web: máy này lưu token vào users/<uid>.mjPush
   ({ on, tokens, tz, lang }), GitHub Actions (scripts/push-moon.mjs) đọc users/<uid>.moon và gửi cùng câu chữ, cùng tag 'mj-<ngày>' nên chỉ hiện 1 thông báo. */
const MJ_REM_AT = 21 * 60, mjRemH = () => `${String(MJ_REM_AT / 60 | 0).padStart(2, '0')}:${String(MJ_REM_AT % 60).padStart(2, '0')}`;
const mjRemOn = () => !!store.get('mj_rem', false);
function mjRemText(m){
  if (!m || m.days.includes(todayKey())) return '';
  if (m.days.length) return t('mjr_keep', { n:m.days.length }) + (m.balance ? ' ' + t('mjr_moon', { b:m.balance }) : '');
  return m.rescue ? t('mjr_rescue', { n:m.lost, g:m.rescue.length }) : '';
}
async function mjNotify(body, tag){                                 // giống plNotify: điện thoại Android chỉ cho hiện thông báo qua service worker
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const opts = { body, tag, renotify:true, icon:'icons/icon-192.png', data:{ url:location.href.split('#')[0] + '#/club' } };
  try { const reg = await swRegister(); if (reg && reg.showNotification) return await reg.showNotification(t('nav_club'), opts); } catch (e) {}
  try { new Notification(t('nav_club'), opts); } catch (e) {}
}
const mjPushOk = () => typeof pushSupported === 'function' && pushSupported() && Notification.permission === 'granted';
async function mjPushSync(force){                                   // lưu token của máy này cho máy gửi (ghi lại mỗi tuần, hoặc khi token / ngôn ngữ / múi giờ đổi)
  const u = state.user; if (!u || DEMO || !mjRemOn() || !mjPushOk() || !await swRegister()) return false;
  const reg = await navigator.serviceWorker.ready, m = await loadMessaging();
  const token = await m.getToken({ vapidKey:PUSH_VAPID, serviceWorkerRegistration:reg }); if (!token) return false;
  const old = store.get('mj_push', null), sig = u.uid + '|' + token + '|' + state.lang + '|' + userTZ;
  if (!force && old && old.sig === sig && Date.now() - old.t < 7 * 864e5) return true;
  const F = firebase.firestore.FieldValue, ref = db.collection('users').doc(u.uid);
  if (old && old.uid === u.uid && old.token !== token) await ref.update({ 'mjPush.tokens':F.arrayRemove(old.token) }).catch(() => {});   // token cũ (trình duyệt đã đổi token)
  await ref.set({ mjPush:{ on:true, tokens:F.arrayUnion(token), tz:String(userTZ).slice(0, 64), lang:state.lang, at:TS() } }, { merge:true });
  store.set('mj_push', { uid:u.uid, token, sig, t:Date.now() });
  return true;
}
async function mjPushOff(){                                         // tắt nhắc / đăng xuất: máy này thôi nhận nhắc khi đã đóng web
  const old = store.get('mj_push', null); store.set('mj_push', null);
  if (!old || DEMO || !state.user || state.user.uid !== old.uid) return;
  await db.collection('users').doc(old.uid).update({ 'mjPush.tokens':firebase.firestore.FieldValue.arrayRemove(old.token) }).catch(() => {});
}
const mjPushHere = () => { const p = store.get('mj_push', null); return !!(p && state.user && p.uid === state.user.uid && mjPushOk()); };
let mjPushKey = '';
function mjRemTick(){
  const u = state.user; if (!u || !mjRemOn() || (!DEMO && !state.profileReady)) return;
  const pk = u.uid + '|' + state.lang + '|' + userTZ;                 // mở web / đổi tài khoản, ngôn ngữ, múi giờ: báo lại cho máy gửi
  if (pk !== mjPushKey) { mjPushKey = pk; mjPushSync().catch(e => console.warn('moon push', e)); }
  const now = DT.now().setZone(userTZ), day = now.toISODate(), k = u.uid + '|' + day;
  if (now.hour * 60 + now.minute < MJ_REM_AT || store.get('mj_rem_sent', '') === k) return;
  const body = mjRemText(moonData()); if (!body) return;
  store.set('mj_rem_sent', k); soundPlay('moon'); toast('🌙 ' + body, 9000); mjNotify(body, 'mj-' + day);
}
setInterval(mjRemTick, 30000);
async function mjRemSet(on){
  if (on && typeof audio === 'function') audio();                   // mở khoá chuông ngay trong lần bấm này
  if (on && typeof Notification !== 'undefined' && Notification.permission === 'default') { try { await Notification.requestPermission(); } catch (e) {} }
  store.set('mj_rem', on);
  try { await (on ? mjPushSync(true) : mjPushOff()); } catch (e) { console.warn('moon push', e); }
  mjPushKey = ''; toast(t(on ? 'mjr_on_toast' : 'mjr_off_toast')); renderLiveRem(); if (route.name === 'club') render(true);
}
CHANGES.mjRemOn = el => mjRemSet(el.checked);
function mjRemHTML(club){                                           // club: dòng gọn dưới nút điểm danh; không thì dùng trong bảng chuông
  if (!state.user) return '';
  const on = mjRemOn(), h = mjRemH();
  const sw = `<div class="switch${club ? ' mj-rem' : ''}"><span>${club ? '🔔 ' + esc(t('mjr_on', { h })) : `<b>${esc(t('mjr_on', { h }))}</b>`}</span><input type="checkbox" data-change="mjRemOn" ${on ? 'checked' : ''} aria-label="${esc(t('mjr_on', { h }))}"></div>`;
  return club ? sw : `${sw}<hr class="lr-hr">`;
}

/* =========================================================
   DONATE / COMPANIONS
   ========================================================= */
/* Báo đã thanh toán Companions: ghi companion_requests/<uid>; admin thấy ở tab Thành viên và bấm duyệt (mở Planner cho tài khoản đó) */
/* Gia hạn chỉ mở khi còn <= COMP_RENEW_DAYS ngày; admin duyệt thì cộng tiếp từ ngày hết hạn cũ (admin.js approveCompanion) nên khách không mất ngày nào */
const COMP_RENEW_DAYS = 7;
const compDaysLeft = () => state.companionUntil ? Math.round(DT.fromISO(state.companionUntil, { zone:userTZ }).diff(DT.now().setZone(userTZ).startOf('day'), 'days').days) : Infinity;     // 0 = hôm nay là ngày cuối
const compUntilDay = () => DT.fromISO(state.companionUntil).toFormat('dd/MM/yyyy');
const compRenewOpen = () => !!(state.companion && state.companionUntil && compDaysLeft() <= COMP_RENEW_DAYS);
const compUntilText = () => { const n = compDaysLeft(); return t(n <= 0 ? 'cc_until_today' : 'cc_until', { d:compUntilDay(), n }); };
function compClaimHTML(bare){                                     // bare: bỏ tiêu đề "Đã thanh toán rồi?" (trang Support đã có tiêu đề bước 3)
  const fmt = ts => DT.fromMillis(tsMs(ts)).setZone(userTZ).toFormat('dd/MM'), r = state.compReq, ttl = bare ? '' : `<b>${esc(t('cc_title'))}</b>`;
  if (!state.user) return `<div class="limit-box stack">${ttl}<p class="small muted">${esc(t('cc_login'))}</p><a class="btn secondary" href="#/account">${esc(t('nav_signin'))}</a></div>`;
  const pending = r && r.status === 'pending' ? `<p class="small muted">${esc(t(state.companion ? 'cc_renew_pending' : 'cc_pending', { d:fmt(r.createdAt) }))}</p>` : '';
  if (state.companion) {
    if (!state.companionUntil) return `<div class="limit-box stack"><p class="small" style="color:var(--live)">${esc(t('cc_active_open'))}</p></div>`;
    const open = compRenewOpen(), from = DT.fromISO(state.companionUntil).minus({ days:COMP_RENEW_DAYS }).toFormat('dd/MM/yyyy');
    return `<div class="limit-box stack"><b>${esc(t('cc_plan_title'))}</b><p class="small" style="color:var(${open ? '--accent-strong' : '--live'})">${esc(compUntilText())}</p>${pending
      || (open ? `<p class="small muted">${esc(t('cc_renew_hint', { d:compUntilDay() }))}</p><button class="btn secondary" data-act="compClaim">${ic('check', 'sm')} ${esc(t('cc_renew'))}</button>`
      : `<p class="small faint">${esc(t('cc_renew_from', { d:from, n:COMP_RENEW_DAYS }))}</p>`)}</div>`;
  }
  const status = pending || (r && r.status === 'rejected' ? `<p class="small" style="color:var(--danger)">${esc(t('cc_rejected'))}</p>` : '');
  return `<div class="limit-box stack">${ttl}<p class="small muted">${esc(t('cc_sub'))}</p>${status}${pending ? '' : `<button class="btn secondary" data-act="compClaim">${ic('check', 'sm')} ${esc(t('cc_btn'))}</button>`}</div>`;
}
let compPay = null, compMonths = 1;
/* Gói VND: 1 tháng = giá gốc; 3 tháng giảm 10%, 12 tháng giảm 25% (làm tròn nghìn) để người dùng trả dài hạn có lợi hơn, còn mình có tiền ổn định */
const COMP_DISC = { 1:1, 3:.9, 12:.75 };
Object.assign(I18N.en, { comp_pay_pp:'USD (PayPal)', goal_title:'Keeping the site and the study group running', goal_note:'Every companion helps cover the cost of keeping the site and the study group running.', goal_done:'Goal reached. Thank you for keeping this place going!', goal_of:'{n} / {m} companions', perday:'That is about {x} a day.', tr_left:'Your free trial ends in {d} days. Become a companion to keep the Planner, the study group and your weekly rank.', tr_left1:'Your free trial ends today or tomorrow. Become a companion to keep the Planner, the study group and your weekly rank.', tr_cta:'See the Companion plan' });
Object.assign(I18N.vi, { comp_pay_pp:'USD (PayPal)', goal_title:'Duy trì web và nhóm học', goal_note:'Mỗi Người đồng hành góp một phần chi phí để web và nhóm học luôn chạy.', goal_done:'Đã đạt mục tiêu. Cảm ơn bạn đã giữ cho nơi này luôn sáng đèn!', goal_of:'{n} / {m} người đồng hành', perday:'Chỉ khoảng {x} mỗi ngày, ít hơn một ly trà đá.', tr_left:'Gói dùng thử còn {d} ngày. Trở thành Người đồng hành để giữ Planner, nhóm học và hạng tuần của bạn.', tr_left1:'Gói dùng thử hết hạn hôm nay hoặc ngày mai. Trở thành Người đồng hành để giữ Planner, nhóm học và hạng tuần của bạn.', tr_cta:'Xem gói Người đồng hành' });
const goalBar = () => {   // thanh mục tiêu duy trì web (admin nhập ở tab Gói Người đồng hành)
  const m = Math.round(+payments.goalTarget) || 0; if (m <= 0) return '';
  const n = Math.max(0, Math.round(+payments.goalNow) || 0), p = Math.min(100, Math.round(n / m * 100));
  return `<div class="goal"><div class="row between small"><b>${esc(payments.goalText || t('goal_title'))}</b><span class="faint">${esc(t('goal_of', { n, m }))}</span></div><div class="progress mt-s" role="progressbar" aria-valuemin="0" aria-valuemax="${m}" aria-valuenow="${Math.min(n, m)}"><i style="width:${p}%"></i></div><p class="small faint">${esc(t(n >= m ? 'goal_done' : 'goal_note'))}</p></div>`;
};
const perDay = (price, months, cur) => `<p class="small muted perday">${esc(t('perday', { x:cur === 'VND' ? money(Math.round(price / (30 * months) / 100) * 100, 'VND') : '$' + (price / (30 * months)).toFixed(2) }))}</p>`;
/* nhắc khi gói dùng thử sắp hết: người dùng thử đã có thói quen và hạng tuần nên đây là lúc dễ chuyển sang Người đồng hành nhất */
const trialNudge = () => {
  if (DEMO || state.companion || state.isAdmin || !trialActive()) return '';
  const d = Math.ceil((state.trial.endsAt - Date.now()) / 864e5); if (d > 7) return '';
  return `<div class="limit-box stack mt" style="border-color:var(--accent)"><p class="small" style="margin:0">⏳ ${esc(t(d <= 1 ? 'tr_left1' : 'tr_left', { d }))}</p><div class="row"><a class="btn primary sm" href="#/donate">${ic('heart', 'sm')} ${esc(t('tr_cta'))}</a></div></div>`;
};
const compBase = () => Math.round(+payments.companionVND) || 59000;
const compPrice = m => m === 1 ? compBase() : Math.round(compBase() * m * COMP_DISC[m] / 1000) * 1000;
const compBaseUSD = () => +payments.companionUSD || 3;
const compPriceUSD = m => m === 1 ? compBaseUSD() : Math.round(compBaseUSD() * m * COMP_DISC[m]);
/* Khuyến mãi "tặng thêm tháng" cho gói 3 / 12 tháng (settings/payments: promoOn, promoLabel, promoMonths3, promoMonths12 = số tháng tặng, mặc định 1; promoStart, promoEnd = YYYY-MM-DD theo giờ Việt Nam).
   Không giảm giá: áp dụng cho MỌI cách thanh toán (VND, Ko-fi, PayPal) vì admin tự đặt ngày hết hạn khi duyệt (admin.js cộng tháng tặng vào hạn). */
const promoDay = ms => DT.fromMillis(ms).setZone('Asia/Ho_Chi_Minh').toISODate();
const promoActive = (ms = Date.now()) => { const d = promoDay(ms); return payments.promoOn === true && !(payments.promoStart && d < payments.promoStart) && !(payments.promoEnd && d > payments.promoEnd); };
function compBonusMonths(m, ms = Date.now()){
  if (m === 1 || !promoActive(ms)) return 0;
  const v = payments['promoMonths' + m]; return Math.min(12, Math.max(0, v === undefined || v === '' ? 1 : Math.round(+v) || 0));
}
const bonusText = n => t(n === 1 ? 'promo_m1' : 'promo_mn', { n });
const rewardBanner = rw => rw ? `<div class="limit-box small" style="border-color:var(--accent)">🎁 ${esc(t('mr_banner', { x:bonusText(moonRewardMonths(rw)), d:fmtDay(tsMs(rw.expires)) }))}</div>` : '';
function promoBanner(){
  const parts = [3, 12].map(m => compBonusMonths(m) ? t('promo_plan' + m, { x:bonusText(compBonusMonths(m)) }) : '').filter(Boolean); if (!parts.length) return '';
  return `<div class="limit-box small" style="border-color:var(--accent)">🔥 ${esc(t('promo_banner', { name:payments.promoLabel || t('promo_default'), parts:parts.join(' · ') }))}${payments.promoEnd ? esc(t('promo_until', { d:payments.promoEnd.split('-').reverse().join('/') })) : ''}</div>`;
}
const bonusChip = m => compBonusMonths(m) ? ` <small>${esc(t(compBonusMonths(m) === 1 ? 'promo_chip1' : 'promo_chipn', { n:compBonusMonths(m) }))}</small>` : '';
const compUsdUrl = m => {                                          // 1 tháng: Ko-fi Membership (tự gia hạn); 3/12 tháng: trả một lần qua PayPal.me (hoặc Ko-fi nếu chưa có PayPal)
  const pp = payments.paypal || '', amt = compPriceUSD(m);
  if ((m > 1 || !payments.companionUrl) && pp) return /paypal\.me\/|paypal\.com\/paypalme\//i.test(pp) ? pp.replace(/\/+$/, '') + '/' + amt + 'USD' : pp;
  return m > 1 && payments.kofi ? payments.kofi : payments.companionUrl || pp;
};                                                // 'vnd' | 'kofi': cách trả đang chọn ở thẻ Người đồng hành
const mailNote = e => String(e || '').trim().toLowerCase().slice(0, 50);                 // nội dung chuyển khoản = email (ngân hàng thường giới hạn 25-50 ký tự)
const compCode = () => state.user && state.user.email ? mailNote(state.user.email) : 'EPCP' + (state.user ? state.user.uid.slice(0, 6).toUpperCase() : '');     // nội dung chuyển khoản = email đăng ký tài khoản (mỗi người một khác, admin đối chiếu theo email); tài khoản không có email thì dùng mã EPCP + 6 ký tự uid
const compPayMode = () => { const bank = payments.bankBin && payments.accountNo, kofi = payments.companionUrl || payments.paypal; return compPay === 'vnd' && bank || compPay === 'kofi' && kofi ? compPay : (bank && (effCurrency() === 'VND' || !kofi) ? 'vnd' : kofi ? 'kofi' : ''); };
/* Thẻ Người đồng hành chia 2 phần: plan = cách trả + chọn số tháng (bước 1), pay = mã QR / nút Ko-fi (bước 2) */
function compPayHTML(){
  const bank = payments.bankBin && payments.accountNo, kofi = payments.companionUrl || payments.paypal, mode = compPayMode(); if (!mode) return null;
  const amt = compPrice(compMonths), code = compCode(), cp = v => `<button type="button" class="btn secondary sm" data-act="copy" data-v="${esc(v)}">${esc(t('copy'))}</button>`;
  const seg = bank && kofi ? `<div class="seg"><button type="button" class="${mode === 'vnd' ? 'on' : ''}" data-act="compPay" data-m="vnd">${esc(t('comp_pay_vn'))}</button><button type="button" class="${mode === 'kofi' ? 'on' : ''}" data-act="compPay" data-m="kofi">${esc(t(payments.companionUrl ? 'comp_pay_kofi' : 'comp_pay_pp'))}</button></div>` : '';
  const banners = `${promoBanner()}${rewardBanner(moonRewardActive())}`;
  if (mode === 'kofi') {
    const um = payments.paypal ? compMonths : 1, sub = um === 1 && !!payments.companionUrl;   // sub: gói Ko-fi/Patreon tự gia hạn; không có thì mọi gói trả một lần bằng PayPal
    return { plan:`${seg}${banners}<div class="row">${(payments.paypal ? [1, 3, 12] : [1]).map(m => `<button type="button" class="chip ${m === um ? 'on' : ''}" data-act="compMonths" data-m="${m}">${esc(t('comp_plan_' + m))} · ${money(compPriceUSD(m), 'USD')}${m > 1 ? ` <small>${esc(t('comp_save', { p:Math.round((1 - compPriceUSD(m) / (compBaseUSD() * m)) * 100) }))}</small>` : ''}${bonusChip(m)}</button>`).join('')}</div>${perDay(compPriceUSD(um), um, 'USD')}`,
      pay:`<a class="btn primary lg" target="_blank" rel="noopener" href="${esc(safeUrl(compUsdUrl(um)))}">${ic('heart', 'sm')} ${esc(t(sub ? 'comp_cta' : 'comp_pay_prepaid', { a:money(compPriceUSD(um), 'USD') }))}</a>
    <p class="small faint">${esc(t(sub ? 'comp_usd_note1' : 'comp_usd_note'))}</p>` };
  }
  const plan = `${seg}${banners}<div class="row">${[1, 3, 12].map(m => { const pr = compPrice(m); return `<button type="button" class="chip ${m === compMonths ? 'on' : ''}" data-act="compMonths" data-m="${m}">${esc(t('comp_plan_' + m))} · ${money(pr, 'VND')}${m > 1 ? ` <small>${esc(t('comp_save', { p:Math.round((1 - pr / (compBase() * m)) * 100) }))}</small>` : ''}${bonusChip(m)}</button>`; }).join('')}</div>${perDay(compPrice(compMonths), compMonths, 'VND')}`;
  if (!state.user) return { plan, pay:`<div class="limit-box stack"><p class="small muted">${esc(t('comp_vnd_login'))}</p><a class="btn secondary" href="#/account">${esc(t('signin'))}</a></div>`, login:true };
  return { plan, pay:`<img class="qr" alt="VietQR" src="https://img.vietqr.io/image/${encodeURIComponent(payments.bankBin)}-${encodeURIComponent(payments.accountNo)}-compact2.png?amount=${amt}&addInfo=${encodeURIComponent(code)}&accountName=${encodeURIComponent(payments.accountName || '')}"><p class="small muted" style="text-align:center">${esc(t('donate_scan'))}</p>
    <div class="kv"><div class="kvr"><span>${esc(t('acc_no'))}</span><b>${esc(payments.accountNo)}</b>${cp(payments.accountNo)}</div><div class="kvr"><span>${esc(t('comp_vnd_sum'))}</span><b>${esc(String(amt))}</b>${cp(String(amt))}</div><div class="kvr"><span>${esc(t('donate_note'))}</span><b>${esc(code)}</b>${cp(code)}</div></div><p class="small faint">${esc(t(state.user.email ? 'comp_vnd_mail' : 'comp_vnd_hint'))}</p>` };
}
let donAmt = null, donCur = null, donMail = '';
const donNote = () => state.user && state.user.email ? mailNote(state.user.email) : (/^\S+@\S+\.\S+$/.test(donMail.trim()) ? mailNote(donMail) : 'EP DONATE');
const parseAmts = (s, d) => { const a = String(s || '').split(/[,\s]+/).map(Number).filter(n => n > 0); return a.length ? a : d; };
/* mục cảm ơn những người đồng hành (tên do admin chọn hiện, xem tab Thành viên) */
const thanksCard = () => { const l = thanksList(); return l.length ? `<section class="card pad thanks mt"><div class="card-h"><h2 ${cms('thanks_title')}>${ic('heart', 'sm')} ${esc(ctext('thanks_title'))}</h2></div><p class="muted small" ${cms('thanks_text')}>${esc(ctext('thanks_text'))}</p><div class="thanks-list">${l.map(x => { const c = compTier(x.since); return c ? `<span class="thanks-chip ct${c.tier}" title="${esc(t('ct_for', { d:c.len }))}"><i class="ct-moon" aria-hidden="true">${c.moon}</i> ${esc(x.name)} <small>${esc(c.len)}</small></span>` : `<span class="thanks-chip">${ic('heart', 'sm')} ${esc(x.name)}</span>`; }).join('')}</div></section>` : ''; };
/* chữ của trang Support sau khi sắp xếp lại (2 lựa chọn + các bước đánh số) */
(function(){
  const G = {
    en:{ don_pick_comp:'Monthly · your own Planner and perks', don_pick_once:'One time · any amount', don_plan:'Choose a plan', don_amt:'Choose an amount', don_pay:'Pay', don_see_comp:'See the Companion plan' },
    vi:{ don_pick_comp:'Mỗi tháng · có Planner riêng và quà cảm ơn', don_pick_once:'Một lần · bao nhiêu cũng được', don_plan:'Chọn gói', don_amt:'Chọn số tiền', don_pay:'Thanh toán', don_see_comp:'Xem gói Người đồng hành' },
    hi:{ don_pick_comp:'हर महीने · अपना Planner और खास सुविधाएँ', don_pick_once:'एक बार · जितना चाहें', don_plan:'प्लान चुनें', don_amt:'राशि चुनें', don_pay:'भुगतान करें', don_see_comp:'साथी प्लान देखें' },
    ja:{ don_pick_comp:'毎月 · 自分だけのプランナーと特典', don_pick_once:'1回だけ · 金額は自由', don_plan:'プランを選ぶ', don_amt:'金額を選ぶ', don_pay:'支払う', don_see_comp:'仲間たちのプランを見る' },
    ko:{ don_pick_comp:'매달 · 나만의 플래너와 혜택', don_pick_once:'한 번 · 원하는 만큼', don_plan:'플랜 선택', don_amt:'금액 선택', don_pay:'결제하기', don_see_comp:'동반자 플랜 보기' },
    zh:{ don_pick_comp:'每月 · 专属计划表和福利', don_pick_once:'一次性 · 金额随意', don_plan:'选择方案', don_amt:'选择金额', don_pay:'付款', don_see_comp:'查看同伴方案' },
    fr:{ don_pick_comp:'Chaque mois · ton propre Planner et des avantages', don_pick_once:'Une fois · le montant de ton choix', don_plan:'Choisis une formule', don_amt:'Choisis un montant', don_pay:'Payer', don_see_comp:'Voir la formule Compagnons' },
    es:{ don_pick_comp:'Cada mes · tu propio Planner y ventajas', don_pick_once:'Una vez · la cantidad que quieras', don_plan:'Elige un plan', don_amt:'Elige una cantidad', don_pay:'Pagar', don_see_comp:'Ver el plan Acompañantes' }
  };
  Object.keys(G).forEach(l => { I18N[l] = I18N[l] || {}; Object.keys(G[l]).forEach(k => { if (I18N[l][k] === undefined) I18N[l][k] = G[l][k]; }); });
})();
/* Hình minh họa quyền lợi Người đồng hành (SVG, không chữ ngoài vài con số): dùng ở thẻ Người đồng hành trang Ủng hộ, hướng dẫn (guide.js) và thẻ sofa. Màu theo biến giao diện nên đẹp cả sáng lẫn tối. */
(function(){
  const G = {
    en:{ cp_t_planner:'Weekly Planner + auto review', cp_t_group:'Live study group', cp_t_focus:'Unlimited focus time', cp_t_early:'Early access', cp_t_badge:'Badge by your name', cp_t_thanks:'On the supporters list', cp_more:'Details' },
    vi:{ cp_t_planner:'Planner tuần kèm tổng kết', cp_t_group:'Nhóm học trực tiếp', cp_t_focus:'Tập trung không giới hạn', cp_t_early:'Xem sớm đồ mới', cp_t_badge:'Huy hiệu cạnh tên', cp_t_thanks:'Tên trong danh sách ủng hộ', cp_more:'Chi tiết' },
    hi:{ cp_t_planner:'साप्ताहिक प्लानर + अपने आप समीक्षा', cp_t_group:'लाइव स्टडी ग्रुप', cp_t_focus:'असीमित फ़ोकस समय', cp_t_early:'पहले से एक्सेस', cp_t_badge:'नाम के पास बैज', cp_t_thanks:'सहयोगियों की सूची में नाम', cp_more:'विवरण' },
    ja:{ cp_t_planner:'週間プランナー+自動レビュー', cp_t_group:'ライブ自習グループ', cp_t_focus:'集中時間が無制限', cp_t_early:'先行利用', cp_t_badge:'名前の横のバッジ', cp_t_thanks:'支援者リストに掲載', cp_more:'詳細' },
    ko:{ cp_t_planner:'주간 플래너 + 자동 리뷰', cp_t_group:'실시간 스터디 그룹', cp_t_focus:'집중 시간 무제한', cp_t_early:'먼저 써 보기', cp_t_badge:'이름 옆 배지', cp_t_thanks:'후원자 목록에 이름', cp_more:'자세히' },
    zh:{ cp_t_planner:'每周计划本+自动周报', cp_t_group:'实时学习小组', cp_t_focus:'专注时间不限', cp_t_early:'抢先体验', cp_t_badge:'名字旁的徽章', cp_t_thanks:'支持者名单上有你', cp_more:'详情' },
    fr:{ cp_t_planner:'Planner hebdo + bilan auto', cp_t_group:"Groupe d'étude en direct", cp_t_focus:'Concentration illimitée', cp_t_early:'Accès anticipé', cp_t_badge:'Badge près de ton nom', cp_t_thanks:'Sur la liste des soutiens', cp_more:'Détails' },
    es:{ cp_t_planner:'Planner semanal + resumen', cp_t_group:'Grupo de estudio en vivo', cp_t_focus:'Enfoque ilimitado', cp_t_early:'Acceso anticipado', cp_t_badge:'Insignia junto al nombre', cp_t_thanks:'En la lista de apoyos', cp_more:'Detalles' }
  };
  Object.keys(G).forEach(l => { I18N[l] = I18N[l] || {}; Object.keys(G[l]).forEach(k => { if (I18N[l][k] === undefined) I18N[l][k] = G[l][k]; }); });
})();
const COMP_ILL = (() => {
  const svg = inner => `<svg class="pk-ill" viewBox="0 0 160 96" aria-hidden="true">${inner}</svg>`, bg = '<rect x="3" y="3" width="154" height="90" rx="14" fill="var(--surface2)" stroke="var(--line)"/>';
  const W = ['#f2b8c6', '#c9b8ec', '#f6c9a0', '#f4e08c', '#a9dcc6', '#a8cdee'];
  const cols = [[[28, 18, 0], [52, 14, 1]], [[30, 24, 2]], [[26, 14, 3], [46, 20, 4]], [[34, 16, 5]], [[28, 28, 0]], [[40, 14, 1]], [[32, 12, 3]]];
  const grid = cols.map((c, i) => c.map(([y, h, k]) => `<rect x="${15 + i * 19.2}" y="${y}" width="16" height="${h}" rx="4" fill="${W[k]}"/>`).join('')).join('');
  const dots = Array.from({ length:7 }, (_, i) => `<circle cx="${23 + i * 19.2}" cy="16" r="2.6" fill="${i === 2 ? 'var(--accent)' : 'var(--ink3)'}" opacity="${i === 2 ? 1 : .45}"/>`).join('');
  const av = (y, c, l) => `<circle cx="26" cy="${y}" r="9" fill="${c}"/><text x="26" y="${y + 4}" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">${l}</text>`;
  const row = (y, w, t) => `<rect x="42" y="${y - 3}" width="${w}" height="6" rx="3" fill="var(--ink3)" opacity=".35"/><circle cx="104" cy="${y}" r="3" fill="#2dc76d"/><text x="148" y="${y + 4}" text-anchor="end" font-size="11" font-weight="800" fill="var(--ink)">${t}</text>`;
  return {
    planner: svg(`${bg}${dots}${grid}<g transform="translate(86 62)"><rect width="62" height="26" rx="13" fill="var(--surface)" stroke="var(--line)"/><circle cx="14" cy="13" r="8" fill="none" stroke="var(--line)" stroke-width="3.2"/><circle cx="14" cy="13" r="8" fill="none" stroke="var(--accent)" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="39 51" transform="rotate(-90 14 13)"/><text x="40" y="17.5" text-anchor="middle" font-size="12" font-weight="800" fill="var(--ink)">78%</text></g><g transform="translate(40 31)"><circle r="5.4" fill="#fff" stroke="#2dc76d" stroke-width="1.4"/><path d="M-2.4 .2l1.7 1.8 3.2-3.6" stroke="#2dc76d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>`),
    group: svg(`${bg}${av(22, '#f2a15c', 'K')}${row(22, 36, '1:18')}${av(48, '#7c6cf0', 'S')}${row(48, 30, '42:10')}${av(74, '#4fae5a', 'M')}${row(74, 42, '0:57')}`),
    focus: svg(`${bg}<circle cx="80" cy="44" r="29" fill="none" stroke="var(--line)" stroke-width="7"/><circle cx="80" cy="44" r="29" fill="none" stroke="var(--accent)" stroke-width="7" stroke-linecap="round" stroke-dasharray="130 52" transform="rotate(-90 80 44)"/><path d="M62 44c0-8 9-8 18 0s18 8 18 0-9-8-18 0-18 8-18 0z" stroke="var(--accent-strong)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><g fill="var(--accent)"><circle cx="62" cy="84" r="3.4"/><circle cx="74" cy="84" r="3.4"/><circle cx="86" cy="84" r="3.4"/></g><circle cx="98" cy="84" r="3.4" fill="none" stroke="var(--ink3)" stroke-width="1.4"/>`),
    early: svg(`${bg}<g transform="rotate(-7 60 52)"><rect x="30" y="24" width="64" height="56" rx="8" fill="var(--surface)" stroke="var(--line)"/></g><g transform="rotate(5 90 50)"><rect x="56" y="18" width="64" height="60" rx="8" fill="var(--surface)" stroke="var(--line)"/><rect x="64" y="27" width="30" height="6" rx="3" fill="var(--accent)"/><rect x="64" y="40" width="48" height="5" rx="2.5" fill="var(--ink3)" opacity=".35"/><rect x="64" y="50" width="40" height="5" rx="2.5" fill="var(--ink3)" opacity=".35"/><rect x="64" y="60" width="26" height="5" rx="2.5" fill="var(--ink3)" opacity=".35"/></g><g transform="translate(112 24) rotate(8)"><rect x="-19" y="-9" width="38" height="18" rx="9" fill="#f6c744"/><text y="4" text-anchor="middle" font-size="10" font-weight="800" fill="#4a2f3a">NEW</text></g><path d="M30 18l1.8 4 4 1.8-4 1.8-1.8 4-1.8-4-4-1.8 4-1.8z" fill="#f6c744"/>`),
    badge: svg(`${bg}<rect x="20" y="33" width="120" height="30" rx="15" fill="var(--surface)" stroke="var(--line)"/><circle cx="37" cy="48" r="9" fill="var(--accent)"/><text x="37" y="52" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">L</text><text x="53" y="53" font-size="14" font-weight="800" fill="var(--ink)">Linh</text><g transform="translate(116 48)"><circle r="12" fill="#f6c744" stroke="#d49a1a" stroke-width="1.4"/><path d="M3.6 -6.4a7 7 0 1 0 0 12.8a5.6 5.6 0 0 1 0 -12.8z" fill="#7a4a10"/></g><path d="M134 28l1.4 3 3 1.4-3 1.4-1.4 3-1.4-3-3-1.4 3-1.4z" fill="#f6c744"/>`),
    thanks: svg(`${bg}<g transform="translate(80 36) scale(2.6)"><path d="M0 7C-12-2-9-11-3.5-11C-1-11 0-9 0-8C0-9 1-11 3.5-11C9-11 12-2 0 7Z" fill="#ef4b5f"/></g><g fill="var(--surface)" stroke="var(--line)"><rect x="12" y="68" width="40" height="16" rx="8"/><rect x="58" y="68" width="44" height="16" rx="8"/><rect x="108" y="68" width="40" height="16" rx="8"/></g><g fill="var(--ink3)" opacity=".4"><rect x="22" y="74" width="22" height="4" rx="2"/><rect x="68" y="74" width="26" height="4" rx="2"/><rect x="118" y="74" width="20" height="4" rx="2"/></g>`)
  };
})();
const donateHTML = function(){
  if (state.user) { refreshCompanion().then(ch => ch && render(true)); loadMoonReward(); }
  const cur = donCur || effCurrency(), amts = cur === 'VND' ? parseAmts(payments.donateVND, [20000, 50000, 100000, 200000]) : parseAmts(payments.donateUSD, [3, 5, 10, 25]);
  const amt = donAmt && donAmt.cur === cur ? donAmt.v : amts[1] || amts[0], hasBank = payments.bankBin && payments.accountNo, note = donNote();
  let pay = '';
  if (cur === 'VND') {
    pay = hasBank ? `${state.user && state.user.email ? '' : `<div class="field"><label class="label">${esc(t('don_mail_label'))}</label><input class="input" type="email" id="don-mail" data-change="donMail" maxlength="120" autocomplete="email" value="${esc(donMail)}"></div>`}<img class="qr" alt="VietQR" src="https://img.vietqr.io/image/${encodeURIComponent(payments.bankBin)}-${encodeURIComponent(payments.accountNo)}-compact2.png?amount=${amt}&addInfo=${encodeURIComponent(note)}&accountName=${encodeURIComponent(payments.accountName || '')}"><p class="small muted" style="text-align:center">${esc(t('donate_scan'))}</p>
      <div class="kv"><div class="kvr"><span>${esc(t('acc_no'))}</span><b>${esc(payments.accountNo)}</b><button type="button" class="btn secondary sm" data-act="copy" data-v="${esc(payments.accountNo)}">${esc(t('copy'))}</button></div><div class="kvr"><span>${esc(t('donate_note'))}</span><b>${esc(note)}</b><button type="button" class="btn secondary sm" data-act="copy" data-v="${esc(note)}">${esc(t('copy'))}</button></div></div><p class="small faint">${esc(t('pay_mail_hint'))}</p>` : '';
  } else {
    const pp = payments.paypal ? (/paypal\.me\//i.test(payments.paypal) ? payments.paypal.replace(/\/+$/, '') + '/' + amt + 'USD' : payments.paypal) : '';
    pay = [pp && `<a class="btn primary lg" target="_blank" rel="noopener" href="${esc(safeUrl(pp))}">PayPal · $${amt}</a>`, payments.kofi && `<a class="btn secondary lg" target="_blank" rel="noopener" href="${esc(safeUrl(payments.kofi))}">Ko-fi</a>`, payments.stripe && `<a class="btn secondary lg" target="_blank" rel="noopener" href="${esc(safeUrl(payments.stripe))}">${ic('credit', 'sm')} Card</a>`].filter(Boolean).join(' ');
    pay = pay ? `<div class="row">${pay}</div>` : '';
  }
  const step = (n, title, html) => html ? `<div class="don-step"><h3><i>${n}</i>${esc(title)}</h3>${html}</div>` : '';
  /* Ủng hộ một lần: bước 1 chọn số tiền, bước 2 thanh toán */
  const once = `<div class="don-cols"><div class="stack">
      ${step(1, t('don_amt'), `<div class="seg"><button type="button" class="${cur === 'VND' ? 'on' : ''}" data-act="donCur" data-c="VND">VND</button><button type="button" class="${cur === 'USD' ? 'on' : ''}" data-act="donCur" data-c="USD">USD</button></div>
        <div class="row">${amts.map(a => `<button type="button" class="chip ${a === amt ? 'on' : ''}" data-act="donAmt" data-v="${a}">${money(a, cur)}</button>`).join('')}</div>
        <div class="field"><label class="label">${esc(t('donate_custom'))}</label><input class="input" type="number" min="1" id="don-custom" data-change="donCustom" placeholder="${cur === 'VND' ? '30000' : '7'}"></div>`)}
      <div class="limit-box stack don-tip"><p class="small">🎁 ${esc(t('don_bonus', { p:cur === 'VND' ? money(compBase(), 'VND') : money(+payments.companionUSD || 3, 'USD') }))}</p><button type="button" class="btn ghost sm" data-act="donSeeComp">${ic('moon', 'sm')} ${esc(t('don_see_comp'))}</button></div></div>
    <div class="stack">${step(2, t('don_pay'), `${pay || `<p class="muted">${esc(t('donate_none'))}</p>`}<p class="small faint">${esc(t('donate_thanks'))}</p>`)}</div></div>`;
  /* Người đồng hành: bên trái là quyền lợi, bên phải là 3 bước (chọn gói, thanh toán, báo đã trả) */
  const cp = state.companion && !compRenewOpen() ? null : compPayHTML(), claim = compClaimHTML(!!cp);
  const info = `<div class="stack">${goalBar()}<p class="muted" ${cms('comp_text')}>${esc(ctext('comp_text'))}</p><div><div class="label">${esc(t('comp_perks'))}</div><div class="pk-grid">${[['planner', 'comp_perk4'], ...(branding.groupOn === true ? [['group', 'comp_perk5']] : []), ...(Math.round(+branding.focusLimit) > 0 ? [['focus', 'comp_perk6']] : []), ['early', 'comp_perk3'], ['badge', 'comp_perk1'], ['thanks', 'comp_perk2']].map(([k, key]) => `<div class="pk">${COMP_ILL[k]}<b>${esc(t('cp_t_' + k))}</b><details><summary>${esc(t('cp_more'))}</summary><p ${cms(key)}>${esc(ctext(key))}</p></details></div>`).join('')}</div></div>
      ${state.companion || !state.user ? '' : trialBox()}</div>`;
  const steps = cp ? `${step(1, t('don_plan'), cp.plan)}${step(2, t('don_pay'), cp.pay)}${cp.login ? '' : step(3, t('cc_title'), claim)}` : claim;
  const comp = `<div class="don-cols">${info}<div class="stack">${steps}</div></div>`;
  const opt = (k, icon, name, sub, attr = '') => [k, `<span class="don-ic">${ic(icon)}</span><span><b ${attr}>${esc(name)}</b><small>${esc(sub)}</small></span>`, k === 'comp' ? comp : once];
  const list = [opt('comp', 'moon', ctext('comp_title'), t('don_pick_comp'), cms('comp_title')), opt('once', 'heart', t('donate_once'), t('don_pick_once'))];
  const cur2 = list.some(x => x[0] === TABS.don) ? TABS.don : 'comp';
  return `<section class="card pad don-card"><div class="tabset" data-tabs="don"><div class="tab-bar don-pick" role="tablist">${list.map(([k, l]) => `<button type="button" role="tab" class="don-opt ${k === cur2 ? 'on' : ''}" aria-selected="${k === cur2}" data-act="tabPick" data-g="don" data-k="${k}">${l}${k === 'comp' && state.companion ? compBadge() : ''}</button>`).join('')}</div>
    ${list.map(([k, , h]) => `<div class="tab-pane" role="tabpanel" data-k="${k}"${k === cur2 ? '' : ' hidden'}>${h}</div>`).join('')}</div></section>`;
};
/* chữ mới của Phòng tập trung (các tab Việc / Nhạc / Nhóm / Live, gập cài đặt bộ đếm, giờ của việc) */
(function(){
  const G = {
    en:{ fx_side:'Group & Live', fx_tab_todo:'Tasks', fx_tab_music:'Music', fx_tab_group:'Group', fx_tab_stream:'Live', fx_cfg:'Timer settings', fx_time:'Time (optional)', fx_edit:'Edit', fx_local:'Quick list (this device only)', new_focus2_title:'Your tasks, now in one place', new_focus2_text:'Add, edit and tick today\'s Planner tasks right here in the Focus room. Group and Live have their own panel beside the timer, so you can watch them while you study.' },
    vi:{ fx_side:'Nhóm và Live', fx_tab_todo:'Việc', fx_tab_music:'Nhạc', fx_tab_group:'Nhóm', fx_tab_stream:'Live', fx_cfg:'Tuỳ chỉnh bộ đếm', fx_time:'Giờ (không bắt buộc)', fx_edit:'Sửa', fx_local:'Việc nhanh (chỉ trong máy này)', new_focus2_title:'Việc của bạn, gom về một chỗ', new_focus2_text:'Thêm, sửa và tick việc hôm nay của Planner ngay trong Phòng tập trung. Nhóm và Live có khung riêng cạnh bộ đếm, nên vừa học vừa xem được cả timer, việc và Live.' },
    hi:{ fx_side:'समूह और लाइव', fx_tab_todo:'काम', fx_tab_music:'संगीत', fx_tab_group:'समूह', fx_tab_stream:'लाइव', fx_cfg:'टाइमर सेटिंग', fx_time:'समय (वैकल्पिक)', fx_edit:'बदलें', fx_local:'त्वरित सूची (सिर्फ़ इस डिवाइस पर)', new_focus2_title:'आपके काम, अब एक जगह', new_focus2_text:'फ़ोकस रूम में ही आज के Planner के काम जोड़ें, बदलें और टिक करें। समूह और लाइव का अपना अलग पैनल टाइमर के बगल में है, इसलिए पढ़ते हुए साथ-साथ देख सकते हैं।' },
    ja:{ fx_side:'グループとライブ', fx_tab_todo:'タスク', fx_tab_music:'音楽', fx_tab_group:'グループ', fx_tab_stream:'ライブ', fx_cfg:'タイマー設定', fx_time:'時刻(任意)', fx_edit:'編集', fx_local:'クイックリスト(この端末のみ)', new_focus2_title:'タスクがひとつの場所に', new_focus2_text:'集中ルームで今日のPlannerのタスクをそのまま追加・編集・チェックできます。グループとライブはタイマーの横に専用パネルがあるので、勉強しながら並べて見られます。' },
    ko:{ fx_side:'그룹과 라이브', fx_tab_todo:'할 일', fx_tab_music:'음악', fx_tab_group:'그룹', fx_tab_stream:'라이브', fx_cfg:'타이머 설정', fx_time:'시간(선택)', fx_edit:'수정', fx_local:'빠른 목록(이 기기에만)', new_focus2_title:'할 일이 한곳에', new_focus2_text:'집중 룸에서 오늘 플래너의 할 일을 바로 추가·수정·체크할 수 있어요. 그룹과 라이브는 타이머 옆 전용 패널에 있어서 공부하면서 나란히 볼 수 있어요.' },
    zh:{ fx_side:'小组与直播', fx_tab_todo:'任务', fx_tab_music:'音乐', fx_tab_group:'小组', fx_tab_stream:'直播', fx_cfg:'计时器设置', fx_time:'时间（可选）', fx_edit:'编辑', fx_local:'快速清单（仅此设备）', new_focus2_title:'任务集中在一处', new_focus2_text:'在专注室里就能添加、编辑和勾选今日计划本的任务。小组和直播有计时器旁边的独立面板，学习时可以并排查看。' },
    fr:{ fx_side:'Groupe et Live', fx_tab_todo:'Tâches', fx_tab_music:'Musique', fx_tab_group:'Groupe', fx_tab_stream:'Live', fx_cfg:'Réglages du minuteur', fx_time:'Heure (facultatif)', fx_edit:'Modifier', fx_local:'Liste rapide (cet appareil seulement)', new_focus2_title:'Vos tâches, au même endroit', new_focus2_text:'Ajoutez, modifiez et cochez les tâches du jour du Planner directement dans la salle de focus. Groupe et Live ont leur propre panneau à côté du minuteur : vous pouvez les regarder pendant que vous étudiez.' },
    es:{ fx_side:'Grupo y Live', fx_tab_todo:'Tareas', fx_tab_music:'Música', fx_tab_group:'Grupo', fx_tab_stream:'En vivo', fx_cfg:'Ajustes del temporizador', fx_time:'Hora (opcional)', fx_edit:'Editar', fx_local:'Lista rápida (solo este dispositivo)', new_focus2_title:'Tus tareas, en un solo lugar', new_focus2_text:'Añade, edita y marca las tareas de hoy del Planner aquí mismo, en la sala de enfoque. Grupo y En vivo tienen su propio panel junto al temporizador, así los ves mientras estudias.' }
  };
  Object.keys(G).forEach(l => { I18N[l] = I18N[l] || {}; Object.keys(G[l]).forEach(k => { if (I18N[l][k] === undefined) I18N[l][k] = G[l][k]; }); });
})();
document.addEventListener('toggle', e => { if (e.target.classList && e.target.classList.contains('tm-cfg')) store.set('fx_cfg', e.target.open); }, true);   // nhớ khách mở hay gập cài đặt bộ đếm

/* Ghế sofa của Moon: góc dưới bên phải MỌI trang, Moon ngủ trên đó. Chạm vào thì Moon tỉnh dậy và gợi ý gói Người đồng hành (giá, quyền lợi, nút xem gói).
   Khách chưa là Người đồng hành thấy gợi ý gói (khi web có cách thanh toán); Người đồng hành thấy lời cảm ơn; ẩn ở trang Ủng hộ và Admin. Luôn hiện, khách không ẩn được. Chỉ chữ, hình vẽ và nút: không đọc Firebase. */
(function(){
  const G = {
    en:{ sofa_t:'Moon saved you a seat', sofa_x:'Become a Companion and get comfy. Your support keeps the stream and this study room running.', sofa_p1:'Your own weekly Planner with an automatic review', sofa_p2:'Unlimited focus time in the Focus room', sofa_p3:'Live study group and weekly leaderboard', sofa_p4:'A small badge next to your name', sofa_aria:'Moon is napping on the sofa. Tap to see the Companion plan.', sofa_thx_t:'Moon says thank you', sofa_thx_x:"You're one of the Companions who keep this study room going. Come sit with me.", sofa_thx_go:'Your Companion plan', sofa_thx_aria:'Moon is napping on the sofa. Tap to say hi.' },
    vi:{ sofa_t:'Moon giữ chỗ cho bạn rồi', sofa_x:'Trở thành Người đồng hành và ngồi cho thoải mái nhé. Sự ủng hộ của bạn giữ cho buổi live và phòng học này luôn sáng đèn.', sofa_p1:'Planner tuần riêng kèm tổng kết tự động', sofa_p2:'Không giới hạn thời gian tập trung ở Phòng tập trung', sofa_p3:'Nhóm học trực tiếp và bảng xếp hạng tuần', sofa_p4:'Huy hiệu nhỏ cạnh tên bạn', sofa_aria:'Moon đang ngủ trên sofa. Chạm để xem gói Người đồng hành.', sofa_thx_t:'Moon cảm ơn bạn', sofa_thx_x:'Bạn là một trong những Người đồng hành giữ cho phòng học này luôn sáng đèn. Lại ngồi với mình nhé.', sofa_thx_go:'Gói Người đồng hành của bạn', sofa_thx_aria:'Moon đang ngủ trên sofa. Chạm để chào Moon.' },
    hi:{ sofa_t:'मून ने आपके लिए जगह रखी है', sofa_x:'साथी बनिए और आराम से बैठिए। आपका सहयोग स्ट्रीम और इस स्टडी रूम को चलाए रखता है।', sofa_p1:'अपना साप्ताहिक प्लानर और अपने आप बनने वाली समीक्षा', sofa_p2:'फ़ोकस रूम में असीमित फ़ोकस समय', sofa_p3:'लाइव स्टडी ग्रुप और साप्ताहिक लीडरबोर्ड', sofa_p4:'आपके नाम के पास एक छोटा बैज', sofa_aria:'मून सोफ़े पर झपकी ले रही है। साथी योजना देखने के लिए छुएँ।', sofa_thx_t:'मून आपका शुक्रिया करती है', sofa_thx_x:'आप उन साथियों में हैं जो इस स्टडी रूम को चलाए रखते हैं। आइए, मेरे पास बैठिए।', sofa_thx_go:'आपकी साथी योजना', sofa_thx_aria:'मून सोफ़े पर झपकी ले रही है। हेलो कहने के लिए छुएँ।' },
    ja:{ sofa_t:'Moonがあなたの席を取っておきました', sofa_x:'仲間になって、ゆっくりくつろいでください。あなたの支援が配信とこの自習室を支えます。', sofa_p1:'自動レビュー付きの自分だけの週間プランナー', sofa_p2:'集中ルームで集中時間が無制限', sofa_p3:'ライブ自習グループと週間ランキング', sofa_p4:'名前の横に小さなバッジ', sofa_aria:'Moonがソファで昼寝中です。タップして仲間プランを見る。', sofa_thx_t:'Moonからありがとう', sofa_thx_x:'あなたはこの自習室を支えてくれている仲間のひとりです。さあ、私のとなりへどうぞ。', sofa_thx_go:'あなたの仲間プラン', sofa_thx_aria:'Moonがソファで昼寝中です。タップして挨拶。' },
    ko:{ sofa_t:'Moon이 자리를 맡아 뒀어요', sofa_x:'동반자가 되어 편히 앉으세요. 여러분의 후원이 방송과 이 공부방을 이어 가요.', sofa_p1:'자동 리뷰가 있는 나만의 주간 플래너', sofa_p2:'집중 방에서 집중 시간 무제한', sofa_p3:'실시간 스터디 그룹과 주간 순위', sofa_p4:'이름 옆의 작은 배지', sofa_aria:'Moon이 소파에서 낮잠 중이에요. 눌러서 동반자 플랜 보기.', sofa_thx_t:'Moon이 고마워해요', sofa_thx_x:'여러분은 이 공부방을 지켜 주는 동반자예요. 와서 제 옆에 앉아요.', sofa_thx_go:'내 동반자 플랜', sofa_thx_aria:'Moon이 소파에서 낮잠 중이에요. 눌러서 인사하기.' },
    zh:{ sofa_t:'Moon给你留了个座', sofa_x:'成为同伴，舒舒服服坐下吧。你的支持让直播和这间自习室一直运转。', sofa_p1:'专属每周计划本，附自动周报', sofa_p2:'专注室里专注时间不限', sofa_p3:'实时学习小组和每周排行榜', sofa_p4:'名字旁的小徽章', sofa_aria:'Moon正在沙发上打盹。点一下查看同伴计划。', sofa_thx_t:'Moon谢谢你', sofa_thx_x:'你是让这间自习室一直亮着灯的同伴之一。来，坐到我身边吧。', sofa_thx_go:'你的同伴计划', sofa_thx_aria:'Moon正在沙发上打盹。点一下打个招呼。' },
    fr:{ sofa_t:"Moon t'a gardé une place", sofa_x:"Deviens Compagnon et installe-toi. Ton soutien fait tourner le live et cette salle d'étude.", sofa_p1:'Ton Planner hebdo privé avec bilan automatique', sofa_p2:'Concentration illimitée dans la salle de concentration', sofa_p3:'Groupe d\'étude en direct et classement hebdo', sofa_p4:'Un petit badge à côté de ton nom', sofa_aria:'Moon fait la sieste sur le canapé. Touche pour voir la formule Compagnon.', sofa_thx_t:'Moon te dit merci', sofa_thx_x:"Tu fais partie des Compagnons qui font vivre cette salle d'étude. Viens t'asseoir avec moi.", sofa_thx_go:'Ta formule Compagnon', sofa_thx_aria:'Moon fait la sieste sur le canapé. Touche pour lui dire bonjour.' },
    es:{ sofa_t:'Moon te ha guardado un sitio', sofa_x:'Hazte Acompañante y ponte cómodo. Tu apoyo mantiene el directo y esta sala de estudio.', sofa_p1:'Tu planificador semanal privado con resumen automático', sofa_p2:'Tiempo de enfoque ilimitado en la sala de enfoque', sofa_p3:'Grupo de estudio en vivo y clasificación semanal', sofa_p4:'Una pequeña insignia junto a tu nombre', sofa_aria:'Moon duerme la siesta en el sofá. Toca para ver el plan de Acompañante.', sofa_thx_t:'Moon te da las gracias', sofa_thx_x:'Eres uno de los Acompañantes que mantienen esta sala de estudio. Ven a sentarte conmigo.', sofa_thx_go:'Tu plan de Acompañante', sofa_thx_aria:'Moon duerme la siesta en el sofá. Toca para saludar.' }
  };
  Object.keys(G).forEach(l => { I18N[l] = I18N[l] || {}; Object.keys(G[l]).forEach(k => { if (I18N[l][k] === undefined) I18N[l][k] = G[l][k]; }); });
})();
function moonHead(id, p){   // đầu Moon dùng chung cho ghế sofa và Moon đi dạo: mắt nhắm / mở / giận, miệng cười / giận, dấu 💢
  return `
      <defs><clipPath id="${id}"><ellipse cx="0" cy="-16.8" rx="6.448" ry="5.828"/></clipPath></defs>
      <path d="M-5.7 -18L-5.3 -25.2L-1.2 -21.6Z" fill="#f2a15c"/><path d="M5.7 -18L5.3 -25.2L1.2 -21.6Z" fill="#f2a15c"/>
      <path d="M-3.844 -20.21L-4.712 -23.744L-2.108 -21.388Z" fill="#f4a9b6"/><path d="M3.844 -20.21L4.712 -23.744L2.108 -21.388Z" fill="#f4a9b6"/>
      <ellipse cx="0" cy="-16.8" rx="6.448" ry="5.828" fill="#fdfaf3"/>
      <g clip-path="url(#${id})"><path d="M-8.1 -15.6L-8.1 -25.5L8.1 -25.5L8.1 -18.7Q5.3 -19.7 3.1 -19Q1.5 -18.8 .7 -20.3Q0 -22 -.7 -20.4Q-1.4 -18.7 -3 -18.4Q-4.6 -18 -4.8 -16.1Q-5.3 -14.7 -8.1 -15.6Z" fill="#f2a15c"/><path d="M-3.1 -22.1q.5 1 .1 1.9M2.9 -22.3q-.5 1-.1 1.9M-5 -19.9q.9 .4 1.4 1.2" stroke="#d9823f" stroke-width=".56" stroke-linecap="round" fill="none" opacity=".55"/></g>
      <ellipse cx="0" cy="-16.8" rx="6.448" ry="5.828" fill="none" stroke="#aab4d0" stroke-width=".45"/>
      <g class="${p}-eyes-z"><path d="M-3.7 -16.5Q-2.5 -15.2 -1.3 -16.5M1.3 -16.5Q2.5 -15.2 3.7 -16.5" stroke="#29203a" stroke-width=".6" stroke-linecap="round" fill="none"/></g>
      <g class="${p}-eyes-o"><ellipse cx="-2.48" cy="-16.43" rx=".93" ry="1.18" fill="#29203a"/><ellipse cx="2.48" cy="-16.43" rx=".93" ry="1.18" fill="#29203a"/><circle cx="-2.17" cy="-16.92" r=".37" fill="#fff"/><circle cx="2.79" cy="-16.92" r=".37" fill="#fff"/></g>
      <g class="${p}-eyes-a"><path d="M-4.7 -19.7L-1.2 -18.1M4.7 -19.7L1.2 -18.1" stroke="#29203a" stroke-width=".8" stroke-linecap="round" fill="none"/><ellipse cx="-2.48" cy="-16.4" rx=".95" ry=".78" fill="#29203a"/><ellipse cx="2.48" cy="-16.4" rx=".95" ry=".78" fill="#29203a"/><circle cx="-2.2" cy="-16.7" r=".3" fill="#fff"/><circle cx="2.76" cy="-16.7" r=".3" fill="#fff"/></g>
      <ellipse cx="-3.844" cy="-14.444" rx="1.116" ry=".682" fill="#f4a9b6" opacity=".75"/><ellipse cx="3.844" cy="-14.444" rx="1.116" ry=".682" fill="#f4a9b6" opacity=".75"/>
      <path d="M-.62 -15.126h1.24l-.62 .682z" fill="#ee8fa1"/><g class="${p}-mouth-n"><path d="M-1.116 -14.01q.558 .496 1.116 0q.558 .496 1.116 0" stroke="#9b7b80" stroke-width=".372" stroke-linecap="round" fill="none"/></g>
      <g class="${p}-mouth-a"><path d="M-2 -13.3Q0 -15.6 2 -13.3Z" fill="#e5707f" stroke="#7a3a46" stroke-width=".4" stroke-linejoin="round"/><path d="M-1.1 -14.3l.4 .95l.4 -.8M1.1 -14.3l-.4 .95l-.4 -.8" fill="#fff"/></g>
      <g class="${p}-vein" stroke="#e5484d" stroke-width=".8" stroke-linecap="round" fill="none"><path d="M4.6 -25.2q1.2 .2 1.4 1.4M8.6 -25.2q-1.2 .2 -1.4 1.4M4.6 -22q1.2 -.2 1.4 -1.4M8.6 -22q-1.2 -.2 -1.4 -1.4"/></g>
`;
}
const SOFA_SVG = `<svg class="sofa-svg" viewBox="0 0 150 96" aria-hidden="true">
  <ellipse cx="75" cy="91" rx="64" ry="4.5" fill="rgba(0,0,0,.22)"/>
  <rect x="22" y="79" width="8" height="11" rx="2.5" fill="#4a2f3a"/><rect x="120" y="79" width="8" height="11" rx="2.5" fill="#4a2f3a"/>
  <rect x="18" y="20" width="114" height="54" rx="22" fill="#b9577e"/><path d="M32 29Q75 21 118 29" stroke="#d9789c" stroke-width="3" stroke-linecap="round" fill="none" opacity=".65"/>
  <g transform="rotate(10 124 44)"><rect x="113" y="31" width="22" height="22" rx="7" fill="#f4d58a"/><path d="M124 36.5l1.7 3.6 3.9.4-2.9 2.6.8 3.8-3.5-1.9-3.5 1.9.8-3.8-2.9-2.6 3.9-.4z" fill="#e9a94a"/></g>
  <g class="sofa-cat"><g class="sofa-breath">
    <path d="M106 66Q128 67 125 53Q123 45 114 48" stroke="#aab4d0" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M106 66Q128 67 125 53Q123 45 114 48" stroke="#fdfaf3" stroke-width="5.6" stroke-linecap="round" fill="none"/>
    <ellipse cx="84" cy="60" rx="31" ry="14" fill="#fdfaf3" stroke="#aab4d0" stroke-width="1"/><path d="M96 48Q112 56 108 70Q100 72 92 72Q100 62 96 48Z" fill="#c9d1e6" opacity=".7"/>
    <ellipse cx="101" cy="67" rx="10" ry="6" fill="#fdfaf3" stroke="#aab4d0" stroke-width="1"/>
    <ellipse cx="64" cy="68" rx="8.5" ry="4" fill="#fdfaf3" stroke="#aab4d0" stroke-width="1"/>
    <g class="sofa-hshake"><g transform="translate(51 55) rotate(-7) scale(2.2 2.15) translate(0 16.8)">${moonHead('sofaHc', 'sofa')}</g></g>
  </g></g>
  <g class="sofa-zz" fill="var(--accent-strong)" font-weight="800"><text class="z1" x="34" y="24" font-size="11">z</text><text class="z2" x="26" y="14" font-size="9">z</text><text class="z3" x="20" y="6" font-size="7">z</text></g>
  <rect x="12" y="63" width="126" height="22" rx="11" fill="#d46a93"/><path d="M26 72h98" stroke="#e58aab" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
  <rect x="3" y="38" width="26" height="46" rx="13" fill="#c4608a"/><rect x="121" y="38" width="26" height="46" rx="13" fill="#c4608a"/>
  <path d="M10 48Q16 43 22 48" stroke="#e58aab" stroke-width="2" stroke-linecap="round" fill="none" opacity=".6"/><path d="M128 48Q134 43 140 48" stroke="#e58aab" stroke-width="2" stroke-linecap="round" fill="none" opacity=".6"/>
</svg>`;
const sofaOn = () => !!((state.companion || compPayMode()) && !state.editMode && !['donate', 'admin'].includes(route.name));
function sofaPrice(){ return compPayMode() === 'vnd' ? money(compPrice(1), 'VND') : money(compPriceUSD(1), 'USD'); }
function sofaCard(){
  if (state.companion) return `<button type="button" class="sofa-x" data-act="sofaToggle" aria-label="${esc(t('close'))}">${ic('x', 'sm')}</button><b class="sofa-t">${esc(t('sofa_thx_t'))}</b><p class="small muted sofa-tx">${esc(t('sofa_thx_x'))}</p><div>${compBadge()}</div>\n    <a class="btn secondary sm" href="#/donate" data-act="sofaGo">${ic('moon', 'sm')} ${esc(t('sofa_thx_go'))}</a>`;
  const perks = ['planner', ...(Math.round(+branding.focusLimit) > 0 ? ['focus'] : []), ...(branding.groupOn === true ? ['group'] : []), 'badge'].slice(0, 3);
  return `<button type="button" class="sofa-x" data-act="sofaToggle" aria-label="${esc(t('close'))}">${ic('x', 'sm')}</button><b class="sofa-t">${esc(t('sofa_t'))}</b><p class="small muted sofa-tx">${esc(t('sofa_x'))}</p>
    <div class="sofa-pks">${perks.map(k => `<div class="sofa-pk">${COMP_ILL[k]}<span>${esc(t('cp_t_' + k))}</span></div>`).join('')}</div><div class="sofa-price">${esc(t('comp_plan_1'))} · <b>${esc(sofaPrice())}</b></div>
    <a class="btn primary sm" href="#/donate" data-act="sofaGo">${ic('heart', 'sm')} ${esc(t('don_see_comp'))}</a>`;
}
function sofaSync(){
  let b = $('sofa'); const on = sofaOn();
  document.body.classList.toggle('has-sofa', on);
  if (!on) { sfStop(); if (b) b.remove(); return; }
  if (!b) { b = document.createElement('div'); b.id = 'sofa'; b.className = 'sofa'; document.body.appendChild(b); if (!sfRoamT) sfSchedule(); }
  const open = b.classList.contains('open'), key = state.lang + '|' + !!state.companion + '|' + (state.companionSince || '') + '|' + compPayMode() + '|' + (branding.groupOn === true) + '|' + Math.round(+branding.focusLimit) + '|' + sofaPrice();
  if (b.dataset.key === key) return;                              // không vẽ lại khi không có gì đổi (giữ hiệu ứng ngủ và thẻ đang mở)
  b.dataset.key = key;
  b.innerHTML = `<div class="sofa-card" id="sofa-card" role="dialog" aria-label="${esc(t(state.companion ? 'sofa_thx_t' : 'sofa_t'))}"${open ? '' : ' hidden'}>${sofaCard()}</div><button type="button" id="sofa-btn" class="sofa-btn" data-act="sofaToggle" aria-expanded="${open}" aria-controls="sofa-card" aria-label="${esc(t(state.companion ? 'sofa_thx_aria' : 'sofa_aria'))}" title="${esc(t(state.companion ? 'sofa_thx_t' : 'sofa_t'))}">${SOFA_SVG}</button>`;
}
/* Moon đi dạo: lâu lâu rời sofa đi dọc mép dưới màn hình, ra một đoạn rồi quay về (chỉ transform, không đọc Firebase). Điện thoại: nhỏ hơn, ra ngắn hơn, thưa hơn.
   Không chạy khi: máy tắt chuyển động, tab ẩn, đang cuộn / gõ chữ / mở hộp thoại / hướng dẫn / thẻ sofa. Bấm vào Moon (đang ngủ hay đang đi): Moon giận hài hước và để lại vết cào. */
const MOON_WALK = `<svg class="mw-svg" viewBox="0 0 100 64" aria-hidden="true">
  <ellipse cx="56" cy="61" rx="34" ry="3" fill="rgba(0,0,0,.22)"/>
  <g class="mw-tail"><path d="M80 36Q97 36 95 20Q94 13 88 15" stroke="#aab4d0" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M80 36Q97 36 95 20Q94 13 88 15" stroke="#fdfaf3" stroke-width="5.6" stroke-linecap="round" fill="none"/></g>
  <g class="mw-leg mw-la"><rect x="40" y="44" width="8" height="16" rx="4" fill="#dfe5f2" stroke="#aab4d0"/></g><g class="mw-leg mw-lb"><rect x="70" y="44" width="8" height="16" rx="4" fill="#dfe5f2" stroke="#aab4d0"/></g>
  <g class="mw-body"><ellipse cx="58" cy="38" rx="26" ry="13" fill="#fdfaf3" stroke="#aab4d0"/><path d="M52 26Q68 22 82 33Q72 36 62 35Z" fill="#f2a15c" opacity=".9"/></g>
  <g class="mw-leg mw-lb"><rect x="46" y="44" width="8" height="16" rx="4" fill="#fdfaf3" stroke="#aab4d0"/></g><g class="mw-leg mw-la"><rect x="76" y="44" width="8" height="16" rx="4" fill="#fdfaf3" stroke="#aab4d0"/></g>
  <g class="mw-hshake"><g transform="translate(25 28) scale(2.05) translate(0 16.8)">${moonHead('mwHc', 'mw')}</g></g>
</svg>`;
const sfReduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches && document.documentElement.dataset.motion !== 'on');
const sfPhone = () => !!(window.matchMedia && matchMedia('(max-width:640px)').matches);
let sfWalk = null, sfRoamT = 0, sfScrollAt = 0, sfAngryT = 0;
window.addEventListener('scroll', () => { sfScrollAt = Date.now(); }, { passive:true });
function sfStop(){
  if (!sfWalk) return;
  clearTimeout(sfWalk.t); try { sfWalk.anim && sfWalk.anim.cancel(); } catch (e) {}
  sfWalk.el.remove(); sfWalk = null;
  const b = $('sofa'); if (b) b.classList.remove('away');
}
const sfCanRoam = () => { const b = $('sofa'); return !!b && !sfWalk && !sfReduced() && !document.hidden && !b.classList.contains('open') && !$('tour-card') && !$('tour-ask') && !$('modal').classList.contains('open') && !typingInPage() && Date.now() - sfScrollAt > 1500; };
function sfRoam(){
  const btn = $('sofa-btn'); if (!btn || !sfCanRoam()) return;
  const phone = sfPhone(), W = innerWidth, r = btn.getBoundingClientRect(), mw = phone ? 60 : 92;
  const x0 = Math.round(r.left + r.width * .12), lo = phone ? .4 : .2, hi = phone ? .65 : .55;
  const far = Math.max(8, Math.round(W * (lo + Math.random() * (hi - lo)) - mw / 2)), ms = Math.max(1500, Math.abs(x0 - far) / (phone ? 75 : 110) * 1000);
  const el = document.createElement('div'); el.className = 'moon-walker'; el.style.width = mw + 'px'; el.style.transform = `translateX(${x0}px)`;
  el.innerHTML = `<div class="mw-flip">${MOON_WALK}</div>`; document.body.appendChild(el);
  $('sofa').classList.add('away'); sfWalk = { el, anim:null, t:0 };
  const leg = (from, to, right, done) => {
    if (!sfWalk || sfWalk.el !== el) return;
    el.classList.toggle('right', right); el.classList.remove('idle');
    sfWalk.anim = el.animate([{ transform:`translateX(${from}px)` }, { transform:`translateX(${to}px)` }], { duration:ms, easing:'linear', fill:'forwards' });
    sfWalk.anim.onfinish = done;
  };
  leg(x0, far, false, () => {
    if (!sfWalk || sfWalk.el !== el) return;
    el.classList.add('idle');                                         // ngồi nghỉ một chút rồi quay về
    sfWalk.t = setTimeout(() => leg(far, x0, true, () => { const b = $('sofa'); sfStop(); if (b) { b.classList.add('land'); setTimeout(() => b.classList.remove('land'), 700); } }), 1300);
  });
}
function sfSchedule(){
  clearTimeout(sfRoamT);
  const phone = sfPhone();
  sfRoamT = setTimeout(() => { sfRoam(); sfSchedule(); }, (phone ? 100 : 45) * 1000 + Math.random() * (phone ? 100 : 45) * 1000);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) sfStop(); });
/* vết cào: ba đường móng đỏ vẽ nhanh rồi mờ dần ngay chỗ khách bấm */
function sfClaw(x, y){
  if (document.querySelectorAll('.moon-claw').length >= 3) return;
  const c = document.createElement('div'); c.className = 'moon-claw'; c.style.left = x + 'px'; c.style.top = y + 'px';
  c.style.transform = `rotate(${Math.round(Math.random() * 50 - 25)}deg) scaleX(${Math.random() < .5 ? -1 : 1})`;
  const d = ['M18 14Q34 40 30 78', 'M40 8Q58 38 54 82', 'M62 14Q78 40 74 76'];
  c.innerHTML = `<svg viewBox="0 0 90 90" aria-hidden="true">${d.map((v, i) => `<path class="c${i}" pathLength="1" d="${v}" stroke="#e5484d" stroke-width="5.5"/>`).join('')}${d.map((v, i) => `<path class="c${i}" pathLength="1" d="${v}" stroke="#ffd3d8" stroke-width="1.8"/>`).join('')}</svg>`;
  document.body.appendChild(c); setTimeout(() => c.remove(), 1300);
}
function sfAngry(target, e){
  const host = target.closest('.moon-walker') || $('sofa'); if (!host) return;
  host.classList.add('angry'); clearTimeout(host._at); host._at = setTimeout(() => host.classList.remove('angry'), 1400);
  if (sfWalk && host === sfWalk.el && sfWalk.anim) {                  // Moon đang đi: đứng lại gầm gừ một chút rồi đi tiếp
    sfWalk.anim.pause(); host.classList.add('idle'); clearTimeout(sfAngryT);
    sfAngryT = setTimeout(() => { if (sfWalk && sfWalk.anim) { sfWalk.anim.play(); host.classList.remove('idle'); } }, 1400);
  }
  const rc = target.getBoundingClientRect(), px = e && (e.clientX || e.clientY) ? e.clientX : rc.left + rc.width / 2, py = e && (e.clientX || e.clientY) ? e.clientY : rc.top + rc.height / 2;
  sfClaw(px, py);
}
document.addEventListener('click', e => { const t = e.target.closest && e.target.closest('#sofa-btn, .moon-walker'); if (t) sfAngry(t, e); }, true);
Object.assign(ACTIONS, {
  sofaToggle: () => { const b = $('sofa'); if (!b) return; const o = !b.classList.contains('open'); if (o) sfStop(); b.classList.toggle('open', o); $('sofa-card').hidden = !o; $('sofa-btn').setAttribute('aria-expanded', o); if (o) $('sofa-card').querySelector('.btn').focus({ preventScroll:true }); },
  sofaGo: () => { TABS.don = 'comp'; const b = $('sofa'); if (b) { b.classList.remove('open'); $('sofa-card').hidden = true; $('sofa-btn').setAttribute('aria-expanded', false); } }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { const b = $('sofa'); if (b && b.classList.contains('open')) { b.classList.remove('open'); $('sofa-card').hidden = true; $('sofa-btn').setAttribute('aria-expanded', false); } } });
PAGES.donate = function(){ page(`${head('donate_title', 'donate_sub', '', 'lantern', 3)}${donateHTML()}${thanksCard()}`); };
CHANGES.donMail = el => { donMail = el.value; render(true); };
CHANGES.donCustom = el => { const v = Math.round(+el.value); if (v > 0) { donAmt = { cur:donCur || effCurrency(), v }; render(true); } };
Object.assign(ACTIONS, {
  donSeeComp: el => { const b = el.closest('[data-tabs]').querySelector(':scope > .tab-bar > [data-k="comp"]'); ACTIONS.tabPick(b); b.scrollIntoView({ block:'nearest', behavior:'smooth' }); },
  compPay: el => { compPay = el.dataset.m; render(true); },
  compMonths: el => { compMonths = +el.dataset.m; render(true); },
  donCur: el => { donCur = el.dataset.c; donAmt = null; render(true); },
  donAmt: el => { donAmt = { cur:donCur || effCurrency(), v:+el.dataset.v }; render(true); },
  compClaim: () => {
    if (!state.user || state.companion && !compRenewOpen()) return;                 // còn hạn dài thì chưa cho gia hạn
    const renew = state.companion;
    openModal(`<h3 style="margin-bottom:12px">${esc(t(renew ? 'cc_renew' : 'cc_title'))}</h3><p class="small muted" style="margin-bottom:12px">${esc(renew ? t('cc_renew_hint', { d:compUntilDay() }) : t('cc_sub'))}</p>
      <div class="field"><label class="label">${esc(t('cc_method'))}</label><select class="select" id="cc-method">${['kofi', 'bank', 'paypal', 'other'].filter(k => k !== 'kofi' || payments.companionUrl || payments.kofi).map(k => `<option value="${k}" ${k === (compPayMode() === 'vnd' ? 'bank' : (compMonths > 1 || !payments.companionUrl) && payments.paypal ? 'paypal' : 'kofi') ? 'selected' : ''}>${esc(t('cc_m_' + k))}</option>`).join('')}</select></div>
      <div class="field mt-s"><label class="label">${esc(t('cc_months'))}</label><select class="select" id="cc-months">${[1, 3, 12].map(m => `<option value="${m}" ${m === compMonths ? 'selected' : ''}>${esc(t('comp_plan_' + m))}</option>`).join('')}</select></div>
      <div class="field mt-s"><label class="label">${esc(t('cc_note_label'))} *</label><input class="input" id="cc-note" maxlength="200" value="${compPayMode() === 'vnd' && state.user ? esc(compCode()) : ''}" placeholder="${esc(t('cc_note_ph'))}"><p class="small" id="cc-err" style="color:var(--danger);margin-top:4px"></p></div>
      <div class="field mt-s"><label class="label">${esc(t('cc_msg_label'))}</label><textarea class="textarea" id="cc-msg" maxlength="300" style="min-height:56px" placeholder="${esc(t('cc_msg_ph'))}"></textarea></div>
      <div class="row mt" style="justify-content:flex-end"><button type="button" class="btn ghost" data-act="closeModal">${esc(t('cancel'))}</button><button type="button" class="btn primary" data-act="compClaimSend">${esc(t('cc_send'))}</button></div>`, true);
  },
  compClaimSend: async el => {
    const u = state.user; if (!u) return;
    const note = $('cc-note').value.trim().slice(0, 200); if (note.length < 2) { $('cc-err').textContent = t('cc_note_req'); $('cc-note').focus(); return; }   // bắt buộc: để admin đối chiếu khoản thanh toán
    el.disabled = true;
    const rq = { uid:u.uid, email:u.email || '', name:(displayName() || '').slice(0, 100), method:$('cc-method').value, months:+$('cc-months').value || 1, note, message:($('cc-msg').value || '').trim().slice(0, 300), status:'pending' };
    const bd = compBonusMonths(rq.months); if (bd) rq.bonus = bd;                 // tháng tặng thêm: áp dụng mọi cách thanh toán, admin tự cộng khi duyệt
    if (rq.method === 'bank') rq.amount = compPrice(rq.months);                 // chỉ để admin đối chiếu số tiền
    const rw = moonRewardActive(); if (rw) rq.reward = moonRewardMonths(rw);      // báo có ưu đãi trăng; admin vẫn kiểm moon_rewards/<uid> khi duyệt rồi mới cộng tháng tặng
    try { if (!DEMO) await db.collection('companion_requests').doc(u.uid).set({ ...rq, createdAt:TS() }); state.compReq = { ...rq, createdAt:Date.now() }; closeModal(); toast(t('cc_sent')); render(true);
      if (payments.claimTemplate && !DEMO) loadEmailJS().then(() => emailjs.send(EMAILJS_SERVICE, payments.claimTemplate, { user_name:rq.name, user_email:rq.email, months:rq.months, method:rq.method, note:rq.note, message:rq.message })).catch(() => {});      // báo email cho admin (nếu đã tạo mẫu EmailJS)
    }
    catch (e) { el.disabled = false; console.warn('claim', e.code); toast(t('cc_err') + ' ' + (e.code || '')); }
  },
  moonReward: async el => { el.disabled = true; if (await claimMoonReward()) { toast(t('mr_got', { x:bonusText(moonRewardMonths(state.moonReward)) })); render(true); } else { el.disabled = false; toast(t('err_generic')); } },
  moonRetry: () => { if (!state.user) return location.reload(); state.profileFailed = false; render(true); loadProfile(state.user); },   // tải lại hồ sơ ngay, không cần tải lại cả web
  moonStart: () => { if (!DEMO && !state.profileReady) return; if (moonData()) return render(true); moonSave({ startedAt:Date.now(), days:[], rounds:0, moons:0 }); },
  // dùng trăng tích trữ vá các ngày lỡ: thêm các ngày đó vào chuỗi cũ (vẫn còn trong dữ liệu vì chưa điểm danh lại) và ghi vào saved
  moonRescue: el => {
    const m = moonData(); if (!m || !m.rescue || m.days.includes(todayKey())) return; el.disabled = true;
    const old = profile.moon, days = [...new Set([...(old.days || []), ...m.rescue])].sort(), n = m.lost + m.rescue.length;
    const keep = { ...old, days, saved:[...m.saved, ...m.rescue], moons:m.moons + Math.floor(n / MOON_EARN) - Math.floor(m.lost / MOON_EARN), best:Math.max(m.best, n) };
    moonSave(keep).then(ok => { if (!ok) { el.disabled = false; return; } toast(t('mj_rescued', { g:m.rescue.length, n })); mjAfterCheckin(keep.best); });
  },
  moonCheckin: () => {
    const m = moonData(); if (!m) return; const k = todayKey(); if (m.days.includes(k)) return toast(t('club_done_today'));
    const { broken, lost, balance, rescue, ...keep } = m;                              // chuỗi đã đứt thì moonData() trả days rỗng nên bắt đầu lại từ ngày 1
    keep.days = [...m.days, k]; keep.best = Math.max(keep.best || 0, keep.days.length);     // mảng mới, để lưu lỗi thì dữ liệu cũ vẫn nguyên
    const n = keep.days.length; if (n % MOON_EARN === 0) keep.moons = (m.moons || 0) + 1; else keep.moons = m.moons || 0;   // mỗi 14 ngày liên tiếp = +1 trăng tròn tích trữ
    moonSave(keep).then(async ok => { if (ok && n === MOON_REWARD_AT && !state.moonReward && moonRewardCfg().on && await claimMoonReward()) { toast(t('mr_got', { x:bonusText(moonRewardMonths(state.moonReward)) })); render(true); } else if (ok && n % MOON_EARN === 0) toast(t('mj_full_plus')); if (ok) mjAfterCheckin(keep.best); });
  }
});