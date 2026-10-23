import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { linkProps } from '@/lib/links'
import { cn } from '@/lib/utils'

import type { HighlightsData } from './types'

/** Section title, subtitle and button, shared by every layout. */
export function HighlightsHeading({ data, tone = 'dark' }: { data: HighlightsData; tone?: 'dark' | 'light' }) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-4xl">
        <h2 id="highlights-title" className={cn('text-4xl leading-tight font-semibold tracking-tight md:text-5xl', tone === 'light' && 'text-white')}>
          {data.title}
        </h2>
        {data.subtitle && <p className={cn('mt-4 text-lg', tone === 'light' ? 'text-white/75' : 'text-ink-soft')}>{data.subtitle}</p>}
      </div>
      {data.cta?.href && (
        <Button asChild size="cta" className="self-start md:self-auto">
          <Link href={data.cta.href} {...linkProps(data.cta.href)}>
            {data.cta.label}
          </Link>
        </Button>
      )}
    </div>
  )
}
