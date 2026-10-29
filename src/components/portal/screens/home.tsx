'use client'

import { ArrowRight, CalendarPlus, CheckSquare, FileUp, Link2, Percent, Target, TrendingUp } from 'lucide-react'
import Link from 'next/link'

import { ASSUMED_RETURN, NOW_YEAR } from '@/lib/portal/data'
import { goalStatus, projectGoal } from '@/lib/portal/math'
import type { Todo } from '@/lib/portal/types'
import { cn } from '@/lib/utils'

import { MixDonut, MixLegend, ScoreTrend } from '../charts'
import { usePortal } from '../state'
import { AiNote, asOfText, Bar, btn, Card, CardHead, Disclaimer, EmptyState, Pill, rupees } from '../ui'

import { GoalCard } from './goals'

const TODO_ICON = { invest: TrendingUp, tax: Percent, goal: Target } as const

export function Home() {
  const { name, data, openTodos, answered } = usePortal()
  const open = data.todos.filter((t) => !answered(t.id))

  return (
    <>
      {data.sample && <p className="bg-amber-soft text-amber-ink rounded-lg px-3 py-1.5 text-center text-xs">Example data for a sample family (local demo only). Run a Port Scan to see your own numbers here.</p>}

      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Welcome, {name}</h2>
        <p className="text-muted-foreground">{data.hasPortfolio ? 'Here is how your money is doing, from the holdings you added.' : 'Your dashboard fills in as soon as you tell us what you hold.'}</p>
      </div>

      {!data.hasPortfolio ? (
        <EmptyState
          title="Add what you hold to get started"
          body="Upload a statement or type your holdings into Port Scan. You get a 0–100 health score in under a minute, and this dashboard shows your money, risk, costs and suggestions from it."
          href="/portfolio-scan"
          cta="Run a Port Scan"
        />
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Card>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Your total money</span>
                <span className="text-muted-foreground text-sm">As of {asOfText(data.asOf)}</span>
              </div>
              <div className="font-heading text-4xl leading-none font-semibold tabular-nums md:text-5xl">{rupees(data.total)}</div>
              {data.yearlyReturn !== null && (
                <div className={cn('font-semibold', data.yearlyReturn >= 0 ? 'text-[#1b7f4b]' : 'text-destructive')}>
                  {data.yearlyReturn >= 0 ? '▲' : '▼'} {(Math.abs(data.yearlyReturn) * 100).toFixed(1)}% a year
                  {data.benchmarkReturn !== null && <span className="text-muted-foreground font-normal"> · {data.benchmarkName}: {(data.benchmarkReturn * 100).toFixed(1)}%</span>}
                </div>
              )}
              {data.scoreHistory.length >= 2 ? (
                <>
                  <p className="text-muted-foreground text-sm">Your health score, check by check</p>
                  <ScoreTrend history={data.scoreHistory} />
                </>
              ) : (
                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <MixDonut mix={data.mix} total={data.total} />
                  <MixLegend mix={data.mix} />
                </div>
              )}
            </Card>

            <Brief />
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              ['/dashboard/todo', 'Review to-dos', CheckSquare],
              ['/portfolio-scan', 'Update my holdings', Link2],
              ['/dashboard/talk', 'Book a call', CalendarPlus],
              ['/dashboard/documents', 'My documents', FileUp],
            ].map(([href, label, Icon]) => {
              const I = Icon as typeof CheckSquare
              return (
                <Link key={href as string} href={href as string} className="bg-card hover:border-primary flex items-center gap-3 rounded-2xl border p-4 font-semibold transition-colors">
                  <span className="bg-mint text-brand-green-strong flex size-10 shrink-0 items-center justify-center rounded-xl">
                    <I className="size-5" aria-hidden />
                  </span>
                  {label as string}
                </Link>
              )
            })}
          </div>

          <TodoPreview open={open} />

          <div className="grid gap-5 lg:grid-cols-2">
            <HealthCard />
            <CostCard />
          </div>
        </>
      )}

      <GoalsStrip />

      {data.hasPortfolio && (data.scoreHistory.length >= 2 || data.sample) && (
        <Card>
          <CardHead title="Where your money is" />
          <div className="flex flex-wrap items-center gap-6">
            <MixDonut mix={data.mix} total={data.total} />
            <MixLegend mix={data.mix} withPlan />
          </div>
        </Card>
      )}
      {openTodos === 0 && data.hasPortfolio && <p className="text-muted-foreground text-sm">Nothing is waiting for you right now.</p>}
      <Disclaimer />
    </>
  )
}

/** A few lines written from the stored numbers; every line can be checked against a screen. */
function Brief() {
  const { data, openTodos } = usePortal()
  const shares = data.mix.find((m) => m.label === 'Shares')
  const lines: string[] = []
  lines.push(`You hold ${data.holdings.length} ${data.holdings.length === 1 ? 'investment' : 'investments'} worth ${rupees(data.total)}.`)
  if (shares) lines.push(data.risk.equityLimit ? `Shares are ${shares.now}% of your money; your risk profile allows up to ${data.risk.equityLimit}%.` : `Shares are ${shares.now}% of your money.`)
  const top = data.biggest[0]
  if (top && top.share >= 10) lines.push(`${top.name} is ${top.share.toFixed(0)}% of everything you own.`)
  if (data.fees.yearly) lines.push(`Your funds cost about ${rupees(data.fees.yearly)} a year in fees.`)
  if (data.flagCount) lines.push(`${data.flagCount} ${data.flagCount === 1 ? 'thing stands' : 'things stand'} out in your Port Scan.`)
  lines.push(openTodos ? `${openTodos} ${openTodos === 1 ? 'thing is' : 'things are'} waiting for your OK.` : 'Nothing is waiting for your OK.')
  return (
    <section className="bg-mint flex flex-col gap-3 rounded-2xl p-5">
      <CardHead title="Your Copilot brief" right={<Pill>AI</Pill>} />
      <ul className="flex list-disc flex-col gap-1.5 pl-5">
        {lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2.5">
        <Link href="/dashboard/todo" className={cn(btn.primary, btn.sm)}>
          See what to do
        </Link>
        <Link href="/dashboard/ask" className={cn(btn.ghost, btn.sm)}>
          Ask a question
        </Link>
      </div>
      <AiNote>AI-made summary. Numbers come from the holdings you added and tested calculations.</AiNote>
    </section>
  )
}

function TodoPreview({ open }: { open: Todo[] }) {
  return (
    <Card className="border-primary border-2">
      <CardHead
        title={`To do for you (${open.length})`}
        right={
          <Link href="/dashboard/todo" className="text-primary text-sm font-semibold">
            See all
          </Link>
        }
      />
      {open.slice(0, 2).map((t) => {
        const Icon = TODO_ICON[t.icon]
        return (
          <Link key={t.id} href="/dashboard/todo" className="hover:bg-mint/60 flex items-center gap-3.5 rounded-xl border px-4 py-3 transition-colors">
            <span className="bg-mint text-brand-green-strong flex size-10 shrink-0 items-center justify-center rounded-xl">
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{t.label}</div>
              <div className="text-muted-foreground truncate text-sm">{t.title}</div>
            </div>
            <ArrowRight className="text-muted-foreground size-4" aria-hidden />
          </Link>
        )
      })}
      {open.length === 0 && <p className="text-muted-foreground">You are all caught up. Nice work.</p>}
    </Card>
  )
}

function HealthCard() {
  const { data } = usePortal()
  const score = data.score
  if (!score) return null
  const boost = score.weakest
  return (
    <Card>
      <CardHead title="Portfolio health score" right={score.label ? <Pill tone={score.value >= 70 ? 'good' : score.value >= 50 ? 'warn' : 'bad'}>{score.label}</Pill> : null} />
      <div className="flex flex-wrap items-center gap-5">
        <div className="bg-mist mx-auto flex flex-col items-center rounded-2xl px-8 py-5 text-center">
          <span className="font-heading text-primary text-6xl leading-none font-semibold tabular-nums">{score.value}</span>
          <span className="text-muted-foreground mt-1 text-sm">out of 100</span>
        </div>
        <div className="flex min-w-44 flex-1 flex-col gap-2.5">
          {score.parts
            .filter((p) => p.value !== null)
            .map((p) => (
              <div key={p.label}>
                <div className="flex justify-between text-sm">
                  <span>{p.label}</span>
                  <b className="tabular-nums">{Math.round(p.value ?? 0)}</b>
                </div>
                <Bar pct={p.value ?? 0} className="h-1.5" />
              </div>
            ))}
        </div>
      </div>
      {boost && (
        <p className="bg-mist rounded-xl px-3 py-2.5 text-sm">
          <b>Held back most by:</b> {boost}.{' '}
          <Link href="/portfolio" className="text-primary font-semibold">
            See why
          </Link>
        </p>
      )}
    </Card>
  )
}

function CostCard() {
  const { data } = usePortal()
  return (
    <Card>
      <CardHead title="What your investments cost" />
      {data.fees.yearly !== null ? (
        <>
          <div className="font-heading text-4xl font-semibold tabular-nums">{rupees(data.fees.yearly)}</div>
          <p className="text-muted-foreground text-sm">a year in fund fees{data.fees.weightedTer !== null ? `, an average of ${data.fees.weightedTer.toFixed(2)}% of what you hold in funds` : ''}.</p>
          {data.fees.regularShare !== null && data.fees.regularShare > 0 ? (
            <p className="text-sm">
              <Pill tone="warn">Regular plans</Pill> About {(data.fees.regularShare * 100).toFixed(0)}% of your fund money is in regular plans, which pay a commission and cost more than direct plans of the same funds.
            </p>
          ) : (
            <p className="text-sm">
              <Pill tone="good">Direct plans</Pill> No regular-plan commission found in what you added.
            </p>
          )}
        </>
      ) : (
        <p className="text-muted-foreground">Fund fees could not be worked out from what you added. Add funds from the search in Port Scan so we can read their yearly cost.</p>
      )}
      <p className="text-muted-foreground text-xs">Estimates from published fund fees. Not a promise of future costs.</p>
    </Card>
  )
}

function GoalsStrip() {
  const { data } = usePortal()
  const on = data.goals.filter((g) => goalStatus(projectGoal({ saved: g.saved, monthly: g.monthly, annualReturn: ASSUMED_RETURN, years: Math.max(0, g.year - NOW_YEAR) }).value, g.target) === 'on').length
  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Your goals</h3>
        <Link href="/dashboard/goals" className="text-primary text-sm font-semibold">
          {data.goals.length ? `See all goals (${on} of ${data.goals.length} on track)` : 'Add a goal'}
        </Link>
      </div>
      {data.goals.length ? (
        <div className="grid gap-5 md:grid-cols-2">
          {data.goals.slice(0, 2).map((g) => (
            <GoalCard key={g.id} goal={g} />
          ))}
        </div>
      ) : (
        <EmptyState title="No goals yet" body="Tell us what you are saving for, such as retirement, a child’s college or a home, and we show whether you are on track." href="/dashboard/goals" cta="Add your first goal" />
      )}
    </>
  )
}
