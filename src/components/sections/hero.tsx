import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { CmsImage } from '@/components/shared/cms-image'
import { Lines } from '@/components/shared/section'
import { Button } from '@/components/ui/button'
import { linkProps } from '@/lib/links'
import type { HomePage } from '@/payload-types'

/**
 * Headline, illustration and the two calls to action, at their natural height.
 *
 * The headline always keeps the line breaks typed in the CMS (two lines) and never
 * wraps further: its size follows the screen width so the longest line fits, from
 * phones up to a 4rem cap. The illustration keeps its own proportions, and its width
 * is also capped by the screen height so the CTAs stay above the fold on laptops.
 */
export function Hero({ data }: { data: HomePage['hero'] }) {
  return (
    <section className="bg-card">
      <div className="container-page flex flex-col items-center pt-10 pb-12 text-center sm:pt-14 sm:pb-16 lg:pt-[clamp(2.5rem,6svh,4.5rem)] lg:pb-[clamp(3rem,7svh,5rem)]">
        <h1 className="text-[clamp(1.375rem,min(calc((100vw-2rem)/16.5),7svh),4rem)] leading-[1.1] font-bold tracking-[-0.02em] whitespace-nowrap">
          <Lines text={data.headline} />
        </h1>
        {data.subheadline && (
          <p className="text-ink-soft mt-4 max-w-2xl text-base leading-relaxed sm:mt-5 sm:text-lg">{data.subheadline}</p>
        )}

        <CmsImage
          media={data.image}
          fallbackSrc="/brand/hero-comparison.webp"
          fallbackAlt="A calm, confident investor beside a confused one, both at their laptops"
          width={2000}
          height={1131}
          priority
          sizes="(min-width: 1024px) 1024px, 100vw"
          className="mt-6 h-auto w-full max-w-[min(66rem,calc((100svh-var(--header-h)-19rem)*1.77))] sm:mt-6"
        />

        {/* Stacked full-width on phones, side by side from the sm breakpoint, with room between them. */}
        <div className="mt-8 flex w-full max-w-xs flex-col gap-3 sm:mt-8 sm:w-auto sm:max-w-none sm:flex-row sm:justify-center sm:gap-6">
          {data.secondaryCta?.href && (
            <Button
              asChild
              variant="brandOutline"
              size="cta"
              className="border-primary/40 hover:border-primary h-12 w-full rounded-xl px-7 font-semibold shadow-[0_1px_2px_rgb(16_34_27/0.06)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgb(16_34_27/0.1)] sm:h-[3.25rem] sm:w-auto sm:min-w-[14rem]"
            >
              <Link href={data.secondaryCta.href} {...linkProps(data.secondaryCta.href)}>
                {data.secondaryCta.label}
              </Link>
            </Button>
          )}
          {data.primaryCta?.href && (
            <Button
              asChild
              size="cta"
              className="group h-12 w-full rounded-xl px-7 font-semibold shadow-[0_6px_18px_rgb(15_107_76/0.3)] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgb(15_107_76/0.4)] sm:h-[3.25rem] sm:w-auto sm:min-w-[14rem]"
            >
              <Link href={data.primaryCta.href} {...linkProps(data.primaryCta.href)}>
                {data.primaryCta.label}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
