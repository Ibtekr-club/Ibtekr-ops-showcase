// «الذكاء الاصطناعي» (the owner 17 Nov: «ضيف علي التلاتة الموجودين المخزن الذكي و خدمة
// العملاء الذكية و خدمة المبتكرين الذكية… المحاسب الذكي و الموارد البشرية الذكية… و امكانية لاضافة مساعدين جدد»): the assistants beyond
// the three of marketing (their own prompts stay in marketing.js). The pure part: the base prompt of each, the rules and skills of one
// assistant out of the one list (0120 ai_agent_kb — empty «agents» = all of them), and the data block the server read with the member's
// own client. Nothing here executes anything — an assistant reads and advises, a real job goes to a person through «تقديم طلب».
import { kbOf } from './agent-kb.js?v=8449c1a4fb';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
export const AGENT_ID = /^[a-z][a-z0-9_]{1,30}$/;
export const LEGACY_AGENTS = ['buyer', 'designer', 'dev']; // their prompts, data and answers live in marketing.js
export const SEES = ['orders', 'vendors', 'customers', 'tickets', 'tasks', 'expenses', 'sales', 'inventory', 'hr'];
export const DATA_MAX = 24000; // characters of <data> in one turn

const COMMON = `[prompt text omitted in the public copy]`;
const COMPANY = '[prompt text omitted in the public copy]';

export const BASES = {
  stock: `[prompt text omitted in the public copy]` + COMMON,
  cs: `[prompt text omitted in the public copy]` + COMMON,
  makers: `[prompt text omitted in the public copy]` + COMMON,
  accountant: `[prompt text omitted in the public copy]` + COMMON,
  content: `[prompt text omitted in the public copy]` + COMMON,
  hr: `[prompt text omitted in the public copy]` + COMMON,
};

/** The base prompt of an assistant from the registry row: a built-in's own, else a custom one's from its name and what it is for. */
export function agentBase(row) {
  const r = isObj(row) ? row : {};
  if (BASES[r.id]) return BASES[r.id];
  const name = String(r.name ?? '').replace(/[<>\u0000-\u001f]/g, ' ').trim().slice(0, 40) || 'مساعد';
  const about = String(r.about ?? '').replace(/[<>\u0000-\u001f]/g, ' ').trim().slice(0, 300);
  return `You are «${name}», an assistant of ${COMPANY}.${about ? ' What you are for: ' + about + '.' : ''} Help the team in your area with what they ask, using the admin's instructions, rules and skills below.` + COMMON;
}

/** The kinds of data a registry row reads (only the known ones; the legacy three read their own). */
export const seesOf = (row) => (isObj(row) && Array.isArray(row.sees) ? row.sees.filter((k) => SEES.includes(k)) : []);

/**
 * One assistant's rules and skills out of the one list (rows { kind, section, title, body|text, agents, sort }), as kbBlocks reads them:
 * { rules: [{ name, items: [{ title, text }] }], skills: [...] } — an item for no assistant in particular is for all of them.
 */
export function kbFor(rows, agent) {
  const out = { rules: [], skills: [] };
  for (const r of Array.isArray(rows) ? rows : []) {
    if (!isObj(r) || !out[r.kind]) continue;
    const to = Array.isArray(r.agents) ? r.agents : [];
    if (to.length && !to.includes(agent)) continue;
    const list = out[r.kind]; let g = list.find((x) => x.name === r.section);
    if (!g) { g = { name: String(r.section ?? ''), items: [] }; list.push(g); }
    g.items.push({ title: r.title, text: r.body ?? r.text ?? '' });
  }
  return { rules: kbOf(out.rules), skills: kbOf(out.skills) };
}

/** The data the server read for the turn ({ kind: result }) → <data>…</data>, cut to DATA_MAX on a whole part; '' when none. */
export function dataBlock(parts) {
  if (!isObj(parts)) return '';
  const keys = Object.keys(parts).filter((k) => SEES.includes(k));
  if (!keys.length) return '';
  let body = '';
  for (const k of keys) {
    const part = k + ': ' + JSON.stringify(parts[k] ?? null);
    if (body.length + part.length + 1 > DATA_MAX) { body += (body ? '\n' : '') + k + ': (too long — ask about it alone)'; continue; }
    body += (body ? '\n' : '') + part;
  }
  return '<data>\n' + body + '\n</data>';
}
