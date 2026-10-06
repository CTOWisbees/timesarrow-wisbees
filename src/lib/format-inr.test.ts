import { describe, expect, it } from 'vitest'

import { formatInr, formatInrCompact, formatInrShort } from './format-inr'

describe('formatInr', () => {
  it('uses Indian digit grouping', () => {
    expect(formatInr(20_640_513)).toBe('₹2,06,40,513')
    expect(formatInr(8_627_935, { symbol: false })).toBe('86,27,935')
    expect(formatInr(499)).toBe('₹499')
  })
})

describe('formatInrCompact', () => {
  it('formats crores and lakhs, truncating so projections are never overstated', () => {
    expect(formatInrCompact(39_777_431)).toBe('₹3.97 Cr')
    expect(formatInrCompact(13_746_000)).toBe('₹1.37 Cr')
    expect(formatInrCompact(2_450_000)).toBe('₹24.50 L')
  })

  it('falls back to grouped rupees below one lakh', () => {
    expect(formatInrCompact(95_000)).toBe('₹95,000')
  })
})

describe('formatInrShort', () => {
  it('labels slider marks', () => {
    expect(formatInrShort(20_000)).toBe('20K')
    expect(formatInrShort(100_000)).toBe('1L')
    expect(formatInrShort(500)).toBe('500')
  })
})
