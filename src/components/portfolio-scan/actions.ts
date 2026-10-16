'use server'

import { after } from 'next/server'
import { z } from 'zod'

import { analyze, ENGINE_VERSION } from '@/lib/portfolio/analyze'
import { PLAN_RANK, type Plan, type ScanView, toView } from '@/lib/portfolio/entitlements'
import { rebalancePlan, type RebalanceClass, type SellCandidate } from '@/lib/portfolio/paid'
import { holdingInputSchema, type PortfolioInput, portfolioInputSchema } from '@/lib/portfolio/model'
import { billingConfigured, confirmPayment, createOrder } from '@/lib/portfolio/server/billing'
import { SAMPLE_PORTFOLIO } from '@/lib/portfolio/sample'
import { getScanConfig } from '@/lib/portfolio/server/config'
import { enrichPortfolio, resolveHolding } from '@/lib/portfolio/server/enrich'
import { getInstruments } from '@/lib/portfolio/server/instruments'
import { computeFull, computeTeasers } from '@/lib/portfolio/server/paid'
import { rateLimit } from '@/lib/portfolio/server/rate-limit'
import { toUploadRows } from '@/lib/portfolio/server/uploads'
import {
  createPortfolio,
  ensureSession,
  findCachedResult,
  getPlan,
  getPortfolio,
  getResultById,
  getViewer,
  inputHash,
  latestPortfolioId,
  latestResult,
  savePaidResult,
  saveResult,
  setDemoUser,
  deletePortfolio,
  deleteUserData,
  markAlertsRead,
  renamePortfolio,
  savePreferences,
  setPlan,
  updatePortfolioInput,
  type Viewer,
} from '@/lib/portfolio/server/store'
import { getPortfolioScan } from '@/lib/queries'
import { demoModeEnabled } from '@/lib/supabase/dev-bypass'

export type ErrorCode = 'too_many' | 'rate_limited' | 'no_holdings' | 'generic'

export type ResolvedRow = {
  key: string | null
  name: string
  type: 'equity' | 'mutual_fund' | 'etf' | 'bond' | 'cash'
  subCategory: string | null
  plan: 'direct' | 'regular' | null
  option: 'growth' | 'idcw' | null
  isin: string | null
  price: number | null
  priceDate: string | null
  confidence: number
  suggestions: { key: string; name: string; plan: string | null; option: string | null; type: string }[]
}

const resolveSchema = z.array(holdingInputSchema.pick({ key: true, isin: true, name: true, type: true })).min(1).max(500)

/** Matches pasted or parsed rows to instruments for the review table. */
export async function resolveRows(rows: unknown): Promise<{ ok: true; rows: ResolvedRow[] } | { ok: false; error: ErrorCode }> {
  if (!(await rateLimit('scan-resolve', 30))) return { ok: false, error: 'rate_limited' }
  const parsed = resolveSchema.safeParse(rows)
  if (!parsed.success) return { ok: false, error: parsed.error.issues.some((i) => i.code === 'too_big') ? 'too_many' : 'no_holdings' }
  const resolutions = await Promise.all(parsed.data.map((r) => resolveHolding(r)))
  const instruments = await getInstruments(resolutions.map((r) => r.key).filter((k): k is string => Boolean(k)))
  return {
    ok: true,
    rows: parsed.data.map((row, i) => {
      const res = resolutions[i]
      const inst = res.key ? instruments.get(res.key) : undefined
      return {
        key: inst?.key ?? null,
        name: inst?.name ?? row.name,
        type: inst?.type ?? row.type,
        subCategory: inst?.subCategory ?? null,
        plan: inst?.plan ?? null,
        option: inst?.option ?? null,
        isin: inst?.isin ?? row.isin ?? null,
        price: inst?.price ?? null,
        priceDate: inst?.priceDate ?? null,
        confidence: res.confidence,
        suggestions: res.suggestions,
      }
    }),
  }
}

/** Instrument details for a suggestion the user picked in the review table. */
export async function instrumentDetails(key: string) {
  const map = await getInstruments([String(key).slice(0, 40)])
  return map.get(String(key)) ?? null
}

type RunResult = { ok: true; view: ScanView } | { ok: false; error: ErrorCode }

/**
 * Scores a confirmed portfolio. Signed-in users on Free/Insights keep one portfolio, so
 * a new check updates it (and its score history); anonymous checks live 24 hours.
 */
export async function runScan(raw: unknown, options?: { portfolioId?: string; asNew?: boolean }): Promise<RunResult> {
  if (!(await rateLimit('scan-run', 12))) return { ok: false, error: 'rate_limited' }
  const config = await getScanConfig()
  const parsed = portfolioInputSchema.safeParse(raw)
  if (!parsed.success) {
    const tooMany = parsed.error.issues.some((i) => i.code === 'too_big' && i.path[0] === 'holdings')
    return { ok: false, error: tooMany ? 'too_many' : 'no_holdings' }
  }
  const input = parsed.data
  if (input.holdings.length > config.limits.maxHoldings) return { ok: false, error: 'too_many' }

  try {
    const sid = await ensureSession()
    const viewer = { ...(await getViewer()), sessionId: sid }
    const plan = await getPlan(viewer)
    const asOf = new Date().toISOString().slice(0, 10)
    const hash = inputHash(input, asOf, ENGINE_VERSION, config.version)
    const result = (await findCachedResult(hash)) ?? analyze(await enrichPortfolio(input, config, asOf), config)
    if (!result.metrics.holdingsCount) return { ok: false, error: 'no_holdings' }

    let portfolioId = options?.portfolioId && (await getPortfolio(options.portfolioId, viewer)) ? options.portfolioId : null
    if (!portfolioId && viewer.userId && !(plan === 'pro' && options?.asNew)) portfolioId = await latestPortfolioId({ ...viewer, sessionId: null })
    if (portfolioId) await updatePortfolioInput(portfolioId, input, asOf, result.metrics.coverage)
    else portfolioId = await createPortfolio(input, viewer, asOf, result.metrics.coverage)
    const resultId = await saveResult(portfolioId, result, hash)
    // Teasers are cheap and shown to everyone; the full paid analysis runs after the response.
    const teasers = await computeTeasers(input, config)
    await savePaidResult(resultId, teasers)
    if (PLAN_RANK[plan] >= PLAN_RANK.insights) scheduleFull(resultId, input)
    return { ok: true, view: toView(portfolioId, result, plan, teasers, config.freeFlagsShown) }
  } catch (err) {
    console.error('[portfolio-scan] run failed', err instanceof Error ? err.message : 'unknown')
    return { ok: false, error: 'generic' }
  }
}

/** Runs the full paid analysis in the background and stores it on the result. */
function scheduleFull(resultId: number, input: PortfolioInput) {
  after(async () => {
    try {
      const config = await getScanConfig()
      const stored = await getResultById(resultId)
      if (!stored) return
      await savePaidResult(resultId, await computeFull(input, stored, config))
    } catch (err) {
      console.error('[portfolio-scan] paid analysis failed', err instanceof Error ? err.message : 'unknown')
    }
  })
}

/** Current view of a portfolio for this viewer (used to poll while paid analysis runs, and after upgrading). */
export async function refreshView(portfolioId: string): Promise<RunResult> {
  const viewer = await getViewer()
  const portfolio = await getPortfolio(String(portfolioId), viewer)
  if (!portfolio) return { ok: false, error: 'generic' }
  const [plan, last, config] = await Promise.all([getPlan(viewer), latestResult(portfolio.id), getScanConfig()])
  if (!last) return { ok: false, error: 'generic' }
  if (PLAN_RANK[plan] >= PLAN_RANK.insights && !last.paid?.complete) {
    // Not computed yet (e.g. just upgraded): compute now rather than wait for a background run.
    const full = await computeFull(portfolio.input, last.result, config)
    await savePaidResult(last.id, full)
    return { ok: true, view: toView(portfolio.id, last.result, plan, full, config.freeFlagsShown) }
  }
  return { ok: true, view: toView(portfolio.id, last.result, plan, last.paid, config.freeFlagsShown) }
}

export type UpgradeResult =
  | { ok: true; mode: 'granted' }
  | { ok: true; mode: 'razorpay'; orderId: string; amount: number; keyId: string; name: string }
  | { ok: false; error: 'sign_in' | 'billing_unavailable' | 'generic' }

/** Starts an upgrade: a Razorpay order when billing is set up; in local demo mode the plan is granted directly. */
export async function startUpgrade(plan: 'insights' | 'pro'): Promise<UpgradeResult> {
  if (plan !== 'insights' && plan !== 'pro') return { ok: false, error: 'generic' }
  const viewer = await getViewer()
  if (!viewer.userId) return { ok: false, error: 'sign_in' }
  if (!billingConfigured()) {
    if (!demoModeEnabled()) return { ok: false, error: 'billing_unavailable' }
    await setPlan(viewer.userId, plan, 'dev', null)
    return { ok: true, mode: 'granted' }
  }
  const copy = await getPortfolioScan()
  const p = copy.plans?.find((x) => x.planId === plan)
  if (!p) return { ok: false, error: 'generic' }
  const order = await createOrder(viewer.userId, plan, p.pricePaise)
  return { ok: true, mode: 'razorpay', ...order, name: p.name }
}

export async function completePayment(orderId: string, paymentId: string, signature: string) {
  const viewer = await getViewer()
  if (!viewer.userId) return { ok: false as const }
  const res = await confirmPayment(viewer.userId, String(orderId), String(paymentId), String(signature))
  return { ok: res.ok }
}

/** Demo mode only: switch the test user's plan from the dashboard. */
export async function demoSetPlan(plan: 'free' | 'insights' | 'pro') {
  const viewer = await getViewer()
  if (!demoModeEnabled() || !viewer.userId) return { ok: false as const }
  await setPlan(viewer.userId, plan, 'dev', null)
  return { ok: true as const }
}

async function requirePlan(viewer: Viewer, needed: Plan) {
  return PLAN_RANK[await getPlan(viewer)] >= PLAN_RANK[needed]
}

const targetSchema = z.object({ equity: z.number().min(0).max(1), debt: z.number().min(0).max(1), gold: z.number().min(0).max(1), cash: z.number().min(0).max(1) })

/** Pro: trades that move the current mix toward the user's own target. */
export async function computeRebalance(portfolioId: string, target: unknown, freshMoney: number) {
  const viewer = await getViewer()
  const portfolio = await getPortfolio(String(portfolioId), viewer)
  if (!portfolio || !(await requirePlan(viewer, 'pro'))) return { ok: false as const }
  const t = targetSchema.safeParse(target)
  const sum = t.success ? t.data.equity + t.data.debt + t.data.gold + t.data.cash : 0
  if (!t.success || Math.abs(sum - 1) > 0.001) return { ok: false as const }
  const config = await getScanConfig()
  const p = await enrichPortfolio(portfolio.input, config)
  const V = p.holdings.reduce((s, h) => s + (h.marketValue ?? 0), 0)
  const current: Record<RebalanceClass, number> = { equity: 0, debt: 0, gold: 0, cash: 0 }
  const recent = (years: number) => {
    if (portfolio.input.investmentDate) return Date.parse(portfolio.input.investmentDate) > Date.now() - years * 365 * 86_400_000
    if (portfolio.input.holdingPeriod) return years >= 3 ? ['lt1', '1to3'].includes(portfolio.input.holdingPeriod) : portfolio.input.holdingPeriod === 'lt1'
    return years >= 3 // unknown purchase date: treat ELSS as possibly locked in
  }
  const candidates: SellCandidate[] = p.holdings
    .filter((h) => h.marketValue)
    .map((h) => {
      for (const [k, v] of Object.entries(h.split)) current[(k === 'other' ? 'equity' : k) as RebalanceClass] += (v ?? 0) * h.marketValue!
      const cls = (Object.entries(h.split).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] ?? 'equity') as RebalanceClass | 'other'
      return {
        name: h.name,
        cls: cls === 'other' ? 'equity' : cls,
        value: h.marketValue!,
        gainPct: h.costValue ? (h.marketValue! / h.costValue - 1) * 100 : null,
        lockedIn: h.subCategory === 'ELSS' && recent(3),
        shortTerm: recent(1),
      }
    })
  const plan = rebalancePlan(current, t.data, Math.max(0, Number(freshMoney) || 0), candidates)
  return { ok: true as const, total: V, plan }
}

const editSchema = z.array(
  z.object({ index: z.number().int().nonnegative().optional(), quantity: z.number().nonnegative().optional(), currentValue: z.number().nonnegative().optional(), add: holdingInputSchema.optional() }),
)

/** Pro: the same engine on edited holdings, in memory; nothing is saved. */
export async function whatIf(portfolioId: string, edits: unknown) {
  const viewer = await getViewer()
  const portfolio = await getPortfolio(String(portfolioId), viewer)
  if (!portfolio || !(await requirePlan(viewer, 'pro'))) return { ok: false as const }
  const parsed = editSchema.safeParse(edits)
  if (!parsed.success) return { ok: false as const }
  const holdings = portfolio.input.holdings.map((h) => ({ ...h }))
  for (const e of parsed.data) {
    if (e.add) holdings.push(e.add)
    else if (e.index !== undefined && holdings[e.index]) {
      if (e.quantity !== undefined) holdings[e.index].quantity = e.quantity || null
      if (e.currentValue !== undefined) holdings[e.index].currentValue = e.currentValue || null
    }
  }
  const kept = holdings.filter((h) => h.quantity || h.currentValue || h.investedAmount)
  if (!kept.length) return { ok: false as const }
  const config = await getScanConfig()
  const result = analyze(await enrichPortfolio({ ...portfolio.input, holdings: kept }, config), config)
  return {
    ok: true as const,
    score: result.score.score,
    band: result.score.band,
    subScores: result.score.subScores.map((s) => ({ id: s.id, score: s.score })),
    flags: result.flags.length,
    // Stocks, bonds and unmatched rows are valued from what was typed, so the value is what changes.
    holdings: portfolio.input.holdings.map((h, index) => {
      const byValue = h.type === 'equity' || h.type === 'bond' || (!h.key && h.type !== 'cash')
      return { index, name: h.name, mode: byValue ? ('value' as const) : ('units' as const), current: byValue ? (h.currentValue ?? null) : (h.quantity ?? null) }
    }),
  }
}

export async function runSample(): Promise<RunResult> {
  return runScan(SAMPLE_PORTFOLIO satisfies PortfolioInput)
}

/** Demo mode only: act as a signed-in test user, to try saving and the dashboard locally. */
export async function demoSignIn(on: boolean) {
  if (!demoModeEnabled()) return { ok: false as const }
  await setDemoUser(on)
  return { ok: true as const }
}

const recordSchema = z.object({
  name: z.string().max(200),
  isin: z.string().max(12).nullable(),
  quantity: z.number().finite().nullable(),
  price: z.number().finite().nullable(),
  value: z.number().finite().nullable(),
  cost: z.number().finite().nullable(),
  typeHint: z.enum(['equity', 'mutual_fund', 'etf', 'bond', 'cash']).nullable(),
  accountHash: z.string().max(80).nullable(),
  sourceRef: z.string().max(120),
})

/** Resolves records the browser read from a statement PDF (the file itself never left the device). */
export async function resolveRecords(records: unknown) {
  if (!(await rateLimit('scan-resolve', 30))) return { ok: false as const, error: 'rate_limited' as const }
  const parsed = z.array(recordSchema).min(1).max(500).safeParse(records)
  if (!parsed.success) return { ok: false as const, error: 'nothing_found' as const }
  return { ok: true as const, rows: await toUploadRows(parsed.data) }
}

// ---------- Signed-in dashboard ----------

const prefsSchema = z.object({
  recheckReminder: z.boolean(),
  alertScoreDrop: z.number().int().min(1).max(50),
  concentrationLimit: z.number().min(0.01).max(1).nullable(),
})

export async function updatePreferences(prefs: unknown) {
  const viewer = await getViewer()
  const parsed = prefsSchema.safeParse(prefs)
  if (!viewer.userId || !parsed.success) return { ok: false as const }
  // Custom concentration alerts are a Pro feature; reminders are for every account.
  const pro = await requirePlan(viewer, 'pro')
  await savePreferences(viewer.userId, { ...parsed.data, concentrationLimit: pro ? parsed.data.concentrationLimit : null })
  return { ok: true as const }
}

export async function readAlerts() {
  const viewer = await getViewer()
  if (viewer.userId) await markAlertsRead(viewer.userId)
  return { ok: true as const }
}

export async function removePortfolio(portfolioId: string) {
  const viewer = await getViewer()
  if (!viewer.userId) return { ok: false as const }
  await deletePortfolio(String(portfolioId), viewer)
  return { ok: true as const }
}

export async function renameMyPortfolio(portfolioId: string, name: string) {
  const viewer = await getViewer()
  if (!viewer.userId) return { ok: false as const }
  await renamePortfolio(String(portfolioId), viewer.userId, String(name).trim() || 'My portfolio')
  return { ok: true as const }
}

/** Deletes every saved portfolio, score, alert and setting for this account, in one action. */
export async function deleteAllMyData() {
  const viewer = await getViewer()
  if (!viewer.userId) return { ok: false as const }
  await deleteUserData(viewer.userId)
  return { ok: true as const }
}
