import Link from 'next/link'

import { CmsImage } from '@/components/shared/cms-image'
import { Disclaimer } from '@/components/shared/disclaimer'
import { Lines } from '@/components/shared/section'
import { Button } from '@/components/ui/button'
import { linkProps } from '@/lib/links'
import type { HomePage } from '@/payload-types'

export function Hero({ data }: { data: HomePage['hero'] }) {
  return (
    <section className="bg-card pt-14 pb-12 md:pt-20 md:pb-14">
      <div className="container-page flex flex-col items-center text-center">
        <h1 className="max-w-5xl text-[2.5rem] leading-[1.05] font-bold tracking-[-0.02em] sm:text-6xl lg:text-[4.5rem]">
          <Lines text={data.headline} />
        </h1>
        {data.subheadline && (
          <p className="text-ink-soft mt-6 max-w-2xl text-lg leading-relaxed md:text-xl">{data.subheadline}</p>
        )}

        <CmsImage
          media={data.image}
          fallbackSrc="/placeholders/hero.svg"
          fallbackAlt="A confident investor beside a confused investor, both at their laptops"
          width={1200}
          height={520}
          priority
          sizes="(min-width: 1024px) 800px, 100vw"
          className="mt-10 h-auto w-full max-w-[50rem] rounded-xl"
        />

        <div className="mt-10 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row sm:gap-6">
          {data.secondaryCta?.href && (
            <Button asChild variant="brandOutline" size="cta" className="sm:min-w-56">
              <Link href={data.secondaryCta.href} {...linkProps(data.secondaryCta.href)}>
                {data.secondaryCta.label}
              </Link>
            </Button>
          )}
          {data.primaryCta?.href && (
            <Button asChild size="cta" className="sm:min-w-48">
              <Link href={data.primaryCta.href} {...linkProps(data.primaryCta.href)}>
                {data.primaryCta.label}
              </Link>
            </Button>
          )}
        </div>

        <Disclaimer className="mt-8 max-w-2xl">{data.disclaimer}</Disclaimer>
      </div>
    </section>
  )
}
