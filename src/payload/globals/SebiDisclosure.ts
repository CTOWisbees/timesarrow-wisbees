import type { Field, GlobalConfig } from 'payload'

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

/** Complaint disposal trend table (monthly or annual). */
const disposalTable = (name: string, label: string, periodLabel: string, placeholder: string): Field => ({
  name,
  label,
  type: 'array',
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'period', label: periodLabel, type: 'text', required: true, admin: { placeholder } },
        { name: 'carriedForward', type: 'number', defaultValue: 0 },
        { name: 'received', type: 'number', defaultValue: 0 },
        { name: 'resolved', type: 'number', defaultValue: 0 },
        { name: 'pending', type: 'number', defaultValue: 0 },
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
            {
              name: 'sebiRegionalOffice',
              type: 'textarea',
              label: 'Corresponding SEBI office',
              admin: { description: 'One line per row. Shown as written.' },
            },
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
          label: 'Complaints',
          description: 'Each table appears on /sebi-disclosure only once it has rows.',
          fields: [
            {
              name: 'complaintSteps',
              label: 'How to raise a complaint (steps)',
              type: 'array',
              admin: { description: 'Shown as numbered steps. The Compliance Officer contact is added under step 1 automatically.' },
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'text', type: 'textarea', required: true },
                { name: 'linkLabel', type: 'text' },
                { name: 'linkHref', type: 'text' },
              ],
            },
            { name: 'physicalComplaints', label: 'Physical complaints (address note)', type: 'textarea' },
            { name: 'complaintsAsOf', type: 'text', admin: { placeholder: 'September 2026' } },
            {
              name: 'complaintRows',
              label: 'Complaints received (current month)',
              type: 'array',
              fields: [
                { name: 'source', type: 'text', required: true, admin: { placeholder: 'Directly from investors' } },
                {
                  type: 'row',
                  fields: [
                    { name: 'pendingLastMonth', label: 'Pending at end of last month', type: 'number', defaultValue: 0 },
                    { name: 'received', type: 'number', defaultValue: 0 },
                    { name: 'resolved', type: 'number', defaultValue: 0 },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'totalPending', type: 'number', defaultValue: 0 },
                    { name: 'pendingOver3Months', label: 'Pending > 3 months', type: 'number', defaultValue: 0 },
                    { name: 'avgResolutionDays', label: 'Avg. resolution time (days)', type: 'number', defaultValue: 0 },
                  ],
                },
              ],
            },
            disposalTable('monthlyDisposal', 'Trend of monthly disposal', 'Month', 'Sep 2026'),
            disposalTable('annualDisposal', 'Trend of annual disposal', 'Year', '2026-27'),
          ],
        },
        {
          label: 'Grievance and audit',
          fields: [
            {
              name: 'escalationMatrix',
              label: 'Grievance escalation matrix',
              type: 'array',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'designation', type: 'text', required: true },
                    { name: 'contactPerson', type: 'text', required: true },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'phone', type: 'text' },
                    { name: 'email', type: 'text' },
                    { name: 'workingHours', type: 'text' },
                  ],
                },
              ],
            },
            {
              name: 'complianceAudits',
              label: 'Annual compliance audit status',
              type: 'array',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'financialYear', type: 'text', required: true, admin: { placeholder: 'FY 2026-27' } },
                    { name: 'status', type: 'text', required: true, admin: { placeholder: 'Conducted' } },
                    { name: 'remarks', type: 'text' },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Investor charter',
          description: 'SEBI Investor Charter for Investment Advisers (Annexure A). Shown on /sebi-disclosure.',
          fields: [
            {
              name: 'charter',
              type: 'array',
              labels: { singular: 'Section', plural: 'Sections' },
              admin: { initCollapsed: true },
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'intro', type: 'textarea' },
                {
                  name: 'items',
                  type: 'array',
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        { name: 'text', type: 'textarea', required: true, admin: { width: '75%' } },
                        {
                          name: 'kind',
                          type: 'select',
                          defaultValue: 'item',
                          options: [
                            { label: 'Point', value: 'item' },
                            { label: 'Sub-point', value: 'subitem' },
                            { label: 'Sub-heading', value: 'heading' },
                          ],
                          admin: { width: '25%' },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
})
