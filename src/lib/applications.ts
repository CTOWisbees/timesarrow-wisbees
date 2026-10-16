import 'server-only'

import { getPayloadClient } from './payload'
import { type RiskAnswers, scoreRiskProfile } from './risk-score'
import type { getCurrentUser } from './supabase/server'

type User = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>

export async function findApplication(userId: string) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'applications',
    where: { supabaseUserId: { equals: userId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return docs[0] ?? null
}

/**
 * The signed-in user's application, created on their first visit from what they
 * entered at sign-up (stored on the Auth user). Google sign-ups have no phone or
 * consent yet; the profile step collects those.
 */
export async function ensureApplication(user: User) {
  const existing = await findApplication(user.id)
  if (existing) return existing

  const payload = await getPayloadClient()
  const content = await payload.findGlobal({ slug: 'onboarding', draft: false, depth: 0 })
  try {
    return await payload.create({
      collection: 'applications',
      overrideAccess: true,
      data: {
        supabaseUserId: user.id,
        email: user.email,
        fullName: user.fullName || user.email.split('@')[0],
        phone: user.phone || undefined,
        authProvider: user.provider,
        status: 'profile_pending',
        ...(user.consentAt ? { consentText: content.account.consentText, consentAt: user.consentAt } : {}),
      },
    })
  } catch (error) {
    // Two tabs opening /onboarding at once: the unique user id lets only one create win.
    const raced = await findApplication(user.id)
    if (raced) return raced
    throw error
  }
}

/**
 * Scores the applicant's step-2 answers against the published questionnaire and
 * submits the application. Read with staff access (scores are staff-only fields).
 * Stores a snapshot of every question, answer and score, so later edits to the
 * questions never change a submitted record. Throws RiskScoreError on bad answers.
 */
export async function saveRiskProfile(
  applicationId: number,
  chosen: RiskAnswers,
  extra: Record<string, unknown> = {},
) {
  const payload = await getPayloadClient()
  const profile = await payload.findGlobal({ slug: 'risk-profile', draft: false, depth: 0, overrideAccess: true })
  const result = scoreRiskProfile(profile.questions ?? [], profile.bands ?? [], chosen)
  return payload.update({
    collection: 'applications',
    id: applicationId,
    overrideAccess: true,
    data: {
      riskScore: result.total,
      riskCategory: result.category,
      equityLimit: result.equityLimit,
      riskAnswers: result.answers,
      questionnaireVersion: profile.updatedAt,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      ...extra,
    },
  })
}
