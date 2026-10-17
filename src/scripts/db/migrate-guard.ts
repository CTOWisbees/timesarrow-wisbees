/**
 * Runs before `payload migrate` in the build. If the database still carries Payload's
 * "dev" marker (a schema pushed in dev mode instead of by migrations), `payload migrate`
 * stops to ask a question, which hangs a CI build forever and would fail anyway because
 * the tables already exist. Fail fast with instructions instead.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

const payload = await getPayload({ config })
const pool = payload.db.pool

try {
  const table = await pool.query(`SELECT to_regclass('public.payload_migrations') AS t`)
  if (table.rows[0]?.t) {
    const dev = await pool.query(`SELECT 1 FROM payload_migrations WHERE batch = -1 LIMIT 1`)
    if (dev.rowCount) {
      console.error(
        [
          '',
          'This database holds a schema that was pushed in dev mode (payload_migrations has a "dev" row),',
          'so `payload migrate` cannot run on it. Reset the schema once, then deploy again:',
          '  1. Back up anything you need (this database should only hold content that can be re-seeded).',
          '  2. DROP SCHEMA public CASCADE; CREATE SCHEMA public;  (Supabase SQL editor)',
          '  3. pnpm payload migrate && pnpm seed   (with DATABASE_URI pointing at this database)',
          'Remote databases are never pushed to (see payload.config.ts), so this does not happen again.',
          '',
        ].join('\n'),
      )
      process.exitCode = 1
    }
  }
} finally {
  process.exit()
}
