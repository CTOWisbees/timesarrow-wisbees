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
    <div className="bg-mist flex flex-1 justify-center lg:min-h-0">
      <div className="bg-card flex w-full max-w-6xl flex-1 flex-col lg:min-h-0 lg:border-x lg:shadow-[0_0_32px_rgb(16_34_27/0.08)]">
        {demoModeEnabled() && <DemoBar current={step} />}
        <ChatHeader subtitle={`Step ${step} of ${STEPS.length} · ${STEPS[step - 1]}`} />
        <StepProgress current={step} />
        {children}
      </div>
    </div>
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
