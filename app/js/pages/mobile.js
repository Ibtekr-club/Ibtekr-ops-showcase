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
    'input,select,textarea{font-size:16px!important}',
    /* small controls: a 44px tap area without growing what you see */
    '.ocb,.ibtn{position:relative}.ocb::after,.ibtn::after{content:"";position:absolute;left:50%;top:50%;width:max(100%,44px);height:max(100%,44px);transform:translate(-50%,-50%)}',
    '.oh.m .ibtn[data-more],.scard .ibtn[data-more]{width:40px}.ocb{width:24px;height:24px;flex-basis:24px;border-radius:6px}.ocb svg{width:16px;height:16px}',
    '.card{border-radius:12px}.toolbar{border-radius:12px}',
    /* the customer's details: «label … value» on one line each, not a tall column */
    '.sec.cust .crow{gap:0}.sec.cust .inf2{flex-direction:row;align-items:center;justify-content:space-between;gap:12px;min-height:40px;padding-block:6px;border-bottom:1px solid rgba(255,247,239,.14)}',
    '.sec.cust .inf2 small{flex:none}.sec.cust .inf2 b{flex:0 1 auto;min-width:0;justify-content:flex-end;text-align:end}',
    '.sec.cust .inf2.adr{flex-direction:column;align-items:stretch;gap:2px;border-bottom:0}.sec.cust .inf2.adr b{text-align:start}',
    /* a row's ⋮ menu: up from the bottom, by the thumb (the page places it with inline styles) */
    '#mpop{position:fixed!important;top:auto!important;left:0!important;right:0!important;bottom:0!important;width:auto!important;max-width:none!important;min-width:0;max-height:min(80vh,80dvh)!important;overflow-y:auto;overscroll-behavior:contain;border:0;border-radius:20px 20px 0 0;padding:6px 12px calc(12px + env(safe-area-inset-bottom,0px));box-shadow:0 -8px 32px rgba(46,42,27,.24),0 0 0 100vmax rgba(46,42,27,.38);animation:m-up .22s cubic-bezier(.2,.8,.2,1)}',
    '#mpop::before{content:"";display:block;flex:none;width:36px;height:4px;border-radius:2px;background:var(--bd);opacity:.45;margin:4px auto 8px}',
    '#mpop button,#mpop a{min-height:48px;padding-inline:12px;border-radius:10px;font-size:15px}',
    /* a date («تاريخ التأكيد», «تاريخ التبليغ»): a sheet from the bottom, the week across the screen, days of 46px */
    '#dpop{position:fixed!important;top:auto!important;left:0!important;right:0!important;bottom:0!important;width:auto!important;z-index:90;animation:m-up .22s cubic-bezier(.2,.8,.2,1)}',
    '#dpop .dp{width:auto;border:0;border-radius:20px 20px 0 0;padding:8px 16px calc(16px + env(safe-area-inset-bottom,0px));box-shadow:0 -8px 32px rgba(46,42,27,.24),0 0 0 100vmax rgba(46,42,27,.38)}',
    '#dpop .dp::before{content:"";display:block;width:36px;height:4px;border-radius:2px;background:var(--bd);opacity:.45;margin:4px auto 8px}',
    '#dpop .hd{height:48px}#dpop .hd button{min-width:44px;min-height:44px}#dpop .hd,#dpop .hd *{font-size:16px}',
    '#dpop .g{grid-template-columns:repeat(7,minmax(0,1fr));width:auto}#dpop .wd{width:auto;font-size:12px}#dpop .d{width:100%;height:46px;font-size:16px}',
    '#dpop .ft{padding-top:12px}#dpop .ft .btn{min-height:48px;padding-inline:20px;font-size:15px}',
    /* «تعديل الأوردر»: its three tabs on one line, each a full target */
    '#cdlg .dtabs{overflow-x:auto;scrollbar-width:none}#cdlg .dtabs::-webkit-scrollbar{display:none}#cdlg .dtabs .tab{flex:1 0 auto;white-space:nowrap;padding-inline:12px;font-size:14px}',
    '#cdlg{border-radius:16px!important}#cdlg .cf .btn{min-height:48px;font-size:15px;font-weight:600;border-radius:10px}',
    /* the filter: a screen of its own — its title on top, «تطبيق الفلتر» always at the bottom, everything between scrolls */
    '.fb{position:fixed!important;top:var(--dm-h,0px)!important;left:0!important;right:0!important;bottom:0!important;width:auto!important;max-width:none!important;max-height:none!important;height:auto;border:0;border-radius:0;box-shadow:none;padding:0 16px;gap:16px;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;animation:m-up .22s cubic-bezier(.2,.8,.2,1)}',
    '.fb h3{position:sticky;top:0;z-index:3;flex:none;margin:0 -16px;padding:0 16px;min-height:56px;font-size:18px;line-height:28px;font-weight:700;background:var(--bg-base);border-bottom:1px solid var(--bd-sub)}',
    '.fb h3 svg{width:20px;height:20px}',
    /* «اوصف إزاي تفلتر»: one field with its button inside */
    '.fb .ai{min-height:52px;padding:4px 6px 4px 12px;padding-inline:12px 6px;border-radius:12px;gap:8px}',
    '.fb .ai input{min-width:0;height:44px;text-overflow:ellipsis}',
    '.fb .ai .go{flex:none;min-height:44px;padding:0 12px;border-radius:10px;font-size:14px;background:var(--brand);color:var(--bg-base)}.fb .ai .go[disabled]{background:transparent;color:var(--brand)}',
    /* a group's name, then its chips — each a 40px target with air around it */
    '.fb .qf{gap:8px}.fb .qf .qt{font-size:13px;font-weight:700;color:var(--tx)}.fb .qf .qt small{font-size:12px;font-weight:400;color:var(--tx2)}',
    '.fb .qc{min-height:40px;padding-inline:14px;font-size:14px}.fb .qc.sv button{min-height:40px}.fb .qc.sv .x{min-width:36px;justify-content:center}.fb .qc.sv .x svg{width:14px;height:14px}',
    '.fb .qc.on{background:var(--brand);border-color:var(--brand);color:var(--bg-base)}',
    '.fb .svf{flex-wrap:wrap}.fb .svf input{flex:1 1 100%;height:48px}.fb .svf .btn{flex:1;min-height:44px}',
    '.fb .lead{font-size:13px;font-weight:700;color:var(--tx);padding-top:16px;border-top:1px solid var(--bd-sub)}',
    /* a condition: a card — «حيث / و / أو» and its ✕ on top, the field and the comparison side by side, the value under them */
    '.fb .fr{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) 40px;gap:8px;align-items:center;padding:12px;border:1px solid var(--bd-sub);border-radius:12px;background:var(--bg-container)}',
    '.fb .fr>.w,.fb .fr>.conj{grid-column:1 / span 2;grid-row:1;width:auto;justify-self:start;text-align:start;font-weight:600}.fb .fr>.conj{min-width:104px}',
    '.fb .fr>[data-fbx],.fb .fr>.ibtn{grid-column:3;grid-row:1;justify-self:end;width:40px;height:40px;border:0;background:transparent}',
    '.fb .fr>.fld{grid-column:1;grid-row:2;width:auto;flex:none}.fb .fr>.opr{grid-column:2 / span 2;grid-row:2;width:auto;flex:none}.fb .fr>.val{grid-column:1 / -1;grid-row:3;width:auto;flex:none}',
    '.fb .fr>.grp{grid-column:1 / -1;grid-row:2;padding:8px;gap:8px;border-radius:10px;background:var(--bg-base)}.fb .grp .fr{background:var(--bg-container)}',
    '.fb select.sel2,.fb input.sel2,.fb .fld,.fb .opr,.fb .val{height:48px;min-height:48px;border-radius:10px;padding-inline:12px;min-width:0;max-width:100%}',
    /* «+ إضافة شرط» and «+ إضافة مجموعة شروط»: two real buttons; «مسح كل الشروط» quiet, on its own line */
    '.fb .acts{display:grid;grid-template-columns:1fr 1fr;gap:8px}.fb .acts .sp{display:none}',
    '.fb .acts .lnk{min-height:48px;justify-content:center;padding:0 8px;border:1px solid var(--brand);border-radius:10px;font-size:14px;text-align:center}.fb .acts .lnk:hover{text-decoration:none}',
    '.fb .acts [data-fbclear]{grid-column:1 / -1;border-color:transparent;color:var(--err-text);min-height:44px}',
    '.fb .lnk[data-svnew]{min-height:40px}',
    /* the footer: always on screen, the main button across it */
    '.fb .ft{position:sticky;bottom:0;z-index:3;flex:none;margin:auto -16px 0;padding:12px 16px calc(12px + env(safe-area-inset-bottom,0px));gap:8px;background:var(--bg-base);border-top:1px solid var(--bd-sub);box-shadow:0 -6px 16px rgba(46,42,27,.08)}',
    '.fb .ft .btn{height:52px;min-height:52px;border-radius:12px;font-size:16px;font-weight:700;padding-inline:20px}.fb .ft .btn.pri{flex:1 1 auto;justify-content:center}.fb .ft .btn:not(.pri){flex:0 0 auto;min-width:96px;justify-content:center}',
    '}',
    '@keyframes m-up{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}',
    '@media (prefers-reduced-motion:reduce){#mpop,.fb,#dpop{animation:none}}',
    /* ---- the chips of the filters in force (phone, tablet, any touch screen): one line that slides under the finger — picking
       five filters no longer pushes the orders five lines down. «مسح الفلاتر» stays in sight at the line's end. ---- */
    '@media (max-width:1023px),(pointer:coarse){',
    '.afc-row{flex-wrap:nowrap;gap:8px;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;scrollbar-width:none;scroll-snap-type:x proximity;margin-inline:-12px;padding-inline:12px;scroll-padding-inline:12px}',
    '.afc-row::-webkit-scrollbar{display:none}',
    '.afc{flex:none;flex-wrap:nowrap;gap:8px;padding-top:0}',
    '.afc-chip{flex:none;max-width:min(78vw,340px);scroll-snap-align:start}.afc-op{flex:none}',
    '.afc-n{flex:none;padding-inline:4px}',
    '.afc-row>.btn{flex:none;position:sticky;inset-inline-end:-12px;z-index:1;min-height:44px;padding-inline:12px;margin-inline-end:-12px;background:var(--bg-base);box-shadow:0 0 0 1px var(--bd-sub),-12px 0 12px -4px var(--bg-base),12px 0 12px -4px var(--bg-base);border-radius:999px}',
    '}',
    /* ---- a touch screen of any width: nothing you tap is under 40px ---- */
    '@media (min-width:768px) and (pointer:coarse){#dpop{width:340px!important}#dpop .dp{width:auto}#dpop .g{grid-template-columns:repeat(7,44px);justify-content:space-between;width:auto}#dpop .wd{width:44px}#dpop .d{width:44px;height:44px;font-size:15px}#dpop .hd button{min-width:40px;min-height:40px}.ibtn{width:40px;height:40px}.sdd{height:40px;max-height:40px}[data-sc],.sc{height:40px}.in,.sel,.sel2,.btn,.dd.btn{min-height:40px}.ocb{position:relative;width:24px;height:24px;flex-basis:24px}.ocb::after{content:"";position:absolute;left:50%;top:50%;width:44px;height:44px;transform:translate(-50%,-50%)}.car-b{width:44px;height:44px}}'
  ].join('');

  function dress(host) {
    var root = host && host.shadowRoot; if (!root || root.querySelector('style[data-mobile]')) return;
    var st = document.createElement('style'); st.setAttribute('data-mobile', ''); st.textContent = ORDERS_CSS; root.appendChild(st);
    quietFocus(root);
  }
  /* On a touch screen a field that takes the focus by itself throws the keyboard over half the page. The filter focuses its
     «اوصف إزاي تفلتر» box as it opens — fine with a keyboard on the desk, in the way on a phone. So there, a focus the member
     did not ask for with a finger is given back; a tap on the field works as always. */
  function quietFocus(root) {
    var touched = 0; var coarse = window.matchMedia ? window.matchMedia('(pointer:coarse)') : null;
    root.addEventListener('pointerdown', function (e) { if (e.target && e.target.id === 'fbai') touched = Date.now(); }, true);
    root.addEventListener('focusin', function (e) {
      var t = e.target; if (!t || t.id !== 'fbai' || !coarse || !coarse.matches) return;
      if (Date.now() - touched < 800) return;
      t.blur();
    }, true);
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
