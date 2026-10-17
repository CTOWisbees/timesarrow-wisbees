'use client'

import { Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts'

import { type ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { formatInr, formatInrCompact } from '@/lib/format-inr'
import type { Tone, ToolResult } from '@/lib/calculators/types'

export const toneColor: Record<Tone, string> = {
  soft: 'var(--brand-mint-strong)',
  green: 'var(--brand-green)',
  amber: 'var(--brand-amber)',
}

const floorInr = (n: number) => formatInr(Math.floor(n + 1e-6), { symbol: false })

export function Donut({ items }: { items: NonNullable<ToolResult['donut']> }) {
  const total = items.reduce((s, i) => s + i.value, 0)
  const config = Object.fromEntries(items.map((i) => [i.label, { label: i.label, color: toneColor[i.tone] }])) satisfies ChartConfig
  const data = total > 0 ? items : [{ label: 'None', value: 1, display: '', tone: 'soft' as const }]
  return (
    <div className="@container">
      <div className="flex flex-col items-center gap-6 @lg:flex-row @lg:gap-8">
        <ChartContainer config={config} className="aspect-square h-44 w-44 shrink-0">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={52} outerRadius={80} paddingAngle={total > 0 ? 2 : 0} strokeWidth={0} isAnimationActive={false}>
              {data.map((i) => (
                <Cell key={i.label} fill={toneColor[i.tone]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <ul className="flex w-full min-w-0 flex-1 flex-col divide-y">
          {items.map((i) => (
            <li key={i.label} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-0.5 py-3 text-sm first:pt-0 last:pb-0">
              <span className="size-3 shrink-0 rounded-full ring-1 ring-black/5" style={{ background: toneColor[i.tone] }} />
              <span className="text-ink-soft">{i.label}</span>
              <span className="text-ink col-start-2 font-semibold tabular-nums">{i.display}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const barConfig = {
  a: { label: 'A', color: 'var(--brand-mint-strong)' },
  b: { label: 'B', color: 'var(--brand-green)' },
} satisfies ChartConfig

/** Two stacked series per year, in the same style as the home page growth chart. */
export function StackedBars({ series }: { series: NonNullable<ToolResult['series']> }) {
  const { data } = series
  const last = data.length - 1
  // About four axis labels however long the horizon, never two crowded together.
  const every = Math.max(1, Math.ceil(data.length / 4))
  const lastRegular = last - (last % every)
  const isTick = (i: number) => i % every === 0 || (i === last && last - lastRegular >= every)
  const total = data[last] ? data[last].a + data[last].b : 0
  return (
    <ChartContainer config={barConfig} className="aspect-auto h-64 w-full md:h-80">
      <BarChart data={data} margin={{ top: 28, right: 0, left: 0, bottom: 0 }} barCategoryGap={2}>
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          interval={0}
          tickMargin={8}
          tick={({ x, y, payload, index }) =>
            isTick(index) ? (
              <text x={x} y={Number(y) + 12} textAnchor={index === 0 ? 'start' : index === last ? 'end' : 'middle'} className="fill-muted-foreground text-xs">
                {payload.value}
              </text>
            ) : (
              <g />
            )
          }
        />
        <YAxis hide domain={[0, 'dataMax']} />
        <ChartTooltip
          cursor={{ fill: 'var(--muted)' }}
          content={({ active, payload }) => {
            const p = payload?.[0]?.payload as { label: string; a: number; b: number } | undefined
            if (!active || !p) return null
            return (
              <div className="bg-card rounded-lg border px-3 py-2 text-xs shadow-md">
                <p className="text-ink font-semibold">{p.label}</p>
                <p className="mt-1 flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: 'var(--brand-mint-strong)' }} />
                  <span className="text-muted-foreground">{series.aLabel}:</span> {floorInr(p.a)}
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: 'var(--brand-green)' }} />
                  <span className="text-muted-foreground">{series.bLabel}:</span> {floorInr(p.b)}
                </p>
                <p className="text-primary mt-1 font-semibold">Total: {floorInr(p.a + p.b)}</p>
              </div>
            )
          }}
        />
        <Bar dataKey="a" stackId="s" fill="var(--color-a)" isAnimationActive={false} />
        <Bar
          dataKey="b"
          stackId="s"
          fill="var(--color-b)"
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
          label={({ x, y, width, index }) =>
            index === last ? (
              <text x={Number(x) + Number(width)} y={Number(y) - 10} textAnchor="end" className="fill-primary text-base font-bold">
                {formatInrCompact(Math.floor(total))}
              </text>
            ) : (
              <g />
            )
          }
        />
      </BarChart>
    </ChartContainer>
  )
}

export function Legend({ aLabel, bLabel }: { aLabel: string; bLabel: string }) {
  return (
    <div className="text-ink-soft flex flex-wrap gap-x-6 gap-y-2 text-sm">
      <span className="flex items-center gap-2">
        <span className="size-3 rounded-full ring-1 ring-black/5" style={{ background: 'var(--brand-mint-strong)' }} /> {aLabel}
      </span>
      <span className="flex items-center gap-2">
        <span className="size-3 rounded-full" style={{ background: 'var(--brand-green)' }} /> {bLabel}
      </span>
    </div>
  )
}
