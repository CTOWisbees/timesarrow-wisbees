import 'server-only'

import { createHash, randomUUID } from 'node:crypto'
import { cookies } from 'next/headers'

import { getPayloadClient } from '@/lib/payload'
import { demoModeEnabled } from '@/lib/supabase/dev-bypass'
import { getCurrentUser } from '@/lib/supabase/server'

import type { AnalysisResult } from '../analyze'
import type { PaidResult, Plan } from '../entitlements'
import type { PortfolioInput } from '../model'

const SESSION_COOKIE = 'scan_sid'
const DEMO_COOKIE = 'scan_demo_user'
/** Fixed id for the local demo user (demo mode only). */
export const DEMO_USER_ID = '00000000-0000-4000-8000-00000000d3e0'
const TTL_HOURS = 24

const db = async () => (await getPayloadClient()).db.pool

export type Viewer = { userId: string | null; sessionId: string | null; demo: boolean }

/** Who is looking: a signed-in client, the local demo user, and/or an anonymous session. */
export async function getViewer(): Promise<Viewer> {
  const jar = await cookies()
  const sid = jar.get(SESSION_COOKIE)?.value ?? null
  const sessionId = sid && /^[0-9a-f-]{36}$/.test(sid) ? sid : null
  const user = await getCurrentUser()
  if (user) return { userId: user.id, sessionId, demo: false }
  if (demoModeEnabled() && jar.get(DEMO_COOKIE)?.value === '1') return { userId: DEMO_USER_ID, sessionId, demo: true }
  return { userId: null, sessionId, demo: false }
}

/** Server actions only: makes sure the anonymous session cookie exists. */
export async function ensureSession(): Promise<string> {
  const jar = await cookies()
  const existing = jar.get(SESSION_COOKIE)?.value
  if (existing && /^[0-9a-f-]{36}$/.test(existing)) return existing
  const sid = randomUUID()
  jar.set(SESSION_COOKIE, sid, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: TTL_HOURS * 3600,
  })
  return sid
}

export async function setDemoUser(on: boolean) {
  if (!demoModeEnabled()) return
  const jar = await cookies()
  if (on) jar.set(DEMO_COOKIE, '1', { httpOnly: true, sameSite: 'lax', path: '/' })
  else jar.delete(DEMO_COOKIE)
}

export function inputHash(input: PortfolioInput, asOf: string, engineVersion: string, configVersion: string) {
  return createHash('sha256').update(JSON.stringify({ input, asOf, engineVersion, configVersion })).digest('hex')
}

/** Saves a portfolio: owned when signed in, otherwise tied to the session with a 24-hour expiry. */
export async function createPortfolio(input: PortfolioInput, viewer: Viewer, asOf: string, coverage: number): Promise<string> {
  const pool = await db()
  const owned = Boolean(viewer.userId)
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO scan.portfolios (owner_id, session_id, input, as_of, benchmark_id, data_coverage, source_types, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, ${owned ? 'NULL' : `now() + interval '${TTL_HOURS} hours'`})
     RETURNING id`,
    [viewer.userId, owned ? null : viewer.sessionId, JSON.stringify(input), asOf, input.benchmarkId ?? 'NIFTY50_TRI', coverage, input.sourceTypes ?? []],
  )
  return rows[0].id
}

export async function updatePortfolioInput(id: string, input: PortfolioInput, asOf: string, coverage: number) {
  await (await db()).query(
    `UPDATE scan.portfolios SET input = $2, as_of = $3, benchmark_id = $4, data_coverage = $5, source_types = $6, updated_at = now() WHERE id = $1`,
    [id, JSON.stringify(input), asOf, input.benchmarkId ?? 'NIFTY50_TRI', coverage, input.sourceTypes ?? []],
  )
}

export async function saveResult(portfolioId: string, result: AnalysisResult, hash: string): Promise<number> {
  const { rows } = await (await db()).query<{ id: number }>(
    `INSERT INTO scan.analysis_results (portfolio_id, engine_version, config_version, input_hash, score, band, result)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [portfolioId, result.engineVersion, result.configVersion, hash, result.score.score, result.score.band, JSON.stringify(result)],
  )
  return rows[0].id
}

/** Reuses a result computed today for identical input and engine/config versions. */
export async function findCachedResult(hash: string): Promise<AnalysisResult | null> {
  const { rows } = await (await db()).query<{ result: AnalysisResult }>(
    `SELECT result FROM scan.analysis_results WHERE input_hash = $1 AND created_at > now() - interval '1 day' ORDER BY id DESC LIMIT 1`,
    [hash],
  )
  return rows[0]?.result ?? null
}

export type StoredPortfolio = {
  id: string
  ownerId: string | null
  name: string
  input: PortfolioInput
  asOf: string
  createdAt: string
  updatedAt: string
}

/** A portfolio the viewer may see: theirs, or their live anonymous session's. */
export async function getPortfolio(id: string, viewer: Viewer): Promise<StoredPortfolio | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null
  const { rows } = await (await db()).query<{
    id: string
    owner_id: string | null
    name: string
    input: PortfolioInput
    as_of: Date
    created_at: Date
    updated_at: Date
  }>(
    `SELECT id, owner_id, name, input, as_of, created_at, updated_at FROM scan.portfolios
     WHERE id = $1 AND ((owner_id IS NOT NULL AND owner_id = $2) OR (session_id = $3 AND expires_at > now()))`,
    [id, viewer.userId, viewer.sessionId],
  )
  const r = rows[0]
  return r
    ? { id: r.id, ownerId: r.owner_id, name: r.name, input: r.input, asOf: r.as_of.toISOString().slice(0, 10), createdAt: r.created_at.toISOString(), updatedAt: r.updated_at.toISOString() }
    : null
}

/** The newest portfolio for this viewer (their own, else the session's). */
export async function latestPortfolioId(viewer: Viewer): Promise<string | null> {
  const { rows } = await (await db()).query<{ id: string }>(
    `SELECT id FROM scan.portfolios
     WHERE (owner_id IS NOT NULL AND owner_id = $1) OR (session_id = $2 AND expires_at > now())
     ORDER BY updated_at DESC LIMIT 1`,
    [viewer.userId, viewer.sessionId],
  )
  return rows[0]?.id ?? null
}

export async function latestResult(portfolioId: string): Promise<{ id: number; result: AnalysisResult; paid: PaidResult | null; createdAt: string } | null> {
  const { rows } = await (await db()).query<{ id: number; result: AnalysisResult; paid: PaidResult | null; created_at: Date }>(
    `SELECT id, result, paid, created_at FROM scan.analysis_results WHERE portfolio_id = $1 ORDER BY id DESC LIMIT 1`,
    [portfolioId],
  )
  const r = rows[0]
  return r ? { id: Number(r.id), result: r.result, paid: r.paid, createdAt: r.created_at.toISOString() } : null
}

export async function getResultById(id: number): Promise<AnalysisResult | null> {
  const { rows } = await (await db()).query<{ result: AnalysisResult }>(`SELECT result FROM scan.analysis_results WHERE id = $1`, [id])
  return rows[0]?.result ?? null
}

export async function savePaidResult(resultId: number, paid: PaidResult) {
  await (await db()).query(`UPDATE scan.analysis_results SET paid = $2 WHERE id = $1`, [resultId, JSON.stringify(paid)])
}

export async function scoreHistory(portfolioId: string): Promise<{ date: string; score: number; band: string }[]> {
  const { rows } = await (await db()).query<{ created_at: Date; score: number; band: string }>(
    `SELECT created_at, score, band FROM scan.analysis_results WHERE portfolio_id = $1 ORDER BY id`,
    [portfolioId],
  )
  return rows.map((r) => ({ date: r.created_at.toISOString().slice(0, 10), score: r.score, band: r.band }))
}

export async function listPortfolios(userId: string) {
  const { rows } = await (await db()).query<{ id: string; name: string; updated_at: Date; score: number | null; band: string | null }>(
    `SELECT p.id, p.name, p.updated_at, r.score, r.band FROM scan.portfolios p
     LEFT JOIN LATERAL (SELECT score, band FROM scan.analysis_results WHERE portfolio_id = p.id ORDER BY id DESC LIMIT 1) r ON true
     WHERE p.owner_id = $1 ORDER BY p.updated_at DESC`,
    [userId],
  )
  return rows.map((r) => ({ id: r.id, name: r.name, updatedAt: r.updated_at.toISOString(), score: r.score, band: r.band }))
}

/**
 * Attaches the session's anonymous portfolios to a signed-in user. Free accounts keep
 * one portfolio (the newest wins); Pro can keep several.
 */
export async function claimSessionPortfolios(viewer: Viewer, plan: Plan): Promise<string[]> {
  if (!viewer.userId || !viewer.sessionId) return []
  const pool = await db()
  const { rows } = await pool.query<{ id: string }>(
    // updated_at is kept, so "newest" still means the most recent check.
    `UPDATE scan.portfolios SET owner_id = $1, session_id = NULL, expires_at = NULL, claimed_at = now()
     WHERE session_id = $2 AND owner_id IS NULL AND expires_at > now()
     RETURNING id`,
    [viewer.userId, viewer.sessionId],
  )
  if (rows.length && plan !== 'pro') await keepNewest(viewer.userId)
  return rows.map((r) => r.id)
}

/** True right after sign-up attached a check, so the dashboard can say "Saved" (whatever renders it). */
export async function recentlyClaimed(userId: string) {
  const { rows } = await (await db()).query(`SELECT 1 FROM scan.portfolios WHERE owner_id = $1 AND claimed_at > now() - interval '2 minutes' LIMIT 1`, [userId])
  return rows.length > 0
}

/** Free and Insights accounts keep one saved portfolio. */
export async function keepNewest(userId: string) {
  await (await db()).query(
    `DELETE FROM scan.portfolios WHERE owner_id = $1 AND id <> (SELECT id FROM scan.portfolios WHERE owner_id = $1 ORDER BY updated_at DESC, created_at DESC LIMIT 1)`,
    [userId],
  )
}

export async function renamePortfolio(id: string, userId: string, name: string) {
  await (await db()).query(`UPDATE scan.portfolios SET name = $3, updated_at = now() WHERE id = $1 AND owner_id = $2`, [id, userId, name.slice(0, 80)])
}

export async function deletePortfolio(id: string, viewer: Viewer) {
  await (await db()).query(
    `DELETE FROM scan.portfolios WHERE id = $1 AND ((owner_id IS NOT NULL AND owner_id = $2) OR session_id = $3)`,
    [id, viewer.userId, viewer.sessionId],
  )
}

/** Everything stored for a user, for "download my data". */
export async function exportUserData(userId: string) {
  const pool = await db()
  const [portfolios, results, alerts, prefs, entitlement] = await Promise.all([
    pool.query(`SELECT id, name, input, as_of, created_at, updated_at FROM scan.portfolios WHERE owner_id = $1`, [userId]),
    pool.query(`SELECT r.portfolio_id, r.score, r.band, r.created_at FROM scan.analysis_results r JOIN scan.portfolios p ON p.id = r.portfolio_id WHERE p.owner_id = $1`, [userId]),
    pool.query(`SELECT kind, payload, created_at, read_at FROM scan.alerts WHERE user_id = $1`, [userId]),
    pool.query(`SELECT recheck_reminder, alert_score_drop, concentration_limit FROM scan.preferences WHERE user_id = $1`, [userId]),
    pool.query(`SELECT plan, valid_until FROM scan.entitlements WHERE user_id = $1`, [userId]),
  ])
  return { portfolios: portfolios.rows, scores: results.rows, alerts: alerts.rows, preferences: prefs.rows[0] ?? null, plan: entitlement.rows[0] ?? null }
}

/** Deletes everything Portfolio Scan stores for a user (payments are kept for accounting). */
export async function deleteUserData(userId: string) {
  const pool = await db()
  await pool.query(`DELETE FROM scan.portfolios WHERE owner_id = $1`, [userId])
  await pool.query(`DELETE FROM scan.alerts WHERE user_id = $1`, [userId])
  await pool.query(`DELETE FROM scan.preferences WHERE user_id = $1`, [userId])
}

/** The viewer's plan. A lapsed paid plan falls back to free; data is never deleted on lapse. */
export async function getPlan(viewer: Viewer): Promise<Plan> {
  if (!viewer.userId) return 'anonymous'
  const { rows } = await (await db()).query<{ plan: Plan }>(
    `SELECT plan FROM scan.entitlements WHERE user_id = $1 AND (valid_until IS NULL OR valid_until > now())`,
    [viewer.userId],
  )
  return rows[0]?.plan ?? 'free'
}

export async function setPlan(userId: string, plan: 'free' | 'insights' | 'pro', source: string, validUntil: Date | null) {
  await (await db()).query(
    `INSERT INTO scan.entitlements (user_id, plan, valid_until, source, updated_at) VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (user_id) DO UPDATE SET plan = EXCLUDED.plan, valid_until = EXCLUDED.valid_until, source = EXCLUDED.source, updated_at = now()`,
    [userId, plan, validUntil, source],
  )
}

export async function purgeExpired(): Promise<number> {
  const res = await (await db()).query(`DELETE FROM scan.portfolios WHERE owner_id IS NULL AND expires_at < now()`)
  return res.rowCount ?? 0
}

export type Preferences = { recheckReminder: boolean; alertScoreDrop: number; concentrationLimit: number | null }

export async function getPreferences(userId: string): Promise<Preferences> {
  const { rows } = await (await db()).query<{ recheck_reminder: boolean; alert_score_drop: number; concentration_limit: string | null }>(
    `SELECT recheck_reminder, alert_score_drop, concentration_limit FROM scan.preferences WHERE user_id = $1`,
    [userId],
  )
  const r = rows[0]
  return r
    ? { recheckReminder: r.recheck_reminder, alertScoreDrop: r.alert_score_drop, concentrationLimit: r.concentration_limit === null ? null : Number(r.concentration_limit) }
    : { recheckReminder: true, alertScoreDrop: 5, concentrationLimit: null }
}

export async function savePreferences(userId: string, p: Preferences) {
  await (await db()).query(
    `INSERT INTO scan.preferences (user_id, recheck_reminder, alert_score_drop, concentration_limit, updated_at) VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (user_id) DO UPDATE SET recheck_reminder = EXCLUDED.recheck_reminder, alert_score_drop = EXCLUDED.alert_score_drop,
       concentration_limit = EXCLUDED.concentration_limit, updated_at = now()`,
    [userId, p.recheckReminder, p.alertScoreDrop, p.concentrationLimit],
  )
}

export type Alert = { id: number; kind: string; payload: Record<string, unknown>; createdAt: string; read: boolean }

export async function listAlerts(userId: string, limit = 20): Promise<Alert[]> {
  const { rows } = await (await db()).query<{ id: number; kind: string; payload: Record<string, unknown>; created_at: Date; read_at: Date | null }>(
    `SELECT id, kind, payload, created_at, read_at FROM scan.alerts WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, limit],
  )
  return rows.map((r) => ({ id: Number(r.id), kind: r.kind, payload: r.payload, createdAt: r.created_at.toISOString(), read: Boolean(r.read_at) }))
}

export async function markAlertsRead(userId: string) {
  await (await db()).query(`UPDATE scan.alerts SET read_at = now() WHERE user_id = $1 AND read_at IS NULL`, [userId])
}

export async function addAlert(userId: string, portfolioId: string, kind: string, payload: Record<string, unknown>) {
  await (await db()).query(`INSERT INTO scan.alerts (user_id, portfolio_id, kind, payload) VALUES ($1, $2, $3, $4)`, [userId, portfolioId, kind, JSON.stringify(payload)])
}
