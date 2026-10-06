import type { Field, GlobalConfig, Tab } from 'payload'

import { complianceToggle } from '../fields/approval'
import { linkGroup } from '../fields/link'
import { contentGlobal } from '../workflow'

const enabled: Field = {
  name: 'enabled',
  type: 'checkbox',
  label: 'Show this section',
  defaultValue: true,
}

const disclaimer = (description = 'Shown directly under this section.'): Field => ({
  name: 'disclaimer',
  type: 'textarea',
  admin: { description },
})

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
          disclaimer(),
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
          disclaimer(),
        ]),
        sectionTab('illustration', 'Illustration band', [
          { name: 'image', type: 'upload', relationTo: 'media' },
        ]),
        sectionTab('portfolios', 'Model portfolios', [
          { name: 'title', type: 'textarea', required: true },
          { name: 'intro', type: 'textarea' },
          disclaimer('Mandatory: portfolios shown are illustrative and not a recommendation.'),
        ]),
        sectionTab('gallery', 'Gallery', [
          { name: 'title', type: 'text', required: true },
          { name: 'backgroundImage', type: 'upload', relationTo: 'media' },
          linkGroup('cta', 'See all link'),
        ]),
        sectionTab('faq', 'FAQ', [
          { name: 'eyebrow', type: 'text' },
          { name: 'title', type: 'textarea', required: true },
        ]),
        sectionTab('bookCall', 'Book a call', [
          { name: 'eyebrow', type: 'text' },
          { name: 'title', type: 'text', required: true },
          { name: 'description', type: 'textarea' },
          {
            name: 'benefits',
            type: 'array',
            fields: [{ name: 'text', type: 'text', required: true }],
          },
          complianceToggle('showSlotPicker', 'Let visitors pick a day and time'),
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
            admin: { description: 'Visitors must tick this before submitting. Stored with each booking.' },
          },
          { name: 'submitLabel', type: 'text', defaultValue: 'Submit to book a call' },
          { name: 'successTitle', type: 'text', defaultValue: 'Your call is booked' },
          { name: 'successMessage', type: 'textarea' },
        ]),
      ],
    },
  ],
})
