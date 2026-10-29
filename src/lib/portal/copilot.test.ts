import { describe, expect, it } from 'vitest'

import { answerQuestion } from './copilot'
import { buildSample } from './data'

const d = buildSample()

describe('answerQuestion', () => {
  it('hands advice-like questions to the adviser', () => {
    for (const q of ['Should I buy HDFC Bank?', 'which fund is best?', 'Will the market fall next week', 'recommend a stock'])
      expect(answerQuestion(q, d)).toMatchObject({ intent: 'advice', handedOver: true })
  })

  it('answers about a named holding from the stored numbers', () => {
    const a = answerQuestion('How much do I have in Infosys?', d)
    expect(a.intent).toBe('holding')
    expect(a.text).toContain('₹1,52,000')
  })

  it('reads the score, costs and goals from the same figures the screens show', () => {
    expect(answerQuestion('What is my health score?', d).text).toContain('78 out of 100')
    expect(answerQuestion('What do my funds cost?', d).text).toContain('₹9,092')
    expect(answerQuestion('Am I on track for my goals?', d).intent).toBe('goals')
  })

  it('does not pretend to know someone with no holdings', () => {
    const none = { ...d, hasPortfolio: false, holdings: [] }
    expect(answerQuestion('how am I doing', none)).toMatchObject({ intent: 'no-data', handedOver: false })
  })

  it('never promises returns', () => {
    for (const q of ['will i make money', 'guarantee my returns'])
      expect(answerQuestion(q, d).text).not.toMatch(/guarantee(d)? (you|that)/i)
  })
})
