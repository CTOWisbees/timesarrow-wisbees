import { createHash } from 'node:crypto'

import type { Chunk, Hit } from './bm25'
import { coverage, MIN_COVERAGE } from './coverage'
import { searchWords, synonymPrefixes } from './text'

/** The small slice of a pg Pool the store needs, so scripts and the app can both pass their own. */
export type Db = { query: <T = Record<string, unknown>>(text: string, params?: unknown[]) => Promise<{ rows: T[]; rowCount: number | null }> }

const hashOf = (c: Chunk) => createHash('sha256').update(JSON.stringify([c.title, c.url, c.text, c.tags ?? []])).digest('hex')

/**
 * Brings `rag.chunks` in line with the given published content: inserts new chunks, rewrites changed ones and
 * deletes ones that are gone. Only public content belongs here; a client's own facts are never stored.
 * Cheap when nothing changed (one read, no writes).
 */
export async function syncChunks(db: Db, chunks: Chunk[], source: 'static' | 'cms'): Promise<{ added: number; changed: number; removed: number }> {
  const existing = await db.query<{ id: string; content_hash: string }>(`SELECT id, content_hash FROM rag.chunks WHERE source = $1`, [source])
  const have = new Map(existing.rows.map((r) => [r.id, r.content_hash]))
  const next = new Map(chunks.map((c) => [c.id, c]))

  const upserts = chunks.filter((c) => have.get(c.id) !== hashOf(c))
  const gone = [...have.keys()].filter((id) => !next.has(id))

  if (upserts.length)
    await db.query(
      `INSERT INTO rag.chunks (id, title, url, body, tags, source, content_hash)
       SELECT * FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::text[])
       ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, url = EXCLUDED.url, body = EXCLUDED.body, tags = EXCLUDED.tags,
         source = EXCLUDED.source, content_hash = EXCLUDED.content_hash, updated_at = now()`,
      [
        upserts.map((c) => c.id),
        upserts.map((c) => c.title),
        upserts.map((c) => c.url),
        upserts.map((c) => c.text),
        upserts.map((c) => (c.tags ?? []).join(' ')),
        upserts.map(() => source),
        upserts.map(hashOf),
      ],
    )
  if (gone.length) await db.query(`DELETE FROM rag.chunks WHERE id = ANY($1::text[])`, [gone])
  return { added: upserts.filter((c) => !have.has(c.id)).length, changed: upserts.filter((c) => have.has(c.id)).length, removed: gone.length }
}

const q = (w: string) => `'${w.replace(/'/g, "''")}'`

/** The two tsquery strings for a question: its own words (OR), and synonym prefixes (OR) searched at a lower weight. */
export function tsQueries(question: string): { main: string | null; synonyms: string | null } {
  const words = searchWords(question)
  const prefixes = synonymPrefixes(question)
  return {
    main: words.length ? words.map(q).join(' | ') : null,
    synonyms: prefixes.length ? prefixes.map((p) => `${q(p)}:*`).join(' | ') : null,
  }
}

/** Postgres' ts_rank_cd is unbounded and grows with repeated words, so it is squashed onto the range the answer thresholds were set for. */
export const SCORE_SCALE = 10

/** Squash the raw rank, then scale it by how much of the question the chunk covers. */
export const rescore = (raw: number, cover: number) => (raw / (raw + 8)) * SCORE_SCALE * (0.35 + 0.65 * cover) * 3.4

type Row = { id: string; title: string; url: string; body: string; tags: string; score: number }

/** Full-text search inside Postgres: title, tags and body are weighted A, B and C, synonyms count a third as much. */
export async function searchChunks(db: Db, question: string, k = 5): Promise<Hit[]> {
  const { main, synonyms } = tsQueries(question)
  if (!main && !synonyms) return []
  const { rows } = await db.query<Row>(
    `WITH q AS (SELECT to_tsquery('english', $1) AS main, to_tsquery('english', $2) AS syn)
     SELECT c.id, c.title, c.url, c.body, c.tags,
            (ts_rank_cd(c.tsv, q.main, 0) + 0.35 * ts_rank_cd(c.tsv, q.syn, 0))::float8 AS score
     FROM rag.chunks c, q
     WHERE c.tsv @@ q.main OR c.tsv @@ q.syn
     ORDER BY score DESC, c.id
     LIMIT $3`,
    [main ?? '', synonyms ?? '', k],
  )
  return rows
    .map((r) => {
      const chunk: Chunk = { id: r.id, title: r.title, url: r.url, text: r.body, scope: 'public', tags: r.tags ? r.tags.split(' ') : [] }
      const cover = coverage(question, chunk)
      return { chunk, cover, score: rescore(Number(r.score), cover) }
    })
    .filter((h) => h.cover >= MIN_COVERAGE)
    .map(({ chunk, score }) => ({ chunk, score }))
    .sort((a, b) => b.score - a.score)
}
