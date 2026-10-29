'use client'

import { Bell, BookOpen, CalendarDays, ChevronRight, CreditCard, FileText, Lock, LifeBuoy, MessageCircle, Percent, Phone, Send, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState, useTransition } from 'react'

import { consultations, glossary } from '@/lib/portal/data'
import { cn } from '@/lib/utils'

import { askCopilot, fileComplaint } from '../actions'
import { usePortal } from '../state'
import { AiNote, btn, Card, CardHead, Disclaimer, EmptyState, IconBox, PageHead, Pill, Row } from '../ui'

export function Support({ screen }: { screen: 'ask' | 'talk' | 'learn' | 'help' | 'alerts' | 'more' }) {
  switch (screen) {
    case 'ask':
      return <Ask />
    case 'talk':
      return <Talk />
    case 'learn':
      return <Learn />
    case 'help':
      return <Help />
    case 'alerts':
      return <Alerts />
    default:
      return <More />
  }
}

type Msg = { from: 'me' | 'bot'; text: string; actions?: [string, string][] }

function Ask() {
  const { name, data } = usePortal()
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      from: 'bot',
      text: `Hi ${name}! I am Bees Copilot, an AI assistant. I can explain your money in simple words, using only the holdings and goals you added. I cannot place orders, and anything that sounds like advice goes to your adviser.`,
    },
  ])
  const [q, setQ] = useState('')
  const [pending, start] = useTransition()
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' })
  }, [msgs])

  const send = (text: string) => {
    const t = text.trim()
    if (!t || pending) return
    setMsgs((m) => [...m, { from: 'me', text: t }])
    setQ('')
    start(async () => {
      const a = await askCopilot(t)
      setMsgs((m) => [...m, { from: 'bot', text: a.text, actions: a.actions.length ? (a.actions as [string, string][]) : undefined }])
    })
  }

  const suggestions = data.hasPortfolio
    ? ['What is my health score?', 'What do my funds cost?', 'Is my risk within my comfort?', 'Am I on track for my goals?']
    : ['How do I get started?']

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <PageHead title="Ask Copilot" sub="Ask about your own money, in your own words." />
      <Card>
        <div className="flex min-h-72 flex-col gap-3" role="log" aria-label="Conversation with Bees Copilot">
          {msgs.map((m, i) => (
            <div key={i} className={cn('max-w-[88%] rounded-2xl px-4 py-3', m.from === 'me' ? 'bg-primary text-primary-foreground self-end rounded-br-sm' : 'bg-mint self-start rounded-bl-sm')}>
              {m.text}
              {m.actions && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {m.actions.map(([label, href]) => (
                    <Link key={label} href={href} className={cn(btn.ghost, btn.sm)}>
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          {pending && <div className="bg-mint text-muted-foreground self-start rounded-2xl rounded-bl-sm px-4 py-3">Looking at your numbers…</div>}
          <div ref={end} />
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button key={s} type="button" onClick={() => send(s)} className="bg-card hover:border-primary rounded-full border px-3.5 py-1.5 text-sm">
              {s}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2.5"
          onSubmit={(e) => {
            e.preventDefault()
            send(q)
          }}
        >
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type your question" aria-label="Your question" autoComplete="off" maxLength={500} className="border-input focus-visible:ring-ring/40 min-w-0 flex-1 rounded-xl border-[1.5px] px-3.5 py-3 outline-none focus-visible:ring-3" />
          <button type="submit" className={btn.primary} aria-label="Send" disabled={pending}>
            <Send className="size-4" aria-hidden />
          </button>
        </form>
        <AiNote>AI-made answers, saved so our compliance team can review them. Every answer uses your own numbers. WisBees never gives return guarantees or stock tips.</AiNote>
      </Card>
    </div>
  )
}

function Talk() {
  return (
    <>
      <PageHead
        title="Talk to Adviser"
        sub="Real people, ready to help."
        right={
          <Link href="/#book-call" className={btn.primary}>
            <CalendarDays className="size-4" aria-hidden /> Book a call
          </Link>
        }
      />
      <Card>
        <CardHead title="How it works" />
        <p className="text-muted-foreground">
          Calls are booked through our booking page and run by a SEBI-registered adviser. Your adviser sees the same numbers you see here, and each call is recorded with your consent and filed in My Documents.
        </p>
        <div className="flex flex-wrap gap-2.5">
          <Link href="/#book-call" className={cn(btn.primary, btn.sm)}>
            Book an intro call
          </Link>
          <Link href="/dashboard/help" className={cn(btn.ghost, btn.sm)}>
            Make a complaint
          </Link>
        </div>
      </Card>
      <Card>
        <CardHead title="Conversations we offer" />
        <div className="grid gap-3 md:grid-cols-3">
          {consultations.map((c) => (
            <div key={c.type} className="flex items-center gap-3.5 rounded-xl border px-4 py-3.5">
              <IconBox>
                <Phone className="size-5" aria-hidden />
              </IconBox>
              <span className="min-w-0">
                <span className="block font-semibold">{c.type}</span>
                <span className="text-muted-foreground block text-sm">{c.note}</span>
              </span>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground text-sm">Which of these your plan includes is listed on the <Link href="/fees" className="text-primary underline underline-offset-2">fees page</Link>.</p>
      </Card>
    </>
  )
}

function Learn() {
  const items = [
    ['Calculators', 'SIP, step-up SIP, lumpsum, SWP and EMI', 'Open', '/tools/sip-calculator'],
    ['Port Scan', 'Check your holdings and get a health score', 'Open', '/portfolio-scan'],
    ['How we use AI', 'What the Copilot does and does not do', 'Read', '/ai-disclosure'],
    ['Plans and fees', 'One flat, published fee per family', 'Read', '/fees'],
    ['SEBI disclosures', 'Registration, officers and the complaint process', 'Read', '/sebi-disclosure'],
  ] as const
  return (
    <>
      <PageHead title="Learn" sub="Read and understand. No jargon." />
      <div className="grid gap-5 md:grid-cols-3">
        {items.map(([title, body, tag, href]) => (
          <Link key={title} href={href} className="block">
            <Card className="hover:border-primary h-full transition-colors">
              <IconBox>
                <BookOpen className="size-5" aria-hidden />
              </IconBox>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-muted-foreground text-sm">{body}</p>
              <Pill className="self-start">{tag}</Pill>
            </Card>
          </Link>
        ))}
      </div>
      <Card>
        <CardHead title="Money words, made simple" />
        <dl>
          {glossary.map(([t, d]) => (
            <div key={t}>
              <dt className="text-brand-green-strong font-bold">{t}</dt>
              <dd className="mb-3">{d}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <Disclaimer />
    </>
  )
}

function Help() {
  const { say, tickets } = usePortal()
  const [topic, setTopic] = useState('')
  const [what, setWhat] = useState('')
  const [pending, start] = useTransition()
  return (
    <>
      <PageHead title="Help and Complaints" sub="We are here. If something is wrong, tell us." />
      <Card>
        <CardHead title="Make a complaint" />
        <select value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Topic" className="border-input bg-card rounded-xl border-[1.5px] px-3.5 py-3">
          <option value="">Choose a topic</option>
          <option>Fees or billing</option>
          <option>An order or investment</option>
          <option>Advice I received</option>
          <option>An AI answer</option>
          <option>My data or privacy</option>
        </select>
        <textarea value={what} onChange={(e) => setWhat(e.target.value)} placeholder="Tell us what happened" aria-label="What happened" rows={4} maxLength={4000} className="border-input focus-visible:ring-ring/40 rounded-xl border-[1.5px] px-3.5 py-3 outline-none focus-visible:ring-3" />
        <button
          type="button"
          className={cn(btn.primary, 'self-start')}
          disabled={!topic || !what.trim() || pending}
          onClick={() =>
            start(async () => {
              const res = await fileComplaint({ topic, body: what })
              if (res.ok) {
                setTopic('')
                setWhat('')
                say(`Complaint received. Your ticket number is ${res.ticket}.`)
              } else say(res.error)
            })
          }
        >
          Submit complaint
        </button>
        <p className="text-muted-foreground text-sm">
          You get a ticket number and can track it here. We follow the SEBI complaint process, and you can also write to SEBI through the SCORES portal. Officers and escalation steps are on our{' '}
          <Link href="/sebi-disclosure" className="text-primary underline underline-offset-2">
            SEBI disclosure page
          </Link>
          .
        </p>
      </Card>
      <Card>
        <CardHead title="Your tickets" />
        {tickets.length === 0 ? (
          <p className="text-muted-foreground">None right now.</p>
        ) : (
          tickets.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <b>WB-{t.id}</b>
                <div className="text-muted-foreground text-sm">
                  {t.topic} · {new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(t.createdAt))}
                </div>
              </div>
              <Pill tone={t.status === 'resolved' ? 'good' : 'info'}>{t.status === 'in_review' ? 'In review' : t.status === 'resolved' ? 'Resolved' : 'Received'}</Pill>
            </div>
          ))
        )}
      </Card>
    </>
  )
}

function Alerts() {
  const { data } = usePortal()
  return (
    <>
      <PageHead title="Alerts" sub="What changed and what needs you." />
      {data.alerts.length === 0 ? (
        <EmptyState title="No alerts" body="We tell you when your score drops, a holding passes your limit or something new stands out in your Port Scan. Nothing has come up." />
      ) : (
        <Card flat>
          {data.alerts.map((a) => (
            <Row key={a.id} href={a.href} icon={<Bell className="size-5" aria-hidden />} title={a.title} sub={a.body} right={<span className="text-muted-foreground text-sm">{a.when}</span>} />
          ))}
        </Card>
      )}
      <p className="text-muted-foreground text-sm">Choose which alerts you get in your Port Scan settings.</p>
    </>
  )
}

function More() {
  const items = [
    ['/dashboard/learn', 'Learn', 'Read and watch', BookOpen],
    ['/dashboard/documents', 'Documents', 'Your papers', FileText],
    ['/dashboard/family', 'Family', 'Everyone together', Users],
    ['/dashboard/invest', 'Invest', 'Plan and SIP', TrendingUp],
    ['/dashboard/activity', 'Activity', 'Calendar and orders', CalendarDays],
    ['/dashboard/tax', 'Save Tax', 'Keep more', Percent],
    ['/dashboard/ask', 'Ask Copilot', 'Questions in plain words', MessageCircle],
    ['/dashboard/talk', 'Talk to Adviser', 'Calls and chat', Phone],
    ['/dashboard/plan', 'Plan and Billing', 'Fees and invoices', CreditCard],
    ['/dashboard/privacy', 'Privacy', 'What you share', Lock],
    ['/dashboard/help', 'Help and Complaints', 'Questions and complaints', LifeBuoy],
  ] as const
  return (
    <>
      <PageHead title="More" />
      <Card flat>
        {items.map(([href, t, s, Icon]) => (
          <Row key={href} href={href} icon={<Icon className="size-5" aria-hidden />} title={t} sub={s} right={<ChevronRight className="text-muted-foreground size-4" aria-hidden />} />
        ))}
      </Card>
    </>
  )
}
