import { coverage } from './coverage'
import { queryTerms, tokens } from './text'

export type Chunk = {
  id: string
  /** Where the text came from, shown to the client as a source. */
  title: string
  /** A page in the app that shows the same thing. */
  url: string
  text: string
  /** "client" chunks are built per request from one family's data; "public" chunks are published content. */
  scope: 'client' | 'public'
  /** Used to boost chunks that the question names. */
  tags?: string[]
}

export type Hit = { chunk: Chunk; score: number }

/** Anything that can find chunks for a question: the database search in production, or an in-memory index. */
export type Retriever = { search(query: string, k?: number): Hit[] | Promise<Hit[]> }

const K1 = 1.4
const B = 0.72

/** A small in-memory BM25 index. The corpus is a few hundred chunks, so nothing heavier is needed. */
export class Bm25 {
  private docs: { chunk: Chunk; tf: Map<string, number>; len: number }[] = []
  private df = new Map<string, number>()
  private avg = 0

  private minCoverage: number

  constructor(chunks: Chunk[], opts: { minCoverage?: number } = {}) {
    this.minCoverage = opts.minCoverage ?? 0
    for (const chunk of chunks) {
      const toks = tokens(`${chunk.title} ${chunk.title} ${(chunk.tags ?? []).join(' ')} ${chunk.text}`)
      const tf = new Map<string, number>()
      for (const t of toks) tf.set(t, (tf.get(t) ?? 0) + 1)
      for (const t of tf.keys()) this.df.set(t, (this.df.get(t) ?? 0) + 1)
      this.docs.push({ chunk, tf, len: toks.length })
    }
    this.avg = this.docs.reduce((s, d) => s + d.len, 0) / Math.max(1, this.docs.length)
  }

  get size() {
    return this.docs.length
  }

  search(query: string, k = 5): Hit[] {
    const terms = queryTerms(query)
    const N = this.docs.length
    const hits: Hit[] = []
    for (const d of this.docs) {
      let score = 0
      for (const { term, weight } of terms) {
        const f = d.tf.get(term)
        if (!f) continue
        const n = this.df.get(term) ?? 0
        const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5))
        score += weight * idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * d.len) / this.avg)))
      }
      if (score > 0 && (this.minCoverage === 0 || coverage(query, d.chunk) >= this.minCoverage)) hits.push({ chunk: d.chunk, score })
    }
    return hits.sort((a, b) => b.score - a.score).slice(0, k)
  }
}
