'use client'

import { ArrowUp, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type ReactNode, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { logInSchema, otpSchema, signUpSchema } from '@/lib/onboarding'
import { nextFromLocation } from '@/lib/next-path'
import { createClient } from '@/lib/supabase/client'
import { supabaseConfigured } from '@/lib/supabase/env'
import { authErrorMessage, type AuthMode } from '@/lib/supabase/errors'
import { cn } from '@/lib/utils'
import type { Onboarding } from '@/payload-types'

import { BotMessage, ChatLayout, chipClass, ComposerIdle, enter, Typing, UserBubble } from './chat-ui'
import { devSignIn } from './dev-actions'
import { ErrorAlert } from './fields'
import { useTranscript } from './use-transcript'

type Copy = Onboarding['account'] & Pick<Onboarding['verify'], 'verifyTitle' | 'verifyDescription'>
type Step = 'mode' | 'name' | 'email' | 'phone' | 'consent' | 'code'
type Draft = { mode: AuthMode; fullName: string; email: string; phone: string }

const RESEND_AFTER_S = 60

const callbackUrl = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextFromLocation())}`
const afterDemo = () => (nextFromLocation() === '/onboarding' ? '/onboarding?step=2' : nextFromLocation())

async function sendCode({ email, mode, meta }: { email: string; mode: AuthMode; meta?: Record<string, string> }) {
  const { error } = await createClient().auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: mode === 'signup',
      // Stored on the Auth user and copied into the application on first visit.
      data: mode === 'signup' ? meta : undefined,
      emailRedirectTo: callbackUrl(),
    },
  })
  return error ? authErrorMessage(error, mode) : null
}

/**
 * Step 1 and the code check as a chat: the adviser asks for a name, an email and an
 * optional phone number one at a time, then for the 6-digit code that was emailed.
 * Returning visitors give just their email. Replies appear as the visitor's own
 * bubbles; the address never travels in a URL.
 */
export function AccountChat({
  copy,
  initialError,
  devBypass = false,
  demo = false,
}: {
  copy: Copy
  initialError?: string
  /** Local demos only: sign in without sending the email code. */
  devBypass?: boolean
  /** Local demos only: no auth at all, finishing goes to step 2. */
  demo?: boolean
}) {
  const router = useRouter()
  const chat = useTranscript()
  const [step, setStep] = useState<Step | null>(null)
  const draft = useRef<Draft>({ mode: 'signup', fullName: '', email: '', phone: '' })
  const started = useRef(false)
  const endRef = useRef<HTMLDivElement>(null)

  const ask = async (next: Step, ...nodes: ReactNode[]) => {
    setStep(null)
    await chat.bot(...nodes)
    setStep(next)
  }

  useEffect(() => {
    if (started.current) return
    started.current = true
    void (async () => {
      if (initialError) await chat.bot(<p className="text-destructive">{initialError}</p>)
      await ask(
        'mode',
        <>
          <p className="font-heading text-ink text-lg leading-snug font-semibold">{copy.signUpTitle}</p>
          {copy.signUpDescription && <p className="text-ink-soft">{copy.signUpDescription}</p>}
        </>,
      )
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    endRef.current?.scrollIntoView({ block: 'end', behavior: reduced ? 'auto' : 'smooth' })
  }, [chat.items.length, chat.typing, step])

  if (!supabaseConfigured && !demo) {
    return <ErrorAlert>Sign-in is not set up yet: add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to the environment.</ErrorAlert>
  }

  const first = () => draft.current.fullName.split(' ')[0]

  const finish = async () => {
    setStep(null)
    const { mode, fullName, email, phone } = draft.current
    if (demo && !devBypass) {
      await chat.bot('Setting things up…')
      return router.push(afterDemo())
    }
    if (devBypass) {
      await chat.bot('Signing you in…')
      const result = await devSignIn(mode === 'signup' ? { mode, fullName, email, phone, consent: true } : { mode, email })
      if (!result.ok) return ask('email', result.error, 'What is the right email address?')
      router.replace(nextFromLocation())
      return router.refresh()
    }
    await chat.bot(
      <>
        Sending a 6-digit code to <strong className="break-all">{email}</strong>…
      </>,
    )
    const error = await sendCode({ email, mode, meta: mode === 'signup' ? { full_name: fullName, phone, consent_at: new Date().toISOString() } : undefined })
    if (error) return ask('email', error, 'Let’s try that email again.')
    await ask(
      'code',
      <>
        {copy.verifyDescription} <strong className="break-all">{email}</strong>
      </>,
    )
  }

  const chooseMode = (mode: AuthMode) => {
    draft.current.mode = mode
    chat.user(mode === 'signup' ? 'Create an account' : 'I already have an account')
    return mode === 'signup' ? ask('name', 'Lovely. What is your full name?') : ask('email', 'Welcome back. What is your email address?')
  }

  const verify = async (token: string) => {
    const { error } = await createClient().auth.verifyOtp({ email: draft.current.email, token, type: 'email' })
    if (error) return authErrorMessage(error)
    chat.user('••••••')
    setStep(null)
    await chat.bot('You are verified. Taking you to the next step…')
    router.replace(nextFromLocation())
    router.refresh()
    return null
  }

  const messages = (
    <>
      {chat.items.map((m) => (m.from === 'bot' ? <BotMessage key={m.id}>{m.node}</BotMessage> : <UserBubble key={m.id}>{m.node}</UserBubble>))}
      {chat.typing && <Typing />}
      <div ref={endRef} />
    </>
  )

  const composer = (
    <>
      {step === null && <ComposerIdle />}
      {step === 'mode' && (
        <div className={cn('flex flex-wrap justify-center gap-2.5', enter)}>
          <button type="button" className={chipClass} onClick={() => chooseMode('signup')}>
            Create an account
          </button>
          <button type="button" className={chipClass} onClick={() => chooseMode('login')}>
            I already have an account
          </button>
          <GoogleChip demo={demo && !devBypass} />
        </div>
      )}

      {step === 'name' && (
        <TextReply
          label="Your full name"
          autoComplete="name"
          validate={(v) => parse(signUpSchema.shape.fullName, v)}
          onSubmit={(v) => {
            draft.current.fullName = v
            chat.user(v)
            return ask('email', `Nice to meet you, ${first()}. What is your email address?`)
          }}
        />
      )}

      {step === 'email' && (
        <TextReply
          label="Your email address"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          validate={(v) => parse((draft.current.mode === 'signup' ? signUpSchema : logInSchema).shape.email, v)}
          onSubmit={(v) => {
            draft.current.email = v
            chat.user(v)
            if (draft.current.mode === 'login') return finish()
            return ask('phone', 'And your mobile number? It is optional, so feel free to skip.')
          }}
        />
      )}

      {step === 'phone' && (
        <TextReply
          label="Your mobile number"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="98765 43210"
          prefix="+91"
          skipLabel="Skip"
          validate={(v) => parse(signUpSchema.shape.phone, v)}
          onSkip={() => {
            draft.current.phone = ''
            chat.user('Skip')
            return ask('consent', <ConsentMessage text={copy.consentText} />)
          }}
          onSubmit={(v) => {
            draft.current.phone = v
            chat.user(v)
            return ask('consent', <ConsentMessage text={copy.consentText} />)
          }}
        />
      )}

      {step === 'consent' && (
        <div className={cn('flex justify-center', enter)}>
          <button
            type="button"
            className={cn(chipClass, 'bg-primary hover:bg-brand-green-strong border-primary text-white hover:text-white')}
            onClick={() => {
              chat.user('I agree')
              return finish()
            }}
          >
            I agree, email me a code
          </button>
        </div>
      )}

      {step === 'code' && (
        <CodeReply
          onVerify={verify}
          onResend={async () => {
            const { email, mode, fullName, phone } = draft.current
            const error = await sendCode({ email, mode, meta: mode === 'signup' ? { full_name: fullName, phone, consent_at: new Date().toISOString() } : undefined })
            if (!error) await chat.bot('A new code is on its way.')
            return error
          }}
          onChangeEmail={() => {
            chat.user('Use a different email')
            return ask('email', 'No problem. What is the right email address?')
          }}
        />
      )}
    </>
  )

  return <ChatLayout label="Create an account or log in" messages={messages} composer={composer} />
}

function ConsentMessage({ text }: { text: string }) {
  return (
    <>
      <p className="text-ink font-medium">One last thing before I send your code.</p>
      <p className="text-ink-soft text-[0.9rem]">{text}</p>
    </>
  )
}

function parse<T>(schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false; error: { issues: { message: string }[] } } }, value: string) {
  const result = schema.safeParse(value)
  return result.success ? ({ ok: true, value: result.data as unknown as string } as const) : ({ ok: false, error: result.error.issues[0]?.message ?? 'Please check this' } as const)
}

/** One text answer: a pill-shaped input with a send button, validated before it becomes a bubble. */
function TextReply({
  label,
  type = 'text',
  inputMode,
  autoComplete,
  placeholder,
  prefix,
  skipLabel,
  validate,
  onSubmit,
  onSkip,
}: {
  label: string
  type?: string
  inputMode?: 'email' | 'tel'
  autoComplete?: string
  placeholder?: string
  prefix?: string
  skipLabel?: string
  validate: (value: string) => { ok: true; value: string } | { ok: false; error: string }
  onSubmit: (value: string) => void
  onSkip?: () => void
}) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (sent) return
    if (skipLabel && value.trim() === '') return skip()
    const result = validate(value)
    if (!result.ok) return setError(result.error)
    setSent(true)
    onSubmit(result.value)
  }
  const skip = () => {
    setSent(true)
    onSkip?.()
  }

  return (
    <form onSubmit={submit} noValidate className={cn('w-full space-y-2', enter)}>
      <div className={cn('bg-card focus-within:border-ring focus-within:ring-ring/40 flex items-center gap-2 rounded-full border py-1.5 pr-1.5 pl-4 shadow-[0_1px_2px_rgb(16_34_27/0.04)] focus-within:ring-3', error && 'border-destructive')}>
        {prefix && <span className="text-ink-soft border-r pr-3 text-[0.95rem] tabular-nums">{prefix}</span>}
        <Input
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder={placeholder}
          autoFocus
          value={value}
          disabled={sent}
          aria-label={label}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'reply-error' : undefined}
          onChange={(e) => (setValue(e.target.value), setError(null))}
          className="h-10 flex-1 rounded-none border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0 aria-invalid:border-0 aria-invalid:ring-0"
        />
        <Button type="submit" size="icon" className="size-10 shrink-0 rounded-full" disabled={sent || (!skipLabel && value.trim() === '')}>
          {sent ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ArrowUp className="size-4" aria-hidden />}
          <span className="sr-only">Send</span>
        </Button>
      </div>
      {error && (
        <p id="reply-error" role="alert" className="text-destructive pl-4 text-sm">
          {error}
        </p>
      )}
      {skipLabel && (
        <div className="flex justify-end">
          <button type="button" className={chipClass} onClick={skip} disabled={sent}>
            {skipLabel}
          </button>
        </div>
      )}
    </form>
  )
}

/** The emailed 6-digit code, checked as soon as the sixth digit is in. */
function CodeReply({
  onVerify,
  onResend,
  onChangeEmail,
}: {
  onVerify: (token: string) => Promise<string | null>
  onResend: () => Promise<string | null>
  onChangeEmail: () => void
}) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [cooldown, setCooldown] = useState(RESEND_AFTER_S)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  const verify = async (token: string) => {
    if (!otpSchema.safeParse({ token }).success) return setError('Enter the 6-digit code')
    setVerifying(true)
    setError(null)
    const failure = await onVerify(token)
    if (failure) {
      setVerifying(false)
      setCode('')
      setError(failure)
    }
  }

  return (
    <div className={cn('w-full space-y-3', enter)}>
      <InputOTP
        maxLength={6}
        inputMode="numeric"
        pattern="^[0-9]*$"
        autoComplete="one-time-code"
        autoFocus
        value={code}
        onChange={setCode}
        onComplete={verify}
        disabled={verifying}
        aria-label="6-digit code"
        aria-invalid={Boolean(error)}
      >
        <InputOTPGroup className="w-full">
          {Array.from({ length: 6 }, (_, i) => (
            <InputOTPSlot key={i} index={i} className="bg-card h-14 flex-1 text-xl font-semibold" />
          ))}
        </InputOTPGroup>
      </InputOTP>
      <div aria-live="polite">{error && <ErrorAlert>{error}</ErrorAlert>}</div>
      <p className="text-muted-foreground text-sm">You can also open the sign-in link in the same email.</p>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <Button type="button" variant="link" className="h-auto p-0" onClick={onChangeEmail} disabled={verifying}>
          Use a different email
        </Button>
        <Button
          type="button"
          variant="link"
          className="h-auto p-0"
          disabled={cooldown > 0 || verifying}
          onClick={async () => {
            const failure = await onResend()
            if (failure) return setError(failure)
            setError(null)
            setCooldown(RESEND_AFTER_S)
          }}
        >
          {cooldown > 0 ? `Send a new code in ${cooldown}s` : 'Send a new code'}
        </Button>
      </div>
    </div>
  )
}

function GoogleChip({ demo }: { demo: boolean }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signIn = async () => {
    if (demo) return router.push(afterDemo())
    setPending(true)
    setError(null)
    const { error } = await createClient().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: callbackUrl() } })
    // On success the browser is already on its way to Google.
    if (error) {
      setPending(false)
      setError(authErrorMessage(error))
    }
  }

  return (
    <>
      <button type="button" className={chipClass} onClick={signIn} disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <GoogleMark />}
        Continue with Google
      </button>
      {error && (
        <div className="w-full">
          <ErrorAlert>{error}</ErrorAlert>
        </div>
      )}
    </>
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
