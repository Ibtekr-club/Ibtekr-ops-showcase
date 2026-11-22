// The public web demo (npm run demo:web → dist/demo-web): loaded before shim.js and only in that build. It turns the demo flag on
// (window.IB_DEMO — the app's demo-only behaviour checks it), asks which business model to open (Marketplace / Single store),
// keeps every change in this browser until «Reset» (each write the page sends is recorded and replayed on the next open, by boot.js),
// draws the fixed banner, and says so when the system would have reached an outside service (courier, Meta, e-mail).
window.IB_DEMO = true;
(function () {
  'use strict';
  var KEY_MODE = 'ib.demo.mode', KEY_LOG = 'ib.demo.log', KEY_LANG = 'ib.demo.lang', MAX_BODY = 300000, MAX_LOG = 4000000;
  var get = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var set = function (k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); return true; } catch (e) { return false; } };
  var MODES = { marketplace: 'Marketplace', single: 'Single store' };
  // a new build of the demo starts from its own data: changes a visitor saved on an older build are dropped (the model he picked stays)
  var BUILD = '8449c1a4fb', KEY_BUILD = 'ib.demo.build';
  if (get(KEY_BUILD) !== BUILD) { set(KEY_LOG, null); set(KEY_BUILD, BUILD); }
  var mode = MODES[get(KEY_MODE)] ? get(KEY_MODE) : null;
  // the language: Arabic as the system is, or English — the dictionary (en.js) and the layer that writes the page in English (i18n.js)
  // are loaded only for English, before anything of the app runs
  var lang = get(KEY_LANG) === 'en' ? 'en' : 'ar'; window.IB_LANG = lang;
  if (lang === 'en' && mode && document.readyState === 'loading') {
    var v = /^[0-9a-f]+$/.test(BUILD) ? '?v=' + BUILD : '';
    document.write('<script src="demo/en.js' + v + '"><\/script><script src="demo/i18n.js' + v + '"><\/script>');
  }
  var log = []; try { log = JSON.parse(get(KEY_LOG) || '[]'); if (!Array.isArray(log)) log = []; } catch (e) { log = []; }
  var replaying = false;

  var css = document.createElement('style'); css.id = 'ib-demo-style';
  css.textContent = [
    'html.ib-demo{overflow:hidden}',
    'html.ib-demo{--dm-h:40px}',
    'html.ib-demo body{margin:0;margin-top:var(--dm-h);height:calc(100vh - var(--dm-h));height:calc(100dvh - var(--dm-h));overflow-y:auto}',
    '#demo-bar{position:fixed;top:0;left:0;right:0;height:var(--dm-h);z-index:100000;display:flex;align-items:center;gap:10px;padding:0 12px;background:#005642;color:#fff7ef;font:600 13px Cairo,system-ui,sans-serif;direction:ltr}',
    '#demo-bar b{font-weight:700;white-space:nowrap}#demo-bar .dm-sp{flex:1}',
    '#demo-bar .dm-sw{display:flex;border:1px solid #fff7ef55;border-radius:999px;overflow:hidden}',
    '#demo-bar button{all:unset;box-sizing:border-box;font:600 12px Cairo,system-ui,sans-serif;cursor:pointer;padding:5px 12px;background:transparent;color:#fff7ef;line-height:18px;white-space:nowrap}',
    '#demo-bar button:focus-visible{outline:2px solid #fff7ef;outline-offset:1px}',
    '#demo-bar .dm-sw button[aria-pressed=true]{background:#fff7ef;color:#005642}',
    '#demo-bar .dm-rs{border:1px solid #fff7ef88;border-radius:999px}',
    '@media (max-width:560px){#demo-bar .dm-lb{display:none}#demo-bar button{padding:5px 9px}}',
    // a phone or a tablet (the owner 21 Nov): no «Demo» word, and the language and the model are each a drop-down — three quiet
    // controls on one line: language ▾ · model ▾ ········ Reset. The model's pills stay for a desktop.
    // The owner 22 Nov («تحول زرار اللغة في الديمو لدروب داون و تحطوا في الهيدر اليند شمال مكان كلمة ديمو مود و شيل الكلمة»): the language is
    // a drop-down at the bar's left end on every width, in the place of the words «Demo mode» — the switch under «الإعدادات» is gone.
    '#demo-bar .dm-dd{display:none;position:relative}',
    '#demo-bar .dm-dd[data-dd=lang]{display:block}',
    '#demo-bar .dm-lb{opacity:.85;font-weight:500;white-space:nowrap}',
    '#demo-bar .dm-dd>button{display:inline-flex;align-items:center;gap:6px;border:1px solid #fff7ef55;border-radius:999px;padding:5px 10px 5px 12px}',
    '#demo-bar .dm-dd>button::after{content:"";width:6px;height:6px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:translateY(-2px) rotate(45deg);opacity:.85}',
    '#demo-bar .dm-dd>button[aria-expanded=true]{background:#fff7ef;color:#005642}',
    '#demo-bar .dm-menu{position:absolute;top:calc(100% + 8px);left:0;min-width:max(100%,168px);display:flex;flex-direction:column;gap:2px;padding:6px;background:#fff7ef;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.28);z-index:2}',
    '#demo-bar .dm-menu[hidden]{display:none}',
    '#demo-bar .dm-menu button{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding:0 12px;border-radius:10px;color:#1d2a26;font-size:14px;font-weight:600}',
    '#demo-bar .dm-menu button[aria-checked=true]{background:#005642;color:#fff7ef}',
    '#demo-bar .dm-menu button[aria-checked=true]::after{content:"";width:6px;height:11px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg) translate(-2px,-2px)}',
    '@media (max-width:1023px){#demo-bar .dm-lb,#demo-bar>.dm-sw{display:none!important}#demo-bar .dm-dd{display:block}#demo-bar{gap:8px;padding:0 max(12px,env(safe-area-inset-right,0px)) 0 max(12px,env(safe-area-inset-left,0px))}#demo-bar button{position:relative}#demo-bar>button::after,#demo-bar .dm-dd>button::before{content:"";position:absolute;left:0;right:0;top:-8px;bottom:-8px}#demo-bar .dm-dd>button::before{transform:none;border:0;width:auto;height:auto;opacity:1}}',
    '@media (max-width:767px){html.ib-demo{--dm-h:44px}#demo-bar button{padding:6px 12px}#demo-toast{bottom:calc(64px + env(safe-area-inset-bottom,0px) + 14px)}}',
    /* the entry: three screens that say what the system is, then the choice of a business model. A column of the screen's
       own height (dvh — an iPhone's bars), a track that slides sideways one screen at a time, each screen scrolling down by
       itself when it is taller than the phone (its content centred with margin:auto, which never cuts the top off). */
    '#demo-entry{position:fixed;inset:0;z-index:100001;height:100vh;height:100dvh;overflow:hidden;display:flex;flex-direction:column;background:#f6f1e7;color:#1d2a26;font:15px/1.6 Cairo,system-ui,sans-serif;-webkit-text-size-adjust:100%;text-size-adjust:100%}',
    '#demo-entry *{box-sizing:border-box}#demo-entry button{font:inherit;-webkit-tap-highlight-color:transparent}',
    '#demo-entry svg{display:block;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
    '#demo-entry .de-top{flex:none;display:flex;align-items:center;gap:10px;padding:max(12px,env(safe-area-inset-top,0px)) max(20px,env(safe-area-inset-right,0px)) 6px max(20px,env(safe-area-inset-left,0px))}',
    '#demo-entry h1{display:flex;align-items:center;gap:10px;margin:0;font-size:17px;line-height:24px;font-weight:800;color:#005642;letter-spacing:.01em}',
    '#demo-entry .de-mark{position:relative;flex:none;width:24px;height:24px;border:4px solid #005642;border-radius:5px}#demo-entry .de-mark::after{content:"";position:absolute;top:-8px;right:-8px;width:8px;height:8px;border-radius:2px;background:#c39e57}',
    '#demo-entry .de-tag{font-size:12px;line-height:20px;font-weight:700;color:#005642;background:#dfece6;border-radius:999px;padding:1px 10px}',
    '#demo-entry .de-skip{all:unset;box-sizing:border-box;margin-inline-start:auto;cursor:pointer;min-height:40px;padding:0 14px;display:inline-flex;align-items:center;border-radius:999px;font-weight:700;font-size:14px;color:#005642}',
    '#demo-entry .de-skip:hover,#demo-entry .de-skip:focus-visible{background:#ebe3d0}',
    '#demo-entry .de-track{flex:1 1 auto;min-height:0;display:flex;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scrollbar-width:none;overscroll-behavior:contain}',
    '#demo-entry .de-track::-webkit-scrollbar{display:none}',
    '#demo-entry .de-slide{flex:0 0 100%;width:100%;min-width:0;scroll-snap-align:center;scroll-snap-stop:always;overflow-y:auto;overscroll-behavior-y:contain;display:flex;padding:10px 20px 16px}',
    '#demo-entry .de-in{margin:auto;width:100%;max-width:980px;display:grid;grid-template-columns:minmax(0,1fr);gap:22px;justify-items:center;text-align:center}',
    '#demo-entry .de-txt{display:grid;gap:10px;justify-items:center;max-width:520px}',
    '#demo-entry .de-k{font-size:12px;line-height:18px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#9a7733}',
    '#demo-entry h2{margin:0;font-size:27px;line-height:1.22;font-weight:800;color:#005642;text-wrap:balance}',
    '#demo-entry .de-p{margin:0;font-size:15px;line-height:1.65;color:#4b5a55;text-wrap:pretty}',
    '#demo-entry .de-art{width:100%;max-width:400px;background:#fffdf9;border-radius:24px;padding:16px;box-shadow:0 14px 34px rgba(0,86,66,.12),0 0 0 1px #e9dfca;text-align:start}',
    /* screen 1 — the modules */
    '#demo-entry .de-bar{display:flex;align-items:center;gap:8px;height:34px;padding:0 10px;border-radius:10px;background:#005642;color:#fff7ef;font-size:12px;font-weight:800;letter-spacing:.08em}',
    '#demo-entry .de-bar i{flex:1;height:18px;border-radius:999px;background:rgba(255,247,239,.16)}#demo-entry .de-bar b{width:18px;height:18px;border-radius:50%;background:#c39e57}',
    '#demo-entry .de-mods{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:10px}',
    '#demo-entry .de-mod{display:grid;justify-items:center;gap:5px;padding:10px 2px 8px;border-radius:14px;background:#f6f1e7;font-size:11px;line-height:14px;font-weight:700;color:#1d2a26;text-align:center}',
    '#demo-entry .de-mod span{display:grid;place-items:center;width:36px;height:36px;border-radius:11px;background:#005642;color:#fff7ef}#demo-entry .de-mod:nth-child(3n+2) span{background:#c39e57;color:#fff}#demo-entry .de-mod:nth-child(3n) span{background:#dfece6;color:#005642}',
    '#demo-entry .de-more{margin-top:10px;padding:8px 12px;border-radius:12px;border:1px dashed #d9cdb3;font-size:12px;line-height:18px;color:#4b5a55;text-align:center}',
    /* screen 2 — an order's way */
    '#demo-entry .de-node{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:14px;background:#f6f1e7;font-size:13px;line-height:18px;font-weight:700}',
    '#demo-entry .de-node small{display:block;font-size:11px;line-height:15px;font-weight:500;color:#5b6a65}',
    '#demo-entry .de-node>span:first-child{flex:none;display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#005642;color:#fff7ef}',
    '#demo-entry .de-node.gold>span:first-child{background:#c39e57;color:#fff}#demo-entry .de-node.soft>span:first-child{background:#dfece6;color:#005642}',
    '#demo-entry .de-fork{height:16px;width:52%;margin:0 auto;border:2px solid #d3c8ae;border-bottom:0;border-radius:12px 12px 0 0;position:relative;margin-top:10px}',
    '#demo-entry .de-fork::before{content:"";position:absolute;left:50%;top:-12px;height:10px;border-left:2px solid #d3c8ae}',
    '#demo-entry .de-join{height:16px;width:52%;margin:0 auto 10px;border:2px solid #d3c8ae;border-top:0;border-radius:0 0 12px 12px;position:relative}',
    '#demo-entry .de-join::after{content:"";position:absolute;left:50%;bottom:-12px;height:10px;border-left:2px solid #d3c8ae}',
    '#demo-entry .de-two{display:grid;grid-template-columns:1fr 1fr;gap:8px}#demo-entry .de-two .de-node{flex-direction:column;align-items:flex-start;gap:6px;padding:10px}',
    '#demo-entry .de-chip{display:inline-block;font-size:11px;line-height:18px;font-weight:700;border-radius:999px;padding:0 8px;background:#dfece6;color:#005642}#demo-entry .de-chip.g{background:#f3e6c8;color:#7a5c1e}',
    '#demo-entry .de-stem{height:10px;margin:0 auto;width:0;border-left:2px solid #d3c8ae}',
    /* screen 3 — what you can do */
    '#demo-entry .de-feats{display:grid;gap:8px}',
    '#demo-entry .de-toast{display:flex;align-items:center;gap:8px;margin-top:10px;padding:9px 12px;border-radius:12px;background:#005642;color:#fff7ef;font-size:12px;line-height:18px;font-weight:600}',
    '#demo-entry .de-toast span{flex:none;display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#c39e57;color:#fff}',
    /* the choice */
    '#demo-entry .de-pick{width:100%;max-width:760px;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:14px;text-align:start}',
    '#demo-entry .de-model{all:unset;box-sizing:border-box;cursor:pointer;min-width:0;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px 12px;align-items:center;align-content:start;background:#fffdf9;border-radius:20px;padding:16px;border:2px solid transparent;box-shadow:0 10px 26px rgba(0,86,66,.10),0 0 0 1px #e9dfca;transition:transform .15s,border-color .15s}',
    '#demo-entry .de-model:hover,#demo-entry .de-model:focus-visible{border-color:#005642}#demo-entry .de-model:active{transform:scale(.985)}',
    '#demo-entry .de-model h3{margin:0;font-size:19px;line-height:26px;font-weight:800;color:#005642}',
    '#demo-entry .de-dia{display:flex;align-items:center;gap:5px;height:44px;min-width:132px;padding:0 8px;border-radius:12px;background:#f6f1e7;color:#005642}#demo-entry .de-model .de-pts,#demo-entry .de-model .de-go{grid-column:1/-1}',
    '#demo-entry .de-dia .col{display:grid;gap:3px}#demo-entry .de-dia .dot{width:9px;height:9px;border-radius:50%;background:#c39e57}',
    '#demo-entry .de-dia .big{flex:none;display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:#005642;color:#fff7ef}',
    '#demo-entry .de-dia .ln{flex:1;height:0;border-top:2px dashed #cfc3a7}#demo-entry .de-dia .ln{min-width:12px}#demo-entry .de-dia .who{flex:none;display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#dfece6;color:#005642}',
    
    '#demo-entry .de-pts{display:flex;flex-wrap:wrap;gap:6px}#demo-entry .de-pts span{font-size:12px;line-height:20px;font-weight:600;color:#3d4c47;background:#f6f1e7;border-radius:999px;padding:2px 10px}',
    '#demo-entry .de-go{display:flex;align-items:center;justify-content:center;gap:8px;min-height:46px;padding:0 16px;border-radius:999px;background:#005642;color:#fff7ef;font-size:15px;font-weight:800;white-space:nowrap}',
    '#demo-entry .de-lang{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:10px;font-size:13px;font-weight:600;color:#4b5a55}',
    '#demo-entry .de-seg{display:inline-flex;padding:3px;border-radius:999px;background:#e9dfca}',
    '#demo-entry .de-seg button{all:unset;box-sizing:border-box;cursor:pointer;min-height:36px;min-width:84px;padding:0 14px;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;font-size:14px;font-weight:700;color:#4b5a55}',
    '#demo-entry .de-seg button[aria-pressed=true]{background:#005642;color:#fff7ef}',
    '#demo-entry .de-note{margin:0;font-size:12px;line-height:18px;color:#6b7a75}',
    /* the foot: where you are, and the way on */
    '#demo-entry .de-foot{flex:none;display:flex;align-items:center;gap:8px;padding:8px max(20px,env(safe-area-inset-right,0px)) max(14px,env(safe-area-inset-bottom,0px)) max(20px,env(safe-area-inset-left,0px))}',
    '#demo-entry .de-dots{display:flex;align-items:center;gap:6px}',
    '#demo-entry .de-dots button{all:unset;position:relative;cursor:pointer;width:8px;height:8px;background:#cdc2a8;border-radius:999px;transition:width .2s,background-color .2s}#demo-entry .de-dots button::after{content:"";position:absolute;inset:-14px -3px}',
    '#demo-entry .de-dots button[aria-current=true]{width:24px;background-color:#005642}',
    '#demo-entry .de-back{all:unset;box-sizing:border-box;cursor:pointer;min-height:44px;padding:0 12px;display:inline-flex;align-items:center;border-radius:999px;font-size:14px;font-weight:700;color:#4b5a55}',
    '#demo-entry .de-next{all:unset;box-sizing:border-box;cursor:pointer;margin-inline-start:auto;min-height:50px;padding:0 24px;display:inline-flex;align-items:center;gap:8px;border-radius:999px;background:#005642;color:#fff7ef;font-size:16px;font-weight:800;white-space:nowrap;box-shadow:0 8px 20px rgba(0,86,66,.25)}',
    '#demo-entry .de-next:active{transform:scale(.97)}#demo-entry .de-next:focus-visible,#demo-entry .de-skip:focus-visible,#demo-entry .de-back:focus-visible,#demo-entry .de-seg button:focus-visible{outline:2px solid #c39e57;outline-offset:2px}',
    '#demo-entry [hidden]{display:none!important}',
    /* each screen's picture and words come in as it is reached */
    '@media (prefers-reduced-motion:no-preference){#demo-entry .de-slide .de-art,#demo-entry .de-slide .de-txt,#demo-entry .de-slide .de-pick{opacity:0;transform:translateY(14px);transition:opacity .45s ease,transform .45s cubic-bezier(.2,.8,.2,1)}#demo-entry .de-slide .de-txt{transition-delay:.08s}#demo-entry .de-slide.on .de-art,#demo-entry .de-slide.on .de-txt,#demo-entry .de-slide.on .de-pick{opacity:1;transform:none}}',
    '@media (min-width:900px){#demo-entry .de-in.two{grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);align-items:center;gap:56px;text-align:start}#demo-entry .de-in.two .de-txt{justify-items:start;order:-1}#demo-entry .de-in.two .de-art{max-width:440px;justify-self:center}#demo-entry h2{font-size:40px}#demo-entry .de-p{font-size:17px}#demo-entry .de-top{padding-inline:40px;padding-top:20px}#demo-entry .de-foot{padding-inline:40px;padding-bottom:24px}#demo-entry .de-slide{padding-inline:40px}}',
    '@media (max-width:899px){#demo-entry .de-in.pick{gap:12px}#demo-entry .de-in.pick .de-txt{gap:4px}#demo-entry .de-in.pick .de-p{display:none}#demo-entry .de-in.pick h2{font-size:24px}#demo-entry .de-model{padding:12px 14px;gap:8px 12px;border-radius:18px}#demo-entry .de-go{min-height:44px}#demo-entry .de-pick{gap:10px}#demo-entry .de-pts span{font-size:11.5px;padding:1px 9px}#demo-entry .de-slide{padding-top:4px;padding-bottom:8px}}',
    '@media (max-height:700px) and (max-width:899px){#demo-entry h2{font-size:23px}#demo-entry .de-in{gap:14px}#demo-entry .de-art{padding:12px;border-radius:20px}#demo-entry .de-mod span{width:32px;height:32px}#demo-entry .de-p{font-size:14px}#demo-entry .de-node{padding:7px 10px}#demo-entry .de-two .de-node{padding:8px}}',
    
  ].join('\n');
  document.head.appendChild(css);

  function el(tag, attrs, kids) {
    var n = document.createElement(tag); Object.keys(attrs || {}).forEach(function (k) { if (k === 'text') n.textContent = attrs[k]; else n.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (c) { n.appendChild(c); }); return n;
  }
  function choose(m) { set(KEY_MODE, m); set(KEY_LOG, null); location.reload(); }
  function reset() { set(KEY_LOG, null); location.reload(); }
  function setLang(l) { if (l === lang) return; set(KEY_LANG, l === 'en' ? 'en' : null); location.reload(); }
  // a drop-down in the banner (the language on every width, the model on a phone and a tablet): the current choice on a pill, the
  // choices in a small menu under it
  function dropdown(name, label, cur, opts, pick) {
    var btn = el('button', { type: 'button', 'data-i18n-off': '', 'data-demo-dd': name, 'aria-haspopup': 'menu', 'aria-expanded': 'false', 'aria-label': label, text: (opts.filter(function (o) { return o[0] === cur; })[0] || opts[0])[1] });
    var menu = el('div', { class: 'dm-menu', role: 'menu', hidden: '', 'data-i18n-off': '' }, opts.map(function (o) {
      var it = el('button', { type: 'button', role: 'menuitemradio', 'data-i18n-off': '', 'data-demo-dd-opt': o[0], 'aria-checked': String(o[0] === cur), text: o[1] });
      it.addEventListener('click', function () { shut(); if (o[0] !== cur) pick(o[0]); }); return it;
    }));
    var shut = function () { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', function (e) { e.stopPropagation(); var open = menu.hidden; document.querySelectorAll('#demo-bar .dm-menu').forEach(function (m) { m.hidden = true; }); document.querySelectorAll('#demo-bar [data-demo-dd]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); }); if (open) { menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); } });
    document.addEventListener('click', function (e) { if (!menu.hidden && !menu.contains(e.target)) shut(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); });
    return el('div', { class: 'dm-dd', 'data-dd': name, 'data-i18n-off': '' }, [btn, menu]);
  }
  // --- the entry (the owner 21 Nov — «انفوجرافيك … و تلات اسكرينات اونبوردينج … يشجع المستخدم يخش يشوف الديمو»): three screens that
  // say what the system is — the whole business in one place, an order's way from checkout to payout, a working app on sample
  // data — and then the choice of a business model. They slide under a finger (scroll-snap), with «Next» / «Back» / the dots /
  // the arrow keys; «Skip» goes straight to the choice. Nothing here is a figure: only what the demo really does.
  var ICONS = {
    box: 'M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8', users: 'M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 19v-1a4 4 0 0 0-3-3.87M15.5 3.13a3.5 3.5 0 0 1 0 6.75',
    home: 'M3 10l9-7 9 7v10H3V10zM9 20v-6h6v6', tag: 'M3 12V4h8l10 10-8 8L3 12zM7.5 8.5h.01', chat: 'M4 5h16v11H9l-5 4V5z',
    wallet: 'M3 7a2 2 0 0 1 2-2h13v4M3 7v10a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2zM16.5 14h.01', horn: 'M3 10v4h3l8 5V5L6 10H3zM18 9a4 4 0 0 1 0 6', case: 'M3 8h18v11H3V8zM9 8V5h6v3M3 13h18',
    spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16z',
    globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z', screens: 'M3 5h13v9H3V5zM1.5 17h12M17 9h5v11h-5V9z',
    truck: 'M2 6h11v9H2V6zM13 9h4l4 3v3h-8V9zM6.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
    cart: 'M3 4h2l2.4 10.5h10.2L20 7H6.2M9 19.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM17 19.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z', check: 'M5 12.5l4.5 4.5L19 7.5',
    coin: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM14.5 9.5c-.4-1-1.3-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.2 0-2.1-.5-2.5-1.5M12 6.5v11',
    arrow: 'M5 12h14M13 6l6 6-6 6', shop: 'M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6', user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  };
  function ic(name, size) {
    var NS = 'http://www.w3.org/2000/svg'; var s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', size || 20); s.setAttribute('height', size || 20); s.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS(NS, 'path'); p.setAttribute('d', ICONS[name]); s.appendChild(p); return s;
  }
  function entry() {
    var txt = function (k, h, p) { return el('div', { class: 'de-txt' }, [el('span', { class: 'de-k', text: k }), el('h2', { text: h }), el('p', { class: 'de-p', text: p })]); };
    var node = function (icon, title, sub, cls) { var t = el('div', null, [document.createTextNode(title)]); if (sub) t.appendChild(el('small', { text: sub })); return el('div', { class: 'de-node' + (cls ? ' ' + cls : '') }, [el('span', null, [ic(icon, 18)]), t]); };
    // 1 — the whole business in one place
    var mods = [['box', 'Orders'], ['users', 'Makers'], ['home', 'Inventory'], ['tag', 'Products'], ['chat', 'Customers'], ['wallet', 'Accounts'], ['horn', 'Marketing'], ['case', 'Team & HR']];
    var art1 = el('div', { class: 'de-art', 'aria-hidden': 'true' }, [
      el('div', { class: 'de-bar' }, [el('span', { text: 'IBTEKR' }), el('i'), el('b')]),
      el('div', { class: 'de-mods' }, mods.map(function (m) { return el('div', { class: 'de-mod' }, [el('span', null, [ic(m[0], 18)]), document.createTextNode(m[1])]); })),
      el('div', { class: 'de-more', text: '+ reports · auto-replies · team requests · AI assistants' }),
    ]);
    // 2 — an order's way
    var sub = function (maker, chip, g) { var n = node('users', 'Sub-order', maker, 'soft'); n.appendChild(el('span', { class: 'de-chip' + (g ? ' g' : ''), text: chip })); return n; };
    var art2 = el('div', { class: 'de-art', 'aria-hidden': 'true' }, [
      node('cart', 'Order placed', 'On the store — synced in'),
      el('div', { class: 'de-fork' }),
      el('div', { class: 'de-two' }, [sub('Artisan Loft', 'In production', true), sub('Fayrouz Glass', 'Ready to ship')]),
      el('div', { class: 'de-join' }),
      node('truck', 'Courier pickup → delivered', 'Waybill printed from the system'),
      el('div', { class: 'de-stem' }),
      node('coin', 'Maker statement → payout', 'Commission kept, the rest settled', 'gold'),
    ]);
    // 3 — a working app
    var art3 = el('div', { class: 'de-art', 'aria-hidden': 'true' }, [
      el('div', { class: 'de-feats' }, [
        node('spark', 'AI assistants built in', 'Product copy, campaign ideas, “which orders are late?”'),
        node('globe', 'Arabic first, English too', 'Right-to-left by design — switch in one tap', 'gold'),
        node('screens', 'Phone, tablet, desktop', 'Laid out for fingers as well as a mouse', 'soft'),
      ]),
      el('div', { class: 'de-toast' }, [el('span', null, [ic('check', 14)]), document.createTextNode('Saved in this browser — Reset puts it back')]),
    ]);
    // the choice
    var dia = function (single) {
      var kids = single ? [el('span', { class: 'big' }, [ic('shop', 16)])]
        : [el('span', { class: 'col' }, [el('span', { class: 'dot' }), el('span', { class: 'dot' }), el('span', { class: 'dot' })]), el('span', { class: 'ln' }), el('span', { class: 'big' }, [ic('shop', 16)])];
      return el('div', { class: 'de-dia' }, kids.concat([el('span', { class: 'ln' }), el('span', { class: 'who' }, [ic('user', 14)])]));
    };
    var model = function (m, title, pts, cta) {
      var b = el('button', { class: 'de-model', type: 'button', 'data-demo-mode': m }, [el('h3', { text: title }), dia(m === 'single'), el('div', { class: 'de-pts' }, pts.map(function (t) { return el('span', { text: t }); })), el('span', { class: 'de-go' }, [document.createTextNode(cta), ic('arrow', 18)])]);
      b.addEventListener('click', function () { choose(m); }); return b;
    };
    var seg = el('div', { class: 'de-seg', role: 'group', 'aria-label': 'Interface language' }, [['ar', 'عربي'], ['en', 'English']].map(function (o) {
      var b = el('button', { type: 'button', 'data-demo-entry-lang': o[0], 'aria-pressed': String(o[0] === lang), text: o[1] });
      b.addEventListener('click', function () { lang = o[0]; set(KEY_LANG, lang === 'en' ? 'en' : null); seg.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); });
      return b;
    }));
    var slides = [
      el('section', { class: 'de-slide', 'aria-label': 'One system' }, [el('div', { class: 'de-in two' }, [art1, txt('One system', 'Run a whole marketplace from one screen', 'Orders, makers, stock, shipping, customer service, accounts, marketing and the team — one Arabic-first operations system, built for a handmade marketplace.')])]),
      el('section', { class: 'de-slide', 'aria-label': 'End to end' }, [el('div', { class: 'de-in two' }, [art2, txt('End to end', 'Follow every order from checkout to payout', 'An order splits into a sub-order for each maker, moves through production and the courier, and ends as a line on the maker’s statement.')])]),
      el('section', { class: 'de-slide', 'aria-label': 'Hands on' }, [el('div', { class: 'de-in two' }, [art3, txt('Hands on', 'A working app, not a slideshow', 'Change a status, add a product, answer a customer. Everything runs on sample data and stays in this browser.')])]),
      el('section', { class: 'de-slide', 'aria-label': 'Pick a business model' }, [el('div', { class: 'de-in pick' }, [
        txt('Start here', 'Pick a business model', 'Two ways the same system runs. You can switch between them any time from the top bar.'),
        el('div', { class: 'de-pick' }, [
          model('marketplace', 'Marketplace', ['Many makers', 'Sub-orders per maker', 'Commissions & payouts'], 'Open the marketplace'),
          model('single', 'Single-brand store', ['One made-up brand: Decoro', 'No makers, no sub-orders', 'Same orders, products & service'], 'Open Decoro'),
        ]),
        el('div', { class: 'de-lang' }, [el('span', { text: 'Interface language' }), seg]),
        el('p', { class: 'de-note', text: 'Everything you change stays in this browser until you press Reset.' }),
      ])]),
    ];
    var last = slides.length - 1; var at = 0;
    var track = el('div', { class: 'de-track' }, slides);
    var skip = el('button', { class: 'de-skip', type: 'button', 'data-demo-skip': '', text: 'Skip' });
    var back = el('button', { class: 'de-back', type: 'button', 'data-demo-back': '', text: 'Back' });
    var next = el('button', { class: 'de-next', type: 'button', 'data-demo-next': '' });
    var dots = el('div', { class: 'de-dots', role: 'group', 'aria-label': 'Screens' }, slides.map(function (s, i) { var d = el('button', { type: 'button', 'aria-label': 'Screen ' + (i + 1) + ' of ' + slides.length }); d.addEventListener('click', function () { go(i); }); return d; }));
    var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    function go(i) { i = Math.max(0, Math.min(last, i)); track.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: calm ? 'auto' : 'smooth' }); }
    function sync() {
      slides.forEach(function (s, i) { if (i === at) s.classList.add('on'); });
      dots.querySelectorAll('button').forEach(function (d, i) { d.setAttribute('aria-current', String(i === at)); });
      skip.hidden = at === last; back.hidden = at === 0; next.hidden = at === last;
      next.textContent = ''; next.appendChild(document.createTextNode(at === last - 1 ? 'Choose a model' : 'Next')); next.appendChild(ic('arrow', 18));
    }
    var tick = 0;
    track.addEventListener('scroll', function () { if (tick) return; tick = requestAnimationFrame(function () { tick = 0; var w = track.clientWidth || 1; var i = Math.max(0, Math.min(last, Math.round(Math.abs(track.scrollLeft) / w))); if (i !== at) { at = i; sync(); } }); }, { passive: true });
    skip.addEventListener('click', function () { go(last); }); back.addEventListener('click', function () { go(at - 1); }); next.addEventListener('click', function () { go(at + 1); });
    var box = el('div', { id: 'demo-entry', dir: 'ltr', lang: 'en' }, [
      el('div', { class: 'de-top' }, [el('h1', null, [el('span', { class: 'de-mark' }), document.createTextNode('Ibtekr Ops'), el('span', { class: 'de-tag', text: 'Live demo' })]), skip]),
      track,
      el('div', { class: 'de-foot' }, [dots, back, next]),
    ]);
    box.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') go(at + 1); else if (e.key === 'ArrowLeft') go(at - 1); });
    document.body.appendChild(box); sync();
  }

  // --- the fixed banner
  function banner() {
    var sw = el('div', { class: 'dm-sw', role: 'group', 'aria-label': 'Business model' }, Object.keys(MODES).map(function (m) {
      var b = el('button', { type: 'button', 'data-demo-switch': m, 'aria-pressed': String(m === mode), text: MODES[m] });
      b.addEventListener('click', function () { if (m !== mode) choose(m); }); return b;
    }));
    var rs = el('button', { type: 'button', class: 'dm-rs', 'data-demo-reset': '', text: 'Reset' });
    rs.addEventListener('click', reset);
    document.body.appendChild(el('div', { id: 'demo-bar', role: 'region', 'aria-label': 'Demo' }, [
      dropdown('lang', 'Language', lang, [['ar', 'عربي'], ['en', 'English']], setLang),
      dropdown('mode', 'Business model', mode, Object.keys(MODES).map(function (m) { return [m, MODES[m]]; }), choose),
      el('span', { class: 'dm-lb', text: 'Sample data' }),
      el('span', { class: 'dm-sp' }), sw, rs]));
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
    if (outbound(url, body)) toast(lang === 'en' ? 'This is a demo — the real system would send this out' : 'ده ديمو — في السيستم الحقيقي هيتبعت إشعار');
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
  // a request for words alone (a caption, a name, a translation) needs none of the system's data; the others read these kinds
  var WORDS = /(اكتب|صيغ|ترجم|كابشن|بوست|write|translate|caption|slogan|شعار)/i;
  function kindsOf(q) {
    if (WORDS.test(q)) return [];
    if (/(متأخر|تأخير|late|delay)/i.test(q)) return ['orders'];
    if (/(مبيعات|بيع|sales|revenue|إيراد)/i.test(q)) return ['orders', 'sales'];
    if (/(مبتكر|رصيد|سحب|maker|balance|withdraw)/i.test(q)) return mode === 'single' ? [] : ['vendors'];
    if (/(عميل|عملاء|رسايل|واتساب|customer|message|whatsapp)/i.test(q)) return ['customers'];
    return ['summary'];
  }
  function reply(q) {
    var f = facts();
    if (WORDS.test(q)) return 'ده نص مقترح من غير أي بيانات من السيستم: «قطعة معمولة بالإيد، تفاصيلها بتحكي عن بيتك. اطلبها دلوقتي وتوصلك لحد الباب.» قولّي المنتج أو المناسبة وأظبطه عليها.';
    if (/(متأخر|تأخير|late)/.test(q)) return f.late.length ? 'عندك ' + f.late.length + ' أوردر متأخر: ' + f.late.map(function (o) { return 'IB-' + o.id; }).join('، ') + '. أقترح تكلّم المبتكر وتحدّث العميل بميعاد جديد — والفلتر «متأخرة» في الأوردرات بيجيبهم.' : 'مفيش أوردرات متأخرة دلوقتي 👌';
    if (/(مبيعات|بيع|sales|إيراد)/.test(q)) return 'المبيعات المكتملة ' + fmt(f.doneSum) + ' ج.م من ' + f.done.length + ' أوردر، ومتوسط الأوردر ' + fmt(f.done.length ? f.doneSum / f.done.length : 0) + ' ج.م. وفيه ' + f.work.length + ' أوردر جاري تنفيذهم بإجمالي ' + fmt(f.workSum) + ' ج.م.';
    if (/(مبتكر|رصيد|سحب|maker)/.test(q)) return f.bal || f.pend.length ? 'إجمالي أرصدة المبتكرين على Dokan ' + fmt(f.bal) + ' ج.م' + (f.pend.length ? '، وفيه ' + f.pend.length + ' طلب سحب مستني موافقتك (' + f.pend.map(function (w) { return f.vname(w.vendor_id) + ' — ' + fmt(w.amount) + ' ج.م'; }).join('، ') + ').' : '.') : 'المتجر ده بيبيع براند واحد، فمفيش مبتكرين ولا أرصدة.';
    if (/(عميل|عملاء|رسايل|واتساب)/.test(q)) return 'عندك ' + f.conv.length + ' محادثة مستنية رد في خدمة العملاء. افتح «الرسايل» والرد المقترح هيبقى جاهز في الخانة.';
    return 'ملخص النهارده: ' + f.os.length + ' أوردر في السيستم — ' + f.newO.length + ' جديد مستني التأكيد، ' + f.work.length + ' جاري التنفيذ، ' + f.ship.length + ' في الشحن، و' + f.late.length + ' متأخر. ' + (f.conv.length ? 'وفيه ' + f.conv.length + ' رسالة عملاء مستنية رد. ' : '') + 'تحب أبدأ بإيه؟';
  }
  function replyEn(q) {
    var f = facts(); var pl = function (n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); };
    if (WORDS.test(q)) return 'A suggested line, with no data from the system: “Made by hand, with details that tell your home’s story. Order it now, delivered to your door.” Tell me the product or the occasion and I will fit it.';
    if (/(متأخر|تأخير|late|delay)/i.test(q)) return f.late.length ? 'You have ' + pl(f.late.length, 'late order') + ': ' + f.late.map(function (o) { return 'IB-' + o.id; }).join(', ') + '. I suggest following up on production and giving the customer a new date — the “Late” filter in Orders lists them.' : 'No late orders right now 👌';
    if (/(مبيعات|بيع|sales|revenue|إيراد)/i.test(q)) return 'Completed sales are ' + fmt(f.doneSum) + ' EGP from ' + pl(f.done.length, 'order') + ', an average of ' + fmt(f.done.length ? f.doneSum / f.done.length : 0) + ' EGP per order. Another ' + pl(f.work.length, 'order') + ' in processing add up to ' + fmt(f.workSum) + ' EGP.';
    if (/(مبتكر|رصيد|سحب|maker|balance|withdraw)/i.test(q)) return f.bal || f.pend.length ? 'Makers’ balances on Dokan total ' + fmt(f.bal) + ' EGP' + (f.pend.length ? ', and ' + pl(f.pend.length, 'withdrawal request') + ' are waiting for your approval (' + f.pend.map(function (w) { return f.vname(w.vendor_id) + ' — ' + fmt(w.amount) + ' EGP'; }).join(', ') + ').' : '.') : 'This store sells one brand, so there are no makers or balances.';
    if (/(عميل|عملاء|رسايل|واتساب|customer|message|whatsapp)/i.test(q)) return 'You have ' + pl(f.conv.length, 'conversation') + ' waiting for a reply in Customer service. Open “Messages” and the suggested reply is ready in the box.';
    return 'Today’s summary: ' + pl(f.os.length, 'order') + ' in the system — ' + f.newO.length + ' new and waiting for confirmation, ' + f.work.length + ' processing, ' + f.ship.length + ' shipping, and ' + f.late.length + ' late. ' + (f.conv.length ? pl(f.conv.length, 'customer message') + ' waiting for a reply. ' : '') + 'Where would you like to start?';
  }
  window.__ibDemoAnswer = function (method, url, body) {
    if (method !== 'POST' || !/\/functions\/v1\/ai-content\b/.test(url) || !body) return null;
    var b; try { b = JSON.parse(body); } catch (e) { return null; }
    if (!b || b.action !== 'assistant' || b.mode === 'filter') return null;
    var turns = Array.isArray(b.turns) ? b.turns : []; var q = String((turns[turns.length - 1] || {}).text || '');
    // the outside AI gets the message only: a reply that reads the demo's data is given only for the kinds this request approved
    // (b.share) — else the kinds it wants come back as `need` and the assistant asks (the owner 22 Nov)
    var want = kindsOf(q); var share = Array.isArray(b.share) ? b.share : []; var miss = want.filter(function (k) { return share.indexOf(k) < 0; });
    if (miss.length) return { result: 'ok', text: '', actions: [], tools: [], report: [], need: miss, shared: [], model: 'demo', cost_usd: 0, run_id: Date.now() };
    return { result: 'ok', text: lang === 'en' ? replyEn(q) : reply(q), actions: [], tools: want, report: [], need: [], shared: want, model: 'demo', cost_usd: 0, run_id: Date.now() };
  };

  window.__ibDemoWeb = {
    mode: mode, lang: lang,
    log: function () { return log.slice(); },
    replaying: function (on) { replaying = !!on; },
  };

  var start = function () { if (mode) banner(); else entry(); };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
