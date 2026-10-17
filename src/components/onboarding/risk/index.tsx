import { ErrorAlert } from '../fields'
import { RiskConversation } from './conversation'
import type { RiskStepProps } from './shared'

/** Onboarding step 2: the risk-profile questions, asked as a conversation like the rest of the flow. */
export function RiskProfileStep(props: RiskStepProps) {
  if (!props.content.questions.length) {
    return <ErrorAlert>The questions are not set up yet. Add them in the CMS under “Risk profile questions”.</ErrorAlert>
  }
  return <RiskConversation {...props} />
}
