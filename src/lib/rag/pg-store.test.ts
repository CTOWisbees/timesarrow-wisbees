import { describe, expect, it } from 'vitest'

import type { Chunk } from './bm25'
import { coverage, MIN_COVERAGE } from './coverage'
import { rescore, tsQueries } from './pg-store'

const chunk = (title: string, text: string, tags: string[] = []): Chunk => ({ id: 'x', title, url: '/x', text, scope: 'public', tags })

describe('tsQueries', () => {
  it('searches the question’s own words, and synonym prefixes separately', () => {
    const q = tsQueries('What do you charge for rebalancing?')
    expect(q.main).toBe("'charge' | 'rebalancing'")
    expect(q.synonyms).toContain("'fee':*")
    expect(q.synonyms).toContain("'drift':*")
  })

  it('has no query for a question of stop words', () => {
    expect(tsQueries('what is the')).toEqual({ main: null, synonyms: null })
  })

  it('quotes words, so nothing in a question can change the query', () => {
    const { main } = tsQueries("alpha' | 'beta & !gamma")
    expect(main).toBe("'alpha' | 'beta' | 'gamma'")
  })
})

describe('coverage', () => {
  const fees = chunk('A flat fee, published here', 'You pay a fixed subscription.', ['fee', 'cost'])

  it('is the share of the question’s words the chunk has', () => {
    expect(coverage('flat fee', fees)).toBe(1)
    expect(coverage('flat banana', fees)).toBe(0.5)
  })

  it('counts a synonym as most of a match', () => {
    expect(coverage('what is the price', chunk('Fees', 'A flat fee per family.'))).toBeCloseTo(0.7, 5)
  })

  it('drops a chunk that matches one word of a long question', () => {
    expect(coverage('tell me about cricket scores', chunk('How the score works', 'The health score is 0 to 100.'))).toBeLessThan(MIN_COVERAGE)
  })
})

describe('rescore', () => {
  it('grows with the rank and with coverage, and stays bounded', () => {
    expect(rescore(10, 1)).toBeGreaterThan(rescore(2, 1))
    expect(rescore(10, 1)).toBeGreaterThan(rescore(10, 0.4))
    expect(rescore(10_000, 1)).toBeLessThan(40)
  })
})
