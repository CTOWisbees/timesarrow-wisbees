import type { CollectionConfig } from 'payload'

import { contentCollection } from '../workflow'

export const GalleryItems: CollectionConfig = contentCollection({
  slug: 'gallery-items',
  labels: { singular: 'Gallery item', plural: 'Gallery' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'order', '_status'],
    group: 'Content',
  },
  defaultSort: 'order',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'image', type: 'upload', relationTo: 'media', admin: { description: 'Shown large on the right, and as a thumbnail. Landscape works best (16:10).' } },
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'Shown beside the large image. Two or three sentences.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'date', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
        { name: 'location', type: 'text', admin: { placeholder: 'Bengaluru' } },
        { name: 'href', type: 'text', label: 'Link (optional)' },
      ],
    },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
})
