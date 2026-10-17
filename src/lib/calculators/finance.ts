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

export const COMPOUNDING = { monthly: 12, quarterly: 4, halfYearly: 2, yearly: 1 } as const
export type Compounding = keyof typeof COMPOUNDING

/** Fixed deposit: A = P × (1 + r/n)^(n·t), t in years (months are fractions of a year). */
export function fd({ principal, annualRate, years, months, compounding }: { principal: number; annualRate: number; years: number; months: number; compounding: Compounding }) {
  const n = COMPOUNDING[compounding]
  const t = years + months / 12
  const at = (time: number) => principal * Math.pow(1 + pct(annualRate) / n, n * time)
  const value = at(t)
  const yearly: YearPoint[] = []
  for (let y = 1; y <= Math.ceil(t); y++) yearly.push({ year: y, invested: principal, value: at(Math.min(y, t)) })
  return { invested: principal, value, interest: value - principal, yearly }
}

/**
 * Recurring deposit with quarterly compounding, the convention Indian banks use.
 * A deposit made at the start of month j, held to month k, grows for (k − j + 1) months
 * = (k − j + 1)/3 quarters at i = r/4. Equivalent to M = R × ((1+i)^q − 1) / (1 − (1+i)^(−1/3)).
 */
export function rd({ monthly, annualRate, months }: { monthly: number; annualRate: number; months: number }) {
  const i = pct(annualRate) / 4
  const at = (k: number) => {
    let total = 0
    for (let j = 1; j <= k; j++) total += monthly * Math.pow(1 + i, (k - j + 1) / 3)
    return total
  }
  const yearly: YearPoint[] = []
  for (let y = 1; y <= Math.ceil(months / 12); y++) {
    const k = Math.min(y * 12, months)
    yearly.push({ year: y, invested: monthly * k, value: at(k) })
  }
  const value = at(months)
  const invested = monthly * months
  return { invested, value, interest: value - invested, yearly }
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

/** PPF: one deposit a year by 5 April, interest compounded yearly. Balance = (balance + D) × (1 + r). */
export function ppf({ yearly: deposit, annualRate, years }: { yearly: number; annualRate: number; years: number }) {
  const r = pct(annualRate)
  const yearly: YearPoint[] = []
  let value = 0
  for (let y = 1; y <= years; y++) {
    value = (value + deposit) * (1 + r)
    yearly.push({ year: y, invested: deposit * y, value })
  }
  const invested = deposit * years
  return { invested, value, interest: value - invested, yearly }
}

export const SSY_DEPOSIT_YEARS = 15
export const SSY_MATURITY_YEARS = 21

/** Sukanya Samriddhi: deposits for 15 years, account matures 21 years after opening; yearly compounding. */
export function ssy({ yearly: deposit, annualRate }: { yearly: number; annualRate: number }) {
  const r = pct(annualRate)
  const yearly: YearPoint[] = []
  let value = 0
  for (let y = 1; y <= SSY_MATURITY_YEARS; y++) {
    value = (y <= SSY_DEPOSIT_YEARS ? value + deposit : value) * (1 + r)
    yearly.push({ year: y, invested: deposit * Math.min(y, SSY_DEPOSIT_YEARS), value })
  }
  const invested = deposit * SSY_DEPOSIT_YEARS
  return { invested, value, interest: value - invested, yearly }
}

/** EPS is 8.33% of basic capped at ₹15,000 of wage. */
export const EPS_WAGE_CAP = 15000
export const EPS_RATE = 0.0833

/**
 * EPF corpus. Employee pays `employeeRate`% of basic+DA; the employer pays the same, of which
 * 8.33% (on wages capped at ₹15,000) goes to the pension scheme and the rest to EPF.
 * Interest accrues monthly on the running balance and is credited at each year end.
 */
export function epf({ monthlyBasic, employeeRate, annualRate, raisePercent, years }: { monthlyBasic: number; employeeRate: number; annualRate: number; raisePercent: number; years: number }) {
  const r = pct(annualRate) / 12
  const yearly: YearPoint[] = []
  let balance = 0
  let invested = 0
  let employer = 0
  for (let y = 0; y < years; y++) {
    const basic = monthlyBasic * Math.pow(1 + pct(raisePercent), y)
    const employee = basic * pct(employeeRate)
    const eps = Math.min(basic, EPS_WAGE_CAP) * EPS_RATE
    const employerEpf = Math.max(basic * pct(employeeRate) - eps, 0)
    let accrued = 0
    for (let m = 0; m < 12; m++) {
      balance += employee + employerEpf
      accrued += balance * r
    }
    balance += accrued
    invested += (employee + employerEpf) * 12
    employer += employerEpf * 12
    yearly.push({ year: y + 1, invested, value: balance })
  }
  return { invested, employer, employee: invested - employer, value: balance, interest: balance - invested, yearly }
}

/** GST on an exclusive or inclusive amount. */
export function gst({ amount, rate, inclusive }: { amount: number; rate: number; inclusive: boolean }) {
  const net = inclusive ? amount / (1 + pct(rate)) : amount
  const tax = inclusive ? amount - net : (amount * rate) / 100
  return { net, tax, total: net + tax, half: tax / 2 }
}

export type CashFlow = { date: number; amount: number }

const DAY_MS = 86_400_000

/**
 * XIRR: the rate r with Σ amount_i / (1 + r)^((date_i − date_0)/365) = 0 (same convention as Excel).
 * Solved by bisection on a bracket that is widened until the sign changes. Returns null when
 * there is no sign change (needs at least one inflow and one outflow) or no root exists.
 */
export function xirr(flows: CashFlow[]): number | null {
  const valid = flows.filter((f) => Number.isFinite(f.date) && Number.isFinite(f.amount) && f.amount !== 0)
  if (valid.length < 2 || !valid.some((f) => f.amount > 0) || !valid.some((f) => f.amount < 0)) return null
  const t0 = Math.min(...valid.map((f) => f.date))
  const npv = (rate: number) => valid.reduce((sum, f) => sum + f.amount / Math.pow(1 + rate, (f.date - t0) / DAY_MS / 365), 0)

  let lo = -0.999999
  let hi = 1
  let fLo = npv(lo)
  let fHi = npv(hi)
  for (let k = 0; k < 60 && Math.sign(fLo) === Math.sign(fHi); k++) {
    hi *= 2
    fHi = npv(hi)
  }
  if (Math.sign(fLo) === Math.sign(fHi)) return null
  for (let k = 0; k < 300; k++) {
    const mid = (lo + hi) / 2
    const fMid = npv(mid)
    if (Math.sign(fMid) === Math.sign(fLo)) {
      lo = mid
      fLo = fMid
    } else hi = mid
  }
  return (lo + hi) / 2
}
