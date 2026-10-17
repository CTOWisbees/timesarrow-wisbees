import { cn } from '@/lib/utils'
import { demoModeEnabled } from '@/lib/supabase/dev-bypass'

import { DemoBar } from './demo-bar'

const STEPS = ['Account', 'Verify and profile', 'Review'] as const

/**
 * One centred column for the whole sign-up conversation: a slim progress line on top,
 * then the chat. The column scrolls, the header and footer of the app layout stay put.
 */
export function OnboardingShell({ step, children }: { step: 1 | 2 | 3; children: React.ReactNode }) {
  return (
    <div className="bg-mist/60 flex-1 lg:min-h-0 lg:overflow-y-auto">
      <div className="mx-auto flex w-full max-w-2xl flex-col px-4 py-8 sm:py-12">
        {demoModeEnabled() && <DemoBar current={step} />}
        <StepProgress current={step} />
        <div className="mt-10">{children}</div>
      </div>
    </div>
  )
}

/** "Step 2 of 3 · Verify and profile" with a three-part bar. */
function StepProgress({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div>
      <p className="text-ink-soft text-sm">
        <span className="text-ink font-semibold">
          Step {current} of {STEPS.length}
        </span>
        <span aria-hidden> · </span>
        <span className="sr-only">: </span>
        {STEPS[current - 1]}
      </p>
      <ol aria-label="Sign-up progress" className="mt-3 grid grid-cols-3 gap-1.5">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i + 1 === current ? 'step' : undefined} className={cn('h-1 rounded-full', i + 1 <= current ? 'bg-primary' : 'bg-border')}>
            <span className="sr-only">
              {label}
              {i + 1 < current ? ', done' : ''}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
