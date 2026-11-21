// The texts single-seller mode rewrites (IBSettings.oneSeller) are not literals of the code: lists every dictionary text whose
// single-seller form differs and is not in the dictionary yet. `node single-variants.mjs <out.json>`
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const src = readFileSync(join(ROOT, 'app', 'js', 'adapter', 'settings.js'), 'utf8');
const cut = (from, to) => { const a = src.indexOf(from); const b = src.indexOf(to, a); if (a < 0 || b < 0) throw new Error('settings.js changed: ' + from); return src.slice(a, b); };
const code = cut('  const ONE_SELLER_RULES = [', '  function oneSeller(t) {') + cut('  function oneSeller(t) {', '\n  }\n') + '\n  }\n';
const oneSeller = new Function('single', code + '; return oneSeller;')(() => true);
// the settings' data page has its own rewrite before that one (block 17: dataText, and the «keep» note without the makers)
const b17 = readFileSync(join(ROOT, 'app', 'js', 'blocks', '17-page-settings.js'), 'utf8');
const dtAt = b17.indexOf('  const dataText = (t) => '); if (dtAt < 0) throw new Error('block 17 changed: dataText');
const dataText = new Function('SG', 'OS', b17.slice(dtAt, b17.indexOf('\n', dtAt)) + '; return dataText;')(() => true, oneSeller);
const FORMS = [oneSeller, dataText, (t) => dataText(String(t).replace(' ومبتكريه', ''))];
export function variants() {
  const dir = join(ROOT, 'tools', 'demo', 'i18n'); const dict = {};
  for (const f of readdirSync(dir).sort()) if (f.endsWith('.json') && f !== 'patterns.json') Object.assign(dict, JSON.parse(readFileSync(join(dir, f), 'utf8')));
  const out = {};
  for (const k of Object.keys(dict)) for (const f of FORMS) { const v = String(f(k)).trim(); if (v && v !== k && dict[v] === undefined && out[v] === undefined && /[\u0621-\u064A]/.test(v)) out[v] = { from: k, en: dict[k] }; }
  return out;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) { const v = variants(); if (process.argv[2]) writeFileSync(resolve(process.argv[2]), JSON.stringify(v, null, 1)); console.log(Object.keys(v).length, 'single-seller texts not in the dictionary'); }
