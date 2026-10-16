import { CmsImage } from '@/components/shared/cms-image'
import { Lines } from '@/components/shared/section'
import { cn } from '@/lib/utils'
import { demoModeEnabled } from '@/lib/supabase/dev-bypass'
import type { Onboarding } from '@/payload-types'

import { DemoBar } from './demo-bar'

const STEPS = ['Account', 'Verify and profile', 'Review'] as const

/**
 * Two halves that together fill the screen on laptops: a quiet green panel (message
 * and illustration, from the CMS) and the current step. Only the step column scrolls,
 * for the longer profile form. On phones the panel shrinks to a short headline band.
 */
export function OnboardingShell({
  brand,
  step,
  children,
}: {
  brand: Onboarding['brand']
  step: 1 | 2 | 3
  children: React.ReactNode
}) {
  return (
    <div className="grid flex-1 content-start lg:min-h-0 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:content-stretch">
      <BrandPanel brand={brand} />
      <div className="lg:min-h-0 lg:overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[26rem] flex-col justify-center px-4 py-8 sm:px-0 sm:py-12 lg:min-h-full lg:py-8 short:py-3">
          {demoModeEnabled() && <DemoBar current={step} />}
          <StepProgress current={step} />
          <div className="mt-7 short:mt-4">{children}</div>
        </div>
      </div>
    </div>
  )
}

function BrandPanel({ brand }: { brand: Onboarding['brand'] }) {
  return (
    <section
      aria-label="About WisBees"
      className="bg-brand-green-strong flex flex-col gap-8 px-4 py-6 text-white sm:px-8 sm:py-8 lg:min-h-0 lg:px-14 lg:py-14 xl:px-20"
    >
      <div>
        <h1 className="text-2xl leading-[1.12] font-semibold tracking-[-0.015em] text-balance text-white sm:text-3xl lg:text-[2.6rem] xl:text-5xl">
          <Lines text={brand.headline} />
        </h1>
        {brand.message && (
          <p className="text-mint/85 mt-4 hidden max-w-[34ch] text-base leading-relaxed sm:block lg:mt-5 lg:text-lg">
            {brand.message}
          </p>
        )}
      </div>

      {/* Takes whatever height is left, so the panel never pushes past the screen. */}
      <div className="relative hidden min-h-0 flex-1 lg:block">
        <CmsImage
          media={brand.illustration}
          fallbackSrc="/placeholders/onboarding.svg"
          fallbackAlt=""
          fill
          priority
          sizes="(min-width: 1024px) 40vw, 0px"
          className="object-contain object-bottom-left"
        />
      </div>
    </section>
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
          <li
            key={label}
            aria-current={i + 1 === current ? 'step' : undefined}
            className={cn('h-1 rounded-full', i + 1 <= current ? 'bg-primary' : 'bg-border')}
          >
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
