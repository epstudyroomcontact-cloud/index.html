/* Đếm số tài khoản đã đăng ký (collection users) và ghi vào site_stats/members = { n, t } để Tổng quan hiện cho cả khách chưa đăng nhập.
   Chạy bằng .github/workflows/count-members.yml (mỗi 6 giờ + chạy tay). Dùng tài khoản dịch vụ nên không phụ thuộc admin có mở web hay không.
   Chỉ ghi một con số, không đọc hay ghi tên, email. */
import { DOCS, login, api, setDoc, NOW } from './fcm.mjs';

await login();
const r = await api(`${DOCS}:runAggregationQuery`, { method:'POST', body:JSON.stringify({ structuredAggregationQuery:{ structuredQuery:{ from:[{ collectionId:'users' }] }, aggregations:[{ alias:'n', count:{} }] } }) });
if (!r.ok) throw new Error(`Đếm users: ${r.status} ${await r.text()}`);
const n = +(await r.json())[0]?.result?.aggregateFields?.n?.integerValue;
if (!Number.isFinite(n) || n < 0) throw new Error('Không đọc được số tài khoản');
await setDoc('site_stats/members', { n, t:NOW });
console.log(`Đã ghi site_stats/members: ${n} thành viên`);
