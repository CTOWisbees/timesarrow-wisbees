import { describe, expect, it } from 'vitest'

import { bookingSchema } from './schema'

const valid = {
  firstName: 'Asha',
  lastName: 'Rao',
  mobile: '+91 98765 43210',
  email: ' Asha@Example.com ',
  consent: true as const,
}

describe('bookingSchema', () => {
  it('normalises mobile and email', () => {
    const parsed = bookingSchema.parse(valid)
    expect(parsed.mobile).toBe('9876543210')
    expect(parsed.email).toBe('asha@example.com')
  })

  it('rejects numbers that are not Indian mobiles', () => {
    expect(bookingSchema.safeParse({ ...valid, mobile: '12345' }).success).toBe(false)
    expect(bookingSchema.safeParse({ ...valid, mobile: '5876543210' }).success).toBe(false)
  })

  it('requires consent', () => {
    expect(bookingSchema.safeParse({ ...valid, consent: false }).success).toBe(false)
  })

  it('rejects a filled honeypot', () => {
    expect(bookingSchema.safeParse({ ...valid, website: 'spam.example' }).success).toBe(false)
  })
})
