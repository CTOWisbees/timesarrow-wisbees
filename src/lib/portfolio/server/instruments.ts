import 'server-only'

import { getPayloadClient } from '@/lib/payload'

import { normalizeName } from '../numbers'
import { isValidIsin } from '../isin'
import type { InstrumentType } from '../model'

export type InstrumentHit = {
  key: string
  name: string
  type: InstrumentType
  assetClass: string
  subCategory: string | null
  plan: 'direct' | 'regular' | null
  option: 'growth' | 'idcw' | null
  isin: string | null
  price: number | null
  priceDate: string | null
}

type Row = {
  key: string
  name: string
  instrument_type: InstrumentType
  asset_class: string
  sub_category: string | null
  plan: InstrumentHit['plan']
  option: InstrumentHit['option']
  isin: string | null
  last_price: string | null
  last_price_date: Date | null
}

const toHit = (r: Row): InstrumentHit => ({
  key: r.key,
  name: r.name,
  type: r.instrument_type,
  assetClass: r.asset_class,
  subCategory: r.sub_category,
  plan: r.plan,
  option: r.option,
  isin: r.isin,
  price: r.last_price === null ? null : Number(r.last_price),
  priceDate: r.last_price_date ? r.last_price_date.toISOString().slice(0, 10) : null,
})

const COLUMNS = `i.key, i.name, i.instrument_type, i.asset_class, i.sub_category, i.plan, i.option,
  i.last_price, i.last_price_date,
  (SELECT x.isin FROM market.instrument_isins x WHERE x.instrument_id = i.id ORDER BY x.isin LIMIT 1) AS isin`

// Schemes with no NAV for a year are wound up or merged; stocks have no price yet.
const LIVE = `(i.instrument_type = 'equity' OR i.last_price_date > current_date - 365)`

async function pool() {
  return (await getPayloadClient()).db.pool
}

/** Autocomplete by name, ISIN, AMFI code or NSE symbol. */
export async function searchInstruments(query: string, limit = 8): Promise<InstrumentHit[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const db = await pool()

  if (isValidIsin(q)) {
    const { rows } = await db.query<Row>(
      `SELECT ${COLUMNS} FROM market.instrument_isins x JOIN market.instruments i ON i.id = x.instrument_id WHERE x.isin = $1`,
      [q.toUpperCase()],
    )
    return rows.map(toHit)
  }

  const tokens = normalizeName(q).split(' ').filter(Boolean).slice(0, 6)
  if (!tokens.length) return []
  const conditions = tokens.map((_, n) => `i.normalized_name LIKE $${n + 3}`).join(' AND ')
  const { rows } = await db.query<Row>(
    `SELECT ${COLUMNS}
     FROM market.instruments i
     WHERE ${LIVE} AND ((${conditions}) OR upper(i.nse_symbol) = upper($1) OR i.amfi_code::text = $1)
     ORDER BY (upper(i.nse_symbol) = upper($1)) DESC NULLS LAST,
              word_similarity($2, i.normalized_name) DESC,
              (i.plan = 'direct') DESC NULLS LAST, (i.option = 'growth') DESC NULLS LAST, i.name
     LIMIT ${Math.min(limit, 20)}`,
    [q, tokens.join(' '), ...tokens.map((t) => `%${t}%`)],
  )
  return rows.map(toHit)
}

/** Looks up instruments by key ('mf:…' / 'eq:…'). */
export async function getInstruments(keys: string[]): Promise<Map<string, InstrumentHit>> {
  if (!keys.length) return new Map()
  const { rows } = await (await pool()).query<Row>(`SELECT ${COLUMNS} FROM market.instruments i WHERE i.key = ANY($1)`, [keys])
  return new Map(rows.map((r) => [r.key, toHit(r)]))
}
