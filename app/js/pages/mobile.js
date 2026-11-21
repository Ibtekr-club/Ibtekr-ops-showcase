/* The phone and tablet pass (21 Nov) — the part a stylesheet alone cannot reach. Look and touch only: nothing here changes what
   a page shows or does.
   · The orders page keeps its own styles inside a shadow root, where css/mobile.css does not apply — its phone and tablet rules
     are added here, as one more <style> after the page's own (logical properties throughout, so they read the same in both
     directions). */
(function () {
  'use strict';
  var ORDERS_CSS = [
    /* under a banner on top of the page (the demo's), a popup starts below it */
    '#cscrim,#uscrim{top:var(--dm-h,0px)}',
    /* ---- touch basics ---- */
    '@media (pointer:coarse){button,a,label,select,summary{touch-action:manipulation}.btn,.ibtn,.sc,.ocb,.car-b{transition:transform .12s cubic-bezier(.2,.8,.2,1),background-color .12s cubic-bezier(.2,.8,.2,1)}.btn:active,.ibtn:active,.sc:active,.car-b:active{transform:scale(.97)}}',
    '@media (pointer:coarse) and (prefers-reduced-motion:reduce){.btn,.ibtn,.sc,.ocb,.car-b{transition:none}.btn:active,.ibtn:active,.sc:active,.car-b:active{transform:none}}',
    /* ---- phone ---- */
    '@media (max-width:767px){',
    /* the head: the title and the sync on one line, then sort · filter · files as three equal buttons */
    '.ph{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;align-items:center}',
    '.ph .tb{grid-column:1 / span 3;min-width:0}.ph h1{font-size:22px;line-height:32px;font-weight:700}',
    '.ph #sync{grid-column:4 / span 3;grid-row:1;min-width:0;padding-inline:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.ph .btn,.ph .dd.btn{grid-column:span 2;min-width:0;padding-inline:6px;gap:4px;font-size:13px}.ph .btn span,.ph .dd.btn span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.ph small,small{font-size:12px}',
    /* a field you type in: 16px, so the phone does not zoom the page */
    'input,select,textarea{font-size:16px}',
    /* small controls: a 44px tap area without growing what you see */
    '.ocb,.ibtn{position:relative}.ocb::after,.ibtn::after{content:"";position:absolute;left:50%;top:50%;width:max(100%,44px);height:max(100%,44px);transform:translate(-50%,-50%)}',
    '.oh.m .ibtn[data-more],.scard .ibtn[data-more]{width:40px}.ocb{width:24px;height:24px;flex-basis:24px;border-radius:6px}.ocb svg{width:16px;height:16px}',
    '.card{border-radius:12px}.toolbar{border-radius:12px}',
    /* the customer's details: «label … value» on one line each, not a tall column */
    '.sec.cust .crow{gap:0}.sec.cust .inf2{flex-direction:row;align-items:center;justify-content:space-between;gap:12px;min-height:40px;padding-block:6px;border-bottom:1px solid rgba(255,247,239,.14)}',
    '.sec.cust .inf2 small{flex:none}.sec.cust .inf2 b{flex:0 1 auto;min-width:0;justify-content:flex-end;text-align:end}',
    '.sec.cust .inf2.adr{flex-direction:column;align-items:stretch;gap:2px;border-bottom:0}.sec.cust .inf2.adr b{text-align:start}',
    /* a row's ⋮ menu and the filter: up from the bottom, by the thumb (the page places them with inline styles) */
    '#mpop,.fb{position:fixed!important;top:auto!important;left:0!important;right:0!important;bottom:0!important;width:auto!important;max-width:none!important;min-width:0;max-height:min(80vh,80dvh)!important;overflow-y:auto;overscroll-behavior:contain;border:0;border-radius:20px 20px 0 0;padding:6px 12px calc(12px + env(safe-area-inset-bottom,0px));box-shadow:0 -8px 32px rgba(46,42,27,.24),0 0 0 100vmax rgba(46,42,27,.38);animation:m-up .22s cubic-bezier(.2,.8,.2,1)}',
    '#mpop::before,.fb::before{content:"";display:block;flex:none;width:36px;height:4px;border-radius:2px;background:var(--bd);opacity:.45;margin:4px auto 8px}',
    '#mpop button,#mpop a{min-height:48px;padding-inline:12px;border-radius:10px;font-size:15px}',
    '}',
    '@keyframes m-up{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}',
    '@media (prefers-reduced-motion:reduce){#mpop,.fb{animation:none}}',
    /* ---- a touch screen of any width: nothing you tap is under 40px ---- */
    '@media (min-width:768px) and (pointer:coarse){.ibtn{width:40px;height:40px}.sdd{height:40px;max-height:40px}[data-sc],.sc{height:40px}.in,.sel,.sel2,.btn,.dd.btn{min-height:40px}.ocb{position:relative;width:24px;height:24px;flex-basis:24px}.ocb::after{content:"";position:absolute;left:50%;top:50%;width:44px;height:44px;transform:translate(-50%,-50%)}.car-b{width:44px;height:44px}}'
  ].join('');

  function dress(host) {
    var root = host && host.shadowRoot; if (!root || root.querySelector('style[data-mobile]')) return;
    var st = document.createElement('style'); st.setAttribute('data-mobile', ''); st.textContent = ORDERS_CSS; root.appendChild(st);
  }
  function look() { var h = document.getElementById('orders'); if (h) dress(h); return !!(h && h.shadowRoot && h.shadowRoot.querySelector('style[data-mobile]')); }
  function start() {
    if (look()) return;
    var mo = new MutationObserver(function () { if (look()) mo.disconnect(); });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('ib:orders-ready', look);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
