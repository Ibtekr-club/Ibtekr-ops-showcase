// The public web demo (npm run demo:web → dist/demo-web): loaded before shim.js and only in that build. It turns the demo flag on
// (window.IB_DEMO — the app's demo-only behaviour checks it), asks which business model to open (Marketplace / Single store),
// keeps every change in this browser until «Reset» (each write the page sends is recorded and replayed on the next open, by boot.js),
// draws the fixed banner, and says so when the system would have reached an outside service (courier, Meta, e-mail).
window.IB_DEMO = true;
(function () {
  'use strict';
  var KEY_MODE = 'ib.demo.mode', KEY_LOG = 'ib.demo.log', MAX_BODY = 300000, MAX_LOG = 4000000;
  var get = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var set = function (k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); return true; } catch (e) { return false; } };
  var MODES = { marketplace: 'Marketplace', single: 'Single store' };
  var mode = MODES[get(KEY_MODE)] ? get(KEY_MODE) : null;
  var log = []; try { log = JSON.parse(get(KEY_LOG) || '[]'); if (!Array.isArray(log)) log = []; } catch (e) { log = []; }
  var replaying = false;

  var css = document.createElement('style');
  css.textContent = [
    'html.ib-demo{overflow:hidden}',
    'html.ib-demo body{margin:0;margin-top:40px;height:calc(100vh - 40px);height:calc(100dvh - 40px);overflow-y:auto}',
    '#demo-bar{position:fixed;top:0;left:0;right:0;height:40px;z-index:100000;display:flex;align-items:center;gap:10px;padding:0 12px;background:#005642;color:#fff7ef;font:600 13px Cairo,system-ui,sans-serif;direction:ltr}',
    '#demo-bar b{font-weight:700;white-space:nowrap}#demo-bar .dm-sp{flex:1}',
    '#demo-bar .dm-sw{display:flex;border:1px solid #fff7ef55;border-radius:999px;overflow:hidden}',
    '#demo-bar button{all:unset;box-sizing:border-box;font:600 12px Cairo,system-ui,sans-serif;cursor:pointer;padding:5px 12px;background:transparent;color:#fff7ef;line-height:18px;white-space:nowrap}',
    '#demo-bar button:focus-visible{outline:2px solid #fff7ef;outline-offset:1px}',
    '#demo-bar .dm-sw button[aria-pressed=true]{background:#fff7ef;color:#005642}',
    '#demo-bar .dm-rs{border:1px solid #fff7ef88;border-radius:999px}',
    '@media (max-width:560px){#demo-bar .dm-lb{display:none}#demo-bar button{padding:5px 9px}}',
    '#demo-entry{position:fixed;inset:0;z-index:100001;overflow:auto;background:#f6f1e7;color:#1d2a26;font:15px Cairo,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;padding:24px 16px}',
    '#demo-entry .wrap{max-width:860px;width:100%;text-align:center}',
    '#demo-entry h1{font-size:28px;margin:0 0 6px;color:#005642}#demo-entry p.sub{margin:0 0 24px;color:#4b5a55}',
    '#demo-entry .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;text-align:start}',
    '#demo-entry button.card{all:unset;box-sizing:border-box;cursor:pointer;background:#fff;border-radius:14px;padding:20px;box-shadow:0 0 6px rgba(0,0,0,.25);border:2px solid transparent}',
    '#demo-entry button.card:hover,#demo-entry button.card:focus-visible{border-color:#005642}',
    '#demo-entry .card h2{margin:0 0 6px;font-size:20px;color:#005642}#demo-entry .card ul{margin:10px 0 14px;padding-inline-start:18px;color:#4b5a55;font-size:14px}',
    '#demo-entry .card .go{display:inline-block;background:#005642;color:#fff7ef;border-radius:999px;padding:6px 16px;font-weight:700;font-size:14px}',
    '#demo-entry .note{margin-top:18px;font-size:12px;color:#6b7a75}',
    '#demo-toast{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:100002;max-width:min(92vw,520px);background:#1d2a26;color:#fff7ef;border-radius:12px;padding:10px 16px;font:600 14px Cairo,system-ui,sans-serif;direction:rtl;box-shadow:0 4px 18px rgba(0,0,0,.25);opacity:0;transition:opacity .2s;pointer-events:none}',
    '#demo-toast.on{opacity:1}',
  ].join('\n');
  document.head.appendChild(css);

  function el(tag, attrs, kids) {
    var n = document.createElement(tag); Object.keys(attrs || {}).forEach(function (k) { if (k === 'text') n.textContent = attrs[k]; else n.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (c) { n.appendChild(c); }); return n;
  }
  function choose(m) { set(KEY_MODE, m); set(KEY_LOG, null); location.reload(); }
  function reset() { set(KEY_LOG, null); location.reload(); }

  // --- the entry screen: one card per business model
  function entry() {
    var card = function (m, title, lines, cta) {
      var b = el('button', { class: 'card', type: 'button', 'data-demo-mode': m }, [el('h2', { text: title }), el('ul', null, lines.map(function (t) { return el('li', { text: t }); })), el('span', { class: 'go', text: cta })]);
      b.addEventListener('click', function () { choose(m); }); return b;
    };
    var box = el('div', { id: 'demo-entry', dir: 'ltr' }, [el('div', { class: 'wrap' }, [
      el('h1', { text: 'Ibtekr Ops — Live demo' }),
      el('p', { class: 'sub', text: 'An operations system for a handmade marketplace. Pick a business model — the interface is in Arabic, the data is made up.' }),
      el('div', { class: 'cards' }, [
        card('marketplace', 'Marketplace', ['Many makers, each with a commission', 'Orders split into sub-orders per maker', 'Maker statements and payouts'], 'Open the marketplace'),
        card('single', 'Single-brand store', ['One made-up brand: Decoro', 'No makers, no sub-orders', 'The same orders, products and customer service'], 'Open Decoro'),
      ]),
      el('p', { class: 'note', text: 'Everything you change stays in this browser until you press Reset.' }),
    ])]);
    document.body.appendChild(box);
  }

  // --- the fixed banner
  function banner() {
    var sw = el('div', { class: 'dm-sw', role: 'group', 'aria-label': 'Business model' }, Object.keys(MODES).map(function (m) {
      var b = el('button', { type: 'button', 'data-demo-switch': m, 'aria-pressed': String(m === mode), text: MODES[m] });
      b.addEventListener('click', function () { if (m !== mode) choose(m); }); return b;
    }));
    var rs = el('button', { type: 'button', class: 'dm-rs', 'data-demo-reset': '', text: 'Reset' });
    rs.addEventListener('click', reset);
    document.body.appendChild(el('div', { id: 'demo-bar', role: 'region', 'aria-label': 'Demo' }, [el('b', { text: 'Demo mode' }), el('span', { class: 'dm-lb', text: '— sample data' }), el('span', { class: 'dm-sp' }), sw, rs]));
    document.documentElement.classList.add('ib-demo');
  }

  // --- «this would have gone out»: courier (Bosta), Meta (Messenger / Instagram / WhatsApp / publishing / ads) and e-mail
  var toastEl = null, toastT = 0;
  function toast(msg) {
    if (!toastEl) { toastEl = el('div', { id: 'demo-toast', role: 'status' }); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('on'); }, 3600);
  }
  var OUT_FN = /\/functions\/v1\/(share-mail|cs-channel|cs-whatsapp|cs-wa|mkt-publish|mkt-ads)\b/;
  var OUT_ACTIONS = /^(send|comment_private|comment_hide|publish_now|campaign_set|decide|test_send|member_invite|campaign_tick|bosta_send|bosta_pickup|bosta_cod|bosta_awb|withdraw_create|withdraw_approve|withdraw_reject)$/;
  function outbound(url, body) {
    var action = null; try { action = body && JSON.parse(body).action; } catch (e) { action = null; }
    if (/\/functions\/v1\/share-mail\b/.test(url)) return true;
    if (OUT_FN.test(url) && action && OUT_ACTIONS.test(action)) return true;
    if (/\/functions\/v1\/(woo-sync|team-admin)\b/.test(url) && action && /^(bosta_|member_invite)/.test(action)) return true;
    return false;
  }

  // --- every write the page sends, kept for the next open (boot.js replays them before the page starts)
  window.__ibDemoAfter = function (method, url, body, headers) {
    if (replaying || method === 'GET' || method === 'HEAD' || /\/auth\/v1\//.test(url)) return;
    if (outbound(url, body)) toast('ده ديمو — في السيستم الحقيقي هيتبعت إشعار');
    if (body && body.length > MAX_BODY) return;
    var keep = {}; ['content-type', 'prefer', 'accept', 'content-profile', 'accept-profile', 'x-client-info'].forEach(function (k) { if (headers[k]) keep[k] = headers[k]; });
    log.push({ m: method, u: url, b: body, h: keep });
    var s = JSON.stringify(log); while (s.length > MAX_LOG && log.length) { log.shift(); s = JSON.stringify(log); }
    set(KEY_LOG, s);
  };

  // --- the AI: a short «thinking» wait on every AI call (the stand-in answers at once), and the header assistant's ready replies
  window.__ibDemoDelay = function (method, url) { return method === 'POST' && /\/functions\/v1\/(ai-content|ai-images)\b/.test(url) ? 1400 : 0; };
  // the replies read the demo's own data (window.__ibDemo.mock), so the numbers match the pages
  var fmt = function (n) { return Math.round(n).toLocaleString('en-US'); };
  function facts() {
    var m = (window.__ibDemo && window.__ibDemo.mock) || {}; var os = (m.orders || []).filter(function (o) { return !o.deleted_at; });
    var by = function (st) { return os.filter(function (o) { return o.status === st; }); };
    var done = by('مكتمل'); var doneSum = done.reduce(function (t, o) { return t + Number(o.total || 0); }, 0);
    var work = by('جاري التنفيذ'); var workSum = work.reduce(function (t, o) { return t + Number(o.total || 0); }, 0);
    var late = work.filter(function (o) { return o.confirm_at && (Date.now() - Date.parse(o.confirm_at)) / 864e5 > 12; });
    var acc = m.acc || {}; var bal = (acc.dokan_balances || []).reduce(function (t, b) { return t + Number(b.balance || 0); }, 0);
    var pend = (acc.dokan_withdrawals || []).filter(function (w) { return w.status === 'pending'; });
    var vname = function (id) { var v = (m.vendors || []).filter(function (x) { return x.id === id; })[0]; return v ? v.name : ''; };
    var conv = ((m.cs || {}).conversations || []).filter(function (c) { return c.status === 'مستنية ردنا' || c.status === 'جديدة'; });
    return { os: os, done: done, doneSum: doneSum, work: work, workSum: workSum, late: late, bal: bal, pend: pend, vname: vname, conv: conv, newO: by('قيد الانتظار'), ship: by('قيد الشحن') };
  }
  function reply(q) {
    var f = facts();
    if (/(متأخر|تأخير|late)/.test(q)) return f.late.length ? 'عندك ' + f.late.length + ' أوردر متأخر: ' + f.late.map(function (o) { return 'IB-' + o.id; }).join('، ') + '. أقترح تكلّم المبتكر وتحدّث العميل بميعاد جديد — والفلتر «متأخرة» في الأوردرات بيجيبهم.' : 'مفيش أوردرات متأخرة دلوقتي 👌';
    if (/(مبيعات|بيع|sales|إيراد)/.test(q)) return 'المبيعات المكتملة ' + fmt(f.doneSum) + ' ج.م من ' + f.done.length + ' أوردر، ومتوسط الأوردر ' + fmt(f.done.length ? f.doneSum / f.done.length : 0) + ' ج.م. وفيه ' + f.work.length + ' أوردر جاري تنفيذهم بإجمالي ' + fmt(f.workSum) + ' ج.م.';
    if (/(مبتكر|رصيد|سحب|maker)/.test(q)) return f.bal || f.pend.length ? 'إجمالي أرصدة المبتكرين على Dokan ' + fmt(f.bal) + ' ج.م' + (f.pend.length ? '، وفيه ' + f.pend.length + ' طلب سحب مستني موافقتك (' + f.pend.map(function (w) { return f.vname(w.vendor_id) + ' — ' + fmt(w.amount) + ' ج.م'; }).join('، ') + ').' : '.') : 'المتجر ده بيبيع براند واحد، فمفيش مبتكرين ولا أرصدة.';
    if (/(عميل|عملاء|رسايل|واتساب)/.test(q)) return 'عندك ' + f.conv.length + ' محادثة مستنية رد في خدمة العملاء. افتح «الرسايل» والرد المقترح هيبقى جاهز في الخانة.';
    return 'ملخص النهارده: ' + f.os.length + ' أوردر في السيستم — ' + f.newO.length + ' جديد مستني التأكيد، ' + f.work.length + ' جاري التنفيذ، ' + f.ship.length + ' في الشحن، و' + f.late.length + ' متأخر. ' + (f.conv.length ? 'وفيه ' + f.conv.length + ' رسالة عملاء مستنية رد. ' : '') + 'تحب أبدأ بإيه؟';
  }
  window.__ibDemoAnswer = function (method, url, body) {
    if (method !== 'POST' || !/\/functions\/v1\/ai-content\b/.test(url) || !body) return null;
    var b; try { b = JSON.parse(body); } catch (e) { return null; }
    if (!b || b.action !== 'assistant' || b.mode === 'filter') return null;
    var turns = Array.isArray(b.turns) ? b.turns : []; var q = String((turns[turns.length - 1] || {}).text || '');
    return { result: 'ok', text: reply(q), actions: [], tools: [], report: [], model: 'demo', cost_usd: 0, run_id: Date.now() };
  };

  window.__ibDemoWeb = {
    mode: mode,
    log: function () { return log.slice(); },
    replaying: function (on) { replaying = !!on; },
  };

  // --- single store: nothing about makers shows (the owner 20 Nov: «شيل اي حاجة ليها علاقة بالمبتكرين في وضع ال single store»).
  // The app's own single-store mode hides the makers' page and columns; the rest (tabs, cards, columns, rows, explanations that
  // speak of makers, Dokan or sub-orders) is hidden here, in the demo only: every visible text that names them hides the smallest
  // unit around it — a tab, an option, a table column, a row, a card whose title it is, or the line itself.
  var MAKER = /مبتكر|Dokan|دوكان|(?:أوردر|الأوردر|أوردرات|الأوردرات)\s*(?:ال)?فرعي/;
  var KEEP = '#demo-bar, #demo-entry, #demo-toast, .ai-panel, .sidebar, .bottom-nav, script, style, title';
  var BIG = /^(BODY|HTML|MAIN)$/;
  var hide = function (n) { if (n && !BIG.test(n.tagName) && n.id !== 'root' && n.style.display !== 'none') { n.setAttribute('data-demo-hidden', ''); n.style.display = 'none'; } };
  var short = function (n, max) { return (n.textContent || '').trim().length <= max; };
  function unitOf(el) {
    var tab = el.closest('[role="tab"], .tab, .chip, .seg-btn, [data-tab], [data-dtab]'); if (tab && short(tab, 60)) return tab;
    var opt = el.closest('option'); if (opt) return opt;
    var row = el.closest('tr, li, .set-row, .dn-item, .cv, .kv, .info-row, .row-item'); if (row && short(row, 220) && !row.querySelector('input:focus, textarea:focus')) return row;
    var head = el.closest('h1, h2, h3, h4, .kpi-label, .t-h3, .card-title, .sec-title, .cat-top, [class*="-title"], [class*="-hd"]');
    if (head) { var card = head.closest('.acc-ov-tile, .kpi, .card, section'); if (card && !card.querySelector('main') && !card.contains(document.querySelector('#root main > *:only-child'))) return card; }
    var u = el; while (u.parentElement && !BIG.test(u.parentElement.tagName) && short(u.parentElement, 60) && !u.parentElement.matches(KEEP)) u = u.parentElement;
    return u.querySelector('input, select, textarea, table, button') && !short(u, 60) ? null : u;
  }
  function hideColumn(th) {
    var tr = th.parentElement; var i = Array.prototype.indexOf.call(tr.children, th); var table = th.closest('table'); if (!table || i < 0) return;
    table.querySelectorAll('tr').forEach(function (r) { var c = r.children[i]; if (c) hide(c); });
  }
  function sweep(root) {
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); var hits = []; var t;
    while ((t = tw.nextNode())) if (MAKER.test(t.textContent) && t.parentElement && !t.parentElement.closest(KEEP) && !t.parentElement.closest('[data-demo-hidden]')) hits.push(t.parentElement);
    hits.forEach(function (el) {
      if (el.closest('select') && !el.closest('option')) return;
      var th = el.closest('th'); if (th) { hideColumn(th); return; }
      var u = unitOf(el); if (u) hide(u);
    });
    root.querySelectorAll('*').forEach(function (e) { if (e.shadowRoot) sweep(e.shadowRoot); });
  }
  if (mode === 'single') {
    var run = function () {
      try { sweep(document.body); } catch (e) { /* a page in the middle of drawing */ }
      // the brand line under the logo («بيت لكل مبتكر») is about makers too
      document.querySelectorAll('.sidebar *, .bottom-nav *').forEach(function (n) { if (n.children.length === 0 && MAKER.test(n.textContent)) hide(n); });
    };
    new MutationObserver(function () { clearTimeout(run.t); run.t = setTimeout(run, 60); }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    setInterval(run, 700); // the orders page draws inside a shadow root the observer does not see
  }

  var start = function () { if (mode) banner(); else entry(); };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
