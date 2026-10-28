/* Chữ Google Fonts tải ngầm (media=print) rồi bật lên khi xong, để không chặn việc vẽ trang.
   Trước đây làm bằng onload trong thẻ link; CSP chặt không cho thuộc tính chạy mã nên chuyển sang file này. */
(function(){
  var l = document.getElementById('ep-fonts'); if (!l) return;
  var on = function(){ l.media = 'all'; };
  if (l.sheet) on(); else { l.addEventListener('load', on); l.addEventListener('error', on); }
})();
