import { findIsin } from './isin'
import { parseAmount } from './numbers'

export type PastedRow = { name: string; isin: string | null; quantity: number | null; amount: number | null; looksLikeStock: boolean }

/**
 * Rows copied from Excel or Google Sheets (tab-separated) or typed as CSV. Each row
 * needs a name or ISIN; the first number is units, the second (if any) the amount
 * invested. A header row and totals rows are skipped.
 */
export function parsePasted(text: string): PastedRow[] {
  const out: PastedRow[] = []
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue
    const cells = (line.includes('\t') ? line.split('\t') : line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)).map((c) => c.trim().replace(/^"|"$/g, ''))
    const isin = findIsin(line)
    const textCells = cells.filter((c) => c && parseAmount(c) === null && c.toUpperCase() !== isin)
    const numbers = cells.map((c) => parseAmount(c)).filter((n): n is number => n !== null && n > 0)
    const name = textCells[0] ?? isin ?? ''
    if (!name || /^(total|grand total|sub ?total)\b/i.test(name)) continue
    // A header row has text but no numbers and no ISIN.
    if (!numbers.length && !isin) continue
    out.push({
      name,
      isin,
      quantity: numbers[0] ?? null,
      amount: numbers[1] ?? null,
      looksLikeStock: /\b(ltd|limited|industries|bank)\b/i.test(name) && !/fund|etf/i.test(name),
    })
  }
  return out
}
