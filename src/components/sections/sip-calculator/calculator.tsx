'use client'

import Link from 'next/link'
import { useId, useMemo, useState } from 'react'

import { Disclaimer } from '@/components/shared/disclaimer'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { formatInr, formatInrCompact, formatInrShort } from '@/lib/format-inr'
import { projectSip } from '@/lib/sip'
import type { HomePage } from '@/payload-types'

import { GrowthChart } from './growth-chart'

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
      <div className="container-page grid gap-12 lg:grid-cols-[minmax(0,30rem)_1fr] lg:gap-16">
        <div>
          <h2 id="calculator-title" className="text-4xl leading-tight font-semibold tracking-tight md:text-5xl">
            {data.title}
          </h2>

          <div className="mt-10 space-y-9">
            <div>
              <div className="flex items-baseline justify-between gap-4">
                <label htmlFor={ids.amount} className="text-ink-soft text-sm">
                  Monthly SIP
                  {stepUp > 0 && (
                    <span className="text-muted-foreground ml-2 text-xs">with a step-up of {stepUp}% annually</span>
                  )}
                </label>
                <output htmlFor={ids.amount} className="font-heading text-primary text-2xl font-semibold">
                  {formatInr(amount)}
                </output>
              </div>
              <Slider
                id={ids.amount}
                className="mt-4"
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
                    <button
                      key={mark.id ?? mark.value}
                      type="button"
                      tabIndex={-1}
                      onClick={() => setAmount(mark.value)}
                      className="hover:text-primary absolute"
                      style={{
                        left: `${((mark.value - data.minAmount) / range) * 100}%`,
                        // Keep the end labels inside the track.
                        transform: `translateX(-${mark.value >= data.maxAmount ? 100 : mark.value <= data.minAmount ? 0 : 50}%)`,
                      }}
                    >
                      {formatInrShort(mark.value)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-baseline justify-between gap-4">
                <p id={ids.risk} className="text-ink-soft text-sm">
                  Risk appetite{showRates && ' (assumed yearly return)'}
                </p>
                {showRates && (
                  <p className="font-heading text-primary text-2xl font-semibold">{band.annualReturn}%</p>
                )}
              </div>
              <ToggleGroup
                type="single"
                aria-labelledby={ids.risk}
                value={String(bandIndex)}
                onValueChange={(v) => v && setBandIndex(Number(v))}
                className="mt-3 flex flex-wrap justify-start gap-2"
                spacing={2}
              >
                {bands.map((b, i) => (
                  <ToggleGroupItem
                    key={b.label}
                    value={String(i)}
                    variant="outline"
                    className="data-[state=on]:bg-primary data-[state=on]:border-primary h-10 rounded-lg px-4 text-sm data-[state=on]:text-white"
                  >
                    {b.label}
                    {showRates && ` ${b.annualReturn}%`}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label htmlFor={ids.horizon} className="text-ink-soft text-sm">
                Time horizon
              </label>
              <Select value={String(years)} onValueChange={(v) => setYears(Number(v))}>
                <SelectTrigger id={ids.horizon} className="bg-primary hover:bg-brand-green-strong w-36 rounded-lg border-0 font-heading text-base font-semibold text-white data-[size=default]:h-11 [&_svg]:text-white!">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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

          <table className="sr-only">
            <caption>Projected value by year</caption>
            <thead>
              <tr><th>Year</th><th>Total invested</th><th>Total value</th></tr>
            </thead>
            <tbody>
              {result.yearly.map((p) => (
                <tr key={p.year}><td>{p.year}</td><td>{formatInr(p.invested)}</td><td>{formatInr(p.value)}</td></tr>
              ))}
            </tbody>
          </table>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Disclaimer className="max-w-xl">{data.disclaimer}</Disclaimer>
            <Button asChild size="cta" className="shrink-0">
              <Link href="#book-call">Talk to an expert</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function Stat({ label, value, strong, accent }: { label: string; value: string; strong?: boolean; accent?: boolean }) {
  return (
    <div>
      <dt className={strong ? 'text-primary text-xs font-semibold' : accent ? 'text-primary text-xs' : 'text-ink-soft text-xs'}>
        {label}
      </dt>
      <dd className={`font-heading mt-1 text-2xl md:text-3xl ${strong || accent ? 'text-primary font-semibold' : 'text-ink-soft'}`}>
        {value}
      </dd>
    </div>
  )
}
