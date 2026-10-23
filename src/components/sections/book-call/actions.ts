'use server'

import { createHash, randomBytes } from 'crypto'
import { headers } from 'next/headers'
import type { z } from 'zod'

import { isSlotAvailable, slotInstant } from '@/lib/booking-slots'
import { getPayloadClient } from '@/lib/payload'

import {
  type BookingInput,
  type BookingResult,
  bookingSchema,
  type ContactInput,
  type ContactResult,
  contactSchema,
  type SlotInput,
  type SlotResult,
  slotSchema,
} from './schema'

const MAX_PER_IP_PER_HOUR = 5
/** How long after step 1 the visitor can still attach a preferred slot. */
const SLOT_WINDOW_MS = 2 * 60 * 60 * 1000

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')
const hashIp = (ip: string) => sha256(`${ip}:${process.env.PAYLOAD_SECRET}`).slice(0, 32)

const fieldErrorsFrom = (error: z.ZodError) => {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) fieldErrors[String(issue.path[0])] ??= issue.message
  return fieldErrors
}

const SERVER_ERROR = 'Something went wrong on our side. Please try again in a minute.'

/**
 * Step 1: stores the call request straight away. The consent wording is read from
 * the published home page on the server, so the record reflects exactly what the
 * visitor was shown. Returns a one-time token that lets the same visitor add a
 * preferred slot in step 2; only its hash is stored.
 */
export async function submitContact(input: ContactInput): Promise<ContactResult> {
  return createBooking(contactSchema, input, true)
}

/**
 * Calendar booking: contact details and the chosen day and time, saved together. The slot is
 * re-checked on the server against the CMS times and the current Indian time, so a stale or
 * tampered request cannot book a time that has passed.
 */
export async function submitBooking(input: BookingInput): Promise<BookingResult> {
  const result = await createBooking(bookingSchema, input, false)
  return result.ok ? { ok: true } : result
}

async function createBooking(
  schema: typeof contactSchema | typeof bookingSchema,
  input: ContactInput | BookingInput,
  withSlotToken: boolean,
): Promise<ContactResult> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    // A filled honeypot gets a quiet fake success so bots learn nothing.
    if (parsed.error.issues.some((i) => i.path[0] === 'website')) {
      return { ok: true, token: randomBytes(32).toString('hex') }
    }
    return { ok: false, error: 'Please check the highlighted fields.', fieldErrors: fieldErrorsFrom(parsed.error) }
  }
  const data = parsed.data
  const { preferredDay, preferredDate, preferredTime } = data as { preferredDay?: string; preferredDate?: string; preferredTime?: string }
  let slot = preferredDay && preferredTime ? `${preferredDay}, ${preferredTime}` : undefined
  let slotAt: Date | null = null

  try {
    const payload = await getPayloadClient()
    const requestHeaders = await headers()
    const ip =
      requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || requestHeaders.get('x-real-ip') || 'unknown'
    const ipHash = hashIp(ip)

    const { totalDocs } = await payload.count({
      collection: 'bookings',
      where: {
        and: [{ ipHash: { equals: ipHash } }, { createdAt: { greater_than: new Date(Date.now() - 3_600_000).toISOString() } }],
      },
    })
    if (totalDocs >= MAX_PER_IP_PER_HOUR) {
      return { ok: false, error: 'We have already received several requests from you. We will be in touch soon.' }
    }

    const home = await payload.findGlobal({ slug: 'home-page', draft: false, depth: 0 })
    if (preferredDate && preferredTime) {
      const times = home.bookCall.timeSlots?.map((s) => s.label) ?? []
      slotAt = slotInstant(preferredDate, preferredTime)
      if (!slotAt || !times.includes(preferredTime) || !isSlotAvailable(preferredDate, preferredTime, new Date())) {
        return { ok: false, error: 'That time is no longer available. Please pick another.', fieldErrors: { preferredTime: 'Pick another time' } }
      }
      const day = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(slotAt).replace(',', '')
      slot = `${day}, ${preferredTime} IST`
    }
    const token = randomBytes(32).toString('hex')

    await payload.create({
      collection: 'bookings',
      overrideAccess: true,
      data: {
        fullName: data.fullName,
        email: data.email,
        mobile: data.mobile,
        consentText: home.bookCall.consentText,
        consentAt: new Date().toISOString(),
        source: 'home-page',
        ipHash,
        ...(slot ? { preferredSlot: slot } : {}),
        ...(slotAt ? { preferredAt: slotAt.toISOString() } : {}),
        ...(withSlotToken ? { slotTokenHash: sha256(token) } : {}),
        status: 'new',
      },
    })
    return { ok: true, token }
  } catch (error) {
    console.error('Booking failed', error instanceof Error ? error.message : error)
    return { ok: false, error: SERVER_ERROR }
  }
}

/** Step 2 (optional): attaches a preferred day and time to the booking from step 1. */
export async function submitSlot(input: SlotInput): Promise<SlotResult> {
  const parsed = slotSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Please pick both a day and a time.' }
  const { token, preferredDay, preferredTime } = parsed.data

  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'bookings',
      overrideAccess: true,
      limit: 1,
      depth: 0,
      where: {
        and: [
          { slotTokenHash: { equals: sha256(token) } },
          { createdAt: { greater_than: new Date(Date.now() - SLOT_WINDOW_MS).toISOString() } },
        ],
      },
    })
    // Unknown or expired token (including the honeypot's fake one): succeed quietly.
    if (!docs[0]) return { ok: true }

    await payload.update({
      collection: 'bookings',
      id: docs[0].id,
      overrideAccess: true,
      data: { preferredSlot: `${preferredDay}, ${preferredTime}`, slotTokenHash: null },
    })
    return { ok: true }
  } catch (error) {
    console.error('submitSlot failed', error)
    return { ok: false, error: SERVER_ERROR }
  }
}
