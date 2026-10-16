import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Portfolio Scan user data, in its own `scan` schema (outside Payload's dev push).
 * Holds instrument-level data only: no names, PAN, folio numbers or files. Anonymous
 * portfolios expire after 24 hours unless claimed at sign-up. Only the server reads it:
 * RLS on with no policies, and no privileges for Supabase's anon/authenticated roles.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE SCHEMA IF NOT EXISTS scan;

  CREATE TABLE scan.portfolios (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid,                                   -- Supabase Auth user id once claimed
    session_id uuid,                                 -- anonymous session (httpOnly cookie)
    name text NOT NULL DEFAULT 'My portfolio',
    input jsonb NOT NULL,                            -- canonical holdings + options (instrument level)
    as_of date NOT NULL,
    benchmark_id text,
    data_coverage numeric(5,4),
    source_types text[] NOT NULL DEFAULT '{}',
    expires_at timestamptz,                          -- set for anonymous portfolios
    claimed_at timestamptz,                          -- when an anonymous check was attached at sign-up
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (owner_id IS NOT NULL OR expires_at IS NOT NULL)
  );
  CREATE INDEX portfolios_owner ON scan.portfolios (owner_id, updated_at DESC) WHERE owner_id IS NOT NULL;
  CREATE INDEX portfolios_session ON scan.portfolios (session_id) WHERE session_id IS NOT NULL;
  CREATE INDEX portfolios_expiry ON scan.portfolios (expires_at) WHERE expires_at IS NOT NULL;

  -- Every analysis run is kept, so score history survives engine and config changes.
  CREATE TABLE scan.analysis_results (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    portfolio_id uuid NOT NULL REFERENCES scan.portfolios(id) ON DELETE CASCADE,
    engine_version text NOT NULL,
    config_version text NOT NULL,
    input_hash text NOT NULL,
    score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
    band text NOT NULL,
    result jsonb NOT NULL,
    paid jsonb,                                      -- paid-tier results, filled by the async job
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX analysis_results_portfolio ON scan.analysis_results (portfolio_id, created_at DESC);
  CREATE INDEX analysis_results_hash ON scan.analysis_results (input_hash, engine_version, config_version);

  -- Confirmed column mappings for unknown file layouts, keyed by a hash of the header row.
  CREATE TABLE scan.header_mappings (
    header_hash text PRIMARY KEY,
    mapping jsonb NOT NULL,
    uses integer NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE TABLE scan.entitlements (
    user_id uuid PRIMARY KEY,
    plan text NOT NULL CHECK (plan IN ('free', 'insights', 'pro')),
    valid_until timestamptz,
    source text NOT NULL,                            -- 'payment', 'dev', 'staff'
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE TABLE scan.payments (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id uuid NOT NULL,
    plan text NOT NULL CHECK (plan IN ('insights', 'pro')),
    amount_paise integer NOT NULL CHECK (amount_paise > 0),
    status text NOT NULL CHECK (status IN ('created', 'paid', 'failed', 'refunded')),
    provider text NOT NULL,
    provider_order_id text UNIQUE,
    provider_payment_id text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX payments_user ON scan.payments (user_id, created_at DESC);

  CREATE TABLE scan.alerts (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id uuid NOT NULL,
    portfolio_id uuid NOT NULL REFERENCES scan.portfolios(id) ON DELETE CASCADE,
    kind text NOT NULL,                              -- score_drop, new_flag, limit_crossed, recheck_due
    payload jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    read_at timestamptz
  );
  CREATE INDEX alerts_user_unread ON scan.alerts (user_id, created_at DESC) WHERE read_at IS NULL;
  CREATE INDEX alerts_portfolio ON scan.alerts (portfolio_id);

  CREATE TABLE scan.preferences (
    user_id uuid PRIMARY KEY,
    recheck_reminder boolean NOT NULL DEFAULT true,
    alert_score_drop integer NOT NULL DEFAULT 5 CHECK (alert_score_drop BETWEEN 1 AND 50),
    concentration_limit numeric(5,4) CHECK (concentration_limit > 0 AND concentration_limit <= 1),
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  ALTER TABLE scan.portfolios ENABLE ROW LEVEL SECURITY;
  ALTER TABLE scan.analysis_results ENABLE ROW LEVEL SECURITY;
  ALTER TABLE scan.header_mappings ENABLE ROW LEVEL SECURITY;
  ALTER TABLE scan.entitlements ENABLE ROW LEVEL SECURITY;
  ALTER TABLE scan.payments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE scan.alerts ENABLE ROW LEVEL SECURITY;
  ALTER TABLE scan.preferences ENABLE ROW LEVEL SECURITY;

  DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      REVOKE ALL ON SCHEMA scan FROM anon, authenticated;
      REVOKE ALL ON ALL TABLES IN SCHEMA scan FROM anon, authenticated;
    END IF;
  END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP SCHEMA IF EXISTS scan CASCADE;`)
}
