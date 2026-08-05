# Development Setup

## Requirements

- Node.js 24 LTS or newer
- pnpm 10 or newer
- Docker Desktop or Docker Engine for Supabase local development (M5)

## Package manager

Use pnpm for every repository command.

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm e2e
```

Do not use npm, npx, yarn, or another package manager. Use `pnpm exec` for installed binaries and `pnpm dlx` for temporary CLIs.

## Playwright MCP

Playwright MCP is configured globally in OpenCode at `~/.config/opencode/opencode.json`.

```bash
pnpm dlx @playwright/mcp@latest --help
pnpm exec playwright install chromium
```

Restart OpenCode after changing MCP configuration. MCP tools load only when OpenCode starts.

## Local Supabase

Supabase local is introduced in M5.

```bash
pnpm dlx supabase start
pnpm dlx supabase status
pnpm dlx supabase stop
```

Do not use production PHI in local development.

## Supabase Cloud credentials

Edit the **repo-root `.env`** (gitignored; template in `.env.example`):

```bash
DATABASE_URL="postgresql://postgres.<PROJECT_REF>:<DB_PASSWORD>@aws-0-<REGION>.pooler.supabase.com:6543/postgres"
SUPABASE_URL="https://<PROJECT_REF>.supabase.co"
SUPABASE_ANON_KEY="<PUBLIC_ANON_KEY>"
ORG_ID="<uuid>"
```

Full steps in [`how-to/database.md`](./database.md). Never commit `.env`.

## GraphQL layer note

GraphQL is temporarily parked; `apps/api` serves REST meanwhile.
See [`how-to/graphql-known-issue.md`](./graphql-known-issue.md).

## Verification policy

Each milestone must leave these checks documented and reproducible:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm exec playwright test` when browser behavior exists

The root `pnpm e2e` command runs the configured Playwright suite.

TypeScript source is validated by `pnpm typecheck`. TypeScript-specific ESLint parser rules are deferred until the parser supports the selected TypeScript 7 release.

## Current state

See [`../progress.md`](../progress.md) for milestone status.
