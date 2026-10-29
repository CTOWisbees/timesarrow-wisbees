import type { Goal } from '@/lib/portal/types'

import type { Bm25 } from './bm25'
import { goalFacts } from './facts'
import { lead } from './answer'

export type Coaching = { text: string; sources: { title: string; url: string }[] }

/**
 * The goal coach (AI-07): the same fact text the Copilot uses for this goal, worked out at the monthly amount and
 * growth rate the client is trying, plus the published note on how projections work. The adviser sees the draft on review.
 */
export function coachGoal(goal: Goal, monthly: number, annualReturn: number, knowledge: Bm25): Coaching {
  const f = goalFacts(goal, monthly, annualReturn)
  const note = knowledge.search('how goal projections work close the gap step-up', 1)[0]?.chunk
  const lines = [f.text]
  if (f.status === 'behind' && note) lines.push(`How this is worked out: ${lead(note.text.split('If you are behind')[0], 260)}`)
  return {
    text: lines.join(' '),
    sources: [{ title: `Your goal: ${goal.name}`, url: `/dashboard/goals/${goal.id}` }, ...(note ? [{ title: note.title, url: note.url }] : [])],
  }
}
