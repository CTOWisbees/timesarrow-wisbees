import { describe, expect, it } from 'vitest'

import { emi, epf, fd, gst, lumpsum, ppf, rd, sip, ssy, swp, xirr } from './finance'

const day = (iso: string) => Date.parse(iso)

describe('sip', () => {
  it('matches FV = P × ((1+i)^n − 1)/i × (1+i)', () => {
    const i = 0.12 / 12
    const expected = 10000 * ((Math.pow(1 + i, 120) - 1) / i) * (1 + i)
    const r = sip({ monthly: 10000, annualReturn: 12, years: 10 })
    expect(r.value).toBeCloseTo(expected, 4)
    expect(Math.floor(r.value)).toBe(2323390)
    expect(r.invested).toBe(1_200_000)
  })
})

describe('lumpsum', () => {
  it('compounds yearly', () => {
    expect(lumpsum({ amount: 100000, annualReturn: 12, years: 10 }).value).toBeCloseTo(310584.82, 2)
  })
})

describe('emi', () => {
  it('gives the standard EMI for ₹10L at 8.5% over 20 years', () => {
    const r = emi({ principal: 1_000_000, annualRate: 8.5, years: 20 })
    expect(r.emi).toBeCloseTo(8678.23, 2)
    expect(r.total).toBeCloseTo(r.emi * 240, 6)
    expect(r.yearly.at(-1)!.balance).toBe(0)
    const paid = r.yearly.reduce((s, y) => s + y.principal, 0)
    expect(paid).toBeCloseTo(1_000_000, 4)
  })
  it('handles zero interest', () => {
    expect(emi({ principal: 120000, annualRate: 0, years: 1 }).emi).toBe(10000)
  })
})

describe('fd', () => {
  it('quarterly compounding, 5 years at 7%', () => {
    const r = fd({ principal: 100000, annualRate: 7, years: 5, months: 0, compounding: 'quarterly' })
    expect(r.value).toBeCloseTo(100000 * Math.pow(1.0175, 20), 6)
    expect(Math.round(r.value)).toBe(141478)
  })
  it('counts extra months as a fraction of a year', () => {
    const r = fd({ principal: 100000, annualRate: 6, years: 0, months: 6, compounding: 'yearly' })
    expect(r.value).toBeCloseTo(100000 * Math.pow(1.06, 0.5), 6)
  })
})

describe('rd', () => {
  it('equals the closed form M = R((1+i)^q − 1)/(1 − (1+i)^(−1/3))', () => {
    const i = 0.065 / 4
    const q = 60 / 3
    const expected = 5000 * ((Math.pow(1 + i, q) - 1) / (1 - Math.pow(1 + i, -1 / 3)))
    expect(rd({ monthly: 5000, annualRate: 6.5, months: 60 }).value).toBeCloseTo(expected, 4)
  })
})

describe('ppf', () => {
  it('matches the annuity-due closed form', () => {
    const r = 0.071
    const expected = 150000 * ((Math.pow(1 + r, 15) - 1) / r) * (1 + r)
    const res = ppf({ yearly: 150000, annualRate: 7.1, years: 15 })
    expect(res.value).toBeCloseTo(expected, 4)
    expect(res.value / 100000).toBeGreaterThan(40.6)
    expect(res.value / 100000).toBeLessThan(40.8)
  })
})

describe('ssy', () => {
  it('deposits 15 years then compounds to year 21', () => {
    const r = 0.082
    const expected = 150000 * ((Math.pow(1 + r, 15) - 1) / r) * (1 + r) * Math.pow(1 + r, 6)
    const res = ssy({ yearly: 150000, annualRate: 8.2 })
    expect(res.value).toBeCloseTo(expected, 3)
    expect(res.invested).toBe(2_250_000)
    expect(res.yearly).toHaveLength(21)
  })
})

describe('swp', () => {
  it('matches the annuity formula when the corpus lasts', () => {
    const i = 0.08 / 12
    const n = 120
    const expected = 1_000_000 * Math.pow(1 + i, n) - 5000 * ((Math.pow(1 + i, n) - 1) / i)
    const r = swp({ corpus: 1_000_000, monthly: 5000, annualReturn: 8, years: 10 })
    expect(r.value).toBeCloseTo(expected, 4)
    expect(r.exhausted).toBe(false)
    expect(r.withdrawn).toBe(600000)
  })
  it('stops when the corpus runs out', () => {
    const r = swp({ corpus: 100000, monthly: 20000, annualReturn: 6, years: 2 })
    expect(r.exhausted).toBe(true)
    expect(r.value).toBe(0)
    expect(r.withdrawn).toBeGreaterThan(100000)
    expect(r.withdrawn).toBeLessThan(110000)
  })
})

describe('epf', () => {
  it('splits the employer share and credits interest yearly', () => {
    const r = epf({ monthlyBasic: 30000, employeeRate: 12, annualRate: 8.25, raisePercent: 0, years: 1 })
    const employee = 3600
    const employerEpf = 3600 - 15000 * 0.0833
    expect(r.invested).toBeCloseTo((employee + employerEpf) * 12, 6)
    let bal = 0
    let acc = 0
    for (let m = 0; m < 12; m++) {
      bal += employee + employerEpf
      acc += (bal * 0.0825) / 12
    }
    expect(r.value).toBeCloseTo(bal + acc, 6)
  })
})

describe('gst', () => {
  it('adds GST to an exclusive amount', () => {
    expect(gst({ amount: 1000, rate: 18, inclusive: false })).toMatchObject({ tax: 180, total: 1180, half: 90 })
  })
  it('extracts GST from an inclusive amount', () => {
    const r = gst({ amount: 1180, rate: 18, inclusive: true })
    expect(r.net).toBeCloseTo(1000, 8)
    expect(r.tax).toBeCloseTo(180, 8)
  })
})

describe('xirr', () => {
  it('solves a one-year flow on the actual/365 basis', () => {
    const r = xirr([
      { date: day('2020-01-01'), amount: -1000 },
      { date: day('2021-01-01'), amount: 1100 },
    ])
    expect(r).toBeCloseTo(Math.pow(1.1, 365 / 366) - 1, 8)
  })
  it('recovers a known multi-flow rate', () => {
    const rate = 0.15
    const t0 = day('2022-01-01')
    const flows = [0, 180, 400, 900].map((d, k) => ({ date: t0 + d * 86_400_000, amount: k === 3 ? 0 : -1000 }))
    const pv = flows.reduce((s, f) => s + -f.amount / Math.pow(1 + rate, (f.date - t0) / 86_400_000 / 365), 0)
    flows.push({ date: t0 + 900 * 86_400_000, amount: pv * Math.pow(1 + rate, 900 / 365) })
    expect(xirr(flows)).toBeCloseTo(rate, 8)
  })
  it('is null without both signs', () => {
    expect(xirr([{ date: 1, amount: -5 }, { date: 2, amount: -5 }])).toBeNull()
  })
})
