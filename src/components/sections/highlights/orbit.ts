'use client'

import { type RefObject, useEffect, useRef, useState } from 'react'

/** Below this stage width the labels turn into numbered dots (and the points are listed under the stage). */
export const COMPACT_BELOW = 480

/**
 * Drives an orbit animation: calls `tick(seconds, dt)` every frame while the section is on screen.
 * Off screen the loop stops, and with reduced motion it draws still frames only (dt = 0) when `redraw`
 * changes. Positions are written straight to the elements, so there is no React render per frame.
 */
export function useOrbitLoop(rootRef: RefObject<HTMLElement | null>, tick: (seconds: number, dt: number) => void, redraw?: unknown) {
  const latest = useRef(tick)
  useEffect(() => {
    latest.current = tick
  })

  useEffect(() => {
    latest.current(0, 0)
  }, [redraw])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let raf = 0
    let last = 0
    let seconds = 0
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      seconds += dt
      latest.current(seconds, dt)
      raf = requestAnimationFrame(frame)
    }
    const observer = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(raf)
      if (entry.isIntersecting) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    })
    observer.observe(root)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [rootRef])
}

/** The stage's size in pixels (a ref for the animation loop, and state `dims` for drawing) and whether it is small enough to need the compact labels. */
export function useStageSize(stage: RefObject<HTMLElement | null>) {
  const size = useRef({ w: 0, h: 0 })
  const [compact, setCompact] = useState(false)
  const [dims, setDims] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = stage.current
    if (!el) return
    const measure = () => {
      size.current = { w: el.clientWidth, h: el.clientHeight }
      setDims(size.current)
      setCompact(el.clientWidth < COMPACT_BELOW)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [stage])

  return { size, compact, dims }
}
