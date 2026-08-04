# Tech Stack

> **Status:** Approved  
> **Version:** 1.1

This is the **only** document that defines canica’s official technology stack and approved version floors.

Architecture boundaries: [architecture.md](./architecture.md).  
Process: [spec-driven-development.md](./spec-driven-development.md).

---

## Runtime & monorepo

| Technology | Version | Role | Why |
| --- | --- | --- | --- |
| Node.js | Latest Active LTS (rec: **24 LTS**) | Runtime | Stable LTS baseline |
| pnpm | **10+** | Mandatory package manager | Fast installs, workspaces, efficient disk use |
| Turborepo | **2+** | Monorepo task runner | Incremental builds, cache, parallel execution |
| TypeScript | **7+** | Language (all packages) | End-to-end type safety; official language version for canica |

---

## Frontend

| Technology | Version | Role | Why |
| --- | --- | --- | --- |
| Next.js | **16+** | Web app (`apps/web`) | App Router, Server Components, strong DX for dashboards |
| React | **19** | UI library | Modern concurrent model |
| TypeScript | **7+** | Language | Shared with API and packages |
| Tailwind CSS | **4** | Styling | Utility-first, design-token friendly |
| shadcn/ui | latest compatible | Component primitives | Accessible, customizable, no vendor lock-in (Radix + Tailwind) |
| Lucide React | latest compatible | Icons | Rounded, minimal, outlined |
| React Hook Form | latest compatible | Forms | Performance + DX |
| Zod | latest compatible | Schema validation (shared) | Same schemas on client and server |
| TanStack Query | **v5+** | Remote/server state | Caching, retries, async UX around the GraphQL client |

### Package manager policy

- **pnpm is mandatory for every repository operation**
- Use `pnpm install`, `pnpm add`, `pnpm exec`, and `pnpm dlx`
- Do not use `npm`, `npx`, `yarn`, or another package manager
- Commit `pnpm-lock.yaml`; do not create `package-lock.json` or `yarn.lock`

### Local state

- Prefer React state
- Use Context only when necessary
- Avoid Redux
- Avoid Zustand unless a real need appears

---

## Backend

| Technology | Version | Role | Why |
| --- | --- | --- | --- |
| Hono | **4+** | HTTP server (`apps/api`) | Lightweight, fast, type-safe, excellent Cloudflare Workers support; mounts GraphQL |
| GraphQL | **spec-compliant** (see server lib below) | Product API | Single schema contract; selective queries for clinical UI; codegen into SDK |
| GraphQL Yoga **and/or** Pothos | latest compatible | GraphQL server / schema builder on Hono | Workers-friendly, type-safe schema, fits monorepo codegen |
| GraphQL Code Generator | latest compatible | Types + SDK artifacts | Keeps `@canica/sdk` aligned with schema |
| Drizzle ORM | **0.44+** | ORM | SQL-first, type-safe, lightweight migrations |
| Supabase PostgreSQL | managed | Primary database | Managed Postgres, backups, dashboard, strong free tier, easy local dev |
| Better Auth | latest compatible | Authentication | Provider-agnostic, modern, type-safe, self-hostable |
| Supabase Storage | managed | Object storage | PDFs, medical images, attachments |
| Zod | latest compatible | Input validation at boundaries | Shared via `packages/validation`; complements GraphQL args |
| Pino | latest compatible | Logging | Structured, fast |
| Sentry | latest compatible | Error tracking | Production diagnostics |
| Resend | latest compatible | Transactional email | Simple API, good DX |
| React PDF **or** PDF-Lib | latest compatible | PDF generation | Clinical exports / prescriptions |

## Testing

| Technology | Version | Role |
| --- | --- | --- |
| Vitest | latest compatible | Unit and integration tests |
| Playwright Test | latest compatible | Browser end-to-end tests |
| Playwright MCP | latest compatible | Agent-operated browser verification |

Testing commands run through pnpm (`pnpm test`, `pnpm exec playwright test`).

### API style (normative)

- **GraphQL** is the application data API
- **No** parallel public REST resource API for domain CRUD
- Non-GraphQL HTTP only for: health, auth callbacks/webhooks, and binary upload/download when required
- Frontend uses **`@canica/sdk` only** (no raw `fetch` to GraphQL from features)

---

## AI

| Technology | Role |
| --- | --- |
| OpenAI | Initial provider |
| Claude / Gemini / local LLMs | Future providers behind `packages/ai` |

All provider access goes through `packages/ai`. No direct provider coupling in business logic.

---

## Deployment & hosting

| Layer | Platform |
| --- | --- |
| Frontend | Cloudflare Pages |
| Backend | Cloudflare Workers (single Worker initially) |
| Database | Supabase PostgreSQL |
| Files | Supabase Storage |
| CI/CD | GitHub Actions → Cloudflare |

---

## Version notes

- Prefer the **latest stable** release that satisfies the floors above
- **TypeScript 7+** is required policy for new code and tooling config (`packages/tsconfig`)
- **pnpm 10+ is mandatory**; commands must never use npm, npx, or yarn
- Pin exact versions in lockfile (`pnpm-lock.yaml`); this document defines policy floors and choices, not every patch pin
- If a GraphQL library choice is refined at scaffold time (Yoga vs Pothos-first, etc.), update this file in the same change set

---

## Explicitly out of stack (for now)

- Public domain REST API alongside GraphQL
- Redux / default Zustand
- Kubernetes
- Message brokers / event buses
- Multi-worker split (until justified)
- Direct `fetch` / ad-hoc GraphQL strings from UI features (use SDK)
- GraphQL subscriptions (until a real-time product need is specified)
