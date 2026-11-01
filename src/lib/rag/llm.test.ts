import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import type { Hit } from './bm25'
import { generate, llmEnabled } from './llm'

const hits: Hit[] = [{ chunk: { id: 'a', title: 'Fees', url: '/fees', text: 'You pay ₹1,999 a month.', scope: 'public' }, score: 5 }]

describe('the optional language model step', () => {
  beforeEach(() => vi.stubEnv('ANTHROPIC_API_KEY', ''))
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('is off without a key, and sends nothing anywhere', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    expect(llmEnabled()).toBe(false)
    expect(await generate('what do you charge', hits)).toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('sends only the question and the retrieved sources, and returns the text', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key')
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ content: [{ type: 'text', text: ' You pay ₹1,999 a month [1]. ' }] }) })
    vi.stubGlobal('fetch', fetchSpy)
    expect(await generate('what do you charge', hits)).toBe('You pay ₹1,999 a month [1].')
    const body = JSON.parse(fetchSpy.mock.calls[0][1].body)
    expect(body.messages[0].content).toContain('[1] Fees: You pay ₹1,999 a month.')
    expect(body.system).toMatch(/never give advice/i)
  })

  it('returns null on an error response, a network failure or an empty reply, so the extractive answer is used', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }))
    expect(await generate('q', hits)).toBeNull()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))
    expect(await generate('q', hits)).toBeNull()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ content: [] }) }))
    expect(await generate('q', hits)).toBeNull()
  })
})
