'use client'

import { Coins, Lock, Percent, ShieldCheck, Target, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'

import { hasDrifted } from '@/lib/portal/math'
import type { Todo } from '@/lib/portal/types'
import { cn } from '@/lib/utils'

import { answerSuggestion } from '../actions'
import { usePortal } from '../state'
import { AiNote, asOfText, btn, Card, CardHead, Disclaimer, EmptyState, IconBox, PageHead, Pill, rupees, Stat } from '../ui'

const ICON = { invest: TrendingUp, tax: Percent, goal: Target } as const

export function Actions({ screen }: { screen: 'todo' | 'invest' | 'activity' | 'tax' }) {
  return screen === 'todo' ? <TodoScreen /> : screen === 'invest' ? <Invest /> : screen === 'activity' ? <Activity /> : <Tax />
}

function TodoScreen() {
  const { data, openTodos, answered } = usePortal()
  const [confirming, setConfirming] = useState<Todo | null>(null)
  return (
    <>
      <PageHead
        title="To Do"
        sub={openTodos ? `${openTodos} waiting for your OK` : 'Nothing is waiting for you.'}
      />
      <div className="bg-mint flex items-center gap-3 rounded-2xl p-4 text-sm">
        <ShieldCheck className="text-primary size-5 shrink-0" aria-hidden />
        <p>
          <b>You stay in charge.</b> We never move your money. Orders are prepared for your own account.
        </p>
      </div>
      {!data.hasPortfolio && <EmptyState title="No suggestions yet" body="Add your holdings to see suggestions." href="/portfolio-scan" cta="Run a Port Scan" />}
      {data.hasPortfolio && data.todos.length === 0 && <EmptyState title="All clear" body="Nothing needs your attention." />}
      {data.todos.map((t) => (
        <TodoCard key={t.id} todo={t} decision={answered(t.id)} onApprove={() => setConfirming(t)} />
      ))}
      <Disclaimer />
      {confirming && <ConfirmDialog todo={confirming} onClose={() => setConfirming(null)} />}
    </>
  )
}

const DECISION_WORD = { approved: 'Approved', declined: 'Not now' } as const

function TodoCard({ todo: t, decision, onApprove }: { todo: Todo; decision?: 'approved' | 'declined'; onApprove: () => void }) {
  const { markAnswered, say } = usePortal()
  const [pending, start] = useTransition()
  const Icon = ICON[t.icon]
  return (
    <article className={cn('bg-card flex flex-col gap-3 rounded-2xl border p-5', decision && 'opacity-60')}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <IconBox>
            <Icon className="size-5" aria-hidden />
          </IconBox>
          <Pill tone="info">{t.label}</Pill>
        </div>
        {decision ? <Pill tone={decision === 'approved' ? 'good' : 'grey'}>{DECISION_WORD[decision]}</Pill> : <Pill>Needs your OK</Pill>}
      </div>
      <h3 className="text-lg font-semibold">{t.title}</h3>
      <p className="bg-mist rounded-xl px-3.5 py-3 text-sm">
        <b>Why this?</b> {t.why}
      </p>
      {t.explainer && (
        <p className="text-sm">
          <b>What this means:</b> {t.explainer.text}{' '}
          <Link href={t.explainer.url} className="text-primary font-semibold whitespace-nowrap underline underline-offset-2">
            {t.explainer.title}
          </Link>
        </p>
      )}
      <dl className="grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-x-4 gap-y-2.5">
        {t.details.map(([k, v]) => (
          <div key={k}>
            <dt className="text-muted-foreground text-xs">{k}</dt>
            <dd className="font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-muted-foreground text-sm">
        <b>Good to know:</b> {t.risk}
      </p>
      {!decision && (
        <div className="flex flex-wrap gap-2.5">
          <button type="button" className={btn.primary} disabled={pending} onClick={onApprove}>
            Approve
          </button>
          <button
            type="button"
            className={btn.ghost}
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await answerSuggestion(t.id, 'declined')
                if (res.ok) {
                  markAnswered(t.id, 'declined')
                  say('Okay. We will keep it here if it is still true later.')
                } else say(res.error)
              })
            }
          >
            Not now
          </button>
          <Link href="/dashboard/talk" className={btn.ghost}>
            Ask my adviser
          </Link>
        </div>
      )}
      <AiNote>AI-prepared. Nothing happens until you approve.</AiNote>
    </article>
  )
}

function ConfirmDialog({ todo, onClose }: { todo: Todo; onClose: () => void }) {
  const { markAnswered, say } = usePortal()
  const [pending, start] = useTransition()
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Please confirm" className="bg-card flex w-full max-w-lg flex-col gap-3.5 rounded-t-3xl p-6 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold">Please confirm</h2>
        <p>
          <b>{todo.label}</b>: {todo.title}
        </p>
        <p className="bg-mist rounded-xl p-3.5 text-sm">
          Your adviser prepares this for <b>your own</b> account. WisBees never moves your money; you approve there.
        </p>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            className={btn.primary}
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await answerSuggestion(todo.id, 'approved')
                if (res.ok) {
                  markAnswered(todo.id, 'approved')
                  say('Recorded. Your adviser will prepare it for your own account.')
                } else say(res.error)
                onClose()
              })
            }
          >
            Yes, approve
          </button>
          <button type="button" className={btn.ghost} onClick={onClose}>
            Cancel
          </button>
        </div>
        <p className="text-muted-foreground text-xs">Investments are subject to market risks.</p>
      </div>
    </div>
  )
}

function Invest() {
  const { data } = usePortal()
  const monthlyTotal = data.goals.reduce((s, g) => s + g.monthly, 0)
  const shares = data.mix.find((m) => m.label === 'Shares')
  const gold = data.mix.find((m) => m.label === 'Gold')
  const drifted = data.mix.some((m) => m.plan !== null && hasDrifted({ label: m.label, now: m.now, plan: m.plan }))
  return (
    <>
      <PageHead title="Invest" sub="Your risk limit, what you plan to invest each month, and what is next." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHead title="Your risk profile" right={data.risk.category ? <Pill tone="info">{data.risk.category}</Pill> : null} />
          {data.risk.equityLimit !== null ? (
            <>
              <p className="text-muted-foreground">Allows up to {data.risk.equityLimit}% in shares.</p>
              {data.hasPortfolio ? (
                <ul className="flex flex-col gap-2">
                  {data.mix.map((m) => (
                    <li key={m.label} className="flex items-center gap-2.5">
                      <i className="size-3 rounded-[3px]" style={{ background: m.colour }} />
                      {m.label}
                      <b className="ml-auto tabular-nums">{m.plan !== null ? `${m.now}% now · limit ${m.plan}%` : `${m.now}%`}</b>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">Add your holdings in Port Scan to compare them with this.</p>
              )}
            </>
          ) : (
            <>
              <p className="text-muted-foreground">Finish the risk questions to set your share limit.</p>
              <Link href="/onboarding" className={cn(btn.primary, btn.sm, 'self-start')}>
                Finish my profile
              </Link>
            </>
          )}
        </Card>
        <Card>
          <CardHead title="Monthly investing" />
          {monthlyTotal > 0 ? (
            <>
              <div className="font-heading text-2xl font-semibold tabular-nums">
                {rupees(monthlyTotal)} <span className="text-muted-foreground font-sans text-sm font-normal">a month across your goals</span>
              </div>
              <ul className="flex flex-col gap-2.5">
                {data.goals
                  .filter((g) => g.monthly > 0)
                  .map((g) => (
                    <li key={g.id} className="flex items-center justify-between gap-3">
                      <span>
                        {g.emoji} {g.name}
                      </span>
                      <b className="tabular-nums">{rupees(g.monthly)}</b>
                    </li>
                  ))}
              </ul>
            </>
          ) : (
            <p className="text-muted-foreground">Set a monthly amount on each goal and it adds up here.</p>
          )}
          <p className="text-muted-foreground text-sm">You invest from your own account.</p>
          <Link href="/dashboard/goals" className={cn(btn.ghost, btn.sm, 'self-start')}>
            Change amounts in My Goals
          </Link>
        </Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <IconBox>
            <TrendingUp className="size-5" aria-hidden />
          </IconBox>
          <h3 className="text-lg font-semibold">Bring back to plan</h3>
          <p className="text-muted-foreground text-sm">Flags when shares pass your limit.</p>
          {data.hasPortfolio && shares && data.risk.equityLimit !== null ? <Pill tone={drifted ? 'warn' : 'good'}>{drifted ? 'Past your limit' : 'Inside your limit'}</Pill> : <Pill>Needs holdings and a risk profile</Pill>}
          <Link href="/dashboard/todo" className={cn(btn.ghost, btn.sm, 'self-start')}>
            Review
          </Link>
        </Card>
        <Card>
          <IconBox>
            <Coins className="size-5" aria-hidden />
          </IconBox>
          <h3 className="text-lg font-semibold">Gold and silver</h3>
          <p className="text-muted-foreground text-sm">{data.hasPortfolio ? `You hold ${gold?.now ?? 0}% in gold.` : 'Add holdings to see yours.'}</p>
        </Card>
        <Card className="border-border border-dashed">
          <IconBox>
            <Lock className="size-5" aria-hidden />
          </IconBox>
          <h3 className="text-lg font-semibold">Specialised funds (SIFs)</h3>
          <p className="text-muted-foreground text-sm">₹10 lakh minimum. Private plan.</p>
          <Pill>Private plan</Pill>
          <Link href="/fees" className={cn(btn.ghost, btn.sm, 'self-start')}>
            See plans
          </Link>
        </Card>
      </div>
      <Disclaimer />
    </>
  )
}

function Activity() {
  const { data, answered } = usePortal()
  const answeredTodos = data.todos.filter((t) => answered(t.id))
  const history = [...data.scoreHistory].reverse()
  return (
    <>
      <PageHead title="Activity" sub="What you answered and how your Port Scan has changed." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHead title="Your answers" />
          {answeredTodos.length === 0 ? (
            <p className="text-muted-foreground">You have not answered any suggestion yet.</p>
          ) : (
            answeredTodos.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                <div className="min-w-0">
                  <div className="font-semibold">{t.label}</div>
                  <div className="text-muted-foreground truncate text-sm">{t.title}</div>
                </div>
                <Pill tone={answered(t.id) === 'approved' ? 'good' : 'grey'}>{DECISION_WORD[answered(t.id)!]}</Pill>
              </div>
            ))
          )}
          
        </Card>
        <Card>
          <CardHead title="Port Scan history" />
          {history.length === 0 ? (
            <p className="text-muted-foreground">No checks yet.</p>
          ) : (
            <ol className="flex flex-col">
              {history.slice(0, 8).map((h) => (
                <li key={h.date + h.score} className="flex gap-3 pb-3 last:pb-0">
                  <i className="bg-primary mt-1.5 size-3 shrink-0 rounded-full" />
                  <div>
                    <b>{asOfText(h.date)}</b>
                    <div className="text-muted-foreground text-sm">Health score {h.score} out of 100</div>
                  </div>
                </li>
              ))}
            </ol>
          )}
          <Link href="/portfolio-scan" className={cn(btn.ghost, btn.sm, 'self-start')}>
            Run a new check
          </Link>
        </Card>
      </div>
      <Disclaimer />
    </>
  )
}

/** Days until the next 31 March, the last day to book losses for the tax year. */
function daysToMarch31() {
  const now = new Date()
  let d = new Date(now.getFullYear(), 2, 31)
  if (d.getTime() < now.getTime()) d = new Date(now.getFullYear() + 1, 2, 31)
  return Math.ceil((d.getTime() - now.getTime()) / 86_400_000)
}

function Tax() {
  const { data } = usePortal()
  const total = data.losses.reduce((s, l) => s + l.loss, 0)
  const days = daysToMarch31()
  return (
    <>
      <PageHead title="Save Tax" sub="Simple ways to keep more of what you earn." />
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Holdings below what you paid" value={String(data.losses.length)} />
        <Stat label="Total unrealised loss" value={total ? rupees(total) : '₹0'} sub="Not booked yet" />
        <Stat label="Last date to act" value="31 March" sub={<Pill tone="info">{days} days left</Pill>} />
      </div>
      {!data.hasPortfolio ? (
        <EmptyState title="Add your holdings first" body="We look for holdings worth less than you paid." href="/portfolio-scan" cta="Run a Port Scan" />
      ) : data.losses.length === 0 ? (
        <EmptyState title="Nothing to book right now" body="No holding is below what you paid. Add what you paid in Port Scan so we can tell." href="/portfolio-scan" cta="Update my holdings" />
      ) : (
        <Card flat>
          <div className="px-5 pt-5 pb-2">
            <h3 className="text-lg font-semibold">Investments that are down</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[30rem] text-sm">
              <thead>
                <tr className="text-muted-foreground text-left text-xs font-semibold">
                  <th className="px-5 py-2.5">Investment</th>
                  <th className="px-5 py-2.5 text-right">Down by</th>
                  <th className="px-5 py-2.5 text-right">Against what you paid</th>
                </tr>
              </thead>
              <tbody>
                {data.losses.map((l) => (
                  <tr key={l.name} className="border-t">
                    <td className="px-5 py-3 font-semibold">{l.name}</td>
                    <td className="text-destructive px-5 py-3 text-right tabular-nums">{rupees(l.loss)}</td>
                    <td className="text-destructive px-5 py-3 text-right tabular-nums">{l.gainPct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <section className="bg-mint flex flex-col gap-2.5 rounded-2xl p-5">
        <h3 className="text-lg font-semibold">How this works</h3>
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>If you sell something at a loss, that loss can cancel gains from other sales. Your tax bill can go down.</li>
          <li>You stay invested by moving into a similar investment.</li>
          <li>Our CA team works out the saving with you. You approve every sale.</li>
        </ul>
        <div className="flex flex-wrap gap-2.5">
          <Link href="/dashboard/todo" className={cn(btn.primary, btn.sm)}>
            Review suggestions
          </Link>
          <Link href="/dashboard/talk" className={cn(btn.ghost, btn.sm)}>
            Book a tax review
          </Link>
        </div>
      </section>
      <p className="text-muted-foreground border-t pt-4 text-xs">
        Tax rules change and savings are estimates. This is not a guarantee. Please check with your tax advisor. Investments in securities markets are subject to market risks.
      </p>
    </>
  )
}
