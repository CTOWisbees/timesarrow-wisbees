import { describe, expect, it } from 'vitest'

import { CALCULATORS, defaultValues, getCalculator } from './registry'

describe('calculator registry', () => {
  it('offers step-up SIP first, then SIP, lumpsum, SWP, EMI, goal gap and tax-loss harvesting', () => {
    expect(CALCULATORS.map((c) => c.slug)).toEqual(['step-up-sip-calculator', 'sip-calculator', 'lumpsum-calculator', 'swp-calculator', 'emi-calculator', 'goal-gap-calculator', 'tax-loss-harvesting-calculator'])
  })

  it('SIP defaults give ₹23,23,390 on ₹12,00,000 invested', () => {
    const def = getCalculator('sip-calculator')!
    const r = def.compute(defaultValues(def))
    expect(r.stats.find((s) => s.tone === 'primary')!.value).toBe('₹23,23,390')
    expect(r.stats[0].value).toBe('₹12,00,000')
    expect(r.stats[1].value).toBe('₹11,23,390')
  })

  it('lumpsum defaults give ₹3,10,584', () => {
    const def = getCalculator('lumpsum-calculator')!
    expect(def.compute(defaultValues(def)).stats.find((s) => s.tone === 'primary')!.value).toBe('₹3,10,584')
  })

  it("shows today's money as value ÷ (1 + inflation)^years", () => {
    const def = getCalculator('lumpsum-calculator')!
    const r = def.compute({ ...defaultValues(def), inflation: 6 })
    const today = Math.floor(310584.8 / Math.pow(1.06, 10))
    expect(r.stats[3].value).toBe(`₹${today.toLocaleString('en-IN')}`)
  })

  it('EMI defaults give ₹8,678 a month on ₹10L at 8.5% for 20 years', () => {
    const def = getCalculator('emi-calculator')!
    const r = def.compute(defaultValues(def))
    expect(r.stats[0].value).toBe('₹8,678')
    expect(r.stats[3].value).toBe('₹20,82,776')
  })

  it('goal gap defaults fall short and show the extra monthly amount that closes it', () => {
    const def = getCalculator('goal-gap-calculator')!
    const r = def.compute(defaultValues(def))
    expect(r.stats[1].label).toBe('Shortfall')
    expect(r.stats[3].value).not.toBe('₹0')
  })

  it('tax-loss harvesting cancels the smaller of the loss and the gains', () => {
    const def = getCalculator('tax-loss-harvesting-calculator')!
    const r = def.compute({ ...defaultValues(def), loss: 38_000, gains: 112_000, rate: 12.5 })
    expect(r.stats[1].value).toBe('₹38,000')
    expect(r.stats[2].value).toBe('₹4,750')
    expect(r.stats[3].value).toBe('₹0')
    const small = def.compute({ ...defaultValues(def), loss: 38_000, gains: 10_000, rate: 12.5 })
    expect(small.stats[1].value).toBe('₹10,000')
    expect(small.stats[3].value).toBe('₹28,000')
  })

  it('every calculator works out its numbers at the extremes', () => {
    for (const def of CALCULATORS) {
      const lows = Object.fromEntries(def.fields.map((f) => [f.id, f.kind === 'number' ? f.min : f.default]))
      const highs = Object.fromEntries(def.fields.map((f) => [f.id, f.kind === 'number' ? f.max : f.default]))
      for (const v of [lows, highs, defaultValues(def)]) {
        expect(JSON.stringify(def.compute(v))).not.toMatch(/NaN|Infinity/)
        expect(def.worked(v).join(' ')).not.toMatch(/NaN|Infinity/)
      }
    }
  })
})
