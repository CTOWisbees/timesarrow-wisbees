import type { Field } from 'payload'

export const linkFields = (required = true): Field[] => [
  {
    type: 'row',
    fields: [
      { name: 'label', type: 'text', required },
      {
        name: 'href',
        type: 'text',
        required,
        admin: { description: 'A path like /about, an anchor like #book-call, or a full URL.' },
      },
    ],
  },
]

export const linkGroup = (name: string, label?: string): Field => ({
  name,
  label,
  type: 'group',
  fields: linkFields(),
})

export const linkArray = (name: string, label?: string): Field => ({
  name,
  label,
  type: 'array',
  fields: linkFields(),
})
