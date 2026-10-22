/* =========================================================
   CẤU HÌNH FIREBASE CỦA WEB MỚI (project: epstudyroom-web)
   Các giá trị này không phải mật khẩu, nên để công khai trên GitHub là bình thường.
   Quyền ghi dữ liệu được bảo vệ bởi luật bảo mật trong firestore.rules.
   ========================================================= */
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyD4K9ugw33zVJnpRAHKzY6Bq8i8IOXLjmo",
  authDomain: "epstudyroom-web.firebaseapp.com",
  projectId: "epstudyroom-web",
  storageBucket: "epstudyroom-web.firebasestorage.app",
  messagingSenderId: "487905433015",
  appId: "1:487905433015:web:f25eeff8062ac9682e0432"
};
/* Khoá công khai cho THÔNG BÁO ĐẨY (Web Push). Lấy ở Firebase Console → ⚙️ Project settings → Cloud Messaging
   → Web configuration → Web Push certificates → "Generate key pair", rồi dán chuỗi "Key pair" vào giữa hai dấu nháy.
   Khoá này cũng công khai, không phải mật khẩu. Để trống thì web ẩn mục thông báo đẩy, chuông nhắc vẫn chạy như cũ. */
window.FCM_VAPID_KEY = "";
