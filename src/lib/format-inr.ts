const grouped = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

const CRORE = 10_000_000
const LAKH = 100_000

/** Truncate to two decimals so projected figures are never rounded up. */
const truncate2 = (n: number) => (Math.floor(n * 100) / 100).toFixed(2)

/** ₹2,06,40,513 */
export function formatInr(amount: number, { symbol = true } = {}) {
  return `${symbol ? '₹' : ''}${grouped.format(Math.round(amount))}`
}

/** ₹3.97 Cr, ₹24.50 L, or ₹95,000 below one lakh. */
export function formatInrCompact(amount: number) {
  if (amount >= CRORE) return `₹${truncate2(amount / CRORE)} Cr`
  if (amount >= LAKH) return `₹${truncate2(amount / LAKH)} L`
  return formatInr(amount)
}

/** Short labels for axes and slider marks: 500, 20K, 1L, 1Cr. */
export function formatInrShort(amount: number) {
  const trim = (n: number) => String(Number(n.toFixed(1)))
  if (amount >= CRORE) return `${trim(amount / CRORE)}Cr`
  if (amount >= LAKH) return `${trim(amount / LAKH)}L`
  if (amount >= 1000) return `${trim(amount / 1000)}K`
  return String(amount)
}
