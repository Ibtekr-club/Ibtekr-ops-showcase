// The public web demo's data (web.js / boot.js, only in `npm run demo:web`): on top of seed.js, the two business models.
// Marketplace: eight makers with their commission, orders at every status (several split between makers, with their sub-orders), and
// each maker's Dokan figures computed from the completed lines, so a statement adds up: earning = Σ completed lines × (1 − rate);
// balance = earning − approved withdrawals. Single store: the same system for one made-up brand, «Decoro» — no makers, no sub-orders.
// Everything is made up: names, phones (0100000xxxx), orders and money.
const V = (n) => 'a0000000-0000-4000-8000-00000000000' + n;
const NOW = Date.now();
const ago = (d, h = 11) => { const t = new Date(NOW - d * 864e5); t.setUTCHours(h, 0, 0, 0); return t.toISOString(); };
const day = (d) => ago(d).slice(0, 10);
const phone = (n) => '0100000' + String(n).padStart(4, '0');

export const MAKERS = [ // n, Dokan id, name, category, rate %
  [4, 3101, 'Nour Ceramics', 'فخار وسيراميك', 30], [5, 3102, 'Kalam Wood', 'خشب', 25], [6, 3103, 'Sahra Weaves', 'نسيج وكليم', 30],
  [7, 3104, 'Fayrouz Glass', 'زجاج معشّق', 35], [8, 3105, 'Tala Leather', 'جلد', 28],
];
const PRODUCTS = [ // id, maker, sku, English name, Arabic name, price
  [9201, 4, 'IBTNO1001', 'Terracotta Vase', 'فازة تراكوتا', 850], [9202, 4, 'IBTNO1002', 'Ceramic Mug Set', 'طقم مجات سيراميك', 620],
  [9203, 5, 'IBTKA1003', 'Olive Wood Tray', 'صينية خشب زيتون', 740], [9204, 5, 'IBTKA1004', 'Walnut Side Table', 'ترابيزة جانبية جوز', 2900],
  [9205, 6, 'IBTSA1005', 'Siwa Kilim Rug', 'كليم سيوي', 3400], [9206, 6, 'IBTSA1006', 'Woven Cushion Cover', 'كيس مخدة منسوج', 480],
  [9207, 7, 'IBTFA1007', 'Stained Glass Lamp', 'أباجورة زجاج معشّق', 2350], [9208, 7, 'IBTFA1008', 'Glass Candle Holder', 'شمعدان زجاج', 390],
  [9209, 8, 'IBTTA1009', 'Leather Tote Bag', 'شنطة جلد يد', 1650], [9210, 8, 'IBTTA1010', 'Leather Desk Organizer', 'منظّم مكتب جلد', 720],
];
const DECORO = [ // the single store's own products
  [9301, 'DCR-LMP-01', 'Arch Table Lamp', 'أباجورة آرش', 1890], [9302, 'DCR-MIR-02', 'Round Rattan Mirror', 'مراية راتان دايرة', 2450],
  [9303, 'DCR-CSH-03', 'Linen Cushion', 'مخدة كتان', 560], [9304, 'DCR-VAS-04', 'Stoneware Vase', 'فازة حجر', 780],
  [9305, 'DCR-THR-05', 'Knitted Throw', 'بطانية تريكو', 1350], [9306, 'DCR-CND-06', 'Soy Candle Trio', 'تلات شمع صويا', 420],
];
const CUSTOMERS = [['نهى رشاد', 'EG-01', 'المعادي'], ['كريم عادل', 'EG-02', 'الدقي'], ['ريهام سامي', 'EG-03', 'سموحة'], ['أحمد فتحي', 'EG-01', 'مصر الجديدة'],
  ['دينا مجدي', 'EG-02', 'الشيخ زايد'], ['مروان طه', 'EG-01', 'التجمع الخامس'], ['سلمى نبيل', 'EG-03', 'ميامي'], ['ياسمين عاطف', 'EG-01', 'مدينة نصر'],
  ['عمر حسين', 'EG-02', 'المهندسين'], ['هاجر سعيد', 'EG-01', 'الزمالك'], ['شادي فهمي', 'EG-03', 'سيدي جابر'], ['إسراء كمال', 'EG-01', 'حلوان'],
  ['محمود رأفت', 'EG-02', 'فيصل'], ['نورهان وليد', 'EG-01', 'شبرا']];
const WOO = { 'قيد الانتظار': 'pending', 'جاري التنفيذ': 'processing', 'معلّق': 'on-hold', 'جاهز للشحن': 'ready-shipping', 'قيد الشحن': 'in-shipping', 'فشل': 'failed', 'مكتمل': 'completed', 'استرجاع': 'refunded', 'ملغي': 'cancelled' };
// id, status, confirm, days ago, customer, [[product, qty]], deposit, extra
const ORDERS = [
  [182001, 'قيد الانتظار', 'غير مؤكد', 0, 0, [[9201, 1]], 0],
  [182002, 'جاري التنفيذ', 'مؤكد بعربون', 3, 1, [[9203, 1], [9205, 1]], 500],
  [182003, 'جاهز للشحن', 'مؤكد بدون عربون', 6, 2, [[9206, 2]], 0],
  [182004, 'قيد الشحن', 'مؤكد بعربون', 8, 3, [[9207, 1], [9202, 1]], 400, { bosta_tracking: '70456812', bosta_state: 'In transit' }],
  [182005, 'مكتمل', 'مؤكد بدون عربون', 20, 4, [[9202, 2]], 0],
  [182006, 'مكتمل', 'مؤكد بعربون', 15, 5, [[9204, 1], [9206, 1]], 800],
  [182007, 'مكتمل', 'مؤكد بدون عربون', 25, 6, [[9208, 3]], 0],
  [182008, 'مكتمل', 'مؤكد بعربون', 12, 7, [[9209, 1]], 300],
  [182009, 'ملغي', 'غير مؤكد', 9, 8, [[9204, 1]], 0, { cancel: { reason: 'العميل غيّر رأيه', at: day(8) } }],
  [182010, 'استرجاع', 'مؤكد بدون عربون', 22, 9, [[9205, 1]], 0],
  [182011, 'فشل', 'مؤكد بدون عربون', 11, 10, [[9210, 1]], 0],
  [182012, 'معلّق', 'في انتظار الرد', 2, 11, [[9207, 1]], 0, { note: 'هتأكد بعد ما تشوف المقاس' }],
  [182013, 'جاري التنفيذ', 'مؤكد بعربون', 18, 12, [[9210, 2], [9209, 1]], 600],
  [182014, 'مكتمل', 'مؤكد بدون عربون', 10, 13, [[9201, 1], [9208, 1]], 0],
];
const WITHDRAWN = { 4: 400, 5: 1500, 7: 600 }; // approved withdrawals per maker (the rest stays as balance)

function addOrders(mock, single) {
  const pOf = (id) => (single ? null : PRODUCTS.find((p) => p[0] === id));
  let itemId = 7001, subId = 201;
  ORDERS.forEach(([id, status, confirm, d, c, items, deposit, extra], k) => {
    const [name, state, city] = CUSTOMERS[c];
    const lines = items.map(([pid, qty], i) => {
      const p = single ? DECORO[(k + i) % DECORO.length] : pOf(pid);
      const price = single ? p[4] : p[5]; const maker = single ? 9 : p[1]; const rate = single ? 100 : MAKERS.find((m) => m[0] === maker)[4]; // single: the whole sale is the store's
      return { pid: single ? p[0] : pid, sku: single ? p[1] : p[2], name: single ? p[2] : p[3], qty, total: price * qty, maker, rate };
    });
    const total = lines.reduce((s, l) => s + l.total, 0);
    const makers = [...new Set(lines.map((l) => l.maker))];
    const tpl = mock.orders[0] || {};
    mock.orders.push({ ...tpl, id, number: String(id), customer_name: name, customer_phone: phone(201 + c), customer_state: state, customer_city: city, customer_address: 'عنوان تجريبي',
      status, status_custom: null, woo_status: WOO[status], confirm, confirm_at: confirm.startsWith('مؤكد') ? day(Math.max(0, d - 1)) : null, confirm_note: null, deposit, total, note: null, customer_note: null,
      cancel: null, ret: null, bosta_tracking: null, bosta_state: null, bosta_delivery: null, bosta_cod: null, bosta_cod_due: false, bosta_cod_error: null, payment_method: 'cod', payment_title: 'الدفع عند الاستلام',
      raw: { id }, placed_at: ago(d), created_at: ago(d), updated_at: ago(Math.max(0, d - 1)), woo_updated_at: ago(d), synced_at: ago(0, 8), ...(extra || {}) });
    const subs = {};
    if (makers.length > 1) makers.forEach((m) => { const t = lines.filter((l) => l.maker === m).reduce((s, l) => s + l.total, 0); subs[m] = subId; mock.subOrders.push({ id: subId, order_id: id, vendor_id: V(m), woo_order_id: id + 100 + subId, woo_status: WOO[status], total: t, dokan_earning: null, commission: null, raw: { id: id + 100 + subId }, updated_at: ago(d) }); subId++; });
    lines.forEach((l) => {
      const tplI = mock.orderItems[0] || {};
      mock.orderItems.push({ ...tplI, id: itemId++, order_id: id, sub_order_id: subs[l.maker] || null, product_id: l.pid, sku: l.sku, name: l.name, qty: l.qty, total: l.total, vendor_id: V(l.maker),
        status: status === 'ملغي' ? 'ملغي' : '', expected_at: confirm.startsWith('مؤكد') ? day(Math.max(0, d - 1)) : null, comment: null, ready_at: null, waybill: null, pulled: false, ret: null, store: null, removed: false,
        commission_rate: l.rate, commission_fee: l.rate == null ? null : 0, raw: { id: itemId }, updated_at: ago(d) });
    });
    // the order's movement in the activity log (codes only, like the server's): placed → confirmed → each status on the way
    if (Array.isArray(mock.activityRows)) {
      const path = { 'جاري التنفيذ': ['جاري التنفيذ'], 'جاهز للشحن': ['جاري التنفيذ', 'جاهز للشحن'], 'قيد الشحن': ['جاري التنفيذ', 'جاهز للشحن', 'قيد الشحن'], 'مكتمل': ['جاري التنفيذ', 'جاهز للشحن', 'قيد الشحن', 'مكتمل'],
        'استرجاع': ['جاري التنفيذ', 'قيد الشحن', 'مكتمل', 'استرجاع'], 'فشل': ['جاري التنفيذ', 'قيد الشحن', 'فشل'], 'ملغي': ['ملغي'], 'معلّق': ['معلّق'], 'قيد الانتظار': [] }[status] || [];
      let rid = mock.activityRows.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0);
      const step = path.length ? Math.max(1, Math.floor(d / (path.length + 1))) : 1;
      if (confirm.startsWith('مؤكد')) mock.activityRows.push({ id: ++rid, demo: true, at: ago(Math.max(0, d - 1), 9), actor: '00000000-0000-4000-8000-000000000002', action: 'order.confirm', entity: 'order', entity_id: String(id), old_value: 'غير مؤكد', new_value: confirm });
      path.forEach((s, i) => mock.activityRows.push({ id: ++rid, demo: true, at: ago(Math.max(0, d - step * (i + 1)), 12), actor: '00000000-0000-4000-8000-000000000003', action: 'order.status', entity: 'order', entity_id: String(id), old_value: i ? path[i - 1] : 'قيد الانتظار', new_value: s }));
    }
    if (mock.cs && Array.isArray(mock.cs.customers) && !mock.cs.customers.some((x) => x.phone === phone(201 + c))) {
      const tpl = mock.cs.customers[0] || {};
      mock.cs.customers.push({ ...tpl, id: 'c0000000-0000-4000-8000-' + String(500 + c).padStart(12, '0'), phone: phone(201 + c), name, city, province: state, address: null, mood: null, tags: [], created_from: 'orders', created_at: ago(d) });
    }
  });
}

function marketplace(mock) {
  const tplV = mock.vendors[0]; const tplP = mock.products.find((p) => p.lang === 'en') || mock.products[0];
  MAKERS.forEach(([n, woo, name, category, rate]) => {
    if (mock.vendors.some((v) => v.id === V(n))) return;
    mock.vendors.push({ ...tplV, id: V(n), woo_vendor_id: woo, name, aliases: [], phone: phone(100 + n), email: name.toLowerCase().replace(/\s+/g, '.') + '@example.com', status: 'active', category, main_categories: [15],
      contract: null, notes: null, contact_name: null, address: null, address_parts: null, social: null, logo_url: null, banner_url: null, woo_snapshot: null, push_pending: null, store_url: null, photo_path: null, archived_at: null,
      raw: { id: woo }, joined_at: '2026-' + String(4 + n).padStart(2, '0') + '-01', created_at: ago(200), updated_at: ago(3) });
    mock.vendorRates.push({ id: 100 + n, vendor_id: V(n), rate, flat: null, since: '2026-03-01', set_by: 'صفوت كمال', created_at: ago(200), commission_type: 'fixed' });
    if (Array.isArray(mock.brands)) mock.brands.push({ ...mock.brands[0], id: 'd0000000-0000-4000-8000-00000000010' + n, name, code: name[0], aliases: [], store_vendor_id: V(n), origin_vendor_id: V(n), created_at: ago(200), updated_at: ago(200) });
  });
  PRODUCTS.forEach(([id, n, sku, name, , price]) => { if (!mock.products.some((p) => p.id === id)) mock.products.push({ ...tplP, id, sku, name, vendor_id: V(n), regular_price: Math.round(price * 1.15 / 10) * 10, sale_price: price, total_sales: 3 + (id % 9), permalink: 'https://ibtekr.stage.test/product/' + name.toLowerCase().replace(/\s+/g, '-') + '/', image_url: 'https://ibtekr.stage.test/wp-content/uploads/2026/11/' + name.replace(/\s+/g, '-') + '.webp', translation_ids: { en: id }, brand_ids: [], category_ids: [151], status: 'publish', trashed_at: null }); });
  addOrders(mock, false);
  // the statement adds up: each new maker's Dokan earning from its completed lines at its rate, minus what was approved
  MAKERS.forEach(([n, woo, , , rate]) => {
    const done = mock.orderItems.filter((l) => l.vendor_id === V(n) && (mock.orders.find((o) => o.id === l.order_id) || {}).status === 'مكتمل');
    const sales = done.reduce((s, l) => s + Number(l.total), 0); const earning = Math.round(sales * (1 - rate / 100)); const out = Math.min(WITHDRAWN[n] || 0, earning);
    mock.acc.dokan_balances.push({ vendor_id: V(n), woo_vendor_id: woo, balance: earning - out, earning, sales, orders: new Set(done.map((l) => l.order_id)).size, synced_at: ago(0, 8) });
    if (out) mock.acc.dokan_withdrawals.push({ id: 600 + n, woo_vendor_id: woo, vendor_id: V(n), amount: out, charge: 0, receivable: out, status: 'approved', method: 'bank', requested_at: day(5) + ' 12:00:00', synced_at: ago(0, 8) });
  });
}

function singleStore(mock) {
  // one brand, no makers: every line belongs to «Decoro» (a store the site runs itself), no sub-orders, nothing from Dokan
  const tplV = mock.vendors[0];
  mock.vendors = [{ ...tplV, id: V(9), woo_vendor_id: 1, name: 'Decoro', aliases: [], status: 'active', category: 'ديكور منزلي', phone: null, email: null, contract: null, notes: null, contact_name: null, social: null,
    address: null, address_parts: null, logo_url: null, banner_url: null, woo_snapshot: null, push_pending: null, raw: { id: 1 }, joined_at: '2026-01-01' }];
  mock.vendorRates = []; mock.vendorCategoryRates = []; mock.vendorBank = []; mock.vendorLogins = [];
  if (Array.isArray(mock.brands)) mock.brands = [{ ...mock.brands[0], id: 'd0000000-0000-4000-8000-000000000109', name: 'Decoro', code: 'D', aliases: [], store_vendor_id: V(9), origin_vendor_id: V(9) }];
  if (Array.isArray(mock.brandOwners)) mock.brandOwners = [];
  if (Array.isArray(mock.wooBrands)) mock.wooBrands = [{ id: 9, name: 'Decoro', slug: 'decoro', parent_id: null, updated_at: ago(100) }];
  const tplP = mock.products.find((p) => p.lang === 'en') || mock.products[0];
  mock.products = DECORO.map(([id, sku, name, , price]) => ({ ...tplP, id, sku, name, vendor_id: V(9), regular_price: Math.round(price * 1.2 / 10) * 10, sale_price: price, total_sales: 4 + (id % 11), brand_ids: [9], category_ids: [151],
    permalink: 'https://ibtekr.stage.test/product/' + name.toLowerCase().replace(/\s+/g, '-') + '/', image_url: 'https://ibtekr.stage.test/wp-content/uploads/2026/11/' + name.replace(/\s+/g, '-') + '.webp', translation_ids: { en: id }, status: 'publish', trashed_at: null }));
  mock.subOrders = [];
  mock.orderItems.forEach((l, i) => { const p = DECORO[i % DECORO.length]; Object.assign(l, { vendor_id: V(9), sub_order_id: null, product_id: p[0], sku: p[1], name: p[2], commission_rate: null, commission_fee: null }); });
  mock.acc.dokan_balances = []; mock.acc.dokan_withdrawals = []; mock.acc.acc_vendor_settlements = [];
  if (mock.inv && Array.isArray(mock.inv.inv_lots)) mock.inv.inv_lots.forEach((x, i) => { const p = DECORO[i % DECORO.length]; Object.assign(x, { vendor_id: V(9), sku: p[1], name: p[2], mode: 'ملك ابتكر' }); });
  if (Array.isArray(mock.tickets)) mock.tickets = mock.tickets.filter((t) => t.type !== 'vendor');
  if (mock.cs && Array.isArray(mock.cs.conversations)) mock.cs.conversations = mock.cs.conversations.filter((c) => c.seg !== 'vendors');
  // the made-up messages and requests say nothing of a maker: the store makes and ships its own products
  const own = (t) => t.replace(/ ?على واتساب 2/g, '').replace(/كلم(وا)? المبتكر(ين)?/g, 'راجع$1 التصنيع').replace(/من المبتكر(ين)?/g, 'من التصنيع').replace(/ ?(لل|ال)مبتكر(ين)?/g, '').replace(/\s+$/, '');
  if (mock.cs && Array.isArray(mock.cs.messages)) mock.cs.messages.forEach((m) => { if (typeof m.text === 'string') m.text = own(m.text); });
  if (Array.isArray(mock.tickets)) mock.tickets.forEach((t) => { ['title', 'description'].forEach((k) => { if (typeof t[k] === 'string') t[k] = own(t[k]); }); });
  // the site runs WooCommerce alone (no Dokan plugin), and the requests that went to the makers' team go to customer service
  const wp = mock.mkt && Array.isArray(mock.mkt.siteChecks) ? mock.mkt.siteChecks.find((r) => r.kind === 'wp_updates') : null;
  if (wp && wp.data && Array.isArray(wp.data.plugins)) wp.data.plugins = wp.data.plugins.filter((x) => !/dokan/i.test(x.name));
  if (Array.isArray(mock.tickets)) mock.tickets.forEach((t) => { if (/المبتكرين|الموردين/.test(t.assignee_role || '')) t.assignee_role = 'خدمة العملاء'; });
  // and that team itself is removed (role_delete marks a built-in hidden), so it is no choice anywhere
  (mock.roles || []).forEach((r) => { if (r.id === 'vendors_followup') r.hidden = true; });
  // the log has no makers' lines (vendor.* — makers' changes, Dokan syncs) in a store with no makers
  if (Array.isArray(mock.activityRows)) mock.activityRows = mock.activityRows.filter((r) => !/^(vendor|suborder)\./.test(r.action || ''));
  // …and its one member: the team is the four who run the store
  const gone = (mock.profiles || []).filter((x) => x.role_id === 'vendors_followup').map((x) => x.id);
  if (gone.length) {
    mock.profiles = mock.profiles.filter((x) => !gone.includes(x.id));
    const hr = mock.hr || {}; const left = (hr.payroll_lines || []).filter((x) => gone.includes(x.member_id));
    left.forEach((l) => { const sheet = (hr.payroll || []).find((x) => x.month === l.month); if (sheet && typeof sheet.total === 'number') sheet.total -= l.net; });
    Object.keys(hr).forEach((k) => { if (Array.isArray(hr[k])) hr[k] = hr[k].filter((x) => !x || !gone.includes(x.member_id)); });
  }
  // the hub holds the store's own pieces — returns, pieces out for a shoot, pieces for sale: nothing waits there to be gathered into an order
  if (mock.inv) {
    (mock.inv.inv_lots || []).forEach((x) => { if (x.reason === 'تجميع أوردر') Object.assign(x, { reason: 'متاح للبيع', status: 'متاح', order_id: null, item_id: null, ref: null }); if (x.loc === 'T') x.loc = null; x.mode = 'ملك ابتكر'; });
    (mock.inv.inv_moves || []).forEach((x) => { if (x.reason === 'تجميع أوردر') Object.assign(x, { reason: 'متاح للبيع', label: 'دخول — للبيع', ref: null }); });
    ['inv_consolidations', 'inv_consolidation_items'].forEach((k) => { if (Array.isArray(mock.inv[k])) mock.inv[k] = []; });
    if (Array.isArray(mock.inv.inv_locations)) mock.inv.inv_locations = mock.inv.inv_locations.filter((x) => x.code !== 'T');
  }
  // the marketing notes (trends, the assistants' skills) name no maker either
  const deep = (v) => (typeof v === 'string' ? v.replace(/لإيد المبتكر وهو بيشتغل/g, 'للإيد وهي بتشتغل').replace(/بإيد المبتكر/g, 'بالإيد').replace(/ ?(لل|ال)مبتكر(ين)?/g, '')
    : Array.isArray(v) ? v.map(deep) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deep(x)])) : v);
  if (mock.mkt) ['trends', 'agents', 'agentKb', 'kb'].forEach((k) => { if (mock.mkt[k]) mock.mkt[k] = deep(mock.mkt[k]); });
  addOrders(mock, true);
  // and no product stands in a status that names a maker
  const OWN_STATUS = { 'جاهز للشحن من المخزن للعميل': 'جاهز للشحن من المبتكر للعميل', 'جاهز للشحن من المبتكر للمخزن': '', 'تم الشحن للمخزن': '', 'وصل المخزن': '', 'مرتجع للمبتكر': 'مرتجع للمخزن' };
  mock.orderItems.forEach((l) => { if (Object.prototype.hasOwnProperty.call(OWN_STATUS, l.status)) l.status = OWN_STATUS[l.status]; if (l.ret && /مبتكر/.test(String(l.ret.to || l.ret.type || ''))) l.ret = null; });
}

/** The money the dashboard and «الحسابات» show: the accounts' balances (an opening deposit and what this month's expenses took) and
 *  this month's expenses by type — dates kept inside the current month so «الشهر ده» always has them. */
function money(mock) {
  if (!mock.acc) return;
  const dom = new Date(NOW).getUTCDate(); const inMonth = (d) => day(Math.min(d, dom - 1));
  let id = 9000; const by = '00000000-0000-4000-8000-000000000001';
  const row = (x) => ({ id: ++id, note: null, created_by: by, created_at: ago(1), updated_by: null, updated_at: null, voided_by: null, voided_at: null, ...x });
  const opening = [['حساب البنك', 85000], ['حساب بوسطة', 12400], ['حساب باي موب', 6800]];
  opening.forEach(([account, amount]) => mock.acc.acc_account_moves.push(row({ account, on_date: inMonth(19), direction: 'deposit', amount, note: 'رصيد أول الشهر', beneficiary_kind: 'أخرى', beneficiary: 'رصيد افتتاحي', vendor_id: null, member_id: null, expense_id: null, vendor_move_id: null, pair_id: null, withdraw_id: null })));
  const exp = [
    // no salaries yet: they are paid on the 28th (the payroll card says so)
    { category: 'الإعلانات', beneficiary: 'Meta', amount: 2400, details: 'Meta', on: 6, note: 'حملة الشتا' },
    { category: 'الاشتراكات', beneficiary: 'Canva', amount: 650, on: 10, sub_name: 'Canva Pro', sub_is_other: false, sub_ends: day(-20), sub_alerts: ['week'], sub_note: null },
    { category: 'المصروفات', beneficiary: 'مطبعة الكراتين', amount: 950, on: 4, note: 'تغليف وكراتين' },
  ];
  exp.forEach((x) => {
    const e = row({ on_date: inMonth(x.on), direction: 'withdraw', category: x.category, beneficiary: x.beneficiary, beneficiary_other: !!x.beneficiary_other, amount: x.amount, note: x.note || null,
      sub_name: x.sub_name || null, sub_is_other: x.sub_is_other || false, sub_ends: x.sub_ends || null, sub_alerts: x.sub_alerts || null, sub_note: null, details: x.details || null, staff_kind: null, reason: null, account: 'حساب البنك' });
    mock.acc.acc_expenses.push(e);
    // the expense paid from the bank is one operation with its account move (0143)
    mock.acc.acc_account_moves.push(row({ account: 'حساب البنك', on_date: e.on_date, direction: 'withdraw', amount: x.amount, note: x.note || x.category, beneficiary_kind: 'أخرى', beneficiary: x.beneficiary, vendor_id: null, member_id: null, expense_id: e.id, vendor_move_id: null, pair_id: null, withdraw_id: null }));
  });
}

/** The model the visitor picked, applied to the stand-in after seed.js (boot.js, web demo only). */
export function webSeed(mock, mode) {
  if (!mock || !Array.isArray(mock.orders)) return;
  if (mode === 'single') singleStore(mock); else marketplace(mock);
  money(mock);
  aiLinks(mock);
  plainNames(mock);
}

/** The AI companies the demo opens linked — Claude and ChatGPT for the texts (so «المزوّدين» shows a second company's levels), Magnific
 *  for the images; Gemini is left unlinked, so the lists show what «only the linked companies» means. The keys are made-up fillers
 *  in the stand-in's Vault (never a real one — the page shows their last four letters only), and a month of made-up runs gives the
 *  spend card its two tables: each kind of work on the model of its level. */
function aiLinks(mock) {
  if (!mock.st || !mock.st.vault) return;
  const fill = (n) => 'demo'.repeat(n); const now = Date.now(); const ago = (h) => new Date(now - h * 36e5).toISOString();
  const keys = { anthropic: 'sk-' + 'ant-' + fill(8), openai: 'sk-' + fill(8), magnific_api: fill(6) };
  for (const [n, key] of Object.entries(keys)) mock.st.vault[n] = JSON.stringify({ key });
  let row = mock.settings.find((x) => x.section === 'integrations'); if (!row) { row = { section: 'integrations', data: {} }; mock.settings.push(row); }
  row.data = row.data || {}; row.data.meta = Object.assign({}, row.data.meta);
  Object.keys(keys).forEach((n, i) => { row.data.meta[n] = { linked_at: ago(24 * (20 + i)), linked_by: null, test: { ok: true, at: ago(24 * (20 + i)), latency_ms: 240 } }; });
  const runs = [
    ['assistant', 'chat', 'claude-opus-5-5', 0.0612, 6], ['assistant', 'chat', 'claude-sonnet-5-5', 0.0188, 30], ['assistant', 'chat', 'claude-haiku-5-5', 0.0009, 52], ['assistant', 'chat', 'claude-haiku-5-5', 0.0011, 75],
    ['assistant', 'filter', 'claude-haiku-5-5', 0.0004, 4], ['assistant', 'filter', 'claude-haiku-5-5', 0.0005, 28], ['assistant', 'filter', 'claude-haiku-5-5', 0.0004, 96],
    ['write', 'product', 'claude-sonnet-5-5', 0.0241, 9], ['write', 'data', 'claude-sonnet-5-5', 0.0226, 33], ['write', 'product', 'claude-sonnet-5-5', 0.0263, 57],
    ['studio', 'studio', 'claude-sonnet-5-5', 0.0312, 12], ['studio', 'studio', 'claude-haiku-5-5', 0.0012, 13],
    ['marketing', 'campaign', 'claude-sonnet-5-5', 0.0284, 20], ['marketing', 'agent', 'claude-sonnet-5-5', 0.0197, 26], ['marketing', 'agent', 'claude-haiku-5-5', 0.0008, 49],
    ['marketing', 'buyer', 'claude-opus-5-5', 0.0725, 31], ['marketing', 'research', 'claude-opus-5-5', 0.0931, 80],
  ];
  const first = new Date(now); first.setUTCDate(1); first.setUTCHours(6, 0, 0, 0); // every run inside this month, whatever the day
  runs.forEach(([action, source, model, cost, hours], i) => {
    const at = Math.max(first.getTime() + i * 6e5, now - hours * 36e5);
    mock.aiRuns.push({ id: 9000 + i, created_at: new Date(at).toISOString(), created_by: null, action, source, model, status: 'ok', credits: 0, cost_usd: cost, label: null });
  });
}

/** The tests' stand-in keeps one customer whose name is markup (it proves the pages print names as text). A visitor of the demo
 *  would only see an odd line in the bell, so here that customer gets an ordinary made-up name — wherever the name was copied. */
function plainNames(mock) {
  const MARK = /<img[^>]*>/g; const NAME = 'هدى فؤاد'; const seen = new WeakSet();
  const walk = (v, depth) => {
    if (!v || typeof v !== 'object' || seen.has(v) || depth > 10 || v instanceof Map || v instanceof Set) return; seen.add(v);
    for (const [k, x] of Array.isArray(v) ? v.entries() : Object.entries(v)) {
      if (typeof x === 'string') { if (x.includes('<img')) v[k] = x.replace(MARK, NAME); } else walk(x, depth + 1);
    }
  };
  walk(mock, 0);
}

/** The English demo (web.js picked «English»): the made-up data's free texts — people's names, addresses, notes, messages, the
 *  campaigns' ideas and captions — are written in English too, so a form's fields and a search read like the page around them.
 *  Values the system works with (statuses, roles, categories, account names, templates with their variables) stay as they are:
 *  the page shows those in English as it writes them (i18n.js). `tr` is that layer's translator. */
const EN_KEYS = /^(customer_name|customer_address|customer_city|customer_note|address|city|note|notes|comment|text|title|description|caption|idea|summary|sub|why|impact|keyword|early_reason|resolution_note|beneficiary|customer|actor_name|assignee_member_name|resolved_by_name|created_by_name|bank_name)$/;
const EN_NAME_IN = /^(profiles|cs\.customers|hr\.payroll_lines|mkt\.campaigns|cs\.campaigns|cs\.segments|orderItems|products)$/;
const EN_SKIP = /^(roles|st|statusMap|activityRows|shotPrompts|skuColors|settings|ticketEvents|hr\.leave_types|hr\.bonus_rules|cs\.rules|cs\.templates|cs\.quick|cs\.channels|wooStates|wooCategories)$/;
export function englishData(mock, tr) {
  if (!mock || typeof tr !== 'function') return;
  const AR = /[\u0600-\u06FF]/; const seen = new WeakSet();
  const walk = (v, table, depth) => {
    if (!v || typeof v !== 'object' || seen.has(v) || depth > 10 || v instanceof Map || v instanceof Set) return; seen.add(v);
    if (Array.isArray(v)) { v.forEach((x, i) => { if (typeof x === 'string') return; walk(x, table, depth + 1); }); return; }
    for (const [k, x] of Object.entries(v)) {
      if (typeof x === 'string') { if (AR.test(x) && (EN_KEYS.test(k) || (k === 'name' && EN_NAME_IN.test(table)))) v[k] = tr(x); continue; }
      walk(x, table, depth + 1);
    }
  };
  for (const [k, v] of Object.entries(mock)) {
    if (typeof v === 'function' || EN_SKIP.test(k)) continue;
    if (Array.isArray(v)) { walk(v, k, 0); continue; }
    if (v && typeof v === 'object' && ['cs', 'hr', 'mkt', 'acc', 'inv'].includes(k)) { for (const [k2, v2] of Object.entries(v)) { if (!EN_SKIP.test(k + '.' + k2)) walk(v2, k + '.' + k2, 0); } }
  }
}

