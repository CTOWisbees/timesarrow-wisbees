import { ArrowUpRight, CalendarDays } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { bookingsLinks } from '@/lib/bookings'

import { BookingsFrame } from './bookings-frame'

/**
 * Layout "Microsoft Bookings": the team's public Bookings page, embedded or as a button.
 * Bookings handles the slot, the calendar invite and reminders; bookings made here go
 * to Microsoft 365, not to the CMS. The page must be published with public access.
 */
export function BookCallMsBookings({
  url,
  display,
  linkLabel,
  note,
}: {
  url?: string | null
  display?: 'embed' | 'link' | null
  linkLabel?: string | null
  note?: string | null
}) {
  const label = linkLabel || 'Open the booking page'
  const links = bookingsLinks(url)
  if (!links) {
    return (
      <div className="bg-mist text-ink-soft rounded-2xl border border-dashed p-8 text-sm leading-relaxed">
        Online booking is not available right now. Please check back soon.
        {process.env.NODE_ENV !== 'production' && (
          <span className="mt-3 block text-xs">Editors: add the Bookings link in the CMS under Home page → Book a call → Microsoft Bookings.</span>
        )}
      </div>
    )
  }

  if (display === 'link') {
    return (
      <div className="bg-mint/50 flex flex-col items-start gap-5 rounded-2xl border p-8">
        <span className="bg-card text-primary flex size-11 items-center justify-center rounded-full border" aria-hidden>
          <CalendarDays className="size-5" />
        </span>
        {note && <p className="text-ink text-base leading-relaxed">{note}</p>}
        <Button asChild size="cta">
          <a href={links.share} target="_blank" rel="noopener noreferrer">
            {label}
            <ArrowUpRight className="size-4" aria-hidden />
          </a>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {note && <p className="text-ink-soft text-sm leading-relaxed">{note}</p>}
      <BookingsFrame embedUrl={links.embed} shareUrl={links.share} label={label} />
    </div>
  )
}
