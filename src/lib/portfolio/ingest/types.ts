/** What every adapter emits, before instrument resolution. No personal data. */
export type RawRecord = {
  name: string
  isin: string | null
  /** Units or shares. */
  quantity: number | null
  /** Statement price/NAV, if the file has one. */
  price: number | null
  /** Current value per the file. */
  value: number | null
  /** Total purchase cost per the file. */
  cost: number | null
  typeHint: 'equity' | 'mutual_fund' | 'etf' | 'bond' | 'cash' | null
  /** Hash of folio/demat id, only for merging duplicates. */
  accountHash: string | null
  /** Sheet and row (or page), for traceability. */
  sourceRef: string
}

export type RawTransaction = {
  isin: string | null
  name: string
  date: string
  type: 'buy' | 'sip' | 'sell' | 'switch_in' | 'switch_out' | 'dividend'
  amount: number
  units: number | null
}

export type ParseResult = {
  source: string
  asOf: string | null
  records: RawRecord[]
  transactions: RawTransaction[]
  warnings: string[]
}

export const FIELDS = ['name', 'isin', 'quantity', 'price', 'value', 'cost', 'avgPrice', 'type'] as const
export type Field = (typeof FIELDS)[number]
export type Mapping = Partial<Record<Field, number>>
