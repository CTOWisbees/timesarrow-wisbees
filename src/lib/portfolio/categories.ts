/**
 * Maps AMFI's scheme headings (which mix old and new SEBI names, e.g. "Equity Scheme -
 * Large Cap Fund" and "Equity Schemes - Large Cap Fund") to one sub-category, an asset
 * class, and the category-level look-through used by the free tier.
 */

export type AssetClass = 'equity' | 'debt' | 'hybrid' | 'gold' | 'silver' | 'international' | 'cash' | 'other'
export type EffectiveClass = 'equity' | 'debt' | 'gold' | 'cash' | 'other'
export type CapSplit = { large: number; mid: number; small: number }

export type Category = {
  subCategory: string
  assetClass: AssetClass
  instrumentType: 'mutual_fund' | 'etf'
  isIndex: boolean
  isThematic: boolean
  /** Effective split for asset allocation (sums to 1). */
  split: Partial<Record<EffectiveClass, number>>
  /** Market-cap split of the equity part, where the category implies one. */
  caps?: CapSplit
}

type Rule = { test: RegExp; sub: string; asset: AssetClass; split: Category['split']; caps?: CapSplit; thematic?: boolean }

const EQ = { equity: 1 }
const DEBT = { debt: 1 }
const CASHLIKE = { cash: 1 }

// Order matters: the first match wins. Tested against the heading text in brackets.
const RULES: Rule[] = [
  // ETFs and index funds first (their headings also contain "Debt", "Gold", ...).
  { test: /gold etf/i, sub: 'Gold ETF', asset: 'gold', split: { gold: 1 } },
  { test: /silver etf/i, sub: 'Silver ETF', asset: 'silver', split: { other: 1 } },
  { test: /etfs? investing overseas/i, sub: 'International ETF', asset: 'international', split: { equity: 1 } },
  { test: /debt etf/i, sub: 'Debt ETF', asset: 'debt', split: DEBT },
  { test: /hybrid etf/i, sub: 'Hybrid ETF', asset: 'hybrid', split: { equity: 0.5, debt: 0.5 } },
  { test: /equity etf|other\s+etf/i, sub: 'Equity ETF', asset: 'equity', split: EQ },
  { test: /index funds? - debt/i, sub: 'Debt Index Fund', asset: 'debt', split: DEBT },
  { test: /index funds? - hybrid/i, sub: 'Hybrid Index Fund', asset: 'hybrid', split: { equity: 0.5, debt: 0.5 } },
  { test: /index funds/i, sub: 'Equity Index Fund', asset: 'equity', split: EQ },
  { test: /fof overseas|investing overseas|overseas fund of funds/i, sub: 'International FoF', asset: 'international', split: { equity: 1 } },
  { test: /fund of funds|fof domestic/i, sub: 'Domestic FoF', asset: 'hybrid', split: { equity: 0.6, debt: 0.4 } },

  // Equity
  { test: /large & mid cap/i, sub: 'Large & Mid Cap', asset: 'equity', split: EQ, caps: { large: 0.5, mid: 0.4, small: 0.1 } },
  { test: /large cap/i, sub: 'Large Cap', asset: 'equity', split: EQ, caps: { large: 0.9, mid: 0.08, small: 0.02 } },
  { test: /mid cap/i, sub: 'Mid Cap', asset: 'equity', split: EQ, caps: { large: 0.15, mid: 0.7, small: 0.15 } },
  { test: /small cap/i, sub: 'Small Cap', asset: 'equity', split: EQ, caps: { large: 0.05, mid: 0.2, small: 0.75 } },
  { test: /multi cap/i, sub: 'Multi Cap', asset: 'equity', split: EQ, caps: { large: 0.4, mid: 0.3, small: 0.3 } },
  { test: /flexi cap/i, sub: 'Flexi Cap', asset: 'equity', split: EQ, caps: { large: 0.65, mid: 0.2, small: 0.15 } },
  { test: /focused/i, sub: 'Focused', asset: 'equity', split: EQ, caps: { large: 0.7, mid: 0.2, small: 0.1 } },
  { test: /elss/i, sub: 'ELSS', asset: 'equity', split: EQ, caps: { large: 0.65, mid: 0.2, small: 0.15 } },
  { test: /value/i, sub: 'Value', asset: 'equity', split: EQ, caps: { large: 0.65, mid: 0.2, small: 0.15 } },
  { test: /contra/i, sub: 'Contra', asset: 'equity', split: EQ, caps: { large: 0.65, mid: 0.2, small: 0.15 } },
  { test: /dividend yield/i, sub: 'Dividend Yield', asset: 'equity', split: EQ, caps: { large: 0.7, mid: 0.2, small: 0.1 } },
  { test: /equity schemes? - (sectoral|thematic)|sectoral\/ thematic/i, sub: 'Sectoral / Thematic', asset: 'equity', split: EQ, thematic: true },

  // Hybrid
  { test: /arbitrage/i, sub: 'Arbitrage', asset: 'hybrid', split: CASHLIKE },
  { test: /aggressive hybrid|balanced hybrid/i, sub: 'Aggressive Hybrid', asset: 'hybrid', split: { equity: 0.7, debt: 0.3 } },
  { test: /conservative hybrid/i, sub: 'Conservative Hybrid', asset: 'hybrid', split: { equity: 0.2, debt: 0.8 } },
  { test: /balanced advantage|dynamic asset allocation/i, sub: 'Balanced Advantage', asset: 'hybrid', split: { equity: 0.55, debt: 0.45 } },
  { test: /equity savings/i, sub: 'Equity Savings', asset: 'hybrid', split: { equity: 0.35, debt: 0.35, cash: 0.3 } },
  { test: /multi asset/i, sub: 'Multi Asset', asset: 'hybrid', split: { equity: 0.6, debt: 0.25, gold: 0.15 } },

  // Debt and cash-like
  { test: /overnight/i, sub: 'Overnight', asset: 'debt', split: CASHLIKE },
  { test: /liquid/i, sub: 'Liquid', asset: 'debt', split: CASHLIKE },
  { test: /money market/i, sub: 'Money Market', asset: 'debt', split: CASHLIKE },
  { test: /ultra short/i, sub: 'Ultra Short Duration', asset: 'debt', split: DEBT },
  { test: /low duration/i, sub: 'Low Duration', asset: 'debt', split: DEBT },
  { test: /short (duration|term)/i, sub: 'Short Duration', asset: 'debt', split: DEBT },
  { test: /medium to long/i, sub: 'Medium to Long Duration', asset: 'debt', split: DEBT },
  { test: /medium (duration|term)/i, sub: 'Medium Duration', asset: 'debt', split: DEBT },
  { test: /long (duration|term)/i, sub: 'Long Duration', asset: 'debt', split: DEBT },
  { test: /dynamic (bond|term)/i, sub: 'Dynamic Bond', asset: 'debt', split: DEBT },
  { test: /corporate bond/i, sub: 'Corporate Bond', asset: 'debt', split: DEBT },
  { test: /credit risk/i, sub: 'Credit Risk', asset: 'debt', split: DEBT },
  { test: /banking and psu/i, sub: 'Banking and PSU', asset: 'debt', split: DEBT },
  { test: /gilt/i, sub: 'Gilt', asset: 'debt', split: DEBT },
  { test: /floating|floater/i, sub: 'Floater', asset: 'debt', split: DEBT },
  { test: /fixed term|interval|other debt|income/i, sub: 'Other Debt', asset: 'debt', split: DEBT },

  // Solution-oriented and leftovers
  { test: /retirement|children|life cycle/i, sub: 'Solution Oriented', asset: 'hybrid', split: { equity: 0.6, debt: 0.4 } },
  { test: /growth/i, sub: 'Other Equity', asset: 'equity', split: EQ },
]

// Index funds and ETFs that track one sector or theme count as thematic too.
const SECTOR_INDEX =
  /\b(bank|banking|financial services|psu|pharma|healthcare|it|technology|digital|infra|infrastructure|energy|auto|fmcg|consumption|realty|metal|commodities|cpse|defence|manufacturing|tourism|railway|mnc|esg|ev|capital markets?|housing|oil)\b/i

// Passive schemes are grouped loosely by AMFI ("Other Scheme - Index Funds", "Other ETFs"),
// so what they hold is read from the scheme name.
const PASSIVE_BY_NAME: { test: RegExp; sub: string; asset: AssetClass; split: Category['split'] }[] = [
  { test: /\bgold\b/i, sub: 'Gold', asset: 'gold', split: { gold: 1 } },
  { test: /\bsilver\b/i, sub: 'Silver', asset: 'silver', split: { other: 1 } },
  { test: /liquid|1d rate|overnight|money market|t-?bill/i, sub: 'Liquid', asset: 'debt', split: CASHLIKE },
  {
    test: /\bsdl\b|gilt|g-?sec|bharat bond|psu bond|cpse bond|\baaa\b|crisil ibx|ibx|bond|target maturity|corporate debt|debt/i,
    sub: 'Debt Index Fund',
    asset: 'debt',
    split: DEBT,
  },
  {
    test: /nasdaq|s&p 500|hang seng|nyse|fang|\bus\b|u\.s\.|global|msci|developed|emerging|japan|china|taiwan|world|international/i,
    sub: 'International Index',
    asset: 'international',
    split: { equity: 1 },
  },
]

const OTHER: Category = {
  subCategory: 'Other',
  assetClass: 'other',
  instrumentType: 'mutual_fund',
  isIndex: false,
  isThematic: false,
  split: { other: 1 },
}

/** Classify a scheme by its AMFI heading, e.g. "Open Ended Schemes(Equity Scheme - Large Cap Fund)". */
export function classifyCategory(heading: string, schemeName = ''): Category {
  const inner = heading.match(/\((.*)\)\s*$/)?.[1] ?? heading
  const rule = RULES.find((r) => r.test.test(inner))
  if (!rule) return OTHER
  const isEtf = /exchange traded|etf/i.test(inner)
  const isIndex = /index fund/i.test(inner) || /\bindex\b|nifty|sensex/i.test(schemeName) || isEtf
  const passive = isIndex ? PASSIVE_BY_NAME.find((p) => p.test.test(schemeName)) : undefined
  if (passive) {
    return {
      subCategory: isEtf ? `${passive.sub} ETF`.replace('Debt Index Fund ETF', 'Debt ETF').replace('International Index ETF', 'International ETF') : passive.sub,
      assetClass: passive.asset,
      instrumentType: isEtf ? 'etf' : 'mutual_fund',
      isIndex: true,
      isThematic: false,
      split: passive.split,
    }
  }
  return {
    subCategory: rule.sub,
    assetClass: rule.asset,
    instrumentType: isEtf ? 'etf' : 'mutual_fund',
    isIndex,
    isThematic: Boolean(rule.thematic) || (isIndex && rule.asset === 'equity' && SECTOR_INDEX.test(schemeName)),
    split: rule.split,
    caps: rule.caps,
  }
}

/**
 * Category-average total expense ratios (percent), used when a scheme's own TER is not
 * loaded. Rough industry averages for the prototype; replace with AMFI TER data.
 */
export function defaultTer(category: Pick<Category, 'assetClass' | 'subCategory' | 'instrumentType' | 'isIndex'>, plan: 'direct' | 'regular' | null) {
  const regular = plan === 'regular'
  if (category.instrumentType === 'etf') return 0.15
  if (category.isIndex) return regular ? 0.6 : 0.2
  if (['Overnight', 'Liquid', 'Money Market', 'Arbitrage'].includes(category.subCategory)) return regular ? 0.6 : 0.2
  switch (category.assetClass) {
    case 'equity':
      return regular ? 1.8 : 0.8
    case 'hybrid':
      return regular ? 1.7 : 0.7
    case 'debt':
      return regular ? 0.9 : 0.4
    case 'international':
      return regular ? 1.2 : 0.5
    default:
      return regular ? 1.2 : 0.5
  }
}
