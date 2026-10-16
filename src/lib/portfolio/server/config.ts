import 'server-only'

import { cache } from 'react'

import { getPayloadClient } from '@/lib/payload'

import { configFromCms, type ScanConfigDoc } from '../config'

/** Always the published scoring config: stored results must be reproducible, so drafts never score. */
export const getScanConfig = cache(async () => {
  const payload = await getPayloadClient()
  const doc = await payload.findGlobal({ slug: 'scan-config', draft: false, depth: 0, overrideAccess: true })
  return configFromCms(doc as ScanConfigDoc)
})
