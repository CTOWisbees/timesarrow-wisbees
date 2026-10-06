import type { CollectionConfig } from 'payload'

import { contentCollection } from '../workflow'

export const Faqs: CollectionConfig = contentCollection({
  slug: 'faqs',
  labels: { singular: 'FAQ', plural: 'FAQs' },
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'order', '_status'],
    group: 'Content',
  },
  defaultSort: 'order',
  fields: [
    { name: 'question', type: 'text', required: true },
    { name: 'answer', type: 'richText', required: true },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
})
