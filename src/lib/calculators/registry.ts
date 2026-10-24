import { formatInr } from '@/lib/format-inr'

import { lumpsum, sip, swp } from './finance'
import type { CalculatorDef, NumberField, ToolResult, Values } from './types'

/** Projected and maturity figures are truncated, never rounded up. */
const proj = (n: number) => formatInr(Math.floor(n + 1e-6))
const yr = (n: number) => `Year ${n}`

const num = (id: string, label: string, o: Omit<NumberField, 'kind' | 'id' | 'label'>): NumberField => ({ kind: 'number', id, label, ...o })

const n = (v: Values, id: string) => Number(v[id])

/** Up to six decimals, no trailing zeros: 0.01, 0.006667. */
const dec = (x: number) => String(Number(x.toFixed(6)))
const years = (t: number) => `${t} ${t === 1 ? 'year' : 'years'}`

const rate = (def = 12, max = 30) =>
  num('rate', 'Expected return rate (p.a.)', { min: 1, max, step: 0.1, default: def, format: 'percent', hint: 'Your own assumption, not a promised return' })
const period = () => num('years', 'Time period', { min: 1, max: 40, step: 1, default: 10, format: 'years' })
const inflation = () =>
  num('inflation', 'Expected inflation (p.a.)', { min: 0, max: 15, step: 0.1, default: 6, format: 'percent', hint: 'Used to show the result in today\'s money' })

/** What a future amount is worth today: value ÷ (1 + inflation)^years. */
const todaysMoney = (value: number, inflationPct: number, t: number) => value / Math.pow(1 + inflationPct / 100, t)

const growthSeries = (rows: { year: number; invested: number; value: number }[]) => ({
  title: 'Growth year by year',
  aLabel: 'Invested amount',
  bLabel: 'Est. returns',
  data: rows.map((r) => ({ label: yr(r.year), a: r.invested, b: Math.max(r.value - r.invested, 0) })),
})

const growthTable = (rows: { year: number; invested: number; value: number }[]) => ({
  title: 'Year-by-year breakdown',
  columns: ['Year', 'Invested', 'Returns', 'Total value'],
  rows: rows.map((r) => [String(r.year), proj(r.invested), proj(r.value - r.invested), proj(r.value)]),
})

const returnDonut = (invested: number, returns: number) => [
  { label: 'Invested amount', value: invested, display: proj(invested), tone: 'soft' as const },
  { label: 'Est. returns', value: Math.max(returns, 0), display: proj(returns), tone: 'green' as const },
]

function growthResult(r: { invested: number; returns: number; value: number; yearly: { year: number; invested: number; value: number }[] }, v: Values): ToolResult {
  return {
    stats: [
      { label: 'Invested amount', value: proj(r.invested) },
      { label: 'Est. returns', value: proj(r.returns) },
      { label: 'Total value', value: proj(r.value), tone: 'primary' },
      { label: 'Worth in today’s money', value: proj(todaysMoney(r.value, n(v, 'inflation'), n(v, 'years'))), tone: 'accent' },
    ],
    donut: returnDonut(r.invested, r.returns),
    series: growthSeries(r.yearly),
    table: growthTable(r.yearly),
    notes: [`Today’s money assumes ${dec(n(v, 'inflation'))}% inflation a year for ${years(n(v, 'years'))}. The return rate is not adjusted for tax or fund charges.`],
  }
}

const todayFormula = 'Today’s money = Total value ÷ (1 + inflation ÷ 100)^years'

// ───────────────────────────── SIP ─────────────────────────────

const sipDef: CalculatorDef = {
  slug: 'sip-calculator',
  name: 'SIP Calculator',
  summary: 'Estimate what a monthly SIP can grow to over the years.',
  fields: [num('amount', 'Monthly investment', { min: 500, max: 100_000, step: 500, default: 10_000, format: 'inr' }), rate(12), period(), inflation()],
  compute(v) {
    return growthResult(sip({ monthly: n(v, 'amount'), annualReturn: n(v, 'rate'), years: n(v, 'years') }), v)
  },
  method: {
    intro: 'Each instalment is invested at the start of the month and grows at one-twelfth of the yearly return, compounded monthly. This is the standard SIP (annuity-due) formula.',
    formulas: ['FV = P × [ ((1 + i)^n − 1) / i ] × (1 + i)', 'P = monthly investment, i = annual return ÷ 12 ÷ 100, n = number of months', todayFormula],
  },
  worked(v) {
    const P = n(v, 'amount')
    const i = n(v, 'rate') / 12 / 100
    const months = n(v, 'years') * 12
    const r = sip({ monthly: P, annualReturn: n(v, 'rate'), years: n(v, 'years') })
    return [
      `i = ${dec(n(v, 'rate'))} ÷ 12 ÷ 100 = ${dec(i)}`,
      `n = ${n(v, 'years')} × 12 = ${months} months`,
      `FV = ${formatInr(P)} × [ ((1 + ${dec(i)})^${months} − 1) / ${dec(i)} ] × (1 + ${dec(i)}) = ${proj(r.value)}`,
      `Invested = ${formatInr(P)} × ${months} = ${proj(r.invested)}, so returns = ${proj(r.returns)}`,
    ]
  },
}

// ───────────────────────────── Lumpsum ─────────────────────────────

const lumpsumDef: CalculatorDef = {
  slug: 'lumpsum-calculator',
  name: 'Lumpsum Calculator',
  summary: 'See what a one-time investment can grow to at the return you expect.',
  fields: [num('amount', 'Total investment', { min: 5_000, max: 10_000_000, step: 5_000, default: 100_000, format: 'inr' }), rate(12), period(), inflation()],
  compute(v) {
    return growthResult(lumpsum({ amount: n(v, 'amount'), annualReturn: n(v, 'rate'), years: n(v, 'years') }), v)
  },
  method: {
    intro: 'A single amount compounds once a year at the expected return.',
    formulas: ['A = P × (1 + r)^t', 'P = amount invested, r = annual return ÷ 100, t = years', todayFormula],
  },
  worked(v) {
    const P = n(v, 'amount')
    const r = lumpsum({ amount: P, annualReturn: n(v, 'rate'), years: n(v, 'years') })
    return [
      `r = ${dec(n(v, 'rate'))} ÷ 100 = ${dec(n(v, 'rate') / 100)}, t = ${n(v, 'years')} years`,
      `A = ${formatInr(P)} × (1 + ${dec(n(v, 'rate') / 100)})^${n(v, 'years')} = ${proj(r.value)}`,
      `Returns = ${proj(r.value)} − ${formatInr(P)} = ${proj(r.returns)}`,
    ]
  },
}

// ───────────────────────────── SWP ─────────────────────────────

const swpDef: CalculatorDef = {
  slug: 'swp-calculator',
  name: 'SWP Calculator',
  summary: 'Plan a regular monthly withdrawal from a lump sum and see how long it lasts.',
  fields: [
    num('corpus', 'Total investment', { min: 100_000, max: 50_000_000, step: 50_000, default: 1_000_000, format: 'inr' }),
    num('monthly', 'Withdrawal per month', { min: 1_000, max: 500_000, step: 500, default: 5_000, format: 'inr' }),
    rate(8),
    period(),
  ],
  compute(v) {
    const r = swp({ corpus: n(v, 'corpus'), monthly: n(v, 'monthly'), annualReturn: n(v, 'rate'), years: n(v, 'years') })
    const lasted = Math.floor(r.monthsPaid)
    return {
      stats: [
        { label: 'Total investment', value: proj(r.corpus) },
        { label: 'Total withdrawal', value: proj(r.withdrawn) },
        { label: 'Est. returns earned', value: proj(Math.max(r.value + r.withdrawn - r.corpus, 0)) },
        { label: 'Final value', value: proj(r.value), tone: 'primary' },
      ],
      donut: [
        { label: 'Total withdrawal', value: r.withdrawn, display: proj(r.withdrawn), tone: 'soft' },
        { label: 'Final value', value: r.value, display: proj(r.value), tone: 'green' },
      ],
      series: {
        title: 'Withdrawals and balance by year',
        aLabel: 'Withdrawn so far',
        bLabel: 'Balance left',
        data: r.yearly.map((y) => ({ label: yr(y.year), a: y.withdrawn, b: y.value })),
      },
      table: {
        title: 'Year-by-year breakdown',
        columns: ['Year', 'Withdrawn so far', 'Balance'],
        rows: r.yearly.map((y) => [String(y.year), proj(y.withdrawn), proj(y.value)]),
      },
      notes: r.exhausted
        ? [`At this withdrawal your money lasts about ${Math.floor(lasted / 12)} years ${lasted % 12} months, then the balance reaches zero.`]
        : [`Your money lasts the full ${years(n(v, 'years'))} and ${proj(r.value)} is still invested at the end.`],
    }
  },
  method: {
    intro: 'Each month the balance first earns one-twelfth of the yearly return, then the withdrawal is taken at month end. If the balance cannot cover a withdrawal, the remainder is paid out and the plan stops.',
    formulas: [
      'Balance(m) = Balance(m−1) × (1 + i) − W',
      'Closed form: Balance(n) = C × (1 + i)^n − W × [ ((1 + i)^n − 1) / i ]',
      'C = total investment, W = monthly withdrawal, i = annual return ÷ 12 ÷ 100, n = months',
    ],
  },
  worked(v) {
    const C = n(v, 'corpus')
    const W = n(v, 'monthly')
    const i = n(v, 'rate') / 12 / 100
    const months = n(v, 'years') * 12
    const r = swp({ corpus: C, monthly: W, annualReturn: n(v, 'rate'), years: n(v, 'years') })
    return [
      `i = ${dec(n(v, 'rate'))} ÷ 12 ÷ 100 = ${dec(i)}, n = ${n(v, 'years')} × 12 = ${months} months`,
      r.exhausted
        ? `The corpus is used up before month ${months}: ${formatInr(C)} × (1 + ${dec(i)})^m − ${formatInr(W)} × [ ((1 + ${dec(i)})^m − 1) / ${dec(i)} ] reaches zero after ${Math.floor(r.monthsPaid)} months.`
        : `Balance = ${formatInr(C)} × (1 + ${dec(i)})^${months} − ${formatInr(W)} × [ ((1 + ${dec(i)})^${months} − 1) / ${dec(i)} ] = ${proj(r.value)}`,
      `Withdrawn = ${proj(r.withdrawn)}`,
    ]
  },
}

export const CALCULATORS: CalculatorDef[] = [sipDef, lumpsumDef, swpDef]

export const getCalculator = (slug: string) => CALCULATORS.find((c) => c.slug === slug)

export const defaultValues = (def: CalculatorDef): Values => Object.fromEntries(def.fields.map((f) => [f.id, f.default]))
