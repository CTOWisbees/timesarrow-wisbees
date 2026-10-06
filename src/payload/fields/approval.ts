import type { CheckboxField, Field } from 'payload'

import { hasRole } from '../access/roles'

/**
 * Sidebar record of the BASL/compliance sign-off for the published version.
 * Version history keeps every past value, which gives an audit trail per change.
 */
export const approvalField: Field = {
  name: 'approval',
  type: 'group',
  label: 'Compliance approval',
  admin: {
    position: 'sidebar',
    description: 'Record the BASL approval for the content being published.',
  },
  access: {
    update: ({ req }) => hasRole(req.user, 'admin', 'compliance'),
  },
  fields: [
    { name: 'reference', type: 'text', label: 'BASL approval reference' },
    { name: 'approvedOn', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
    { name: 'approvedBy', type: 'text' },
    { name: 'notes', type: 'textarea' },
  ],
}

/** A boolean that compliance can switch off to hide a sensitive element on the site. */
export const complianceToggle = (
  name: string,
  label: string,
  description?: string,
  defaultValue = true,
): CheckboxField => ({
  name,
  type: 'checkbox',
  label,
  defaultValue,
  admin: { description },
})
