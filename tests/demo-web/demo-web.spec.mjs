import { test, expect } from '@playwright/test';
// The web demo in both business models: the entry screen, the banner, the pages, a change kept across a reload, the switch, Reset.

const inApp = async (page) => { await expect(page.locator('#demo-bar')).toBeVisible(); await expect(page.locator('#root')).toBeVisible({ timeout: 30000 }); await expect(page.locator('#demo-cover')).toHaveCount(0, { timeout: 30000 }); };
const go = async (page, hash) => { await page.evaluate((h) => { location.hash = h; }, hash); };
const makersLink = (page) => page.locator('.sidebar .nav-item[data-page="vendors"]');

test('the entry screen offers the two business models; nothing else opens before a choice', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#demo-entry')).toBeVisible();
  await expect(page.locator('[data-demo-mode]')).toHaveCount(2);
  await expect(page.locator('[data-demo-mode="marketplace"]')).toContainText('Marketplace');
  await expect(page.locator('[data-demo-mode="single"]')).toContainText('Decoro');
  await expect(page.locator('#demo-bar')).toHaveCount(0);
  expect(await page.evaluate(() => window.IB_DEMO)).toBe(true);
});

test('marketplace: dashboard, orders (a status change kept after a reload), products, customer service, makers; the outside-world toast; Reset', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-demo-mode="marketplace"]').click();
  await inApp(page);
  await expect(page.locator('#demo-bar')).toContainText('Demo mode');
  await expect(page.locator('[data-demo-switch="marketplace"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#root')).toContainText('لوحة التحكم');
  expect(await page.evaluate(() => window.IBSettings.single())).toBe(false);
  await expect(makersLink(page)).toBeVisible({ timeout: 20000 });

  await go(page, 'orders');
  const st = page.locator('#orders select[data-st="180656"]');
  await expect(st).toBeVisible({ timeout: 20000 });
  await st.selectOption('جاري التنفيذ');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('ib.demo.log') || '[]').length)).toBeGreaterThan(0);
  await page.reload(); await inApp(page);
  await go(page, 'orders');
  await expect(page.locator('#orders select[data-st="180656"]')).toHaveValue('جاري التنفيذ', { timeout: 20000 });

  for (const [hash, text] of [['products', 'المنتجات'], ['cs', 'خدمة العملاء']]) {
    await go(page, hash);
    await expect(page.locator('#root main, #root').first()).toContainText(text, { timeout: 20000 });
  }
  // the makers: eight of them, and the statement adds up (Dokan balance = earning − approved withdrawals, web-seed.js)
  await makersLink(page).click();
  await expect(page.locator('#root')).toContainText('من 8 مبتكر مسجّل', { timeout: 20000 });
  const sums = await page.evaluate(() => { const a = window.__ibDemo.mock.acc; return a.dokan_balances.map((b) => [b.balance, b.earning - a.dokan_withdrawals.filter((w) => w.vendor_id === b.vendor_id && w.status === 'approved' && w.id > 600).reduce((t, w) => t + w.amount, 0)]); });
  for (const [bal, want] of sums.slice(3)) expect(bal).toBe(want);
  // orders at every status
  const statuses = await page.evaluate(() => [...new Set(window.__ibDemo.mock.orders.map((o) => o.status))].sort());
  expect(statuses).toEqual(['استرجاع', 'جاري التنفيذ', 'جاهز للشحن', 'فشل', 'قيد الانتظار', 'قيد الشحن', 'معلّق', 'مكتمل', 'ملغي'].sort());

  // the header assistant answers from the demo's own data after a short wait
  await page.getByRole('button', { name: 'مساعد AI' }).click();
  await page.fill('.ai-input', 'إيه الأوردرات المتأخرة؟'); await page.locator('.ai-form').press('Enter');
  await expect(page.locator('.ai-panel .ai-msg.ai').last()).toContainText('IB-182013', { timeout: 10000 });
  await page.keyboard.press('Escape');

  await page.evaluate(() => window.__ibDemoAfter('POST', window.__ibDemo.HOST + '/functions/v1/share-mail', '{}', {}));
  await expect(page.locator('#demo-toast')).toHaveText('ده ديمو — في السيستم الحقيقي هيتبعت إشعار');

  await page.locator('[data-demo-reset]').click();
  await inApp(page);
  await go(page, 'orders');
  await expect(page.locator('#orders select[data-st="180656"]')).toHaveValue('معلّق', { timeout: 20000 });
});

test.setTimeout(180000);
test('single store: Decoro without makers and nothing about makers on any page, the single-seller switch without «قريبًا»; switching back to the marketplace', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-demo-mode="single"]').click();
  await inApp(page);
  await expect(page.locator('[data-demo-switch="single"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => window.IBSettings.single())).toBe(true);
  await expect(makersLink(page)).toBeHidden({ timeout: 20000 });
  await go(page, 'orders');
  await expect(page.locator('#orders select[data-st="180656"]')).toBeVisible({ timeout: 20000 });
  expect(await page.evaluate(() => window.__ibDemo.mock.products.every((p) => p.vendor_id === window.__ibDemo.mock.vendors[0].id) && window.__ibDemo.mock.vendors[0].name === 'Decoro')).toBe(true);
  expect(await page.evaluate(() => window.__ibDemo.mock.subOrders.length)).toBe(0);
  await go(page, 'acc-overview');
  await expect(page.locator('.acc-ov-tile').first()).toBeVisible({ timeout: 20000 });
  await expect(page.locator('.acc-ov-tile[data-acc-ov="vendors"]')).toBeHidden(); // no makers to pay in a single store
  // nothing about makers, Dokan or sub-orders shows anywhere in a single store (the owner 20 Nov) — every page and its tabs
  const visibleMakers = () => page.evaluate(() => {
    const re = /مبتكر|Dokan|دوكان|(?:أوردر|الأوردر|أوردرات|الأوردرات)\s*(?:ال)?فرعي/; const out = [];
    const walk = (root) => { const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
      while ((n = tw.nextNode())) { const el = n.parentElement; if (!el || !re.test(n.textContent) || el.closest('#demo-bar, .ai-panel, script, style, [hidden], [data-demo-hidden]')) continue; const r = el.getBoundingClientRect(); if (r.width && getComputedStyle(el).visibility !== 'hidden') out.push(n.textContent.trim().slice(0, 60)); }
      root.querySelectorAll('*').forEach((e) => { if (e.shadowRoot) walk(e.shadowRoot); }); };
    walk(document.body); return out; });
  for (const pg of ['dashboard', 'orders', 'accounts', 'inventory', 'products', 'cs', 'autoreply', 'tickets', 'reports']) {
    await page.locator(`.sidebar .nav-item[data-page="${pg}"]`).click(); await page.waitForTimeout(1500);
    const tabs = await page.locator('#root [role="tab"]:visible').allTextContents();
    for (const t of [null, ...tabs.slice(0, 10)]) {
      if (t) { await page.locator('#root [role="tab"]:visible', { hasText: t.trim() }).first().click(); await page.waitForTimeout(900); }
      expect(await visibleMakers(), pg + (t ? ' › ' + t.trim() : '')).toEqual([]);
    }
  }
  // and not for a moment after a reload: the text is hidden before the browser paints it
  await page.reload(); const flashed = new Set(); const t0 = Date.now();
  while (Date.now() - t0 < 6000) { const covered = await page.evaluate(() => !!document.getElementById('demo-cover')); if (!covered) (await visibleMakers()).forEach((x) => flashed.add(x)); await page.waitForTimeout(30); }
  expect([...flashed]).toEqual([]);
  await go(page, 'settings-general');
  await expect(page.locator('[data-store-single]')).toHaveAttribute('aria-checked', 'true', { timeout: 20000 });
  await expect(page.locator('[data-store-single]')).toBeVisible(); // ready in the demo: the switch itself, not the «قريبًا» tag (Shopify / EasyOrders keep theirs)
  await page.locator('[data-demo-switch="marketplace"]').click();
  await inApp(page);
  expect(await page.evaluate(() => window.IBSettings.single())).toBe(false);
  await expect(makersLink(page)).toBeVisible({ timeout: 20000 });
});

// the texts a page shows that still hold Arabic letters (the English demo reads back the Arabic the app wrote, so what is shown
// is asked from the layer itself)
const arabicShown = (page) => page.evaluate(() => {
  const AR = /[\u0621-\u064A]/; const out = [];
  const vis = (el) => { if (!el || el.closest('#demo-bar, .dm-lang, script, style, [hidden]')) return false; const r = el.getBoundingClientRect(); return r.width > 0 && getComputedStyle(el).visibility !== 'hidden'; };
  const walk = (root) => { const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT); let n;
    while ((n = tw.nextNode())) { if (n.nodeType === 1) { if (n.shadowRoot) walk(n.shadowRoot); continue; } const t = window.IBT.shown(n); if (t && AR.test(t) && vis(n.parentElement)) out.push(t.trim().slice(0, 80)); } };
  walk(document.body); return out;
});
test('English: the switch under «الإعدادات» turns the demo to English, left to right, on every page of both models; back to Arabic as it was', async ({ page }) => {
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.locator('[data-demo-mode="marketplace"]').click();
  await inApp(page);
  // Arabic first: the layer is not even loaded
  expect(await page.evaluate(() => [document.documentElement.dir, typeof window.IBT, typeof window.IB_EN])).toEqual(['rtl', 'undefined', 'undefined']);
  const sw = page.locator('.sidebar .dm-lang');
  await expect(sw).toBeVisible();
  expect(await page.evaluate(() => { const sb = document.querySelector('.sidebar'); return sb.lastElementChild.classList.contains('dm-lang') && sb.lastElementChild.previousElementSibling.dataset.page; })).toBe('settings'); // under «الإعدادات»
  await sw.locator('[data-demo-lang="en"]').click();
  await inApp(page);
  expect(await page.evaluate(() => [document.documentElement.dir, document.documentElement.lang])).toEqual(['ltr', 'en']);
  await expect(page.locator('.sidebar .nav-item[data-page="orders"]')).toHaveText('Orders');
  await expect(page.locator('.sidebar .dm-lang [data-demo-lang="en"]')).toHaveAttribute('aria-pressed', 'true');
  for (const mode of ['marketplace', 'single']) {
    if (mode === 'single') { await page.locator('[data-demo-switch="single"]').click(); await inApp(page); await expect(page.locator('.sidebar .nav-item[data-page="orders"]')).toHaveText('Orders'); }
    const pages = await page.$$eval('.sidebar .nav-item[data-page]', (ns) => ns.filter((n) => !n.hidden).map((n) => n.dataset.page));
    for (const pg of pages) {
      await page.locator(`.sidebar .nav-item[data-page="${pg}"]`).click(); await page.waitForTimeout(1500);
      expect(await arabicShown(page), `${mode} › ${pg}`).toEqual([]);
    }
  }
  // the app still works in its own words: an order's status is read back as the app wrote it, and a change is kept
  await go(page, 'orders');
  const st = page.locator('#orders select[data-st]').first(); await expect(st).toBeVisible({ timeout: 20000 });
  expect(await st.evaluate((el) => /[\u0621-\u064A]/.test(el.value))).toBe(true);
  expect(errors).toEqual([]);
  // back to Arabic
  await page.locator('.sidebar .dm-lang [data-demo-lang="ar"]').click();
  await inApp(page);
  expect(await page.evaluate(() => [document.documentElement.dir, typeof window.IBT])).toEqual(['rtl', 'undefined']);
  await expect(page.locator('.sidebar .nav-item[data-page="orders"]')).toHaveText('الأوردرات');
});


// The phone and tablet pass (21 Nov): look and touch only — the same pages, laid out for a thumb.
test.describe('a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const PAGES = ['dashboard', 'orders', 'vendors', 'accounts', 'inventory', 'products', 'cs', 'autoreply', 'tickets', 'reports', 'marketing', 'ai', 'hr', 'settings', 'profile'];
  test('one-line banner, no page scrolls sideways, text of 12px at least, the main action by the thumb, menus from the bottom, a conversation on the whole screen', async ({ page }) => {
    test.setTimeout(240000);
    await page.goto('/'); await page.locator('[data-demo-mode="marketplace"]').click(); await inApp(page);
    // the banner: no «Demo» word, the language and the model each a drop-down, Reset — all on screen, on one line
    await expect(page.locator('#demo-bar > b')).toBeHidden(); await expect(page.locator('#demo-bar [data-demo-switch]').first()).toBeHidden();
    const bar = await page.evaluate(() => [...document.querySelectorAll('#demo-bar [data-demo-dd], #demo-bar [data-demo-reset]')].map((b) => { const r = b.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right), Math.round(r.top)]; }));
    expect(bar.length).toBe(3); for (const [l, r] of bar) { expect(l).toBeGreaterThanOrEqual(0); expect(r).toBeLessThanOrEqual(390); }
    const tops = bar.map((x) => x[2]); expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(4);
    await page.locator('[data-demo-dd="mode"]').click(); await expect(page.locator('[data-demo-dd-opt="single"]')).toBeVisible(); await expect(page.locator('[data-demo-dd-opt="marketplace"]')).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.press('Escape'); await expect(page.locator('[data-demo-dd-opt="single"]')).toBeHidden();
    await page.locator('[data-demo-dd="lang"]').click(); await expect(page.locator('[data-demo-dd-opt="en"]')).toBeVisible(); await page.keyboard.press('Escape');
    // the header: search · assistant · bell · account — «إجراءات سريعة» and «ابدأ الدوام» are rows of the account's menu
    const top = await page.evaluate(() => ['.topbar .ai-btn', '.topbar .notif-btn', '.topbar .user-btn'].map((s) => { const r = document.querySelector(s).getBoundingClientRect(); return [r.width, r.height]; }));
    for (const [w, h] of top) { expect(w).toBeGreaterThanOrEqual(44); expect(h).toBeGreaterThanOrEqual(44); }
    expect(await page.evaluate(() => document.querySelector('.topbar .search').getBoundingClientRect().width)).toBeGreaterThan(150);
    expect(await page.evaluate(() => ['.topbar .qa-anchor > .btn', '.topbar .clock-widget > .btn'].map((s) => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().width) : 0; }))).toEqual([1, 1]);
    await page.locator('.topbar .user-btn').click(); await expect(page.locator('.menu.acct [data-m-clock]')).toContainText('ابدأ الدوام'); await expect(page.locator('.menu.acct [data-m-quick]')).toContainText('إجراءات سريعة');
    await expect(page.locator('.menu.acct .opt')).toHaveCount(8); // the two that moved + the six it had
    await page.locator('.menu.acct [data-m-quick]').click(); await expect(page.locator('.topbar .qa-anchor .menu')).toBeVisible(); await page.keyboard.press('Escape');
    await page.locator('.topbar .user-btn').click(); await page.locator('.menu.acct [data-m-clock]').click(); // the same «ابدأ الدوام»: the shift starts
    await expect(page.locator('.topbar .clock-widget .clock')).toHaveCount(1); await page.locator('.topbar .user-btn').click(); await expect(page.locator('.menu.acct [data-m-clock]')).toContainText('على الدوام');
    await page.locator('.menu.acct [data-m-clock]').click(); const end = page.locator('.menu.clock-pop .btn'); await expect(end).toBeVisible(); // its details, with «إنهاء الدوام» a real button
    const eb = await end.boundingBox(); expect(eb.width).toBeGreaterThan(200); expect(eb.height).toBeGreaterThanOrEqual(44); await expect(end).toContainText('إنهاء الدوام');
    await page.keyboard.press('Escape');
    // every page: nothing wider than the screen, nothing written under 12px (the bell's count aside), a typed field at 16px
    for (const pg of PAGES) {
      await go(page, pg); await page.waitForTimeout(1200);
      const m = await page.evaluate(() => {
        const out = { over: Math.max(document.documentElement.scrollWidth - innerWidth, document.body.scrollWidth - document.body.clientWidth), tiny: [], field: [] }; // the demo's scroller is <body>
        const tw = document.createTreeWalker(document.querySelector('#root'), NodeFilter.SHOW_TEXT); let n;
        while ((n = tw.nextNode())) { const el = n.parentElement; if (!n.nodeValue.trim() || !el || el.closest('.notif-badge, [hidden], script, style')) continue; const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue; const f = parseFloat(getComputedStyle(el).fontSize); if (f > 0 && f < 12) out.tiny.push(String(el.className).slice(0, 30) + ':' + f); }
        document.querySelectorAll('#root input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=hidden]), #root textarea').forEach((el) => { if (el.getBoundingClientRect().width > 0 && parseFloat(getComputedStyle(el).fontSize) < 16) out.field.push(el.className || el.name || el.type); });
        return out;
      });
      expect(m.over, pg + ' scrolls sideways').toBeLessThanOrEqual(0);
      expect(m.tiny, pg + ' has text under 12px').toEqual([]);
      expect(m.field, pg + ' has a field under 16px').toEqual([]);
    }
    // the phone's own design: the number cards on one sliding line (two and the edge of a third), a page's actions on one line,
    // buttons of a hand's size with one corner, settings' home as a list of rows
    await go(page, 'dashboard'); await page.waitForTimeout(800);
    const d = await page.evaluate(() => { const k = document.querySelector('.dash-kpis'); const cards = [...k.querySelectorAll(':scope > .card.kpi')].map((c) => c.getBoundingClientRect()); const acts = [...document.querySelectorAll('#pg-dashboard .page-head .actions > *')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => Math.round(e.getBoundingClientRect().top));
      const btn = getComputedStyle(document.querySelector('#pg-dashboard .page-head .actions .btn')); return { lines: new Set(cards.map((r) => Math.round(r.top))).size, n: cards.length, first: Math.round(cards[0].width), third: cards[2] ? Math.round(cards[2].left) : null, scrolls: k.scrollWidth > k.clientWidth, actLines: Math.max(...acts) - Math.min(...acts), h: parseFloat(btn.height), r: btn.borderTopLeftRadius }; });
    expect(d.n).toBeGreaterThanOrEqual(4); expect(d.lines).toBe(1); expect(d.scrolls).toBe(true); expect(d.first).toBeGreaterThan(140); expect(d.first).toBeLessThan(190);
    expect(d.actLines).toBeLessThanOrEqual(6); expect(d.h).toBeGreaterThanOrEqual(40); expect(d.r).toBe('8px');
    await go(page, 'settings'); await page.waitForTimeout(800);
    const st = await page.evaluate(() => { const c = [...document.querySelectorAll('#pg-settings .set-card')].filter((e) => e.getBoundingClientRect().height > 0); const r = c[0].getBoundingClientRect(); const b = c[0].querySelector('.btn'); const a = getComputedStyle(b, '::after'); return { n: c.length, h: Math.round(r.height), w: Math.round(r.width), tapW: parseFloat(a.width), tapH: parseFloat(a.height) }; });
    expect(st.n).toBeGreaterThanOrEqual(4); expect(st.h).toBeLessThanOrEqual(110); expect(st.tapW).toBeGreaterThan(300); expect(st.tapH).toBeGreaterThanOrEqual(60); // the whole row opens its page
    await page.locator('#pg-settings .set-card .btn').first().click(); await expect(page.locator('#pg-settings .set-back, #pg-settings .set-page').first()).toBeVisible(); await go(page, 'settings');
    // the page's main action floats over the bottom bar, inside the thumb's reach
    await go(page, 'inventory'); const fab = page.locator('#pg-inventory .page-head .actions > .btn.btn-brand'); await expect(fab).toBeVisible();
    const fr = await fab.boundingBox(); expect(fr.y).toBeGreaterThan(844 / 2); expect(fr.y + fr.height).toBeLessThanOrEqual(844 - 64); expect(fr.height).toBeGreaterThanOrEqual(44);
    // «المزيد»: a sheet from the bottom with every page of the menu
    await page.locator('.bottom-nav .bn-more .bn-item').click(); const sheet = page.locator('.menu.bn-sheet'); await expect(sheet).toBeVisible(); await page.waitForTimeout(400); // the sheet slides up
    expect(await sheet.locator('.bn-opt').count()).toBeGreaterThanOrEqual(10); const sr = await sheet.boundingBox(); expect(sr.x).toBe(0); expect(sr.width).toBe(390);
    await page.keyboard.press('Escape'); await expect(sheet).toHaveCount(0);
    // the account's menu: from the bottom too, full width, over the bottom bar
    await page.locator('.topbar .user-btn').click(); const acct = page.locator('.menu.acct'); await expect(acct).toBeVisible(); await page.waitForTimeout(400); // the sheet slides up
    const ar = await acct.boundingBox(); expect(ar.x).toBe(0); expect(ar.width).toBe(390); expect(Math.round(ar.y + ar.height)).toBe(844);
    await page.keyboard.press('Escape');
    // the orders page (its own styles): a 16px field, the ⋮ menu from the bottom
    await go(page, 'orders'); await expect(page.locator('#orders >> .ibtn[data-more]').first()).toBeVisible({ timeout: 20000 });
    expect(await page.evaluate(() => !!document.getElementById('orders').shadowRoot.querySelector('style[data-mobile]'))).toBe(true);
    await page.locator('#orders >> .ibtn[data-more]').first().click(); const mp = page.locator('#orders >> #mpop'); await expect(mp).toBeVisible(); await page.waitForTimeout(400); // the sheet slides up
    const mr = await mp.boundingBox(); expect(mr.x).toBe(0); expect(mr.width).toBe(390); expect(Math.round(mr.y + mr.height)).toBe(844);
    await page.keyboard.press('Escape'); await page.mouse.click(10, 200);
    // the filter: a screen of its own — no keyboard thrown up by itself, no field under 16px (an iPhone zooms the page in under
    // that, and stays zoomed after the filter closes), nothing wider than the screen, «تطبيق الفلتر» on screen
    await page.locator('#orders >> #fbtn').click(); const fb = page.locator('#orders >> .fb'); await expect(fb).toBeVisible(); await page.waitForTimeout(400);
    const fbr = await fb.boundingBox(); expect(fbr.x).toBe(0); expect(fbr.width).toBe(390); expect(Math.round(fbr.y + fbr.height)).toBe(844);
    await page.locator('#orders >> [data-fbadd]').first().click();
    const f = await page.evaluate(() => { const r = document.getElementById('orders').shadowRoot; const el = r.querySelector('.fb'); return {
      focus: r.activeElement ? r.activeElement.id : '', small: [...el.querySelectorAll('input,select,textarea')].filter((e) => parseFloat(getComputedStyle(e).fontSize) < 16).length,
      wide: [...el.querySelectorAll('*')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && (b.right > 391 || b.left < -1); }).length, sw: el.scrollWidth - el.clientWidth }; });
    expect(f.focus).not.toBe('fbai'); expect(f.small).toBe(0); expect(f.wide).toBe(0); expect(f.sw).toBeLessThanOrEqual(0);
    const ap = await page.locator('#orders >> [data-fbapply]').boundingBox(); expect(ap.y + ap.height).toBeLessThanOrEqual(844); expect(ap.height).toBeGreaterThanOrEqual(48);
    await page.locator('#orders >> #fbai').tap(); expect(await page.evaluate(() => document.getElementById('orders').shadowRoot.activeElement.id)).toBe('fbai'); // a tap on the field still types in it
    await page.locator('#orders >> [data-fbcancel]').click(); await expect(fb).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    // the chips of the filters in force: one line that slides, however many are picked — the orders stay near the top
    for (const q of ['multi', 'unconf', 'risk']) { if (!(await page.locator('#orders >> .fb').count())) await page.locator('#orders >> #fbtn').click(); await page.locator(`#orders >> [data-qf="${q}"]`).click(); await page.waitForTimeout(200); }
    if (await page.locator('#orders >> .fb').count()) await page.locator('#orders >> [data-fbapply]').click();
    const chips = await page.evaluate(() => { const r = document.getElementById('orders').shadowRoot; const row = r.querySelector('.afc-row'); const tops = [...row.querySelectorAll('.afc-chip')].map((c) => Math.round(c.getBoundingClientRect().top)); const clr = row.querySelector(':scope > .btn').getBoundingClientRect(); return { n: tops.length, lines: new Set(tops).size, h: Math.round(row.getBoundingClientRect().height), scrolls: row.scrollWidth > row.clientWidth, clr: [Math.round(clr.left), Math.round(clr.right)] }; });
    expect(chips.n).toBeGreaterThanOrEqual(3); expect(chips.lines).toBe(1); expect(chips.h).toBeLessThanOrEqual(56); expect(chips.scrolls).toBe(true);
    expect(chips.clr[0]).toBeGreaterThanOrEqual(0); expect(chips.clr[1]).toBeLessThanOrEqual(390); // «مسح الفلاتر» stays on screen
    await page.locator('#orders >> .afc-row > .btn').click();
    // a date: a sheet from the bottom with days a finger can hit
    await page.locator('#orders >> [data-tg]').first().click(); await page.locator('#orders >> [data-dp]').first().click(); await page.waitForTimeout(400);
    const cal = await page.evaluate(() => { const r = document.getElementById('orders').shadowRoot; const d = r.querySelector('#dpop'); const b = d.getBoundingClientRect(); const day = d.querySelector('.d').getBoundingClientRect(); return { x: b.left, w: b.width, bottom: Math.round(b.bottom), day: [Math.round(day.width), Math.round(day.height)] }; });
    expect(cal.x).toBe(0); expect(cal.w).toBe(390); expect(cal.bottom).toBe(844); expect(cal.day[0]).toBeGreaterThanOrEqual(44); expect(cal.day[1]).toBeGreaterThanOrEqual(44);
    await page.keyboard.press('Escape'); await page.mouse.click(10, 120);
    // the period picker: nothing off the screen, days of 44px, its buttons on screen
    await go(page, 'dashboard'); await page.locator('.dash-period button').first().click(); await page.waitForTimeout(400);
    const rp = await page.evaluate(() => { const d = document.querySelector('.dp.range'); const b = d.getBoundingClientRect(); const spill = [...d.querySelectorAll('*')].filter((c) => { const x = c.getBoundingClientRect(); return x.width > 0 && (x.right > 391 || x.left < -1); }).length; const day = d.querySelector('.day').getBoundingClientRect(); const foot = d.querySelector('.dp-foot .btn').getBoundingClientRect(); return { top: b.top, bottom: Math.round(b.bottom), spill, day: Math.round(day.height), foot: Math.round(foot.bottom) }; });
    expect(rp.spill).toBe(0); expect(rp.day).toBeGreaterThanOrEqual(44); expect(rp.bottom).toBe(844); expect(rp.foot).toBeLessThanOrEqual(844); expect(rp.top).toBeGreaterThanOrEqual(44);
    await page.keyboard.press('Escape');
    // a conversation takes the whole screen, its reply box on screen
    await go(page, 'cs'); await page.locator('#pg-cs .tab', { hasText: 'الرسايل' }).click(); await page.locator('.cs-items .cv').first().click(); await page.waitForTimeout(300);
    const chat = await page.locator('.cs-inbox.show-chat .cs-chat').boundingBox(); expect(chat.x).toBe(0); expect(chat.width).toBe(390); expect(Math.round(chat.y + chat.height)).toBe(844);
    const cmp = await page.locator('.cs-chat .cmp').boundingBox(); expect(cmp.y + cmp.height).toBeLessThanOrEqual(845);
  });
});

test.describe('a tablet, upright', () => {
  test.use({ viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true });
  test('the side rail names every page in full; the number cards go three across; the language switch is in the banner', async ({ page }) => {
    await page.goto('/'); await page.locator('[data-demo-mode="marketplace"]').click(); await inApp(page);
    const cut = await page.evaluate(() => [...document.querySelectorAll('.sidebar .nav-item')].filter((b) => b.scrollWidth > b.clientWidth + 1).map((b) => b.textContent.trim()));
    expect(cut).toEqual([]);
    await expect(page.locator('#demo-bar .dm-lang')).toBeVisible(); await expect(page.locator('.sidebar .dm-lang')).toBeHidden();
    const cols = await page.evaluate(() => getComputedStyle(document.querySelector('.dash-kpis')).gridTemplateColumns.split(' ').length); expect(cols).toBe(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
});
