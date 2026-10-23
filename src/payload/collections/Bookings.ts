import type { CollectionConfig } from 'payload'

import { adminOrCompliance, hasRole } from '../access/roles'

/**
 * "Talk to an expert" call requests. Created only by the server action through the
 * Local API (public REST create is closed). Contains personal data, so only admin
 * and compliance can read it.
 */
export const Bookings: CollectionConfig = {
  slug: 'bookings',
  labels: { singular: 'Call booking', plural: 'Call bookings' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['fullName', 'mobile', 'email', 'preferredAt', 'status', 'createdAt'],
    group: 'Leads',
    description: 'Requests from the "Talk to an expert" form on the home page.',
  },
  defaultSort: '-createdAt',
  access: {
    create: () => false,
    read: adminOrCompliance,
    update: adminOrCompliance,
    delete: ({ req }) => hasRole(req.user, 'admin'),
  },
  fields: [
    { name: 'fullName', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'mobile', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
      ],
    },
    { name: 'preferredSlot', type: 'text', admin: { description: 'Day and time picked by the visitor, as shown to them (Indian time).' } },
    {
      name: 'preferredAt',
      type: 'date',
      admin: { description: 'The same slot as an exact date and time, for sorting and calendars.', date: { pickerAppearance: 'dayAndTime' } },
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Closed', value: 'closed' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'internalNotes', type: 'textarea', admin: { position: 'sidebar' } },
    {
      type: 'collapsible',
      label: 'Consent record',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'consentText',
          type: 'textarea',
          required: true,
          admin: { readOnly: true, description: 'Exact consent wording shown at submission.' },
        },
        { name: 'consentAt', type: 'date', required: true, admin: { readOnly: true } },
        { name: 'source', type: 'text', admin: { readOnly: true } },
        { name: 'ipHash', type: 'text', admin: { readOnly: true, hidden: true }, index: true },
        // Hash of the one-time token that lets the visitor add a slot in step 2. Cleared once used.
        { name: 'slotTokenHash', type: 'text', admin: { hidden: true }, index: true },
      ],
    },
  ],
}
