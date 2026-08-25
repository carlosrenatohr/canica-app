# AGENTS.md

Instructions for AI coding agents, CI agents, and automated contributors working on **canica**.

Product and architecture truth lives in **`.specs/`**. Do not duplicate it here. Read specs before implementing.

**Full process:** [`.specs/spec-driven-development.md`](./.specs/spec-driven-development.md)  
**Orchestrators (Hermes, schedules, NL jobs):** [`.specs/agent-automation.md`](./.specs/agent-automation.md)

---

## MCP tooling (canonical usage)

- **Code discovery: `codebase-memory` MCP is the mandatory first source of truth.** Before
  using `grep`, `glob`, or file-search, **always** consult the codebase-memory graph first:
  `search_graph` → `trace_path` → `get_code_snippet` → `query_graph` → `get_architecture`.
  Fall back to grep/glob **only** when:
  - Searching string literals, error messages, or config values
  - Searching non-code files (Dockerfiles, shell scripts, configs)
  - The MCP tool returns insufficient results (then retry with broader queries first)
  This rule is non-negotiable. The graph is the structural source of truth for the codebase.
- **Cloudflare:** use the Cloudflare MCP when configured (task `board.md` W5). Until it is
  installed, rely on the `cloudflare` / `wrangler` / `workers-best-practices` skills.
- **Browser verification:** Playwright MCP (`playwright_browser_*` tools). See
  `docs/how-to/development.md` for the known Chrome channel issue (task `board.md` Q1).

---

## Verification gate (run before every task)

Before starting any new development task, **verify the app is healthy**. If checks fail, fix them first — do not layer new work on a broken foundation.

```bash
pnpm typecheck          # must pass
pnpm test               # must pass (or document pre-existing failures)
pnpm --filter @canica/web build   # must pass
pnpm --filter @canica/web e2e     # run when API is available; document env blockers
```

**Rule:** if `typecheck`, `test`, or `build` fail, that is the task. Do not proceed to new features until the baseline is green. E2E failures caused by missing infrastructure (API not running, browser not available) are documented, not fixed in-place.

---

## Progress update rule (mandatory after every task)

After completing any task (code, docs, spec, or config change), update the relevant progress tracker **before starting the next task**. Do not skip this step.

| Scope | Update |
| --- | --- |
| Milestone work (M0–M17) | `docs/progress.md` — status, verification, commit |
| UI/UX refresh phases | `docs/ui-ux-refresh-progress.md` — phase status, files changed, checks run |
| Board-tracked tasks | `board.md` — status column, branch, PR |
| Backlog discoveries | `docs/backlog.md` — new items with `[ ]` prefix |

If a task reveals new gaps, add them to the appropriate tracker immediately. Do not rely on memory or chat history.

---

## Before you write code

1. Read `.specs/README.md` and the specs relevant to the task.
2. Follow **Specification Driven Development** (mandatory for significant work):
   - Normalize the request into a task envelope (see SDD doc)
   - Update specification if behavior changes
   - Review specification against other `.specs/` files
   - Implement
   - Test / typecheck / lint when available
   - Update docs if needed
3. If a request conflicts with `.specs/`, **stop**. Align with the spec or propose a spec change first — never “make it work” by ignoring specs.
4. External/scheduled agents (e.g. Hermes): obey permission tiers in `agent-automation.md`. Default unattended jobs are read-only or docs/spec-only unless explicitly configured otherwise.

---

## Source of truth map

| Need | Read |
| --- | --- |
| Why / goals / non-goals | `.specs/vision.md` |
| Boundaries, monorepo, deploy, GraphQL | `.specs/architecture.md` |
| Allowed technologies | `.specs/tech-stack.md` |
| UI language | `.specs/design-system.md` |
| Entities & relationships | `.specs/domain-model.md` |
| PHI, authz, audit | `.specs/security-hipaa.md` |
| Phases | `.specs/roadmap.md` |
| SDD cycle & NL task envelope | `.specs/spec-driven-development.md` |
| Hermes / automation contract | `.specs/agent-automation.md` |

Draft notes may exist under `docs/`. **Approved decisions are in `.specs/`.**  
Deferred work / technical debt lives in [`docs/backlog.md`](./docs/backlog.md) — add here what we consciously don't fix now.

---

## Architectural constraints (do not violate)

- **Monorepo, one product** — no multi-product layout
- **Type safety end-to-end** — DB → Drizzle → GraphQL → SDK codegen → web; no duplicated parallel interfaces
- **TypeScript 7+** — language floor for the monorepo
- **GraphQL is the product API** — no parallel public REST domain API
- **Frontend never raw-fetches the API** — use `@canica/sdk` (typed GraphQL client; package name may be finalized at scaffold time)
- **AI only via `packages/ai`** — no provider SDKs inside domain modules
- **One Cloudflare Worker** for API until specs say otherwise
- **No premature infra** — no K8s, brokers, microservices “just in case”
- **Physician final authority** — AI output must be labeled; no silent clinical writes
- **Authz on the server** — UI checks are not sufficient (enforce in GraphQL context/resolvers)
- **Audit important PHI actions** — see security spec

---

## Repository layout expectations

```text
apps/web          Next.js UI
apps/api          Hono + GraphQL (Worker)
packages/*        shared libraries (db, auth, graphql, sdk, validation, types, ui, ai, …)
.specs/           specifications (source of truth)
docs/             drafts / working notes
```

Prefer extending existing packages over creating new top-level apps.

---

## Coding conventions

- TypeScript **7+** throughout
- **pnpm only** — use `pnpm`, `pnpm exec`, or `pnpm dlx`; never use `npm`, `npx`, or `yarn`
- Match existing style once code exists; until then, follow specs and keep modules small
- GraphQL schema + codegen drive the SDK — do not hand-maintain divergent client types
- Shared Zod schemas in `packages/validation` — do not fork schemas in app code
- Shared UI in `packages/ui` — avoid one-off inaccessible components
- **Do not add comments** unless the user or review process asks for them
- **Never commit secrets** (`.env`, keys, tokens, PHI dumps)
- Do not log PHI or credentials
- Prefer clear names over clever abstractions

---

## Security expectations

- Treat all patient-related data as PHI
- Least privilege, org scoping, session-aware resolvers/handlers
- Scrub sensitive data from logs and error reporting
- Depend only on approved stack from `.specs/tech-stack.md`

---

## Workflow expectations

- Do not expand scope beyond the requested change
- Do not invent product behavior that contradicts specs
- When specs are silent, choose the simplest option consistent with vision principles and document it in `.specs/` if the decision is lasting
- Do not commit unless the user explicitly asks (or the orchestrator job explicitly allows git write under its tier)
- After substantive code changes, run the repo’s lint/typecheck/test commands when they exist
- Record package-manager commands exactly; all installs and scripts run through pnpm
- End automated runs with the report format in `agent-automation.md`

---

## Natural language tasks (quick path)

```text
NL request → task envelope → edit .specs if needed → implement → verify → report
```

High-risk (auth, PHI, clinical finalization, stack changes): require human gate before merge/deploy. See automation tiers.

---

## What not to put in this file

- Product marketing copy
- Full architecture essays
- Stack version tables
- Long Hermes job YAML (keep examples in `.specs/agent-automation.md`)

Those belong in `.specs/`. Keep `AGENTS.md` operational.
