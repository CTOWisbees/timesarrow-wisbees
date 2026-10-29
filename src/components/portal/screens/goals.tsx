'use client'

import { ChevronLeft, Plus } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { ASSUMED_RETURN, type Goal, goals, NOW_YEAR } from '@/lib/portal/data'
import { extraMonthlyNeeded, goalStatus, projectGoal } from '@/lib/portal/math'
import { cn } from '@/lib/utils'

import { AiNote, Bar, btn, Card, CardHead, Disclaimer, lakh, PageHead, Pill, rupees } from '../ui'
import { GoalChart } from '../charts'
import { usePortal } from '../state'

const years = (g: Goal) => g.year - NOW_YEAR
const base = (g: Goal, monthly = g.monthly, annualReturn = ASSUMED_RETURN) => ({ saved: g.saved, monthly, annualReturn, years: years(g) })

export function GoalCard({ goal: g }: { goal: Goal }) {
  const on = goalStatus(projectGoal(base(g)).value, g.target) === 'on'
  const pct = Math.round((g.saved / g.target) * 100)
  return (
    <Link href={`/dashboard/goals/${g.id}`} className="block">
      <Card className="hover:border-primary h-full transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl" aria-hidden>
              {g.emoji}
            </span>
            <div>
              <h3 className="text-lg font-semibold">{g.name}</h3>
              <div className="text-muted-foreground text-sm">Needed by {g.year}</div>
            </div>
          </div>
          <Pill tone={on ? 'good' : 'warn'}>{on ? 'On track' : 'A little behind'}</Pill>
        </div>
        <Bar pct={pct} warn={!on} />
        <div className="flex justify-between text-sm">
          <span>
            <b className="tabular-nums">{lakh(g.saved)}</b> saved
          </span>
          <span className="text-muted-foreground">
            Goal {lakh(g.target)} · {pct}%
          </span>
        </div>
      </Card>
    </Link>
  )
}

export function GoalsList() {
  const { say } = usePortal()
  return (
    <>
      <PageHead
        title="My Goals"
        sub="What you are saving for, and whether you are on track."
        right={
          <button type="button" className={btn.primary} onClick={() => say('New goals are set up with your adviser in this release.')}>
            <Plus className="size-4" aria-hidden /> New goal
          </button>
        }
      />
      <div className="grid gap-5 md:grid-cols-2">
        {goals.map((g) => (
          <GoalCard key={g.id} goal={g} />
        ))}
      </div>
      <Card>
        <CardHead title="Add a goal" />
        <div className="flex flex-wrap gap-2">
          {['🏖️ Holiday', '🚗 Car', '💍 Wedding', "👨‍👩‍👧 Parents' care", '🏢 Business', '✍️ Something else'].map((s) => (
            <button key={s} type="button" onClick={() => say('Noted. Your adviser will help you set this goal up.')} className="bg-card hover:border-primary rounded-full border px-3.5 py-1.5 text-sm">
              {s}
            </button>
          ))}
        </div>
      </Card>
      <Disclaimer />
    </>
  )
}

export function GoalDetail({ id }: { id: string }) {
  const goal = goals.find((g) => g.id === id)!
  const [monthly, setMonthly] = useState(goal.monthly)
  const [rate, setRate] = useState(ASSUMED_RETURN)
  const { say } = usePortal()

  const projected = useMemo(() => projectGoal(base(goal, monthly, rate)).value, [goal, monthly, rate])
  const points = useMemo(() => Array.from({ length: years(goal) + 1 }, (_, y) => projectGoal({ ...base(goal, monthly, rate), years: y }).value), [goal, monthly, rate])
  const on = goalStatus(projected, goal.target) === 'on'
  const extra = extraMonthlyNeeded({ target: goal.target, ...base(goal, monthly, rate) })
  const longTerm = years(goal) > 15

  return (
    <>
      <Link href="/dashboard/goals" className="text-primary flex items-center gap-1 self-start text-sm font-semibold">
        <ChevronLeft className="size-4" aria-hidden /> All goals
      </Link>
      <PageHead title={`${goal.emoji} ${goal.name}`} sub={`Needed by ${goal.year} · ${years(goal)} years left`} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-muted-foreground text-sm">Saved so far</div>
              <div className="font-heading text-2xl font-semibold tabular-nums">{lakh(goal.saved)}</div>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground text-sm">Could reach by {goal.year}</div>
              <div className={cn('font-heading text-2xl font-semibold tabular-nums', on ? 'text-[#1b7f4b]' : 'text-destructive')}>{lakh(projected)}</div>
            </div>
          </div>
          <GoalChart points={points} target={goal.target} startYear={NOW_YEAR} endYear={goal.year} />
          <Bar pct={(projected / goal.target) * 100} warn={!on} className="h-3" />
          <p>
            <Pill tone={on ? 'good' : 'warn'}>{on ? 'On track' : 'A little behind'}</Pill>{' '}
            {on ? 'At this monthly amount you reach your goal.' : `You would be ${lakh(goal.target - projected)} short.`}
          </p>
        </Card>

        <Card>
          <CardHead title="Try a different amount" />
          <label htmlFor="monthly" className="text-muted-foreground text-sm">
            You invest each month
          </label>
          <div className="font-heading text-2xl font-semibold tabular-nums">{rupees(monthly)}</div>
          <input id="monthly" type="range" min={0} max={goal.monthly * 3} step={500} value={monthly} onChange={(e) => setMonthly(Number(e.target.value))} className="accent-primary w-full" />
          <div className="text-muted-foreground text-sm">If your investments grow each year by about:</div>
          <div className="bg-mint inline-flex gap-0.5 self-start rounded-xl p-1" role="group" aria-label="Assumed growth">
            {[0.08, 0.1, 0.12].map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={r === rate}
                onClick={() => setRate(r)}
                className={cn('rounded-lg px-3.5 py-1.5 text-sm font-semibold', r === rate ? 'bg-card text-ink shadow-sm' : 'text-muted-foreground')}
              >
                {Math.round(r * 100)}%
              </button>
            ))}
          </div>
          <div className="bg-mint rounded-xl p-3.5">
            <b>Copilot says</b>
            <p className="mt-1 text-sm">
              {extra > 0 ? `Adding ${rupees(extra)} a month puts you back on track at ${Math.round(rate * 100)}%.` : 'Nice. You are covered at this amount and growth rate.'}
            </p>
            <AiNote>AI-made. Growth rates are assumptions, not promises.</AiNote>
          </div>
        </Card>
      </div>

      <Card>
        <CardHead title="What this goal is invested in" />
        <ul className="flex flex-col gap-2">
          {[
            ['#0e6b4e', longTerm ? 'Shares (index and flexi-cap funds)' : 'Shares and bond funds', longTerm ? '80%' : '50%'],
            ['#245a9e', 'Bond funds', longTerm ? '15%' : '40%'],
            ['#c98a12', 'Gold', '5%'],
          ].map(([c, l, p]) => (
            <li key={l} className="flex items-center gap-2.5">
              <i className="size-3 rounded-[3px]" style={{ background: c }} />
              {l}
              <b className="ml-auto">{p}</b>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2.5">
          <button type="button" className={cn(btn.ghost, btn.sm)} onClick={() => say(`Monthly amount for ${goal.name} saved as ${rupees(monthly)}.`)}>
            Save new monthly amount
          </button>
          <Link href="/dashboard/talk" className={cn(btn.ghost, btn.sm)}>
            Plan with my adviser
          </Link>
        </div>
      </Card>
      <Disclaimer />
    </>
  )
}
