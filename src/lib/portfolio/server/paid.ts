import 'server-only'

import { getPayloadClient } from '@/lib/payload'

import type { AnalysisResult } from '../analyze'
import { classifyCategory, defaultTer } from '../categories'
import type { ScanConfig } from '../config'
import type { PaidResult } from '../entitlements'
import { loadSchemeHistory } from '../market/loaders'
import { type CashFlow, valueOn } from '../math'
import type { EnrichedHolding, EnrichedPortfolio, PortfolioInput, Series } from '../model'
import {
  betaOf,
  betaShock,
  constantMixSeries,
  expenseDrag,
  exposures,
  fifo,
  maxDrawdown,
  overlap,
  type RebalanceClass,
  riskRatios,
  rollingReturns,
  STRESS_WINDOWS,
  TAX_RATES,
  taxIfSoldToday,
  windowReturn,
  xirrOverTime,
} from '../paid'
import { type DragCard, type OverlapCard, type Point, REBALANCE_PRESETS, type StressCard, type TaxCard } from '../paid-cards'
import { benchmarkSeriesById, enrichPortfolio, proxyIdFor } from './enrich'

const db = async () => (await getPayloadClient()).db.pool
const iso = (d: Date) => d.toISOString().slice(0, 10)
const yearsAgo = (asOf: string, years: number) => iso(new Date(Date.parse(asOf) - years * 365.25 * 86_400_000))

const total = (p: EnrichedPortfolio) => p.holdings.reduce((s, h) => s + (h.marketValue ?? 0), 0)
const isFund = (h: EnrichedHolding) => h.type === 'mutual_fund' || h.type === 'etf'

// ---------- Teasers (cheap: run with every scan, safe to show anyone) ----------

async function dragCard(p: EnrichedPortfolio, config: ScanConfig): Promise<DragCard> {
  const regular = p.holdings.filter((h) => h.type === 'mutual_fund' && h.plan === 'regular' && h.marketValue && h.key)
  const pool = await db()
  const funds: DragCard['funds'] = []
  for (const h of regular) {
    // The direct twin: same scheme name and option, Direct plan.
    const { rows } = await pool.query<{ expense_ratio: string | null; category_raw: string | null; name: string }>(
      `SELECT t.expense_ratio, t.category_raw, t.name FROM market.instruments s
       JOIN market.instruments t ON t.normalized_name = s.normalized_name AND t.plan = 'direct' AND t.option IS NOT DISTINCT FROM s.option
       WHERE s.key = $1 ORDER BY t.last_price_date DESC NULLS LAST LIMIT 1`,
      [h.key],
    )
    const twin = rows[0]
    const cat = classifyCategory(twin?.category_raw ?? '', twin?.name ?? h.name)
    const terDirect = twin?.expense_ratio ? Number(twin.expense_ratio) : defaultTer(cat, 'direct')
    const terRegular = h.ter ?? defaultTer(cat, 'regular')
    if (terRegular <= terDirect) continue
    funds.push({ name: h.name, value: h.marketValue!, terRegular, terDirect, drag: expenseDrag(h.marketValue!, config.paid.assumedReturn, terDirect, terRegular, config.paid.dragYears) })
  }
  return { funds, total: funds.reduce((s, f) => s + f.drag, 0), assumedReturn: config.paid.assumedReturn, years: config.paid.dragYears }
}

/** Latest disclosed holdings per fund (look-through), where loaded: equity weights keyed by ISIN (or name), plus display names. */
async function fundHoldings(keys: string[]) {
  const holdings = new Map<string, Map<string, number>>()
  const names = new Map<string, string>()
  if (!keys.length) return { holdings, names }
  const { rows } = await (await db()).query<{ key: string; id: string; name: string; asset_class: string; weight: string }>(
    `SELECT i.key, COALESCE(h.holding_isin, h.holding_name) AS id, h.holding_name AS name, h.asset_class, h.weight
     FROM market.fund_holdings h JOIN market.instruments i ON i.id = h.fund_instrument_id
     WHERE i.key = ANY($1) AND h.as_of = (SELECT max(as_of) FROM market.fund_holdings x WHERE x.fund_instrument_id = h.fund_instrument_id)`,
    [keys],
  )
  for (const r of rows) {
    if (r.asset_class !== 'equity') continue
    const m = holdings.get(r.key) ?? new Map<string, number>()
    m.set(r.id, Number(r.weight))
    holdings.set(r.key, m)
    names.set(r.id, r.name)
  }
  return { holdings, names }
}

/** A stock's ISIN, from the row or from its instrument key ('eq:<ISIN>'). */
const stockIsin = (h: EnrichedHolding) => h.isin ?? (h.key?.startsWith('eq:') ? h.key.slice(3) : null)

async function overlapCard(p: EnrichedPortfolio): Promise<OverlapCard> {
  const funds = p.holdings.filter((h) => isFund(h) && (h.split.equity ?? 0) > 0.5 && h.key)
  const { holdings: data, names } = await fundHoldings(funds.map((f) => f.key!))
  const withData = funds.filter((f) => data.has(f.key!))
  const totalValue = total(p)
  const pairs: OverlapCard['pairs'] = []
  if (withData.length >= 2) {
    for (let i = 0; i < withData.length; i++)
      for (let j = i + 1; j < withData.length; j++) {
        const o = overlap(data.get(withData[i].key!)!, data.get(withData[j].key!)!)
        pairs.push({ a: withData[i].name, b: withData[j].name, overlap: o, category: null })
      }
    pairs.sort((x, y) => (y.overlap ?? 0) - (x.overlap ?? 0))
    const exp = exposures(
      withData.map((f) => ({ weight: f.marketValue! / totalValue, holdings: data.get(f.key!)! })),
      p.holdings.filter((h) => h.type === 'equity' && stockIsin(h)).map((h) => ({ id: stockIsin(h)!, weight: h.marketValue! / totalValue })),
    )
    const directNames = new Map(p.holdings.filter((h) => h.type === 'equity' && stockIsin(h)).map((h) => [stockIsin(h)!, h.name]))
    const topExposures = [...exp]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, weight]) => ({ name: directNames.get(id) ?? names.get(id) ?? id, weight }))
    return { level: 'holding', pairs, topExposures, fundsWithData: withData.length, funds: funds.length }
  }
  // No disclosures loaded: funds in the same category usually hold many of the same stocks.
  const byCat = new Map<string, EnrichedHolding[]>()
  for (const f of funds.filter((x) => !x.thematic)) byCat.set(f.subCategory ?? 'Other', [...(byCat.get(f.subCategory ?? 'Other') ?? []), f])
  for (const [cat, list] of byCat)
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) pairs.push({ a: list[i].name, b: list[j].name, overlap: null, category: cat })
  return { level: 'category', pairs, topExposures: [], fundsWithData: 0, funds: funds.length }
}

/** Pairs worth mentioning: 30% overlap or more, or (without disclosures) the same category. */
const notablePairs = (ov: OverlapCard) => ov.pairs.filter((p) => p.overlap === null || p.overlap >= 0.3).length

const dragBucket = (amount: number) => (amount <= 0 ? 'none' : amount < 10_000 ? 'under ₹10,000' : amount < 100_000 ? '₹10,000 to ₹1 lakh' : 'above ₹1 lakh')

/** Teasers from the free data, computed with every scan (counts and buckets only). */
export async function computeTeasers(input: PortfolioInput, config: ScanConfig): Promise<PaidResult> {
  const p = await enrichPortfolio(input, config)
  const [drag, ov] = await Promise.all([dragCard(p, config), overlapCard(p)])
  // Only teasers with something to show: "0 pairs" or "none" would undersell the card.
  const teasers: PaidResult['teasers'] = {}
  if (notablePairs(ov)) teasers.overlap = { pairs: notablePairs(ov) }
  if (drag.total > 0) teasers.drag = { bucket: dragBucket(drag.total) }
  return { complete: false, teasers, cards: {} }
}

// ---------- Full paid analysis (Insights and Pro) ----------

/** Fetches full NAV history once for held funds that only have the recent year. */
async function ensureLongHistory(p: EnrichedPortfolio) {
  const codes = p.holdings.filter((h) => isFund(h) && h.key?.startsWith('mf:')).map((h) => Number(h.key!.slice(3)))
  if (!codes.length) return
  const { rows } = await (await db()).query<{ amfi_code: number }>(`SELECT amfi_code FROM market.instruments WHERE amfi_code = ANY($1) AND long_history_at IS NULL`, [codes])
  const pool = await db()
  for (const r of rows.slice(0, 30)) {
    try {
      await loadSchemeHistory(pool, r.amfi_code)
    } catch {
      // A missing history only means a proxy is used for that fund.
    }
  }
}

/** A holding's series over [from, …]: its own when it covers the start, else its category index. */
async function seriesFrom(h: EnrichedHolding, from: string, cache: Map<string, Series | null>): Promise<{ series: Series | null; estimated: boolean }> {
  if (h.type === 'cash' || (h.split.cash ?? 0) >= 0.99) return { series: null, estimated: false }
  if (h.series && !h.proxied && h.series.dates[0] <= iso(new Date(Date.parse(from) + 10 * 86_400_000))) return { series: h.series, estimated: false }
  const id = proxyIdFor(h)
  if (!id) return { series: h.series, estimated: Boolean(h.proxied) }
  if (!cache.has(id)) cache.set(id, await benchmarkSeriesById(id, yearsAgo(from, 0.1)))
  return { series: cache.get(id) ?? null, estimated: true }
}

const weekly = (s: Series, b: Series | null): Point[] => {
  const out: Point[] = []
  for (let i = 0; i < s.dates.length; i += 5) {
    const d = s.dates[i]
    out.push({ date: d, portfolio: s.values[i], benchmark: b ? (valueOn(b, d)?.value ?? null) : null })
  }
  return out
}

export async function computeFull(input: PortfolioInput, result: AnalysisResult, config: ScanConfig): Promise<PaidResult> {
  const asOf = result.asOf
  const shallow = await enrichPortfolio(input, config, asOf)
  await ensureLongHistory(shallow)
  const p = await enrichPortfolio(input, config, asOf, { historyDays: 365 * 21 })
  const V = total(p)
  const w = (h: EnrichedHolding) => (V ? (h.marketValue ?? 0) / V : 0)
  const cache = new Map<string, Series | null>()
  const benchmark = p.benchmark.series
  const longNifty = await benchmarkSeriesById('NIFTY50_LONG', '2006-01-01')

  const [drag, ov] = await Promise.all([dragCard(p, config), overlapCard(p)])

  // Five years of today's mix (shorter if a component's history is shorter).
  const from5 = yearsAgo(asOf, 5)
  const parts = await Promise.all(p.holdings.map(async (h) => ({ h, ...(await seriesFrom(h, from5, cache)) })))
  const mix = constantMixSeries(parts.map((x) => ({ weight: w(x.h), series: x.series })))
  const window5 = { dates: mix.dates.filter((d) => d >= from5), values: mix.values.filter((_, i) => mix.dates[i] >= from5) }
  const dd = maxDrawdown(window5)
  const benchWindow = benchmark ? { dates: benchmark.dates.filter((d) => d >= (window5.dates[0] ?? from5)), values: benchmark.values.filter((_, i) => benchmark.dates[i] >= (window5.dates[0] ?? from5)) } : null
  const benchDd = benchWindow ? maxDrawdown(benchWindow) : null
  const estimated = parts.filter((x) => x.estimated).map((x) => x.h.name)

  // Returns over time: XIRR at month ends with transactions, else rolling 1-year returns.
  let returns: { kind: 'xirr' | 'rolling'; points: Point[] }
  const tx = p.transactions.filter((t) => t.units)
  if (tx.length) {
    const flows: CashFlow[] = tx.map((t) => ({ date: t.date, amount: ['buy', 'sip', 'switch_in'].includes(t.type) ? -Math.abs(t.amount) : Math.abs(t.amount) }))
    const byHolding = new Map(p.holdings.map((h) => [h.index, h]))
    const valueAt = (d: string) => {
      let v = 0
      for (const [idx, h] of byHolding) {
        const units = tx.filter((t) => t.holdingIndex === idx && t.date <= d).reduce((s, t) => s + (['buy', 'sip', 'switch_in'].includes(t.type) ? 1 : -1) * Math.abs(t.units ?? 0), 0)
        if (!units) continue
        const price = h.series ? valueOn(h.series, d)?.value : null
        if (!price) return null
        v += units * price
      }
      return v
    }
    const monthEnds = [...new Set(mix.dates.map((d) => d.slice(0, 7)))].map((m) => mix.dates.filter((d) => d.startsWith(m)).at(-1)!)
    const mine = xirrOverTime(flows, valueAt, monthEnds)
    const theirs = benchmark
      ? xirrOverTime(flows, (d) => {
          let units = 0
          for (const f of flows.filter((x) => x.date <= d)) {
            const lvl = valueOn(benchmark, f.date)
            if (!lvl) return null
            units -= f.amount / lvl.value
          }
          const end = valueOn(benchmark, d)
          return end ? units * end.value : null
        }, monthEnds)
      : []
    returns = { kind: 'xirr', points: mine.map((m) => ({ date: m.date, portfolio: m.value, benchmark: theirs.find((t) => t.date === m.date)?.value ?? null })) }
  } else {
    const mine = rollingReturns(mix, 1)
    const theirs = benchmark ? rollingReturns(benchmark, 1) : []
    returns = { kind: 'rolling', points: mine.filter((m) => m.date >= from5).map((m) => ({ date: m.date, portfolio: m.value, benchmark: theirs.find((t) => t.date === m.date)?.value ?? null })) }
  }

  // Risk ratios over three years.
  const from3 = yearsAgo(asOf, 3)
  const mix3 = { dates: mix.dates.filter((d) => d >= from3), values: mix.values.filter((_, i) => mix.dates[i] >= from3) }
  const ratios = benchmark ? riskRatios(mix3, benchmark, config.paid.riskFreeRate) : null
  const benchRatios = benchmark ? riskRatios(benchmark, benchmark, config.paid.riskFreeRate) : null

  // Stress: beta shock, and replays of past falls (beta × index where a holding has no history then).
  const betas = parts.map((x) => {
    if (!x.series || !benchmark) return { weight: w(x.h), beta: 0 }
    const b = betaOf({ dates: x.series.dates.filter((d) => d >= from3), values: x.series.values.filter((_, i) => x.series!.dates[i] >= from3) }, benchmark)
    return { weight: w(x.h), beta: b ?? ((x.h.split.equity ?? 0) > 0.5 ? 1 : 0) }
  })
  const shock = betaShock(V, betas, config.paid.shocks)
  const historical: StressCard['historical'] = STRESS_WINDOWS.map((win) => {
    const benchR = windowReturn(longNifty, win.from, win.to)
    const est: string[] = []
    let r = 0
    parts.forEach((x, i) => {
      if (!x.series) return
      const own = x.estimated ? null : windowReturn(x.series, win.from, win.to)
      if (own !== null) r += w(x.h) * own
      else if (benchR !== null) {
        r += w(x.h) * betas[i].beta * benchR
        est.push(x.h.name)
      }
    })
    return { id: win.id, label: win.label, loss: benchR === null ? null : V * r, benchmarkLoss: benchR === null ? null : V * benchR, estimated: est }
  })

  // Rebalancing: current mix by class (other folded into equity), presets; the plan itself is computed on request.
  const e = result.metrics.allocation.effective
  const current: Record<RebalanceClass, number> = { equity: (e.equity + e.other) * V, debt: e.debt * V, gold: e.gold * V, cash: e.cash * V }

  // Tax: needs lots, so only with transactions that carry units.
  const rates = TAX_RATES[0]
  let tax: TaxCard = { available: false, reason: 'needs_transactions' }
  if (tx.length) {
    const rows: Extract<TaxCard, { available: true }>['rows'] = []
    for (const h of p.holdings) {
      const own = tx.filter((t) => t.holdingIndex === h.index)
      if (!own.length || !h.price) continue
      const kind = (h.split.equity ?? 0) >= 0.65 || h.type === 'equity' ? 'equity' : 'debt'
      const gf = h.series ? (d: string) => (d <= '2018-01-31' ? (valueOn(h.series!, '2018-01-31')?.value ?? null) : null) : undefined
      const { lots } = fifo(
        own.map((t) => ({ date: t.date, type: ['buy', 'sip', 'switch_in'].includes(t.type) ? 'buy' : 'sell', units: Math.abs(t.units ?? 0), amount: Math.abs(t.amount) })),
        rates.equityLongTermMonths,
        gf,
      )
      const t = taxIfSoldToday(lots, h.price, asOf, rates, kind, 0, gf)
      rows.push({ name: h.name, kind, shortTermGain: t.shortTermGain, longTermGain: t.longTermGain, tax: t.tax })
    }
    const equityLong = rows.filter((r) => r.kind === 'equity').reduce((s, r) => s + r.longTermGain, 0)
    tax = {
      available: true,
      fy: rates.fy,
      rows,
      totalTax: rows.reduce((s, r) => s + r.tax, 0),
      headroom: Math.max(0, rates.ltcgExemption - Math.max(0, equityLong)),
      assumptions: [
        `Rates for FY ${rates.fy}, including 4% cess.`,
        `Debt fund gains taxed at an assumed ${Math.round(rates.debtSlab * 100)}% slab rate.`,
        'Gains already booked this year are not included.',
      ],
    }
  }

  // Rupee impact (Insights) and scenarios (Pro) per flag.
  const flagImpact: Record<number, number> = {}
  const flagScenarios: Record<number, { label: string; amount: number }[]> = {}
  result.flags.forEach((f, i) => {
    if (f.id === 'R01') {
      flagImpact[i] = f.amount * config.paid.singleStockFall
      flagScenarios[i] = [0.2, 0.1].map((cap) => ({ label: `Amount above ${cap * 100}% of your portfolio`, amount: Math.max(0, f.amount - cap * V) }))
    } else if (f.id === 'R07') {
      flagImpact[i] = drag.total
    } else if (f.id === 'R06') {
      flagImpact[i] = f.amount * Math.max(0, config.paid.assumedReturn - config.paid.cashYield)
      flagScenarios[i] = [{ label: 'Cash above 10% of your portfolio', amount: Math.max(0, f.amount - 0.1 * V) }]
    } else if (f.id === 'R02' || f.id === 'R03' || f.id === 'R09' || f.id === 'R14') {
      flagImpact[i] = f.amount * config.paid.singleStockFall
    }
  })

  return {
    complete: true,
    teasers: { ...(notablePairs(ov) ? { overlap: { pairs: notablePairs(ov) } } : {}), ...(drag.total > 0 ? { drag: { bucket: dragBucket(drag.total) } } : {}) },
    cards: {
      overlap: ov,
      drag,
      drawdown: dd
        ? {
            ...dd,
            benchmarkMaxDrawdown: benchDd?.maxDrawdown ?? null,
            from: window5.dates[0],
            points: weekly(
              { dates: window5.dates, values: window5.values.map((v) => v / window5.values[0]) },
              benchWindow ? { dates: benchWindow.dates, values: benchWindow.values.map((v) => v / benchWindow.values[0]) } : null,
            ),
            estimated,
          }
        : null,
      returns,
      pdf: { available: true },
      stress: { value: V, portfolioBeta: shock.portfolioBeta, shocks: shock.scenarios, historical },
      ratios: ratios
        ? { ...ratios, benchmarkSharpe: benchRatios?.sharpe ?? null, years: Math.round((ratios.weeks / 52) * 10) / 10, riskFree: config.paid.riskFreeRate }
        : null,
      rebalance: { total: V, current, presets: REBALANCE_PRESETS },
      tax,
      whatif: { available: true },
    },
    flagImpact,
    flagScenarios,
  }
}
