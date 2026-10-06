import { describe, expect, it } from 'vitest'

import { projectSip } from './sip'

describe('projectSip', () => {
  // Reference case from the Figma: ₹20,000/month, 10% annual step-up, 12% return, 20 years.
  const figma = projectSip({ monthlyAmount: 20_000, annualReturn: 12, years: 20, stepUpPercent: 10 })

  it('matches the Figma tooltip at year 16', () => {
    expect(figma.yearly[15]).toEqual({ year: 16, invested: 8_627_935, value: 20_640_513 })
  })

  it('matches the Figma totals at year 20', () => {
    expect(figma.invested).toBe(13_746_000)
    expect(figma.value).toBe(39_777_431)
  })

  it('reports growth as gain over the amount invested', () => {
    expect(figma.gainPercent).toBeCloseTo(189.4, 1)
  })

  it('returns one point per year', () => {
    expect(figma.yearly).toHaveLength(20)
    expect(figma.yearly.map((p) => p.year)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1))
  })

  it('handles a flat SIP without step-up', () => {
    const flat = projectSip({ monthlyAmount: 10_000, annualReturn: 12, years: 10, stepUpPercent: 0 })
    expect(flat.invested).toBe(1_200_000)
    // Standard annuity-due SIP formula: P × ((1+i)^n − 1) / i × (1+i)
    const i = 0.01
    const expected = 10_000 * ((Math.pow(1 + i, 120) - 1) / i) * (1 + i)
    expect(flat.value).toBe(Math.round(expected))
  })

  it('treats a 0% return as the amount invested', () => {
    const zero = projectSip({ monthlyAmount: 5_000, annualReturn: 0, years: 2, stepUpPercent: 0 })
    expect(zero.value).toBe(120_000)
    expect(zero.gainPercent).toBe(0)
  })

  it('returns zeros for empty inputs instead of NaN', () => {
    const none = projectSip({ monthlyAmount: 0, annualReturn: 12, years: 5, stepUpPercent: 10 })
    expect(none).toMatchObject({ invested: 0, value: 0, gainPercent: 0 })
  })
})
