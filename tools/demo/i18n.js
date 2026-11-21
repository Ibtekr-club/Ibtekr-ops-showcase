// The web demo in English. web.js loads en.js (the dictionary) and this file only when the visitor picked English; the Arabic demo
// and the app itself never load them. The app is untouched and keeps «thinking» in Arabic: every text it writes to the page is
// translated as it is written (text nodes, innerHTML, the attributes a person reads), so the page is English from its first paint,
// and reading a text back (textContent, getAttribute, a <select>'s value) gives the Arabic the app wrote — its own checks on labels
// and values keep working. The layout turns left-to-right.
(function () {
  'use strict';
  var EN = window.IB_EN; if (window.IB_LANG !== 'en' || !EN) return;
  var DICT = EN.d || {}; var PATS = (EN.p || []).map(function (x) { return [new RegExp(x[0]), x[1]]; });
  var AR = /[؀-ۿ]/;
  var isL = function (c) { return c !== undefined && ((c >= 'ء' && c <= 'ْ') || (c >= 'ٰ' && c <= 'ۓ')); }; // an Arabic letter or mark

  // ---------- the translator: the whole text, else a pattern, else its known parts (the longest first), word boundaries kept
  var B2 = Object.create(null);
  Object.keys(DICT).forEach(function (k) { if (!k) return; var b = k.slice(0, 2); (B2[b] || (B2[b] = [])).push(k); });
  Object.keys(B2).forEach(function (b) { B2[b].sort(function (x, y) { return y.length - x.length; }); });
  function longest(s, i) {
    var list = B2[s.substr(i, 2)]; var one = s[i]; var k, j, n = s.length;
    if (list) for (var x = 0; x < list.length; x++) { k = list[x]; if (!s.startsWith(k, i)) continue; j = i + k.length; if (j < n && isL(s[j]) && isL(k[k.length - 1])) continue; return k; }
    if (DICT[one] !== undefined && !(i + 1 < n && isL(s[i + 1]) && isL(one))) return one;
    return null;
  }
  var PUNCT = { '،': ',', '؛': ';', '؟': '?', '«': '“', '»': '”', '٪': '%' };
  function pieces(s) {
    var out = '', i = 0, n = s.length, c, k, j;
    while (i < n) {
      c = s[i];
      if (PUNCT[c]) { out += PUNCT[c]; i++; continue; }
      if (!AR.test(c)) { out += c; i++; continue; }
      var start = i === 0 || !isL(s[i - 1]);
      k = start || !isL(c) ? longest(s, i) : null;
      if (k) { out += DICT[k]; i += k.length; continue; }
      if (start && c === 'و' && i + 2 < n) { k = longest(s, i + 1); if (k && k.length > 1) { out += 'and ' + DICT[k]; i += 1 + k.length; continue; } } // «و» joined to the next word
      j = i; while (j < n && isL(s[j])) j++; if (j === i) j = i + 1; out += s.slice(i, j); i = j; // a word the dictionary does not know yet: left as it is
    }
    return out.replace(/ {2,}/g, ' ').replace(/ ,/g, ',');
  }
  var memo = new Map();
  function core(s) {
    if (DICT[s] !== undefined) return DICT[s];
    for (var i = 0; i < PATS.length; i++) { var m = PATS[i][0].exec(s); if (m) return PATS[i][1].replace(/\$(\d)/g, function (_, d) { return m[d] == null ? '' : tr(m[d]); }); }
    return pieces(s);
  }
  function tr(s) {
    if (typeof s !== 'string' || !AR.test(s)) return s;
    var hit = memo.get(s); if (hit !== undefined) return hit;
    var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s); var out = m[1] + core(m[2]) + m[3];
    if (memo.size > 60000) memo.clear(); memo.set(s, out); return out;
  }

  // ---------- what the app wrote, kept beside what the page shows
  var orig = new WeakMap(); // Text → { a: the Arabic, e: what is shown }
  var attrO = new WeakMap(); // Element → { name: { a, e } }
  var ATTRS = ['placeholder', 'title', 'aria-label', 'alt', 'data-l', 'data-h', 'data-tip', 'aria-description', 'label'];
  var IS_ATTR = {}; ATTRS.forEach(function (a) { IS_ATTR[a] = 1; });
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1 };
  var off = function (el) { return !!(el && el.nodeType === 1 && el.closest && el.closest('[data-i18n-off]')); };

  var dData = Object.getOwnPropertyDescriptor(CharacterData.prototype, 'data');
  var dText = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
  var dValue = Object.getOwnPropertyDescriptor(Node.prototype, 'nodeValue');
  var gA = Element.prototype.getAttribute, sA = Element.prototype.setAttribute;

  function setText(n, s) { // a text node takes a new text
    var p = n.parentNode;
    if (AR.test(s) && !(p && p.nodeType === 1 && (SKIP[p.tagName] || off(p)))) { var e = tr(s); orig.set(n, { a: s, e: e }); dData.set.call(n, e); } else { orig.delete(n); dData.set.call(n, s); }
  }
  function textOf(n) { var d = dData.get.call(n); var o = orig.get(n); return o && o.e === d ? o.a : d; }
  function readText(node) {
    var t = node.nodeType;
    if (t === 3) return textOf(node);
    if (t !== 1 && t !== 11) return dText.get.call(node);
    if (!node.firstChild) return '';
    var w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null); var out = '', n;
    while ((n = w.nextNode())) out += textOf(n);
    return out;
  }
  function doText(n) {
    var d = dData.get.call(n); if (!AR.test(d)) return; var o = orig.get(n); if (o && o.e === d) return;
    var p = n.parentNode; if (p && p.nodeType === 1 && (SKIP[p.tagName] || off(p))) return;
    var e = tr(d); orig.set(n, { a: d, e: e }); dData.set.call(n, e);
  }
  function setAttr(el, name, v) {
    if (AR.test(v) && !off(el)) { var e = tr(v); var m = attrO.get(el); if (!m) { m = {}; attrO.set(el, m); } m[name] = { a: v, e: e }; sA.call(el, name, e); } else { var m2 = attrO.get(el); if (m2) delete m2[name]; sA.call(el, name, v); }
  }
  // ---------- the stylesheets, mirrored: what was written for right-to-left with physical sides (left / right, text-align, direction)
  // reads the other way round; the logical parts (flex, grid, inline-start / end) follow the page's direction on their own
  var PAIRS = [['left', 'right'], ['margin-left', 'margin-right'], ['padding-left', 'padding-right'], ['border-left-width', 'border-right-width'], ['border-left-style', 'border-right-style'],
    ['border-left-color', 'border-right-color'], ['border-top-left-radius', 'border-top-right-radius'], ['border-bottom-left-radius', 'border-bottom-right-radius']];
  var SIDE = { left: 'right', right: 'left' };
  function mirrorStyle(st) {
    for (var i = 0; i < PAIRS.length; i++) {
      var a = PAIRS[i][0], b = PAIRS[i][1]; var va = st.getPropertyValue(a), vb = st.getPropertyValue(b); if (va === vb) continue;
      if (a === 'left' && (va === '50%' || vb === '50%')) continue; // centred with a transform: the same from both sides
      var pa = st.getPropertyPriority(a), pb = st.getPropertyPriority(b);
      if (vb) st.setProperty(a, vb, pb); else st.removeProperty(a);
      if (va) st.setProperty(b, va, pa); else st.removeProperty(b);
    }
    ['text-align', 'float', 'clear'].forEach(function (k) { var v = st.getPropertyValue(k); if (SIDE[v]) st.setProperty(k, SIDE[v], st.getPropertyPriority(k)); });
    if (st.getPropertyValue('direction') === 'rtl') st.setProperty('direction', 'ltr', st.getPropertyPriority('direction'));
  }
  function mirrorRules(rules) { for (var i = 0; i < rules.length; i++) { var r = rules[i]; if (r.style && r.type !== 5) mirrorStyle(r.style); if (r.cssRules) mirrorRules(r.cssRules); } }
  var mirrored = new WeakSet();
  function mirrorSheet(sheet) { if (!sheet || mirrored.has(sheet)) return true; try { mirrorRules(sheet.cssRules); mirrored.add(sheet); return true; } catch (e) { return false; } } // a stylesheet from another origin (the fonts): not ours to read
  function mirrorAll(root) { var list = (root || document).styleSheets; for (var i = 0; i < list.length; i++) { var o = list[i].ownerNode; if (o && (o.id === 'ib-demo-style' || (o.hasAttribute && o.hasAttribute('data-i18n-off')))) continue; mirrorSheet(list[i]); } }
  function styleEl(el) { // a <style> written by a page (the orders page keeps its own in a shadow root): mirrored once its sheet is ready
    if (el.id === 'ib-demo-style' || el.hasAttribute('data-i18n-off')) return;
    var go = function (n) { if (el.sheet) { mirrorSheet(el.sheet); return; } if (n > 0) setTimeout(function () { go(n - 1); }, 30); }; go(20);
  }
  var inlineLtr = function (css) { return css.replace(/direction\s*:\s*rtl/g, 'direction:ltr').replace(/text-align\s*:\s*(right|left)\b/g, function (_, x) { return 'text-align:' + SIDE[x]; }); };
  function doEl(el) {
    if (el.tagName === 'STYLE') { styleEl(el); return; }
    if (el.tagName === 'LINK') { if (el.sheet) mirrorSheet(el.sheet); return; }
    for (var i = 0; i < ATTRS.length; i++) { var v = gA.call(el, ATTRS[i]); if (v && AR.test(v)) setAttr(el, ATTRS[i], v); }
    if (gA.call(el, 'dir') === 'rtl') sA.call(el, 'dir', 'ltr');
    if (el.shadowRoot) walk(el.shadowRoot);
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType === 1) doEl(root);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null); var list = [], n;
    while ((n = w.nextNode())) list.push(n);
    for (var i = 0; i < list.length; i++) { if (list[i].nodeType === 3) doText(list[i]); else doEl(list[i]); }
  }

  // ---------- text nodes
  var cTN = Document.prototype.createTextNode;
  Document.prototype.createTextNode = function (data) {
    var s = String(data); if (!AR.test(s)) return cTN.call(this, s);
    var e = tr(s); var n = cTN.call(this, e); orig.set(n, { a: s, e: e }); return n;
  };
  Object.defineProperty(CharacterData.prototype, 'data', { configurable: true, enumerable: true,
    get: function () { return this.nodeType === 3 ? textOf(this) : dData.get.call(this); },
    set: function (v) { var s = v == null ? '' : String(v); if (this.nodeType === 3) setText(this, s); else dData.set.call(this, s); } });
  Object.defineProperty(Node.prototype, 'nodeValue', { configurable: true, enumerable: true,
    get: function () { return this.nodeType === 3 ? textOf(this) : dValue.get.call(this); },
    set: function (v) { if (this.nodeType === 3) setText(this, v == null ? '' : String(v)); else dValue.set.call(this, v); } });
  Object.defineProperty(Node.prototype, 'textContent', { configurable: true, enumerable: true,
    get: function () { return readText(this); },
    set: function (v) {
      var s = v == null ? '' : String(v);
      if (this.nodeType === 3) { setText(this, s); return; }
      dText.set.call(this, s);
      if (this.nodeType === 1 && AR.test(s) && !SKIP[this.tagName] && !off(this)) { var n = this.firstChild; if (n && n.nodeType === 3) { var e = tr(s); orig.set(n, { a: s, e: e }); dData.set.call(n, e); } }
    } });
  var dInnerText = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'innerText');
  if (dInnerText && dInnerText.set) Object.defineProperty(HTMLElement.prototype, 'innerText', { configurable: true, enumerable: true, get: dInnerText.get, set: function (v) { dInnerText.set.call(this, v); if (!SKIP[this.tagName]) walk(this); } });
  // strings handed to append / prepend / before / after / replaceWith / replaceChildren become text nodes of the page
  [[Element.prototype, ['append', 'prepend', 'before', 'after', 'replaceWith', 'replaceChildren']], [DocumentFragment.prototype, ['append', 'prepend', 'replaceChildren']], [CharacterData.prototype, ['before', 'after', 'replaceWith']]].forEach(function (pair) {
    pair[1].forEach(function (name) {
      var nat = pair[0][name]; if (typeof nat !== 'function') return;
      pair[0][name] = function () { var a = []; for (var i = 0; i < arguments.length; i++) a.push(typeof arguments[i] === 'string' ? document.createTextNode(arguments[i]) : arguments[i]); return nat.apply(this, a); };
    });
  });
  var cloneN = Node.prototype.cloneNode;
  Node.prototype.cloneNode = function (deep) { // a copy keeps what the app wrote
    var c = cloneN.call(this, deep);
    if (this.nodeType === 3) { var o = orig.get(this); if (o) orig.set(c, o); return c; }
    if (deep && (this.nodeType === 1 || this.nodeType === 11) && this.firstChild) {
      var w1 = document.createTreeWalker(this, NodeFilter.SHOW_TEXT, null), w2 = document.createTreeWalker(c, NodeFilter.SHOW_TEXT, null), a, b;
      while ((a = w1.nextNode()) && (b = w2.nextNode())) { var o2 = orig.get(a); if (o2) orig.set(b, o2); }
    }
    if (this.nodeType === 1) { var m = attrO.get(this); if (m) attrO.set(c, Object.assign({}, m)); }
    return c;
  };

  // ---------- markup written as a string
  [Element.prototype, ShadowRoot.prototype].forEach(function (proto) {
    var d = Object.getOwnPropertyDescriptor(proto, 'innerHTML'); if (!d || !d.set) return;
    Object.defineProperty(proto, 'innerHTML', { configurable: true, enumerable: true, get: d.get, set: function (v) { d.set.call(this, v); if (this.nodeType === 1 && (SKIP[this.tagName] || off(this))) return; walk(this.tagName === 'TEMPLATE' ? this.content : this); } });
  });
  var iAH = Element.prototype.insertAdjacentHTML;
  Element.prototype.insertAdjacentHTML = function (pos, html) { iAH.call(this, pos, html); walk(/^(beforebegin|afterend)$/i.test(pos) ? this.parentNode : this); };
  var iAT = Element.prototype.insertAdjacentText;
  Element.prototype.insertAdjacentText = function (pos, text) { return iAT.call(this, pos, tr(String(text))); };

  // ---------- the attributes a person reads, and the direction
  Element.prototype.setAttribute = function (name, value) {
    var k = String(name).toLowerCase(); var v = String(value);
    if (IS_ATTR[k]) { setAttr(this, k, v); return; }
    if (k === 'dir' && v === 'rtl') { sA.call(this, k, 'ltr'); return; }
    if (k === 'style' && /text-align|direction/.test(v)) { sA.call(this, k, inlineLtr(v)); return; }
    sA.call(this, name, value);
  };
  Element.prototype.getAttribute = function (name) {
    var v = gA.call(this, name); if (v == null) return v;
    var m = attrO.get(this); var o = m && m[String(name).toLowerCase()]; return o && o.e === v ? o.a : v;
  };
  [[HTMLElement.prototype, 'title', 'title'], [HTMLInputElement.prototype, 'placeholder', 'placeholder'], [HTMLTextAreaElement.prototype, 'placeholder', 'placeholder'], [HTMLImageElement.prototype, 'alt', 'alt']].forEach(function (x) {
    var d = Object.getOwnPropertyDescriptor(x[0], x[1]); if (!d || !d.set) return;
    Object.defineProperty(x[0], x[1], { configurable: true, enumerable: true, get: d.get, set: function (v) { this.setAttribute(x[2], v == null ? '' : String(v)); } });
  });
  var dDir = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'dir');
  if (dDir && dDir.set) Object.defineProperty(HTMLElement.prototype, 'dir', { configurable: true, enumerable: true, get: dDir.get, set: function (v) { dDir.set.call(this, v === 'rtl' ? 'ltr' : v); } });
  var dTitle = Object.getOwnPropertyDescriptor(Document.prototype, 'title');
  if (dTitle && dTitle.set) Object.defineProperty(Document.prototype, 'title', { configurable: true, enumerable: true, get: dTitle.get, set: function (v) { dTitle.set.call(this, tr(String(v))); } });
  // el.dataset.l / .h / .tip are shown by the stylesheets (attr(data-l) …): written through the same door
  var dDs = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'dataset');
  var DS_KEYS = { l: 'data-l', h: 'data-h', tip: 'data-tip' };
  if (dDs && dDs.get && typeof Proxy === 'function') Object.defineProperty(HTMLElement.prototype, 'dataset', { configurable: true, enumerable: true, get: function () {
    var el = this; var ds = dDs.get.call(el);
    return new Proxy(ds, {
      get: function (t, k) { return typeof k === 'string' && DS_KEYS[k] ? (el.hasAttribute(DS_KEYS[k]) ? el.getAttribute(DS_KEYS[k]) : undefined) : t[k]; },
      set: function (t, k, v) { if (typeof k === 'string' && DS_KEYS[k]) el.setAttribute(DS_KEYS[k], String(v)); else t[k] = v; return true; },
      deleteProperty: function (t, k) { return delete t[k]; }, has: function (t, k) { return k in t; },
      ownKeys: function (t) { return Reflect.ownKeys(t); }, getOwnPropertyDescriptor: function (t, k) { return Reflect.getOwnPropertyDescriptor(t, k); },
    });
  } });

  // ---------- <select>: an option written without a value has its Arabic text as its value, as before
  var dOptV = Object.getOwnPropertyDescriptor(HTMLOptionElement.prototype, 'value');
  var optValue = function (o) { return gA.call(o, 'value') != null ? gA.call(o, 'value') : readText(o).replace(/\s+/g, ' ').trim(); };
  if (dOptV) Object.defineProperty(HTMLOptionElement.prototype, 'value', { configurable: true, enumerable: true, get: function () { return optValue(this); }, set: dOptV.set });
  var dOptT = Object.getOwnPropertyDescriptor(HTMLOptionElement.prototype, 'text');
  if (dOptT) Object.defineProperty(HTMLOptionElement.prototype, 'text', { configurable: true, enumerable: true, get: function () { return readText(this).replace(/\s+/g, ' ').trim(); }, set: function (v) { this.textContent = v; } });
  var dSelV = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
  if (dSelV) Object.defineProperty(HTMLSelectElement.prototype, 'value', { configurable: true, enumerable: true,
    get: function () { var i = this.selectedIndex; return i < 0 ? '' : optValue(this.options[i]); },
    set: function (v) { var s = String(v); for (var i = 0; i < this.options.length; i++) if (optValue(this.options[i]) === s) { this.selectedIndex = i; return; } this.selectedIndex = -1; } });

  // ---------- the browser's own boxes
  ['alert', 'confirm', 'prompt'].forEach(function (name) { var nat = window[name]; if (typeof nat === 'function') window[name] = function (msg, def) { return nat.call(window, tr(String(msg == null ? '' : msg)), def); }; });

  // ---------- left to right, and the page's own first markup (index.html)
  var html = document.documentElement; sA.call(html, 'dir', 'ltr'); sA.call(html, 'lang', 'en'); html.classList.add('ib-en');
  var first = function () { mirrorAll(document); walk(document.documentElement); document.querySelectorAll('[lang="ar"]').forEach(function (e) { sA.call(e, 'lang', 'en'); }); };
  first(); if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', first);
  window.addEventListener('load', function () { mirrorAll(document); });
  document.addEventListener('load', function (e) { var t = e.target; if (t && t.tagName === 'LINK' && t.sheet) mirrorSheet(t.sheet); }, true); // a stylesheet loaded later

  // for the demo's own scripts (web.js, boot.js) and the checks: translate a text, read what the page shows
  window.IBT = tr; window.IBT.shown = function (n) { return n.nodeType === 3 ? dData.get.call(n) : dText.get.call(n); };
})();
