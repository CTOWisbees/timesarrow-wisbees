'use client'

import { Loader2, Lock } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { CardId, CardView, ScanView } from '@/lib/portfolio/entitlements'

import { PaidCardBody } from './paid-card-body'
import { fill, type ScanCopy } from './shared'

type Props = {
  view: ScanView
  copy: ScanCopy
  onUnlock: (plan: 'insights' | 'pro') => void
  /** Which cards, in this order. Others are not shown here. */
  ids: CardId[]
  /** Two cards that read as one: shown together in a single card (first id's slot). */
  pair?: [CardId, CardId]
}

/** Intro line above the paid analysis, with the "working on it" note while a plan's job runs. */
export function PlansIntro({ view, copy }: { view: ScanView; copy: ScanCopy }) {
  return (
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
  )
}

/**
 * Paid insights, as grid children so the page can place them among the free cards.
 * Locked cards show a teaser built from the user's own data (counts or coarse buckets
 * only); the real numbers are never in the page until the plan allows.
 */
export function PaidCards({ view, copy, onUnlock, ids, pair }: Props) {
  const meta = (id: CardId) => copy.lockedCards?.find((c) => c.card === id)
  const byId = new Map(view.cards.map((c) => [c.id, c]))
  const cards = ids.map((id) => byId.get(id)).filter((c): c is CardView => Boolean(c))
  const title = (id: CardId) => meta(id)?.title ?? id
  const heading = (id: CardId) => (pair && id === pair[0] ? `${title(pair[0])} and ${title(pair[1]).toLowerCase()}` : title(id))

  return (
    <>
      {cards
        .filter((c) => !(pair && c.id === pair[1]))
        .map((c) => {
          if (!c.locked) {
            const partner = pair && c.id === pair[0] ? byId.get(pair[1]) : undefined
            return (
              <article key={c.id} className="bg-card min-w-0 rounded-3xl border p-5 sm:p-7">
                <h3 className="mb-5 font-sans text-base font-semibold">{heading(c.id)}</h3>
                <PaidCardBody id={c.id} data={c.data} benchmark={view.benchmark.name} portfolioId={view.portfolioId} />
                {partner && !partner.locked && (
                  <div className="mt-8 border-t pt-6">
                    <PaidCardBody id={partner.id} data={partner.data} benchmark={view.benchmark.name} portfolioId={view.portfolioId} />
                  </div>
                )}
              </article>
            )
          }
          const m = meta(c.id)
          // Fill from the user's data; a template left with gaps falls back to the generic line.
          const filled = fill(m?.teaser, { ...(c.teaser ?? {}), benchmark: view.benchmark.name })
          const teaser = /\{\w+\}/.test(filled) || !filled ? copy.lockedFallback : filled
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onUnlock(c.plan)}
              className="bg-card hover:border-primary/60 group flex min-w-0 flex-col gap-3 rounded-3xl border p-5 text-left transition-colors sm:p-7"
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="text-ink font-semibold">{heading(c.id)}</span>
                <Badge variant="secondary" className="gap-1">
                  <Lock className="size-3" aria-hidden />
                  {c.plan === 'pro' ? 'Pro' : 'Insights'}
                </Badge>
              </span>
              <span className="text-ink-soft text-sm leading-relaxed">{teaser}</span>
              <span className="text-primary mt-auto pt-1 text-sm font-medium group-hover:underline">See plans</span>
            </button>
          )
        })}
    </>
  )
}
