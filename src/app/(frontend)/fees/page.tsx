import type { Metadata } from 'next'
import { Check } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { tiers } from '@/lib/portal/data'
import { FEE_CAP_PER_YEAR } from '@/lib/portal/math'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Plans and fees', description: 'One flat, published fee per family. No commissions, no hidden charges.' }

// Fee text is regulated content: it must be BASL-approved before the site is indexed (see CLAUDE.md).
const principles = [
  ['A flat fee, published here', 'You pay a fixed subscription. It does not grow when your investments do.'],
  ['Capped by SEBI', `A fixed fee is limited to ₹${(FEE_CAP_PER_YEAR / 100_000).toFixed(2)} lakh per family per year. Every plan below sits well under it.`],
  ['Nothing to sell', 'We take no commission or trail from any product. You invest in direct plans in your own accounts.'],
  ['Consent before anything', 'Fees are disclosed before you subscribe, and a second opinion on an outside product needs your explicit consent and a documented fee.'],
] as const

export default function FeesPage() {
  return (
    <>
      <div className="from-mint to-paper border-b bg-gradient-to-b">
        <div className="container-page py-10 md:py-16">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Plans and fees</h1>
          <p className="text-ink-soft mt-4 max-w-2xl text-lg">One flat, published fee per family. We sell advice, not products, so nothing we recommend earns us a commission.</p>
        </div>
      </div>

      <div className="container-page py-10 md:py-14">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((t) => {
            const popular = 'popular' in t && t.popular
            return (
              <section key={t.id} className={cn('bg-card flex flex-col gap-4 rounded-3xl border p-6 shadow-[0_2px_12px_rgb(16_34_27/0.05)]', popular && 'border-primary border-2 shadow-[0_10px_28px_rgb(15_107_76/0.18)]')}>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-2xl font-semibold">{t.name}</h2>
                  {popular && <span className="bg-primary text-primary-foreground rounded-full px-2.5 py-0.5 text-xs font-bold">Most chosen</span>}
                </div>
                <div>
                  <span className="font-heading text-3xl font-semibold tabular-nums">{t.price}</span>
                  <span className="text-ink-soft text-sm"> {t.unit}</span>
                </div>
                <p className="text-ink-soft text-sm">For: {t.forWho}</p>
                <ul className="flex flex-1 flex-col gap-2">
                  {t.includes.map((i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <Check className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
                      {i}
                    </li>
                  ))}
                </ul>
                <Button asChild variant={popular ? 'default' : 'brandOutline'} size="cta">
                  <Link href={t.id === 'free' ? '/portfolio-scan' : '/login'}>{t.id === 'free' ? 'Run a free Port Scan' : `Choose ${t.name}`}</Link>
                </Button>
              </section>
            )
          })}
        </div>

        <h2 className="mt-14 text-3xl font-semibold tracking-tight">How our fee works</h2>
        <dl className="mt-6 grid gap-5 md:grid-cols-2">
          {principles.map(([t, d]) => (
            <div key={t} className="bg-card rounded-2xl border p-5">
              <dt className="text-ink font-semibold">{t}</dt>
              <dd className="text-ink-soft mt-1">{d}</dd>
            </div>
          ))}
        </dl>
        <p className="text-muted-foreground mt-8 text-sm">
          Investments in securities markets are subject to market risks. See our <Link href="/sebi-disclosure" className="text-primary underline underline-offset-2">SEBI disclosures</Link> for registration details and the complaint process.
        </p>
      </div>
    </>
  )
}
