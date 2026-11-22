/* «مخ السيستم» (the owner 22 Nov — «عايز المساعدين يبقوا في اكشنز معينة ذكائهم في السيستم مش بيستخدموا مخ خارجي … كل الاكشنز اللي ليها
   علاقة بالسيستم ادخال او اخراج او تعديل بيانات» and «يقولي مش فاهم و هستخدم تدخل خارجي و انا اوافق او ارفض»). Not a block. Pure (UMD):
   text → what the member asked of the system, with no model behind it. The fixed commands of block 27 are its base; on top of them
   the words the system says today («مبتكر»), a page opened by its name, a maker's name found by its sound or with a slip of the
   hand («انتيكما» = antekama), and a question back when two names fit. What it does not understand is `unknown` — the page then
   asks the member before any outside model is called.
     IBBrain.understand(text, ctx) → the block-27 command shapes, or
       { type: 'goPage', page }                        a page of the side menu
       { type: 'listFilter', list, page, hash, tab, name, words }   a list of another page filtered by words (the page's own filter)
       { type: 'readMaker', vendor } · { type: 'readPeriod', what, preset } · { type: 'readProduct', q } · { type: 'readMember', q }
                                                       a read-out from the system's own data, said in the chat
       { type: 'choose', question, options, texts }    two names fit: the member picks, texts[i] is the request said again
       { type: 'unknown' }
     ctx: { vendors: [name], today, pages: [{ id, label }] }
     IBBrain.findName(text, names) → { hit, others, from, to } (the name, the other names as near, the words it was read from) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory; // a test hands it block 27: loadUmd(brain)(loadUmd(commands))
  else root.IBBrain = factory(root.IbtekrCommands);
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';
  const norm = C.norm;
  const words = (t) => norm(t).split(' ').filter(Boolean);

  // ---- a name by its sound: Arabic and Latin letters to one consonant line (vowels and doubled letters go), so «انتيكما» and
  // «antekama» are the same line «ntkm»
  const AR = { 'ب': 'b', 'پ': 'b', 'ت': 't', 'ط': 't', 'ث': 's', 'س': 's', 'ص': 's', 'ش': 's', 'ج': 'g', 'غ': 'g', 'چ': 'g', 'ح': 'h', 'ه': 'h', 'خ': 'k', 'ق': 'k', 'ك': 'k', 'د': 'd', 'ض': 'd', 'ذ': 'z', 'ز': 'z', 'ظ': 'z',
    'ر': 'r', 'ف': 'f', 'ڤ': 'f', 'ل': 'l', 'م': 'm', 'ن': 'n' };
  const LA = { b: 'b', p: 'b', t: 't', s: 's', c: 'k', k: 'k', q: 'k', x: 'ks', g: 'g', j: 'g', h: 'h', d: 'd', z: 'z', r: 'r', f: 'f', v: 'f', l: 'l', m: 'm', n: 'n' };
  function skel(s) {
    const t = norm(s).replace(/sh|ch/g, 's').replace(/ph/g, 'f').replace(/th/g, 's').replace(/kh/g, 'k').replace(/gh/g, 'g'); let out = '';
    for (const ch of t) { const k = AR[ch] || LA[ch] || ''; if (k && out.slice(-k.length) !== k) out += k; }
    return out;
  }
  // the letters between two words (one slip of the hand in a word of four letters or more counts as the same word)
  function dist(a, b) {
    if (a === b) return 0; if (Math.abs(a.length - b.length) > 1) return 2;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) { const cur = [i]; for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
    return prev[b.length];
  }
  const near = (a, b) => a.length >= 4 && b.length >= 4 && dist(a, b) <= 1;
  // a name read by its sound is looked for only where a name is announced («المبتكر …», «بتاع …», «براند …») — a word of the
  // system's own («متأخر», «ملغي») is never taken for a name
  const MARK = ['المبتكر', 'مبتكر', 'للمبتكر', 'المورد', 'مورد', 'للمورد', 'بتاع', 'بتاعه', 'بتاعت', 'بتوع', 'براند', 'البراند', 'متجر', 'المتجر', 'فيندور', 'الفيندور', 'vendor', 'maker', 'حساب', 'رصيد', 'كشف', 'صافي', 'مستحقات', 'account', 'balance', 'statement'];
  /** A name of `names` said in `text`: as written anywhere (3); after a word that announces a name, by its sound (2) or with a slip
   *  of the hand / one word of a longer name (1). Two that fit as well → others. */
  function findName(text, names) {
    const tk = words(text); const t = tk.join(' '); const found = [];
    const marked = new Set(); tk.forEach((w, i) => { if (MARK.includes(w)) for (let k = 1; k <= 3; k++) marked.add(i + k); });
    for (const name of names || []) {
      const n = norm(name); if (!n) continue;
      const at = (' ' + t + ' ').indexOf(' ' + n + ' ');
      if (at >= 0) { const from = t.slice(0, at).split(' ').filter(Boolean).length; found.push({ name, score: 3, from, to: from + n.split(' ').length, len: n.length }); continue; }
      const whole = skel(n); const parts = n.split(' ').filter((w) => w.length >= 3); let best = null;
      for (let size = Math.min(3, tk.length); size >= 1; size--) for (let i = 0; i + size <= tk.length; i++) {
        if (!marked.has(i) || MARK.includes(tk[i])) continue;
        const span = tk.slice(i, i + size).join(' '); const sk = skel(span); if (sk.length < 3) continue;
        let score = 0;
        if (sk === whole) score = 2; else if (near(span, n) || near(sk, whole)) score = 1;
        else if (size === 1 && parts.length > 1 && parts.some((w) => skel(w).length >= 3 && (skel(w) === sk || near(w, span)))) score = 1; // one word of a longer name
        if (score && (!best || score > best.score)) best = { name, score, from: i, to: i + size, len: n.length };
      }
      if (best) found.push(best);
    }
    if (!found.length) return { hit: '', others: [] };
    found.sort((a, b) => b.score - a.score || b.len - a.len);
    const top = found.filter((f) => f.score === found[0].score);
    if (found[0].score === 3 || top.length === 1) return { hit: found[0].name, others: [], from: found[0].from, to: found[0].to };
    return { hit: '', others: top.map((f) => f.name).slice(0, 6), from: top[0].from, to: top[0].to };
  }

  // ---- the pages by the words people call them
  const PAGE_WORDS = { dashboard: ['لوحه التحكم', 'الرئيسيه', 'الداشبورد', 'اللوحه'], orders: ['الاوردرات', 'الطلبيات'], vendors: ['المبتكرين', 'الموردين', 'صفحه المبتكرين'], accounts: ['الحسابات'],
    inventory: ['المخزن', 'المخزون'], products: ['المنتجات'], cs: ['خدمه العملاء', 'الرسايل', 'الشات'], autoreply: ['الرد الالي', 'الرد التلقائي'], tickets: ['طلبات الفريق', 'الطلبات'], reports: ['التقارير'],
    marketing: ['التسويق'], ai: ['الذكاء الاصطناعي', 'المساعدين'], hr: ['الموارد البشريه', 'الفريق', 'الموظفين'], settings: ['الاعدادات'], profile: ['ملفي', 'بروفايلي', 'حسابي'] };
  const OPEN = /(^|\s)(افتح|افتحلي|روح|روحلي|وديني|ودني|وريني|ورني|هات|هاتلي|اعرض|اعرضلي|شوف|شوفلي|عايز اشوف|عاوز اشوف|خش|ادخل|open|go to|show)(\s|$)/;
  // what belongs to a model, never to the system: a why, an opinion, writing, pictures
  const THINK = /(^|\s)(ليه|لماذا|ازاي|كيف|رايك|تنصح|تقترح|اقترح|حلل|تحليل|قارن|اشرح|فسر|لخص|اكتب|اكتبلي|صيغ|ترجم|ولد|صمم|ارسم|فكره|افكار|كابشن|بوست|اعلان|why|how|write|explain|analy[sz]e)(\s|$)/;
  const short = (t, n) => words(t).length <= n;
  function pageOf(t, pages) {
    const ids = new Set((pages || []).map((p) => p.id)); let best = null;
    for (const p of pages || []) { const n = norm(p.label); if (n && (' ' + t + ' ').includes(' ' + n + ' ') && (!best || n.length > best.len)) best = { id: p.id, len: n.length }; }
    for (const id of Object.keys(PAGE_WORDS)) { if (pages && !ids.has(id)) continue; for (const w of PAGE_WORDS[id]) if ((' ' + t + ' ').includes(' ' + w + ' ') && (!best || w.length > best.len)) best = { id, len: w.length }; }
    return best ? best.id : '';
  }

  // the old commands speak of «مورد»: today's word is read as it
  const oldWords = (s) => String(s).replace(/المبتكرين/g, 'الموردين').replace(/مبتكرين/g, 'موردين').replace(/المبتكر/g, 'المورد').replace(/مبتكر/g, 'مورد');
  const put = (text, from, to, name) => { const w = String(text).trim().split(/\s+/); return w.slice(0, from).concat([name], w.slice(to)).join(' '); };

  // the words an orders filter accounts for: the ask itself, «أوردر», the states, the maker and the small words between them
  const FILL = ['كام', 'عدد', 'كل', 'اللي', 'الي', 'في', 'فيه', 'من', 'على', 'علي', 'عند', 'عندي', 'عندنا', 'لي', 'ليا', 'هل', 'يا', 'بس', 'دلوقتي', 'حاليا', 'عايز', 'عاوز', 'اشوف', 'لسه', 'و', 'او', 'هي', 'هو', 'ايه', 'حاله', 'بحاله', 'حالتها', 'حالته'];
  const STATE = ['متاخر', 'متاخره', 'متاخرين', 'قابل', 'قابله', 'للتاخير', 'جاري', 'التنفيذ', 'قيد', 'الانتظار', 'جاهز', 'جاهزه', 'للشحن', 'الشحن', 'ملغي', 'ملغيه', 'ملغيات', 'مكتمل', 'مكتمله', 'استرجاع', 'فشل', 'فاشل'];
  function extra(text, cmd, vendors) {
    const maker = cmd.filter && cmd.filter.vendor ? words(cmd.filter.vendor) : [];
    return words(String(text).replace(/[؟?!.,،]/g, ' ')).filter((w) => !(OPEN.test(' ' + w + ' ') || /^ال?اوردر/.test(w) || /^(و|ب|ل)?ال?اوردر/.test(w) || FILL.includes(w) || STATE.includes(w) || STATE.includes(w.replace(/^ال/, '')) || MARK.includes(w) || maker.includes(w))).length;
  }

  // ---- a list filtered by words (the owner 22 Nov — «الفلتر بالكلام علي الداتا عيزو يبقا من ضمن السيستم»): «اعرض المبتكرين الموقوفين»,
  // «طلبات الفريق العاجلة», «المنتجات المسودة» — the list by the word people call it, the rest of the words for its own filter
  // (the page matches them on the filter's choices; what is no choice is searched for in the table). The orders keep their own.
  const LISTS = [
    { list: 'makers', page: 'vendors', hash: 'makers', tab: 'سجل المبتكرين', name: 'المبتكرين', en: 'Makers', words: ['مبتكر', 'مبتكرين', 'مورد', 'موردين', 'maker', 'makers'] },
    { list: 'products', page: 'products', hash: 'products-records', tab: '', name: 'المنتجات', en: 'Products', words: ['منتجات', 'products'] },
    { list: 'tickets', page: 'tickets', hash: 'tickets', tab: 'السجل', name: 'طلبات الفريق', en: 'Team requests', words: ['طلب', 'طلبات', 'request', 'requests'] },
    { list: 'expenses', page: 'accounts', hash: 'expenses', tab: '', name: 'المصروفات', en: 'Expenses', words: ['مصروف', 'مصروفات', 'مصاريف', 'expense', 'expenses'] },
    { list: 'inventory', page: 'inventory', hash: 'inventory', tab: 'سجل المخزون', name: 'المخزن', en: 'Inventory', words: ['مخزن', 'مخزون', 'قطع', 'قطعه', 'inventory', 'items', 'stock'] },
    { list: 'team', page: 'hr', hash: 'hr-team', tab: '', name: 'الفريق', en: 'The team', words: ['موظفين', 'فريق', 'اعضاء', 'team', 'members', 'staff'] },
    { list: 'customers', page: 'cs', hash: 'cs-customers', tab: '', name: 'العملاء', en: 'Customers', words: ['عميل', 'عملاء', 'customer', 'customers'] },
  ];
  const bare = (w) => String(w).replace(/^(و|ب|ل|لل)?ال/, '').replace(/^لل/, '');
  // a word to its stem: the article and a joined «و / ب / ل» off, then the plural and gender endings (three letters stay at least)
  const stem = (w) => { let x = bare(w).replace(/ئ/g, 'ي').replace(/ؤ/g, 'و').replace(/ء/g, ''); if (/^[a-z]/.test(x)) return x.length > 3 ? x.replace(/(es|s)$/, '') : x; for (const e of ['ين', 'ون', 'ات', 'يه', 'ه', 'ي', 'ا']) if (x.length - e.length >= 3 && x.endsWith(e)) { x = x.slice(0, -e.length); break; } return x; };
  const NOT_CRITERIA = ['صفحه', 'سجل', 'قايمه', 'قائمه', 'تاب', 'جدول', 'حسابات', 'تقارير', 'تقرير', 'اللي', 'بتاع', 'بتاعه', 'بتوع', 'بتاعت', 'نوع', 'نوعها', 'حالتهم', 'the', 'of', 'with', 'that', 'are', 'is', 'in', 'all', 'me', 'page', 'list'];
  function listAsk(t, pages, raw) {
    const ws = words(t.replace(/[؟?!.,،]/g, ' ')); const rw = String(raw || '').replace(/[؟?!.,،]/g, ' ').trim().split(/\s+/); const asSaid = (i) => (rw.length === ws.length ? rw[i] : ws[i]); /* the words as the member wrote them (the table's search reads them) */ const ids = pages ? new Set(pages.map((p) => p.id)) : null; let L = null; let at = -1;
    ws.forEach((w, i) => { if (L) return; const b = bare(w); const hit = LISTS.find((x) => x.words.includes(b) && (!ids || ids.has(x.page))); if (hit) { L = hit; at = i; } });
    // not a list to show: an order to write («سجل …»), a number said (an amount, an order), or — with no «اعرض» / «فلتر» — a sentence
    // that does not open on the list itself («وزّع المهام على الفريق» is not «الفريق الغايبين»)
    if (!L || /\d/.test(t) || /(^|\s)(سجل|سجلي|ضيف|اضف|اخصم|ادفع|حول|امسح|احذف|عدل|غير|add|record|delete|edit)(\s|$)/.test(t)) return null;
    if (at !== 0 && !OPEN.test(' ' + t + ' ') && !/(^|\s)(فلتر|فلترلي|filter)(\s|$)/.test(t)) return null;
    // «طلبات الفريق»: the list's own second word is not a criterion
    const own = L.list === 'tickets' ? ['فريق', 'team'] : L.list === 'team' ? ['عمل', 'شغل'] : [];
    const crit = ws.map((w, i) => [w, i]).filter(([w, i]) => i !== at && !OPEN.test(' ' + w + ' ') && !FILL.includes(w) && !NOT_CRITERIA.includes(bare(w)) && !own.includes(bare(w)) && !L.words.includes(bare(w)) && !/^(فلتر|فلترلي|filter|find|list)$/.test(w) && bare(w).length > 1).map(([, i]) => asSaid(i));
    return crit.length ? { type: 'listFilter', list: L.list, page: L.page, hash: L.hash, tab: L.tab, name: L.name, en: L.en, words: crit } : null;
  }
  // The words people say for a choice the filter names otherwise
  const SAID = { موقوف: 'غير نشط', واقف: 'غير نشط', متوقف: 'غير نشط', شغال: 'نشط', خلص: 'نفد', خلصان: 'نفد', ناقص: 'قليل', زعلان: 'متضايق', مبسوط: 'سعيد', inactive: 'غير نشط', stopped: 'غير نشط' };
  /** The filter's choices the words name. options: [{ label, group }] → { picks: [index], rest: [the words no choice took] }.
   *  A choice is named when every word of its label is said (by stem); the longer label wins the words it shares («غير نشط» over «نشط»). */
  function pickOptions(said, options) {
    const same = (a, b) => a === b || (a.length >= 3 && b.length >= 3 && (a.startsWith(b) || b.startsWith(a)) && Math.abs(a.length - b.length) <= 2);
    const ws = (said || []).map((w) => norm(w)).filter(Boolean); const sw = ws.map(stem); const extra = []; // a said word may stand for a whole label
    ws.forEach((w) => { const k = Object.keys(SAID).find((x) => same(stem(w), x)); if (k) extra.push({ w, label: norm(SAID[k]) }); });
    const cand = [];
    (options || []).forEach((o, i) => { const lab = norm(String(o.label || '').replace(/\(.*?\)/g, ' ').replace(/[—\-·|]/g, ' ')); const lw = words(lab).filter((x) => !['في', 'من', 'علي', 'على', 'the', 'of', 'in'].includes(x)).map(stem).filter((x) => x.length > 1); if (!lw.length || lw.length > 4) return;
      const viaAlt = extra.find((x) => x.label === lab); if (viaAlt) { cand.push({ i, used: [ws.indexOf(viaAlt.w)], n: lw.length + 1 }); return; }
      const used = []; for (const l of lw) { const k = sw.findIndex((x, j) => !used.includes(j) && same(x, l)); if (k < 0) return; used.push(k); }
      cand.push({ i, used, n: lw.length }); });
    cand.sort((a, b) => b.n - a.n); const taken = new Set(); const picks = [];
    for (const c of cand) { if (c.used.every((j) => taken.has(j))) continue; picks.push(c.i); c.used.forEach((j) => taken.add(j)); }
    const said0 = (said || []).filter((w) => norm(w)); return { picks: picks.sort((a, b) => a - b), rest: said0.filter((w, j) => !taken.has(j)) };
  }

  // ---- read-outs (the owner 22 Nov — «لو طلبت حساب مبتكر منتج او موظف او تقرير معين»): the system says the numbers it holds, in the chat —
  // a maker's account by his name, a period's sales / expenses / orders / summary, one product, one member. The page reads them
  // from its own data; a why or an opinion about them stays a model's work (THINK above).
  const PERIODS = [['yesterday', /(^|\s)(امبارح|yesterday)(\s|$)/], ['lastWeek', /(الاسبوع اللي فات|الاسبوع الماضي|last week)/], ['thisWeek', /(الاسبوع ده|هذا الاسبوع|الاسبوع الحالي|this week)/],
    ['lastMonth', /(الشهر اللي فات|الشهر الماضي|last month)/], ['thisMonth', /(الشهر ده|هذا الشهر|الشهر الحالي|this month)/], ['last7', /(اخر 7 ايام|اخر سبع ايام|last 7 days)/], ['last30', /(اخر 30 يوم|last 30 days)/],
    ['today', /(^|\s)(النهارده|انهارده|اليوم|today)(\s|$)/]];
  const WHAT = [['sales', /(^|\s)(ال)?(مبيعات|sales|revenue)(\s|$)/], ['expenses', /(^|\s)(ال)?(مصروفات|مصاريف|expenses)(\s|$)/], ['orders', /(^|\s)(ال)?(اوردر|اوردرات|orders)(\s|$)/], ['summary', /(^|\s)(ال)?(ملخص|تقرير|summary|report)(\s|$)/]];
  const ACCOUNT = /(^|\s)(حساب|حسابه|رصيد|رصيده|كشف|صافي|الصافي|مستحقات|عليه|ليه|balance|account|statement|owes?)(\s|$)/;
  const ONE = { product: /^(ال)?(منتج|product)$|^(سعر|بكام|price)$/, member: /^(ال)?(موظف|موظفه|عضو|employee|member)$|^(بيانات|ملف|profile)$/ };
  const WRITE = /(^|\s)(سجل|سجلي|ضيف|اضف|اخصم|ادفع|حول|امسح|احذف|عدل|غير|add|record|delete|edit|change)(\s|$)/;
  function readAsk(t, raw, nm) {
    if (WRITE.test(t)) return null;
    const ws = words(t.replace(/[؟?!.,،]/g, ' ')); if (!ws.length || ws.length > 8) return null;
    if (nm && nm.hit && ACCOUNT.test(t) && !/\d/.test(t.replace(norm(nm.hit), ' '))) return { type: 'readMaker', vendor: nm.hit };
    const per = PERIODS.find((x) => x[1].test(t)); const what = WHAT.find((x) => x[1].test(' ' + t + ' '));
    if (per && what && !STATE.some((w) => ws.includes(w) || ws.includes('ال' + w))) return { type: 'readPeriod', what: what[0], preset: per[0] };
    // one product / one member: the word that names the kind first, then what to look for — as it was written
    const rw = String(raw || '').replace(/[؟?!.,،]/g, ' ').trim().split(/\s+/); const said = (i) => (rw.length === ws.length ? rw[i] : ws[i]);
    for (const kind of ['product', 'member']) { const at = ws.findIndex((w) => ONE[kind].test(w)); if (at < 0 || at > 1) continue;
      const q = ws.map((w, i) => [w, i]).filter(([w, i]) => i !== at && !OPEN.test(' ' + w + ' ') && !FILL.includes(w) && !ONE[kind].test(w) && !/^(ال)?(مبتكر|موظف|منتج)$/.test(w)).map(([, i]) => said(i));
      if (q.length && q.length <= 5) return { type: kind === 'product' ? 'readProduct' : 'readMember', q: q.join(' ') }; }
    return null;
  }

  function understand(text, ctx) {
    const raw = String(text == null ? '' : text).trim(); const t = norm(raw); if (!t) return { type: 'unknown' };
    const c = ctx || {}; const vendors = c.vendors || [];
    if (THINK.test(' ' + t + ' ')) return { type: 'unknown' };
    // a maker's name said by its sound or with a slip: the request is read again with the name as the system writes it
    let said = raw; const nm = findName(raw, vendors);
    if (!nm.hit && nm.others.length) return { type: 'choose', what: 'vendor', question: 'تقصد أنهي مبتكر؟', options: nm.others, texts: nm.others.map((n) => put(raw, nm.from, nm.to, n)) };
    if (nm.hit && !norm(raw).includes(norm(nm.hit))) said = put(raw, nm.from, nm.to, nm.hit);
    const cmd = C.parseCommand(oldWords(said), Object.assign({}, c, { vendors }));
    if (cmd.type === 'addExpense' && !cmd.category && /(^|\s)(ال)?مصروفات(\s|$)/.test(t)) { cmd.category = 'المصروفات'; cmd.missing = (cmd.missing || []).filter((k) => k !== 'category'); } // «سحب مصروفات 1500»: the general kind
    // a filter is the whole request only: words it does not account for («حساب فلان وعدد …») mean more was asked than it does
    if (cmd.type === 'ordersFilter' && !cmd.filter.q && extra(said, cmd, vendors) > 1) return { type: 'unknown' };
    const open = OPEN.test(' ' + t + ' ');
    if (cmd.type === 'navigate' && !(open || short(t, 3))) return { type: 'unknown' }; // a page's name inside a longer question is not «open it»
    if (cmd.type === 'setRange' && !(open || short(t, 5) || /فتره|الفتره/.test(t))) return { type: 'unknown' };
    // a list of a page with words for its filter — never the orders (their own filter), and only as an ask to show («اعرض …»), to filter, or a short one;
    // it goes before a bare «open the page» the old commands read in the same words («اعرض المبتكرين الموقوفين» is not «حسابات المبتكرين»)
    // a read-out of what the system holds goes before a bare page or period («مبيعات الشهر ده» is the number, «الشهر ده» is the period)
    if (['unknown', 'navigate', 'setRange'].includes(cmd.type) || (cmd.type === 'ordersFilter' && cmd.filter && Object.keys(cmd.filter).join() === 'vendor' && ACCOUNT.test(t))) { const rd = readAsk(t, raw, nm); if (rd) return rd; }
    const la = (cmd.type === 'unknown' || cmd.type === 'navigate') && !/(^|\s)(و|ب|ل)?ال?اوردر/.test(t) && (open || short(t, 5) || /(^|\s)(فلتر|فلترلي|filter)(\s|$)/.test(t)) ? listAsk(t, c.pages, raw) : null;
    if (la) return la;
    if (cmd.type !== 'unknown' && !(cmd.type === 'navigate' && cmd.page === 'orders' && pageOf(t, c.pages) && pageOf(t, c.pages) !== 'orders')) return nm.hit ? Object.assign({}, cmd, { heard: nm.hit }) : cmd;
    const page = pageOf(t, c.pages);
    if (page && (open || short(t, 3))) return { type: 'goPage', page };
    return { type: 'unknown' };
  }

  // what to try when the member says no to an outside model
  const EXAMPLES = ['افتح المخزن', 'اعرض الأوردرات المتأخرة', 'اعرض المبتكرين الموقوفين', 'مبيعات الشهر ده', 'حساب المبتكر ‹الاسم›', 'أوردرات المبتكر ‹الاسم› جاري التنفيذ', 'سجل سحب مرتبات 5000', 'رتب المبتكرين بالعربون'];
  /** A model's work, never the system's: a why, an opinion, writing, a picture. */
  const thinks = (text) => THINK.test(' ' + norm(text) + ' ');
  return Object.freeze({ understand, findName, skel, norm, thinks, pickOptions, LISTS, EXAMPLES });
});
