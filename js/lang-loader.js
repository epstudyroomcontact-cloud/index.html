/* Khách chọn ngôn ngữ khác tiếng Anh/Việt thì nạp thêm gói ngôn ngữ trước khi web khởi động. */
(function(){var l=null;try{l=JSON.parse(localStorage.getItem('ep_lang'))}catch(e){}if(l&&l!=='en'&&l!=='vi')document.write('<script src="js/i18n-langs.js?v=111"><\/script>')})();
