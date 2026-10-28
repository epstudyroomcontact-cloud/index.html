/* =========================================================
   PHẦN DÙNG CHUNG cho sao lưu / khôi phục Firestore (backup-firestore.mjs, restore-firestore.mjs, decrypt-backup.mjs).
   Bản sao lưu = toàn bộ tài liệu Firestore (cả bảng con như users/<uid>/planner), nén gzip rồi KHOÁ bằng mật khẩu
   (AES-256-GCM, khoá suy ra từ mật khẩu bằng scrypt). Không có mật khẩu BACKUP_PASSWORD thì không ai đọc được file.
   Không cần cài thêm gói nào (chỉ dùng Node có sẵn).
   ========================================================= */
import crypto from 'node:crypto';
import zlib from 'node:zlib';

const MAGIC = Buffer.from('EPBK1');                  // 5 byte đầu file, để nhận ra đúng loại file
const KDF = { N:2 ** 15, r:8, p:1, maxmem:64 * 1024 * 1024 };
export const MIN_PASS = 16;

export function checkPassword(pass){
  if (!pass) throw new Error('Chưa có secret BACKUP_PASSWORD (xem SETUP.md, phần 19). Không sao lưu khi chưa có mật khẩu khoá file.');
  if (pass.length < MIN_PASS) throw new Error(`BACKUP_PASSWORD quá ngắn: cần ít nhất ${MIN_PASS} ký tự.`);
}

/* ---------- khoá / mở khoá ---------- */
export function encryptBackup(obj, pass){
  checkPassword(pass);
  const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12);
  const key = crypto.scryptSync(pass, salt, 32, KDF);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([c.update(zlib.gzipSync(JSON.stringify(obj))), c.final()]);
  return Buffer.concat([MAGIC, salt, iv, c.getAuthTag(), body]);
}
export function decryptBackup(buf, pass){
  if (!buf.subarray(0, 5).equals(MAGIC)) throw new Error('File này không phải bản sao lưu Firestore của web (sai định dạng).');
  const salt = buf.subarray(5, 21), iv = buf.subarray(21, 33), tag = buf.subarray(33, 49);
  const key = crypto.scryptSync(pass || '', salt, 32, KDF);
  const d = crypto.createDecipheriv('aes-256-gcm', key, iv); d.setAuthTag(tag);
  let plain;
  try { plain = Buffer.concat([d.update(buf.subarray(49)), d.final()]); }
  catch { throw new Error('Sai mật khẩu, hoặc file đã bị hỏng.'); }
  const obj = JSON.parse(zlib.gunzipSync(plain));
  if (obj.format !== 'ep-firestore-backup' || !Array.isArray(obj.docs)) throw new Error('File mở được nhưng nội dung không đúng định dạng sao lưu.');
  return obj;
}

/* ---------- đọc toàn bộ Firestore ---------- */
// docs/… → đường dẫn tương đối, ví dụ "users/abc/planner/2026-W43" (để khôi phục được sang project khác)
export const relPath = name => name.split('/documents/')[1];

// Cách 1: một truy vấn "mọi tài liệu ở mọi bảng" (kindless, allDescendants), đọc 1.000 tài liệu một lần, theo thứ tự tên.
async function readAllKindless(api, DOCS){
  const out = []; let last = null;
  for (;;){
    const structuredQuery = { from:[{ allDescendants:true }], orderBy:[{ field:{ fieldPath:'__name__' }, direction:'ASCENDING' }], limit:1000 };
    if (last) structuredQuery.startAt = { values:[{ referenceValue:last }], before:false };
    const r = await api(`${DOCS}:runQuery`, { method:'POST', body:JSON.stringify({ structuredQuery }) });
    if (!r.ok) throw new Error(`runQuery: ${r.status} ${(await r.text()).slice(0, 300)}`);
    const page = (await r.json()).filter(x => x.document).map(x => x.document);
    out.push(...page);
    if (page.length < 1000) return out;
    last = page[page.length - 1].name;
  }
}

// Cách 2 (dự phòng): đi từng bảng, từng tài liệu, rồi hỏi bảng con của mỗi tài liệu.
async function listIds(api, parent){
  const ids = []; let pageToken = '';
  do {
    const r = await api(`${parent}:listCollectionIds`, { method:'POST', body:JSON.stringify({ pageSize:300, pageToken }) });
    if (!r.ok) throw new Error(`listCollectionIds ${parent}: ${r.status} ${(await r.text()).slice(0, 300)}`);
    const j = await r.json(); ids.push(...(j.collectionIds || [])); pageToken = j.nextPageToken || '';
  } while (pageToken);
  return ids;
}
async function readAllWalk(api, DOCS){
  const out = [];
  const walk = async parent => {
    for (const id of await listIds(api, parent)){
      let pageToken = '';
      do {
        const r = await api(`${parent}/${id}?pageSize=300&showMissing=true${pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : ''}`);
        if (!r.ok) throw new Error(`Đọc ${relPath(parent + '/' + id) || id}: ${r.status} ${(await r.text()).slice(0, 300)}`);
        const j = await r.json(); pageToken = j.nextPageToken || '';
        for (const d of j.documents || []){
          if (d.createTime) out.push(d);              // tài liệu "trống" (chỉ có bảng con) thì không lưu, nhưng vẫn đi vào bảng con
          await walk('https://firestore.googleapis.com/v1/' + d.name);
        }
      } while (pageToken);
    }
  };
  await walk(DOCS);
  return out;
}

export async function readAll(api, DOCS){
  let docs;
  try { docs = await readAllKindless(api, DOCS); }
  catch (e) { console.log('::notice::Đọc nhanh không được (' + e.message.slice(0, 120) + '), chuyển sang đọc từng bảng.'); docs = await readAllWalk(api, DOCS); }
  return docs.map(d => ({ path:relPath(d.name), fields:d.fields || {}, createTime:d.createTime, updateTime:d.updateTime }));
}

// Đếm theo bảng gốc để in ra nhật ký (chỉ in tên bảng và số lượng, KHÔNG in nội dung vì nhật ký của repo công khai ai cũng xem được)
export function summary(docs){
  const c = {};
  docs.forEach(d => { const top = d.path.split('/')[0]; c[top] = (c[top] || 0) + 1; });
  return Object.entries(c).sort().map(([k, v]) => `${k}: ${v}`).join(', ');
}

// So sánh hai bộ fields của Firestore mà không phụ thuộc thứ tự khoá
const norm = v => Array.isArray(v) ? v.map(norm) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, norm(v[k])])) : v;
export const sameFields = (a, b) => JSON.stringify(norm(a || {})) === JSON.stringify(norm(b || {}));
