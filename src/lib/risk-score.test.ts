import { describe, expect, it } from 'vitest'

import { type RiskQuestion, RiskScoreError, scoreRiskProfile } from './risk-score'

// Mirrors the onboarding team's sheet (Q1's duplicate answer removed).
const q = (key: string, scores: number[]): RiskQuestion => ({
  key,
  question: key,
  answers: scores.map((score, i) => ({ id: `${key}-${i}`, label: `${key} answer ${i}`, score })),
})
const questions = [q('q1', [1, 2, 4]), q('q2', [1, 3, 3, 4]), q('q3', [2, 3, 3, 4]), q('q4', [1, 2, 3, 4]), q('q5', [1, 2, 3, 4])]
const bands = [
  { min: 5, max: 8, category: 'Conservative', equityLimit: 'up to 20% equity' },
  { min: 9, max: 12, category: 'Moderate', equityLimit: 'up to 50% equity' },
  { min: 13, max: 16, category: 'Moderately aggressive', equityLimit: 'up to 75% equity' },
  { min: 17, max: 20, category: 'Aggressive', equityLimit: 'up to 100% equity' },
]
/** Answer index per question → answer ids. */
const pick = (...idx: number[]) => Object.fromEntries(questions.map((qq, i) => [qq.key, `${qq.key}-${idx[i]}`]))

describe('scoreRiskProfile', () => {
  it('adds the scores and keeps a snapshot of each answer', () => {
    const r = scoreRiskProfile(questions, bands, pick(0, 0, 0, 0, 0))
    expect(r.total).toBe(6) // the lowest possible: Q3 has no 1-point answer
    expect(r.category).toBe('Conservative')
    expect(r.answers[2]).toEqual({ questionKey: 'q3', question: 'q3', answer: 'q3 answer 0', score: 2 })
  })

  it('maps totals on each band edge', () => {
    // [answer index per question] → expected total and category
    const cases: [number[], number, string][] = [
      [[0, 0, 0, 1, 1], 8, 'Conservative'], // 1+1+2+2+2
      [[1, 0, 0, 1, 1], 9, 'Moderate'], // 2+1+2+2+2
      [[1, 1, 1, 1, 1], 12, 'Moderate'], // 2+3+3+2+2
      [[1, 1, 1, 2, 1], 13, 'Moderately aggressive'], // 2+3+3+3+2
      [[2, 1, 1, 2, 2], 16, 'Moderately aggressive'], // 4+3+3+3+3
      [[2, 1, 1, 3, 2], 17, 'Aggressive'], // 4+3+3+4+3
      [[2, 3, 3, 3, 3], 20, 'Aggressive'], // 4+4+4+4+4
    ]
    for (const [idx, total, category] of cases) {
      const r = scoreRiskProfile(questions, bands, pick(...idx))
      expect([r.total, r.category]).toEqual([total, category])
    }
    expect(scoreRiskProfile(questions, bands, pick(2, 3, 3, 3, 3)).equityLimit).toBe('up to 100% equity')
  })

  it('rejects a missing answer', () => {
    const chosen = pick(0, 0, 0, 0, 0)
    delete chosen.q4
    expect(() => scoreRiskProfile(questions, bands, chosen)).toThrow(RiskScoreError)
  })

  it('rejects answer ids that belong to no answer, and unknown questions', () => {
    expect(() => scoreRiskProfile(questions, bands, { ...pick(0, 0, 0, 0, 0), q1: 'q2-0' })).toThrow(/Unknown answer/)
    expect(() => scoreRiskProfile(questions, bands, { ...pick(0, 0, 0, 0, 0), q9: 'x' })).toThrow(/Unknown question/)
  })

  it('fails loudly when no band covers the total', () => {
    expect(() => scoreRiskProfile(questions, bands.slice(1), pick(0, 0, 0, 0, 0))).toThrow(/No risk band/)
  })
})
