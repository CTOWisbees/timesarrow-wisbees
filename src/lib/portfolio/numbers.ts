/**
 * Parsing for numbers and dates as they appear in statements and broker exports:
 * rupee signs, commas in lakh grouping (12,34,567.89), brackets for negatives,
 * trailing minus, and DD-MMM-YYYY / DD/MM/YYYY / ISO dates.
 */

export function parseAmount(raw: unknown): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null
  if (typeof raw !== 'string') return null
  let s = raw.trim()
  if (!s || /^[-–—]$/.test(s) || /^n\/?a$/i.test(s)) return null
  let negative = false
  if (/^\(.*\)$/.test(s)) {
    negative = true
    s = s.slice(1, -1)
  }
  if (s.endsWith('-')) {
    negative = true
    s = s.slice(0, -1)
  }
  s = s.replace(/(₹|rs\.?|inr)/gi, '').replace(/[,\s ]/g, '')
  if (s.startsWith('-')) {
    negative = !negative
    s = s.slice(1)
  }
  if (s.startsWith('+')) s = s.slice(1)
  if (!/^\d*\.?\d+$/.test(s)) return null
  const n = Number(s)
  return negative ? -n : n
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
}

/** Returns an ISO date string (YYYY-MM-DD) or null. Day-first for slashed dates (Indian convention). */
export function parseDate(raw: unknown): string | null {
  if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? null : raw.toISOString().slice(0, 10)
  if (typeof raw !== 'string') return null
  const s = raw.trim()
  let y: number, m: number, d: number
  let match: RegExpMatchArray | null
  if ((match = s.match(/^(\d{4})-(\d{2})-(\d{2})/))) {
    ;[y, m, d] = [Number(match[1]), Number(match[2]) - 1, Number(match[3])]
  } else if ((match = s.match(/^(\d{1,2})[-\s/]([A-Za-z]{3,4})[-\s/,]*(\d{2}|\d{4})$/))) {
    const month = MONTHS[match[2].toLowerCase()]
    if (month === undefined) return null
    ;[d, m, y] = [Number(match[1]), month, Number(match[3])]
  } else if ((match = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/))) {
    ;[d, m, y] = [Number(match[1]), Number(match[2]) - 1, Number(match[3])]
  } else return null
  if (y < 100) y += 2000
  const date = new Date(Date.UTC(y, m, d))
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m || date.getUTCDate() !== d) return null
  return date.toISOString().slice(0, 10)
}

/** Lower-case, strip punctuation and filler words so fund and company names compare well. */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(ltd|limited|the|fund|scheme|plan|option|mutual)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
