# Granular Development Plan

This is the **execution plan**, not product authority. Product behavior and architecture remain governed by `.specs/`.

- Product phases: [`../.specs/roadmap.md`](../.specs/roadmap.md)
- Architecture: [`../.specs/architecture.md`](../.specs/architecture.md)
- SDD process: [`../.specs/spec-driven-development.md`](../.specs/spec-driven-development.md)
- Agent automation: [`../.specs/agent-automation.md`](../.specs/agent-automation.md)
- Live status: [`progress.md`](./progress.md)

## Execution rules

Every milestone follows this loop:

```text
Intent → task envelope → spec review/update → implementation → tests → docs → commit → push/PR
```

Each milestone must have:

- One bounded scope
- Acceptance criteria
- Unit tests for pure logic
- Integration tests for package/API boundaries
- Key browser e2e when user-facing behavior exists
- Usage documentation
- Verification report
- One or more concise Conventional Commits

No milestone advances while its required checks fail. High-risk work (auth, PHI, clinical finalization, stack) needs human review before merge.

## Status vocabulary

- `planned` — not started
- `in-progress` — implementation underway
- `blocked` — requires access or decision
- `verified` — checks pass, docs exist, commit pushed

## M0 — Access and repository controls

**Status:** verified

### Scope

- GitHub CLI authentication for `carlosrenatohr`
- HTTPS Git remote
- Feature branch workflow
- Playwright MCP configuration
- Chromium browser installation

### Acceptance criteria

- `gh auth status` shows only the intended account
- `git push` works through HTTPS credentials
- OpenCode has Playwright MCP configured with `pnpm dlx`
- Chromium is installed for browser verification

### Commit

Handled before this plan was created. Repository access is local configuration, not tracked code.

## M1 — pnpm monorepo foundation

**Status:** verified

### Scope

- pnpm workspace and lockfile
- Turborepo task graph
- TypeScript 7+ base configuration
- Root package scripts
- Planned app/package boundaries
- Development setup and progress tracking docs

### Acceptance criteria

- `pnpm install` completes
- `pnpm typecheck` passes across workspace
- No `package-lock.json` or `yarn.lock` exists
- All repository commands are documented as pnpm commands

### Commit

`chore: scaffold pnpm monorepo foundation`

## M2 — Shared lint, test, and browser tooling

**Status:** verified

### Scope

- ESLint flat config compatible with the TypeScript 7 workspace surface
- Workspace lint scripts
- Shared Vitest configuration
- Shared Playwright configuration
- Unit smoke test
- Browser smoke test
- Root commands for unit and e2e execution

### Acceptance criteria

- `pnpm lint` executes real tasks and passes
- `pnpm test` executes Vitest and passes
- `pnpm e2e` executes Playwright and passes
- `pnpm typecheck` remains green
- Tests run without npm, npx, yarn, or global binaries

TypeScript-specific ESLint parser rules remain deferred until the parser officially supports the selected TypeScript 7 release. Typecheck remains the typed-source gate.

### Commit

`chore: add shared lint and test tooling`

## M3 — Domain types

**Status:** planned

### Scope

Implement types from `domain-model.md`:

- Organization
- User and roles
- Patient
- MedicalRecord
- Consultation
- Diagnosis
- Prescription
- Appointment
- Attachment
- AiSuggestion
- AuditLog
- DocumentExport

### Tests

- Type-level compile checks
- Status and role unions
- Relationship shape checks

### Docs

`docs/how-to/domain-types.md`

### Commit

`feat(types): define initial clinical domain contracts`

## M4 — Shared validation

**Status:** verified

## M5 — Database schema and Supabase local

**Status:** verified

### Scope

- Drizzle schema and config for all domain entities
- Generated migration with organization-scoped tables, lifecycle enums, and append-only audit log
- Supabase local guidance
- Migration runner and schema-shape tests

### Tests

- Migration SQL applies to clean local database (Supabase local)
- Required foreign keys and constraints
- Organization boundaries at query layer
- Audit records cannot be silently overwritten
- Schema-shape tests pass without a database (unit)
- Migration runner typechecks (integration pending local Supabase)

### Required access

- Docker daemon (for `supabase start`)
- Supabase CLI via `pnpm dlx`
- Local Postgres not required for unit tests, only for migration integration

### Docs

`docs/how-to/supabase-local.md`

### Commit

`feat(db): add Drizzle schema and local migrations`

## M6 — Typed repositories and seed

**Status:** planned

### Scope

- Repository functions for patients and clinical aggregates
- Transaction boundaries
- Organization-scoped query helpers
- Local development seed with synthetic data only

### Tests

- CRUD behavior
- Organization isolation
- Transaction rollback
- No PHI in seed/log output

### Docs

`docs/how-to/database.md`

### Commit

`feat(db): add scoped repositories and synthetic seed`

## M7 — GraphQL schema and SDK codegen

**Status:** planned

### Scope

- GraphQL schema package
- Pothos/Yoga decision recorded in `tech-stack.md`
- Context contract for auth, organization, DB, audit
- Query and mutation payload conventions
- Depth and complexity limits
- GraphQL Code Generator output to `@canica/sdk`

### Tests

- Schema builds
- Introspection contract checks
- Generated client type checks
- Invalid operation rejection
- Query depth/complexity rejection

### Docs

`docs/how-to/graphql-sdk.md`

### Commit

`feat(graphql): add typed schema and sdk codegen`

## M8 — Hono Worker API

**Status:** planned

### Scope

- Hono Worker entrypoint
- GraphQL endpoint mount
- Health endpoint
- Structured logging
- Error mapping and Sentry boundary stub

### Tests

- Health response
- GraphQL request/response
- Error response shape
- No sensitive values in logs

### Docs

`docs/how-to/api.md`

### Commit

`feat(api): mount GraphQL on Hono Worker`

## M9 — Authentication and authorization

**Status:** planned

### Scope

- Better Auth integration
- Session lifecycle
- Doctor, receptionist, administrator roles
- Organization scoping
- Server-side resolver authorization
- Login audit events

### Tests

- Login and logout
- Expired/revoked sessions
- Role denial
- Cross-organization denial
- Failed login audit

### Security gate

Human review required before merge. No production credentials or PHI fixtures.

### Commit

`feat(auth): add sessions, roles, and organization authorization`

## M10 — Web shell and UI foundation

**Status:** planned

### Scope

- Next.js 16+ shell
- Tailwind 4 and shadcn/ui foundation
- Light/dark theme
- Login and protected layout
- SDK-only data access
- Accessibility baseline

### Tests

- Component tests for critical UI states
- Playwright login shell smoke
- Protected route behavior
- Keyboard navigation and visible focus

### Docs

`docs/how-to/web.md`

### Commit

`feat(web): add accessible application shell`

## M11 — Patients

**Status:** planned

### Scope

- Patient list/search
- Create/update/archive patient
- Patient profile
- Organization-scoped GraphQL operations
- Audit on create, view, update, archive

### Tests

- Validation unit tests
- Repository integration tests
- GraphQL authorization tests
- Playwright create/search/profile flow

### Commit

`feat(patients): add scoped patient workflow`

## M12 — Consultations, diagnoses, prescriptions

**Status:** planned

### Scope

- Consultation draft and finalize lifecycle
- Diagnosis management
- Prescription management
- Physician confirmation requirement
- Audit and amendment behavior

### Tests

- Lifecycle unit tests
- GraphQL mutation tests
- Finalization authorization tests
- Playwright encounter workflow

### Security gate

Human review required for clinical finalization behavior.

### Commit

`feat(consultations): add encounter and prescription workflow`

## M13 — Medical record timeline

**Status:** planned

### Scope

- Patient chart timeline
- Consultation summary cards
- Diagnosis and prescription history
- Attachments metadata

### Tests

- Timeline ordering
- Empty/loading/error states
- Organization access denial
- Playwright chart navigation

### Commit

`feat(records): add longitudinal patient timeline`

## M14 — Appointments

**Status:** planned

### Scope

- Appointment lifecycle
- Reception workflow
- Visit-to-consultation link
- Reminder abstraction with email stub

### Tests

- Conflict and status rules
- Role permissions
- GraphQL integration
- Playwright schedule flow

### Commit

`feat(appointments): add scheduling workflow`

## M15 — PDF export

**Status:** planned

### Scope

- Consultation export
- Prescription export
- Storage pointer and metadata
- Authorized download
- Audit generate/download

### Tests

- Deterministic PDF content
- Permission checks
- Download response
- Playwright download flow

### Commit

`feat(pdf): add clinical document exports`

## M16 — Audit logs

**Status:** planned

### Scope

- Restricted audit query
- Filters by actor/action/entity/date
- Immutable display
- PHI-safe operational logs

### Tests

- Append behavior
- Admin access
- Non-admin denial
- Filter correctness
- Playwright audit access flow

### Commit

`feat(audit): add restricted audit log access`

## M17 — AI foundation

**Status:** planned

### Scope

- Provider-neutral contracts
- Stub provider first
- OpenAI adapter behind `packages/ai`
- History, summary, prescription agents
- AI suggestion lifecycle
- Accept/edit/reject flow
- Audit and explicit physician confirmation

### Tests

- Provider contract tests
- Deterministic stub outputs
- Prompt input minimization
- AI label presence
- Reject and accept audit behavior
- Playwright suggestion review flow

### Security gate

Human review required. No silent clinical writes. No provider key in repository.

### Commit

`feat(ai): add provider-neutral assistant foundation`

## Per-milestone report

Every completed milestone reports:

```markdown
## Result
- status: verified | blocked | failed
- milestone: Mx
- commit: ...
- pr: ...

## Verification
- pnpm typecheck: ...
- pnpm lint: ...
- pnpm test: ...
- pnpm e2e: ...

## Follow-ups
- ...
```

## Context refresh

Open a new session when context becomes large or after a milestone merge. New agent loads:

1. `AGENTS.md`
2. `.specs/README.md`
3. `.specs/spec-driven-development.md`
4. `.specs/agent-automation.md`
5. `docs/development-plan.md`
6. `docs/progress.md`
7. Task-specific specs

Do not rely on chat history as the plan. Update `docs/progress.md` after each milestone so context compaction is safe.
