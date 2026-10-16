'use client'

import { Download, Loader2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

import { Button } from '@/components/ui/button'
import { type ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { Input } from '@/components/ui/input'
import { formatInr } from '@/lib/format-inr'
import type { CardId } from '@/lib/portfolio/entitlements'
import type { RebalanceClass } from '@/lib/portfolio/paid'
import type { DragCard, DrawdownCard, OverlapCard, Point, RatiosCard, RebalanceCard, ReturnsCard, StressCard, TaxCard } from '@/lib/portfolio/paid-cards'
import { parseAmount } from '@/lib/portfolio/numbers'
import { cn } from '@/lib/utils'

import { computeRebalance, whatIf } from './actions'
import { CLASS_COLORS, CLASS_LABELS, pct } from './shared'

/** Losses as "−₹84,880" (minus before the rupee sign). */
const signed = (v: number) => (v < 0 ? `−${formatInr(-v)}` : formatInr(v))

const NOT_ENOUGH = <p className="text-muted-foreground text-sm">Not enough price history to work this out yet.</p>

export function PaidCardBody({ id, data, benchmark, portfolioId }: { id: CardId; data: unknown; benchmark: string; portfolioId: string }) {
  if (data === null || data === undefined) return NOT_ENOUGH
  switch (id) {
    case 'overlap':
      return <Overlap d={data as OverlapCard} />
    case 'drag':
      return <Drag d={data as DragCard} />
    case 'drawdown':
      return <Drawdown d={data as DrawdownCard} benchmark={benchmark} />
    case 'returns':
      return <Returns d={data as ReturnsCard} benchmark={benchmark} />
    case 'pdf':
      return (
        <div className="space-y-3">
          <p className="text-ink-soft text-sm">Your full report, with every chart and the data behind it, as a PDF.</p>
          <Button asChild variant="outline">
            <a href={`/api/portfolio/report?id=${encodeURIComponent(portfolioId)}`} download>
              <Download className="size-4" aria-hidden />
              Download PDF
            </a>
          </Button>
        </div>
      )
    case 'stress':
      return <Stress d={data as StressCard} benchmark={benchmark} />
    case 'ratios':
      return <Ratios d={data as RatiosCard} />
    case 'rebalance':
      return <Rebalance d={data as RebalanceCard} portfolioId={portfolioId} />
    case 'tax':
      return <Tax d={data as TaxCard} />
    case 'whatif':
      return <WhatIf portfolioId={portfolioId} />
  }
}

const overlapWord = (o: number) => (o >= 0.5 ? 'strong' : o >= 0.3 ? 'moderate' : 'low')

function Overlap({ d }: { d: OverlapCard }) {
  if (!d.pairs.length && !d.topExposures.length) return <p className="text-ink-soft text-sm">No meaningful overlap between your funds.</p>
  return (
    <div className="space-y-4 text-sm">
      <ul className="divide-y">
        {d.pairs.slice(0, 8).map((p) => (
          <li key={`${p.a}|${p.b}`} className="flex items-center justify-between gap-4 py-2.5">
            <span className="text-ink min-w-0">
              {p.a} <span className="text-muted-foreground">and</span> {p.b}
            </span>
            <span className="text-ink shrink-0 text-right font-semibold tabular-nums">
              {p.overlap !== null ? pct(p.overlap, 0) : p.category}
              {p.overlap !== null && <span className="text-muted-foreground block text-xs font-normal">{overlapWord(p.overlap)}</span>}
            </span>
          </li>
        ))}
      </ul>
      {d.level === 'category' ? (
        <p className="text-muted-foreground text-xs">These funds are in the same category, so they usually hold many of the same companies. Exact overlap needs the funds’ monthly holdings, which are not loaded yet.</p>
      ) : (
        d.topExposures.length > 0 && (
          <div>
            <p className="text-ink-soft mb-2 text-xs font-medium">Your largest underlying exposures, across funds and direct holdings</p>
            <ul className="text-ink grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {d.topExposures.map((e) => (
                <li key={e.name} className="flex justify-between gap-3">
                  <span className="truncate">{e.name}</span>
                  <span className="tabular-nums">{pct(e.weight)}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      )}
    </div>
  )
}

function Drag({ d }: { d: DragCard }) {
  if (!d.funds.length) return <p className="text-ink-soft text-sm">All your funds are in direct plans, so there is no distributor fee to compare.</p>
  return (
    <div className="space-y-4 text-sm">
      <p className="font-heading text-ink text-3xl font-semibold tabular-nums">{formatInr(d.total)}</p>
      <p className="text-ink-soft -mt-2">less after {d.years} years than the same amount in direct plans</p>
      <ul className="divide-y">
        {d.funds.map((f) => (
          <li key={f.name} className="flex items-center justify-between gap-4 py-2.5">
            <span className="text-ink min-w-0">
              {f.name}
              <span className="text-muted-foreground block text-xs">
                {f.terRegular.toFixed(2)}% a year against {f.terDirect.toFixed(2)}% direct
              </span>
            </span>
            <span className="text-ink shrink-0 tabular-nums">{formatInr(f.drag)}</span>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground text-xs">Illustration, not a forecast: assumes {pct(d.assumedReturn, 0)} a year before fees.</p>
    </div>
  )
}

const LINE_CONFIG = { portfolio: { label: 'Your portfolio', color: '#0f8a55' }, benchmark: { label: 'Benchmark', color: '#2a78d6' } } satisfies ChartConfig
const monthFmt = new Intl.DateTimeFormat('en-IN', { month: 'short', year: '2-digit' })

function TwoLines({ points, format, benchmark }: { points: Point[]; format: (v: number) => string; benchmark: string }) {
  return (
    <div>
      <div className="mb-3 flex gap-5 text-xs">
        <span className="text-ink flex items-center gap-1.5">
          <span aria-hidden className="h-0.5 w-4 rounded" style={{ background: LINE_CONFIG.portfolio.color }} />
          Your portfolio
        </span>
        <span className="text-ink flex items-center gap-1.5">
          <span aria-hidden className="h-0.5 w-4 rounded" style={{ background: LINE_CONFIG.benchmark.color }} />
          {benchmark}
        </span>
      </div>
      <ChartContainer config={LINE_CONFIG} className="aspect-auto h-56 w-full">
        <LineChart data={points} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="2 4" />
          <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={40} tickFormatter={(d) => monthFmt.format(new Date(d))} className="text-xs" />
          <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={format} domain={['auto', 'auto']} className="text-xs" />
          <ChartTooltip
            cursor={{ stroke: 'var(--brand-ink-soft)', strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as Point | undefined
              if (!active || !p) return null
              return (
                <div className="bg-card rounded-lg border px-3 py-2 text-xs shadow-md">
                  <p className="text-muted-foreground">{new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  {p.portfolio !== null && <p className="text-ink font-medium">Yours: {format(p.portfolio)}</p>}
                  {p.benchmark !== null && <p className="text-ink">{benchmark}: {format(p.benchmark)}</p>}
                </div>
              )
            }}
          />
          <Line dataKey="benchmark" stroke="var(--color-benchmark)" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
          <Line dataKey="portfolio" stroke="var(--color-portfolio)" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
        </LineChart>
      </ChartContainer>
    </div>
  )
}

function Drawdown({ d, benchmark }: { d: DrawdownCard; benchmark: string }) {
  const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        <Stat label="Worst fall" value={`−${pct(d.maxDrawdown)}`} note={`${fmt(d.peakDate)} to ${fmt(d.troughDate)}`} />
        <Stat label="Recovered in" value={d.recoveryDays === null ? 'Not yet' : `${Math.round(d.recoveryDays / 30)} months`} />
        <Stat label="Below its peak now" value={pct(d.current)} />
        {d.benchmarkMaxDrawdown !== null && <Stat label={`${benchmark} worst fall`} value={`−${pct(d.benchmarkMaxDrawdown)}`} />}
      </div>
      <TwoLines points={d.points} benchmark={benchmark} format={(v) => `${Math.round(v * 100)}`} />
      <p className="text-muted-foreground text-xs">
        Today’s mix held since {fmt(d.from)}, growth of 100.{d.estimated.length > 0 && ` Estimated from matching indices for: ${d.estimated.join(', ')}.`}
      </p>
    </div>
  )
}

function Returns({ d, benchmark }: { d: ReturnsCard; benchmark: string }) {
  if (!d.points.length) return NOT_ENOUGH
  return (
    <div className="space-y-3">
      <TwoLines points={d.points} benchmark={benchmark} format={(v) => `${(v * 100).toFixed(0)}%`} />
      <p className="text-muted-foreground text-xs">
        {d.kind === 'xirr' ? 'Your yearly return (XIRR) up to each month, from your transactions.' : 'One-year returns of today’s mix, month by month. Add a detailed statement to see your own returns over time.'}
      </p>
    </div>
  )
}

function Stress({ d, benchmark }: { d: StressCard; benchmark: string }) {
  return (
    <div className="space-y-5 text-sm">
      <div>
        <p className="text-ink-soft mb-2 text-xs font-medium">If the market fell (portfolio beta {d.portfolioBeta.toFixed(2)})</p>
        <table className="w-full">
          <tbody className="divide-y">
            {d.shocks.map((s) => (
              <tr key={s.shock}>
                <td className="text-ink py-2">Market {pct(s.shock, 0)}</td>
                <td className="text-ink py-2 text-right font-medium tabular-nums">{signed(s.loss)}</td>
                <td className="text-muted-foreground py-2 text-right tabular-nums">{benchmark} {signed(s.benchmarkLoss)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <p className="text-ink-soft mb-2 text-xs font-medium">If past falls happened to today’s portfolio</p>
        <table className="w-full">
          <tbody className="divide-y">
            {d.historical.map((h) => (
              <tr key={h.id}>
                <td className="text-ink py-2">{h.label}</td>
                <td className="text-ink py-2 text-right font-medium tabular-nums">{h.loss === null ? 'No data' : signed(h.loss)}</td>
                <td className="text-muted-foreground py-2 text-right tabular-nums">{h.benchmarkLoss === null ? '' : `Nifty 50 ${signed(h.benchmarkLoss)}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-muted-foreground mt-2 text-xs">Holdings without price history for a period are estimated from their beta.</p>
      </div>
    </div>
  )
}

function Ratios({ d }: { d: RatiosCard }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Sharpe ratio" value={d.sharpe.toFixed(2)} note={d.benchmarkSharpe !== null ? `Benchmark ${d.benchmarkSharpe.toFixed(2)}` : undefined} />
        <Stat label="Sortino ratio" value={d.sortino.toFixed(2)} />
        <Stat label="Beta" value={d.beta.toFixed(2)} />
        <Stat label="Alpha" value={`${(d.alpha * 100).toFixed(1)}%`} note="a year" />
        <Stat label="Return" value={pct(d.annualReturn)} note="a year" />
        <Stat label="Volatility" value={pct(d.annualVol)} note="a year" />
      </div>
      <p className="text-muted-foreground text-xs">Weekly returns over {d.years} years of today’s mix; risk-free rate {pct(d.riskFree)}.</p>
    </div>
  )
}

const CLASSES: RebalanceClass[] = ['equity', 'debt', 'gold', 'cash']

function Rebalance({ d, portfolioId }: { d: RebalanceCard; portfolioId: string }) {
  const [target, setTarget] = useState<Record<RebalanceClass, number>>(d.presets[1].target)
  const [fresh, setFresh] = useState('')
  const [pending, start] = useTransition()
  const [plan, setPlan] = useState<Awaited<ReturnType<typeof computeRebalance>> | null>(null)
  const sum = CLASSES.reduce((s, c) => s + target[c], 0)
  const run = () =>
    start(async () => {
      setPlan(await computeRebalance(portfolioId, target, parseAmount(fresh) ?? 0))
    })
  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap gap-2">
        {d.presets.map((p) => (
          <Button key={p.id} size="sm" variant={CLASSES.every((c) => p.target[c] === target[c]) ? 'default' : 'outline'} onClick={() => setTarget(p.target)}>
            {p.label}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CLASSES.map((c) => (
          <label key={c} className="text-ink-soft text-xs font-medium">
            {CLASS_LABELS[c]} now {pct(d.current[c] / d.total, 0)}
            <Input
              inputMode="decimal"
              className="mt-1 h-9 text-right tabular-nums"
              value={Math.round(target[c] * 100)}
              aria-label={`${CLASS_LABELS[c]} target %`}
              onChange={(e) => setTarget({ ...target, [c]: Math.max(0, Math.min(100, Number(e.target.value) || 0)) / 100 })}
            />
          </label>
        ))}
      </div>
      <label className="text-ink-soft block text-xs font-medium">
        New money to add (optional)
        <Input inputMode="decimal" className="mt-1 h-9 max-w-48 text-right" value={fresh} onChange={(e) => setFresh(e.target.value)} placeholder="₹0" />
      </label>
      <Button onClick={run} disabled={pending || Math.abs(sum - 1) > 0.001}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {Math.abs(sum - 1) > 0.001 ? `Targets add up to ${Math.round(sum * 100)}%` : 'Compare with my target'}
      </Button>
      {plan?.ok && (
        <div className="space-y-3 border-t pt-4">
          <MixRow label="Now" mix={d.current} total={d.total} />
          <MixRow label="After" mix={plan.plan.after} total={CLASSES.reduce((s, c) => s + plan.plan.after[c], 0)} />
          <ul className="space-y-1">
            {plan.plan.sells.map((s) => (
              <li key={s.name} className="text-ink">
                Reduce {s.name} by {formatInr(s.amount)}
                {s.note === 'short_term_gain' && <span className="text-muted-foreground"> (may have short-term gains)</span>}
              </li>
            ))}
            {plan.plan.adds.map((a) => (
              <li key={`${a.cls}-${a.from}`} className="text-ink">
                Add {formatInr(a.amount)} to {CLASS_LABELS[a.cls].toLowerCase()} {a.from === 'fresh' ? 'from new money' : 'from the reductions'}
              </li>
            ))}
          </ul>
          {plan.plan.unmet > 0 && <p className="text-muted-foreground text-xs">{formatInr(plan.plan.unmet)} could not be moved without selling units that may be locked in (ELSS).</p>}
          <p className="text-muted-foreground text-xs">Your allocation against the target you chose. Which funds to use is your decision; talk to a registered adviser before acting.</p>
        </div>
      )}
    </div>
  )
}

function MixRow({ label, mix, total }: { label: string; mix: Record<RebalanceClass, number>; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-ink-soft w-12 text-xs">{label}</span>
      <div className="flex h-3 flex-1 gap-0.5 overflow-hidden rounded-full">
        {CLASSES.filter((c) => mix[c] > 0).map((c) => (
          <span key={c} title={`${CLASS_LABELS[c]} ${pct(mix[c] / total)}`} style={{ width: `${(mix[c] / total) * 100}%`, background: CLASS_COLORS[c] }} />
        ))}
      </div>
      <span className="text-muted-foreground w-44 text-right text-xs tabular-nums">{CLASSES.map((c) => `${Math.round((mix[c] / total) * 100)}`).join(' / ')}</span>
    </div>
  )
}

function Tax({ d }: { d: TaxCard }) {
  if (!d.available) return <p className="text-ink-soft text-sm">The tax view needs your purchase history. Upload a detailed CAS (with transactions) to see it.</p>
  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        <Stat label="Estimated tax if sold today" value={formatInr(d.totalTax)} />
        <Stat label="Tax-free long-term gains left this year" value={formatInr(d.headroom)} />
      </div>
      <table className="w-full">
        <thead className="text-ink-soft text-left text-xs">
          <tr>
            <th className="py-2 font-medium">Holding</th>
            <th className="py-2 text-right font-medium">Short-term gain</th>
            <th className="py-2 text-right font-medium">Long-term gain</th>
            <th className="py-2 text-right font-medium">Tax</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {d.rows.map((r) => (
            <tr key={r.name}>
              <td className="text-ink py-2">{r.name}</td>
              <td className="py-2 text-right tabular-nums">{signed(r.shortTermGain)}</td>
              <td className="py-2 text-right tabular-nums">{signed(r.longTermGain)}</td>
              <td className="text-ink py-2 text-right font-medium tabular-nums">{formatInr(r.tax)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="text-muted-foreground list-disc space-y-0.5 pl-4 text-xs">
        {d.assumptions.map((a) => (
          <li key={a}>{a}</li>
        ))}
        <li>An estimate, not tax advice. Check with a tax professional.</li>
      </ul>
    </div>
  )
}

function WhatIf({ portfolioId }: { portfolioId: string }) {
  const [pending, start] = useTransition()
  const [base, setBase] = useState<Extract<Awaited<ReturnType<typeof whatIf>>, { ok: true }> | null>(null)
  const [next, setNext] = useState<Extract<Awaited<ReturnType<typeof whatIf>>, { ok: true }> | null>(null)
  const [edits, setEdits] = useState<Record<number, string>>({})
  const load = () =>
    start(async () => {
      const r = await whatIf(portfolioId, [])
      if (r.ok) setBase(r)
    })
  const run = () =>
    start(async () => {
      const list = Object.entries(edits).map(([i, v]) => {
        const h = base!.holdings[Number(i)]
        const n = parseAmount(v) ?? 0
        return h.mode === 'units' ? { index: Number(i), quantity: n } : { index: Number(i), currentValue: n }
      })
      const r = await whatIf(portfolioId, list)
      if (r.ok) setNext(r)
    })
  if (!base)
    return (
      <Button variant="outline" onClick={load} disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        Try a change
      </Button>
    )
  return (
    <div className="space-y-4 text-sm">
      <ul className="divide-y">
        {base.holdings.map((h) => (
          <li key={h.index} className="flex items-center justify-between gap-3 py-2">
            <span className="text-ink min-w-0 truncate">{h.name}</span>
            <Input
              inputMode="decimal"
              aria-label={`New ${h.mode === 'units' ? 'units' : 'value'} for ${h.name}`}
              className="h-9 w-32 text-right tabular-nums"
              placeholder={h.current === null ? '' : `${h.mode === 'value' ? '₹' : ''}${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 }).format(h.current)}`}
              value={edits[h.index] ?? ''}
              onChange={(e) => setEdits({ ...edits, [h.index]: e.target.value })}
            />
          </li>
        ))}
      </ul>
      <Button onClick={run} disabled={pending || !Object.keys(edits).length}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        See the new score
      </Button>
      {next && (
        <div className="flex flex-wrap gap-x-8 gap-y-3 border-t pt-4">
          <Stat label="Now" value={String(base.score)} />
          <Stat label="After the change" value={String(next.score)} note={next.score > base.score ? `+${next.score - base.score}` : next.score < base.score ? `${next.score - base.score}` : 'no change'} />
          <Stat label="Flags" value={`${base.flags} → ${next.flags}`} />
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <p className="text-ink-soft text-xs">{label}</p>
      <p className={cn('font-heading text-ink text-2xl font-semibold tabular-nums')}>{value}</p>
      {note && <p className="text-muted-foreground text-xs">{note}</p>}
    </div>
  )
}
