'use client'

import { Loader2, MailCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useState } from 'react'

import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'
import { otpSchema } from '@/lib/onboarding'
import { createClient } from '@/lib/supabase/client'
import { authErrorMessage } from '@/lib/supabase/errors'

import { ErrorAlert } from './fields'
import { nextFromLocation } from '@/lib/next-path'

/** Supabase lets each address request a new code once a minute. */
const RESEND_AFTER_S = 60

/**
 * Step 2a: the 6-digit code from the email. Verifying creates the session cookie,
 * then the visitor moves on to the profile. The same email also carries a sign-in
 * link, which lands on /auth/callback, so either works.
 */
export function VerifyCode({
  email,
  title,
  description,
  onResend,
  onChangeEmail,
}: {
  email: string
  title: string
  description?: string | null
  onResend: () => Promise<string | null>
  onChangeEmail: () => void
}) {
  const id = useId()
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [resent, setResent] = useState(false)
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
    const { error } = await createClient().auth.verifyOtp({ email, token, type: 'email' })
    if (error) {
      setVerifying(false)
      setCode('')
      return setError(authErrorMessage(error))
    }
    router.replace(nextFromLocation())
    router.refresh()
  }

  const resend = async () => {
    setError(null)
    setResent(false)
    const failure = await onResend()
    if (failure) return setError(failure)
    setResent(true)
    setCooldown(RESEND_AFTER_S)
  }

  return (
    <div>
      <span className="bg-mint text-primary flex size-12 items-center justify-center rounded-full" aria-hidden>
        <MailCheck className="size-6" />
      </span>
      <h2 className="mt-5 text-[1.75rem] leading-tight font-semibold tracking-[-0.015em] sm:text-[2rem]">{title}</h2>
      <p className="text-ink-soft mt-2 text-sm leading-relaxed">
        {description} <span className="text-ink font-semibold break-all">{email}</span>
      </p>

      <form
        className="mt-6"
        onSubmit={(e) => {
          e.preventDefault()
          verify(code)
        }}
      >
        <Label htmlFor={id} className="text-ink text-sm font-semibold">
          6-digit code
        </Label>
        <InputOTP
          id={id}
          maxLength={6}
          inputMode="numeric"
          pattern="^[0-9]*$"
          autoComplete="one-time-code"
          autoFocus
          value={code}
          onChange={setCode}
          onComplete={verify}
          disabled={verifying}
          aria-invalid={Boolean(error)}
          containerClassName="mt-2"
        >
          <InputOTPGroup className="w-full">
            {Array.from({ length: 6 }, (_, i) => (
              <InputOTPSlot key={i} index={i} className="bg-card h-14 flex-1 text-xl font-semibold" />
            ))}
          </InputOTPGroup>
        </InputOTP>

        <div aria-live="polite" className="mt-4 space-y-3">
          {error && <ErrorAlert>{error}</ErrorAlert>}
          {resent && !error && <p className="text-primary text-sm font-medium">A new code is on its way.</p>}
        </div>

        <Button type="submit" size="cta" className="mt-5 w-full" disabled={verifying || code.length < 6}>
          {verifying && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Verify and continue
        </Button>
      </form>

      <p className="text-muted-foreground mt-4 text-sm">You can also open the sign-in link in the same email.</p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-5 text-sm">
        <Button type="button" variant="link" className="h-auto p-0" onClick={onChangeEmail}>
          Use a different email
        </Button>
        <Button type="button" variant="link" className="h-auto p-0" onClick={resend} disabled={cooldown > 0}>
          {cooldown > 0 ? `Send a new code in ${cooldown}s` : 'Send a new code'}
        </Button>
      </div>
    </div>
  )
}
