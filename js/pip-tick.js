/* Nhịp đếm cho "Timer nổi" kiểu video (pages.js, Safari / trình duyệt không có Document PiP).
   Chạy trong Web Worker vì tab bị ẩn thì setInterval của trang bị trình duyệt làm chậm (có khi 1 lần/phút); worker thì không. */
let h = 0;
onmessage = e => { clearInterval(h); h = e.data ? setInterval(() => postMessage(0), +e.data) : 0; };
