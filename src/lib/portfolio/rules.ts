/**
 * Red-flag rules R01–R14. Thresholds and severities come from the config (CMS), so
 * compliance can tune them. Each flag carries its evidence; titles and "why it matters"
 * copy are CMS templates filled from that evidence, never written here.
 */
import type { ScanConfig, Severity } from './config'
import type { Metrics } from './metrics'
import type { EnrichedPortfolio } from './model'

export type FlagId = 'R01' | 'R02' | 'R03' | 'R04' | 'R05' | 'R06' | 'R07' | 'R08' | 'R09' | 'R10' | 'R11' | 'R12' | 'R13' | 'R14'

export type Flag = {
  id: FlagId
  severity: Severity
  /** Values used by the CMS title template, e.g. {name} and {pct}. Percentages are 0–100. */
  evidence: Record<string, string | number>
  /** Rupee amount the flag is about, used to order flags of equal severity. */
  amount: number
  holdings: string[]
}

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
const pct = (x: number) => Math.round(x * 1000) / 10

export function evaluateRules(m: Metrics, p: EnrichedPortfolio, config: ScanConfig): Flag[] {
  const f = config.flags
  const sev = (id: FlagId) => config.severities[id] ?? 'medium'
  const flags: Flag[] = []
  const add = (id: FlagId, evidence: Flag['evidence'], amount: number, holdings: string[] = [], severity = sev(id)) =>
    flags.push({ id, severity, evidence, amount, holdings })
  const holdingsBy = new Map(p.holdings.map((h) => [h.index, h]))

  // Never raise a flag from unvalued or stale data: R13 covers it instead.
  const reliable = m.weights.filter((w) => !holdingsBy.get(w.index)?.stale)

  // R01 single stock
  for (const w of reliable.filter((x) => x.type === 'equity' && x.weight > f.singleStock.high)) {
    add('R01', { name: w.name, pct: pct(w.weight), threshold: pct(f.singleStock.high) }, w.value, [w.name], w.weight > f.singleStock.critical ? 'critical' : sev('R01'))
  }

  // R02 top-5 concentration, counting only holdings that are not already diversified funds
  const concentrated = reliable.filter((w) => !w.diversified).slice(0, 5)
  const top5 = concentrated.reduce((a, w) => a + w.weight, 0)
  if (top5 > f.top5 && concentrated.length > 1) {
    add('R02', { pct: pct(top5), count: concentrated.length, threshold: pct(f.top5) }, top5 * m.totalValue, concentrated.map((w) => w.name))
  }

  // R03 sector (direct stocks and thematic funds)
  const topSector = m.sectors.top.find((s) => s.label !== 'Unclassified')
  if (topSector && topSector.weight > f.sector) {
    add('R03', { sector: topSector.label, pct: pct(topSector.weight), threshold: pct(f.sector) }, topSector.value)
  }

  const { equity, debt, gold, cash } = m.allocation.effective
  // R04 equity-heavy with a short horizon
  if (p.horizon === 'lt3' && equity > f.equityShortHorizon) add('R04', { pct: pct(equity) }, equity * m.totalValue)
  // R05 no debt or gold
  if (equity > 0 && debt + gold < 0.01 && cash < 0.99) add('R05', { equityPct: pct(equity) }, equity * m.totalValue)
  // R06 idle cash
  if (cash > f.cash) add('R06', { pct: pct(cash) }, cash * m.totalValue)
  // R07 regular plans
  if (m.cost.regularShare !== null && m.cost.regularShare > f.regularShare) {
    add('R07', { pct: pct(m.cost.regularShare) }, m.cost.regularShare * m.cost.fundValue)
  }
  // R08 too many funds in a category, or too many equity funds
  const crowded = Object.entries(m.funds.bySubCategory).filter(([, n]) => n > f.fundsPerCategory).sort((a, b) => b[1] - a[1])[0]
  if (crowded) add('R08', { count: crowded[1], category: crowded[0] }, 0)
  else if (m.funds.equityFunds > f.equityFunds) add('R08', { count: m.funds.equityFunds, category: 'equity' }, 0)
  // R09 small caps
  if (m.caps.small > f.smallCap) add('R09', { pct: pct(m.caps.small) }, m.caps.small * m.totalValue)
  // R10 volatility
  if (m.volatility.ratio !== null && m.volatility.ratio > f.volRatio) {
    add('R10', { ratio: Math.round(m.volatility.ratio * 100) / 100, annualPct: pct(m.volatility.annual ?? 0), label: m.volatility.label ?? '' }, 0)
  }
  // R11 behind the benchmark
  if (m.returns.gap !== null && m.returns.gap < -f.benchmarkGap) {
    add('R11', { gapPts: Math.round(-m.returns.gap * 1000) / 10, benchmark: p.benchmark.name }, 0)
  }
  // R12 holdings that are delisted, suspended, matured or segregated
  for (const s of m.statuses.filter((x) => x.status !== 'active')) add('R12', { name: s.name, status: s.status }, 0, [s.name])
  // R13 could not price everything
  if (1 - m.coverage > f.unpriced || m.stale.length) {
    add('R13', { coveragePct: pct(m.coverage), stale: m.stale.length, excluded: p.excluded.length }, 0)
  }
  // R14 thematic funds
  if (m.thematicShare > f.thematic) add('R14', { pct: pct(m.thematicShare) }, m.thematicShare * m.totalValue)

  return flags.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.amount - a.amount)
}
