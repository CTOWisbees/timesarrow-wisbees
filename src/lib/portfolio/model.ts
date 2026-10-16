/**
 * Canonical Portfolio Scan model. Every input path (manual entry, CSV/XLSX, CAS PDF)
 * ends in `HoldingInput[]`; enrichment turns those into `EnrichedHolding[]`, the only
 * thing the engine sees. Amounts are INR.
 */
import { z } from 'zod'

import type { AssetClass, CapSplit, EffectiveClass } from './categories'

export const INSTRUMENT_TYPES = ['equity', 'mutual_fund', 'etf', 'bond', 'cash'] as const
export type InstrumentType = (typeof INSTRUMENT_TYPES)[number]

export const HOLDING_PERIODS = ['lt1', '1to3', '3to5', '5plus'] as const
export type HoldingPeriod = (typeof HOLDING_PERIODS)[number]

export const HORIZONS = ['lt3', '3to5', '5plus'] as const
export type Horizon = (typeof HORIZONS)[number]

const amount = z.number().finite().nonnegative().max(1e12)

/** One row as the user (or a parsed file) supplies it. */
export const holdingInputSchema = z.object({
  /** Instrument key from search/resolution ('mf:…', 'eq:…'); null = not matched. */
  key: z.string().max(40).nullable().optional(),
  isin: z.string().max(12).nullable().optional(),
  name: z.string().trim().min(1).max(200),
  type: z.enum(INSTRUMENT_TYPES),
  /** Units or shares. For cash, the amount. */
  quantity: z.number().finite().positive().max(1e12).nullable().optional(),
  /** Alternative to quantity when the user knows only what they put in. */
  investedAmount: amount.nullable().optional(),
  /** User's current value: used only when no price is available. */
  currentValue: amount.nullable().optional(),
  /** Total purchase cost, for returns. */
  costValue: amount.nullable().optional(),
  /** Statement price/value date for statement-sourced rows. */
  statementPrice: z.number().finite().positive().nullable().optional(),
  statementDate: z.string().nullable().optional(),
  /** Salted hash of folio/demat ID, only for de-duplication. */
  accountHash: z.string().max(80).nullable().optional(),
  sourceRef: z.string().max(120).nullable().optional(),
})
export type HoldingInput = z.infer<typeof holdingInputSchema>

export const transactionSchema = z.object({
  holdingIndex: z.number().int().nonnegative(),
  date: z.string(),
  type: z.enum(['buy', 'sell', 'sip', 'switch_in', 'switch_out', 'dividend']),
  units: z.number().finite().nullable().optional(),
  amount: z.number().finite(),
})
export type TransactionInput = z.infer<typeof transactionSchema>

export const portfolioInputSchema = z.object({
  holdings: z.array(holdingInputSchema).min(1).max(500),
  transactions: z.array(transactionSchema).max(20_000).optional(),
  investmentDate: z.string().nullable().optional(),
  holdingPeriod: z.enum(HOLDING_PERIODS).nullable().optional(),
  horizon: z.enum(HORIZONS).nullable().optional(),
  benchmarkId: z.string().max(40).nullable().optional(),
  sourceTypes: z.array(z.string().max(30)).max(10).optional(),
})
export type PortfolioInput = z.infer<typeof portfolioInputSchema>

/** A daily price series, ascending by date (ISO strings). */
export type Series = { dates: string[]; values: number[] }

export type EnrichedHolding = {
  index: number
  key: string | null
  isin: string | null
  name: string
  type: InstrumentType
  assetClass: AssetClass
  subCategory: string | null
  /** Effective split for allocation (funds by category; others 100% their class). */
  split: Partial<Record<EffectiveClass, number>>
  /** Market-cap split of the equity part (stocks: their bucket; funds: by category). */
  caps: CapSplit | null
  sector: string | null
  /** A diversified fund or broad index ETF: counted as one holding but already spread out. */
  diversified: boolean
  thematic: boolean
  plan: 'direct' | 'regular' | null
  quantity: number | null
  price: number | null
  priceDate: string | null
  /** null = could not be valued; excluded and reported in coverage. */
  marketValue: number | null
  valueSource: 'api' | 'user' | 'statement' | null
  costValue: number | null
  /** Percent, e.g. 0.65. Funds and ETFs only. */
  ter: number | null
  stale: boolean
  status: 'active' | 'suspended' | 'delisted' | 'merged' | 'matured' | 'segregated'
  /** Price history for volatility; `proxied` when a category index stands in. */
  series: Series | null
  proxied: boolean
  /**
   * Daily variance added on top of a proxy series: a single stock moves more than the
   * index standing in for it (company-specific risk). Zero when the series is its own.
   */
  idioVariance: number
}

export type EnrichedPortfolio = {
  asOf: string
  holdings: EnrichedHolding[]
  /** Holdings dropped before analysis (unresolved with no value, unsupported). */
  excluded: { name: string; reason: 'unpriced' | 'unsupported' | 'invalid' }[]
  transactions: TransactionInput[]
  investmentDate: string | null
  holdingPeriod: HoldingPeriod | null
  horizon: Horizon | null
  benchmark: { id: string; name: string; note: string | null; series: Series | null }
  warnings: string[]
}
