import { describe, expect, it } from 'vitest'

import { bookingsLinks, validateBookingsUrl } from './bookings'

describe('bookingsLinks', () => {
  it('turns a share link into its embed address', () => {
    expect(bookingsLinks('https://outlook.office365.com/book/WisBees@wisbees.com/')).toEqual({
      share: 'https://outlook.office365.com/book/WisBees@wisbees.com/',
      embed: 'https://outlook.office365.com/owa/calendar/WisBees@wisbees.com/bookings/',
    })
  })
  it('accepts an embed address and derives the share link', () => {
    expect(bookingsLinks('https://outlook.office365.com/owa/calendar/WisBees@wisbees.com/bookings/')?.share).toBe('https://outlook.office365.com/book/WisBees@wisbees.com/')
  })
  it('rejects other hosts, http and unrelated paths', () => {
    expect(bookingsLinks('https://evil.example.com/book/a@b.com/')).toBeNull()
    expect(bookingsLinks('http://outlook.office365.com/book/a@b.com/')).toBeNull()
    expect(bookingsLinks('https://outlook.office365.com/mail/')).toBeNull()
    expect(bookingsLinks('not a url')).toBeNull()
  })
  it('allows an empty CMS value and explains a bad one', () => {
    expect(validateBookingsUrl('')).toBe(true)
    expect(validateBookingsUrl('https://example.com')).toEqual(expect.stringContaining('Bookings'))
  })
})
