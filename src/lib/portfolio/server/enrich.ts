import 'server-only'

import { getPayloadClient } from '@/lib/payload'

import { classifyCategory, defaultTer, type CapSplit } from '../categories'
import type { ScanConfig } from '../config'
import { isValidIsin } from '../isin'
import { valueOn } from '../math'
import type { EnrichedHolding, EnrichedPortfolio, HoldingInput, PortfolioInput, Series } from '../model'
import { normalizeName } from '../numbers'

type InstrumentRow = {
  id: string
  key: string
  name: string
  normalized_name: string
  instrument_type: EnrichedHolding['type']
  asset_class: EnrichedHolding['assetClass']
  sub_category: string | null
  category_raw: string | null
  plan: 'direct' | 'regular' | null
  option: 'growth' | 'idcw' | null
  sector: string | null
  market_cap_bucket: 'large' | 'mid' | 'small' | null
  is_index: boolean
  is_thematic: boolean
  expense_ratio: string | null
  status: EnrichedHolding['status']
  last_price: string | null
  last_price_date: Date | null
}

const db = async () => (await getPayloadClient()).db.pool
const iso = (d: Date) => d.toISOString().slice(0, 10)

export type Resolution = {
  key: string | null
  confidence: number
  suggestions: { key: string; name: string; plan: string | null; option: string | null; type: string }[]
}

/**
 * Resolves a row to an instrument: key → ISIN → AMFI code / NSE symbol → fuzzy name.
 * A fuzzy match must agree on plan (Direct/Regular) and option (Growth/IDCW) when the
 * row names them, and score high enough; otherwise the top three are offered instead.
 */
export async function resolveHolding(row: Pick<HoldingInput, 'key' | 'isin' | 'name' | 'type'>): Promise<Resolution> {
  const pool = await db()
  if (row.key) {
    const { rows } = await pool.query<{ key: string }>(`SELECT key FROM market.instruments WHERE key = $1`, [row.key])
    if (rows[0]) return { key: rows[0].key, confidence: 1, suggestions: [] }
  }
  const isin = row.isin?.trim().toUpperCase()
  if (isin && isValidIsin(isin)) {
    const { rows } = await pool.query<{ key: string }>(
      `SELECT i.key FROM market.instrument_isins x JOIN market.instruments i ON i.id = x.instrument_id WHERE x.isin = $1`,
      [isin],
    )
    if (rows[0]) return { key: rows[0].key, confidence: 1, suggestions: [] }
  }
  if (row.type === 'cash') return { key: null, confidence: 1, suggestions: [] }

  const name = row.name.trim()
  if (/^\d{5,6}$/.test(name) || /^[A-Z0-9&-]{2,20}$/.test(name)) {
    const { rows } = await pool.query<{ key: string }>(
      `SELECT key FROM market.instruments WHERE amfi_code::text = $1 OR upper(nse_symbol) = upper($1) LIMIT 1`,
      [name],
    )
    if (rows[0]) return { key: rows[0].key, confidence: 0.95, suggestions: [] }
  }

  const normalized = normalizeName(name)
  const wantPlan = /\bdirect\b/i.test(name) ? 'direct' : /\bregular\b/i.test(name) ? 'regular' : null
  const wantOption = /idcw|dividend|payout|reinvest/i.test(name) ? 'idcw' : /growth/i.test(name) ? 'growth' : null
  const typeFilter = row.type === 'equity' ? `i.instrument_type = 'equity'` : row.type === 'bond' ? 'false' : `i.instrument_type <> 'equity'`
  const { rows } = await pool.query<{ key: string; name: string; plan: string | null; option: string | null; instrument_type: string; sim: number }>(
    `SELECT i.key, i.name, i.plan, i.option, i.instrument_type, similarity(i.normalized_name, $1) AS sim
     FROM market.instruments i
     WHERE ${typeFilter} AND i.normalized_name % $1
       AND (i.instrument_type = 'equity' OR i.last_price_date > current_date - 365)
     ORDER BY sim DESC, (i.plan = 'direct') DESC NULLS LAST, (i.option = 'growth') DESC NULLS LAST
     LIMIT 10`,
    [normalized],
  )
  const agrees = (r: (typeof rows)[number]) => (!wantPlan || r.plan === wantPlan) && (!wantOption || r.option === wantOption)
  const best = rows.find(agrees)
  const suggestions = rows
    .filter(agrees)
    .slice(0, 3)
    .map((r) => ({ key: r.key, name: r.name, plan: r.plan, option: r.option, type: r.instrument_type }))
  // Funds need plan and option to be pinned down; a bare name is never auto-matched across them.
  const fundAmbiguous = best && best.instrument_type !== 'equity' && (!wantPlan || !wantOption)
  if (best && best.sim >= 0.75 && !fundAmbiguous) return { key: best.key, confidence: Number(best.sim), suggestions }
  return { key: null, confidence: best ? Number(best.sim) : 0, suggestions }
}

/** Loads price series for instrument ids, from `since` onwards. */
async function loadSeries(ids: string[], since: string): Promise<Map<string, Series>> {
  if (!ids.length) return new Map()
  const { rows } = await (await db()).query<{ instrument_id: string; d: Date; price: string }>(
    `SELECT instrument_id, d, price FROM market.prices WHERE instrument_id = ANY($1::bigint[]) AND d >= $2 ORDER BY instrument_id, d`,
    [ids, since],
  )
  const out = new Map<string, Series>()
  for (const r of rows) {
    const s = out.get(r.instrument_id) ?? { dates: [], values: [] }
    s.dates.push(iso(r.d))
    s.values.push(Number(r.price))
    out.set(r.instrument_id, s)
  }
  return out
}

type Benchmark = { id: string; name: string; note: string | null; components: { instrumentKey: string; weight: number }[] }

export async function listBenchmarks(): Promise<{ id: string; name: string }[]> {
  const { rows } = await (await db()).query<{ id: string; name: string }>(`SELECT id, name FROM market.benchmarks WHERE selectable ORDER BY sort`)
  return rows
}

async function getBenchmarks(): Promise<Map<string, Benchmark>> {
  const { rows } = await (await db()).query<Benchmark>(`SELECT id, name, note, components FROM market.benchmarks`)
  return new Map(rows.map((r) => [r.id, r]))
}

/** A benchmark's level series; composites are rebased components combined by weight. */
async function benchmarkSeries(b: Benchmark, since: string): Promise<Series | null> {
  const { rows } = await (await db()).query<{ id: string; key: string }>(`SELECT id, key FROM market.instruments WHERE key = ANY($1)`, [
    b.components.map((c) => c.instrumentKey),
  ])
  const idByKey = new Map(rows.map((r) => [r.key, r.id]))
  const series = await loadSeries(rows.map((r) => r.id), since)
  const parts = b.components.map((c) => ({ weight: c.weight, s: series.get(idByKey.get(c.instrumentKey) ?? '') }))
  if (parts.some((p) => !p.s?.dates.length)) return null
  if (parts.length === 1) return parts[0].s!
  const maps = parts.map((p) => new Map(p.s!.dates.map((d, i) => [d, p.s!.values[i]])))
  const dates = parts[0].s!.dates.filter((d) => maps.every((m) => m.has(d)))
  if (!dates.length) return null
  const base = maps.map((m) => m.get(dates[0])!)
  return { dates, values: dates.map((d) => 100 * parts.reduce((s, p, k) => s + p.weight * (maps[k].get(d)! / base[k]), 0)) }
}

const STOCK_CAPS: Record<'large' | 'mid' | 'small', CapSplit> = {
  large: { large: 1, mid: 0, small: 0 },
  mid: { large: 0, mid: 1, small: 0 },
  small: { large: 0, mid: 0, small: 1 },
}

/** Typical annual company-specific volatility beyond the index, by size (estimates). */
const IDIO_VOL = { large: 0.2, mid: 0.28, small: 0.35 } as const

/** The category index that stands in for a holding's price history. */
export function proxyIdFor(h: Pick<EnrichedHolding, 'type' | 'assetClass' | 'caps' | 'split'>): string | null {
  if (h.type === 'cash' || (h.split.cash ?? 0) >= 0.99) return null
  if (h.type === 'bond' || h.assetClass === 'debt') return 'DEBT_SHORT'
  if (h.assetClass === 'hybrid') return 'HYBRID_65_35'
  if (h.assetClass !== 'equity') return null
  if (h.caps && h.caps.small > 0.5) return 'SMALLCAP250_TRI'
  if (h.caps && h.caps.mid > 0.5) return 'MIDCAP150_TRI'
  if (h.type === 'equity') return 'NIFTY50_TRI'
  return 'NIFTY500_TRI'
}

/** A benchmark's level series by id (composites included), from `since`. */
export async function benchmarkSeriesById(id: string, since: string): Promise<Series | null> {
  const b = (await getBenchmarks()).get(id)
  return b ? benchmarkSeries(b, since) : null
}

/** Weekdays between two ISO dates (exchange holidays ignored). */
function tradingDaysBetween(from: string, to: string) {
  let n = 0
  const d = new Date(`${from}T00:00:00Z`)
  const end = new Date(`${to}T00:00:00Z`)
  while (d < end) {
    d.setUTCDate(d.getUTCDate() + 1)
    if (d.getUTCDay() % 6 !== 0) n++
  }
  return n
}

/**
 * Turns confirmed input rows into the engine's model: prices, classification, TER,
 * history (with category proxies), and the benchmark. Makes no external calls.
 */
export async function enrichPortfolio(
  input: PortfolioInput,
  config: ScanConfig,
  asOf = iso(new Date()),
  { historyDays = 400 }: { historyDays?: number } = {},
): Promise<EnrichedPortfolio> {
  const pool = await db()
  const keys = [...new Set(input.holdings.map((h) => h.key).filter((k): k is string => Boolean(k)))]
  const { rows: instruments } = await pool.query<InstrumentRow>(
    `SELECT id, key, name, normalized_name, instrument_type, asset_class, sub_category, category_raw, plan, option, sector,
            market_cap_bucket, is_index, is_thematic, expense_ratio, status, last_price, last_price_date
     FROM market.instruments WHERE key = ANY($1)`,
    [keys],
  )
  const byKey = new Map(instruments.map((i) => [i.key, i]))

  // IDCW NAVs drop on every payout, so their volatility comes from the Growth twin.
  const idcw = instruments.filter((i) => i.option === 'idcw')
  const twins = new Map<string, string>()
  if (idcw.length) {
    const { rows } = await pool.query<{ src: string; twin: string }>(
      `SELECT DISTINCT ON (s.id) s.id AS src, t.id AS twin
       FROM market.instruments s JOIN market.instruments t
         ON t.normalized_name = s.normalized_name AND t.plan IS NOT DISTINCT FROM s.plan AND t.option = 'growth'
       WHERE s.id = ANY($1::bigint[])
       ORDER BY s.id, t.last_price_date DESC NULLS LAST`,
      [idcw.map((i) => i.id)],
    )
    for (const r of rows) twins.set(r.src, r.twin)
  }

  const benchmarks = await getBenchmarks()
  const benchmark = benchmarks.get(input.benchmarkId ?? 'NIFTY50_TRI') ?? benchmarks.get('NIFTY50_TRI')
  if (!benchmark) throw new Error('Benchmarks are not loaded. Run: pnpm market benchmarks')

  const since400 = iso(new Date(Date.parse(asOf) - historyDays * 86_400_000))
  const seriesIds = instruments.map((i) => twins.get(i.id) ?? i.id)
  const holdingSeries = await loadSeries(seriesIds, since400)
  const proxyCache = new Map<string, Series | null>()
  const proxy = async (id: string) => {
    if (!proxyCache.has(id)) {
      const b = benchmarks.get(id)
      proxyCache.set(id, b ? await benchmarkSeries(b, since400) : null)
    }
    return proxyCache.get(id) ?? null
  }

  // The benchmark gets its full history, so returns can be compared over many years.
  const earliest = input.investmentDate ?? input.transactions?.map((t) => t.date).sort()[0] ?? since400
  const benchSince = earliest < since400 ? earliest : since400
  const benchSeries = await benchmarkSeries(benchmark, iso(new Date(Date.parse(benchSince) - 10 * 86_400_000)))

  const holdings: EnrichedHolding[] = []
  const excluded: EnrichedPortfolio['excluded'] = []
  const warnings: string[] = []

  for (const [index, row] of input.holdings.entries()) {
    const inst = row.key ? byKey.get(row.key) : undefined
    const type = inst?.instrument_type ?? row.type
    const priceDate = inst?.last_price_date ? iso(inst.last_price_date) : null
    const apiPrice = inst?.last_price ? Number(inst.last_price) : null
    const stale = priceDate ? tradingDaysBetween(priceDate, asOf) > config.staleTradingDays : false
    const winding = priceDate ? tradingDaysBetween(priceDate, asOf) > 22 : false

    // Value: API price × quantity wins; statement price next; the user's value last.
    let quantity = row.quantity ?? null
    let marketValue: number | null = null
    let valueSource: EnrichedHolding['valueSource'] = null
    let costValue = row.costValue ?? null
    let price = apiPrice
    if (type === 'cash') {
      marketValue = row.quantity ?? row.currentValue ?? row.investedAmount ?? null
      price = 1
      valueSource = 'user'
    } else if (apiPrice && quantity && !winding) {
      marketValue = quantity * apiPrice
      valueSource = 'api'
      if (row.currentValue && Math.abs(row.currentValue - marketValue) / marketValue > 0.25) {
        warnings.push(`value_mismatch:${row.name}`)
      }
    } else if (apiPrice && !quantity && row.investedAmount && input.investmentDate && !winding) {
      // Units unknown: estimate them from the NAV on the investment date.
      const s = holdingSeries.get(inst ? (twins.get(inst.id) ?? inst.id) : '')
      const then = s ? valueOn(s, input.investmentDate) : null
      if (then && inst?.option !== 'idcw') {
        quantity = row.investedAmount / then.value
        marketValue = quantity * apiPrice
        valueSource = 'api'
        costValue = costValue ?? row.investedAmount
        warnings.push(`units_estimated:${row.name}`)
      }
    } else if (row.statementPrice && quantity) {
      marketValue = quantity * row.statementPrice
      valueSource = 'statement'
      price = row.statementPrice
    }
    if (marketValue === null && (row.currentValue || row.investedAmount)) {
      marketValue = row.currentValue ?? row.investedAmount!
      valueSource = 'user'
      if (!row.currentValue) costValue = costValue ?? row.investedAmount ?? null
    }
    if (marketValue === null || marketValue <= 0) {
      excluded.push({ name: row.name, reason: 'unpriced' })
      continue
    }

    // Classification
    let assetClass: EnrichedHolding['assetClass'] = type === 'cash' ? 'cash' : type === 'bond' ? 'debt' : 'equity'
    let split: EnrichedHolding['split'] = type === 'cash' ? { cash: 1 } : type === 'bond' ? { debt: 1 } : { equity: 1 }
    let caps: CapSplit | null = null
    let subCategory: string | null = null
    let diversified = false
    let thematic = false
    let ter: number | null = null
    if (inst && (inst.instrument_type === 'mutual_fund' || inst.instrument_type === 'etf')) {
      const cat = classifyCategory(inst.category_raw ?? '', inst.name)
      assetClass = cat.assetClass
      split = cat.split
      caps = cat.caps ?? (cat.isIndex && /midcap|mid cap/i.test(inst.name) ? STOCK_CAPS.mid : cat.isIndex && /smallcap|small cap/i.test(inst.name) ? STOCK_CAPS.small : cat.isIndex && cat.assetClass === 'equity' ? STOCK_CAPS.large : null)
      subCategory = cat.subCategory
      thematic = cat.isThematic
      diversified = !thematic && ['equity', 'hybrid', 'debt', 'international'].includes(cat.assetClass)
      ter = inst.expense_ratio !== null ? Number(inst.expense_ratio) : defaultTer(cat, inst.plan)
    } else if (inst?.instrument_type === 'equity') {
      caps = inst.market_cap_bucket ? STOCK_CAPS[inst.market_cap_bucket] : STOCK_CAPS.small
    }

    // History: own series if long enough, else a category proxy.
    let series: Series | null = null
    let proxied = false
    if (type !== 'cash') {
      const own = inst ? holdingSeries.get(twins.get(inst.id) ?? inst.id) : undefined
      if (own && own.dates.length > config.minHistoryDays && inst?.instrument_type !== 'equity') series = own
      else {
        const proxyId = proxyIdFor({ type, assetClass, caps, split })
        if (proxyId && !((split.cash ?? 0) >= 0.99)) {
          series = await proxy(proxyId)
          proxied = Boolean(series)
        }
      }
    }

    holdings.push({
      index,
      key: inst?.key ?? null,
      isin: row.isin ?? null,
      name: inst?.name ?? row.name,
      type,
      assetClass,
      subCategory,
      split,
      caps,
      sector: inst?.sector ?? null,
      diversified,
      thematic,
      plan: inst?.plan ?? null,
      quantity,
      price,
      priceDate: valueSource === 'api' ? priceDate : (row.statementDate ?? null),
      marketValue,
      valueSource,
      costValue,
      ter,
      stale: valueSource === 'api' && stale,
      status: /segregat/i.test(inst?.name ?? row.name) ? 'segregated' : winding && inst?.instrument_type !== 'equity' ? 'matured' : (inst?.status ?? 'active'),
      series,
      proxied,
      // Company-specific risk for a stock tracked through an index (annual σ by size, rough estimates).
      idioVariance: proxied && type === 'equity' ? IDIO_VOL[inst?.market_cap_bucket ?? 'small'] ** 2 / 252 : 0,
    })
  }

  return {
    asOf,
    holdings,
    excluded,
    transactions: input.transactions ?? [],
    investmentDate: input.investmentDate ?? null,
    holdingPeriod: input.holdingPeriod ?? null,
    horizon: input.horizon ?? null,
    benchmark: { id: benchmark.id, name: benchmark.name, note: benchmark.note, series: benchSeries },
    warnings,
  }
}
