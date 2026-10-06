import { z } from 'zod'

/** Indian mobile: 10 digits starting 6–9, optionally prefixed with +91 / 91 / 0. */
const normaliseMobile = (v: string) => v.replace(/[\s-]/g, '').replace(/^(\+?91|0)(?=\d{10}$)/, '')

export const bookingSchema = z.object({
  firstName: z.string().trim().min(1, 'Enter your first name').max(60),
  lastName: z.string().trim().min(1, 'Enter your last name').max(60),
  mobile: z
    .string()
    .transform(normaliseMobile)
    .pipe(z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number')),
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')),
  preferredDay: z.string().max(40).optional(),
  preferredTime: z.string().max(40).optional(),
  consent: z.literal(true, { error: 'Please agree to be contacted so we can call you' }),
  /** Honeypot. Real visitors never see or fill this field. */
  website: z.string().max(0).optional(),
})

export type BookingInput = z.input<typeof bookingSchema>

export type BookingResult = { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> }
