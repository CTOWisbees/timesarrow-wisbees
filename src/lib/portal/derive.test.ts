import { describe, expect, it } from 'vitest'

import { equityLimitFrom } from './derive'

describe('equityLimitFrom', () => {
  it('reads the percentage out of the risk band text', () => {
    expect(equityLimitFrom('up to 75% equity')).toBe(75)
    expect(equityLimitFrom('up to 100% equity')).toBe(100)
    expect(equityLimitFrom('up to 20% equity')).toBe(20)
  })
  it('returns null when there is no usable number', () => {
    expect(equityLimitFrom(null)).toBeNull()
    expect(equityLimitFrom('')).toBeNull()
    expect(equityLimitFrom('no limit')).toBeNull()
    expect(equityLimitFrom('up to 0% equity')).toBeNull()
  })
})
