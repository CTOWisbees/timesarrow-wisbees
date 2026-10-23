'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'

import { CmsImage } from '@/components/shared/cms-image'
import { Section } from '@/components/shared/section'
import { cn } from '@/lib/utils'

import { HighlightsHeading } from './heading'
import { type OrbitLabel, relaxLabels } from './label-layout'
import { useOrbitLoop, useStageSize } from './orbit'
import { type HighlightsData, itemImage, itemLabel } from './types'

/** Orbit rings as a share of the stage (x of its width, y of its height) and seconds per lap. */
const RINGS = [
  { rx: 27, ry: 30, period: 52 },
  { rx: 38, ry: 41, period: 74 },
  { rx: 47, ry: 48, period: 100 },
]

/**
 * Layout "solar system": the WisBees logo is the sun, each point (and its optional picture) travels
 * round one of the rings, and the inner rings move faster. Labels keep clear of each other. Hovering
 * or choosing a planet stops it and shows its text underneath. On small screens the labels become
 * numbered dots and the points are listed as chips under the stage.
 */
export function HighlightsSolar({ data }: { data: HighlightsData }) {
  const items = data.items ?? []
  const count = items.length
  const rings = count >= 5 ? 3 : count >= 2 ? 2 : 1
  const place = (i: number) => {
    const ring = i % rings
    const inRing = Math.ceil((count - ring) / rings)
    return { ring, phase: (Math.floor(i / rings) / inRing) * Math.PI * 2 + ring * 1.1 }
  }

  const stage = useRef<HTMLDivElement>(null)
  const { size, compact } = useStageSize(stage)
  const nodes = useRef<(HTMLButtonElement | null)[]>([])
  const angles = useRef<number[]>([])
  const state = useRef<OrbitLabel[]>([])
  const held = useRef<boolean[]>([])
  const [active, setActive] = useState(0)

  useOrbitLoop(
    stage,
    (_seconds, dt) => {
      const { w: W, h: H } = size.current
      if (!W || !count) return
      if (angles.current.length !== count) {
        angles.current = items.map((_, i) => place(i).phase)
        state.current = items.map(() => ({ ax: 0, ay: 0, w: 100, h: 30, side: 0, ox: 0, oy: 0 }))
      }
      items.forEach((_, i) => {
        const { ring } = place(i)
        const r = RINGS[ring]
        if (!held.current[i]) angles.current[i] += (((ring % 2 ? -1 : 1) * Math.PI * 2) / r.period) * dt
        const a = angles.current[i]
        const l = state.current[i]
        l.ax = W / 2 + (r.rx / 100) * W * Math.cos(a)
        l.ay = H / 2 + (r.ry / 100) * H * Math.sin(a)
        const el = nodes.current[i]
        if (el) {
          l.w = el.offsetWidth
          l.h = el.offsetHeight
        }
      })
      relaxLabels(state.current, { w: W, h: H }, { gap: 8, dots: false, ease: dt === 0 ? 1 : 1 - Math.exp(-dt * 9), passes: dt === 0 ? 40 : 3 })
      items.forEach((_, i) => {
        const l = state.current[i]
        const el = nodes.current[i]
        if (!el) return
        el.style.transform = `translate(${l.ax + l.ox}px, ${l.ay + l.oy}px) translate(-50%, -50%)`
        // Planets on the lower, nearer half of their ring sit in front.
        el.style.zIndex = String(10 + Math.round(((l.ay - H / 2) / H) * 10))
      })
    },
    `${compact}-${count}`,
  )

  const current = items[active] ?? items[0]
  const currentImage = current ? itemImage(current) : null
  const select = (i: number) => setActive(i)

  return (
    <Section id="why-wisbees" tone="mist" aria-labelledby="highlights-title">
      <HighlightsHeading data={data} />

      <div ref={stage} className="relative mx-auto mt-10 aspect-square w-full max-w-5xl sm:aspect-[16/10]">
        <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {RINGS.slice(0, rings).map((r) => (
            <ellipse key={r.rx} cx="50" cy="50" rx={r.rx} ry={r.ry} fill="none" stroke="var(--brand-green)" strokeOpacity="0.28" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>

        {/* The sun */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 z-[5] flex h-16 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[50%] bg-white shadow-[0_0_0_8px_rgb(242_181_58/0.18),0_0_44px_rgb(242_181_58/0.5)] sm:h-24 sm:w-44">
          <Image src="/brand/wisbees-logo.png" alt="WisBees" width={297} height={109} className="h-auto w-20 sm:w-32" />
        </div>

        {items.map((item, i) => {
          const image = itemImage(item)
          const on = i === active
          return (
            <button
              key={item.id ?? item.title}
              ref={(el) => {
                nodes.current[i] = el
              }}
              type="button"
              aria-pressed={on}
              aria-label={compact ? item.title : undefined}
              onPointerEnter={() => ((held.current[i] = true), select(i))}
              onPointerLeave={() => (held.current[i] = false)}
              onFocus={() => ((held.current[i] = true), select(i))}
              onBlur={() => (held.current[i] = false)}
              onClick={() => select(i)}
              className="absolute top-0 left-0 flex flex-col items-center gap-1.5 focus-visible:outline-none"
            >
              {compact ? (
                <span
                  className={cn(
                    'flex size-8 items-center justify-center rounded-full border text-sm font-semibold tabular-nums shadow-md transition-colors',
                    on ? 'bg-primary border-primary text-white' : 'bg-card text-ink border-primary/30',
                  )}
                >
                  {i + 1}
                </span>
              ) : (
                <>
                  {image && (
                    <span className={cn('relative size-14 overflow-hidden rounded-full ring-2 transition-shadow lg:size-16', on ? 'ring-primary' : 'ring-white')}>
                      <CmsImage media={image} fallbackSrc="/placeholders/gallery-1.svg" fallbackAlt="" fill sizes="64px" className="object-cover" />
                    </span>
                  )}
                  <span
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap shadow-md transition-colors',
                      on ? 'bg-primary border-primary text-white' : 'bg-card text-ink border-primary/25',
                    )}
                  >
                    {itemLabel(item)}
                  </span>
                </>
              )}
            </button>
          )
        })}
      </div>

      {compact && (
        <ul className="mt-6 flex flex-wrap justify-center gap-2">
          {items.map((item, i) => (
            <li key={item.id ?? item.title}>
              <button
                type="button"
                onClick={() => select(i)}
                aria-pressed={i === active}
                className={cn('rounded-full border px-3 py-1.5 text-sm font-medium transition-colors', i === active ? 'bg-primary border-primary text-white' : 'bg-card text-ink border-primary/30')}
              >
                <span className="tabular-nums">{i + 1}.</span> {itemLabel(item)}
              </button>
            </li>
          ))}
        </ul>
      )}

      {current && (
        <div aria-live="polite" className="bg-card mx-auto mt-6 flex max-w-3xl flex-col items-center gap-4 rounded-2xl border p-6 text-center shadow-[0_1px_2px_rgb(16_34_27/0.04)] sm:flex-row sm:text-left">
          {currentImage && (
            <span className="relative size-20 shrink-0 overflow-hidden rounded-xl">
              <CmsImage media={currentImage} fallbackSrc="/placeholders/gallery-1.svg" fallbackAlt="" fill sizes="80px" className="object-cover" />
            </span>
          )}
          <div>
            <h3 className="text-xl font-semibold md:text-2xl">{current.title}</h3>
            <p className="text-ink-soft mt-2 leading-relaxed">{current.description}</p>
          </div>
        </div>
      )}

      {/* The same content for screen readers. */}
      <ul className="sr-only">
        {items.map((item) => (
          <li key={item.id ?? item.title}>
            {item.title}: {item.description}
          </li>
        ))}
      </ul>
    </Section>
  )
}
