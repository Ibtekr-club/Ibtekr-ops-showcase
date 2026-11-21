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

