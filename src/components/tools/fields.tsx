'use client'

import { useId, useState } from 'react'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { formatInr, formatInrShort } from '@/lib/format-inr'
import type { ChoiceField, FieldFormat, NumberField } from '@/lib/calculators/types'
import { cn } from '@/lib/utils'

const labelClass = 'text-ink text-[0.95rem] font-medium'
const hintClass = 'text-muted-foreground mt-0.5 text-sm'

const affix: Record<FieldFormat, { prefix?: string; suffix?: string }> = {
  inr: { prefix: '₹' },
  percent: { suffix: '%' },
  years: { suffix: 'Yr' },
  months: { suffix: 'Mo' },
  number: {},
}

const show = (format: FieldFormat, n: number) => (format === 'inr' ? formatInr(n, { symbol: false }) : String(n))

const markLabel = (format: FieldFormat, n: number) => {
  if (format === 'inr') return `₹${formatInrShort(n)}`
  const { suffix = '' } = affix[format]
  return `${n}${suffix === '%' ? '%' : suffix ? ` ${suffix}` : ''}`
}

/** A slider with an editable value box: type an exact figure or drag. */
export function NumberFieldInput({ field, value, onChange }: { field: NumberField; value: number; onChange: (n: number) => void }) {
  const id = useId()
  const [draft, setDraft] = useState(show(field.format, value))
  const [focused, setFocused] = useState(false)
  const { prefix, suffix } = affix[field.format]

  // While typing, show the draft; otherwise follow slider moves and resets.
  const text = focused ? draft : show(field.format, value)

  const clamp = (n: number) => Math.min(field.max, Math.max(field.min, n))

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <label htmlFor={id} className={labelClass}>
            {field.label}
          </label>
          {field.hint && <p className={hintClass}>{field.hint}</p>}
        </div>
        <div className="border-input bg-card focus-within:border-ring focus-within:ring-ring/40 flex h-11 w-40 shrink-0 items-center gap-1 rounded-lg border px-3 transition-colors focus-within:ring-3 sm:w-44">
          {prefix && <span className="text-muted-foreground text-sm">{prefix}</span>}
          <input
            id={id}
            inputMode="decimal"
            autoComplete="off"
            value={text}
            onFocus={(e) => {
              setDraft(show(field.format, value))
              setFocused(true)
              e.currentTarget.select()
            }}
            onChange={(e) => {
              const text = e.target.value.replace(/[^\d.]/g, '')
              setDraft(text)
              const parsed = Number(text)
              if (text !== '' && text !== '.' && Number.isFinite(parsed) && parsed >= field.min && parsed <= field.max) onChange(parsed)
            }}
            onBlur={() => {
              setFocused(false)
              const parsed = Number(draft.replace(/[^\d.]/g, ''))
              const next = draft === '' || !Number.isFinite(parsed) ? value : clamp(parsed)
              onChange(next)
            }}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            className="text-primary font-heading h-full min-w-0 flex-1 bg-transparent text-right text-lg font-semibold tabular-nums outline-none"
          />
          {suffix && <span className="text-muted-foreground text-sm">{suffix}</span>}
        </div>
      </div>
      <Slider
        className="mt-4"
        min={field.min}
        max={field.max}
        step={field.step}
        value={[Math.min(Math.max(value, field.min), field.max)]}
        onValueChange={([n]) => onChange(n)}
        aria-label={field.label}
      />
      <div className="text-muted-foreground mt-2 flex justify-between text-xs" aria-hidden>
        <span>{markLabel(field.format, field.min)}</span>
        <span>{markLabel(field.format, field.max)}</span>
      </div>
    </div>
  )
}

export function ChoiceFieldInput({ field, value, onChange }: { field: ChoiceField; value: string; onChange: (v: string) => void }) {
  const id = useId()
  return (
    <div>
      <p id={id} className={labelClass}>
        {field.label}
      </p>
      {field.hint && <p className={hintClass}>{field.hint}</p>}
      {field.variant === 'toggle' ? (
        <ToggleGroup
          type="single"
          aria-labelledby={id}
          value={value}
          onValueChange={(v) => v && onChange(v)}
          spacing={2}
          className="mt-3 flex w-full flex-wrap gap-2"
        >
          {field.options.map((o) => (
            <ToggleGroupItem
              key={o.value}
              value={o.value}
              variant="outline"
              className={cn(
                'data-[state=on]:bg-primary data-[state=on]:border-primary h-11 min-w-0 flex-1 basis-[5.5rem] rounded-lg px-3 text-sm font-medium data-[state=on]:text-white',
              )}
            >
              {o.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      ) : (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger aria-labelledby={id} className="bg-card text-primary hover:border-primary mt-3 w-full rounded-lg font-medium data-[size=default]:h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" collisionPadding={16} className="min-w-(--radix-select-trigger-width)">
            {field.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
