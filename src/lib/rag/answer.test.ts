import { describe, expect, it } from 'vitest'

import { buildSample } from '@/lib/portal/data'
import type { PortalData } from '@/lib/portal/types'

import { answerWith } from './answer'
import { Bm25 } from './bm25'
import { hasPromise, isAdviceSeeking, numbersGrounded } from './guard'
import { staticChunks } from './static-knowledge'

const knowledge = new Bm25(staticChunks())
const sample = buildSample()
const ask = (q: string, data: PortalData = sample, generate?: Parameters<typeof answerWith>[0]['generate']) => answerWith({ question: q, data, knowledge, generate })

describe('guardrails: advice, tips and promises go to the adviser', () => {
  const advice = [
    'Should I buy HDFC Bank?',
    'which fund is best for me',
    'recommend a stock for this year',
    'Will the market crash next month?',
    'give me a stock tip',
    'should I sell Infosys now',
    'which stock will double',
    'how much will I make in 5 years',
    'guarantee me 12% returns',
    'when should I buy gold',
    'best mutual fund to invest in',
    'shall I invest in a small cap fund',
    'any multibagger shares',
    'will nifty go up tomorrow',
    'top funds right now',
  ]
  it.each(advice)('hands over: %s', async (q) => {
    const a = await ask(q)
    expect(a.intent).toBe('advice')
    expect(a.handedOver).toBe(true)
    expect(a.actions[0][1]).toBe('/dashboard/talk')
  })
  it('does not treat explanations as advice', () => {
    for (const q of ['what is a SIP', 'how does rebalancing work', 'what do you charge', 'what is tax-loss harvesting']) expect(isAdviceSeeking(q)).toBe(false)
  })
})

describe('questions about the client’s own money are answered from their facts', () => {
  const cases: [string, RegExp, string][] = [
    ['What is my health score?', /78 out of 100/, 'Your health score'],
    ['What do my funds cost me every year?', /₹9,092/, 'What your funds cost'],
    ['How much do I have in Infosys?', /₹1,52,000/, 'Infosys'],
    ['What is my total money?', /₹30,22,000/, 'Your money'],
    ['Is my risk within my comfort?', /up to 65%/, 'Your risk limit'],
    ['What is my biggest holding?', /Parag Parikh Flexi Cap Fund/, 'Your biggest holding'],
    ['Am I on track for retirement?', /Retirement/, 'Your goal: Retirement'],
    ['How is my yearly return versus the benchmark', /11\.2%/, 'Your yearly return'],
    ['What is waiting for my approval?', /waiting for your OK/, 'Waiting for your OK'],
    ['How is my money split between shares and bonds?', /Shares 72%/, 'Your mix'],
  ]
  it.each(cases)('%s', async (q, text, title) => {
    const a = await ask(q)
    expect(a.intent).toBe('answer')
    expect(a.text).toMatch(text)
    expect(a.sources.map((s) => s.title)).toContain(title)
    expect(a.confidence).toBeGreaterThan(0.3)
  })
})

describe('questions about WisBees are answered from published knowledge, with a source', () => {
  const cases: [string, RegExp, string][] = [
    ['What is a SIP?', /fixed amount every month/i, 'SIP'],
    ['How much does the Plus plan cost?', /₹1,999/, 'Plus plan'],
    ['What is the SEBI fee cap?', /₹1\.51 lakh/, 'Fee cap'],
    ['How do you use AI?', /AI/, 'How we use AI: What the AI does not do'],
    ['Do you place orders for me?', /never holds your money/i, 'You stay in charge'],
    ['How do I make a complaint?', /ticket/i, 'How to make a complaint'],
    ['What is tax loss harvesting?', /selling an investment/i, 'Saving tax on a loss'],
    ['What is the last day to book losses for the tax year?', /31 March/, 'Saving tax on a loss'],
    ['What is a SIF and what is the minimum?', /₹10 lakh/, 'Specialised investment funds (SIFs)'],
    ['Where is my data stored?', /India/, 'Your data and consent'],
    ['How is the step up SIP calculated?', /step-up/i, 'Step-up SIP Calculator'],
    ['Do you charge commission?', /commission/i, 'Direct plans, no commissions'],
    ['How do the goal projections work?', /10%/, 'How goal projections work'],
  ]
  it.each(cases)('%s', async (q, text, title) => {
    const a = await ask(q)
    expect(a.intent).toBe('answer')
    expect(a.text).toMatch(text)
    expect(a.sources.map((s) => s.title)).toContain(title)
  })
})

describe('behaviour at the edges', () => {
  it('says so when it has nothing to go on, instead of guessing', async () => {
    for (const q of ['quantum chromodynamics of flamingos', 'zzzz qqqq', 'what is the weather in Pune']) {
      const a = await ask(q)
      expect(a.intent).toBe('low-confidence')
      expect(a.handedOver).toBe(true)
    }
  })

  it('does not answer personal questions for someone with no holdings', async () => {
    const empty: PortalData = { ...sample, sample: false, hasPortfolio: false, holdings: [], goals: [], todos: [], alerts: [], score: null, mix: [] }
    const a = await ask('What do my funds cost?', empty)
    expect(a.intent).toBe('no-data')
    expect(a.actions[0][1]).toBe('/portfolio-scan')
  })

  it('never uses another client’s facts: the facts come only from the data passed in', async () => {
    const other: PortalData = { ...sample, holdings: [{ name: 'Zeta Corp', kind: 'Stock', value: 5_000, weight: 100, gainPct: 1 }], biggest: [{ name: 'Zeta Corp', share: 100, kind: 'Stock' }] }
    const a = await ask('What is my biggest holding?', other)
    expect(a.text).toContain('Zeta Corp')
    expect(a.text).not.toContain('Parag Parikh')
  })

  it('answers small talk without retrieval', async () => {
    expect((await ask('hello')).intent).toBe('smalltalk')
  })

  it('uses a model’s wording only when every number is in the sources', async () => {
    const grounded = await ask('What is my health score?', sample, async () => 'Your score is 78 out of 100 [1].')
    expect(grounded.mode).toBe('llm')
    expect(grounded.text).toBe('Your score is 78 out of 100.')

    const invented = await ask('What is my health score?', sample, async () => 'Your score is 91 out of 100.')
    expect(invented.mode).toBe('extractive')
    expect(invented.text).toMatch(/78 out of 100/)

    const promised = await ask('What is my health score?', sample, async () => 'Your score is 78 and returns are guaranteed.')
    expect(promised.mode).toBe('extractive')
  })

  it('falls back when the model is unavailable', async () => {
    const a = await ask('What is my health score?', sample, async () => null)
    expect(a.mode).toBe('extractive')
  })
})

describe('output checks', () => {
  it('finds promises', () => {
    expect(hasPromise('Returns are guaranteed')).toBe(true)
    expect(hasPromise('This is a risk-free plan')).toBe(true)
    expect(hasPromise('Your score is 78')).toBe(false)
  })
  it('checks numbers against the context', () => {
    expect(numbersGrounded('You hold ₹10,26,136 across 6 holdings', 'worth ₹10,26,136 in total')).toBe(true)
    expect(numbersGrounded('You hold ₹99,999', 'worth ₹10,26,136')).toBe(false)
  })
})
