/** "up to 75% equity" -> 75. The risk profile stores the limit as text. */
export function equityLimitFrom(text: string | null | undefined): number | null {
  const m = text?.match(/(\d{1,3})\s*%/)
  if (!m) return null
  const n = Number(m[1])
  return n > 0 && n <= 100 ? n : null
}

export const shareLabel = (limit: number) => `up to ${limit}% in shares`
