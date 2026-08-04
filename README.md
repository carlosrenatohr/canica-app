# canica

**AI-first Clinical Workspace** by Nativerse.

canica helps physicians reduce administrative burden with intelligent automation — while keeping full control, privacy, traceability, and a path to strong regulatory posture.

> Technology should disappear into the background. Physicians focus on patients; canica handles the paperwork.

---

## Status

**Bootstrap in progress.** Monorepo tooling is scaffolded; product modules are not implemented yet.

See [`.specs/roadmap.md`](./.specs/roadmap.md) for product phases.

**How we build:** [Specification Driven Development](./.specs/spec-driven-development.md).  
**Automated / scheduled agents (e.g. Hermes):** [`.specs/agent-automation.md`](./.specs/agent-automation.md).

---

## Why canica exists

Legacy EMRs slow clinicians down. canica is built as a calm, modern clinical workspace: documentation, organization, and assistive AI — never replacing clinical judgment.

Initial focus: independent physicians and small clinics in **Nicaragua**, designed to scale internationally.

---

## Tech stack (summary)

| Layer | Choice |
| --- | --- |
| Language | **TypeScript 7+** |
| Package manager | **pnpm 10+ only** + Turborepo |
| Web | Next.js, React, Tailwind, shadcn/ui |
| API | Hono on Cloudflare Workers + **GraphQL** |
| Client access | `@canica/sdk` (typed GraphQL / codegen) |
| Data | Supabase PostgreSQL + Storage, Drizzle ORM |
| Auth | Better Auth |
| AI | Isolated `packages/ai` (OpenAI first) |
| Deploy | Cloudflare Pages + Workers, GitHub Actions |

Authoritative versions and rationale: [`.specs/tech-stack.md`](./.specs/tech-stack.md).

---

## Specification Driven Development

canica is **spec-first**:

1. Capture intent (natural language is fine)
2. Update `.specs/`
3. Review for consistency
4. Implement
5. Verify (test / typecheck / lint)
6. Close the loop on docs

Details and the task envelope used by humans and agents: [`.specs/spec-driven-development.md`](./.specs/spec-driven-development.md).

---

## Documentation

| Document | Description |
| --- | --- |
| [`.specs/README.md`](./.specs/README.md) | Spec index & reading order |
| [`.specs/vision.md`](./.specs/vision.md) | Vision, goals, non-goals |
| [`.specs/architecture.md`](./.specs/architecture.md) | Architecture & boundaries |
| [`.specs/tech-stack.md`](./.specs/tech-stack.md) | Official stack |
| [`.specs/design-system.md`](./.specs/design-system.md) | UI language |
| [`.specs/domain-model.md`](./.specs/domain-model.md) | Domain entities |
| [`.specs/security-hipaa.md`](./.specs/security-hipaa.md) | Security & privacy |
| [`.specs/roadmap.md`](./.specs/roadmap.md) | Phases |
| [`.specs/spec-driven-development.md`](./.specs/spec-driven-development.md) | SDD methodology |
| [`.specs/agent-automation.md`](./.specs/agent-automation.md) | Hermes / NL automation |
| [`AGENTS.md`](./AGENTS.md) | Coding-agent operating rules |
| [`docs/development-plan.md`](./docs/development-plan.md) | Granular execution plan |
| [`docs/progress.md`](./docs/progress.md) | Live milestone status |

Working drafts may live under [`docs/`](./docs/). **Source of truth is `.specs/`.**

---

## Repository structure (planned)

```text
canica/
  apps/
    web/          # Next.js
    api/          # Hono + GraphQL (Cloudflare Worker)
  packages/
    ai/
    auth/
    db/
    graphql/      # schema/resolvers (or inside api until split)
    sdk/          # typed GraphQL client
    types/
    validation/
    ui/
    config/
    eslint/
    tsconfig/
  .specs/
  docs/
  infra/
  .github/
```

---

## Getting started

The monorepo scaffold is initialized. Product packages will be implemented milestone by milestone.

When scaffolding lands, expected flow:

```bash
pnpm install
pnpm dev
```

`npm`, `npx`, and `yarn` are not used in this repository. Use `pnpm exec` for local binaries and `pnpm dlx` for temporary CLI tools.

Exact scripts will be documented here after the monorepo bootstrap.

### Prerequisites (planned)

- Node.js 24 LTS (or current Active LTS per tech-stack)
- pnpm 10+
- TypeScript 7+ toolchain (via repo)
- Supabase project (local or cloud) for database/storage

---

## Development commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | *(planned)* start web + api |
| `pnpm build` | *(planned)* build all packages |
| `pnpm lint` | *(planned)* lint |
| `pnpm typecheck` | *(planned)* TypeScript 7+ checks |
| `pnpm test` | *(planned)* tests |
| `pnpm codegen` | *(planned)* GraphQL codegen → SDK |

---

## Contributing

1. Read the specs in `.specs/`
2. Change specs first when behavior changes (SDD)
3. Implement against monorepo boundaries (GraphQL + SDK)
4. Keep PHI out of logs, commits, and fixtures unless scrubbed

AI agents: follow [`AGENTS.md`](./AGENTS.md).  
Scheduled / Hermes-style jobs: follow [`.specs/agent-automation.md`](./.specs/agent-automation.md).

---

## License

TBD.
