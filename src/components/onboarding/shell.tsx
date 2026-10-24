import { Check } from 'lucide-react'
import Image from 'next/image'

import { cn } from '@/lib/utils'
import { demoModeEnabled } from '@/lib/supabase/dev-bypass'

import { ChatHeader } from './chat-ui'
import { DemoBar } from './demo-bar'

const STEPS = ['Account', 'Verify and profile', 'Review'] as const

/**
 * The whole sign-up as one chat window, in the manner of a desktop messaging app: a title bar with
 * the progress, the conversation on a wallpaper, and the reply controls docked below. The window
 * fills the space between the app header and footer; the conversation scrolls inside it.
 */
export function OnboardingShell({ step, children }: { step: 1 | 2 | 3; children: React.ReactNode }) {
  return (
    <div className="bg-mist flex flex-1 lg:min-h-0 lg:py-4">
      <div className="container-page flex flex-1 lg:min-h-0">
       <div className="bg-card flex w-full flex-1 overflow-hidden lg:min-h-0 lg:rounded-xl lg:border lg:shadow-[0_8px_32px_rgb(16_34_27/0.1)]">
        <Sidebar step={step} />
        <div className="flex min-w-0 flex-1 flex-col lg:min-h-0">
          {demoModeEnabled() && <DemoBar current={step} />}
          <ChatHeader subtitle={`Step ${step} of ${STEPS.length} · ${STEPS[step - 1]}`} />
          <StepProgress current={step} />
          {children}
        </div>
       </div>
      </div>
    </div>
  )
}

/** The chat list down the left on large screens: the one conversation, and the sign-up steps beneath it. */
function Sidebar({ step }: { step: 1 | 2 | 3 }) {
  return (
    <aside aria-label="Sign-up" className="bg-card hidden w-80 shrink-0 flex-col border-r lg:flex xl:w-96">
      <p className="text-ink px-5 py-4 text-xl font-semibold">Chats</p>
      <div className="bg-mint/60 flex items-center gap-3 border-y px-5 py-3">
        <span className="bg-mint flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border" aria-hidden>
          <Image src="/brand/wisbees-mark.png" alt="" width={30} height={30} />
        </span>
        <div className="min-w-0">
          <p className="text-ink truncate font-semibold">WisBees Advisory</p>
          <p className="text-ink-soft truncate text-sm">{STEPS[step - 1]}</p>
        </div>
      </div>
      <p className="text-muted-foreground px-5 pt-5 pb-2 text-xs font-semibold tracking-wide uppercase">Your sign-up</p>
      <ol className="space-y-1 px-3">
        {STEPS.map((label, i) => (
          <li key={label} className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm', i + 1 === step ? 'bg-mist text-ink font-semibold' : 'text-ink-soft')}>
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs',
                i + 1 < step && 'bg-primary border-primary text-white',
                i + 1 === step && 'border-primary text-primary',
              )}
            >
              {i + 1 < step ? <Check className="size-3.5" aria-hidden /> : i + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>
    </aside>
  )
}

/** A three-part bar under the title bar. */
function StepProgress({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol aria-label="Sign-up progress" className="grid grid-cols-3 gap-px">
      {STEPS.map((label, i) => (
        <li key={label} aria-current={i + 1 === current ? 'step' : undefined} className={cn('h-1', i + 1 <= current ? 'bg-primary' : 'bg-border')}>
          <span className="sr-only">
            {label}
            {i + 1 < current ? ', done' : ''}
          </span>
        </li>
      ))}
    </ol>
  )
}
