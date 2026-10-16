/**
 * Bulk loaders for the `market` schema. Used by the scripts in src/scripts/market (run
 * with `payload run`, outside Next), so no 'server-only' import here.
 */
import type { PostgresAdapter } from '@payloadcms/db-postgres'

import { type AmfiScheme, parseNavAll, parseNavHistory } from '../amfi'
import { normalizeName, parseDate } from '../numbers'

export type Pool = PostgresAdapter['pool']

const CHUNK = 2000

function* chunks<T>(rows: T[], size = CHUNK) {
  for (let i = 0; i < rows.length; i += size) yield rows.slice(i, i + size)
}

export const AMFI_NAV_URL = 'https://www.amfiindia.com/spages/NAVAll.txt'
export const AMFI_HISTORY_URL = 'https://portal.amfiindia.com/DownloadNAVHistoryReport_Po.aspx'

/** Growth options, ETFs and single-option legacy schemes have a NAV series worth keeping. */
const keepsHistory = (s: Pick<AmfiScheme, 'option'>) => s.option !== 'idcw'

export async function fetchText(url: string, timeoutMs = 180_000): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { 'User-Agent': 'WisBees-PortfolioScan/1.0' } })
  if (!res.ok) throw new Error(`${url} returned ${res.status}`)
  return res.text()
}

/** Upserts the fund master from NAVAll.txt and records today's NAVs. */
export async function loadAmfiNav(pool: Pool, text: string) {
  const schemes = parseNavAll(text).filter((s) => s.name)
  for (const batch of chunks(schemes)) {
    await pool.query(
      `INSERT INTO market.instruments
         (key, amfi_code, name, normalized_name, instrument_type, asset_class, sub_category, category_raw, amc,
          plan, option, is_index, is_thematic, last_price, last_price_date, updated_at)
       SELECT 'mf:' || code, code, name, nname, itype, aclass, sub, raw, amc, plan, opt, idx, thematic, nav, d, now()
       FROM unnest($1::int[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::text[], $8::text[],
                   $9::text[], $10::text[], $11::bool[], $12::bool[], $13::numeric[], $14::date[])
         AS t(code, name, nname, itype, aclass, sub, raw, amc, plan, opt, idx, thematic, nav, d)
       ON CONFLICT (key) DO UPDATE SET
         name = EXCLUDED.name, normalized_name = EXCLUDED.normalized_name, instrument_type = EXCLUDED.instrument_type,
         asset_class = EXCLUDED.asset_class, sub_category = EXCLUDED.sub_category, category_raw = EXCLUDED.category_raw,
         amc = EXCLUDED.amc, plan = EXCLUDED.plan, option = EXCLUDED.option, is_index = EXCLUDED.is_index,
         is_thematic = EXCLUDED.is_thematic,
         last_price = COALESCE(EXCLUDED.last_price, market.instruments.last_price),
         last_price_date = COALESCE(EXCLUDED.last_price_date, market.instruments.last_price_date),
         updated_at = now()`,
      [
        batch.map((s) => s.amfiCode),
        batch.map((s) => s.name),
        batch.map((s) => normalizeName(s.name)),
        batch.map((s) => s.category.instrumentType),
        batch.map((s) => s.category.assetClass),
        batch.map((s) => s.category.subCategory),
        batch.map((s) => s.categoryRaw),
        batch.map((s) => s.amc),
        batch.map((s) => s.plan),
        batch.map((s) => s.option),
        batch.map((s) => s.category.isIndex),
        batch.map((s) => s.category.isThematic),
        batch.map((s) => (s.nav && s.nav > 0 ? s.nav : null)),
        batch.map((s) => (s.nav && s.nav > 0 ? s.date : null)),
      ],
    )
  }

  // A few ISINs appear under two scheme codes (re-coded or wound-up schemes): keep the
  // one with a current NAV, else the newer code.
  const byIsin = new Map<string, AmfiScheme>()
  for (const s of schemes) {
    for (const isin of s.isins) {
      const prev = byIsin.get(isin)
      const better = !prev || (Boolean(s.nav) && !prev.nav) || (Boolean(s.nav) === Boolean(prev.nav) && s.amfiCode > prev.amfiCode)
      if (better) byIsin.set(isin, s)
    }
  }
  const isinRows = [...byIsin].map(([isin, s]) => [isin, s.amfiCode] as const)
  for (const batch of chunks(isinRows)) {
    await pool.query(
      `INSERT INTO market.instrument_isins (isin, instrument_id)
       SELECT t.isin, i.id FROM unnest($1::text[], $2::int[]) AS t(isin, code)
       JOIN market.instruments i ON i.amfi_code = t.code
       ON CONFLICT (isin) DO UPDATE SET instrument_id = EXCLUDED.instrument_id`,
      [batch.map((r) => r[0]), batch.map((r) => r[1])],
    )
  }

  const priced = schemes.filter((s) => keepsHistory(s) && s.nav && s.nav > 0 && s.date)
  await insertPrices(pool, priced.map((s) => ({ amfiCode: s.amfiCode, nav: s.nav!, date: s.date! })))

  const asOf = priced.map((s) => s.date!).sort().at(-1) ?? null
  await recordLoad(pool, 'amfi_nav', asOf, schemes.length)
  return { schemes: schemes.length, isins: isinRows.length, prices: priced.length, asOf }
}

async function insertPrices(pool: Pool, rows: { amfiCode: number; nav: number; date: string }[]) {
  let inserted = 0
  for (const batch of chunks(rows, 5000)) {
    const res = await pool.query(
      `INSERT INTO market.prices (instrument_id, d, price)
       SELECT i.id, t.d, t.nav FROM unnest($1::int[], $2::date[], $3::numeric[]) AS t(code, d, nav)
       JOIN market.instruments i ON i.amfi_code = t.code AND i.option IS DISTINCT FROM 'idcw'
       ON CONFLICT DO NOTHING`,
      [batch.map((r) => r.amfiCode), batch.map((r) => r.date), batch.map((r) => r.nav)],
    )
    inserted += res.rowCount ?? 0
  }
  return inserted
}

// AMFI wants DD-Mon-YYYY with three-letter months ("Sep", not the en-GB "Sept").
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const fmt = (d: Date) => `${String(d.getUTCDate()).padStart(2, '0')}-${MON[d.getUTCMonth()]}-${d.getUTCFullYear()}`

/**
 * Loads NAV history for the last `days` days in 30-day windows (AMFI allows up to 90,
 * but each 90-day file is ~80 MB). Only schemes already in the master are kept.
 */
export async function loadAmfiHistory(pool: Pool, days: number, log: (msg: string) => void = () => {}) {
  const end = new Date()
  let total = 0
  for (let offset = days; offset > 0; offset -= 30) {
    const from = new Date(end.getTime() - offset * 86_400_000)
    const to = new Date(end.getTime() - Math.max(offset - 29, 0) * 86_400_000)
    const url = `${AMFI_HISTORY_URL}?frmdt=${fmt(from)}&todt=${fmt(to)}`
    const text = await fetchText(url, 600_000)
    const n = await insertPrices(pool, [...parseNavHistory(text)])
    total += n
    log(`${fmt(from)} → ${fmt(to)}: ${n} new prices`)
  }
  await recordLoad(pool, 'amfi_history', end.toISOString().slice(0, 10), total)
  return total
}

/** Benchmarks: index funds' NAVs stand in for total-return indices (labelled as such in the UI). */
export const BENCHMARKS = [
  { id: 'NIFTY50_TRI', name: 'Nifty 50', components: [{ instrumentKey: 'mf:120716', weight: 1 }], sort: 1 },
  { id: 'SENSEX_TRI', name: 'BSE Sensex', components: [{ instrumentKey: 'mf:149803', weight: 1 }], sort: 2 },
  { id: 'NIFTY500_TRI', name: 'Nifty 500', components: [{ instrumentKey: 'mf:147625', weight: 1 }], sort: 3 },
  { id: 'MIDCAP150_TRI', name: 'Nifty Midcap 150', components: [{ instrumentKey: 'mf:147622', weight: 1 }], sort: 4 },
  {
    id: 'HYBRID_65_35',
    name: 'Hybrid 65/35 (Nifty 50 and short-term government bonds)',
    components: [
      { instrumentKey: 'mf:120716', weight: 0.65 },
      { instrumentKey: 'mf:151365', weight: 0.35 },
    ],
    sort: 5,
  },
  { id: 'SMALLCAP250_TRI', name: 'Nifty Smallcap 250', components: [{ instrumentKey: 'mf:147623', weight: 1 }], sort: 90, selectable: false },
  { id: 'DEBT_SHORT', name: 'Short-term government bonds', components: [{ instrumentKey: 'mf:151365', weight: 1 }], sort: 91, selectable: false },
  // Regular plan of the same index fund: history from 2006, for 2008 stress tests.
  { id: 'NIFTY50_LONG', name: 'Nifty 50 (long history)', components: [{ instrumentKey: 'mf:100822', weight: 1 }], sort: 92, selectable: false },
] as const

const PROXY_NOTE = 'Tracked through an index fund’s NAV, which includes dividends and is net of the fund’s costs.'

export async function loadBenchmarks(pool: Pool) {
  for (const b of BENCHMARKS) {
    await pool.query(
      `INSERT INTO market.benchmarks (id, name, components, note, selectable, sort) VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, components = EXCLUDED.components, note = EXCLUDED.note,
         selectable = EXCLUDED.selectable, sort = EXCLUDED.sort`,
      [b.id, b.name, JSON.stringify(b.components), PROXY_NOTE, 'selectable' in b ? b.selectable : true, b.sort],
    )
  }
  return BENCHMARKS.length
}

export async function recordLoad(pool: Pool, source: string, asOf: string | null, rows: number) {
  await pool.query(
    `INSERT INTO market.loads (source, as_of, rows, loaded_at) VALUES ($1, $2, $3, now())
     ON CONFLICT (source) DO UPDATE SET as_of = EXCLUDED.as_of, rows = EXCLUDED.rows, loaded_at = now()`,
    [source, asOf, rows],
  )
}

/**
 * Full NAV history for one scheme. Source: mfapi.in (a free community mirror of AMFI
 * data, no uptime promise; replace with a licensed feed before launch). Marks the
 * instrument so it is fetched once, then kept fresh by the daily NAV load.
 */
export async function loadSchemeHistory(pool: Pool, amfiCode: number) {
  const res = await fetch(`https://api.mfapi.in/mf/${amfiCode}`, { signal: AbortSignal.timeout(60_000) })
  if (!res.ok) throw new Error(`mfapi ${amfiCode} returned ${res.status}`)
  const body = (await res.json()) as { data?: { date: string; nav: string }[] }
  const rows = (body.data ?? [])
    .map((r) => ({ amfiCode, nav: Number(r.nav), date: parseDate(r.date) }))
    .filter((r): r is { amfiCode: number; nav: number; date: string } => r.nav > 0 && r.date !== null)
  const inserted = await insertPrices(pool, rows)
  await pool.query(`UPDATE market.instruments SET long_history_at = now() WHERE amfi_code = $1`, [amfiCode])
  return { days: rows.length, inserted }
}

/** Full history for the benchmark proxy funds, so returns can be compared over many years. */
export async function loadBenchmarkHistory(pool: Pool, log: (msg: string) => void = () => {}) {
  const keys = [...new Set(BENCHMARKS.flatMap((b) => b.components.map((c) => c.instrumentKey)))]
  let total = 0
  for (const key of keys) {
    const { days, inserted } = await loadSchemeHistory(pool, Number(key.replace('mf:', '')))
    total += inserted
    log(`${key}: ${days} days, ${inserted} new`)
  }
  await recordLoad(pool, 'benchmark_history', new Date().toISOString().slice(0, 10), total)
  return total
}
