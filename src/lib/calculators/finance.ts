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

/**
 * Step-up SIP: the monthly amount rises by `stepUp` percent at the start of every year after the first.
 * Each instalment is still invested at the start of the month and compounds at r/12.
 */
export function stepUpSip({ monthly, stepUp, annualReturn, years }: { monthly: number; stepUp: number; annualReturn: number; years: number }) {
  const i = pct(annualReturn) / 12
  const yearly: (YearPoint & { monthly: number })[] = []
  let value = 0
  let invested = 0
  let amount = monthly
  for (let y = 1; y <= years; y++) {
    if (y > 1) amount *= 1 + pct(stepUp)
    for (let m = 0; m < 12; m++) value = (value + amount) * (1 + i)
    invested += amount * 12
    yearly.push({ year: y, monthly: amount, invested, value })
  }
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

export type LoanYear = { year: number; principal: number; interest: number; balance: number }

/** EMI = P × r × (1+r)^n / ((1+r)^n − 1), r = annual/12. Zero interest is split evenly. */
export function emi({ principal, annualRate, years }: { principal: number; annualRate: number; years: number }) {
  const n = Math.round(years * 12)
  const r = pct(annualRate) / 12
  const payment = r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  const yearly: LoanYear[] = []
  let balance = principal
  let yearPrincipal = 0
  let yearInterest = 0
  for (let m = 1; m <= n; m++) {
    const interest = balance * r
    const paidPrincipal = payment - interest
    balance = Math.max(balance - paidPrincipal, 0)
    yearPrincipal += paidPrincipal
    yearInterest += interest
    if (m % 12 === 0 || m === n) {
      yearly.push({ year: Math.ceil(m / 12), principal: yearPrincipal, interest: yearInterest, balance: m === n ? 0 : balance })
      yearPrincipal = 0
      yearInterest = 0
    }
  }
  const total = payment * n
  return { emi: payment, total, interest: total - principal, principal, months: n, yearly }
}

/**
 * Tax-loss harvesting, simplified: a booked loss cancels gains from other sales, and each rupee of gain it
 * cancels saves tax at the rate the user enters. Whatever loss is left can be carried forward by the rules in force.
 * Illustrative only: the user supplies the rate and the gains, and a CA confirms the treatment.
 */
export function harvest({ loss, gains, ratePct }: { loss: number; gains: number; ratePct: number }) {
  const offset = Math.min(loss, gains)
  return { offset, taxSaved: offset * pct(ratePct), carried: loss - offset, taxWithout: gains * pct(ratePct), taxWith: (gains - offset) * pct(ratePct) }
}
