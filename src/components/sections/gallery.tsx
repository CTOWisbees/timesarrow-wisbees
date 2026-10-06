import Link from 'next/link'

import { CmsImage } from '@/components/shared/cms-image'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { linkProps } from '@/lib/links'
import type { GalleryItem, HomePage } from '@/payload-types'

export function Gallery({ data, items }: { data: HomePage['gallery']; items: GalleryItem[] }) {
  if (!items.length) return null
  return (
    <section id="gallery" aria-labelledby="gallery-title">
      <div className="bg-paper">
        <div className="container-page flex items-end justify-between gap-4 pb-10">
          <h2 id="gallery-title" className="text-4xl font-semibold tracking-tight md:text-5xl">
            {data.title}
          </h2>
          {data.cta?.href && (
            <Link href={data.cta.href} {...linkProps(data.cta.href)} className="text-primary text-sm font-semibold hover:underline">
              {data.cta.label}
            </Link>
          )}
        </div>
      </div>

      <div className="relative isolate overflow-hidden py-16 md:py-24">
        <CmsImage
          media={data.backgroundImage}
          fallbackSrc="/placeholders/gallery-bg.svg"
          fallbackAlt=""
          fill
          sizes="100vw"
          className="-z-20 object-cover"
        />
        <div className="bg-brand-green-strong/70 absolute inset-0 -z-10" aria-hidden />

        <div className="container-page">
          <Carousel opts={{ align: 'start', loop: items.length > 3 }}>
            <CarouselContent className="-ml-4 md:-ml-6">
              {items.map((item, i) => (
                <CarouselItem key={item.id} className="basis-[80%] pl-4 sm:basis-1/2 md:pl-6 lg:basis-1/4">
                  <figure className="overflow-hidden rounded-lg bg-white/10">
                    <CmsImage
                      media={item.image}
                      fallbackSrc={`/placeholders/gallery-${(i % 5) + 1}.svg`}
                      fallbackAlt={item.title}
                      width={640}
                      height={440}
                      sizes="(min-width: 1024px) 25vw, 80vw"
                      className="aspect-[16/11] h-auto w-full object-cover"
                    />
                    <figcaption className="px-3 py-2.5 text-sm font-medium text-white">{item.title}</figcaption>
                  </figure>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="mt-6 flex justify-end gap-2">
              <CarouselPrevious className="static translate-y-0 bg-white/90" />
              <CarouselNext className="static translate-y-0 bg-white/90" />
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  )
}
