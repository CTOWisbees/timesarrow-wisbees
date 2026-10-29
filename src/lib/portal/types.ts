export type Goal = { id: string; name: string; emoji: string; target: number; year: number; saved: number; monthly: number }

export type Holding = {
  name: string
  /** Stock, Mutual fund, ETF, Bond or Cash. */
  kind: string
  value: number
  /** Share of the portfolio, 0–100. */
  weight: number
  /** Against what was paid, when the cost is known. */
  gainPct: number | null
}

export type MixRow = { label: string; now: number; plan: number | null; colour: string }

export type TodoKind = 'rebalance' | 'harvest' | 'sip'

export type Todo = {
  /** Stable per suggestion, so an answer is remembered. */
  id: string
  kind: TodoKind
  label: string
  icon: 'invest' | 'tax' | 'goal'
  title: string
  why: string
  details: [string, string][]
  risk: string
}

export type AlertRow = { id: string; tone: 'good' | 'warn' | 'bad' | 'info' | 'grey'; title: string; body: string; when: string; href: string }

export type ScorePart = { label: string; value: number | null }

export type PortalData = {
  /** Example family: only ever in local demo mode, before a real portfolio exists. */
  sample: boolean
  hasPortfolio: boolean
  portfolioId: string | null
  asOf: string | null
  total: number
  holdings: Holding[]
  mix: MixRow[]
  risk: { category: string | null; equityLimit: number | null }
  score: { value: number; label: string; parts: ScorePart[]; weakest: string | null } | null
  scoreHistory: { date: string; score: number }[]
  volatility: 'low' | 'moderate' | 'high' | 'very_high' | null
  yearlyReturn: number | null
  benchmarkReturn: number | null
  benchmarkName: string | null
  fees: { yearly: number | null; weightedTer: number | null; regularShare: number | null }
  biggest: { name: string; share: number; kind: string }[]
  losses: { name: string; loss: number; gainPct: number }[]
  flagCount: number
  goals: Goal[]
  todos: Todo[]
  decisions: Record<string, 'approved' | 'declined'>
  alerts: AlertRow[]
  planLabel: string
  /** Port Scan copy is CMS-owned; only the pieces the dashboard needs. */
  bandLabel: string | null
}
