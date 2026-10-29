import type { MixRow } from '@/lib/portal/types'

import { lakh } from './ui'

/** Ring of the money by type, with the total in the middle. */
export function MixDonut({ mix, total, size = 150 }: { mix: MixRow[]; total: number; size?: number }) {
  const r = 54
  const c = 2 * Math.PI * r
  const offsets = mix.map((_, i) => mix.slice(0, i).reduce((sum, m) => sum + (c * m.now) / 100, 0))
  return (
    <svg viewBox="0 0 140 140" width={size} height={size} role="img" aria-label="Your money by type" className="shrink-0">
      <g transform="rotate(-90 70 70)">
        {mix.map((m, i) => {
          const len = (c * m.now) / 100
          return <circle key={m.label} cx="70" cy="70" r={r} fill="none" stroke={m.colour} strokeWidth="22" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offsets[i]} />
        })}
      </g>
      <text x="70" y="66" textAnchor="middle" fontSize="11" className="fill-muted-foreground">
        Total
      </text>
      <text x="70" y="84" textAnchor="middle" fontSize="12" fontWeight="700" className="fill-ink">
        {lakh(total)}
      </text>
    </svg>
  )
}

export function MixLegend({ mix, withPlan }: { mix: MixRow[]; withPlan?: boolean }) {
  return (
    <ul className="flex min-w-40 flex-1 flex-col gap-2">
      {mix.map((m) => (
        <li key={m.label} className="flex items-center gap-2.5">
          <i className="size-3 shrink-0 rounded-[3px]" style={{ background: m.colour }} />
          {m.label}
          <b className="ml-auto tabular-nums">{withPlan && m.plan !== null ? `${m.now}% now · limit ${m.plan}%` : `${m.now}%`}</b>
        </li>
      ))}
    </ul>
  )
}

/** The health score over time: one point per Port Scan check. */
export function ScoreTrend({ history }: { history: { date: string; score: number }[] }) {
  const W = 560
  const H = 170
  const l = 36
  const b = 26
  const t = 10
  const r = 14
  const X = (i: number) => l + (i * (W - l - r)) / Math.max(1, history.length - 1)
  const Y = (v: number) => t + (H - t - b) * (1 - v / 100)
  const pts = history.map((h, i) => `${X(i)},${Y(h.score)}`).join(' ')
  const fmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' })
  const first = history[0]
  const last = history[history.length - 1]
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Your health score over time, from ${first.score} to ${last.score}`}>
        {[0, 50, 100].map((g) => (
          <g key={g}>
            <line x1={l} x2={W - r} y1={Y(g)} y2={Y(g)} className="stroke-border" />
            <text x={l - 8} y={Y(g) + 4} textAnchor="end" fontSize="11" className="fill-muted-foreground">
              {g}
            </text>
          </g>
        ))}
        <text x={X(0)} y={H - 6} textAnchor="start" fontSize="11" className="fill-muted-foreground">
          {fmt.format(new Date(first.date))}
        </text>
        <text x={X(history.length - 1)} y={H - 6} textAnchor="end" fontSize="11" className="fill-muted-foreground">
          {fmt.format(new Date(last.date))}
        </text>
        <polyline points={pts} fill="none" className="stroke-primary" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx={X(history.length - 1)} cy={Y(last.score)} r="5" className="fill-primary" />
      </svg>
    </div>
  )
}

/** A projection line against a dashed goal line. */
export function GoalChart({ points, target, startYear, endYear }: { points: number[]; target: number; startYear: number; endYear: number }) {
  const W = 560
  const H = 210
  const l = 52
  const b = 26
  const t = 12
  const r = 14
  const max = Math.max(points[points.length - 1], target) * 1.1
  const X = (i: number) => l + (i * (W - l - r)) / (points.length - 1)
  const Y = (v: number) => t + (H - t - b) * (1 - v / max)
  const label = (v: number) => (v >= 1e7 ? `${(v / 1e7).toFixed(1)} Cr` : `${(v / 1e5).toFixed(0)} L`)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Projected growth against your goal">
      {[0.25, 0.5, 0.75, 1].map((q) => {
        const v = (max * q) / 1.1
        return (
          <g key={q}>
            <line x1={l} x2={W - r} y1={Y(v)} y2={Y(v)} className="stroke-border" />
            <text x={l - 6} y={Y(v) + 4} textAnchor="end" fontSize="10" className="fill-muted-foreground">
              {label(v)}
            </text>
          </g>
        )
      })}
      <text x={X(0)} y={H - 6} fontSize="10" className="fill-muted-foreground">
        {startYear}
      </text>
      <text x={X(points.length - 1)} y={H - 6} textAnchor="end" fontSize="10" className="fill-muted-foreground">
        {endYear}
      </text>
      <line x1={l} x2={W - r} y1={Y(target)} y2={Y(target)} stroke="var(--brand-amber)" strokeWidth="2" strokeDasharray="6 5" />
      <text x={W - r} y={Y(target) - 6} textAnchor="end" fontSize="11" fontWeight="700" fill="var(--brand-amber-ink)">
        Goal {lakh(target)}
      </text>
      <polyline points={points.map((v, i) => `${X(i)},${Y(v)}`).join(' ')} fill="none" className="stroke-primary" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx={X(points.length - 1)} cy={Y(points[points.length - 1])} r="5" className="fill-primary" />
    </svg>
  )
}
