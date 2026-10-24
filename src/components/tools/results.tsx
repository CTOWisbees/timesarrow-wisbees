'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Stat, ToolResult } from '@/lib/calculators/types'
import { cn } from '@/lib/utils'

import { Donut, Legend, StackedBars } from './charts'

export const panel = 'bg-card rounded-2xl border p-4 shadow-[0_1px_2px_rgb(16_34_27/0.04)] sm:p-7'

function StatCard({ stat }: { stat: Stat }) {
  const tone = stat.tone ?? 'default'
  return (
    <div
      className={cn(
        'rounded-xl border p-4',
        tone === 'primary' && 'bg-primary border-primary p-5 text-white sm:p-6',
        tone === 'accent' && 'bg-amber-soft border-amber-line',
        tone === 'default' && 'bg-mist',
      )}
    >
      <dt className={cn('text-sm', tone === 'primary' ? 'text-white/80' : 'text-ink-soft')}>{stat.label}</dt>
      <dd
        className={cn(
          'font-heading mt-1 font-semibold tabular-nums',
          tone === 'primary' ? 'text-3xl sm:text-4xl' : 'text-xl @2xl:text-2xl',
          tone === 'default' && 'text-ink',
          tone === 'accent' && 'text-amber-ink',
        )}
      >
        {stat.value}
      </dd>
    </div>
  )
}

/** The headline figure first and full width, then the supporting figures, the split and the notes. */
export function Summary({ result }: { result: ToolResult }) {
  const hero = result.stats.find((s) => s.tone === 'primary')
  const rest = result.stats.filter((s) => s !== hero)
  return (
    <div className="@container flex flex-col gap-6">
      <dl className="flex flex-col gap-3">
        {hero && <StatCard stat={hero} />}
        <div className={cn('grid grid-cols-1 gap-3 @md:grid-cols-2', rest.length === 3 && '@2xl:grid-cols-3')}>
          {rest.map((s) => (
            <StatCard key={s.label} stat={s} />
          ))}
        </div>
      </dl>
      {result.donut && (
        <div className="border-t pt-6">
          <Donut items={result.donut} />
        </div>
      )}
      {result.notes && result.notes.length > 0 && (
        <ul className="text-ink-soft border-t pt-5 text-sm leading-relaxed">
          {result.notes.map((note) => (
            <li key={note} className="flex gap-2.5 py-1">
              <span className="bg-amber mt-2 size-1.5 shrink-0 rounded-full" />
              {note}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function Breakdown({ result }: { result: ToolResult }) {
  if (!result.series && !result.table) return null
  return (
    <>
      {result.series && (
        <section className={panel} aria-labelledby="series-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="series-title" className="text-xl font-semibold">
              {result.series.title}
            </h2>
            <Legend aLabel={result.series.aLabel} bLabel={result.series.bLabel} />
          </div>
          <div className="mt-4">
            <StackedBars series={result.series} />
          </div>
        </section>
      )}
      {result.table && (
        <section className={panel} aria-labelledby="table-title">
          <h2 id="table-title" className="text-xl font-semibold">
            {result.table.title}
          </h2>
          <div className="mt-4 max-h-[28rem] overflow-auto rounded-lg border">
            <Table>
              <TableHeader className="bg-mist sticky top-0">
                <TableRow>
                  {result.table.columns.map((c, i) => (
                    <TableHead key={c} className={cn('text-ink h-10 px-1.5 text-[0.72rem] font-semibold sm:px-3 sm:text-sm', i > 0 && 'text-right')}>
                      {c}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.table.rows.map((row, r) => (
                  <TableRow key={r} className={cn(r === result.table!.rows.length - 1 && 'bg-mint font-semibold')}>
                    {row.map((cell, i) => (
                      <TableCell key={i} className={cn('px-1.5 text-[0.72rem] tabular-nums sm:px-3 sm:text-sm', i > 0 && 'text-right')}>
                        {cell}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}
    </>
  )
}
