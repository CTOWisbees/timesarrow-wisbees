'use client'

import { useEffect, useRef } from 'react'

import { Calculator, ChartNoAxesCombined, Home, Landmark, PiggyBank, Percent, Target, TrendingUp, Wallet, type LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { CALCULATORS } from '@/lib/calculators/registry'
import { cn } from '@/lib/utils'

const ICONS: Record<string, LucideIcon> = {
  'step-up-sip-calculator': ChartNoAxesCombined,
  'sip-calculator': TrendingUp,
  'lumpsum-calculator': PiggyBank,
  'swp-calculator': Wallet,
  'emi-calculator': Home,
  'goal-gap-calculator': Target,
  'tax-loss-harvesting-calculator': Percent,
}

/** Jump between the calculators: one card each, scrolling sideways on a phone. */
export function CalculatorSwitcher({ activeSlug }: { activeSlug: string }) {
  const list = useRef<HTMLUListElement>(null)

  // On a phone the row scrolls sideways: bring the open calculator into view.
  useEffect(() => {
    const el = list.current?.querySelector<HTMLElement>('[aria-current="page"]')
    if (el && list.current) list.current.scrollLeft = el.offsetLeft - 16
  }, [activeSlug])

  return (
    <nav aria-label="Calculators" className="-mx-4 mt-8 sm:mx-0">
      <ul ref={list} className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {CALCULATORS.map((c) => {
          const active = c.slug === activeSlug
          const Icon = ICONS[c.slug] ?? (c.slug.includes('loan') ? Landmark : Calculator)
          return (
            <li key={c.slug} className="min-w-[15rem] shrink-0 snap-start sm:min-w-0">
              <Link
                href={`/tools/${c.slug}`}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group flex h-full items-start gap-3 rounded-2xl border p-4 transition-all',
                  active
                    ? 'bg-primary border-primary text-white shadow-[0_8px_20px_rgb(15_107_76/0.28)]'
                    : 'bg-card hover:border-primary hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgb(16_34_27/0.08)]',
                )}
              >
                <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', active ? 'bg-white/15' : 'bg-mint text-primary')}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className={cn('block font-semibold', active ? 'text-white' : 'text-ink')}>{c.name}</span>
                  <span className={cn('mt-0.5 line-clamp-2 block text-sm leading-snug', active ? 'text-white/80' : 'text-ink-soft')}>{c.summary}</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
