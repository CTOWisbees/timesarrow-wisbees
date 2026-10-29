import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/** The Copilot log also records what each answer was built from and how sure it was, for compliance review. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE portal.ai_log
    ADD COLUMN IF NOT EXISTS sources jsonb NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS confidence numeric(3,2),
    ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'extractive';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE portal.ai_log DROP COLUMN IF EXISTS sources, DROP COLUMN IF EXISTS confidence, DROP COLUMN IF EXISTS mode;
  `)
}
