import { type Category, classifyCategory } from './categories'
import { isValidIsin } from './isin'
import { parseAmount, parseDate } from './numbers'

export type AmfiScheme = {
  amfiCode: number
  isins: string[]
  name: string
  amc: string | null
  plan: 'direct' | 'regular' | null
  option: 'growth' | 'idcw' | null
  nav: number | null
  date: string | null
  categoryRaw: string
  category: Category
}

/** Plan and option from the dedicated columns when present, otherwise from the name. */
export function planOf(planCol: string, name: string): AmfiScheme['plan'] {
  const s = `${planCol} ${name}`.toLowerCase()
  if (/\bdirect\b/.test(s)) return 'direct'
  if (/\bregular\b|\bretail\b/.test(s)) return 'regular'
  return null
}

export function optionOf(optionCol: string, name: string): AmfiScheme['option'] {
  const s = `${optionCol} ${name}`.toLowerCase()
  if (/idcw|dividend|income distribution|bonus|payout|reinvest/.test(s)) return 'idcw'
  if (/growth|cumulative/.test(s)) return 'growth'
  return null
}

/**
 * Parses AMFI's NAVAll.txt: semicolon rows under "Open Ended Schemes(<category>)"
 * headings and AMC-name lines. Columns: Scheme Code; ISIN growth/payout; ISIN reinvestment;
 * Scheme Name; Plan; Option; NAV; Date (older files have no Plan/Option columns).
 */
export function parseNavAll(text: string): AmfiScheme[] {
  const out: AmfiScheme[] = []
  let heading = ''
  let amc: string | null = null
  let hasPlanColumns = false
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    if (line.startsWith('Scheme Code;')) {
      hasPlanColumns = /;Plan;Option;/i.test(line)
      continue
    }
    const cells = line.split(';')
    if (cells.length < 6 || !/^\d+$/.test(cells[0])) {
      if (/Schemes?\s*\(/.test(line)) heading = line
      else if (cells.length === 1) amc = line
      continue
    }
    const [code, isin1, isin2, name, ...rest] = cells
    const [planCol, optionCol, navCol, dateCol] = hasPlanColumns ? rest : ['', '', rest[0], rest[1]]
    const isins = [isin1, isin2].map((s) => s.trim().toUpperCase()).filter(isValidIsin)
    out.push({
      amfiCode: Number(code),
      isins: [...new Set(isins)],
      name: name.trim(),
      amc,
      plan: planOf(planCol ?? '', name),
      option: optionOf(optionCol ?? '', name),
      nav: parseAmount(navCol),
      date: parseDate(dateCol ?? ''),
      categoryRaw: heading,
      category: classifyCategory(heading, name),
    })
  }
  return out
}

/**
 * Parses AMFI's NAV history report: same idea, columns Scheme Code; NAV Name; Plan;
 * Option; ISIN growth/payout; ISIN reinvestment; NAV; (repurchase; sale;) Date.
 * Yields only code, NAV and date: the master comes from NAVAll.txt.
 */
export function* parseNavHistory(text: string): Generator<{ amfiCode: number; nav: number; date: string }> {
  for (const rawLine of text.split(/\r?\n/)) {
    const cells = rawLine.trim().split(';')
    if (cells.length < 8 || !/^\d+$/.test(cells[0])) continue
    const nav = parseAmount(cells[6])
    const date = parseDate(cells[cells.length - 1])
    if (nav && nav > 0 && date) yield { amfiCode: Number(cells[0]), nav, date }
  }
}
