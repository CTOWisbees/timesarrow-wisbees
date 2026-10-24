'use client'

import { track } from '@vercel/analytics'
import { AlertCircle, CheckCircle2, CircleDot, Download, Info, Lock, OctagonAlert, RotateCcw, TriangleAlert } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatInr } from '@/lib/format-inr'
import type { FlagView, ScanView } from '@/lib/portfolio/entitlements'
import type { SubScoreId } from '@/lib/portfolio/scoring'
import { cn } from '@/lib/utils'

import { demoSignIn, refreshView } from './actions'
import { AllocationDonut, MixBar, RankedBars, RiskMeter, ScoreDisplay } from './charts'
import { PaidCards, PlansIntro } from './paid-cards'
import { PlanSheet } from './plan-sheet'
import { BAND_STATUS, fill, pct, type ScanCopy, STATUS } from './shared'

const BAND_ICON = { healthy: CheckCircle2, fair: CircleDot, attention: TriangleAlert, at_risk: OctagonAlert }
const SEVERITY = {
  critical: { icon: OctagonAlert, color: STATUS.critical, label: 'Critical' },
  high: { icon: TriangleAlert, color: STATUS.serious, label: 'High' },
  medium: { icon: AlertCircle, color: STATUS.warning, label: 'Medium' },
  low: { icon: Info, color: 'var(--muted-foreground)', label: 'Low' },
  info: { icon: Info, color: 'var(--muted-foreground)', label: 'Note' },
} as const

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
const formatDate = (iso: string) => dateFmt.format(new Date(`${iso}T00:00:00+05:30`))

type Props = {
  view: ScanView
  copy: ScanCopy
  signedIn: boolean
  demoMode: boolean
  onRestart: () => void
  onView: (v: ScanView) => void
}

export function Results({ view, copy, signedIn, demoMode, onRestart, onView }: Props) {
  const [planSheet, setPlanSheet] = useState<'insights' | 'pro' | null>(null)
  const compact = useCompact()

  // While the paid analysis runs (just upgraded, or a fresh check on a paid plan), check back for it.
  useEffect(() => {
    if (!view.paidPending) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    const poll = async () => {
      const res = await refreshView(view.portfolioId)
      if (cancelled) return
      if (res.ok) onView(res.view)
      if (!res.ok || res.view.paidPending) timer = setTimeout(poll, 4000)
    }
    timer = setTimeout(poll, 1500)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [view.paidPending, view.portfolioId, onView])
  const { score, summary } = view
  const status = BAND_STATUS[score.band]
  const BandIcon = BAND_ICON[score.band]
  const band = copy.bands[score.band]
  const flagCount = view.flags.shown.length + view.flags.hiddenCount
  const top5 = summary.topHoldings
  const sectors = [
    ...summary.sectors.top.map((s) => ({ label: s.label, weight: s.weight, value: s.value })),
    ...(summary.sectors.other > 0.0005 ? [{ label: 'Other sectors', weight: summary.sectors.other, value: summary.sectors.other * summary.totalValue }] : []),
    ...(summary.sectors.diversifiedFunds > 0.0005
      ? [{ label: 'Diversified funds', weight: summary.sectors.diversifiedFunds, value: summary.sectors.diversifiedFunds * summary.totalValue, muted: true }]
      : []),
  ]
  const returns = summary.returns
  const gapPts = returns.gap === null ? null : Math.abs(Math.round(returns.gap * 1000) / 10)

  const unlock = (plan: 'insights' | 'pro') => (track('locked_card_clicked', { plan }), setPlanSheet(plan))
  const pdf = view.cards.find((c) => c.id === 'pdf')

  return (
    <div className="mt-10 space-y-12">
      {/* P0: the score, its five parts and the report download, in one card. */}
      <section aria-labelledby="score-title" className="bg-card rounded-3xl border p-6 sm:p-10">
        <div className="grid gap-8 md:grid-cols-[16rem_minmax(0,1fr)] md:items-center">
          <ScoreDisplay score={score.score} range={score.range} label={band.label} />
          <div>
            <h2 id="score-title" className="flex items-center gap-2.5 text-3xl font-semibold tracking-tight">
              <BandIcon className="size-7 shrink-0" style={{ color: STATUS[status] }} aria-hidden />
              {band.label}
              {score.provisional && <Badge variant="outline">{copy.provisional}</Badge>}
            </h2>
            <p className="text-ink-soft mt-3 text-lg">{fill(band.summary, { score: score.score, count: flagCount })}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="bg-mist text-ink-soft rounded-full px-3 py-1">{fill(copy.coverageChip, { pct: Math.round(summary.coverage * 100) })}</span>
              <span className="bg-mist text-ink-soft rounded-full px-3 py-1">{fill(copy.asOfChip, { date: formatDate(view.asOf) })}</span>
              <span className="bg-mist text-ink-soft rounded-full px-3 py-1 tabular-nums">{formatInr(summary.totalValue)}</span>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              {pdf && !pdf.locked && (
                <Button asChild variant="outline">
                  <a href={`/api/portfolio/report?id=${encodeURIComponent(view.portfolioId)}`} download>
                    <Download className="size-4" aria-hidden />
                    Download PDF report
                  </a>
                </Button>
              )}
              {pdf?.locked && (
                <Button variant="outline" onClick={() => unlock(pdf.plan)}>
                  <Lock className="size-3.5" aria-hidden />
                  Download PDF report
                </Button>
              )}
              <Button variant="link" className="h-auto p-0" onClick={onRestart}>
                <RotateCcw className="size-3.5" aria-hidden />
                Start a new check
              </Button>
            </div>
          </div>
        </div>
        <SubScores view={view} copy={copy} />
      </section>

      <SavePrompt copy={copy} signedIn={signedIn} demoMode={demoMode} />

      {/* P1: what you hold. */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={copy.blocks.allocation}>
          <AllocationDonut effective={summary.allocation.effective} total={summary.totalValue} />
          <div className="mt-6 space-y-2">
            <p className="text-ink-soft text-xs font-medium">{copy.blocks.effectiveMix}</p>
            <MixBar effective={summary.allocation.effective} />
            <p className="text-muted-foreground text-xs">As held: {summary.allocation.asHeld.map((a) => `${a.label} ${pct(a.weight)}`).join(' · ')}</p>
          </div>
        </Panel>
        <Panel title={copy.blocks.sectors}>
          {sectors.length ? <RankedBars data={sectors} compact={compact} /> : <p className="text-muted-foreground text-sm">No equity holdings.</p>}
        </Panel>
        <Panel title={copy.blocks.holdings} className="lg:col-span-2">
          <RankedBars data={top5.map((h) => ({ label: h.name, weight: h.weight, value: h.value }))} threshold={0.2} thresholdLabel="20%" compact={compact} />
        </Panel>
      </div>

      {/* P2: how it behaves. */}
      <div className="space-y-6">
        <PlansIntro view={view} copy={copy} />
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title={copy.blocks.risk}>
            <RiskMeter level={summary.volatility.label} labels={copy.riskLabels} />
            {summary.volatility.annual !== null && summary.volatility.benchmarkAnnual !== null ? (
              <p className="text-ink-soft mt-4 text-sm leading-relaxed">
                {fill(copy.riskSentence, {
                  annual: (summary.volatility.annual * 100).toFixed(1),
                  benchmarkAnnual: (summary.volatility.benchmarkAnnual * 100).toFixed(1),
                  benchmark: view.benchmark.name,
                })}
              </p>
            ) : (
              <p className="text-muted-foreground mt-4 text-sm">Not enough price history to measure this.</p>
            )}
          </Panel>
          <PaidCards view={view} copy={copy} onUnlock={unlock} ids={['drawdown', 'returns']} />
        </div>
      </div>

      {/* P3: what stands out, and how it compares. */}
      <section aria-labelledby="flags-title" className="space-y-6">
        <div>
          <h2 id="flags-title" className="text-2xl font-semibold tracking-tight">
            {copy.flagsTitle}
          </h2>
          {flagCount === 0 ? (
            <p className="text-ink-soft mt-4">{copy.noFlags}</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {view.flags.shown.map((f, i) => (
                <FlagCard key={`${f.id}-${i}`} flag={f} copy={copy} />
              ))}
              {view.flags.hiddenCount > 0 && (
                <li className="bg-mist flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed p-5">
                  <span className="text-ink flex items-center gap-2 font-medium">
                    <Lock className="text-muted-foreground size-4" aria-hidden />
                    {fill(copy.moreFlags, { count: view.flags.hiddenCount })}
                  </span>
                  {!signedIn && <SignUpButton copy={copy} demoMode={demoMode} />}
                </li>
              )}
            </ul>
          )}
        </div>
        <Panel title={copy.blocks.benchmark}>
          {returns.rate !== null && returns.gap !== null ? (
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
              <p className="font-heading text-ink text-2xl font-semibold">
                {fill(returns.gap >= 0 ? copy.benchmarkAhead : copy.benchmarkBehind, { gap: gapPts, benchmark: view.benchmark.name })}
              </p>
              <p className="text-ink-soft text-sm tabular-nums">
                Yours {pct(returns.rate)} a year · {view.benchmark.name} {pct(returns.benchmarkRate)} a year
                {returns.method === 'approx' && ' (approximate)'}
              </p>
            </div>
          ) : (
            <p className="text-ink-soft text-sm">{returns.rate !== null ? `Your return: ${pct(returns.rate)} a year.` : copy.benchmarkPrompt}</p>
          )}
          {view.benchmark.note && <p className="text-muted-foreground mt-3 text-xs">{view.benchmark.note}</p>}
        </Panel>
        <div className="grid gap-6 lg:grid-cols-2">
          <PaidCards view={view} copy={copy} onUnlock={unlock} ids={['overlap', 'drag']} />
        </div>
      </section>

      {/* P5: deeper tools. */}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <PaidCards view={view} copy={copy} onUnlock={unlock} ids={['stress', 'ratios']} pair={['stress', 'ratios']} />
        <PaidCards view={view} copy={copy} onUnlock={unlock} ids={['rebalance', 'whatif']} />
      </div>

      {/* 10. Data quality and disclaimer */}
      <footer className="text-muted-foreground space-y-3 border-t pt-6 text-xs leading-relaxed">
        {view.dataQuality.excluded.length > 0 && (
          <p>{fill(copy.dataQualityLine, { excluded: view.dataQuality.excluded.length, pct: Math.round(summary.coverage * 100) })}</p>
        )}
        {view.dataQuality.userValued.length > 0 && <p>Valued at the amount you entered: {view.dataQuality.userValued.join(', ')}.</p>}
        {summary.volatility.proxied.length > 0 && <p>Price history estimated from a matching index for: {summary.volatility.proxied.join(', ')}.</p>}
        <p className="text-ink-soft">{copy.disclaimer}</p>
      </footer>

      <PlanSheet copy={copy} open={planSheet} onOpenChange={(o) => !o && setPlanSheet(null)} signedIn={signedIn} portfolioId={view.portfolioId} onView={onView} />
    </div>
  )
}

/** True on phone widths, where chart label columns shrink. */
function useCompact() {
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const update = () => setCompact(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return compact
}

function Panel({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('bg-card min-w-0 rounded-3xl border p-5 sm:p-7', className)}>
      <h3 className="mb-5 font-sans text-base font-semibold">{title}</h3>
      {children}
    </section>
  )
}

function statusWord(score: number | null, copy: ScanCopy) {
  if (score === null) return { word: copy.statusWords.na, tone: 'text-muted-foreground' }
  if (score >= 70) return { word: copy.statusWords.good, tone: 'text-primary' }
  if (score >= 40) return { word: copy.statusWords.ok, tone: 'text-amber-ink' }
  return { word: copy.statusWords.weak, tone: 'text-destructive' }
}

const EVIDENCE_LABELS: Record<string, (v: number | string) => string> = {
  effectiveHoldings: (v) => `About ${v} separate holdings, counting a fund as many`,
  effectiveSectors: (v) => `About ${v} sectors`,
  top1Pct: (v) => `Largest holding: ${v}%`,
  top5Pct: (v) => `Top five: ${v}%`,
  ratio: (v) => `${v}× the benchmark's ups and downs`,
  annualPct: (v) => `Moves about ${v}% a year`,
  equityPct: (v) => `Equity ${v}%`,
  debtPct: (v) => `Debt ${v}%`,
  goldPct: (v) => `Gold ${v}%`,
  cashPct: (v) => `Cash ${v}%`,
  terPct: (v) => `Average yearly fee ${v}%`,
  regularPct: (v) => `${v}% in regular plans`,
}

function SubScores({ view, copy }: { view: ScanView; copy: ScanCopy }) {
  const [open, setOpen] = useState<SubScoreId | null>(null)
  const meta = (id: SubScoreId) => copy.subScores?.find((s) => s.subScore === id)
  const current = view.score.subScores.find((s) => s.id === open)
  return (
    <div aria-label="Score breakdown" className="mt-8 border-t pt-6">
      <ul className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-5">
        {view.score.subScores.map((s) => {
          const { word, tone } = statusWord(s.score, copy)
          const isOpen = open === s.id
          const color = s.score === null ? 'var(--border)' : s.score >= 70 ? 'var(--primary)' : s.score >= 40 ? 'var(--brand-amber)' : 'var(--destructive)'
          return (
            <li key={s.id}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls="subscore-detail"
                onClick={() => setOpen(isOpen ? null : s.id)}
                className={cn('hover:bg-mist -mx-2 block w-[calc(100%+1rem)] rounded-lg px-2 py-1.5 text-left transition-colors', isOpen && 'bg-mist')}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-ink-soft truncate text-xs">{meta(s.id)?.label}</span>
                  <span className={cn('shrink-0 text-[0.7rem] font-semibold', tone)}>{word}</span>
                </span>
                <span className="font-heading text-ink mt-0.5 block text-xl font-semibold tabular-nums">{s.score ?? '–'}</span>
                <span className="bg-border mt-1.5 block h-1 overflow-hidden rounded-full" aria-hidden>
                  <span className="block h-full rounded-full" style={{ width: `${s.score ?? 0}%`, background: color }} />
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {current && (
        <div id="subscore-detail" className="bg-mist mt-4 rounded-2xl p-5 text-sm">
          <p className="text-ink-soft leading-relaxed">{meta(current.id)?.description}</p>
          <ul className="text-ink mt-3 flex flex-wrap gap-x-5 gap-y-1">
            {Object.entries(current.evidence)
              .filter(([k, v]) => v !== null && v !== '' && EVIDENCE_LABELS[k])
              .map(([k, v]) => (
                <li key={k}>{EVIDENCE_LABELS[k](v!)}</li>
              ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function FlagCard({ flag, copy }: { flag: FlagView; copy: ScanCopy }) {
  const text = copy.flags?.find((f) => f.rule === flag.id)
  const sev = SEVERITY[flag.severity]
  const Icon = sev.icon
  return (
    <li className="bg-card flex gap-4 rounded-2xl border p-5" onClick={() => track('flag_opened', { id: flag.id })}>
      <Icon className="mt-0.5 size-5 shrink-0" style={{ color: sev.color }} aria-hidden />
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{sev.label}</p>
        <p className="text-ink mt-1 font-semibold">{fill(text?.title ?? flag.id, flag.evidence)}</p>
        {text?.why && <p className="text-ink-soft mt-1 text-sm leading-relaxed">{text.why}</p>}
        {flag.impactInr !== undefined && <p className="text-ink mt-2 text-sm font-medium">Rupee impact: {formatInr(flag.impactInr)}</p>}
        {flag.scenarios?.length ? (
          <ul className="text-ink-soft mt-2 space-y-0.5 text-sm">
            {flag.scenarios.map((s) => (
              <li key={s.label}>
                {s.label}: {formatInr(s.amount)}
              </li>
            ))}
          </ul>
        ) : null}
        {text?.explainerUrl && (
          <a href={text.explainerUrl} className="text-primary mt-2 inline-block text-sm font-medium underline-offset-4 hover:underline">
            Learn more
          </a>
        )}
      </div>
    </li>
  )
}

function SignUpButton({ copy, demoMode }: { copy: ScanCopy; demoMode: boolean }) {
  const [pending, start] = useTransition()
  const router = useRouter()
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild onClick={() => track('signup_clicked')}>
        <Link href="/login?next=/portfolio">{copy.savePrompt.cta}</Link>
      </Button>
      {demoMode && (
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await demoSignIn(true)
              router.push('/portfolio')
            })
          }
        >
          Demo: continue as test user
        </Button>
      )}
    </div>
  )
}

function SavePrompt({ copy, signedIn, demoMode }: { copy: ScanCopy; signedIn: boolean; demoMode: boolean }) {
  if (signedIn) {
    return (
      <div className="bg-mint/60 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5">
        <p className="text-ink flex items-center gap-2 font-medium">
          <CheckCircle2 className="text-primary size-5" aria-hidden />
          {copy.savePrompt.saved}
        </p>
        <Button asChild variant="outline">
          <Link href="/portfolio">Open your dashboard</Link>
        </Button>
      </div>
    )
  }
  return (
    <section className="bg-night text-white grid gap-6 rounded-3xl p-6 sm:p-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">{copy.savePrompt.title}</h2>
        <p className="mt-2 text-white/80">{copy.savePrompt.body}</p>
        <ul className="mt-4 grid gap-1.5 text-sm text-white/90 sm:grid-cols-3">
          {copy.savePrompt.benefits?.map((b) => (
            <li key={b.id ?? b.text} className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-[#7fd1a6]" aria-hidden />
              {b.text}
            </li>
          ))}
        </ul>
      </div>
      <SignUpButton copy={copy} demoMode={demoMode} />
    </section>
  )
}

