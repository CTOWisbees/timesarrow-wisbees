import { ArrowRight, ArrowUpRight, IndianRupee, Star } from 'lucide-react'
import Link from 'next/link'

import { CmsImage } from '@/components/shared/cms-image'
import { Disclaimer } from '@/components/shared/disclaimer'
import { Lines, Section } from '@/components/shared/section'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
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

      <Carousel opts={{ align: 'start' }} className="mt-12">
        <CarouselContent className="-ml-4 md:-ml-6">
          {portfolios.map((p) => (
            <CarouselItem key={p.id} className="basis-[88%] pl-4 sm:basis-1/2 md:pl-6 lg:basis-1/3">
              <PortfolioCard portfolio={p} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <Disclaimer className="mt-8 max-w-3xl">{data.disclaimer}</Disclaimer>
    </Section>
  )
}

function PortfolioCard({ portfolio: p }: { portfolio: ModelPortfolio }) {
  const style = riskStyles[p.riskLevel]
  const holdings = p.showHoldings !== false ? (p.holdings ?? []) : []
  return (
    <article className={cn('bg-card flex h-full flex-col overflow-hidden rounded-2xl border shadow-[0_2px_10px_rgb(16_34_27/0.06)]', style.card)}>
      <header className={cn('px-6 pt-6 pb-7', style.head)}>
        <div className="flex items-center justify-between gap-3">
          <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', style.chip)}>{riskLabel(p.riskLevel)}</span>
          {p.showBadge && p.badge && (
            <span className="text-amber-ink inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold">
              <Star className="fill-current size-3" aria-hidden />
              {p.badge}
            </span>
          )}
        </div>
        <h3 className="mt-4 text-3xl font-medium">{p.name}</h3>
        <p className="text-ink-soft mt-3 text-[0.95rem] leading-relaxed">{p.description}</p>
      </header>

      <div className="flex flex-1 flex-col gap-5 p-6">
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
              <span className="bg-mint text-brand-green-strong rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap">
                {holdings.length} stocks
              </span>
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
      </div>
    </article>
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
  if (typeof logo === 'object' && logo?.url) {
    return <CmsImage media={logo} fallbackSrc="" fallbackAlt="" width={32} height={32} className="size-8 shrink-0 rounded-full object-contain" />
  }
  const initials = name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <span className="bg-mint text-brand-green-strong flex size-8 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold" aria-hidden>
      {initials}
    </span>
  )
}
