import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ReviewStatus } from '@/components/onboarding/review-status'
import { RiskProfileStep } from '@/components/onboarding/risk'
import { OnboardingShell } from '@/components/onboarding/shell'
import { ensureApplication } from '@/lib/applications'
import { getOnboarding, getRiskProfileQuestions } from '@/lib/queries'
import { demoModeEnabled } from '@/lib/supabase/dev-bypass'
import { getCurrentUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Your application' }

type SearchParams = Promise<Record<string, string | string[] | undefined>>

/** Step 2 (risk profile) until submitted, then step 3 (in review). Signed-in users only. */
export default async function OnboardingPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const [content, questions] = await Promise.all([getOnboarding(), getRiskProfileQuestions()])

  // Local demo: any step, no sign-in, nothing saved.
  if (demoModeEnabled() && (params.step === '2' || params.step === '3')) {
    return params.step === '3' ? (
      <OnboardingShell step={3}>
        <ReviewStatus title={content.review.title} message={content.review.message} name="Asha" submittedAt={new Date().toISOString()} />
      </OnboardingShell>
    ) : (
      <OnboardingShell step={2}>
        <RiskProfileStep content={questions} consentText={null} firstName="Asha" demo />
      </OnboardingShell>
    )
  }

  const user = await getCurrentUser()
  if (!user) redirect(demoModeEnabled() ? '/onboarding?step=2' : '/login')

  const application = await ensureApplication(user)

  if (application.status !== 'profile_pending') {
    return (
      <OnboardingShell step={3}>
        <ReviewStatus
          title={content.review.title}
          message={content.review.message}
          name={application.fullName.split(' ')[0]}
          submittedAt={application.submittedAt}
        />
      </OnboardingShell>
    )
  }

  return (
    <OnboardingShell step={2}>
      <RiskProfileStep
        content={questions}
        consentText={application.consentAt ? null : content.account.consentText}
        email={application.email}
        firstName={application.fullName.split(' ')[0]}
      />
    </OnboardingShell>
  )
}
