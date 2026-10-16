import type { Field, GlobalConfig } from 'payload'

import { contentGlobal } from '../workflow'

/**
 * Every word on /portfolio-scan and the signed-in portfolio pages: steps, help, errors,
 * score bands, red-flag wording, plan comparison and the disclaimer. Templates use
 * {placeholders} filled from the analysis (e.g. "{pct}% of your portfolio is in {name}").
 */
const text = (name: string, label?: string, description?: string, required = true): Field => ({
  name,
  label,
  type: 'text',
  required,
  admin: description ? { description } : undefined,
})
const area = (name: string, label?: string, description?: string, required = true): Field => ({
  name,
  label,
  type: 'textarea',
  required,
  admin: description ? { description } : undefined,
})

const FLAG_IDS = ['R01', 'R02', 'R03', 'R04', 'R05', 'R06', 'R07', 'R08', 'R09', 'R10', 'R11', 'R12', 'R13', 'R14']
const LOCKED_CARDS = [
  { label: 'Fund overlap', value: 'overlap' },
  { label: 'Expense drag', value: 'drag' },
  { label: 'Worst fall (drawdown)', value: 'drawdown' },
  { label: 'Returns over time', value: 'returns' },
  { label: 'Stress test', value: 'stress' },
  { label: 'Risk ratios', value: 'ratios' },
  { label: 'Rebalancing plan', value: 'rebalance' },
  { label: 'Tax view', value: 'tax' },
  { label: 'What-if', value: 'whatif' },
  { label: 'PDF report', value: 'pdf' },
]

export const PortfolioScan: GlobalConfig = contentGlobal({
  slug: 'portfolio-scan',
  label: 'Portfolio Scan',
  admin: {
    group: 'Site',
    description: 'All copy for the Portfolio Scan page and results. Thresholds live in Compliance → Portfolio Scan scoring.',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Page',
          fields: [
            text('title'),
            area('intro'),
            text('trustLine', 'Trust line', 'Shown under the intro, e.g. that no PAN or phone number is needed.'),
            { type: 'row', fields: [text('uploadTab', 'Upload tab label'), text('manualTab', 'Manual tab label'), text('sampleLink', 'Sample portfolio link')] },
            {
              name: 'showSample',
              label: 'Show the sample portfolio link',
              type: 'checkbox',
              defaultValue: true,
              admin: { description: 'The sample uses real, named funds and stocks. Untick to hide it without a deploy.' },
            },
            {
              name: 'steps',
              type: 'group',
              fields: [{ type: 'row', fields: [text('choose', 'Step 1'), text('review', 'Step 2'), text('details', 'Step 3'), text('results', 'Results')] }],
            },
            area('consentNotice', 'Notice before analysis', 'What is read, what is kept, for how long, and why.'),
          ],
        },
        {
          label: 'Upload',
          fields: [
            text('dropTitle'),
            text('dropHint'),
            text('acceptedSources', 'Accepted sources line'),
            text('whereTitle', '"Where do I get this file?" label'),
            {
              name: 'sources',
              type: 'array',
              labels: { singular: 'Source', plural: 'Sources' },
              admin: { initCollapsed: true, description: 'Short steps per source, shown in the drawer.' },
              fields: [text('name'), area('steps', undefined, 'One step per line.')],
            },
            text('templateLabel', 'CSV template link'),
            { type: 'row', fields: [text('passwordLabel'), text('passwordNote', 'Password note')] },
            {
              name: 'progress',
              type: 'array',
              minRows: 1,
              admin: { description: 'Plain-language steps shown while a file is read.' },
              fields: [text('label')],
            },
            text('aaNote', 'Account Aggregator note', 'Shown with the disabled "connect your accounts" option until a partner is live.'),
            text('mappingTitle', 'Unknown layout: title'),
            area('mappingIntro', 'Unknown layout: intro'),
          ],
        },
        {
          label: 'Manual entry',
          fields: [
            { type: 'row', fields: [text('searchLabel'), text('searchPlaceholder')] },
            { type: 'row', fields: [text('quantityLabel'), text('investedLabel', 'Invested amount label'), text('valueLabel', 'Current value label')] },
            text('valueHelp', 'Value help', 'Shown for stocks, bonds and other items without a live price.'),
            { type: 'row', fields: [text('addCash', 'Add cash label'), text('pasteLabel', 'Paste from Excel label'), text('importCsv', 'Import CSV label')] },
            area('pasteHelp', 'Paste help'),
            text('emptyState'),
          ],
        },
        {
          label: 'Review and details',
          fields: [
            text('reviewTitle'),
            area('reviewIntro'),
            text('purchaseColumn', 'Purchase value column heading'),
            text('unresolvedLabel', 'Unmatched row prompt'),
            text('duplicateNotice', 'Duplicate notice', 'Template: {name}'),
            text('reviewConfirm', 'Confirm button'),
            text('detailsTitle'),
            { type: 'row', fields: [text('holdingPeriodLabel'), text('holdingPeriodWhy', 'Why we ask')] },
            { type: 'row', fields: [text('horizonLabel'), text('horizonWhy', 'Why we ask')] },
            { type: 'row', fields: [text('benchmarkLabel'), text('benchmarkWhy', 'Why we ask')] },
            text('submitLabel', 'Check button'),
          ],
        },
        {
          label: 'Results',
          fields: [
            {
              name: 'bands',
              type: 'group',
              fields: (['healthy', 'fair', 'attention', 'at_risk'] as const).map((b) => ({
                name: b,
                type: 'group' as const,
                fields: [{ type: 'row' as const, fields: [text('label'), text('summary', 'One-line summary', 'Template: {score}, {count} (number of flags)')] }],
              })),
            },
            {
              name: 'subScores',
              type: 'array',
              minRows: 5,
              maxRows: 5,
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'subScore',
                      type: 'select',
                      required: true,
                      options: [
                        { label: 'Diversification', value: 'diversification' },
                        { label: 'Concentration', value: 'concentration' },
                        { label: 'Risk', value: 'risk' },
                        { label: 'Asset mix', value: 'assetMix' },
                        { label: 'Cost', value: 'cost' },
                      ],
                    },
                    text('label'),
                  ],
                },
                area('description'),
              ],
            },
            {
              name: 'statusWords',
              type: 'group',
              admin: { description: 'Word under each sub-score.' },
              fields: [{ type: 'row', fields: [text('good'), text('ok'), text('weak'), text('na', 'Not applicable')] }],
            },
            { type: 'row', fields: [text('flagsTitle'), text('moreFlags', 'More issues line', 'Template: {count}'), text('noFlags', 'No flags')] },
            {
              name: 'savePrompt',
              type: 'group',
              fields: [text('title'), area('body'), { name: 'benefits', type: 'array', fields: [text('text')] }, text('cta'), text('saved', 'Saved confirmation')],
            },
            {
              name: 'blocks',
              type: 'group',
              label: 'Block headings',
              fields: [
                { type: 'row', fields: [text('allocation'), text('effectiveMix', 'Effective mix'), text('sectors')] },
                { type: 'row', fields: [text('holdings', 'Top holdings'), text('risk'), text('benchmark')] },
                text('dataQuality', 'Data quality'),
              ],
            },
            {
              name: 'riskLabels',
              type: 'group',
              fields: [{ type: 'row', fields: [text('low'), text('moderate'), text('high'), text('very_high', 'Very high')] }],
            },
            area('riskSentence', 'Risk sentence', 'Template: {annual}, {benchmark}, {benchmarkAnnual}'),
            { type: 'row', fields: [text('benchmarkAhead', 'Ahead template', '{gap}, {benchmark}'), text('benchmarkBehind', 'Behind template', '{gap}, {benchmark}')] },
            area('benchmarkPrompt', 'No-returns prompt', 'Shown when no purchase values were given.'),
            { type: 'row', fields: [text('coverageChip', 'Coverage chip', '{pct}'), text('asOfChip', 'As-of chip', '{date}'), text('provisional', 'Provisional label')] },
            area('dataQualityLine', 'Data quality line', 'Template: {excluded}, {pct}'),
            area('disclaimer', 'Disclaimer', 'Shown on every results page and report.'),
          ],
        },
        {
          label: 'Dashboard',
          description: 'The signed-in /portfolio page.',
          fields: [
            { type: 'row', fields: [text('dashboardTitle'), text('newCheckLabel', 'New check button'), text('savedBanner', 'Saved banner')] },
            { type: 'row', fields: [text('trendTitle'), text('trendEmpty', 'Trend empty state')] },
            { type: 'row', fields: [text('alertsTitle'), text('alertsEmpty', 'No alerts')] },
            {
              name: 'alertTemplates',
              type: 'group',
              fields: [
                { type: 'row', fields: [text('scoreDrop', 'Score drop', '{from}, {to}'), text('newFlag', 'New flag', '{title}')] },
                { type: 'row', fields: [text('limitCrossed', 'Limit crossed', '{name}, {pct}'), text('recheckDue', 'Re-check due')] },
              ],
            },
            { type: 'row', fields: [text('reminderLabel'), text('reminderHelp')] },
            { type: 'row', fields: [text('alertDropLabel', 'Score-drop alert label'), text('concentrationLabel', 'Concentration limit label (Pro)')] },
            { type: 'row', fields: [text('dataTitle', 'Your data heading'), text('downloadLabel'), text('deleteLabel')] },
            area('deleteConfirm', 'Delete confirmation'),
          ],
        },
        {
          label: 'Red flags',
          fields: [
            {
              name: 'flags',
              type: 'array',
              labels: { singular: 'Flag', plural: 'Flags' },
              admin: {
                initCollapsed: true,
                description: 'Factual wording only ("28% of your portfolio is in one stock"), never directive. Placeholders depend on the rule.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'rule', type: 'select', required: true, options: FLAG_IDS, admin: { width: '20%' } },
                    { ...text('title', 'Title template'), admin: { width: '80%' } } as Field,
                  ],
                },
                area('why', 'Why it matters'),
                text('explainerUrl', 'Explainer link', undefined, false),
              ],
            },
          ],
        },
        {
          label: 'Errors',
          fields: [
            {
              name: 'errors',
              type: 'array',
              admin: { description: 'Plain words only: no stack traces, column names or the word "parse".' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'code',
                      type: 'select',
                      required: true,
                      admin: { width: '30%' },
                      options: ['unreadable', 'too_large', 'wrong_type', 'password', 'too_many', 'nothing_found', 'rate_limited', 'generic', 'no_holdings'],
                    },
                    { ...area('message'), admin: { width: '70%' } } as Field,
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Plans',
          fields: [
            text('plansTitle'),
            area('plansIntro'),
            {
              name: 'plans',
              type: 'array',
              maxRows: 2,
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'planId', label: 'Plan', type: 'select', required: true, options: ['insights', 'pro'] },
                    text('name'),
                    { name: 'pricePaise', label: 'Price (paise)', type: 'number', required: true, min: 100 },
                    text('period', 'Billing period label', 'e.g. "per year" or "one report"'),
                  ],
                },
                { name: 'features', type: 'array', fields: [text('text')] },
                text('cta'),
              ],
            },
            area('refundLine'),
            text('lockedFallback', 'Locked card fallback', 'Shown when a teaser has nothing to count for this portfolio.'),
            {
              name: 'lockedCards',
              type: 'array',
              labels: { singular: 'Locked card', plural: 'Locked cards' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'card', type: 'select', required: true, options: LOCKED_CARDS },
                    { name: 'plan', type: 'select', required: true, options: ['insights', 'pro'] },
                    text('title'),
                  ],
                },
                text('teaser', 'Teaser template', 'Uses counts or buckets only, e.g. "Overlap found in {pairs} fund pairs".'),
              ],
            },
          ],
        },
      ],
    },
  ],
})
