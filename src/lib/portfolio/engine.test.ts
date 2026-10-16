import { describe, expect, it } from 'vitest'

import { analyze } from './analyze'
import { classifyCategory } from './categories'
import { DEFAULT_CONFIG } from './config'
import { alignedReturns, brent, cagr, interp, ledoitWolf, meanStd, quadForm, xirr } from './math'
import { computeMetrics, replayXirr } from './metrics'
import type { EnrichedHolding, EnrichedPortfolio, Series } from './model'

// ---------- fixtures ----------

/** Deterministic PRNG so the tests never flake. */
function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const normal = (r: () => number) => Math.sqrt(-2 * Math.log(r() || 1e-12)) * Math.cos(2 * Math.PI * r())

/** Business days ending 2026-10-09. */
const DATES: string[] = (() => {
  const out: string[] = []
  const d = new Date(Date.UTC(2026, 9, 9))
  while (out.length < 300) {
    if (d.getUTCDay() % 6 !== 0) out.unshift(d.toISOString().slice(0, 10))
    d.setUTCDate(d.getUTCDate() - 1)
  }
  return out
})()

/** A price series driven by a shared market factor plus noise. */
function series(seed: number, beta: number, idio: number, market: number[]): Series {
  const r = rng(seed)
  let v = 100
  const values = DATES.map((_, i) => (v *= 1 + beta * market[i] + idio * normal(r)))
  return { dates: DATES, values }
}
const MARKET = (() => {
  const r = rng(42)
  return DATES.map(() => 0.0004 + 0.01 * normal(r))
})()
const NIFTY = series(1, 1, 0.001, MARKET)

let nextIndex = 0
function holding(over: Partial<EnrichedHolding> & Pick<EnrichedHolding, 'name' | 'marketValue'>): EnrichedHolding {
  return {
    index: nextIndex++,
    key: null,
    isin: null,
    type: 'mutual_fund',
    assetClass: 'equity',
    subCategory: 'Flexi Cap',
    split: { equity: 1 },
    caps: { large: 0.65, mid: 0.2, small: 0.15 },
    sector: null,
    diversified: true,
    thematic: false,
    plan: 'direct',
    quantity: 1,
    price: over.marketValue,
    priceDate: '2026-10-09',
    valueSource: 'api',
    costValue: null,
    ter: 0.8,
    stale: false,
    status: 'active',
    series: series(nextIndex + 100, 1, 0.003, MARKET),
    proxied: false,
    idioVariance: 0,
    ...over,
  }
}
const stock = (name: string, value: number, sector = 'Energy', seed = 7) =>
  holding({
    name,
    marketValue: value,
    type: 'equity',
    subCategory: null,
    caps: { large: 1, mid: 0, small: 0 },
    sector,
    diversified: false,
    plan: null,
    ter: null,
    valueSource: 'user',
    series: series(seed, 1.1, 0.015, MARKET),
  })
const cash = (value: number) =>
  holding({ name: 'Savings', marketValue: value, type: 'cash', assetClass: 'cash', subCategory: null, split: { cash: 1 }, caps: null, diversified: false, plan: null, ter: null, series: null, valueSource: 'user' })

function portfolio(holdings: EnrichedHolding[], over: Partial<EnrichedPortfolio> = {}): EnrichedPortfolio {
  return {
    asOf: '2026-10-09',
    holdings,
    excluded: [],
    transactions: [],
    investmentDate: null,
    holdingPeriod: null,
    horizon: null,
    benchmark: { id: 'NIFTY50_TRI', name: 'Nifty 50', note: null, series: NIFTY },
    warnings: [],
    ...over,
  }
}

// ---------- maths ----------

describe('maths', () => {
  it('finds roots with Brent', () => {
    expect(brent((x) => x * x - 2, 0, 2)).toBeCloseTo(Math.SQRT2, 9)
    expect(brent((x) => x * x + 1, 0, 2)).toBeNull()
  })

  it('matches the Excel XIRR reference example', () => {
    // Microsoft's XIRR documentation example: 0.373362535
    const r = xirr([
      { date: '2008-01-01', amount: -10000 },
      { date: '2008-03-01', amount: 2750 },
      { date: '2008-10-30', amount: 4250 },
      { date: '2009-02-15', amount: 3250 },
      { date: '2009-04-01', amount: 2750 },
    ])
    expect(r).toBeCloseTo(0.373362535, 6)
  })

  it('returns null when XIRR has no solution', () => {
    expect(xirr([{ date: '2020-01-01', amount: -100 }])).toBeNull()
    expect(xirr([{ date: '2020-01-01', amount: 100 }, { date: '2021-01-01', amount: 50 }])).toBeNull()
  })

  it('computes CAGR, and a simple return under a year', () => {
    expect(cagr(1210, 1000, 730)).toBeCloseTo(0.1, 3)
    expect(cagr(1050, 1000, 180)).toBeCloseTo(0.05, 10)
    expect(cagr(100, 0, 365)).toBeNull()
  })

  it('interpolates scores in both directions and clamps', () => {
    expect(interp(9, 3, 15)).toBe(50)
    expect(interp(0.25, 0.4, 0.1)).toBe(50)
    expect(interp(100, 3, 15)).toBe(100)
    expect(interp(-1, 3, 15)).toBe(0)
  })

  it('keeps variances and stays symmetric under Ledoit-Wolf shrinkage', () => {
    const a = series(11, 1, 0.004, MARKET)
    const b = series(12, 0.2, 0.002, MARKET)
    const c = series(13, 1.3, 0.01, MARKET)
    const { returns } = alignedReturns([a, b, c])
    const { cov, shrinkage } = ledoitWolf(returns)
    expect(shrinkage).toBeGreaterThanOrEqual(0)
    expect(shrinkage).toBeLessThanOrEqual(1)
    for (let i = 0; i < 3; i++) {
      expect(cov[i][i]).toBeCloseTo(meanStd(returns.map((r) => r[i]), false).std ** 2, 12)
      for (let j = 0; j < 3; j++) expect(cov[i][j]).toBeCloseTo(cov[j][i], 15)
    }
    expect(quadForm([1 / 3, 1 / 3, 1 / 3], cov)).toBeGreaterThan(0)
  })
})

// ---------- metrics ----------

describe('metrics', () => {
  it('weights sum to 1 and HHI matches a hand calculation', () => {
    const m = computeMetrics(portfolio([holding({ name: 'A', marketValue: 50 }), holding({ name: 'B', marketValue: 30 }), holding({ name: 'C', marketValue: 20 })]), DEFAULT_CONFIG)
    expect(m.weights.reduce((s, w) => s + w.weight, 0)).toBeCloseTo(1, 12)
    expect(m.concentration.hhi).toBeCloseTo(0.38, 12)
    expect(m.concentration.effectiveHoldings).toBeCloseTo(1 / 0.38, 10)
    expect(m.concentration.top5).toBeCloseTo(1, 12)
  })

  it('looks through hybrid funds for the effective split', () => {
    const hybrid = classifyCategory('Open Ended Schemes(Hybrid Scheme - Aggressive Hybrid Fund)')
    const m = computeMetrics(portfolio([holding({ name: 'Hybrid', marketValue: 100, assetClass: 'hybrid', split: hybrid.split })]), DEFAULT_CONFIG)
    expect(m.allocation.effective.equity).toBeCloseTo(0.7)
    expect(m.allocation.effective.debt).toBeCloseTo(0.3)
  })

  it('excludes unvalued holdings and reports coverage', () => {
    const p = portfolio([holding({ name: 'A', marketValue: 100 }), holding({ name: 'B', marketValue: null })], {
      excluded: [{ name: 'Unknown fund', reason: 'unpriced' }],
    })
    const m = computeMetrics(p, DEFAULT_CONFIG)
    expect(m.totalValue).toBe(100)
    expect(m.coverage).toBeCloseTo(1 / 3, 3)
  })

  it('a stock tracked through an index carries extra company risk', () => {
    const viaIndex = (idio: number) =>
      computeMetrics(portfolio([stock('S', 100)].map((h) => ({ ...h, series: NIFTY, proxied: true, idioVariance: idio }))), DEFAULT_CONFIG).volatility.annual!
    expect(viaIndex(0.2 ** 2 / 252)).toBeGreaterThan(viaIndex(0))
    expect(viaIndex(0.2 ** 2 / 252)).toBeGreaterThan(0.2)
  })

  it('adding cash never raises volatility', () => {
    const base = [holding({ name: 'A', marketValue: 100 }), stock('S', 50)]
    const before = computeMetrics(portfolio(base), DEFAULT_CONFIG).volatility.annual!
    const after = computeMetrics(portfolio([...base, cash(75)]), DEFAULT_CONFIG).volatility.annual!
    expect(after).toBeLessThan(before)
  })

  it('splitting a holding into duplicate rows does not change totals or allocation', () => {
    const one = computeMetrics(portfolio([holding({ name: 'A', marketValue: 100 }), stock('S', 40)]), DEFAULT_CONFIG)
    const split = computeMetrics(portfolio([holding({ name: 'A', marketValue: 60 }), holding({ name: 'A', marketValue: 40 }), stock('S', 40)]), DEFAULT_CONFIG)
    expect(split.totalValue).toBe(one.totalValue)
    expect(split.allocation.effective.equity).toBeCloseTo(one.allocation.effective.equity)
  })

  it('replays cash flows into the benchmark', () => {
    // A benchmark that grows exactly 10% a year returns 10% whatever the flows.
    const dates = ['2024-01-01', '2025-01-01', '2026-01-01']
    const bench: Series = { dates, values: [100, 110, 121] }
    const r = replayXirr([{ date: '2024-01-01', amount: -1000 }, { date: '2025-01-01', amount: -500 }], bench, '2026-01-01')
    expect(r).toBeCloseTo(0.1, 2)
  })

  it('computes CAGR returns and the benchmark gap from cost and date', () => {
    const p = portfolio([holding({ name: 'A', marketValue: 1210, costValue: 1000 })], { investmentDate: DATES[0] })
    const m = computeMetrics(p, DEFAULT_CONFIG)
    expect(m.returns.method).toBe('cagr')
    expect(m.returns.rate).not.toBeNull()
    expect(m.returns.benchmarkRate).not.toBeNull()
    expect(m.returns.gap).toBeCloseTo(m.returns.rate! - m.returns.benchmarkRate!, 12)
  })

  it('skips returns when no cost is given', () => {
    expect(computeMetrics(portfolio([holding({ name: 'A', marketValue: 100 })]), DEFAULT_CONFIG).returns.method).toBeNull()
  })
})

// ---------- scoring regression ----------

describe('scoring regression portfolios', () => {
  const run = (p: EnrichedPortfolio) => analyze(p, DEFAULT_CONFIG)

  it('one stock at 100%: critical flag caps the score', () => {
    const r = run(portfolio([stock('Reliance Industries Ltd', 1_000_000)]))
    expect(r.flags[0]).toMatchObject({ id: 'R01', severity: 'critical' })
    expect(r.score.score).toBeLessThanOrEqual(59)
    expect(['attention', 'at_risk']).toContain(r.score.band)
  })

  it('index fund only: fair, flagged for no debt or gold', () => {
    const r = run(portfolio([holding({ name: 'UTI Nifty 50 Index Fund', marketValue: 500_000, subCategory: 'Equity Index Fund', caps: { large: 1, mid: 0, small: 0 }, ter: 0.2, series: NIFTY })]))
    expect(r.score.band).toBe('fair')
    expect(r.flags.map((f) => f.id)).toContain('R05')
    expect(r.flags.map((f) => f.id)).not.toContain('R02')
  })

  it('twelve overlapping regular-plan flexi cap funds: not healthy, flags regular plans and crowding', () => {
    const funds = Array.from({ length: 12 }, (_, i) => holding({ name: `Flexi Cap Fund ${i + 1}`, marketValue: 100_000, plan: 'regular', ter: 1.8 }))
    const r = run(portfolio(funds))
    expect(r.score.band).not.toBe('healthy')
    const ids = r.flags.map((f) => f.id)
    expect(ids).toContain('R07')
    expect(ids).toContain('R08')
    expect(r.score.subScores.find((s) => s.id === 'cost')!.score!).toBeLessThan(20)
  })

  it('100% cash: low score, cash flagged, cost not applicable', () => {
    const r = run(portfolio([cash(300_000)]))
    expect(['attention', 'at_risk']).toContain(r.score.band)
    expect(r.flags.map((f) => f.id)).toContain('R06')
    expect(r.score.subScores.find((s) => s.id === 'cost')!.score).toBeNull()
    expect(r.metrics.volatility.annual).toBe(0)
  })

  it('a balanced, low-cost mix scores healthy', () => {
    const debt = classifyCategory('Open Ended Schemes(Debt Scheme - Short Duration Fund)')
    const gold = classifyCategory('Open Ended Schemes(Exchange Traded Funds (ETFs) - Gold ETF)')
    const r = run(
      portfolio([
        holding({ name: 'Nifty 50 Index', marketValue: 300_000, ter: 0.2, caps: { large: 1, mid: 0, small: 0 }, series: NIFTY }),
        holding({ name: 'Flexi Cap A', marketValue: 150_000, ter: 0.7 }),
        holding({ name: 'Mid Cap B', marketValue: 100_000, ter: 0.7, subCategory: 'Mid Cap', caps: { large: 0.15, mid: 0.7, small: 0.15 } }),
        holding({ name: 'Short Duration C', marketValue: 250_000, ter: 0.35, assetClass: 'debt', subCategory: debt.subCategory, split: debt.split, caps: null, series: series(77, 0.03, 0.0008, MARKET) }),
        holding({ name: 'Gold ETF D', marketValue: 80_000, type: 'etf', ter: 0.5, assetClass: 'gold', subCategory: gold.subCategory, split: gold.split, caps: null, series: series(78, 0.05, 0.008, MARKET) }),
        cash(40_000),
      ]),
    )
    expect(r.score.band).toBe('healthy')
    expect(r.flags.filter((f) => f.severity === 'high' || f.severity === 'critical')).toHaveLength(0)
  })

  it('keeps every score within 0–100 across random portfolios', () => {
    const r = rng(9)
    for (let n = 0; n < 40; n++) {
      const hs = Array.from({ length: 1 + Math.floor(r() * 8) }, (_, i) =>
        r() < 0.4 ? stock(`S${i}`, 1 + r() * 1e6, ['Energy', 'IT', 'Banks'][i % 3], 200 + i) : r() < 0.2 ? cash(r() * 1e5 + 1) : holding({ name: `F${i}`, marketValue: 1 + r() * 1e6, plan: r() < 0.5 ? 'regular' : 'direct', ter: r() * 2.5 }),
      )
      const res = run(portfolio(hs, { horizon: r() < 0.5 ? 'lt3' : null }))
      expect(res.score.score).toBeGreaterThanOrEqual(0)
      expect(res.score.score).toBeLessThanOrEqual(100)
      for (const s of res.score.subScores) if (s.score !== null) expect(s.score).toBeGreaterThanOrEqual(0)
    }
  })

  it('marks the score provisional below 70% coverage and shows a range', () => {
    const r = run(
      portfolio([holding({ name: 'A', marketValue: 100 })], {
        excluded: [
          { name: 'X', reason: 'unpriced' },
          { name: 'Y', reason: 'unpriced' },
        ],
      }),
    )
    expect(r.score.provisional).toBe(true)
    expect(r.score.range![0]).toBeLessThan(r.score.range![1])
    expect(r.flags.map((f) => f.id)).toContain('R13')
  })
})

describe('CMS scoring config', () => {
  it('maps the seeded CMS values back to the engine defaults exactly', async () => {
    const { configFromCms } = await import('./config')
    const { scanConfig } = await import('@/seed/portfolio-scan')
    const { version: _v, ...fromCms } = configFromCms(scanConfig)
    const { version: _d, ...defaults } = DEFAULT_CONFIG
    expect(fromCms).toEqual(defaults)
  })
})
