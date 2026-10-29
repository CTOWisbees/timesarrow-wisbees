import 'server-only'

import { findApplication } from '@/lib/applications'
import { CLASS_COLORS, fill } from '@/components/portfolio-scan/shared'
import type { AnalysisResult } from '@/lib/portfolio/analyze'
import type { PortfolioInput } from '@/lib/portfolio/model'
import { getPlan, getPortfolio, getViewer, latestResult, listAlerts, listPortfolios, scoreHistory } from '@/lib/portfolio/server/store'
import { getPortfolioScan } from '@/lib/queries'
import { demoModeEnabled } from '@/lib/supabase/dev-bypass'

import { ASSUMED_RETURN, buildSample, NOW_YEAR } from './data'
import { briefFor } from '@/lib/rag/brief'
import { lead } from '@/lib/rag/answer'
import { getKnowledgeIndex } from '@/lib/rag/knowledge'

import { equityLimitFrom, shareLabel } from './derive'
import { extraMonthlyNeeded, goalStatus, projectGoal, rebalanceAmount } from './math'
import { listDecisions, listGoals } from './store'
import type { AlertRow, Goal, Holding, MixRow, PortalData, Todo } from './types'

const ASSET_COLOURS = { Shares: CLASS_COLORS.equity, Bonds: CLASS_COLORS.debt, Gold: CLASS_COLORS.gold, Cash: CLASS_COLORS.cash, Other: CLASS_COLORS.other } as const
const KIND: Record<string, string> = { equity: 'Stock', mutual_fund: 'Mutual fund', etf: 'ETF', bond: 'Bond', cash: 'Cash' }
const SUB_LABEL: Record<string, string> = {
  diversification: 'Spread of investments',
  concentration: 'Not too much in one place',
  risk: 'Ups and downs',
  assetMix: 'Balance of asset types',
  cost: 'Low costs',
}
const PLAN_LABEL = { anonymous: 'Free plan', free: 'Free plan', insights: 'Insights plan', pro: 'Pro plan' } as const

const rel = new Intl.RelativeTimeFormat('en-IN', { numeric: 'auto' })
function ago(iso: string) {
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000)
  return days === 0 ? 'Today' : rel.format(days, 'day')
}

export type Owner = { id: string; name: string } | null

/**
 * Everything the dashboard shows, read for one client: their newest Port Scan portfolio and its
 * latest result, the risk profile from onboarding, their goals, answers and alerts. In local demo
 * mode a client with no portfolio sees the example family instead; in production there is no sample.
 */
export async function loadPortalData(owner: Owner): Promise<PortalData> {
  return withCopilot(await loadBase(owner))
}

const EXPLAIN_QUERY = { rebalance: 'bringing your mix back to plan rebalance shares limit', harvest: 'saving tax on a loss tax-loss harvesting', sip: 'how goal projections work close the gap' } as const

/** Adds what the Copilot writes: the brief from the client's facts, and an explainer for each suggestion retrieved from published knowledge. */
async function withCopilot(data: PortalData): Promise<PortalData> {
  const knowledge = await getKnowledgeIndex()
  const todos = data.todos.map((t) => {
    const hit = knowledge.search(EXPLAIN_QUERY[t.kind], 1)[0]?.chunk
    return hit ? { ...t, explainer: { text: lead(hit.text, 320), title: hit.title, url: hit.url } } : t
  })
  const next = { ...data, todos }
  return { ...next, brief: briefFor(next).lines }
}

async function loadBase(owner: Owner): Promise<PortalData> {
  const empty = emptyData()
  if (!owner) return demoModeEnabled() ? buildSample() : empty

  const viewer = await getViewer()
  const [goals, decisions, plan, application, portfolios, copy] = await Promise.all([
    listGoals(owner.id),
    listDecisions(owner.id),
    getPlan({ ...viewer, userId: owner.id }),
    findApplication(owner.id).catch(() => null),
    listPortfolios(owner.id),
    getPortfolioScan(),
  ])

  const base: PortalData = { ...empty, goals, decisions, planLabel: PLAN_LABEL[plan] }
  const current = portfolios[0]
  if (!current) {
    if (demoModeEnabled()) return { ...buildSample(), goals, decisions }
    return { ...base, alerts: [] }
  }

  const [stored, last, history, alerts] = await Promise.all([getPortfolio(current.id, { ...viewer, userId: owner.id }), latestResult(current.id), scoreHistory(current.id), listAlerts(owner.id, 8)])
  if (!stored || !last) return base

  const result = last.result
  const m = result.metrics
  const input = stored.input
  const holdings = holdingsOf(result, input)
  const total = m.totalValue
  const eff = m.allocation.effective
  const equityLimit = equityLimitFrom(application?.equityLimit)
  const mix = mixOf(eff, equityLimit)
  const shares = mix.find((r) => r.label === 'Shares')?.now ?? 0

  const losses = holdings
    .map((h) => ({ name: h.name, value: h.value, gainPct: h.gainPct }))
    .flatMap((h) => {
      const cost = costOf(input, h.name)
      return cost !== null && cost > h.value ? [{ name: h.name, loss: Math.round(cost - h.value), gainPct: h.gainPct ?? 0 }] : []
    })
    .sort((a, b) => b.loss - a.loss)

  const fundValue = m.cost.fundValue
  const feeYearly = m.cost.weightedTer !== null && fundValue > 0 ? Math.round((m.cost.weightedTer / 100) * fundValue) : null
  const band = copy.bands?.[result.score.band as keyof NonNullable<typeof copy.bands>]
  const weakest = [...result.score.subScores].filter((s) => s.score !== null).sort((a, b) => (a.score ?? 0) - (b.score ?? 0))[0]

  const data: PortalData = {
    ...base,
    hasPortfolio: true,
    portfolioId: current.id,
    asOf: result.asOf,
    total,
    holdings,
    mix,
    risk: { category: application?.riskCategory ?? null, equityLimit },
    score: {
      value: result.score.score,
      label: band?.label ?? '',
      parts: result.score.subScores.map((s) => ({ label: SUB_LABEL[s.id] ?? s.id, value: s.score })),
      weakest: weakest ? (SUB_LABEL[weakest.id] ?? null) : null,
    },
    scoreHistory: history.map((h) => ({ date: h.date, score: h.score })),
    volatility: m.volatility.label,
    yearlyReturn: m.returns.rate,
    benchmarkReturn: m.returns.benchmarkRate,
    benchmarkName: result.benchmark.name,
    fees: { yearly: feeYearly, weightedTer: m.cost.weightedTer, regularShare: m.cost.regularShare },
    biggest: m.weights.slice(0, 5).map((w) => ({ name: w.name, share: w.weight * 100, kind: KIND[w.type] ?? w.type })),
    losses,
    flagCount: result.flags.length,
    bandLabel: band?.label ?? null,
    alerts: alerts.map((a) => alertRow(a, copy)),
  }
  data.todos = suggestions(data, shares, equityLimit, result.configVersion + ':' + last.id)
  return data
}

function emptyData(): PortalData {
  return {
    sample: false,
    hasPortfolio: false,
    portfolioId: null,
    asOf: null,
    total: 0,
    holdings: [],
    mix: [],
    risk: { category: null, equityLimit: null },
    score: null,
    scoreHistory: [],
    volatility: null,
    yearlyReturn: null,
    benchmarkReturn: null,
    benchmarkName: null,
    fees: { yearly: null, weightedTer: null, regularShare: null },
    biggest: [],
    losses: [],
    flagCount: 0,
    goals: [],
    todos: [],
    decisions: {},
    alerts: [],
    planLabel: 'Free plan',
    bandLabel: null,
    brief: [],
  }
}

const costOf = (input: PortfolioInput, name: string) => {
  const h = input.holdings.find((x) => x.name === name)
  return h?.costValue ?? h?.investedAmount ?? null
}

function holdingsOf(result: AnalysisResult, input: PortfolioInput): Holding[] {
  return result.metrics.weights.map((w) => {
    const cost = costOf(input, w.name)
    return {
      name: w.name,
      kind: KIND[w.type] ?? w.type,
      value: w.value,
      weight: w.weight * 100,
      gainPct: cost && cost > 0 ? ((w.value - cost) / cost) * 100 : null,
    }
  })
}

function mixOf(eff: Record<'equity' | 'debt' | 'gold' | 'cash' | 'other', number>, equityLimit: number | null): MixRow[] {
  const rows: [keyof typeof ASSET_COLOURS, number][] = [
    ['Shares', eff.equity],
    ['Bonds', eff.debt],
    ['Gold', eff.gold],
    ['Cash', eff.cash],
    ['Other', eff.other],
  ]
  return rows
    .filter(([, v]) => v > 0.0005)
    .map(([label, v]) => ({ label, now: Math.round(v * 100), plan: label === 'Shares' ? equityLimit : null, colour: ASSET_COLOURS[label] }))
}

function alertRow(a: { id: number; kind: string; payload: Record<string, unknown>; createdAt: string }, copy: Awaited<ReturnType<typeof getPortfolioScan>>): AlertRow {
  const t = copy.alertTemplates
  const p = a.payload as Record<string, string | number>
  let body = t.recheckDue
  let title = 'Time for a fresh check'
  let tone: AlertRow['tone'] = 'info'
  if (a.kind === 'score_drop') {
    body = fill(t.scoreDrop, p)
    title = 'Your score dropped'
    tone = 'warn'
  } else if (a.kind === 'new_flag') {
    const flag = copy.flags?.find((f) => f.rule === p.rule)
    body = fill(t.newFlag, { title: fill(flag?.title ?? String(p.rule), p) })
    title = 'Something new stands out'
    tone = 'warn'
  } else if (a.kind === 'limit_crossed') {
    body = fill(t.limitCrossed, p)
    title = 'A holding passed your limit'
    tone = 'warn'
  }
  return { id: `alert-${a.id}`, tone, title, body, when: ago(a.createdAt), href: '/portfolio' }
}

/** Suggestions come only from the client's own numbers; each has a stable id so their answer is kept. */
function suggestions(d: PortalData, shares: number, equityLimit: number | null, version: string): Todo[] {
  const out: Todo[] = []

  if (equityLimit !== null && shares > equityLimit + 3) {
    const amount = Math.max(10_000, rebalanceAmount({ label: 'Shares', now: shares, plan: equityLimit }, d.total))
    out.push({
      id: `rebalance:${version}`,
      kind: 'rebalance',
      label: 'Bring back to plan',
      icon: 'invest',
      title: `Shares are ${shares}% of your money. Your comfort limit is ${equityLimit}%.`,
      why: 'Your risk profile sets how much of your money should be in shares. Shares have grown past that, so your portfolio now carries more risk than you chose. Moving a small part back keeps you in your comfort zone.',
      details: [['Move about', `₹${amount.toLocaleString('en-IN')}`], ['From', 'Shares'], ['To', 'Bonds or cash'], ['Your limit', shareLabel(equityLimit)]],
      risk: 'Selling funds may have tax. Your adviser will estimate it before anything is prepared.',
    })
  }

  if (d.losses.length) {
    const total = d.losses.reduce((s, l) => s + l.loss, 0)
    out.push({
      id: `harvest:${version}`,
      kind: 'harvest',
      label: 'Save tax on a loss',
      icon: 'tax',
      title: `${d.losses.length} ${d.losses.length === 1 ? 'holding is' : 'holdings are'} below what you paid.`,
      why: 'Selling an investment at a loss can cancel gains elsewhere and may lower your tax. Your money goes into a similar investment so you stay invested. Our CA team checks the rules before anything is prepared.',
      details: [['Unrealised loss', `₹${total.toLocaleString('en-IN')}`], ['Largest', d.losses[0].name], ['Rules checked by', 'Our CA team, on review']],
      risk: 'Tax rules can change and any saving is only an estimate. Your own tax advisor should confirm.',
    })
  }

  for (const g of d.goals) {
    const years = g.year - NOW_YEAR
    if (years < 1) continue
    const args = { target: g.target, saved: g.saved, monthly: g.monthly, annualReturn: ASSUMED_RETURN, years }
    const extra = extraMonthlyNeeded(args)
    if (extra > 0 && goalStatus(projectGoal(args).value, g.target) === 'behind')
      out.push({
        id: `sip:${g.id}:${g.monthly}:${extra}`,
        kind: 'sip',
        label: 'Raise your monthly SIP',
        icon: 'goal',
        title: `Add ₹${extra.toLocaleString('en-IN')} a month to ${g.name}.`,
        why: `You are a little behind on this goal. This step puts you back on track for ${g.year}, if your investments grow about ${ASSUMED_RETURN * 100}% a year (an assumption, not a promise).`,
        details: [['Now', `₹${g.monthly.toLocaleString('en-IN')} a month`], ['New', `₹${(g.monthly + extra).toLocaleString('en-IN')} a month`], ['You can stop', 'Any time']],
        risk: 'Market ups and downs may still change the final amount.',
      })
  }
  return out
}

export type { Goal }
