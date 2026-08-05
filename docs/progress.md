# Development Progress

Status is updated after each verified milestone.

## Legend

- `planned` — not started
- `in-progress` — implementation underway
- `blocked` — requires decision or access
- `verified` — checks pass and commit exists

## Milestones

| Milestone | Scope | Status | Verification |
| --- | --- | --- | --- |
| M0 | GitHub CLI auth, working branch, Playwright MCP | verified | `gh auth status`; MCP help; Chromium installed |
| M1 | pnpm/Turborepo monorepo scaffold, TypeScript 7+ | verified | `pnpm typecheck` passes; commit `1d697aa` |
| M2 | Shared lint/test/Playwright tooling | verified | `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm e2e` pass |
| M3 | `packages/types` domain types | verified | Vitest + typecheck |
| M4 | `packages/validation` Zod schemas | verified | Vitest 17/17 passing; typecheck/lint green |
| M5 | Drizzle schema, migrations, Supabase | verified | Schema + migrations + seed verified against Supabase Cloud (`rzohmiihkzuymvajkjes`, us-east-1) |
| M6 | Typed repositories and seed | verified | Patient repos (org-scoped CRUD) + seed running against Supabase Cloud; API smoke tests pass |
| M7 | GraphQL schema, context, codegen, SDK | blocked | parked: duplicate `graphql@16/17` issue, see `docs/how-to/graphql-known-issue.md` |
| M8 | Hono Worker API and health endpoint | verified | REST interim (patients CRUD + health); `pnpm typecheck` + `pnpm test` green |
| M9 | Better Auth, RBAC (permission-based, DB matrix), org scoping | verified | signup/login/denial verified against Supabase Cloud; 401/403/cross-org denied; audit on PHI writes |
| M10 | Next.js web shell and UI foundation | verified | Playwright e2e smoke (3/3 passed); typecheck green; PR #4 merged |
| M11 | Patients | verified | detail/create/edit/delete pages; e2e smoke (7/7 passed); PR #5 merged |
| M12 | Consultations, diagnoses, prescriptions | verified | M12B (PR #6) + M12A (PR #8) + M12C (PR #9) merged; repos tipados, 8 endpoints REST, UI; `pnpm typecheck` green |
| M13 | Medical record timeline | verified | PR #10 merged; `getPatientTimeline` + `GET /patients/:id/timeline` + página timeline; typecheck green |
| M14 | Appointments and reminders | verified (parcial) | PR #11 merged; CRUD + status transitions + API + UI citas; **reminders pendiente** (ver backlog) |
| M15 | PDF export | verified (parcial) | PR #12 merged; export consulta PDF + audit + botón UI; **falta: prescripción, persistir fila document_exports** (ver backlog) |
| M16 | Audit log UI and filters | verified (parcial) | PR #13 merged; `listAuditLogs` + `GET /audit` (AUDIT_READ) + página `/audit`; **falta: eventos login/logout** (ver backlog) |
| M17 | AI package, stub provider, documentation agents | planned | provider contract tests + approval flow e2e |

## Nota sobre verificación M12–M16

M12–M16 se verificaron con `pnpm typecheck` (todo verde) y smoke manual de endpoints. Las
pruebas automatizadas exigidas por la regla de completitud de módulo (unit, integración API,
Playwright e2e) están pendientes para estos módulos — ver `docs/backlog.md`.

## Module completion rule

A module is `verified` only when its spec is consistent, typecheck/lint/unit tests pass, required integration tests pass, key e2e flow passes, and usage docs exist.
