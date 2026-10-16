/**
 * Risk-profile scoring. Runs on the server only: applicants never see scores, bands
 * or their category. Questions, answer scores and bands come from the CMS
 * `risk-profile` global (read with overrideAccess, since scores are staff-only fields).
 */

export type RiskAnswer = { id?: string | null; label: string; score?: number | null }
export type RiskQuestion = { key: string; question: string; answers?: RiskAnswer[] | null }
export type RiskBand = { min: number; max: number; category: string; equityLimit?: string | null }

/** What the applicant chose: question key → answer id. */
export type RiskAnswers = Record<string, string>

export type RiskResult = {
  total: number
  category: string
  equityLimit: string
  answers: { questionKey: string; question: string; answer: string; score: number }[]
}

export class RiskScoreError extends Error {}

export function scoreRiskProfile(questions: RiskQuestion[], bands: RiskBand[], chosen: RiskAnswers): RiskResult {
  if (!questions.length) throw new RiskScoreError('The questionnaire has no questions.')

  const keys = new Set(questions.map((q) => q.key))
  const extra = Object.keys(chosen).filter((k) => !keys.has(k))
  if (extra.length) throw new RiskScoreError(`Unknown question: ${extra.join(', ')}`)

  const answers = questions.map((q) => {
    const answerId = chosen[q.key]
    if (!answerId) throw new RiskScoreError(`Missing answer for "${q.key}".`)
    const answer = q.answers?.find((a) => a.id === answerId)
    if (!answer) throw new RiskScoreError(`Unknown answer for "${q.key}".`)
    if (typeof answer.score !== 'number') throw new RiskScoreError(`Answer for "${q.key}" has no score.`)
    return { questionKey: q.key, question: q.question, answer: answer.label, score: answer.score }
  })

  const total = answers.reduce((sum, a) => sum + a.score, 0)
  const band = bands.find((b) => total >= b.min && total <= b.max)
  if (!band) throw new RiskScoreError(`No risk band covers a total of ${total}.`)

  return { total, category: band.category, equityLimit: band.equityLimit ?? '', answers }
}
