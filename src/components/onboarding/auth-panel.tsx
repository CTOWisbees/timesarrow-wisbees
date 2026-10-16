'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useId, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type LogInInput, logInSchema, type SignUpInput, signUpSchema } from '@/lib/onboarding'
import { createClient } from '@/lib/supabase/client'
import { supabaseConfigured } from '@/lib/supabase/env'
import { authErrorMessage, type AuthMode } from '@/lib/supabase/errors'
import type { Onboarding } from '@/payload-types'

import { devSignIn } from './dev-actions'
import { nextFromLocation } from '@/lib/next-path'

import { ErrorAlert, Field, PhoneInput } from './fields'
import { VerifyCode } from './verify-code'

type Copy = Onboarding['account'] & Pick<Onboarding['verify'], 'verifyTitle' | 'verifyDescription'>
type Sent = { email: string; mode: AuthMode; meta?: Record<string, string> }

const callbackUrl = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextFromLocation())}`

async function sendCode({ email, mode, meta }: Sent) {
  const { error } = await createClient().auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: mode === 'signup',
      // Stored on the Auth user and copied into the application on first visit.
      data: mode === 'signup' ? meta : undefined,
      // Used when the email carries a sign-in link instead of (or as well as) the code.
      emailRedirectTo: callbackUrl(),
    },
  })
  return error ? authErrorMessage(error, mode) : null
}

/**
 * Step 1: one form. New visitors give name, email and (optionally) phone; returning
 * ones switch to email only. Both get a 6-digit code by email; Google is the
 * secondary route underneath. After sending, the code entry replaces the form, so
 * the email address never travels in a URL.
 */
export function AuthPanel({
  copy,
  initialError,
  devBypass = false,
  demo = false,
}: {
  copy: Copy
  initialError?: string
  /** Local demos only: sign in without sending the email code. */
  devBypass?: boolean
  /** Local demos only: no auth at all, submitting goes to step 2. */
  demo?: boolean
}) {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('signup')
  const [sent, setSent] = useState<Sent | null>(null)

  if (!supabaseConfigured && !demo) {
    return (
      <ErrorAlert>
        Sign-in is not set up yet: add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to the environment.
      </ErrorAlert>
    )
  }

  if (sent) {
    return (
      <VerifyCode
        email={sent.email}
        title={copy.verifyTitle}
        description={copy.verifyDescription}
        onResend={() => sendCode(sent)}
        onChangeEmail={() => setSent(null)}
      />
    )
  }

  const signingUp = mode === 'signup'
  const description = signingUp ? copy.signUpDescription : copy.logInDescription
  return (
    <div>
      <h2 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.015em] sm:text-[2rem]">
        {signingUp ? copy.signUpTitle : copy.logInTitle}
      </h2>
      {description && <p className="text-ink-soft mt-2 text-[0.95rem] leading-relaxed short:hidden">{description}</p>}


      <div className="mt-7 short:mt-5">
        {signingUp ? (
          <SignUpForm consentText={copy.consentText} initialError={initialError} devBypass={devBypass} onSent={demo && !devBypass ? () => router.push(nextFromLocation() === '/onboarding' ? '/onboarding?step=2' : nextFromLocation()) : setSent} demo={demo && !devBypass} />
        ) : (
          <LogInForm devBypass={devBypass} demo={demo && !devBypass} onSent={demo && !devBypass ? () => router.push(nextFromLocation() === '/onboarding' ? '/onboarding?step=2' : nextFromLocation()) : setSent} />
        )}
      </div>

      <p className="text-ink-soft mt-5 text-center text-sm short:mt-3">
        {signingUp ? 'Already have an account?' : 'New to WisBees?'}{' '}
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-sm font-semibold"
          onClick={() => setMode(signingUp ? 'login' : 'signup')}
        >
          {signingUp ? 'Log in' : 'Create an account'}
        </Button>
      </p>

      <div className="text-muted-foreground mt-7 flex items-center gap-3 text-xs short:mt-4">
        <span className="bg-border h-px flex-1" aria-hidden />
        or
        <span className="bg-border h-px flex-1" aria-hidden />
      </div>
      <GoogleButton demo={demo && !devBypass} />
    </div>
  )
}

/** Demo-mode submit: sign in on the server, then carry on to the profile. */
function useDevSignIn() {
  const router = useRouter()
  return async (input: Parameters<typeof devSignIn>[0]) => {
    const result = await devSignIn(input)
    if (!result.ok) return result.error
    router.replace(nextFromLocation())
    router.refresh()
    return null
  }
}

function SignUpForm({
  consentText,
  initialError,
  devBypass,
  demo,
  onSent,
}: {
  consentText: string
  initialError?: string
  devBypass: boolean
  demo: boolean
  onSent: (sent: Sent) => void
}) {
  const ids = useId()
  const signInNow = useDevSignIn()
  const [serverError, setServerError] = useState<string | null>(initialError ?? null)
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: '', email: '', phone: '' },
  })

  const onSubmit = handleSubmit(async (raw) => {
    setServerError(null)
    const values = signUpSchema.parse(raw)
    if (demo) return onSent({ email: values.email, mode: 'signup' })
    if (devBypass) {
      const error = await signInNow({ mode: 'signup', ...raw })
      return error ? setServerError(error) : undefined
    }
    const request: Sent = {
      email: values.email,
      mode: 'signup',
      meta: { full_name: values.fullName, phone: values.phone, consent_at: new Date().toISOString() },
    }
    const error = await sendCode(request)
    if (error) return setServerError(error)
    onSent(request)
  })

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 short:gap-3">
      <Field id={`${ids}-name`} label="Full name" error={errors.fullName?.message}>
        <Input autoComplete="name" {...register('fullName')} />
      </Field>
      <Field id={`${ids}-email`} label="Email" error={errors.email?.message}>
        <Input type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />
      </Field>
      <Field id={`${ids}-phone`} label="Phone" optional error={errors.phone?.message}>
        <PhoneInput {...register('phone')} />
      </Field>

      <div className="mt-1 space-y-1.5">
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
                aria-describedby={errors.consent ? `${ids}-consent-error` : undefined}
                className="mt-0.5"
              />
            )}
          />
          <Label htmlFor={`${ids}-consent`} className="text-ink-soft text-[0.8125rem] leading-snug font-normal">
            {consentText}
          </Label>
        </div>
        {errors.consent && (
          <p id={`${ids}-consent-error`} className="text-destructive pl-7 text-sm">
            {errors.consent.message}
          </p>
        )}
      </div>

      {serverError && <ErrorAlert>{serverError}</ErrorAlert>}

      <SubmitButton pending={isSubmitting} />
    </form>
  )
}

function LogInForm({ devBypass, demo, onSent }: { devBypass: boolean; demo: boolean; onSent: (sent: Sent) => void }) {
  const ids = useId()
  const signInNow = useDevSignIn()
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LogInInput>({ resolver: zodResolver(logInSchema), defaultValues: { email: '' } })

  const onSubmit = handleSubmit(async (raw) => {
    setServerError(null)
    const request: Sent = { email: logInSchema.parse(raw).email, mode: 'login' }
    if (demo) return onSent(request)
    if (devBypass) {
      const error = await signInNow({ mode: 'login', email: request.email })
      return error ? setServerError(error) : undefined
    }
    const error = await sendCode(request)
    if (error) return setServerError(error)
    onSent(request)
  })

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <Field id={`${ids}-email`} label="Email" error={errors.email?.message}>
        <Input type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" autoFocus {...register('email')} />
      </Field>
      {serverError && <ErrorAlert>{serverError}</ErrorAlert>}
      <SubmitButton pending={isSubmitting} />
    </form>
  )
}

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <Button type="submit" size="cta" className="group mt-1 w-full" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      Email me a code
      {!pending && <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />}
    </Button>
  )
}

function GoogleButton({ demo }: { demo: boolean }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signIn = async () => {
    if (demo) return router.push(nextFromLocation() === '/onboarding' ? '/onboarding?step=2' : nextFromLocation())
    setPending(true)
    setError(null)
    const { error } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl() },
    })
    // On success the browser is already on its way to Google.
    if (error) {
      setPending(false)
      setError(authErrorMessage(error))
    }
  }

  return (
    <div className="mt-5 space-y-3 short:mt-3">
      <Button type="button" variant="outline" size="cta" className="bg-card w-full" onClick={signIn} disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <GoogleMark />}
        Continue with Google
      </Button>
      {error && <ErrorAlert>{error}</ErrorAlert>}
    </div>
  )
}

/** Google's "G" mark, as required on Google sign-in buttons. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-[1.125rem]" aria-hidden>
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.27v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.28 14.29A7.2 7.2 0 0 1 4.9 12c0-.8.14-1.57.38-2.29v-3.1H1.27a12 12 0 0 0 0 10.78l4.01-3.1Z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.94 11.94 0 0 0 12 0 12 12 0 0 0 1.27 6.61l4.01 3.1C6.22 6.88 8.87 4.77 12 4.77Z" />
    </svg>
  )
}
