'use client'

import Link from 'next/link'
import { useState } from 'react'

import { CmsImage } from '@/components/shared/cms-image'
import { linkProps } from '@/lib/links'
import { cn } from '@/lib/utils'
import type { GalleryItem, HomePage } from '@/payload-types'

import { EventLink, eventMeta, placeholder } from './parts'

const MAX_TILES = 5

/**
 * Variant "collage": the chosen event's photo, tinted green and softly blurred, fills the
 * section behind its title and description. A row of photo tiles sits underneath; picking
 * one makes it the large tile and swaps the backdrop and text. No autoplay, so there is
 * nothing to pause. Uses only the gallery photos already in the CMS.
 */
export function GalleryCollage({ data, items }: { data: HomePage['gallery']; items: GalleryItem[] }) {
  const shown = items.slice(0, MAX_TILES)
  const [index, setIndex] = useState(0)
  const active = shown[index] ?? shown[0]
  const meta = eventMeta(active)

  return (
    <section id="gallery" aria-labelledby="gallery-title" className="bg-night relative isolate overflow-hidden py-10 text-white sm:py-14 lg:py-16">
      {/* Backdrops cross-fade; the tint keeps the text readable on bright photos. */}
      <div aria-hidden className="absolute inset-0 -z-10">
        {shown.map((item, i) => (
          <CmsImage
            key={item.id}
            media={item.image}
            fallbackSrc={placeholder(i)}
            fallbackAlt=""
            fill
            sizes="100vw"
            priority={i === 0}
            className={cn('scale-105 object-cover blur-[3px] transition-opacity duration-700 motion-reduce:transition-none', i === index ? 'opacity-100' : 'opacity-0')}
          />
        ))}
        <div className="absolute inset-0 bg-[rgb(11_90_63/0.8)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgb(6_20_14/0.35)] via-transparent to-[rgb(6_20_14/0.45)]" />
      </div>

      <div className="container-page">
        {/* The event title below is the visual heading; the section title stays for screen readers. */}
        <div className="flex items-start justify-between gap-4">
          <h2 id="gallery-title" className="sr-only">
            {data.title}
          </h2>
          {data.cta?.href && (
            <Link href={data.cta.href} {...linkProps(data.cta.href)} className="ml-auto text-sm font-semibold text-white underline-offset-4 hover:underline">
              {data.cta.label}
            </Link>
          )}
        </div>

        <div aria-live="polite" className="mt-2 max-w-3xl">
          {meta && <p className="text-mint text-sm font-medium">{meta}</p>}
          <h3 className="mt-2 text-3xl leading-[1.1] font-semibold tracking-tight text-balance text-white sm:text-4xl lg:text-5xl">{active.title}</h3>
          {active.description && <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/90 lg:text-lg">{active.description}</p>}
          <EventLink item={active} className="mt-4" />
        </div>

        {shown.length > 1 && (
          <ul
            aria-label="Choose an event"
            className="-mx-4 mt-10 flex snap-x items-center gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:mt-12 lg:justify-between lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden"
          >
            {shown.map((item, i) => {
              const isActive = i === index
              return (
                <li key={item.id} className={cn('shrink-0 snap-center transition-[width] duration-500 motion-reduce:transition-none', isActive ? 'w-[72%] sm:w-[46%] lg:w-[32%]' : 'w-[46%] sm:w-[28%] lg:w-[16%]')}>
                  <button
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-pressed={isActive}
                    className={cn(
                      'relative block aspect-[3/2] w-full overflow-hidden rounded-md bg-mint shadow-[0_10px_30px_rgb(0_0_0/0.3)] ring-white transition-[opacity,box-shadow] focus-visible:ring-3 focus-visible:outline-none',
                      isActive ? 'ring-2' : 'opacity-85 hover:opacity-100',
                    )}
                  >
                    <CmsImage media={item.image} fallbackSrc={placeholder(i)} fallbackAlt="" fill sizes="(min-width: 1024px) 32vw, 72vw" className="object-cover" />
                    <span className="sr-only">Show {item.title}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
