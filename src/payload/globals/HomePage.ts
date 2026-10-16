import type { Field, GlobalConfig, Tab } from 'payload'

import { complianceToggle } from '../fields/approval'
import { linkGroup } from '../fields/link'
import { SECTION_TOGGLES, variantOptions } from '@/lib/section-variants'

import { contentGlobal } from '../workflow'

const enabled: Field = {
  name: 'enabled',
  type: 'checkbox',
  label: 'Show this section',
  defaultValue: true,
}

const sectionTab = (name: string, label: string, fields: Field[]): Tab => ({
  name,
  label,
  fields: [enabled, ...fields],
})

export const HomePage: GlobalConfig = contentGlobal({
  slug: 'home-page',
  label: 'Home page',
  admin: { group: 'Site' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        sectionTab('hero', 'Hero', [
          { name: 'headline', type: 'textarea', required: true, admin: { description: 'One line per row.' } },
          { name: 'subheadline', type: 'textarea' },
          { name: 'image', type: 'upload', relationTo: 'media' },
          {
            type: 'row',
            fields: [linkGroup('secondaryCta', 'Outline button'), linkGroup('primaryCta', 'Filled button')],
          },
        ]),
        sectionTab('highlights', 'Highlights', [
          { name: 'title', type: 'text', required: true },
          { name: 'subtitle', type: 'textarea' },
          linkGroup('cta', 'Button'),
          {
            name: 'items',
            type: 'array',
            maxRows: 8,
            fields: [
              { name: 'title', type: 'text', required: true },
              { name: 'description', type: 'textarea', required: true },
            ],
          },
        ]),
        sectionTab('calculator', 'SIP calculator', [
          { name: 'title', type: 'text', required: true },
          {
            type: 'row',
            fields: [
              { name: 'minAmount', type: 'number', defaultValue: 500, required: true },
              { name: 'maxAmount', type: 'number', defaultValue: 100000, required: true },
              { name: 'step', type: 'number', defaultValue: 500, required: true },
              { name: 'defaultAmount', type: 'number', defaultValue: 20000, required: true },
            ],
          },
          {
            name: 'sliderMarks',
            type: 'array',
            fields: [{ name: 'value', type: 'number', required: true }],
          },
          {
            name: 'stepUpPercent',
            type: 'number',
            defaultValue: 10,
            admin: { description: 'Annual SIP increase. 0 disables the step-up.' },
          },
          {
            name: 'riskBands',
            type: 'array',
            minRows: 1,
            fields: [
              {
                type: 'row',
                fields: [
                  { name: 'label', type: 'text', required: true },
                  {
                    name: 'annualReturn',
                    type: 'number',
                    required: true,
                    admin: { description: 'Assumed yearly return, in %.' },
                  },
                  { name: 'isDefault', type: 'checkbox' },
                ],
              },
            ],
          },
          complianceToggle(
            'showReturnAssumptions',
            'Show return % on risk options',
            'When off, risk options show only their label.',
          ),
          {
            name: 'horizons',
            type: 'array',
            minRows: 1,
            fields: [{ name: 'years', type: 'number', required: true }],
          },
          { name: 'defaultHorizon', type: 'number', defaultValue: 20 },
        ]),
        sectionTab('illustration', 'Illustration band', [
          { name: 'image', type: 'upload', relationTo: 'media' },
        ]),
        sectionTab('portfolios', 'Model portfolios', [
          { name: 'title', type: 'textarea', required: true },
          { name: 'intro', type: 'textarea' },
        ]),
        sectionTab('gallery', 'Gallery', [
          {
            name: 'variant',
            label: 'Layout',
            type: 'select',
            required: true,
            defaultValue: 'immersive',
            options: variantOptions('gallery'),
            admin: { description: 'Which design of this section the website shows. Developers can preview the others locally.' },
          },
          { name: 'title', type: 'text', required: true },
          linkGroup('cta', 'See all link'),
          {
            name: 'autoplaySeconds',
            type: 'number',
            defaultValue: 6,
            min: 3,
            max: 30,
            admin: { description: 'Seconds each photo stays before the next one loads. The slideshow loops.' },
          },
        ]),
        sectionTab('faq', 'FAQ', [
          { name: 'title', type: 'textarea', required: true },
        ]),
        sectionTab('bookCall', 'Book a call', [
          {
            name: 'variant',
            label: 'Layout',
            type: 'select',
            required: true,
            defaultValue: 'two-step',
            options: variantOptions('bookCall'),
            admin: { description: 'How the form is laid out. Developers can preview the others locally.' },
          },
          {
            name: 'fieldIcons',
            label: 'Field icons',
            type: 'select',
            hasMany: true,
            defaultValue: ['day', 'time'],
            options: SECTION_TOGGLES.bookCall.options.map((o) => ({ value: o.value, label: o.label })),
            admin: { description: 'Which fields show a small icon (form layouts only).' },
          },
          {
            type: 'collapsible',
            label: 'Microsoft Bookings (layout "Microsoft Bookings")',
            admin: { initCollapsed: true },
            fields: [
              {
                name: 'msBookingsUrl',
                label: 'Booking page link',
                type: 'text',
                admin: {
                  description:
                    'From Bookings → Booking page → Embed (copy the link). The page must be published and open to anyone, not only your organisation.',
                },
              },
              {
                type: 'row',
                fields: [
                  {
                    name: 'msBookingsDisplay',
                    label: 'Show as',
                    type: 'select',
                    defaultValue: 'embed',
                    options: [
                      { label: 'Embedded in the page', value: 'embed' },
                      { label: 'Button that opens it', value: 'link' },
                    ],
                  },
                  { name: 'msBookingsLinkLabel', label: 'Button / link text', type: 'text', defaultValue: 'Open the booking page' },
                ],
              },
              { name: 'msBookingsNote', label: 'Text above the booking page', type: 'textarea' },
            ],
          },
          { name: 'title', type: 'text', required: true },
          { name: 'description', type: 'textarea' },
          {
            name: 'illustration',
            type: 'upload',
            relationTo: 'media',
            admin: { description: 'Vector illustration shown under the heading. A placeholder is used until one is uploaded.' },
          },
          complianceToggle(
            'showSlotPicker',
            'Offer step 2: pick a day and time',
            'Optional second step shown after the details are saved.',
          ),
          {
            name: 'slotStepTitle',
            type: 'text',
            defaultValue: 'Pick a time that suits you',
            admin: { condition: (_, siblingData) => Boolean(siblingData?.showSlotPicker) },
          },
          {
            name: 'slotStepDescription',
            type: 'textarea',
            admin: { condition: (_, siblingData) => Boolean(siblingData?.showSlotPicker) },
          },
          {
            name: 'timeSlots',
            type: 'array',
            admin: { condition: (_, siblingData) => Boolean(siblingData?.showSlotPicker) },
            fields: [{ name: 'label', type: 'text', required: true }],
          },
          {
            name: 'consentText',
            type: 'textarea',
            required: true,
            admin: { description: 'Shown just above the button; submitting the form counts as agreeing. Stored with each booking.' },
          },
          { name: 'submitLabel', type: 'text', defaultValue: 'Book a call' },
          { name: 'successTitle', type: 'text', defaultValue: 'Your call is booked' },
          { name: 'successMessage', type: 'textarea' },
        ]),
      ],
    },
  ],
})
