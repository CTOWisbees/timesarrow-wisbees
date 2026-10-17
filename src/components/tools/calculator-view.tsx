'use client'

import { useMemo, useState } from 'react'

import { defaultValues, getCalculator } from '@/lib/calculators/registry'
import type { Values } from '@/lib/calculators/types'

import { ChoiceFieldInput, NumberFieldInput } from './fields'
import { Breakdown, panel, Summary } from './results'
import { XirrView } from './xirr-view'

/** Inputs on the left, results on the right, charts and tables underneath. */
export function CalculatorView({ slug }: { slug: string }) {
  const def = getCalculator(slug)!
  const [values, setValues] = useState<Values>(() => defaultValues(def))
  const result = useMemo(() => (def.custom ? null : def.compute(values)), [def, values])

  if (def.custom === 'xirr') return <XirrView />

  const set = (id: string, v: number | string) => setValues((prev) => ({ ...prev, [id]: v }))

  return (
    <div className="flex flex-col gap-6">
      <section className={panel} aria-label="Inputs">
        <div className="grid gap-x-12 gap-y-8 md:grid-cols-2">
          {def.fields
            .filter((f) => !f.showIf || f.showIf(values))
            .map((f) => (
              <div key={f.id} className={f.kind === 'choice' && f.options.length > 3 ? 'md:col-span-2' : undefined}>
                {f.kind === 'number' ? (
                  <NumberFieldInput field={f} value={Number(values[f.id])} onChange={(n) => set(f.id, n)} />
                ) : (
                  <ChoiceFieldInput field={f} value={String(values[f.id])} onChange={(v) => set(f.id, v)} />
                )}
              </div>
            ))}
        </div>
      </section>
      {result && (
        <section className={panel} aria-label="Results">
          <Summary result={result} />
        </section>
      )}
      {result && <Breakdown result={result} />}
    </div>
  )
}
