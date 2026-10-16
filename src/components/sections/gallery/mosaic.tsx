import Link from 'next/link'

import { CmsImage } from '@/components/shared/cms-image'
import { linkProps } from '@/lib/links'
import { cn } from '@/lib/utils'
import type { GalleryItem, HomePage } from '@/payload-types'

import { eventMeta, GalleryHeading, placeholder } from './parts'

/** Where each of the first five photos sits in the desktop grid (4 columns × 2 rows). */
const tiles = [
  'lg:col-span-2 lg:row-span-2',
  'lg:col-span-1',
  'lg:col-span-1',
  'lg:col-span-1',
  'lg:col-span-1',
]

/**
 * Variant "mosaic": every event visible at once, no slideshow. A large lead photo and
 * four smaller ones on desktop; a swipeable row on phones. Server-rendered, no JS.
 */
export function GalleryMosaic({ data, items }: { data: HomePage['gallery']; items: GalleryItem[] }) {
  const shown = items.slice(0, tiles.length)
  return (
    <section id="gallery" aria-labelledby="gallery-title" className="bg-paper py-16 md:py-20">
      <div className="container-page">
        <GalleryHeading data={data} tone="dark" />

        <ul
          className={cn(
            'mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] md:mt-10 [&::-webkit-scrollbar]:hidden',
            'lg:grid lg:h-[min(68svh,40rem)] lg:snap-none lg:grid-cols-4 lg:grid-rows-2 lg:gap-4 lg:overflow-visible lg:pb-0',
          )}
        >
          {shown.map((item, i) => {
            const meta = eventMeta(item)
            const lead = i === 0
            const body = (
              <>
                <CmsImage
                  media={item.image}
                  fallbackSrc={placeholder(i)}
                  fallbackAlt={item.title}
                  fill
                  sizes={lead ? '(min-width: 1024px) 50vw, 85vw' : '(min-width: 1024px) 25vw, 85vw'}
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
                />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[rgb(6_20_14/0.85)] via-[rgb(6_20_14/0.2)] to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  {meta && <span className="text-mint block text-xs font-medium">{meta}</span>}
                  <span className={cn('font-heading mt-1 block leading-tight font-semibold text-white', lead ? 'text-2xl lg:text-3xl' : 'text-lg')}>
                    {item.title}
                  </span>
                  {lead && item.description && (
                    <span className="mt-2 hidden max-w-lg text-sm leading-relaxed text-white/80 lg:block">{item.description}</span>
                  )}
                </span>
              </>
            )
            return (
              <li
                key={item.id}
                className={cn(
                  'group relative aspect-[4/3] w-[82%] shrink-0 snap-start overflow-hidden rounded-2xl bg-mint sm:w-[46%] lg:aspect-auto lg:w-auto',
                  tiles[i],
                )}
              >
                {item.href ? (
                  <Link href={item.href} {...linkProps(item.href)} className="absolute inset-0 rounded-2xl focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
