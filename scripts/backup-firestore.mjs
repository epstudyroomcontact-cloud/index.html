/* =========================================================
   SAO LƯU FIRESTORE TỰ ĐỘNG — chạy trên GitHub Actions (.github/workflows/backup-firestore.yml), mỗi đêm một lần.
   1. Đăng nhập bằng tài khoản dịch vụ trong GitHub Secret FIREBASE_SERVICE_ACCOUNT (chỉ ĐỌC dữ liệu, không ghi gì).
   2. Đọc mọi tài liệu (thành viên, Hành trình trăng, Planner, đơn hàng, cài đặt…), kể cả bảng con.
   3. Khoá file bằng mật khẩu BACKUP_PASSWORD, mở thử lại để chắc chắn khôi phục được, rồi lưu vào thư mục BACKUP_OUT.
   Workflow cất file vào mục "Artifacts" của lần chạy (giữ 90 ngày). Xem SETUP.md, phần 19.
   ========================================================= */
import fs from 'node:fs';
import path from 'node:path';
import { encryptBackup, decryptBackup, checkPassword, readAll, summary } from './backup-lib.mjs';

const env = process.env;
if (!env.FIREBASE_SERVICE_ACCOUNT) { console.log('::error::Chưa có secret FIREBASE_SERVICE_ACCOUNT (xem SETUP.md, phần 17.1).'); process.exit(1); }
checkPassword(env.BACKUP_PASSWORD);                   // không có mật khẩu thì dừng ngay, không bao giờ lưu file chưa khoá
const { PROJECT, DOCS, login, api } = await import('./fcm.mjs');

await login();
const docs = await readAll(api, DOCS);
if (!docs.length) throw new Error('Không đọc được tài liệu nào. Có thể tài khoản dịch vụ thiếu quyền, hoặc Firestore đang trống. Bản sao lưu cũ vẫn giữ nguyên.');

const createdAt = new Date().toISOString();
const backup = { format:'ep-firestore-backup', version:1, project:PROJECT, createdAt, count:docs.length, docs };
const file = encryptBackup(backup, env.BACKUP_PASSWORD);

const check = decryptBackup(file, env.BACKUP_PASSWORD);   // mở thử: file phải mở được và đủ số tài liệu
if (check.count !== docs.length || check.docs.length !== docs.length) throw new Error('Kiểm tra bản sao lưu không khớp, dừng lại.');

const stamp = createdAt.slice(0, 16).replace('T', '_').replace(':', '');   // 2026-10-28_1917 (giờ UTC)
const out = env.BACKUP_OUT || 'backup-out';
fs.mkdirSync(out, { recursive:true });
const name = `firestore-${stamp}.enc`;
fs.writeFileSync(path.join(out, name), file);
if (env.GITHUB_OUTPUT) fs.appendFileSync(env.GITHUB_OUTPUT, `stamp=${stamp}\n`);

console.log(`Xong: đã sao lưu ${docs.length} tài liệu (${(file.length / 1024).toFixed(0)} KB, đã khoá). ${summary(docs)}`);
