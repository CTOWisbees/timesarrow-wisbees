import { formatInr } from '@/lib/format-inr'

import { extraMonthlyNeeded, projectGoal } from '@/lib/portal/math'

import { emi, harvest, lumpsum, sip, stepUpSip, swp } from './finance'
import type { CalculatorDef, NumberField, ToolResult, Values } from './types'

/** Projected and maturity figures are truncated, never rounded up. */
const proj = (n: number) => formatInr(Math.floor(n + 1e-6))
/** Obligations (EMI, interest paid) are rounded to the nearest rupee. */
const due = (n: number) => formatInr(n)
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

// ───────────────────────────── Step-up SIP ─────────────────────────────

const stepUpDef: CalculatorDef = {
  slug: 'step-up-sip-calculator',
  name: 'Step-up SIP Calculator',
  summary: 'See how raising your SIP every year grows the corpus compared with a flat SIP.',
  fields: [
    num('amount', 'Starting monthly investment', { min: 500, max: 100_000, step: 500, default: 10_000, format: 'inr' }),
    num('stepUp', 'Annual step-up', { min: 1, max: 50, step: 1, default: 10, format: 'percent', hint: 'How much you raise the monthly amount each year' }),
    rate(12),
    period(),
    inflation(),
  ],
  compute(v) {
    const args = { monthly: n(v, 'amount'), stepUp: n(v, 'stepUp'), annualReturn: n(v, 'rate'), years: n(v, 'years') }
    const r = stepUpSip(args)
    const flat = sip({ monthly: args.monthly, annualReturn: args.annualReturn, years: args.years })
    const base = growthResult(r, v)
    const last = r.yearly[r.yearly.length - 1]
    return {
      ...base,
      stats: [
        ...base.stats,
        { label: 'Extra over a flat SIP', value: proj(r.value - flat.value) },
        { label: `Monthly SIP in year ${args.years}`, value: proj(last.monthly) },
      ],
      table: {
        title: 'Year-by-year breakdown',
        columns: ['Year', 'Monthly SIP', 'Invested', 'Returns', 'Total value'],
        rows: r.yearly.map((y) => [String(y.year), proj(y.monthly), proj(y.invested), proj(y.value - y.invested), proj(y.value)]),
      },
      notes: [
        `A flat SIP of ${due(args.monthly)} a month would grow to ${proj(flat.value)}. Raising it by ${dec(args.stepUp)}% each year adds ${proj(r.value - flat.value)}. ` +
          `Today’s money assumes ${dec(n(v, 'inflation'))}% inflation a year for ${years(args.years)}. The return rate is not adjusted for tax or fund charges.`,
      ],
    }
  },
  method: {
    intro:
      'The monthly amount is the same for twelve months, then rises by the step-up percentage at the start of each new year. Each instalment is invested at the start of the month and grows at one-twelfth of the yearly return, compounded monthly.',
    formulas: [
      'Amount in year y = P × (1 + s)^(y − 1)',
      'FV = Σ over years y of [ Amount(y) × ((1 + i)^12 − 1) / i × (1 + i) × (1 + i)^(12 × (Y − y)) ]',
      'P = starting monthly investment, s = step-up ÷ 100, i = annual return ÷ 12 ÷ 100, Y = number of years',
      todayFormula,
    ],
  },
  worked(v) {
    const P = n(v, 'amount')
    const s = n(v, 'stepUp') / 100
    const i = n(v, 'rate') / 12 / 100
    const Y = n(v, 'years')
    const r = stepUpSip({ monthly: P, stepUp: n(v, 'stepUp'), annualReturn: n(v, 'rate'), years: Y })
    const last = r.yearly[r.yearly.length - 1]
    return [
      `i = ${dec(n(v, 'rate'))} ÷ 12 ÷ 100 = ${dec(i)}, s = ${dec(n(v, 'stepUp'))} ÷ 100 = ${dec(s)}`,
      `Year 1 = ${formatInr(P)} a month; year ${Y} = ${formatInr(P)} × (1 + ${dec(s)})^${Y - 1} = ${proj(last.monthly)} a month`,
      `Each year's twelve instalments are valued at the end of year ${Y} and added up: FV = ${proj(r.value)}`,
      `Invested = ${proj(r.invested)}, so returns = ${proj(r.returns)}`,
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

// ───────────────────────────── EMI ─────────────────────────────

const emiDef: CalculatorDef = {
  slug: 'emi-calculator',
  name: 'EMI Calculator',
  summary: 'Work out the monthly EMI, total interest and repayment schedule for a loan.',
  fields: [
    num('amount', 'Loan amount', { min: 10_000, max: 50_000_000, step: 10_000, default: 1_000_000, format: 'inr' }),
    num('rate', 'Rate of interest (p.a.)', { min: 1, max: 30, step: 0.05, default: 8.5, format: 'percent' }),
    num('years', 'Loan tenure', { min: 1, max: 30, step: 1, default: 20, format: 'years' }),
  ],
  compute(v) {
    const r = emi({ principal: n(v, 'amount'), annualRate: n(v, 'rate'), years: n(v, 'years') })
    return {
      stats: [
        { label: 'Monthly EMI', value: due(r.emi), tone: 'primary' },
        { label: 'Principal amount', value: due(r.principal) },
        { label: 'Total interest', value: due(r.interest) },
        { label: 'Total payment', value: due(r.total) },
      ],
      donut: [
        { label: 'Principal amount', value: r.principal, display: due(r.principal), tone: 'soft' },
        { label: 'Total interest', value: r.interest, display: due(r.interest), tone: 'amber' },
      ],
      series: {
        title: 'Principal and interest paid each year',
        aLabel: 'Principal paid',
        bLabel: 'Interest paid',
        data: r.yearly.map((y) => ({ label: yr(y.year), a: y.principal, b: y.interest })),
      },
      table: {
        title: 'Repayment schedule',
        columns: ['Year', 'Principal paid', 'Interest paid', 'Balance'],
        rows: r.yearly.map((y) => [String(y.year), due(y.principal), due(y.interest), due(y.balance)]),
      },
      notes: ['Interest is charged on the outstanding balance each month, so early EMIs are mostly interest and later ones mostly principal.'],
    }
  },
  method: {
    intro: 'Interest is charged monthly on the outstanding balance (reducing balance method). Every EMI is the same; its interest part falls and its principal part grows each month.',
    formulas: [
      'EMI = P × r × (1 + r)^n ÷ [ (1 + r)^n − 1 ]',
      'P = loan amount, r = annual rate ÷ 12 ÷ 100, n = tenure in months',
      'Total interest = EMI × n − P',
    ],
  },
  worked(v) {
    const P = n(v, 'amount')
    const r = n(v, 'rate') / 12 / 100
    const months = n(v, 'years') * 12
    const res = emi({ principal: P, annualRate: n(v, 'rate'), years: n(v, 'years') })
    return [
      `r = ${dec(n(v, 'rate'))} ÷ 12 ÷ 100 = ${dec(r)}, n = ${n(v, 'years')} × 12 = ${months} months`,
      `EMI = ${formatInr(P)} × ${dec(r)} × (1 + ${dec(r)})^${months} ÷ [ (1 + ${dec(r)})^${months} − 1 ] = ${due(res.emi)}`,
      `Total payment = ${due(res.emi)} × ${months} = ${due(res.total)}`,
      `Total interest = ${due(res.total)} − ${formatInr(P)} = ${due(res.interest)}`,
    ]
  },
}

// ───────────────────────────── Goal gap ─────────────────────────────

const goalGapDef: CalculatorDef = {
  slug: 'goal-gap-calculator',
  name: 'Goal Gap Calculator',
  summary: 'Check whether you will reach a goal, and the extra monthly amount that closes any gap.',
  fields: [
    num('target', 'Amount you need', { min: 100_000, max: 1_000_000_000, step: 100_000, default: 5_000_000, format: 'inr' }),
    num('saved', 'Already saved for it', { min: 0, max: 100_000_000, step: 50_000, default: 500_000, format: 'inr' }),
    num('monthly', 'You invest each month', { min: 0, max: 500_000, step: 1_000, default: 15_000, format: 'inr' }),
    rate(10),
    period(),
  ],
  compute(v) {
    const args = { saved: n(v, 'saved'), monthly: n(v, 'monthly'), annualReturn: n(v, 'rate') / 100, years: n(v, 'years') }
    const p = projectGoal(args)
    const target = n(v, 'target')
    const gap = target - p.value
    const extra = extraMonthlyNeeded({ target, ...args })
    const rows = Array.from({ length: args.years }, (_, i) => {
      const y = i + 1
      const part = projectGoal({ ...args, years: y })
      return { year: y, invested: part.invested, value: part.value }
    })
    return {
      stats: [
        { label: 'Amount you need', value: proj(target) },
        { label: gap > 0 ? 'Shortfall' : 'Surplus', value: proj(Math.abs(gap)), tone: gap > 0 ? 'accent' : 'default' },
        { label: 'Could reach', value: proj(p.value), tone: 'primary' },
        { label: gap > 0 ? 'Extra to invest each month' : 'Extra needed each month', value: gap > 0 ? proj(extra) : '₹0' },
      ],
      donut: returnDonut(p.invested, p.value - p.invested),
      series: growthSeries(rows),
      table: growthTable(rows),
      notes: [
        gap > 0
          ? `Investing ${proj(extra)} more each month, on top of ${proj(args.monthly)}, would close the gap at ${dec(n(v, 'rate'))}% a year. The extra amount is rounded up to the next ₹100.`
          : `At ${proj(args.monthly)} a month you are on track at ${dec(n(v, 'rate'))}% a year. A lower return would shrink the surplus.`,
        'The return is your own assumption, not a promised return. It is not adjusted for tax or fund charges.',
      ],
    }
  },
  method: {
    intro: 'What you have saved compounds monthly, and each instalment is invested at the start of the month, the same convention as the SIP calculator. The extra monthly amount is the smallest round amount that makes the total reach your goal.',
    formulas: ['FV = S × (1 + i)^n + M × ((1 + i)^n − 1) / i × (1 + i)', 'Extra = (Goal − FV) ÷ [((1 + i)^n − 1) / i × (1 + i)], rounded up to ₹100', 'S = saved, M = monthly investment, i = annual return ÷ 12 ÷ 100, n = months'],
  },
  worked(v) {
    const i = n(v, 'rate') / 12 / 100
    const months = n(v, 'years') * 12
    const args = { saved: n(v, 'saved'), monthly: n(v, 'monthly'), annualReturn: n(v, 'rate') / 100, years: n(v, 'years') }
    const p = projectGoal(args)
    return [
      `i = ${dec(n(v, 'rate'))} ÷ 12 ÷ 100 = ${dec(i)}, n = ${n(v, 'years')} × 12 = ${months} months`,
      `FV = ${formatInr(args.saved)} × (1 + ${dec(i)})^${months} + ${formatInr(args.monthly)} × [((1 + ${dec(i)})^${months} − 1) / ${dec(i)}] × (1 + ${dec(i)}) = ${proj(p.value)}`,
      `Goal ${proj(n(v, 'target'))} − ${proj(p.value)} = ${p.value >= n(v, 'target') ? 'no gap' : proj(n(v, 'target') - p.value)}`,
    ]
  },
}

// ───────────────────────────── Tax-loss harvesting ─────────────────────────────

const harvestDef: CalculatorDef = {
  slug: 'tax-loss-harvesting-calculator',
  name: 'Tax-loss Harvesting Calculator',
  summary: 'See how booking a loss can cancel gains and what it could save, using the tax rate you enter.',
  fields: [
    num('loss', 'Loss you could book', { min: 1_000, max: 100_000_000, step: 1_000, default: 38_000, format: 'inr' }),
    num('gains', 'Gains you have booked this year', { min: 0, max: 100_000_000, step: 1_000, default: 112_000, format: 'inr' }),
    num('rate', 'Tax rate on those gains', { min: 0, max: 40, step: 0.5, default: 12.5, format: 'percent', hint: 'Enter the rate that applies to you; it depends on the type of gain' }),
  ],
  compute(v) {
    const r = harvest({ loss: n(v, 'loss'), gains: n(v, 'gains'), ratePct: n(v, 'rate') })
    return {
      stats: [
        { label: 'Loss you book', value: proj(n(v, 'loss')) },
        { label: 'Gains it cancels', value: proj(r.offset) },
        { label: 'Tax you may save', value: proj(r.taxSaved), tone: 'primary' },
        { label: 'Loss left to carry forward', value: proj(r.carried), tone: 'accent' },
      ],
      notes: [
        `Tax on your gains falls from ${proj(r.taxWithout)} to ${proj(r.taxWith)}.`,
        'Illustrative only. The rate and the gains are what you entered. Tax treatment, set-off between types of gain, carry-forward and rules that stop you buying the same investment back too soon can change this, so have a CA confirm before you sell.',
      ],
    }
  },
  method: {
    intro: 'A booked loss cancels gains from other sales. Each rupee of gain it cancels saves tax at the rate you enter. Any loss left over may be carried forward under the rules in force.',
    formulas: ['Gains cancelled = smaller of (loss, gains)', 'Tax saved = gains cancelled × rate ÷ 100', 'Loss left = loss − gains cancelled'],
  },
  worked(v) {
    const r = harvest({ loss: n(v, 'loss'), gains: n(v, 'gains'), ratePct: n(v, 'rate') })
    return [
      `Gains cancelled = smaller of ${formatInr(n(v, 'loss'))} and ${formatInr(n(v, 'gains'))} = ${proj(r.offset)}`,
      `Tax saved = ${proj(r.offset)} × ${dec(n(v, 'rate'))} ÷ 100 = ${proj(r.taxSaved)}`,
      `Loss left to carry forward = ${formatInr(n(v, 'loss'))} − ${proj(r.offset)} = ${proj(r.carried)}`,
    ]
  },
}

export const CALCULATORS: CalculatorDef[] = [stepUpDef, sipDef, lumpsumDef, swpDef, emiDef, goalGapDef, harvestDef]

export const getCalculator = (slug: string) => CALCULATORS.find((c) => c.slug === slug)

export const defaultValues = (def: CalculatorDef): Values => Object.fromEntries(def.fields.map((f) => [f.id, f.default]))
