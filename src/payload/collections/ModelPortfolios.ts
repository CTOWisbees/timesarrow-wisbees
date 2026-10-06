import type { CollectionConfig } from 'payload'

import { complianceToggle } from '../fields/approval'
import { contentCollection } from '../workflow'

export const RISK_LEVELS = ['conservative', 'moderate', 'aggressive'] as const

export const ModelPortfolios: CollectionConfig = contentCollection({
  slug: 'model-portfolios',
  labels: { singular: 'Model portfolio', plural: 'Model portfolios' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'riskLevel', 'order', '_status'],
    group: 'Content',
  },
  defaultSort: 'order',
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'riskLevel',
          type: 'select',
          required: true,
          options: RISK_LEVELS.map((value) => ({
            label: value[0].toUpperCase() + value.slice(1),
            value,
          })),
          admin: { description: 'Also sets the card colour.' },
        },
        { name: 'order', type: 'number', defaultValue: 0 },
      ],
    },
    { name: 'description', type: 'textarea', required: true },
    {
      type: 'collapsible',
      label: 'Key figures',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'expectedReturn', type: 'text', admin: { placeholder: '8–10% p.a.' } },
            { name: 'minimumEntry', type: 'text', admin: { placeholder: '₹499/month' } },
          ],
        },
        complianceToggle(
          'showExpectedReturn',
          'Show expected return',
          'Switch off if compliance does not approve publishing a return band.',
        ),
      ],
    },
    {
      type: 'collapsible',
      label: 'Badge',
      fields: [
        { name: 'badge', type: 'text', admin: { placeholder: 'Most popular' } },
        complianceToggle('showBadge', 'Show badge', undefined, false),
      ],
    },
    {
      type: 'collapsible',
      label: 'Composition',
      fields: [
        {
          name: 'holdings',
          type: 'array',
          labels: { singular: 'Holding', plural: 'Holdings' },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'logo', type: 'upload', relationTo: 'media' },
              ],
            },
          ],
        },
        complianceToggle(
          'showHoldings',
          'Show holdings',
          'Switch off to hide named securities on the website.',
        ),
      ],
    },
    {
      name: 'detailsHref',
      type: 'text',
      label: 'Details link',
      defaultValue: '#book-call',
    },
  ],
})
