import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('./applications', () => ({ findApplication: vi.fn() }))
vi.mock('./supabase/server', () => ({ getCurrentUser: vi.fn() }))

const { maskEmail, maskName } = await import('./account')

describe('masking', () => {
  it('keeps the first name and initials of the rest', () => {
    expect(maskName('Amogha Raj Sandur')).toBe('Amogha R*** S***')
    expect(maskName('Asha')).toBe('Asha')
  })

  it('hides most of the email local part', () => {
    expect(maskEmail('amogha@wisbees.com')).toBe('am****@wisbees.com')
    expect(maskEmail('ab@x.co')).toBe('a***@x.co')
  })
})
