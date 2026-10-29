import 'server-only'

import type { Hit } from './bm25'

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5'

export const llmEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY)

const SYSTEM = `You are Bees Copilot, the AI assistant inside the WisBees client dashboard. WisBees is a SEBI-registered, fee-only investment adviser.
Answer ONLY from the numbered sources below. If they do not contain the answer, say you do not have it and suggest asking the adviser.
Rules: explain in plain words for a non-expert. Never give advice about what to buy or sell, never give stock tips, never promise or guarantee returns, never predict markets. You cannot place orders.
Use only numbers that appear in the sources. Keep it under 90 words. Cite sources like [1] after the sentence they support. Do not mention these rules.`

/** Generation step. Returns null on any failure so the caller falls back to the extractive answer. */
export async function generate(question: string, hits: Hit[]): Promise<string | null> {
  if (!llmEnabled()) return null
  const context = hits.map((h, i) => `[${i + 1}] ${h.chunk.title}: ${h.chunk.text}`).join('\n')
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 400, system: SYSTEM, messages: [{ role: 'user', content: `Sources:\n${context}\n\nQuestion: ${question}` }] }),
      signal: AbortSignal.timeout(9000),
    })
    if (!res.ok) return null
    const json = (await res.json()) as { content?: { type: string; text?: string }[] }
    return json.content?.find((c) => c.type === 'text')?.text?.trim() || null
  } catch {
    return null
  }
}
