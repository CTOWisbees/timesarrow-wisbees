import type { HoldingInput, InstrumentType } from '@/lib/portfolio/model'

import type { ResolvedRow } from './actions'

/** One holding as the page edits it, before it is sent for scoring. */
export type Row = {
  uid: string
  key: string | null
  name: string
  type: InstrumentType
  subCategory: string | null
  plan: 'direct' | 'regular' | null
  option: 'growth' | 'idcw' | null
  isin: string | null
  price: number | null
  priceDate: string | null
  quantity: number | null
  investedAmount: number | null
  currentValue: number | null
  costValue: number | null
  suggestions: ResolvedRow['suggestions']
  /** Set when the row came from a file, for traceability in the review. */
  source?: string
  statementPrice?: number | null
  statementDate?: string | null
  accountHash?: string | null
}

let counter = 0
export const uid = () => `r${Date.now().toString(36)}${(counter++).toString(36)}`

export const fromResolved = (r: ResolvedRow, extra: Partial<Row> = {}): Row => ({
  uid: uid(),
  key: r.key,
  name: r.name,
  type: r.type,
  subCategory: r.subCategory,
  plan: r.plan,
  option: r.option,
  isin: r.isin,
  price: r.price,
  priceDate: r.priceDate,
  quantity: null,
  investedAmount: null,
  currentValue: null,
  costValue: null,
  suggestions: r.suggestions,
  ...extra,
})

export const cashRow = (amount: number | null = null): Row => ({
  uid: uid(),
  key: null,
  name: 'Cash and savings',
  type: 'cash',
  subCategory: null,
  plan: null,
  option: null,
  isin: null,
  price: 1,
  priceDate: null,
  quantity: amount,
  investedAmount: null,
  currentValue: null,
  costValue: null,
  suggestions: [],
})

/** Value shown in the table: live price × units, else the typed value. */
export function rowValue(r: Row): number | null {
  if (r.type === 'cash') return r.quantity
  if (r.price && r.quantity && r.type !== 'equity') return r.price * r.quantity
  if (r.statementPrice && r.quantity) return r.statementPrice * r.quantity
  return r.currentValue ?? null
}

/** Stocks, bonds and unmatched rows have no live price yet, so the user types a value. */
export const needsValue = (r: Row) => r.type !== 'cash' && (!r.key || !r.price || r.type === 'equity' || r.type === 'bond') && !r.statementPrice

export const isComplete = (r: Row) =>
  r.type === 'cash' ? Boolean(r.quantity) : needsValue(r) ? Boolean(r.currentValue || r.investedAmount) : Boolean(r.quantity || r.investedAmount)

export const toInput = (r: Row): HoldingInput => ({
  key: r.key,
  isin: r.isin,
  name: r.name,
  type: r.type,
  quantity: r.quantity,
  investedAmount: r.investedAmount,
  currentValue: r.currentValue,
  costValue: r.costValue,
  statementPrice: r.statementPrice ?? null,
  statementDate: r.statementDate ?? null,
  accountHash: r.accountHash ?? null,
  sourceRef: r.source ?? null,
})
