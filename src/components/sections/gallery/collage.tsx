'use client'

import { Pause, Play } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { CmsImage } from '@/components/shared/cms-image'
import { Button } from '@/components/ui/button'
import { linkProps } from '@/lib/links'
import { cn } from '@/lib/utils'
import type { GalleryItem, HomePage } from '@/payload-types'

import { EventLink, eventMeta, placeholder } from './parts'

const MAX_TILES = 5

/**
 * Variant "collage": the current event's photo, blurred and lightly tinted green, fills the
 * whole screen behind its title and description, with a row of photo tiles underneath.
 * The current tile is the large one; the slideshow advances on its own while the section is
 * on screen (pausable, still under reduced motion) and any tile can be picked. The section is
 * exactly one viewport tall and the tile row has a fixed height, so nothing shifts when the
 * photo or text changes.
 */
export function GalleryCollage({ data, items, intervalMs }: { data: HomePage['gallery']; items: GalleryItem[]; intervalMs: number }) {
  const shown = items.slice(0, MAX_TILES)
  const rootRef = useRef<HTMLElement>(null)
  const [index, setIndex] = useState(0)
  const [inView, setInView] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.4 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const running = shown.length > 1 && inView && !hovered && !paused && !reducedMotion
  useEffect(() => {
    if (!running) return
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % shown.length), intervalMs)
    return () => window.clearTimeout(timer)
  }, [running, index, intervalMs, shown.length])

  return (
    <section
      ref={rootRef}
      id="gallery"
      aria-labelledby="gallery-title"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="bg-night relative isolate flex h-[calc(100svh-var(--header-h))] min-h-[38rem] flex-col overflow-hidden text-white"
    >
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
            className={cn('scale-110 object-cover blur-[10px] transition-opacity duration-700 motion-reduce:transition-none', i === index ? 'opacity-100' : 'opacity-0')}
          />
        ))}
        <div className="absolute inset-0 bg-[rgb(15_107_76/0.5)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgb(6_20_14/0.18)] via-transparent to-[rgb(6_20_14/0.28)]" />
      </div>

      <div className="container-page flex min-h-0 flex-1 flex-col py-8 sm:py-10 lg:py-12">
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

        {/* Every event's text shares one grid cell, so the block is as tall as the longest and never resizes. */}
        <div aria-live={running ? 'off' : 'polite'} className="mt-2 grid max-w-3xl">
          {shown.map((item, i) => {
            const active = i === index
            const meta = eventMeta(item)
            return (
              <div
                key={item.id}
                aria-hidden={!active}
                className={cn(
                  'col-start-1 row-start-1 transition-[opacity,translate] duration-700 motion-reduce:transition-none',
                  active ? 'translate-y-0 opacity-100' : 'invisible translate-y-2 opacity-0',
                )}
              >
                {meta && <p className="text-mint text-sm font-medium">{meta}</p>}
                <h3 className="mt-2 text-3xl leading-[1.1] font-semibold tracking-tight text-balance text-white sm:text-4xl lg:text-5xl">{item.title}</h3>
                {item.description && <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/90 lg:text-lg">{item.description}</p>}
                <EventLink item={item} active={active} className="mt-4" />
              </div>
            )
          })}
        </div>

        <div className="flex-1" />

        {shown.length > 1 && (
          <div className="mt-8 flex items-center gap-4">
            <ul
              aria-label="Choose an event"
              className="-mx-4 flex h-[clamp(9rem,28svh,16rem)] min-w-0 flex-1 snap-x items-center gap-3 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:gap-5 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
            >
              {shown.map((item, i) => {
                const isActive = i === index
                return (
                  <li key={item.id} className={cn('h-full shrink-0 snap-center', isActive ? 'lg:flex-[1.9]' : 'lg:flex-1')}>
                    <button
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-pressed={isActive}
                      className={cn(
                        'relative block aspect-[3/2] max-w-full overflow-hidden rounded-md bg-mint shadow-[0_10px_30px_rgb(0_0_0/0.3)] ring-white transition-[height,opacity] duration-500 focus-visible:ring-3 focus-visible:outline-none motion-reduce:transition-none',
                        'lg:aspect-auto lg:w-full',
                        isActive ? 'h-full ring-2' : 'h-[72%] opacity-85 hover:opacity-100',
                      )}
                    >
                      <CmsImage media={item.image} fallbackSrc={placeholder(i)} fallbackAlt="" fill sizes="(min-width: 1024px) 35vw, 70vw" className="object-cover" />
                      <span className="sr-only">Show {item.title}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden size-10 shrink-0 self-end rounded-full text-white hover:bg-white hover:text-brand-green-strong sm:inline-flex"
              onClick={() => setPaused((p) => !p)}
              disabled={reducedMotion}
            >
              {paused || reducedMotion ? <Play className="size-4" /> : <Pause className="size-4" />}
              <span className="sr-only">{paused ? 'Play slideshow' : 'Pause slideshow'}</span>
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
