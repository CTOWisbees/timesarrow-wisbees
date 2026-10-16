/** Shapes of the paid card data, shared by the server job and the client renderers. */
import type { RebalanceClass } from './paid'

export type Point = { date: string; portfolio: number | null; benchmark: number | null }

export type OverlapCard = {
  level: 'holding' | 'category'
  pairs: { a: string; b: string; overlap: number | null; category: string | null }[]
  topExposures: { name: string; weight: number }[]
  fundsWithData: number
  funds: number
}
export type DragCard = {
  funds: { name: string; value: number; terRegular: number; terDirect: number; drag: number }[]
  total: number
  assumedReturn: number
  years: number
}
export type DrawdownCard = {
  maxDrawdown: number
  peakDate: string
  troughDate: string
  recoveryDays: number | null
  current: number
  benchmarkMaxDrawdown: number | null
  from: string
  points: Point[]
  estimated: string[]
}
export type ReturnsCard = { kind: 'xirr' | 'rolling'; points: Point[] }
export type StressCard = {
  value: number
  portfolioBeta: number
  shocks: { shock: number; loss: number; benchmarkLoss: number }[]
  historical: { id: string; label: string; loss: number | null; benchmarkLoss: number | null; estimated: string[] }[]
}
export type RatiosCard = {
  sharpe: number
  sortino: number
  beta: number
  alpha: number
  annualReturn: number
  annualVol: number
  benchmarkSharpe: number | null
  years: number
  riskFree: number
}
export type RebalanceCard = {
  total: number
  current: Record<RebalanceClass, number>
  presets: { id: string; label: string; target: Record<RebalanceClass, number> }[]
}
export type TaxCard =
  | { available: false; reason: 'needs_transactions' }
  | {
      available: true
      fy: string
      rows: { name: string; kind: 'equity' | 'debt'; shortTermGain: number; longTermGain: number; tax: number }[]
      totalTax: number
      headroom: number
      assumptions: string[]
    }
export type FlagOnlyCard = { available: true }

export const REBALANCE_PRESETS: RebalanceCard['presets'] = [
  { id: 'conservative', label: 'Conservative', target: { equity: 0.3, debt: 0.6, gold: 0.05, cash: 0.05 } },
  { id: 'balanced', label: 'Balanced', target: { equity: 0.5, debt: 0.4, gold: 0.07, cash: 0.03 } },
  { id: 'growth', label: 'Growth', target: { equity: 0.7, debt: 0.22, gold: 0.05, cash: 0.03 } },
]
