import type { Metadata } from 'next'
import Link from 'next/link'

import { CALCULATORS } from '@/lib/calculators/registry'

export const metadata: Metadata = {
  title: 'Tools and calculators',
  description: 'Free SIP, lumpsum and SWP calculators with every step of the formula shown.',
}

function Grid() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CALCULATORS.map((c) => (
        <li key={c.slug}>
          <Link
            href={`/tools/${c.slug}`}
            className="bg-card hover:border-primary focus-visible:ring-ring/50 group flex h-full flex-col rounded-2xl border p-6 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgb(16_34_27/0.08)] focus-visible:ring-3 focus-visible:outline-none"
          >
            <h2 className="group-hover:text-primary text-lg font-semibold">{c.name}</h2>
            <p className="text-ink-soft mt-2 flex-1 text-sm leading-relaxed">{c.summary}</p>
            <span className="text-primary mt-5 text-sm font-semibold">Open calculator →</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default function ToolsPage() {
  return (
    <>
      <div className="bg-mint border-b">
        <div className="container-page py-12 md:py-20">
          <h1 className="max-w-3xl text-4xl leading-tight font-semibold tracking-tight md:text-6xl">Tools and calculators</h1>
          <p className="text-ink-soft mt-4 max-w-2xl text-lg">Plan your investments and withdrawals with calculators built on the standard formulas, with every step shown.</p>
        </div>
      </div>
      <div className="container-page py-12 md:py-16">
        <Grid />
      </div>
    </>
  )
}
