import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

import { linkProps } from '@/lib/links'
import { cn } from '@/lib/utils'
import type { GalleryItem, HomePage } from '@/payload-types'

export const placeholder = (i: number) => `/placeholders/gallery-${(i % 5) + 1}.svg`

const dateFormat = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
})

export const eventMeta = (item: GalleryItem) =>
  [item.date ? dateFormat.format(new Date(item.date)) : null, item.location].filter(Boolean).join(' · ')

/** Section title and the "See all events" link, shared by every variant. */
export function GalleryHeading({ data, tone }: { data: HomePage['gallery']; tone: 'light' | 'dark' }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2
        id="gallery-title"
        className={cn('text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl', tone === 'light' ? 'text-white' : 'text-ink')}
      >
        {data.title}
      </h2>
      {data.cta?.href && (
        <Link
          href={data.cta.href}
          {...linkProps(data.cta.href)}
          className={cn(
            'shrink-0 text-sm font-semibold underline-offset-4 hover:underline',
            tone === 'light' ? 'text-white' : 'text-primary',
          )}
        >
          {data.cta.label}
        </Link>
      )}
    </div>
  )
}

/** "View event" link when the item has one. */
export function EventLink({ item, active = true, className }: { item: GalleryItem; active?: boolean; className?: string }) {
  if (!item.href) return null
  return (
    <Link
      href={item.href}
      {...linkProps(item.href)}
      tabIndex={active ? 0 : -1}
      className={cn('text-mint inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline', className)}
    >
      View event <ArrowUpRight className="size-4" aria-hidden />
      <span className="sr-only">: {item.title}</span>
    </Link>
  )
}

/** Fills over one interval on the active thumbnail or dot while autoplay runs. */
export function ProgressFill({ running, intervalMs, resetKey, className }: { running: boolean; intervalMs: number; resetKey: string; className?: string }) {
  return (
    <span
      key={resetKey}
      aria-hidden
      className={cn('block h-full origin-left', className)}
      style={{
        transform: running ? undefined : 'scaleX(0)',
        animation: running ? `gallery-progress ${intervalMs}ms linear forwards` : undefined,
      }}
    />
  )
}
