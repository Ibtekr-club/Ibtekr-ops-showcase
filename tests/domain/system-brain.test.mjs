import { test } from 'node:test'; import assert from 'node:assert/strict';
import { loadUmd } from '../helpers/load-umd.mjs';
// The system's own engine (the owner 22 Nov — «المساعدين … ذكائهم في السيستم مش بيستخدموا مخ خارجي»): what a member asks of the system is
// understood with no model behind it — a page by its name, the fixed commands in today's words, a maker's name by its sound or with
// a slip of the hand — and what is a model's work (a why, an opinion, writing) or more than one ask is left `unknown`.
const B = loadUmd(new URL('../../app/js/pages/system-brain.js', import.meta.url))(loadUmd(new URL('../../app/js/blocks/27-commands-domain.js', import.meta.url)));
const ctx = { vendors: ['antekama', 'Glastora', 'نقشة', 'خشب وبس', 'خشب الورد', 'Nile Craft'], today: '2026-11-22',
  pages: [{ id: 'inventory', label: 'المخزون' }, { id: 'orders', label: 'الأوردرات' }, { id: 'tickets', label: 'طلبات الفريق' }, { id: 'reports', label: 'التقارير' }, { id: 'hr', label: 'الموارد البشرية' }] };
const u = (s, c) => JSON.parse(JSON.stringify(B.understand(s, c || ctx)));

test('a page by the words people call it: with «افتح» / «وديني», or its name alone; a page the member may not open is not offered', () => {
  assert.deepEqual(u('افتح المخزن'), { type: 'goPage', page: 'inventory' });
  assert.deepEqual(u('التقارير'), { type: 'goPage', page: 'reports' });
  assert.deepEqual(u('وديني على طلبات الفريق'), { type: 'goPage', page: 'tickets' });
  assert.deepEqual(u('افتح الموظفين'), { type: 'goPage', page: 'hr' });
  assert.deepEqual(u('افتح المخزن', Object.assign({}, ctx, { pages: ctx.pages.filter((p) => p.id !== 'inventory') })), { type: 'unknown' });
});

test('the fixed commands in today\'s words: «المبتكر» is read, a filter says what it found, a general expense has its kind', () => {
  assert.deepEqual(u('اعرض الأوردرات المتأخرة'), { type: 'ordersFilter', filter: { deliv: 'late' } });
  assert.deepEqual(u('كام أوردر متأخر؟'), { type: 'ordersFilter', filter: { deliv: 'late' } });
  assert.deepEqual(u('رتب المبتكرين بالعربون'), { type: 'sortVendors', sort: 'deposits:desc' });
  assert.equal(u('سجل سحب مرتبات 5000').category, 'المرتبات');
  assert.deepEqual([u('سحب مصروفات 1500').type, u('سحب مصروفات 1500').category, u('سحب مصروفات 1500').amount], ['addExpense', 'المصروفات', '1500']);
  assert.deepEqual(u('الشهر ده'), { type: 'setRange', preset: 'thisMonth' });
});

test('a maker\'s name: by its sound across the two alphabets, with a slip of the hand, only where a name is announced; two that fit are asked about', () => {
  assert.deepEqual([B.skel('انتيكما'), B.skel('antekama'), B.skel('جلاستورا'), B.skel('Glastora'), B.skel('نايل كرافت'), B.skel('Nile Craft')], ['ntkm', 'ntkm', 'glstr', 'glstr', 'nlkrft', 'nlkrft']);
  assert.deepEqual(u('أوردرات المبتكر انتيكما جاري التنفيذ'), { type: 'ordersFilter', filter: { st: 'جاري التنفيذ', vendor: 'antekama' }, heard: 'antekama' });
  assert.deepEqual(u('اوردرات المبتكر antekma').filter, { vendor: 'antekama' });
  assert.deepEqual(u('اوردرات المبتكر نايل كرافت متأخرة').filter, { deliv: 'late', vendor: 'Nile Craft' });
  const two = u('اوردرات المبتكر خشب');
  assert.equal(two.type, 'choose'); assert.deepEqual(two.options, ['خشب الورد', 'خشب وبس']); assert.deepEqual(two.texts, ['اوردرات المبتكر خشب الورد', 'اوردرات المبتكر خشب وبس']);
  // a word of the system's own is never taken for a name: no name is announced here
  assert.deepEqual(B.findName('كام أوردر متأخر', ['Mtakhar Home']), { hit: '', others: [] });
  assert.equal(B.findName('حساب Glastora', ctx.vendors).hit, 'Glastora'); // as written: anywhere
});

test('a model\'s work is left to the member\'s choice: a why, an opinion, writing, a page\'s name inside a longer question, two asks in one', () => {
  for (const s of ['ليه مبيعات انتيكما نزلت الشهر ده؟', 'اكتب وصف لمنتج جديد', 'عايز اعرف رأيك في الحسابات', 'ازيك', 'اقترح عرض للأسبوع الجاي', 'الحسابات فيها مشكلة من امبارح ومش عارف السبب',
    'حساب antekama وعدد الأوردرات الملغية', '']) assert.deepEqual(u(s), { type: 'unknown' }, s);
});
