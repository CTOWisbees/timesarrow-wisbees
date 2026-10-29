/**
 * Keeps the Copilot's published knowledge in Postgres (Supabase in production) up to date.
 *
 *   pnpm rag:index            write the shipped and published CMS content into rag.chunks
 *   pnpm rag:check            also run a few questions against the stored knowledge and print the top hits
 *
 * The app does this by itself every ten minutes while it is running; run it after a deploy or a CMS publish to
 * refresh straight away.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { syncKnowledge } from '@/lib/rag/knowledge-sync'
import { MIN_SCORE } from '@/lib/rag/answer'
import { KNOWLEDGE_CASES, UNANSWERABLE } from '@/lib/rag/eval-cases'
import { searchChunks, type Db } from '@/lib/rag/pg-store'

const [command = 'index'] = process.argv.slice(2).map(String).filter((a) => !a.endsWith('index.ts'))
const payload = await getPayload({ config })
const db = payload.db.pool as unknown as Db

try {
  const result = await syncKnowledge(db, payload)
  payload.logger.info(`[rag] static ${JSON.stringify(result.static)} cms ${JSON.stringify(result.cms)}`)

  if (command === 'check') {
    let failures = 0
    for (const [q, title] of KNOWLEDGE_CASES) {
      const hits = await searchChunks(db, q, 3)
      const ok = hits.some((h) => h.chunk.title === title)
      if (!ok) failures++
      payload.logger.info(`[rag] ${ok ? 'ok  ' : 'FAIL'} "${q}" -> ${hits.map((h) => `${h.chunk.title} (${h.score.toFixed(1)})`).join(' | ') || 'nothing'}${ok ? '' : `   expected: ${title}`}`)
    }
    for (const q of UNANSWERABLE) {
      const top = (await searchChunks(db, q, 1))[0]
      const ok = !top || top.score < MIN_SCORE
      if (!ok) failures++
      payload.logger.info(`[rag] ${ok ? 'ok  ' : 'FAIL'} unanswerable "${q}" -> ${top ? `${top.chunk.title} (${top.score.toFixed(1)})` : 'nothing'}`)
    }
    payload.logger.info(`[rag] ${failures ? `${failures} check(s) failed` : 'all checks passed'}`)
    if (failures) process.exitCode = 1
  }
} finally {
  process.exit(process.exitCode ?? 0)
}
