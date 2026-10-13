# Hướng dẫn thiết lập — từng bước, từng phần mềm

Bạn chỉ cần làm theo thứ tự. Không cần biết lập trình. Mỗi bước đều ghi rõ **bấm vào đâu**.

Bạn sẽ dùng 4 nơi: **GitHub** (để đăng web), **Firebase** (lưu dữ liệu + đăng nhập), **Gmail** (xác minh tài khoản admin), và vài trang tuỳ chọn (YouTube, ngân hàng, PayPal/Ko-fi).

---

## PHẦN 1 — GitHub: đưa web lên mạng

1. Vào https://github.com và đăng nhập. Mở repo (kho) chứa website của bạn.
2. Bấm nút **Add file** (góc phải, màu xám) → chọn **Upload files**.
3. Mở thư mục `D:\STUDY WITH EP\code web epstudyroom` trên máy. Chọn **tất cả** bên trong (bấm vào 1 file rồi nhấn `Ctrl + A`) và **kéo thả** vào khung trên GitHub.
   Phải có đủ: `index.html`, thư mục `css`, thư mục `js`, `firestore.rules`, `storage.rules`, `SETUP.md`.
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
- **Thanh toán & Ủng hộ**: thông tin ngân hàng, PayPal, Ko-fi, các mức tiền gợi ý, link "Người đồng hành".
- **Thành viên**: danh sách tài khoản, tiến độ Hành trình trăng của từng người, ô tích **"Người đồng hành"**.

**Sửa chữ và ảnh trực tiếp trên trang**: bấm nút ✏️ (cây bút) ở thanh trên cùng → bấm vào chữ có viền nét đứt để gõ lại (tự lưu khi bấm ra ngoài) → bấm vào ảnh để thay.

Mặc định trang hiển thị **tiếng Anh**. Khách đổi ngôn ngữ ở nút ⚙️ (thanh trên cùng).

---

## PHẦN 5 — Nhận ủng hộ (trang "Support")

### 5.1. Chuyển khoản trong nước (VietQR, MoMo quét được)
1. Vào Admin console → tab **Thanh toán & Ủng hộ**.
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
3. Lưu, copy **Template ID** → dán vào Admin console → **Thanh toán & Ủng hộ** → ô **Template ID** → Lưu.
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

## PHẦN 10 — Kiếm tiền nhẹ nhàng: "Người đồng hành" mở khoá bằng MÃ HÀNG THÁNG

Cách hoạt động: người xem miễn phí tập trung tối đa **2 tiếng mỗi ngày**. Ai ủng hộ hằng tháng thì nhận **một mã**, gõ vào web là **không còn giới hạn**. Bạn **không phải tick từng người**, chỉ đổi mã mỗi tháng.

### 10.1. Thiết lập Ko-fi (làm 1 lần, để mã tự đến tay người trả)
1. Vào https://ko-fi.com → **Sign up** (đăng ký) bằng email của bạn → làm theo hướng dẫn tạo trang, ví dụ `ko-fi.com/tenban`.
2. Cần nhận tiền: vào **Settings** → **Payments** → nối **PayPal** hoặc **Stripe** theo hướng dẫn trên màn hình.
3. Bật gói hằng tháng: mục **Membership** (hoặc "Memberships") → **Enable** → tạo 1 gói, ví dụ tên **"Companion"**, giá bạn chọn (ví dụ 2–3 USD/tháng).
4. Ở gói đó, tìm ô **Welcome message** (lời chào gửi ngay khi có người đăng ký) hoặc tạo một **bài đăng chỉ dành cho thành viên**. Ghi: *"Cảm ơn bạn! Mã tháng này: MOON-XXXX-XXXX. Gõ mã ở trang Support hoặc Phòng tập trung trên web."*
5. Copy link Ko-fi của bạn → vào web **Admin console → Thanh toán & Ủng hộ** → dán vào ô **"Link đăng ký hằng tháng cho Người đồng hành"** và ô **Ko-fi** → **Lưu thanh toán**.

### 10.2. Việc làm MỖI THÁNG (khoảng 2 phút)
1. Vào **Admin console → Thanh toán & Ủng hộ**, tìm khung **"Mã hàng tháng cho Người đồng hành"**.
2. Bấm **Tạo mã ngẫu nhiên** (ra dạng `MOON-AB12-CD34`). **Copy mã này lại** (web không lưu mã gốc để bảo mật).
3. Ô **"Hết vào ngày"**: để mặc định (cuối tháng sau) hoặc chọn ngày khác.
4. Bấm **Lưu mã**. Mã cũ hết tác dụng ngay.
5. Sang Ko-fi, sửa **Welcome message** (hoặc đăng bài mới cho thành viên) với mã mới.

### 10.3. Người trả bằng chuyển khoản (VietQR/MoMo) hoặc PayPal
Họ chuyển tiền, báo bạn (nhắn Instagram/email kèm nội dung chuyển khoản). Bạn **nhắn lại mã của tháng** cho họ. Số người ít thì rất nhẹ; nếu muốn đỡ việc, hãy hướng mọi người sang Ko-fi.

### Lưu ý
- Mã có thể bị chia sẻ cho người khác; đổi mã mỗi tháng để hạn chế. Giới hạn đếm theo trình duyệt nên người rành kỹ thuật có thể vượt được.
- Đổi số phút giới hạn hoặc bỏ hẳn giới hạn (điền 0) ở khung **"Giới hạn Phòng tập trung"** cùng tab.
- Tick **"Người đồng hành"** ở tab Thành viên chỉ dùng khi bạn muốn tặng hoặc làm ngoại lệ.

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