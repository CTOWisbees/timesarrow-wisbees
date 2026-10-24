import { describe, expect, it } from 'vitest'

import { CALCULATORS, defaultValues, getCalculator } from './registry'

describe('calculator registry', () => {
  it('offers only SIP, lumpsum and SWP', () => {
    expect(CALCULATORS.map((c) => c.slug)).toEqual(['sip-calculator', 'lumpsum-calculator', 'swp-calculator'])
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
