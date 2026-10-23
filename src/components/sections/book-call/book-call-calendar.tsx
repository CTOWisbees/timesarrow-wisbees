'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarDays, Clock, Loader2 } from 'lucide-react'
import { useId, useMemo, useState, useSyncExternalStore } from 'react'
import { useForm } from 'react-hook-form'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { istNow, slotTimes, upcomingSlotDays } from '@/lib/booking-slots'
import { cn } from '@/lib/utils'

import { submitBooking } from './actions'
import { type BookCallProps, BookedCard, ContactFields } from './book-call-form'
import { type ContactInput, contactSchema } from './schema'

/** How often the offered days and times are refreshed against the clock. */
const TICK_MS = 10_000
const subscribe = (onTick: () => void) => {
  const timer = window.setInterval(onTick, TICK_MS)
  return () => window.clearInterval(timer)
}
const clock = () => Math.floor(Date.now() / TICK_MS) * TICK_MS

/** The current time, ticking; null on the server, because the slots depend on the visitor's moment. */
function useNow() {
  const ms = useSyncExternalStore(subscribe, clock, () => null)
  return useMemo(() => (ms === null ? null : new Date(ms)), [ms])
}

/**
 * "Talk to an expert" form with calendar tiles: contact details, then the next bookable days and
 * the times left on the chosen day. What is offered follows the current Indian time and refreshes
 * while the page is open, so a time that has just passed disappears. The details and the exact
 * slot are saved to the `bookings` table by a server action that re-checks the slot.
 */
export function BookCallCalendar(props: BookCallProps) {
  const ids = useId()
  const times = props.timeSlots
  const now = useNow()
  const [picked, setPicked] = useState<{ date?: string; time?: string }>({})
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

  const days = useMemo(() => (now ? upcomingSlotDays(times, now) : []), [now, times])
  const today = now ? istNow(now).date : null
  // The first day is preselected; a choice that is no longer offered falls back to it.
  const date = days.find((d) => d.date === picked.date)?.date ?? days[0]?.date
  const options = useMemo(() => (now && date ? slotTimes(times, date, now) : []), [now, date, times])
  const time = options.find((o) => o.label === picked.time && o.available)?.label
  const day = days.find((d) => d.date === date)
  const slot = day && time ? `${day.label}, ${time} IST` : null

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    setSlotError(null)
    if (!date || !time) {
      setSlotError('Pick a day and a time for your call')
      document.getElementById(`${ids}-picker`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return
    }
    const result = await submitBooking({ ...values, preferredDate: date, preferredTime: time })
    if (result.ok) return setBooked(slot ?? '')
    setServerError(result.error)
    for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
      if (field === 'preferredTime' || field === 'preferredDate') setSlotError(message)
      else setError(field as keyof ContactInput, { message })
    }
  })

  if (booked !== null) return <BookedCard title={props.successTitle} message={props.successMessage} slot={booked || undefined} />

  const dayIcon = props.icons.includes('day') ? CalendarDays : undefined
  const timeIcon = props.icons.includes('time') ? Clock : undefined
  const tile = 'data-[state=on]:bg-primary data-[state=on]:border-primary data-[state=on]:text-white h-auto rounded-xl border bg-card text-ink hover:border-primary/60 hover:bg-mint/50'

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <ContactFields ids={ids} icons={props.icons} errors={errors} register={register} />

      <div id={`${ids}-picker`} className="scroll-mt-24 space-y-5 border-t pt-6">
        {!now ? (
          <p className="text-muted-foreground text-sm" role="status">
            Loading available times…
          </p>
        ) : days.length === 0 ? (
          <p className="text-ink-soft text-sm">No call times are open right now. Send your details and we will call you at the earliest available time.</p>
        ) : (
          <>
            <div>
              <p id={`${ids}-day`} className="text-ink mb-2.5 flex items-center gap-2 text-sm font-semibold">
                {dayIcon && <CalendarDays className="text-primary size-4" aria-hidden />}
                Pick a day
              </p>
              <ToggleGroup
                type="single"
                aria-labelledby={`${ids}-day`}
                value={date ?? ''}
                onValueChange={(v) => v && (setPicked({ date: v }), setSlotError(null))}
                spacing={2}
                className="grid w-full grid-cols-5 gap-2"
              >
                {days.map((d) => (
                  <ToggleGroupItem key={d.date} value={d.date} aria-label={d.label} className={cn(tile, 'flex-col gap-0 px-1 py-2.5')}>
                    <span className="text-[0.7rem] font-medium opacity-75">{d.date === today ? 'Today' : d.weekday}</span>
                    <span className="font-heading text-xl leading-tight font-semibold tabular-nums">{d.day}</span>
                    <span className="text-[0.7rem] opacity-75">{d.month}</span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <div>
              <p id={`${ids}-time`} className="text-ink mb-2.5 flex items-center gap-2 text-sm font-semibold">
                {timeIcon && <Clock className="text-primary size-4" aria-hidden />}
                Pick a time <span className="text-muted-foreground font-normal">(Indian time)</span>
              </p>
              <ToggleGroup
                type="single"
                aria-labelledby={`${ids}-time`}
                value={time ?? ''}
                onValueChange={(v) => v && (setPicked({ date, time: v }), setSlotError(null))}
                spacing={2}
                className="grid w-full grid-cols-3 gap-2 sm:grid-cols-5"
              >
                {options.map((o) => (
                  <ToggleGroupItem
                    key={o.label}
                    value={o.label}
                    disabled={!o.available}
                    className={cn(tile, 'h-10 px-1.5 text-sm font-medium tabular-nums disabled:text-muted-foreground disabled:bg-mist disabled:line-through disabled:opacity-60')}
                  >
                    {o.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </>
        )}
        {slotError && (
          <p role="alert" className="text-destructive text-sm">
            {slotError}
          </p>
        )}
      </div>

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
        <Button type="submit" size="cta" className="w-full" disabled={isSubmitting || !now} aria-describedby={`${ids}-consent`}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {slot ? `Book ${slot}` : props.submitLabel}
        </Button>
      </div>
    </form>
  )
}
