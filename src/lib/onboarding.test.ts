import { describe, expect, it } from 'vitest'

import { otpSchema, signUpSchema } from './onboarding'

describe('signUpSchema', () => {
  const valid = { fullName: ' Asha  Rao ', email: ' Asha@Example.com ', phone: '', consent: true as const }

  it('accepts an empty phone and normalises name and email', () => {
    const parsed = signUpSchema.parse(valid)
    expect(parsed).toMatchObject({ fullName: 'Asha Rao', email: 'asha@example.com', phone: '' })
  })

  it('normalises a +91 phone and rejects invalid ones', () => {
    expect(signUpSchema.parse({ ...valid, phone: '+91 98765 43210' }).phone).toBe('9876543210')
    expect(signUpSchema.safeParse({ ...valid, phone: '12345' }).success).toBe(false)
  })

  it('requires consent', () => {
    expect(signUpSchema.safeParse({ ...valid, consent: false }).success).toBe(false)
  })
})

describe('otpSchema', () => {
  it('accepts exactly six digits', () => {
    expect(otpSchema.safeParse({ token: '012345' }).success).toBe(true)
    expect(otpSchema.safeParse({ token: '12345' }).success).toBe(false)
    expect(otpSchema.safeParse({ token: '12a456' }).success).toBe(false)
  })
})
