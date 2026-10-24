'use client'

import { Bar, BarChart, Cell, LabelList, Pie, PieChart, ReferenceLine, XAxis, YAxis } from 'recharts'

import { type ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { formatInr } from '@/lib/format-inr'

import { CLASS_COLORS, CLASS_LABELS, pct } from './shared'

const SERIES = '#0f8a55'

type Slice = { key: keyof typeof CLASS_COLORS; weight: number; value: number }

/** Parts of a whole, at most five fixed slices; every percentage is also printed. */
export function AllocationDonut({ effective, total }: { effective: Record<keyof typeof CLASS_COLORS, number>; total: number }) {
  const data: Slice[] = (Object.keys(CLASS_COLORS) as (keyof typeof CLASS_COLORS)[])
    .map((key) => ({ key, weight: effective[key], value: effective[key] * total }))
    .filter((s) => s.weight > 0.0005)
  const config = Object.fromEntries(data.map((s) => [s.key, { label: CLASS_LABELS[s.key], color: CLASS_COLORS[s.key] }])) satisfies ChartConfig
  return (
    <div className="grid items-center gap-6 sm:grid-cols-[12rem_1fr]">
      <ChartContainer config={config} className="mx-auto aspect-square w-44 sm:w-48">
        <PieChart>
          <ChartTooltip
            content={({ active, payload }) => {
              const s = payload?.[0]?.payload as Slice | undefined
              if (!active || !s) return null
              return (
                <div className="bg-card rounded-lg border px-3 py-2 text-xs shadow-md">
                  <p className="text-ink font-semibold">{CLASS_LABELS[s.key]}</p>
                  <p className="text-muted-foreground">
                    {pct(s.weight)} · {formatInr(s.value)}
                  </p>
                </div>
              )
            }}
          />
          <Pie data={data} dataKey="weight" nameKey="key" innerRadius="62%" outerRadius="100%" stroke="var(--card)" strokeWidth={2} isAnimationActive={false}>
            {data.map((s) => (
              <Cell key={s.key} fill={CLASS_COLORS[s.key]} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="space-y-2.5 text-sm">
        {data.map((s) => (
          <li key={s.key} className="flex items-center gap-3">
            <span aria-hidden className="size-3 shrink-0 rounded-sm" style={{ background: CLASS_COLORS[s.key] }} />
            <span className="text-ink flex-1">{CLASS_LABELS[s.key]}</span>
            <span className="text-ink font-medium tabular-nums">{pct(s.weight)}</span>
            <span className="text-muted-foreground w-28 text-right tabular-nums">{formatInr(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Thin stacked bar for the effective mix, with gaps between segments. */
export function MixBar({ effective }: { effective: Record<keyof typeof CLASS_COLORS, number> }) {
  const parts = (Object.keys(CLASS_COLORS) as (keyof typeof CLASS_COLORS)[]).filter((k) => effective[k] > 0.0005)
  return (
    <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label={parts.map((k) => `${CLASS_LABELS[k]} ${pct(effective[k])}`).join(', ')}>
      {parts.map((k) => (
        <span key={k} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${effective[k] * 100}%`, background: CLASS_COLORS[k] }} />
      ))}
    </div>
  )
}

type Ranked = { label: string; weight: number; value: number; muted?: boolean }

/** Ranked list as horizontal bars, sorted high to low, single hue, values printed at the end. */
export function RankedBars({ data, threshold, thresholdLabel, compact }: { data: Ranked[]; threshold?: number; thresholdLabel?: string; compact?: boolean }) {
  const config = { weight: { label: 'Share', color: SERIES } } satisfies ChartConfig
  // Labels sit in a fixed column; on phones it is narrower and names shorten sooner.
  const labelWidth = compact ? 116 : 200
  const maxChars = compact ? 14 : 24
  const max = Math.max(threshold ?? 0, ...data.map((d) => d.weight)) * 1.12
  return (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height: data.length * 44 + (threshold ? 24 : 4) }}>
      <BarChart data={data} layout="vertical" margin={{ top: threshold ? 20 : 0, right: 56, left: 0, bottom: 0 }} barCategoryGap={10}>
        <XAxis type="number" hide domain={[0, max]} />
        <YAxis
          type="category"
          dataKey="label"
          width={labelWidth}
          tickLine={false}
          axisLine={false}
          tick={({ x, y, payload }) => {
            const label = String(payload.value)
            return (
              <text x={Number(x) - 6} y={Number(y)} dy={4} textAnchor="end" className="fill-ink text-xs">
                <title>{label}</title>
                {label.length > maxChars ? `${label.slice(0, maxChars - 1).trimEnd()}…` : label}
              </text>
            )
          }}
        />
        <ChartTooltip
          cursor={{ fill: 'var(--muted)' }}
          content={({ active, payload }) => {
            const d = payload?.[0]?.payload as Ranked | undefined
            if (!active || !d) return null
            return (
              <div className="bg-card rounded-lg border px-3 py-2 text-xs shadow-md">
                <p className="text-ink font-semibold">{d.label}</p>
                <p className="text-muted-foreground">
                  {pct(d.weight)} · {formatInr(d.value)}
                </p>
              </div>
            )
          }}
        />
        {threshold !== undefined && (
          <ReferenceLine
            x={threshold}
            stroke="var(--brand-ink-soft)"
            strokeDasharray="4 3"
            label={{ value: thresholdLabel ?? pct(threshold, 0), position: 'top', className: 'fill-ink-soft text-[0.7rem]' }}
          />
        )}
        <Bar dataKey="weight" radius={[0, 4, 4, 0]} isAnimationActive={false} maxBarSize={22}>
          {data.map((d) => (
            <Cell key={d.label} fill={d.muted ? 'var(--brand-mint-strong)' : SERIES} />
          ))}
          <LabelList dataKey="weight" position="right" offset={8} formatter={(v) => pct(Number(v))} className="fill-ink text-[0.8rem] font-medium" />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

type Level = 'low' | 'moderate' | 'high' | 'very_high'

/** The six bands of the SEBI riskometer, left to right. */
const BANDS = [
  { label: ['Low', 'Risk'], color: '#439b52' },
  { label: ['Low to', 'Moderate', 'Risk'], color: '#9cc654' },
  { label: ['Moderate', 'Risk'], color: '#f4ec5a' },
  { label: ['Moderately', 'High Risk'], color: '#b98f3c' },
  { label: ['High', 'Risk'], color: '#e8933b' },
  { label: ['Very High', 'Risk'], color: '#d8392f' },
] as const

/** Which of the six bands each of our four volatility levels points at. */
const LEVEL_BAND: Record<Level, number> = { low: 0, moderate: 2, high: 4, very_high: 5 }

/**
 * Riskometer in the manner of the SEBI mutual-fund label: six coloured bands on a half dial,
 * the band names around the rim, a needle on the current band and a caption beneath.
 */
export function RiskMeter({ level }: { level: Level | null; labels?: Record<Level, string> }) {
  const cx = 200
  const cy = 205
  const point = (r: number, deg: number) => `${cx + r * Math.cos((deg * Math.PI) / 180)} ${cy - r * Math.sin((deg * Math.PI) / 180)}`
  const wedge = (r0: number, r1: number, from: number, to: number) =>
    `M ${point(r1, from)} A ${r1} ${r1} 0 0 1 ${point(r1, to)} L ${point(r0, to)} A ${r0} ${r0} 0 0 0 ${point(r0, from)} Z`
  const idx = level ? LEVEL_BAND[level] : -1
  const needleDeg = 180 - (idx + 0.5) * 30
  const caption = idx >= 0 ? `The risk of the portfolio is ${BANDS[idx].label.join(' ')}` : 'Risk: not available'

  return (
    <figure className="mx-auto w-full max-w-md" role="img" aria-label={caption}>
      <svg viewBox="0 0 400 270" className="w-full" aria-hidden>
        {BANDS.map((b, i) => {
          const from = 180 - i * 30 - 0.6
          const to = 180 - (i + 1) * 30 + 0.6
          const mid = 180 - (i + 0.5) * 30
          const [x, y] = point(163, mid).split(' ')
          return (
            <g key={b.color}>
              <path d={wedge(135, 197, from, to)} fill="#e6e7e8" />
              <path d={wedge(70, 128, from, to)} fill={b.color} opacity={idx === -1 || idx === i ? 1 : 0.9} />
              <text
                transform={`translate(${x} ${y}) rotate(${90 - mid})`}
                textAnchor="middle"
                className="fill-ink text-[13px] font-semibold"
                style={{ fontFamily: 'inherit' }}
              >
                {b.label.map((line, n) => (
                  <tspan key={line} x="0" dy={n === 0 ? `${-(b.label.length - 1) * 0.5 * 1.05 + 0.35}em` : '1.05em'}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          )
        })}
        {idx >= 0 && (
          <polygon
            points={`${point(118, needleDeg)} ${point(9, needleDeg + 90)} ${point(9, needleDeg - 90)}`}
            fill="#1a1a1a"
          />
        )}
        <circle cx={cx} cy={cy} r="16" fill="#1a1a1a" />
        <circle cx={cx} cy={cy} r="9" fill="#3a3a3a" />
        <rect x="0" y="228" width="400" height="38" rx="2" fill="#e6e7e8" />
        <text x="200" y="253" textAnchor="middle" className="fill-ink text-[16px] font-semibold" style={{ fontFamily: 'inherit' }}>
          {caption}
        </text>
      </svg>
    </figure>
  )
}
