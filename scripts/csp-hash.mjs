// In mã băm CSP (sha256) của đoạn mã viết thẳng trong offline.html.
// Sửa đoạn mã đó thì chạy:  node scripts/csp-hash.mjs  rồi thay mã mới vào dòng Content-Security-Policy ở đầu offline.html.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../offline.html', import.meta.url), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
const m = /<script>([\s\S]*?)<\/script>/.exec(html);
if (!m) { console.error('Không thấy đoạn mã viết thẳng trong offline.html'); process.exit(1); }
console.log("'sha256-" + createHash('sha256').update(m[1]).digest('base64') + "'");
