/* =========================================================
   MỞ KHOÁ BẢN SAO LƯU TRÊN MÁY CỦA BẠN (tuỳ chọn, cần cài Node: https://nodejs.org).
   Cách dùng:  node scripts/decrypt-backup.mjs firestore-2026-10-28_1917.enc
   Gõ mật khẩu BACKUP_PASSWORD khi được hỏi. Kết quả: file .json cạnh file .enc.
   File .json KHÔNG được khoá (có email, đơn hàng của khách): xem xong thì xoá, không đưa lên GitHub.
   ========================================================= */
import fs from 'node:fs';
import readline from 'node:readline/promises';
import { decryptBackup, summary } from './backup-lib.mjs';

const file = process.argv[2];
if (!file) { console.log('Cách dùng: node scripts/decrypt-backup.mjs <file.enc>'); process.exit(1); }
let pass = process.env.BACKUP_PASSWORD;
if (!pass){
  const rl = readline.createInterface({ input:process.stdin, output:process.stdout });
  pass = await rl.question('Mật khẩu BACKUP_PASSWORD: '); rl.close();
}
const backup = decryptBackup(fs.readFileSync(file), pass);
const out = file.replace(/\.enc$/, '') + '.json';
fs.writeFileSync(out, JSON.stringify(backup, null, 1));
console.log(`Đã mở: ${backup.count} tài liệu, sao lưu lúc ${backup.createdAt}. ${summary(backup.docs)}\nFile: ${out}`);
