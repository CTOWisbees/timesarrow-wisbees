/**
 * The only path from a stored analysis to the browser. The engine computes everything
 * once; this filters by plan, so locked values never appear in page source or network
 * responses. Locked cards receive a teaser (counts or coarse buckets) instead.
 */
import type { AnalysisResult } from './analyze'
import type { Flag } from './rules'

export type Plan = 'anonymous' | 'free' | 'insights' | 'pro'
export const PLAN_RANK: Record<Plan, number> = { anonymous: 0, free: 1, insights: 2, pro: 3 }

export const CARDS = ['overlap', 'drag', 'drawdown', 'returns', 'pdf', 'stress', 'ratios', 'rebalance', 'tax', 'whatif'] as const
export type CardId = (typeof CARDS)[number]
export const CARD_PLAN: Record<CardId, 'insights' | 'pro'> = {
  overlap: 'insights',
  drag: 'insights',
  drawdown: 'insights',
  returns: 'insights',
  pdf: 'insights',
  stress: 'pro',
  ratios: 'pro',
  rebalance: 'pro',
  tax: 'pro',
  whatif: 'pro',
}

export type Teaser = Record<string, string | number>
export type PaidResult = {
  /** False while only the teasers exist; the full job sets it when every card is computed. */
  complete: boolean
  /** Safe-to-show teasers, computed alongside the paid data. */
  teasers: Partial<Record<CardId, Teaser>>
  cards: Partial<Record<CardId, unknown>>
  /** Rupee impact per flag (Insights), keyed by flag index in `flags`. */
  flagImpact?: Record<number, number>
  /** Scenario notes per flag (Pro). */
  flagScenarios?: Record<number, { label: string; amount: number }[]>
}

export type FlagView = Flag & { impactInr?: number; scenarios?: { label: string; amount: number }[] }
export type CardView = { id: CardId; plan: 'insights' | 'pro'; locked: true; teaser: Teaser | null } | { id: CardId; plan: 'insights' | 'pro'; locked: false; data: unknown }

export type ScanView = {
  portfolioId: string
  plan: Plan
  asOf: string
  benchmark: AnalysisResult['benchmark']
  score: AnalysisResult['score']
  flags: { shown: FlagView[]; hiddenCount: number }
  summary: {
    totalValue: number
    holdingsCount: number
    coverage: number
    allocation: AnalysisResult['metrics']['allocation']
    sectors: AnalysisResult['metrics']['sectors']
    topHoldings: { name: string; weight: number; value: number; type: string; diversified: boolean }[]
    caps: AnalysisResult['metrics']['caps']
    volatility: Pick<AnalysisResult['metrics']['volatility'], 'annual' | 'benchmarkAnnual' | 'ratio' | 'label' | 'proxied'>
    returns: AnalysisResult['metrics']['returns']
  }
  dataQuality: AnalysisResult['dataQuality']
  cards: CardView[]
  paidPending: boolean
}

export function toView(portfolioId: string, result: AnalysisResult, plan: Plan, paid: PaidResult | null, freeFlagsShown: number): ScanView {
  const rank = PLAN_RANK[plan]
  const m = result.metrics

  // Anonymous visitors see the top flags in full and a count for the rest; any account sees all.
  const visible = rank >= PLAN_RANK.free ? result.flags : result.flags.slice(0, freeFlagsShown)
  const shown: FlagView[] = visible.map((f, i) => {
    const view: FlagView = { ...f }
    if (rank >= PLAN_RANK.insights && paid?.flagImpact?.[i] !== undefined) view.impactInr = paid.flagImpact[i]
    if (rank >= PLAN_RANK.pro && paid?.flagScenarios?.[i]) view.scenarios = paid.flagScenarios[i]
    return view
  })

  const cards: CardView[] = CARDS.map((id) => {
    const needed = CARD_PLAN[id]
    if (rank >= PLAN_RANK[needed] && paid?.complete && paid.cards[id] !== undefined) return { id, plan: needed, locked: false, data: paid.cards[id] }
    return { id, plan: needed, locked: true, teaser: paid?.teasers[id] ?? null }
  })

  return {
    portfolioId,
    plan,
    asOf: result.asOf,
    benchmark: result.benchmark,
    score: result.score,
    flags: { shown, hiddenCount: result.flags.length - visible.length },
    summary: {
      totalValue: m.totalValue,
      holdingsCount: m.holdingsCount,
      coverage: m.coverage,
      allocation: m.allocation,
      sectors: m.sectors,
      topHoldings: m.weights.slice(0, 5).map(({ name, weight, value, type, diversified }) => ({ name, weight, value, type, diversified })),
      caps: m.caps,
      volatility: {
        annual: m.volatility.annual,
        benchmarkAnnual: m.volatility.benchmarkAnnual,
        ratio: m.volatility.ratio,
        label: m.volatility.label,
        proxied: m.volatility.proxied,
      },
      returns: m.returns,
    },
    dataQuality: result.dataQuality,
    cards,
    paidPending: rank >= PLAN_RANK.insights && !paid?.complete,
  }
}
