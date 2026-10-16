import type { PortfolioScan } from '@/payload-types'

export type ScanCopy = PortfolioScan

/** Fills "{name}" placeholders; unknown placeholders are left as they are. */
export function fill(template: string | null | undefined, vars: Record<string, string | number | null | undefined>) {
  return (template ?? '').replace(/\{(\w+)\}/g, (match, key: string) => {
    const v = vars[key]
    return v === null || v === undefined ? match : String(v)
  })
}

export const pct = (x: number | null | undefined, digits = 1) => (x === null || x === undefined ? '–' : `${(x * 100).toFixed(digits).replace(/\.0$/, '')}%`)

/** Effective-mix colours: fixed per asset class (never by rank), validated for colour-vision deficiency. */
export const CLASS_COLORS = {
  equity: '#0f8a55',
  debt: '#2a78d6',
  gold: '#eda100',
  cash: '#e87ba4',
  other: '#4a3aa7',
} as const
export const CLASS_LABELS = { equity: 'Equity', debt: 'Debt', gold: 'Gold', cash: 'Cash', other: 'Other' } as const

/** Status palette: always shown with an icon and a word, never colour alone. */
export const STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
} as const

export const BAND_STATUS = { healthy: 'good', fair: 'warning', attention: 'serious', at_risk: 'critical' } as const

export const TYPE_LABELS: Record<string, string> = { equity: 'Stock', mutual_fund: 'Fund', etf: 'ETF', bond: 'Bond', cash: 'Cash' }

export const errorMessage = (copy: ScanCopy, code: string) =>
  copy.errors?.find((e) => e.code === code)?.message ?? copy.errors?.find((e) => e.code === 'generic')?.message ?? 'Something went wrong.'
