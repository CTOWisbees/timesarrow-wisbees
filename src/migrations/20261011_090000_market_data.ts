import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Portfolio Scan reference data, in its own `market` schema so Payload's dev push
 * (which diffs `public` only) never touches it. Loaded by scripts/market/*.
 * Not exposed to Supabase's Data API: RLS on with no policies, and anon/authenticated
 * have no privileges. Only the server reads it, through the Payload connection.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE SCHEMA IF NOT EXISTS market;

  CREATE TABLE market.instruments (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    key text NOT NULL UNIQUE,                       -- 'mf:<amfi code>' or 'eq:<isin>'
    amfi_code integer UNIQUE,
    nse_symbol text,
    bse_code text,
    name text NOT NULL,
    normalized_name text NOT NULL,
    instrument_type text NOT NULL CHECK (instrument_type IN ('equity', 'mutual_fund', 'etf', 'bond', 'cash')),
    asset_class text NOT NULL,                      -- equity, debt, hybrid, gold, silver, international, cash, other
    sub_category text,                              -- e.g. 'Flexi Cap', 'Liquid'
    category_raw text,                              -- source heading, for audit
    amc text,
    plan text CHECK (plan IN ('direct', 'regular')),
    option text CHECK (option IN ('growth', 'idcw')),
    sector text,
    industry text,
    market_cap_bucket text CHECK (market_cap_bucket IN ('large', 'mid', 'small')),
    is_index boolean NOT NULL DEFAULT false,
    is_thematic boolean NOT NULL DEFAULT false,
    expense_ratio numeric(6,4),                     -- percent, e.g. 0.6500
    expense_ratio_date date,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'delisted', 'merged', 'matured')),
    successor_id bigint REFERENCES market.instruments(id),
    last_price numeric(18,4),
    last_price_date date,
    long_history_at timestamptz,                    -- when full NAV history was fetched (paid analysis)
    updated_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX instruments_name_trgm ON market.instruments USING gin (normalized_name gin_trgm_ops);
  CREATE INDEX instruments_nse_symbol ON market.instruments (nse_symbol) WHERE nse_symbol IS NOT NULL;
  CREATE INDEX instruments_successor ON market.instruments (successor_id) WHERE successor_id IS NOT NULL;

  -- An IDCW scheme has two ISINs (payout and reinvestment), so ISINs get their own table.
  CREATE TABLE market.instrument_isins (
    isin text PRIMARY KEY CHECK (isin ~ '^[A-Z]{2}[A-Z0-9]{9}[0-9]$'),
    instrument_id bigint NOT NULL REFERENCES market.instruments(id) ON DELETE CASCADE
  );
  CREATE INDEX instrument_isins_instrument ON market.instrument_isins (instrument_id);

  -- Daily NAV / close. Growth options and stocks only (IDCW NAVs drop on payouts).
  CREATE TABLE market.prices (
    instrument_id bigint NOT NULL REFERENCES market.instruments(id) ON DELETE CASCADE,
    d date NOT NULL,
    price numeric(18,4) NOT NULL CHECK (price > 0),
    PRIMARY KEY (instrument_id, d)
  );

  -- Benchmarks: an index fund's NAV as a total-return proxy, or a weighted composite.
  CREATE TABLE market.benchmarks (
    id text PRIMARY KEY,                            -- 'NIFTY50_TRI'
    name text NOT NULL,
    components jsonb NOT NULL,                      -- [{ "instrumentKey": "mf:149373", "weight": 1 }]
    note text,
    selectable boolean NOT NULL DEFAULT true,       -- false: internal proxy (e.g. small-cap volatility)
    sort integer NOT NULL DEFAULT 0
  );

  -- Fund look-through from AMC monthly portfolio disclosures (paid tier).
  CREATE TABLE market.fund_holdings (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fund_instrument_id bigint NOT NULL REFERENCES market.instruments(id) ON DELETE CASCADE,
    as_of date NOT NULL,
    holding_isin text,
    holding_name text NOT NULL,
    asset_class text NOT NULL,
    sector text,
    rating text,
    weight numeric(9,6) NOT NULL                    -- fraction of fund NAV
  );
  CREATE INDEX fund_holdings_fund_asof ON market.fund_holdings (fund_instrument_id, as_of);

  -- Loader bookkeeping, so the UI can say how fresh prices are.
  CREATE TABLE market.loads (
    source text PRIMARY KEY,
    as_of date,
    rows integer,
    loaded_at timestamptz NOT NULL DEFAULT now()
  );

  ALTER TABLE market.instruments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE market.instrument_isins ENABLE ROW LEVEL SECURITY;
  ALTER TABLE market.prices ENABLE ROW LEVEL SECURITY;
  ALTER TABLE market.benchmarks ENABLE ROW LEVEL SECURITY;
  ALTER TABLE market.fund_holdings ENABLE ROW LEVEL SECURITY;
  ALTER TABLE market.loads ENABLE ROW LEVEL SECURITY;

  DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      REVOKE ALL ON SCHEMA market FROM anon, authenticated;
      REVOKE ALL ON ALL TABLES IN SCHEMA market FROM anon, authenticated;
    END IF;
  END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP SCHEMA IF EXISTS market CASCADE;`)
}
