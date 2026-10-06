export type SipInput = {
  /** Starting monthly contribution in rupees. */
  monthlyAmount: number
  /** Assumed yearly return, in percent (12 = 12%). */
  annualReturn: number
  years: number
  /** Yearly increase in the monthly contribution, in percent. */
  stepUpPercent: number
}

export type SipYear = { year: number; invested: number; value: number }

export type SipProjection = {
  invested: number
  value: number
  /** Gain over the amount invested, in percent. */
  gainPercent: number
  yearly: SipYear[]
}

/**
 * Step-up SIP projection. Contributions are made at the start of each month and
 * compound monthly at annualReturn / 12, the convention used by most Indian SIP
 * calculators. The contribution increases by stepUpPercent at the start of each year.
 */
export function projectSip({ monthlyAmount, annualReturn, years, stepUpPercent }: SipInput): SipProjection {
  const monthlyRate = annualReturn / 100 / 12
  const stepUp = stepUpPercent / 100
  const yearly: SipYear[] = []

  let invested = 0
  let value = 0
  for (let year = 0; year < years; year++) {
    const contribution = monthlyAmount * Math.pow(1 + stepUp, year)
    for (let month = 0; month < 12; month++) {
      invested += contribution
      value = (value + contribution) * (1 + monthlyRate)
    }
    yearly.push({ year: year + 1, invested: Math.round(invested), value: Math.round(value) })
  }

  const totalInvested = Math.round(invested)
  const totalValue = Math.round(value)
  return {
    invested: totalInvested,
    value: totalValue,
    gainPercent: totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0,
    yearly,
  }
}
