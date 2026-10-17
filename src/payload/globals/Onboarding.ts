import type { GlobalConfig } from 'payload'

import { variantOptions } from '@/lib/section-variants'

import { contentGlobal } from '../workflow'

/** Copy for the login / sign-up and onboarding pages. */
export const Onboarding: GlobalConfig = contentGlobal({
  slug: 'onboarding',
  label: 'Login and onboarding',
  admin: { group: 'Site' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          name: 'brand',
          label: 'Left panel (no longer shown)',
          admin: { condition: () => false },
          fields: [
            { name: 'headline', type: 'textarea', required: true, admin: { description: 'One line per row. Keep it short.' } },
            { name: 'message', type: 'textarea', admin: { description: 'One or two sentences under the headline.' } },
            {
              name: 'illustration',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Shown under the message on large screens. A placeholder is used until one is uploaded.' },
            },
          ],
        },
        {
          name: 'account',
          label: 'Step 1: Account',
          fields: [
            { name: 'signUpTitle', type: 'text', required: true },
            { name: 'signUpDescription', type: 'textarea' },
            { name: 'logInTitle', type: 'text', required: true },
            { name: 'logInDescription', type: 'textarea' },
            {
              name: 'consentText',
              type: 'textarea',
              required: true,
              admin: { description: 'Shown next to the sign-up checkbox and stored with each application.' },
            },
          ],
        },
        {
          name: 'verify',
          label: 'Step 2: Verify and risk profile',
          fields: [
            { name: 'verifyTitle', type: 'text', required: true },
            { name: 'verifyDescription', type: 'textarea' },
            {
              name: 'layout',
              label: 'Step 2 layout',
              type: 'select',
              required: true,
              defaultValue: 'focus',
              options: variantOptions('onboardingProfile'),
              admin: { hidden: true, description: 'No longer used: every step is now a conversation. The questions themselves are in "Risk profile questions".' },
            },
          ],
        },
        {
          name: 'review',
          label: 'Step 3: Review',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'message', type: 'textarea', required: true },
          ],
        },
      ],
    },
  ],
})
