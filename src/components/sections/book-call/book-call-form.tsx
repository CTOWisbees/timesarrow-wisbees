'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarDays, CheckCircle2, Clock, Loader2, Mail, Phone, UserRound } from 'lucide-react'
import { useId, useMemo, useState, useSyncExternalStore } from 'react'
import { useForm } from 'react-hook-form'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { BookCallIcon } from '@/lib/section-variants'
import { cn } from '@/lib/utils'

import { submitContact, submitSlot } from './actions'
import { type ContactInput, contactSchema } from './schema'

/** The icon each field can show (which ones is a CMS / presentation choice). */
export const FIELD_ICONS: Record<BookCallIcon, typeof Mail> = {
  name: UserRound,
  email: Mail,
  phone: Phone,
  day: CalendarDays,
  time: Clock,
}

export type BookCallProps = {
  /** Fields that show an icon. */
  icons: BookCallIcon[]
  showSlotPicker: boolean
  timeSlots: string[]
  consentText: string
  submitLabel: string
  slotStepTitle: string
  slotStepDescription?: string | null
  successTitle: string
  successMessage?: string | null
}

type Step = { name: 'details' } | { name: 'slot'; token: string; firstName: string } | { name: 'done' }

/**
 * Two steps in one card. Step 1 (full name, email, phone) is saved to the
 * database as soon as it is submitted, so the lead is never lost. Step 2 (day and
 * time) is optional and attaches to the same booking.
 */
export function BookCallForm(props: BookCallProps) {
  const [step, setStep] = useState<Step>({ name: 'details' })

  if (step.name === 'done') return <BookedCard title={props.successTitle} message={props.successMessage} />

  if (step.name === 'slot') {
    return (
      <SlotStep
        token={step.token}
        firstName={step.firstName}
        title={props.slotStepTitle}
        description={props.slotStepDescription}
        timeSlots={props.timeSlots}
        icons={props.icons}
        onDone={() => setStep({ name: 'done' })}
      />
    )
  }

  return (
    <DetailsStep
      {...props}
      onSaved={(token, firstName) =>
        setStep(props.showSlotPicker ? { name: 'slot', token, firstName } : { name: 'done' })
      }
    />
  )
}

/** Shown once the booking is saved. */
export function BookedCard({ title, message, slot }: { title: string; message?: string | null; slot?: string }) {
  return (
    <Alert role="status" className="bg-mint h-full content-center gap-3 border-0 p-8 text-base has-[>svg]:grid-cols-1">
      <CheckCircle2 className="text-primary size-8!" aria-hidden />
      <AlertTitle className="font-heading text-2xl font-semibold">{title}</AlertTitle>
      {slot && <p className="text-brand-green-strong text-base font-semibold">{slot}</p>}
      {message && <AlertDescription className="text-ink-soft text-base">{message}</AlertDescription>}
    </Alert>
  )
}

/** Label, input and error for one contact field, with an optional leading icon. */
export function ContactField({
  id,
  label,
  error,
  icon: Icon,
  inputProps,
}: {
  id: string
  label: string
  error?: string
  icon?: typeof Mail
  inputProps: React.ComponentProps<'input'>
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-ink text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        {Icon && <Icon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" aria-hidden />}
        <Input
          id={id}
          className={cn('bg-card h-11 rounded-lg px-3.5 text-[0.95rem] shadow-none', Icon && 'pl-10')}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...inputProps}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  )
}

/** Full name, then email and phone side by side from small tablets up. */
export function ContactFields({
  ids,
  icons,
  errors,
  register,
}: {
  ids: string
  icons: BookCallIcon[]
  errors: Partial<Record<'fullName' | 'email' | 'mobile', { message?: string }>>
  register: (name: 'fullName' | 'email' | 'mobile') => React.ComponentProps<'input'>
}) {
  const icon = (k: BookCallIcon) => (icons.includes(k) ? FIELD_ICONS[k] : undefined)
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <ContactField
          id={`${ids}-name`}
          label="Full name"
          icon={icon('name')}
          error={errors.fullName?.message}
          inputProps={{ autoComplete: 'name', ...register('fullName') }}
        />
      </div>
      <ContactField
        id={`${ids}-email`}
        label="Email"
        icon={icon('email')}
        error={errors.email?.message}
        inputProps={{ autoComplete: 'email', type: 'email', inputMode: 'email', ...register('email') }}
      />
      <ContactField
        id={`${ids}-mobile`}
        label="Phone number"
        icon={icon('phone')}
        error={errors.mobile?.message}
        inputProps={{ autoComplete: 'tel-national', type: 'tel', inputMode: 'tel', placeholder: '98765 43210', ...register('mobile') }}
      />
    </div>
  )
}

function StepLabel({ current, total, label }: { current: number; total: number; label: string }) {
  return (
    <p className="text-muted-foreground mb-5 text-xs font-semibold tracking-[0.12em] uppercase">
      Step {current} of {total} · {label}
    </p>
  )
}

function DetailsStep({
  icons,
  showSlotPicker,
  consentText,
  submitLabel,
  onSaved,
}: BookCallProps & { onSaved: (token: string, firstName: string) => void }) {
  const ids = useId()
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { fullName: '', email: '', mobile: '', website: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    const result = await submitContact(values)
    if (result.ok) return onSaved(result.token, values.fullName.trim().split(/\s+/)[0] ?? '')
    setServerError(result.error)
    for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
      setError(field as keyof ContactInput, { message })
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate>
      {showSlotPicker && <StepLabel current={1} total={2} label="Your details" />}
      <ContactFields ids={ids} icons={icons} errors={errors} register={register} />

      {/* Honeypot: hidden from people and assistive tech, tempting to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" {...register('website')} />
        </label>
      </div>

      {serverError && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription className="text-destructive">{serverError}</AlertDescription>
        </Alert>
      )}

      {/* Submitting is the agreement: the wording sits right above the button, and the
          exact text shown is stored with the booking. */}
      <p id={`${ids}-consent`} className="text-ink-soft mt-6 text-sm leading-relaxed">
        {consentText}
      </p>

      <div className="mt-4">
        <Button type="submit" size="cta" className="w-full" disabled={isSubmitting} aria-describedby={`${ids}-consent`}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

const dayFormat = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'Asia/Kolkata',
})

/** The next five days we take calls on (Monday to Saturday), starting tomorrow. */
export function upcomingDays(count = 5) {
  const days: string[] = []
  const d = new Date()
  while (days.length < count) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0) days.push(dayFormat.format(d).replace(',', ''))
  }
  return days
}

const noopSubscribe = () => () => {}

/** Upcoming call days, computed in the browser only (they depend on the visitor's clock). */
export function useUpcomingDays(count = 5) {
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false)
  return useMemo(() => (hydrated ? upcomingDays(count) : []), [hydrated, count])
}

function SlotStep({
  token,
  firstName,
  title,
  description,
  timeSlots,
  icons,
  onDone,
}: {
  icons: BookCallIcon[]
  token: string
  firstName: string
  title: string
  description?: string | null
  timeSlots: string[]
  onDone: () => void
}) {
  const days = useUpcomingDays()
  const [day, setDay] = useState<string>()
  const [time, setTime] = useState<string>()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirm = async () => {
    if (!day || !time) return
    setSaving(true)
    setError(null)
    const result = await submitSlot({ token, preferredDay: day, preferredTime: time })
    setSaving(false)
    if (result.ok) return onDone()
    setError(result.error)
  }

  return (
    <div>
      <StepLabel current={2} total={2} label="Optional" />
      <Alert role="status" className="bg-mint text-brand-green-strong mb-6 border-0 px-4 py-3">
        <CheckCircle2 aria-hidden />
        <AlertDescription className="text-brand-green-strong">
          Thanks{firstName ? `, ${firstName}` : ''}. We have your details and will call you soon.
        </AlertDescription>
      </Alert>

      <h3 className="font-sans text-lg font-semibold">{title}</h3>
      {description && <p className="text-ink-soft mt-1 text-sm">{description}</p>}

      <div className="mt-5 space-y-5">
        <ChipGroup label="Pick a day" icon={icons.includes('day') ? CalendarDays : undefined} options={days} value={day} onChange={setDay} />
        {timeSlots.length > 0 && (
          <ChipGroup label="Pick a time" icon={icons.includes('time') ? Clock : undefined} options={timeSlots} value={time} onChange={setTime} />
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription className="text-destructive">{error}</AlertDescription>
        </Alert>
      )}

      <div className="mt-6 flex flex-col-reverse items-center justify-center gap-3 sm:flex-row">
        <Button type="button" variant="ghost" size="cta" onClick={onDone} disabled={saving}>
          Skip, call me anytime
        </Button>
        <Button type="button" size="cta" className="w-full sm:w-auto sm:min-w-60" onClick={confirm} disabled={!day || !time || saving}>
          {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {day && time ? `Confirm ${day}, ${time}` : 'Confirm slot'}
        </Button>
      </div>
    </div>
  )
}

export function ChipGroup({
  label,
  icon: Icon,
  options,
  value,
  onChange,
}: {
  label: string
  icon?: typeof Mail
  options: string[]
  value?: string
  onChange: (v: string) => void
}) {
  const labelId = useId()
  return (
    <div>
      <p id={labelId} className="text-ink mb-2.5 flex items-center gap-2 text-sm font-medium">
        {Icon && <Icon className="text-primary size-4" aria-hidden />}
        {label}
      </p>
      <ToggleGroup
        type="single"
        aria-labelledby={labelId}
        value={value ?? ''}
        onValueChange={(v) => v && onChange(v)}
        spacing={2}
        className="flex flex-wrap justify-start gap-2"
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option}
            value={option}
            variant="outline"
            className="data-[state=on]:bg-primary data-[state=on]:border-primary h-10 rounded-lg px-3.5 text-sm font-medium data-[state=on]:text-white"
          >
            {option}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
