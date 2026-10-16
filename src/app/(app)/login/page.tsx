import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { AuthPanel } from '@/components/onboarding/auth-panel'
import { OnboardingShell } from '@/components/onboarding/shell'
import { safeNext } from '@/lib/next-path'
import { getOnboarding } from '@/lib/queries'
import { demoModeEnabled, devAuthBypassEnabled } from '@/lib/supabase/dev-bypass'
import { getCurrentUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Log in or create an account' }

const errors: Record<string, string> = {
  auth: 'That sign-in link has expired or was already used. Please request a new code.',
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const [{ error, next }, content] = await Promise.all([searchParams, getOnboarding()])
  // Already signed in: carry on where they left off.
  if (await getCurrentUser()) redirect(safeNext(next))

  return (
    <OnboardingShell brand={content.brand} step={1}>
      <AuthPanel
        copy={{ ...content.account, ...content.verify }} initialError={error ? errors[error] : undefined}
        devBypass={devAuthBypassEnabled()}
        demo={demoModeEnabled()}
      />
    </OnboardingShell>
  )
}
