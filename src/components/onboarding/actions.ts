'use server'

import { redirect } from 'next/navigation'

import { z } from 'zod'

import { findApplication, saveRiskProfile } from '@/lib/applications'
import { type ActionResult } from '@/lib/onboarding'
import { getPayloadClient } from '@/lib/payload'
import { RiskScoreError } from '@/lib/risk-score'
import { createClient, getCurrentUser } from '@/lib/supabase/server'

const SERVER_ERROR = 'Something went wrong on our side. Please try again in a minute.'

/** Question key → chosen answer id. Checked against the CMS questions when scoring. */
const answersSchema = z.record(z.string().max(80), z.string().max(80)).refine((a) => Object.keys(a).length <= 20)

/**
 * Step 2: scores the risk-profile answers on the server and submits the application.
 * The application is looked up by the verified session's user id, never by anything
 * the browser sends, so one person cannot write to another's application. The
 * applicant gets no score back: only success or a reason to retry.
 */
export async function submitRiskProfile(input: { answers: Record<string, string>; consent?: boolean }): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'Your session has ended. Please log in again.' }

  const parsed = answersSchema.safeParse(input.answers)
  if (!parsed.success) return { ok: false, error: 'Please answer every question.' }

  try {
    const application = await findApplication(user.id)
    if (!application) return { ok: false, error: SERVER_ERROR }
    if (application.status !== 'profile_pending') return { ok: true }

    const needsConsent = !application.consentAt
    if (needsConsent && input.consent !== true) {
      return { ok: false, error: 'Please accept to continue.', fieldErrors: { consent: 'Please accept to continue' } }
    }

    const payload = await getPayloadClient()
    const content = needsConsent ? await payload.findGlobal({ slug: 'onboarding', draft: false, depth: 0 }) : null
    await saveRiskProfile(
      application.id,
      parsed.data,
      content ? { consentText: content.account.consentText, consentAt: new Date().toISOString() } : {},
    )
    return { ok: true }
  } catch (error) {
    if (error instanceof RiskScoreError) return { ok: false, error: 'Please answer every question.' }
    console.error('Risk profile submission failed', error instanceof Error ? error.message : error)
    return { ok: false, error: SERVER_ERROR }
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
