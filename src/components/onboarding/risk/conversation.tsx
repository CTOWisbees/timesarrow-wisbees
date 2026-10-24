'use client'

import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

import { BotMessage, ChatLayout, enter, UserBubble } from '../chat-ui'
import { type Answers, type RiskStepProps, SignOutLink, SubmitBlock, prefersReducedMotion, useRiskSubmit } from './shared'

/**
 * The risk-profile questions as a chat window: each question arrives as a message from the
 * adviser, and the answers are offered in the reply tray docked at the bottom. Choosing one
 * turns it into the applicant's own bubble. Any earlier reply can be changed. Ends with a short
 * sign-off and Submit in the tray.
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
  const current = editing ? questions.find((q) => q.key === editing) : firstOpen === -1 ? undefined : questions[firstOpen]

  // Keep the newest message in view as the conversation grows.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }, [shownUpTo, done])

  const choose = (key: string, answerId: string) => {
    setAnswers((a) => ({ ...a, [key]: answerId }))
    setEditing(null)
  }

  const messages = (
    <>
      <BotMessage>
        {firstName && <p className="text-ink-soft">Hi {firstName}, you are all set up.</p>}
        <p className="font-heading text-ink text-lg leading-snug font-semibold">{content.title}</p>
        {content.description && <p className="text-ink-soft mt-1.5 text-[0.95rem] leading-relaxed">{content.description}</p>}
      </BotMessage>

      {questions.slice(0, shownUpTo + 1).map((q) => {
        const chosen = q.answers.find((a) => a.id === answers[q.key])
        return (
          <div key={q.key} className="space-y-3">
            <BotMessage>
              <p className="text-ink text-[1.02rem] leading-snug font-medium">{q.question}</p>
              {q.help && <p className="text-ink-soft mt-1.5 text-sm">{q.help}</p>}
            </BotMessage>
            {chosen && (
              <div className={cn('flex flex-col items-end gap-1', enter)}>
                <UserBubble className="animate-none">{chosen.label}</UserBubble>
                {editing !== q.key && (
                  <Button type="button" variant="link" onClick={() => setEditing(q.key)} className="text-ink-soft h-auto p-0 text-xs">
                    Change<span className="sr-only"> answer: {q.question}</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        )
      })}

      {done && (
        <BotMessage>
          <p className="text-ink text-[0.95rem] leading-relaxed">That&rsquo;s everything I need. Submit when you&rsquo;re ready and we&rsquo;ll review your application.</p>
          {email && <p className="text-muted-foreground mt-1.5 text-xs break-all">Signed in as {email}</p>}
        </BotMessage>
      )}

      <div ref={endRef} />
      <SignOutLink demo={demo} />
    </>
  )

  const composer = done ? (
    <SubmitBlock consentText={consentText} submitLabel={content.submitLabel} state={state} onSubmit={() => state.submit(answers)} className={enter} />
  ) : current ? (
    <div key={current.key} className={enter}>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <p className="text-ink-soft text-sm font-medium">{editing ? 'Choose a new reply' : 'Choose your reply'}</p>
        {editing && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(null)}>
            <X className="size-4" aria-hidden />
            Keep my answer
          </Button>
        )}
      </div>
      <RadioGroup
        value={answers[current.key] ?? ''}
        onValueChange={(v) => choose(current.key, v)}
        aria-label={current.question}
        className="grid max-h-[38svh] gap-2.5 overflow-y-auto sm:grid-cols-2"
      >
        {current.answers.map((a) => (
          <Label
            key={a.id}
            htmlFor={`cv-${current.key}-${a.id}`}
            className={cn(
              'border-primary/30 text-ink bg-card flex min-h-12 cursor-pointer items-center rounded-xl border px-4 py-3 text-left text-sm leading-snug font-medium transition-colors',
              'hover:border-primary hover:bg-mint has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:ring-3 has-[[data-state=checked]]:bg-primary has-[[data-state=checked]]:text-white',
            )}
          >
            <RadioGroupItem id={`cv-${current.key}-${a.id}`} value={a.id} className="sr-only" />
            {a.label}
          </Label>
        ))}
      </RadioGroup>
    </div>
  ) : null

  return <ChatLayout label="Risk profile questions" messages={messages} composer={composer} />
}
