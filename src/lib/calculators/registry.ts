import { formatInr } from '@/lib/format-inr'

import { type Compounding, emi, epf, fd, gst, lumpsum, ppf, rd, sip, ssy, SSY_DEPOSIT_YEARS, SSY_MATURITY_YEARS, swp } from './finance'
import { computeTax, LIMITS, type AgeGroup, type Regime } from './tax'
import type { CalculatorDef, ChoiceField, Field, NumberField, ToolResult, Values } from './types'

/** Projected and maturity figures are truncated, never rounded up. */
const proj = (n: number) => formatInr(Math.floor(n + 1e-6))
/** Obligations (EMI, tax, GST) are rounded to the nearest rupee. */
const due = (n: number) => formatInr(n)
const pc = (n: number, d = 2) => `${(Math.floor(n * 10 ** d) / 10 ** d).toFixed(d)}%`
const yr = (n: number) => `Year ${n}`

const num = (id: string, label: string, o: Omit<NumberField, 'kind' | 'id' | 'label'>): NumberField => ({ kind: 'number', id, label, ...o })
const choice = (id: string, label: string, o: Omit<ChoiceField, 'kind' | 'id' | 'label'>): ChoiceField => ({ kind: 'choice', id, label, ...o })

const n = (v: Values, id: string) => Number(v[id])
const s = (v: Values, id: string) => String(v[id])


const rate = (def = 12, max = 30) => num('rate', 'Expected return rate (p.a.)', { min: 1, max, step: 0.1, default: def, format: 'percent' })

const growthSeries = (rows: { year: number; invested: number; value: number }[], aLabel = 'Invested amount', bLabel = 'Est. returns') => ({
  title: 'Growth year by year',
  aLabel,
  bLabel,
  data: rows.map((r) => ({ label: yr(r.year), a: r.invested, b: Math.max(r.value - r.invested, 0) })),
})

const growthTable = (rows: { year: number; invested: number; value: number }[], cols = ['Year', 'Invested', 'Returns', 'Total value']) => ({
  title: 'Year-by-year breakdown',
  columns: cols,
  rows: rows.map((r) => [String(r.year), proj(r.invested), proj(r.value - r.invested), proj(r.value)]),
})

const returnDonut = (invested: number, returns: number, aLabel = 'Invested amount', bLabel = 'Est. returns') => [
  { label: aLabel, value: invested, display: proj(invested), tone: 'soft' as const },
  { label: bLabel, value: Math.max(returns, 0), display: proj(returns), tone: 'green' as const },
]

// ───────────────────────────── SIP (and fund-house variants) ─────────────────────────────

const sipFields: Field[] = [
  num('amount', 'Monthly investment', { min: 500, max: 100_000, step: 500, default: 10_000, format: 'inr' }),
  rate(12),
  num('years', 'Time period', { min: 1, max: 40, step: 1, default: 10, format: 'years' }),
]

function computeSip(v: Values): ToolResult {
  const r = sip({ monthly: n(v, 'amount'), annualReturn: n(v, 'rate'), years: n(v, 'years') })
  return {
    stats: [
      { label: 'Invested amount', value: proj(r.invested) },
      { label: 'Est. returns', value: proj(r.returns) },
      { label: 'Total value', value: proj(r.value), tone: 'primary' },
    ],
    donut: returnDonut(r.invested, r.returns),
    series: growthSeries(r.yearly),
    table: growthTable(r.yearly),
  }
}

const sipMethod = {
  intro:
    'Each instalment is invested at the start of the month and grows at one-twelfth of the yearly return, compounded monthly. This is the standard SIP formula.',
  formulas: ['FV = P × [ ((1 + i)^n − 1) / i ] × (1 + i)', 'P = monthly investment, i = annual return ÷ 12 ÷ 100, n = number of months'],
}

const sipDef = (slug: string, name: string, summary: string, category: CalculatorDef['category']): CalculatorDef => ({
  slug,
  name,
  category,
  summary,
  fields: sipFields,
  compute: computeSip,
  method: sipMethod,
})

const fundHouse = (slug: string, name: string, house: string) =>
  sipDef(slug, name, `Project a monthly SIP in ${house} mutual fund schemes. The return is your own assumption, not the fund's performance.`, 'mutual-fund')

// ───────────────────────────── Lumpsum ─────────────────────────────

const lumpsumDef: CalculatorDef = {
  slug: 'lumpsum-calculator',
  name: 'Lumpsum Calculator',
  category: 'popular',
  summary: 'See what a one-time investment can grow to at the return you expect.',
  fields: [
    num('amount', 'Total investment', { min: 5_000, max: 10_000_000, step: 5_000, default: 100_000, format: 'inr' }),
    rate(12),
    num('years', 'Time period', { min: 1, max: 40, step: 1, default: 10, format: 'years' }),
  ],
  compute(v) {
    const r = lumpsum({ amount: n(v, 'amount'), annualReturn: n(v, 'rate'), years: n(v, 'years') })
    return {
      stats: [
        { label: 'Invested amount', value: proj(r.invested) },
        { label: 'Est. returns', value: proj(r.returns) },
        { label: 'Total value', value: proj(r.value), tone: 'primary' },
      ],
      donut: returnDonut(r.invested, r.returns),
      series: growthSeries(r.yearly),
      table: growthTable(r.yearly),
    }
  },
  method: {
    intro: 'A single amount compounds once a year at the expected return.',
    formulas: ['A = P × (1 + r)^t', 'P = amount invested, r = annual return ÷ 100, t = years'],
  },
}

// ───────────────────────────── SWP ─────────────────────────────

const swpDef: CalculatorDef = {
  slug: 'swp-calculator',
  name: 'SWP Calculator',
  category: 'popular',
  summary: 'Plan a regular monthly withdrawal from a lump sum and see how long it lasts.',
  fields: [
    num('corpus', 'Total investment', { min: 100_000, max: 50_000_000, step: 50_000, default: 1_000_000, format: 'inr' }),
    num('monthly', 'Withdrawal per month', { min: 1_000, max: 500_000, step: 500, default: 5_000, format: 'inr' }),
    rate(8),
    num('years', 'Time period', { min: 1, max: 40, step: 1, default: 10, format: 'years' }),
  ],
  compute(v) {
    const r = swp({ corpus: n(v, 'corpus'), monthly: n(v, 'monthly'), annualReturn: n(v, 'rate'), years: n(v, 'years') })
    const lasted = Math.floor(r.monthsPaid)
    return {
      stats: [
        { label: 'Total investment', value: proj(r.corpus) },
        { label: 'Total withdrawal', value: proj(r.withdrawn) },
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
      notes: r.exhausted ? [`At this withdrawal your money lasts about ${Math.floor(lasted / 12)} years ${lasted % 12} months, then the balance reaches zero.`] : [],
    }
  },
  method: {
    intro: 'Each month the balance first earns one-twelfth of the yearly return, then the withdrawal is taken at month end. If the balance cannot cover a withdrawal, the remainder is paid out and the plan stops.',
    formulas: ['Balance(m) = Balance(m−1) × (1 + r/12) − W', 'r = annual return ÷ 100, W = monthly withdrawal'],
  },
}

// ───────────────────────────── Mutual fund returns / ELSS ─────────────────────────────

const modeField = choice('mode', 'Investment type', {
  options: [
    { value: 'sip', label: 'SIP' },
    { value: 'lumpsum', label: 'Lumpsum' },
  ],
  default: 'sip',
  variant: 'toggle',
})

const mfAmountFields = [
  num('monthly', 'Monthly investment', { min: 500, max: 100_000, step: 500, default: 10_000, format: 'inr', showIf: (v) => v.mode === 'sip' }),
  num('lump', 'Total investment', { min: 5_000, max: 10_000_000, step: 5_000, default: 100_000, format: 'inr', showIf: (v) => v.mode === 'lumpsum' }),
]

function mfProjection(v: Values) {
  const years = n(v, 'years')
  const annualReturn = n(v, 'rate')
  return v.mode === 'sip'
    ? sip({ monthly: n(v, 'monthly'), annualReturn, years })
    : lumpsum({ amount: n(v, 'lump'), annualReturn, years })
}

const mfReturnsDef: CalculatorDef = {
  slug: 'mutual-fund-returns-calculator',
  name: 'Mutual Fund Returns Calculator',
  category: 'popular',
  summary: 'Estimate the value of a mutual fund investment, as a SIP or a lumpsum.',
  fields: [modeField, ...mfAmountFields, rate(12), num('years', 'Time period', { min: 1, max: 40, step: 1, default: 10, format: 'years' })],
  compute(v) {
    const r = mfProjection(v)
    return {
      stats: [
        { label: 'Invested amount', value: proj(r.invested) },
        { label: 'Est. returns', value: proj(r.returns) },
        { label: 'Total value', value: proj(r.value), tone: 'primary' },
        { label: 'Absolute return', value: pc((r.returns / r.invested) * 100) },
      ],
      donut: returnDonut(r.invested, r.returns),
      series: growthSeries(r.yearly),
      table: growthTable(r.yearly),
    }
  },
  method: {
    intro: 'SIP uses monthly compounding with instalments at the start of each month; lumpsum compounds once a year.',
    formulas: ['SIP: FV = P × [ ((1 + i)^n − 1) / i ] × (1 + i), i = r ÷ 12', 'Lumpsum: A = P × (1 + r)^t', 'Absolute return = (Value − Invested) ÷ Invested × 100'],
  },
}

const elssDef: CalculatorDef = {
  slug: 'elss-calculator',
  name: 'ELSS Calculator',
  category: 'mutual-fund',
  summary: 'Project an ELSS tax-saving investment, with its 3-year lock-in and the old-regime 80C saving.',
  fields: [
    modeField,
    ...mfAmountFields,
    rate(12),
    num('years', 'Time period', { min: 3, max: 40, step: 1, default: 5, format: 'years' }),
    choice('slab', 'Your tax slab (old regime)', {
      options: [10, 15, 20, 25, 30].map((p) => ({ value: String(p), label: `${p}%` })),
      default: '30',
      variant: 'toggle',
    }),
  ],
  compute(v) {
    const r = mfProjection(v)
    const years = n(v, 'years')
    const slab = n(v, 'slab') / 100
    const annual = v.mode === 'sip' ? n(v, 'monthly') * 12 : 0
    const eligible = v.mode === 'sip' ? Math.min(annual, LIMITS.section80c) * years : Math.min(n(v, 'lump'), LIMITS.section80c)
    const taxSaved = eligible * slab * (1 + LIMITS.cess)
    return {
      stats: [
        { label: 'Invested amount', value: proj(r.invested) },
        { label: 'Est. returns', value: proj(r.returns) },
        { label: 'Total value', value: proj(r.value), tone: 'primary' },
        { label: 'Tax saved under 80C', value: proj(taxSaved), tone: 'accent' },
      ],
      donut: returnDonut(r.invested, r.returns),
      series: growthSeries(r.yearly),
      table: growthTable(r.yearly),
      notes: [
        'ELSS units are locked in for 3 years from each investment.',
        'The 80C saving applies only if you choose the old tax regime and still have room within the ₹1.5 lakh limit; it is estimated at your slab rate plus 4% cess.',
      ],
    }
  },
  method: {
    intro: 'Returns are projected like any mutual fund investment. The tax saving counts each year\'s ELSS investment up to the ₹1.5 lakh Section 80C limit.',
    formulas: ['SIP: FV = P × [ ((1 + i)^n − 1) / i ] × (1 + i)', 'Tax saved = min(yearly investment, ₹1,50,000) × slab rate × 1.04'],
  },
}

// ───────────────────────────── Sukanya Samriddhi ─────────────────────────────

const ssyDef: CalculatorDef = {
  slug: 'sukanya-samriddhi-yojana-calculator',
  name: 'Sukanya Samriddhi Yojana Calculator',
  category: 'popular',
  summary: 'Estimate the maturity value of a Sukanya Samriddhi account for your daughter.',
  fields: [
    num('yearly', 'Yearly investment', { min: 250, max: 150_000, step: 250, default: 100_000, format: 'inr' }),
    num('age', "Girl child's age today", { min: 0, max: 10, step: 1, default: 1, format: 'years' }),
    num('rate', 'Interest rate (p.a.)', { min: 1, max: 15, step: 0.1, default: 8.2, format: 'percent', hint: 'Set by the government every quarter. Change it if it moves.' }),
  ],
  compute(v) {
    const r = ssy({ yearly: n(v, 'yearly'), annualRate: n(v, 'rate') })
    const age = n(v, 'age')
    return {
      stats: [
        { label: `Invested (${SSY_DEPOSIT_YEARS} years)`, value: proj(r.invested) },
        { label: 'Total interest', value: proj(r.interest) },
        { label: `Maturity value (age ${age + SSY_MATURITY_YEARS})`, value: proj(r.value), tone: 'primary' },
      ],
      donut: returnDonut(r.invested, r.interest, 'Invested amount', 'Total interest'),
      series: growthSeries(r.yearly, 'Invested amount', 'Interest earned'),
      table: growthTable(r.yearly, ['Year', 'Invested', 'Interest', 'Balance']),
      notes: [`Deposits are made for ${SSY_DEPOSIT_YEARS} years. The account matures ${SSY_MATURITY_YEARS} years after opening, and interest keeps earning in years ${SSY_DEPOSIT_YEARS + 1} to ${SSY_MATURITY_YEARS}.`],
    }
  },
  method: {
    intro: 'The yearly deposit is made at the start of the financial year and interest is compounded annually. No deposits are made after year 15, but the balance keeps earning until year 21.',
    formulas: ['Year 1–15: Balance = (Balance + D) × (1 + r)', 'Year 16–21: Balance = Balance × (1 + r)', 'D = yearly deposit, r = interest rate ÷ 100'],
  },
}

// ───────────────────────────── PPF ─────────────────────────────

const ppfDef: CalculatorDef = {
  slug: 'ppf-calculator',
  name: 'PPF Calculator',
  category: 'popular',
  summary: 'Work out the maturity value of your Public Provident Fund account.',
  fields: [
    num('yearly', 'Yearly investment', { min: 500, max: 150_000, step: 500, default: 150_000, format: 'inr' }),
    num('years', 'Time period', { min: 15, max: 50, step: 5, default: 15, format: 'years', hint: 'PPF runs 15 years and extends in blocks of 5.' }),
    num('rate', 'Interest rate (p.a.)', { min: 1, max: 15, step: 0.1, default: 7.1, format: 'percent', hint: 'Set by the government every quarter. Change it if it moves.' }),
  ],
  compute(v) {
    const r = ppf({ yearly: n(v, 'yearly'), annualRate: n(v, 'rate'), years: n(v, 'years') })
    return {
      stats: [
        { label: 'Invested amount', value: proj(r.invested) },
        { label: 'Total interest', value: proj(r.interest) },
        { label: 'Maturity value', value: proj(r.value), tone: 'primary' },
      ],
      donut: returnDonut(r.invested, r.interest, 'Invested amount', 'Total interest'),
      series: growthSeries(r.yearly, 'Invested amount', 'Interest earned'),
      table: growthTable(r.yearly, ['Year', 'Invested', 'Interest', 'Balance']),
    }
  },
  method: {
    intro: 'The yearly deposit goes in by 5 April so it earns interest for the whole year. Interest is compounded annually.',
    formulas: ['Balance = (Balance + D) × (1 + r), every year', 'D = yearly deposit (max ₹1,50,000), r = interest rate ÷ 100'],
  },
}

// ───────────────────────────── EPF ─────────────────────────────

const epfDef: CalculatorDef = {
  slug: 'epf-calculator',
  name: 'EPF Calculator',
  category: 'popular',
  summary: 'Estimate your Employees\' Provident Fund corpus at retirement.',
  fields: [
    num('basic', 'Monthly basic + DA', { min: 5_000, max: 500_000, step: 1_000, default: 40_000, format: 'inr' }),
    num('age', 'Your age', { min: 18, max: 57, step: 1, default: 30, format: 'years' }),
    num('retire', 'Retirement age', { min: 40, max: 60, step: 1, default: 58, format: 'years' }),
    choice('employee', 'Your contribution', {
      options: [
        { value: '12', label: '12% of basic' },
        { value: '10', label: '10% of basic' },
      ],
      default: '12',
      variant: 'toggle',
    }),
    num('raise', 'Expected yearly salary increase', { min: 0, max: 20, step: 0.5, default: 5, format: 'percent' }),
    num('rate', 'EPF interest rate (p.a.)', { min: 1, max: 15, step: 0.05, default: 8.25, format: 'percent', hint: 'Declared yearly by EPFO. Change it if it moves.' }),
  ],
  compute(v) {
    const years = Math.max(n(v, 'retire') - n(v, 'age'), 0)
    const r = epf({ monthlyBasic: n(v, 'basic'), employeeRate: n(v, 'employee'), annualRate: n(v, 'rate'), raisePercent: n(v, 'raise'), years })
    return {
      stats: [
        { label: 'Your contribution', value: proj(r.employee) },
        { label: 'Employer contribution', value: proj(r.employer) },
        { label: 'Interest earned', value: proj(r.interest) },
        { label: 'Corpus at retirement', value: proj(r.value), tone: 'primary' },
      ],
      donut: [
        { label: 'Your contribution', value: r.employee, display: proj(r.employee), tone: 'soft' },
        { label: 'Employer contribution', value: r.employer, display: proj(r.employer), tone: 'amber' },
        { label: 'Interest earned', value: Math.max(r.interest, 0), display: proj(r.interest), tone: 'green' },
      ],
      series: growthSeries(r.yearly, 'Contributions', 'Interest earned'),
      table: growthTable(r.yearly, ['Year', 'Contributions', 'Interest', 'Balance']),
      notes: years === 0 ? ['Retirement age must be above your current age.'] : [],
    }
  },
  method: {
    intro:
      'You pay the chosen share of basic + DA. Your employer pays 12%, of which 8.33% of wages (capped at ₹15,000) goes to the pension scheme (EPS) and the rest to your EPF. Interest accrues every month on the running balance and is credited at year end. This is an estimate; EPFO\'s passbook is the final word.',
    formulas: ['Employer EPF = 12% × basic − 8.33% × min(basic, ₹15,000)', 'Monthly interest = Balance × rate ÷ 12, added to the balance at year end', 'Basic rises by your yearly increase each year'],
  },
}

// ───────────────────────────── FD ─────────────────────────────

const fdDef: CalculatorDef = {
  slug: 'fd-calculator',
  name: 'FD Calculator',
  category: 'popular',
  summary: 'Find the maturity amount of a fixed deposit for any tenure and compounding.',
  fields: [
    num('amount', 'Total investment', { min: 1_000, max: 10_000_000, step: 1_000, default: 500_000, format: 'inr' }),
    num('rate', 'Rate of interest (p.a.)', { min: 1, max: 15, step: 0.1, default: 7, format: 'percent' }),
    num('years', 'Time period (years)', { min: 0, max: 30, step: 1, default: 5, format: 'years' }),
    num('months', 'Extra months', { min: 0, max: 11, step: 1, default: 0, format: 'months' }),
    choice('compounding', 'Compounding', {
      options: [
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' },
        { value: 'halfYearly', label: 'Half-yearly' },
        { value: 'yearly', label: 'Yearly' },
      ],
      default: 'quarterly',
      variant: 'select',
    }),
  ],
  compute(v) {
    const r = fd({ principal: n(v, 'amount'), annualRate: n(v, 'rate'), years: n(v, 'years'), months: n(v, 'months'), compounding: s(v, 'compounding') as Compounding })
    const empty = n(v, 'years') + n(v, 'months') === 0
    return {
      stats: [
        { label: 'Invested amount', value: proj(r.invested) },
        { label: 'Total interest', value: proj(r.interest) },
        { label: 'Maturity value', value: proj(r.value), tone: 'primary' },
      ],
      donut: returnDonut(r.invested, r.interest, 'Invested amount', 'Total interest'),
      series: growthSeries(r.yearly, 'Invested amount', 'Interest earned'),
      table: growthTable(r.yearly, ['Year', 'Invested', 'Interest', 'Balance']),
      notes: empty ? ['Choose a tenure of at least one month.'] : [],
    }
  },
  method: {
    intro: 'Interest compounds at the chosen frequency. Banks usually compound FDs quarterly.',
    formulas: ['A = P × (1 + r/n)^(n × t)', 'P = deposit, r = annual rate ÷ 100, n = compounding periods a year, t = tenure in years'],
  },
}

// ───────────────────────────── RD ─────────────────────────────

const rdDef: CalculatorDef = {
  slug: 'rd-calculator',
  name: 'RD Calculator',
  category: 'popular',
  summary: 'Calculate the maturity value of a recurring deposit.',
  fields: [
    num('amount', 'Monthly deposit', { min: 500, max: 100_000, step: 500, default: 5_000, format: 'inr' }),
    num('rate', 'Rate of interest (p.a.)', { min: 1, max: 15, step: 0.1, default: 6.5, format: 'percent' }),
    num('months', 'Time period', { min: 6, max: 120, step: 1, default: 60, format: 'months' }),
  ],
  compute(v) {
    const r = rd({ monthly: n(v, 'amount'), annualRate: n(v, 'rate'), months: n(v, 'months') })
    return {
      stats: [
        { label: 'Invested amount', value: proj(r.invested) },
        { label: 'Total interest', value: proj(r.interest) },
        { label: 'Maturity value', value: proj(r.value), tone: 'primary' },
      ],
      donut: returnDonut(r.invested, r.interest, 'Invested amount', 'Total interest'),
      series: growthSeries(r.yearly, 'Invested amount', 'Interest earned'),
      table: growthTable(r.yearly, ['Year', 'Invested', 'Interest', 'Balance']),
    }
  },
  method: {
    intro: 'Interest compounds quarterly, as most banks do. Each monthly deposit earns for the months it stays in.',
    formulas: ['M = R × [ (1 + i)^q − 1 ] ÷ [ 1 − (1 + i)^(−1/3) ]', 'R = monthly deposit, i = annual rate ÷ 400, q = tenure in months ÷ 3'],
  },
}

// ───────────────────────────── EMI ─────────────────────────────

const emiDef: CalculatorDef = {
  slug: 'emi-calculator',
  name: 'EMI Calculator',
  category: 'popular',
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
    }
  },
  method: {
    intro: 'Interest is charged monthly on the outstanding balance (reducing balance method).',
    formulas: ['EMI = P × r × (1 + r)^n ÷ [ (1 + r)^n − 1 ]', 'P = loan amount, r = annual rate ÷ 12 ÷ 100, n = tenure in months'],
  },
}

// ───────────────────────────── GST ─────────────────────────────

const gstDef: CalculatorDef = {
  slug: 'gst-calculator',
  name: 'GST Calculator',
  category: 'popular',
  summary: 'Add GST to a price, or take it out of a GST-inclusive price.',
  fields: [
    choice('mode', 'I want to', {
      options: [
        { value: 'add', label: 'Add GST' },
        { value: 'remove', label: 'Remove GST' },
      ],
      default: 'add',
      variant: 'toggle',
    }),
    num('amount', 'Amount', { min: 1, max: 10_000_000, step: 100, default: 10_000, format: 'inr' }),
    choice('rate', 'GST rate', {
      options: ['0.25', '3', '5', '18', '40'].map((r) => ({ value: r, label: `${r}%` })),
      default: '18',
      variant: 'toggle',
    }),
  ],
  compute(v) {
    const r = gst({ amount: n(v, 'amount'), rate: n(v, 'rate'), inclusive: v.mode === 'remove' })
    return {
      stats: [
        { label: 'Amount before GST', value: due(r.net) },
        { label: 'GST amount', value: due(r.tax), tone: 'accent' },
        { label: 'Amount with GST', value: due(r.total), tone: 'primary' },
        { label: 'CGST + SGST (each)', value: due(r.half) },
      ],
      donut: [
        { label: 'Amount before GST', value: r.net, display: due(r.net), tone: 'soft' },
        { label: 'GST amount', value: r.tax, display: due(r.tax), tone: 'amber' },
      ],
      notes: ['For a sale within one state the GST splits equally into CGST and SGST. Between states it is charged as IGST in full.'],
    }
  },
  method: {
    intro: 'GST is a percentage of the price before tax.',
    formulas: ['Add GST: GST = Amount × rate ÷ 100,  Total = Amount + GST', 'Remove GST: Net = Amount ÷ (1 + rate ÷ 100),  GST = Amount − Net'],
  },
}

// ───────────────────────────── Income tax ─────────────────────────────

const old = (f: NumberField): NumberField => ({ ...f, showIf: (v) => v.regime === 'old' })

const taxDef: CalculatorDef = {
  slug: 'income-tax-calculator',
  name: 'Income Tax Calculator',
  category: 'popular',
  summary: 'Compare tax under the new and old regimes for FY 2026-27 (AY 2027-28).',
  fields: [
    choice('regime', 'Tax regime', {
      options: [
        { value: 'new', label: 'New regime' },
        { value: 'old', label: 'Old regime' },
      ],
      default: 'new',
      variant: 'toggle',
    }),
    choice('age', 'Age', {
      options: [
        { value: 'below60', label: 'Below 60' },
        { value: 'senior', label: '60 to 79' },
        { value: 'superSenior', label: '80 and above' },
      ],
      default: 'below60',
      variant: 'toggle',
    }),
    choice('salaried', 'Income type', {
      options: [
        { value: 'yes', label: 'Salaried' },
        { value: 'no', label: 'Other income' },
      ],
      default: 'yes',
      variant: 'toggle',
    }),
    num('gross', 'Gross annual income', { min: 0, max: 50_000_000, step: 10_000, default: 1_500_000, format: 'inr' }),
    num('employerNps', 'Employer NPS contribution (80CCD(2))', { min: 0, max: 1_000_000, step: 1_000, default: 0, format: 'inr' }),
    old(num('hra', 'HRA exemption', { min: 0, max: 1_000_000, step: 1_000, default: 0, format: 'inr' })),
    old(num('c80', 'Section 80C', { min: 0, max: LIMITS.section80c, step: 1_000, default: 150_000, format: 'inr' })),
    old(num('nps', 'NPS, 80CCD(1B)', { min: 0, max: LIMITS.nps80ccd1b, step: 1_000, default: 0, format: 'inr' })),
    old(num('d80', 'Health insurance, 80D', { min: 0, max: LIMITS.section80d, step: 1_000, default: 0, format: 'inr' })),
    old(num('loan', 'Home loan interest, 24(b)', { min: 0, max: LIMITS.homeLoanInterest, step: 5_000, default: 0, format: 'inr' })),
    old(num('other', 'Other deductions (80E, 80G…)', { min: 0, max: 1_000_000, step: 1_000, default: 0, format: 'inr' })),
  ],
  compute(v) {
    const input = (regime: Regime) => ({
      regime,
      age: s(v, 'age') as AgeGroup,
      gross: n(v, 'gross'),
      salaried: v.salaried === 'yes',
      employerNps: n(v, 'employerNps'),
      hraExemption: n(v, 'hra'),
      section80c: n(v, 'c80'),
      nps80ccd1b: n(v, 'nps'),
      section80d: n(v, 'd80'),
      homeLoanInterest: n(v, 'loan'),
      otherDeductions: n(v, 'other'),
    })
    const chosen = s(v, 'regime') as Regime
    const r = computeTax(input(chosen))
    const newR = computeTax(input('new'))
    const oldR = computeTax(input('old'))
    const diff = Math.abs(newR.total - oldR.total)
    const better = newR.total === oldR.total ? null : newR.total < oldR.total ? 'new' : 'old'
    const gross = n(v, 'gross')
    const takeHome = Math.max(gross - r.total, 0)

    const rows: string[][] = r.rows.map((row) => [
      `${formatInr(row.from)} – ${formatInr(row.to)}`,
      `${row.rate * 100}%`,
      due(row.tax),
    ])
    rows.push(['Tax on slabs', '', due(r.slabTax)])
    if (r.rebate > 0) rows.push(['Rebate u/s 87A (incl. marginal relief)', '', `− ${due(r.rebate)}`])
    if (r.surcharge > 0) rows.push(['Surcharge', '', due(r.surcharge)])
    rows.push(['Health & education cess (4%)', '', due(r.cess)])
    rows.push(['Total tax', '', due(r.total)])

    return {
      stats: [
        { label: `Total tax (${chosen} regime)`, value: due(r.total), tone: 'primary' },
        { label: 'Taxable income', value: due(r.taxable) },
        { label: 'Effective tax rate', value: pc(r.effectiveRate) },
        { label: 'Monthly take-home (before other deductions)', value: due(takeHome / 12) },
      ],
      donut: [
        { label: 'Income after tax', value: takeHome, display: due(takeHome), tone: 'soft' },
        { label: 'Tax', value: r.total, display: due(r.total), tone: 'amber' },
      ],
      table: { title: 'Tax calculation', columns: ['Income slab', 'Rate', 'Tax'], rows },
      notes: [
        better
          ? `For these inputs the ${better} regime is cheaper by ${due(diff)} (new regime ${due(newR.total)}, old regime ${due(oldR.total)} using the deductions listed under Old regime).`
          : `Both regimes give the same tax: ${due(newR.total)}.`,
        'Covers a resident individual’s salary, business and interest income. Capital gains at special rates and HUF/company taxpayers are not included.',
      ],
    }
  },
  method: {
    intro:
      'Taxable income is gross income less the deductions each regime allows. Slab tax is reduced by the Section 87A rebate (with marginal relief), then surcharge (with marginal relief) and 4% cess are added.',
    formulas: [
      'New regime slabs: 0–4L nil, 4–8L 5%, 8–12L 10%, 12–16L 15%, 16–20L 20%, 20–24L 25%, above 24L 30%. Standard deduction ₹75,000; rebate up to ₹60,000 for taxable income up to ₹12L.',
      'Old regime slabs (below 60): 0–2.5L nil, 2.5–5L 5%, 5–10L 20%, above 10L 30%; 3L and 5L exemption for senior and super senior. Standard deduction ₹50,000; rebate up to ₹12,500 for taxable income up to ₹5L.',
      'Surcharge on tax: 10% above ₹50L, 15% above ₹1 Cr, 25% above ₹2 Cr, 37% above ₹5 Cr (old regime; the new regime is capped at 25%).',
      'Total tax = (slab tax − rebate + surcharge) × 1.04',
    ],
  },
}

// ───────────────────────────── XIRR ─────────────────────────────

const xirrDef: CalculatorDef = {
  slug: 'xirr-calculator',
  name: 'XIRR Calculator',
  category: 'popular',
  summary: 'Find your annualised return when money goes in and out on different dates.',
  fields: [],
  compute: () => ({ stats: [] }),
  custom: 'xirr',
  method: {
    intro: 'XIRR is the yearly rate that makes the present value of all your cash flows equal zero, using the actual number of days between dates over a 365-day year (the same as Excel\'s XIRR).',
    formulas: ['Σ  Amount(i) ÷ (1 + XIRR)^((Date(i) − Date(1)) ÷ 365) = 0', 'Money you invest is negative; money you get back, or the current value, is positive'],
  },
}

export const CALCULATORS: CalculatorDef[] = [
  sipDef('sip-calculator', 'SIP Calculator', 'Estimate what a monthly SIP can grow to over the years.', 'popular'),
  lumpsumDef,
  swpDef,
  mfReturnsDef,
  ssyDef,
  taxDef,
  ppfDef,
  epfDef,
  fdDef,
  rdDef,
  emiDef,
  gstDef,
  xirrDef,
  elssDef,
  fundHouse('sbi-sip-calculator', 'SBI SIP Calculator', 'SBI'),
  fundHouse('hdfc-sip-calculator', 'HDFC SIP Calculator', 'HDFC'),
  fundHouse('icici-sip-calculator', 'ICICI SIP Calculator', 'ICICI'),
  fundHouse('axis-bank-sip-calculator', 'Axis Bank SIP Calculator', 'Axis'),
  fundHouse('kotak-bank-sip-calculator', 'Kotak Bank SIP Calculator', 'Kotak'),
  fundHouse('nippon-india-sip-calculator', 'Nippon India SIP Calculator', 'Nippon India'),
  fundHouse('lic-sip-calculator', 'LIC SIP Calculator', 'LIC'),
  fundHouse('idbi-sip-calculator', 'IDBI SIP Calculator', 'IDBI'),
  fundHouse('pnb-sip-calculator', 'PNB SIP Calculator', 'PNB'),
]

export const getCalculator = (slug: string) => CALCULATORS.find((c) => c.slug === slug)
export const POPULAR = CALCULATORS.filter((c) => c.category === 'popular')
export const MUTUAL_FUND = CALCULATORS.filter((c) => c.category === 'mutual-fund')

export const defaultValues = (def: CalculatorDef): Values => Object.fromEntries(def.fields.map((f) => [f.id, f.default]))

