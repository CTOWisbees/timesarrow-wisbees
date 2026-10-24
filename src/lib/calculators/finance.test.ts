import { describe, expect, it } from 'vitest'

import { emi, lumpsum, sip, swp } from './finance'

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

describe('closed forms across many inputs', () => {
  const rates = [1, 6.5, 8, 12, 15.7, 30]
  const spans = [1, 5, 10, 25, 40]

  it('sip equals the annuity-due formula', () => {
    for (const rate of rates)
      for (const years of spans) {
        const i = rate / 1200
        const n = years * 12
        const expected = 7500 * ((Math.pow(1 + i, n) - 1) / i) * (1 + i)
        const r = sip({ monthly: 7500, annualReturn: rate, years })
        expect(r.value / expected).toBeCloseTo(1, 10)
        expect(r.invested).toBe(7500 * n)
        expect(r.yearly.at(-1)!.value).toBe(r.value)
      }
  })

  it('lumpsum equals P(1+r)^t', () => {
    for (const rate of rates)
      for (const years of spans) {
        const r = lumpsum({ amount: 250000, annualReturn: rate, years })
        expect(r.value / (250000 * Math.pow(1 + rate / 100, years))).toBeCloseTo(1, 12)
        expect(r.returns).toBeCloseTo(r.value - 250000, 6)
      }
  })

  it('swp equals C(1+i)^n − W((1+i)^n − 1)/i while the corpus lasts', () => {
    for (const rate of rates)
      for (const years of spans) {
        const i = rate / 1200
        const n = years * 12
        const closed = 5_000_000 * Math.pow(1 + i, n) - 20000 * ((Math.pow(1 + i, n) - 1) / i)
        const r = swp({ corpus: 5_000_000, monthly: 20000, annualReturn: rate, years })
        if (closed > 0) {
          expect(r.exhausted).toBe(false)
          expect(r.value / closed).toBeCloseTo(1, 10)
          expect(r.withdrawn).toBe(20000 * n)
        } else {
          expect(r.exhausted).toBe(true)
          expect(r.value).toBe(0)
        }
      }
  })
})

describe('emi', () => {
  it('gives the standard EMI for ₹10L at 8.5% over 20 years', () => {
    const r = emi({ principal: 1_000_000, annualRate: 8.5, years: 20 })
    expect(r.emi).toBeCloseTo(8678.23, 2)
    expect(r.total).toBeCloseTo(r.emi * 240, 6)
    expect(r.yearly.at(-1)!.balance).toBe(0)
    expect(r.yearly.reduce((s, y) => s + y.principal, 0)).toBeCloseTo(1_000_000, 4)
    expect(r.yearly.reduce((s, y) => s + y.interest, 0)).toBeCloseTo(r.interest, 4)
  })

  it('equals P·r·(1+r)^n/((1+r)^n − 1) across many inputs and clears the loan', () => {
    for (const rate of [1, 7.25, 8.5, 12, 30])
      for (const years of [1, 5, 15, 30]) {
        const r = rate / 1200
        const n = years * 12
        const expected = (2_500_000 * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
        const res = emi({ principal: 2_500_000, annualRate: rate, years })
        expect(res.emi / expected).toBeCloseTo(1, 12)
        expect(res.yearly.reduce((s, y) => s + y.principal, 0) / 2_500_000).toBeCloseTo(1, 9)
      }
  })

  it('handles zero interest', () => {
    expect(emi({ principal: 120000, annualRate: 0, years: 1 }).emi).toBe(10000)
  })
})
