/**
 * Pure maths behind the client dashboard. Figures are estimates for planning and are
 * unit tested (see math.test.ts); the AI copilot only ever reads numbers produced here.
 */

export type Projection = { value: number; invested: number }

/**
 * What a goal could be worth after `years`: the corpus already saved compounds monthly at
 * r/12, and each monthly instalment is invested at the start of the month (annuity-due),
 * the same convention as the SIP calculator.
 */
export function projectGoal({ saved, monthly, annualReturn, years }: { saved: number; monthly: number; annualReturn: number; years: number }): Projection {
  const i = annualReturn / 12
  const n = years * 12
  const growth = Math.pow(1 + i, n)
  const sipValue = i === 0 ? monthly * n : monthly * ((growth - 1) / i) * (1 + i)
  return { value: saved * growth + sipValue, invested: saved + monthly * n }
}

/** The extra monthly amount (rounded up to the next ₹100) that closes a funding gap; 0 when on track. */
export function extraMonthlyNeeded({ target, saved, monthly, annualReturn, years }: { target: number; saved: number; monthly: number; annualReturn: number; years: number }) {
  const projected = projectGoal({ saved, monthly, annualReturn, years }).value
  if (projected >= target) return 0
  const i = annualReturn / 12
  const n = years * 12
  const perRupee = i === 0 ? n : ((Math.pow(1 + i, n) - 1) / i) * (1 + i)
  return Math.ceil((target - projected) / perRupee / 100) * 100
}

export type GoalStatus = 'on' | 'behind'

export const goalStatus = (projected: number, target: number): GoalStatus => (projected >= target ? 'on' : 'behind')

/** Equity falls by `fallPct`; bonds fall a fifth as much; gold and cash are left alone. */
export function stressTest({ shares, bonds, total }: { shares: number; bonds: number; total: number }, fallPct: number) {
  const loss = (shares * fallPct) / 100 + (bonds * fallPct * 0.2) / 100
  return { loss, left: total - loss, lossPct: total === 0 ? 0 : (loss / total) * 100 }
}

export type MixRow = { label: string; now: number; plan: number }

/** How far each asset class has drifted from the plan, in percentage points. */
export const drift = (row: MixRow) => row.now - row.plan

/** Drifted means more than 3 points either way. */
export const hasDrifted = (row: MixRow, band = 3) => Math.abs(drift(row)) > band

/** Rupees to move to bring an asset class back to plan, rounded to the nearest ₹10,000. */
export const rebalanceAmount = (row: MixRow, total: number) => Math.round((Math.abs(drift(row)) / 100) * total / 10_000) * 10_000

/** Money-weighted share of the portfolio in each holding, used for concentration checks. */
export const shareOf = (value: number, total: number) => (total === 0 ? 0 : (value / total) * 100)

/** SEBI's cap on a fixed fee per family per year, in rupees. */
export const FEE_CAP_PER_YEAR = 151_000

/** Yearly fee for a monthly or yearly price, and whether it sits within the cap. */
export function feeCheck(price: { perMonth?: number; perYear?: number }) {
  const yearly = price.perYear ?? (price.perMonth ?? 0) * 12
  return { yearly, withinCap: yearly <= FEE_CAP_PER_YEAR }
}
