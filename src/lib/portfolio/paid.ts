/**
 * Paid-tier calculations (Insights and Pro). Pure functions over series and holdings;
 * the server job (server/paid.ts) gathers the data and stores the results. Every
 * figure that depends on an assumption carries it, so the UI can label it.
 */
import { alignedReturns, type CashFlow, daysBetween, meanStd, valueOn, xirr } from './math'
import type { Series } from './model'

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

// ---------- Expense drag ----------

/** Extra value a direct plan would end with, over n years at gross return r. */
export function expenseDrag(value: number, r: number, terDirect: number, terRegular: number, years: number) {
  return value * (Math.pow(1 + r - terDirect / 100, years) - Math.pow(1 + r - terRegular / 100, years))
}

// ---------- Synthetic portfolio series ----------

/**
 * Today's weights held constant (rebalanced daily) over the common dates of all
 * series: V_t = V_{t-1} × (1 + Σ w_i r_i,t). Cash adds zero return.
 */
export function constantMixSeries(parts: { weight: number; series: Series | null }[], startValue = 100): Series {
  const priced = parts.filter((p) => p.series && p.series.dates.length > 1)
  if (!priced.length) return { dates: [], values: [] }
  const maps = priced.map((p) => new Map(p.series!.dates.map((d, i) => [d, p.series!.values[i]])))
  const dates = priced[0].series!.dates.filter((d) => maps.every((m) => m.has(d)))
  const values = dates.length ? [startValue] : []
  for (let t = 1; t < dates.length; t++) {
    // Weights not in `priced` (cash, unpriced) earn nothing.
    const r = sum(priced.map((p, i) => p.weight * (maps[i].get(dates[t])! / maps[i].get(dates[t - 1])! - 1)))
    values.push(values[t - 1] * (1 + r))
  }
  return { dates, values }
}

// ---------- Drawdown ----------

export type Drawdown = { maxDrawdown: number; peakDate: string; troughDate: string; recoveryDays: number | null; current: number }

export function maxDrawdown(s: Series): Drawdown | null {
  if (s.values.length < 2) return null
  let peak = s.values[0]
  let peakIdx = 0
  let best = { dd: 0, peakIdx: 0, troughIdx: 0 }
  for (let i = 1; i < s.values.length; i++) {
    if (s.values[i] > peak) {
      peak = s.values[i]
      peakIdx = i
    }
    const dd = (peak - s.values[i]) / peak
    if (dd > best.dd) best = { dd, peakIdx, troughIdx: i }
  }
  const peakValue = s.values[best.peakIdx]
  const recoverIdx = s.values.findIndex((v, i) => i > best.troughIdx && v >= peakValue)
  const runningPeak = Math.max(...s.values)
  return {
    maxDrawdown: best.dd,
    peakDate: s.dates[best.peakIdx],
    troughDate: s.dates[best.troughIdx],
    recoveryDays: recoverIdx > 0 ? daysBetween(s.dates[best.troughIdx], s.dates[recoverIdx]) : null,
    current: (runningPeak - s.values.at(-1)!) / runningPeak,
  }
}

// ---------- Rolling returns ----------

/** Rolling annualised returns over `years`, sampled at month ends. */
export function rollingReturns(s: Series, years: number): { date: string; value: number }[] {
  const out: { date: string; value: number }[] = []
  const days = Math.round(years * 365)
  let lastMonth = ''
  for (let i = 0; i < s.dates.length; i++) {
    const month = s.dates[i].slice(0, 7)
    const nextMonth = s.dates[i + 1]?.slice(0, 7)
    if (month === lastMonth || (nextMonth && nextMonth === month)) continue
    lastMonth = month
    const startDate = new Date(Date.parse(s.dates[i]) - days * 86_400_000).toISOString().slice(0, 10)
    if (startDate < s.dates[0]) continue
    const start = valueOn(s, startDate)
    if (!start) continue
    out.push({ date: s.dates[i], value: Math.pow(s.values[i] / start.value, 1 / years) - 1 })
  }
  return out
}

// ---------- Risk ratios (weekly, up to 3 years) ----------

export function weeklyReturns(series: Series[]): { dates: string[]; returns: number[][] } {
  // Every 5th common trading day ≈ weekly.
  const { dates, returns } = alignedReturns(series, 800)
  const outDates: string[] = []
  const out: number[][] = []
  for (let i = 0; i + 5 <= returns.length; i += 5) {
    const block = returns.slice(i, i + 5)
    out.push(series.map((_, k) => block.reduce((g, r) => g * (1 + r[k]), 1) - 1))
    outDates.push(dates[i + 4])
  }
  return { dates: outDates, returns: out }
}

export type Ratios = { sharpe: number; sortino: number; beta: number; alpha: number; annualReturn: number; annualVol: number; weeks: number }

export function riskRatios(portfolio: Series, benchmark: Series, riskFree: number): Ratios | null {
  const { returns } = weeklyReturns([portfolio, benchmark])
  if (returns.length < 26) return null
  const rfWeekly = Math.pow(1 + riskFree, 1 / 52) - 1
  const p = returns.map((r) => r[0] - rfWeekly)
  const m = returns.map((r) => r[1] - rfWeekly)
  const { mean: mp, std: sp } = meanStd(p)
  const { mean: mm } = meanStd(m)
  const cov = sum(p.map((x, i) => (x - mp) * (m[i] - mm))) / (p.length - 1)
  const varM = sum(m.map((x) => (x - mm) ** 2)) / (m.length - 1)
  const beta = varM ? cov / varM : 0
  const alphaWeekly = mp - beta * mm
  const downside = Math.sqrt(sum(p.map((x) => Math.min(0, x) ** 2)) / p.length)
  const total = returns.map((r) => r[0])
  const annualReturn = Math.pow(total.reduce((g, r) => g * (1 + r), 1), 52 / total.length) - 1
  return {
    sharpe: sp ? (mp * 52) / (sp * Math.sqrt(52)) : 0,
    sortino: downside ? (mp * 52) / (downside * Math.sqrt(52)) : 0,
    beta,
    alpha: alphaWeekly * 52,
    annualReturn,
    annualVol: sp * Math.sqrt(52),
    weeks: returns.length,
  }
}

/** β of one series against the benchmark from weekly returns (null with under 26 weeks). */
export function betaOf(s: Series, benchmark: Series): number | null {
  const { returns } = weeklyReturns([s, benchmark])
  if (returns.length < 26) return null
  const a = returns.map((r) => r[0])
  const b = returns.map((r) => r[1])
  const ma = meanStd(a).mean
  const mb = meanStd(b).mean
  const varB = sum(b.map((x) => (x - mb) ** 2))
  return varB ? sum(a.map((x, i) => (x - ma) * (b[i] - mb))) / varB : null
}

// ---------- Stress tests ----------

export function betaShock(value: number, holdings: { weight: number; beta: number }[], shocks: number[]) {
  const portfolioBeta = sum(holdings.map((h) => h.weight * h.beta))
  return { portfolioBeta, scenarios: shocks.map((shock) => ({ shock, loss: value * portfolioBeta * shock, benchmarkLoss: value * shock })) }
}

export const STRESS_WINDOWS = [
  { id: '2008', label: 'Global financial crisis, 2008', from: '2008-01-08', to: '2008-10-27' },
  { id: '2020', label: 'Covid crash, March 2020', from: '2020-01-17', to: '2020-03-23' },
  { id: '2022', label: 'Rate-rise sell-off, 2022', from: '2022-01-17', to: '2022-06-17' },
] as const

/** Return of a series over a window, or null if it does not cover the window. */
export function windowReturn(s: Series | null, from: string, to: string): number | null {
  if (!s) return null
  const a = valueOn(s, from)
  const b = valueOn(s, to)
  if (!a || !b || daysBetween(a.date, from) > 7 || daysBetween(b.date, to) > 7) return null
  return b.value / a.value - 1
}

// ---------- Overlap and look-through ----------

export type FundHoldings = Map<string, number> // stock id → weight in the fund (fraction)

export function overlap(a: FundHoldings, b: FundHoldings): number {
  let total = 0
  for (const [k, w] of a) {
    const v = b.get(k)
    if (v) total += Math.min(w, v)
  }
  return total
}

/** Total exposure to each underlying stock: E_s = Σ_i w_i h_{i,s} plus direct holdings. */
export function exposures(funds: { weight: number; holdings: FundHoldings }[], direct: { id: string; weight: number }[]) {
  const out = new Map<string, number>()
  for (const f of funds) for (const [s, h] of f.holdings) out.set(s, (out.get(s) ?? 0) + f.weight * h)
  for (const d of direct) out.set(d.id, (out.get(d.id) ?? 0) + d.weight)
  return out
}

// ---------- Rebalancing ----------

export type RebalanceClass = 'equity' | 'debt' | 'gold' | 'cash'
export type SellCandidate = { name: string; cls: RebalanceClass; value: number; gainPct: number | null; lockedIn: boolean; shortTerm: boolean }

/**
 * Moves the mix toward the user's target: fresh money fills gaps first, then sells
 * from over-weight classes in order of least tax cost (losses, then small gains), not
 * locked in, long-term before short-term. Never names anything to buy.
 */
export function rebalancePlan(
  current: Record<RebalanceClass, number>,
  target: Record<RebalanceClass, number>,
  freshMoney: number,
  candidates: SellCandidate[],
  minTrade = 1000,
) {
  const total = sum(Object.values(current)) + freshMoney
  const classes = Object.keys(target) as RebalanceClass[]
  const gaps = Object.fromEntries(classes.map((c) => [c, target[c] * total - current[c]])) as Record<RebalanceClass, number>
  const adds: { cls: RebalanceClass; amount: number; from: 'fresh' | 'sales' }[] = []
  let fresh = freshMoney
  for (const c of classes.filter((k) => gaps[k] > 0).sort((a, b) => gaps[b] - gaps[a])) {
    const use = Math.min(fresh, gaps[c])
    if (use >= minTrade) adds.push({ cls: c, amount: use, from: 'fresh' })
    fresh -= use
    gaps[c] -= use
  }
  const sells: { name: string; cls: RebalanceClass; amount: number; note: string | null }[] = []
  const stillNeeded = sum(classes.map((c) => Math.max(0, gaps[c])))
  let toRaise = stillNeeded
  const order = [...candidates].sort((a, b) => {
    const rank = (x: SellCandidate) => (x.lockedIn ? 3 : 0) + (x.shortTerm ? 1 : 0)
    return rank(a) - rank(b) || (a.gainPct ?? 0) - (b.gainPct ?? 0)
  })
  const over = Object.fromEntries(classes.map((c) => [c, Math.max(0, -gaps[c])])) as Record<RebalanceClass, number>
  for (const cand of order) {
    if (toRaise < minTrade) break
    if (cand.lockedIn) continue
    const room = Math.min(over[cand.cls], cand.value, toRaise)
    if (room < minTrade) continue
    sells.push({ name: cand.name, cls: cand.cls, amount: Math.round(room), note: cand.shortTerm ? 'short_term_gain' : null })
    over[cand.cls] -= room
    toRaise -= room
  }
  const raised = stillNeeded - toRaise
  let left = raised
  for (const c of classes.filter((k) => gaps[k] > 0)) {
    const use = Math.min(left, gaps[c])
    if (use >= minTrade) adds.push({ cls: c, amount: Math.round(use), from: 'sales' })
    left -= use
  }
  const after = { ...current }
  for (const a of adds) after[a.cls] += a.amount
  for (const s of sells) after[s.cls] -= s.amount
  if (fresh > 0) after.cash += fresh
  return { adds, sells, after, unmet: Math.max(0, Math.round(toRaise)) }
}

// ---------- Tax (FIFO lots) ----------

export type TaxRates = {
  fy: string
  stcgEquity: number
  ltcgEquity: number
  ltcgExemption: number
  equityLongTermMonths: number
  cess: number
  /** Slab rate assumed for specified debt funds (user can change). */
  debtSlab: number
}

/** FY 2026-27 rates. Kept as data: confirm with the Income Tax Department and a CA before launch. */
export const TAX_RATES: TaxRates[] = [{ fy: '2026-27', stcgEquity: 0.2, ltcgEquity: 0.125, ltcgExemption: 125_000, equityLongTermMonths: 12, cess: 0.04, debtSlab: 0.3 }]

export type Lot = { date: string; units: number; costPerUnit: number }
export type TaxTx = { date: string; type: 'buy' | 'sell'; units: number; amount: number }

/** FIFO lots after applying sells; returns open lots and realised gains by term. */
export function fifo(transactions: TaxTx[], longTermMonths: number, grandfather?: (date: string) => number | null) {
  const lots: Lot[] = []
  const realised = { short: 0, long: 0 }
  for (const t of [...transactions].sort((a, b) => a.date.localeCompare(b.date))) {
    if (t.type === 'buy') {
      lots.push({ date: t.date, units: t.units, costPerUnit: t.amount / t.units })
      continue
    }
    let units = t.units
    const price = t.amount / t.units
    while (units > 1e-9 && lots.length) {
      const lot = lots[0]
      const take = Math.min(units, lot.units)
      const longTerm = monthsBetween(lot.date, t.date) > longTermMonths
      const cost = effectiveCost(lot, price, grandfather)
      realised[longTerm ? 'long' : 'short'] += take * (price - cost)
      lot.units -= take
      units -= take
      if (lot.units <= 1e-9) lots.shift()
    }
  }
  return { lots, realised }
}

const monthsBetween = (a: string, b: string) => {
  const [y1, m1, d1] = a.split('-').map(Number)
  const [y2, m2, d2] = b.split('-').map(Number)
  return (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0)
}

/** Grandfathering for equity bought before 1 Feb 2018: cost = max(actual, min(FMV on 31 Jan 2018, sale price)). */
function effectiveCost(lot: Lot, salePrice: number, grandfather?: (date: string) => number | null) {
  if (!grandfather || lot.date > '2018-01-31') return lot.costPerUnit
  const fmv = grandfather(lot.date)
  return fmv === null ? lot.costPerUnit : Math.max(lot.costPerUnit, Math.min(fmv, salePrice))
}

/** Tax if every open lot were sold at `price` today, plus harvesting headroom. */
export function taxIfSoldToday(lots: Lot[], price: number, asOf: string, rates: TaxRates, kind: 'equity' | 'debt', realisedLongThisYear = 0, grandfather?: (date: string) => number | null) {
  let short = 0
  let long = 0
  for (const lot of lots) {
    const gain = lot.units * (price - effectiveCost(lot, price, kind === 'equity' ? grandfather : undefined))
    if (kind === 'equity' && monthsBetween(lot.date, asOf) > rates.equityLongTermMonths) long += gain
    else short += gain
  }
  const tax =
    kind === 'equity'
      ? rates.stcgEquity * Math.max(0, short) + rates.ltcgEquity * Math.max(0, long + realisedLongThisYear - rates.ltcgExemption)
      : rates.debtSlab * Math.max(0, short + long)
  return {
    shortTermGain: short,
    longTermGain: long,
    tax: tax * (1 + rates.cess),
    harvestingHeadroom: kind === 'equity' ? Math.max(0, rates.ltcgExemption - realisedLongThisYear) : 0,
  }
}

// ---------- Returns over time (with transactions) ----------

/** XIRR at each month end using flows up to that date and the value then. */
export function xirrOverTime(flows: CashFlow[], valueAt: (date: string) => number | null, monthEnds: string[]) {
  const out: { date: string; value: number }[] = []
  for (const d of monthEnds) {
    const past = flows.filter((f) => f.date <= d)
    const v = valueAt(d)
    if (past.length && v !== null && daysBetween(past[0].date, d) >= 180) {
      const r = xirr([...past, { date: d, amount: v }])
      if (r !== null) out.push({ date: d, value: r })
    }
  }
  return out
}
