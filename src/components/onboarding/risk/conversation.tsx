'use client'

import { Pencil } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

import { BotMessage, enter, UserBubble } from '../chat-ui'
import { type Answers, type RiskStepProps, SignOutLink, SubmitBlock, prefersReducedMotion, useRiskSubmit } from './shared'

/**
 * Variant "conversation": the questions arrive one by one as messages from the
 * adviser; the applicant answers by tapping a reply, which turns into their own
 * bubble. Any earlier reply can be changed. Ends with a short sign-off and Submit.
 */
export function RiskConversation({ content, consentText, email, firstName, demo }: RiskStepProps) {
  const { questions } = content
  const [answers, setAnswers] = useState<Answers>({})
  const [editing, setEditing] = useState<string | null>(null)
  const state = useRiskSubmit({ demo, consentText })
  const endRef = useRef<HTMLDivElement>(null)

  const firstOpen = questions.findIndex((q) => !answers[q.key])
  const shownUpTo = firstOpen === -1 ? questions.length - 1 : firstOpen
  const done = firstOpen === -1 && !editing

  // Keep the newest message in view as the conversation grows.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }, [shownUpTo, done])

  const choose = (key: string, answerId: string) => {
    setAnswers((a) => ({ ...a, [key]: answerId }))
    setEditing(null)
  }

  return (
    <div id="risk-profile" role="log" aria-label="Risk profile questions" className="space-y-4">
      <AdviserMessage>
        {firstName && <p className="text-ink-soft">Hi {firstName}, you are all set up.</p>}
        <p className="font-heading text-ink text-lg leading-snug font-semibold">{content.title}</p>
        {content.description && <p className="text-ink-soft mt-1.5 text-[0.95rem] leading-relaxed">{content.description}</p>}
      </AdviserMessage>

      {questions.slice(0, shownUpTo + 1).map((q) => {
        const chosen = q.answers.find((a) => a.id === answers[q.key])
        const open = !chosen || editing === q.key
        return (
          <div key={q.key} className="space-y-3">
            <AdviserMessage className={enter}>
              <p className="text-ink text-[1.02rem] leading-snug font-medium">{q.question}</p>
              {q.help && <p className="text-ink-soft mt-1.5 text-sm">{q.help}</p>}
            </AdviserMessage>

            {open ? (
              <RadioGroup
                value={answers[q.key] ?? ''}
                onValueChange={(v) => choose(q.key, v)}
                aria-label={q.question}
                className={cn('flex flex-wrap justify-end gap-2.5 pl-11', enter)}
              >
                {q.answers.map((a) => (
                  <Label
                    key={a.id}
                    htmlFor={`cv-${q.key}-${a.id}`}
                    className={cn(
                      'border-primary/40 text-brand-green-strong bg-card max-w-full cursor-pointer rounded-2xl border px-4 py-3 text-left text-sm leading-snug font-medium transition-colors',
                      'hover:bg-mint has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:ring-3 has-[[data-state=checked]]:bg-primary has-[[data-state=checked]]:text-white',
                    )}
                  >
                    <RadioGroupItem id={`cv-${q.key}-${a.id}`} value={a.id} className="sr-only" />
                    {a.label}
                  </Label>
                ))}
              </RadioGroup>
            ) : (
              <div className={cn('flex flex-col items-end gap-1', enter)}>
                <UserBubble className="animate-none">{chosen.label}</UserBubble>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setEditing(q.key)}
                  className="text-muted-foreground h-auto gap-1 p-0 text-xs"
                >
                  <Pencil className="size-3" aria-hidden />
                  Change<span className="sr-only"> answer: {q.question}</span>
                </Button>
              </div>
            )}
          </div>
        )
      })}

      {done && (
        <div className="space-y-4">
          <AdviserMessage className={enter}>
            <p className="text-ink text-[0.95rem] leading-relaxed">
              That&rsquo;s everything I need. Submit when you&rsquo;re ready and we&rsquo;ll review your application.
            </p>
            {email && <p className="text-muted-foreground mt-1.5 text-xs break-all">Signed in as {email}</p>}
          </AdviserMessage>
          <SubmitBlock
            className={cn('pl-11', enter)}
            consentText={consentText}
            submitLabel={content.submitLabel}
            state={state}
            onSubmit={() => state.submit(answers)}
          />
        </div>
      )}

      <div ref={endRef} />
      <SignOutLink demo={demo} />
    </div>
  )
}

function AdviserMessage({ children, className }: { children: React.ReactNode; className?: string }) {
  return <BotMessage className={className}>{children}</BotMessage>
}
