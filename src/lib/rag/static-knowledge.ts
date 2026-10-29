import { sections as aiSections } from '@/lib/content/ai-disclosure'
import { principles as feePrinciples } from '@/lib/content/fees'
import { CALCULATORS } from '@/lib/calculators/registry'
import { consultations, glossary, tiers } from '@/lib/portal/data'
import { FEE_CAP_PER_YEAR } from '@/lib/portal/math'

import type { Chunk } from './bm25'

const pub = (id: string, title: string, url: string, text: string, tags: string[] = []): Chunk => ({ id, title, url, text, scope: 'public', tags })

/**
 * Published knowledge that ships with the code: the glossary, plans and fees, how AI is used, the calculators'
 * methods and how the dashboard works. CMS-owned content (FAQs, SEBI disclosure, Port Scan wording) is added in
 * knowledge.ts. Everything here is also visible on a page, so every answer can point to where it came from.
 */
export function staticChunks(): Chunk[] {
  const out: Chunk[] = []

  for (const [term, def] of glossary) out.push(pub(`glossary:${term}`, term, '/dashboard/learn', `${term}: ${def}`))

  for (const t of tiers)
    out.push(
      pub(
        `plan:${t.id}`,
        `${t.name} plan`,
        '/fees',
        `The ${t.name} plan costs ${t.price}${t.unit ? ` ${t.unit}` : ''}. It is for: ${t.forWho}. It includes: ${t.includes.join('; ')}.`,
        ['price', 'subscription', 'plan', 'fee'],
      ),
    )
  out.push(
    pub(
      'plans:cap',
      'Fee cap',
      '/fees',
      `Fees are flat and published. SEBI caps a fixed advisory fee at ₹${(FEE_CAP_PER_YEAR / 100_000).toFixed(2)} lakh per family per year, and every WisBees plan sits well under it. The Port Scan and calculators are free.`,
      ['cap', 'limit', 'sebi'],
    ),
  )
  for (const [t, d] of feePrinciples) out.push(pub(`fees:${t}`, t, '/fees', `${t}. ${d}`, ['fee', 'charge']))

  for (const s of aiSections) out.push(pub(`ai:${s.title}`, `How we use AI: ${s.title}`, '/ai-disclosure', `${s.title}. ${s.items.join(' ')}`, ['ai', 'copilot', 'data']))

  for (const c of CALCULATORS)
    out.push(pub(`calc:${c.slug}`, c.name, `/tools/${c.slug}`, `${c.name}. ${c.summary} ${c.method.intro} Formulas: ${c.method.formulas.join('; ')}.`, ['calculator', 'formula', 'method']))

  out.push(
    pub('consult', 'Conversations with your adviser', '/dashboard/talk', `You can book: ${consultations.map((c) => `${c.type} (${c.note})`).join('; ')}.`, ['call', 'book', 'adviser', 'consultation']),
    pub(
      'rule:non-discretionary',
      'You stay in charge',
      '/dashboard/todo',
      'WisBees is a non-discretionary adviser. Software calculates and recommends, and prepares orders; you approve and place them in your own demat or mutual fund account. WisBees never holds your money or moves it on its own, so "automated" means automatic preparation with one-tap approval.',
      ['approve', 'order', 'discretion', 'automatic', 'control'],
    ),
    pub('rule:direct', 'Direct plans, no commissions', '/fees', 'WisBees recommends direct plans only and takes no commission or trail from any product, so advice is not tied to what you buy.', ['commission', 'direct', 'regular', 'trail']),
    pub(
      'rule:data',
      'Your data and consent',
      '/dashboard/privacy',
      'Your data is stored in India and encrypted. Each data source has its own consent that you can withdraw, you can download everything we hold, and you can delete your portfolios, goals and answers. Complaints and the log of AI answers are kept as compliance records. One client’s data never answers another client’s question.',
      ['privacy', 'consent', 'delete', 'download', 'safe'],
    ),
    pub(
      'rule:complaint',
      'How to make a complaint',
      '/dashboard/help',
      'Use Help and Complaints in the dashboard. You get a ticket number such as WB-12 and can track it there. We follow the SEBI complaint process, and you can also write to SEBI through the SCORES portal. Officers and escalation steps are on the SEBI disclosure page.',
      ['grievance', 'ticket', 'escalate', 'scores'],
    ),
    pub(
      'rule:score',
      'How the Port Scan health score works',
      '/portfolio-scan',
      'The health score is 0 to 100. It averages five parts: diversification, concentration, risk, asset mix and cost. A serious red flag caps it, and low data coverage makes it a range. It is calculated by tested software from the holdings you add; the Copilot only explains it.',
      ['score', 'health', 'rating', 'port scan'],
    ),
    pub(
      'rule:goals',
      'How goal projections work',
      '/dashboard/goals',
      'A goal needs an amount, a year, what you have saved and what you invest each month. We assume your investments grow about 10% a year, compounded monthly, with each instalment invested at the start of the month. That is an assumption to plan with, not a promise. If you are behind, we show the extra monthly amount that closes the gap, rounded up to the next ₹100. A step-up, raising the monthly amount each year, can close a gap too.',
      ['goal', 'projection', 'assumption', 'step-up', 'track'],
    ),
    pub(
      'rule:rebalance',
      'Bringing your mix back to plan',
      '/dashboard/invest',
      'Your risk profile sets the most you should hold in shares. When shares grow past that limit by more than 3 points, a suggestion appears in To Do with the amount to move. You approve it, and your adviser prepares the order for your own account. Selling may have tax, which your adviser estimates first.',
      ['rebalance', 'drift', 'limit', 'shares', 'equity'],
    ),
    pub(
      'rule:harvest',
      'Saving tax on a loss',
      '/dashboard/tax',
      'Tax-loss harvesting means selling an investment that is worth less than you paid so the loss can cancel gains from other sales, then moving into a similar investment so you stay invested. The saving depends on your gains and the rules at the time, so our CA team checks the rules and you approve every sale. The last day to book losses for the tax year is 31 March.',
      ['tax', 'loss', 'harvest', 'gain', 'march'],
    ),
    pub(
      'rule:sif',
      'Specialised investment funds (SIFs)',
      '/dashboard/invest',
      'A SIF is an advanced fund type with a ₹10 lakh minimum across all strategies of a fund house per investor, and it can take short positions, so risk is higher. At WisBees it is part of the Private plan and needs a suitability check: net worth, the ₹10 lakh minimum and understanding of long-short risk. Your adviser recommends; you invest directly.',
      ['sif', 'specialised', 'long-short', 'minimum'],
    ),
    pub('rule:commodity', 'Gold and silver ETFs', '/dashboard/invest', 'Gold and silver ETFs can be a small diversifier inside a goal, sized by your risk profile. At WisBees they are part of the Plus and Private plans. Other commodities are not offered.', ['gold', 'silver', 'commodity', 'etf']),
    pub(
      'rule:link',
      'Getting your holdings into the dashboard',
      '/portfolio-scan',
      'Today your numbers come from what you add in Port Scan: upload a statement (a CAS PDF or a broker file), search and type each holding, or paste from Excel. Re-run it when your holdings change. Automatic linking through Account Aggregator, CAMS and KFintech, and broker accounts is coming.',
      ['upload', 'statement', 'link', 'sync', 'add', 'holdings'],
    ),
  )
  return out
}
