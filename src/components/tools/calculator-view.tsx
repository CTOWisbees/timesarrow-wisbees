'use client'

import { RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { defaultValues, getCalculator } from '@/lib/calculators/registry'
import type { Values } from '@/lib/calculators/types'

import { ChoiceFieldInput, NumberFieldInput } from './fields'
import { Breakdown, panel, Summary } from './results'

/** Inputs on the left (sticky on a wide screen), results on the right, then the charts, the working and the method. */
export function CalculatorView({ slug }: { slug: string }) {
  const def = getCalculator(slug)!
  const [values, setValues] = useState<Values>(() => defaultValues(def))
  const result = useMemo(() => def.compute(values), [def, values])
  const worked = useMemo(() => def.worked(values), [def, values])

  const set = (id: string, v: number | string) => setValues((prev) => ({ ...prev, [id]: v }))
  const changed = def.fields.some((f) => values[f.id] !== f.default)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)]">
        <section className={`${panel} lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]`} aria-label="Inputs">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Your numbers</h2>
            <Button type="button" variant="ghost" size="sm" disabled={!changed} onClick={() => setValues(defaultValues(def))}>
              <RotateCcw className="size-4" aria-hidden />
              Reset
            </Button>
          </div>
          <div className="mt-6 flex flex-col gap-8">
            {def.fields
              .filter((f) => !f.showIf || f.showIf(values))
              .map((f) =>
                f.kind === 'number' ? (
                  <NumberFieldInput key={f.id} field={f} value={Number(values[f.id])} onChange={(n) => set(f.id, n)} />
                ) : (
                  <ChoiceFieldInput key={f.id} field={f} value={String(values[f.id])} onChange={(v) => set(f.id, v)} />
                ),
              )}
          </div>
        </section>

        <section className={panel} aria-label="Results" aria-live="polite">
          <Summary result={result} />
        </section>
      </div>

      <Breakdown result={result} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={panel} aria-labelledby="working-title">
          <h2 id="working-title" className="text-xl font-semibold">
            Your numbers, worked out
          </h2>
          <p className="text-ink-soft mt-3 text-sm leading-relaxed">The same formula with your inputs put in, so you can check any figure by hand.</p>
          <ol className="mt-4 flex flex-col gap-2.5">
            {worked.map((line, i) => (
              <li key={i} className="bg-mist text-ink rounded-lg border px-4 py-3 font-mono text-[0.85rem] leading-relaxed break-words">
                {line}
              </li>
            ))}
          </ol>
        </section>

        <section className={panel} aria-labelledby="method-title">
          <h2 id="method-title" className="text-xl font-semibold">
            How this is calculated
          </h2>
          <p className="text-ink-soft mt-3 leading-relaxed">{def.method.intro}</p>
          <ul className="mt-4 flex flex-col gap-2.5">
            {def.method.formulas.map((f) => (
              <li key={f} className="bg-mist text-ink rounded-lg border px-4 py-3 font-mono text-[0.85rem] leading-relaxed">
                {f}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-4 text-sm">
            Figures are estimates for planning, truncated to the rupee and never rounded up. They are not a promise of returns. Actual results depend on the product, its terms, taxes and market conditions.
          </p>
        </section>
      </div>
    </div>
  )
}
