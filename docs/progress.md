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
| M3 | `packages/types` domain types | planned | Vitest + typecheck |
| M4 | `packages/validation` Zod schemas | verified | Vitest 17/17 passing; typecheck/lint green |
| M5 | Drizzle schema, migrations, Supabase local | planned | DB integration tests |
| M6 | Typed repositories and seed | planned | DB integration tests + org isolation |
| M7 | GraphQL schema, context, codegen, SDK | planned | schema tests + generated client checks |
| M8 | Hono Worker API and health endpoint | planned | API integration tests |
| M9 | Better Auth, RBAC, org scoping | planned | auth integration + denial tests |
| M10 | Next.js web shell and UI foundation | planned | Playwright browser smoke |
| M11 | Patients | planned | unit, API integration, Playwright e2e |
| M12 | Consultations, diagnoses, prescriptions | planned | unit, API integration, Playwright e2e |
| M13 | Medical record timeline | planned | unit, API integration, Playwright e2e |
| M14 | Appointments and reminders | planned | unit, API integration, Playwright e2e |
| M15 | PDF export | planned | generation unit tests + download e2e |
| M16 | Audit log UI and filters | planned | audit integration + access e2e |
| M17 | AI package, stub provider, documentation agents | planned | provider contract tests + approval flow e2e |

## Module completion rule

A module is `verified` only when its spec is consistent, typecheck/lint/unit tests pass, required integration tests pass, key e2e flow passes, and usage docs exist.
