import { describe, expect, it } from 'vitest'

import { bookingSchema, contactSchema, slotSchema } from './schema'

const valid = {
  fullName: '  Asha   Rao ',
  email: ' Asha@Example.com ',
  mobile: '+91 98765 43210',
}

describe('contactSchema', () => {
  it('normalises mobile and email', () => {
    const parsed = contactSchema.parse(valid)
    expect(parsed.mobile).toBe('9876543210')
    expect(parsed.email).toBe('asha@example.com')
    expect(parsed.fullName).toBe('Asha Rao')
  })

  it('requires a name', () => {
    expect(contactSchema.safeParse({ ...valid, fullName: ' ' }).success).toBe(false)
  })

  it('rejects numbers that are not Indian mobiles', () => {
    expect(contactSchema.safeParse({ ...valid, mobile: '12345' }).success).toBe(false)
    expect(contactSchema.safeParse({ ...valid, mobile: '5876543210' }).success).toBe(false)
  })


  it('rejects a filled honeypot', () => {
    expect(contactSchema.safeParse({ ...valid, website: 'spam.example' }).success).toBe(false)
  })
})

describe('slotSchema', () => {
  const token = 'a'.repeat(64)

  it('accepts a day and time with a token', () => {
    expect(slotSchema.safeParse({ token, preferredDay: 'Thu 8 Oct', preferredTime: '12:00 PM' }).success).toBe(true)
  })

  it('rejects malformed tokens and missing picks', () => {
    expect(slotSchema.safeParse({ token: '1', preferredDay: 'Thu 8 Oct', preferredTime: '12:00 PM' }).success).toBe(false)
    expect(slotSchema.safeParse({ token, preferredDay: '', preferredTime: '12:00 PM' }).success).toBe(false)
  })
})

describe('bookingSchema (one step)', () => {
  it('accepts details with or without a slot', () => {
    expect(bookingSchema.safeParse(valid).success).toBe(true)
    expect(bookingSchema.safeParse({ ...valid, preferredDay: 'Thu 12 Oct', preferredTime: '10:00 AM' }).success).toBe(true)
  })

  it('rejects a day without a time, and a time without a day', () => {
    expect(bookingSchema.safeParse({ ...valid, preferredDay: 'Thu 12 Oct' }).success).toBe(false)
    expect(bookingSchema.safeParse({ ...valid, preferredTime: '10:00 AM' }).success).toBe(false)
  })
})
