import type { Access, FieldAccess, PayloadRequest } from 'payload'

export const ROLES = ['admin', 'compliance', 'editor'] as const
export type Role = (typeof ROLES)[number]

type MaybeUser = PayloadRequest['user']

export const hasRole = (user: MaybeUser, ...roles: Role[]): boolean =>
  Boolean(user && 'role' in user && roles.includes(user.role as Role))

/** Roles allowed to move a draft to published. Editors can only save drafts. */
export const PUBLISHER_ROLES: Role[] = ['admin', 'compliance']

export const anyone: Access = () => true
export const authenticated: Access = ({ req }) => Boolean(req.user)
export const adminOnly: Access = ({ req }) => hasRole(req.user, 'admin')
export const adminOrCompliance: Access = ({ req }) => hasRole(req.user, 'admin', 'compliance')
export const adminFieldOnly: FieldAccess = ({ req }) => hasRole(req.user, 'admin')
/** Staff-only fields (e.g. risk scores): stripped from public API responses and page renders. */
export const adminOrComplianceField: FieldAccess = ({ req }) => hasRole(req.user, 'admin', 'compliance')

/**
 * Public visitors only ever see published content. Logged-in staff can also read
 * drafts, which powers draft preview and the admin UI.
 */
export const publishedOrStaff: Access = ({ req }) => {
  if (req.user) return true
  return { _status: { equals: 'published' } }
}
