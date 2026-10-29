/** Guardrails the BRD requires: no advice or tips, no guarantees, and no number the sources did not contain. */

const ADVICE =
  /\b(should i|shall i|must i|would you (buy|sell|invest)|buy|sell|which (stock|fund|share|etf)s?|best (\w+ )?(stock|fund|share|etf)s?|top (\w+ )?(stock|fund)s?|recommend\w*|stock tip|hot tip|multibagger|will .*\b(go up|rise|fall|crash|double)\b|guarantee\w*|assured return|how much will i (make|earn|get)|when (should|to) (i )?(buy|sell|exit|invest))\b/i

export const isAdviceSeeking = (q: string) => ADVICE.test(q)

const PROMISE = /\b(guaranteed?|assured|risk[- ]free|sure (shot|profit)|will (definitely|certainly) (grow|rise|make))\b/i

/** Output must not promise returns. */
export const hasPromise = (text: string) => PROMISE.test(text)

const NUM = /₹?\d[\d,]*(?:\.\d+)?%?/g
const norm = (s: string) => s.replace(/[₹,%]/g, '').replace(/\.0+$/, '')

/** Every number in a generated answer must appear somewhere in the context it was given. */
export function numbersGrounded(answer: string, context: string): boolean {
  const have = new Set((context.match(NUM) ?? []).map(norm))
  for (const m of answer.match(NUM) ?? []) {
    const n = norm(m)
    if (n.length < 2) continue // a lone digit such as "3 points" or a list number
    if (!have.has(n)) return false
  }
  return true
}
