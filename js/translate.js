/* =========================================================
   TRANSLATE — tự động dịch nội dung chủ trang viết sang mọi ngôn ngữ

   Chạy trong trình duyệt của ADMIN, đúng lúc bấm Lưu. Bản dịch được lưu vào Firestore,
   nên người xem chỉ đọc bản đã lưu (nhanh, không tốn gì, không lộ khoá nào).
   Thứ tự thử: Google Translate (miễn phí, không cần khoá) → MyMemory (miễn phí).
   Nếu cả hai lỗi: giữ nguyên bản gốc, báo cho admin, và bấm Lưu lại là dịch tiếp.

   TR.text(str, from, to)            → chuỗi đã dịch
   TR.html(html, from, to)           → HTML đã dịch (chỉ dịch phần chữ, giữ nguyên thẻ)
   TR.fill(oldObj, curObj, opts)     → object đủ mọi ngôn ngữ: ô nào bạn vừa viết thì giữ nguyên,
                                       các ngôn ngữ còn lại dịch từ đó
   ========================================================= */
const TR = (() => {
  const CODE = { zh:'zh-CN' };
  const code = l => CODE[l] || l;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const memo = new Map();

  // tách văn bản thành các mảnh ≤ max ký tự, ưu tiên cắt ở xuống dòng / hết câu
  function chunks(text, max){
    const parts = text.match(/[^.!?。！？\n]+[.!?。！？]*[ \t]*|\n+|[.!?。！？]+[ \t]*/g) || [text];
    const out = []; let cur = '';
    const push = s => { while (s.length > max) { out.push(s.slice(0, max)); s = s.slice(max); } cur = s; };
    for (const p of parts) { if ((cur + p).length <= max) cur += p; else { if (cur) out.push(cur); cur = ''; push(p); } }
    if (cur) out.push(cur);
    return out;
  }

  async function viaGoogle(s, from, to){
    const r = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=' + code(from) + '&tl=' + code(to) + '&q=' + encodeURIComponent(s));
    if (!r.ok) throw new Error('google ' + r.status);
    const j = await r.json();
    return (j[0] || []).map(x => x[0] || '').join('');
  }
  async function viaMyMemory(s, from, to){
    let out = '';
    for (const c of chunks(s, 450)) {
      const m = c.match(/^(\s*)([\s\S]*?)(\s*)$/);
      if (!m[2]) { out += c; continue; }
      const r = await fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(m[2]) + '&langpair=' + code(from) + '|' + code(to));
      if (!r.ok) throw new Error('mymemory ' + r.status);
      const j = await r.json();
      if (+j.responseStatus !== 200 || /MYMEMORY WARNING/i.test(j.responseData.translatedText || '')) throw new Error('mymemory quota');
      out += m[1] + j.responseData.translatedText + m[3];
    }
    return out;
  }
  async function one(s, from, to){
    for (let i = 0; i < 2; i++) { try { return await viaGoogle(s, from, to); } catch (e) { await sleep(500 * (i + 1)); } }
    return viaMyMemory(s, from, to);
  }

  async function text(str, from, to){
    str = String(str == null ? '' : str);
    if (!str.trim() || from === to) return str;
    const key = from + '>' + to + '>' + str;
    if (memo.has(key)) return memo.get(key);
    let out = '';
    for (const c of chunks(str, 1400)) {
      const m = c.match(/^(\s*)([\s\S]*?)(\s*)$/);
      if (!m[2]) { out += c; continue; }
      out += m[1] + await one(m[2], from, to) + m[3];
      await sleep(120);
    }
    memo.set(key, out);
    return out;
  }

  async function html(src, from, to){
    if (!src || from === to) return src || '';
    const key = 'h>' + from + '>' + to + '>' + src;
    if (memo.has(key)) return memo.get(key);
    const doc = new DOMParser().parseFromString('<div id="r">' + src + '</div>', 'text/html'), root = doc.getElementById('r');
    const nodes = [], w = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) { const n = w.currentNode; if (n.nodeValue.trim() && !(n.parentElement && n.parentElement.closest('script,style,code,pre'))) nodes.push(n); }
    const set = (n, tr) => { const m = n.nodeValue.match(/^(\s*)[\s\S]*?(\s*)$/); n.nodeValue = m[1] + tr.trim() + m[2]; };
    let batch = [], len = 0;
    const flush = async () => {
      if (!batch.length) return;
      const lines = batch.map(n => n.nodeValue.trim().replace(/\s*\n\s*/g, ' '));
      let outs = null;
      try { outs = (await text(lines.join('\n'), from, to)).split('\n'); } catch (e) { outs = null; }
      if (!outs || outs.length !== batch.length) { outs = []; for (const l of lines) outs.push(await text(l, from, to)); }
      batch.forEach((n, i) => set(n, outs[i]));
      batch = []; len = 0;
    };
    for (const n of nodes) { const l = n.nodeValue.trim().length; if (len + l > 1200) await flush(); batch.push(n); len += l + 1; }
    await flush();
    const out = root.innerHTML;
    memo.set(key, out);
    return out;
  }

  /* old = bản đang lưu {en, vi, hi, …}; cur = những ô admin vừa nhập trên form (thường {en, vi}).
     - ô nào vừa được sửa  → giữ đúng chữ admin nhập (admin tự chọn viết ngôn ngữ nào cũng được)
     - các ngôn ngữ khác   → dịch lại từ ô vừa sửa (ưu tiên English nếu sửa nhiều ô)
     - không ô nào sửa      → chỉ bổ sung những ngôn ngữ còn thiếu
     Lỗi dịch ở ngôn ngữ nào thì ngôn ngữ đó giữ bản cũ (nếu có); TR.failed = số lần lỗi (đặt lại bằng TR.reset()). */
  async function fill(old, cur, opts = {}){
    old = old || {};
    const ks = Object.keys(cur); if (ks.length && !ks.some(l => cur[l])) return {};          // admin xoá sạch → xoá luôn mọi bản dịch
    const res = { ...old };
    const typed = Object.keys(cur).filter(l => cur[l] && cur[l] !== (old[l] || ''));
    Object.keys(cur).forEach(l => { if (cur[l]) res[l] = cur[l]; else delete res[l]; });
    let src = typed.includes('en') ? 'en' : typed[0];
    if (!src) src = res.en ? 'en' : Object.keys(res).find(l => res[l] && LANGS.includes(l));
    if (!src || !res[src]) return res;
    const targets = LANGS.filter(l => l !== src && !typed.includes(l) && (typed.length || !res[l]));
    let i = 0; const queue = [...targets];                       // dịch song song 3 ngôn ngữ một lúc cho nhanh
    const worker = async () => {
      while (queue.length) {
        const l = queue.shift();
        try { res[l] = await (opts.html ? html(res[src], src, l) : text(res[src], src, l)); } catch (e) { TR.failed++; }
        if (opts.onProgress) opts.onProgress(++i, targets.length);
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    return res;
  }

  return { text, html, fill, failed:0, reset(){ this.failed = 0; } };
})();
