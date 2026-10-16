/**
 * Scoring and rule thresholds. These defaults are the spec's starting points; the
 * `scan-config` CMS global overrides them (compliance tunes without a deploy), and the
 * version is stored with every result. Percentages are fractions (0.2 = 20%).
 */

export type Range = { bad: number; good: number }
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export type ScanConfig = {
  version: string
  weights: { diversification: number; concentration: number; risk: number; assetMix: number; cost: number }
  diversification: { holdings: Range; sectors: Range; holdingsShare: number; fundSlices: number }
  concentration: { top1: Range; top5: Range; diversifiedMultiplier: number }
  risk: { ratio: Range; labels: { low: number; moderate: number; high: number } }
  cost: { ter: Range; regularShare: Range; terShare: number }
  assetMix: {
    oneClassAbove90: number
    oneClass80to90: number
    equityNoDebtGold: number
    cashAbove25: number
    cash10to25: number
    shortHorizonEquity: number
    goldAbove20: number
    thematicAbove30: number
  }
  bands: { healthy: number; fair: number; attention: number }
  criticalCap: number
  provisionalBelowCoverage: number
  staleTradingDays: number
  minHistoryDays: number
  flags: {
    singleStock: { high: number; critical: number }
    top5: number
    sector: number
    equityShortHorizon: number
    cash: number
    regularShare: number
    fundsPerCategory: number
    equityFunds: number
    smallCap: number
    volRatio: number
    benchmarkGap: number
    unpriced: number
    thematic: number
  }
  severities: Record<string, Severity>
  freeFlagsShown: number
  limits: { maxHoldings: number; maxFileMb: number }
  paid: { assumedReturn: number; dragYears: number; shocks: number[]; singleStockFall: number; cashYield: number; riskFreeRate: number }
}

export const DEFAULT_CONFIG: ScanConfig = {
  version: '2026-10-11.1',
  weights: { diversification: 25, concentration: 20, risk: 20, assetMix: 20, cost: 15 },
  diversification: { holdings: { bad: 3, good: 15 }, sectors: { bad: 2, good: 8 }, holdingsShare: 0.6, fundSlices: 10 },
  concentration: { top1: { bad: 0.4, good: 0.1 }, top5: { bad: 0.8, good: 0.4 }, diversifiedMultiplier: 2 },
  risk: { ratio: { bad: 1.5, good: 0.8 }, labels: { low: 0.6, moderate: 1.0, high: 1.3 } },
  cost: { ter: { bad: 2.0, good: 0.5 }, regularShare: { bad: 0.6, good: 0 }, terShare: 0.7 },
  assetMix: {
    oneClassAbove90: 30,
    oneClass80to90: 15,
    equityNoDebtGold: 15,
    cashAbove25: 20,
    cash10to25: 10,
    shortHorizonEquity: 25,
    goldAbove20: 10,
    thematicAbove30: 15,
  },
  bands: { healthy: 80, fair: 60, attention: 40 },
  criticalCap: 59,
  provisionalBelowCoverage: 0.7,
  staleTradingDays: 3,
  minHistoryDays: 120,
  flags: {
    singleStock: { high: 0.2, critical: 0.35 },
    top5: 0.6,
    sector: 0.35,
    equityShortHorizon: 0.9,
    cash: 0.2,
    regularShare: 0.3,
    fundsPerCategory: 3,
    equityFunds: 8,
    smallCap: 0.25,
    volRatio: 1.3,
    benchmarkGap: 0.03,
    unpriced: 0.1,
    thematic: 0.3,
  },
  severities: {
    R01: 'high',
    R02: 'high',
    R03: 'medium',
    R04: 'high',
    R05: 'medium',
    R06: 'low',
    R07: 'medium',
    R08: 'medium',
    R09: 'medium',
    R10: 'medium',
    R11: 'medium',
    R12: 'high',
    R13: 'info',
    R14: 'medium',
  },
  freeFlagsShown: 3,
  limits: { maxHoldings: 500, maxFileMb: 10 },
  paid: { assumedReturn: 0.1, dragYears: 10, shocks: [-0.1, -0.2, -0.3], singleStockFall: 0.3, cashYield: 0.03, riskFreeRate: 0.065 },
}

type Pct = number | null | undefined
type CmsRange = { bad?: Pct; good?: Pct } | null | undefined
/** The CMS global as stored (whole-number percentages), loosely typed so scripts can use it too. */
export type ScanConfigDoc = {
  updatedAt?: string | null
  weights?: Partial<Record<keyof ScanConfig['weights'], Pct>> | null
  effectiveHoldings?: CmsRange
  effectiveSectors?: CmsRange
  top1?: CmsRange
  top5?: CmsRange
  volRatio?: CmsRange
  ter?: CmsRange
  regularShare?: CmsRange
  bands?: Partial<Record<keyof ScanConfig['bands'], Pct>> | null
  criticalCap?: Pct
  provisionalBelow?: Pct
  penalties?: Partial<Record<keyof ScanConfig['assetMix'], Pct>> | null
  flags?: Record<string, Pct> | null
  severities?: Record<string, string | null | undefined> | null
  freeFlagsShown?: Pct
  paid?: Record<string, Pct> | null
  maxHoldings?: Pct
  maxFileMb?: Pct
}

/** Maps the CMS global onto the engine config. Missing values fall back to the defaults. */
export function configFromCms(doc: ScanConfigDoc | null | undefined): ScanConfig {
  const d = DEFAULT_CONFIG
  if (!doc) return d
  const n = (v: Pct, fallback: number, scale = 1) => (typeof v === 'number' && Number.isFinite(v) ? v / scale : fallback)
  const r = (v: CmsRange, fallback: Range, scale = 1): Range => ({ bad: n(v?.bad, fallback.bad, scale), good: n(v?.good, fallback.good, scale) })
  const f = doc.flags ?? {}
  const p = doc.paid ?? {}
  const severities = { ...d.severities }
  for (const [k, v] of Object.entries(doc.severities ?? {})) {
    if (v && ['critical', 'high', 'medium', 'low', 'info'].includes(v)) severities[k] = v as Severity
  }
  return {
    version: doc.updatedAt ? `cms-${doc.updatedAt}` : d.version,
    weights: {
      diversification: n(doc.weights?.diversification, d.weights.diversification),
      concentration: n(doc.weights?.concentration, d.weights.concentration),
      risk: n(doc.weights?.risk, d.weights.risk),
      assetMix: n(doc.weights?.assetMix, d.weights.assetMix),
      cost: n(doc.weights?.cost, d.weights.cost),
    },
    diversification: { ...d.diversification, holdings: r(doc.effectiveHoldings, d.diversification.holdings), sectors: r(doc.effectiveSectors, d.diversification.sectors) },
    concentration: { ...d.concentration, top1: r(doc.top1, d.concentration.top1, 100), top5: r(doc.top5, d.concentration.top5, 100) },
    risk: { ...d.risk, ratio: r(doc.volRatio, d.risk.ratio) },
    cost: { ...d.cost, ter: r(doc.ter, d.cost.ter), regularShare: r(doc.regularShare, d.cost.regularShare, 100) },
    assetMix: Object.fromEntries(Object.entries(d.assetMix).map(([k, v]) => [k, n(doc.penalties?.[k as keyof ScanConfig['assetMix']], v)])) as ScanConfig['assetMix'],
    bands: { healthy: n(doc.bands?.healthy, d.bands.healthy), fair: n(doc.bands?.fair, d.bands.fair), attention: n(doc.bands?.attention, d.bands.attention) },
    criticalCap: n(doc.criticalCap, d.criticalCap),
    provisionalBelowCoverage: n(doc.provisionalBelow, d.provisionalBelowCoverage, 100),
    staleTradingDays: d.staleTradingDays,
    minHistoryDays: d.minHistoryDays,
    flags: {
      singleStock: { high: n(f.singleStock, d.flags.singleStock.high, 100), critical: n(f.singleStockCritical, d.flags.singleStock.critical, 100) },
      top5: n(f.top5, d.flags.top5, 100),
      sector: n(f.sector, d.flags.sector, 100),
      equityShortHorizon: n(f.equityShortHorizon, d.flags.equityShortHorizon, 100),
      cash: n(f.cash, d.flags.cash, 100),
      regularShare: n(f.regularShare, d.flags.regularShare, 100),
      fundsPerCategory: n(f.fundsPerCategory, d.flags.fundsPerCategory),
      equityFunds: n(f.equityFunds, d.flags.equityFunds),
      smallCap: n(f.smallCap, d.flags.smallCap, 100),
      volRatio: n(f.volRatio, d.flags.volRatio),
      benchmarkGap: n(f.benchmarkGap, d.flags.benchmarkGap, 100),
      unpriced: n(f.unpriced, d.flags.unpriced, 100),
      thematic: n(f.thematic, d.flags.thematic, 100),
    },
    severities,
    freeFlagsShown: n(doc.freeFlagsShown, d.freeFlagsShown),
    limits: { maxHoldings: n(doc.maxHoldings, d.limits.maxHoldings), maxFileMb: n(doc.maxFileMb, d.limits.maxFileMb) },
    paid: {
      ...d.paid,
      assumedReturn: n(p.assumedReturn, d.paid.assumedReturn, 100),
      dragYears: n(p.dragYears, d.paid.dragYears),
      singleStockFall: n(p.singleStockFall, d.paid.singleStockFall, 100),
      cashYield: n(p.cashYield, d.paid.cashYield, 100),
      riskFreeRate: n(p.riskFreeRate, d.paid.riskFreeRate, 100),
    },
  }
}
