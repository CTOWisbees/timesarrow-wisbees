import 'server-only'

import { getPayloadClient } from '@/lib/payload'

import { analyze, ENGINE_VERSION } from '../analyze'
import { loadAmfiNav, AMFI_NAV_URL, fetchText } from '../market/loaders'
import type { PortfolioInput } from '../model'
import { getScanConfig } from './config'
import { enrichPortfolio } from './enrich'
import { computeTeasers } from './paid'
import { addAlert, getPlan, getPreferences, inputHash, latestResult, purgeExpired, savePaidResult, saveResult } from './store'

const DAY = 86_400_000

/**
 * The nightly run: fresh NAVs, expired anonymous portfolios removed, and saved
 * portfolios re-scored on their plan's schedule (monthly for Free and Insights,
 * weekly for Pro). Pro gets alerts when the score drops, a new flag appears, or a
 * holding crosses the limit they set; everyone with the reminder on gets a monthly nudge.
 */
export async function runNightly({ force = false, loadPrices = true } = {}) {
  const payload = await getPayloadClient()
  const pool = payload.db.pool
  const log: string[] = []

  if (loadPrices) {
    const nav = await loadAmfiNav(pool, await fetchText(AMFI_NAV_URL))
    log.push(`nav: ${nav.schemes} schemes, as of ${nav.asOf}`)
  }
  log.push(`purged ${await purgeExpired()} expired anonymous portfolios`)

  const config = await getScanConfig()
  const asOf = new Date().toISOString().slice(0, 10)
  const { rows } = await pool.query<{ id: string; owner_id: string; input: PortfolioInput }>(`SELECT id, owner_id, input FROM scan.portfolios WHERE owner_id IS NOT NULL`)
  let rescored = 0
  for (const p of rows) {
    const viewer = { userId: p.owner_id, sessionId: null, demo: false }
    const [plan, prefs, last] = await Promise.all([getPlan(viewer), getPreferences(p.owner_id), latestResult(p.id)])
    const age = last ? Date.now() - Date.parse(last.createdAt) : Infinity
    const due = force || age >= (plan === 'pro' ? 7 : 30) * DAY
    if (!due) continue

    if (prefs.recheckReminder && age >= 30 * DAY) await addAlert(p.owner_id, p.id, 'recheck_due', {})
    const result = analyze(await enrichPortfolio(p.input, config, asOf), config)
    const resultId = await saveResult(p.id, result, inputHash(p.input, asOf, ENGINE_VERSION, config.version))
    await savePaidResult(resultId, await computeTeasers(p.input, config))
    rescored++

    if (plan !== 'pro' || !last) continue
    const before = last.result
    if (before.score.score - result.score.score >= prefs.alertScoreDrop) {
      await addAlert(p.owner_id, p.id, 'score_drop', { from: before.score.score, to: result.score.score })
    }
    const seen = new Set(before.flags.map((f) => f.id))
    for (const f of result.flags.filter((x) => !seen.has(x.id) && x.severity !== 'info')) {
      await addAlert(p.owner_id, p.id, 'new_flag', { rule: f.id, ...f.evidence })
    }
    if (prefs.concentrationLimit !== null) {
      const top = result.metrics.weights[0]
      const was = before.metrics.weights.find((w) => w.name === top?.name)?.weight ?? 0
      if (top && top.weight > prefs.concentrationLimit && was <= prefs.concentrationLimit) {
        await addAlert(p.owner_id, p.id, 'limit_crossed', { name: top.name, pct: Math.round(top.weight * 1000) / 10 })
      }
    }
  }
  log.push(`re-scored ${rescored} of ${rows.length} saved portfolios`)
  return log
}
