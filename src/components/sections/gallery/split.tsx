'use client'

import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { CmsImage } from '@/components/shared/cms-image'
import { Button } from '@/components/ui/button'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { cn } from '@/lib/utils'
import type { GalleryItem, HomePage } from '@/payload-types'

import { EventLink, eventMeta, GalleryHeading, placeholder, ProgressFill } from './parts'
import { useSlideshow } from './use-slideshow'

const iconButton =
  'size-10 rounded-full border-white/25 bg-white/5 text-white hover:bg-white hover:text-brand-green-strong focus-visible:bg-white focus-visible:text-brand-green-strong'

/**
 * Variant "split": a 3:2 photo with a filmstrip under it, the text beside it (below on
 * phones), on a blurred copy of the current photo. The photo's width is capped by the
 * screen height so the section fits one screen.
 */
export function GallerySplit({ data, items, intervalMs }: { data: HomePage['gallery']; items: GalleryItem[]; intervalMs: number }) {
  const sectionRef = useRef<HTMLElement>(null)
  const show = useSlideshow(sectionRef, items.length, intervalMs)
  const stripRef = useRef<HTMLDivElement>(null)

  // Keep the active thumbnail in view; scrolls only the strip, never the page.
  useEffect(() => {
    const strip = stripRef.current
    const thumb = strip?.children[show.index] as HTMLElement | undefined
    if (!strip || !thumb) return
    const left = thumb.offsetLeft - strip.offsetLeft
    if (left < strip.scrollLeft || left + thumb.offsetWidth > strip.scrollLeft + strip.clientWidth) {
      strip.scrollTo({ left: left - (strip.clientWidth - thumb.offsetWidth) / 2, behavior: show.reducedMotion ? 'auto' : 'smooth' })
    }
  }, [show.index, show.reducedMotion])

  return (
    <section
      ref={sectionRef}
      id="gallery"
      aria-labelledby="gallery-title"
      className="bg-brand-green-strong relative isolate flex min-h-[calc(100svh-var(--header-h))] flex-col overflow-hidden py-8 text-white sm:py-12 lg:py-14"
    >
      <div className="bg-brand-green-strong pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        {items.map((item, i) => (
          <CmsImage
            key={item.id}
            media={item.image}
            fallbackSrc={placeholder(i)}
            fallbackAlt=""
            fill
            sizes="50vw"
            className={cn(
              'scale-125 object-cover blur-3xl brightness-[0.38] saturate-150 transition-opacity duration-1000 ease-out motion-reduce:transition-none',
              i === show.index ? 'opacity-100' : 'opacity-0',
            )}
          />
        ))}
        <div className="bg-brand-green-strong/45 absolute inset-0" />
      </div>

      <div className="container-page flex flex-1 flex-col gap-6 sm:gap-8 lg:gap-10">
        <GalleryHeading data={data} tone="light" />

        <div className="flex flex-1 flex-col justify-center">
          <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-6 sm:gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
            <div className="mx-auto w-full max-w-[max(18rem,calc((100svh-var(--header-h)-29rem)*1.5))] lg:order-last lg:mr-0 lg:max-w-[calc((100svh-var(--header-h)-17rem)*1.5)]">
              <Carousel setApi={show.setApi} plugins={[show.autoplay]} opts={{ loop: items.length > 1, duration: show.reducedMotion ? 0 : 25 }} aria-label="Event photos">
                <CarouselContent>
                  {items.map((item, i) => (
                    <CarouselItem key={item.id} aria-label={`${i + 1} of ${items.length}: ${item.title}`}>
                      <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-white/10 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.5)]">
                        <CmsImage
                          media={item.image}
                          fallbackSrc={placeholder(i)}
                          fallbackAlt={item.title}
                          fill
                          sizes="(min-width: 1024px) 680px, 100vw"
                          priority={i === 0}
                          className="object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>

              {items.length > 1 && (
                <div ref={stripRef} role="group" aria-label="Choose a photo" className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {items.map((item, i) => (
                    <Button
                      key={item.id}
                      type="button"
                      variant="ghost"
                      onClick={() => show.goTo(i)}
                      aria-current={i === show.index}
                      className={cn(
                        'relative h-12 min-w-16 flex-1 basis-0 overflow-hidden rounded-md p-0 transition-opacity hover:bg-transparent sm:h-14 sm:w-21 sm:flex-none sm:basis-auto',
                        i === show.index ? 'opacity-100' : 'opacity-50 hover:opacity-90',
                      )}
                    >
                      <CmsImage media={item.image} fallbackSrc={placeholder(i)} fallbackAlt="" fill sizes="84px" className="object-cover" />
                      <span className="sr-only">Show {item.title}</span>
                      {i === show.index && (
                        <>
                          <span className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-white ring-inset" aria-hidden />
                          <span className="absolute inset-x-0 bottom-0 h-1 bg-black/30" aria-hidden>
                            <ProgressFill running={show.running} intervalMs={intervalMs} resetKey={`${show.index}-${show.running}`} className="bg-white" />
                          </span>
                        </>
                      )}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <div className="mx-auto w-full max-w-[max(18rem,calc((100svh-var(--header-h)-29rem)*1.5))] lg:mx-0 lg:max-w-md">
              <div className="flex items-center justify-between gap-4">
                <p className="font-sans text-sm font-semibold tracking-wide text-white tabular-nums" aria-hidden>
                  {String(show.index + 1).padStart(2, '0')} <span className="text-white/45">/ {String(items.length).padStart(2, '0')}</span>
                </p>
                {items.length > 1 && (
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="icon" className={iconButton} onClick={show.prev}>
                      <ChevronLeft className="size-5" />
                      <span className="sr-only">Previous photo</span>
                    </Button>
                    <Button type="button" variant="outline" size="icon" className={iconButton} onClick={show.next}>
                      <ChevronRight className="size-5" />
                      <span className="sr-only">Next photo</span>
                    </Button>
                    <Button type="button" variant="outline" size="icon" className={iconButton} onClick={show.togglePause} disabled={show.reducedMotion}>
                      {show.paused ? <Play className="size-4" /> : <Pause className="size-4" />}
                      <span className="sr-only">{show.paused ? 'Play slideshow' : 'Pause slideshow'}</span>
                    </Button>
                  </div>
                )}
              </div>

              <div aria-live={show.running ? 'off' : 'polite'} className="mt-4 grid border-t border-white/15 pt-5 lg:mt-6 lg:pt-7">
                {items.map((item, i) => {
                  const active = i === show.index
                  const meta = eventMeta(item)
                  return (
                    <div
                      key={item.id}
                      aria-hidden={!active}
                      className={cn(
                        'col-start-1 row-start-1 transition-opacity duration-500 motion-reduce:transition-none',
                        active ? 'opacity-100' : 'invisible opacity-0',
                      )}
                    >
                      <h3 className="text-2xl leading-tight font-semibold text-white sm:text-3xl lg:text-4xl">{item.title}</h3>
                      {meta && <p className="mt-2 text-sm text-white/65">{meta}</p>}
                      {item.description && (
                        <p className="mt-3 text-[0.95rem] leading-relaxed text-white/80 sm:text-base lg:mt-4 lg:text-lg">{item.description}</p>
                      )}
                      <EventLink item={item} active={active} className="mt-4" />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
