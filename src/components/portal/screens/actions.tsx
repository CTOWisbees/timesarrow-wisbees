'use client'

import { Lock, Percent, ShieldCheck, TrendingUp, Target, Coins } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { calendarEvents, goals, mix, orders, todos, type Todo } from '@/lib/portal/data'
import { hasDrifted } from '@/lib/portal/math'
import { cn } from '@/lib/utils'

import { AiNote, btn, Card, CardHead, Disclaimer, IconBox, PageHead, Pill, rupees, Stat } from '../ui'
import { usePortal } from '../state'

const ICON = { invest: TrendingUp, tax: Percent, goal: Target } as const

export function Actions({ screen }: { screen: 'todo' | 'invest' | 'activity' | 'tax' }) {
  return screen === 'todo' ? <TodoScreen /> : screen === 'invest' ? <Invest /> : screen === 'activity' ? <Activity /> : <Tax />
}

function TodoScreen() {
  const { decisions, openTodos } = usePortal()
  const [confirming, setConfirming] = useState<Todo | null>(null)
  return (
    <>
      <PageHead title="To Do" sub={openTodos ? `${openTodos} ${openTodos === 1 ? 'thing needs' : 'things need'} your OK. We get everything ready; you decide.` : 'You are all caught up.'} />
      <div className="bg-mint flex items-center gap-3 rounded-2xl p-4 text-sm">
        <ShieldCheck className="text-primary size-5 shrink-0" aria-hidden />
        <p>
          <b>You are always in charge.</b> We never move your money by ourselves. When you approve, the order goes through your own account.
        </p>
      </div>
      {todos.map((t) => (
        <TodoCard key={t.id} todo={t} decision={decisions[t.id]} onApprove={() => setConfirming(t)} />
      ))}
      <Disclaimer />
      {confirming && <ConfirmDialog todo={confirming} onClose={() => setConfirming(null)} />}
    </>
  )
}

function TodoCard({ todo: t, decision, onApprove }: { todo: Todo; decision?: string; onApprove: () => void }) {
  const { decide, say } = usePortal()
  const Icon = ICON[t.icon]
  return (
    <article className={cn('bg-card flex flex-col gap-3 rounded-2xl border p-5', decision && 'opacity-60')}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <IconBox>
            <Icon className="size-5" aria-hidden />
          </IconBox>
          <Pill tone="info">{t.kind}</Pill>
        </div>
        {decision ? <Pill tone="good">{decision}</Pill> : <Pill>Needs your OK</Pill>}
      </div>
      <h3 className="text-lg font-semibold">{t.title}</h3>
      <p className="bg-mist rounded-xl px-3.5 py-3 text-sm">
        <b>Why this?</b> {t.why}
      </p>
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
          <button type="button" className={btn.primary} onClick={onApprove}>
            Approve
          </button>
          <button
            type="button"
            className={btn.ghost}
            onClick={() => {
              decide(t.id, 'Not now')
              say('Okay. We will remind you later.')
            }}
          >
            Not now
          </button>
          <Link href="/dashboard/talk" className={btn.ghost}>
            Ask my adviser
          </Link>
        </div>
      )}
      <AiNote>Prepared by Bees Copilot (AI), checked by our rules. Nothing happens until you approve.</AiNote>
    </article>
  )
}

function ConfirmDialog({ todo, onClose }: { todo: Todo; onClose: () => void }) {
  const { decide, say } = usePortal()
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Please confirm" className="bg-card flex w-full max-w-lg flex-col gap-3.5 rounded-t-3xl p-6 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold">Please confirm</h2>
        <p>
          <b>{todo.kind}</b>: {todo.title}
        </p>
        <p className="bg-mist rounded-xl p-3.5 text-sm">
          You are telling WisBees to prepare this order. It is sent to <b>your own</b> mutual fund account and you will get a receipt. WisBees does not hold or move your money.
        </p>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            className={btn.primary}
            onClick={() => {
              decide(todo.id, 'Approved')
              onClose()
              say('Approved. We will confirm once it is done.')
            }}
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
  const { say } = usePortal()
  return (
    <>
      <PageHead title="Invest" sub="Your plan, your monthly investing and what is next." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHead title="Your plan" right={<Pill tone="info">Medium risk</Pill>} />
          <p className="text-muted-foreground">Based on your risk quiz in January. A mix that aims for steady growth with moderate ups and downs.</p>
          <ul className="flex flex-col gap-2">
            {mix.map((m) => (
              <li key={m.label} className="flex items-center gap-2.5">
                <i className="size-3 rounded-[3px]" style={{ background: m.colour }} />
                {m.label}
                <b className="ml-auto tabular-nums">
                  {m.now}% now · plan {m.plan}%
                </b>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2.5">
            <button type="button" className={cn(btn.ghost, btn.sm)} onClick={() => say('Your plan’s fund list is in My Documents.')}>
              See funds in my plan
            </button>
            <Link href="/onboarding?step=2" className={cn(btn.ghost, btn.sm)}>
              Retake risk quiz
            </Link>
          </div>
        </Card>
        <Card>
          <CardHead title="Monthly investing (SIP)" right={<Pill tone="good">On</Pill>} />
          <div className="font-heading text-2xl font-semibold tabular-nums">
            ₹68,000 <span className="text-muted-foreground font-sans text-sm font-normal">a month, on the 5th</span>
          </div>
          <ul className="flex flex-col gap-2.5">
            {goals.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-3">
                <span>
                  {g.emoji} {g.name}
                </span>
                <b className="tabular-nums">{rupees(g.monthly)}</b>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground text-sm">Each month we send you a one-tap approval. Money is taken from your linked bank account and invested in your own fund account.</p>
          <div className="flex flex-wrap gap-2.5">
            <button type="button" className={cn(btn.primary, btn.sm)} onClick={() => say('Change amounts from each goal page.')}>
              Change amounts
            </button>
            <button type="button" className={cn(btn.ghost, btn.sm)} onClick={() => say('To pause a SIP, ask your adviser or approve nothing this month.')}>
              Pause
            </button>
          </div>
        </Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <IconBox>
            <TrendingUp className="size-5" aria-hidden />
          </IconBox>
          <h3 className="text-lg font-semibold">Bring back to plan</h3>
          <p className="text-muted-foreground text-sm">Daily check on whether your mix has drifted. We show a ready fix when it has.</p>
          <Pill tone={mix.some((m) => hasDrifted(m)) ? 'warn' : 'good'}>{mix.some((m) => hasDrifted(m)) ? '1 waiting' : 'On plan'}</Pill>
          <Link href="/dashboard/todo" className={cn(btn.ghost, btn.sm, 'self-start')}>
            Review
          </Link>
        </Card>
        <Card>
          <IconBox>
            <Coins className="size-5" aria-hidden />
          </IconBox>
          <h3 className="text-lg font-semibold">Gold and silver</h3>
          <p className="text-muted-foreground text-sm">A small share that can steady your plan. You hold 5% in gold, aim for 5%.</p>
          <Pill tone="good">Good</Pill>
        </Card>
        <Card className="border-border border-dashed">
          <IconBox>
            <Lock className="size-5" aria-hidden />
          </IconBox>
          <h3 className="text-lg font-semibold">Specialised funds (SIFs)</h3>
          <p className="text-muted-foreground text-sm">An advanced fund type with a ₹10 lakh minimum and extra risk. Part of the Private plan, after a suitability check.</p>
          <Pill>Private plan</Pill>
          <Link href="/dashboard/plan" className={cn(btn.ghost, btn.sm, 'self-start')}>
            See plans
          </Link>
        </Card>
      </div>
      <Card>
        <CardHead title="Why we picked these funds" />
        <p className="text-muted-foreground">Every fund has a written reason: low cost, steady track record, fits your plan. Read the reasons any time.</p>
        <Link href="/dashboard/ask" className={cn(btn.ghost, btn.sm, 'self-start')}>
          Explain my funds in simple words
        </Link>
      </Card>
      <Disclaimer />
    </>
  )
}

function Activity() {
  const { decisions } = usePortal()
  const steps = ['You approved', 'Sent to fund house', 'Units in your account']
  return (
    <>
      <PageHead title="Activity" sub="Your calendar, orders and what happened to each one." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHead title="November 2026" right={<span className="text-muted-foreground text-sm">SIP, calls, events</span>} />
          <div className="grid grid-cols-7 gap-1 text-center">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <b key={i} className="text-muted-foreground text-sm">
                {d}
              </b>
            ))}
            {/* 1 Nov 2026 is a Sunday, so the first day sits in the first column. */}
            {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
              const e = calendarEvents[d]
              return (
                <div key={d} className={cn('min-h-11 rounded-lg p-1 text-[0.8rem]', e && 'bg-mint')} style={e ? { outline: `2px solid ${e.tone}` } : undefined}>
                  {d}
                  {e && <div className="text-[0.56rem] leading-tight font-bold">{e.label}</div>}
                </div>
              )
            })}
          </div>
        </Card>
        <Card>
          <CardHead title="Your orders" />
          {orders.map((o) => {
            const key = o.title === 'Bring back to plan' ? 'rebalance' : o.title === 'Save tax on a loss' ? 'harvest' : ''
            const decided = key ? decisions[key] : undefined
            const done = o.done || decided === 'Approved'
            return (
              <div key={o.title} className="flex flex-col gap-2 rounded-xl border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{o.title}</div>
                    <div className="text-muted-foreground text-sm">{decided ? decided : o.meta}</div>
                  </div>
                  {done ? <Pill tone="good">{o.done ? 'Done' : 'Approved'}</Pill> : <Link href="/dashboard/todo" className={cn(btn.primary, btn.sm)}>Review</Link>}
                </div>
                {o.done && (
                  <div className="flex gap-1.5">
                    {steps.map((s) => (
                      <div key={s} className="flex-1">
                        <div className="bg-primary h-1.5 rounded-full" />
                        <div className="text-muted-foreground mt-1 text-[0.7rem]">{s}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          <p className="text-muted-foreground text-sm">Orders go through your own fund account. Each step is saved with the date and time.</p>
        </Card>
      </div>
      <Card>
        <CardHead title="Recent history" />
        <ol className="flex flex-col">
          {[
            ['5 Oct', 'SIP of ₹38,000 invested. 2 orders done.'],
            ['15 Aug', 'Portfolio review call. Summary saved in Documents.'],
            ['12 Jan', 'You signed your advisory agreement and risk report.'],
          ].map(([w, t]) => (
            <li key={w} className="flex gap-3 pb-4 last:pb-0">
              <i className="bg-primary mt-1.5 size-3 shrink-0 rounded-full" />
              <div>
                <b>{w}</b>
                <div className="text-muted-foreground text-sm">{t}</div>
              </div>
            </li>
          ))}
        </ol>
      </Card>
      <Disclaimer />
    </>
  )
}

function Tax() {
  const { say } = usePortal()
  return (
    <>
      <PageHead title="Save Tax" sub="Simple ways to keep more of what you earn." />
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="gap-1">
          <span className="text-muted-foreground text-sm">Tax you may save this year</span>
          <div className="font-heading text-4xl font-semibold text-[#1b7f4b] tabular-nums">₹4,750</div>
          <span className="text-muted-foreground text-sm">An estimate, not a promise</span>
        </Card>
        <Stat label="Gains booked so far this year" value="₹1,12,000" />
        <Stat label="Last date to act" value="31 March" sub={<Pill tone="info">5 months left</Pill>} />
      </div>
      <Card flat>
        <div className="px-5 pt-5 pb-2">
          <h3 className="text-lg font-semibold">Investments that are down</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="text-muted-foreground text-left text-xs font-semibold">
                <th className="px-5 py-2.5">Investment</th>
                <th className="px-5 py-2.5 text-right">Down by</th>
                <th className="px-5 py-2.5 text-right">Tax you may save</th>
                <th className="px-5 py-2.5">Can you sell now?</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-5 py-3 font-semibold">Mirae Asset Large & Midcap</td>
                <td className="text-destructive px-5 py-3 text-right tabular-nums">₹38,000</td>
                <td className="px-5 py-3 text-right tabular-nums">₹4,750</td>
                <td className="px-5 py-3">
                  <Pill tone="good">Yes</Pill>
                </td>
              </tr>
              <tr className="border-t">
                <td className="px-5 py-3 font-semibold">Infosys</td>
                <td className="text-destructive px-5 py-3 text-right tabular-nums">₹7,100</td>
                <td className="px-5 py-3 text-right tabular-nums">₹890</td>
                <td className="px-5 py-3">
                  <Pill tone="warn">After 12 Dec</Pill>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
      <section className="bg-mint flex flex-col gap-2.5 rounded-2xl p-5">
        <h3 className="text-lg font-semibold">How this works</h3>
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>If you sell something at a loss, that loss can cancel gains from other sales. Your tax bill can go down.</li>
          <li>We put your money into a similar fund so you stay invested.</li>
          <li>Our CA team checks the rules. You approve every sale.</li>
        </ul>
        <Link href="/dashboard/todo" className={cn(btn.primary, btn.sm, 'self-start')}>
          Review the suggestion
        </Link>
      </section>
      <Card flat>
        <div className="px-5 pt-5 pb-2">
          <h3 className="text-lg font-semibold">Your gains this year</h3>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {[
              ['Short-term gains', '₹18,000', 'Sold within 1 year'],
              ['Long-term gains', '₹94,000', 'Sold after 1 year. A yearly part is tax-free under current rules.'],
              ['Losses booked', '₹0', 'Can cancel gains'],
            ].map(([a, b, c]) => (
              <tr key={a} className="border-t">
                <td className="px-5 py-3 font-semibold">{a}</td>
                <td className="px-5 py-3 text-right tabular-nums">{b}</td>
                <td className="text-muted-foreground px-5 py-3">{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card>
        <CardHead title="Tax papers" />
        <div className="flex flex-wrap gap-2.5">
          <button type="button" className={cn(btn.ghost, btn.sm)} onClick={() => say('Your capital gains report is in My Documents.')}>
            Capital gains report
          </button>
          <button type="button" className={cn(btn.ghost, btn.sm)} onClick={() => say('We will email a secure link to your CA once you add their address.')}>
            Share with my CA
          </button>
          <Link href="/dashboard/talk" className={cn(btn.ghost, btn.sm)}>
            Book a tax review
          </Link>
        </div>
      </Card>
      <p className="text-muted-foreground border-t pt-4 text-xs">
        Tax rules change and savings are estimates. This is not a guarantee. Please check with your tax advisor. Investments in securities markets are subject to market risks.
      </p>
    </>
  )
}
