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

Point the migration runner and future services at your Supabase project:

```bash
export DATABASE_URL="postgresql://postgres.<PROJECT_REF>:<PASSWORD>@db.<REGION>.supabase.co:5432/postgres"
export SUPABASE_URL="https://<PROJECT_REF>.supabase.co"
export SUPABASE_ANON_KEY="<PUBLIC_ANON_KEY>"
export SUPABASE_SERVICE_ROLE_KEY="<SERVICE_ROLE_KEY>" # never commit
```

Service role keys must never be committed. Add local secrets to `.env.local` (gitignored) and load via `dotenv/config` at the boundary only.

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
