# TimesArrow by WisBees

Pre-login website for WisBees Investment Advisory, with Payload CMS for content managers.
Deployed on Vercel at `timesarrow.wisbees.com`.

## Local setup

Requirements: Node 20.18+, pnpm, Postgres 17 (`brew install postgresql@17 && brew services start postgresql@17`).

```bash
createdb timesarrow
cp .env.example .env.local    # local values; production values go in .env.production (both gitignored)
pnpm install
pnpm seed               # loads the Figma copy + local test users
pnpm dev                # http://localhost:3000, CMS at /admin
```

## Content editing

Everything on the page is edited in `/admin`:

| What | Where in the CMS |
|---|---|
| Hero, highlights, calculator, section headings, booking form copy | Site → Home page |
| Navigation, footer links, logo | Site → Site settings |
| SEBI registration details, disclaimers, `/sebi-disclosure` page | Compliance → SEBI disclosure |
| Model portfolios, FAQs, gallery | Content |
| "Talk to an expert" requests | Leads → Call bookings |

**Roles.** Editors write and save drafts. Compliance reviews (the Preview button shows drafts on
the real site), records the BASL approval reference in the sidebar, and publishes. Admins also
manage users. Every published change is kept in version history.

**Compliance toggles.** Each model portfolio has *Show expected return*, *Show badge* and
*Show holdings*; the calculator has *Show return % on risk options*. Every section has *Show this section*.

## Deploying to Vercel

1. Create a Supabase project in **ap-south-1 (Mumbai)**.
   - Database → connection string (**Session pooler**, port 5432, not the transaction pooler) → `DATABASE_URI`
   - Storage → create a bucket `media` (files are served through `/api/media`, so it can stay private); Storage → S3 connection → `S3_*` keys
2. Import the repo in Vercel and set the env vars from `.env.example`
   (`NEXT_PUBLIC_SITE_URL=https://timesarrow.wisbees.com`, `SITE_INDEXABLE=false`).
   Do **not** set `SEED_PASSWORD` in production.
3. The build runs `payload migrate` before `next build`, so the schema is created on first deploy. If the database ever
   holds a schema pushed in dev mode, the build stops with instructions instead of hanging (see
   `src/scripts/db/migrate-guard.ts`). Load market data once with `pnpm market all` (see CLAUDE.md).
4. Create the first admin at `https://timesarrow.wisbees.com/admin`, then add content (or run
   `pnpm seed` once locally against the production `DATABASE_URI`).
5. Domain: add `timesarrow.wisbees.com` in Vercel → Domains, then a DNS record at the wisbees.com
   registrar: `CNAME timesarrow → cname.vercel-dns.com`.
6. After BASL approval, set `SITE_INDEXABLE=true` and redeploy.

## Schema changes

Edit `src/payload/**`, then:

```bash
pnpm generate:types
pnpm migrate:create describe-the-change
```

Commit the migration; production applies it on the next deploy.
