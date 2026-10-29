import { describe, expect, it } from 'vitest'

import { Bm25 } from './bm25'
import { queryTerms, stem, tokens } from './text'

describe('text', () => {
  it('stems plurals and endings so words meet', () => {
    expect(stem('funds')).toBe(stem('fund'))
    expect(stem('investing')).toBe(stem('invest'))
    expect(stem('charges')).toBe(stem('charge'))
  })

  it('drops stop words and keeps rupee amounts', () => {
    expect(tokens('What is the cost of my funds?')).toEqual(['cost', 'fund'])
    expect(tokens('₹4,826 a year')).toContain('₹4')
  })

  it('adds synonyms at a lower weight', () => {
    const t = queryTerms('what do you charge')
    expect(t.find((x) => x.term === stem('charge'))?.weight).toBe(1)
    expect(t.find((x) => x.term === 'fee')?.weight).toBeLessThan(1)
  })
})

describe('Bm25', () => {
  const idx = new Bm25([
    { id: 'a', title: 'Fees', url: '/fees', text: 'You pay one flat fee per family. No commission.', scope: 'public' },
    { id: 'b', title: 'Rebalancing', url: '/x', text: 'Rebalancing moves money back to your plan when shares have grown.', scope: 'public' },
    { id: 'c', title: 'Goals', url: '/y', text: 'A goal needs a target amount and a year.', scope: 'public' },
  ])

  it('ranks the chunk that answers the question first', () => {
    expect(idx.search('how much do you charge')[0].chunk.id).toBe('a')
    expect(idx.search('bring my mix back to plan')[0].chunk.id).toBe('b')
    expect(idx.search('what year for a goal')[0].chunk.id).toBe('c')
  })

  it('returns nothing for words it has never seen', () => {
    expect(idx.search('zzzzqq')).toEqual([])
  })
})
