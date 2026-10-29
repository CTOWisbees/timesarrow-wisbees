import { ShieldCheck } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

export const PILL = {
  good: 'bg-[#e3f3e9] text-[#1b7f4b]',
  warn: 'bg-amber-soft text-amber-ink',
  bad: 'bg-[#fce4e1] text-destructive',
  info: 'bg-[#e4eefa] text-[#245a9e]',
  grey: 'bg-mint text-ink-soft',
} as const

export type Tone = keyof typeof PILL

export function Pill({ tone = 'grey', children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap', PILL[tone], className)}>{children}</span>
}

export function Card({ children, className, flat }: { children: React.ReactNode; className?: string; flat?: boolean }) {
  return <section className={cn('bg-card flex min-w-0 flex-col rounded-2xl border shadow-[0_1px_2px_rgb(16_34_27/0.04)]', flat ? 'overflow-hidden' : 'gap-3.5 p-5', className)}>{children}</section>
}

export function CardHead({ title, right }: { title: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="text-lg font-semibold">{title}</h3>
      {right}
    </div>
  )
}

export function PageHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
        {sub && <p className="text-muted-foreground mt-1">{sub}</p>}
      </div>
      {right}
    </div>
  )
}

export function Bar({ pct, warn, className }: { pct: number; warn?: boolean; className?: string }) {
  return (
    <div className={cn('bg-mint h-2.5 overflow-hidden rounded-full', className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <i className={cn('block h-full rounded-full', warn ? 'bg-[#c98a12]' : 'bg-primary')} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  )
}

export function IconBox({ children }: { children: React.ReactNode }) {
  return <span className="bg-mint text-brand-green-strong flex size-10 shrink-0 items-center justify-center rounded-xl">{children}</span>
}

export function Row({ icon, title, sub, right, href, className }: { icon?: React.ReactNode; title: React.ReactNode; sub?: React.ReactNode; right?: React.ReactNode; href?: string; className?: string }) {
  const body = (
    <>
      {icon && <IconBox>{icon}</IconBox>}
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{title}</div>
        {sub && <div className="text-muted-foreground text-sm">{sub}</div>}
      </div>
      {right}
    </>
  )
  const cls = cn('flex items-center gap-3.5 border-t px-5 py-3.5 first:border-t-0', href && 'hover:bg-mint/60 transition-colors', className)
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}

export function Stat({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: 'up' | 'down' }) {
  return (
    <Card className="gap-1">
      <span className="text-muted-foreground text-sm">{label}</span>
      <div className={cn('font-heading text-2xl font-semibold tabular-nums', tone === 'up' && 'text-[#1b7f4b]', tone === 'down' && 'text-destructive')}>{value}</div>
      {sub && <span className="text-muted-foreground text-sm">{sub}</span>}
    </Card>
  )
}

/** The three SEBI risk lines every dashboard page ends with. */
export function Disclaimer() {
  return (
    <p className="text-muted-foreground border-t pt-4 text-xs leading-relaxed">
      Investments in securities markets are subject to market risks. Read all related documents carefully before investing. Numbers on this page are examples and estimates, not promises of
      returns. WisBees is a SEBI-registered Investment Adviser; see the <Link href="/sebi-disclosure" className="text-primary underline underline-offset-2">SEBI disclosure</Link>.
    </p>
  )
}

/** Shown wherever the copilot wrote something: AI disclosure on every screen, as the BRD requires. */
export function AiNote({ children = 'AI-made. Numbers come from your linked accounts and tested calculations.' }: { children?: React.ReactNode }) {
  return (
    <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
      <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
      {children}
    </p>
  )
}

export const btn = {
  primary: 'bg-primary text-primary-foreground border-primary inline-flex items-center justify-center gap-2 rounded-xl border-[1.5px] px-4 py-2.5 text-sm font-semibold transition hover:brightness-95 disabled:opacity-50',
  ghost: 'text-primary border-primary hover:bg-mint inline-flex items-center justify-center gap-2 rounded-xl border-[1.5px] bg-transparent px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50',
  sm: 'px-3 py-1.5 text-[0.8rem]',
} as const

export const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

/** ₹12.5 lakh, ₹3.19 crore, or plain rupees below a lakh. */
export function lakh(n: number) {
  const trim = (x: number) => x.toFixed(2).replace(/\.?0+$/, '')
  if (n >= 10_000_000) return `₹${trim(n / 10_000_000)} crore`
  if (n >= 100_000) return `₹${trim(n / 100_000)} lakh`
  return rupees(n)
}

/** Shown where a screen has nothing real to show yet: says why and what to do next. */
export function EmptyState({ title, body, href, cta }: { title: string; body: string; href?: string; cta?: string }) {
  return (
    <Card className="items-start">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground max-w-xl">{body}</p>
      {href && cta && (
        <Link href={href} className={btn.primary}>
          {cta}
        </Link>
      )}
    </Card>
  )
}

export const asOfText = (iso: string | null) => (iso ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso)) : '')
