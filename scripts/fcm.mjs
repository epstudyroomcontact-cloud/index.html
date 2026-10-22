/* =========================================================
   PHẦN DÙNG CHUNG cho các máy gửi thông báo đẩy (push-live.mjs, push-planner.mjs):
   đăng nhập Google bằng tài khoản dịch vụ, đọc/ghi Firestore qua REST, gửi FCM HTTP v1.
   Không cần cài thêm gói nào (chỉ dùng Node có sẵn).
   ========================================================= */
import crypto from 'node:crypto';

export const env = process.env;
if (!env.FIREBASE_SERVICE_ACCOUNT) { console.log('::notice::Chưa có secret FIREBASE_SERVICE_ACCOUNT nên chưa gửi gì (xem SETUP.md, phần Thông báo đẩy).'); process.exit(0); }
const SA = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
export const PROJECT = SA.project_id;
export const DRY = env.PUSH_DRY_RUN === '1';
export const NOW = Date.now();

/* ---------- đăng nhập Google bằng tài khoản dịch vụ (JWT ký RS256) ---------- */
const b64u = b => Buffer.from(b).toString('base64url');
let TOKEN = '';
export async function login(){
  const iat = Math.floor(NOW / 1000);
  const head = b64u(JSON.stringify({ alg:'RS256', typ:'JWT' }));
  const claim = b64u(JSON.stringify({ iss:SA.client_email, aud:'https://oauth2.googleapis.com/token', iat, exp:iat + 3600,
    scope:'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase.messaging' }));
  const sig = crypto.createSign('RSA-SHA256').update(head + '.' + claim).sign(SA.private_key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method:'POST', headers:{ 'content-type':'application/x-www-form-urlencoded' },
    body:new URLSearchParams({ grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion:`${head}.${claim}.${sig}` }) });
  const j = await r.json(); if (!j.access_token) throw new Error('Không đăng nhập được Google: ' + JSON.stringify(j));
  TOKEN = j.access_token;
}
export const api = (url, opt = {}) => fetch(url, { ...opt, headers:{ authorization:'Bearer ' + TOKEN, 'content-type':'application/json', ...(opt.headers || {}) } });

/* ---------- Firestore REST ---------- */
export const DOCS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
function decode(v){
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return +v.integerValue;
  if ('doubleValue' in v) return v.doubleValue;
  if ('timestampValue' in v) return Date.parse(v.timestampValue);
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decode);
  if ('mapValue' in v) return decodeFields(v.mapValue.fields);
  return null;
}
export const decodeFields = f => Object.fromEntries(Object.entries(f || {}).map(([k, v]) => [k, decode(v)]));
export function encode(x){
  if (x === null || x === undefined) return { nullValue:null };
  if (typeof x === 'boolean') return { booleanValue:x };
  if (typeof x === 'number') return Number.isInteger(x) ? { integerValue:String(x) } : { doubleValue:x };
  if (typeof x === 'string') return { stringValue:x };
  if (Array.isArray(x)) return { arrayValue:{ values:x.map(encode) } };
  return { mapValue:{ fields:Object.fromEntries(Object.entries(x).map(([k, v]) => [k, encode(v)])) } };
}
export async function getDoc(path){
  const r = await api(`${DOCS}/${path}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Đọc ${path}: ${r.status} ${await r.text()}`);
  return decodeFields((await r.json()).fields);
}
export async function setDoc(path, data){
  if (DRY) return console.log('[thử] ghi', path, JSON.stringify(data));
  const r = await api(`${DOCS}/${path}`, { method:'PATCH', body:JSON.stringify({ fields:encode(data).mapValue.fields }) });
  if (!r.ok) throw new Error(`Ghi ${path}: ${r.status} ${await r.text()}`);
}

export async function updateFields(path, data, fieldPaths){         // chỉ ghi các trường trong fieldPaths, giữ nguyên phần còn lại của tài liệu
  if (DRY) return console.log('[thử] sửa', path, fieldPaths.join(','), JSON.stringify(data));
  const q = fieldPaths.map(f => 'updateMask.fieldPaths=' + encodeURIComponent(f)).join('&');
  const r = await api(`${DOCS}/${path}?${q}`, { method:'PATCH', body:JSON.stringify({ fields:encode(data).mapValue.fields }) });
  if (!r.ok) throw new Error(`Sửa ${path}: ${r.status} ${await r.text()}`);
}

/* ---------- gửi 1 thông báo qua FCM HTTP v1 → 'ok' | 'dead' (token hết hạn / máy đã tắt thông báo) | 'fail' ---------- */
// Chỉ gửi "data": service worker (sw.js) tự hiện thông báo, nên mọi trình duyệt hiện giống nhau
export async function sendOne(token, data, ttlSec){
  const message = { token, data, webpush:{ headers:{ Urgency:'high', TTL:String(ttlSec) } } };
  if (DRY) { console.log('[thử] gửi', token.slice(0, 8), data.title, '|', data.body); return 'ok'; }
  const r = await api(`https://fcm.googleapis.com/v1/projects/${PROJECT}/messages:send`, { method:'POST', body:JSON.stringify({ message }) });
  if (r.ok) return 'ok';
  const err = await r.text();
  if (r.status === 404 || (r.status === 400 && /INVALID_ARGUMENT|registration token/i.test(err)) || (r.status === 403 && /SENDER_ID_MISMATCH/.test(err))) return 'dead';
  console.warn('FCM', r.status, err.slice(0, 300));
  return 'fail';
}
