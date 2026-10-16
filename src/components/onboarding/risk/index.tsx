import type { VariantOf } from '@/lib/section-variants'

import { ErrorAlert } from '../fields'
import { RiskConversation } from './conversation'
import { RiskFocus } from './focus'
import type { RiskStepProps } from './shared'
import { RiskSinglePage } from './single-page'

/** Onboarding step 2 in the chosen layout (CMS, or a dev preview). See `src/lib/section-variants.ts`. */
export function RiskProfileStep({ variant, ...props }: RiskStepProps & { variant: VariantOf<'onboardingProfile'> }) {
  if (!props.content.questions.length) {
    return <ErrorAlert>The questions are not set up yet. Add them in the CMS under “Risk profile questions”.</ErrorAlert>
  }
  switch (variant) {
    case 'single-page':
      return <RiskSinglePage {...props} />
    case 'conversation':
      return <RiskConversation {...props} />
    default:
      return <RiskFocus {...props} />
  }
}
