import { describe, expect, it } from 'vitest'

import { istNow, isSlotAvailable, parseSlotTime, slotInstant, slotTimes, upcomingSlotDays } from './booking-slots'

const TIMES = ['10:00 AM', '12:00 PM', '3:00 PM', '5:00 PM', '7:00 PM']
// Friday 23 Oct 2026, 10:30 in India (05:00 UTC)
const FRI_1030 = new Date('2026-10-23T05:00:00Z')

describe('parseSlotTime', () => {
  it('reads 12 and 24 hour labels', () => {
    expect(parseSlotTime('10:00 AM')).toBe(600)
    expect(parseSlotTime('12:00 PM')).toBe(720)
    expect(parseSlotTime('12:30 AM')).toBe(30)
    expect(parseSlotTime('7:00 pm')).toBe(1140)
    expect(parseSlotTime('15:45')).toBe(945)
    expect(parseSlotTime('25:00')).toBeNull()
    expect(parseSlotTime('noon')).toBeNull()
  })
})

describe('istNow', () => {
  it('uses Indian time whatever the machine clock says', () => {
    expect(istNow(FRI_1030)).toEqual({ date: '2026-10-23', minutes: 630 })
    // 20:00 UTC is already the next morning in India
    expect(istNow(new Date('2026-10-23T20:00:00Z'))).toEqual({ date: '2026-10-24', minutes: 90 })
  })
})

describe('slots by current time', () => {
  it('hides times that have passed or are within the lead time', () => {
    const today = slotTimes(TIMES, '2026-10-23', FRI_1030).map((s) => s.available)
    expect(today).toEqual([false, true, true, true, true]) // 10:00 passed; 12:00 is 90 min away
    const later = slotTimes(TIMES, '2026-10-23', new Date('2026-10-23T06:30:00Z')) // 12:00 IST
    expect(later.map((s) => s.available)).toEqual([false, false, true, true, true]) // 12:00 is now, 3 PM is 3h away
  })
  it('keeps every time on a future day', () => {
    expect(slotTimes(TIMES, '2026-10-24', FRI_1030).every((s) => s.available)).toBe(true)
  })
  it('never offers Sundays or dates that are too far ahead', () => {
    expect(isSlotAvailable('2026-10-25', '10:00 AM', FRI_1030)).toBe(false) // Sunday
    expect(isSlotAvailable('2026-12-30', '10:00 AM', FRI_1030)).toBe(false)
    expect(isSlotAvailable('not-a-date', '10:00 AM', FRI_1030)).toBe(false)
  })
})

describe('upcomingSlotDays', () => {
  it('starts today while slots remain, and skips Sunday', () => {
    const days = upcomingSlotDays(TIMES, FRI_1030)
    expect(days.map((d) => d.date)).toEqual(['2026-10-23', '2026-10-24', '2026-10-26', '2026-10-27', '2026-10-28'])
    expect(days[0]).toMatchObject({ weekday: 'Fri', day: '23', month: 'Oct' })
  })
  it('starts tomorrow once the last slot of today is too close', () => {
    const evening = new Date('2026-10-23T12:30:00Z') // 18:00 IST, 7 PM is 60 min away -> still ok
    expect(upcomingSlotDays(TIMES, evening)[0].date).toBe('2026-10-23')
    const late = new Date('2026-10-23T12:31:00Z') // 18:01 IST, 7 PM is under an hour away
    expect(upcomingSlotDays(TIMES, late)[0].date).toBe('2026-10-24')
  })
  it('rolls past the weekend on Saturday evening', () => {
    const sat = new Date('2026-10-24T13:00:00Z') // 18:30 IST Saturday
    expect(upcomingSlotDays(TIMES, sat)[0].date).toBe('2026-10-26')
  })
})

describe('slotInstant', () => {
  it('reads the slot as Indian time', () => {
    expect(slotInstant('2026-10-24', '3:00 PM')?.toISOString()).toBe('2026-10-24T09:30:00.000Z')
  })
})
