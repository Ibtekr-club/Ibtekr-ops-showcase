// Lists every Arabic text the demo can show: the string literals of the app's scripts and of the demo's data (template parts apart,
// markup split into its texts and readable attributes), and the pages' own markup. `node extract.mjs <out dir>` writes
// strings.json — [{ s: text, f: first file }] in file order. The dictionary (tools/demo/i18n/*.json) is checked against it.
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const AR = /[\u0600-\u06FF]/;
const walk = (dir, out = []) => { for (const n of readdirSync(dir).sort()) { const p = join(dir, n); if (statSync(p).isDirectory()) walk(p, out); else out.push(p); } return out; };

const ESC = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' };
const unesc = (s) => s.replace(/\\(u\{([0-9a-fA-F]+)\}|u([0-9a-fA-F]{4})|x([0-9a-fA-F]{2})|\r?\n|[\s\S])/g, (m, all, u1, u2, x) => (u1 ? String.fromCodePoint(parseInt(u1, 16)) : u2 ? String.fromCharCode(parseInt(u2, 16)) : x ? String.fromCharCode(parseInt(x, 16)) : /^\r?\n$/.test(all) ? '' : ESC[all] !== undefined ? ESC[all] : all));
/** The string literals and template parts of a script (comments and regular expressions left out). */
export function literals(src) {
  const out = []; let i = 0; const n = src.length; let last = ''; // last: the last significant character or word before a «/»
  const tpl = []; // depth of braces inside each open ${ … }
  const readTpl = () => { // from just after ` or after the } that closes ${…}; returns when the template ends or opens ${
    let buf = '';
    while (i < n) { const c = src[i]; if (c === '\\') { buf += src.slice(i, i + 2); i += 2; continue; } if (c === '`') { i++; out.push(unesc(buf)); last = 'x'; return; } if (c === '$' && src[i + 1] === '{') { i += 2; out.push(unesc(buf)); tpl.push(0); last = '('; return; } buf += c; i++; }
  };
  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
    if (c === "'" || c === '"') { let j = i + 1, buf = ''; while (j < n && src[j] !== c && src[j] !== '\n') { if (src[j] === '\\') { buf += src.slice(j, j + 2); j += 2; } else buf += src[j++]; } out.push(unesc(buf)); i = j + 1; last = 'x'; continue; }
    if (c === '`') { i++; readTpl(); continue; }
    if (c === '{') { if (tpl.length) tpl[tpl.length - 1]++; i++; last = c; continue; }
    if (c === '}') { if (tpl.length) { if (tpl[tpl.length - 1] === 0) { tpl.pop(); i++; readTpl(); continue; } tpl[tpl.length - 1]--; } i++; last = c; continue; }
    if (c === '/') { // a regular expression, unless what stands before it is a value
      if (/^[)\]}x\w]$/.test(last) && !/^(return|typeof|case|in|of|delete|void|throw|new|do|else)$/.test(last)) { i++; last = c; continue; }
      let j = i + 1, cls = false; while (j < n && src[j] !== '\n') { if (src[j] === '\\') { j += 2; continue; } if (src[j] === '[') cls = true; else if (src[j] === ']') cls = false; else if (src[j] === '/' && !cls) break; j++; }
      i = j + 1; while (i < n && /[a-z]/.test(src[i])) i++; last = 'x'; continue;
    }
    if (/[A-Za-z_$]/.test(c)) { let j = i; while (j < n && /[\w$]/.test(src[j])) j++; last = src.slice(i, j); if (!/^(return|typeof|case|in|of|delete|void|throw|new|do|else)$/.test(last)) last = 'x'; i = j; continue; }
    if (/[0-9]/.test(c)) { last = 'x'; i++; continue; }
    if (!/\s/.test(c)) last = c;
    i++;
  }
  return out;
}
const READ_ATTRS = 'placeholder|title|aria-label|alt|data-l|data-h|data-tip|label';
/** A text as the page will hold it: markup split into its text runs and readable attributes. */
export function parts(s) {
  if (!/<[a-zA-Z/!][^>]*>|<[a-zA-Z]/.test(s)) return [s];
  const out = [];
  for (const m of s.matchAll(new RegExp(`(?:${READ_ATTRS})\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'g'))) out.push(m[1] != null ? m[1] : m[2]);
  for (const t of s.replace(/<[^>]*>?/g, '\u0000').split('\u0000')) out.push(t);
  return out;
}
const HTML_ENT = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': '\u00a0' };
const clean = (t) => t.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => HTML_ENT[m]).trim();

export function extract() {
  const files = [
    ...walk(join(ROOT, 'app')).filter((f) => /\.(js|html|css)$/.test(f) && !f.includes(`${join('js', 'vendor')}`)),
    ...walk(join(ROOT, 'tools', 'demo')).filter((f) => /\.(js|mjs)$/.test(f) && !f.includes('i18n') && !/build(-web)?\.mjs$/.test(f)),
    ...walk(join(ROOT, 'tests', 'e2e')).filter((f) => /mock[^/]*\.mjs$/.test(f)),
    ...walk(join(ROOT, 'mock')).filter((f) => /\.(js|mjs)$/.test(f)),
  ];
  const seen = new Map();
  const add = (t, f) => { const k = clean(t); if (k && AR.test(k) && !seen.has(k)) seen.set(k, f); };
  for (const f of files) {
    const src = readFileSync(f, 'utf8'); const rel = relative(ROOT, f).split('\\').join('/');
    if (f.endsWith('.html')) { for (const t of parts(src.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, ''))) add(t, rel); continue; }
    if (f.endsWith('.css')) { for (const m of src.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/content\s*:\s*(?:"([^"]*)"|'([^']*)')/g)) add(m[1] != null ? m[1] : m[2], rel); continue; }
    for (const lit of literals(src)) { if (!AR.test(lit)) continue; for (const t of parts(lit)) add(t, rel); }
  }
  return [...seen].map(([s, f]) => ({ s, f }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = resolve(process.argv[2] || '.'); mkdirSync(out, { recursive: true });
  const list = extract(); writeFileSync(join(out, 'strings.json'), JSON.stringify(list, null, 0));
  const words = list.reduce((n, x) => n + x.s.split(/\s+/).length, 0); const by = {};
  for (const x of list) by[x.f] = (by[x.f] || 0) + 1;
  console.log(`${list.length} texts, ${words} words`); console.log(Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([f, c]) => `${c} ${f}`).join('\n'));
}
