/**
 * Broker holdings exports (CSV/XLSX) and our own template. One alias dictionary maps
 * column names to fields; each broker adapter adds a signature (headers only it uses)
 * so the source can be named. Layouts change without notice: confirm each signature
 * against a real export and add a golden-file test when one is available.
 */
import { findIsin, isValidIsin } from '../isin'
import { parseAmount } from '../numbers'
import type { Cell, Sheet } from './table'
import type { Field, Mapping, ParseResult, RawRecord } from './types'

const ALIASES: Record<Field, RegExp> = {
  name: /^(instrument|symbol|stock( name)?|scrip( name)?|scheme( name)?|security( name)?|company( name)?|name|fund( name)?|trading ?symbol|stock symbol|scheme \/ security)$/i,
  isin: /^isin( code| no\.?)?$/i,
  quantity: /^(qty\.?|quantity( available)?|units|balance units|unit balance|shares|no\.? of shares|holding quantity|available qty|total quantity|net qty|free qty|current bal(ance)?)$/i,
  price: /^(ltp|last (traded )?price|current (market )?price|market price|close price|closing price|cmp|nav|current nav|previous closing price)$/i,
  value: /^(cur\.? val(ue)?|current value|market value|present value|value|holding value|closing value|value at market price|current val)$/i,
  cost: /^(invested( value| amount)?|investment value|buy value|cost value|total cost|amount invested|purchase value)$/i,
  avgPrice: /^(avg\.? cost|average (buy |cost )?price|avg\.? (buy )?price|buy avg\.?|buy average|average cost price)$/i,
  type: /^(type|instrument type|segment|asset class|asset type|category)$/i,
}

type Adapter = { id: string; label: string; signature: RegExp[] }

export const ADAPTERS: Adapter[] = [
  { id: 'zerodha', label: 'Zerodha', signature: [/^instrument$/i, /^qty\.$/i, /^avg\. cost$/i, /^cur\. val$/i, /^net chg\.?$/i] },
  { id: 'zerodha_console', label: 'Zerodha Console', signature: [/^symbol$/i, /^quantity available$/i, /^average price$/i, /^previous closing price$/i, /^unrealized p&l$/i] },
  { id: 'groww_stocks', label: 'Groww', signature: [/^stock name$/i, /^average buy price$/i, /^buy value$/i, /^closing price$/i, /^closing value$/i] },
  { id: 'groww_mf', label: 'Groww mutual funds', signature: [/^scheme name$/i, /^amc$/i, /^folio no\.?$/i, /^invested value$/i, /^current value$/i, /^xirr$/i] },
  { id: 'upstox', label: 'Upstox', signature: [/^instrument$/i, /^qty$/i, /^avg\.? price$/i, /^ltp$/i, /^cur\.? val(ue)?$/i] },
  { id: 'angel', label: 'Angel One', signature: [/^symbol$/i, /^qty$/i, /^avg\.? price$/i, /^ltp$/i, /^current value$/i] },
  { id: 'icici', label: 'ICICI Direct', signature: [/^stock symbol$/i, /^company name$/i, /^isin code$/i, /^average cost price$/i, /^value at market price$/i] },
  { id: 'template', label: 'WisBees template', signature: [/^name$/i, /^isin$/i, /^type$/i, /^quantity$/i, /^current value$/i, /^purchase value$/i] },
]

const text = (c: Cell) => String(c ?? '').trim()

/** First row (in the first 30) where at least 3 cells match a known field. */
export function headerRow(rows: Cell[][]): { index: number; mapping: Mapping; confidence: Record<string, number> } | null {
  for (let r = 0; r < Math.min(rows.length, 30); r++) {
    const mapping: Mapping = {}
    rows[r].forEach((cell, c) => {
      const t = text(cell).replace(/\s+/g, ' ').replace(/[:*]$/, '')
      for (const [field, re] of Object.entries(ALIASES) as [Field, RegExp][]) {
        if (mapping[field] === undefined && re.test(t)) {
          mapping[field] = c
          break
        }
      }
    })
    if (Object.keys(mapping).length >= 3) return { index: r, mapping, confidence: Object.fromEntries(Object.keys(mapping).map((k) => [k, 0.9])) }
  }
  return null
}

/** Scores each adapter by the share of its signature headers present. */
export function detectAdapter(header: Cell[]): { adapter: Adapter; score: number } | null {
  const cells = header.map(text)
  const scored = ADAPTERS.map((a) => ({ adapter: a, score: a.signature.filter((re) => cells.some((c) => re.test(c))).length / a.signature.length }))
  const best = scored.sort((x, y) => y.score - x.score)[0]
  return best && best.score >= 0.6 ? best : null
}

/** A mapping is usable when it can identify the instrument and size the position. */
export const mappingUsable = (m: Mapping) => (m.name !== undefined || m.isin !== undefined) && (m.quantity !== undefined || m.value !== undefined)

const TYPE_WORDS: [RegExp, RawRecord['typeHint']][] = [
  [/etf/i, 'etf'],
  [/mutual|fund|mf\b|scheme/i, 'mutual_fund'],
  [/bond|debenture|ncd|g-?sec|sgb/i, 'bond'],
  [/cash|bank|savings|fd|deposit/i, 'cash'],
  [/equity|stock|share|eq\b/i, 'equity'],
]

export function parseWithMapping(sheet: Sheet, headerIndex: number, m: Mapping): RawRecord[] {
  const out: RawRecord[] = []
  const get = (row: Cell[], f: keyof Mapping) => (m[f] === undefined ? null : row[m[f]!])
  for (let r = headerIndex + 1; r < sheet.rows.length; r++) {
    const row = sheet.rows[r]
    const name = text(get(row, 'name'))
    const isinCell = text(get(row, 'isin')).toUpperCase()
    const isin = isValidIsin(isinCell) ? isinCell : findIsin(name)
    // Totals rows, section titles and blank rows are skipped.
    if (!name && !isin) continue
    if (/^(total|grand total|sub ?total|net)\b/i.test(name)) continue
    const quantity = parseAmount(get(row, 'quantity'))
    const price = parseAmount(get(row, 'price'))
    let value = parseAmount(get(row, 'value'))
    const avg = parseAmount(get(row, 'avgPrice'))
    let cost = parseAmount(get(row, 'cost'))
    if (cost === null && avg !== null && quantity !== null) cost = avg * quantity
    if (value === null && price !== null && quantity !== null) value = price * quantity
    if ((quantity === null || quantity <= 0) && (value === null || value <= 0)) continue
    const typeText = `${text(get(row, 'type'))} ${name}`
    const typeHint = isin?.startsWith('INF') ? (/etf|bees/i.test(name) ? 'etf' : 'mutual_fund') : isin?.startsWith('INE') ? (/etf|bees/i.test(name) ? 'etf' : 'equity') : (TYPE_WORDS.find(([re]) => re.test(typeText))?.[1] ?? null)
    out.push({
      name: name || isin!,
      isin,
      quantity: quantity && quantity > 0 ? quantity : null,
      price,
      value: value && value > 0 ? value : null,
      cost: cost && cost > 0 ? cost : null,
      typeHint,
      accountHash: null,
      sourceRef: `${sheet.name}:${r + 1}`,
    })
  }
  return out
}

export type TabularOutcome =
  | { kind: 'parsed'; result: ParseResult; headerSignature: string }
  | { kind: 'needs_mapping'; sheet: string; headerIndex: number; header: string[]; preview: string[][]; suggested: Mapping; headerSignature: string }
  | { kind: 'empty' }

/** Normalised header text, hashed by the caller to remember confirmed mappings. */
export const headerSignature = (header: Cell[]) => header.map((c) => text(c).toLowerCase().replace(/\s+/g, ' ')).join('|')

/**
 * Picks the sheet with the best header row, then parses it (multiple sheets: the first
 * with a usable mapping wins, and a holdings sheet is preferred over summaries).
 */
export function parseTabular(sheets: Sheet[], knownMapping?: (signature: string) => Mapping | null): TabularOutcome {
  // A layout the user mapped before (matched by its exact header row) wins.
  if (knownMapping) {
    for (const sheet of sheets) {
      for (let r = 0; r < Math.min(sheet.rows.length, 30); r++) {
        const signature = headerSignature(sheet.rows[r])
        const known = knownMapping(signature)
        if (known && mappingUsable(known)) {
          const records = parseWithMapping(sheet, r, known)
          return { kind: 'parsed', headerSignature: signature, result: { source: 'mapped_table', asOf: null, records, transactions: [], warnings: records.length ? [] : ['nothing_found'] } }
        }
      }
    }
  }
  const candidates = sheets
    .map((s) => ({ sheet: s, header: headerRow(s.rows) }))
    .filter((c): c is { sheet: Sheet; header: NonNullable<ReturnType<typeof headerRow>> } => c.header !== null)
  if (!candidates.length) {
    const first = sheets.find((s) => s.rows.length)
    if (!first) return { kind: 'empty' }
    return {
      kind: 'needs_mapping',
      sheet: first.name,
      headerIndex: 0,
      header: first.rows[0].map(text),
      preview: first.rows.slice(1, 6).map((r) => r.map(text)),
      suggested: {},
      headerSignature: headerSignature(first.rows[0]),
    }
  }
  candidates.sort((a, b) => Number(mappingUsable(b.header.mapping)) - Number(mappingUsable(a.header.mapping)) || Object.keys(b.header.mapping).length - Object.keys(a.header.mapping).length)
  const { sheet, header } = candidates[0]
  const headerCells = sheet.rows[header.index]
  const signature = headerSignature(headerCells)
  const mapping = header.mapping
  if (!mappingUsable(mapping)) {
    return {
      kind: 'needs_mapping',
      sheet: sheet.name,
      headerIndex: header.index,
      header: headerCells.map(text),
      preview: sheet.rows.slice(header.index + 1, header.index + 6).map((r) => r.map(text)),
      suggested: header.mapping,
      headerSignature: signature,
    }
  }
  const adapter = detectAdapter(headerCells)
  const records = parseWithMapping(sheet, header.index, mapping)
  return {
    kind: 'parsed',
    headerSignature: signature,
    result: { source: adapter?.adapter.id ?? 'generic_table', asOf: null, records, transactions: [], warnings: records.length ? [] : ['nothing_found'] },
  }
}

/** Applies a user-confirmed mapping to the named sheet. */
export function parseConfirmed(sheets: Sheet[], sheetName: string, headerIndex: number, mapping: Mapping): ParseResult {
  const sheet = sheets.find((s) => s.name === sheetName) ?? sheets[0]
  const records = parseWithMapping(sheet, headerIndex, mapping)
  return { source: 'mapped_table', asOf: null, records, transactions: [], warnings: records.length ? [] : ['nothing_found'] }
}
