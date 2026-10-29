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
          <section className="from-primary to-brand-green-strong rounded-3xl bg-gradient-to-br p-6 text-white shadow-[0_10px_28px_rgb(15_107_76/0.25)] sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-5">
              <div className="min-w-0">
                <p className="text-sm text-white/80">Your total money · as of {asOfText(data.asOf)}</p>
                <div className="font-heading mt-1 text-4xl leading-none font-semibold tabular-nums sm:text-5xl">{rupees(data.total)}</div>
                {data.yearlyReturn !== null && (
                  <p className="mt-2 text-sm text-white/90">
                    {data.yearlyReturn >= 0 ? '▲' : '▼'} {(Math.abs(data.yearlyReturn) * 100).toFixed(1)}% a year
                    {data.benchmarkReturn !== null && ` · ${data.benchmarkName}: ${(data.benchmarkReturn * 100).toFixed(1)}%`}
                  </p>
                )}
              </div>
              <dl className="grid grid-cols-3 gap-3 text-center sm:gap-4">
                {[
                  ['Health score', data.score ? String(data.score.value) : '–'],
                  ['Fees a year', data.fees.yearly === null ? '–' : rupees(data.fees.yearly)],
                  ['To do', String(openTodos)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-2xl bg-white/12 px-3 py-2.5 sm:px-5">
                    <dt className="text-xs text-white/75">{k}</dt>
                    <dd className="font-heading text-xl font-semibold tabular-nums sm:text-2xl">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Card>
              <CardHead title={data.scoreHistory.length >= 2 ? 'Your health score over time' : 'Where your money is'} />
              {data.scoreHistory.length >= 2 ? (
                <ScoreTrend history={data.scoreHistory} />
              ) : (
                <div className="flex flex-wrap items-center gap-6 pt-1">
                  <MixDonut mix={data.mix} total={data.total} />
                  <MixLegend mix={data.mix} withPlan />
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

      {data.hasPortfolio && data.scoreHistory.length >= 2 && (
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

/** The Copilot brief: lines read from the client's own facts by the RAG, each linking to the screen that shows it. */
function Brief() {
  const { data } = usePortal()
  return (
    <section className="bg-mint flex flex-col gap-3 rounded-2xl p-5">
      <CardHead title="Your Copilot brief" right={<Pill>AI</Pill>} />
      <ul className="flex flex-col gap-2">
        {data.brief.map((l) => (
          <li key={l.text} className="flex gap-2">
            <span className="bg-primary mt-2 size-1.5 shrink-0 rounded-full" aria-hidden />
            <span>
              {l.text}{' '}
              <Link href={l.url} className="text-primary text-sm font-semibold whitespace-nowrap">
                See
              </Link>
            </span>
          </li>
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
      <AiNote>AI-made brief, read from your own numbers and checked by our rules. Ask Copilot shows where each answer comes from.</AiNote>
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
