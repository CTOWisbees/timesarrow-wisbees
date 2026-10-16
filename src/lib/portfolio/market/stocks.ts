/**
 * Stock master from AMFI's half-yearly "Average Market Capitalisation" list (ISIN, name,
 * NSE/BSE symbols, SEBI large/mid/small bucket), and sectors from the Nifty 500
 * constituents list. Both are downloaded by hand: the sites block scripted downloads.
 */
import { findHeader, parseCsv, readTable } from '../ingest/table'
import { isValidIsin } from '../isin'
import { normalizeName } from '../numbers'
import { type Pool, recordLoad } from './loaders'

const bucketOf = (text: string) => {
  const t = text.toLowerCase()
  if (t.includes('large')) return 'large'
  if (t.includes('mid')) return 'mid'
  if (t.includes('small')) return 'small'
  return null
}

export async function loadStockMaster(pool: Pool, bytes: Uint8Array, label: string) {
  const sheets = await readTable(bytes)
  type Row = { isin: string; name: string; nse: string | null; bse: string | null; bucket: string | null }
  const rows: Row[] = []
  for (const sheet of sheets) {
    const header = findHeader(sheet.rows, {
      isin: /^isin/i,
      name: /company\s*name|name of the company/i,
      nse: /^nse\s*symbol/i,
      bse: /^bse\s*(symbol|code)/i,
      bucket: /categori[sz]ation/i,
    })
    if (!header) continue
    for (const r of sheet.rows.slice(header.index + 1)) {
      const isin = String(r[header.cols.isin] ?? '').trim().toUpperCase()
      if (!isValidIsin(isin) || !isin.startsWith('INE')) continue
      const cell = (k: string) => (header.cols[k] === undefined ? null : String(r[header.cols[k]] ?? '').trim() || null)
      rows.push({ isin, name: cell('name') ?? isin, nse: cell('nse'), bse: cell('bse'), bucket: bucketOf(cell('bucket') ?? '') })
    }
  }
  if (!rows.length) throw new Error(`No stock rows found in ${label}. Expected AMFI's market-cap list with ISIN and Categorization columns.`)

  await pool.query(
    `INSERT INTO market.instruments (key, name, normalized_name, instrument_type, asset_class, nse_symbol, bse_code, market_cap_bucket, updated_at)
     SELECT 'eq:' || isin, name, nname, 'equity', 'equity', nse, bse, bucket, now()
     FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[]) AS t(isin, name, nname, nse, bse, bucket)
     ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name, normalized_name = EXCLUDED.normalized_name,
       nse_symbol = EXCLUDED.nse_symbol, bse_code = EXCLUDED.bse_code, market_cap_bucket = EXCLUDED.market_cap_bucket, updated_at = now()`,
    [
      rows.map((r) => r.isin),
      rows.map((r) => r.name),
      rows.map((r) => normalizeName(r.name)),
      rows.map((r) => r.nse),
      rows.map((r) => r.bse),
      rows.map((r) => r.bucket),
    ],
  )
  await pool.query(
    `INSERT INTO market.instrument_isins (isin, instrument_id)
     SELECT t.isin, i.id FROM unnest($1::text[]) AS t(isin) JOIN market.instruments i ON i.key = 'eq:' || t.isin
     ON CONFLICT (isin) DO UPDATE SET instrument_id = EXCLUDED.instrument_id`,
    [rows.map((r) => r.isin)],
  )
  await recordLoad(pool, 'amfi_market_cap', null, rows.length)
  return { stocks: rows.length, large: rows.filter((r) => r.bucket === 'large').length, mid: rows.filter((r) => r.bucket === 'mid').length }
}

/** Nifty 500 constituents CSV: Company Name, Industry, Symbol, Series, ISIN Code. */
export async function loadSectors(pool: Pool, csv: string) {
  const rows = parseCsv(csv)
  const header = findHeader(rows, { name: /company/i, industry: /industry|sector/i, symbol: /symbol/i, isin: /isin/i })
  if (!header) throw new Error('Expected columns: Company Name, Industry, Symbol, ISIN Code')
  const data = rows
    .slice(header.index + 1)
    .map((r) => ({ isin: String(r[header.cols.isin] ?? '').toUpperCase(), industry: String(r[header.cols.industry] ?? '').trim() }))
    .filter((r) => isValidIsin(r.isin) && r.industry)
  const res = await pool.query(
    `UPDATE market.instruments i SET sector = t.industry, industry = t.industry, updated_at = now()
     FROM unnest($1::text[], $2::text[]) AS t(isin, industry)
     WHERE i.key = 'eq:' || t.isin`,
    [data.map((r) => r.isin), data.map((r) => r.industry)],
  )
  await recordLoad(pool, 'sectors', null, res.rowCount ?? 0)
  return { rows: data.length, matched: res.rowCount }
}
