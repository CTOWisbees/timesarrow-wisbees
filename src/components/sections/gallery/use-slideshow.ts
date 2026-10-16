'use client'

import Autoplay from 'embla-carousel-autoplay'
import { type RefObject, useEffect, useState } from 'react'

import type { CarouselApi } from '@/components/ui/carousel'

/**
 * Shared slideshow behaviour for the gallery variants, on top of an Embla carousel:
 * advances every `intervalMs` and loops, runs only while the section (`rootRef`) is on screen,
 * pauses on hover and keyboard focus, has a pause toggle (WCAG 2.2.2) and stays still
 * for visitors who prefer reduced motion.
 */
export function useSlideshow(rootRef: RefObject<HTMLElement | null>, count: number, intervalMs: number) {
  const [api, setApi] = useState<CarouselApi>()
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const [inView, setInView] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [autoplay] = useState(() =>
    Autoplay({ delay: intervalMs, playOnInit: false, stopOnInteraction: false, stopOnMouseEnter: true, stopOnFocusIn: true }),
  )

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
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [rootRef])

  useEffect(() => {
    if (!api) return
    const onSelect = () => setIndex(api.selectedScrollSnap())
    const onPlay = () => setPlaying(true)
    const onStop = () => setPlaying(false)
    onSelect()
    api.on('select', onSelect).on('autoplay:play', onPlay).on('autoplay:stop', onStop)
    return () => {
      api.off('select', onSelect).off('autoplay:play', onPlay).off('autoplay:stop', onStop)
    }
  }, [api])

  useEffect(() => {
    if (count < 2) return
    if (inView && !userPaused && !reducedMotion) autoplay.play()
    else autoplay.stop()
  }, [autoplay, count, inView, userPaused, reducedMotion])

  const paused = userPaused || reducedMotion
  return {
    setApi,
    autoplay,
    index,
    count,
    reducedMotion,
    /** Timer actually running (drives the progress bar). */
    running: playing && !paused,
    paused,
    togglePause: () => setUserPaused((p) => !p),
    prev: () => api?.scrollPrev(),
    next: () => api?.scrollNext(),
    goTo: (i: number) => api?.scrollTo(i),
  }
}

export type Slideshow = ReturnType<typeof useSlideshow>
