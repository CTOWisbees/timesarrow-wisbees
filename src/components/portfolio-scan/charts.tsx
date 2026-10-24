'use client'

import { Bar, BarChart, Cell, LabelList, Pie, PieChart, ReferenceLine, XAxis, YAxis } from 'recharts'

import { type ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { formatInr } from '@/lib/format-inr'
import { cn } from '@/lib/utils'

import { CLASS_COLORS, CLASS_LABELS, pct } from './shared'

const SERIES = '#0f8a55'

/** The 0–100 score as the hero number, with the likely range beneath it. The band word (and its icon) is rendered by the caller. */
export function ScoreDisplay({ score, range, label }: { score: number; range: [number, number] | null; label: string }) {
  return (
    <figure
      className="bg-mist mx-auto flex w-full max-w-64 flex-col items-center rounded-2xl px-6 py-8 text-center"
      role="img"
      aria-label={`${label}: ${score} out of 100${range ? `, likely between ${range[0]} and ${range[1]}` : ''}`}
    >
      <span className="font-heading text-brand-green block text-8xl leading-none font-semibold tabular-nums" aria-hidden>
        {score}
      </span>
      <span className="text-muted-foreground mt-2 block text-sm" aria-hidden>
        out of 100
      </span>
      {range && (
        <span className="text-ink-soft mt-3 block text-xs tabular-nums" aria-hidden>
          Likely {range[0]}–{range[1]}
        </span>
      )}
    </figure>
  )
}

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

const LEVELS = ['low', 'moderate', 'high', 'very_high'] as const

/** Ordinal meter: four segments, the current one filled and named; the number sits beside it. */
export function RiskMeter({ level, labels }: { level: (typeof LEVELS)[number] | null; labels: Record<(typeof LEVELS)[number], string> }) {
  const idx = level ? LEVELS.indexOf(level) : -1
  return (
    <div>
      <div className="grid grid-cols-4 gap-1" role="img" aria-label={level ? `Risk: ${labels[level]}` : 'Risk: not available'}>
        {LEVELS.map((l, i) => (
          <span key={l} className={cn('h-2.5 rounded-full', i === idx ? 'bg-ink' : i < idx ? 'bg-ink-soft/40' : 'bg-border')} />
        ))}
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1 text-xs">
        {LEVELS.map((l, i) => (
          <span key={l} className={cn(i === idx ? 'text-ink font-semibold' : 'text-muted-foreground')}>
            {labels[l]}
          </span>
        ))}
      </div>
    </div>
  )
}
