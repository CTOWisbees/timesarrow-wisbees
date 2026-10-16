'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarDays, Clock, Loader2 } from 'lucide-react'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

import { submitBooking } from './actions'
import { type BookCallProps, BookedCard, ChipGroup, ContactFields, useUpcomingDays } from './book-call-form'
import { type ContactInput, contactSchema } from './schema'

/**
 * One-step booking: details and the preferred day and time are sent together.
 * - "one-step": details, then an optional day and time as chips.
 * - "slot-first" (shown as "Calendar tiles"): details, then required calendar-style
 *   day tiles and a grid of time slots.
 */
export function BookCallOneStep({ layout, ...props }: BookCallProps & { layout: 'one-step' | 'slot-first' }) {
  const ids = useId()
  const days = useUpcomingDays()
  const [day, setDay] = useState<string>()
  const [time, setTime] = useState<string>()
  const [slotError, setSlotError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [booked, setBooked] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { fullName: '', email: '', mobile: '', website: '' },
  })

  // Choosing a day or time clears the "pick a slot" message.
  const pickDay = (v: string) => (setDay(v), setSlotError(null))
  const pickTime = (v: string) => (setTime(v), setSlotError(null))
  const hasPicker = props.showSlotPicker && props.timeSlots.length > 0
  const tiles = layout === 'slot-first' && hasPicker
  const slot = day && time ? `${day}, ${time}` : null
  const dayIcon = props.icons.includes('day') ? CalendarDays : undefined
  const timeIcon = props.icons.includes('time') ? Clock : undefined

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    setSlotError(null)
    if ((tiles && !slot) || Boolean(day) !== Boolean(time)) {
      setSlotError(tiles ? 'Pick a day and a time for your call' : 'Pick both a day and a time, or clear your choice')
      document.getElementById(`${ids}-picker`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return
    }
    const result = await submitBooking({ ...values, preferredDay: day, preferredTime: time })
    if (result.ok) return setBooked(slot ?? '')
    setServerError(result.error)
    for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
      setError(field as keyof ContactInput, { message })
    }
  })

  if (booked !== null) return <BookedCard title={props.successTitle} message={props.successMessage} slot={booked || undefined} />

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <ContactFields ids={ids} icons={props.icons} errors={errors} register={register} />

      {hasPicker && (
        <div id={`${ids}-picker`} className="scroll-mt-24 border-t pt-6">
          {tiles ? (
            <TilesPicker days={days} times={props.timeSlots} day={day} time={time} onDay={pickDay} onTime={pickTime} dayIcon={dayIcon} timeIcon={timeIcon} />
          ) : (
            <div className="space-y-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-ink text-sm font-semibold">
                  {props.slotStepTitle} <span className="text-muted-foreground font-normal">(optional)</span>
                </p>
                {(day || time) && (
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-sm"
                    onClick={() => (setDay(undefined), setTime(undefined), setSlotError(null))}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <ChipGroup label="Day" icon={dayIcon} options={days} value={day} onChange={pickDay} />
              <ChipGroup label="Time" icon={timeIcon} options={props.timeSlots} value={time} onChange={pickTime} />
            </div>
          )}
          {slotError && <p className="text-destructive mt-3 text-sm">{slotError}</p>}
        </div>
      )}

      {/* Honeypot: hidden from people and assistive tech, tempting to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" {...register('website')} />
        </label>
      </div>

      {serverError && (
        <Alert variant="destructive">
          <AlertDescription className="text-destructive">{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <p id={`${ids}-consent`} className="text-ink-soft text-sm leading-relaxed">
          {props.consentText}
        </p>
        <Button type="submit" size="cta" className="w-full" disabled={isSubmitting} aria-describedby={`${ids}-consent`}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {slot ? `Book ${slot}` : props.submitLabel}
        </Button>
      </div>
    </form>
  )
}

/** Calendar-style day tiles and a grid of time slots ("Calendar tiles" layout). */
function TilesPicker({
  days,
  times,
  day,
  time,
  onDay,
  onTime,
  dayIcon: DayIcon,
  timeIcon: TimeIcon,
}: {
  days: string[]
  times: string[]
  day?: string
  time?: string
  onDay: (v: string) => void
  onTime: (v: string) => void
  dayIcon?: typeof CalendarDays
  timeIcon?: typeof Clock
}) {
  const dayLabel = useId()
  const timeLabel = useId()
  const tile =
    'data-[state=on]:bg-primary data-[state=on]:border-primary data-[state=on]:text-white h-auto rounded-xl border bg-card text-ink hover:border-primary/60 hover:bg-mint/50'
  return (
    <div className="space-y-5">
      <div>
        <p id={dayLabel} className="text-ink mb-2.5 flex items-center gap-2 text-sm font-semibold">
          {DayIcon && <DayIcon className="text-primary size-4" aria-hidden />}
          Pick a day
        </p>
        <ToggleGroup type="single" aria-labelledby={dayLabel} value={day ?? ''} onValueChange={(v) => v && onDay(v)} spacing={2} className="grid w-full grid-cols-5 gap-2">
          {days.map((d) => {
            const [weekday, date, month] = d.split(' ')
            return (
              <ToggleGroupItem key={d} value={d} aria-label={d} className={cn(tile, 'flex-col gap-0 px-1 py-2.5')}>
                <span className="text-[0.7rem] font-medium opacity-75">{weekday}</span>
                <span className="font-heading text-xl leading-tight font-semibold tabular-nums">{date}</span>
                <span className="text-[0.7rem] opacity-75">{month}</span>
              </ToggleGroupItem>
            )
          })}
        </ToggleGroup>
      </div>
      <div>
        <p id={timeLabel} className="text-ink mb-2.5 flex items-center gap-2 text-sm font-semibold">
          {TimeIcon && <TimeIcon className="text-primary size-4" aria-hidden />}
          Pick a time
        </p>
        <ToggleGroup
          type="single"
          aria-labelledby={timeLabel}
          value={time ?? ''}
          onValueChange={(v) => v && onTime(v)}
          spacing={2}
          className="grid w-full grid-cols-3 gap-2 sm:grid-cols-5"
        >
          {times.map((t) => (
            <ToggleGroupItem key={t} value={t} className={cn(tile, 'h-10 px-1.5 text-sm font-medium tabular-nums')}>
              {t}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  )
}
