import type { GlobalConfig } from 'payload'

import { hasRole } from '../access/roles'
import { linkArray } from '../fields/link'
import { contentGlobal } from '../workflow'

const officer = (name: string, label: string) => ({
  name,
  label,
  type: 'group' as const,
  fields: [
    {
      type: 'row' as const,
      fields: [
        { name: 'name', type: 'text' as const },
        { name: 'phone', type: 'text' as const },
        { name: 'email', type: 'text' as const },
      ],
    },
  ],
})

/**
 * Mandatory regulatory disclosure shown in the site footer and on /sebi-disclosure.
 * Only admin and compliance can edit it.
 */
export const SebiDisclosure: GlobalConfig = contentGlobal({
  slug: 'sebi-disclosure',
  label: 'SEBI disclosure',
  admin: { group: 'Compliance' },
  access: {
    update: ({ req }) => hasRole(req.user, 'admin', 'compliance'),
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Registration',
          fields: [
            { name: 'firmName', type: 'text', required: true },
            { name: 'registeredAddress', type: 'textarea' },
            { name: 'phone', type: 'text' },
            {
              type: 'row',
              fields: [
                {
                  name: 'registrationType',
                  type: 'text',
                  admin: { placeholder: 'Investment Adviser, non-individual' },
                },
                { name: 'sebiRegistrationNumber', type: 'text', label: 'SEBI registration no.' },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'validity',
                  type: 'text',
                  defaultValue: 'Valid till cancelled by SEBI',
                },
                { name: 'baslId', type: 'text', label: 'BSE / BASL ID' },
              ],
            },
            { name: 'sebiRegionalOffice', type: 'textarea', label: 'Corresponding SEBI regional office' },
            officer('principalOfficer', 'Principal Officer'),
            officer('complianceOfficer', 'Compliance Officer'),
          ],
        },
        {
          label: 'Disclaimers',
          fields: [
            {
              name: 'disclaimers',
              type: 'array',
              minRows: 1,
              admin: {
                description: 'Shown in full in the footer of every page. Use the legally approved wording.',
              },
              fields: [{ name: 'text', type: 'textarea', required: true }],
            },
            linkArray('legalLinks', 'Footer legal links'),
          ],
        },
        {
          label: 'Disclosure page',
          fields: [
            {
              name: 'pageBody',
              type: 'richText',
              admin: {
                description:
                  'Investor charter, complaint statistics, SCORES link and other content for /sebi-disclosure.',
              },
            },
          ],
        },
      ],
    },
  ],
})
