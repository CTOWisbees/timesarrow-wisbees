import type { GlobalConfig } from 'payload'

import { adminOrComplianceField } from '../access/roles'
import { contentGlobal } from '../workflow'

/**
 * Onboarding step 2: the risk-profiling questionnaire, owned by the onboarding team.
 *
 * Applicants see the questions and answer labels only. Answer scores and the score
 * bands are readable by admin and compliance alone, so they never reach the public
 * API or the page; the server scores submissions (src/lib/risk-score.ts) and stores a
 * snapshot on the application.
 */
export const RiskProfile: GlobalConfig = contentGlobal({
  slug: 'risk-profile',
  label: 'Risk profile questions',
  admin: {
    group: 'Site',
    description: 'The multiple-choice questions in onboarding step 2. Scores and categories are never shown to applicants.',
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'submitLabel', type: 'text', required: true, defaultValue: 'Submit application' },
      ],
    },
    { name: 'description', type: 'textarea' },
    {
      name: 'questions',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Question', plural: 'Questions' },
      admin: { initCollapsed: true },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'key',
              type: 'text',
              required: true,
              admin: {
                width: '30%',
                description: 'Short stable id, e.g. "priorities". Answers are stored against it, so do not change it once live.',
              },
            },
            { name: 'question', type: 'text', required: true, admin: { width: '70%' } },
          ],
        },
        { name: 'help', type: 'text', admin: { description: 'Optional hint shown under the question.' } },
        {
          name: 'answers',
          type: 'array',
          minRows: 2,
          maxRows: 6,
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'label', type: 'text', required: true, admin: { width: '80%' } },
                {
                  name: 'score',
                  type: 'number',
                  required: true,
                  min: 0,
                  access: { read: adminOrComplianceField },
                  admin: { width: '20%', description: 'Hidden from applicants.' },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'bands',
      label: 'Score bands',
      type: 'array',
      minRows: 1,
      access: { read: adminOrComplianceField },
      admin: { description: 'Total score → category and equity limit. Hidden from applicants. Bands must not overlap.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'min', type: 'number', required: true, admin: { width: '15%' } },
            { name: 'max', type: 'number', required: true, admin: { width: '15%' } },
            { name: 'category', type: 'text', required: true, admin: { width: '35%' } },
            { name: 'equityLimit', type: 'text', admin: { width: '35%', placeholder: 'up to 50% equity' } },
          ],
        },
      ],
    },
  ],
})
