/**
 * Runs the free engine once over an enriched portfolio. The full result is stored;
 * `entitlements.ts` decides what each plan sees.
 */
import type { ScanConfig } from './config'
import { computeMetrics, type Metrics } from './metrics'
import type { EnrichedPortfolio } from './model'
import { evaluateRules, type Flag } from './rules'
import { type Score, scorePortfolio } from './scoring'

export const ENGINE_VERSION = '1.1.0'

export type DataQuality = {
  coverage: number
  stale: string[]
  proxied: string[]
  userValued: string[]
  excluded: { name: string; reason: string }[]
  volatilityExcluded: string[]
  warnings: string[]
}

export type AnalysisResult = {
  engineVersion: string
  configVersion: string
  asOf: string
  benchmark: { id: string; name: string; note: string | null }
  score: Score
  flags: Flag[]
  metrics: Metrics
  dataQuality: DataQuality
  /** Filled by the paid-tier job (look-through, drawdown, …); absent until it runs. */
  paid?: Record<string, unknown>
}

export function analyze(p: EnrichedPortfolio, config: ScanConfig): AnalysisResult {
  const metrics = computeMetrics(p, config)
  const flags = evaluateRules(metrics, p, config)
  const score = scorePortfolio(metrics, p, flags, config)
  return {
    engineVersion: ENGINE_VERSION,
    configVersion: config.version,
    asOf: p.asOf,
    benchmark: { id: p.benchmark.id, name: p.benchmark.name, note: p.benchmark.note },
    score,
    flags,
    metrics,
    dataQuality: {
      coverage: metrics.coverage,
      stale: metrics.stale,
      proxied: metrics.volatility.proxied,
      userValued: p.holdings.filter((h) => h.valueSource === 'user').map((h) => h.name),
      excluded: p.excluded,
      volatilityExcluded: metrics.volatility.excluded,
      warnings: p.warnings,
    },
  }
}
