import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * The Copilot's published knowledge, stored in Postgres (Supabase in production) and searched there with full-text
 * search, instead of in the app's memory. Only public, approved content goes in: shipped explanations and published
 * CMS content. A client's own facts are never stored here. Only the server reads it: RLS on with no policies, and no
 * privileges for Supabase's anon/authenticated roles.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE SCHEMA IF NOT EXISTS rag;

  CREATE TABLE rag.chunks (
    id text PRIMARY KEY,
    title text NOT NULL,
    url text NOT NULL,
    body text NOT NULL,
    tags text NOT NULL DEFAULT '',                   -- space-separated search words
    source text NOT NULL CHECK (source IN ('static', 'cms')),
    content_hash text NOT NULL,
    tsv tsvector GENERATED ALWAYS AS (
      setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(tags, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(body, '')), 'C')
    ) STORED,
    updated_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX chunks_tsv ON rag.chunks USING gin (tsv);
  CREATE INDEX chunks_source ON rag.chunks (source);

  ALTER TABLE rag.chunks ENABLE ROW LEVEL SECURITY;

  DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      REVOKE ALL ON SCHEMA rag FROM anon, authenticated;
      REVOKE ALL ON ALL TABLES IN SCHEMA rag FROM anon, authenticated;
    END IF;
  END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP SCHEMA IF EXISTS rag CASCADE;`)
}
