import 'server-only'

import { getPayloadClient } from '@/lib/payload'

import { Bm25, type Retriever } from './bm25'
import { MIN_COVERAGE } from './coverage'
import { syncKnowledge } from './knowledge-sync'
import { type Db, searchChunks } from './pg-store'
import { staticChunks } from './static-knowledge'

const TTL_MS = 10 * 60 * 1000
let lastSync = 0
let syncing: Promise<void> | null = null

type AppPayload = Awaited<ReturnType<typeof getPayloadClient>>

async function ensureFresh(payload: AppPayload) {
  if (Date.now() - lastSync < TTL_MS) return
  syncing ??= syncKnowledge(payload.db.pool as unknown as Db, payload)
    .then(() => void (lastSync = Date.now()))
    .finally(() => void (syncing = null))
  await syncing
}

let fallback: Bm25 | null = null

/**
 * The Copilot's published knowledge. It lives in Postgres (Supabase in production) and is searched there. The first
 * request after a restart, then every ten minutes, brings the table up to date with the shipped and published
 * content. If the database cannot be reached the Copilot falls back to the shipped content in memory, so it still answers.
 */
export async function getKnowledge(): Promise<Retriever> {
  const payload = await getPayloadClient()
  const db = payload.db.pool as unknown as Db
  try {
    await ensureFresh(payload)
  } catch {
    // Searching below still works on whatever is already stored; a failed refresh is retried on the next request.
  }
  return {
    async search(query, k = 5) {
      try {
        return await searchChunks(db, query, k)
      } catch {
        return (fallback ??= new Bm25(staticChunks(), { minCoverage: MIN_COVERAGE })).search(query, k)
      }
    },
  }
}
