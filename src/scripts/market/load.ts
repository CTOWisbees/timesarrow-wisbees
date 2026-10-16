/**
 * Loads Portfolio Scan reference data into the `market` schema.
 *
 *   pnpm market nav                 AMFI daily NAVs + fund master (run every evening)
 *   pnpm market nav ./NAVAll.txt    same, from a downloaded file
 *   pnpm market history [days]      AMFI NAV history (default 400 days, for volatility)
 *   pnpm market benchmarks          benchmark definitions (index-fund proxies) + their full history
 *   pnpm market stocks <file|url>   stock master from AMFI's half-yearly market-cap list, e.g.
 *                                   https://portal.amfiindia.com/spages/AverageMarketCapitalization30Jun2026.xlsx
 *   pnpm market sectors <file>      sectors from the Nifty 500 constituents CSV
 *   pnpm market holdings <file> <amfiCode> [sheet] [asOf]
 *                                   fund look-through from an AMC monthly portfolio disclosure
 *   pnpm market all                 nav + benchmarks + history
 */
import config from '@payload-config'
import { readFile } from 'node:fs/promises'
import { getPayload } from 'payload'

import { AMFI_NAV_URL, fetchText, loadAmfiHistory, loadAmfiNav, loadBenchmarkHistory, loadBenchmarks } from '@/lib/portfolio/market/loaders'
import { loadFundHoldings } from '@/lib/portfolio/market/disclosures'
import { loadSectors, loadStockMaster } from '@/lib/portfolio/market/stocks'

const [command = 'all', arg, ...more] = process.argv.slice(2).map(String).filter((a) => !a.endsWith('load.ts'))
const payload = await getPayload({ config })
const pool = payload.db.pool
const log = (msg: string) => payload.logger.info(`[market] ${msg}`)

try {
  if (command === 'nav' || command === 'all') {
    const text = arg && command === 'nav' ? await readFile(arg, 'utf8') : await fetchText(AMFI_NAV_URL)
    log(`nav: ${JSON.stringify(await loadAmfiNav(pool, text))}`)
  }
  if (command === 'benchmarks' || command === 'all') {
    log(`benchmarks: ${await loadBenchmarks(pool)}`)
    log(`benchmark history: ${await loadBenchmarkHistory(pool, log)} prices`)
  }
  if (command === 'history' || command === 'all') {
    const days = Number(command === 'history' && arg ? arg : 400)
    log(`history: ${await loadAmfiHistory(pool, days, log)} prices`)
  }
  if (command === 'stocks') {
    if (!arg) throw new Error('Pass the AMFI market-cap file or its URL: pnpm market stocks <file|url>')
    const bytes = /^https?:\/\//.test(arg) ? new Uint8Array(await (await fetch(arg, { signal: AbortSignal.timeout(120_000) })).arrayBuffer()) : await readFile(arg)
    log(`stocks: ${JSON.stringify(await loadStockMaster(pool, bytes, arg))}`)
  }
  if (command === 'sectors') {
    if (!arg) throw new Error('Pass the Nifty 500 list: pnpm market sectors ./ind_nifty500list.csv')
    log(`sectors: ${JSON.stringify(await loadSectors(pool, await readFile(arg, 'utf8')))}`)
  }
  if (command === 'holdings') {
    const [code, sheet, asOf] = more
    if (!arg || !code) throw new Error('Usage: pnpm market holdings <file> <amfiCode> [sheet] [asOf YYYY-MM-DD]')
    const date = asOf ?? new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().slice(0, 10)
    log(`holdings: ${JSON.stringify(await loadFundHoldings(pool, await readFile(arg), Number(code), sheet ?? null, date))}`)
  }
} catch (err) {
  payload.logger.error(err)
  process.exitCode = 1
} finally {
  process.exit()
}
