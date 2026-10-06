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
