/* Dự phòng: file trong vendor/ không tải được thì tải bản cùng phiên bản từ CDN (CSP chỉ cho đúng đường dẫn này). */
window.firebase&&firebase.firestore||document.write('<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"><\/script>')
