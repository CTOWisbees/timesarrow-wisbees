import 'server-only'

import { draftMode } from 'next/headers'
import { cache } from 'react'

import { getPayloadClient } from './payload'

/**
 * All website content comes through here. Visitors only ever get published
 * content; draft mode (enabled by /api/preview for logged-in staff) shows the
 * latest drafts so compliance can review before publishing.
 */
const isDraft = cache(async () => (await draftMode()).isEnabled)

const publishedOnly = { _status: { equals: 'published' } } as const

export const getHomePage = cache(async () => {
  const [payload, draft] = await Promise.all([getPayloadClient(), isDraft()])
  return payload.findGlobal({ slug: 'home-page', draft, depth: 1, overrideAccess: draft })
})

export const getSiteSettings = cache(async () => {
  const [payload, draft] = await Promise.all([getPayloadClient(), isDraft()])
  return payload.findGlobal({ slug: 'site-settings', draft, depth: 1, overrideAccess: draft })
})

export const getOnboarding = cache(async () => {
  const [payload, draft] = await Promise.all([getPayloadClient(), isDraft()])
  return payload.findGlobal({ slug: 'onboarding', draft, depth: 1, overrideAccess: draft })
})

/** A question as the applicant sees it: no scores. */
export type PublicRiskQuestion = { key: string; question: string; help?: string | null; answers: { id: string; label: string }[] }

/**
 * Step 2's questionnaire for the page. Read without staff access, so answer scores and
 * bands are stripped by field access, and mapped down to ids and labels as a second
 * guard: nothing score-related can reach the browser, even in draft preview.
 */
export const getRiskProfileQuestions = cache(async () => {
  const [payload, draft] = await Promise.all([getPayloadClient(), isDraft()])
  const doc = await payload.findGlobal({ slug: 'risk-profile', draft, depth: 0, overrideAccess: false })
  const questions: PublicRiskQuestion[] = (doc.questions ?? []).map((q) => ({
    key: q.key,
    question: q.question,
    help: q.help,
    answers: (q.answers ?? []).map((a) => ({ id: a.id ?? '', label: a.label })),
  }))
  return { title: doc.title, description: doc.description, submitLabel: doc.submitLabel, questions }
})

export const getSebiDisclosure = cache(async () => {
  const [payload, draft] = await Promise.all([getPayloadClient(), isDraft()])
  return payload.findGlobal({ slug: 'sebi-disclosure', draft, depth: 1, overrideAccess: draft })
})

const findPublished = async <T extends 'model-portfolios' | 'faqs' | 'gallery-items'>(collection: T) => {
  const [payload, draft] = await Promise.all([getPayloadClient(), isDraft()])
  const { docs } = await payload.find({
    collection,
    draft,
    depth: 1,
    limit: 50,
    sort: 'order',
    overrideAccess: draft,
    where: draft ? undefined : publishedOnly,
  })
  return docs
}

export const getModelPortfolios = cache(() => findPublished('model-portfolios'))
export const getFaqs = cache(() => findPublished('faqs'))
export const getGalleryItems = cache(() => findPublished('gallery-items'))

export const getPortfolioScan = cache(async () => {
  const [payload, draft] = await Promise.all([getPayloadClient(), isDraft()])
  return payload.findGlobal({ slug: 'portfolio-scan', draft, depth: 0, overrideAccess: draft })
})
