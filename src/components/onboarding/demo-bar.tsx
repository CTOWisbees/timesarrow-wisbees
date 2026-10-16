import Link from 'next/link'

import { cn } from '@/lib/utils'

const STEPS = [
  { n: 1, label: 'Account', href: '/login' },
  { n: 2, label: 'Profile', href: '/onboarding?step=2' },
  { n: 3, label: 'Review', href: '/onboarding?step=3' },
]

/** Demo mode only: jump between steps while presenting. */
export function DemoBar({ current }: { current: 1 | 2 | 3 }) {
  return (
    <nav aria-label="Demo steps" className="bg-amber-soft text-amber-ink border-amber-line mb-6 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">
      <span className="font-semibold">Demo mode</span>
      <span aria-hidden>·</span>
      {STEPS.map((s) => (
        <Link
          key={s.n}
          href={s.href}
          aria-current={s.n === current ? 'page' : undefined}
          className={cn('rounded px-1.5 py-0.5 hover:underline', s.n === current && 'bg-amber/40 font-semibold')}
        >
          {s.n}. {s.label}
        </Link>
      ))}
    </nav>
  )
}
