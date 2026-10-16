import type { Field, GlobalConfig } from 'payload'

import { hasRole } from '../access/roles'
import { contentGlobal } from '../workflow'

/**
 * Portfolio Scan scoring and red-flag thresholds. Defaults are the spec's starting
 * points (src/lib/portfolio/config.ts); compliance tunes them here after calibration.
 * Percentages are whole numbers (20 = 20%). The published version's date is stored
 * with every analysis, so old results stay explainable.
 */
const num = (name: string, label: string, defaultValue: number, description?: string, extra: Partial<Field> = {}): Field =>
  ({ name, label, type: 'number', required: true, defaultValue, admin: { width: '33%', description }, ...extra }) as Field

const range = (name: string, label: string, bad: number, good: number, unit: string): Field => ({
  name,
  label,
  type: 'group',
  admin: { description: `Score is 0 at "bad" and 100 at "good", linear in between (${unit}).` },
  fields: [{ type: 'row', fields: [num('bad', 'Bad', bad), num('good', 'Good', good)] }],
})

const severity = (id: string, label: string, defaultValue: string): Field => ({
  name: id,
  label,
  type: 'select',
  required: true,
  defaultValue,
  options: ['critical', 'high', 'medium', 'low', 'info'].map((v) => ({ label: v[0].toUpperCase() + v.slice(1), value: v })),
  admin: { width: '33%' },
})

export const ScanConfig: GlobalConfig = contentGlobal({
  slug: 'scan-config',
  label: 'Portfolio Scan scoring',
  admin: {
    group: 'Compliance',
    description: 'Thresholds behind the health score and red flags. Changes apply to new analyses once published.',
  },
  access: { update: ({ req }) => hasRole(req.user, 'admin', 'compliance') },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Score',
          fields: [
            {
              name: 'weights',
              type: 'group',
              admin: { description: 'Relative weights of the five sub-scores. Not-applicable sub-scores are dropped and the rest rescaled.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    num('diversification', 'Diversification', 25),
                    num('concentration', 'Concentration', 20),
                    num('risk', 'Risk', 20),
                    num('assetMix', 'Asset mix', 20),
                    num('cost', 'Cost', 15),
                  ],
                },
              ],
            },
            range('effectiveHoldings', 'Diversification: effective holdings', 3, 15, 'count'),
            range('effectiveSectors', 'Diversification: effective sectors', 2, 8, 'count'),
            range('top1', 'Concentration: largest holding', 40, 10, '% of portfolio'),
            range('top5', 'Concentration: top 5 holdings', 80, 40, '% of portfolio'),
            range('volRatio', 'Risk: volatility ÷ benchmark volatility', 1.5, 0.8, 'ratio'),
            range('ter', 'Cost: weighted expense ratio', 2, 0.5, '% a year'),
            range('regularShare', 'Cost: share in regular plans', 60, 0, '% of fund value'),
            {
              name: 'bands',
              type: 'group',
              fields: [{ type: 'row', fields: [num('healthy', 'Healthy from', 80), num('fair', 'Fair from', 60), num('attention', 'Needs attention from', 40)] }],
            },
            {
              type: 'row',
              fields: [
                num('criticalCap', 'Cap with a critical flag', 59, 'A critical red flag limits the overall score to this.'),
                num('provisionalBelow', 'Provisional below coverage %', 70, 'Below this data coverage the score is shown as a range.'),
              ],
            },
          ],
        },
        {
          label: 'Asset mix',
          description: 'Points taken off the asset-mix sub-score (starts at 100, never below 0).',
          fields: [
            {
              name: 'penalties',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    num('oneClassAbove90', 'One asset class above 90%', 30),
                    num('oneClass80to90', 'One asset class 80–90%', 15),
                    num('equityNoDebtGold', 'Equity above 70%, no debt or gold', 15),
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    num('cashAbove25', 'Cash above 25%', 20),
                    num('cash10to25', 'Cash 10–25%', 10),
                    num('shortHorizonEquity', 'Horizon under 3 years, equity above 60%', 25),
                  ],
                },
                { type: 'row', fields: [num('goldAbove20', 'Gold above 20%', 10), num('thematicAbove30', 'Thematic funds above 30%', 15)] },
              ],
            },
          ],
        },
        {
          label: 'Red flags',
          fields: [
            {
              name: 'flags',
              type: 'group',
              label: 'Thresholds',
              fields: [
                {
                  type: 'row',
                  fields: [
                    num('singleStock', 'R01 single stock above %', 20),
                    num('singleStockCritical', 'R01 critical above %', 35),
                    num('top5', 'R02 top 5 above %', 60),
                  ],
                },
                {
                  type: 'row',
                  fields: [num('sector', 'R03 one sector above %', 35), num('equityShortHorizon', 'R04 equity above % (horizon < 3 years)', 90), num('cash', 'R06 cash above %', 20)],
                },
                {
                  type: 'row',
                  fields: [
                    num('regularShare', 'R07 regular plans above % of funds', 30),
                    num('fundsPerCategory', 'R08 funds in one category above', 3),
                    num('equityFunds', 'R08 equity funds above', 8),
                  ],
                },
                {
                  type: 'row',
                  fields: [num('smallCap', 'R09 small caps above %', 25), num('volRatio', 'R10 volatility ratio above', 1.3), num('benchmarkGap', 'R11 behind benchmark by points', 3)],
                },
                { type: 'row', fields: [num('unpriced', 'R13 unpriced above %', 10), num('thematic', 'R14 thematic above %', 30)] },
              ],
            },
            {
              name: 'severities',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [severity('R01', 'R01 single stock', 'high'), severity('R02', 'R02 top 5', 'high'), severity('R03', 'R03 sector', 'medium')],
                },
                {
                  type: 'row',
                  fields: [severity('R04', 'R04 short horizon', 'high'), severity('R05', 'R05 no debt or gold', 'medium'), severity('R06', 'R06 cash', 'low')],
                },
                {
                  type: 'row',
                  fields: [severity('R07', 'R07 regular plans', 'medium'), severity('R08', 'R08 too many funds', 'medium'), severity('R09', 'R09 small caps', 'medium')],
                },
                {
                  type: 'row',
                  fields: [severity('R10', 'R10 volatility', 'medium'), severity('R11', 'R11 behind benchmark', 'medium'), severity('R12', 'R12 delisted/matured', 'high')],
                },
                { type: 'row', fields: [severity('R13', 'R13 unpriced', 'info'), severity('R14', 'R14 thematic', 'medium')] },
              ],
            },
            num('freeFlagsShown', 'Flags shown in full before sign-up', 3, undefined, { admin: { width: '33%' } }),
          ],
        },
        {
          label: 'Paid analysis',
          description: 'Assumptions behind illustrations in the paid plans. Shown to users as assumptions, never as forecasts.',
          fields: [
            {
              name: 'paid',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    num('assumedReturn', 'Assumed gross return % a year', 10),
                    num('dragYears', 'Expense drag horizon (years)', 10),
                    num('singleStockFall', 'Single-stock fall for impact %', 30),
                  ],
                },
                { type: 'row', fields: [num('cashYield', 'Cash yield % a year', 3), num('riskFreeRate', 'Risk-free rate % a year', 6.5)] },
              ],
            },
          ],
        },
        {
          label: 'Limits',
          fields: [{ type: 'row', fields: [num('maxHoldings', 'Max holdings per portfolio', 500), num('maxFileMb', 'Max upload size (MB)', 10)] }],
        },
      ],
    },
  ],
})
