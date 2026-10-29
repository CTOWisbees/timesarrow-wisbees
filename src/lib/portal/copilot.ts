import { ASSUMED_RETURN, NOW_YEAR } from './data'
import { projectGoal } from './math'
import type { PortalData } from './types'

/** Bump when the answer rules change, so a logged answer says which rules wrote it. */
export const COPILOT_VERSION = 'rules-1'

export type CopilotAnswer = { text: string; actions: [string, string][]; intent: string; handedOver: boolean }

const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`
const pct = (n: number) => `${n.toFixed(n >= 10 ? 0 : 1)}%`

function lakh(n: number) {
  const trim = (x: number) => x.toFixed(2).replace(/\.?0+$/, '')
  return n >= 10_000_000 ? `₹${trim(n / 10_000_000)} crore` : n >= 100_000 ? `₹${trim(n / 100_000)} lakh` : rupees(n)
}

const ADVICE = /\b(should i|shall i|buy|sell|invest in|which (stock|fund|share)|best (stock|fund)|recommend|tip|will .* (go up|rise|fall)|guarantee|how much will i make)\b/i

const HANDOVER: CopilotAnswer = {
  text: 'That sounds like a question for your adviser, who can look at your whole situation. I only explain your own numbers and cannot tell you what to buy or sell. Want to ask them?',
  actions: [['Ask my adviser', '/dashboard/talk']],
  intent: 'advice',
  handedOver: true,
}

/**
 * Answers a question from the client's own stored numbers. Nothing here is generated freely:
 * each branch reads figures the dashboard already shows, so an answer can be checked against
 * the screen. Anything that asks for advice, or that the numbers cannot answer, goes to the adviser.
 */
export function answerQuestion(question: string, d: PortalData): CopilotAnswer {
  const q = question.toLowerCase()
  if (ADVICE.test(q)) return HANDOVER
  if (!d.hasPortfolio)
    return {
      text: 'I do not have any holdings of yours yet, so I have nothing to explain. Run a Port Scan with what you hold and I can read it back to you in plain words.',
      actions: [['Add my holdings', '/portfolio-scan']],
      intent: 'no-data',
      handedOver: false,
    }

  const named = d.holdings.find((h) => h.name.length > 3 && q.includes(h.name.toLowerCase().split(' ')[0]) && h.name.toLowerCase().split(' ')[0].length > 3)
  if (named)
    return {
      text: `${named.name} is worth ${rupees(named.value)}, about ${pct(named.weight)} of your money${named.gainPct === null ? '' : `, ${named.gainPct >= 0 ? 'up' : 'down'} ${pct(Math.abs(named.gainPct))} against what you paid`}.`,
      actions: [['See my money', '/dashboard/money']],
      intent: 'holding',
      handedOver: false,
    }

  if (/score|health/.test(q) && d.score)
    return {
      text: `Your portfolio health score is ${d.score.value} out of 100${d.score.label ? ` (${d.score.label})` : ''}. ${d.score.weakest ? `The part holding it back most is "${d.score.weakest}".` : ''} ${d.flagCount ? `${d.flagCount} ${d.flagCount === 1 ? 'thing' : 'things'} stand out in your Port Scan.` : ''}`.trim(),
      actions: [['See my Port Scan', '/portfolio']],
      intent: 'score',
      handedOver: false,
    }

  if (/fee|cost|charge|expens/.test(q))
    return {
      text:
        d.fees.yearly === null
          ? 'I could not work out your fund costs from what you entered. Funds with a known yearly fee are needed for that.'
          : `Your funds cost about ${rupees(d.fees.yearly)} a year in fees${d.fees.weightedTer !== null ? ` (an average of ${d.fees.weightedTer.toFixed(2)}% a year)` : ''}.${d.fees.regularShare ? ` About ${pct(d.fees.regularShare * 100)} of your fund money is in regular plans, which cost more than direct plans.` : ''}`,
      actions: [['See costs', '/dashboard/money']],
      intent: 'fees',
      handedOver: false,
    }

  if (/risk|safe|volatil|ups and downs/.test(q))
    return {
      text:
        d.volatility === null
          ? 'There is not enough price history for what you hold to measure how much it moves.'
          : `Over the last year your portfolio has moved ${{ low: 'less than', moderate: 'about as much as', high: 'more than', very_high: 'much more than' }[d.volatility]} ${d.benchmarkName ?? 'the market'}. Your risk profile${d.risk.category ? ` (${d.risk.category})` : ''} allows ${d.risk.equityLimit ? `up to ${d.risk.equityLimit}% in shares; you hold ${d.mix.find((m) => m.label === 'Shares')?.now ?? 0}%` : 'a mix set with your adviser'}.`,
      actions: [['See my mix', '/dashboard/money']],
      intent: 'risk',
      handedOver: false,
    }

  if (/goal|retire|college|home|track|save/.test(q)) {
    if (!d.goals.length)
      return { text: 'You have not set any goals yet. Add one and I can tell you whether you are on track.', actions: [['Add a goal', '/dashboard/goals']], intent: 'goals', handedOver: false }
    const lines = d.goals.map((g) => {
      const p = projectGoal({ saved: g.saved, monthly: g.monthly, annualReturn: ASSUMED_RETURN, years: Math.max(0, g.year - NOW_YEAR) }).value
      return `${g.name}: ${lakh(p)} by ${g.year} against a goal of ${lakh(g.target)}, so ${p >= g.target ? 'on track' : 'a little behind'}`
    })
    return {
      text: `Assuming your investments grow about ${ASSUMED_RETURN * 100}% a year (an assumption, not a promise): ${lines.join('; ')}.`,
      actions: [['See my goals', '/dashboard/goals']],
      intent: 'goals',
      handedOver: false,
    }
  }

  if (/fund|explain|own|hold|have/.test(q)) {
    const kinds = new Map<string, number>()
    d.holdings.forEach((h) => kinds.set(h.kind, (kinds.get(h.kind) ?? 0) + 1))
    return {
      text: `You hold ${d.holdings.length} ${d.holdings.length === 1 ? 'thing' : 'things'} worth ${lakh(d.total)} in total: ${[...kinds].map(([k, n]) => `${n} ${k.toLowerCase()}${n === 1 ? '' : 's'}`).join(', ')}. Your biggest is ${d.biggest[0]?.name ?? 'not known'} at ${d.biggest[0] ? pct(d.biggest[0].share) : '0%'} of your money.`,
      actions: [['See my money', '/dashboard/money']],
      intent: 'holdings',
      handedOver: false,
    }
  }

  return {
    text: 'I can help best with questions about your own money, such as your score, costs, risk, goals or a holding. For anything else, your adviser is the right person. Want me to send them your question?',
    actions: [['Ask my adviser', '/dashboard/talk']],
    intent: 'other',
    handedOver: true,
  }
}
