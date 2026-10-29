import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Client dashboard data, in its own `portal` schema next to `scan`: goals, the answers a
 * client gives to suggestions, grievance tickets and a log of every AI answer (for the
 * compliance review the BRD requires). Only the server reads it: RLS on with no policies,
 * and no privileges for Supabase's anon/authenticated roles.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE SCHEMA IF NOT EXISTS portal;

  CREATE TABLE portal.goals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL,                          -- Supabase Auth user id
    name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
    emoji text NOT NULL DEFAULT '🎯',
    target_amount numeric(14,0) NOT NULL CHECK (target_amount > 0),
    target_year integer NOT NULL CHECK (target_year BETWEEN 2020 AND 2100),
    saved_amount numeric(14,0) NOT NULL DEFAULT 0 CHECK (saved_amount >= 0),
    monthly_amount numeric(12,0) NOT NULL DEFAULT 0 CHECK (monthly_amount >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX goals_owner ON portal.goals (owner_id, created_at);

  -- One answer per suggestion. Approving records the client's decision; it never places an order.
  CREATE TABLE portal.decisions (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    owner_id uuid NOT NULL,
    suggestion_key text NOT NULL,
    kind text NOT NULL,
    decision text NOT NULL CHECK (decision IN ('approved', 'declined')),
    detail jsonb NOT NULL DEFAULT '{}',              -- what was shown to the client when they answered
    decided_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (owner_id, suggestion_key)
  );

  CREATE TABLE portal.tickets (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    owner_id uuid NOT NULL,
    topic text NOT NULL,
    body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
    status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'in_review', 'resolved')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX tickets_owner ON portal.tickets (owner_id, created_at DESC);

  -- Every Copilot answer, with when and by which version of the answer rules.
  CREATE TABLE portal.ai_log (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    owner_id uuid NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    intent text NOT NULL,
    handed_over boolean NOT NULL DEFAULT false,      -- sent to the adviser instead of answered
    version text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX ai_log_owner ON portal.ai_log (owner_id, created_at DESC);

  ALTER TABLE portal.goals ENABLE ROW LEVEL SECURITY;
  ALTER TABLE portal.decisions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE portal.tickets ENABLE ROW LEVEL SECURITY;
  ALTER TABLE portal.ai_log ENABLE ROW LEVEL SECURITY;

  DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      REVOKE ALL ON SCHEMA portal FROM anon, authenticated;
      REVOKE ALL ON ALL TABLES IN SCHEMA portal FROM anon, authenticated;
    END IF;
  END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP SCHEMA IF EXISTS portal CASCADE;`)
}
