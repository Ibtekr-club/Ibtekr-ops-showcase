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

// the owner 21 Nov — «الصفحة دي دايما بتظهر ضاربة … عايزها تبقى انفوجرافيك … و تلات اسكرينات اونبوردينج»: three screens that say what
// the system is, then the choice. On a phone the size of an iPhone's page between Safari's bars nothing is cut off its top,
// nothing runs off its side, and the way on is always in sight.
test('the entry: three screens of onboarding, then the choice — whole on a phone, on a tablet and on a desk', async ({ browser }) => {
  for (const [w, h, touch] of [[390, 664, true], [820, 1100, true], [1280, 800, false]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: touch, hasTouch: touch }); const page = await ctx.newPage();
    await page.goto('/'); await expect(page.locator('#demo-entry')).toBeVisible();
    const slides = page.locator('#demo-entry .de-slide'); await expect(slides).toHaveCount(4);
    const whole = async (i) => page.evaluate((i) => { const e = document.getElementById('demo-entry'); const s = e.querySelectorAll('.de-slide')[i]; const r = s.getBoundingClientRect(); const top = e.querySelector('.de-top').getBoundingClientRect(); const foot = e.querySelector('.de-foot').getBoundingClientRect();
      const kids = [...s.querySelectorAll('.de-art, .de-txt, .de-pick, .de-lang')].map((k) => k.getBoundingClientRect());
      return { left: Math.round(r.left), width: Math.round(r.width), head: Math.round(top.top), footBottom: Math.round(foot.bottom), first: Math.round(Math.min(...kids.map((k) => k.top)) - top.bottom), off: kids.filter((k) => k.left < -1 || k.right > innerWidth + 1).length, sideways: document.documentElement.scrollWidth - innerWidth, down: s.scrollHeight - s.clientHeight }; }, i);
    for (let i = 0; i < 4; i++) {
      await expect(page.locator('#demo-entry .de-dots button').nth(i)).toHaveAttribute('aria-current', 'true');
      await expect.poll(async () => (await whole(i)).left, { message: `${w}: screen ${i + 1} sits in the page` }).toBe(0); await page.waitForTimeout(600);
      const v = await whole(i); expect(v.width).toBe(w); expect(v.head).toBeGreaterThanOrEqual(0); expect(v.footBottom).toBeLessThanOrEqual(h);
      expect(v.first, `${w}: screen ${i + 1} starts under the head, not above it`).toBeGreaterThanOrEqual(0); expect(v.off).toBe(0); expect(v.sideways).toBeLessThanOrEqual(0);
      if (i < 3) { expect(v.down, `${w}: screen ${i + 1} needs no scrolling`).toBeLessThanOrEqual(16); await expect(page.locator('[data-demo-next]')).toBeVisible(); await page.locator('[data-demo-next]').click(); }
    }
    // the last screen: the two models, each with its way in on one line; no «Next», no «Skip»
    await expect(page.locator('[data-demo-next]')).toBeHidden(); await expect(page.locator('[data-demo-skip]')).toBeHidden();
    for (const m of ['marketplace', 'single']) { await expect(page.locator(`[data-demo-mode="${m}"]`)).toBeVisible(); expect(await page.locator(`[data-demo-mode="${m}"] .de-go`).evaluate((g) => Math.round(g.getBoundingClientRect().height))).toBeLessThanOrEqual(48); }
    // «Back» and the dots go back; «Skip» goes straight to the choice
    await page.locator('[data-demo-back]').click(); await expect(page.locator('#demo-entry .de-dots button').nth(2)).toHaveAttribute('aria-current', 'true');
    await page.locator('#demo-entry .de-dots button').first().click(); await expect(page.locator('#demo-entry .de-dots button').first()).toHaveAttribute('aria-current', 'true'); await expect(page.locator('[data-demo-back]')).toBeHidden();
    await page.locator('[data-demo-skip]').click(); await expect(page.locator('#demo-entry .de-dots button').nth(3)).toHaveAttribute('aria-current', 'true');
    // the language picked here is the one the demo opens in
    await expect(page.locator('[data-demo-entry-lang="ar"]')).toHaveAttribute('aria-pressed', 'true');
    if (w === 390) { await page.locator('[data-demo-entry-lang="en"]').click(); await expect(page.locator('[data-demo-entry-lang="en"]')).toHaveAttribute('aria-pressed', 'true');
      await page.locator('[data-demo-mode="marketplace"]').click(); await page.waitForSelector('#demo-bar'); await expect(page.locator('html')).toHaveAttribute('dir', 'ltr'); }
    await ctx.close();
  }
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
    // (the owner 21 Nov, an iPhone — «الزراير الطايرة متنزلش تحت كومبوننتس الصفحة»): it is a button of the page itself, on <body> —
    // not inside the head's sliding row, where Safari draws it under the table's cards — carrying the page's own main action;
    // with the list scrolled under it nothing of the page is over it, and a tap presses the real action
    await go(page, 'inventory'); const fab = page.locator('[data-m-fab]'); await expect(fab).toBeVisible(); await expect(fab).toHaveText('استلام في المخزن');
    expect(await fab.evaluate((f) => f.parentElement === document.body)).toBe(true);
    await expect(page.locator('#pg-inventory .page-head .actions > .btn.btn-brand')).toBeHidden();
    await page.locator('#pg-inventory .tab', { hasText: 'سجل المخزون' }).click(); await page.waitForTimeout(600); await page.evaluate(() => window.scrollTo(0, 500)); await page.waitForTimeout(300);
    expect(await fab.evaluate((f) => { const r = f.getBoundingClientRect(); return [[r.left + 8, r.top + 2], [r.left + r.width / 2, r.top + 2], [r.right - 8, r.bottom - 2]].every(([x, y]) => f.contains(document.elementFromPoint(x, y))); })).toBe(true);
    await fab.tap(); await expect(page.locator('.scrim')).toBeVisible(); await expect(fab).toBeHidden(); await page.keyboard.press('Escape'); await expect(page.locator('.scrim')).toHaveCount(0); await expect(fab).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0)); await go(page, 'dashboard'); await expect(fab).toBeHidden(); await go(page, 'inventory'); await expect(fab).toBeVisible(); // a page without a main action has no button
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
    expect(chips.clr[0]).toBeGreaterThanOrEqual(0); expect(chips.clr[1]).toBeLessThanOrEqual(390);
    // (22 Nov — «مسح الكل … أول زرار في الصف و بعديه نتيجة الفلاتر»): it is the line's first button, the chips follow it, none under it
    const firstOf = await page.evaluate(() => { const r = document.getElementById('orders').shadowRoot; const row = r.querySelector('.afc-row'); const c = row.querySelector(':scope > .btn').getBoundingClientRect(); const chip = row.querySelector('.afc-chip').getBoundingClientRect(); return { rtl: getComputedStyle(row).direction === 'rtl', clr: [c.left, c.right], chip: [chip.left, chip.right], pos: getComputedStyle(row.querySelector(':scope > .btn')).position }; });
    expect(firstOf.pos).toBe('static'); if (firstOf.rtl) expect(firstOf.chip[1]).toBeLessThanOrEqual(firstOf.clr[0]); else expect(firstOf.chip[0]).toBeGreaterThanOrEqual(firstOf.clr[1]);
    await page.locator('#orders >> .afc-row > .btn').click();
    // a date: a sheet from the bottom with days a finger can hit
    await page.locator('#orders >> [data-tg]').first().click(); await page.locator('#orders >> [data-dp]').first().click(); await page.waitForTimeout(400);
    const cal = await page.evaluate(() => { const r = document.getElementById('orders').shadowRoot; const d = r.querySelector('#dpop'); const b = d.getBoundingClientRect(); const day = d.querySelector('.d').getBoundingClientRect(); return { x: b.left, w: b.width, bottom: Math.round(b.bottom), day: [Math.round(day.width), Math.round(day.height)] }; });
    expect(cal.x).toBe(0); expect(cal.w).toBe(390); expect(cal.bottom).toBe(844); expect(cal.day[0]).toBeGreaterThanOrEqual(44); expect(cal.day[1]).toBeGreaterThanOrEqual(44);
    await page.keyboard.press('Escape'); await page.mouse.click(10, 120);
    // the period picker (the owner 21 Nov, an iPhone — «بوب اب اختيار التاريخ بايظ خالص في الموبايل … تصميم يناسب مستخدم الموبايل»):
    // it is lifted out of the head's sliding row (Safari cut it at that row's edge), a sheet from the bottom with its name, the
    // ready periods as chips on one sliding line with the one in force in sight, «من» / «إلى» on one line, one month with both
    // arrows, days of 40px, and its buttons on screen; a chip sets the dates, «الشهر التالي» turns the month, «تحديث» applies
    await go(page, 'dashboard'); await page.locator('.dash-period button').first().tap(); await page.waitForTimeout(500);
    const rp = await page.evaluate(() => { const d = document.querySelector('.dp.range'); const b = d.getBoundingClientRect(); const spill = [...d.querySelectorAll('*')].filter((c) => { if (c.closest('.presets')) return false; const x = c.getBoundingClientRect(); return x.width > 0 && (x.right > 391 || x.left < -1); }).length; const day = d.querySelector('.day').getBoundingClientRect(); const foot = d.querySelector('.dp-foot .btn').getBoundingClientRect();
      let traps = 0; for (let a = d.parentElement; a && a !== document.body; a = a.parentElement) if (/(auto|scroll)/.test(getComputedStyle(a).overflowX + getComputedStyle(a).overflowY)) traps++;
      const chips = [...d.querySelectorAll('.presets .radio')].map((c) => c.getBoundingClientRect()); const on = d.querySelector('.presets .radio[aria-checked="true"]').getBoundingClientRect(); const ft = [...d.querySelectorAll('.range-row>.input')].filter((x) => x.getClientRects().length).map((x) => Math.round(x.getBoundingClientRect().top));
      return { top: b.top, bottom: Math.round(b.bottom), spill, traps, day: Math.round(day.height), foot: Math.round(foot.bottom), chips: chips.length, chipLines: new Set(chips.map((c) => Math.round(c.top))).size, onSeen: on.left >= 0 && on.right <= 390, fromTo: ft, months: [...d.querySelectorAll('.cal-grid')].filter((g) => g.getClientRects().length).length,
        arrows: [...d.querySelectorAll('.cal-h .icon-btn')].map((a) => { const r = a.getBoundingClientRect(); return [a.getAttribute('aria-label'), Math.round(r.top), r.width >= 44 && r.left >= 0 && r.right <= 390]; }), title: getComputedStyle(d, '::before').content }; });
    expect(rp.traps, 'the picker is not inside a box that scrolls').toBe(0); expect(rp.spill).toBe(0); expect(rp.day).toBeGreaterThanOrEqual(40); expect(rp.bottom).toBe(844); expect(rp.foot).toBeLessThanOrEqual(844); expect(rp.top).toBeGreaterThanOrEqual(44);
    expect(rp.chips).toBeGreaterThanOrEqual(10); expect(rp.chipLines).toBe(1); expect(rp.onSeen).toBe(true); expect(rp.fromTo.length).toBe(2); expect(rp.fromTo[0]).toBe(rp.fromTo[1]); expect(rp.months).toBe(1);
    expect(rp.arrows.map((a) => a[0])).toEqual(['الشهر السابق', 'الشهر التالي']); expect(rp.arrows[0][1]).toBe(rp.arrows[1][1]); expect(rp.arrows.every((a) => a[2])).toBe(true); expect(rp.title).toContain('اختيار الفترة');
    // (22 Nov — «التاتش في الكاليندر مش مظبوط»): picking a period by its two days — one tap each. A finger's tap reaches a day as
    // «the mouse came over it» first; the calendar must not draw itself again on that (Safari then keeps the click back)
    const days = page.locator('.dp.range .cal-grid .day:not(.outside)'); await days.nth(9).tap(); await expect(page.locator('.dp.range .presets .radio[aria-checked="true"]')).toHaveText('مخصص');
    expect(await page.evaluate(() => { const d = [...document.querySelectorAll('.dp.range .cal-grid .day:not(.outside)')][11]; const t = new Touch({ identifier: 3, target: d, clientX: 5, clientY: 5 });
      d.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, composed: true, touches: [t], targetTouches: [t], changedTouches: [t] })); d.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, composed: true, touches: [], targetTouches: [], changedTouches: [t] }));
      d.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); d.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false })); return d.isConnected; }), 'the day under the finger is still the same one when the click comes').toBe(true);
    // the day just tapped keeps the picked day's fill, whatever a phone still holds «over» it (it was the hover's pale fill
    // under the picked day's pale number — an empty square)
    await page.locator('.dp.range .cal-grid .day.sel').first().hover(); const fill = await page.locator('.dp.range .cal-grid .day.sel').first().evaluate((d) => { const cs = getComputedStyle(d); const probe = document.createElement('i'); probe.style.color = 'var(--color-brand-default)'; d.appendChild(probe); const want = getComputedStyle(probe).color; probe.remove(); return [cs.backgroundColor, want, cs.color]; });
    expect(fill[0]).toBe(fill[1]); expect(fill[2]).not.toBe(fill[0]);
    await days.nth(11).tap(); const picked = await page.evaluate(() => [...document.querySelectorAll('.dp.range .range-row>.input input')].filter((i) => i.getClientRects().length).map((i) => i.value.slice(0, 2)));
    expect(picked).toEqual(['10', '12']); expect(await page.locator('.dp.range .cal-grid .day.sel').count()).toBe(2);
    const month = await page.locator('.dp.range .cal-h span').first().textContent(); await page.locator('.dp.range .cal-h .icon-btn[aria-label="الشهر التالي"]').tap(); await expect(page.locator('.dp.range .cal-h span').first()).not.toHaveText(month);
    await page.locator('.dp.range .presets .radio', { hasText: 'آخر 7 أيام' }).tap(); await expect(page.locator('.dp.range .presets .radio', { hasText: 'آخر 7 أيام' })).toHaveAttribute('aria-checked', 'true');
    await page.locator('.dp.range .dp-foot .btn-primary').tap(); await expect(page.locator('.dp.range')).toHaveCount(0); await expect(page.locator('[data-m-portal]')).toHaveCount(0); await expect(page.locator('.dash-period button').first()).toContainText('آخر 7 أيام');
    // a list and a date inside a popup's scrolling body are lifted out of it too, and still set their field
    await go(page, 'tickets'); await page.tap('[data-m-fab]'); await expect(page.locator('.scrim')).toBeVisible(); const kind = page.locator('.scrim [aria-haspopup="listbox"]').first(); await kind.tap();
    const list = page.locator('.scrim > [data-m-portal] > .menu'); await expect(list).toBeVisible(); await list.locator('[role=option]', { hasText: 'طلب إجازة' }).tap(); await expect(kind).toContainText('طلب إجازة'); await expect(page.locator('[data-m-portal]')).toHaveCount(0);
    await page.keyboard.press('Escape'); await expect(page.locator('.scrim')).toHaveCount(0); await go(page, 'dashboard');
    // the header: after the search come the bell, the assistant, then the account — three circles of one size
    const hd = await page.evaluate(() => ['.topbar .search', '.topbar .notif-btn', '.topbar .ai-btn', '.topbar .user-btn'].map((q) => { const r = document.querySelector(q).getBoundingClientRect(); return [Math.round(r.right), Math.round(r.width), Math.round(r.height)]; }));
    expect(hd[0][0]).toBeGreaterThan(hd[1][0]); expect(hd[1][0]).toBeGreaterThan(hd[2][0]); expect(hd[2][0]).toBeGreaterThan(hd[3][0]);
    for (const c of hd.slice(1)) { expect(c[1]).toBe(44); expect(c[2]).toBe(44); }
    // (22 Nov) the circles are 36 to look at — 44 to the finger — and the search has the same room over it as under it
    const look = await page.evaluate(() => { const bar = document.getElementById('demo-bar').getBoundingClientRect(); const tb = document.querySelector('.topbar'); const t = tb.getBoundingClientRect(); const s = tb.querySelector('.search').getBoundingClientRect(); const seen = (q) => { const e = tb.querySelector(q); return Math.round(e.getBoundingClientRect().width - 2 * parseFloat(getComputedStyle(e).borderLeftWidth)); };
      return { over: Math.round(s.top - bar.bottom), under: Math.round(t.bottom - parseFloat(getComputedStyle(tb).borderBottomWidth) - s.bottom), bell: seen('.notif-btn'), ai: seen('.ai-btn'), me: Math.round(tb.querySelector('.user-btn .avatar').getBoundingClientRect().width), tabs: Math.round(t.height) }; });
    expect(look.over).toBe(8); expect(look.under).toBe(8); expect(look.bell).toBe(36); expect(look.ai).toBe(36); expect(look.me).toBe(36);
    // nothing moves behind an open popup: with the bell's sheet open a finger dragged on the page behind scrolls nothing,
    // and a tap there closes the sheet without pressing what is under it (the search does not take the focus)
    const cdp = await page.context().newCDPSession(page);
    const swipe = async (x, y, dy) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); for (let i = 1; i <= 6; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + dy * i / 6 }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(400); };
    await go(page, 'tickets'); await page.waitForTimeout(900);
    await page.evaluate(() => window.scrollTo(0, 400)); await page.waitForTimeout(300); const at = await page.evaluate(() => Math.round(window.scrollY)); expect(at).toBeGreaterThan(100);
    await page.tap('.topbar .notif-btn'); await expect(page.locator('.menu.notif')).toBeVisible(); await page.waitForTimeout(400);
    await swipe(195, 110, -80); await swipe(195, 110, 80); expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(at);
    // (22 Nov, an iPhone — «لازم ادوس اكتر من مرة عشان تعلم»): a tap is never still, and Safari drops the click of a touch whose
    // move was called off — so inside an open popup a move of a few pixels is left alone, and only a real drag is held back
    const held = await page.evaluate(() => { const el = document.querySelector('.menu.notif .ntf-item, .menu.notif button, .menu.notif'); const r = el.getBoundingClientRect(); const x = r.left + r.width / 2; const y = r.top + r.height / 2;
      const fire = (type, dy) => { const t = new Touch({ identifier: 7, target: el, clientX: x, clientY: y + dy, pageX: x, pageY: y + dy }); const e = new TouchEvent(type, { bubbles: true, cancelable: true, composed: true, touches: type === 'touchend' ? [] : [t], targetTouches: type === 'touchend' ? [] : [t], changedTouches: [t] }); el.dispatchEvent(e); return e.defaultPrevented; };
      fire('touchstart', 0); const small = fire('touchmove', 3); const big = fire('touchmove', 40); fire('touchend', 40); const far = document.querySelector('main:not([hidden]) .page-head'); return { small, big, list: [...document.querySelectorAll('.menu.notif *')].some((n) => /(auto|scroll)/.test(getComputedStyle(n).overflowY) && n.scrollHeight > n.clientHeight + 1) }; });
    expect(held.small, 'a tap with a few pixels of move keeps its click').toBe(false); if (!held.list) expect(held.big, 'a drag where nothing scrolls is held').toBe(true);
    await page.touchscreen.tap(195, 70); await expect(page.locator('.menu.notif')).toHaveCount(0);
    expect(await page.evaluate(() => document.activeElement.tagName)).not.toBe('INPUT'); expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(at);
    // … behind a popup, and behind the orders page's filter (its popups live in a shadow root)
    await page.evaluate(() => window.scrollTo(0, 0)); await page.tap('[data-m-fab]'); await expect(page.locator('.scrim')).toBeVisible();
    await swipe(20, 100, 200); await swipe(20, 300, -200); expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(0);
    await page.keyboard.press('Escape'); await expect(page.locator('.scrim')).toHaveCount(0);
    await swipe(195, 600, -300); expect(await page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(100); // and free again once it is closed
    await page.waitForTimeout(1200); await page.evaluate(() => window.scrollTo(0, 0)); // (the fling of that last drag is over)
    // the assistant: the whole screen under the banner, the keyboard not thrown up by itself, the examples on one line;
    // with a keyboard up it ends where the keyboard starts and the bottom bar steps aside
    await page.tap('.ai-btn'); await page.waitForTimeout(400);
    const ai = await page.evaluate(() => { const r = document.querySelector('.ai-panel').getBoundingClientRect(); const bar = document.getElementById('demo-bar').getBoundingClientRect(); const ch = [...document.querySelectorAll('.ai-chips .btn')].map((c) => Math.round(c.getBoundingClientRect().top)); return { top: Math.round(r.top), bar: Math.round(bar.bottom), bottom: Math.round(r.bottom), w: Math.round(r.width), focus: document.activeElement.classList.contains('ai-input'), chipLines: new Set(ch).size, font: parseFloat(getComputedStyle(document.querySelector('.ai-input')).fontSize) }; });
    expect(ai.top).toBe(ai.bar); expect(ai.bottom).toBe(844); expect(ai.w).toBe(390); expect(ai.focus).toBe(false); expect(ai.chipLines).toBe(1); expect(ai.font).toBeGreaterThanOrEqual(16);
    // (22 Nov — «اكلم المدير الايه اي اللي في الهيدر من المايك زي المساعدين التانيين»): a microphone beside the box; what is said is
    // written into the box, a second press stops, and nothing is sent until the member sends it (the browser's speech-to-text
    // is stood in for here)
    await page.evaluate(() => { window.__heard = []; window.SpeechRecognition = class { start() { window.__sr = this; } stop() { window.__heard.push('stop'); } }; });
    const mic = page.locator('.ai-panel .ai-form [data-ai-mic]'); await expect(mic).toBeVisible(); await expect(mic).toHaveAttribute('data-ai-mic', 'off');
    const micBox = await mic.boundingBox(); expect(micBox.width).toBeGreaterThanOrEqual(40); expect(micBox.height).toBeGreaterThanOrEqual(40);
    await mic.tap(); await expect(mic).toHaveAttribute('data-ai-mic', 'on'); await expect(mic).toHaveAttribute('aria-pressed', 'true');
    await page.evaluate(() => { window.__sr.onresult({ results: [Object.assign([{ transcript: 'اعرض الأوردرات المتأخرة' }], { isFinal: true })] }); });
    await expect(page.locator('.ai-panel .ai-input')).toHaveValue('اعرض الأوردرات المتأخرة'); expect(await page.locator('.ai-panel .ai-msg.user').count()).toBe(0);
    await mic.tap(); await expect(mic).toHaveAttribute('data-ai-mic', 'off'); expect(await page.evaluate(() => window.__heard.length)).toBeGreaterThanOrEqual(1);
    await page.locator('.ai-panel .ai-input').fill('');
    await page.evaluate(() => { document.documentElement.style.setProperty('--m-vv-h', '420px'); document.documentElement.classList.add('m-kb'); });
    const kb = await page.evaluate(() => ({ bottom: Math.round(document.querySelector('.ai-panel').getBoundingClientRect().bottom), top: Math.round(document.querySelector('.ai-panel').getBoundingClientRect().top), form: Math.round(document.querySelector('.ai-form').getBoundingClientRect().bottom), nav: getComputedStyle(document.querySelector('.bottom-nav')).display }));
    expect(kb.bottom).toBe(kb.top + 420); expect(kb.form).toBeLessThanOrEqual(kb.bottom); expect(kb.nav).toBe('none');
    await page.evaluate(() => { document.documentElement.classList.remove('m-kb'); window.dispatchEvent(new Event('resize')); });
    await page.tap('.ai-panel .ai-head .icon-btn'); await expect(page.locator('.ai-panel')).toBeHidden();
    // «ملفي»: the head is short — the name on one line beside the picture, the tags on one line
    await go(page, 'profile'); await page.waitForTimeout(900);
    const ph = await page.evaluate(() => { const h = document.querySelector('#pg-profile .prof-head'); const n = h.querySelector('h1').getBoundingClientRect(); const tg = [...h.querySelectorAll('.grow .tg')].map((t) => Math.round(t.getBoundingClientRect().top)); return { h: Math.round(h.getBoundingClientRect().height), name: Math.round(n.height), tagLines: new Set(tg).size }; });
    expect(ph.h).toBeLessThanOrEqual(180); expect(ph.name).toBeLessThanOrEqual(30); expect(ph.tagLines).toBe(1);
    await go(page, 'orders'); await page.waitForTimeout(600);
    await go(page, 'cs'); await page.locator('#pg-cs .tab', { hasText: 'الرسايل' }).click(); await page.locator('.cs-items .cv').first().click(); await page.waitForTimeout(300);
    const chat = await page.locator('.cs-inbox.show-chat .cs-chat').boundingBox(); expect(chat.x).toBe(0); expect(chat.width).toBe(390); expect(Math.round(chat.y + chat.height)).toBe(844);
    const cmp = await page.locator('.cs-chat .cmp').boundingBox(); expect(cmp.y + cmp.height).toBeLessThanOrEqual(845);
  });
});

test.describe('a tablet, upright', () => {
  test.use({ viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true });
  test('the side rail names every page in full; the number cards go three across; the language and the model are drop-downs in the banner', async ({ page }) => {
    await page.goto('/'); await page.locator('[data-demo-mode="marketplace"]').click(); await inApp(page);
    const cut = await page.evaluate(() => [...document.querySelectorAll('.sidebar .nav-item')].filter((b) => b.scrollWidth > b.clientWidth + 1).map((b) => b.textContent.trim()));
    expect(cut).toEqual([]);
    // the language and the model: a drop-down each in the banner (the pills are a desktop's)
    await expect(page.locator('#demo-bar [data-demo-dd="lang"]')).toBeVisible(); await expect(page.locator('#demo-bar [data-demo-dd="mode"]')).toBeVisible(); await expect(page.locator('.sidebar .dm-lang')).toBeHidden();
    // the bar: «إجراءات سريعة» and «ابدأ الدوام» are in the account's menu here too
    await page.locator('.topbar .user-btn').click(); await expect(page.locator('.menu.acct [data-m-clock]')).toBeVisible(); await expect(page.locator('.menu.acct [data-m-quick]')).toBeVisible(); await page.keyboard.press('Escape');
    // the number cards: full rows — the dashboard's five go 3 + 2, and the two of the last line share its whole width
    const rows = await page.evaluate(() => { const c = [...document.querySelectorAll('.dash-kpis > .card.kpi')].map((e) => e.getBoundingClientRect()); const tops = [...new Set(c.map((r) => Math.round(r.top)))]; const k = document.querySelector('.dash-kpis').getBoundingClientRect(); return tops.map((t) => { const row = c.filter((r) => Math.round(r.top) === t); return [row.length, Math.round(Math.max(...row.map((r) => r.right)) - Math.min(...row.map((r) => r.left))), Math.round(k.width)]; }); });
    expect(rows.map((r) => r[0])).toEqual([3, 2]); for (const [, w, full] of rows) expect(Math.abs(w - full)).toBeLessThanOrEqual(2);
    for (const pg of ['hr', 'inventory', 'reports', 'tickets']) { await go(page, pg); await page.waitForTimeout(900);
      const alone = await page.evaluate(() => { const main = [...document.querySelectorAll('main')].find((m) => m.getBoundingClientRect().height > 0); return [...main.querySelectorAll('*')].filter((g) => g.querySelector(':scope > .card.kpi') && g.getBoundingClientRect().width > 0).map((g) => { const k = g.getBoundingClientRect(); const c = [...g.querySelectorAll(':scope > .card.kpi')].map((e) => e.getBoundingClientRect()); const last = Math.max(...c.map((r) => Math.round(r.top))); const row = c.filter((r) => Math.round(r.top) === last); return Math.round(k.width - (Math.max(...row.map((r) => r.right)) - Math.min(...row.map((r) => r.left)))); }); });
      for (const gap of alone) expect(gap, pg + ': a last line of cards that does not reach the end').toBeLessThanOrEqual(2); }
    // the header: the bell, the assistant, the account — one size, in that order after the search
    const thd = await page.evaluate(() => ['.topbar .search', '.topbar .notif-btn', '.topbar .ai-btn', '.topbar .user-btn'].map((q) => { const r = document.querySelector(q).getBoundingClientRect(); return [Math.round(r.right), Math.round(r.width), Math.round(r.height)]; }));
    expect(thd[0][0]).toBeGreaterThan(thd[1][0]); expect(thd[1][0]).toBeGreaterThan(thd[2][0]); expect(thd[2][0]).toBeGreaterThan(thd[3][0]); for (const c of thd.slice(1)) { expect(c[1]).toBe(44); expect(c[2]).toBe(44); }
    // the assistant here is the desktop's box under its button (the owner 21 Nov: «التابلت خليه زي الديسكتوب») — the full page is a phone's
    await page.tap('.ai-btn'); await page.waitForTimeout(400);
    const tai = await page.evaluate(() => { const r = document.querySelector('.ai-panel').getBoundingClientRect(); const t = document.querySelector('.topbar').getBoundingClientRect(); return { top: Math.round(r.top), bar: Math.round(t.bottom), bottom: Math.round(r.bottom), w: Math.round(r.width), bubble: getComputedStyle(document.querySelector('.ai-msg.ai')).backgroundColor }; });
    expect(tai.w).toBeLessThanOrEqual(420); expect(tai.top).toBeGreaterThanOrEqual(tai.bar - 2); expect(tai.bottom).toBeLessThan(1180); expect(tai.bubble).not.toBe('rgba(0, 0, 0, 0)');
    await page.tap('.ai-panel .ai-head .icon-btn'); await expect(page.locator('.ai-panel')).toBeHidden();
    // «ملفي»: its ten tiles take the same full rows (4 + 4 + 2)
    await go(page, 'profile'); await page.waitForTimeout(900);
    const tiles = await page.evaluate(() => [...document.querySelectorAll('#pg-profile .cards')].filter((g) => g.querySelector(':scope > .card.sum-tile') && g.getBoundingClientRect().width > 0).map((g) => { const k = g.getBoundingClientRect(); const c = [...g.querySelectorAll(':scope > .card.sum-tile')].map((e) => e.getBoundingClientRect()); const tops = [...new Set(c.map((r) => Math.round(r.top)))]; return tops.map((t) => { const row = c.filter((r) => Math.round(r.top) === t); return [row.length, Math.round(k.width - (Math.max(...row.map((r) => r.right)) - Math.min(...row.map((r) => r.left))))]; }); }).flat());
    expect(tiles.length).toBeGreaterThan(0); for (const [n, gap] of tiles) { expect(n).toBeGreaterThanOrEqual(2); expect(gap).toBeLessThanOrEqual(2); }
    await go(page, 'dashboard');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
});
