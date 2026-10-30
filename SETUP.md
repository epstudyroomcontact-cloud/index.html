# Hướng dẫn thiết lập — từng bước, từng phần mềm

Bạn chỉ cần làm theo thứ tự. Không cần biết lập trình. Mỗi bước đều ghi rõ **bấm vào đâu**.

Bạn sẽ dùng 4 nơi: **GitHub** (để đăng web), **Firebase** (lưu dữ liệu + đăng nhập), **Gmail** (xác minh tài khoản admin), và vài trang tuỳ chọn (YouTube, ngân hàng, PayPal/Ko-fi).

---

## PHẦN 1 — GitHub: đưa web lên mạng

1. Vào https://github.com và đăng nhập. Mở repo (kho) chứa website của bạn.
2. Bấm nút **Add file** (góc phải, màu xám) → chọn **Upload files**.
3. Mở thư mục `D:\STUDY WITH EP\code web epstudyroom` trên máy. Chọn **tất cả** bên trong (bấm vào 1 file rồi nhấn `Ctrl + A`) và **kéo thả** vào khung trên GitHub.
   Phải có đủ: `index.html`, `core.js`, `pages.js`, `admin.js`, `group.js`, `guide.js`, `app.css` và các file khác ở trang gốc, thư mục `js`, `vendor`, `icons`, `firestore.rules`, `storage.rules`, `SETUP.md` (xem thêm **Quy tắc cập nhật** ở cuối file).
   Nếu GitHub hỏi file trùng tên thì cứ để nó thay thế (bản mới đè bản cũ).
4. Kéo xuống cuối trang, bấm nút xanh **Commit changes**.
5. Bật trang web: bấm tab **Settings** (của repo) → cột trái chọn **Pages** → mục **Branch** chọn `main` và `/ (root)` → bấm **Save**.
6. Chờ 1–2 phút, tải lại trang Pages, bạn sẽ thấy dòng **"Your site is live at https://TENBAN.github.io/TENREPO/"**. Bấm vào đó. Ghi lại phần `TENBAN.github.io` (không có `https://`) — lát nữa cần dùng ở Firebase.

> Mỗi lần sửa code sau này, lặp lại bước 2–4 là web tự cập nhật sau 1–2 phút.

---

## PHẦN 2 — Firebase: bật đăng nhập và lưu dữ liệu (làm 1 lần)

Vào https://console.firebase.google.com (đăng nhập bằng Gmail đã tạo project) → bấm vào project **epstudyroom-bacaf**.

### 2.1. Bật đăng nhập bằng email
1. Cột trái bấm **Build** (Xây dựng) → **Authentication**.
2. Nếu thấy nút **Get started** thì bấm nó.
3. Chọn tab **Sign-in method** → bấm **Email/Password** → gạt nút **Enable** sang bật → bấm **Save**.
4. Chọn tab **Settings** (trong Authentication) → mục **Authorized domains** → bấm **Add domain** → gõ `TENBAN.github.io` (đúng như ghi ở Phần 1, không có `https://`) → bấm **Add**.

### 2.2. Tạo cơ sở dữ liệu (nếu chưa có)
1. Cột trái **Build** → **Firestore Database**.
2. Nếu thấy nút **Create database**: bấm → chọn vị trí gần bạn (ví dụ `asia-southeast1`) → chọn **Start in production mode** → **Create**.
   (Nếu đã có dữ liệu thì bỏ qua bước này.)

### 2.3. Dán luật bảo mật (rất quan trọng — để không ai sửa được dữ liệu của bạn)
1. Trong **Firestore Database**, bấm tab **Rules**.
2. Mở một cửa sổ khác: vào GitHub, mở file `firestore.rules` trong repo của bạn, bấm nút **Copy raw file** (biểu tượng hai tờ giấy).
3. Quay lại Firebase: bấm vào ô Rules, `Ctrl + A` (chọn hết), `Delete`, rồi `Ctrl + V` (dán).
4. Bấm **Publish**.

> Mỗi lần file `firestore.rules` thay đổi (ví dụ khi thêm Planner cho Companions và nút "Tôi đã thanh toán"), bạn làm lại đúng 4 bước này một lần. Chưa dán luật mới thì Planner và nút báo thanh toán sẽ báo lỗi lưu.

---

## PHẦN 3 — Tạo tài khoản admin (chủ trang)

1. Mở website của bạn. Menu trái bấm **Sign in** → chọn **Create account**.
2. Điền: tên hiển thị tuỳ ý, email **epstudyroom.contact@gmail.com**, và **mật khẩu bạn tự đặt** (ít nhất 6 ký tự; nên dài và khó đoán — đừng dùng lại mật khẩu cũ `hottea68` nếu nó từng nằm trong code công khai).
3. Mở Gmail của `epstudyroom.contact@gmail.com`. Tìm email từ Firebase (có thể nằm trong **Spam**) → bấm vào đường link **xác minh**.
4. Quay lại website, đăng nhập. Menu trái sẽ có mục **Admin console**. Bấm vào.
   Nếu trang báo "Cần xác minh email admin" thì bấm **"Tôi đã xác minh rồi"**.

Chỉ đúng email này (đã xác minh) mới có quyền admin. Người khác dù tạo tài khoản cũng không vào được.

---

## PHẦN 4 — Làm quen trang quản trị (Admin console)

Các tab và việc chính:
- **Giao diện & Menu**: tên trang, logo, màu chủ đạo, font, ẩn/đổi tên các mục ở menu, thông báo chạy chữ, mạng xã hội, YouTube.
- **Lịch live**: mỗi buổi live có thể chọn **"Mẫu Pomodoro (tự tính)"** (VD 50/10/30) **hoặc "Tự sắp xếp từng đoạn"**: bạn thêm từng đoạn *Tập trung / Nghỉ ngắn / Nghỉ dài* với số phút tuỳ ý, theo thứ tự tuỳ ý (VD: 25 – 5 – 25 – 15 – 40). Có thể huỷ từng buổi hoặc cả ngày kèm lý do.
- **Bài viết**: bấm **Quản lý các mục** để tạo các mục (Nhật ký, Ghi chép học tập, Tản văn, Sách & phim, Thơ…). Khi viết bài, chọn mục, ghim lên đầu, hoặc hẹn giờ đăng. Bản nháp tự lưu trong trình duyệt. Tiếng Anh là ngôn ngữ chính, tiếng Việt là tuỳ chọn.
- **Sản phẩm / Đơn hàng / Mã giảm giá / Đánh giá**: thêm sản phẩm, đổi trạng thái đơn sang `paid` khi thấy tiền về, xoá đánh giá…
- **Thanh toán**: thông tin ngân hàng (VietQR), PayPal, Stripe, Ko-fi và mẫu email EmailJS. **Gói Người đồng hành**: giá, mức tiền gợi ý, link tự gia hạn, thanh mục tiêu, khuyến mãi, giới hạn Focus, nhóm học.
- **Thành viên**: danh sách tài khoản, tiến độ Hành trình trăng của từng người, ô tích **"Người đồng hành"**.

**Sửa chữ và ảnh trực tiếp trên trang**: bấm nút ✏️ (cây bút) ở thanh trên cùng → bấm vào chữ có viền nét đứt để gõ lại (tự lưu khi bấm ra ngoài) → bấm vào ảnh để thay.

Mặc định trang hiển thị **tiếng Anh**. Khách đổi ngôn ngữ ở nút ⚙️ (thanh trên cùng).

---

## PHẦN 5 — Nhận ủng hộ (trang "Support")

### 5.1. Chuyển khoản trong nước (VietQR)
1. Vào Admin console → tab **Thanh toán**.
2. **Mã ngân hàng / BIN**: điền mã của ngân hàng bạn:

| Ngân hàng | Mã | Ngân hàng | Mã |
|---|---|---|---|
| Vietcombank | 970436 | MB Bank | 970422 |
| Techcombank | 970407 | ACB | 970416 |
| VPBank | 970432 | BIDV | 970418 |
| VietinBank | 970415 | TPBank | 970423 |
| Sacombank | 970403 | VIB | 970441 |

   (Ngân hàng khác: tra "mã BIN ngân hàng + tên ngân hàng" trên Google.)
3. **Số tài khoản** và **Tên chủ tài khoản** (IN HOA, không dấu). Bấm **Lưu**.

### 5.2. PayPal (khách nước ngoài)
1. Vào https://www.paypal.com/paypalme → làm theo hướng dẫn tạo link `paypal.me/tencuaban`.
2. Dán link đó vào ô **PayPal.me** → Lưu. Trang sẽ tự gắn số tiền khách chọn vào link.

### 5.3. Ko-fi và "Người đồng hành" (ủng hộ hằng tháng, nhẹ nhàng)
1. Vào https://ko-fi.com → tạo trang của bạn → bật **Memberships** (gói hằng tháng) hoặc dùng Patreon.
2. Copy link trang đó, dán vào **Link đăng ký hằng tháng cho "Người đồng hành"** và/hoặc ô **Ko-fi** → Lưu.
3. Khi có người ủng hộ hằng tháng, bạn vào tab **Thành viên** → tích **"Người đồng hành"** cho tài khoản của họ → họ có huy hiệu nhỏ. (Bạn tự đối chiếu với Ko-fi/Patreon.)

---

## PHẦN 6 — Hành trình trăng (điểm danh 30 ngày)

Không cần cài đặt thêm. Thành viên đã đăng nhập vào mục **Moon Journey**:
1. Bấm **Start my journey**.
2. Mỗi ngày xem stream xong bấm **Check in for today** (mỗi ngày một lần).
3. Mặt trăng đầy dần từ trăng khuyết; đủ 30 ngày thì thành **trăng tròn**. Có thể bắt đầu vòng mới.

---

## PHẦN 7 — YouTube (nhúng live và video mới)

1. Vào https://studio.youtube.com (đăng nhập kênh) → cột trái **Settings** → **Channel** → **Advanced settings**.
2. Copy dòng **Channel ID** (bắt đầu bằng `UC…`).
3. Vào Admin console → **Giao diện & Menu** → cuộn xuống mục **YouTube** → dán vào ô **Channel ID** → **Lưu YouTube**.
4. Trang **Watch live** sẽ nhúng buổi live đang phát và hiện các video mới. Bạn cũng có thể thêm video thủ công ở ngay mục đó.

---

## PHẦN 8 (tuỳ chọn) — Tải ảnh/file từ máy lên (Firebase Storage)

Không bắt buộc: bạn vẫn có thể dán **link ảnh** và **link tải file** (Google Drive, Dropbox).
Nếu muốn tải thẳng từ máy:
1. Firebase → **Build** → **Storage** → **Get started** → làm theo các bước (có thể yêu cầu bật gói Blaze; vẫn miễn phí khi dùng ít).
2. Tab **Rules** → dán nội dung file `storage.rules` (cách copy giống bước 2.3) → **Publish**.

## PHẦN 9 (tuỳ chọn) — Email xác nhận đơn hàng (EmailJS)

1. Vào https://www.emailjs.com → đăng nhập → **Email Templates** → **Create New Template**.
2. Trong nội dung email, dùng các biến: `{{user_name}}`, `{{user_email}}`, `{{order_code}}`, `{{items}}`, `{{total}}`. Ô "To email" điền `{{user_email}}`.
3. Lưu, copy **Template ID** → dán vào Admin console → **Thanh toán** → ô **Template ID** → Lưu.
(Email nhắc lịch cũ vẫn dùng template sẵn có.)

---

## Nếu gặp lỗi

| Bạn thấy | Cách xử lý |
|---|---|
| Không đăng nhập/đăng ký được, báo `unauthorized-domain` | Làm lại bước **2.1 mục 4** (thêm `TENBAN.github.io` vào Authorized domains). |
| Báo `Missing or insufficient permissions` | Làm lại bước **2.3** (dán và Publish luật). |
| Vào Admin báo "Tài khoản này không phải admin" | Bạn đang đăng nhập sai email. Phải là `epstudyroom.contact@gmail.com`. |
| Admin báo cần xác minh email | Bấm link trong email xác minh (xem cả mục Spam), rồi bấm "Tôi đã xác minh rồi". |
| Web vẫn hiện bản cũ sau khi upload | Chờ 1–2 phút rồi bấm `Ctrl + Shift + R` để tải lại. |

Xem thử toàn bộ giao diện không cần cài gì: thêm `?demo=1&as=admin` vào cuối địa chỉ web (ví dụ `…/index.html?demo=1&as=admin`). Chế độ này không lưu gì thật.

---

## PHẦN 10 — "Người đồng hành" (mã hàng tháng đã bỏ)

Trước đây có "mã hàng tháng" để mở Focus không giới hạn. **Đã bỏ**, vì mã bị chia sẻ là mọi người dùng chùa không cần trả tiền. Bây giờ chỉ có hai cách thành Người đồng hành:

- **Trả tiền:** khách bấm "Tôi đã thanh toán" ở trang Ủng hộ, bạn kiểm tra tiền rồi bấm **Duyệt** ở tab **Thành viên** (xem PHẦN 5 và PHẦN 22.z).
- **Dùng thử:** khách nhập **mã dùng thử** (PHẦN 16), có hạn số ngày và mỗi tài khoản một lần.

Người xem miễn phí tập trung tối đa số phút mỗi ngày bạn đặt ở tab **Gói Người đồng hành**, khung **"Giới hạn Phòng tập trung"** (điền 0 để bỏ giới hạn). Người đồng hành, người đang dùng thử và bạn không bị giới hạn.

Ko-fi chỉ còn cần nếu bạn muốn gói **tự gia hạn**: dán link Membership vào ô "Link đăng ký hằng tháng" ở tab **Gói Người đồng hành**. Khách trả qua Ko-fi cũng bấm "Tôi đã thanh toán" và bạn bấm Duyệt như trên.

---

## PHẦN 11 — Bắt buộc đăng nhập, tiếng Hindi và tự dịch nội dung

### 11.1. Bắt buộc đăng nhập để tham gia
- Mặc định **bật**. Khách chưa đăng nhập **vẫn thấy tất cả các mục trong menu**, nhưng các mục bị khoá có biểu tượng ổ khoá. Khi mở một mục bị khoá, khách thấy tiêu đề + tranh của mục đó và lời mời "Đăng nhập để tham gia" kèm khung đăng nhập / tạo tài khoản miễn phí ngay trên trang. Đăng nhập xong là vào đúng mục đó luôn.
- Mặc định khoá: Lịch live, Xem live, Phòng tập trung, Bài viết, Hành trình trăng, Cửa hàng. Mặc định để mở: Tổng quan, Ủng hộ, Giới thiệu.
- Muốn đổi: **Admin → Giao diện & Menu → khung "Quyền truy cập"**. Tích hoặc bỏ tích từng mục rồi bấm **Lưu**. Bỏ tích ô trên cùng nếu muốn tắt hẳn việc bắt buộc đăng nhập.
- Lưu ý: đây là "cổng" ở giao diện web, đủ để khách phải tạo tài khoản mới dùng được, nhưng không phải ổ khoá bảo mật tuyệt đối (người rành kỹ thuật vẫn đọc được dữ liệu công khai như bài viết, vì chúng được đọc từ Firebase).
### 11.2. Tiếng Hindi (हिन्दी)
- Đã có sẵn trong nút **Tuỳ chọn** (biểu tượng thanh trượt) ở trên cùng và trên màn hình đăng nhập. Người xem dùng trình duyệt tiếng Hindi hoặc múi giờ Ấn Độ sẽ tự được chọn Hindi.
- Cùng lúc, các ngôn ngữ Nhật / Hàn / Trung / Pháp / Tây Ban Nha cũng được bổ sung đủ chữ (trước đây còn lẫn tiếng Anh).

### 11.3. Tự dịch những gì bạn viết
- Bạn viết bằng **ngôn ngữ nào cũng được**. Khi lưu, đúng câu bạn viết được **tự dịch sang các ngôn ngữ còn lại** (Anh, Việt, Hindi, Nhật, Hàn, Trung, Pháp, Tây Ban Nha). Khách đổi ngôn ngữ là thấy ngay bản dịch (đã lưu sẵn, nên nhanh).
- Áp dụng cho: chữ sửa trực tiếp trên trang (ví dụ phần About me), bài viết, sản phẩm, FAQ, thông báo chạy chữ, tên menu, tên các mục bài viết, lý do huỷ live.
- **Chữ trên trang (✏️ sửa trực tiếp)**: chọn ngôn ngữ bạn muốn viết ở nút **Tuỳ chọn**, bật chế độ sửa, gõ, bấm ra ngoài. Web báo "Đã lưu · đang dịch…" rồi "đã dịch sang mọi ngôn ngữ".
- **Bài viết / sản phẩm / FAQ**: bấm **Lưu** và đợi vài giây (nút hiện "Đang dịch…"; bài dài thì lâu hơn một chút).
- Quy tắc: bạn sửa ô nào, các ô còn lại được dịch lại từ ô đó. Nếu bạn sửa **cả hai ô** Tiếng Anh và Tiếng Việt cùng lúc thì giữ nguyên cả hai và dịch phần còn lại từ Tiếng Anh.
- **Nội dung bạn đã viết từ trước**: vào **Admin → Nội dung & FAQ → "Dịch bù toàn bộ nội dung cũ"** bấm một lần. Nút chỉ dịch các ngôn ngữ còn thiếu, không đụng chữ bạn đã viết. Nếu báo có lần dịch lỗi (mạng yếu) thì bấm lại.
- Bản dịch do máy dịch (Google Translate miễn phí, dự phòng MyMemory) nên đọc hiểu tốt nhưng không hoàn hảo. Câu nào bạn thấy chưa hay thì mở đúng ngôn ngữ đó, sửa trực tiếp trên trang. Lưu ý: khi bạn sửa một ngôn ngữ, các ngôn ngữ còn lại cũng được dịch lại từ câu vừa sửa.

### 11.4. Cần tải lên GitHub
Thư mục **js** (có thêm 2 file mới `translate.js` và `i18n-extra.js`), thư mục **css**, file **index.html**, và **SETUP.md**. Sau khi tải xong đợi 1–2 phút rồi bấm **Ctrl + F5**.

## PHẦN 12 — Nhạc ở Phòng tập trung và trang "Đồ mình dùng" (affiliate)

### 12.1. Nhạc ở Phòng tập trung
Dưới đồng hồ Pomodoro có thẻ **"Music for focus"** gồm:
- **Âm thanh nền tự tạo** (không cần mạng, không dính bản quyền): Mưa, Ồn nâu, Ồn trắng, có thanh chỉnh âm lượng. Âm thanh vẫn chạy khi khách đổi sang trang khác.
- **Gợi ý nhạc do bạn chọn**: danh sách bạn tự thêm, khách bấm "Phát tại đây" là nghe ngay trong trang.
- **Nhạc bạn nghe gần đây**: một danh sách riêng để bạn cập nhật bất cứ lúc nào.
- **Gợi ý tìm nhạc**: Lo-fi, piano, jazz quán cà phê, mưa & sấm, cổ điển, thiên nhiên (mở YouTube ở tab mới, có sẵn, bạn không cần làm gì).

Cách thêm: **Admin → Nhạc**.
1. Bấm **Thêm gợi ý** (hoặc **Thêm danh sách** ở mục "đang nghe gần đây").
2. Điền tên (Tiếng Anh hoặc Tiếng Việt, ô kia và các ngôn ngữ khác tự dịch), dán **link** và ghi chú ngắn nếu muốn.
3. Bấm **Lưu nhạc**.

Link phát được ngay trong trang: **YouTube** (video, live, playlist), **Spotify** (playlist, album, bài hát), **SoundCloud**. Link khác (Apple Music, Zing…) vẫn hiện nhưng chỉ có nút "Mở".

Lưu ý: nếu video YouTube cài "không cho nhúng" thì trình phát sẽ báo lỗi, khi đó khách vẫn bấm "Mở" để nghe trên YouTube.

### 12.2. Trang "Đồ mình dùng" (My gear)
Một mục mới trong menu, ai cũng xem được (bạn khoá lại được ở **Giao diện & Menu → Quyền truy cập**). Mỗi món có ảnh, ghi chú, mục, giá, nơi bán và nút **View item** dẫn tới link mua.
1. **Admin → Đồ mình dùng → Thêm món đồ**.
2. Điền tên, ghi chú ngắn, mục (VD: Desk, Audio), giá hiển thị (VD: $25), nơi bán, **link**, và ảnh (dán link ảnh hoặc bấm **Chọn ảnh**).
3. Bấm **Lưu**.

**Làm affiliate:** đăng ký chương trình affiliate của nơi bán (ví dụ Amazon Associates, Shopee Affiliate, Lazada, hoặc các mạng như AccessTrade). Họ sẽ cấp cho bạn link riêng cho từng sản phẩm. Bạn chỉ cần dán link đó vào ô "Link" của món đồ. Khách bấm vào rồi mua thì bạn nhận hoa hồng. Mỗi chương trình có điều kiện riêng (ví dụ phải có đủ lượt xem hoặc đơn hàng trong thời gian đầu), bạn đọc kỹ quy định của họ trước khi đăng ký.
- Mọi link trên trang tự gắn nhãn `sponsored` (khuyến nghị của Google cho link affiliate).
- Dòng "Some links on this page are affiliate links…" hiện dưới tiêu đề trang. **Nên giữ**, vì nhiều chương trình và pháp luật yêu cầu nói rõ. Muốn sửa câu chữ: vào trang Đồ mình dùng, bật chế độ sửa (✏️) và gõ lại, các ngôn ngữ khác tự dịch.

### 12.3. Cần tải lên GitHub
Thư mục **js**, thư mục **css**, file **index.html** và **SETUP.md**. Luật bảo mật Firestore **không cần đổi**. Đợi 1–2 phút rồi bấm **Ctrl + F5**.

### 12.4. Ô xem stream trong Phòng tập trung
Ở cột bên phải Phòng tập trung (trên danh sách việc) có ô nhỏ **"Watch the stream"** phát đúng live của bạn, dùng cùng cấu hình YouTube với trang **Xem live** (Admin → Giao diện & Menu → YouTube). Trang **Xem live** vẫn giữ nguyên.
- Có chữ LIVE khi bạn đang live. Khi chưa live thì hiện thông báo "stream offline".
- Nút **Ẩn / Hiện** để thu gọn ô này (web nhớ lựa chọn của từng người xem), nút liên kết bên cạnh mở YouTube.
- Nếu ô báo "Video unavailable": vào YouTube Studio bật **cho phép nhúng** cho live/video đó (xem PHẦN 7).

## PHẦN 13 — Mục cảm ơn người đồng hành

Tên những người ủng hộ hằng tháng của bạn hiện ở **mục cảm ơn** ("Thank you, companions", có sẵn 8 ngôn ngữ) ở **trang chủ** và **trang Ủng hộ**. Chỉ hiện tên, **không hiện email**.

Cách làm mỗi khi có người đăng ký (Ko-fi, PayPal hoặc chuyển khoản):
1. Người đó cần có **tài khoản trên web** của bạn (họ tạo tài khoản bằng email). Bạn nhờ họ cho biết email đã dùng, hoặc đối chiếu với tên họ để lại khi ủng hộ.
2. Vào **Admin → Thành viên**, tìm đúng người và **tích "Người đồng hành"**. Tên họ tự hiện ở mục cảm ơn ngay (đến ngày hết hạn thì tự ẩn; mặc định 31 ngày, sửa được ở ô "Đến ngày").
3. Muốn họ ẩn danh thì **bỏ tích "Hiện tên ở mục cảm ơn"**. Muốn dùng biệt danh thì sửa ô **"Tên hiện"**.
4. Không muốn hiện mục này ở trang chủ: **Admin → Giao diện & Menu → "Các khối ở trang chủ"** bỏ tích "Lời cảm ơn người đồng hành" rồi Lưu.

Lưu ý quan trọng: web **không tự biết** ai vừa đăng ký trên Ko-fi hay PayPal (cần máy chủ riêng mới làm được). Vì vậy bạn tích tay mỗi khi có người mới, mất khoảng 10 giây. Câu chữ của mục cảm ơn sửa được bằng nút ✏️ trên trang. Luật bảo mật Firestore **không cần đổi**.

Cần tải lên GitHub: thư mục **js**, thư mục **css**, và **SETUP.md**.

## PHẦN 14 — Giữ web không vượt hạn mức miễn phí của Firebase

**Vấn đề:** gói miễn phí của Firebase cho đọc 50.000 lượt/ngày. Trước đây mỗi lần một người mở web tốn khoảng 50 lượt đọc, nên chỉ khoảng 1.000 người/ngày là chạm trần.

**Cách đã làm (tự động, bạn không cần làm gì):**
1. **Gộp dữ liệu công khai thành một bản** (giao diện, chữ, nhạc, bài viết, sản phẩm, đánh giá, lịch live…). Người xem chỉ đọc 1 lượt thay vì ~50.
2. **Lưu bản gộp trong trình duyệt 10 phút.** Mở lại web hoặc chuyển trang trong thời gian này tốn **0** lượt đọc.
3. **Nội dung bài viết chỉ tải khi người xem mở bài đó** (và lưu 30 phút).
4. **Khi Firebase báo hết hạn mức,** người đã từng vào web vẫn thấy bản đã lưu trong trình duyệt.
5. **Không ghi hồ sơ người dùng khi không có gì thay đổi** (tiết kiệm cả lượt ghi).
Kết quả ước tính: web chịu được khoảng **10.000 người xem khác nhau mỗi ngày** trong gói miễn phí.

**Bản gộp cập nhật thế nào:**
- Tự cập nhật khoảng **4 giây sau mỗi lần bạn bấm Lưu** bất cứ thứ gì công khai (bài viết, chữ, sản phẩm, lịch, nhạc, tên người đồng hành…).
- Lần đầu sau khi đưa bản này lên, bản gộp được tạo **ngay khi bạn đăng nhập admin**. Trước lúc đó web vẫn chạy bằng cách cũ, nên không bị gián đoạn.
- Xem tình trạng ở **Admin → Tổng quan → "Dữ liệu cho người xem & bản sao dự phòng"**: có giờ xuất bản gần nhất và nút **Xuất bản ngay** (dùng khi bạn nghi bản gộp chưa mới).
- Người xem thấy thay đổi của bạn trong vòng khoảng 10 phút (hoặc ngay khi họ tải lại sau đó). Riêng bạn (admin) luôn thấy thay đổi tức thì.

**Bản sao dự phòng:** cũng ở thẻ trên có nút **"Tải bản sao dữ liệu (file .json)"**. Nên bấm khoảng mỗi tuần và cất file vào ổ đĩa của bạn (bài viết, sản phẩm, cài đặt nằm trong Firebase, đây là bản dự phòng nếu có sự cố). Từ phần 19, toàn bộ Firestore (cả thành viên, Hành trình trăng, Planner) đã được **sao lưu tự động mỗi đêm**; nút này vẫn dùng được khi bạn muốn tự giữ một bản.

**Tự kiểm tra mức dùng:** vào Firebase → **Firestore Database → tab Usage**. Mục "Reads" phải ở mức rất thấp. Nếu một ngày thấy gần 50.000, báo mình.

Cần tải lên GitHub: thư mục **js** (các file `core.js`, `pages.js`, `admin.js` có thay đổi) và `SETUP.md`.

### 14.1. Các tầng bảo vệ thêm (bản 7)
- Người đã đăng nhập tốn ít lượt đọc hơn: kết quả kiểm tra "người đồng hành" được nhớ 30 phút, thư viện đã mua chỉ được tải khi mở trang Tài khoản.
- Khi Firebase lỗi, các lần thử lại được giãn ra (nghỉ 5 phút), không dồn dập.
- **File dự phòng cho web (tuỳ chọn, rất nên làm một lần):** vào **Admin → Tổng quan → "Tải file dự phòng cho web"** để tải `site-fallback.json`, rồi đưa file này lên GitHub **cùng chỗ với file index.html** (Add file → Upload files, kéo file vào, Commit). Nếu Firebase hết hạn mức hoặc gặp sự cố, **người mới** vào web vẫn thấy đủ nội dung (giao diện, bài viết, sản phẩm, lịch live…) từ file này, hoàn toàn không tốn lượt đọc. Khi bạn đăng nhiều bài hoặc đổi lịch nhiều, tải và đưa lên lại để file luôn mới.
- Nếu muốn tăng thêm hạn mức: nâng lên gói Blaze (trả theo mức dùng, hạn mức miễn phí vẫn giữ nguyên) và đặt cảnh báo ngân sách. Chỉ làm khi thấy "Reads" trong Firebase thường xuyên vượt khoảng 30.000/ngày.

## PHẦN 15 — Hành trình trăng: con đường tìm Moon

Trang Hành trình trăng có một con đường uốn lượn trong đêm, đi từ dưới lên qua phố mưa, mặt nước có đường trăng, đồng đom đóm, rừng thông, biển sao, bờ biển có hải đăng rồi lên trên mây. Mỗi ngày trong chuỗi điểm danh là một bước, đường sáng đến đâu là khách đã đi đến đó. Các trạm dừng (ngày 0, 1, 3, 7, 10, 14, 21, 30, 45, 60, 80, 100, 130, 200, 250, 300, 365, 400, 450, 480) mỗi trạm mở một bức tranh đêm có chất liệu như tranh vẽ màu bột, mỗi trạm một nơi khác nhau. Ngày 365 là trạm gặp lại Moon (khi khách tới ngày 365, Moon ngồi chờ ngay cạnh trạm trên bản đồ).

- Trạm mở theo **chuỗi dài nhất**, nên đứt chuỗi vẫn giữ các trạm đã mở (giống huy hiệu). Không cần thêm dữ liệu hay sửa luật Firestore.
- **Viết lời cho từng trạm**: bật bút chì (chế độ sửa), mở trạm, bấm vào ô nét đứt dưới tranh để viết (Shift+Enter để xuống dòng). Trạm chưa có lời thì khách chỉ thấy tranh và tên trạm. Tên trạm cũng sửa được như vậy.
- **Thay tranh bằng tranh vẽ thật**: bật bút chì, mở trạm, bấm vào tranh rồi tải ảnh lên (khung ngang tỉ lệ 8:5, ví dụ 1600×1000). Bấm "Dùng ảnh mặc định" để quay lại tranh vẽ sẵn.
- Khách chỉ thấy tranh và tên của các trạm đã tới; trạm chưa tới chỉ hiện ổ khoá và số ngày. Tài khoản admin luôn xem được mọi trạm.
- Mỗi trạm có hiệu ứng chuyển động riêng (đom đóm, cánh hoa, sao băng, gợn nước, bụi sáng...) trong `moon-fx.js`, bảng `MJ_FX` ở đầu file ghi trạm nào dùng hiệu ứng nào. Lần đầu khách mở một trạm vừa tới sẽ có vòng sáng loé ra và bụi sao bung. Trạm ngày 365 có màn gặp lại lớn nhất: ánh vàng lan ra, các vòng sáng vàng toả nhẹ trên mặt đất từ chỗ cô bé ôm Moon, đom đóm bay lên, cánh hoa và sao băng (không dùng hình trái tim). Tay xách đèn (trạm 250) buông dọc thân, đèn treo cạnh hông, nắm tay vẽ đè lên quầng sáng. Nhìn từ sau, hai tay buông thẳng từ vai sát hông (không gập khuỷu ra ngoài); khi đi tay đánh nhẹ ngược nhịp (`mja-abA`/`mja-abB`), đèn đung đưa quanh nắm tay (`mja-lsw`). Cảnh trong phòng chỉ dùng nguồn sáng có thật: Day 45 là ánh trăng qua cửa sổ (vệt sáng trên sàn có bóng song cửa, không dùng hiệu ứng `rays`), Day 130 là đèn bàn trong nhà; Day 130 dùng đom đóm thay cánh hoa. Dây leo (`mjVine`) có thân mảnh, lá giọt so le, cả dây đung đưa quanh gốc (`mja-vine`).
- Trong tranh, từng chi tiết có chuyển động nhỏ của riêng nó (vẽ bằng CSS, lớp `mja-…` trong `app.css`): tóc và dù khẽ đung đưa theo gió, cô bé thở nhẹ, Moon vẫy đuôi và chớp mắt, đom đóm bay lượn, sao lấp lánh, đèn lồng lập lòe, sóng nước trôi, đèn hải đăng quét, thuyền bập bềnh, chữ "z z" bay lên khi ngủ. Nhiều cảnh có di chuyển thật (`mjGo`, mỗi vòng 24 giây: tiến dần rồi mờ đi, quay lại từ đầu): Ngày 10 và Ngày 60 cô bé và Moon bước đi dọc đường (hai chân đưa lệch nhịp, tay đánh, thân nhún); Ngày 3 cô bé ôm Moon đi trong gió mưa; Ngày 14 cô bé đi trên mặt nước cùng bóng phản chiếu; Ngày 100 thuyền trôi, mái chèo khua; Ngày 250 cô bé cầm đèn lồng đi sâu vào rừng; Ngày 300 thuyền giấy trôi; Moon thỉnh thoảng giật tai; cỏ, hoa và lá dây leo lay theo gió. Trong tranh mưa, nước đọng thành giọt ở mép dù, gấu áo mưa, mái hiên rồi nhỏ xuống đất, bắn tung và loang gợn; sát mặt đất có làn hơi nước trôi (các điểm nhỏ giọt ghi ở `data-drip` của tranh, `moon-rain.js` vẽ). Trên bản đồ, cô bé bước đi và có vệt sáng chạy dọc đoạn đường đã đi. Để máy điện thoại không nóng, trên web chất liệu tranh là một lớp phủ tĩnh; bản xuất ảnh và phim dùng chất liệu đầy đủ (`mjScene(id, seed, true)`).
- Hiệu ứng thêm theo từng trạm (bảng `MJ_FX`): sương mù và hơi mưa trôi, tia sáng xiên, mây trôi che trăng, lá rơi, hạt bồ công anh bay. Trong tranh mưa, mưa bắn tung trên mặt ô (`data-umb`); đêm lạnh có làn hơi thở trước miệng (`MJ_COLDS`). Trong cảnh mưa cô bé đội mũ áo mưa nối liền cổ áo (cùng màu, kéo từ vai lên, chóp hơi nhọn, vành lùi sau trán nên hở mặt); khi đội mũ, tóc nằm gọn trong mũ, chỉ lộ tóc mái và lọn ôm má dưới vành. Khi không đội mũ, tóc có khối: phồng ở đỉnh và sau đầu, đổ dày xuống lưng, có một lọn trước vai và một chiếc nơ hồng nhỏ buộc sau đầu. Tay vẽ hai đoạn có khuỷu; nhìn từ sau, tay buông hai bên thân dưới tóc. Moon có mảng lông cam phủ đỉnh đầu lan xuống không đều, vệt trắng chữ V giữa trán, đầu nối cổ liền thân và nghiêng quanh cổ. Dáng đi: bước nhỏ, đều (chân lắc khoảng 9 độ, chu kỳ 1,3 giây), tay đánh nhẹ ngược nhau, thân nhún rất ít. Tỉ lệ: cô bé đứng scale khoảng 1,25–1,45, Moon ngồi bằng khoảng 0,95 lần scale cô bé. Gió nhẹ (bảng `MJ_WINDY`) ở các cảnh ngoài trời không mưa: tóc, nơ và vạt áo lay chậm, thêm lá bay ở d100 và d300. Nhìn từ sau, vai ở hai mép trên thân áo và mọi cánh tay vẽ trước tóc và mũ (tóc, mũ che gốc tay). Chuyển động kiểu hoạt hình: tóc và vạt áo trễ nhịp sau bước (`mja-hairstep`, `mja-hemstep`), Moon nhảy vồ có nhún lấy đà và tiếp đất (`mja-hop`, d60), vươn tay chạm sao và sao sáng lên cùng nhịp 6 giây (`mja-reach`, `mja-starhit`, d200). Khi dựng phim, máy quay lia theo nhân vật đang đi. Hiệu ứng theo thời tiết: cảnh mưa chỉ có mưa, nước bắn, sương, hơi thở, tia sáng; đom đóm, bồ công anh, cánh hoa chỉ ở cảnh trời quang.
- Mưa ở các tranh mưa và trên bản đồ chạy bằng `moon-rain.js` (canvas, nhiều lớp, có gợn nước). Máy bật "giảm chuyển động" thì mưa đứng yên. Nút "Mưa" trên bản đồ tắt/bật mưa.
- Xem thử không cần đăng nhập: mở `index.html?demo=1&as=user&days=370#/club` (đổi số `days` để giả lập chuỗi bao nhiêu ngày).
- Đổi ngày của trạm: sửa mảng `MJ_STOPS` ở đầu `moon-story.js`. Tranh của từng trạm ở `moon-art.js`.

## PHẦN 16 — Mã dùng thử cho khách

Khách đã đăng nhập nhập một mã dùng thử → được dùng như **Người đồng hành** (Planner tuần + Phòng tập trung không giới hạn) trong số ngày bạn đặt, tính từ lúc họ bấm kích hoạt. Mỗi tài khoản chỉ dùng thử **một lần**.

**Việc phải làm 1 lần:** dán lại luật `firestore.rules` mới (làm đúng 4 bước ở mục 2.3). Chưa dán luật mới thì khách nhập mã sẽ luôn báo "mã không đúng" và admin không tạo được mã.

**Admin → tab "Mã dùng thử":**
- **Tạo mã**: gõ mã (chữ in hoa, số, dấu `-`, 4–32 ký tự) hoặc bấm "Tạo mã ngẫu nhiên"; đặt **số ngày dùng thử**, **số lượt tối đa** (0 = không giới hạn), **hạn cuối để nhập mã** (tuỳ chọn), ghi chú, bật/tắt.
- **Sửa**: đổi số ngày (áp dụng ngay cho cả người đang dùng mã đó), số lượt, hạn nhập, ghi chú, hoặc **đổi chữ của mã** (người đang dùng mã cũ được chuyển sang mã mới, mã cũ hết tác dụng).
- **Tắt / Xoá mã**: không ai kích hoạt mới được và người đang dùng thử bằng mã đó mất quyền ngay. Bật lại thì ai còn trong hạn dùng tiếp.
- **Người đã kích hoạt**: xem ai dùng mã nào, đến khi nào; **+7 ngày**, **Đặt ngày hết** (hạn riêng cho một người), **Theo mã** (bỏ hạn riêng), **Dừng ngay**, **Xoá** (cho tài khoản đó dùng thử lại).

**Khách:** đăng nhập → mở **Kế hoạch tuần** (hoặc trang **Support**) → ô "Bạn có mã dùng thử?" → nhập mã → **Kích hoạt**. Planner mở ngay, có dòng báo dùng thử đến ngày giờ nào.

**Bảo mật:** danh sách mã chỉ admin đọc được (khách không liệt kê hay đọc thử được mã nào). Việc kiểm tra mã đúng, đang bật, còn hạn nhập, còn lượt, mỗi tài khoản một lần, và giờ bắt đầu lấy theo giờ máy chủ đều do luật Firestore làm trên máy chủ, nên sửa code trên trình duyệt cũng không tự cấp được. Riêng giới hạn phút của Phòng tập trung vốn đếm trên trình duyệt (như trước đây), còn Planner được khoá thật bằng luật Firestore. Nên dùng mã dài (nút tạo ngẫu nhiên) và đặt số lượt tối đa khi chia sẻ công khai.

## PHẦN 17 — Thông báo đẩy khi live (khách nhận cả khi đã đóng web)

**Cách chạy:** khách bấm nút chuông 🔔 → bật **"Báo khi live bắt đầu, kể cả khi đã đóng web"**. Máy của khách nhận một mã (token) của Firebase Cloud Messaging, lưu vào Firestore. Máy gửi là **GitHub Actions** (workflow `.github/workflows/push-live.yml`, chạy file `scripts/push-live.mjs`) chạy khoảng **5 phút một lần**: đọc lịch live, thấy buổi sắp bắt đầu (từ 5 phút trước giờ live) thì gửi thông báo cho mọi máy đã bật. Mỗi buổi chỉ gửi 1 lần.

**Chi phí: 0 đồng.** Firebase Cloud Messaging miễn phí ở mọi gói (kể cả Spark). Repo công khai nên GitHub Actions không tính phút. Mỗi lần chạy đọc khoảng 3–4 tài liệu Firestore (khoảng 1.200 lượt đọc / ngày, hạn mức miễn phí là 50.000), lúc gửi đọc thêm 1 lượt cho mỗi máy đã bật.

**Giới hạn cần biết:**
- **Có thể trễ vài phút.** GitHub chạy lịch "5 phút một lần" nhưng lúc đông máy có thể trễ 5–15 phút, thỉnh thoảng bỏ một lần. Vì vậy máy gửi báo từ **5 phút trước** giờ live (thông báo "⏰ Live lúc 20:30"); nếu chạy trễ sau giờ live thì báo "🔴 Đang live". Quá 45 phút sau giờ bắt đầu thì không báo nữa.
- **Live đột xuất ngoài lịch:** Admin → **Tổng quan** → thẻ **Thông báo đẩy khi live** → **Gửi thông báo live ngay** (đến tay khách sau khoảng 5–15 phút), hoặc **Gửi nhanh qua GitHub** → **Run workflow** (khoảng 1 phút, làm được trên app GitHub của điện thoại).
- **iPhone / iPad:** chỉ nhận khi đã **thêm web ra Màn hình chính** (iOS 16.4 trở lên) và bật thông báo từ ứng dụng đó. Mở bằng Safari thường thì không nhận được (đây là quy định của Apple).
- Android, máy tính (Chrome, Edge, Firefox, Safari trên Mac): nhận được cả khi đã đóng tab, miễn là trình duyệt còn chạy nền (Android thì luôn được).
- GitHub tự **tạm dừng lịch chạy nếu repo 60 ngày không có thay đổi nào**. Nếu lâu không cập nhật web, vào tab **Actions** của repo, bấm **Enable workflow** nếu thấy thông báo.

### 17.1. Việc bạn làm một lần (khoảng 10 phút)
1. **Bật Cloud Messaging:** Firebase Console → dự án `epstudyroom-web` → ⚙️ **Project settings** → tab **Cloud Messaging**. Mục **Firebase Cloud Messaging API (V1)** phải là **Enabled** (nếu thấy Disabled, bấm ⋮ → mở trang Google Cloud → **Enable**).
2. **Tạo khoá VAPID:** cùng tab đó, kéo xuống **Web configuration** → **Web Push certificates** → **Generate key pair**. Bấm sao chép chuỗi dài ở cột **Key pair**, rồi dán vào `js/firebase-config.js`, dòng `window.FCM_VAPID_KEY = "…";` (hoặc gửi chuỗi đó cho mình để mình dán; khoá này công khai, không phải mật khẩu).
3. **Tạo khoá tài khoản dịch vụ (bí mật):** ⚙️ **Project settings** → tab **Service accounts** → **Generate new private key** → **Generate key**. Máy tải về một file `.json`. **Không gửi file này cho ai, không đưa lên repo.**
4. **Thêm secret trên GitHub:** repo `index.html` → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. Name: `FIREBASE_SERVICE_ACCOUNT`. Secret: mở file `.json` vừa tải bằng Notepad / TextEdit, chọn hết, dán vào. Bấm **Add secret**. Xong thì xoá file `.json` khỏi máy (khi cần có thể tạo khoá mới).
5. **Dán luật bảo mật mới:** Firebase Console → **Firestore Database** → **Rules** → dán toàn bộ file `firestore.rules` mới → **Publish**.
6. **Thử:** mở web, bấm 🔔, bật "Báo khi live bắt đầu…", cho phép thông báo. Rồi vào GitHub → **Actions** → **Thông báo đẩy khi live** → **Run workflow** (để mode `now`) → **Run workflow**. Khoảng 1 phút sau máy bạn hiện thông báo. Bấm vào lần chạy để xem dòng "Xong: … thành công".

**Bảo mật:** token của khách nằm trong `push_tokens`, **không ai đọc hay liệt kê được** (kể cả từ trình duyệt của admin); khách chỉ ghi/xoá được token của chính máy mình (luật kiểm tra mã tài liệu phải khớp với hash của token). Chỉ máy gửi, dùng khoá tài khoản dịch vụ trong GitHub Secrets, mới đọc được để gửi. Token của máy đã tắt thông báo hoặc gỡ ứng dụng sẽ được máy gửi tự dọn.

### 17.2. Nhắc việc Planner (cũng nhận cả khi đã đóng web)
Dùng chung máy gửi ở trên (bước **Nhắc việc Planner** trong cùng workflow, file `scripts/push-planner.mjs`), **không cần làm thêm gì** nếu 17.1 đã xong, không cần dán lại luật Firestore.
- Người dùng bấm nút chuông 🔔 trên đầu trang, trên **từng máy** (điện thoại, máy tính). Bật **"Báo khi live bắt đầu…"** là nhắc việc Planner cũng tự bật theo (với người dùng được Planner). Có công tắc riêng **"Nhắc việc Planner…"** để tắt nếu không muốn. Máy đó lưu mã nhận thông báo vào hồ sơ của chính họ (`users/<uid>.plPush`, chỉ họ và admin đọc được). Ai đã bật thông báo live từ trước thì nhắc việc tự bật ở lần mở web tiếp theo.
- **Không có tiếng chuông?** Tiếng của thông báo do cài đặt của điện thoại quyết định, web không chỉnh được. Android: Cài đặt → Thông báo → app **Ép Study Room** (hoặc **Chrome**) → bật **Âm thanh**, chọn kiểu **Cảnh báo** (không chọn **Im lặng**), tắt **Không làm phiền**.
- Mỗi lần chạy (khoảng 5 phút), máy gửi đọc Planner tuần này của những người đã bật, việc chưa xong sắp bắt đầu thì nhắc. Thường đến tay **khoảng 8–12 phút trước** giờ bắt đầu, GitHub chạy trễ thì có thể muộn hơn (quá 10 phút sau giờ bắt đầu thì không nhắc nữa). 20:00–21:00 còn việc chưa xong thì nhắc một lần.
- Đang mở web thì vẫn nhắc ngay trong trang như cũ; hai lời nhắc dùng chung một mã nên chỉ hiện 1 thông báo.
- iPhone / iPad: giống 17.1, phải **thêm web ra Màn hình chính**, mở từ biểu tượng đó rồi bật nhắc việc.
- Đăng xuất hoặc tắt nhắc việc trên máy nào thì máy đó thôi nhận.

### 17.3. Cho máy gửi chạy đều 5 phút một lần (cron-job.org)
**Vì sao cần:** lịch tự chạy của GitHub hay bị bỏ lượt (có tối chỉ chạy 1 lần trong 1,5 tiếng), nên thông báo live và nhắc việc Planner có thể đến rất trễ hoặc không đến. Trang miễn phí **cron-job.org** cứ 5 phút "bấm nút chạy" workflow **Thông báo đẩy khi live** một lần. Máy gửi tự chống gửi trùng, nên GitHub có tự chạy thêm cũng không sao.

**Làm 1 lần là xong**, nếu mã GitHub chọn **No expiration**. Quy định "GitHub tự tắt lịch sau 60 ngày repo không thay đổi" không ảnh hưởng tới cách này.

#### A. Tạo mã GitHub (chỉ cho phép chạy workflow của repo này)
1. Đăng nhập GitHub, mở trang https://github.com/settings/personal-access-tokens/new
2. **Token name:** `cron-job nhac viec`
3. **Expiration:** chọn **No expiration**.
4. **Repository access:** chọn **Only select repositories**, rồi chọn repo **index.html**.
5. **Permissions** → **Repository permissions** → dòng **Actions** → chọn **Read and write**. Không bật quyền nào khác.
6. Kéo xuống cuối, bấm **Generate token**.
7. Bấm nút sao chép cạnh chuỗi `github_pat_…`, dán tạm vào Notepad. **Mã này là bí mật: không gửi cho ai, không chụp màn hình có mã, không đưa lên repo.**

#### B. Đặt lịch trên cron-job.org
1. Mở https://cron-job.org → **Sign up** (miễn phí) → xác nhận email → đăng nhập.
2. Bấm **Create cronjob**.
3. **Title:** `Nhac viec`
4. **URL:** dán đúng dòng này:
   `https://api.github.com/repos/epstudyroomcontact-cloud/index.html/actions/workflows/push-live.yml/dispatches`
5. **Execution schedule:** chọn **Every 5 minutes**.
6. Mục **Headers**, bấm **Add** để có đủ các dòng sau (Key ở ô trái, Value ở ô phải):

   | Key | Value |
   |---|---|
   | `Authorization` | `Bearer` + 1 dấu cách + mã ở bước A7 (thành `Bearer github_pat_…`) |
   | `Accept` | `application/vnd.github+json` |
   | `X-GitHub-Api-Version` | `2026-03-10` |
   | `Content-Type` | `application/json` (bấm nút **ADD CONTENT-TYPE HEADER NOW** là tự có) |

7. Mục **Advanced**: **Request method** chọn **POST**. Ô **Request body** dán đúng dòng này:
   `{"ref":"main","inputs":{"mode":"auto"}}`
8. Bấm **Create** (hoặc **Save**).
9. **Thử:** trong danh sách cronjob, bấm **Test run**. Đạt là **200** (nếu header phiên bản để `2022-11-28` thì đạt là **204**). Vào GitHub → repo → tab **Actions** sẽ thấy lần chạy mới **Thông báo đẩy khi live**.
10. Xoá mã trong Notepad.

#### C. Phiên bản API của GitHub (header `X-GitHub-Api-Version`)
- Nên dùng **`2026-03-10`** (bản mới nhất lúc viết). Với bản này, Test run đạt là **200**.
- Bản cũ **`2022-11-28`** vẫn chạy (đạt là **204**), nhưng GitHub chỉ hứa hỗ trợ tới **ít nhất 12/03/2028**. Nếu đang để bản cũ, nên đổi trước ngày đó:
  1. Đăng nhập cron-job.org → bấm vào cronjob **Nhac viec** để sửa.
  2. Ở dòng header `X-GitHub-Api-Version`, xoá `2022-11-28`, gõ `2026-03-10`.
  3. Bấm **Save**, rồi **Test run**: thấy **200** là đúng.
- Mỗi phiên bản được hỗ trợ ít nhất 24 tháng kể từ khi có bản mới hơn. Khi GitHub ra bản mới, bạn sẽ có ít nhất 2 năm để đổi. Bản hiện hành xem tại https://docs.github.com/en/rest/about-the-rest-api/api-versions

#### D. Khi cron-job.org báo lỗi
cron-job.org gửi email khi lịch lỗi, và tự tạm dừng lịch nếu lỗi liên tục nhiều lần. Bấm vào cronjob → **History** để xem con số lỗi:
- **401** (mã sai, đã bị xoá hoặc hết hạn): làm lại phần A để có mã mới. Rồi sửa cronjob, dòng header `Authorization` đổi thành `Bearer` + dấu cách + mã mới → **Save** → **Test run**. Nếu lịch đã bị tạm dừng, bật lại công tắc của cronjob.
- **403** (mã thiếu quyền): làm lại phần A, nhớ bước A5 chọn **Actions: Read and write** và bước A4 chọn đúng repo **index.html**.
- **404** (URL sai, hoặc mã không được cấp repo này): dán lại đúng URL ở bước B4, và kiểm tra bước A4.
- **422** (Request body sai): dán lại đúng dòng ở bước B7.
- Mã cũ không dùng nữa thì xoá ở https://github.com/settings/personal-access-tokens

### 17.4. Nhắc giữ chuỗi Hành trình trăng (cũng nhận cả khi đã đóng web)
Dùng chung máy gửi ở trên (bước **Nhắc giữ chuỗi Hành trình trăng**, file `scripts/push-moon.mjs`), **không cần làm thêm gì** nếu 17.1 đã xong, không cần dán lại luật Firestore.
- **Mặc định tắt.** Người dùng tự bật trên từng máy: công tắc ngay dưới nút **Điểm danh hôm nay** ở trang Hành trình trăng, hoặc trong bảng chuông 🔔. Máy đó lưu mã nhận thông báo vào `users/<uid>.mjPush` (chỉ họ và admin đọc được).
- **21:00 theo giờ của người dùng**, nếu hôm nay chưa điểm danh thì nhắc **một lần**: "Điểm danh trước nửa đêm để giữ chuỗi n ngày". Còn trăng tròn tích trữ thì nói thêm là lỡ quên vẫn giữ được chuỗi bằng trăng. Chuỗi vừa đứt mà đủ trăng để vá thì nhắc vào dùng trăng rồi điểm danh. Đã điểm danh rồi thì không nhắc.
- Đang mở web thì nhắc ngay trong trang (chuông nhẹ + thông báo); hai đường dùng chung một mã nên chỉ hiện 1 thông báo. GitHub chạy trễ thì có thể đến muộn vài phút.
- Muốn đổi giờ nhắc: sửa `MJ_REM_AT` trong `pages.js` (giờ × 60 + phút) và thêm biến `MJ_REM_MIN` (cùng số phút) cho bước **Nhắc giữ chuỗi** trong `.github/workflows/push-live.yml`.

## PHẦN 18 — Bảng lịch live trên màn hình stream (OBS)
Trang `overlay.html` hiện kế hoạch buổi live đang chạy (giống thẻ ở trang Lịch): đoạn đang chạy được tô sáng và đếm ngược, các đoạn đã qua mờ đi, danh sách tự cuộn. Trang này không cần đăng nhập, không có nút bấm, chỉ đọc lịch công khai. Sửa lịch ở Admin → Lịch live thì bảng tự cập nhật sau khoảng 3 phút.

**Địa chỉ:** địa chỉ web của bạn + `overlay.html`. Ví dụ web là `https://TENBAN.github.io/index.html/` thì bảng là `https://TENBAN.github.io/index.html/overlay.html`. Mở thử trên trình duyệt trước; chưa tới giờ live thì thêm `?demo=1` vào cuối để xem buổi mẫu.

**Gợi ý cách đặt trong OBS (đủ dùng, không cần thêm gì khác):**
| Nguồn Browser | URL | Width × Height |
|---|---|---|
| Bảng lịch gọn (đếm giờ lớn + tiến độ + thông báo) | `.../overlay.html` | 380 × 520 |
| Đồng hồ giờ Việt Nam (thẻ pastel) | `.../overlay.html?view=clock` | 460 × 220 |
| (tuỳ chọn) Thông báo đặt riêng chỗ khác, khi đó bảng lịch thêm `?note=0` | `.../overlay.html?view=note` | 380 × 160 |

Đã có bảng lịch gọn thì có thể bỏ nguồn `view=timer` (khối đếm giờ lớn ở đầu bảng làm cùng việc), đỡ tốn lượt đọc Firebase; giữ lại cũng không sao. Bảng lịch cần Properties → **Page permissions** ≥ **Read access to OBS status information** để tự bắt đầu khi bấm Start Streaming, và tick **Control audio via OBS** nếu muốn người xem nghe chuông. Sửa file xong (Merge trên GitHub), đợi 2–5 phút rồi trong OBS: chuột phải từng nguồn → **Properties** → **Refresh cache of current page**.

**Thêm vào OBS:**
1. Ô **Sources** (Nguồn) → bấm **+** → chọn **Browser** (Trình duyệt) → đặt tên "Lịch live" → **OK**.
2. Ô **URL**: dán địa chỉ ở trên.
3. **Width** `380`, **Height** `520` (bảng mặc định là khung GỌN rộng khoảng 340px, xem bên dưới). Nếu dùng bảng cả ngày kiểu cũ (`compact=0`) thì đặt Width `520`, Height `900`: chữ tự co lại cho vừa, luôn thấy hết lịch.
4. Ô **Custom CSS** để nguyên như mặc định. Bấm **OK**, rồi kéo bảng tới chỗ bạn muốn trên màn hình.
5. Muốn bảng tải lại ngay (ví dụ vừa sửa lịch xong, không muốn chờ 3 phút): chuột phải vào nguồn → **Properties** → bấm **Refresh cache of current page**.

**Tuỳ chỉnh bằng địa chỉ** (thêm `?` rồi nối các mục bằng `&`, ví dụ `overlay.html?size=1.3&theme=light&total=0`):
| Thêm | Tác dụng |
|---|---|
| `size=1.3` | Chữ to hơn (1 là mặc định, từ 0.6 đến 3) |
| `rows=8` | Chỉ hiện 8 dòng, tự cuộn theo đoạn đang chạy (mặc định chữ tự thu nhỏ cho vừa khung để thấy hết lịch) |
| `fit=0` | Tắt tự thu nhỏ chữ: giữ cỡ chữ cố định, danh sách tự cuộn |
| `theme=light` | Màu nền: `dark` (mặc định), `light`, `pink`, `clear` (trong suốt, chữ trắng có bóng) |
| `opacity=0.6` | Độ đậm của nền thẻ, từ 0 đến 1 |
| `accent=ff3d9a` | Màu chính (mã màu, không có dấu #) |
| `total=0` | Ẩn dòng "Tổng … phút" |
| `bar=0`, `chip=0`, `title=0`, `status=0` | Ẩn thanh màu / dòng tóm tắt / tên buổi / nhãn "Đang live" |
| `now=0` | Ẩn ô "Đang … còn mm:ss" |
| `list=0` | Ẩn danh sách các mốc (chỉ còn phần đầu và ô đang chạy) |
| `empty=hide` | Ngày không có live thì bảng ẩn hẳn |
| `lang=vi` | Chữ tiếng Việt (mặc định bảng hiện tiếng Anh) |
| `view=clock` | Đồng hồ giờ địa phương cho góc màn hình (gợi ý Width `460`, Height `220`): giờ lớn, dấu hai chấm nhấp nháy, "Vietnam · GMT+7 · Fri 23 Oct". Chọn kiểu bằng `look=`: `pastel` (mặc định, thẻ kem viền hồng, icon trăng), `glass` (kính tối số mảnh), `app` (cửa sổ có 3 chấm màu), `simple` (kiểu chữ 2 dòng cũ, theo `theme=clear` / `style=line`). Thêm: `align=left`, `sec=0` ẩn giây, `gmt=0` ẩn GMT+7, `date=0` ẩn ngày, `name=…` tên kênh, `label=…` đổi chữ "Vietnam" |
| `view=timer` | Bộ đếm giờ "Session 1/10 · 49:59" thay cho timer Lua trong OBS. **Mặc định tự chạy theo lịch Admin và giờ bạn bấm "Bắt đầu buổi live bây giờ"** (xem bên dưới), không cần bấm gì trong OBS. Muốn tự bấm thì thêm `start=manual`: chọn nguồn → **Interact** → phím **Cách** chạy/tạm dừng, **→ / ←** đổi hiệp, **↑ / ↓** ±1 phút, **R** làm lại, nút **⚙** (phím S) để chọn mẫu 25/5, 50/10, 90/20, 60/10 hoặc tự gõ phút. `scene_focus=study&scene_break=Break` tự đổi cảnh OBS khi sang hiệp (Properties → **Page permissions → Advanced access to OBS**). **Âm báo bật sẵn**: chuông nhẹ đi xuống khi vào giờ nghỉ, đi lên khi vào lại tập trung, 4 nốt khi hết buổi. Bật/tắt, âm lượng, "chỉ báo khi vào nghỉ" và nút Thử âm nằm trong nút **⚙** (Interact → rê chuột). Muốn người xem nghe thấy: Properties của nguồn → tick **Control audio via OBS**. Trên địa chỉ: `sound=0` tắt, `sound=break` chỉ báo khi vào nghỉ, `vol=0…100`. `next=0` ẩn dòng "Next", `theme=dark` có nền thẻ |
| `demo=1` | Xem thử bằng buổi mẫu đang chạy |

**Mặc định: khung GỌN ~340px** (khoảng 1/6 bề ngang màn 1080p), chỉ 4 thứ: khối đếm giờ lớn "FOCUS 4/10" / "LONG BREAK 1/2" + số đếm + "Next: …"; dòng "Progress 3 / 10 done" với thanh 10 ô (ô đang chạy đầy dần); dòng "☕ Long break 2/2 in 2h 38m · 17:30"; thanh thông báo bên dưới (dài hơn 2 dòng thì chạy chữ một chiều từ phải sang trái, lặp vòng liên tục). Không cần thêm gì vào địa chỉ. `track=0` ẩn 2 dòng tiến độ / nghỉ dài, `rows=2` thêm danh sách 2 đoạn kế tiếp, `align=right` để dồn sang phải, `compact=0` để quay về bảng cả ngày.

**Khối đếm giờ lớn (cho người xem bằng điện thoại):** đầu bảng lịch luôn có khối to "FOCUS 3/10" / "SHORT BREAK" / "LONG BREAK" + số đếm ngược lớn + thanh tiến độ + "Next: …", tự theo giờ Start Streaming. Chữ to theo bề ngang của nguồn (kéo nguồn rộng ra là chữ to hơn). `big=0` để ẩn; muốn đặt khối này riêng một chỗ: thêm nguồn Browser với `overlay.html?view=big`.

**Thông báo cho người xem:** bảng gọn (mặc định) đã có sẵn thanh thông báo bên dưới, không cần thêm gì vào địa chỉ. Thông báo (mục tiêu hôm nay, nội quy, lời nhắn…) nhập trong **Admin → ô Bắt đầu buổi live → Thông báo trên OBS → Lưu thông báo**: hiện thành khung màu nổi bật trên bảng lịch trong khoảng 10 giây; để trống / **Ẩn thông báo** là tắt. Muốn đặt khung thông báo ở chỗ khác trên màn hình: thêm một nguồn Browser riêng với `overlay.html?view=note` (`note=0` để ẩn khung này khỏi bảng lịch).

**Tự bắt đầu khi bấm Start Streaming trong OBS (mặc định):** bảng lịch (và bộ đếm) nghe nút **Start Streaming** của OBS: bấm là buổi live gần nhất tính lại từ đúng lúc đó, dòng đang chạy đếm ngược và có chuông khi vào nghỉ / vào học. Cần một lần: Properties của nguồn → **Page permissions** chọn **Read access to OBS status information** trở lên (đang dùng tự đổi cảnh thì giữ Advanced) và tick **Control audio via OBS** để người xem nghe chuông. Rớt mạng rồi stream lại giữa buổi thì giờ cũ được giữ nguyên; tải lại nguồn cũng không mất. Thêm `autostart=0` vào địa chỉ để tắt cách này. Giờ mới nhất giữa OBS và nút Admin bên dưới sẽ được dùng, nên bấm nhầm thì sửa trong Admin.

**Hoặc bắt đầu bằng nút trong Admin (dậy trễ / vào sớm / sửa giờ):** vào **Admin** (tab Tổng quan hoặc Lịch live), ô **Bắt đầu buổi live** → bấm **▶ Bắt đầu buổi live bây giờ** một lần. Trong khoảng 10 giây, bảng lịch và bộ đếm trên OBS tự dời cả buổi theo giờ bạn bấm. Bấm nhầm thì dùng **−5 / −1 / +1 / +5 phút**, **Bắt đầu lại từ bây giờ**, hoặc **Về giờ theo lịch**. Lịch gốc trong tuần không bị đổi; trang Lịch cho khách và thông báo đẩy vẫn theo giờ lịch.

## PHẦN 19 — Sao lưu Firestore tự động mỗi đêm (và cách khôi phục)

**Cách chạy:** mỗi đêm khoảng **2:17 sáng** (giờ Việt Nam), GitHub Actions chạy workflow **Sao lưu Firestore** (`.github/workflows/backup-firestore.yml`, file `scripts/backup-firestore.mjs`). Máy này **chỉ đọc**, không sửa gì: lấy toàn bộ dữ liệu trong Firestore (thành viên, tiến độ Hành trình trăng, Planner của từng người, đơn hàng, mã dùng thử, bài viết, cài đặt…), nén lại, **khoá bằng mật khẩu của bạn**, mở thử lại để chắc chắn file dùng được, rồi cất vào mục **Artifacts** của lần chạy đó. Mỗi bản được giữ **90 ngày**, nên lúc nào cũng có khoảng 90 bản của 90 đêm gần nhất.

**Chi phí: 0 đồng.** Repo công khai nên GitHub Actions và chỗ cất Artifacts miễn phí. Mỗi đêm tốn số lượt đọc Firestore bằng số tài liệu đang có (ví dụ 3.000 tài liệu = khoảng 3.000 lượt đọc, hạn mức miễn phí là 50.000 / ngày). Dùng chung khoá tài khoản dịch vụ `FIREBASE_SERVICE_ACCOUNT` đã thêm ở **17.1**, không cần khoá mới.

**Vì sao phải khoá file:** repo công khai, nên người có tài khoản GitHub có thể tải Artifacts. File đã khoá thì không có mật khẩu sẽ không mở được (chỉ thấy chữ lộn xộn). Nhật ký của lần chạy chỉ in tên bảng và số lượng (ví dụ `users: 812`), không in email hay nội dung. Nếu chưa có mật khẩu, máy sao lưu **dừng hẳn**, không bao giờ cất file chưa khoá.

### 19.1. Việc bạn làm một lần (khoảng 5 phút)
1. **Tạo mật khẩu khoá file:** dài **ít nhất 16 ký tự**, ví dụ 4–5 từ ngẫu nhiên nối bằng dấu gạch (`trang-mua-den-o-goc-pho-7`). Không dùng lại mật khẩu đăng nhập nào.
2. **Cất mật khẩu thật kỹ** ở chỗ không phụ thuộc vào web: trình quản lý mật khẩu (Google Password Manager, Bitwarden…) hoặc viết ra giấy cất trong ngăn kéo. **Mất mật khẩu là mất luôn mọi bản sao lưu** (mình cũng không mở được).
3. **Thêm secret trên GitHub:** repo `index.html` → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. Name: `BACKUP_PASSWORD`. Secret: dán mật khẩu ở bước 1. Bấm **Add secret**.
4. **Chạy thử:** tab **Actions** → cột trái chọn **Sao lưu Firestore** → **Run workflow** → **Run workflow**. Khoảng 1 phút sau bấm vào lần chạy:
   - Bước **Sao lưu** có dòng **"Xong: đã sao lưu … tài liệu (… KB, đã khoá)"**.
   - Kéo xuống cuối trang, mục **Artifacts** có một file tên `firestore-backup-…`. Vậy là xong.
5. Nếu bị lỗi đỏ: dòng "Chưa có secret BACKUP_PASSWORD" hoặc "quá ngắn" thì làm lại bước 3. Dòng có `403` / `PERMISSION_DENIED` thì khoá tài khoản dịch vụ thiếu quyền: tạo khoá mới đúng như **17.1 bước 3–4** (ở tab **Service accounts** của Firebase) và thay secret `FIREBASE_SERVICE_ACCOUNT`.

> GitHub tự gửi email cho bạn khi một lần sao lưu bị lỗi. Thỉnh thoảng (khoảng mỗi tháng) nên mở tab **Actions** → **Sao lưu Firestore** xem các lần gần đây đều có dấu ✅ xanh.

### 19.2. Khôi phục khi có sự cố
Dùng khi dữ liệu bị xoá nhầm, bị sửa sai, hay Firestore gặp sự cố. **Không chế độ nào xoá dữ liệu**: dữ liệu tạo sau ngày sao lưu (ví dụ thành viên mới đăng ký hôm nay) vẫn giữ nguyên.

1. **Chọn bản sao lưu:** tab **Actions** → **Sao lưu Firestore** → bấm vào lần chạy của **đêm trước khi xảy ra sự cố** (có dấu ✅). Nhìn thanh địa chỉ trình duyệt: `…/actions/runs/`**`18234567890`**. Chép lại dãy số cuối đó (không lấy phần `/job/…` nếu có).
2. **Xem trước (không ghi gì):** cột trái chọn **Khôi phục Firestore** → **Run workflow**:
   - Ô **run_id**: dán dãy số ở bước 1.
   - Ô **mode**: để `thu`.
   - Ô **only**: để trống (khôi phục tất cả), hoặc gõ `users` (chỉ bảng thành viên), hoặc `users/<uid>` (một người, kể cả Planner và Hành trình trăng của họ; `<uid>` xem ở Admin → Thành viên hoặc Firebase → Authentication).
   - Ô **confirm**: để trống. Bấm **Run workflow**.
   Mở lần chạy, bước **Khôi phục** in ra: **"Đang bị mất: …"**, **"Đang khác bản sao lưu: …"**, **"Giống hệt: …"**. Đọc kỹ con số này trước khi làm bước 3.
3. **Khôi phục thật:** chạy lại **Khôi phục Firestore** với cùng `run_id` (và `only` nếu có), chọn **mode**:
   - `them-thieu` (**nên dùng trước**): chỉ tạo lại những gì **đang bị mất**. Dữ liệu đang có không bị đụng tới.
   - `ghi-de`: tạo lại những gì bị mất **và** đưa những tài liệu đang khác về đúng như đêm sao lưu. Chỉ dùng khi dữ liệu bị **sửa sai** (ví dụ chuỗi điểm danh của mọi người về 0). Lưu ý: thay đổi thật của khách từ đêm đó tới giờ trong các tài liệu này cũng sẽ quay về như cũ, nên tốt nhất dùng kèm ô `only` cho đúng phần bị hỏng.
   - Ô **confirm**: gõ đúng `KHOI PHUC` (viết hoa, có dấu cách). Thiếu ô này thì workflow dừng ngay, không ghi gì.
4. Trước khi ghi, workflow **tự sao lưu dữ liệu hiện tại** (artifact `firestore-backup-truoc-khoi-phuc-…` trong chính lần chạy đó). Lỡ khôi phục nhầm thì làm lại bước 1–3 với **số của lần chạy khôi phục đó**, chế độ `ghi-de`, để quay về như trước khi khôi phục.
5. Xong thì mở web kiểm tra, rồi vào **Admin → Tổng quan → Xuất bản ngay** để bản gộp cho người xem cập nhật theo.

### 19.3. Lưu ý
- **Không sao lưu:** tài khoản đăng nhập (email / mật khẩu nằm ở Firebase **Authentication**, không phải Firestore, và không mất khi Firestore gặp sự cố) và ảnh / file tải lên **Storage**.
- Bản sao lưu chỉ giữ **90 ngày**. Muốn giữ lâu hơn (ví dụ bản đầu mỗi tháng): mở lần chạy → mục **Artifacts** → bấm tên file để tải về, cất vào Google Drive. File đã khoá nên cất ở đâu cũng an toàn.
- **Muốn tự xem bên trong một bản sao lưu** (tuỳ chọn, cần cài Node từ https://nodejs.org): giải nén file `.zip` vừa tải, rồi trong thư mục chứa repo chạy `node scripts/decrypt-backup.mjs firestore-….enc`, gõ mật khẩu. Ra file `.json` **không được khoá** (có email, đơn hàng của khách): xem xong thì xoá, **không đưa lên GitHub**.
- Đổi mật khẩu: sửa secret `BACKUP_PASSWORD`. Các bản cũ vẫn mở bằng **mật khẩu cũ**, nên giữ mật khẩu cũ thêm 90 ngày.
- Như phần 17: GitHub tạm dừng lịch tự chạy nếu repo **60 ngày** không có thay đổi. Lâu không cập nhật web thì vào tab **Actions**, thấy nút **Enable workflow** thì bấm.
- **Tầng bảo vệ thêm (chỉ khi đã lên gói Blaze):** Google Cloud có sẵn sao lưu theo lịch và "khôi phục về thời điểm bất kỳ trong 7 ngày" cho Firestore (Google Cloud Console → **Firestore** → **Disaster recovery**). Có tính phí theo dung lượng (rất nhỏ với web này). Không bắt buộc: bản sao lưu ở trên đã đủ dùng.
## PHẦN 20 — Kiểm tra sức khoẻ website mỗi tuần (tự động)
Sáng thứ Hai (khoảng 8 giờ, giờ Việt Nam) GitHub tự mở web bằng Chrome thật (cả kiểu máy tính và điện thoại) và kiểm tra. **Chỉ đọc, không sửa gì trên Firebase.**
- **Web:** trang chủ và mọi file (js, css, ảnh, manifest…) mở được không; bản trên mạng có đúng bản mới nhất trong repo không; tải nhanh hay chậm, nặng bao nhiêu.
- **Lỗi:** web có khởi động được không (hay hiện màn hình "Trang chưa tải được"), có lỗi JavaScript khi mở các trang Watch, Focus, Planner, Shop, Blog… không.
- **Bảo mật Firestore:** thử đọc dữ liệu riêng tư (người dùng, đơn hàng, mã dùng thử, token thông báo…) khi chưa đăng nhập, phải bị chặn; dữ liệu công khai (cài đặt, lịch live) phải đọc được. Nhờ secret `FIREBASE_SERVICE_ACCOUNT` (đã có từ Phần 17), còn so luật đang chạy trên Firebase với file `firestore.rules` / `storage.rules` trong repo, và chạy thử 12 ca (khách không sửa được cài đặt, không tự cấp quyền Người đồng hành, email admin chưa xác minh không làm được admin…) ngay trên luật đang chạy.
- **Sao lưu:** bản sao lưu Firestore mỗi đêm (Phần 19) có thành công trong 3 ngày gần nhất không.

**Bạn nhận thông báo thế nào:** có vấn đề thì GitHub mở một **issue** tên "⚠️ Kiểm tra web: …" (nhãn `health-check`), giao cho bạn, nên bạn nhận email và thông báo trên app GitHub. Trong issue có danh sách việc cần xem, mỗi dòng kèm 👉 nên làm gì. Tuần sau vẫn còn vấn đề thì thêm bình luận vào cùng issue đó; hết vấn đề thì tự đóng issue. Mọi thứ ổn thì không làm phiền bạn.

**Chạy thử ngay:** GitHub → **Actions** → **Kiểm tra sức khoẻ website** → **Run workflow**. Bấm vào lần chạy, kéo xuống phần **Summary** để xem báo cáo đầy đủ.

**Nếu báo cáo ghi "bỏ qua … không có quyền xem luật":** tài khoản dịch vụ chưa được xem luật bảo mật. Vào https://console.cloud.google.com/iam-admin/iam (chọn project của web) → dòng có email `firebase-adminsdk-…` → bấm ✏️ → **Add another role** → chọn **Firebase Rules Viewer** → **Save**. Không làm cũng được, các phần kiểm tra khác vẫn chạy.

**Dòng "bỏ qua Ca thử bảo mật … chưa có quyền chạy thử luật" là bình thường:** muốn chạy 12 ca thử thì tài khoản dịch vụ cần thêm vai trò **Firebase Rules Admin**, mà vai trò này cũng cho phép sửa luật, nên mình khuyên **không thêm**. Phần so luật đang chạy với file trong repo và phần thử đọc như khách lạ đã đủ để biết luật còn đúng.

**Mục "ghi chú" (ℹ️) không mở issue:** đó là dịch vụ bên ngoài (font, danh sách video mới qua rss2json…) lỗi tạm thời, web vẫn chạy.

**Địa chỉ web:** máy kiểm tra tự lấy từ GitHub Pages. Nếu sau này dùng tên miền riêng mà báo cáo vẫn mở địa chỉ cũ: **Settings → Secrets and variables → Actions → Variables → New repository variable**, Name `SITE_URL`, Value là địa chỉ web (ví dụ `https://tenmien.com/`).

## PHẦN 21 — Lớp chặn mã lạ (CSP chặt)

Đầu `index.html`, `overlay.html` và `offline.html` có một dòng `Content-Security-Policy`. Nó bảo trình duyệt: **chỉ chạy mã nằm trong file `.js` của chính web này** (cộng đúng 3 đường dẫn dự phòng của thư viện Luxon, Firebase, EmailJS). Mã viết thẳng trong trang, mã trong thuộc tính như `onclick=`, `javascript:` và `eval` đều bị chặn. Nhờ vậy, dù ai đó có chèn được một đoạn chữ lạ vào trang, đoạn đó cũng không chạy được.

Khi sửa web (hoặc nhờ mình sửa), cần nhớ:
- Đừng viết `<script>` có mã ngay trong file `.html` và đừng dùng `onclick="..."`: hãy đặt mã vào file `.js` (với nút bấm thì dùng `data-act="tên"` như các nút khác trong web).
- Muốn gọi thêm một dịch vụ bên ngoài (một trang nhúng, một API mới…) thì phải thêm địa chỉ của nó vào dòng `Content-Security-Policy` ở `index.html` (mục `connect-src` cho lệnh gọi dữ liệu, `frame-src` cho khung nhúng). Quên bước này thì trình duyệt chặn và tính năng đó không chạy.
- `offline.html` là ngoại lệ: mã viết thẳng trong đó được khoá bằng mã băm. Sửa mã đó thì chạy `node scripts/csp-hash.mjs` và dán mã băm mới vào dòng CSP của file.
- Máy kiểm tra sức khoẻ mỗi tuần (Phần 20) có thêm mục "Lớp chặn mã lạ (CSP) không chặn nhầm tính năng": đỏ nghĩa là có nguồn bị chặn nhầm, báo mình xử lý.

## PHẦN 22 — Nhóm học trực tiếp (chỉ cho Người đồng hành)

Nhóm học hiện ở 3 chỗ: thẻ **Nhóm học** ngay dưới khối chào ở trang **Tổng quan** (ai đang học), một dải nhỏ **ngay dưới đồng hồ** trong Phòng tập trung (có bao nhiêu người đang học và **hạng tuần của bạn**), và khung đầy đủ bên phải Phòng tập trung. Trong **Phòng tập trung** có khung **Nhóm học**: Người đồng hành (cả người đang dùng thử mã, và bạn) xem được **ai đang học ngay lúc này** và đã học bao lâu, cùng **bảng xếp hạng giờ tập trung trong tuần** (làm mới mỗi thứ Hai 00:00 giờ Việt Nam). Khách thường chỉ thấy lời mời trở thành Người đồng hành, nên đây là một lý do để họ ủng hộ web.

**Việc phải làm 1 lần:**
1. Dán lại luật `firestore.rules` mới (làm đúng 4 bước ở mục 2.3). Chưa dán thì nhóm báo "chưa sẵn sàng".
2. Tải lên GitHub các file đã đổi, nhớ có file mới **`group.js`** ở trang gốc (cùng chỗ với `planner.js`).
3. Vào **Admin → Thanh toán & Ủng hộ**, tìm thẻ **Nhóm học trực tiếp (chỉ cho Người đồng hành)**, tick **Bật nhóm học** rồi bấm Lưu. Tắt ô này bất cứ lúc nào để ẩn nhóm.

**Cách hoạt động:**
- Người đồng hành bấm **Tham gia nhóm** và tự đặt một **biệt danh** (không lấy tên hay email của tài khoản). Ai đang chạy đồng hồ sẽ hiện trong "Đang học"; phút tập trung của mỗi phiên xong được cộng vào bảng xếp hạng tuần. Bấm **Rời nhóm** thì họ biến mất khỏi danh sách và bảng xếp hạng.
- Bạn (admin) thấy nút **×** cạnh tên trong bảng xếp hạng để xoá một người có biệt danh không phù hợp.
- Chống khai khống: quy tắc Firestore chỉ cho cộng phút không nhanh hơn thời gian thật đã trôi qua, mỗi người chỉ sửa được dòng của chính mình.
- Nhóm tính theo từng tuần nên dữ liệu tự "làm mới" mỗi thứ Hai (tài liệu của tuần cũ vẫn còn trong Firestore, bạn có thể xoá nếu muốn). Mỗi tuần nhóm chứa tối đa khoảng 400 người khác nhau.

**Chi phí:** cả nhóm nằm trong **một tài liệu**, mỗi lần làm mới (60 giây một lần, và chỉ khi đang mở Phòng tập trung) tốn khoảng 2 lượt đọc (một lượt cho tài liệu, một lượt cho việc kiểm tra quyền). Gói miễn phí cho 50.000 lượt đọc mỗi ngày, nên đủ cho vài chục người xem cùng lúc. Nếu hôm nào hết hạn mức, **nhóm tạm nghỉ đến hôm sau và bạn không bị tính tiền** (gói miễn phí không tự trừ tiền). Nếu nhóm đông lên nhiều trăm người, bạn cân nhắc nâng lên gói trả theo mức dùng của Firebase và nhớ **đặt cảnh báo ngân sách** (ví dụ 5 đô) trong Google Cloud Billing; gói này không tự dừng khi vượt hạn mức. Mục 14 nói thêm về hạn mức miễn phí.

## QUY TẮC CẬP NHẬT WEB LÊN GITHUB (đọc cái này khi cần cập nhật)
Từ bản 8, các file hay thay đổi (`index.html`, `core.js`, `pages.js`, `admin.js`, `i18n-extra.js`, `app.css`) **đều nằm ở trang gốc của repo**, cùng chỗ với `index.html`. Chỉ còn 4 file ít khi đổi nằm trong thư mục `js`: `art.js`, `i18n.js`, `translate.js`, `firebase-config.js`. Thư mục `css` và các bản cũ `js/core.js`, `js/pages.js`, `js/admin.js`, `js/i18n-extra.js` đã bỏ hẳn (web không dùng), nếu máy bạn còn thì không cần tải lên nữa.

Mỗi lần mình đưa bản mới, mình sẽ tạo một thư mục chứa **đúng những file cần upload** (nằm phẳng, không có thư mục con). Bạn làm:
1. Vào trang chính của repo trên GitHub (thấy danh sách file, **không vào thư mục nào**).
2. **Add file → Upload files**.
3. Mở thư mục upload, **Ctrl + A** chọn hết các file rồi kéo vào khung upload.
4. Đợi danh sách file hiện đủ, kéo xuống bấm **Commit changes**.
5. Đợi 2–5 phút, **Ctrl + Shift + R**, vào **Admin** xem dòng "Phiên bản web".
GitHub tự bỏ qua file nào không đổi.

### 22.x. Thanh mục tiêu, giá mỗi ngày, nhắc hết dùng thử
- **Thanh mục tiêu:** vào Admin → **Gói Người đồng hành**, thẻ riêng **"Thanh mục tiêu duy trì web"**, nhập **Mục tiêu** (số Người đồng hành) và **Hiện đã có** (bạn tự cập nhật khi có người mới) rồi bấm **Lưu mục tiêu** (nút riêng, không cần bấm Lưu thanh toán). Thanh hiện ở đầu thẻ Người đồng hành trên trang Ủng hộ. Để trống mục tiêu là ẩn thanh.
- **Giá mỗi ngày:** tự hiện dưới các gói ("Chỉ khoảng 2.000 ₫ mỗi ngày"), không cần cài đặt.
- **Nhắc hết dùng thử:** khi gói dùng thử còn 7 ngày trở xuống, người dùng thử thấy lời nhắc ở Tổng quan và Phòng tập trung. Người đã là Người đồng hành không thấy.

### 22.y. Chỉ dùng PayPal cho khách quốc tế (không dùng Ko-fi)
1. Admin → **Thanh toán**: ô **PayPal.me** phải có link dạng `https://paypal.me/tencuaban`.
2. **Xoá** ô **Ko-fi** (tab **Thanh toán**, bấm **Lưu thanh toán**) và ô **Link đăng ký hằng tháng cho "Người đồng hành"** (tab **Gói Người đồng hành**, bấm **Lưu giá và link**).
3. Khách quốc tế sẽ thấy các gói 1, 3, 12 tháng, bấm nút "Trả $X một lần bằng PayPal" và PayPal tự điền sẵn số tiền. Trả bằng PayPal là **một lần, không tự gia hạn**, hết hạn thì khách trả lại. Sau khi trả, họ bấm "Tôi đã thanh toán" và bạn duyệt trong tab Thành viên như thường.
4. Nếu sau này muốn có gói tự gia hạn, dán lại link Ko-fi Membership hoặc Patreon vào ô "Link đăng ký hằng tháng".

### 22.z. Đếm Người đồng hành tự động và nhắc gia hạn
- Ở thẻ **"Thanh mục tiêu duy trì web"**, bấm **Đếm tự động** để web đếm Người đồng hành còn hạn và điền vào ô "Hiện đã có", rồi bấm **Lưu mục tiêu**.
- Ở tab **Thành viên**, thẻ **"Sắp hết hạn / đã hết hạn"** (người hết hạn trong 7 ngày tới hoặc đã hết hạn) có thêm ô chọn ngôn ngữ (đủ 8 ngôn ngữ của web: English, Tiếng Việt, हिन्दी, 日本語, 한국어, 中文, Français, Español) và nút **Nhắc gia hạn**: chọn ngôn ngữ của khách rồi bấm để sao chép tin nhắn nhắc gia hạn (ngày hiện theo ngôn ngữ đó; máy nhớ ngôn ngữ bạn chọn lần trước) (kèm link trang Ủng hộ), rồi dán vào Zalo, Instagram hoặc email gửi cho họ. Khi họ trả tiền, bấm **Gia hạn**.


### 22.s. Web tự báo "Đang live" khi bấm Start Streaming trong OBS (một lần cài đặt)
Làm một lần, sau đó mỗi buổi chỉ cần bấm Start Streaming trong OBS (và mở web bằng tài khoản admin ở đâu đó, máy nào cũng được): web tự báo **Đang live** đúng giờ OBS bắt đầu, bộ đếm khớp OBS, không phải bấm hay nhập phút.
1. **Dán luật bảo mật mới:** mở file `firestore.rules` trong repo, chép toàn bộ vào Firebase Console → Firestore Database → Rules → Publish (như các lần trước). Luật mới thêm 2 chỗ: `private` (chỉ admin) và `obs_signal` (chỉ ghi được khi kèm đúng khoá bí mật).
2. **Tạo khoá:** vào Admin → Tổng quan → ô **Bắt đầu buổi live** → kéo xuống phần **Tự báo live theo OBS** → bấm **Tạo khoá OBS** → bấm **Chép**.
3. **Sửa link trong OBS:** ở mỗi nguồn Browser của bảng lịch và bộ đếm (Properties → URL), thêm đoạn vừa chép vào **cuối** link, ví dụ `…/overlay.html?view=timer&k=abc123…`, rồi OK. Nguồn nào đã có `autostart=0` thì không tự báo.
4. **Điều kiện:** OBS vẫn cần Properties → Page permissions ≥ "Read access to OBS status information" (như cho bộ đếm). Admin phải đang mở web (đăng nhập tài khoản admin) lúc bấm Start Streaming để web tự ghi; nếu không, lúc bạn mở web sau đó, bấm nút đỏ **Bắt đầu live** là web tự điền sẵn "OBS báo bạn đã bắt đầu N phút trước".
- **Thêm khoá khi đang live rồi:** sự kiện Start Streaming đã qua nên không có gì được gửi. Bản mới của `overlay.js` tự báo web một lần khi nguồn Browser được nạp lại lúc OBS đang stream (bấm **Refresh cache of current page** trên nguồn), dùng giờ bắt đầu OBS đã nhớ. Nếu buổi đó đã được báo live thì bỏ qua.
- Vì sao cần khoá: bảng lịch trong OBS là trang công khai không đăng nhập; không có khoá thì ai cũng giả được trạng thái live (và gửi thông báo đẩy giả). Khoá nằm ở `private/obs`, người ngoài không đọc được; lộ khoá thì bấm **Tạo khoá mới** rồi sửa lại link trong OBS.
- Chi phí Firebase: mỗi lần bấm Start Streaming ghi 1 lần, admin đọc 1 lần khi tín hiệu đổi. Không đáng kể.

### 22.t. Nút nổi "Bắt đầu live" và Tổng quan Admin chịu được mạng chậm
- **Vì sao OBS đã lên sóng mà web chưa báo "Đang live":** web chỉ báo live sau khi **admin bấm "Bắt đầu buổi live bây giờ"** (ghi `settings/onair`). Bấm Start Streaming trong OBS chỉ dời bộ đếm trên OBS, không báo gì lên web (để người lạ không giả mạo được trạng thái live, vì bảng lịch OBS là trang công khai không đăng nhập).
- **Nút nổi mới (chỉ hiện khi bạn đăng nhập admin):** khi tới giờ lịch mà chưa bấm bắt đầu (hoặc còn dưới 15 phút nữa tới giờ), mọi trang của web đều có nút đỏ **Bắt đầu live** ở góc dưới bên phải, bấm một lần là web báo live, OBS tự theo trong khoảng 10 giây. Dùng được trên điện thoại. Hoàn tác vẫn ở Admin → Tổng quan → ô Bắt đầu buổi live ("Quay về giờ trước đó").
- **Đã bấm Start Streaming trong OBS từ trước:** nút nổi và ô Bắt đầu live trong Admin đều hỏi "đã bấm Start Streaming cách đây bao nhiêu phút" (mặc định 0), để bộ đếm web và OBS tính cả buổi từ đúng lúc đó, không bị nhảy về 0.
- **Tổng quan Admin:** mỗi số liệu tải riêng; ô nào chưa tải được hiện dấu **–** (không còn hiện 0 gây hiểu nhầm), có thanh cảnh báo, nút **Tải lại**, dòng "Số liệu lúc HH:mm:ss", và tự thử lại tối đa 3 lần.

### 22.q. Ghế sofa của Moon (gợi ý gói Người đồng hành ở mọi trang) và hướng dẫn mới
- **Ghế sofa:** góc dưới bên phải của **mọi trang**, Moon ngủ trên ghế (hình vẽ SVG, thở nhẹ, có chữ z bay lên). Khách chạm vào thì Moon mở mắt, hiện thẻ nhỏ: "Moon giữ chỗ cho bạn rồi", vài quyền lợi (Planner tuần; không giới hạn tập trung nếu web đang đặt giới hạn; nhóm học nếu đang bật; huy hiệu), giá gói 1 tháng và nút **Xem gói Người đồng hành** (mở trang Ủng hộ, tab Người đồng hành). Đủ 8 ngôn ngữ.
- **Ai thấy:** mọi khách, trừ trang Ủng hộ (đã ở đó rồi), trang Admin và lúc thẻ "Xem hướng dẫn?" đang hiện. Khách chưa là Người đồng hành thấy thẻ gợi ý gói, và chỉ khi web đã có cách thanh toán Người đồng hành (VietQR hoặc Ko-fi/PayPal ở Admin → Thanh toán). **Người đồng hành cũng thấy Moon ngủ trên sofa**, nhưng thẻ là lời cảm ơn kèm huy hiệu và nút "Gói Người đồng hành của bạn" (đến trang Ủng hộ). Thẻ nhỏ đóng bằng dấu X hoặc phím Esc.
- **Luôn hiện:** không có nút ẩn; khách không tắt được sofa. Muốn tắt hẳn cho mọi khách thì xoá cách thanh toán Người đồng hành ở Admin → Thanh toán.
- Chỉ chữ, hình vẽ và nút; **không đọc hay ghi Firebase**. Với admin, nút "Bắt đầu live" nổi được đẩy lên cao hơn để không đè sofa.
- **Hướng dẫn được làm lại cho khớp web hiện tại:** bước Phòng tập trung nói về các tab Việc, Nhạc, Live cạnh bộ đếm; bước Kế hoạch tuần nói thêm, sửa, tick việc ngay ở Phòng tập trung; **bước mới "Sofa của Moon"** (Moon ngủ gật, thẻ hiện phía trên ghế). Bước sofa tự bỏ qua nếu sofa không hiện. Đủ 8 ngôn ngữ.
- **Quyền lợi Người đồng hành có hình minh họa:** thẻ Người đồng hành ở trang Ủng hộ không còn danh sách chữ dài, mà là các thẻ nhỏ có hình (Planner tuần với phần trăm hiệu suất, nhóm học, tập trung không giới hạn, xem sớm, huy hiệu, danh sách cảm ơn) và một dòng tiêu đề ngắn. Câu đầy đủ do bạn viết (Admin → sửa chữ trực tiếp: `comp_perk1`…`comp_perk6`) vẫn còn, nằm trong mục "Chi tiết" bấm mở. Thẻ nào hiện cũng theo cài đặt như cũ (nhóm học khi bật, không giới hạn khi web đang giới hạn phút). Cùng bộ hình xuất hiện trong hướng dẫn (bước Kế hoạch tuần, bước Trở thành Người đồng hành, bước không giới hạn) và trong thẻ sofa; các bước đó được rút bớt chữ. Hình vẽ SVG ngay trong `pages.js` (biến `COMP_ILL`), theo màu giao diện nên đẹp cả sáng lẫn tối, không thêm tệp ảnh hay dữ liệu Firebase.

### 22.r. Phòng tập trung: gom việc về một chỗ, tab cạnh bộ đếm, bong bóng Ủng hộ
- **Việc cần làm (Người đồng hành, admin, người dùng thử):** ô "Danh sách việc" giờ là việc hôm nay của **Planner**. Gõ việc, chọn giờ nếu muốn (không bắt buộc), nhấn Enter là việc vào Planner hôm nay. Mỗi việc có nút đang làm (đếm 🍅), sửa (tên và giờ), xoá. Xoá một việc chưa xong thì hiện đúng hai lựa chọn như bên Planner: **ghi nhận "đã bỏ"** (tính vào đánh giá hôm nay) hoặc **xoá hẳn** (nhập nhầm). Việc đã xong thì xoá luôn. Việc nhanh cũ nằm trong máy (nếu có) vẫn hiện bên dưới, mục "Việc nhanh (chỉ trong máy này)", vẫn có nút chuyển sang Planner. Khách không có quyền Planner vẫn dùng danh sách trong máy như cũ. Đếm 🍅 cho việc của Planner chỉ lưu trong máy (ô `pl_pomos`), không thêm dữ liệu lên Firebase; mỗi lần thêm, sửa, xoá là ghi đúng một lần vào tuần Planner như khi làm bên Planner.
- **Danh sách việc, Nhạc, Nhóm, Live nằm thành tab cạnh bộ đếm** (cột bên phải), mặc định mở tab Việc, không phải cuộn xuống cuối trang mới thấy việc và nhạc nữa. Tab nhóm chỉ có khi bạn bật nhóm học. Trình phát YouTube và nhạc không bị dừng khi chuyển tab. Tab khách chọn được nhớ trong máy.
- **Nhóm và Live có khung riêng** (cập nhật sau): từ 1101px, Phòng tập trung chia 2 cột: **bộ đếm lớn nhất bên trái**, bên phải xếp dọc Việc + Nhạc (tab), rồi khung Nhóm + Live (và thẻ mời Planner), hàng thống kê (phiên, phút, 7 ngày) nằm dưới cùng. Điện thoại: xếp dọc bộ đếm, việc, Nhóm/Live, thống kê. Tab đang chọn của khung riêng được nhớ (`fs_tab`).
- **Cài đặt bộ đếm** (mẫu 25/5/15, số phút, tự chạy khối tiếp) gập lại trên điện thoại và máy tính bảng để danh sách việc không bị đẩy xuống; trên màn hình rộng vẫn mở sẵn. Bấm "Tuỳ chỉnh bộ đếm" để mở hoặc gập, máy nhớ lựa chọn.
- Bong bóng Ủng hộ ở mục Ủng hộ đã được thay bằng ghế sofa của Moon hiện ở mọi trang (xem 22.q).
- Mẹo hiện một lần "Việc của bạn, gom về một chỗ" thay cho mẹo cũ về Planner trong Phòng tập trung; đủ 8 ngôn ngữ.

### 22.y. Nhóm học: sửa lỗi "không hiện đang học" và phút bị thiếu
- **Nguyên nhân 1 (luật Firestore):** ai đã có phút trên bảng tuần thì mọi lần báo "đang học" đều bị luật từ chối (luật kiểm lại cả phần bảng xếp hạng dù không đổi), nên người đó không bao giờ hiện trong "Đang học" và web báo "Nhóm chưa sẵn sàng". Ngược lại, ghi phút cũng bị từ chối nếu nhịp báo cũ quá 10 phút. Luật mới chỉ kiểm phần có thay đổi. **Việc phải làm 1 lần: dán lại `firestore.rules` mới (4 bước ở mục 2.3).**
- **Cách sửa phía web (không cần dán luật vẫn đỡ):** mỗi lần ghi gộp luôn cả trạng thái đang học lẫn phút tuần.
- **Nguyên nhân 2 (phút chỉ cộng khi hết khối):** trước đây phút chỉ lên bảng khi hết trọn một khối tập trung; tạm dừng, đặt lại, bỏ qua hay đóng tab giữa chừng là mất, và đang học dở thì hạng không đổi. Giờ phút được cộng dần theo thời gian học thật (ghi lên mỗi 3 phút khi đang chạy, ngay khi tạm dừng hoặc hết khối), và số phút của chính bạn trên bảng luôn gồm cả phần chờ ghi.
- **Nguyên nhân 3 (nhiều thiết bị):** việc "đã tham gia nhóm" chỉ nhớ trong từng trình duyệt, nên học trên máy khác thì không báo và không cộng phút. Giờ nếu bảng tuần đã có tên bạn, thiết bị mới tự nhận lại biệt danh.

### 22.z. Hướng dẫn từng bước có hình cho Phòng tập trung, Hành trình trăng và Kế hoạch tuần
- Trong hướng dẫn của mèo Moon, ba bước **Phòng tập trung**, **Điểm danh (Hành trình trăng)** và **Kế hoạch tuần** giờ có **3 hình minh họa đánh số 1, 2, 3**, mỗi hình kèm một dòng chữ ngắn, thay cho các ý dài. Phòng tập trung: chọn giờ, việc cạnh đồng hồ, xem live và nhóm. Hành trình trăng: vào buổi học, bấm điểm danh, đi trên đường tới Moon. Kế hoạch tuần: xếp việc lên lưới, tick việc, tổng kết tuần.
- Chữ dưới hình (`fi`, `ci`, `pi` trong `TOUR_T` của `guide.js`) có đủ 8 ngôn ngữ; hình vẽ bằng SVG nên đổi màu theo giao diện sáng/tối. Mở lại hướng dẫn bằng mục **Hướng dẫn** trên menu.

### 22.aa. Đổi cách giới thiệu web thành "Study Hub"
- Tên tab trình duyệt giờ là **"Ép Study Room · Study Hub"** (tên thương hiệu vẫn lấy từ admin, phần "Study Hub" cộng thêm trong code: `tabName()` ở `core.js`). Mô tả trang, tiêu đề/mô tả khi chia sẻ link (`og:`) và mô tả khi cài app (`manifest.webmanifest`) nhắc tới lịch live, phòng tập trung, kế hoạch tuần và Hành trình trăng, để khách biết web không chỉ là lịch livestream.
- Việc còn lại ở YouTube (làm tay): mục **Links** trong About đổi nhãn "Schedule" thành "Study Hub"; dòng đầu mô tả buổi live đổi thành "STUDY HUB: SCHEDULE, FOCUS TIMER, PLANNER & MOON JOURNEY". Chia sẻ link lên Facebook/Zalo có thể còn nhớ tiêu đề cũ vài ngày.

### 22.ab. Nhóm học: vẫn báo "đang học" khi bạn ở trang khác
- Trước đây nhịp báo và cộng phút chỉ chạy sau khi mở Phòng tập trung hoặc Tổng quan; tải lại web ở trang khác (Cửa hàng, Bài viết...) khi đồng hồ đang chạy thì nhóm không thấy bạn và phút không lên bảng cho tới lúc hết khối. Giờ đồng hồ nhịp chạy ngay khi file nhóm học được tải, và báo lại trạng thái ngay khi web biết bạn là Người đồng hành.


### 22.ac. Tải web nhanh hơn, hỏi ngôn ngữ, hiệu ứng khi máy tắt animation, hướng dẫn "đừng hỏi lại"
- **Tốc độ:** các file chạy được tải tuần tự từng file một (mạng chậm phải đợi cả chục vòng mạng). `index.html` giờ có khối `<link rel="preload" as="script" fetchpriority="low">` cho mọi file chạy: trình duyệt tải song song nhưng vẫn chạy đúng thứ tự, và `fetchpriority="low"` giữ cho chữ và CSS (màn chờ) hiện trước. Đo trên mạng chậm giả lập (1,6 Mbps, trễ 150 ms, CPU chậm 4 lần): trang sẵn sàng 7,1 giây xuống 4,3 giây; mạng nhanh 3,2 giây xuống 2,2 giây. Khi thêm file chạy mới vào `index.html`, thêm luôn một dòng preload cùng đường dẫn (cả `?v=`).
- **Hỏi ngôn ngữ:** khách mới (chưa chọn ngôn ngữ, chưa xem hướng dẫn) thấy bảng chọn 8 ngôn ngữ, gợi ý sẵn ngôn ngữ của trình duyệt; chọn xong hướng dẫn mới chạy. Chọn rồi hoặc đã xem hướng dẫn thì không hỏi nữa. Code ở `js/welcome.js`.
- **Hiệu ứng:** máy tắt animation (Windows tắt "Animation effects", iPhone bật "Reduce Motion") làm web tự giữ yên bầu trời, mưa, con trỏ... mà khách không biết. Giờ web báo một lần (góc dưới bên trái) với nút **Bật hiệu ứng** / **Giữ nguyên**, và trong ⚙️ có thêm dòng "Vẫn hiện hiệu ứng dù máy đã giảm chuyển động" (chỉ hiện khi máy đang giảm chuyển động). Ô "Giảm chuyển động" cũ vẫn tắt hết như trước. Cách làm: lưu `ep_motion = "on"` → `html[data-motion="on"]`, các luật `prefers-reduced-motion` trong `app.css` đều có điều kiện `html:not([data-motion="on"])`.
- **Hướng dẫn cho khách cũ:** thẻ "Chào mừng bạn quay lại" có thêm **Để sau** (chỉ ẩn trong lần mở này) và **Đừng hỏi lại** (nhớ luôn).
- Chưa đổi: Firestore đang ép dùng long-polling (`core.js` dòng `experimentalForceLongPolling`). Chuyển sang `experimentalAutoDetectLongPolling` có thể nhanh hơn ở mạng bình thường nhưng chưa thử được với Firebase thật nên để nguyên.

### 22.ad. Nhóm học: sửa lỗi nhiều tab, đổi tuần, xếp hạng bằng điểm
- **Nhiều tab:** mở web ở hai tab trở lên khi đồng hồ chạy, mỗi tab từng tự cộng phút (đo thử: 3 tab cho 7 lần số phút thật) và tự "hoàn tất" khối (cộng phút tập trung và 🍅 hai lần). Giờ đồng hồ là một: tab khác đổi trạng thái thì tab này nhận lại (`storage` event trong `pages.js`), chỉ một tab hoàn tất khối; phút đang học tính chung (`grp_acc`) và chỉ một tab giữ quyền ghi lên nhóm (`grp_lead`, hết hạn sau 90 giây).
- **Đổi tuần** (thứ Hai 00:00 giờ Việt Nam): tài liệu tuần mới còn trống nên danh sách "đang học" trống tới 4 phút; giờ báo lại ngay.
- **Hạng:** cùng số phút thì ai đạt trước đứng trên, không còn đổi chỗ mỗi lần tải lại. Phần lẻ dưới một phút khi tạm dừng được giữ cho lần sau thay vì bỏ.
- **Lời báo lỗi:** một lần ghi bị luật từ chối không còn hiện "chưa dán luật"; từ lần thứ hai liên tiếp mới báo.
- **Chặn cộng phút nhanh hơn thời gian thật:** đã làm ở mục 22.af. Giờ các máy lệch quá 9 phút so với giờ thật sẽ không hiện "đang học". Bảng chứa tối đa 400 người.

### 22.ae. Nhóm học: hiển thị leo hạng
- Ở dải dưới đồng hồ và đầu bảng "Tuần này" hiện: hạng hiện tại, mũi tên **▲/▼ so với lần đầu bạn thấy bảng trong ngày** (giờ Việt Nam), và khoảng cách tới người đứng trên ("Học thêm 11 phút để vượt Sofia"). Đang đứng đầu thì hiện "Bạn hơn Kenji 5 phút". Cùng số phút thì ai đạt trước đứng trên, nên muốn vượt cần hơn người đó 1 phút.
- Lên hạng (so với lần thấy trước đó trong tuần) thì có thông báo "Bạn vừa lên hạng 2 tuần này!", lên hạng 1 thì "Bạn đang đứng đầu tuần này!". Chỉ báo khi lên, không báo khi bị vượt.
- Mốc so sánh lưu trong máy (`grp_rk0` theo ngày, `grp_rk` theo tuần), không ghi thêm gì lên Firebase và không tốn thêm lượt đọc. Lời mới có tiếng Anh và tiếng Việt; các tiếng khác tạm dùng tiếng Anh như phần còn lại của nhóm học.
### 22.af. Nhóm học: chặn gian lận phút (CẦN DÁN LUẬT MỚI)
- **Lỗ hổng cũ:** luật chỉ kiểm từng lần ghi ("không hơn thời gian từ lần ghi trước + 2 phút"), nên ai biết dùng DevTools có thể ghi mỗi giây một lần, mỗi lần +2 phút, tức nhanh gấp ~120 lần thời gian thật, chạm trần 112 giờ/tuần.
- **Luật mới:** mỗi mục trên bảng có thêm `f` (giờ MÁY CHỦ lúc mục được tạo trong tuần) và `z` (số phút lúc đó), chỉ ghi một lần rồi không sửa được. Mỗi lần ghi phải thoả `(mins - z) * 60000 <= giờ ghi - f + 180 phút`. Nghĩa là cả tuần, số phút cộng thêm không thể nhiều hơn thời gian thật đã trôi qua từ lúc vào bảng (cộng một lần 180 phút cho phần học dồn lúc mới vào). Mốc dùng giờ máy chủ nên máy lệch giờ không ảnh hưởng. Các kiểm tra cũ (tối đa 180 phút mỗi lần ghi, không nhanh hơn từ lần ghi trước, tối đa 112 giờ/tuần) giữ nguyên.
- **Mục cũ** (tạo trước khi có luật này, chưa có `f`) được gắn mốc ở lần cộng phút kế tiếp, số phút đang có được giữ nguyên.
- **Đo thử bằng mô phỏng** (chưa thử với Firebase thật): học thật 25 phút → 25 phút; 8 khối liên tiếp → 200 phút; mục cũ 300 phút + 25 → 325; máy khai gian ghi mỗi giây +2 phút trong 10 phút thật → dừng ở 188 phút (trước đây ~1200); thiết bị thứ hai vừa tạo mục thì thiết bị này tự đọc lại bảng và thử lại một lần, không mất phút.
- **Cách bật:** (1) gộp PR này để web có bản mới (client gửi thêm `f`, `z`); (2) NGAY SAU ĐÓ mở Firebase Console → Firestore Database → Rules, dán toàn bộ nội dung `firestore.rules` rồi **Publish**; (3) khách đang mở web cũ cần tải lại trang (Ctrl+F5) mới cộng phút tiếp được, giữa lúc đó phút của họ có thể bị từ chối vài lần. Hai bước cách nhau càng ngắn càng tốt: web mới gặp luật cũ thì bị từ chối (luật cũ chưa cho khoá `f`, `z`), web cũ gặp luật mới thì bị từ chối (thiếu `f`, `z`), và chỉ web mới + luật mới mới cộng phút bình thường.
- **Giới hạn còn lại:** người dùng tối đa được hưởng thêm 180 phút ở mỗi lần xoá và tạo lại mục của mình, nhưng xoá mục thì mất hết phút cũ nên không cộng dồn được. Dùng hai thiết bị cùng lúc cho một tài khoản không được tính gấp đôi (phần dư bị từ chối). Không chặn được việc ngồi mở đồng hồ mà không học, vì web không thể biết bạn có đang học thật.
### 22.ag. Nhóm học: người đang học hiện ngay khi vào web
- **Lỗi:** vừa vào web, danh sách "đang học" trống hoặc ghi "Chưa có ai" tới 60 giây. Quyền Người đồng hành đến muộn hơn trang nên lần tải đầu bị bỏ qua, rồi phải đợi nhịp tải lại 60 giây; trong lúc chờ khung còn báo "Chưa có ai" như thể thật sự không ai học.
- **Sửa:** (1) lần xem trước được lưu trong máy (`grp_snap`, chỉ của đúng tài khoản và đúng tuần) và hiện ngay khi vào, rồi cập nhật từ Firestore, ai báo nhịp quá 9 phút vẫn tự bị ẩn; (2) chưa có dữ liệu thì hiện "Đang tải" thay vì "Chưa có ai" ở khung nhóm, dải dưới đồng hồ và trang Tổng quan; (3) lúc mới vào cứ 2 giây thử tải lại cho tới khi được (tối đa khoảng 1 phút), không chờ nhịp 60 giây. Không thêm lượt đọc Firestore khi mọi thứ bình thường.
### 22.ah. Nhóm học: khách vào là thấy ngay
- Trước đây nhóm học chỉ nằm trong Phòng tập trung nên dễ bị lướt qua. Khi nhóm học đang bật (Admin → Giao diện & Menu), giờ có: (1) mục **Phòng tập trung** ở menu trái có thêm dòng nhỏ **+ Nhóm học** và chấm hồng nhấp nháy cho tới lần đầu khách bấm vào mục đó (không tách thành mục riêng vì nhóm học vẫn nằm trong trang Phòng tập trung); (2) vào Phòng tập trung là khung nhóm học hiện sẵn cạnh đồng hồ (trước đây mặc định là khung "Xem live", ai đã tự chọn tab thì giữ nguyên lựa chọn); (3) thẻ nhóm học ở Tổng quan (ngay dưới khối chào) có viền hồng nổi bật, nút **Xem thử cách hoạt động** cho khách chưa là Người đồng hành, và nút **Mở nhóm học** kéo thẳng xuống khung nhóm học.
- Dòng "+ Nhóm học" có đủ 8 ngôn ngữ và tự ẩn khi nhóm học tắt. Không thêm lượt đọc Firestore.

### 22.ai. Nhóm học: bảng tuần trước và đủ 8 ngôn ngữ
- **Bảng tuần trước:** dưới bảng "Tuần này" có mục **Tuần trước** hiện top 3 của tuần vừa rồi, và nếu bạn ngoài top 3 thì có thêm dòng "Tuần trước bạn đứng hạng 5 · 2 giờ 10 phút". Dữ liệu lấy từ tài liệu tuần trước đã có sẵn trên Firestore (luật hiện tại cho đọc), **không cần dán luật mới**. Mỗi người chỉ đọc thêm MỘT lượt mỗi tuần: kết quả được lưu trong máy (`grp_prev`), các lần vào sau dùng bản lưu. Tuần đầu tiên chưa có tuần trước thì mục này tự ẩn.
- **Dịch đủ 8 ngôn ngữ:** toàn bộ phần dành cho thành viên nhóm (nhập biệt danh, bảng xếp hạng, leo hạng, thông báo, lời báo lỗi) nay có tiếng Hindi, Nhật, Hàn, Trung, Pháp, Tây Ban Nha, trước đây các ngôn ngữ này hiện tiếng Anh. Đã kiểm bằng máy là mọi ngôn ngữ đủ khoá và đúng chỗ giữ chỗ ({n}, {r}, {m}...); bản dịch do AI viết nên nếu bạn có người bản xứ xem lại thì tốt.
- Lưu ý: tên người trong bảng tuần trước là biệt danh họ đặt lúc đó.

### 22.aj. Nút hướng dẫn riêng ở từng trang (Moon chỉ bằng hình)
- Mỗi trang có nút **Hướng dẫn** (biểu tượng ⓘ, góc phải trên của ảnh đầu trang; trên điện thoại chỉ còn biểu tượng): Tổng quan, Lịch live, Xem live, Phòng tập trung, Viết, Hành trình trăng, Kế hoạch tuần, Shop, Đồ của mình, Ủng hộ. Bấm vào thì Moon hiện ra với **ba hình minh họa, mỗi hình một dòng chữ ngắn** (ví dụ Lịch live: chọn một ngày, giờ theo múi giờ của bạn, bấm chuông để được nhắc), thay vì đoạn chữ dài. Mỗi trang Moon có dáng và đạo cụ riêng.
- Đây là hướng dẫn riêng của trang, tách khỏi hướng dẫn chung ở mục **Hướng dẫn** trên menu. Bấm nút này **không** tính là đã xem hướng dẫn chung, nên khách mới vẫn được hướng dẫn tự chạy như trước. Có đủ 8 ngôn ngữ. Hình vẽ bằng SVG trong `guide.js`, không thêm ảnh hay lượt đọc nào.
- Phòng tập trung, Hành trình trăng và Kế hoạch tuần dùng lại ba hình của hướng dẫn chung. Muốn đổi chữ dưới hình: sửa trong `guide.js` ở `TOUR_PG` (các trang mới) hoặc `fi` / `ci` / `pi` trong `TOUR_T`.

### 22.u. Planner đổi tên thành "Kế hoạch tuần" và có hiệu suất khi tick việc
- Tên cũ "My planner" / "Planner của tôi" dễ bị hiểu nhầm là sản phẩm Planner bản in đã mua trong Shop. Tên mới (đủ 8 ngôn ngữ): **Weekly Plan** (en), **Kế hoạch tuần** (vi), साप्ताहिक योजना (hi), 週間プラン (ja), 주간 계획표 (ko), 每周计划 (zh), Plan de la semaine (fr), Plan semanal (es). Đổi ở menu, tiêu đề trang, lời mời thử, hướng dẫn. Đường dẫn `#/planner` và dữ liệu cũ giữ nguyên, không ai mất gì. Các câu dài vẫn có chữ "Planner" như một danh từ chung.
- Thẻ **Hôm nay** có khối **Hiệu suất hôm nay**: phần trăm số phút dự định đã xong (hoặc so với mục tiêu ngày nếu khách đã đặt), kèm cấp độ (Chưa bắt đầu, Khởi động, Ổn định, Rất tốt, Trọn vẹn). Mỗi lần khách **tick xong một việc**, khối này nháy lên và hiện thông báo ngay, ví dụ "Tốt lắm! Ổn định · 47% (2/4 việc). Lên hạng: Ổn định!". Việc không gắn ngày thì thông báo điểm tuần. Cách tính dùng đúng dữ liệu sẵn có nên **không thêm lượt ghi hay đọc Firestore nào**.

### 22.w. Dọn Admin: tách tab và bỏ mã hàng tháng
- Tab **Thanh toán & Ủng hộ** được tách đôi: **Thanh toán** (VietQR, PayPal/Stripe/Ko-fi, mẫu EmailJS, nút **Lưu thanh toán**) và **Gói Người đồng hành** (giá và link, thanh mục tiêu, khuyến mãi, ưu đãi Hành trình trăng, giới hạn Focus, nhóm học; mỗi thẻ có nút lưu riêng).
- **Mã hàng tháng** đã bỏ (xem PHẦN 10). Ai đã mở khoá bằng mã cũ sẽ bị giới hạn Focus trở lại, trừ khi họ là Người đồng hành hoặc đang dùng thử.

### 22.v. Hướng dẫn từng bước cho khách mới (mèo Moon chỉ đường)
- Khi mở web, hướng dẫn chạy từng bước: chú mèo Moon chỉ vào đúng nút (tài khoản, Xem live, Phòng tập trung, Hành trình trăng, nút tuỳ chọn, chuông, Ủng hộ), mỗi bước có tiêu đề, một câu mô tả hài hước và 2–3 ý chi tiết, bấm **Tiếp** để đi tiếp hoặc **Bỏ qua** để thoát. Gần cuối có các bước giới thiệu **quyền lợi của Người đồng hành**: Kế hoạch tuần (trước đây tên "Planner của tôi"), nhóm học và không giới hạn Phòng tập trung (hai ý này chỉ hiện khi bạn đã bật nhóm học / đã đặt giới hạn phút), rồi mục Ủng hộ kèm lời mời thử bằng mã dùng thử. Có đủ 8 ngôn ngữ của web.
- **Moon đổi nét mặt, cử chỉ và đạo cụ theo từng bước** (vẫy tay, nháy mắt, mắt trái tim, đeo kính râm, đội vương miện cho các quyền lợi của Người đồng hành, đội mũ tiệc ở bước cuối…), toàn bộ vẽ bằng SVG trong `guide.js` nên không thêm ảnh hay thư viện nào.
- **Bản xem thử nhóm học** (tên giả như Kenji, Sofía, Mina; đồng hồ mẫu và bảng xếp hạng tuần, gắn nhãn "Xem thử") hiện ở bước nhóm học của hướng dẫn, và hiện ngay trong khung Nhóm học ở Phòng tập trung cho khách chưa phải Người đồng hành, để họ hiểu nhóm làm gì trước khi quyết định. Đây chỉ là dữ liệu mẫu nằm trong `guide.js`, **không đọc Firestore**. Bản xem thử chỉ hiện khi bạn đã bật nhóm học ở Admin → Giao diện & Menu.
- Lời mời nhóm học (tiêu đề, mô tả, nút) của khách chưa là Người đồng hành nay có đủ 8 ngôn ngữ; phần dành riêng cho thành viên trong nhóm (nhập biệt danh, bảng xếp hạng thật…) vẫn là tiếng Anh và tiếng Việt, ngôn ngữ khác tạm hiện tiếng Anh.
- **Khách mới** (lần đầu vào, chưa đăng nhập, chưa dùng gì): hướng dẫn tự chạy. **Khách cũ** (đã đăng nhập, hoặc máy đã có việc / giờ tập trung): hiện thẻ hỏi "Bạn có muốn xem hướng dẫn không?" với hai nút **Xem hướng dẫn** và **Tôi hiểu rồi**. Trả lời xong thì không hỏi lại.
- Xem lại bất cứ lúc nào bằng mục **Hướng dẫn** trên menu (ngay dưới Tổng quan).
- Nội dung nằm trong file mới **`guide.js`** (nhớ tải file này lên GitHub cùng chỗ với `group.js`). Nếu bạn ẩn một mục khỏi menu (Admin → Giao diện & Menu), bước chỉ vào mục đó tự được bỏ qua.
- Không muốn hiện mục Hướng dẫn trong menu: Admin → Giao diện & Menu → bỏ tích **Hướng dẫn**.
