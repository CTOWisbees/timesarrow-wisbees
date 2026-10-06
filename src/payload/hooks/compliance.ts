import { revalidatePath } from 'next/cache'
import {
  APIError,
  type CollectionAfterChangeHook,
  type CollectionAfterDeleteHook,
  type CollectionBeforeChangeHook,
  type GlobalAfterChangeHook,
  type GlobalBeforeChangeHook,
} from 'payload'

import { hasRole, PUBLISHER_ROLES } from '../access/roles'

/**
 * BASL approval rule: only compliance officers (or admins) can publish. Editors
 * can still write and save drafts, which compliance then reviews and publishes.
 * Local API calls without a user (seed script, server actions) are trusted.
 */
const assertCanPublish = (
  data: Record<string, unknown> | undefined,
  user: Parameters<typeof hasRole>[0],
  isLocalWithoutUser: boolean,
) => {
  if (data?._status !== 'published' || isLocalWithoutUser) return
  if (!hasRole(user, ...PUBLISHER_ROLES)) {
    throw new APIError(
      'Only a compliance officer or admin can publish. Save as draft and ask compliance to review.',
      403,
      undefined,
      true,
    )
  }
}

export const enforcePublishRole: CollectionBeforeChangeHook = ({ data, req }) => {
  assertCanPublish(data, req.user, req.payloadAPI === 'local' && !req.user)
  return data
}

export const enforcePublishRoleGlobal: GlobalBeforeChangeHook = ({ data, req }) => {
  assertCanPublish(data, req.user, req.payloadAPI === 'local' && !req.user)
  return data
}

/** Pass `context: { disableRevalidate: true }` from scripts that run outside Next.js. */
const revalidateSite = (context: Record<string, unknown>) => {
  if (context.disableRevalidate) return
  revalidatePath('/', 'layout')
}

export const revalidateOnChange: CollectionAfterChangeHook = ({ doc, previousDoc, req }) => {
  if (doc?._status === 'published' || previousDoc?._status === 'published') {
    revalidateSite(req.context)
  }
  return doc
}

export const revalidateOnDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
  revalidateSite(req.context)
  return doc
}

export const revalidateGlobalOnChange: GlobalAfterChangeHook = ({ doc, req }) => {
  if (doc?._status === 'published') revalidateSite(req.context)
  return doc
}
