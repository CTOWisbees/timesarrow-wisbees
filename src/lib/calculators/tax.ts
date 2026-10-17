/**
 * Resident individual income tax for FY 2026-27 (AY 2027-28), ordinary income only
 * (salary, business, interest). Special-rate capital gains are not covered.
 */

export type Regime = 'new' | 'old'
export type AgeGroup = 'below60' | 'senior' | 'superSenior'

export type TaxInput = {
  regime: Regime
  age: AgeGroup
  /** Gross annual income before any deduction. */
  gross: number
  salaried: boolean
  /** Employer NPS contribution (80CCD(2)), allowed in both regimes. */
  employerNps: number
  /** Old regime only. */
  hraExemption: number
  section80c: number
  nps80ccd1b: number
  section80d: number
  homeLoanInterest: number
  otherDeductions: number
}

type Slab = { upTo: number; rate: number }

const NEW_SLABS: Slab[] = [
  { upTo: 400_000, rate: 0 },
  { upTo: 800_000, rate: 0.05 },
  { upTo: 1_200_000, rate: 0.1 },
  { upTo: 1_600_000, rate: 0.15 },
  { upTo: 2_000_000, rate: 0.2 },
  { upTo: 2_400_000, rate: 0.25 },
  { upTo: Infinity, rate: 0.3 },
]

const oldSlabs = (age: AgeGroup): Slab[] => {
  const exempt = age === 'superSenior' ? 500_000 : age === 'senior' ? 300_000 : 250_000
  return [
    { upTo: exempt, rate: 0 },
    ...(exempt < 500_000 ? [{ upTo: 500_000, rate: 0.05 }] : []),
    { upTo: 1_000_000, rate: 0.2 },
    { upTo: Infinity, rate: 0.3 },
  ]
}

export const LIMITS = {
  section80c: 150_000,
  nps80ccd1b: 50_000,
  homeLoanInterest: 200_000,
  section80d: 100_000,
  standardNew: 75_000,
  standardOld: 50_000,
  rebateNewLimit: 1_200_000,
  rebateNewMax: 60_000,
  rebateOldLimit: 500_000,
  rebateOldMax: 12_500,
  cess: 0.04,
}

export type SlabRow = { from: number; to: number; rate: number; amount: number; tax: number }

export function slabTax(taxable: number, slabs: Slab[]) {
  const rows: SlabRow[] = []
  let from = 0
  let tax = 0
  for (const s of slabs) {
    if (taxable <= from) break
    const amount = Math.min(taxable, s.upTo) - from
    const t = amount * s.rate
    rows.push({ from, to: Math.min(taxable, s.upTo), rate: s.rate, amount, tax: t })
    tax += t
    from = s.upTo
  }
  return { tax, rows }
}

const SURCHARGE: { above: number; old: number; new: number }[] = [
  { above: 5_000_000, old: 0.1, new: 0.1 },
  { above: 10_000_000, old: 0.15, new: 0.15 },
  { above: 20_000_000, old: 0.25, new: 0.25 },
  { above: 50_000_000, old: 0.37, new: 0.25 },
]

const surchargeRate = (taxable: number, regime: Regime) => {
  let rate = 0
  for (const s of SURCHARGE) if (taxable > s.above) rate = s[regime]
  return rate
}

/** Tax (after 87A rebate) plus surcharge, with marginal relief at every surcharge threshold. */
function taxWithSurcharge(taxable: number, regime: Regime, slabs: Slab[]) {
  const base = slabTax(taxable, slabs).tax
  const rate = surchargeRate(taxable, regime)
  let surcharge = base * rate
  if (rate > 0) {
    const threshold = [...SURCHARGE].reverse().find((s) => taxable > s.above)!.above
    const atThreshold = slabTax(threshold, slabs).tax
    const atThresholdTotal = atThreshold * (1 + surchargeRate(threshold, regime))
    const extra = taxable - threshold
    if (base + surcharge - atThresholdTotal > extra) surcharge = Math.max(atThresholdTotal + extra - base, 0)
  }
  return { base, surcharge }
}

export function computeTax(input: TaxInput) {
  const isNew = input.regime === 'new'
  const slabs = isNew ? NEW_SLABS : oldSlabs(input.age)
  const standard = input.salaried ? (isNew ? LIMITS.standardNew : LIMITS.standardOld) : 0
  const clamp = (n: number, max = Infinity) => Math.min(Math.max(n || 0, 0), max)

  const deductions = isNew
    ? { standard, employerNps: clamp(input.employerNps) }
    : {
        standard,
        employerNps: clamp(input.employerNps),
        hra: clamp(input.hraExemption),
        section80c: clamp(input.section80c, LIMITS.section80c),
        nps80ccd1b: clamp(input.nps80ccd1b, LIMITS.nps80ccd1b),
        section80d: clamp(input.section80d, LIMITS.section80d),
        homeLoanInterest: clamp(input.homeLoanInterest, LIMITS.homeLoanInterest),
        other: clamp(input.otherDeductions),
      }
  const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0)
  const taxable = Math.max(input.gross - totalDeductions, 0)

  const { tax: slabTotal, rows } = slabTax(taxable, slabs)

  let rebate = 0
  let taxAfterRebate = slabTotal
  if (isNew) {
    if (taxable <= LIMITS.rebateNewLimit) rebate = Math.min(slabTotal, LIMITS.rebateNewMax)
    else rebate = Math.max(slabTotal - (taxable - LIMITS.rebateNewLimit), 0) // marginal relief just above ₹12L
  } else if (taxable <= LIMITS.rebateOldLimit) rebate = Math.min(slabTotal, LIMITS.rebateOldMax)
  taxAfterRebate = slabTotal - rebate

  // Surcharge only applies far above the rebate range, so it is computed on the slab tax.
  const { surcharge } = taxWithSurcharge(taxable, input.regime, slabs)
  const cess = (taxAfterRebate + surcharge) * LIMITS.cess
  const total = taxAfterRebate + surcharge + cess

  return {
    taxable,
    deductions,
    totalDeductions,
    rows,
    slabTax: slabTotal,
    rebate,
    surcharge,
    cess,
    total,
    effectiveRate: input.gross > 0 ? (total / input.gross) * 100 : 0,
  }
}
