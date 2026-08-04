# Database

Local development and Supabase Cloud connection guidance for canica's database.

## Tooling

- [Drizzle ORM](https://orm.drizzle.team) (schema + migrations)
- [pg](https://node-postgres.org) node driver
- Supabase CLI for local PostgreSQL and storage (Docker-backed)

All commands run through pnpm. Do not use npm, npx, or yarn.

## Local development (Docker)

Supabase local requires a running Docker daemon.

```bash
pnpm dlx supabase start
pnpm dlx supabase status
pnpm dlx supabase stop
```

Set the local database URL used by the migration runner and tests:

```bash
export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/canica"
```

## Supabase Cloud (existing project)

### Where the env lives

- Repository root `.env` — **gitignored**; this is the file you edit.
- `.env.example` (committed) — template with placeholders; copy it as a starting point.
- The migration runner (`packages/db` `db:migrate`) and the API
  (`apps/api`, via `import "dotenv/config"`) both read `.env` from the repo root.
- Do **not** create per-package `.env` files; keep everything in the root `.env`.

### Getting the values from the Supabase Dashboard

1. Open your project → **Project Settings → Database**.
2. Under *Connection string* choose **Transaction pooler** (port `6543`).
   It looks like:
   `postgresql://postgres.<PROJECT_REF>:<DB_PASSWORD>@aws-0-<REGION>.pooler.supabase.com:6543/postgres`
3. Put that exact string in `.env` as `DATABASE_URL`.
4. Copy `SUPABASE_URL` (`https://<PROJECT_REF>.supabase.co`) and
   `SUPABASE_ANON_KEY` (Project Settings → API) if needed later.

Minimal `.env` to run migrations + API:

```bash
DATABASE_URL="postgresql://postgres.<PROJECT_REF>:<DB_PASSWORD>@aws-0-<REGION>.pooler.supabase.com:6543/postgres"
ORG_ID="<uuid of a dev organization>"   # optional fallback org for the API
```

Apply migrations and verify:

```bash
pnpm --filter @canica/db db:migrate
pnpm --filter @canica/db test
```

Note: older direct host `db.<REGION>.supabase.co:5432` requires IPv4; prefer the pooler.

## Schema and migrations

```bash
pnpm --filter @canica/db db:generate    # regenerate migration SQL from the schema
pnpm --filter @canica/db db:migrate     # apply pending migrations to DATABASE_URL
```

Migrations live in `packages/db/src/migrations/`. Drizzle appends a new `<version>_<random>.sql` file on each `db:generate`.

## Running tests

```bash
pnpm --filter @canica/db test       # schema-shape tests (no DB required)
pnpm --filter @canica/db typecheck  # TypeScript validation
pnpm --filter @canica/db lint       # ESLint on JS files only
```

Database-applied integration tests require a live `DATABASE_URL`. When it is set, the migrate runner and DB integration tests execute; otherwise they are skipped.
