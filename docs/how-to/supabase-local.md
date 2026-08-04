# Supabase Local Setup

Local Supabase provides PostgreSQL + storage for development and CI without touching production.

## Requirements

- Docker running (`docker version` must return)
- pnpm 10+
- Canica repository checked out

## Start local Supabase

```bash
pnpm dlx supabase start
```

This starts:

- Postgres on port 5432
- A local API gateway on port 54321 (Supabase client URL)
- Studio on port 54327
- Storage on port 54327/storage/v1

## Project init (once)

If no `supabase/` project exists locally:

```bash
pnpm dlx supabase init
```

This creates `supabase/migrations/` and `supabase/config.toml`.

## Apply canica schema

canica stores its Drizzle schema in `packages/db`. To apply it to the local database:

```bash
export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/canica"
pnpm --filter @canica/db db:migrate
```

When Docker is unavailable (as in some CI sandboxes), skip local startup and use Supabase Cloud instead. See `docs/how-to/database.md`.
