/**
 * Free-tier metrics (spec "Core calculations"). Uses valued holdings only; anything
 * without a market value is excluded and shows up in `coverage`.
 */
import type { EffectiveClass } from './categories'
import type { ScanConfig } from './config'
import { alignedReturns, cagr, type CashFlow, daysBetween, ledoitWolf, meanStd, quadForm, valueOn, xirr } from './math'
import type { EnrichedHolding, EnrichedPortfolio, HoldingPeriod } from './model'

export type Weighted = { label: string; weight: number; value: number }

export type Metrics = {
  totalValue: number
  /** Valued share of everything the user entered (by value where known, else by count). */
  coverage: number
  holdingsCount: number
  weights: { index: number; name: string; weight: number; value: number; type: EnrichedHolding['type']; diversified: boolean }[]
  allocation: { asHeld: Weighted[]; effective: Record<EffectiveClass, number> }
  sectors: { top: Weighted[]; other: number; diversifiedFunds: number; effectiveCount: number | null; equityShare: number }
  concentration: {
    hhi: number
    effectiveHoldings: number
    /** Like effectiveHoldings, but a diversified fund counts as ten equal slices. Used for diversification. */
    effectiveExposures: number
    top1: Weighted | null; top5: number; top5Diversified: number; top5Concentrated: number }
  caps: { large: number; mid: number; small: number; unknown: number }
  thematicShare: number
  cost: { weightedTer: number | null; regularShare: number | null; fundValue: number; funds: number }
  funds: { bySubCategory: Record<string, number>; equityFunds: number }
  volatility: {
    annual: number | null
    benchmarkAnnual: number | null
    ratio: number | null
    label: 'low' | 'moderate' | 'high' | 'very_high' | null
    days: number
    proxied: string[]
    excluded: string[]
    shrinkage: number | null
  }
  returns: {
    method: 'xirr' | 'cagr' | 'approx' | null
    rate: number | null
    cost: number
    value: number
    coveredShare: number
    benchmarkRate: number | null
    gap: number | null
    note: 'benchmark_short_history' | 'no_benchmark' | null
  }
  stale: string[]
  statuses: { name: string; status: EnrichedHolding['status'] }[]
}

const PERIOD_YEARS: Record<HoldingPeriod, number> = { lt1: 0.5, '1to3': 2, '3to5': 4, '5plus': 7 }

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const round = (x: number, d = 6) => Math.round(x * 10 ** d) / 10 ** d

const TYPE_LABEL: Record<EnrichedHolding['type'], string> = {
  equity: 'Stocks',
  mutual_fund: 'Mutual funds',
  etf: 'ETFs',
  bond: 'Bonds',
  cash: 'Cash',
}

// Thematic and sectoral funds have no sector data in the free tier, so read it from the name.
const THEME_SECTORS: [RegExp, string][] = [
  [/bank|financial|finserv|psu bank|capital market|insurance/i, 'Financial Services'],
  [/pharma|health/i, 'Healthcare'],
  [/\bit\b|technology|digital|tech/i, 'Information Technology'],
  [/infra|infrastructure|housing|realty|construction/i, 'Infrastructure'],
  [/energy|power|oil|gas/i, 'Energy'],
  [/consumption|fmcg|consumer/i, 'Consumer'],
  [/auto|\bev\b|mobility/i, 'Automobile'],
  [/defence|manufacturing|industrial|capital goods/i, 'Industrials'],
  [/metal|commodit/i, 'Metals and Commodities'],
  [/psu|cpse|pse/i, 'Public Sector'],
]
export const themeSector = (name: string) => THEME_SECTORS.find(([re]) => re.test(name))?.[1] ?? 'Thematic'

export function computeMetrics(p: EnrichedPortfolio, config: ScanConfig): Metrics {
  const valued = p.holdings.filter((h) => h.marketValue !== null && h.marketValue > 0)
  const totalValue = sum(valued.map((h) => h.marketValue!))
  // Holdings that could not be valued have no known value, so coverage is by count.
  // A typed value counts as valued: stocks are user-valued until a price feed exists.
  const entered = p.holdings.length + p.excluded.length
  const coverage = entered ? valued.length / entered : 0
  const w = (h: EnrichedHolding) => (totalValue ? h.marketValue! / totalValue : 0)

  const weights = valued
    .map((h) => ({ index: h.index, name: h.name, weight: w(h), value: h.marketValue!, type: h.type, diversified: h.diversified }))
    .sort((a, b) => b.weight - a.weight)

  // Allocation
  const asHeldMap = new Map<string, number>()
  const effective: Record<EffectiveClass, number> = { equity: 0, debt: 0, gold: 0, cash: 0, other: 0 }
  for (const h of valued) {
    const label = TYPE_LABEL[h.type]
    asHeldMap.set(label, (asHeldMap.get(label) ?? 0) + w(h))
    for (const [cls, share] of Object.entries(h.split) as [EffectiveClass, number][]) effective[cls] += w(h) * share
  }
  const asHeld = [...asHeldMap].map(([label, weight]) => ({ label, weight, value: weight * totalValue })).sort((a, b) => b.weight - a.weight)

  // Sectors: direct stocks by sector, thematic funds by theme, diversified equity as its own bucket.
  const sectorMap = new Map<string, number>()
  let diversifiedEquity = 0
  for (const h of valued) {
    const eq = (h.split.equity ?? 0) * w(h)
    if (!eq) continue
    if (h.type === 'equity') sectorMap.set(h.sector ?? 'Unclassified', (sectorMap.get(h.sector ?? 'Unclassified') ?? 0) + eq)
    else if (h.thematic) sectorMap.set(themeSector(h.name), (sectorMap.get(themeSector(h.name)) ?? 0) + eq)
    else diversifiedEquity += eq
  }
  const equityShare = sum([...sectorMap.values()]) + diversifiedEquity
  const sectorList = [...sectorMap].map(([label, weight]) => ({ label, weight, value: weight * totalValue })).sort((a, b) => b.weight - a.weight)
  // Effective number of sectors within equity. A diversified fund is spread over roughly
  // ten sectors, so its weight counts as ten equal slices rather than one block.
  let effectiveCount: number | null = null
  if (equityShare > 0) {
    const shares = sectorList.map((s) => s.weight / equityShare)
    const div = diversifiedEquity / equityShare
    const hhi = sum(shares.map((s) => s * s)) + (div * div) / config.diversification.fundSlices
    effectiveCount = hhi > 0 ? 1 / hhi : null
  }

  // Concentration (funds count as one holding in the free tier)
  const hhi = sum(weights.map((x) => x.weight ** 2))
  const exposureHhi = sum(weights.map((x) => (x.diversified ? x.weight ** 2 / config.diversification.fundSlices : x.weight ** 2)))
  const top5 = weights.slice(0, 5)
  const concentrated = weights.filter((x) => !x.diversified)

  // Market-cap mix of the equity part
  const caps = { large: 0, mid: 0, small: 0, unknown: 0 }
  for (const h of valued) {
    const eq = (h.split.equity ?? 0) * w(h)
    if (!eq) continue
    if (h.caps) {
      caps.large += eq * h.caps.large
      caps.mid += eq * h.caps.mid
      caps.small += eq * h.caps.small
    } else caps.unknown += eq
  }

  // Cost: funds and ETFs
  const funds = valued.filter((h) => h.type === 'mutual_fund' || h.type === 'etf')
  const fundValue = sum(funds.map((h) => h.marketValue!))
  const withTer = funds.filter((h) => h.ter !== null)
  const terValue = sum(withTer.map((h) => h.marketValue!))
  const mfValue = sum(funds.filter((h) => h.type === 'mutual_fund').map((h) => h.marketValue!))
  const bySubCategory: Record<string, number> = {}
  for (const h of funds.filter((f) => f.type === 'mutual_fund')) {
    const key = h.subCategory ?? 'Other'
    bySubCategory[key] = (bySubCategory[key] ?? 0) + 1
  }

  return {
    totalValue,
    coverage: round(Math.min(1, coverage), 4),
    holdingsCount: valued.length,
    weights,
    allocation: { asHeld, effective },
    sectors: {
      top: sectorList.slice(0, 5),
      other: sum(sectorList.slice(5).map((s) => s.weight)),
      diversifiedFunds: diversifiedEquity,
      effectiveCount,
      equityShare,
    },
    concentration: {
      hhi,
      effectiveHoldings: hhi > 0 ? 1 / hhi : 0,
      effectiveExposures: exposureHhi > 0 ? 1 / exposureHhi : 0,
      top1: weights[0] ? { label: weights[0].name, weight: weights[0].weight, value: weights[0].value } : null,
      top5: sum(top5.map((x) => x.weight)),
      top5Diversified: sum(top5.filter((x) => x.diversified).map((x) => x.weight)),
      top5Concentrated: sum(concentrated.slice(0, 5).map((x) => x.weight)),
    },
    caps,
    thematicShare: sum(valued.filter((h) => h.thematic).map(w)),
    cost: {
      weightedTer: terValue ? sum(withTer.map((h) => h.ter! * h.marketValue!)) / terValue : null,
      regularShare: mfValue ? sum(funds.filter((h) => h.type === 'mutual_fund' && h.plan === 'regular').map((h) => h.marketValue!)) / mfValue : null,
      fundValue,
      funds: funds.length,
    },
    funds: {
      bySubCategory,
      equityFunds: funds.filter((h) => h.type === 'mutual_fund' && h.assetClass === 'equity').length,
    },
    volatility: volatility(valued, totalValue, p, config),
    returns: returnsAndBenchmark(valued, p),
    stale: valued.filter((h) => h.stale).map((h) => h.name),
    statuses: p.holdings.filter((h) => h.status !== 'active').map((h) => ({ name: h.name, status: h.status })),
  }
}

/** σ_p = √252 · √(wᵀ Σ w) with Σ from aligned daily returns (Ledoit-Wolf); cash has zero volatility. */
function volatility(valued: EnrichedHolding[], totalValue: number, p: EnrichedPortfolio, config: ScanConfig): Metrics['volatility'] {
  const cashLike = (h: EnrichedHolding) => h.type === 'cash' || (h.split.cash ?? 0) >= 0.99
  const risky = valued.filter((h) => !cashLike(h) && h.series && h.series.dates.length > config.minHistoryDays)
  const excluded = valued.filter((h) => !cashLike(h) && !risky.includes(h)).map((h) => h.name)
  const empty = { annual: null, benchmarkAnnual: null, ratio: null, label: null, days: 0, proxied: [], excluded, shrinkage: null }
  if (!totalValue) return empty
  const pricedValue = sum(valued.filter((h) => cashLike(h) || risky.includes(h)).map((h) => h.marketValue!))
  if (!risky.length) {
    // All cash: zero volatility.
    return excluded.length ? empty : { ...empty, annual: 0, ratio: 0, label: 'low' }
  }
  const series = [...risky.map((h) => h.series!), ...(p.benchmark.series ? [p.benchmark.series] : [])]
  const { returns } = alignedReturns(series, 252)
  if (returns.length < config.minHistoryDays) return { ...empty, excluded: [...excluded, ...risky.map((h) => h.name)] }

  // Weights over the holdings we can measure (cash included as zero-variance).
  const w = risky.map((h) => h.marketValue! / pricedValue)
  const holdingReturns = returns.map((r) => r.slice(0, risky.length))
  const { cov, shrinkage } = ledoitWolf(holdingReturns)
  risky.forEach((h, i) => (cov[i][i] += h.idioVariance))
  const annual = Math.sqrt(252 * Math.max(0, quadForm(w, cov)))
  const benchmarkAnnual = p.benchmark.series ? meanStd(returns.map((r) => r[risky.length])).std * Math.sqrt(252) : null
  const ratio = benchmarkAnnual ? annual / benchmarkAnnual : null
  const { low, moderate, high } = config.risk.labels
  const label = ratio === null ? null : ratio < low ? 'low' : ratio < moderate ? 'moderate' : ratio <= high ? 'high' : 'very_high'
  return {
    annual,
    benchmarkAnnual,
    ratio,
    label,
    days: returns.length,
    proxied: risky.filter((h) => h.proxied).map((h) => h.name),
    excluded,
    shrinkage,
  }
}

/**
 * Returns only when purchase values exist. Transactions → XIRR; one investment date →
 * CAGR; a holding-period bucket → CAGR at the bucket midpoint (approximate). The
 * benchmark replays the same cash flows into the benchmark series.
 */
function returnsAndBenchmark(valued: EnrichedHolding[], p: EnrichedPortfolio): Metrics['returns'] {
  const none: Metrics['returns'] = { method: null, rate: null, cost: 0, value: 0, coveredShare: 0, benchmarkRate: null, gap: null, note: null }
  const totalValue = sum(valued.map((h) => h.marketValue!))
  const bench = p.benchmark.series

  if (p.transactions.length) {
    const held = new Set(valued.map((h) => h.index))
    const tx = p.transactions.filter((t) => held.has(t.holdingIndex))
    const value = sum(valued.filter((h) => tx.some((t) => t.holdingIndex === h.index)).map((h) => h.marketValue!))
    const flows: CashFlow[] = tx.map((t) => ({
      date: t.date,
      // Money in is negative; redemptions and dividends paid out are positive.
      amount: ['buy', 'sip', 'switch_in'].includes(t.type) ? -Math.abs(t.amount) : Math.abs(t.amount),
    }))
    const rate = xirr([...flows, { date: p.asOf, amount: value }])
    const benchmarkRate = bench ? replayXirr(flows, bench, p.asOf) : null
    return {
      method: 'xirr',
      rate,
      cost: -sum(flows.filter((f) => f.amount < 0).map((f) => f.amount)),
      value,
      coveredShare: totalValue ? value / totalValue : 0,
      benchmarkRate,
      gap: rate !== null && benchmarkRate !== null ? rate - benchmarkRate : null,
      note: bench ? (benchmarkRate === null ? 'benchmark_short_history' : null) : 'no_benchmark',
    }
  }

  const withCost = valued.filter((h) => h.costValue && h.costValue > 0)
  if (!withCost.length) return none
  const cost = sum(withCost.map((h) => h.costValue!))
  const value = sum(withCost.map((h) => h.marketValue!))
  const days = p.investmentDate
    ? daysBetween(p.investmentDate, p.asOf)
    : p.holdingPeriod
      ? Math.round(PERIOD_YEARS[p.holdingPeriod] * 365)
      : null
  if (!days || days <= 0) return { ...none, cost, value, coveredShare: totalValue ? value / totalValue : 0 }
  const rate = cagr(value, cost, days)
  const start = new Date(Date.parse(p.asOf) - days * 86_400_000).toISOString().slice(0, 10)
  let benchmarkRate: number | null = null
  let note: Metrics['returns']['note'] = bench ? null : 'no_benchmark'
  if (bench) {
    const from = valueOn(bench, start)
    const to = valueOn(bench, p.asOf)
    // The benchmark must have a level within a week of the start date.
    if (from && to && daysBetween(from.date, start) <= 7) benchmarkRate = cagr(to.value, from.value, days)
    else note = 'benchmark_short_history'
  }
  return {
    method: p.investmentDate ? 'cagr' : 'approx',
    rate,
    cost,
    value,
    coveredShare: totalValue ? value / totalValue : 0,
    benchmarkRate,
    gap: rate !== null && benchmarkRate !== null ? rate - benchmarkRate : null,
    note,
  }
}

/** Buys benchmark units with each cash flow, values them at `asOf`, and solves XIRR. */
export function replayXirr(flows: CashFlow[], bench: EnrichedPortfolio['benchmark']['series'] & {}, asOf: string): number | null {
  let units = 0
  for (const f of flows) {
    const level = valueOn(bench, f.date)
    if (!level || daysBetween(level.date, f.date) > 7) return null
    units -= f.amount / level.value
  }
  const end = valueOn(bench, asOf)
  if (!end) return null
  return xirr([...flows, { date: asOf, amount: units * end.value }])
}
