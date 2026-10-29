/**
 * Text handling for the Copilot's retrieval: lowercase words, stop words dropped, a light stemmer, and a small
 * list of finance synonyms so "rebalance" finds "bring back to plan" and "SIP" finds "systematic investment plan".
 */

const STOP = new Set(
  'a an and are as at be but by can do does for from had has have how i if in into is it its me my of on or our so than that the their them then there these they this to up us was we were what when where which who why will with you your about am been being did doing'.split(
    ' ',
  ),
)

/** Each group is one idea; a word from a group also searches for the group's other words, at a lower weight. */
const GROUPS: string[][] = [
  ['sip', 'systematic', 'monthly', 'instalment', 'installment'],
  ['rebalance', 'rebalancing', 'drift', 'plan', 'limit'],
  ['harvest', 'harvesting', 'tlh', 'loss', 'tax'],
  ['fee', 'cost', 'charge', 'expense', 'commission', 'ter', 'price', 'pay', 'pricing'],
  ['risk', 'volatility', 'riskometer', 'safe', 'swing'],
  ['score', 'health', 'rating'],
  ['goal', 'target', 'retire', 'retirement', 'college', 'education', 'home', 'save'],
  ['hold', 'own', 'portfolio', 'invest', 'fund', 'stock', 'share'],
  ['complain', 'complaint', 'grievance', 'ticket', 'escalate', 'scores'],
  ['ai', 'copilot', 'bot', 'artificial', 'intelligence', 'assistant'],
  ['adviser', 'advisor', 'advice', 'ria', 'expert'],
  ['data', 'privacy', 'consent', 'delete'],
]

/** Plural and common verb endings off, so "funds" matches "fund" and "investing" matches "invest". */
export function stem(word: string) {
  let w = word
  if (w.length > 5 && w.endsWith('ies')) w = w.slice(0, -3) + 'i'
  else if (w.length > 4 && w.endsWith('es')) w = w.slice(0, -2)
  else if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1)
  if (w.length > 6 && w.endsWith('ing')) w = w.slice(0, -3)
  else if (w.length > 5 && w.endsWith('ed')) w = w.slice(0, -2)
  else if (w.length > 5 && w.endsWith('ly')) w = w.slice(0, -2)
  if (w.length > 4 && w.endsWith('e')) w = w.slice(0, -1)
  if (w.length > 4 && w.endsWith('y')) w = w.slice(0, -1) + 'i'
  return w
}

/** The groups as stems, built once, because retrieval compares stems. */
const SYNONYMS: string[][] = GROUPS.map((g) => [...new Set(g.map((w) => stem(w)))])

const WORD = /[a-z0-9₹%.]+/g

export function tokens(text: string): string[] {
  const out: string[] = []
  for (const raw of text.toLowerCase().replace(/[’']/g, '').match(WORD) ?? []) {
    const w = raw.replace(/^\.+|\.+$/g, '')
    if (!w || STOP.has(w)) continue
    out.push(stem(w))
  }
  return out
}

/** Query terms: the stems plus, for each, its synonym group at a lower weight. */
export function queryTerms(text: string): { term: string; weight: number }[] {
  const base = tokens(text)
  const seen = new Map<string, number>()
  for (const t of base) seen.set(t, 1)
  for (const t of base)
    for (const group of SYNONYMS)
      if (group.includes(t)) for (const s of group) if (!seen.has(s)) seen.set(s, 0.35)
  return [...seen].map(([term, weight]) => ({ term, weight }))
}

/** The question's own words, lowercase, without stop words. Postgres stems them itself. */
export function searchWords(text: string): string[] {
  const out: string[] = []
  for (const raw of text.toLowerCase().replace(/[’']/g, '').match(/[a-z][a-z0-9]*/g) ?? []) {
    if (raw.length < 2 || STOP.has(raw)) continue
    if (!out.includes(raw)) out.push(raw)
  }
  return out
}

/** Stems from the synonym groups that the question touches, to search as prefixes at a lower weight. */
export function synonymPrefixes(text: string): string[] {
  return queryTerms(text)
    .filter((t) => t.weight < 1)
    .map((t) => t.term)
    .filter((t) => /^[a-z][a-z0-9]{2,}$/.test(t))
}

/** The other stems in the same synonym group as a stem, if it belongs to one. */
export function synonymsOf(stemmed: string): string[] {
  return [...new Set(SYNONYMS.filter((g) => g.includes(stemmed)).flat())].filter((t) => t !== stemmed)
}
