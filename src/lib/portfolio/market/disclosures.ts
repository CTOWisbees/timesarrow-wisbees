/**
 * Fund look-through from AMC monthly portfolio disclosures (XLSX, usually one sheet
 * per scheme). Each sheet lists instruments with ISIN, industry or rating and "% to
 * net assets". Layouts differ by AMC, so the header is found by its column names and
 * each import names the scheme it belongs to.
 */
import { findHeader, readTable } from '../ingest/table'
import { isValidIsin } from '../isin'
import { parseAmount } from '../numbers'
import { type Pool, recordLoad } from './loaders'

const RATING = /^(sov|sovereign|aaa|aa\+?|aa-|a1\+?|a\+?|a-|bbb|crisil|icra|care|ind|fitch|unrated)/i

export async function loadFundHoldings(pool: Pool, bytes: Uint8Array, amfiCode: number, sheetName: string | null, asOf: string) {
  const sheets = await readTable(bytes)
  const sheet = sheetName ? sheets.find((s) => s.name.toLowerCase() === sheetName.toLowerCase()) : sheets[0]
  if (!sheet) throw new Error(`Sheet not found. Sheets: ${sheets.map((s) => s.name).join(', ')}`)
  const header = findHeader(sheet.rows, {
    name: /name of (the )?instrument|instrument|security|company/i,
    isin: /^isin/i,
    industry: /industry|rating|sector/i,
    weight: /%\s*(to|of)\s*(net\s*)?(assets|nav|aum)|% to nav|% of net assets/i,
  })
  if (!header || header.cols.weight === undefined) throw new Error('Expected columns: instrument name, ISIN, industry/rating and % to net assets')
  type Row = { isin: string | null; name: string; asset: string; sector: string | null; rating: string | null; weight: number }
  const rows: Row[] = []
  for (const r of sheet.rows.slice(header.index + 1)) {
    const name = String(r[header.cols.name] ?? '').trim()
    const isinRaw = String(r[header.cols.isin] ?? '').trim().toUpperCase()
    const industry = String(r[header.cols.industry] ?? '').trim()
    let w = parseAmount(r[header.cols.weight])
    if (!name || w === null || w <= 0 || /^(total|grand total|sub ?total|net assets)/i.test(name)) continue
    // Some AMCs give 0.0523 for 5.23%, most give 5.23.
    if (w > 1) w /= 100
    const isin = isValidIsin(isinRaw) ? isinRaw : null
    const isRating = RATING.test(industry)
    const asset = /treps|cblo|reverse repo|net current|cash/i.test(name) ? 'cash' : isin?.startsWith('INE') && !isRating ? 'equity' : 'debt'
    rows.push({ isin, name, asset, sector: asset === 'equity' ? industry || null : null, rating: isRating ? industry : null, weight: w })
  }
  if (!rows.length) throw new Error('No holdings found on that sheet')

  const { rows: found } = await pool.query<{ id: string }>(`SELECT id FROM market.instruments WHERE amfi_code = $1`, [amfiCode])
  if (!found[0]) throw new Error(`No scheme with AMFI code ${amfiCode}; run pnpm market nav first`)
  // Direct and Regular plans (and options) of a scheme hold the same portfolio.
  const { rows: siblings } = await pool.query<{ id: string }>(
    `SELECT t.id FROM market.instruments s JOIN market.instruments t ON t.normalized_name = s.normalized_name WHERE s.id = $1`,
    [found[0].id],
  )
  const ids = siblings.map((s) => s.id)
  await pool.query(`DELETE FROM market.fund_holdings WHERE fund_instrument_id = ANY($1::bigint[]) AND as_of = $2`, [ids, asOf])
  for (const id of ids) {
    await pool.query(
      `INSERT INTO market.fund_holdings (fund_instrument_id, as_of, holding_isin, holding_name, asset_class, sector, rating, weight)
       SELECT $1, $2, t.isin, t.name, t.asset, t.sector, t.rating, t.weight
       FROM unnest($3::text[], $4::text[], $5::text[], $6::text[], $7::text[], $8::numeric[]) AS t(isin, name, asset, sector, rating, weight)`,
      [id, asOf, rows.map((r) => r.isin), rows.map((r) => r.name), rows.map((r) => r.asset), rows.map((r) => r.sector), rows.map((r) => r.rating), rows.map((r) => r.weight)],
    )
  }
  await recordLoad(pool, `holdings:${amfiCode}`, asOf, rows.length)
  return { holdings: rows.length, plans: ids.length, totalWeight: Math.round(rows.reduce((s, r) => s + r.weight, 0) * 1000) / 10 }
}
