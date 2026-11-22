// The assistants' own rules, emulated for the stand-in (not a test file itself) — what the scheduled check does on the server:
// it counts the metrics from the tables (ruleFacts), runs the rules of the row «ai» (mock/shared/agent-rules.js) and writes
// or clears the notes of «rule:…» in ai_agent_notes (runRules). On only when the install asks for it (opts.agentRules), so the
// notes of every other test stay as seeded. The RPC ai_agent_rules_status (the admin) gives the settings card its numbers.
import { DELAY_STOP, delayRules, isConfirmed, leadBy, lineDelayOf, lineElapsed, orderDelayOf, orderElapsed } from '../../mock/shared/delay.js?v=fd2e0b57f6';
import { METRICS, evaluate, holds, labelOf, metricsFor, rulesOf, say, sentence } from '../../mock/shared/agent-rules.js?v=fd2e0b57f6';

const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' });
const cairoDay = (d) => fmt.format(d);
const dataOf = (mock, section) => ((mock.settings || []).find((x) => x.section === section) || {}).data || {};
const OPEN_TICKET = ['open', 'in_progress', 'waiting', 'reopened'];

/** Every metric counted from the stand-in's rows now (null = its table is not there). */
export function ruleFacts(mock, at = new Date()) {
  const today = cairoDay(at); const f = {}; const rules = delayRules((dataOf(mock, 'makers') || {}).delay);
  const orders = (mock.orders || []).filter((o) => !o.deleted_at); const closed = ['مكتمل', 'ملغي', 'استرجاع', 'فشل'];
  const items = mock.orderItems || []; const vend = new Map((mock.vendors || []).map((v) => [v.id, v]));
  const liveItems = (o) => items.filter((l) => l.order_id === o.id && !l.removed && l.status !== 'ملغي');
  const start = (o) => ({ confirm: o.confirm, confirmAt: o.confirm_at, placedAt: o.placed_at });
  f.orders_unconfirmed = orders.filter((o) => !closed.includes(o.status) && !isConfirmed(o.confirm)).length;
  let late = 0, risk = 0; const lateMakers = new Set();
  for (const o of orders) {
    if (closed.includes(o.status)) continue; const ls = liveItems(o); const leads = ls.map((l) => leadBy(null, (vend.get(l.vendor_id) || {}).lead_days, rules));
    const d = orderDelayOf({ status: o.status, elapsed: orderElapsed(start(o), today, rules), maxLead: leads.length ? Math.max(...leads) : rules.lead }, rules);
    if (d === 'late') late++; else if (d === 'risk') risk++;
    if (!DELAY_STOP.includes(o.status)) ls.forEach((l, i) => { if (l.vendor_id && lineDelayOf(lineElapsed({ notifiedAt: l.expected_at, ...start(o) }, today, rules), leads[i], true, rules) === 'late') lateMakers.add(l.vendor_id); });
  }
  f.orders_late = late; f.orders_risk = risk; f.makers_late = lateMakers.size;
  const bank = new Set((mock.vendorBank || []).map((b) => b.vendor_id));
  f.makers_no_bank = (mock.vendors || []).filter((v) => v.status === 'active' && !v.archived_at && !bank.has(v.id)).length;
  const lots = mock.inv && mock.inv.inv_lots; f.returns_waiting = lots ? lots.filter((l) => !l.closed_at && l.reason === 'مرتجع' && l.status === 'بانتظار الفحص').length : null;
  const tk = (mock.tickets || []).filter((t) => OPEN_TICKET.includes(t.status));
  f.tickets_urgent = tk.filter((t) => t.priority === 'urgent').length; f.tickets_overdue = tk.filter((t) => t.follow_up && t.follow_up < today).length;
  const H = mock.mkt || {}; const design = (H.aiAgents || []).find((a) => a.id === 'designer'); f.design_requests = design && design.role ? tk.filter((t) => t.assignee_role === design.role).length : 0;
  const cv = mock.cs && mock.cs.conversations; if (cv) { const w = cv.filter((c) => c.seg === 'customers' && c.status === 'مستنية ردنا');
    f.cs_waiting = w.length; const since = w.map((c) => Date.parse(c.waiting_since)).filter(Number.isFinite); f.cs_waiting_minutes = since.length ? Math.max(0, Math.floor((at.getTime() - Math.min(...since)) / 60000)) : 0; } else { f.cs_waiting = null; f.cs_waiting_minutes = null; }
  const acc = mock.acc; f.withdraw_pending = acc && acc.dokan_withdrawals ? acc.dokan_withdrawals.filter((w) => w.status === 'pending').length : null;
  const ends = acc && acc.acc_expenses ? acc.acc_expenses.filter((e) => !e.voided_at && e.sub_ends && e.sub_ends >= today).map((e) => Math.round((Date.parse(e.sub_ends + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86400000)) : [];
  f.sub_days_left = ends.length ? Math.min(...ends) : null;
  const hr = mock.hr; f.hr_requests_pending = hr && hr.requests ? hr.requests.filter((r) => r.status === 'جديد').length : null; f.overtime_pending = hr && hr.overtime ? hr.overtime.filter((r) => r.status === 'مستني').length : null;
  f.ads_suggestions = (H.suggestions || []).filter((s) => s.status === 'pending').length;
  const from = cairoDay(new Date(at.getTime() - 6 * 86400000)); f.ads_spend_week = Math.round((H.adStats || []).filter((s) => s.level === 'campaign' && s.day >= from && s.day <= today).reduce((n, s) => n + (Number(s.spend) || 0), 0));
  f.posts_failed = (H.posts || []).filter((p) => p.status === 'فشل' && !p.deleted_at).length;
  const check = (kind) => (H.siteChecks || []).find((c) => c.kind === kind); const sp = check('pagespeed'); const wp = check('wp_updates');
  f.site_speed = sp && sp.data && Number.isFinite(sp.data.score) ? sp.data.score : null; f.site_updates = wp && wp.data && Number.isFinite(wp.data.updates) ? wp.data.updates : null;
  return f;
}

const liveAgents = (mock) => ((mock.mkt && mock.mkt.aiAgents) || []).filter((a) => !a.archived_at);
const english = () => globalThis.IB_LANG === 'en';
// the store of the row «store» (0127): a platform without Dokan, or the single-seller mode = no makers
const singleOf = (mock) => { const st = dataOf(mock, 'store'); return st.mode === 'single' || st.dokan === false || (!!st.platform && st.platform !== 'woo'); };

/** The check itself: the notes of the rules that hold are written (one a rule, the same row while it holds — unread again
 *  when its number moved), and the note of a rule that stopped holding, was switched off or deleted goes. */
export function runRules(mock, at = new Date()) {
  const H = mock.mkt; if (!H || !H.rulesOn || !Array.isArray(H.agentNotes)) return null;
  const { notes, keep } = evaluate(dataOf(mock, 'ai'), liveAgents(mock), ruleFacts(mock, at), { en: english(), single: singleOf(mock) });
  const want = new Map(notes.map((n) => [n.ref, n])); const now = at.toISOString();
  H.agentNotes = H.agentNotes.filter((n) => { if (!n.ref || !String(n.ref).startsWith('rule:') || want.has(n.ref) || keep.includes(n.ref)) return true;
    H.agentNoteReads = H.agentNoteReads.filter((r) => r.note_id !== n.id); return false; });
  for (const n of notes) { const old = H.agentNotes.find((x) => x.ref === n.ref);
    if (!old) { H.agentNotes.push({ id: H.agentNotes.reduce((m, x) => Math.max(m, x.id), 0) + 1, agent: n.agent, kind: n.kind, title: n.title, body: n.body, link: null, ref: n.ref, created_at: now, val: n.value }); continue; }
    if (old.val !== n.value) { old.created_at = now; H.agentNoteReads = H.agentNoteReads.filter((r) => r.note_id !== old.id); }
    Object.assign(old, { kind: n.kind, title: n.title, body: n.body, val: n.value }); }
  return notes.length;
}

/** ai_agent_rules_status (the admin): every assistant's rules in force with the number now and whether each holds, and the
 *  metrics it may watch — the names in the page's language. */
export function rulesStatus(mock, at = new Date()) {
  const en = english(); const o = { single: singleOf(mock) }; const facts = ruleFacts(mock, at); const ai = dataOf(mock, 'ai'); const agents = {};
  const now = (k) => (facts[k] === undefined ? null : facts[k]); const nowText = (k) => (now(k) === null ? null : say(now(k), METRICS[k].unit, en));
  for (const a of (mock.mkt.aiAgents || [])) { const r = rulesOf(ai, a, o);
    agents[a.id] = { own: r.own, metrics: metricsFor(a, o).map((k) => ({ key: k, label: labelOf(k, en), unit: say(0, METRICS[k].unit, en).slice(1).trim(), op: METRICS[k].op, value: METRICS[k].value, kind: METRICS[k].kind, now: now(k), nowText: nowText(k) })),
      rules: r.rules.map((x) => ({ ...x, text: sentence(x, en), now: now(x.metric), nowText: nowText(x.metric), firing: x.on && holds(x, facts[x.metric]) })) }; }
  return { at: at.toISOString(), on: !!mock.mkt.rulesOn, agents };
}
