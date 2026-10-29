/**
 * Example family shown in the client dashboard until real accounts are linked (holdings sync,
 * Account Aggregator, broker links). Everything here is sample data and is labelled as such
 * on screen. Pure figures (projections, drift, stress) come from ./math, never from the AI.
 */

export type Holding = { name: string; kind: string; asset: 'Shares' | 'Bonds' | 'Gold' | 'Cash'; value: number; gainPct: number }

export const holdings: Holding[] = [
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

export const totalValue = holdings.reduce((s, h) => s + h.value, 0)

export const ASSET_COLOURS = { Shares: '#0e6b4e', Bonds: '#245a9e', Gold: '#c98a12', Cash: '#8a97a0' } as const

/** Share of the total in each class now, against the plan chosen at the risk quiz. */
export const mixPlan: Record<keyof typeof ASSET_COLOURS, number> = { Shares: 65, Bonds: 20, Gold: 5, Cash: 10 }

export const assetValue = (asset: Holding['asset']) => holdings.filter((h) => h.asset === asset).reduce((s, h) => s + h.value, 0)

export const mix = (Object.keys(ASSET_COLOURS) as (keyof typeof ASSET_COLOURS)[]).map((label) => ({
  label,
  now: Math.round((assetValue(label) / totalValue) * 100),
  plan: mixPlan[label],
  colour: ASSET_COLOURS[label],
}))

export const trend = [24.5, 25.2, 24.8, 26.0, 27.1, 26.6, 27.9, 28.8, 28.4, 29.5, 30.1, 30.22]
export const trendMonths = ['Nov', '', 'Jan', '', 'Mar', '', 'May', '', 'Jul', '', 'Sep', 'Oct']

export const markets = [
  { name: 'Nifty 50', value: '24,310', change: '+0.4%', up: true },
  { name: 'Sensex', value: '80,120', change: '+0.3%', up: true },
  { name: 'Gold (10 g)', value: '₹1,28,400', change: '−0.2%', up: false },
  { name: 'Silver (1 kg)', value: '₹1,62,000', change: '+0.6%', up: true },
  { name: 'USD/INR', value: '₹86.20', change: '−0.1%', up: false },
]

export type Goal = { id: string; name: string; emoji: string; target: number; year: number; saved: number; monthly: number }

export const NOW_YEAR = 2026
export const ASSUMED_RETURN = 0.1

export const goals: Goal[] = [
  { id: 'retirement', name: 'Retirement', emoji: '🌴', target: 31_000_000, year: 2046, saved: 1_250_000, monthly: 30_000 },
  { id: 'college', name: "Aarav's college", emoji: '🎓', target: 4_500_000, year: 2036, saved: 580_000, monthly: 12_000 },
  { id: 'home', name: 'Home down payment', emoji: '🏠', target: 1_700_000, year: 2029, saved: 640_000, monthly: 21_000 },
  { id: 'emergency', name: 'Emergency fund', emoji: '🛟', target: 360_000, year: 2027, saved: 310_000, monthly: 5_000 },
]

export type Todo = {
  id: string
  kind: string
  icon: 'invest' | 'tax' | 'goal'
  title: string
  why: string
  details: [string, string][]
  risk: string
}

export const todos: Todo[] = [
  {
    id: 'rebalance',
    kind: 'Bring back to plan',
    icon: 'invest',
    title: 'Shares are 72% of your money. Your plan says 65%.',
    why: 'Shares have grown faster than the rest, so your plan now carries more risk than you chose. Moving a small part back keeps you in your comfort zone.',
    details: [['Move', '₹1,20,000'], ['From', 'Shares'], ['To', 'Bonds'], ['Takes', '1 business day']],
    risk: 'Selling funds may have tax. Estimated tax on this move: ₹0 (gains are within the yearly free limit).',
  },
  {
    id: 'harvest',
    kind: 'Save tax on a loss',
    icon: 'tax',
    title: 'Sell Mirae Asset Large & Midcap and move into a similar fund.',
    why: 'This fund is down ₹38,000 since you bought it. Selling it can cancel that loss against gains elsewhere and may lower your tax. Your money goes into a similar fund so you stay invested.',
    details: [['Loss you book', '₹38,000'], ['Tax you may save', 'about ₹4,750'], ['New fund', 'UTI Large & Midcap'], ['Rules checked by', 'Our CA team']],
    risk: 'Tax rules can change and savings are only an estimate. Your own tax advisor should confirm.',
  },
  {
    id: 'sip',
    kind: 'Raise your monthly SIP',
    icon: 'goal',
    title: "Add ₹2,400 a month to Aarav's college.",
    why: 'You are slightly behind on this goal. This small step puts you back on track for 2036.',
    details: [['Now', '₹12,000 a month'], ['New', '₹14,400 a month'], ['Starts', '5 Dec'], ['You can stop', 'Any time']],
    risk: 'Market ups and downs may still change the final amount.',
  },
]

export const fundCosts = [
  { fund: 'Parag Parikh Flexi Cap', ratio: 0.63, rupees: 4_045 },
  { fund: 'HDFC Nifty 50 Index', ratio: 0.2, rupees: 1_020 },
  { fund: 'Mirae Asset Large & Midcap', ratio: 0.62, rupees: 2_697 },
  { fund: 'ICICI Pru Corporate Bond', ratio: 0.35, rupees: 1_330 },
]

export const overlap = [
  { name: 'HDFC Bank', where: '3 holdings', share: 10, flag: true },
  { name: 'ICICI Bank', where: '3 holdings', share: 8, flag: true },
  { name: 'Infosys', where: '2 holdings', share: 5, flag: false },
  { name: 'Reliance', where: '2 holdings', share: 4, flag: false },
]

export const orders = [
  { title: 'SIP: Parag Parikh Flexi Cap', meta: '5 Oct · ₹20,000', done: true },
  { title: 'SIP: HDFC Nifty 50 Index', meta: '5 Oct · ₹18,000', done: true },
  { title: 'Bring back to plan', meta: 'Waiting for your OK', done: false },
  { title: 'Save tax on a loss', meta: 'Waiting for your OK', done: false },
]

export const calendarEvents: Record<number, { label: string; tone: string }> = {
  5: { label: 'SIP ₹68,000', tone: '#0e6b4e' },
  12: { label: 'Adviser call', tone: '#245a9e' },
  20: { label: 'Tax webinar', tone: '#c98a12' },
  28: { label: 'Review due', tone: '#8a97a0' },
}

export const documents = [
  { name: 'Advisory agreement (signed)', date: '12 Jan', type: 'PDF' },
  { name: 'Risk and suitability report', date: '12 Jan', type: 'PDF' },
  { name: 'Your plan: reasons for each fund', date: 'Today', type: 'PDF' },
  { name: 'Call summary, portfolio review', date: '15 Aug', type: 'PDF' },
  { name: 'Capital gains report 2025-26', date: 'Apr', type: 'PDF' },
  { name: 'Invoices', date: 'Monthly', type: 'PDF' },
  { name: 'Nominee details', date: '12 Jan', type: 'PDF' },
]

export const family = [
  { name: 'Meera Sharma', role: 'You', total: 3_022_000, shared: true },
  { name: 'Rohan Sharma', role: 'Spouse', total: 1_860_000, shared: true },
  { name: 'Suresh Sharma', role: 'Father', total: 4_200_000, shared: false },
]

export const alerts = [
  { tone: 'warn', title: 'Shares are above plan', body: 'Your shares are 72% of your money, plan is 65%.', when: 'Today', href: '/dashboard/todo' },
  { tone: 'info', title: 'SIP due soon', body: '₹68,000 goes out on 5 Nov.', when: '2 days', href: '/dashboard/invest' },
  { tone: 'warn', title: 'College goal a little behind', body: 'Add ₹2,400 a month to get back on track.', when: 'Yesterday', href: '/dashboard/goals/college' },
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

export const learnItems = [
  { title: 'Weekly market note', body: 'What moved markets, in 5 lines', tag: 'Today' },
  { title: 'Our stock research', body: 'Every view comes with a written reason', tag: 'Add-on' },
  { title: 'Buzz alerts', body: 'Short alerts on stocks you own', tag: 'New' },
  { title: 'WisBees magazine', body: 'Money stories for families', tag: 'Oct issue' },
  { title: 'Events and webinars', body: 'Next: tax planning, 20 Nov', tag: 'Free' },
  { title: 'Calculators', body: 'SIP, step-up SIP, lumpsum, SWP and EMI', tag: 'Open' },
]

export const glossary = [
  ['SIP', 'Investing a fixed amount every month.'],
  ['Bring back to plan (rebalancing)', 'Moving a little money between investments so your mix matches your plan again.'],
  ['Save tax on losses (tax-loss harvesting)', 'Selling an investment that is down to cancel gains and lower your tax, then staying invested in something similar.'],
  ['Yearly return (XIRR)', 'How fast your money grew each year, counting when you put money in.'],
  ['Direct plan', 'A fund version with no agent commission, so it costs you less.'],
  ['SIF', 'A newer, advanced fund that can also profit from falling prices. Higher risk.'],
] as const

export const connections = [
  { name: 'Bank accounts', via: 'Account Aggregator', until: 'Until 14 Jan 2027', on: true },
  { name: 'Mutual funds', via: 'CAMS and KFintech', until: 'Until further notice', on: true },
  { name: 'Stocks', via: 'Broker link', until: 'Until 02 Mar 2027', on: true },
  { name: 'WhatsApp alerts', via: 'Messages to your registered number', until: 'Until you stop', on: false },
]

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

export const invoices = [
  { month: 'Oct 2026', amount: 1_999 },
  { month: 'Sep 2026', amount: 1_999 },
  { month: 'Aug 2026', amount: 1_999 },
]
