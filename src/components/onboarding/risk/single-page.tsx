'use client'

import { useState } from 'react'

import { RadioGroup } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

import { AnswerCard, type Answers, Intro, type RiskStepProps, SignOutLink, SubmitBlock, useRiskSubmit } from './shared'

/**
 * Variant "single page": every question on one scroll, with a sticky footer
 * that counts answers and holds Submit. Submitting with gaps marks each unanswered
 * question and moves focus to the first one.
 */
export function RiskSinglePage({ content, consentText, email, demo }: RiskStepProps) {
  const { questions } = content
  const [answers, setAnswers] = useState<Answers>({})
  const [showMissing, setShowMissing] = useState(false)
  const state = useRiskSubmit({ demo, consentText })
  const answered = questions.filter((q) => answers[q.key]).length

  const submit = () => {
    const missing = questions.find((q) => !answers[q.key])
    if (missing) {
      setShowMissing(true)
      const el = document.getElementById(`q-${missing.key}`)
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      el?.querySelector<HTMLElement>('[role="radio"]')?.focus({ preventScroll: true })
      return
    }
    state.submit(answers)
  }

  return (
    <div id="risk-profile">
      <Intro content={content} email={email} />

      <ol className="mt-8 space-y-8">
        {questions.map((q) => {
          const missing = showMissing && !answers[q.key]
          return (
            <li key={q.key} id={`q-${q.key}`} className="scroll-mt-6">
              <fieldset aria-describedby={missing ? `q-${q.key}-missing` : undefined}>
                <legend className="font-heading text-ink text-lg leading-snug font-semibold sm:text-xl">{q.question}</legend>
                {q.help && <p className="text-ink-soft mt-1.5 text-sm">{q.help}</p>}
                <RadioGroup
                  value={answers[q.key] ?? ''}
                  onValueChange={(v) => setAnswers((a) => ({ ...a, [q.key]: v }))}
                  aria-invalid={missing}
                  className={cn('mt-3.5 gap-2 rounded-2xl', missing && 'ring-destructive/60 ring-2 ring-offset-4 ring-offset-paper')}
                >
                  {q.answers.map((a) => (
                    <AnswerCard key={a.id} id={`sp-${q.key}-${a.id}`} value={a.id} label={a.label} />
                  ))}
                </RadioGroup>
                {missing && (
                  <p id={`q-${q.key}-missing`} className="text-destructive mt-2 text-sm">
                    Choose an answer
                  </p>
                )}
              </fieldset>
            </li>
          )
        })}
      </ol>

      {/* Sticky to the bottom of the scrolling form column. */}
      <div className="bg-paper/95 sticky bottom-0 -mx-4 mt-8 border-t px-4 pt-4 pb-5 backdrop-blur sm:mx-0 sm:px-0">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-ink-soft tabular-nums" aria-live="polite">
            {answered} of {questions.length} answered
          </span>
          <span aria-hidden className="bg-border relative h-1 w-28 overflow-hidden rounded-full">
            <span className="bg-primary absolute inset-y-0 left-0 rounded-full transition-[width] duration-300" style={{ width: `${(answered / questions.length) * 100}%` }} />
          </span>
        </div>
        <SubmitBlock consentText={consentText} submitLabel={content.submitLabel} state={state} onSubmit={submit} />
      </div>

      <SignOutLink demo={demo} />
    </div>
  )
}
