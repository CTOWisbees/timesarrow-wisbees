import 'server-only'

import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

/** One Payload instance per request; Payload itself caches the connection pool. */
export const getPayloadClient = cache(() => getPayload({ config }))
