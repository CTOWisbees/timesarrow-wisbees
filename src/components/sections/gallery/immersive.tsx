'use client'

import Fade from 'embla-carousel-fade'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { useRef, useState } from 'react'

import { CmsImage } from '@/components/shared/cms-image'
import { Button } from '@/components/ui/button'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { cn } from '@/lib/utils'
import type { GalleryItem, HomePage } from '@/payload-types'

import { EventLink, eventMeta, GalleryHeading, placeholder, ProgressFill } from './parts'
import { useSlideshow } from './use-slideshow'

const controlButton =
  'size-10 shrink-0 rounded-full text-white hover:bg-white hover:text-brand-green-strong focus-visible:bg-white focus-visible:text-brand-green-strong disabled:opacity-40'

/**
 * Variant "immersive": the current photo fills the whole section and cross-fades to
 * the next, with a slow zoom. Event text sits bottom-left over a tinted scrim; every
 * control lives in one bar centred at the bottom, out of the photo's way. The photo
 * layer stays draggable, so phones can swipe between events.
 */
export function GalleryImmersive({ data, items, intervalMs }: { data: HomePage['gallery']; items: GalleryItem[]; intervalMs: number }) {
  const sectionRef = useRef<HTMLElement>(null)
  const show = useSlideshow(sectionRef, items.length, intervalMs)
  const [fade] = useState(() => Fade())

  return (
    <section
      ref={sectionRef}
      id="gallery"
      aria-labelledby="gallery-title"
      className="bg-night relative isolate h-[calc(100svh-var(--header-h))] min-h-[34rem] overflow-hidden text-white"
    >
      <Carousel
        setApi={show.setApi}
        plugins={[show.autoplay, fade]}
        opts={{ loop: items.length > 1, duration: show.reducedMotion ? 0 : 30 }}
        aria-label="Event photos"
        className="absolute inset-0 -z-10 [&>[data-slot=carousel-content]]:h-full"
      >
        <CarouselContent className="ml-0 h-full">
          {items.map((item, i) => (
            <CarouselItem key={item.id} aria-label={`${i + 1} of ${items.length}: ${item.title}`} className="relative h-full overflow-hidden pl-0">
              <CmsImage
                media={item.image}
                fallbackSrc={placeholder(i)}
                fallbackAlt={item.title}
                fill
                sizes="100vw"
                priority={i === 0}
                // Slow zoom-out while the photo is on screen; skipped under reduced motion.
                style={{ transitionDuration: `${intervalMs + 1500}ms` }}
                className={cn(
                  'object-cover ease-out motion-safe:transition-transform',
                  i === show.index ? 'scale-100' : 'motion-safe:scale-[1.08]',
                )}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Scrims: tinted, so text stays legible on bright photos without greying them. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[rgb(6_20_14/0.82)] via-[rgb(6_20_14/0.4)] to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-[rgb(6_20_14/0.92)] via-[rgb(6_20_14/0.55)] to-transparent" />

      {/* Content layer lets drags through to the photo except on its own controls. */}
      <div className="container-page pointer-events-none relative flex h-full flex-col py-7 sm:py-10 lg:py-12">
        <div className="pointer-events-auto">
          <GalleryHeading data={data} tone="light" />
        </div>

        <div className="flex-1" />

        <div aria-live={show.running ? 'off' : 'polite'} className="grid max-w-2xl">
          {items.map((item, i) => {
            const active = i === show.index
            const meta = eventMeta(item)
            return (
              <div
                key={item.id}
                aria-hidden={!active}
                className={cn(
                  'col-start-1 row-start-1 self-end transition-[opacity,translate] duration-700 ease-out motion-reduce:transition-none',
                  active ? 'translate-y-0 opacity-100' : 'invisible translate-y-2 opacity-0',
                )}
              >
                {meta && <p className="text-mint text-sm font-medium">{meta}</p>}
                <h3 className="mt-2 text-3xl leading-[1.08] font-semibold tracking-[-0.015em] text-balance text-white sm:text-4xl lg:text-[3.25rem]">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-white/85 sm:text-base lg:mt-4 lg:text-lg">
                    {item.description}
                  </p>
                )}
                <EventLink item={item} active={active} className="pointer-events-auto mt-4" />
              </div>
            )
          })}
        </div>

        {items.length > 1 && (
          <div className="pointer-events-auto mt-6 flex justify-center sm:mt-8">
            <div className="flex max-w-full items-center gap-1 rounded-full bg-[rgb(6_20_14/0.55)] p-1.5 ring-1 ring-white/15 backdrop-blur-md sm:gap-1.5">
              <Button type="button" variant="ghost" size="icon" className={controlButton} onClick={show.prev}>
                <ChevronLeft className="size-5" />
                <span className="sr-only">Previous photo</span>
              </Button>

              {/* Thumbnails from small tablets up; slim progress dots on phones. */}
              <div role="group" aria-label="Choose a photo" className="flex items-center gap-1.5 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {items.map((item, i) => {
                  const active = i === show.index
                  return (
                    <Button
                      key={item.id}
                      type="button"
                      variant="ghost"
                      onClick={() => show.goTo(i)}
                      aria-current={active}
                      className={cn(
                        'relative shrink-0 overflow-hidden p-0 transition-[opacity,width] hover:bg-transparent',
                        'h-1.5 rounded-full bg-white/30 sm:h-9 sm:w-14 sm:rounded-md sm:bg-transparent',
                        active ? 'w-8 opacity-100' : 'w-3 opacity-60 hover:opacity-100',
                      )}
                    >
                      <CmsImage
                        media={item.image}
                        fallbackSrc={placeholder(i)}
                        fallbackAlt=""
                        fill
                        sizes="56px"
                        className="hidden object-cover sm:block"
                      />
                      <span className="sr-only">Show {item.title}</span>
                      {active && (
                        <>
                          <span aria-hidden className="pointer-events-none absolute inset-0 hidden rounded-md ring-2 ring-white ring-inset sm:block" />
                          <span aria-hidden className="absolute inset-0 sm:inset-auto sm:inset-x-0 sm:bottom-0 sm:h-1 sm:bg-black/35">
                            <ProgressFill
                              running={show.running}
                              intervalMs={intervalMs}
                              resetKey={`${show.index}-${show.running}`}
                              className="bg-white"
                            />
                          </span>
                        </>
                      )}
                    </Button>
                  )
                })}
              </div>

              <Button type="button" variant="ghost" size="icon" className={controlButton} onClick={show.next}>
                <ChevronRight className="size-5" />
                <span className="sr-only">Next photo</span>
              </Button>

              <span aria-hidden className="mx-1 h-5 w-px bg-white/20" />
              <span aria-hidden className="w-11 text-center text-xs font-semibold tabular-nums text-white/85">
                {show.index + 1}/{items.length}
              </span>
              <Button type="button" variant="ghost" size="icon" className={controlButton} onClick={show.togglePause} disabled={show.reducedMotion}>
                {show.paused ? <Play className="size-4" /> : <Pause className="size-4" />}
                <span className="sr-only">{show.paused ? 'Play slideshow' : 'Pause slideshow'}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
