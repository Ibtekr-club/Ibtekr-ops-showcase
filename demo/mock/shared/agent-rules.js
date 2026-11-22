// The rules the system runs by itself, an assistant each (the owner 22 Nov — «السيستم لوحدوا يقدر يبعت تنبيهات و ياخد قرارت و يجيب
// بيانات بناء علي القواعد … اللي مكاتبها لكل مساعد»). Pure: no database and no network.
//   A metric is a number the system counts from its own data (never a guess); a rule = a metric against a limit:
//     { id, metric, op: 'gte' | 'lte', value, kind: 'alert' | 'problem' | 'idea', on }
//   A rule that holds writes one note for its assistant (the bell's «المساعدين», ref «rule:<assistant>:<rule>» — the same row
//   while it keeps holding), and its note goes once it no longer holds. A rule never executes anything: the note opens the
//   assistant's chat and the member decides.
//   Kept in the row «ai»: agents.<id>.rules — absent = the shipped ones of the assistant.

const M = (agent, data, unit, op, value, kind, ar, en, doAr, doEn) => ({ agent, data, unit, op, value, kind, ar, en, doAr, doEn });
/** What the system counts, and the rule each ships with (its limit is the admin's to change). */
export const METRICS = {
  orders_unconfirmed: M('manager', 'orders', 'count', 'gte', 3, 'alert', 'أوردرات مفتوحة مستنية تأكيد', 'Open orders waiting for confirmation', 'راجعها مع خدمة العملاء: أوردر من غير تأكيد مالوش عدّاد تأخير.', 'Go over them with customer service: an order without a confirmation has no delay count.'),
  tickets_urgent: M('manager', 'tickets', 'count', 'gte', 1, 'problem', 'طلبات عاجلة مفتوحة', 'Open urgent requests', 'شوف مين ماسكها ووزّع اللي واقف.', 'See who holds them and hand out what is stuck.'),
  tickets_overdue: M('manager', 'tickets', 'count', 'gte', 1, 'alert', 'طلبات عدّى ميعاد متابعتها', 'Requests past their follow-up date', 'افتحها وحدّد ميعاد جديد أو اقفل اللي خلص.', 'Open them and set a new date, or close what is done.'),
  orders_late: M('stock', 'orders', 'count', 'gte', 1, 'problem', 'أوردرات متأخرة', 'Late orders', 'بلّغ المبتكرين وحدّث العملاء بالميعاد الجديد.', 'Tell the makers and update the customers with the new date.'),
  orders_risk: M('stock', 'orders', 'count', 'gte', 2, 'alert', 'أوردرات قابلة للتأخير', 'Orders at risk of delay', 'تابعها قبل ما مدة التصنيع تخلص.', 'Follow them up before the making time runs out.'),
  returns_waiting: M('stock', 'inventory', 'count', 'gte', 1, 'alert', 'مرتجعات مستنية الفحص', 'Returns waiting for inspection', 'افحصها عشان ترجع متاحة للبيع أو ترجع للمبتكر.', 'Inspect them so they go back on sale or back to the maker.'),
  cs_waiting: M('cs', 'customers', 'count', 'gte', 3, 'alert', 'محادثات مستنية ردنا', 'Conversations waiting for our reply', 'وزّعها على المتاحين دلوقتي.', 'Hand them out to whoever is available now.'),
  cs_waiting_minutes: M('cs', 'customers', 'minutes', 'gte', 60, 'problem', 'أقدم محادثة مستنية ردنا', 'The oldest conversation waiting for our reply', 'رد عليها الأول — عدّت وقت الرد المتفق عليه.', 'Answer it first — it is past the agreed reply time.'),
  makers_late: M('makers', 'vendors', 'count', 'gte', 1, 'problem', 'مبتكرين عندهم منتجات متأخرة', 'Makers with late products', 'كلّمهم واطلب ميعاد تسليم واضح.', 'Call them and ask for a clear delivery date.'),
  makers_no_bank: M('makers', 'vendors', 'count', 'gte', 1, 'alert', 'مبتكرين نشطين من غير حساب بنكي', 'Active makers without a bank account', 'اطلب بيانات الحساب قبل أول طلب سحب.', 'Ask for the account details before the first withdrawal.'),
  withdraw_pending: M('accountant', 'expenses', 'count', 'gte', 1, 'alert', 'طلبات سحب مستنية الموافقة', 'Withdrawals waiting for approval', 'راجع الرصيد والخصومات ووافق أو ارفض.', 'Check the balance and the deductions, then approve or reject.'),
  sub_days_left: M('accountant', 'expenses', 'days', 'lte', 7, 'alert', 'أقرب اشتراك بيخلص بعد', 'The nearest subscription ends in', 'جدّده أو الغيه قبل ما يقف.', 'Renew it or cancel it before it stops.'),
  hr_requests_pending: M('hr', 'hr', 'count', 'gte', 1, 'alert', 'طلبات موارد بشرية مستنية قرار', 'HR requests waiting for a decision', 'القرار للمدير المباشر أو الأدمن.', 'The direct manager or the admin decides.'),
  overtime_pending: M('hr', 'hr', 'count', 'gte', 1, 'alert', 'وقت إضافي مستني موافقة', 'Overtime waiting for approval', 'وافق أو ارفض قبل تحويل المرتبات.', 'Approve or reject before the salaries go out.'),
  ads_suggestions: M('buyer', 'sales', 'count', 'gte', 1, 'idea', 'اقتراحات إعلانات مستنية موافقتك', 'Ad suggestions waiting for your approval', 'افتحها ووافق أو ارفض كل واحد.', 'Open them and approve or reject each.'),
  ads_spend_week: M('buyer', 'sales', 'egp', 'gte', 35000, 'alert', 'صرف الإعلانات آخر 7 أيام', 'Ad spend in the last 7 days', 'قارنه بمبيعات الإعلانات قبل ما تزوّد.', 'Compare it with the ads’ sales before you raise it.'),
  design_requests: M('designer', 'tickets', 'count', 'gte', 3, 'alert', 'طلبات تصميم مفتوحة', 'Open design requests', 'رتّبها بالأولوية وابدأ بالأقدم.', 'Order them by priority and start with the oldest.'),
  posts_failed: M('designer', 'sales', 'count', 'gte', 1, 'problem', 'بوستات فشل نشرها', 'Posts that failed to publish', 'شوف سبب الفشل على البوست وانشره تاني.', 'See the reason on the post and publish it again.'),
  site_speed: M('dev', 'sales', 'score', 'lte', 50, 'problem', 'درجة سرعة الموقع على الموبايل', 'The site’s speed score on mobile', 'افتح فحص السرعة وابدأ بأكبر توفير.', 'Open the speed check and start with the biggest saving.'),
  site_updates: M('dev', 'sales', 'count', 'gte', 1, 'alert', 'تحديثات ووردبريس مستنية', 'WordPress updates waiting', 'حدّث على نسخة الاختبار الأول.', 'Update the staging copy first.'),
};
export const OPS = ['gte', 'lte']; export const KINDS = ['alert', 'problem', 'idea']; export const MAX_RULES = 12;
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** The metrics an assistant can watch: its own, and — for one the admin added — those of the data it reads. */
export function metricsFor(agent) {
  const id = agent && agent.id; const own = Object.keys(METRICS).filter((k) => METRICS[k].agent === id); if (own.length) return own;
  const sees = Array.isArray(agent && agent.sees) ? agent.sees : []; return Object.keys(METRICS).filter((k) => sees.includes(METRICS[k].data));
}
/** The rules an assistant ships with: one a metric of its own, on. */
export function shippedRules(id) { return Object.keys(METRICS).filter((k) => METRICS[k].agent === id).map((k) => ({ id: k, metric: k, op: METRICS[k].op, value: METRICS[k].value, kind: METRICS[k].kind, on: true })); }
/** One stored rule, cleaned (null = not a rule): a known metric among `allowed`, a whole limit 0–1,000,000. */
export function cleanRule(x, allowed) {
  if (!isObj(x) || typeof x.metric !== 'string' || !METRICS[x.metric] || (allowed && !allowed.includes(x.metric))) return null;
  const v = Number(x.value); if (x.value === '' || x.value === null || !Number.isInteger(v) || v < 0 || v > 1000000) return null;
  const id = typeof x.id === 'string' && /^[a-z0-9_]{1,40}$/.test(x.id) ? x.id : null; if (!id) return null;
  return { id, metric: x.metric, op: OPS.includes(x.op) ? x.op : METRICS[x.metric].op, value: v, kind: KINDS.includes(x.kind) ? x.kind : METRICS[x.metric].kind, on: x.on !== false };
}
/** The rules in force for an assistant: the admin's list once it was changed (cleaned, one an id), else the shipped. */
export function rulesOf(aiRow, agent) {
  const id = agent && agent.id; const r = isObj(aiRow) && isObj(aiRow.agents) && isObj(aiRow.agents[id]) ? aiRow.agents[id].rules : null;
  if (!Array.isArray(r)) return { own: false, rules: shippedRules(id) };
  const allowed = metricsFor(agent); const seen = new Set(); const out = [];
  for (const x of r) { const c = cleanRule(x, allowed); if (c && !seen.has(c.id) && out.length < MAX_RULES) { seen.add(c.id); out.push(c); } }
  return { own: true, rules: out };
}
export const holds = (rule, n) => typeof n === 'number' && Number.isFinite(n) && (rule.op === 'lte' ? n <= rule.value : n >= rule.value);
const UNIT = { count: ['', ''], minutes: [' دقيقة', ' min'], days: [' يوم', ' days'], score: [' من 100', ' of 100'], egp: [' ج.م', ' EGP'] };
/** A number with its unit, as the page and the notes say it. */
export function say(n, unit, en) { const u = UNIT[unit] || UNIT.count; return (en ? Number(n).toLocaleString('en-US') : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')) + u[en ? 1 : 0]; }
export const labelOf = (metric, en) => (METRICS[metric] ? (en ? METRICS[metric].en : METRICS[metric].ar) : metric);
/** The rule as a sentence: «أوردرات متأخرة — 1 أو أكتر». */
export function sentence(rule, en) { const m = METRICS[rule.metric]; if (!m) return '';
  return labelOf(rule.metric, en) + ' — ' + say(rule.value, m.unit, en) + (rule.op === 'lte' ? (en ? ' or less' : ' أو أقل') : (en ? ' or more' : ' أو أكتر')); }

/** The notes of the rules that hold now. `agents` = [{ id, sees }] (the live ones), `facts` = { metric: number | null (not read) }.
 *  → { notes: [{ agent, kind, title, body, ref, value }], keep: [refs of rules whose metric was not read — their note stays as it is] } */
export function evaluate(aiRow, agents, facts, o = {}) {
  const en = !!o.en; const notes = []; const keep = [];
  for (const a of agents || []) for (const r of rulesOf(aiRow, a).rules) {
    if (!r.on) continue; const m = METRICS[r.metric]; const n = facts ? facts[r.metric] : undefined; const ref = 'rule:' + a.id + ':' + r.id;
    if (n === null || n === undefined) { keep.push(ref); continue; }
    if (!holds(r, n)) continue;
    notes.push({ agent: a.id, kind: r.kind, ref, value: n, title: labelOf(r.metric, en) + ': ' + say(n, m.unit, en),
      body: (en ? 'The rule: ' : 'القاعدة: ') + sentence(r, en) + '.\n' + (en ? m.doEn : m.doAr) });
  }
  return { notes, keep };
}
