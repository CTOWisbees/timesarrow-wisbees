/**
 * ISIN check: 2 letters, 9 alphanumerics, 1 check digit. Letters become numbers
 * (A=10 … Z=35), then the Luhn check runs on the resulting digit string.
 */
export function isValidIsin(value: string): boolean {
  const isin = value.trim().toUpperCase()
  if (!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(isin)) return false
  const digits = [...isin].map((c) => (/[A-Z]/.test(c) ? String(c.charCodeAt(0) - 55) : c)).join('')
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i])
    if (i % 2 === 1) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
  }
  return sum % 10 === 0
}

/** Indian ISINs only (v1 supports INR instruments). */
export const isIndianIsin = (value: string) => value.trim().toUpperCase().startsWith('IN') && isValidIsin(value)

/** Pulls the first plausible ISIN out of free text (file cells, pasted rows). */
export function findIsin(text: string): string | null {
  for (const m of text.toUpperCase().matchAll(/\b[A-Z]{2}[A-Z0-9]{9}[0-9]\b/g)) {
    if (isValidIsin(m[0])) return m[0]
  }
  return null
}
