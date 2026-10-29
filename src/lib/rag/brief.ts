import type { PortalData } from '@/lib/portal/types'

import { buildFacts } from './facts'

export type Brief = { lines: { text: string; url: string }[]; sources: number }

/**
 * The Copilot brief on Home (AI-02). It is read from the same fact store as the answers: the facts marked for
 * the brief, most important first, so every line matches a screen and nothing is invented.
 */
export function briefFor(data: PortalData): Brief {
  const facts = buildFacts(data)
    .filter((f) => f.brief)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 5)
  return { lines: facts.map((f) => ({ text: f.text, url: f.url })), sources: facts.length }
}
