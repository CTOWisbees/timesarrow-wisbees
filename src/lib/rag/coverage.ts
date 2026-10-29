import type { Chunk } from './bm25'
import { synonymsOf, tokens } from './text'

/**
 * How much of the question a chunk covers, 0–1: the share of the question's meaningful words that appear in the
 * chunk. A chunk that matches one word of a long question is a weak answer however often that word repeats.
 */
export function coverage(question: string, chunk: Chunk): number {
  const want = [...new Set(tokens(question))]
  if (!want.length) return 0
  const have = new Set(tokens(`${chunk.title} ${(chunk.tags ?? []).join(' ')} ${chunk.text}`))
  // A word the chunk has counts fully; a word only a synonym of it is there counts 70%.
  const got = want.reduce((sum, t) => sum + (have.has(t) ? 1 : synonymsOf(t).some((x) => have.has(x)) ? 0.7 : 0), 0)
  return got / want.length
}

/** A chunk covering less than this share of the question is not an answer to it. */
export const MIN_COVERAGE = 0.4
