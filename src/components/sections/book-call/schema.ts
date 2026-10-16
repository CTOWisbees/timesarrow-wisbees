import { z } from 'zod'

/** Indian mobile: 10 digits starting 6–9, optionally prefixed with +91 / 91 / 0. */
const normaliseMobile = (v: string) => v.replace(/[\s-]/g, '').replace(/^(\+?91|0)(?=\d{10}$)/, '')

/** Step 1: contact details. Saved as soon as the visitor submits. */
export const contactSchema = z.object({
  fullName: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, ' '))
    .pipe(z.string().min(2, 'Enter your full name').max(120)),
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')),
  mobile: z
    .string()
    .transform(normaliseMobile)
    .pipe(z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number')),
  /** Honeypot. Real visitors never see or fill this field. */
  website: z.string().max(0).optional(),
})

/** Step 2 (optional): preferred day and time, attached to the booking from step 1. */
export const slotSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),
  preferredDay: z.string().trim().min(1).max(40),
  preferredTime: z.string().trim().min(1).max(40),
})

/**
 * One-step booking: contact details plus an optional preferred day and time in the
 * same submission. A day without a time (or the reverse) is rejected.
 */
export const bookingSchema = contactSchema
  .extend({
    preferredDay: z.string().trim().max(40).optional(),
    preferredTime: z.string().trim().max(40).optional(),
  })
  .refine((v) => Boolean(v.preferredDay) === Boolean(v.preferredTime), {
    message: 'Pick both a day and a time',
    path: ['preferredTime'],
  })

export type ContactInput = z.input<typeof contactSchema>
export type BookingInput = z.input<typeof bookingSchema>
export type SlotInput = z.input<typeof slotSchema>

type Failure = { ok: false; error: string; fieldErrors?: Record<string, string> }
export type ContactResult = { ok: true; token: string } | Failure
export type BookingResult = { ok: true } | Failure
export type SlotResult = { ok: true } | Failure
