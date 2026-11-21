// The public web demo: `npm run demo:web` → dist/demo-web (or `node tools/demo/build-web.mjs <out dir>`), served as a static site.
// The same copy as the Artifact demo (build.mjs: the app, the in-browser stand-in backend, the made-up data), as a full
// page with its link preview, plus web.js: the entry screen with the two business models, the banner, and the changes kept in this
// browser until «Reset». The demo-only behaviour in the app runs only when window.IB_DEMO === true, which web.js sets.
import { cpSync, readFileSync, readdirSync, statSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, FORBIDDEN } from './build.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SITE = 'https://demo.ibtekr.club';
export const TITLE = 'Ibtekr Ops — Live demo';
export const DESCRIPTION = 'An operations system for a handmade marketplace: orders synced from WooCommerce / Dokan, makers and commissions, an AI product studio, customer service and WhatsApp — in Arabic or English, on sample data.';
/** Phone numbers the made-up data may hold (and the web demo's own 0100000xxxx); any other mobile number in the build stops it. */
export const DEMO_PHONES = new Set(['01000000000', '01000000001', '01000000002', '01000000003', '01000000004', '01000000005', '01000000099', '01000007016', '01000007030', '01001112223', '01001234567', '01009007052', '01009766655', '01011122233', '01012345678', '01066778899', '01098765432', '01099999999', '01122334455', '01234567890', '01555666777']);
/** E-mail domains the made-up data may use; any other address in the build stops it (the vendored libraries are not scanned). */
export const DEMO_MAIL = /^name@mail\.com$|@(example\.(com|org)|ibtekr\.local|[a-z0-9-]+\.(test|invalid))$/i; // name@mail.com: the import template's hint
const PHONE = /(?<![0-9])(?:\+?20|0)(1[0125][0-9]{8})(?![0-9])/g;
const MAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[a-z]{2,}/g;

function walk(dir, base = dir, out = []) {
  for (const n of readdirSync(dir)) { const p = join(dir, n); if (statSync(p).isDirectory()) walk(p, base, out); else out.push(relative(base, p).split('\\').join('/')); }
  return out;
}
/** Every real-looking phone number or e-mail address in the built files, as «file: value». */
export function personalData(out) {
  const found = [];
  for (const f of walk(out)) {
    if (!/\.(js|html|css|json)$/.test(f)) continue; const s = readFileSync(join(out, f), 'utf8');
    for (const m of s.matchAll(PHONE)) if (!DEMO_PHONES.has('0' + m[1]) && !/^10000\d{5}$/.test(m[1])) found.push(`${f}: ${m[0]}`);
    if (f.startsWith('js/vendor/')) continue;
    for (const m of s.matchAll(MAIL)) if (!DEMO_MAIL.test(m[0])) found.push(`${f}: ${m[0]}`);
  }
  return found;
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export function buildWeb(out) {
  out = resolve(out); build(out);
  rmSync(join(out, 'files.json'), { force: true }); // the Artifact demo's file list — the web demo is served as plain files
  cpSync(join(ROOT, 'tools', 'demo', 'web.js'), join(out, 'demo', 'web.js'));
  // the English demo: the layer that writes the page in English, and the dictionary — every tools/demo/i18n/*.json ({ Arabic: English })
  // and patterns.json ([[regex, replacement with $1…]]) as one script (loaded only when the visitor picks English)
  cpSync(join(ROOT, 'tools', 'demo', 'i18n.js'), join(out, 'demo', 'i18n.js'));
  const tdir = join(ROOT, 'tools', 'demo', 'i18n'); const d = {}; let p = [];
  if (existsSync(tdir)) for (const f of readdirSync(tdir).sort()) { if (!f.endsWith('.json')) continue; const j = JSON.parse(readFileSync(join(tdir, f), 'utf8')); if (f === 'patterns.json') p = j; else for (const [k, v] of Object.entries(j)) { const key = k.trim(); if (key && typeof v === 'string' && v.trim()) d[key] = v.trim(); } }
  writeFileSync(join(out, 'demo', 'en.js'), 'window.IB_EN=' + JSON.stringify({ d, p }) + ';\n');
  const og = join(ROOT, 'tools', 'demo', 'og-image.png'); if (existsSync(og)) cpSync(og, join(out, 'og-image.png'));
  const vid = join(ROOT, 'docs', 'media', 'demo-walkthrough.mp4'); if (existsSync(vid)) cpSync(vid, join(out, 'demo-walkthrough.mp4')); // the README's video link
  const body = readFileSync(join(out, 'index.html'), 'utf8').replace(/^<title>[^<]*<\/title>\n/, '');
  const at = body.indexOf('<script src="demo/shim.js">'); if (at < 0) throw new Error('demo:web: the shim is no longer in the page');
  const meta = [
    '<meta charset="utf-8">', '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
    `<title>${esc(TITLE)}</title>`, `<meta name="description" content="${esc(DESCRIPTION)}">`, `<link rel="canonical" href="${SITE}/">`,
    '<meta property="og:type" content="website">', `<meta property="og:site_name" content="Ibtekr Ops">`, `<meta property="og:url" content="${SITE}/">`,
    `<meta property="og:title" content="${esc(TITLE)}">`, `<meta property="og:description" content="${esc(DESCRIPTION)}">`,
    `<meta property="og:image" content="${SITE}/og-image.png">`, '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">',
    '<meta name="twitter:card" content="summary_large_image">', `<meta name="twitter:title" content="${esc(TITLE)}">`,
    `<meta name="twitter:description" content="${esc(DESCRIPTION)}">`, `<meta name="twitter:image" content="${SITE}/og-image.png">`,
  ].join('\n');
  const head = body.slice(0, at).replace(/^(<link\b[^>]*>)+\n?/, (links) => '');
  const links = (body.match(/^(?:<link\b[^>]*>)+/) || [''])[0];
  const page = `<!doctype html>\n<html lang="ar" dir="rtl">\n<head>\n${meta}\n${links}\n</head>\n<body>\n${head}<script src="demo/web.js"></script>${body.slice(at)}</body>\n</html>\n`;
  // every deploy is served fresh: the host's CDN and the browser kept the old scripts under the same URLs (a redeploy showed no change).
  // The build's id (a hash of its files) goes on every local script and stylesheet of the page, web.js drops a visitor's saved changes
  // made on another build, and .htaccess (the app's own cache rule) makes html / js / css revalidate on every load.
  const id = createHash('sha256'); id.update('recipe 2: the modules carry the id too'); for (const f of walk(out).sort()) { if (f === 'index.html') continue; id.update(f); id.update(readFileSync(join(out, f))); }
  const BUILD = id.digest('hex').slice(0, 10);
  const webJs = readFileSync(join(out, 'demo', 'web.js'), 'utf8'); if (!webJs.includes("'__BUILD__'")) throw new Error('demo:web: web.js lost its build mark');
  writeFileSync(join(out, 'demo', 'web.js'), webJs.replace("'__BUILD__'", `'${BUILD}'`));
  writeFileSync(join(out, 'index.html'), page.replace(/(<(?:script\b[^>]*\bsrc|link\b[^>]*\bhref)=")((?!https?:|data:|\/\/)[^"?#]+\.(?:js|css))"/g, `$1$2?v=${BUILD}"`));
  // the modules the page imports (boot.js → web-seed.js → the stand-in backend…) carry the build's id too: a browser that kept an
  // older web-seed.js would give the new boot.js a module without what it imports (the page stopped with a SyntaxError)
  for (const f of walk(join(out, 'demo'))) { if (!/\.m?js$/.test(f)) continue; const fp = join(out, 'demo', f); const src = readFileSync(fp, 'utf8');
    const next = src.replace(/(\bfrom\s*|\bimport\s*\(?\s*)(['"])(\.{1,2}\/[^'"?]+\.m?js)\2/g, (m, pre, q, path) => `${pre}${q}${path}?v=${BUILD}${q}`);
    if (next !== src) writeFileSync(fp, next); }
  writeFileSync(join(out, '.htaccess'), ['# The web demo: html / js / css revalidate on every load (cheap 304s), so a redeploy is seen at once.', '<FilesMatch "\\.(html|js|css)$">', '  <IfModule mod_headers.c>', '    Header set Cache-Control "no-cache"', '    Header unset Expires', '  </IfModule>', '</FilesMatch>', ''].join('\n'));
  for (const f of walk(out)) { if (!/\.(js|html|css|json)$/.test(f)) continue; const s = readFileSync(join(out, f), 'utf8'); const hit = FORBIDDEN.find((re) => re.test(s)); if (hit) throw new Error(`demo:web: ${f} still holds ${hit}`); }
  const personal = personalData(out); if (personal.length) throw new Error('demo:web: a phone number or e-mail that is not made up —\n' + personal.join('\n'));
  return { out };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { out } = buildWeb(process.argv[2] || join(ROOT, 'dist', 'demo-web'));
  console.log(`web demo: ${out}`);
}
