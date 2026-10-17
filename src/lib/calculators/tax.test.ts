import { describe, expect, it } from 'vitest'

import { computeTax, type TaxInput } from './tax'

const base: TaxInput = {
  regime: 'new',
  age: 'below60',
  gross: 0,
  salaried: true,
  employerNps: 0,
  hraExemption: 0,
  section80c: 0,
  nps80ccd1b: 0,
  section80d: 0,
  homeLoanInterest: 0,
  otherDeductions: 0,
}

describe('new regime', () => {
  it('is nil up to ₹12.75L salaried (₹75k standard deduction + 87A)', () => {
    expect(computeTax({ ...base, gross: 1_275_000 }).total).toBe(0)
  })
  it('₹15L salaried: slabs on ₹14.25L + 4% cess', () => {
    const r = computeTax({ ...base, gross: 1_500_000 })
    expect(r.taxable).toBe(1_425_000)
    expect(r.slabTax).toBe(20000 + 40000 + 33750)
    expect(r.total).toBeCloseTo(93750 * 1.04, 6)
  })
  it('gives marginal relief just above ₹12L taxable', () => {
    const r = computeTax({ ...base, gross: 1_285_000 }) // taxable 12,10,000
    expect(r.slabTax - r.rebate).toBe(10_000)
    expect(r.total).toBeCloseTo(10_400, 6)
  })
  it('caps surcharge at 25% above ₹5 Cr', () => {
    const r = computeTax({ ...base, gross: 100_000_000 })
    expect(r.surcharge / r.slabTax).toBeCloseTo(0.25, 8)
  })
})

describe('old regime', () => {
  it('₹10L salaried, no deductions: taxable ₹9.5L → ₹1,02,500 + cess', () => {
    const r = computeTax({ ...base, regime: 'old', gross: 1_000_000 })
    expect(r.taxable).toBe(950_000)
    expect(r.slabTax).toBe(102_500)
    expect(r.total).toBeCloseTo(106_600, 6)
  })
  it('caps 80C at ₹1.5L and gives the ₹12,500 rebate up to ₹5L', () => {
    const r = computeTax({ ...base, regime: 'old', gross: 700_000, section80c: 400_000 })
    expect(r.deductions).toMatchObject({ section80c: 150_000 })
    expect(r.taxable).toBe(500_000)
    expect(r.total).toBe(0)
  })
  it('uses higher exemptions for seniors', () => {
    const r = computeTax({ ...base, regime: 'old', age: 'senior', salaried: false, gross: 400_000 })
    expect(r.slabTax).toBe(5000)
    expect(r.total).toBe(0) // rebate
    const s = computeTax({ ...base, regime: 'old', age: 'superSenior', salaried: false, gross: 600_000 })
    expect(s.slabTax).toBe(20000)
  })
})

describe('surcharge marginal relief', () => {
  it('never takes more than the income above a threshold', () => {
    for (const regime of ['old', 'new'] as const) {
      const at = computeTax({ ...base, regime, salaried: false, gross: 5_000_000 })
      for (const extra of [1, 1000, 10_000, 100_000]) {
        const above = computeTax({ ...base, regime, salaried: false, gross: 5_000_000 + extra })
        expect(above.total - at.total).toBeLessThanOrEqual(extra * 1.04 + 1e-6)
      }
    }
  })
})
