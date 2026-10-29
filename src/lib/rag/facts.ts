import { ASSUMED_RETURN, NOW_YEAR } from '@/lib/portal/data'
import { extraMonthlyNeeded, goalStatus, projectGoal } from '@/lib/portal/math'
import type { Goal, PortalData } from '@/lib/portal/types'

import type { Chunk } from './bm25'

export type Fact = Chunk & { scope: 'client'; /** Lower is more important; used to order the daily brief. */ priority: number; brief?: boolean }

const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`
const day = (iso: string) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(iso))
const pct = (n: number) => `${n.toFixed(1).replace(/\.0$/, '')}%`
const lakh = (n: number) => {
  const trim = (x: number) => x.toFixed(2).replace(/\.?0+$/, '')
  return n >= 10_000_000 ? `₹${trim(n / 10_000_000)} crore` : n >= 100_000 ? `₹${trim(n / 100_000)} lakh` : rupees(n)
}

const fact = (id: string, title: string, url: string, text: string, priority: number, opts: { tags?: string[]; brief?: boolean } = {}): Fact => ({
  id,
  title,
  url,
  text,
  scope: 'client',
  priority,
  tags: opts.tags,
  brief: opts.brief,
})

export function goalFacts(g: Goal, monthly = g.monthly, annualReturn = ASSUMED_RETURN): { projected: number; status: 'on' | 'behind'; extra: number; text: string } {
  const years = Math.max(0, g.year - NOW_YEAR)
  const args = { saved: g.saved, monthly, annualReturn, years }
  const projected = projectGoal(args).value
  const status = goalStatus(projected, g.target)
  const extra = extraMonthlyNeeded({ target: g.target, ...args })
  const text =
    `Your goal "${g.name}" needs ${lakh(g.target)} by ${g.year}. You have ${lakh(g.saved)} saved and invest ${rupees(monthly)} a month. ` +
    `Assuming about ${Math.round(annualReturn * 100)}% growth a year (an assumption, not a promise), you could reach ${lakh(projected)}, so you are ${status === 'on' ? 'on track' : `a little behind by ${lakh(g.target - projected)}`}.` +
    (extra > 0 ? ` Adding ${rupees(extra)} a month would close the gap.` : '')
  return { projected, status, extra, text }
}

/**
 * The client's own numbers as sentences, one fact per idea. Built per request from that client's data only,
 * so a question can never be answered from another client's facts. Each fact names the screen that shows it.
 */
export function buildFacts(d: PortalData): Fact[] {
  const out: Fact[] = []

  if (!d.hasPortfolio) {
    out.push(fact('none', 'Your holdings', '/portfolio-scan', 'You have not added any holdings yet, so there is nothing of yours to explain. Run a Port Scan with what you hold to see your money, risk, costs and suggestions.', 1, { tags: ['holdings', 'my'], brief: true }))
  } else {
    const shares = d.mix.find((m) => m.label === 'Shares')
    out.push(fact('overview', 'Your money', '/dashboard/money', `You hold ${d.holdings.length} ${d.holdings.length === 1 ? 'investment' : 'investments'} worth ${rupees(d.total)} in total${d.asOf ? `, as of ${day(d.asOf)}` : ''}.`, 5, { tags: ['total', 'net worth', 'how much', 'my money'], brief: true }))
    out.push(fact('mix', 'Your mix', '/dashboard/money', `Your money by type: ${d.mix.map((m) => `${m.label} ${m.now}%`).join(', ')}.`, 6, { tags: ['allocation', 'mix', 'split', 'asset'] }))
    if (shares && d.risk.equityLimit !== null)
      out.push(
        fact(
          'limit',
          'Your risk limit',
          '/dashboard/invest',
          `Your risk profile${d.risk.category ? ` (${d.risk.category})` : ''} allows up to ${d.risk.equityLimit}% of your money in shares. You hold ${shares.now}%, so you are ${shares.now > d.risk.equityLimit + 3 ? `${shares.now - d.risk.equityLimit} points past it` : 'inside it'}.`,
          shares.now > d.risk.equityLimit + 3 ? 1 : 8,
          { tags: ['risk', 'comfort', 'limit', 'shares', 'equity', 'rebalance'], brief: shares.now > d.risk.equityLimit + 3 },
        ),
      )
    else if (shares) out.push(fact('shares', 'Your shares', '/dashboard/money', `Shares are ${shares.now}% of your money.`, 7, { tags: ['shares', 'equity'], brief: true }))

    for (const h of d.holdings)
      out.push(
        fact(
          `hold:${h.name}`,
          h.name,
          '/dashboard/money',
          `${h.name} (${h.kind.toLowerCase()}) is worth ${rupees(h.value)}, ${pct(h.weight)} of your money${h.gainPct === null ? '' : `, ${h.gainPct >= 0 ? 'up' : 'down'} ${pct(Math.abs(h.gainPct))} against what you paid`}.`,
          20,
          { tags: ['holding', 'own', 'have', h.kind] },
        ),
      )

    const top = d.biggest[0]
    if (top) out.push(fact('top', 'Your biggest holding', '/dashboard/money', `Your biggest holding is ${top.name} at ${pct(top.share)} of your money${top.share >= 20 ? ', which is a lot in one place' : ''}.`, top.share >= 20 ? 2 : 9, { tags: ['biggest', 'largest', 'concentration', 'top'], brief: top.share >= 10 }))

    if (d.fees.yearly !== null)
      out.push(
        fact(
          'fees',
          'What your funds cost',
          '/dashboard/money',
          `Your funds cost about ${rupees(d.fees.yearly)} a year in fees${d.fees.weightedTer !== null ? `, an average of ${d.fees.weightedTer.toFixed(2)}% of your fund money` : ''}.${d.fees.regularShare ? ` About ${pct(d.fees.regularShare * 100)} of your fund money is in regular plans, which pay a distributor commission and cost more than direct plans.` : ' None of it is in regular plans.'}`,
          d.fees.regularShare ? 3 : 10,
          { tags: ['fee', 'cost', 'charge', 'expense', 'ter', 'regular', 'direct'], brief: true },
        ),
      )
    else out.push(fact('fees', 'What your funds cost', '/dashboard/money', 'Fund fees could not be worked out from what you added, because they need funds picked from the Port Scan search so their published yearly cost can be read.', 12, { tags: ['fee', 'cost'] }))

    if (d.volatility)
      out.push(
        fact(
          'risk',
          'How much your money moves',
          '/dashboard/money',
          `Over the last year your portfolio moved ${{ low: 'less than', moderate: 'about as much as', high: 'more than', very_high: 'much more than' }[d.volatility]} ${d.benchmarkName ?? 'the market'}. Its risk level is ${{ low: 'low', moderate: 'medium', high: 'high', very_high: 'very high' }[d.volatility]}.`,
          11,
          { tags: ['risk', 'volatility', 'safe', 'ups and downs', 'riskometer'] },
        ),
      )
    if (d.yearlyReturn !== null)
      out.push(
        fact(
          'return',
          'Your yearly return',
          '/dashboard/money',
          `Your portfolio has returned about ${pct(d.yearlyReturn * 100)} a year${d.benchmarkReturn !== null ? `, against ${pct(d.benchmarkReturn * 100)} for ${d.benchmarkName}` : ''}. Past returns do not predict future returns.`,
          13,
          { tags: ['return', 'performance', 'xirr', 'growth', 'gain', 'doing'] },
        ),
      )
    if (d.score)
      out.push(
        fact(
          'score',
          'Your health score',
          '/dashboard',
          `Your portfolio health score is ${d.score.value} out of 100${d.score.label ? ` (${d.score.label})` : ''}.${d.score.weakest ? ` The part holding it back most is "${d.score.weakest}".` : ''}${d.flagCount ? ` ${d.flagCount} ${d.flagCount === 1 ? 'thing stands' : 'things stand'} out in your Port Scan.` : ''}`,
          4,
          { tags: ['score', 'health', 'rating', 'how am i doing'], brief: true },
        ),
      )
    if (d.losses.length)
      out.push(
        fact(
          'losses',
          'Holdings below what you paid',
          '/dashboard/tax',
          `${d.losses.length} ${d.losses.length === 1 ? 'holding is' : 'holdings are'} worth less than you paid: ${d.losses.map((l) => `${l.name} (down ${rupees(l.loss)})`).join(', ')}. Booking a loss can lower your tax; see Save Tax.`,
          3,
          { tags: ['loss', 'tax', 'harvest', 'down', 'below'], brief: true },
        ),
      )
  }

  for (const g of d.goals) {
    const f = goalFacts(g)
    out.push(fact(`goal:${g.id}`, `Your goal: ${g.name}`, `/dashboard/goals/${g.id}`, f.text, f.status === 'behind' ? 2 : 14, { tags: ['goal', 'track', 'retire', 'save', g.name], brief: f.status === 'behind' }))
  }
  if (!d.goals.length) out.push(fact('nogoal', 'Your goals', '/dashboard/goals', 'You have not set any goals yet. Add one and we can show whether you are on track.', 15, { tags: ['goal', 'track'] }))

  const open = d.todos.filter((t) => !d.decisions[t.id])
  out.push(
    fact(
      'todo',
      'Waiting for your OK',
      '/dashboard/todo',
      open.length ? `${open.length} ${open.length === 1 ? 'suggestion is' : 'suggestions are'} waiting for your OK: ${open.map((t) => t.title).join(' ')}` : 'Nothing is waiting for your OK right now.',
      open.length ? 1 : 16,
      { tags: ['todo', 'action', 'suggestion', 'approve', 'pending', 'waiting'], brief: open.length > 0 },
    ),
  )
  for (const a of d.alerts.slice(0, 4)) out.push(fact(`alert:${a.id}`, a.title, a.href, `${a.title}. ${a.body}`, 17, { tags: ['alert', 'notification', 'changed'] }))
  return out
}
