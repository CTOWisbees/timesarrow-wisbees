/**
 * Health score: a weighted average of five 0–100 sub-scores. Sub-scores without valid
 * input are "not applicable" and the remaining weights are rescaled. A critical red
 * flag caps the score; low data coverage makes it provisional (shown as a range).
 */
import type { ScanConfig } from './config'
import { interp } from './math'
import type { Metrics } from './metrics'
import type { EnrichedPortfolio } from './model'
import type { Flag } from './rules'

export type SubScoreId = 'diversification' | 'concentration' | 'risk' | 'assetMix' | 'cost'
export type Band = 'healthy' | 'fair' | 'attention' | 'at_risk'

export type SubScore = {
  id: SubScoreId
  score: number | null
  /** What the score is built from, for the "why" panel. */
  evidence: Record<string, number | string | null>
  penalties?: { id: string; points: number }[]
}

export type Score = {
  score: number
  band: Band
  provisional: boolean
  range: [number, number] | null
  capped: boolean
  subScores: SubScore[]
}

const r1 = (x: number) => Math.round(x * 10) / 10

export function bandOf(score: number, config: ScanConfig): Band {
  const { healthy, fair, attention } = config.bands
  return score >= healthy ? 'healthy' : score >= fair ? 'fair' : score >= attention ? 'attention' : 'at_risk'
}

export function scorePortfolio(m: Metrics, p: EnrichedPortfolio, flags: Flag[], config: ScanConfig): Score {
  const c = config

  // Diversification: effective holdings and, when there is equity, effective sectors.
  const holdingsPart = interp(m.concentration.effectiveExposures, c.diversification.holdings.bad, c.diversification.holdings.good)
  const sectorsPart =
    m.sectors.effectiveCount === null ? null : interp(m.sectors.effectiveCount, c.diversification.sectors.bad, c.diversification.sectors.good)
  const diversification: SubScore = {
    id: 'diversification',
    score:
      m.holdingsCount < 1
        ? null
        : sectorsPart === null
          ? holdingsPart
          : c.diversification.holdingsShare * holdingsPart + (1 - c.diversification.holdingsShare) * sectorsPart,
    evidence: { effectiveHoldings: r1(m.concentration.effectiveExposures), effectiveSectors: m.sectors.effectiveCount === null ? null : r1(m.sectors.effectiveCount) },
  }

  // Concentration: a diversified fund at the top is less of a worry, so its thresholds stretch.
  const top1 = m.weights[0]
  const top1Mult = top1?.diversified ? c.concentration.diversifiedMultiplier : 1
  const top5Mult = m.concentration.top5 > 0 ? 1 + (c.concentration.diversifiedMultiplier - 1) * (m.concentration.top5Diversified / m.concentration.top5) : 1
  const concentration: SubScore = {
    id: 'concentration',
    score: top1
      ? // Doubled thresholds can exceed 100% on purpose: five diversified funds at 100% still score well.
        0.5 * interp(top1.weight, c.concentration.top1.bad * top1Mult, c.concentration.top1.good * top1Mult) +
        0.5 * interp(m.concentration.top5, c.concentration.top5.bad * top5Mult, c.concentration.top5.good * top5Mult)
      : null,
    evidence: { top1Pct: top1 ? r1(top1.weight * 100) : null, top5Pct: r1(m.concentration.top5 * 100) },
  }

  const risk: SubScore = {
    id: 'risk',
    score: m.volatility.ratio === null ? null : interp(m.volatility.ratio, c.risk.ratio.bad, c.risk.ratio.good),
    evidence: {
      ratio: m.volatility.ratio === null ? null : Math.round(m.volatility.ratio * 100) / 100,
      annualPct: m.volatility.annual === null ? null : r1(m.volatility.annual * 100),
      label: m.volatility.label,
    },
  }

  // Asset mix: 100 minus penalties.
  const e = m.allocation.effective
  const a = c.assetMix
  const penalties: { id: string; points: number }[] = []
  const maxClass = Math.max(e.equity, e.debt, e.gold, e.cash, e.other)
  if (maxClass > 0.9) penalties.push({ id: 'one_class_above_90', points: a.oneClassAbove90 })
  else if (maxClass > 0.8) penalties.push({ id: 'one_class_80_90', points: a.oneClass80to90 })
  if (e.equity > 0.7 && e.debt + e.gold < 0.01) penalties.push({ id: 'equity_no_debt_gold', points: a.equityNoDebtGold })
  if (e.cash > 0.25) penalties.push({ id: 'cash_above_25', points: a.cashAbove25 })
  else if (e.cash > 0.1) penalties.push({ id: 'cash_10_25', points: a.cash10to25 })
  if (p.horizon === 'lt3' && e.equity > 0.6) penalties.push({ id: 'short_horizon_equity', points: a.shortHorizonEquity })
  if (e.gold > 0.2) penalties.push({ id: 'gold_above_20', points: a.goldAbove20 })
  if (m.thematicShare > 0.3) penalties.push({ id: 'thematic_above_30', points: a.thematicAbove30 })
  const assetMix: SubScore = {
    id: 'assetMix',
    score: m.holdingsCount ? Math.max(0, 100 - penalties.reduce((s, x) => s + x.points, 0)) : null,
    evidence: { equityPct: r1(e.equity * 100), debtPct: r1(e.debt * 100), goldPct: r1(e.gold * 100), cashPct: r1(e.cash * 100) },
    penalties,
  }

  // Cost: weighted TER and the share in regular plans. Not applicable without funds.
  const terScore = m.cost.weightedTer === null ? null : interp(m.cost.weightedTer, c.cost.ter.bad, c.cost.ter.good)
  const regScore = m.cost.regularShare === null ? null : interp(m.cost.regularShare, c.cost.regularShare.bad, c.cost.regularShare.good)
  const cost: SubScore = {
    id: 'cost',
    score: terScore === null ? null : regScore === null ? terScore : c.cost.terShare * terScore + (1 - c.cost.terShare) * regScore,
    evidence: {
      terPct: m.cost.weightedTer === null ? null : Math.round(m.cost.weightedTer * 100) / 100,
      regularPct: m.cost.regularShare === null ? null : r1(m.cost.regularShare * 100),
    },
  }

  const subScores = [diversification, concentration, risk, assetMix, cost]
  const applicable = subScores.filter((s) => s.score !== null)
  const totalWeight = applicable.reduce((s, x) => s + c.weights[x.id], 0)
  let score = totalWeight ? applicable.reduce((s, x) => s + c.weights[x.id] * x.score!, 0) / totalWeight : 0
  const capped = flags.some((f) => f.severity === 'critical') && score > c.criticalCap
  if (capped) score = c.criticalCap
  score = Math.round(score)

  // Provisional: the wider the gap in coverage, the wider the range.
  const provisional = m.coverage < c.provisionalBelowCoverage
  const spread = provisional ? Math.round((1 - m.coverage) * 30) : 0
  return {
    score,
    band: bandOf(score, c),
    provisional,
    range: provisional ? [Math.max(0, score - spread), Math.min(100, score + spread)] : null,
    capped,
    subScores: subScores.map((s) => ({ ...s, score: s.score === null ? null : Math.round(s.score) })),
  }
}
