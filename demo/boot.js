// «نسخة التعليقات» — second half of shim.js: loads the tests' stand-in backend (tests/e2e/supabase-mock.mjs and what it imports,
// copied next to this file by build.mjs) with a page object that hands its route handlers to the shim, then signs in as the
// stand-in's admin through the sign-in screen itself (the same steps as the tests), so the app opens on the dashboard.
import { installSupabaseMock, USERS, DEV_PW } from './tests/e2e/supabase-mock.js?v=1152d06ae8';
import { demoSeed, demoAfter } from './seed.js?v=1152d06ae8';
import { webSeed, englishData } from './web-seed.js?v=1152d06ae8';

const D = window.__ibDemo;
const page = {
  addInitScript: async (fn, arg) => { try { if (typeof fn === 'function') fn(arg); } catch (e) { /* a test-only preset */ } },
  route: async (pattern, handler) => { D.handlers.push({ pattern, handler }); },
  unroute: async () => {},
};
// seed.js: one made-up set for every section, so each page has something to show (the stand-in itself starts almost empty)
D.mock = await installSupabaseMock(page, demoSeed());
demoAfter(D.mock);
// the stand-in's Magnific account reads as linked here, so the studio's and the campaign's Magnific bars can be tried (demo data only)
if (D.mock.magnific) { D.mock.magnific.linked = true; D.mock.magnific.account = 'demo'; }
const admin = USERS.find((u) => u.role_id === 'admin' && u.status === 'active');
// the web demo (web.js): nothing opens before a business model is picked; then the «store» row says which one, and the writes
// of earlier visits are sent again (with a token of this visit) before the page asks for anything
const W = window.__ibDemoWeb;
if (W && !W.mode) { D.uncover(); await new Promise(() => {}); } // the entry screen is up: nothing more until a choice reloads the page
if (W) {
  webSeed(D.mock, W.mode); // the business model's data (web-seed.js)
  if (W.lang === 'en' && typeof window.IBT === 'function') englishData(D.mock, window.IBT); // the English demo: the data's free texts in English too
  const put = (section, data) => { D.mock.settings = (D.mock.settings || []).filter((r) => r.section !== section).concat([{ section, data, updated_at: new Date().toISOString(), updated_by: null }]); };
  put('store', W.mode === 'single' ? { platform: 'woo', mode: 'single', dokan: true, margin: 40 } : { platform: 'woo', mode: 'marketplace', dokan: true });
  if (W.mode === 'single') { const g = ((D.mock.settings || []).find((r) => r.section === 'general') || {}).data || {}; put('general', { ...g, company: 'Decoro' }); }
  const log = W.log();
  if (log.length) {
    const call = (method, path, body, headers) => D.serve(new Request(D.HOST + path, { method, headers: { apikey: 'mock-anon-key', ...headers }, body }));
    W.replaying(true);
    try {
      const r = await call('POST', '/auth/v1/token?grant_type=password', JSON.stringify({ email: admin.email, password: DEV_PW }), { 'content-type': 'application/json' });
      const token = (await r.json()).access_token;
      for (const x of log) {
        try { await D.serve(new Request(x.u, { method: x.m, headers: { ...x.h, apikey: 'mock-anon-key', authorization: 'Bearer ' + token }, body: x.b })); } catch (e) { /* a write that no longer applies */ }
      }
    } finally { W.replaying(false); }
  }
}
D.open();

const put = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
let sent = false; const t0 = Date.now();
const tick = setInterval(() => {
  const login = document.getElementById('login'); const root = document.getElementById('root');
  const inApp = root && !root.hidden && root.children.length && !(login && !login.hidden && login.offsetParent);
  if (sent && inApp) { clearInterval(tick); D.uncover(); return; }
  if (Date.now() - t0 > 14000) { clearInterval(tick); D.uncover(); return; }
  if (sent) return;
  const id = document.getElementById('lg-id'); const pw = document.getElementById('lg-pw');
  const go = login ? Array.from(login.querySelectorAll('button')).find((b) => b.textContent.trim() === 'دخول') : null;
  if (!id || !pw || !go) return;
  put(id, admin.email); put(pw, DEV_PW); go.click(); sent = true;
}, 120);
