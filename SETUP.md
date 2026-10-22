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

**Bản sao dự phòng:** cũng ở thẻ trên có nút **"Tải bản sao dữ liệu (file .json)"**. Nên bấm khoảng mỗi tuần và cất file vào ổ đĩa của bạn (bài viết, sản phẩm, cài đặt nằm trong Firebase, đây là bản dự phòng nếu có sự cố).

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

**Khách:** đăng nhập → mở **My planner** (hoặc trang **Support**) → ô "Bạn có mã dùng thử?" → nhập mã → **Kích hoạt**. Planner mở ngay, có dòng báo dùng thử đến ngày giờ nào.

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
- Người dùng mở **Planner** trên **từng máy** (điện thoại, máy tính) và bấm **"Nhắc tôi trước giờ làm việc"**, cho phép thông báo. Máy đó lưu mã nhận thông báo vào hồ sơ của chính họ (`users/<uid>.plPush`, chỉ họ và admin đọc được).
- Mỗi lần chạy (khoảng 5 phút), máy gửi đọc Planner tuần này của những người đã bật, việc chưa xong sắp bắt đầu thì nhắc. Thường đến tay **khoảng 8–12 phút trước** giờ bắt đầu, GitHub chạy trễ thì có thể muộn hơn (quá 10 phút sau giờ bắt đầu thì không nhắc nữa). 20:00–21:00 còn việc chưa xong thì nhắc một lần.
- Đang mở web thì vẫn nhắc ngay trong trang như cũ; hai lời nhắc dùng chung một mã nên chỉ hiện 1 thông báo.
- iPhone / iPad: giống 17.1, phải **thêm web ra Màn hình chính**, mở từ biểu tượng đó rồi bật nhắc việc.
- Đăng xuất hoặc tắt nhắc việc trên máy nào thì máy đó thôi nhận.

## QUY TẮC CẬP NHẬT WEB LÊN GITHUB (đọc cái này khi cần cập nhật)
Từ bản 8, các file hay thay đổi (`index.html`, `core.js`, `pages.js`, `admin.js`, `i18n-extra.js`, `app.css`) **đều nằm ở trang gốc của repo**, cùng chỗ với `index.html`. Chỉ còn 4 file ít khi đổi nằm trong thư mục `js`: `art.js`, `i18n.js`, `translate.js`, `firebase-config.js`.

Mỗi lần mình đưa bản mới, mình sẽ tạo một thư mục chứa **đúng những file cần upload** (nằm phẳng, không có thư mục con). Bạn làm:
1. Vào trang chính của repo trên GitHub (thấy danh sách file, **không vào thư mục nào**).
2. **Add file → Upload files**.
3. Mở thư mục upload, **Ctrl + A** chọn hết các file rồi kéo vào khung upload.
4. Đợi danh sách file hiện đủ, kéo xuống bấm **Commit changes**.
5. Đợi 2–5 phút, **Ctrl + Shift + R**, vào **Admin** xem dòng "Phiên bản web".
GitHub tự bỏ qua file nào không đổi.