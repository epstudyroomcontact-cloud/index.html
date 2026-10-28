/* =========================================================
   KHÔI PHỤC FIRESTORE TỪ BẢN SAO LƯU — chạy tay trên GitHub Actions (.github/workflows/restore-firestore.yml).
   RESTORE_MODE:
     thu        (mặc định) chỉ so sánh rồi báo sẽ thay đổi gì, KHÔNG ghi gì.
     them-thieu chỉ tạo lại những tài liệu đang BỊ MẤT; tài liệu đang có giữ nguyên.
     ghi-de     tạo lại tài liệu bị mất VÀ đưa tài liệu đang khác về đúng như trong bản sao lưu.
   Không chế độ nào xoá tài liệu. Tài liệu tạo sau ngày sao lưu vẫn còn nguyên.
   RESTORE_ONLY: chỉ khôi phục một phần, ví dụ "users" (cả bảng) hoặc "users/<uid>" (một người, kể cả Planner của họ).
   Xem SETUP.md, phần 19.
   ========================================================= */
import fs from 'node:fs';
import { decryptBackup, summary, sameFields } from './backup-lib.mjs';

const env = process.env;
const MODE = env.RESTORE_MODE || 'thu';
const ONLY = (env.RESTORE_ONLY || '').trim().replace(/^\/+|\/+$/g, '');
if (!['thu', 'them-thieu', 'ghi-de'].includes(MODE)) throw new Error('RESTORE_MODE phải là thu, them-thieu hoặc ghi-de.');
if (!env.FIREBASE_SERVICE_ACCOUNT) { console.log('::error::Chưa có secret FIREBASE_SERVICE_ACCOUNT.'); process.exit(1); }
const FILE = process.argv[2];
if (!FILE) throw new Error('Thiếu đường dẫn file .enc');

const backup = decryptBackup(fs.readFileSync(FILE), env.BACKUP_PASSWORD);
const { PROJECT, DOCS, login, api } = await import('./fcm.mjs');
const docs = backup.docs.filter(d => !ONLY || d.path === ONLY || d.path.startsWith(ONLY + '/'));
console.log(`Bản sao lưu lúc ${backup.createdAt} (project ${backup.project}), ${backup.count} tài liệu. Đang xét ${docs.length} tài liệu${ONLY ? ` thuộc "${ONLY}"` : ''}. Chế độ: ${MODE}.`);
if (backup.project !== PROJECT) console.log(`::warning::Bản sao lưu của project ${backup.project}, đang khôi phục vào project ${PROJECT}.`);
if (!docs.length) { console.log('Không có tài liệu nào khớp, không làm gì.'); process.exit(0); }

await login();
const ROOT = DOCS.replace('https://firestore.googleapis.com/v1/', '');    // projects/<id>/databases/(default)/documents
const BASE = DOCS.split('/documents')[0];

// So với dữ liệu đang có (đọc 100 tài liệu một lần)
const missing = [], changed = [];
for (let i = 0; i < docs.length; i += 100){
  const part = docs.slice(i, i + 100);
  const r = await api(`${BASE}/documents:batchGet`, { method:'POST', body:JSON.stringify({ documents:part.map(d => `${ROOT}/${d.path}`) }) });
  if (!r.ok) throw new Error(`batchGet: ${r.status} ${(await r.text()).slice(0, 300)}`);
  const now = new Map();
  for (const x of await r.json()) if (x.found) now.set(x.found.name.split('/documents/')[1], x.found.fields || {});
  for (const d of part){
    if (!now.has(d.path)) missing.push(d);
    else if (!sameFields(now.get(d.path), d.fields)) changed.push(d);
  }
}
console.log(`Đang bị mất: ${missing.length}${missing.length ? ' (' + summary(missing) + ')' : ''}. Đang khác bản sao lưu: ${changed.length}${changed.length ? ' (' + summary(changed) + ')' : ''}. Giống hệt: ${docs.length - missing.length - changed.length}.`);

if (MODE === 'thu'){ console.log('Chế độ thử: không ghi gì. Muốn khôi phục thật thì chạy lại với chế độ them-thieu hoặc ghi-de.'); process.exit(0); }

const writes = [
  ...missing.map(d => ({ update:{ name:`${ROOT}/${d.path}`, fields:d.fields }, currentDocument:{ exists:false } })),   // chỉ tạo nếu vẫn chưa có
  ...(MODE === 'ghi-de' ? changed.map(d => ({ update:{ name:`${ROOT}/${d.path}`, fields:d.fields } })) : []),
];
let ok = 0, fail = 0;
for (let i = 0; i < writes.length; i += 200){
  const r = await api(`${BASE}/documents:batchWrite`, { method:'POST', body:JSON.stringify({ writes:writes.slice(i, i + 200) }) });
  if (!r.ok) throw new Error(`batchWrite: ${r.status} ${(await r.text()).slice(0, 300)}`);
  for (const s of (await r.json()).status || []) (s.code ? fail++ : ok++);
}
console.log(`Xong: đã ghi ${ok} tài liệu${fail ? `, ${fail} tài liệu không ghi được (có thể vừa được tạo lại trong lúc chạy)` : ''}.`);
if (fail) process.exitCode = 1;
