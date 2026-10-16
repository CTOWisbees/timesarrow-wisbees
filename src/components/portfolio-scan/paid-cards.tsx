'use client'

import { Loader2, Lock } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { CardId, CardView, ScanView } from '@/lib/portfolio/entitlements'

import { PaidCardBody } from './paid-card-body'
import { fill, type ScanCopy } from './shared'

/**
 * Paid insights. Locked cards show a teaser built from the user's own data (counts or
 * coarse buckets only); the real numbers are never in the page until the plan allows.
 */
export function PaidCards({ view, copy, onUnlock }: { view: ScanView; copy: ScanCopy; onUnlock: (plan: 'insights' | 'pro') => void }) {
  const meta = (id: CardId) => copy.lockedCards?.find((c) => c.card === id)
  const unlocked = view.cards.filter((c): c is Extract<CardView, { locked: false }> => !c.locked)
  const locked = view.cards.filter((c): c is Extract<CardView, { locked: true }> => c.locked)

  return (
    <section aria-labelledby="insights-title" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="insights-title" className="text-2xl font-semibold tracking-tight">
            {copy.plansTitle}
          </h2>
          <p className="text-ink-soft mt-1 max-w-2xl">{copy.plansIntro}</p>
        </div>
        {view.paidPending && (
          <p className="text-ink-soft flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Working out your detailed analysis…
          </p>
        )}
      </div>

      {unlocked.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {unlocked.map((c) => (
            <article key={c.id} className="bg-card min-w-0 rounded-3xl border p-5 sm:p-7">
              <h3 className="mb-4 font-sans text-base font-semibold">{meta(c.id)?.title ?? c.id}</h3>
              <PaidCardBody id={c.id} data={c.data} benchmark={view.benchmark.name} portfolioId={view.portfolioId} />
            </article>
          ))}
        </div>
      )}

      {locked.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {locked.map((c) => {
            const m = meta(c.id)
            // Fill from the user's data; a template left with gaps falls back to the generic line.
            const filled = fill(m?.teaser, { ...(c.teaser ?? {}), benchmark: view.benchmark.name })
            const teaser = /\{\w+\}/.test(filled) || !filled ? copy.lockedFallback : filled
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onUnlock(c.plan)}
                  className="bg-card hover:border-primary/60 group flex h-full w-full flex-col gap-2 rounded-2xl border p-5 text-left transition-colors"
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="text-ink font-semibold">{m?.title ?? c.id}</span>
                    <Badge variant="secondary" className="gap-1">
                      <Lock className="size-3" aria-hidden />
                      {c.plan === 'pro' ? 'Pro' : 'Insights'}
                    </Badge>
                  </span>
                  <span className="text-ink-soft text-sm leading-relaxed">{teaser}</span>
                  <span className="text-primary mt-auto pt-1 text-sm font-medium group-hover:underline">See plans</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
