import { describe, expect, it } from 'vitest'

import { type OrbitLabel, overlaps, relaxLabels } from './label-layout'

const label = (ax: number, ay: number, side: 1 | 0 | -1 = 1): OrbitLabel => ({ ax, ay, w: 120, h: 34, side, ox: 0, oy: 0 })
const settle = (labels: OrbitLabel[], stage = { w: 560, h: 560 }) => relaxLabels(labels, stage, { ease: 1, passes: 40 })

describe('relaxLabels', () => {
  it('separates labels whose points sit on top of each other', () => {
    const labels = [label(280, 280), label(284, 282), label(290, 278), label(282, 286)]
    settle(labels)
    expect(overlaps(labels)).toBe(0)
  })

  it('leaves labels alone when there is room', () => {
    const labels = [label(100, 100), label(400, 400)]
    settle(labels)
    expect(labels[0].oy).toBeCloseTo(0, 5)
    expect(labels[1].ox).toBeCloseTo(120 / 2 + 16, 5)
  })

  it('keeps labels inside the stage', () => {
    const labels = [label(5, 5, -1), label(555, 555, 1)]
    settle(labels)
    for (const l of labels) {
      expect(l.ax + l.ox - l.w / 2).toBeGreaterThanOrEqual(0)
      expect(l.ax + l.ox + l.w / 2).toBeLessThanOrEqual(560)
      expect(l.ay + l.oy - l.h / 2).toBeGreaterThanOrEqual(0)
      expect(l.ay + l.oy + l.h / 2).toBeLessThanOrEqual(560)
    }
  })

  it('returns to rest once the crowd moves away', () => {
    const labels = [label(280, 280), label(282, 281)]
    settle(labels)
    labels[1].ax = 500
    labels[1].ay = 500
    for (let i = 0; i < 80; i++) relaxLabels(labels, { w: 560, h: 560 }, { ease: 0.15, passes: 3 })
    expect(labels[0].ox).toBeCloseTo(76, 0)
    expect(labels[0].oy).toBeCloseTo(0, 0)
  })
})
