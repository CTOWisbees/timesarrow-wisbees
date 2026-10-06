'use server'

import { createHash } from 'crypto'
import { headers } from 'next/headers'

import { getPayloadClient } from '@/lib/payload'

import { type BookingInput, type BookingResult, bookingSchema } from './schema'

const MAX_PER_IP_PER_HOUR = 5

const hashIp = (ip: string) =>
  createHash('sha256').update(`${ip}:${process.env.PAYLOAD_SECRET}`).digest('hex').slice(0, 32)

/**
 * Stores a "Talk to an expert" request. The consent wording is read from the
 * published home page on the server, so the stored record reflects exactly what
 * the visitor was shown rather than anything the client sends.
 */
export async function submitBooking(input: BookingInput): Promise<BookingResult> {
  const parsed = bookingSchema.safeParse(input)
  if (!parsed.success) {
    // A filled honeypot gets a quiet fake success so bots learn nothing.
    if (parsed.error.issues.some((i) => i.path[0] === 'website')) return { ok: true }
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message
    return { ok: false, error: 'Please check the highlighted fields.', fieldErrors }
  }
  const data = parsed.data

  try {
    const payload = await getPayloadClient()
    const requestHeaders = await headers()
    const ip = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || requestHeaders.get('x-real-ip') || 'unknown'
    const ipHash = hashIp(ip)

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { totalDocs } = await payload.count({
      collection: 'bookings',
      where: { and: [{ ipHash: { equals: ipHash } }, { createdAt: { greater_than: hourAgo } }] },
    })
    if (totalDocs >= MAX_PER_IP_PER_HOUR) {
      return { ok: false, error: 'We have already received several requests from you. We will be in touch soon.' }
    }

    const home = await payload.findGlobal({ slug: 'home-page', draft: false, depth: 0 })
    const slot = [data.preferredDay, data.preferredTime].filter(Boolean).join(', ')

    await payload.create({
      collection: 'bookings',
      overrideAccess: true,
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        mobile: data.mobile,
        email: data.email,
        preferredSlot: slot || undefined,
        consentText: home.bookCall.consentText,
        consentAt: new Date().toISOString(),
        source: 'home-page',
        ipHash,
        status: 'new',
      },
    })
    return { ok: true }
  } catch (error) {
    console.error('submitBooking failed', error)
    return { ok: false, error: 'Something went wrong on our side. Please try again in a minute.' }
  }
}
