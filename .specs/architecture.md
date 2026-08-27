# Architecture

> **Project:** canica  
> **Organization:** Nativerse  
> **Status:** Approved (Initial Architecture)  
> **Version:** 1.1  
> **Type:** Architecture Decision Record (ADR)

Official stack versions live in [tech-stack.md](./tech-stack.md).  
Security detail lives in [security-hipaa.md](./security-hipaa.md).  
Domain entities live in [domain-model.md](./domain-model.md).  
Delivery process: [spec-driven-development.md](./spec-driven-development.md).

---

## Repository strategy

One repository. One product. One monorepo.

```text
canica/
```

No multi-product repository. Each future Nativerse product owns its own repository.

### Why a monorepo?

- Shared types, validation, UI, and authentication
- Single CI/CD pipeline
- Better developer experience
- Easier refactoring and onboarding

---

## Monorepo structure

```text
canica/
  apps/
    web/                 # Next.js frontend
    api/                 # Hono API (Cloudflare Worker)

  packages/
    ai/                  # Providers, agents, prompts, tools
    auth/                # Authentication utilities
    db/                  # Drizzle schema, migrations, DB access
    graphql/             # GraphQL schema, resolvers, context (optional split)
    sdk/                 # Typed GraphQL client (codegen)
    types/               # Shared types
    validation/          # Shared Zod schemas
    ui/                  # Reusable UI (shadcn-based)
    storage/             # Object storage abstraction (Supabase Storage)
    config/              # Shared config
    eslint/              # ESLint presets
    tsconfig/            # TSConfig presets

  .specs/                # Source of truth (this directory)
  docs/                  # Drafts, notes, working docs
  infra/                 # Infrastructure as needed
  .github/               # CI/CD

  package.json
  turbo.json
  pnpm-workspace.yaml
  AGENTS.md
  README.md
```

---

## Application boundaries

### `apps/web`

- Physician / clinic UI
- Auth screens, dashboards, clinical workflows
- Consumes GraphQL **only** through `@canica/sdk` (generated/typed client)
- Never calls `fetch` / raw GraphQL HTTP against the API from feature code

### `apps/api`

- Single Hono application on Cloudflare Workers
- Hosts the **GraphQL** endpoint (queries, mutations; subscriptions only if later justified)
- Narrow non-GraphQL HTTP only where unavoidable (e.g. auth callbacks, health, file upload hooks)
- Auth, authorization, audit logging at resolver/context boundaries
- Orchestrates DB, storage, email, and AI packages
- Deployed as **one** Cloudflare Worker initially

### Packages

| Package | Responsibility |
| --- | --- |
| `db` | Drizzle schema, migrations, database access |
| `graphql` | Schema definition, resolvers, GraphQL context (may live under `apps/api` until extracted) |
| `validation` | Every Zod schema shared by API and clients |
| `types` | Shared TypeScript types |
| `auth` | Authentication utilities (Better Auth integration) |
| `sdk` | Typed GraphQL client / codegen output used by `web` (and future clients) |
| `ui` | Reusable UI components and design tokens |
| `ai` | Providers, agents, prompts, tools — no business logic leakage |
| `storage` | Object storage abstraction (Supabase Storage) — upload, signed URLs, metadata |
| `config` / `eslint` / `tsconfig` | Tooling consistency |

---

## Type-safety flow

```text
Database
  → Drizzle
  → GraphQL schema & resolvers
  → Codegen / SDK
  → Frontend
```

No duplicated interfaces across layers. GraphQL schema is part of the typed contract.

---

## AI isolation

```text
Application
  → AI Layer (packages/ai)
  → OpenAI | Claude | Gemini | Local models
```

```text
packages/ai/
  providers/
    openai/
    anthropic/
    gemini/
  agents/
    history/
    summary/
    prescription/
    trends/
    coding/
  prompts/
  tools/
```

Rules:

- No AI provider SDKs inside domain/business modules
- Changing providers should require minimal changes outside `packages/ai`
- AI output is always identifiable and physician-confirmable

---

## API strategy

- **GraphQL** is the product API for application data
- **No parallel public REST resource API** for the same domain operations
- Limited non-GraphQL HTTP is allowed for infrastructure concerns only (health, auth handshake/callbacks, binary upload/download when GraphQL is a poor fit)

### Why GraphQL

- Clients select exactly the clinical fields they need (less over-fetch on chart views)
- Single evolvable schema as the contract between API and `@canica/sdk`
- Strong codegen path into TypeScript 7+ types
- Fits a module-rich clinical domain (patients, consultations, nested chart data) without exploding endpoint counts

### Conventions

- Schema and resolvers are type-safe end-to-end (see [tech-stack.md](./tech-stack.md))
- Authorization and org scoping enforced in GraphQL context / field resolvers — never only in the UI
- Mutations that change PHI must be auditable
- Prefer explicit mutation payloads and errors over ad-hoc shapes
- Avoid unbounded nested queries; apply complexity/depth limits at the server

### SDK

The frontend never talks to GraphQL with ad-hoc strings in feature code.

Instead, `@canica/sdk` exposes a typed client (illustrative):

```ts
client.patients.create({ input })
client.consultations.update({ id, input })
client.query.patientById({ id, /* typed selection */ })
```

Codegen from the GraphQL schema keeps SDK and server aligned.

---

## Deployment

### Frontend

Cloudflare Pages → Next.js (`apps/web`)

### Backend

Cloudflare Workers → single Worker → Hono (`apps/api`) → Supabase

```text
Internet
  → Cloudflare
  → Worker
  → Hono
  → Supabase (PostgreSQL + Storage)
```

### Full request path

```text
Users
  → Cloudflare DNS
  → Cloudflare Pages (Next.js)
  → HTTPS
  → Cloudflare Worker (Hono API)
  → Supabase PostgreSQL
  → Supabase Storage
```

### Why one Worker?

Expected early traffic is low. Benefits: simpler deploy, lower maintenance, single endpoint, easier debugging.

Future split only when needed:

```text
API Worker
AI Worker
OCR Worker
Import Worker
```

### CI/CD flow

```text
Git push
  → GitHub
  → GitHub Actions
  → Cloudflare Pages + Cloudflare Worker
  → Production
```

Automatic deployment. No manual servers.

---

## Initial product modules

- Authentication
- Patients
- Consultations
- Medical records
- Diagnoses
- Appointments
- PDF export
- Audit logs
- AI assistant

Module domain detail: [domain-model.md](./domain-model.md).

---

## Complexity guardrails

Do **not** introduce until there is demonstrated need:

- Kubernetes
- Message brokers / event buses
- Microservices
- Distributed systems beyond the single-worker model
- Multiple Workers for the same concern

Prefer the simplest design that satisfies privacy, type safety, and clinician UX.
