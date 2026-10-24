import Link from 'next/link'

import { CALCULATORS } from '@/lib/calculators/registry'
import { cn } from '@/lib/utils'

/** Jump between the calculators. */
export function CalculatorSwitcher({ activeSlug }: { activeSlug: string }) {
  return (
    <nav aria-label="Calculators" className="mt-8">
      <p className="text-ink-soft mb-3 text-sm font-medium">Choose a calculator</p>
      <div className="flex flex-wrap gap-3">
      {CALCULATORS.map((c) => {
        const active = c.slug === activeSlug
        return (
          <Link
            key={c.slug}
            href={`/tools/${c.slug}`}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-full border px-6 py-3 text-base font-semibold shadow-sm transition-colors sm:px-8 sm:py-3.5 sm:text-lg',
              active ? 'bg-primary border-primary text-white' : 'bg-card text-ink-soft hover:border-primary hover:text-primary',
            )}
          >
            {c.name}
          </Link>
        )
      })}
      </div>
    </nav>
  )
}
