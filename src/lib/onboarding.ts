import { z } from 'zod'

/**
 * Onboarding: shared validation for sign-up and the application statuses. Step 2's
 * risk-profile questions live in the CMS (`risk-profile` global); see `risk-score.ts`.
 */

const option = <const T extends string>(value: T, label: string) => ({ value, label })

export const APPLICATION_STATUSES = [
  option('profile_pending', 'Profile pending'),
  option('submitted', 'Submitted, in review'),
  option('contacted', 'Contacted'),
  option('approved', 'Approved'),
  option('rejected', 'Not taken forward'),
] as const

/** Indian mobile: 10 digits starting 6–9, optionally prefixed with +91 / 91 / 0. */
const normaliseMobile = (v: string) => v.replace(/[\s-]/g, '').replace(/^(\+?91|0)(?=\d{10}$)/, '')

const fullName = z
  .string()
  .trim()
  .transform((v) => v.replace(/\s+/g, ' '))
  .pipe(z.string().min(2, 'Enter your full name').max(120))

const email = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address'))

/** Optional: empty is fine, anything else must be a valid Indian mobile. */
const optionalPhone = z
  .string()
  .transform(normaliseMobile)
  .pipe(z.union([z.literal(''), z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number')]))

/** Step 1, new account. */
export const signUpSchema = z.object({
  fullName,
  email,
  phone: optionalPhone,
  consent: z.literal(true, { error: 'Please accept to continue' }),
})

/** Step 1, returning user. */
export const logInSchema = z.object({ email })

/** Step 2a: the 6-digit code from the email. */
export const otpSchema = z.object({ token: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code') })

export type SignUpInput = z.input<typeof signUpSchema>
export type LogInInput = z.input<typeof logInSchema>

export type ActionResult = { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> }
