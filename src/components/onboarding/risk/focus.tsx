'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { RadioGroup } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

import {
  AnswerCard,
  type Answers,
  Intro,
  prefersReducedMotion,
  type RiskStepProps,
  SignOutLink,
  SubmitBlock,
  useRiskSubmit,
} from './shared'

/** Pause after choosing, so the selection registers before the next question. */
const ADVANCE_MS = 320

/**
 * Variant "focus": one question per screen, then a review of every answer. Choosing
 * an answer moves on after a short beat (instantly with reduced motion), and Back /
 * Next stay available.
 */
export function RiskFocus({ content, consentText, email, demo }: RiskStepProps) {
  const { questions } = content
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const state = useRiskSubmit({ demo, consentText })
  const headingRef = useRef<HTMLHeadingElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const reviewing = index >= questions.length
  const question = questions[index]

  // Move focus to each new screen's heading so screen readers announce it.
  useEffect(() => {
    if (index > 0) headingRef.current?.focus()
  }, [index])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const choose = (key: string, answerId: string) => {
    setAnswers((a) => ({ ...a, [key]: answerId }))
    window.clearTimeout(timer.current)
    const next = () => setIndex((i) => Math.min(i + 1, questions.length))
    if (prefersReducedMotion()) next()
    else timer.current = window.setTimeout(next, ADVANCE_MS)
  }

  return (
    <div id="risk-profile">
      {index === 0 && <Intro content={content} email={email} />}

      {/* Question progress, separate from the 3-step bar above. */}
      <div className={cn(index === 0 ? 'mt-7' : '')}>
        <p className="text-ink-soft text-sm tabular-nums" aria-live="polite">
          {reviewing ? 'All questions answered' : `Question ${index + 1} of ${questions.length}`}
        </p>
        <div className="mt-2 flex gap-1" aria-hidden>
          {questions.map((q, i) => (
            <span
              key={q.key}
              className={cn('h-1 flex-1 rounded-full transition-colors', answers[q.key] || i < index ? 'bg-primary' : i === index ? 'bg-primary/40' : 'bg-border')}
            />
          ))}
        </div>
      </div>

      {!reviewing && question && (
        <fieldset key={question.key} className="mt-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-3 motion-safe:duration-300">
          <legend className="sr-only">{question.question}</legend>
          <h3 ref={headingRef} tabIndex={-1} className="font-heading text-ink text-[1.45rem] leading-snug font-semibold text-balance outline-none sm:text-[1.65rem]">
            {question.question}
          </h3>
          {question.help && <p className="text-ink-soft mt-2 text-sm">{question.help}</p>}
          <RadioGroup
            value={answers[question.key] ?? ''}
            onValueChange={(v) => choose(question.key, v)}
            aria-label={question.question}
            className="mt-5 gap-2.5"
          >
            {question.answers.map((a) => (
              <AnswerCard key={a.id} id={`${question.key}-${a.id}`} value={a.id} label={a.label} />
            ))}
          </RadioGroup>

          <div className="mt-6 flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={() => setIndex((i) => i - 1)} disabled={index === 0} className="text-ink-soft gap-1.5 px-2">
              <ArrowLeft className="size-4" aria-hidden />
              Back
            </Button>
            <Button type="button" onClick={() => setIndex((i) => i + 1)} disabled={!answers[question.key]} className="h-10 gap-1.5 px-4">
              {index === questions.length - 1 ? 'Review answers' : 'Next'}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>
        </fieldset>
      )}

      {reviewing && (
        <div className="mt-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
          <h3 ref={headingRef} tabIndex={-1} className="font-heading text-ink text-[1.45rem] font-semibold outline-none sm:text-[1.65rem]">
            Check your answers
          </h3>
          <ol className="mt-4 divide-y rounded-xl border bg-card">
            {questions.map((q, i) => (
              <li key={q.key} className="flex items-start gap-3 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-muted-foreground text-[0.8125rem] leading-snug">{q.question}</p>
                  <p className="text-ink mt-1 text-[0.95rem] font-medium leading-snug">
                    {q.answers.find((a) => a.id === answers[q.key])?.label}
                  </p>
                </div>
                <Button type="button" variant="link" className="h-auto shrink-0 p-0 text-sm" onClick={() => setIndex(i)}>
                  Change<span className="sr-only">: {q.question}</span>
                </Button>
              </li>
            ))}
          </ol>
          <SubmitBlock
            className="mt-6"
            consentText={consentText}
            submitLabel={content.submitLabel}
            state={state}
            onSubmit={() => state.submit(answers)}
          />
        </div>
      )}

      <SignOutLink demo={demo} />
    </div>
  )
}
