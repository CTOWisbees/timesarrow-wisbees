import 'server-only'

import { findApplication } from './applications'
import { APPLICATION_STATUSES } from './onboarding'
import { getCurrentUser } from './supabase/server'

export type AccountSummary = {
  name: string
  maskedName: string
  maskedEmail: string
  avatarUrl: string | null
  initials: string
  statusLabel: string
}

/** "Amogha Raj Sandur" → "Amogha R*** S***": enough to recognise, not to read over a shoulder. */
export function maskName(name: string) {
  const [first = '', ...rest] = name.trim().split(/\s+/)
  return [first, ...rest.map((w) => `${w[0]}***`)].join(' ')
}

/** "amogha@wisbees.com" → "am****@wisbees.com". */
export function maskEmail(email: string) {
  const [local = '', domain = ''] = email.split('@')
  const keep = local.slice(0, Math.min(2, Math.max(1, local.length - 1)))
  return `${keep}${'*'.repeat(Math.max(3, local.length - keep.length))}@${domain}`
}

/** What the site header shows for a signed-in visitor, or null. Rendered on the server so it appears at once. */
export async function getAccountSummary(): Promise<AccountSummary | null> {
  const user = await getCurrentUser()
  if (!user) return null
  const application = await findApplication(user.id)
  const name = application?.fullName || user.fullName || user.email.split('@')[0]
  const status = application?.status ?? 'profile_pending'
  return {
    name,
    maskedName: maskName(name),
    maskedEmail: maskEmail(application?.email || user.email),
    avatarUrl: user.avatarUrl,
    initials: name
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    statusLabel: APPLICATION_STATUSES.find((s) => s.value === status)?.label ?? status,
  }
}
