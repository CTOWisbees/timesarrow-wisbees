'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useId, useMemo, useState, useSyncExternalStore } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

import { submitBooking } from './actions'
import { type BookingInput, bookingSchema } from './schema'

type Props = {
  showSlotPicker: boolean
  timeSlots: string[]
  consentText: string
  submitLabel: string
  successTitle: string
  successMessage?: string | null
}

const dayFormat = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'Asia/Kolkata',
})

const noopSubscribe = () => () => {}

/** The next five days we take calls on (Monday to Saturday), starting tomorrow. */
function upcomingDays(count = 5) {
  const days: string[] = []
  const d = new Date()
  while (days.length < count) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0) days.push(dayFormat.format(d).replace(',', ''))
  }
  return days
}

export function BookCallForm({ showSlotPicker, timeSlots, consentText, submitLabel, successTitle, successMessage }: Props) {
  const ids = useId()
  const [serverError, setServerError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  // Dates depend on the visitor's clock, so only compute them in the browser.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false)
  const days = useMemo(() => (hydrated ? upcomingDays() : []), [hydrated])

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { firstName: '', lastName: '', mobile: '', email: '', website: '' },
  })

  const [day, time] = useWatch({ control, name: ['preferredDay', 'preferredTime'] })

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    const result = await submitBooking(values)
    if (result.ok) return setDone(true)
    setServerError(result.error)
    for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
      setError(field as keyof BookingInput, { message })
    }
  })

  if (done) {
    return (
      <div role="status" className="bg-mint flex flex-col items-start gap-3 rounded-xl p-8">
        <CheckCircle2 className="text-primary size-8" aria-hidden />
        <h3 className="text-2xl font-semibold">{successTitle}</h3>
        {successMessage && <p className="text-ink-soft">{successMessage}</p>}
      </div>
    )
  }

  const field = (name: 'firstName' | 'lastName' | 'mobile' | 'email', label: string, props: React.ComponentProps<'input'> = {}) => (
    <div className="space-y-2">
      <Label htmlFor={`${ids}-${name}`} className="text-ink text-sm font-semibold">
        {label}
      </Label>
      <Input
        id={`${ids}-${name}`}
        className="h-12 rounded-lg bg-card px-3.5 text-base"
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `${ids}-${name}-error` : undefined}
        {...props}
        {...register(name)}
      />
      {errors[name] && (
        <p id={`${ids}-${name}-error`} className="text-destructive text-sm">
          {errors[name]?.message}
        </p>
      )}
    </div>
  )

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        {field('firstName', 'First name', { autoComplete: 'given-name' })}
        {field('lastName', 'Last name', { autoComplete: 'family-name' })}
        {field('mobile', 'Mobile number', { autoComplete: 'tel-national', inputMode: 'tel', placeholder: '98765 43210' })}
        {field('email', 'Email', { autoComplete: 'email', type: 'email' })}
      </div>

      {/* Honeypot: hidden from people and assistive tech, tempting to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" {...register('website')} />
        </label>
      </div>

      {showSlotPicker && (
        <div className="space-y-5">
          <ChipGroup label="Pick a day" options={days} value={day} onChange={(v) => setValue('preferredDay', v)} />
          {timeSlots.length > 0 && (
            <ChipGroup label="Pick a time" options={timeSlots} value={time} onChange={(v) => setValue('preferredTime', v)} />
          )}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <Controller
            control={control}
            name="consent"
            render={({ field: { value, onChange } }) => (
              <Checkbox
                id={`${ids}-consent`}
                checked={value === true}
                onCheckedChange={(c) => onChange(c === true ? true : undefined)}
                aria-invalid={Boolean(errors.consent)}
                className="mt-0.5 size-5"
              />
            )}
          />
          <Label htmlFor={`${ids}-consent`} className="text-ink-soft text-sm leading-relaxed font-normal">
            {consentText}
          </Label>
        </div>
        {errors.consent && <p className="text-destructive text-sm">{errors.consent.message}</p>}
      </div>

      {serverError && (
        <p role="alert" className="text-destructive text-sm">
          {serverError}
        </p>
      )}

      <div className="flex flex-col items-center gap-2">
        <Button type="submit" size="cta" className="w-full sm:w-auto sm:min-w-60" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {day && time ? `Book ${day}, ${time}` : submitLabel}
        </Button>
      </div>
    </form>
  )
}

function ChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value?: string
  onChange: (v: string) => void
}) {
  return (
    <fieldset>
      <legend className="text-ink mb-2.5 text-sm font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
            className={cn(
              'h-10 rounded-lg border px-3.5 text-sm font-medium transition-colors',
              value === option ? 'bg-primary border-primary text-white' : 'bg-card hover:border-primary text-ink',
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
