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
          fallbackSrc="/brand/hero.webp"
          fallbackAlt="A calm, confident investor beside a confused one, both at their laptops"
          width={1414}
          height={565}
          priority
          sizes="(min-width: 1024px) 864px, 100vw"
          className="mt-6 h-auto w-full max-w-[min(54rem,calc((100svh-var(--header-h)-21rem)*2.5))] sm:mt-8"
        />

        {/* Stacked full-width on phones, side by side from the sm breakpoint. */}
        <div className="mt-6 flex w-full max-w-xs flex-col gap-2.5 sm:mt-8 sm:w-auto sm:max-w-none sm:flex-row sm:justify-center sm:gap-4">
          {data.secondaryCta?.href && (
            <Button asChild variant="brandOutline" size="cta" className="h-11 w-full px-6 sm:h-12 sm:w-auto sm:px-7">
              <Link href={data.secondaryCta.href} {...linkProps(data.secondaryCta.href)}>
                {data.secondaryCta.label}
              </Link>
            </Button>
          )}
          {data.primaryCta?.href && (
            <Button asChild size="cta" className="h-11 w-full px-6 sm:h-12 sm:w-auto sm:px-7">
              <Link href={data.primaryCta.href} {...linkProps(data.primaryCta.href)}>
                {data.primaryCta.label}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
