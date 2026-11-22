// An assistant's own chat answers from the system first (app/js/pages/agent-brain.js): a number of its speciality as the server
// counted it, the general manager's line on every assistant, a question for another assistant handed over — and nothing else.
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { loadUmd } from '../helpers/load-umd.mjs';
import { ruleFacts, agentFacts } from '../e2e/rules-mock.mjs';
const B = loadUmd(new URL('../../app/js/pages/system-brain.js', import.meta.url))(loadUmd(new URL('../../app/js/blocks/27-commands-domain.js', import.meta.url)));
const A = loadUmd(new URL('../../app/js/pages/agent-brain.js', import.meta.url))();
const at = new Date('2026-11-22T12:00:00Z');
const mock = { settings: [], vendors: [{ id: 'v1', status: 'active', lead_days: 7 }], vendorBank: [],
  orders: [{ id: 2, status: 'جاري التنفيذ', confirm: 'مؤكد بعربون', confirm_at: '2026-11-05', placed_at: '2026-11-04T10:00:00Z' }, { id: 3, status: 'قيد الانتظار', confirm: 'غير مؤكد', confirm_at: null, placed_at: '2026-11-22T10:00:00Z' }],
  orderItems: [{ id: 1, order_id: 2, vendor_id: 'v1', removed: false, status: '' }], tickets: [],
  cs: { conversations: [{ seg: 'customers', status: 'مستنية ردنا', waiting_since: '2026-11-22T11:40:00Z' }] }, inv: { inv_lots: [] }, acc: { dokan_withdrawals: [{ status: 'pending' }], acc_expenses: [] }, hr: { requests: [], overtime: [] },
  mkt: { rulesOn: true, aiAgents: [{ id: 'manager', name: 'المدير العام' }, { id: 'stock', name: 'التشغيل الذكي' }, { id: 'cs', name: 'خدمة العملاء الذكية' }, { id: 'accountant', name: 'المحاسب الذكي' }, { id: 'designer', name: 'الديزاينر الذكي', role: 'التصميم' }, { id: 'hr', name: 'الموارد البشرية الذكية' }],
    agentNotes: [], agentNoteReads: [], suggestions: [], adStats: [], posts: [], siteChecks: [] } };
const facts = (ids) => agentFacts(mock, (id) => !ids || ids.includes(id), at);
const ctx = (ids) => ({ facts: facts(ids), norm: B.norm, thinks: B.thinks, when: '2:00 م' });
const ask = (agent, text, ids) => A.answer(agent, text, ctx(ids));

test('the facts a chat reads: only the assistants the member sees, each number with its words and the rule that holds', () => {
  const f = facts(['stock', 'cs']); assert.deepEqual(Object.keys(f.agents), ['stock', 'cs']);
  const late = f.agents.stock.metrics.find((m) => m.key === 'orders_late'); assert.equal(late.now, ruleFacts(mock, at).orders_late); assert.equal(late.nowText, '1'); assert.equal(late.rule, 'أوردرات متأخرة — 1 أو أكتر'); assert.ok(late.kw.includes('متاخر'));
  assert.equal(f.agents.cs.metrics.find((m) => m.key === 'cs_waiting').rule, '', 'one waiting is under the limit of three');
});

test('a question about a number of its speciality: the number, the rule that holds and what to do — and when it was read', () => {
  const r = ask('stock', 'كام أوردر متأخر؟'); assert.equal(r.type, 'metric'); assert.equal(r.key, 'orders_late');
  assert.equal(r.text, 'أوردرات متأخرة: 1.\nالقاعدة متحققة: أوردرات متأخرة — 1 أو أكتر.\nراجع سبب التأخير وحدّث العملاء بالميعاد الجديد.\nآخر تحديث: 2:00 م');
  assert.equal(ask('cs', 'فيه محادثات مستنية رد؟').text, 'محادثات مستنية ردنا: 1.\nآخر تحديث: 2:00 م', 'under its limit: the number alone');
  assert.equal(ask('accountant', 'في طلبات سحب؟').key, 'withdraw_pending');
});

test('«إيه الأخبار؟»: the numbers the assistant watches; the general manager says where every assistant stands', () => {
  const s = ask('stock', 'إيه الأخبار النهارده؟'); assert.equal(s.type, 'status'); assert.match(s.text, /^الأرقام اللي براقبها دلوقتي:\n⚠ أوردرات متأخرة: 1\n• أوردرات قابلة للتأخير: 0\n• مرتجعات مستنية الفحص: 0\nآخر تحديث: 2:00 م$/);
  const m = ask('manager', 'ملخص الوضع'); assert.equal(m.type, 'status');
  assert.ok(m.text.includes('⚠ التشغيل الذكي: أوردرات متأخرة (1)')); assert.ok(m.text.includes('• خدمة العملاء الذكية: تمام')); assert.ok(m.text.includes('⚠ المحاسب الذكي: طلبات سحب مستنية الموافقة (1)'));
});

test('another assistant’s number is handed over: the general manager routes, and a specialist keeps to its lane; one the member does not see is not offered', () => {
  const r = ask('manager', 'كام أوردر متأخر؟'); assert.deepEqual([r.type, r.agent, r.question], ['handoff', 'stock', 'كام أوردر متأخر؟']); assert.ok(r.text.includes('ده تخصص «التشغيل الذكي»'));
  assert.equal(ask('manager', 'فيه أوردرات مستنية تأكيد؟').type, 'metric', 'its own number is its own to say');
  assert.deepEqual([ask('cs', 'في طلبات سحب مستنية؟').type, ask('cs', 'في طلبات سحب مستنية؟').agent], ['handoff', 'accountant']);
  assert.equal(ask('cs', 'في طلبات سحب مستنية؟', ['cs', 'stock']), null, 'the accountant is not in this member’s team');
});

test('what is a model’s work or not a question is left alone: a why, writing, an order to make something, an empty text, no facts', () => {
  for (const q of ['ليه الأوردرات بتتأخر؟', 'اكتبلي رد لعميل زعلان من التأخير', 'حلل المحادثات واقترح رد', 'اعمل بوست عن منتج فشل', 'سجّل مصروف 750 كهربا', 'شكرا', ''])
    assert.equal(ask('stock', q), null, q);
  assert.equal(A.answer('stock', 'كام أوردر متأخر؟', { norm: B.norm, thinks: B.thinks }), null); assert.equal(A.answer('nope', 'كام أوردر متأخر؟', ctx()), null);
  const en = A.answer('stock', 'Any late orders?', { facts: (() => { globalThis.IB_LANG = 'en'; const f = facts(); delete globalThis.IB_LANG; return f; })(), norm: B.norm, thinks: B.thinks, when: '2:00 PM', en: true });
  assert.equal(en.text, 'Late orders: 1.\nThe rule holds: Late orders — 1 or more.\nFind what holds them and update the customers with the new date.\nLast updated: 2:00 PM');
});
