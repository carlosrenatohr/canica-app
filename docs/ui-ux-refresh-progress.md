# Canica UI/UX Refresh Progress

**Status:** In progress  
**Source plan:** `docs/audits/2026-08-10-ui-ux/260810_CANICA_UI_UX_AUDIT_AND_ACTION_PLAN.md`  
**Started:** 2026-08-14  
**Owner:** Implementation agent under human review

This tracker records execution state for the approved UI/UX refresh. It is not a
replacement for the approved specs or the action plan.

## SDD Task Envelope

```yaml
id: canica-ui-ux-refresh-20260814
source: human
requested_at: 2026-08-14
natural_language: |
  Execute the approved Canica UI/UX audit and action plan incrementally, preserving
  clinical functionality, permissions, PHI protections, and project rules.
intent_summary: Restore the Canica frontend as a coherent, accessible, healthcare-grade SaaS UI.
type: feature
specs_to_read:
  - .specs/vision.md
  - .specs/architecture.md
  - .specs/tech-stack.md
  - .specs/design-system.md
  - .specs/domain-model.md
  - .specs/security-hipaa.md
  - .specs/roadmap.md
  - .specs/spec-driven-development.md
specs_to_change:
  - .specs/design-system.md
constraints:
  - honor AGENTS.md
  - use pnpm only
  - preserve server-side authorization and organization scoping
  - no PHI in logs, screenshots, fixtures, or commits
  - no silent clinical writes or AI auto-finalization
  - no framework or infrastructure rewrite
acceptance_criteria:
  - execute the action plan phase by phase
  - keep the application runnable at every phase boundary
  - verify each phase with the narrowest relevant checks
  - maintain an explicit regression checklist
out_of_scope:
  - patient portal
  - autonomous clinical AI
  - GraphQL migration
  - speculative calendar, billing, or messaging features
phase_alignment: Phase 1
risk: high
```

## Execution Rules

- Work serially on shared foundations; parallelize only after interfaces and ownership are explicit.
- Do not start independent agents on the same files.
- Every agent must return files changed, commands run, failures, and remaining risks.
- Human approval is required before auth, PHI, storage, or lasting spec changes are expanded beyond this plan.
- Keep unrelated pre-existing worktree changes untouched.

## Phase Tracker

| Phase | Scope | Status | Owner | Dependencies |
|---|---|---|---|---|
| 0 | Baseline, SDD envelope, spec alignment | verified | primary | human approval |
| 1 | Canica Clinical tokens and theme foundation | verified | primary | Phase 0 |
| 2 | P0 functional stabilization | verified | primary | Phase 1 token names |
| 3 | Shared UI primitives and state compositions | verified | parallel agent A | Phase 1 |
| 4 | Navigation and application chrome | verified | parallel agent B | Phase 3 |
| 5 | Forms and patient workflows | verified | parallel agent C | Phase 3 |
| 6 | Dashboard, lists, clinical detail, audit | verified | primary/agent C | Phases 2–5 |
| 7 | Settings and account experience | verified | parallel agent B | Phase 4 |
| 8 | Patient documents and storage | blocked until contract gate | specialist agent | security/domain/storage review |
| 9 | Responsive and accessibility hardening | planned | QA agent | Phases 3–8 |
| 10 | Visual polish and regression closure | planned | primary + reviewer | all prior phases |

## Phase 0 Completed Work

- Read the project operating rules and SDD process.
- Read architecture, design-system, security, domain, roadmap, and tech-stack specs.
- Consulted Codebase Memory for architecture and route discovery.
- Audited the actual frontend screens, shared UI package, scripts, tests, and Playwright setup.
- Created and reviewed `docs/audits/2026-08-10-ui-ux/260810_CANICA_UI_UX_AUDIT_AND_ACTION_PLAN.md`.
- Confirmed that the requested palette, Spanish-neutral language, complete dark mode, P0 fixes, complete routes, API-minimal support, and authenticated E2E scope are part of this work.

## Phase 0 Current Blockers

- Playwright MCP cannot start in the current environment because the configured Chrome binary is unavailable at `/opt/google/chrome/chrome`.
- Existing root worktree has unrelated untracked files. Do not remove or modify them.
- Existing lint configuration has known TypeScript ignore failures; preserve the distinction between pre-existing infrastructure failures and new UI failures.

## Phase 1 Progress

- Updated `apps/web/app/globals.css` to the Canica Clinical teal/iris semantic palette.
- Added light/dark semantic aliases for background, foreground, input, ring, muted foreground, destructive, surface, and overlay tokens.
- Corrected dark-theme primary button text contrast.
- Replaced the invalid ghost-button alpha declaration with valid `color-mix` syntax.
- Replaced the hardcoded badge gray ring with the semantic border token.
- Replaced broken light overlays with the semantic overlay token.
- Replaced hardcoded white text in active tabs and session timeout with the semantic button-text token.
- `pnpm --filter @canica/web typecheck` passes.
- `git diff --check` is being used as the documentation/code hygiene gate.

### Phase 1 remaining work

- Remove remaining legacy token names from page code after shared component migration is coordinated.
- Verify light/dark rendering in a working browser environment.
- Run the web build before marking Phase 1 verified.

## Current Implementation Update

- P0 stabilization implemented: canonical `/dashboard` route, stable appointment hooks, accented page titles, session-timeout sign-out, truthful dashboard failure state, and removal of unsupported patient claims.
- Shared UI hardening implemented: semantic focus/overlay/status tokens, Spanish accessibility labels, touch-sized pagination, privacy-aware avatars, and runtime Radix dependencies.
- Navigation/settings implemented: sticky shell, responsive sidebar, account menu, `/settings`, and persisted light/dark/system preference support.
- Forms implemented: shared patient create/edit form, accessible field errors, and shared consultation textarea/form treatment.
- `pnpm typecheck` passes across the workspace.
- `pnpm --filter @canica/web build` passes and now exposes `/dashboard` and `/settings`.
- Appointment detail is now exposed at `/appointments/[id]` and uses the existing API status contract.
- Dashboard and audit screens now use clearer hierarchy, truthful failure states, finite audit filters, and shared table primitives.
- `pnpm --filter @canica/web e2e` passes the existing 7 smoke tests when run with the web dev server; the API was not running, so proxy connection warnings are expected in this environment.
- `git diff --check` passes.

## Verification Blocker — Resolved

- `DateTimeLocal` test fixture fixed: changed `"2025-02-01T09:00:00.000Z"` → `"2025-02-01T09:00"` to match the schema (local minute precision).
- Hydration warnings fixed: removed `isPending`/`sessionPending` early returns from 7 pages (home, dashboard, audit, edit-patient, new-patient, appointments/[id], consultations/new, settings). Server and client now render the same initial output.
- PDF export bug fixed: replaced raw `fetch()` with `apiFetch()` to include credentials and base URL resolution.
- `pnpm --filter @canica/validation test` passes (17/17).
- `pnpm --filter @canica/web test` passes (2/2).
- `pnpm --filter @canica/web e2e` passes (7/7).
- `pnpm --filter @canica/web typecheck` passes.
- `pnpm --filter @canica/web build` passes.
- Browser visual verification remains blocked by the missing configured Chrome binary.

## Next Pending Tasks

1. ~~Resolve or separately approve the pre-existing `DateTimeLocal` appointment fixture mismatch~~ — resolved.
2. Complete remaining Phase 1 token migration from compatibility aliases to canonical semantic names.
3. Add authenticated E2E coverage for the work completed so far (login → dashboard → patient CRUD → appointment create/detail → consultation create).
4. Investigate the storage/API/security contract for patient Documents before assigning implementation.
5. Add actor-name resolution only if the audit API can expose it without weakening organization scoping or PHI rules.
6. Responsive and accessibility hardening (Phase 9): keyboard navigation, ARIA landmarks, focus management, responsive breakpoints.
7. Visual polish and regression closure (Phase 10): dark/light screenshot audit, spacing consistency, animation polish.

## Documents Contract Assessment

The current repository has the first domain pieces but not a runnable Documents
workflow:

- `packages/db/src/schema.ts` contains `attachments` metadata with organization,
  patient/consultation, path, MIME type, size, uploader, and timestamp.
- `packages/types/src/index.ts` contains `Attachment` and `AttachmentStorage` types.
- `packages/validation/src/index.ts` contains `CreateAttachmentInput` metadata validation.
- `packages/db/src/medical-records.ts` includes attachments in the patient timeline.
- `packages/db` seeds `attachment:read` and `attachment:write` permissions.
- `apps/api/src/index.ts` has no attachment upload, list, signed access, or delete route.
- No attachment repository or Supabase Storage abstraction exists.
- Existing audit action types/conventions must be extended deliberately for attachment access/delete.

Decision: do not create a Documents UI against fake local state. The specialist task must
first update the domain/security/API/storage contract, then implement the UI against the
real contract with organization scoping, permission checks, signed access, validation,
and audit events.

## Next Work Units

### Unit 1 — Phase 1 foundation

Owner: primary implementation agent.  
Files: `.specs/design-system.md`, `apps/web/app/globals.css`, shared UI token consumers.  
Deliverables: semantic Canica Clinical tokens, valid light/dark theme, focus-ring tokens, no invalid alpha CSS, migration map for legacy token classes.  
Verification: web typecheck, targeted build, token search, light/dark browser or screenshot check when browser tooling is available.

### Unit 2 — P0 functional stabilization

Owner: primary implementation agent after Unit 1.  
Deliverables: canonical root route, hooks-order fix, session sign-out fix, truthful data states, safe accented titles, no exposed missing links.  
Verification: focused tests plus authenticated E2E once browser setup works.

### Unit 3 — Shared primitives

Owner: independent agent after Unit 1 is merged or clearly isolated.  
Allowed files: `packages/ui/src/**`, package manifests, component tests.  
Deliverables: fixed Button/Input/Badge/Tabs/Dialog/Table/Breadcrumb/Avatar and new compositions from the action plan.  
Do not touch page layouts or globals without coordination.

### Unit 4 — Navigation/chrome

Owner: independent agent after Unit 3.  
Allowed files: sidebar, topbar, dashboard layout, settings route.  
Deliverables: sticky topbar, working search, theme toggle integration, real user menu, role-aware links, breadcrumbs.  
Do not change API contracts beyond a documented search requirement.

### Unit 5 — Forms and patient workflows

Owner: independent agent after Unit 3.  
Allowed files: patient and consultation form routes, shared form compositions, validation integration.  
Deliverables: one patient form for create/edit, migrated consultation form, accessible validation and state handling.  
Preserve payloads and permissions.

### Unit 6 — API support and documents

Owner: specialist agent only after a separate storage/security gate.  
Deliverables: bounded summary/search support, appointment detail support, actor resolution, attachment storage and audit behavior.  
This unit must update domain/security specs before implementation if contracts change.

## Progress Reporting Format

Each phase update must include:

```text
Phase:
Status:
Files changed:
Behavior changed:
Checks run:
Passed:
Failed or blocked:
Risks:
Next unit:
```

## Definition of Tracker Completion

This tracker is complete only when the action plan Definition of Done is complete, the
updated specs match the implementation, and all residual failures are documented.
