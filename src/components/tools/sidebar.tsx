import Link from 'next/link'

import { MUTUAL_FUND, POPULAR } from '@/lib/calculators/registry'
import type { CalculatorDef } from '@/lib/calculators/types'
import { cn } from '@/lib/utils'

function Group({ title, items, activeSlug }: { title: string; items: CalculatorDef[]; activeSlug?: string }) {
  return (
    <nav aria-label={title} className="bg-card overflow-hidden rounded-2xl border">
      <h2 className="font-sans border-b px-5 py-4 text-base font-semibold">{title}</h2>
      <ul>
        {items.map((c) => {
          const active = c.slug === activeSlug
          return (
            <li key={c.slug} className="border-b last:border-b-0">
              <Link
                href={`/tools/${c.slug}`}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'text-ink-soft hover:bg-mist hover:text-primary block px-5 py-3.5 text-[0.95rem] transition-colors',
                  active && 'bg-mint text-primary border-l-primary -ml-px border-l-4 font-semibold',
                )}
              >
                {c.name}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function ToolsSidebar({ activeSlug }: { activeSlug?: string }) {
  return (
    <aside className="flex flex-col gap-6 lg:order-first lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
      <Group title="Popular Calculators" items={POPULAR} activeSlug={activeSlug} />
      <Group title="Mutual Fund Calculators" items={MUTUAL_FUND} activeSlug={activeSlug} />
    </aside>
  )
}
