'use client'

import { ArrowUp, ExternalLink, Loader2, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'

import { cn } from '@/lib/utils'

import { askAssistant } from './actions'
import { BeesMark } from './bees-mark'

type Msg = { from: 'me' | 'bot'; text: string; sources?: { title: string; url: string }[]; actions?: [string, string][] }

const KEY = 'bees-chat'
const INTRO: Msg = {
  from: 'bot',
  text: 'Hi, I am Bees Copilot, an AI assistant. Ask me how WisBees works, what it costs, or about your own money once you sign in. I never give stock tips or promise returns.',
}
const PUBLIC_IDEAS = ['What do you charge?', 'How does WisBees work?', 'How do you use AI?', 'What is Port Scan?']
const SIGNED_IN_IDEAS = ['What is my health score?', 'What do my funds cost?', 'Am I on track for my goals?', 'What do you charge?']

function load(): Msg[] {
  try {
    const raw = sessionStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as Msg[]) : null
    return parsed?.length ? parsed : [INTRO]
  } catch {
    return [INTRO]
  }
}

/**
 * The floating chat on every page. A round launcher opens a panel (full screen on a phone). It remembers the
 * conversation for the visit, answers through the same Copilot as the dashboard, and says clearly that it is AI.
 */
export function ChatWidget({ signedIn = false }: { signedIn?: boolean }) {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([INTRO])
  const [q, setQ] = useState('')
  const [pending, start] = useTransition()
  const end = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)

  // The saved conversation is read the first time the chat opens, so the first render matches the server's.
  const loaded = useRef(false)
  const toggle = () => {
    if (!open && !loaded.current) {
      loaded.current = true
      setMsgs(load())
    }
    setOpen(!open)
  }
  useEffect(() => {
    if (!loaded.current) return
    try {
      sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-30)))
    } catch {}
  }, [msgs])
  useEffect(() => {
    if (open) {
      end.current?.scrollIntoView({ block: 'nearest' })
      input.current?.focus()
    }
  }, [open, msgs, pending])
  useEffect(() => {
    if (!open) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [open])
  // On a phone the panel covers the page, so keep the page from scrolling behind it.
  useEffect(() => {
    if (!open || !window.matchMedia('(max-width: 639px)').matches) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const send = useCallback(
    (text: string) => {
      const t = text.trim()
      if (!t || pending) return
      setMsgs((m) => [...m, { from: 'me', text: t }])
      setQ('')
      start(async () => {
        const a = await askAssistant(t)
        setMsgs((m) => [...m, { from: 'bot', text: a.text, sources: a.sources.length ? a.sources : undefined, actions: a.actions.length ? a.actions : undefined }])
      })
    },
    [pending],
  )

  // The dashboard has a full Ask Copilot page, and signed-in screens that already sit on it don't need a second launcher.
  if (path === '/dashboard/ask') return null
  const inDashboard = path.startsWith('/dashboard')
  const ideas = signedIn ? SIGNED_IN_IDEAS : PUBLIC_IDEAS

  return (
    <>
      {open && (
        <section
          role="dialog"
          aria-label="Bees Copilot chat"
          className="bg-card fixed inset-0 z-[70] flex flex-col sm:inset-auto sm:right-6 sm:bottom-24 sm:h-[min(36rem,calc(100dvh-8rem))] sm:w-[24rem] sm:overflow-hidden sm:rounded-3xl sm:border sm:shadow-[0_20px_60px_rgb(16_34_27/0.25)]"
        >
          <header className="from-primary to-brand-green-strong flex items-center gap-3 bg-gradient-to-br px-4 py-3.5 text-white">
            <span className="flex size-10 items-center justify-center rounded-full bg-white/15">
              <BeesMark className="size-7 text-white" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-lg leading-tight font-semibold">Bees Copilot</p>
              <p className="text-xs text-white/80">AI assistant · not financial advice</p>
            </div>
            {signedIn && !inDashboard && (
              <Link href="/dashboard/ask" aria-label="Open the full chat" className="rounded-full p-2 hover:bg-white/15">
                <ExternalLink className="size-4" aria-hidden />
              </Link>
            )}
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-full p-2 hover:bg-white/15">
              <X className="size-5" aria-hidden />
            </button>
          </header>

          <div className="bg-mist flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4" role="log" aria-live="polite" aria-label="Conversation">
            {msgs.map((m, i) => (
              <div key={i} className={cn('max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[0.92rem] leading-relaxed', m.from === 'me' ? 'bg-primary self-end rounded-br-sm text-white' : 'bg-card self-start rounded-bl-sm border')}>
                {m.text}
                {m.sources && (
                  <p className="text-muted-foreground mt-2 flex flex-wrap gap-x-2 gap-y-0.5 text-xs">
                    Sources:
                    {m.sources.map((s) => (
                      <Link key={s.title} href={s.url} className="text-primary underline underline-offset-2">
                        {s.title}
                      </Link>
                    ))}
                  </p>
                )}
                {m.actions && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.actions.map(([label, href]) => (
                      <Link key={label} href={href} className="text-primary border-primary hover:bg-mint rounded-full border px-3 py-1 text-xs font-semibold">
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {pending && (
              <div className="bg-card text-muted-foreground flex items-center gap-2 self-start rounded-2xl rounded-bl-sm border px-3.5 py-2.5 text-sm">
                <Loader2 className="size-4 animate-spin" aria-hidden /> Looking it up…
              </div>
            )}
            {msgs.length <= 1 && !pending && (
              <div className="flex flex-wrap gap-2 pt-1">
                {ideas.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} className="bg-card hover:border-primary rounded-full border px-3 py-1.5 text-sm">
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={end} />
          </div>

          <form
            className="bg-card flex items-center gap-2 border-t p-3"
            onSubmit={(e) => {
              e.preventDefault()
              send(q)
            }}
          >
            <input
              ref={input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ask a question"
              aria-label="Your question"
              autoComplete="off"
              maxLength={500}
              className="border-input bg-mist focus-visible:ring-ring/40 min-w-0 flex-1 rounded-full border px-4 py-2.5 text-sm outline-none focus-visible:ring-3"
            />
            <button type="submit" disabled={pending || !q.trim()} aria-label="Send" className="bg-primary flex size-10 shrink-0 items-center justify-center rounded-full text-white transition hover:brightness-95 disabled:opacity-50">
              <ArrowUp className="size-5" aria-hidden />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-label={open ? 'Close Bees Copilot' : 'Open Bees Copilot chat'}
        aria-expanded={open}
        className={cn(
          'group from-primary to-brand-green-strong focus-visible:ring-ring/50 fixed right-4 z-[60] flex size-14 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-[0_8px_24px_rgb(15_107_76/0.4)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgb(15_107_76/0.5)] focus-visible:ring-4 focus-visible:outline-none sm:right-6 sm:bottom-6',
          inDashboard ? 'bottom-20 lg:bottom-6' : 'bottom-4',
          open && 'max-sm:hidden',
        )}
      >
        {open ? <X className="size-6" aria-hidden /> : <BeesMark className="size-9 text-white" />}
        {!open && <span className="ring-primary/40 pointer-events-none absolute inset-0 rounded-full ring-2 motion-safe:animate-ping [animation-iteration-count:2]" aria-hidden />}
        {!open && (
          <span
            aria-hidden
            className="bg-ink pointer-events-none absolute right-full mr-3 translate-x-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap text-white opacity-0 shadow-lg transition-[opacity,translate] duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 max-sm:hidden motion-reduce:transition-none"
          >
            Ask Bees Copilot
          </span>
        )}
      </button>
    </>
  )
}
