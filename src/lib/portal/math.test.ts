import { describe, expect, it } from 'vitest'

import { sip } from '@/lib/calculators/finance'

import { drift, extraMonthlyNeeded, feeCheck, goalStatus, hasDrifted, projectGoal, rebalanceAmount, stressTest } from './math'

describe('projectGoal', () => {
  it('matches the SIP calculator when nothing is saved yet', () => {
    const p = projectGoal({ saved: 0, monthly: 10_000, annualReturn: 0.12, years: 10 })
    expect(p.value).toBeCloseTo(sip({ monthly: 10_000, annualReturn: 12, years: 10 }).value, 4)
    expect(p.invested).toBe(1_200_000)
  })

  it('compounds the corpus already saved', () => {
    const p = projectGoal({ saved: 100_000, monthly: 0, annualReturn: 0.12, years: 5 })
    expect(p.value).toBeCloseTo(100_000 * Math.pow(1.01, 60), 6)
  })

  it('handles a zero return', () => {
    expect(projectGoal({ saved: 5_000, monthly: 1_000, annualReturn: 0, years: 2 }).value).toBe(29_000)
  })
})

describe('extraMonthlyNeeded', () => {
  const goal = { target: 4_500_000, saved: 580_000, monthly: 12_000, annualReturn: 0.1, years: 10 }

  it('is zero when the goal is already funded', () => {
    expect(extraMonthlyNeeded({ ...goal, target: 1_000_000 })).toBe(0)
  })

  it('closes the gap once added, in whole hundreds', () => {
    const extra = extraMonthlyNeeded(goal)
    expect(extra % 100).toBe(0)
    expect(extra).toBeGreaterThan(0)
    expect(projectGoal({ ...goal, monthly: goal.monthly + extra }).value).toBeGreaterThanOrEqual(goal.target)
    expect(projectGoal({ ...goal, monthly: goal.monthly + extra - 100 }).value).toBeLessThan(goal.target)
  })
})

describe('goalStatus', () => {
  it('is on track only when the projection reaches the target', () => {
    expect(goalStatus(100, 100)).toBe('on')
    expect(goalStatus(99, 100)).toBe('behind')
  })
})

describe('stressTest', () => {
  it('cuts shares fully, bonds by a fifth, and leaves the rest', () => {
    const r = stressTest({ shares: 2_000_000, bonds: 500_000, total: 3_000_000 }, 20)
    expect(r.loss).toBeCloseTo(400_000 + 20_000, 6)
    expect(r.left).toBeCloseTo(3_000_000 - 420_000, 6)
    expect(r.lossPct).toBeCloseTo(14, 6)
  })
})

describe('drift', () => {
  const shares = { label: 'Shares', now: 72, plan: 65 }
  it('measures points from plan and flags past 3 points', () => {
    expect(drift(shares)).toBe(7)
    expect(hasDrifted(shares)).toBe(true)
    expect(hasDrifted({ label: 'Gold', now: 6, plan: 5 })).toBe(false)
  })
  it('rounds the rebalance amount to ₹10,000', () => {
    expect(rebalanceAmount(shares, 3_022_000)).toBe(210_000)
  })
})

describe('feeCheck', () => {
  it('keeps every published tier under the ₹1.51 lakh cap', () => {
    expect(feeCheck({ perMonth: 499 })).toEqual({ yearly: 5_988, withinCap: true })
    expect(feeCheck({ perMonth: 1_999 }).yearly).toBe(23_988)
    expect(feeCheck({ perYear: 150_000 }).withinCap).toBe(true)
    expect(feeCheck({ perYear: 151_001 }).withinCap).toBe(false)
  })
})
