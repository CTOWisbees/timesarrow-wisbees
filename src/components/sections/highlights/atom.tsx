'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState } from 'react'

import { CmsImage } from '@/components/shared/cms-image'
import { Button } from '@/components/ui/button'
import { linkProps } from '@/lib/links'
import { cn } from '@/lib/utils'

import { type OrbitLabel, relaxLabels } from './label-layout'
import { useOrbitLoop, useStageSize } from './orbit'
import { firstSentence, type HighlightsData, itemImage, itemLabel } from './types'

/** Each ring is drawn as a flat ellipse (RY of RX), tilted, then stretched to fill the stage, so a wide stage is filled edge to edge. */
const RY = 0.34
/** How much of the half-width and half-height the rings use; the rest is room for the labels. */
const FILL = 0.86

/**
 * Layout "atom". Two columns on a wide screen, filling the viewport: the section text on the left,
 * the atom on the right. The WisBees mark is the nucleus and every point gets its own tilted electron
 * ring, so adding a point in the CMS adds a ring. Choosing a point (click or tap) swaps the left column
 * to that point's text; on small screens the text appears under the atom.
 * Labels ride beside their electrons and push each other apart, so they never pile up.
 */
export function HighlightsAtom({ data }: { data: HighlightsData }) {
  const items = data.items ?? []
  const count = items.length
  const [selected, setSelected] = useState<number | null>(null)
  const stage = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const { size, compact, dims } = useStageSize(stage)

  const dots = useRef<(HTMLSpanElement | null)[]>([])
  const tags = useRef<(HTMLDivElement | null)[]>([])
  const lines = useRef<(SVGLineElement | null)[]>([])
  const angles = useRef<number[]>([])
  const state = useRef<OrbitLabel[]>([])
  const held = useRef<boolean[]>([])

  useOrbitLoop(
    stage,
    (_seconds, dt) => {
      const { w: W, h: H } = size.current
      if (!W || !count) return
      if (angles.current.length !== count) {
        angles.current = items.map((_, i) => (i / count) * Math.PI * 2 + i * 0.6)
        state.current = items.map(() => ({ ax: 0, ay: 0, w: 100, h: 30, side: 1, ox: 0, oy: 0 }))
      }
      items.forEach((_, i) => {
        const dir = i % 2 ? -1 : 1
        if (!held.current[i]) angles.current[i] += ((dir * Math.PI * 2) / (22 + i * 3)) * dt
        const a = angles.current[i]
        const tilt = (i * Math.PI) / count
        const px = Math.cos(a)
        const py = RY * Math.sin(a)
        const l = state.current[i]
        l.ax = W / 2 + ((W / 2) * FILL) * (px * Math.cos(tilt) - py * Math.sin(tilt))
        l.ay = H / 2 + ((H / 2) * FILL) * (px * Math.sin(tilt) + py * Math.cos(tilt))
        const tag = tags.current[i]
        if (tag) {
          l.w = tag.offsetWidth
          l.h = tag.offsetHeight
        }
        l.side = compact ? 0 : l.ax > W / 2 ? 1 : -1
      })
      relaxLabels(state.current, { w: W, h: H }, { gap: 8, ease: dt === 0 ? 1 : 1 - Math.exp(-dt * 9), passes: dt === 0 ? 40 : 3 })
      items.forEach((_, i) => {
        const l = state.current[i]
        const dot = dots.current[i]
        const tag = tags.current[i]
        const line = lines.current[i]
        const cx = l.ax + l.ox
        const cy = l.ay + l.oy
        if (dot) dot.style.transform = `translate(${l.ax}px, ${l.ay}px) translate(-50%, -50%)`
        if (tag) {
          tag.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`
          // Which way the hover card opens, so it stays inside the stage.
          tag.dataset.v = cy > H / 2 ? 'above' : 'below'
          tag.dataset.edge = cx < W * 0.28 ? 'start' : cx > W * 0.72 ? 'end' : 'mid'
        }
        if (line) {
          line.setAttribute('x1', String(l.ax))
          line.setAttribute('y1', String(l.ay))
          line.setAttribute('x2', String(cx))
          line.setAttribute('y2', String(cy))
        }
      })
    },
    `${compact}-${count}`,
  )

  const choose = (i: number | null) => {
    setSelected(i)
    if (i !== null && window.matchMedia('(max-width: 1023px)').matches) {
      setTimeout(() => panel.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 50)
    }
  }
  const current = selected !== null ? items[selected] : null
  const currentImage = current ? itemImage(current) : null

  return (
    <section id="why-wisbees" aria-labelledby="highlights-title" className="bg-card overflow-hidden py-12 sm:py-16 lg:flex lg:min-h-[calc(100svh-var(--header-h))] lg:items-stretch lg:py-0">
      <div className="mx-auto grid w-full max-w-[110rem] items-center gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-6 lg:px-10 xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
        {/* Left: the section text, or the chosen point */}
        <div ref={panel} className={cn('min-w-0 lg:order-1', current ? 'order-2' : 'order-1')}>
          {current ? (
            <div key={selected} className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-4 motion-safe:duration-300">
              <button type="button" onClick={() => choose(null)} className="text-primary hover:text-brand-green-strong inline-flex items-center gap-1.5 text-sm font-semibold">
                <ArrowLeft className="size-4" aria-hidden />
                {data.title}
              </button>
              {currentImage && (
                <span className="relative mt-5 block aspect-[16/10] w-full overflow-hidden rounded-2xl">
                  <CmsImage media={currentImage} fallbackSrc="/placeholders/gallery-1.svg" fallbackAlt="" fill sizes="(min-width: 1024px) 26rem, 100vw" className="object-cover" />
                </span>
              )}
              <h3 className="mt-5 text-3xl leading-tight font-semibold tracking-tight md:text-4xl" aria-live="polite">
                {current.title}
              </h3>
              <p className="text-ink-soft mt-4 text-lg leading-relaxed">{current.description}</p>
              <div className="mt-7 flex items-center gap-3">
                <Button variant="brandOutline" onClick={() => choose(((selected ?? 0) + 1) % count)}>
                  Next point
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
                <span className="text-muted-foreground text-sm tabular-nums">
                  {(selected ?? 0) + 1} / {count}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <h2 id="highlights-title" className="text-4xl leading-tight font-semibold tracking-tight md:text-5xl">
                {data.title}
              </h2>
              {data.subtitle && <p className="text-ink-soft mt-4 text-lg">{data.subtitle}</p>}
              <p className="text-ink-soft mt-4 text-base leading-relaxed">Advice that stays on your side: you pay a fixed fee, never a commission, and every recommendation comes with its reasoning.</p>
              <p className="text-muted-foreground mt-6 text-sm">Select a point on the atom to read more.</p>
              {data.cta?.href && (
                <Button asChild size="cta" className="mt-7">
                  <Link href={data.cta.href} {...linkProps(data.cta.href)}>
                    {data.cta.label}
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Right: the atom */}
        <div className={cn('min-w-0 lg:order-2', current ? 'order-1' : 'order-2')}>
          <div ref={stage} className="relative mx-auto aspect-square w-full max-w-[34rem] lg:aspect-auto lg:h-[calc(100svh-var(--header-h))] lg:min-h-[34rem] lg:max-w-none">
            <svg className="absolute inset-0 size-full" aria-hidden>
              {items.map((item, i) => (
                <ellipse
                  key={item.id ?? item.title}
                  cx="0"
                  cy="0"
                  rx="1"
                  ry={RY}
                  transform={`translate(${dims.w / 2} ${dims.h / 2}) scale(${(dims.w / 2) * FILL} ${(dims.h / 2) * FILL}) rotate(${(i * 180) / count})`}
                  fill="none"
                  stroke="var(--brand-green)"
                  strokeOpacity={selected === i ? 0.75 : 0.35}
                  strokeWidth="1.25"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>

            {/* Leader lines between each electron and its label (kept in pixels, updated every frame). */}
            <svg className="pointer-events-none absolute inset-0 size-full" aria-hidden>
              {items.map((item, i) => (
                <line
                  key={item.id ?? item.title}
                  ref={(el) => {
                    lines.current[i] = el
                  }}
                  stroke="var(--brand-green)"
                  strokeOpacity="0.45"
                  strokeWidth="1"
                />
              ))}
            </svg>

            {/* Nucleus */}
            <div className="pointer-events-none absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center sm:size-24 lg:size-32">
              <span className="bg-primary/15 absolute inset-0 rounded-full motion-safe:animate-ping [animation-duration:3s]" aria-hidden />
              <span className="bg-mint ring-primary/30 relative flex size-full items-center justify-center rounded-full shadow-[0_0_40px_rgb(15_107_76/0.3)] ring-2">
                <Image src="/brand/wisbees-mark.png" alt="WisBees" width={64} height={64} className="size-9 sm:size-14 lg:size-20" />
              </span>
            </div>

            {items.map((item, i) => (
              <span
                key={`dot-${item.id ?? item.title}`}
                ref={(el) => {
                  dots.current[i] = el
                }}
                aria-hidden
                className={cn(
                  'bg-primary pointer-events-none absolute top-0 left-0 z-10 size-3.5 rounded-full shadow-[0_0_0_4px_rgb(15_107_76/0.18),0_0_16px_rgb(15_107_76/0.6)]',
                  compact && 'hidden',
                  selected === i && 'scale-125',
                )}
              />
            ))}

            {items.map((item, i) => {
              const image = itemImage(item)
              const on = selected === i
              return (
                <div
                  key={`tag-${item.id ?? item.title}`}
                  ref={(el) => {
                    tags.current[i] = el
                  }}
                  data-v="below"
                  data-edge="mid"
                  className="group/e absolute top-0 left-0 z-20 hover:z-40 focus-within:z-40"
                >
                  <button
                    type="button"
                    aria-pressed={on}
                    aria-label={compact ? item.title : undefined}
                    onClick={() => choose(on ? null : i)}
                    onPointerEnter={() => (held.current[i] = true)}
                    onPointerLeave={() => (held.current[i] = false)}
                    onFocus={() => (held.current[i] = true)}
                    onBlur={() => (held.current[i] = false)}
                    className={cn(
                      'focus-visible:ring-ring/50 border font-medium shadow-md transition-colors focus-visible:ring-3 focus-visible:outline-none',
                      compact
                        ? 'flex size-8 items-center justify-center rounded-full text-sm tabular-nums'
                        : 'max-w-[15rem] rounded-2xl px-4 py-2 text-left text-[0.8rem] sm:text-sm',
                      on ? 'bg-primary border-primary text-white' : 'bg-card text-ink border-primary/30 hover:border-primary',
                    )}
                  >
                    {compact ? (
                      i + 1
                    ) : (
                      <>
                        <span className="block font-semibold whitespace-nowrap">{itemLabel(item)}</span>
                        <span className={cn('mt-0.5 line-clamp-2 text-[0.72rem] leading-snug font-normal', on ? 'text-white/85' : 'text-ink-soft')}>{firstSentence(item.description)}</span>
                      </>
                    )}
                  </button>

                  {/* Hover card (pointer devices, roomy stages only) */}
                  {!compact && (
                    <div
                      role="tooltip"
                      className="bg-card border-primary/20 pointer-events-none absolute z-40 hidden w-60 rounded-xl border p-4 text-left opacity-0 shadow-[0_12px_32px_rgb(16_34_27/0.18)] transition-opacity duration-150 group-hover/e:opacity-100 group-data-[v=above]/e:bottom-full group-data-[v=above]/e:mb-3 group-data-[v=below]/e:top-full group-data-[v=below]/e:mt-3 group-data-[edge=end]/e:right-0 group-data-[edge=mid]/e:left-1/2 group-data-[edge=mid]/e:-translate-x-1/2 group-data-[edge=start]/e:left-0 [@media(hover:hover)]:block"
                    >
                      {image && (
                        <span className="relative mb-3 block h-24 w-full overflow-hidden rounded-lg">
                          <CmsImage media={image} fallbackSrc="/placeholders/gallery-1.svg" fallbackAlt="" fill sizes="240px" className="object-cover" />
                        </span>
                      )}
                      <p className="text-ink text-sm font-semibold">{item.title}</p>
                      <p className="text-ink-soft mt-1.5 text-[0.8rem] leading-relaxed">{item.description}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Small screens: every point is also a tappable chip under the atom. */}
          {compact && (
            <ul className="mt-6 flex flex-wrap justify-center gap-2">
              {items.map((item, i) => (
                <li key={item.id ?? item.title}>
                  <button
                    type="button"
                    onClick={() => choose(selected === i ? null : i)}
                    aria-pressed={selected === i}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                      selected === i ? 'bg-primary border-primary text-white' : 'bg-card text-ink border-primary/30',
                    )}
                  >
                    <span className="tabular-nums">{i + 1}.</span> {itemLabel(item)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* The same content for screen readers. */}
      <ul className="sr-only">
        {items.map((item) => (
          <li key={item.id ?? item.title}>
            {item.title}: {item.description}
          </li>
        ))}
      </ul>
    </section>
  )
}
