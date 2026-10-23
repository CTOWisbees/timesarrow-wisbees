/**
 * Keeps orbiting labels from sitting on top of each other. Each label is anchored to a moving point
 * (an electron or planet) and normally rests beside it; every frame, labels that overlap each other,
 * or another point's dot, are nudged apart, kept inside the stage, and eased back towards their
 * resting place once there is room. Pure maths, so it can be unit tested.
 */
export type OrbitLabel = {
  /** Anchor point, in stage pixels. */
  ax: number
  ay: number
  /** Label size in pixels. */
  w: number
  h: number
  /** Resting side of the anchor: 1 = right, -1 = left, 0 = centred on it. */
  side: 1 | 0 | -1
  /** Current offset from the anchor (kept between frames). */
  ox: number
  oy: number
}

const MARGIN = 4
const MAX_OFFSET = 170
const DOT = 18

const rest = (l: OrbitLabel, gap: number) => (l.side === 0 ? 0 : l.side * (l.w / 2 + gap))

/** Moves labels one step. `ease` is 0..1 (how far to return towards rest), `passes` the number of separation passes. */
export function relaxLabels(labels: OrbitLabel[], stage: { w: number; h: number }, { gap = 10, restGap = 16, ease = 0.15, passes = 3, dots = true } = {}) {
  for (const l of labels) {
    l.ox += (rest(l, restGap) - l.ox) * ease
    l.oy += (0 - l.oy) * ease
  }

  for (let pass = 0; pass < passes; pass++) {
    // Label against label.
    for (let i = 0; i < labels.length; i++) {
      for (let j = i + 1; j < labels.length; j++) {
        const a = labels[i]
        const b = labels[j]
        const dx = b.ax + b.ox - (a.ax + a.ox)
        const dy = b.ay + b.oy - (a.ay + a.oy)
        const overlapX = (a.w + b.w) / 2 + gap - Math.abs(dx)
        const overlapY = (a.h + b.h) / 2 + gap - Math.abs(dy)
        if (overlapX <= 0 || overlapY <= 0) continue
        if (overlapY <= overlapX) {
          const push = (overlapY / 2) * (dy === 0 ? (i % 2 ? 1 : -1) : Math.sign(dy))
          a.oy -= push
          b.oy += push
        } else {
          const push = (overlapX / 2) * (dx === 0 ? (i % 2 ? 1 : -1) : Math.sign(dx))
          a.ox -= push
          b.ox += push
        }
      }
    }

    // Label against the other points' dots (labels move, dots do not).
    if (dots) {
      for (let i = 0; i < labels.length; i++) {
        for (let k = 0; k < labels.length; k++) {
          if (i === k) continue
          const a = labels[i]
          const d = labels[k]
          const dx = d.ax - (a.ax + a.ox)
          const dy = d.ay - (a.ay + a.oy)
          const overlapX = (a.w + DOT) / 2 + gap / 2 - Math.abs(dx)
          const overlapY = (a.h + DOT) / 2 + gap / 2 - Math.abs(dy)
          if (overlapX <= 0 || overlapY <= 0) continue
          if (overlapY <= overlapX) a.oy -= overlapY * (dy === 0 ? 1 : Math.sign(dy))
          else a.ox -= overlapX * (dx === 0 ? 1 : Math.sign(dx))
        }
      }
    }

    // Stay inside the stage and near the anchor.
    for (const l of labels) {
      l.ox = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, l.ox))
      l.oy = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, l.oy))
      const cx = Math.max(l.w / 2 + MARGIN, Math.min(stage.w - l.w / 2 - MARGIN, l.ax + l.ox))
      const cy = Math.max(l.h / 2 + MARGIN, Math.min(stage.h - l.h / 2 - MARGIN, l.ay + l.oy))
      l.ox = cx - l.ax
      l.oy = cy - l.ay
    }
  }
}

/** Number of label pairs that still overlap (for tests). */
export function overlaps(labels: OrbitLabel[], gap = 0) {
  let n = 0
  for (let i = 0; i < labels.length; i++) {
    for (let j = i + 1; j < labels.length; j++) {
      const a = labels[i]
      const b = labels[j]
      const dx = Math.abs(b.ax + b.ox - (a.ax + a.ox))
      const dy = Math.abs(b.ay + b.oy - (a.ay + a.oy))
      if (dx < (a.w + b.w) / 2 + gap && dy < (a.h + b.h) / 2 + gap) n++
    }
  }
  return n
}
