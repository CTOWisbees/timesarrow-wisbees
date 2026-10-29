'use client'

import { ChevronLeft, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useTransition } from 'react'

import { CLASS_COLORS } from '@/components/portfolio-scan/shared'
import { ASSUMED_RETURN, NOW_YEAR } from '@/lib/portal/data'
import { extraMonthlyNeeded, goalStatus, projectGoal } from '@/lib/portal/math'
import type { Goal } from '@/lib/portal/types'
import { cn } from '@/lib/utils'

import { addGoal, changeGoal, coachGoalAction, removeGoal } from '../actions'
import { GoalChart } from '../charts'
import { usePortal } from '../state'
import { AiNote, Bar, btn, Card, CardHead, Disclaimer, EmptyState, lakh, PageHead, Pill, rupees } from '../ui'

const years = (g: Goal) => Math.max(0, g.year - NOW_YEAR)
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

const PRESETS = [
  ['🌴', 'Retirement'],
  ['🎓', "Child's education"],
  ['🏠', 'Home down payment'],
  ['🛟', 'Emergency fund'],
  ['🏖️', 'Holiday'],
  ['🚗', 'Car'],
  ['💍', 'Wedding'],
  ['🎯', 'Something else'],
] as const

const field = 'border-input bg-card focus-visible:ring-ring/40 w-full rounded-xl border-[1.5px] px-3.5 py-2.5 outline-none focus-visible:ring-3'

function NewGoal({ onDone }: { onDone: () => void }) {
  const { say } = usePortal()
  const [pending, start] = useTransition()
  const [preset, setPreset] = useState<(typeof PRESETS)[number]>(PRESETS[0])
  const [name, setName] = useState<string>(PRESETS[0][1])
  const [target, setTarget] = useState('')
  const [year, setYear] = useState(String(NOW_YEAR + 10))
  const [saved, setSaved] = useState('0')
  const [monthly, setMonthly] = useState('0')
  const [error, setError] = useState<string | null>(null)

  const submit = () =>
    start(async () => {
      const res = await addGoal({ name, emoji: preset[0], target: Number(target), year: Number(year), saved: Number(saved || 0), monthly: Number(monthly || 0) })
      if (!res.ok) return setError(res.error)
      say('Goal added.')
      onDone()
    })

  return (
    <Card>
      <CardHead title="New goal" />
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p[1]}
            type="button"
            aria-pressed={preset[1] === p[1]}
            onClick={() => {
              setPreset(p)
              setName(p[1])
            }}
            className={cn('rounded-full border px-3.5 py-1.5 text-sm', preset[1] === p[1] ? 'bg-mint border-primary font-semibold' : 'bg-card hover:border-primary')}
          >
            {p[0]} {p[1]}
          </button>
        ))}
      </div>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <label className="text-sm">
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={cn(field, 'mt-1')} />
        </label>
        <label className="text-sm">
          Amount you need (₹)
          <input value={target} onChange={(e) => setTarget(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="e.g. 4500000" className={cn(field, 'mt-1')} />
        </label>
        <label className="text-sm">
          Needed by (year)
          <input value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" className={cn(field, 'mt-1')} />
        </label>
        <label className="text-sm">
          Already saved for it (₹)
          <input value={saved} onChange={(e) => setSaved(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className={cn(field, 'mt-1')} />
        </label>
        <label className="text-sm">
          You invest each month (₹)
          <input value={monthly} onChange={(e) => setMonthly(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className={cn(field, 'mt-1')} />
        </label>
      </div>
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2.5">
        <button type="button" className={btn.primary} disabled={pending || !name.trim() || !target} onClick={submit}>
          Save goal
        </button>
        <button type="button" className={btn.ghost} onClick={onDone}>
          Cancel
        </button>
      </div>
    </Card>
  )
}

export function GoalsList() {
  const { data } = usePortal()
  const [adding, setAdding] = useState(false)
  return (
    <>
      <PageHead
        title="My Goals"
        sub="What you are saving for, and whether you are on track."
        right={
          !adding && (
            <button type="button" className={btn.primary} onClick={() => setAdding(true)}>
              <Plus className="size-4" aria-hidden /> New goal
            </button>
          )
        }
      />
      {adding && <NewGoal onDone={() => setAdding(false)} />}
      {data.goals.length ? (
        <div className="grid gap-5 md:grid-cols-2">
          {data.goals.map((g) => (
            <GoalCard key={g.id} goal={g} />
          ))}
        </div>
      ) : (
        !adding && <EmptyState title="No goals yet" body="Add what you are saving for to see if you are on track." />
      )}
      <Disclaimer />
    </>
  )
}

export function GoalDetail({ id }: { id: string }) {
  const { data } = usePortal()
  const goal = data.goals.find((g) => g.id === id)
  if (!goal) return <EmptyState title="This goal was not found" body="It may have been removed." href="/dashboard/goals" cta="Back to my goals" />
  return <GoalView key={`${goal.id}-${goal.monthly}-${goal.saved}`} goal={goal} />
}

function GoalView({ goal }: { goal: Goal }) {
  const router = useRouter()
  const { say } = usePortal()
  const [pending, start] = useTransition()
  const [monthly, setMonthly] = useState(goal.monthly)
  const [rate, setRate] = useState(ASSUMED_RETURN)
  const [saved, setSaved] = useState(String(goal.saved))

  const projected = useMemo(() => projectGoal(base(goal, monthly, rate)).value, [goal, monthly, rate])
  const points = useMemo(() => Array.from({ length: years(goal) + 1 }, (_, y) => projectGoal({ ...base(goal, monthly, rate), years: y }).value), [goal, monthly, rate])
  const on = goalStatus(projected, goal.target) === 'on'
  const extra = extraMonthlyNeeded({ target: goal.target, ...base(goal, monthly, rate) })
  const longTerm = years(goal) > 15
  const dirty = monthly !== goal.monthly || Number(saved) !== goal.saved
  const [coach, setCoach] = useState<{ text: string; sources: { title: string; url: string }[] } | null>(null)

  // The Copilot's words come from the server (the RAG), a moment after the sliders settle.
  useEffect(() => {
    let live = true
    const t = window.setTimeout(() => {
      coachGoalAction(goal.id, monthly, rate).then((c) => live && setCoach(c))
    }, 350)
    return () => {
      live = false
      window.clearTimeout(t)
    }
  }, [goal.id, monthly, rate])

  return (
    <>
      <Link href="/dashboard/goals" className="text-primary flex items-center gap-1 self-start text-sm font-semibold">
        <ChevronLeft className="size-4" aria-hidden /> All goals
      </Link>
      <PageHead title={`${goal.emoji} ${goal.name}`} sub={`Needed by ${goal.year} · ${years(goal)} ${years(goal) === 1 ? 'year' : 'years'} left`} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-muted-foreground text-sm">Saved so far</div>
              <div className="font-heading text-2xl font-semibold tabular-nums">{lakh(goal.saved)}</div>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground text-sm">Could reach by {goal.year}</div>
              <div className={cn('font-heading text-2xl font-semibold tabular-nums', on ? 'text-primary' : 'text-destructive')}>{lakh(projected)}</div>
            </div>
          </div>
          {years(goal) > 0 && <GoalChart points={points} target={goal.target} startYear={NOW_YEAR} endYear={goal.year} />}
          <Bar pct={(projected / goal.target) * 100} warn={!on} className="h-3" />
          <p>
            <Pill tone={on ? 'good' : 'warn'}>{on ? 'On track' : 'A little behind'}</Pill> {on ? 'At this monthly amount you reach your goal.' : `You would be ${lakh(goal.target - projected)} short.`}
          </p>
        </Card>

        <Card>
          <CardHead title="Try a different amount" />
          <label htmlFor="monthly" className="text-muted-foreground text-sm">
            You invest each month
          </label>
          <div className="font-heading text-2xl font-semibold tabular-nums">{rupees(monthly)}</div>
          <input id="monthly" type="range" min={0} max={Math.max(goal.monthly * 3, 50_000)} step={500} value={monthly} onChange={(e) => setMonthly(Number(e.target.value))} className="accent-primary w-full" />
          <label htmlFor="saved" className="text-muted-foreground text-sm">
            Already saved for this goal (₹)
          </label>
          <input id="saved" value={saved} onChange={(e) => setSaved(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className={field} />
          <div className="text-muted-foreground text-sm">If your investments grow each year by about:</div>
          <div className="bg-mint inline-flex gap-0.5 self-start rounded-xl p-1" role="group" aria-label="Assumed growth">
            {[0.08, 0.1, 0.12].map((r) => (
              <button key={r} type="button" aria-pressed={r === rate} onClick={() => setRate(r)} className={cn('rounded-lg px-3.5 py-1.5 text-sm font-semibold', r === rate ? 'bg-card text-ink shadow-sm' : 'text-muted-foreground')}>
                {Math.round(r * 100)}%
              </button>
            ))}
          </div>
          <div className="bg-mint rounded-xl p-3.5">
            <b>Copilot says</b>
            <p className="mt-1 text-sm">{coach ? coach.text : extra > 0 ? `Adding ${rupees(extra)} a month puts you back on track at ${Math.round(rate * 100)}%.` : 'You are covered at this amount and growth rate.'}</p>
            {coach && (
              <p className="text-muted-foreground mt-1.5 flex flex-wrap gap-x-2 text-xs">
                Sources:
                {coach.sources.map((s) => (
                  <Link key={s.title} href={s.url} className="text-primary underline underline-offset-2">
                    {s.title}
                  </Link>
                ))}
              </p>
            )}
            <AiNote>AI-made from your numbers and our published notes. Growth rates are assumptions, not promises.</AiNote>
          </div>
        </Card>
      </div>

      <Card>
        <CardHead title="Typical mix for this goal" />
        <ul className="flex flex-col gap-2">
          {[
            [CLASS_COLORS.equity, longTerm ? 'Shares (index and flexi-cap funds)' : 'Shares and bond funds', longTerm ? '80%' : '50%'],
            [CLASS_COLORS.debt, 'Bond funds', longTerm ? '15%' : '40%'],
            [CLASS_COLORS.gold, 'Gold', '5%'],
          ].map(([c, l, p]) => (
            <li key={l} className="flex items-center gap-2.5">
              <i className="size-3 rounded-[3px]" style={{ background: c }} />
              {l}
              <b className="ml-auto">{p}</b>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground text-sm">A general guide by time left. Your adviser sets your actual mix.</p>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            className={cn(btn.primary, btn.sm)}
            disabled={!dirty || pending}
            onClick={() =>
              start(async () => {
                const res = await changeGoal(goal.id, { monthly, saved: Number(saved || 0) })
                say(res.ok ? 'Saved.' : res.error)
              })
            }
          >
            Save changes
          </button>
          <Link href="/dashboard/talk" className={cn(btn.ghost, btn.sm)}>
            Plan with my adviser
          </Link>
          <button
            type="button"
            className={cn(btn.ghost, btn.sm, 'text-destructive border-destructive/40 hover:bg-destructive/10 ml-auto')}
            disabled={pending}
            onClick={() => {
              if (!window.confirm(`Remove the goal “${goal.name}”?`)) return
              start(async () => {
                await removeGoal(goal.id)
                router.push('/dashboard/goals')
              })
            }}
          >
            <Trash2 className="size-3.5" aria-hidden /> Remove goal
          </button>
        </div>
      </Card>
      <Disclaimer />
    </>
  )
}
