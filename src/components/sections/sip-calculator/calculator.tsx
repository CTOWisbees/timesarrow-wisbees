'use client'

import { useId, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { formatInr, formatInrCompact, formatInrShort } from '@/lib/format-inr'
import { projectSip } from '@/lib/sip'
import type { HomePage } from '@/payload-types'

import { GrowthChart } from './growth-chart'

const labelClass = 'text-ink text-base font-medium'
const hintClass = 'text-muted-foreground mt-0.5 text-sm'
const valueClass = 'font-heading text-primary text-2xl font-semibold tabular-nums'

export function SipCalculator({ data }: { data: HomePage['calculator'] }) {
  const ids = { amount: useId(), risk: useId(), horizon: useId() }
  const bands = data.riskBands?.length ? data.riskBands : [{ label: 'Moderate', annualReturn: 12 }]
  const horizons = data.horizons?.length ? data.horizons.map((h) => h.years) : [20]
  const stepUp = data.stepUpPercent ?? 0
  const showRates = data.showReturnAssumptions !== false

  const [amount, setAmount] = useState(data.defaultAmount)
  const [bandIndex, setBandIndex] = useState(Math.max(0, bands.findIndex((b) => 'isDefault' in b && b.isDefault)))
  const [years, setYears] = useState(
    horizons.includes(data.defaultHorizon ?? 0) ? data.defaultHorizon! : horizons[horizons.length - 1],
  )

  const band = bands[bandIndex]
  const result = useMemo(
    () => projectSip({ monthlyAmount: amount, annualReturn: band.annualReturn, years, stepUpPercent: stepUp }),
    [amount, band.annualReturn, years, stepUp],
  )
  const range = data.maxAmount - data.minAmount

  return (
    <section id="sip-calculator" className="bg-card py-16 md:py-24" aria-labelledby="calculator-title">
      <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-8 lg:grid-cols-[minmax(0,30rem)_1fr] lg:gap-16">
        <div className="flex flex-col">
          <h2 id="calculator-title" className="text-4xl leading-tight font-semibold tracking-tight lg:text-5xl">
            {data.title}
          </h2>

          <div className="mt-10 flex flex-1 flex-col justify-between gap-10">
            <div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <label htmlFor={ids.amount} className={labelClass}>
                    Monthly SIP
                  </label>
                  {stepUp > 0 && <p className={hintClass}>with a step-up of {stepUp}% annually</p>}
                </div>
                <output htmlFor={ids.amount} className={valueClass}>
                  {formatInr(amount)}
                </output>
              </div>
              <Slider
                id={ids.amount}
                className="mt-5"
                min={data.minAmount}
                max={data.maxAmount}
                step={data.step}
                value={[amount]}
                onValueChange={([v]) => setAmount(v)}
                aria-label="Monthly SIP amount"
              />
              {data.sliderMarks && data.sliderMarks.length > 0 && (
                <div className="text-muted-foreground relative mt-3 h-4 text-xs" aria-hidden>
                  {data.sliderMarks.map((mark) => (
                    <Button
                      key={mark.id ?? mark.value}
                      type="button"
                      variant="ghost"
                      size="xs"
                      tabIndex={-1}
                      onClick={() => setAmount(mark.value)}
                      className="text-muted-foreground hover:text-primary absolute h-auto px-0 py-0 text-xs font-normal hover:bg-transparent"
                      style={{
                        left: `${((mark.value - data.minAmount) / range) * 100}%`,
                        // Keep the end labels inside the track.
                        transform: `translateX(-${mark.value >= data.maxAmount ? 100 : mark.value <= data.minAmount ? 0 : 50}%)`,
                      }}
                    >
                      {formatInrShort(mark.value)}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p id={ids.risk} className={labelClass}>
                    Risk appetite
                  </p>
                  {showRates && <p className={hintClass}>assumed yearly return</p>}
                </div>
                {showRates && <p className={valueClass}>{band.annualReturn}%</p>}
              </div>
              <ToggleGroup
                type="single"
                aria-labelledby={ids.risk}
                value={String(bandIndex)}
                onValueChange={(v) => v && setBandIndex(Number(v))}
                className="mt-4 grid w-full grid-cols-3 gap-2.5"
                spacing={2}
              >
                {bands.map((b, i) => (
                  <ToggleGroupItem
                    key={b.label}
                    value={String(i)}
                    variant="outline"
                    className="data-[state=on]:bg-primary data-[state=on]:border-primary h-auto min-w-0 flex-col gap-0.5 rounded-lg px-2 py-2.5 text-sm font-medium data-[state=on]:text-white lg:h-12 lg:flex-row lg:gap-1.5"
                  >
                    <span>{b.label}</span>
                    {showRates && <span className="text-xs opacity-80 lg:text-sm lg:opacity-100">{b.annualReturn}%</span>}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label htmlFor={ids.horizon} className={labelClass}>
                Time horizon
              </label>
              <Select value={String(years)} onValueChange={(v) => setYears(Number(v))}>
                <SelectTrigger id={ids.horizon} className="bg-card text-primary hover:border-primary font-heading w-36 rounded-lg text-xl font-semibold data-[size=default]:h-12 [&_svg]:text-primary!">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" align="end" collisionPadding={16} className="min-w-(--radix-select-trigger-width)">
                  {horizons.map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {h} Years
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col">
          <GrowthChart data={result.yearly} />

          <dl className="mt-8 grid grid-cols-3 gap-4 border-t pt-6">
            <Stat label="Total invested" value={formatInrCompact(result.invested)} />
            <Stat label="Total value" value={formatInrCompact(result.value)} strong />
            <Stat label="Growth on your money" value={`+${Math.floor(result.gainPercent)}%`} accent />
          </dl>

          <Table className="sr-only">
            <TableCaption>Projected value by year</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead>Total invested</TableHead>
                <TableHead>Total value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.yearly.map((p) => (
                <TableRow key={p.year}>
                  <TableCell>{p.year}</TableCell>
                  <TableCell>{formatInr(p.invested)}</TableCell>
                  <TableCell>{formatInr(p.value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  )
}

function Stat({ label, value, strong, accent }: { label: string; value: string; strong?: boolean; accent?: boolean }) {
  return (
    <div>
      <dt className="text-ink-soft text-sm">{label}</dt>
      <dd className={`font-heading mt-1.5 text-2xl lg:text-3xl ${strong || accent ? 'text-primary font-semibold' : 'text-ink font-medium'}`}>
        {value}
      </dd>
    </div>
  )
}
