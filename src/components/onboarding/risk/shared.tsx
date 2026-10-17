'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useId, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroupItem } from '@/components/ui/radio-group'
import type { PublicRiskQuestion } from '@/lib/queries'
import { cn } from '@/lib/utils'

import { signOut, submitRiskProfile } from '../actions'
import { ErrorAlert } from '../fields'

export type RiskStepProps = {
  content: { title: string; description?: string | null; submitLabel: string; questions: PublicRiskQuestion[] }
  /** Shown only to Google sign-ups, who have not given consent yet. */
  consentText: string | null
  email?: string
  /** For the greeting. */
  firstName?: string
  /** Local demo: submitting just moves to step 3. */
  demo?: boolean
}

export type Answers = Record<string, string>

/** Submission shared by every layout: consent check, server scoring, then step 3. */
export function useRiskSubmit({ demo, consentText }: Pick<RiskStepProps, 'demo' | 'consentText'>) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)
  const [consentMissing, setConsentMissing] = useState(false)

  const submit = async (answers: Answers) => {
    setError(null)
    if (consentText && !consent) return setConsentMissing(true)
    setPending(true)
    if (demo) return router.push('/onboarding?step=3')
    const result = await submitRiskProfile({ answers, consent })
    if (result.ok) return router.refresh()
    setPending(false)
    setError(result.error)
  }

  return {
    submit,
    pending,
    error,
    consent: { checked: consent, missing: consentMissing, set: (v: boolean) => (setConsent(v), setConsentMissing(false)) },
  }
}

/** One answer as a full-width selectable card (a shadcn radio inside a label). */
export function AnswerCard({ id, value, label }: { id: string; value: string; label: string }) {
  return (
    <Label
      htmlFor={id}
      className={cn(
        'bg-card text-ink flex min-h-14 cursor-pointer items-center gap-3.5 rounded-xl border px-4 py-3.5 text-[0.95rem] leading-snug font-normal transition-colors',
        'hover:border-primary/60 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-mint/70 has-[[data-state=checked]]:ring-primary has-[[data-state=checked]]:ring-1',
      )}
    >
      <RadioGroupItem id={id} value={value} className="size-[1.125rem]" />
      <span className="flex-1">{label}</span>
    </Label>
  )
}

export function Intro({ content, email }: Pick<RiskStepProps, 'content' | 'email'>) {
  return (
    <div>
      <h2 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.015em] text-balance sm:text-[2rem]">{content.title}</h2>
      {content.description && <p className="text-ink-soft mt-2 text-[0.95rem] leading-relaxed">{content.description}</p>}
      {email && (
        <p className="text-muted-foreground mt-3 text-sm">
          Signed in as <span className="text-ink font-medium break-all">{email}</span>
        </p>
      )}
    </div>
  )
}

/** Consent box (Google sign-ups only), errors and the submit button. */
export function SubmitBlock({
  consentText,
  submitLabel,
  state,
  onSubmit,
  disabled,
  className,
}: {
  consentText: string | null
  submitLabel: string
  state: ReturnType<typeof useRiskSubmit>
  onSubmit: () => void
  disabled?: boolean
  className?: string
}) {
  const id = useId()
  return (
    <div className={cn('space-y-4', className)}>
      {consentText && (
        <div className="space-y-1.5">
          <div className="flex items-start gap-3">
            <Checkbox
              id={id}
              checked={state.consent.checked}
              onCheckedChange={(c) => state.consent.set(c === true)}
              aria-invalid={state.consent.missing}
              className="mt-0.5"
            />
            <Label htmlFor={id} className="text-ink-soft text-[0.8125rem] leading-snug font-normal">
              {consentText}
            </Label>
          </div>
          {state.consent.missing && <p className="text-destructive pl-7 text-sm">Please accept to continue</p>}
        </div>
      )}
      {state.error && <ErrorAlert>{state.error}</ErrorAlert>}
      <Button type="button" size="cta" className="w-full" onClick={onSubmit} disabled={disabled || state.pending}>
        {state.pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {submitLabel}
      </Button>
    </div>
  )
}

export function SignOutLink({ demo }: { demo?: boolean }) {
  if (demo) return null
  return (
    <form action={signOut} className="mt-8 border-t pt-5">
      <Button type="submit" variant="link" className="text-muted-foreground h-auto p-0 text-sm">
        Not you? Log out
      </Button>
    </form>
  )
}

/** Respect the visitor's reduced-motion setting in timed transitions. */
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
