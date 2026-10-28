/* =========================================================
   KIỂM TRA SỨC KHOẺ WEBSITE HẰNG TUẦN (chạy bởi .github/workflows/health-check.yml)
   1. Web: trang và các file (js, css, ảnh, manifest…) mở được không, bản trên mạng có đúng bản mới nhất không, tải nhanh hay chậm.
   2. Trình duyệt thật (máy tính + điện thoại): web khởi động được không (EP_BOOTED), có lỗi JS / lỗi tải file không, mất bao lâu.
   3. Luật bảo mật Firestore/Storage: thử đọc dữ liệu riêng tư khi chưa đăng nhập (phải bị chặn), dữ liệu công khai (phải đọc được).
      Có secret FIREBASE_SERVICE_ACCOUNT thì thêm: luật đang chạy trên Firebase có giống file trong repo không, và chạy bộ ca thử
      (khách không sửa được cài đặt, không tự cấp quyền Người đồng hành…) ngay trên luật đang chạy, KHÔNG đụng vào dữ liệu thật.
   4. Sao lưu Firestore mỗi đêm có còn chạy thành công không.
   Kết quả: in ra màn hình, ghi health-report.md (workflow dùng để mở/cập nhật issue báo cho chủ trang).
   Chỉ ĐỌC dữ liệu, không ghi gì lên Firebase.
   ========================================================= */
import crypto from 'node:crypto';
import fs from 'node:fs';

const env = process.env;
const SITE = (env.SITE_URL || '').replace(/\/?$/, '/');
const ROOT = new URL('..', import.meta.url);
const read = p => fs.readFileSync(new URL(p, ROOT), 'utf8');
const results = [];   // { area, name, status: ok | warn | fail | skip, detail, fix }
const add = (area, name, status, detail = '', fix = '') => { results.push({ area, name, status, detail, fix }); console.log(`[${status.toUpperCase()}] ${area} · ${name}${detail ? ' — ' + detail : ''}`); };
const median = a => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const sec = ms => (ms / 1000).toFixed(1) + ' giây';
const kb = b => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.round(b / 1024) + ' KB';

// Ngưỡng cảnh báo (đổi ở đây nếu thấy báo quá nhạy)
const LIMIT = { htmlMs:1500, bootWarnMs:8000, bootFailMs:20000, weightWarn:6 * 1048576 };

const cfgSrc = read('js/firebase-config.js');
const cfg = k => (cfgSrc.match(new RegExp(k + ':\\s*"([^"]+)"')) || [])[1];
const API_KEY = cfg('apiKey'), PROJECT = cfg('projectId'), BUCKET = cfg('storageBucket');

async function timed(url, opt = {}){
  const t = performance.now();
  const r = await fetch(url, { redirect:'follow', ...opt, signal:AbortSignal.timeout(30000) });
  const body = Buffer.from(await r.arrayBuffer());
  return { r, body, ms:performance.now() - t };
}

/* ---------- 1. Web: trang chính và các file ---------- */
async function checkSite(){
  const A = 'Web';
  if (!env.SITE_URL) return add(A, 'Địa chỉ web', 'skip', 'Chưa biết địa chỉ web (SITE_URL).');
  let html = '', times = [];
  for (let i = 0; i < 3; i++) {
    try {
      const { r, body, ms } = await timed(SITE + '?hc=' + Date.now(), { headers:{ 'cache-control':'no-cache' } });
      if (!r.ok) return add(A, 'Trang chủ mở được', 'fail', `Máy chủ trả mã ${r.status}.`, 'Vào GitHub → Settings → Pages xem web còn bật không; xem tab Actions có lần "pages build and deployment" nào bị đỏ không.');
      html = body.toString('utf8'); times.push(ms);
    } catch (e) { return add(A, 'Trang chủ mở được', 'fail', 'Không kết nối được: ' + e.message, 'Mở thử web trên điện thoại. Nếu cũng không vào được, xem GitHub → Settings → Pages.'); }
  }
  add(A, 'Trang chủ mở được', 'ok', SITE);
  const t = median(times);
  add(A, 'Tốc độ tải trang chủ', t > LIMIT.htmlMs ? 'warn' : 'ok', `${sec(t)} (lấy giữa 3 lần đo)`, t > LIMIT.htmlMs ? 'Thường do GitHub Pages chậm tạm thời. Nếu tuần sau vẫn chậm thì báo mình xem.' : '');

  // Bản trên mạng có phải bản mới nhất trong repo? (so số phiên bản ?v=… của app.css)
  const ver = s => (s.match(/app\.css\?v=(\d+)/) || [])[1];
  const live = ver(html), repo = ver(read('index.html'));
  if (live && repo) add(A, 'Web đang chạy bản mới nhất', live === repo ? 'ok' : 'warn', live === repo ? `phiên bản ${live}` : `trên mạng là bản ${live}, trong repo là bản ${repo}`,
    live === repo ? '' : 'GitHub chưa đưa bản mới lên. Vào tab Actions xem "pages build and deployment" có bị đỏ không, bấm Re-run nếu có.');

  // Mọi file trang chủ gọi tới + các file phụ quan trọng phải mở được
  const refs = new Set(['manifest.webmanifest', 'sw.js', 'offline.html', 'overlay.html', 'site-fallback.json']);
  for (const m of html.matchAll(/\s(?:src|href)="([^"]+)"/g)) { const u = m[1]; if (!/^(https?:|data:|mailto:|#|\/\/)/.test(u)) refs.add(u); }
  try { for (const ic of JSON.parse(read('manifest.webmanifest')).icons || []) refs.add(ic.src); } catch (e) {}
  const bad = [];
  let total = Buffer.byteLength(html);
  await Promise.all([...refs].map(async u => {
    try { const { r, body } = await timed(new URL(u, SITE).href); if (!r.ok) bad.push(`${u} (${r.status})`); else total += body.length; }
    catch (e) { bad.push(`${u} (${e.message})`); }
  }));
  add(A, `Các file của web mở được (${refs.size} file)`, bad.length ? 'fail' : 'ok', bad.join(', '), bad.length ? 'Có file bị thiếu hoặc lỗi trên mạng: kiểm tra tên file trong repo có đúng không (chữ hoa/thường), và lần đưa web lên gần nhất có thành công không.' : '');
  add(A, 'Dung lượng tải lần đầu (file của web)', total > LIMIT.weightWarn ? 'warn' : 'ok', kb(total), total > LIMIT.weightWarn ? 'Web nặng làm máy yếu / mạng chậm tải lâu. Báo mình xem file nào nên làm nhẹ.' : '');
}

/* ---------- 2. Trình duyệt thật ---------- */
async function checkBrowser(){
  const A = 'Trình duyệt';
  if (!env.SITE_URL) return add(A, 'Mở web bằng trình duyệt', 'skip', 'Chưa biết địa chỉ web.');
  let pw;
  try { pw = await import('playwright-core'); } catch (e) { try { pw = await import('playwright'); } catch (e2) { return add(A, 'Mở web bằng trình duyệt', 'skip', 'Máy kiểm tra chưa có Playwright.'); } }
  const chromium = pw.chromium || pw.default.chromium;
  let browser;
  try { browser = await chromium.launch(env.CHROME_PATH ? { executablePath:env.CHROME_PATH } : { channel:'chrome' }); }
  catch (e) { return add(A, 'Mở web bằng trình duyệt', 'skip', 'Không mở được Chrome: ' + e.message.split('\n')[0]); }
  const host = new URL(SITE).host;
  const devices = [
    { name:'máy tính', ctx:{ viewport:{ width:1366, height:800 } } },
    { name:'điện thoại', ctx:{ viewport:{ width:390, height:844 }, isMobile:true, hasTouch:true, deviceScaleFactor:3,
      userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' } },
  ];
  const routes = ['#/watch', '#/focus', '#/planner', '#/shop', '#/blog', '#/gear', '#/account', '#/'];
  try {
    for (const d of devices) {
      const ctx = await browser.newContext({ ...d.ctx, locale:'vi-VN', serviceWorkers:'block' });
      const page = await ctx.newPage();
      const jsErr = new Set(), conErr = new Set(), ownBad = new Set(), extBad = new Set();
      page.on('pageerror', e => jsErr.add(String(e.message).split('\n')[0].slice(0, 200)));
      page.on('console', m => { if (m.type() === 'error' && !/^Failed to load resource/.test(m.text())) conErr.add(m.text().split('\n')[0].slice(0, 200)); });
      const note = (u, why) => { try { (new URL(u).host === host ? ownBad : extBad).add(`${new URL(u).pathname.split('/').pop() || u} (${why})`); } catch (e) {} };
      page.on('response', r => { if (r.status() >= 400) note(r.url(), r.status()); });
      page.on('requestfailed', r => { const f = r.failure()?.errorText || 'lỗi'; if (!/ABORTED/i.test(f)) note(r.url(), f); });
      const t0 = Date.now();
      try { await page.goto(SITE, { waitUntil:'load', timeout:45000 }); }
      catch (e) { add(A, `Mở web trên ${d.name}`, 'fail', 'Trang không tải xong sau 45 giây.', 'Mở thử web trên máy của bạn. Nếu cũng không được, báo mình ngay.'); await ctx.close(); continue; }
      let booted = true;
      try { await page.waitForFunction(() => window.EP_BOOTED === true, null, { timeout:LIMIT.bootFailMs }); } catch (e) { booted = false; }
      const bootMs = Date.now() - t0;
      const healed = await page.evaluate(() => !!document.getElementById('ep-fail') || /[?&]heal=\d/.test(location.search)).catch(() => false);
      if (!booted || healed) add(A, `Web khởi động trên ${d.name}`, 'fail', healed ? 'Web hiện màn hình "Trang chưa tải được" (lưới an toàn bật).' : `Sau ${sec(LIMIT.bootFailMs)} web vẫn chưa vẽ xong.`, 'Khách có thể đang thấy trang trắng hoặc trang lỗi. Báo mình kèm đường dẫn issue này.');
      else add(A, `Thời gian mở web trên ${d.name}`, bootMs > LIMIT.bootWarnMs ? 'warn' : 'ok', sec(bootMs) + ' (tới lúc web vẽ xong)', bootMs > LIMIT.bootWarnMs ? 'Web mở chậm hơn bình thường. Nếu lặp lại tuần sau, báo mình xem.' : '');
      if (booted && d.name === 'máy tính') for (const r of routes) { await page.evaluate(h => { location.hash = h; }, r).catch(() => {}); await page.waitForTimeout(1500); }
      const weight = await page.evaluate(() => performance.getEntriesByType('resource').reduce((s, e) => s + (e.transferSize || 0), performance.getEntriesByType('navigation')[0]?.transferSize || 0)).catch(() => 0);
      if (weight) add(A, `Tổng dung lượng tải trên ${d.name}`, weight > LIMIT.weightWarn ? 'warn' : 'ok', kb(weight) + ' (cả font, Firebase…)');
      add(A, `Lỗi JavaScript trên ${d.name}${d.name === 'máy tính' ? ' (đã mở thử ' + routes.length + ' trang)' : ''}`, jsErr.size ? 'fail' : 'ok', [...jsErr].slice(0, 5).join(' · '), jsErr.size ? 'Có chức năng có thể không chạy. Báo mình kèm đường dẫn issue này.' : '');
      add(A, `File của web bị lỗi khi tải (${d.name})`, ownBad.size ? 'fail' : 'ok', [...ownBad].slice(0, 8).join(', '));
      if (conErr.size) add(A, `Thông báo lỗi trong console (${d.name})`, 'warn', [...conErr].slice(0, 5).join(' · '), 'Thường không ảnh hưởng khách, nhưng nên xem qua.');
      if (extBad.size) add(A, `Dịch vụ bên ngoài không tải được (${d.name})`, 'warn', [...extBad].slice(0, 6).join(', '), 'Font, YouTube, Firebase… đôi khi lỗi tạm thời. Lặp lại nhiều tuần thì báo mình.');
      await ctx.close();
    }
  } finally { await browser.close(); }
}

/* ---------- 3a. Luật bảo mật: thử như khách lạ chưa đăng nhập (không cần secret) ---------- */
async function checkRulesAnon(){
  const A = 'Bảo mật dữ liệu';
  if (!API_KEY || !PROJECT) return add(A, 'Đọc cấu hình Firebase', 'fail', 'Không đọc được apiKey/projectId trong js/firebase-config.js.');
  const DOCS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
  const status = async url => { try { return (await fetch(url, { signal:AbortSignal.timeout(20000) })).status; } catch (e) { return 'mạng lỗi'; } };
  // Dữ liệu riêng tư: khách lạ phải bị chặn (403)
  const priv = ['users', 'orders', 'companions', 'companion_requests', 'push_tokens', 'push_admin', 'trial_codes', 'trial_redemptions', 'coupons', 'products_private', 'challenge_signups', 'moon_rewards', 'reviews'];
  const open = [], odd = [];
  await Promise.all(priv.map(async c => { const s = await status(`${DOCS}/${c}?pageSize=1&key=${API_KEY}`); if (s === 200) open.push(c); else if (s !== 403) odd.push(`${c} (${s})`); }));
  const s1 = await status(`${DOCS}/push_admin/status?key=${API_KEY}`);
  if (s1 === 200) open.push('push_admin/status');
  add(A, `Dữ liệu riêng tư bị chặn với khách lạ (${priv.length + 1} chỗ)`, open.length ? 'fail' : odd.length ? 'warn' : 'ok', open.length ? 'ĐỌC ĐƯỢC khi chưa đăng nhập: ' + open.join(', ') : odd.join(', '),
    open.length ? 'NGUY HIỂM: người lạ xem được dữ liệu riêng. Vào Firebase Console → Firestore → Rules, dán lại toàn bộ file firestore.rules trong repo rồi bấm Publish. Báo mình ngay.' : odd.length ? 'Không kiểm tra được vài chỗ (lỗi mạng tạm thời?).' : '');
  // Dữ liệu công khai: phải đọc được, nếu không web không hiện nội dung
  const pub = ['settings', 'weekly_schedules'], shut = [];
  await Promise.all(pub.map(async c => { const s = await status(`${DOCS}/${c}?pageSize=1&key=${API_KEY}`); if (s !== 200) shut.push(`${c} (${s})`); }));
  add(A, 'Dữ liệu công khai đọc được (cài đặt, lịch live)', shut.length ? 'fail' : 'ok', shut.join(', '), shut.length ? 'Web có thể không hiện nội dung/lịch live. Kiểm tra Firebase Console → Firestore → Rules, hoặc project Firebase có bị tạm khoá (hết hạn mức) không.' : '');
  // Storage: file sản phẩm số phải bị chặn, ảnh công khai phải xem được
  if (BUCKET) {
    const ST = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o`;
    const f = await status(`${ST}?prefix=files/&maxResults=1`), p = await status(`${ST}?prefix=public/&maxResults=1`);
    if (f === 404) add(A, 'File bán (Storage)', 'skip', 'Project chưa bật Storage.');
    else add(A, 'File bán (Storage) bị chặn với khách lạ', f === 200 ? 'fail' : (f === 403 || f === 401) ? 'ok' : 'warn', f === 200 ? 'Người lạ liệt kê được file sản phẩm số!' : `mã ${f}`, f === 200 ? 'Vào Firebase Console → Storage → Rules, dán lại file storage.rules trong repo rồi Publish.' : '');
    if (p !== 200 && p !== 404) add(A, 'Ảnh công khai (Storage) xem được', 'warn', `mã ${p}`, 'Nếu bạn có dùng Storage cho ảnh, kiểm tra Firebase Console → Storage → Rules.');
  }
}

/* ---------- 3b. Luật bảo mật: so với repo + chạy ca thử trên luật đang chạy (cần secret) ---------- */
let TOKEN = '';
async function login(SA){
  const b64u = b => Buffer.from(b).toString('base64url'), iat = Math.floor(Date.now() / 1000);
  const head = b64u(JSON.stringify({ alg:'RS256', typ:'JWT' }));
  const claim = b64u(JSON.stringify({ iss:SA.client_email, aud:'https://oauth2.googleapis.com/token', iat, exp:iat + 3600, scope:'https://www.googleapis.com/auth/firebase.readonly https://www.googleapis.com/auth/cloud-platform' }));
  const sig = crypto.createSign('RSA-SHA256').update(head + '.' + claim).sign(SA.private_key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method:'POST', headers:{ 'content-type':'application/x-www-form-urlencoded' },
    body:new URLSearchParams({ grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion:`${head}.${claim}.${sig}` }) });
  const j = await r.json(); if (!j.access_token) throw new Error('Không đăng nhập được Google (' + (j.error || r.status) + ')');
  TOKEN = j.access_token;
}
const RULES = 'https://firebaserules.googleapis.com/v1';
async function rulesApi(path, body){
  const r = await fetch(`${RULES}/${path}`, { method:body ? 'POST' : 'GET', headers:{ authorization:'Bearer ' + TOKEN, 'content-type':'application/json' }, body:body && JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(`${r.status} ${j.error?.message || ''}`.trim()); e.status = r.status; throw e; }
  return j;
}
async function liveRules(release){
  const rel = await rulesApi(`projects/${PROJECT}/releases/${release}`);
  const rs = await rulesApi(rel.rulesetName);
  return { src:rs.source.files.map(f => f.content).join('\n'), updated:rel.updateTime };
}
const norm = s => s.replace(/\r/g, '').split('\n').map(l => l.trimEnd()).join('\n').trim();

// Ca thử: [mô tả, ALLOW/DENY, người gửi, cách làm, đường dẫn, dữ liệu gửi lên]. Chỉ dùng luật không cần đọc tài liệu khác (không cần giả lập get()).
const ADMIN = { uid:'admin-thu', token:{ email:'epstudyroom.contact@gmail.com', email_verified:true } };
const FAKE_ADMIN = { uid:'gia-mao', token:{ email:'epstudyroom.contact@gmail.com', email_verified:false } };
const USER = { uid:'khach-a', token:{ email:'khach-a@example.com', email_verified:true } };
const order = status => ({ status, code:'EP123', buyer:{ email:'a@example.com' }, uid:null });
const CASES = [
  ['Khách lạ không sửa được cài đặt web', 'DENY', null, 'update', 'settings/site', { title:'x' }],
  ['Khách đã đăng nhập không sửa được cài đặt web', 'DENY', USER, 'update', 'settings/site', { title:'x' }],
  ['Email admin chưa xác minh không được làm admin', 'DENY', FAKE_ADMIN, 'update', 'settings/site', { title:'x' }],
  ['Admin thật sửa được cài đặt web', 'ALLOW', ADMIN, 'update', 'settings/site', { title:'x' }],
  ['Khách không tự cấp quyền Người đồng hành', 'DENY', USER, 'create', 'companions/khach-a', { until:'2099-01-01' }],
  ['Khách không xem được hồ sơ người khác', 'DENY', USER, 'get', 'users/khach-b', null],
  ['Khách xem được hồ sơ của chính mình', 'ALLOW', USER, 'get', 'users/khach-a', null],
  ['Khách không liệt kê được mã dùng thử', 'DENY', USER, 'list', 'trial_codes/X', null],
  ['Khách không đọc được token thông báo', 'DENY', USER, 'get', 'push_tokens/' + 'a'.repeat(64), null],
  ['Khách lạ tạo được đơn hàng "chờ thanh toán"', 'ALLOW', null, 'create', 'orders/o1', order('pending')],
  ['Khách không tạo được đơn "đã thanh toán"', 'DENY', null, 'create', 'orders/o2', order('paid')],
  ['Khách không tự sửa đơn hàng', 'DENY', USER, 'update', 'orders/o1', order('paid')],
];
const testSuite = { testCases:CASES.map(([, expectation, auth, method, path, data]) => ({
  expectation,
  request:{ auth, method, path:`/databases/(default)/documents/${path}`, ...(data ? { resource:{ data } } : {}) },
  ...(method === 'update' ? { resource:{ data } } : {}),
})) };

async function checkRulesAdmin(){
  const A = 'Bảo mật dữ liệu';
  if (!env.FIREBASE_SERVICE_ACCOUNT) return add(A, 'So luật trên Firebase với repo', 'skip', 'Chưa có secret FIREBASE_SERVICE_ACCOUNT.');
  try { const SA = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT); if (SA.project_id !== PROJECT) return add(A, 'So luật trên Firebase với repo', 'skip', 'Secret thuộc project Firebase khác với web.'); await login(SA); }
  catch (e) { return add(A, 'So luật trên Firebase với repo', 'skip', e.message); }
  const noPerm = e => e.status === 403 || e.status === 401;
  const repoSrc = read('firestore.rules');
  let live;
  try {
    live = await liveRules('cloud.firestore');
    const same = norm(live.src) === norm(repoSrc);
    add(A, 'Luật Firestore trên Firebase giống file trong repo', same ? 'ok' : 'warn', same ? '' : `Luật đang chạy (cập nhật ${live.updated?.slice(0, 10)}) khác file firestore.rules trong repo.`,
      same ? '' : 'Có thể bạn chưa dán bản mới nhất lên, hoặc đã sửa trực tiếp trên Firebase. Mở Firebase Console → Firestore → Rules, dán toàn bộ file firestore.rules trong repo rồi Publish (hoặc báo mình xem khác chỗ nào).');
  } catch (e) { return add(A, 'So luật trên Firebase với repo', 'skip', noPerm(e) ? 'Tài khoản dịch vụ không có quyền xem luật (cần vai trò "Firebase Rules Viewer").' : e.message); }
  if (BUCKET) try {
    const st = await liveRules('firebase.storage/' + BUCKET), same = norm(st.src) === norm(read('storage.rules'));
    add(A, 'Luật Storage trên Firebase giống file trong repo', same ? 'ok' : 'warn', same ? '' : `Luật Storage đang chạy (cập nhật ${st.updated?.slice(0, 10)}) khác file storage.rules.`, same ? '' : 'Firebase Console → Storage → Rules, dán file storage.rules trong repo rồi Publish.');
  } catch (e) { if (e.status !== 404) add(A, 'So luật Storage với repo', 'skip', e.message); }

  // Chạy ca thử trên luật ĐANG CHẠY và trên file trong repo (để biết lần dán tới có an toàn không). Không đụng vào dữ liệu thật.
  for (const [label, src] of [['đang chạy trên Firebase', live.src], ['trong repo', repoSrc]]) {
    if (label === 'trong repo' && norm(src) === norm(live.src)) continue;
    try {
      const j = await rulesApi(`projects/${PROJECT}:test`, { source:{ files:[{ name:'firestore.rules', content:src }] }, testSuite });
      const errs = (j.issues || []).filter(i => i.severity === 'ERROR').map(i => `dòng ${i.sourcePosition?.line}: ${i.description}`);
      if (errs.length) { add(A, `Luật ${label} viết đúng cú pháp`, 'fail', errs.slice(0, 3).join(' · '), 'Luật có lỗi, Firebase sẽ không nhận khi dán. Báo mình sửa.'); continue; }
      const wrong = (j.testResults || []).map((t, i) => t.state === 'SUCCESS' ? null : CASES[i][0]).filter(Boolean);
      add(A, `Ca thử bảo mật trên luật ${label} (${CASES.length} ca)`, wrong.length ? 'fail' : 'ok', wrong.length ? 'Sai: ' + wrong.join('; ') : '',
        wrong.length ? (label === 'trong repo' ? 'Đừng dán file luật này lên Firebase, báo mình sửa trước.' : 'Luật đang chạy có lỗ hổng. Dán lại file firestore.rules trong repo lên Firebase, rồi báo mình.') : '');
    } catch (e) { add(A, `Ca thử bảo mật trên luật ${label}`, 'skip', noPerm(e) ? 'Tài khoản dịch vụ không có quyền chạy thử luật.' : e.message); }
  }
}

/* ---------- 4. Sao lưu Firestore mỗi đêm (backup-firestore.yml) còn chạy đều không ---------- */
async function checkBackup(){
  const A = 'Sao lưu', repo = env.GITHUB_REPOSITORY;
  if (!env.GH_TOKEN || !repo || !fs.existsSync(new URL('.github/workflows/backup-firestore.yml', ROOT))) return;
  const r = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/backup-firestore.yml/runs?status=success&per_page=1`, { headers:{ authorization:'Bearer ' + env.GH_TOKEN, accept:'application/vnd.github+json' } });
  if (!r.ok) return add(A, 'Sao lưu Firestore gần đây', 'skip', `Không đọc được lịch sử chạy (${r.status}).`);
  const last = (await r.json()).workflow_runs?.[0];
  const days = last ? (Date.now() - Date.parse(last.updated_at)) / 864e5 : Infinity;
  add(A, 'Sao lưu Firestore gần đây', days > 3 ? 'warn' : 'ok', last ? `lần thành công gần nhất cách đây ${days.toFixed(1)} ngày` : 'chưa có lần sao lưu nào thành công',
    days > 3 ? 'Vào GitHub → Actions → "Sao lưu Firestore" xem lần chạy bị đỏ vì sao (thường do thiếu secret, xem SETUP.md PHẦN 19).' : '');
}

/* ---------- chạy + viết báo cáo ---------- */
for (const f of [checkSite, checkBrowser, checkRulesAnon, checkRulesAdmin, checkBackup]) {
  try { await f(); } catch (e) { add('Máy kiểm tra', f.name, 'warn', 'Bước kiểm tra bị lỗi: ' + e.message); }
}
const icon = { ok:'✅', warn:'⚠️', fail:'❌', skip:'⏭️' };
const n = s => results.filter(r => r.status === s).length;
const fails = n('fail'), warns = n('warn');
const when = new Date().toLocaleString('vi-VN', { timeZone:'Asia/Ho_Chi_Minh', dateStyle:'full', timeStyle:'short' });
let md = `## ${fails ? '❌ Có lỗi cần xử lý' : warns ? '⚠️ Có điểm cần để ý' : '✅ Mọi thứ ổn'}\n\nKiểm tra ${when} (giờ Việt Nam) · ${env.SITE_URL || ''}\n\n`
  + `${n('ok')} ổn · ${warns} cần để ý · ${fails} lỗi${n('skip') ? ` · ${n('skip')} bỏ qua` : ''}\n\n`;
const problems = results.filter(r => r.status === 'fail' || r.status === 'warn');
if (problems.length) md += '### Cần xem\n\n' + problems.map(r => `- ${icon[r.status]} **${r.name}**${r.detail ? ': ' + r.detail : ''}${r.fix ? `\n  - 👉 ${r.fix}` : ''}`).join('\n') + '\n\n';
md += '<details><summary>Toàn bộ kết quả</summary>\n\n| | Mục | Chi tiết |\n|---|---|---|\n'
  + results.map(r => `| ${icon[r.status]} | ${r.area} · ${r.name} | ${(r.detail || '').replace(/\|/g, '/').replace(/\n/g, ' ')} |`).join('\n') + '\n\n</details>\n';
fs.writeFileSync(env.REPORT_FILE || 'health-report.md', md);
if (env.GITHUB_STEP_SUMMARY) fs.appendFileSync(env.GITHUB_STEP_SUMMARY, md);
if (env.GITHUB_OUTPUT) fs.appendFileSync(env.GITHUB_OUTPUT, `fails=${fails}\nwarns=${warns}\n`);
console.log(`\nXong: ${n('ok')} ổn, ${warns} cần để ý, ${fails} lỗi.`);
