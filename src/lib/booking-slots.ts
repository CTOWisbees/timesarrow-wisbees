/**
 * Call slots for the "Talk to an expert" form. Calls happen in Indian time (IST), Monday to
 * Saturday, at the times set in the CMS. What is offered depends on the current moment, so a
 * visitor never sees a day with nothing left, or a time that has already passed or is too soon.
 * The server runs the same checks before saving, so the browser's clock is never trusted.
 */
export const IST = 'Asia/Kolkata'
/** A slot must start at least this long from now. */
export const LEAD_MINUTES = 60
/** How many days are offered. */
export const DAYS_OFFERED = 5
/** Furthest ahead the server accepts a slot. */
export const MAX_DAYS_AHEAD = 30

export type SlotDay = { date: string; weekday: string; day: string; month: string; label: string }
export type SlotTime = { label: string; available: boolean }

const DATE = /^\d{4}-\d{2}-\d{2}$/

/** "10:00 AM", "3:00 pm" or "15:00" as minutes after midnight. */
export function parseSlotTime(label: string): number | null {
  const m = label.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i)
  if (!m) return null
  let hours = Number(m[1])
  const minutes = Number(m[2])
  const meridiem = m[3]?.toLowerCase()
  if (minutes > 59) return null
  if (meridiem) {
    if (hours < 1 || hours > 12) return null
    hours = (hours % 12) + (meridiem === 'pm' ? 12 : 0)
  } else if (hours > 23) return null
  return hours * 60 + minutes
}

/** The current calendar date (YYYY-MM-DD) and minutes after midnight in IST. */
export function istNow(now: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: IST, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  )
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) }
}

const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** 0 = Sunday. Works on the calendar date alone, so it never shifts with the visitor's timezone. */
const weekdayOf = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay()

/** The instant a slot starts, read as Indian time. */
export function slotInstant(date: string, label: string): Date | null {
  const minutes = parseSlotTime(label)
  if (!DATE.test(date) || minutes === null || Number.isNaN(Date.parse(`${date}T12:00:00Z`))) return null
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0')
  const mm = String(minutes % 60).padStart(2, '0')
  return new Date(`${date}T${hh}:${mm}:00+05:30`)
}

/** Whether a day and time can be booked right now. */
export function isSlotAvailable(date: string, label: string, now: Date): boolean {
  const at = slotInstant(date, label)
  if (!at || weekdayOf(date) === 0) return false
  const from = now.getTime() + LEAD_MINUTES * 60_000
  return at.getTime() >= from && at.getTime() <= now.getTime() + MAX_DAYS_AHEAD * 86_400_000
}

/** Every configured time on a day, each marked bookable or not. */
export function slotTimes(times: string[], date: string, now: Date): SlotTime[] {
  return times.map((label) => ({ label, available: isSlotAvailable(date, label, now) }))
}

const dayLabel = new Intl.DateTimeFormat('en-IN', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' })

/** The next days with at least one bookable time, starting today if today still has one. */
export function upcomingSlotDays(times: string[], now: Date, count = DAYS_OFFERED): SlotDay[] {
  const days: SlotDay[] = []
  const start = istNow(now).date
  for (let i = 0; i < 40 && days.length < count; i++) {
    const date = addDays(start, i)
    if (weekdayOf(date) === 0 || !times.some((t) => isSlotAvailable(date, t, now))) continue
    const at = new Date(`${date}T12:00:00Z`)
    const parts = Object.fromEntries(dayLabel.formatToParts(at).map((p) => [p.type, p.value]))
    days.push({ date, weekday: parts.weekday, day: parts.day, month: parts.month, label: `${parts.weekday} ${parts.day} ${parts.month}` })
  }
  return days
}
