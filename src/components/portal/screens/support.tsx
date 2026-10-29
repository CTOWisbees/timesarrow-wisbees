'use client'

import { Bell, BookOpen, CalendarDays, ChevronRight, CreditCard, FileText, HelpCircle, Lock, LifeBuoy, MessageCircle, Percent, Phone, Send, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { alerts, ASSUMED_RETURN, consultations, glossary, goals, learnItems, NOW_YEAR } from '@/lib/portal/data'
import { projectGoal } from '@/lib/portal/math'
import { cn } from '@/lib/utils'

import { AiNote, btn, Card, CardHead, Disclaimer, IconBox, lakh, PageHead, Pill, Row, rupees } from '../ui'
import { usePortal } from '../state'

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

const retirement = goals[0]
const retProjection = projectGoal({ saved: retirement.saved, monthly: retirement.monthly, annualReturn: ASSUMED_RETURN, years: retirement.year - NOW_YEAR }).value

/** Scripted answers read from the same numbers the dashboard shows. Anything advice-like goes to the adviser. */
function answer(q: string): Pick<Msg, 'text' | 'actions'> {
  const l = q.toLowerCase()
  if (/week|fall|fell|change|why/.test(l))
    return { text: 'Your money grew 0.7% (₹21,400) this week. Most of the rise came from your two index and flexi-cap funds. Infosys was down 1.2%.', actions: [['See my money', '/dashboard/money']] }
  if (/bank/.test(l))
    return {
      text: 'Your direct banking stocks (HDFC Bank and ICICI Bank) are worth ₹4,33,000, about 14% of your money. Counting what your funds hold, HDFC Bank appears in 3 places, about 10% in total.',
      actions: [['Show details', '/dashboard/money'], ['Ask my adviser', '/dashboard/talk']],
    }
  if (/fund|explain/.test(l))
    return {
      text: "You hold four funds. Two buy shares in India's biggest companies (the index fund and the flexi-cap fund). One mixes large and mid-sized companies. One lends to companies and pays interest, which is steadier. All are direct plans, so you pay no agent commission.",
      actions: [['See my funds', '/dashboard/money']],
    }
  if (/retire|track/.test(l))
    return {
      text: `You have ${lakh(retirement.saved)} set aside for retirement and invest ${rupees(retirement.monthly)} a month. If your investments grow about ${ASSUMED_RETURN * 100}% a year, which is an assumption and not a promise, you would reach about ${lakh(retProjection)} by ${retirement.year}. Your goal is ${lakh(retirement.target)}, so you look ${retProjection >= retirement.target ? 'on track' : 'a little behind'}.`,
      actions: [['See this goal', '/dashboard/goals/retirement']],
    }
  return {
    text: 'I can help best with questions about your own money. For anything like "should I buy this?", your adviser is the right person. Want me to send them your question?',
    actions: [['Ask my adviser', '/dashboard/talk']],
  }
}

function Ask() {
  const { name } = usePortal()
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: 'bot', text: `Hi ${name}! I am Bees Copilot, an AI assistant. I can explain your money in simple words. I use only your own numbers, and I cannot place orders. Anything that sounds like advice can go to your adviser.` },
  ])
  const [q, setQ] = useState('')
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' })
  }, [msgs])

  const send = (text: string) => {
    const t = text.trim()
    if (!t) return
    setMsgs((m) => [...m, { from: 'me', text: t }, { from: 'bot', ...answer(t) }])
    setQ('')
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <PageHead title="Ask Copilot" sub="Ask anything about your money, in your own words." />
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
          <div ref={end} />
        </div>
        <div className="flex flex-wrap gap-2">
          {['Why did my money change this week?', 'How much do I have in banking stocks?', 'Explain my funds in simple words', 'Am I on track to retire?'].map((s) => (
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
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type your question" aria-label="Your question" autoComplete="off" className="border-input focus-visible:ring-ring/40 min-w-0 flex-1 rounded-xl border-[1.5px] px-3.5 py-3 outline-none focus-visible:ring-3" />
          <button type="submit" className={btn.primary} aria-label="Send">
            <Send className="size-4" aria-hidden />
          </button>
        </form>
        <AiNote>AI-made answers, saved so our compliance team can review them. Every answer uses your numbers. WisBees never gives return guarantees or stock tips.</AiNote>
      </Card>
    </div>
  )
}

function Talk() {
  const { say } = usePortal()
  const [draft, setDraft] = useState('')
  return (
    <>
      <PageHead
        title="Talk to Adviser"
        sub="Real people, ready to help."
        right={
          <button type="button" className={btn.primary} onClick={() => say('Pick a slot on the booking page that opens next.')}>
            <CalendarDays className="size-4" aria-hidden /> Book a call
          </button>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardHead title="Your adviser" />
          <div className="flex items-center gap-3.5">
            <span className="bg-primary text-primary-foreground flex size-14 items-center justify-center rounded-full text-xl font-bold">NR</span>
            <div>
              <b>Neha Rao</b>
              <div className="text-muted-foreground text-sm">SEBI-registered adviser · replies within 24 hours</div>
            </div>
          </div>
          <div className="bg-mist flex flex-col gap-2.5 rounded-xl p-3.5">
            <div className="bg-mint max-w-[85%] self-start rounded-2xl rounded-bl-sm px-4 py-3">Hi, I saw your college goal is a bit behind. Shall we look at it on our call on 12 Nov?</div>
            <div className="bg-primary text-primary-foreground max-w-[85%] self-end rounded-2xl rounded-br-sm px-4 py-3">Yes please. Can we also talk about the tax idea?</div>
          </div>
          <form
            className="flex gap-2.5"
            onSubmit={(e) => {
              e.preventDefault()
              if (!draft.trim()) return
              setDraft('')
              say('Message sent. Your adviser replies within 24 hours.')
            }}
          >
            <input value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Message to adviser" placeholder="Write to your adviser" className="border-input focus-visible:ring-ring/40 min-w-0 flex-1 rounded-xl border-[1.5px] px-3.5 py-3 outline-none focus-visible:ring-3" />
            <button type="submit" className={btn.primary} aria-label="Send">
              <Send className="size-4" aria-hidden />
            </button>
          </form>
          <p className="text-muted-foreground text-sm">Plus plan: replies within 24 hours on working days. Chats are saved in your documents.</p>
        </Card>
        <Card>
          <CardHead title="Your calls" />
          <ol className="flex flex-col">
            <li className="flex gap-3 pb-4">
              <i className="bg-primary mt-1.5 size-3 shrink-0 rounded-full" />
              <div>
                <b>12 Nov, 4:00 pm</b>
                <div className="text-muted-foreground text-sm">Goal planning, 60 min</div>
                <div className="mt-2 flex gap-2">
                  <button type="button" className={cn(btn.primary, btn.sm)} onClick={() => say('The call link opens 10 minutes before the start.')}>Join</button>
                  <button type="button" className={cn(btn.ghost, btn.sm)} onClick={() => say('Change the time on the booking page.')}>Change time</button>
                </div>
              </div>
            </li>
            <li className="flex gap-3">
              <i className="bg-card border-border mt-1.5 size-3 shrink-0 rounded-full border-2" />
              <div>
                <b>15 Aug</b>
                <div className="text-muted-foreground text-sm">Portfolio review, done. Summary in Documents.</div>
              </div>
            </li>
          </ol>
          <p className="text-muted-foreground text-sm">2 calls a year on Plus. 1 left this year.</p>
        </Card>
      </div>
      <Card>
        <CardHead title="Book a conversation" />
        <div className="grid gap-3 md:grid-cols-3">
          {consultations.map((c) => (
            <button key={c.type} type="button" onClick={() => say(`${c.type}: choose a time on the booking page.`)} className="hover:border-primary flex items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left transition-colors">
              <IconBox>
                <Phone className="size-5" aria-hidden />
              </IconBox>
              <span className="min-w-0">
                <span className="block font-semibold">{c.type}</span>
                <span className="text-muted-foreground block text-sm">{c.note}</span>
              </span>
            </button>
          ))}
        </div>
      </Card>
    </>
  )
}

function Learn() {
  const { say } = usePortal()
  return (
    <>
      <PageHead title="Learn" sub="Read, watch and understand. No jargon." />
      <div className="grid gap-5 md:grid-cols-3">
        {learnItems.map((a) => (
          <Card key={a.title}>
            <IconBox>
              <BookOpen className="size-5" aria-hidden />
            </IconBox>
            <h3 className="text-lg font-semibold">{a.title}</h3>
            <p className="text-muted-foreground text-sm">{a.body}</p>
            <Pill className="self-start">{a.tag}</Pill>
          </Card>
        ))}
      </div>
      <Card>
        <CardHead title="Explain a document in simple words" />
        <p className="text-muted-foreground">Upload a fund fact sheet, contract or statement. Copilot writes a short summary and shows you where each point comes from.</p>
        <button type="button" className={cn(btn.primary, btn.sm, 'self-start')} onClick={() => say('Document upload opens with your linked accounts.')}>
          Upload a document
        </button>
        <AiNote>AI-made summary. Always read the original document.</AiNote>
      </Card>
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
  const { say } = usePortal()
  const [topic, setTopic] = useState('')
  const [what, setWhat] = useState('')
  const [tickets, setTickets] = useState<{ id: string; topic: string }[]>([])
  return (
    <>
      <PageHead title="Help and Complaints" sub="We are here. If something is wrong, tell us." />
      <div className="grid gap-5 md:grid-cols-3">
        {[
          ['Chat with support', 'Mon to Sat, 9 am to 7 pm', MessageCircle],
          ['Book a call', 'Pick a time that suits you', Phone],
          ['Common questions', 'Quick answers', HelpCircle],
        ].map(([t, s, Icon]) => {
          const I = Icon as typeof Phone
          return (
            <Card key={t as string}>
              <IconBox>
                <I className="size-5" aria-hidden />
              </IconBox>
              <h3 className="text-lg font-semibold">{t as string}</h3>
              <p className="text-muted-foreground text-sm">{s as string}</p>
            </Card>
          )
        })}
      </div>
      <Card>
        <CardHead title="Make a complaint" />
        <select value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Topic" className="border-input bg-card rounded-xl border-[1.5px] px-3.5 py-3">
          <option value="">Choose a topic</option>
          <option>Fees or billing</option>
          <option>An order or investment</option>
          <option>Advice I received</option>
          <option>My data or privacy</option>
        </select>
        <textarea value={what} onChange={(e) => setWhat(e.target.value)} placeholder="Tell us what happened" aria-label="What happened" rows={3} className="border-input focus-visible:ring-ring/40 rounded-xl border-[1.5px] px-3.5 py-3 outline-none focus-visible:ring-3" />
        <button
          type="button"
          className={cn(btn.primary, 'self-start')}
          disabled={!topic || !what.trim()}
          onClick={() => {
            const id = `WB-${20_400 + tickets.length + 17}`
            setTickets((t) => [...t, { id, topic }])
            setTopic('')
            setWhat('')
            say(`Complaint received. Your ticket number is ${id}.`)
          }}
        >
          Submit complaint
        </button>
        <p className="text-muted-foreground text-sm">You get a ticket number and can track it here. We follow the SEBI complaint process. You can also write to SEBI through the SCORES portal.</p>
      </Card>
      <Card>
        <CardHead title="Your open tickets" />
        {tickets.length === 0 ? (
          <p className="text-muted-foreground">None right now.</p>
        ) : (
          tickets.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <b>{t.id}</b>
                <div className="text-muted-foreground text-sm">{t.topic}</div>
              </div>
              <Pill tone="info">Received</Pill>
            </div>
          ))
        )}
      </Card>
    </>
  )
}

function Alerts() {
  const { say } = usePortal()
  return (
    <>
      <PageHead
        title="Alerts"
        sub="What changed and what needs you."
        right={
          <button type="button" className={cn(btn.ghost, btn.sm)} onClick={() => say('Choose app, email or WhatsApp under Privacy.')}>
            Choose how to get alerts
          </button>
        }
      />
      <Card flat>
        {alerts.map((a) => (
          <Row key={a.title} href={a.href} icon={<Bell className="size-5" aria-hidden />} title={a.title} sub={a.body} right={<span className="text-muted-foreground text-sm">{a.when}</span>} />
        ))}
      </Card>
      <p className="text-muted-foreground text-sm">You can get alerts on the app, by email or on WhatsApp.</p>
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
