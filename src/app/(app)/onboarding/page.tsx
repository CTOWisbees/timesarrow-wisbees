import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { VariantSwitcher } from '@/components/dev/variant-switcher'
import { ReviewStatus } from '@/components/onboarding/review-status'
import { RiskProfileStep } from '@/components/onboarding/risk'
import { OnboardingShell } from '@/components/onboarding/shell'
import { ensureApplication } from '@/lib/applications'
import { getOnboarding, getRiskProfileQuestions } from '@/lib/queries'
import { resolveVariant, variantPreviewEnabled } from '@/lib/section-variants'
import { demoModeEnabled } from '@/lib/supabase/dev-bypass'
import { getCurrentUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Your application' }

type SearchParams = Promise<Record<string, string | string[] | undefined>>

/** Step 2 (risk profile) until submitted, then step 3 (in review). Signed-in users only. */
export default async function OnboardingPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const [content, questions] = await Promise.all([getOnboarding(), getRiskProfileQuestions()])
  const variant = resolveVariant('onboardingProfile', content.verify.layout, variantPreviewEnabled() ? params : {})
  const devMenu = variantPreviewEnabled() && (
    <Suspense>
      <VariantSwitcher sections={['onboardingProfile']} live={{ onboardingProfile: content.verify.layout }} />
    </Suspense>
  )

  // Local demo: any step, no sign-in, nothing saved.
  if (demoModeEnabled() && (params.step === '2' || params.step === '3')) {
    return params.step === '3' ? (
      <OnboardingShell brand={content.brand} step={3}>
        <ReviewStatus title={content.review.title} message={content.review.message} name="Asha" submittedAt={new Date().toISOString()} />
      </OnboardingShell>
    ) : (
      <OnboardingShell brand={content.brand} step={2}>
        <RiskProfileStep variant={variant} content={questions} consentText={null} demo />
        {devMenu}
      </OnboardingShell>
    )
  }

  const user = await getCurrentUser()
  if (!user) redirect(demoModeEnabled() ? '/onboarding?step=2' : '/login')

  const application = await ensureApplication(user)

  if (application.status !== 'profile_pending') {
    return (
      <OnboardingShell brand={content.brand} step={3}>
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
    <OnboardingShell brand={content.brand} step={2}>
      <RiskProfileStep
        variant={variant}
        content={questions}
        consentText={application.consentAt ? null : content.account.consentText}
        email={application.email}
      />
      {devMenu}
    </OnboardingShell>
  )
}
