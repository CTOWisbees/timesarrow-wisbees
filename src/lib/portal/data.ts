import type { AlertRow, Goal, PortalData, Todo } from './types'

/**
 * Example family shown in the client dashboard until real accounts are linked (holdings sync,
 * Account Aggregator, broker links). Everything here is sample data and is labelled as such
 * on screen. Pure figures (projections, drift, stress) come from ./math, never from the AI.
 */

type SampleHolding = { name: string; kind: string; asset: 'Shares' | 'Bonds' | 'Gold' | 'Cash'; value: number; gainPct: number }

const sampleHoldings: SampleHolding[] = [
  { name: 'Parag Parikh Flexi Cap Fund', kind: 'Mutual fund', asset: 'Shares', value: 642_000, gainPct: 12.4 },
  { name: 'HDFC Nifty 50 Index Fund', kind: 'Mutual fund', asset: 'Shares', value: 510_000, gainPct: 11.1 },
  { name: 'Mirae Asset Large & Midcap Fund', kind: 'Mutual fund', asset: 'Shares', value: 435_000, gainPct: -2.1 },
  { name: 'ICICI Prudential Corporate Bond Fund', kind: 'Mutual fund', asset: 'Bonds', value: 380_000, gainPct: 7.2 },
  { name: 'Kotak Gold ETF', kind: 'Gold fund', asset: 'Gold', value: 160_000, gainPct: 14.8 },
  { name: 'HDFC Bank', kind: 'Stock', asset: 'Shares', value: 245_000, gainPct: 6.3 },
  { name: 'ICICI Bank', kind: 'Stock', asset: 'Shares', value: 188_000, gainPct: 9.8 },
  { name: 'Infosys', kind: 'Stock', asset: 'Shares', value: 152_000, gainPct: -4.5 },
  { name: 'Savings account and FD', kind: 'Bank', asset: 'Cash', value: 310_000, gainPct: 3.4 },
]

const sampleTotal = sampleHoldings.reduce((s, h) => s + h.value, 0)

const ASSET_COLOURS = { Shares: '#0e6b4e', Bonds: '#245a9e', Gold: '#c98a12', Cash: '#8a97a0' } as const

/** Share of the total in each class now, against the plan chosen at the risk quiz. */
const mixPlan: Record<keyof typeof ASSET_COLOURS, number> = { Shares: 65, Bonds: 20, Gold: 5, Cash: 10 }

const assetValue = (asset: SampleHolding['asset']) => sampleHoldings.filter((h) => h.asset === asset).reduce((s, h) => s + h.value, 0)

export const NOW_YEAR = 2026
/** The yearly growth the goal maths assumes, stated wherever a projection is shown. */
export const ASSUMED_RETURN = 0.1

const sampleGoals: Goal[] = [
  { id: 'sample-retirement', name: 'Retirement', emoji: '🌴', target: 31_000_000, year: 2046, saved: 1_250_000, monthly: 30_000 },
  { id: 'sample-college', name: "Aarav's college", emoji: '🎓', target: 4_500_000, year: 2036, saved: 580_000, monthly: 12_000 },
  { id: 'sample-home', name: 'Home down payment', emoji: '🏠', target: 1_700_000, year: 2029, saved: 640_000, monthly: 21_000 },
  { id: 'sample-emergency', name: 'Emergency fund', emoji: '🛟', target: 360_000, year: 2027, saved: 310_000, monthly: 5_000 },
]

const sampleMix = (Object.keys(ASSET_COLOURS) as (keyof typeof ASSET_COLOURS)[]).map((label) => ({
  label,
  now: Math.round((assetValue(label) / sampleTotal) * 100),
  plan: mixPlan[label],
  colour: ASSET_COLOURS[label],
}))

const sampleTodos: Todo[] = [
  {
    id: 'sample-rebalance',
    kind: 'rebalance',
    label: 'Bring back to plan',
    icon: 'invest',
    title: 'Shares are 72% of your money. Your plan says 65%.',
    why: 'Shares have grown faster than the rest, so your plan now carries more risk than you chose. Moving a small part back keeps you in your comfort zone.',
    details: [['Move', '₹1,20,000'], ['From', 'Shares'], ['To', 'Bonds'], ['Takes', '1 business day']],
    risk: 'Selling funds may have tax. Estimated tax on this move: ₹0 (gains are within the yearly free limit).',
  },
  {
    id: 'sample-harvest',
    kind: 'harvest',
    label: 'Save tax on a loss',
    icon: 'tax',
    title: 'Sell Mirae Asset Large & Midcap and move into a similar fund.',
    why: 'This fund is down ₹38,000 since you bought it. Selling it can cancel that loss against gains elsewhere and may lower your tax. Your money goes into a similar fund so you stay invested.',
    details: [['Loss you book', '₹38,000'], ['Tax you may save', 'about ₹4,750'], ['New fund', 'UTI Large & Midcap'], ['Rules checked by', 'Our CA team']],
    risk: 'Tax rules can change and savings are only an estimate. Your own tax advisor should confirm.',
  },
  {
    id: 'sample-sip',
    kind: 'sip',
    label: 'Raise your monthly SIP',
    icon: 'goal',
    title: "Add ₹2,400 a month to Aarav's college.",
    why: 'You are slightly behind on this goal. This small step puts you back on track for 2036.',
    details: [['Now', '₹12,000 a month'], ['New', '₹14,400 a month'], ['Starts', '5 Dec'], ['You can stop', 'Any time']],
    risk: 'Market ups and downs may still change the final amount.',
  },
]

const fundCosts = [
  { fund: 'Parag Parikh Flexi Cap', ratio: 0.63, rupees: 4_045 },
  { fund: 'HDFC Nifty 50 Index', ratio: 0.2, rupees: 1_020 },
  { fund: 'Mirae Asset Large & Midcap', ratio: 0.62, rupees: 2_697 },
  { fund: 'ICICI Pru Corporate Bond', ratio: 0.35, rupees: 1_330 },
]

const sampleAlerts = [
  { tone: 'warn', title: 'Shares are above plan', body: 'Your shares are 72% of your money, plan is 65%.', when: 'Today', href: '/dashboard/todo' },
  { tone: 'info', title: 'SIP due soon', body: '₹68,000 goes out on 5 Nov.', when: '2 days', href: '/dashboard/invest' },
  { tone: 'warn', title: 'College goal a little behind', body: 'Add ₹2,400 a month to get back on track.', when: 'Yesterday', href: '/dashboard/goals' },
  { tone: 'grey', title: 'Call booked', body: '12 Nov, 4:00 pm with Neha Rao.', when: '3 days', href: '/dashboard/talk' },
  { tone: 'info', title: 'Tax deadline', body: '31 March is the last day to book losses this year.', when: '1 week', href: '/dashboard/tax' },
] as const

/** Consultation types from the BRD, with how each is booked. */
export const consultations = [
  { type: 'Portfolio review', note: '45 min · included' },
  { type: 'Goal planning', note: '60 min · included' },
  { type: 'Tax and harvesting review', note: '30 min · 1 yearly' },
  { type: 'Second opinion', note: '30 min · extra fee' },
  { type: 'Quick question', note: 'Chat, reply in 24 hours' },
  { type: 'Make a complaint', note: 'Tracked ticket' },
]

export const glossary = [
  ['SIP', 'Investing a fixed amount every month.'],
  ['Bring back to plan (rebalancing)', 'Moving a little money between investments so your mix matches your plan again.'],
  ['Save tax on losses (tax-loss harvesting)', 'Selling an investment that is down to cancel gains and lower your tax, then staying invested in something similar.'],
  ['Yearly return (XIRR)', 'How fast your money grew each year, counting when you put money in.'],
  ['Direct plan', 'A fund version with no agent commission, so it costs you less.'],
  ['SIF', 'A newer, advanced fund that can also profit from falling prices. Higher risk.'],
] as const

/** Tiers from the BRD (section 5). Prices are hypotheses until approved; they sit well under the ₹1.51 lakh SEBI cap. */
export const tiers = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    unit: '',
    forWho: 'Anyone',
    includes: ['Port Scan and calculators', 'Newsletter', 'One intro call booking'],
  },
  {
    id: 'essentials',
    name: 'Essentials',
    price: '₹499',
    unit: '/month',
    forWho: 'First-time investors',
    includes: ['Risk-mapped model portfolios', 'Goal tracker', 'Rebalancing alerts', 'Copilot answers on your own data'],
  },
  {
    id: 'plus',
    name: 'Plus',
    price: '₹1,999',
    unit: '/month',
    forWho: 'Salaried and business families, ₹5–50 lakh invested',
    includes: ['Everything in Essentials', 'Goal-based plans', 'One-tap automated investing and rebalancing', 'Tax-loss harvesting', '2 adviser calls a year', 'Family view'],
    popular: true,
  },
  {
    id: 'private',
    name: 'Private',
    price: '₹75,000 to ₹1.5 lakh',
    unit: '/year per family',
    forWho: '₹50 lakh and up',
    includes: ['Everything in Plus', 'SIF and commodity ETF advice', 'Quarterly reviews', 'Named adviser', 'CA coordination'],
  },
] as const


const ALERT_TONE = { warn: 'warn', info: 'info', grey: 'grey' } as const

/** The example family as dashboard data. Only used in local demo mode, before a real portfolio exists. */
export function buildSample(): PortalData {
  return {
    sample: true,
    hasPortfolio: true,
    portfolioId: null,
    asOf: '2026-10-24',
    total: sampleTotal,
    holdings: sampleHoldings.map((h) => ({ name: h.name, kind: h.kind, value: h.value, weight: (h.value / sampleTotal) * 100, gainPct: h.gainPct })),
    mix: sampleMix,
    risk: { category: 'Moderate', equityLimit: 65 },
    score: {
      value: 78,
      label: 'Good',
      parts: [
        { label: 'Spread of investments', value: 72 },
        { label: 'Fits your risk comfort', value: 85 },
        { label: 'Low costs', value: 92 },
        { label: 'Goals on track', value: 75 },
      ],
      weakest: 'Spread of investments',
    },
    scoreHistory: [],
    volatility: 'moderate',
    yearlyReturn: 0.112,
    benchmarkReturn: 0.104,
    benchmarkName: 'Nifty 50',
    fees: { yearly: fundCosts.reduce((s, f) => s + f.rupees, 0), weightedTer: 0.45, regularShare: 0 },
    biggest: [...sampleHoldings].sort((a, b) => b.value - a.value).slice(0, 5).map((h) => ({ name: h.name, share: (h.value / sampleTotal) * 100, kind: h.kind })),
    losses: [{ name: 'Mirae Asset Large & Midcap Fund', loss: 38_000, gainPct: -2.1 }],
    flagCount: 2,
    goals: sampleGoals,
    todos: sampleTodos,
    decisions: {},
    alerts: sampleAlerts.map((a, i): AlertRow => ({ id: `sample-${i}`, tone: ALERT_TONE[a.tone], title: a.title, body: a.body, when: a.when, href: a.href })),
    planLabel: 'Example plan',
    bandLabel: 'Good',
  }
}
