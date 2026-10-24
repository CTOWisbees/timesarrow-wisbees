/**
 * Pure calculator maths for the /tools pages. Every function is unit tested against
 * closed-form formulas or published figures (see finance.test.ts). Results are returned
 * unrounded; the UI decides how to display them.
 */

export type YearPoint = { year: number; invested: number; value: number }

const pct = (n: number) => n / 100

/** SIP, contributions at the start of each month, monthly compounding at r/12. FV = P × ((1+i)^n − 1)/i × (1+i). */
export function sip({ monthly, annualReturn, years }: { monthly: number; annualReturn: number; years: number }) {
  const i = pct(annualReturn) / 12
  const yearly: YearPoint[] = []
  let value = 0
  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) value = (value + monthly) * (1 + i)
    yearly.push({ year: y, invested: monthly * 12 * y, value })
  }
  const invested = monthly * 12 * years
  return { invested, value, returns: value - invested, yearly }
}

/** Lumpsum, yearly compounding: A = P × (1 + r)^t. */
export function lumpsum({ amount, annualReturn, years }: { amount: number; annualReturn: number; years: number }) {
  const yearly: YearPoint[] = []
  for (let y = 1; y <= years; y++) yearly.push({ year: y, invested: amount, value: amount * Math.pow(1 + pct(annualReturn), y) })
  const value = amount * Math.pow(1 + pct(annualReturn), years)
  return { invested: amount, value, returns: value - amount, yearly }
}

/**
 * SWP. Each month the balance grows by r/12, then the withdrawal is taken at month end.
 * If the balance cannot cover a withdrawal, the remainder is paid out and the plan ends.
 */
export function swp({ corpus, monthly, annualReturn, years }: { corpus: number; monthly: number; annualReturn: number; years: number }) {
  const i = pct(annualReturn) / 12
  const yearly: { year: number; withdrawn: number; value: number }[] = []
  let balance = corpus
  let withdrawn = 0
  let monthsPaid = 0
  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      if (balance <= 0) break
      balance *= 1 + i
      const pay = Math.min(monthly, balance)
      balance -= pay
      withdrawn += pay
      if (pay === monthly) monthsPaid++
      else monthsPaid += pay / monthly
    }
    yearly.push({ year: y, withdrawn, value: Math.max(balance, 0) })
  }
  const exhausted = balance <= 1e-9
  return { corpus, withdrawn, value: Math.max(balance, 0), exhausted, monthsPaid, yearly }
}
