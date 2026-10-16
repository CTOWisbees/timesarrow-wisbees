import { ArrowUpRight, CalendarDays } from 'lucide-react'

import { Button } from '@/components/ui/button'

/** Only https Microsoft booking pages are framed or linked. */
const isBookingsUrl = (url?: string | null) => {
  try {
    const u = new URL(url ?? '')
    return u.protocol === 'https:' && /(^|\.)office(365)?\.com$/.test(u.hostname)
  } catch {
    return false
  }
}

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
  if (!isBookingsUrl(url)) {
    return (
      <div className="bg-mist text-ink-soft rounded-2xl border border-dashed p-8 text-sm leading-relaxed">
        The Microsoft Bookings page is not set yet. Add its link in the CMS under Home page → Book a call → Microsoft Bookings.
      </div>
    )
  }

  const external = (
    <a href={url!} target="_blank" rel="noopener noreferrer" className="text-primary inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline">
      {label}
      <ArrowUpRight className="size-4" aria-hidden />
      <span className="sr-only"> (opens Microsoft Bookings in a new tab)</span>
    </a>
  )

  if (display === 'link') {
    return (
      <div className="bg-mint/50 flex flex-col items-start gap-5 rounded-2xl border p-8">
        <span className="bg-card text-primary flex size-11 items-center justify-center rounded-full border" aria-hidden>
          <CalendarDays className="size-5" />
        </span>
        {note && <p className="text-ink text-base leading-relaxed">{note}</p>}
        <Button asChild size="cta">
          <a href={url!} target="_blank" rel="noopener noreferrer">
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
      <iframe
        src={url!}
        title="Book a call with WisBees (Microsoft Bookings)"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        className="bg-card h-[min(44rem,78svh)] w-full rounded-2xl border"
      />
      <p className="text-muted-foreground text-sm">Not loading? {external}</p>
    </div>
  )
}
