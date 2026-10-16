import { describe, expect, it } from 'vitest'

import type { Series } from './model'
import {
  betaShock,
  constantMixSeries,
  expenseDrag,
  exposures,
  fifo,
  maxDrawdown,
  overlap,
  rebalancePlan,
  riskRatios,
  rollingReturns,
  TAX_RATES,
  taxIfSoldToday,
  windowReturn,
} from './paid'

const days = (n: number, start = '2024-01-01') => Array.from({ length: n }, (_, i) => new Date(Date.parse(start) + i * 86_400_000).toISOString().slice(0, 10))

describe('expense drag', () => {
  it('matches the formula by hand', () => {
    // 10 lakh, 10% gross, 0.5% vs 1.5% TER, 10 years
    const expected = 1_000_000 * (Math.pow(1.095, 10) - Math.pow(1.085, 10))
    expect(expenseDrag(1_000_000, 0.1, 0.5, 1.5, 10)).toBeCloseTo(expected, 6)
    expect(expenseDrag(1_000_000, 0.1, 0.5, 1.5, 10)).toBeGreaterThan(200_000)
  })
})

describe('drawdown', () => {
  it('finds the worst peak-to-trough fall and the recovery', () => {
    const s: Series = { dates: days(7), values: [100, 120, 90, 60, 80, 121, 110] }
    const dd = maxDrawdown(s)!
    expect(dd.maxDrawdown).toBeCloseTo(0.5, 12)
    expect(dd.peakDate).toBe(s.dates[1])
    expect(dd.troughDate).toBe(s.dates[3])
    expect(dd.recoveryDays).toBe(2)
    expect(dd.current).toBeCloseTo((121 - 110) / 121, 12)
  })
})

describe('constant-mix series', () => {
  it('blends daily returns by weight; cash earns nothing', () => {
    const d = days(3)
    const a: Series = { dates: d, values: [100, 110, 121] } // +10%/day
    const s = constantMixSeries([
      { weight: 0.5, series: a },
      { weight: 0.5, series: null },
    ])
    expect(s.values).toEqual([100, 105, 110.25])
  })
})

describe('rolling returns', () => {
  it('annualises over the window at month ends', () => {
    const d = days(800)
    const s: Series = { dates: d, values: d.map((_, i) => 100 * Math.pow(1.1, i / 365)) }
    const r = rollingReturns(s, 1)
    expect(r.length).toBeGreaterThan(10)
    for (const p of r) expect(p.value).toBeCloseTo(0.1, 2)
  })
})

describe('risk ratios', () => {
  it('gives beta 1 and alpha ≈ 0 for the benchmark against itself', () => {
    const d = days(600)
    let v = 100
    const values = d.map((_, i) => (v *= 1 + 0.0004 + 0.01 * Math.sin(i * 1.7)))
    const s: Series = { dates: d, values }
    const r = riskRatios(s, s, 0.065)!
    expect(r.beta).toBeCloseTo(1, 10)
    expect(r.alpha).toBeCloseTo(0, 10)
  })
})

describe('stress', () => {
  it('scales the shock by portfolio beta', () => {
    const res = betaShock(1_000_000, [{ weight: 0.6, beta: 1.2 }, { weight: 0.4, beta: 0 }], [-0.2])
    expect(res.portfolioBeta).toBeCloseTo(0.72)
    expect(res.scenarios[0].loss).toBeCloseTo(-144_000)
  })
  it('returns null when a series does not cover the window', () => {
    expect(windowReturn({ dates: days(10, '2021-01-01'), values: Array(10).fill(1) }, '2020-01-17', '2020-03-23')).toBeNull()
  })
})

describe('overlap', () => {
  it('sums the smaller weight of each shared stock', () => {
    const a = new Map([['RIL', 0.1], ['HDFCB', 0.08], ['INFY', 0.05]])
    const b = new Map([['RIL', 0.06], ['INFY', 0.09], ['TCS', 0.04]])
    expect(overlap(a, b)).toBeCloseTo(0.11)
    const e = exposures([{ weight: 0.5, holdings: a }], [{ id: 'RIL', weight: 0.1 }])
    expect(e.get('RIL')).toBeCloseTo(0.15)
  })
})

describe('rebalance', () => {
  it('uses fresh money first and never sells locked-in units', () => {
    const plan = rebalancePlan(
      { equity: 800_000, debt: 100_000, gold: 0, cash: 100_000 },
      { equity: 0.6, debt: 0.3, gold: 0.1, cash: 0 },
      100_000,
      [
        { name: 'ELSS', cls: 'equity', value: 300_000, gainPct: 5, lockedIn: true, shortTerm: false },
        { name: 'Flexi', cls: 'equity', value: 500_000, gainPct: 20, lockedIn: false, shortTerm: false },
        { name: 'Cash', cls: 'cash', value: 100_000, gainPct: 0, lockedIn: false, shortTerm: false },
      ],
    )
    expect(plan.adds.some((a) => a.from === 'fresh')).toBe(true)
    expect(plan.sells.find((s) => s.name === 'ELSS')).toBeUndefined()
    const total = 1_100_000
    expect(plan.after.debt / total).toBeCloseTo(0.3, 1)
  })
})

describe('tax', () => {
  const rates = TAX_RATES[0]
  it('applies FIFO and splits short and long term', () => {
    const { lots, realised } = fifo(
      [
        { date: '2024-01-01', type: 'buy', units: 100, amount: 10_000 },
        { date: '2025-06-01', type: 'buy', units: 100, amount: 15_000 },
        { date: '2025-09-01', type: 'sell', units: 150, amount: 30_000 },
      ],
      rates.equityLongTermMonths,
    )
    // 100 units from the 2024 lot (long term): 100 × (200 − 100); 50 from 2025 (short): 50 × (200 − 150)
    expect(realised.long).toBeCloseTo(10_000)
    expect(realised.short).toBeCloseTo(2_500)
    expect(lots).toEqual([{ date: '2025-06-01', units: 50, costPerUnit: 150 }])
  })
  it('taxes long-term equity gains above ₹1.25 lakh at 12.5% plus cess', () => {
    const t = taxIfSoldToday([{ date: '2020-01-01', units: 1000, costPerUnit: 100 }], 400, '2026-10-01', rates, 'equity')
    expect(t.longTermGain).toBe(300_000)
    expect(t.tax).toBeCloseTo(0.125 * (300_000 - 125_000) * 1.04)
  })
  it('grandfathers pre-2018 cost at the 31 January 2018 value', () => {
    const t = taxIfSoldToday([{ date: '2015-01-01', units: 100, costPerUnit: 50 }], 300, '2026-10-01', rates, 'equity', 0, () => 200)
    expect(t.longTermGain).toBe(100 * (300 - 200))
  })
})
