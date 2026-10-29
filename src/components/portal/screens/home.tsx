'use client'

import { ArrowRight, CalendarPlus, CheckSquare, FileUp, Link2, TrendingUp, Percent, Target } from 'lucide-react'
import Link from 'next/link'

import { Bar, AiNote, btn, Card, CardHead, Disclaimer, Pill, rupees } from '../ui'
import { MixDonut, MixLegend, TrendLine } from '../charts'
import { usePortal } from '../state'
import { ASSUMED_RETURN, goals, markets, NOW_YEAR, todos, totalValue } from '@/lib/portal/data'
import { goalStatus, projectGoal } from '@/lib/portal/math'
import { cn } from '@/lib/utils'

import { GoalCard } from './goals'

const TODO_ICON = { invest: TrendingUp, tax: Percent, goal: Target } as const

export function Home() {
  const { name, decisions, openTodos } = usePortal()
  const open = todos.filter((t) => !decisions[t.id])
  const score = 78
  const parts: [string, number][] = [['Spread of investments', 72], ['Fits your risk comfort', 85], ['Low costs', 92], ['Goals on track', 75]]
  const onTrack = goals.filter((g) => goalStatus(projectGoal({ saved: g.saved, monthly: g.monthly, annualReturn: ASSUMED_RETURN, years: g.year - NOW_YEAR }).value, g.target) === 'on').length

  return (
    <>
      <p className="bg-amber-soft text-amber-ink rounded-lg px-3 py-1.5 text-center text-xs">Example data for a sample family. Your own numbers appear here after you link your accounts.</p>

      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Good morning, {name}</h2>
        <p className="text-muted-foreground">Here is how your family’s money is doing today.</p>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-0.5" aria-label="Market snapshot">
        {markets.map((m) => (
          <Card key={m.name} className="min-w-[8.25rem] shrink-0 gap-0.5 px-3.5 py-2.5">
            <span className="text-muted-foreground text-sm">{m.name}</span>
            <b className="tabular-nums">{m.value}</b>
            <span className={cn('text-sm tabular-nums', m.up ? 'text-[#1b7f4b]' : 'text-destructive')}>{m.change}</span>
          </Card>
        ))}
        <span className="text-muted-foreground shrink-0 self-center text-xs">Example prices</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Your total money</span>
            <span className="text-muted-foreground text-sm">Updated 9:15 am</span>
          </div>
          <div className="font-heading text-4xl leading-none font-semibold tabular-nums md:text-5xl">{rupees(totalValue)}</div>
          <div className="font-semibold text-[#1b7f4b]">▲ ₹21,400 (0.7%) this week</div>
          <TrendLine />
        </Card>

        <section className="bg-mint flex flex-col gap-3 rounded-2xl p-5">
          <CardHead title="Your Copilot brief" right={<Pill>AI</Pill>} />
          <ul className="flex list-disc flex-col gap-1.5 pl-5">
            <li>Your money grew 0.7% this week.</li>
            <li>Shares are 72% of your money, above your 65% plan.</li>
            <li>HDFC Bank shows up in 3 of your holdings, about 10% of everything.</li>
            <li>Your next SIP of ₹68,000 is due on 5 Nov.</li>
            <li>{openTodos} {openTodos === 1 ? 'thing is' : 'things are'} waiting for your OK.</li>
          </ul>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/dashboard/todo" className={cn(btn.primary, btn.sm)}>
              See what to do
            </Link>
            <Link href="/dashboard/ask" className={cn(btn.ghost, btn.sm)}>
              Ask a question
            </Link>
          </div>
          <AiNote>AI-made summary. Numbers come from your linked accounts.</AiNote>
        </section>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ['/dashboard/todo', 'Review to-dos', CheckSquare],
          ['/dashboard/money', 'Link an account', Link2],
          ['/dashboard/talk', 'Book a call', CalendarPlus],
          ['/dashboard/documents', 'Upload a statement', FileUp],
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
                <div className="font-semibold">{t.kind}</div>
                <div className="text-muted-foreground truncate text-sm">{t.title}</div>
              </div>
              <ArrowRight className="text-muted-foreground size-4" aria-hidden />
            </Link>
          )
        })}
        {open.length === 0 && <p className="text-muted-foreground">You are all caught up. Nice work.</p>}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHead title="Money health score" right={<Pill tone="good">Good</Pill>} />
          <div className="flex flex-wrap items-center gap-5">
            <div className="bg-mist mx-auto flex flex-col items-center rounded-2xl px-8 py-5 text-center">
              <span className="font-heading text-primary text-6xl leading-none font-semibold tabular-nums">{score}</span>
              <span className="text-muted-foreground mt-1 text-sm">out of 100</span>
            </div>
            <div className="flex min-w-44 flex-1 flex-col gap-2.5">
              {parts.map(([label, n]) => (
                <div key={label}>
                  <div className="flex justify-between text-sm">
                    <span>{label}</span>
                    <b className="tabular-nums">{n}</b>
                  </div>
                  <Bar pct={n} className="h-1.5" />
                </div>
              ))}
            </div>
          </div>
          <p className="bg-mist rounded-xl px-3 py-2.5 text-sm">
            <b>Biggest boost:</b> bring your shares back to plan. That adds about 4 points.{' '}
            <Link href="/dashboard/todo" className="text-primary font-semibold">
              Do it
            </Link>
          </p>
        </Card>

        <Card>
          <CardHead title="What WisBees saved you this year" right={<Pill>Estimates</Pill>} />
          <div className="font-heading text-4xl font-semibold text-[#1b7f4b] tabular-nums">₹22,300</div>
          <ul className="flex flex-col gap-2.5">
            {[['Direct plans, no agent commission', '₹12,000'], ['Our flat fee vs a 1% fee', '₹6,200'], ['Tax saved by booking losses', '₹4,100']].map(([k, v]) => (
              <li key={k} className="flex items-center justify-between gap-3">
                {k}
                <b className="tabular-nums">{v}</b>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground text-sm">Your fee this year: ₹23,988. Savings are estimates, not a promise of future results.</p>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Your goals</h3>
        <Link href="/dashboard/goals" className="text-primary text-sm font-semibold">
          See all goals ({onTrack} of {goals.length} on track)
        </Link>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {goals.slice(0, 2).map((g) => (
          <GoalCard key={g.id} goal={g} />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHead title="Where your money is" />
          <div className="flex flex-wrap items-center gap-6">
            <MixDonut />
            <MixLegend />
          </div>
        </Card>
        <Card>
          <CardHead title="Coming up" />
          <ol className="flex flex-col">
            {[
              ['5 Nov', 'SIP of ₹68,000 goes out', false],
              ['12 Nov, 4:00 pm', 'Call with your adviser, Neha Rao', false],
              ['31 Mar', 'Last day to book losses to save tax this year', true],
            ].map(([when, what, hollow]) => (
              <li key={when as string} className="relative flex gap-3 pb-4 last:pb-0">
                <i className={cn('relative z-10 mt-1.5 size-3 shrink-0 rounded-full', hollow ? 'bg-card border-border border-2' : 'bg-primary')} />
                <span className="bg-border absolute top-4 bottom-0 left-[0.3rem] w-0.5 group-last:hidden" aria-hidden />
                <div>
                  <b>{when as string}</b>
                  <div className="text-muted-foreground text-sm">{what as string}</div>
                </div>
              </li>
            ))}
          </ol>
          <Link href="/dashboard/activity" className="text-primary self-start text-sm font-semibold">
            Open calendar
          </Link>
        </Card>
      </div>

      <Disclaimer />
    </>
  )
}
