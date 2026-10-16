/**
 * Consolidated Account Statements (CAMS/KFintech for mutual funds, NSDL/CDSL for demat)
 * from their text, one string per line. Runs in the browser (the password never leaves
 * the device) and on the server as a fallback. Names, PAN and addresses are never
 * returned; folio/demat numbers only as a hash supplied by the caller.
 *
 * Built from the published statement layouts; confirm against anonymised real files
 * (golden tests) before relying on it, since issuers change layouts.
 */
import { isValidIsin } from '../isin'
import { parseAmount, parseDate } from '../numbers'
import type { ParseResult, RawRecord, RawTransaction } from './types'

export type CasKind = 'cams_kfintech' | 'nsdl_cdsl'

export function detectCas(firstPage: string): { kind: CasKind; detailed: boolean } | null {
  const t = firstPage.toLowerCase()
  if (!/consolidated account statement|\bcas\b/.test(t)) return null
  if (/nsdl|cdsl|central depository|national securities depository/.test(t)) return { kind: 'nsdl_cdsl', detailed: false }
  if (/cams|kfintech|kfin technologies|karvy|computer age management/.test(t)) return { kind: 'cams_kfintech', detailed: true }
  return null
}

const NUM = /\(?-?[\d,]+(?:\.\d+)?\)?/g
const numbersIn = (s: string) => (s.match(NUM) ?? []).map((n) => parseAmount(n)).filter((n): n is number => n !== null)

/** The statement date: "as on 09-Oct-2026", or the end of "for the period from X to Y". */
export function statementDate(text: string): string | null {
  const period = text.match(/period\s+from\s+\S+\s+to\s+(\d{1,2}[-\s/][A-Za-z]{3}[-\s/]\d{4})/i)
  if (period) return parseDate(period[1].replace(/\s/g, '-'))
  const asOn = text.match(/as\s+on\s+(\d{1,2}[-\s/][A-Za-z]{3}[-\s/]\d{4})/i)
  return asOn ? parseDate(asOn[1].replace(/\s/g, '-')) : null
}

const TX_TYPES: [RegExp, RawTransaction['type']][] = [
  [/switch[\s-]*in/i, 'switch_in'],
  [/switch[\s-]*out/i, 'switch_out'],
  [/systematic|sip/i, 'sip'],
  [/redemption|redeem|withdraw/i, 'sell'],
  [/idcw|dividend/i, 'dividend'],
  [/purchase|investment|nfo|allotment/i, 'buy'],
]

/**
 * CAMS/KFintech detailed statement: per scheme, a header with the ISIN, transaction
 * lines (date, description, amount, units, price, balance) and a closing line with the
 * unit balance, NAV, cost and market value.
 */
function parseMfDetailed(lines: string[], hashFolio: (folio: string) => string | null): { records: RawRecord[]; transactions: RawTransaction[] } {
  const records: RawRecord[] = []
  const transactions: RawTransaction[] = []
  let folio: string | null = null
  let scheme: { name: string; isin: string | null } | null = null
  lines.forEach((line, i) => {
    const folioMatch = line.match(/Folio\s*No\s*[:.]?\s*([A-Za-z0-9/ ]+?)(?:\s{2,}|\s+PAN|\s+KYC|$)/i)
    if (folioMatch) folio = folioMatch[1].trim()

    const isinMatch = line.match(/ISIN\s*[:.]?\s*(IN[A-Z0-9]{10})/i)
    if (isinMatch && isValidIsin(isinMatch[1].toUpperCase())) {
      const name = line
        .slice(0, isinMatch.index)
        .replace(/^[A-Z0-9]{2,8}\s*-\s*/i, '')
        .replace(/[-–\s]+$/, '')
        .trim()
      scheme = { name: name || isinMatch[1], isin: isinMatch[1].toUpperCase() }
      return
    }
    if (!scheme) return

    const tx = line.match(/^(\d{2}-[A-Za-z]{3}-\d{4})\s+(.+?)\s+(\(?[\d,]+\.\d+\)?)\s+(\(?[\d,]+\.\d+\)?)\s+([\d,]+\.\d+)\s+([\d,]+\.\d+)\s*$/)
    if (tx) {
      const type = TX_TYPES.find(([re]) => re.test(tx[2]))?.[1]
      const date = parseDate(tx[1])
      const amount = parseAmount(tx[3])
      const units = parseAmount(tx[4])
      if (type && date && amount !== null) transactions.push({ isin: scheme.isin, name: scheme.name, date, type, amount: Math.abs(amount), units: units === null ? null : Math.abs(units) })
      return
    }

    const closing = line.match(/Closing\s+Unit\s+Balance\s*:?\s*([\d,]+\.\d+)/i)
    if (closing) {
      const block = [line, lines[i + 1] ?? ''].join(' ')
      const units = parseAmount(closing[1])
      const nav = block.match(/NAV\s+on\s+[\w-]+\s*:?\s*(?:INR|Rs\.?|₹)?\s*([\d,]+\.\d+)/i)
      const value = block.match(/(?:Market|Valuation)\s+Value\s+on\s+[\w-]+\s*:?\s*(?:INR|Rs\.?|₹)?\s*([\d,]+\.\d+)/i)
      const cost = block.match(/Total\s+Cost\s+Value\s*:?\s*([\d,]+\.\d+)/i)
      if (units && units > 0) {
        records.push({
          name: scheme.name,
          isin: scheme.isin,
          quantity: units,
          price: nav ? parseAmount(nav[1]) : null,
          value: value ? parseAmount(value[1]) : null,
          cost: cost ? parseAmount(cost[1]) : null,
          typeHint: 'mutual_fund',
          accountHash: folio ? hashFolio(folio) : null,
          sourceRef: `line ${i + 1}`,
        })
      }
      scheme = null
    }
  })
  return { records, transactions }
}

/**
 * Holding lines in summary statements and NSDL/CDSL statements: an ISIN plus numbers.
 * Among the numbers, the triple where quantity × price ≈ value identifies each; for
 * funds the NAV is the smaller of the pair when units are larger, for shares the whole
 * number is the quantity.
 */
export function parseHoldingLine(line: string): Omit<RawRecord, 'accountHash' | 'sourceRef'> | null {
  const m = line.match(/\b(IN[A-Z0-9]{9}[0-9])\b/)
  if (!m || !isValidIsin(m[1])) return null
  const isin = m[1]
  const rest = line.replace(m[0], ' ')
  const nums = numbersIn(rest).filter((n) => n > 0)
  let best: { q: number; p: number; v: number; err: number } | null = null
  for (let a = 0; a < nums.length; a++)
    for (let b = 0; b < nums.length; b++)
      for (let c = 0; c < nums.length; c++) {
        if (a === b || b === c || a === c) continue
        const v = nums[c]
        const err = Math.abs(nums[a] * nums[b] - v) / v
        if (err < 0.01 && v >= nums[a] && v >= nums[b] && (!best || err < best.err)) {
          const [x, y] = [nums[a], nums[b]]
          // Shares: the whole number is the quantity. Funds: units usually have 3 decimals.
          const q = Number.isInteger(x) && !Number.isInteger(y) ? x : Number.isInteger(y) && !Number.isInteger(x) ? y : Math.max(x, y)
          best = { q, p: q === x ? y : x, v, err }
        }
      }
  const name =
    rest
      .replace(NUM, ' ')
      .split(/\s{2,}|\|/)
      .map((s) => s.trim())
      .filter((s) => /[A-Za-z]{3,}/.test(s))
      .sort((a, b) => b.length - a.length)[0] ?? isin
  const fund = isin.startsWith('INF')
  return {
    name,
    isin,
    quantity: best?.q ?? null,
    price: best?.p ?? null,
    value: best?.v ?? (nums.length ? Math.max(...nums) : null),
    cost: null,
    typeHint: fund ? (/etf|bees/i.test(name) ? 'etf' : 'mutual_fund') : /etf|bees/i.test(name) ? 'etf' : isin.startsWith('INE') ? 'equity' : 'bond',
  }
}

/** Merges the same ISIN within the same account: units and values add up. */
export function mergeRecords(records: RawRecord[]): RawRecord[] {
  const map = new Map<string, RawRecord>()
  for (const r of records) {
    const key = `${r.isin ?? r.name}|${r.accountHash ?? ''}`
    const prev = map.get(key)
    if (!prev) map.set(key, { ...r })
    else {
      prev.quantity = (prev.quantity ?? 0) + (r.quantity ?? 0) || null
      prev.value = (prev.value ?? 0) + (r.value ?? 0) || null
      prev.cost = prev.cost !== null || r.cost !== null ? (prev.cost ?? 0) + (r.cost ?? 0) : null
    }
  }
  return [...map.values()]
}

export function parseCas(pages: string[][], hashFolio: (folio: string) => string | null = () => null): ParseResult | null {
  const firstPage = (pages[0] ?? []).join('\n')
  const kind = detectCas(firstPage)
  if (!kind) return null
  const lines = pages.flat()
  const asOf = statementDate(lines.slice(0, 80).join('\n'))
  const detailed = lines.some((l) => /Closing\s+Unit\s+Balance/i.test(l))
  if (kind.kind === 'cams_kfintech' && detailed) {
    const { records, transactions } = parseMfDetailed(lines, hashFolio)
    return { source: 'cams_kfintech_cas', asOf, records: mergeRecords(records), transactions, warnings: records.length ? [] : ['nothing_found'] }
  }
  const records: RawRecord[] = []
  lines.forEach((line, i) => {
    const r = parseHoldingLine(line)
    if (r && (r.quantity || r.value)) records.push({ ...r, accountHash: null, sourceRef: `line ${i + 1}` })
  })
  return {
    source: kind.kind === 'nsdl_cdsl' ? 'nsdl_cdsl_cas' : 'cams_kfintech_summary',
    asOf,
    records: mergeRecords(records),
    transactions: [],
    warnings: records.length ? [] : ['nothing_found'],
  }
}
