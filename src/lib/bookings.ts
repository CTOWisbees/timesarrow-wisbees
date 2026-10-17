/**
 * Microsoft Bookings links. Bookings gives two addresses for the same page:
 *   share  https://outlook.office365.com/book/<Page>@<domain>/
 *   embed  https://outlook.office365.com/owa/calendar/<Page>@<domain>/bookings/
 * Microsoft's newer share links live on bookings.cloud.microsoft/book/<Page>@<domain>/. Only the
 * classic embed address is meant to be framed, so a share link pasted into the CMS is converted
 * (extra query parameters are dropped). Only https pages on office.com, office365.com and
 * cloud.microsoft are ever framed or linked.
 */
const HOST = /(^|\.)(office(365)?\.com|cloud\.microsoft)$/

export type BookingsLinks = { share: string; embed: string }

export function bookingsLinks(raw?: string | null): BookingsLinks | null {
  let url: URL
  try {
    url = new URL((raw ?? '').trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || !HOST.test(url.hostname)) return null

  const book = url.pathname.match(/^\/book\/([^/]+@[^/]+)\/?/i)
  const owa = url.pathname.match(/^\/owa\/calendar\/([^/]+@[^/]+)\/bookings\/?/i)
  const page = book?.[1] ?? owa?.[1]
  if (!page) return null

  return {
    share: `${url.origin}/book/${page}/`,
    embed: `${/cloud\.microsoft$/.test(url.hostname) ? 'https://outlook.office365.com' : url.origin}/owa/calendar/${page}/bookings/`,
  }
}

/** CMS field check: empty is allowed (the layout then shows a short "not available" note). */
export const validateBookingsUrl = (value?: string | null) =>
  !value || bookingsLinks(value)
    ? true
    : 'Paste the booking page link from Bookings → Booking page → Share (https://bookings.cloud.microsoft/book/… or https://outlook.office365.com/book/…), or its embed address (…/owa/calendar/…/bookings/).'
