import { ArrowRight, ArrowUpRight, IndianRupee, Star } from 'lucide-react'
import Link from 'next/link'

import { CmsImage } from '@/components/shared/cms-image'
import { Lines, Section } from '@/components/shared/section'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { bundledLogo } from '@/lib/holding-logos'
import { linkProps } from '@/lib/links'
import { cn } from '@/lib/utils'
import type { HomePage, Media, ModelPortfolio } from '@/payload-types'

const riskStyles: Record<ModelPortfolio['riskLevel'], { card: string; head: string; chip: string }> = {
  conservative: { card: 'border-transparent', head: 'bg-mint', chip: 'bg-mint-strong text-brand-green-strong' },
  moderate: { card: 'border-amber-line', head: 'bg-amber-soft', chip: 'bg-amber/40 text-amber-ink' },
  aggressive: { card: 'border-transparent', head: 'bg-mint', chip: 'bg-mint-strong text-brand-green-strong' },
}

const riskLabel = (level: ModelPortfolio['riskLevel']) => level[0].toUpperCase() + level.slice(1)

export function ModelPortfolios({ data, portfolios }: { data: HomePage['portfolios']; portfolios: ModelPortfolio[] }) {
  if (!portfolios.length) return null
  return (
    <Section id="portfolios" aria-labelledby="portfolios-title">
      <div className="max-w-3xl">
        <h2 id="portfolios-title" className="text-4xl leading-tight font-medium tracking-tight md:text-5xl">
          <Lines text={data.title} />
        </h2>
        {data.intro && <p className="text-ink-soft mt-5 text-lg leading-relaxed">{data.intro}</p>}
      </div>

      {/* Plain stacked cards: one per row on phones, two on tablets, three on desktop. */}
      <ul className="mt-10 grid gap-5 sm:gap-6 md:mt-12 md:grid-cols-2 lg:grid-cols-3">
        {portfolios.map((p) => (
          <li key={p.id}>
            <PortfolioCard portfolio={p} />
          </li>
        ))}
      </ul>
    </Section>
  )
}

function PortfolioCard({ portfolio: p }: { portfolio: ModelPortfolio }) {
  const style = riskStyles[p.riskLevel]
  const holdings = p.showHoldings !== false ? (p.holdings ?? []) : []
  return (
    <Card className={cn('h-full gap-0 rounded-2xl border py-0 text-base shadow-[0_2px_10px_rgb(16_34_27/0.06)] ring-0', style.card)}>
      <CardHeader className={cn('block px-6 pt-6 pb-7', style.head)}>
        <div className="flex items-center justify-between gap-3">
          <Badge className={cn('h-auto px-3 py-1 font-semibold', style.chip)}>{riskLabel(p.riskLevel)}</Badge>
          {p.showBadge && p.badge && (
            <Badge className="text-amber-ink h-auto bg-white/80 px-3 py-1 font-semibold">
              <Star className="fill-current" aria-hidden />
              {p.badge}
            </Badge>
          )}
        </div>
        <h3 className="mt-4 text-3xl font-medium">{p.name}</h3>
        <CardDescription className="text-ink-soft mt-3 text-[0.95rem] leading-relaxed">{p.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-5 p-6">
        <div className="grid grid-cols-2 gap-3">
          {p.showExpectedReturn !== false && p.expectedReturn && (
            <Figure icon={<ArrowUpRight className="size-4" />} label="Expected return" value={p.expectedReturn} />
          )}
          {p.minimumEntry && <Figure icon={<IndianRupee className="size-4" />} label="Minimum entry" value={p.minimumEntry} />}
        </div>

        {holdings.length > 0 && (
          <div className="bg-mist rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-sans text-base font-semibold">Portfolio composition</h4>
              <Badge className="bg-mint text-brand-green-strong h-auto px-2.5 py-1 font-semibold">{holdings.length} stocks</Badge>
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-2">
              {holdings.map((h) => (
                <li key={h.id ?? h.name} className="bg-card flex min-h-14 items-center gap-2.5 rounded-lg border px-2.5 py-2 text-sm font-medium">
                  <HoldingLogo name={h.name} logo={h.logo} />
                  <span className="leading-tight">{h.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {p.detailsHref && (
          <Link href={p.detailsHref} {...linkProps(p.detailsHref)} className="text-ink hover:text-primary mt-auto inline-flex items-center gap-1.5 text-sm font-semibold">
            View details <ArrowRight className="size-4" aria-hidden />
            <span className="sr-only">for {p.name}</span>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}

function Figure({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-2 rounded-xl border p-2.5 min-[25rem]:flex-row min-[25rem]:items-center lg:flex-col lg:items-start xl:flex-row xl:items-center">
      <span className="bg-mint text-brand-green-strong flex size-7 shrink-0 items-center justify-center rounded-full" aria-hidden>
        {icon}
      </span>
      <div>
        <p className="text-muted-foreground text-[0.7rem] whitespace-nowrap">{label}</p>
        <p className="text-sm font-bold whitespace-nowrap">{value}</p>
      </div>
    </div>
  )
}

function HoldingLogo({ name, logo }: { name: string; logo?: number | Media | null }) {
  const fallback = bundledLogo(name)
  if ((typeof logo === 'object' && logo?.url) || fallback) {
    return (
      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white p-0.5" aria-hidden>
        <CmsImage media={logo} fallbackSrc={fallback ?? ''} fallbackAlt="" width={64} height={64} className="size-full object-contain" />
      </span>
    )
  }
  const initials = name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <span className="bg-mint text-brand-green-strong flex size-8 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold" aria-hidden>
      {initials}
    </span>
  )
}
