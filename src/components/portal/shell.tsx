'use client'

import {
  BadgeIndianRupee,
  Bell,
  BookOpen,
  CalendarDays,
  CheckSquare,
  CreditCard,
  FileText,
  HelpCircle,
  Home,
  LifeBuoy,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Percent,
  Phone,
  Search,
  Target,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

import type { Ticket } from '@/lib/portal/store'
import type { PortalData } from '@/lib/portal/types'

import { PortalProvider, usePortal } from './state'

type Item = { slug: string; label: string; icon: LucideIcon; keywords?: string }

export const MENU: { group: string; items: Item[] }[] = [
  {
    group: 'Main',
    items: [
      { slug: '', label: 'Home', icon: Home, keywords: 'dashboard' },
      { slug: 'money', label: 'My Money', icon: Wallet, keywords: 'holdings total fees overlap stress what if' },
      { slug: 'goals', label: 'My Goals', icon: Target, keywords: 'retirement college home' },
      { slug: 'todo', label: 'To Do', icon: CheckSquare, keywords: 'approve action suggestions' },
    ],
  },
  {
    group: 'Grow',
    items: [
      { slug: 'invest', label: 'Invest', icon: TrendingUp, keywords: 'plan sip gold rebalance' },
      { slug: 'activity', label: 'Activity', icon: CalendarDays, keywords: 'calendar orders history' },
      { slug: 'tax', label: 'Save Tax', icon: Percent, keywords: 'loss capital gains harvesting' },
    ],
  },
  {
    group: 'Help',
    items: [
      { slug: 'ask', label: 'Ask Copilot', icon: MessageCircle, keywords: 'ai question' },
      { slug: 'talk', label: 'Talk to Adviser', icon: Phone, keywords: 'call chat book' },
      { slug: 'learn', label: 'Learn', icon: BookOpen, keywords: 'words glossary research' },
    ],
  },
  {
    group: 'Your account',
    items: [
      { slug: 'documents', label: 'My Documents', icon: FileText, keywords: 'statements agreement report' },
      { slug: 'family', label: 'My Family', icon: Users, keywords: 'spouse parents' },
      { slug: 'plan', label: 'Plan and Billing', icon: CreditCard, keywords: 'invoice fee cancel' },
      { slug: 'privacy', label: 'Privacy', icon: Lock, keywords: 'consent data delete' },
      { slug: 'help', label: 'Help and Complaints', icon: LifeBuoy, keywords: 'complaint support grievance' },
    ],
  },
]

const ALL = MENU.flatMap((g) => g.items)
const EXTRA_TITLES: Record<string, string> = { alerts: 'Alerts', more: 'More', goals: 'My Goals' }
const TABS: Item[] = [
  ALL[0],
  ALL[1],
  ALL[2],
  ALL[3],
  { slug: 'more', label: 'More', icon: MoreHorizontal },
]

const href = (slug: string) => (slug ? `/dashboard/${slug}` : '/dashboard')

function useSection() {
  const path = usePathname()
  const slug = path.replace(/^\/dashboard\/?/, '').split('/')[0] ?? ''
  return slug
}

export function PortalShell({ name, data, tickets, children }: { name: string; data: PortalData; tickets: Ticket[]; children: React.ReactNode }) {
  return (
    <PortalProvider name={name} data={data} tickets={tickets}>
      <Frame name={name} planLabel={data.planLabel}>
        {children}
      </Frame>
    </PortalProvider>
  )
}

function Frame({ name, planLabel, children }: { name: string; planLabel: string; children: React.ReactNode }) {
  const slug = useSection()
  const pathname = usePathname()
  const { openTodos, toast, data } = usePortal()
  const main = useRef<HTMLDivElement>(null)
  const [searching, setSearching] = useState(false)
  const title = ALL.find((i) => i.slug === slug)?.label ?? EXTRA_TITLES[slug] ?? 'Home'

  useEffect(() => {
    main.current?.scrollTo({ top: 0 })
  }, [slug])

  const inMore = !['', 'money', 'goals', 'todo'].includes(slug)

  return (
    <div className="bg-mist text-ink flex h-dvh flex-col lg:flex-row">
      <a href="#portal-main" className="bg-primary text-primary-foreground sr-only z-50 rounded-md px-4 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>

      <aside aria-label="Main menu" className="bg-card hidden w-66 shrink-0 flex-col gap-1.5 overflow-y-auto border-r px-3.5 py-5 lg:flex">
        <Link href="/" aria-label="WisBees home" className="px-2.5 pb-3">
          <Image src="/brand/wisbees-logo.png" alt="WisBees" width={297} height={109} className="h-9 w-auto" priority />
        </Link>
        {MENU.map((g) => (
          <div key={g.group}>
            <p className="text-muted-foreground px-3 pt-4 pb-1 text-[0.7rem] font-bold tracking-[0.09em] uppercase">{g.group}</p>
            {g.items.map((i) => {
              const on = slug === i.slug
              return (
                <Link
                  key={i.slug}
                  href={href(i.slug)}
                  aria-current={on ? 'page' : undefined}
                  className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-colors', on ? 'bg-mint text-brand-green-strong font-bold' : 'hover:bg-mint/70')}
                >
                  <i.icon className="size-5 shrink-0" aria-hidden />
                  {i.label}
                  {i.slug === 'todo' && openTodos > 0 && (
                    <span className="bg-primary text-primary-foreground ml-auto rounded-full px-2 text-xs font-bold">{openTodos}</span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
        <div className="mt-auto flex items-center gap-2.5 border-t pt-3.5">
          <span className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-full font-bold">{name.charAt(0).toUpperCase()}</span>
          <div className="min-w-0">
            <p className="truncate font-semibold">{name}</p>
            <p className="text-muted-foreground text-sm">{planLabel}</p>
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="bg-mist hidden shrink-0 items-center gap-3 border-b px-7 py-3 lg:flex">
        <h1 className="font-heading min-w-0 flex-1 truncate text-2xl font-semibold">{title}</h1>
        <HeaderActions onSearch={() => setSearching(true)} />
      </header>

      <header className="bg-card flex shrink-0 items-center gap-2.5 border-b px-4 py-2.5 lg:hidden">
        <Image src="/brand/wisbees-mark.png" alt="" width={28} height={28} className="size-7" />
        <h1 className="font-heading min-w-0 flex-1 truncate text-xl font-semibold">{title}</h1>
        <button type="button" onClick={() => setSearching(true)} aria-label="Search" className={iconBtn}>
          <Search className="size-5" aria-hidden />
        </button>
        <Link href="/dashboard/alerts" aria-label="Alerts" className={iconBtn}>
          <Bell className="size-5" aria-hidden />
          {data.alerts.length > 0 && <span className="bg-destructive absolute top-2 right-2.5 size-2 rounded-full" />}
        </Link>
      </header>

      <div id="portal-main" ref={main} tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-6 outline-none sm:px-7 sm:pt-6 sm:pb-10">
        <div key={slug + (pathname.split('/')[3] ?? '')} className="animate-in fade-in-0 slide-in-from-bottom-1 mx-auto flex max-w-[70rem] flex-col gap-5 duration-300">{children}</div>
      </div>

      <nav aria-label="Quick menu" className="bg-card grid shrink-0 grid-cols-5 border-t px-1 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] lg:hidden">
        {TABS.map((i) => {
          const on = i.slug === 'more' ? inMore : slug === i.slug
          return (
            <Link
              key={i.slug}
              href={href(i.slug)}
              aria-current={on ? 'page' : undefined}
              className={cn('relative flex min-h-12 flex-col items-center justify-center gap-0.5 text-[0.7rem] font-semibold', on ? 'text-primary' : 'text-muted-foreground')}
            >
              <i.icon className="size-5" aria-hidden />
              {i.label}
              {i.slug === 'todo' && openTodos > 0 && <span className="bg-destructive absolute top-0.5 left-[calc(50%+0.4rem)] rounded-full px-1.5 text-[0.62rem] text-white">{openTodos}</span>}
            </Link>
          )
        })}
      </nav>
      </div>

      <Link
        href="/dashboard/ask"
        className="bg-primary text-primary-foreground fixed right-4 bottom-20 z-30 flex items-center gap-2 rounded-full px-4 py-3 font-bold shadow-[0_4px_14px_rgb(0_0_0/0.25)] lg:hidden"
      >
        <MessageCircle className="size-5" aria-hidden />
        Ask
      </Link>

      {toast && (
        <div role="status" className="bg-ink text-paper fixed bottom-24 left-1/2 z-60 max-w-[90vw] -translate-x-1/2 rounded-xl px-5 py-3 font-semibold shadow-lg lg:bottom-8">
          {toast}
        </div>
      )}
      {searching && <SearchDialog onClose={() => setSearching(false)} />}
    </div>
  )
}

const iconBtn = 'border-border bg-card relative flex size-10 shrink-0 items-center justify-center rounded-full border hover:bg-mint/60'

function HeaderActions({ onSearch }: { onSearch: () => void }) {
  const { data } = usePortal()
  return (
    <>
      <button type="button" onClick={onSearch} aria-label="Search" className={iconBtn}>
        <Search className="size-5" aria-hidden />
      </button>
      <Link href="/dashboard/ask" className="bg-primary text-primary-foreground flex items-center gap-2 rounded-full px-4 py-2.5 font-semibold hover:brightness-95">
        <MessageCircle className="size-5" aria-hidden />
        Ask Copilot
      </Link>
      <Link href="/dashboard/alerts" aria-label="Alerts" className={iconBtn}>
        <Bell className="size-5" aria-hidden />
        {data.alerts.length > 0 && <span className="bg-destructive absolute top-2 right-2.5 size-2 rounded-full" />}
      </Link>
      <Link href="/portfolio-scan" aria-label="Back to the website" className={cn(iconBtn, 'w-auto px-3 text-sm font-semibold')}>
        <BadgeIndianRupee className="mr-1.5 size-4" aria-hidden />
        Port Scan
      </Link>
      <Link href="/" aria-label="Back to WisBees" className={cn(iconBtn, 'w-auto px-3 text-sm font-semibold')}>
        <HelpCircle className="mr-1.5 size-4" aria-hidden />
        Website
      </Link>
    </>
  )
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const results = ALL.filter((i) => !q || `${i.label} ${i.keywords ?? ''}`.toLowerCase().includes(q.toLowerCase()))

  useEffect(() => {
    input.current?.focus()
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Search WisBees" className="bg-card flex w-full max-w-lg flex-col gap-3 rounded-t-3xl p-6 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold">Search WisBees</h2>
        <input
          ref={input}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Try: tax, SIP, documents, complaint"
          aria-label="Search"
          className="border-input bg-card focus-visible:ring-ring/40 rounded-xl border-[1.5px] px-3.5 py-3 outline-none focus-visible:ring-3"
        />
        <div className="flex max-h-[50vh] flex-col overflow-auto">
          {results.length ? (
            results.map((i) => (
              <button
                key={i.slug}
                type="button"
                onClick={() => {
                  onClose()
                  router.push(href(i.slug))
                }}
                className="hover:bg-mint flex items-center gap-3 rounded-xl px-3 py-2.5 text-left font-medium"
              >
                <i.icon className="size-5" aria-hidden />
                {i.label}
              </button>
            ))
          ) : (
            <p className="text-muted-foreground p-3">Nothing found. Try Ask Copilot.</p>
          )}
        </div>
      </div>
    </div>
  )
}
