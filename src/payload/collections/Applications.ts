import type { CollectionConfig } from 'payload'

import { APPLICATION_STATUSES } from '@/lib/onboarding'

import { adminOrCompliance, hasRole } from '../access/roles'

const select = (list: readonly { value: string; label: string }[]) => list.map(({ value, label }) => ({ value, label }))

/**
 * Sign-up applications from the onboarding flow (/login → /onboarding). One per
 * Supabase Auth user. Written only by server actions keyed on the verified session;
 * REST create/read is closed. Holds personal data and risk scores, so only admin
 * and compliance can read it.
 */
export const Applications: CollectionConfig = {
  slug: 'applications',
  labels: { singular: 'Application', plural: 'Applications' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['fullName', 'email', 'riskCategory', 'riskScore', 'status', 'submittedAt'],
    group: 'Leads',
    description: 'People who signed up and completed (or started) onboarding.',
  },
  defaultSort: '-createdAt',
  access: {
    create: () => false,
    read: adminOrCompliance,
    update: adminOrCompliance,
    delete: ({ req }) => hasRole(req.user, 'admin'),
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'fullName', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'phone', type: 'text' },
      ],
    },
    {
      type: 'collapsible',
      label: 'Risk profile',
      admin: { description: 'Scored on the server from the applicant\'s answers in step 2. Never shown to the applicant.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'riskCategory', type: 'text', label: 'Category', admin: { readOnly: true } },
            { name: 'riskScore', type: 'number', label: 'Total score', admin: { readOnly: true } },
            { name: 'equityLimit', type: 'text', admin: { readOnly: true } },
          ],
        },
        {
          name: 'riskAnswers',
          label: 'Answers (as submitted)',
          type: 'array',
          admin: { readOnly: true, initCollapsed: false },
          fields: [
            { name: 'questionKey', type: 'text', admin: { hidden: true } },
            { name: 'question', type: 'text' },
            {
              type: 'row',
              fields: [
                { name: 'answer', type: 'text', admin: { width: '80%' } },
                { name: 'score', type: 'number', admin: { width: '20%' } },
              ],
            },
          ],
        },
        {
          name: 'questionnaireVersion',
          type: 'date',
          admin: { readOnly: true, description: 'When the questions in use were last published.' },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'KYC (filled by adviser)',
      admin: { initCollapsed: true },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'pan', type: 'text', label: 'PAN' },
            { name: 'dateOfBirth', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
            { name: 'city', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'profile_pending',
      options: select(APPLICATION_STATUSES),
      admin: { position: 'sidebar' },
    },
    { name: 'submittedAt', type: 'date', admin: { position: 'sidebar', readOnly: true } },
    { name: 'internalNotes', type: 'textarea', admin: { position: 'sidebar' } },
    {
      type: 'collapsible',
      label: 'Account and consent record',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'supabaseUserId',
          type: 'text',
          required: true,
          unique: true,
          index: true,
          admin: { readOnly: true, description: 'Supabase Auth user id.' },
        },
        {
          name: 'authProvider',
          type: 'select',
          options: [
            { label: 'Email code', value: 'email' },
            { label: 'Google', value: 'google' },
          ],
          admin: { readOnly: true },
        },
        {
          name: 'consentText',
          type: 'textarea',
          admin: { readOnly: true, description: 'Exact consent wording shown at sign-up.' },
        },
        { name: 'consentAt', type: 'date', admin: { readOnly: true } },
      ],
    },
  ],
}
