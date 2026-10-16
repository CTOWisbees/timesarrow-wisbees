import { describe, expect, it } from 'vitest'

import type { AnalysisResult } from './analyze'
import { CARD_PLAN, CARDS, type PaidResult, type Plan, toView } from './entitlements'
import type { Flag } from './rules'

const flag = (id: Flag['id'], name: string): Flag => ({ id, severity: 'medium', evidence: { name, pct: 21.5 }, amount: 1000, holdings: [name] })

const result = {
  engineVersion: '1',
  configVersion: '1',
  asOf: '2026-10-09',
  benchmark: { id: 'NIFTY50_TRI', name: 'Nifty 50', note: null },
  score: { score: 62, band: 'fair', provisional: false, range: null, capped: false, subScores: [] },
  flags: [flag('R01', 'Alpha'), flag('R03', 'Bravo'), flag('R05', 'Charlie'), flag('R07', 'SECRET-DELTA'), flag('R09', 'SECRET-ECHO')],
  metrics: {
    totalValue: 1000,
    coverage: 1,
    holdingsCount: 1,
    weights: [],
    allocation: { asHeld: [], effective: { equity: 1, debt: 0, gold: 0, cash: 0, other: 0 } },
    sectors: { top: [], other: 0, diversifiedFunds: 0, effectiveCount: null, equityShare: 1 },
    caps: { large: 1, mid: 0, small: 0, unknown: 0 },
    volatility: { annual: 0.15, benchmarkAnnual: 0.15, ratio: 1, label: 'high', days: 250, proxied: [], excluded: [], shrinkage: 0 },
    returns: { method: null, rate: null, cost: 0, value: 0, coveredShare: 0, benchmarkRate: null, gap: null, note: null },
  },
  dataQuality: { coverage: 1, stale: [], proxied: [], userValued: [], excluded: [], volatilityExcluded: [], warnings: [] },
} as unknown as AnalysisResult

const paid: PaidResult = {
  complete: true,
  teasers: { overlap: { pairs: 3 }, drag: { bucket: 'above ₹1 lakh' } },
  cards: Object.fromEntries(CARDS.map((c) => [c, { secret: `SECRET-${c.toUpperCase()}-VALUE` }])),
  flagImpact: { 0: 123456 },
  flagScenarios: { 0: [{ label: 'SECRET-SCENARIO', amount: 1 }] },
}

const view = (plan: Plan) => toView('p1', result, plan, paid, 3)

describe('entitlements', () => {
  it('anonymous: top 3 flags in full, the rest only counted', () => {
    const v = view('anonymous')
    expect(v.flags.shown.map((f) => f.id)).toEqual(['R01', 'R03', 'R05'])
    expect(v.flags.hiddenCount).toBe(2)
    expect(JSON.stringify(v)).not.toContain('SECRET-DELTA')
    expect(JSON.stringify(v)).not.toContain('SECRET-ECHO')
  })

  it('free account: every flag, but no rupee impact', () => {
    const v = view('free')
    expect(v.flags.shown).toHaveLength(5)
    expect(v.flags.hiddenCount).toBe(0)
    expect(v.flags.shown[0].impactInr).toBeUndefined()
  })

  it.each(['anonymous', 'free', 'insights', 'pro'] as Plan[])('%s: locked cards carry no paid values', (plan) => {
    const v = view(plan)
    const raw = JSON.stringify(v)
    for (const card of v.cards) {
      const allowed = plan === 'pro' || (plan === 'insights' && CARD_PLAN[card.id] === 'insights')
      expect(card.locked).toBe(!allowed)
      if (card.locked) expect(raw).not.toContain(`SECRET-${card.id.toUpperCase()}-VALUE`)
      else expect(raw).toContain(`SECRET-${card.id.toUpperCase()}-VALUE`)
    }
  })

  it('insights adds rupee impact; only pro gets scenarios', () => {
    expect(view('insights').flags.shown[0].impactInr).toBe(123456)
    expect(JSON.stringify(view('insights'))).not.toContain('SECRET-SCENARIO')
    expect(view('pro').flags.shown[0].scenarios).toHaveLength(1)
  })

  it('locked cards keep their teaser', () => {
    const overlap = view('free').cards.find((c) => c.id === 'overlap')!
    expect(overlap).toMatchObject({ locked: true, teaser: { pairs: 3 } })
  })
})
