import Link from 'next/link'

import { CALCULATORS } from '@/lib/calculators/registry'
import { cn } from '@/lib/utils'

/** Jump between the calculators. */
export function CalculatorSwitcher({ activeSlug }: { activeSlug: string }) {
  return (
    <nav aria-label="Calculators" className="mt-6 flex flex-wrap gap-2">
      {CALCULATORS.map((c) => {
        const active = c.slug === activeSlug
        return (
          <Link
            key={c.slug}
            href={`/tools/${c.slug}`}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
              active ? 'bg-primary border-primary text-white' : 'bg-card text-ink-soft hover:border-primary hover:text-primary',
            )}
          >
            {c.name}
          </Link>
        )
      })}
    </nav>
  )
}
