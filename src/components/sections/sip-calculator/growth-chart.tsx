'use client'

import { Bar, BarChart, LabelList, XAxis, YAxis } from 'recharts'

import { type ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { formatInr, formatInrCompact } from '@/lib/format-inr'
import type { SipYear } from '@/lib/sip'

const config = { value: { label: 'Corpus', color: 'var(--chart-1)' } } satisfies ChartConfig

/** Year 1, then every fifth year, matching the Figma axis. */
const isTickYear = (year: number) => year === 1 || year % 5 === 0

export function GrowthChart({ data }: { data: SipYear[] }) {
  const last = data.length - 1
  return (
    <ChartContainer config={config} className="aspect-auto h-72 w-full md:h-96">
      <BarChart data={data} margin={{ top: 32, right: 0, left: 0, bottom: 0 }} barCategoryGap={2}>
        <XAxis
          dataKey="year"
          tickLine={false}
          axisLine={false}
          interval={0}
          tickMargin={8}
          tick={({ x, y, payload, index }) =>
            isTickYear(payload.value) ? (
              <text
                x={x}
                y={Number(y) + 12}
                // Anchor the end labels inwards so they never clip at the chart edges.
                textAnchor={index === 0 ? 'start' : index === last ? 'end' : 'middle'}
                className="fill-muted-foreground text-xs"
              >
                Year {payload.value}
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
            const point = payload?.[0]?.payload as SipYear | undefined
            if (!active || !point) return null
            return (
              <div className="bg-card rounded-lg border px-3 py-2 text-xs shadow-md">
                <p className="text-primary font-semibold">Total value: {formatInr(point.value, { symbol: false })}</p>
                <p className="text-muted-foreground mt-1">Year {point.year}</p>
                <p className="text-muted-foreground">Total invested: {formatInr(point.invested, { symbol: false })}</p>
              </div>
            )
          }}
        />
        <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} isAnimationActive={false}>
          <LabelList
            dataKey="value"
            position="top"
            offset={10}
            content={({ x, y, width, value, index }) =>
              index === last ? (
                <text
                  x={Number(x) + Number(width)}
                  y={Number(y) - 10}
                  textAnchor="end"
                  className="fill-primary text-base font-bold"
                >
                  {formatInrCompact(Number(value))}
                </text>
              ) : null
            }
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
