'use client'

import { ArrowUpRight, CalendarDays, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'

/** How long to wait before offering the new-tab link more prominently. */
const SLOW_MS = 8000

/**
 * The Bookings page in a frame, with a spinner until it has loaded. A browser cannot tell
 * whether a frame was refused, so if it has not loaded after a few seconds, or the visitor
 * needs a different view, the "open in a new tab" button is always there.
 */
export function BookingsFrame({ embedUrl, shareUrl, label }: { embedUrl: string; shareUrl: string; label: string }) {
  const [loaded, setLoaded] = useState(false)
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), SLOW_MS)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-4">
      <div className="bg-mist relative h-[min(44rem,78svh)] overflow-hidden rounded-2xl border">
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <span className="bg-card text-primary flex size-12 items-center justify-center rounded-full border" aria-hidden>
              {slow ? <CalendarDays className="size-5" /> : <Loader2 className="size-5 animate-spin" />}
            </span>
            <p className="text-ink-soft text-sm">{slow ? 'The calendar is taking a while to load.' : 'Loading the calendar…'}</p>
            {slow && (
              <Button asChild size="cta">
                <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                  {label}
                  <ArrowUpRight className="size-4" aria-hidden />
                </a>
              </Button>
            )}
          </div>
        )}
        <iframe
          src={embedUrl}
          title="Book a call with WisBees (Microsoft Bookings)"
          loading="lazy"
          onLoad={() => setLoaded(true)}
          referrerPolicy="strict-origin-when-cross-origin"
          className="bg-card relative size-full"
        />
      </div>
      <p className="text-muted-foreground text-sm">
        Prefer a bigger view?{' '}
        <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="text-primary inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline">
          {label}
          <ArrowUpRight className="size-4" aria-hidden />
          <span className="sr-only"> (opens Microsoft Bookings in a new tab)</span>
        </a>
      </p>
    </div>
  )
}
