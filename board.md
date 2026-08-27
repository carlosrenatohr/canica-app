# Board — canica-app

Kanban del workspace canica. **Single source of truth** para tracking de tareas, planificación
y research. El estado vivo por milestone vive en [`docs/progress.md`](./docs/progress.md); este
board es el plan de trabajo (incluye investigación y no-código).

**UI/UX Refresh (2026-08-10):** el estado detallado de las fases del refresh vive en [`docs/ui-ux-refresh-progress.md`](./docs/ui-ux-refresh-progress.md). El plan aprobado está en [`docs/audits/2026-08-10-ui-ux/`](./docs/audits/2026-08-10-ui-ux/).

## How to add a new task

```markdown
| ## | Título | Spec | — | 📋 Backlog | — |
```

**Columns**: `# | Task | Spec | Branch | Status | PR`

**Statuses**: 📋 Backlog → 🔜 Ready → 🔄 In Progress → 🔍 In Review → ✅ Done (o ⏸️ Blocked)

**Areas**: `core` (producto/MVP), `design` (design system & growth), `quality` (tests/infra).

## How to update a task

1. Cambiar `Status`
2. Poner `Branch` al empezar
3. Poner `PR` al abrir el PR
4. Mover a ✅ Done cuando merge

---

## Core (producto / MVP)

| # | Task | Spec | Branch | Status | PR |
|---|---|---|---|---|---|
| 01 | M12 Consultations / diagnoses / prescriptions (repos + API + UI) | `.specs/domain-model.md` | — | ✅ Done | #6 #8 #9 |
| 02 | M13 Medical record timeline | `.specs/domain-model.md` | — | ✅ Done | #10 |
| 03 | M14 Appointments CRUD (repo + API + UI) | `.specs/domain-model.md` | — | ✅ Done | #11 |
| 04 | M15 PDF export consulta + audit + botón UI | `.specs/domain-model.md` | — | ✅ Done | #12 |
| 05 | M16 Audit log query + UI `/audit` | `.specs/security-hipaa.md` | — | ✅ Done | #13 |
| 06 | Design system: aplicación de tema (Canica Clinical palette, Geist, dark mode, `packages/ui`) — ver UI/UX Refresh abajo | `.specs/design-system.md` | — | ✅ Done | — |
| 07 | Attachments (Phase 1): upload/list/download + Supabase Storage + UI | `.specs/domain-model.md` | — | 🔄 In Progress | — |
| 08 | M15 completion: export de prescripción + persistir `document_exports` + listado descargable | `.specs/domain-model.md` | — | 📋 Backlog | — |
| 09 | M14 leftovers: reminders (stub email) + link cita → consulta | `.specs/roadmap.md` (Phase 3) | — | 📋 Backlog | — |
| 10 | M16 completion: audit login / failed-login / logout (hooks Better Auth) | `.specs/security-hipaa.md` | — | 📋 Backlog | — |
| 11 | Admin de roles: endpoint `user:manage` (cambio de rol) + UI | `.specs/security-hipaa.md` | — | 📋 Backlog | — |
| 12 | M17 AI package (stub provider, agents, accept/edit/reject) | `.specs/roadmap.md` (Phase 2) | — | ⏸️ Blocked (decisión: pausado) | — |
| 13 | M7 GraphQL: análisis decidir seguir o dejar REST (unpark vs permanente) | `docs/how-to/graphql-known-issue.md` | — | 📋 Backlog (research) | — |

## Workflow & Standards

> Objetivo: replicar el standard de trabajo de `~/Codee/hit` en canica-app — Dredd (multi-agent
> review), AGENTS.md canónico y consolidado, gate de verificación único y skills pinneados — para
> que la forma de trabajar sea uniforme entre workspaces.

| # | Task | Spec / Referencia | Branch | Status | PR |
|---|---|---|---|---|---|
| W1 | Portar Dredd de hit a canica: wrapper `dredd` + `.dredd/` (review.sh, config, automated-runner.sh, metrics.sh, state.md) — `review`/`security`/`full` funcional como standard de review | `~/Codee/hit/dredd` · `~/Codee/hit/.dredd/` | — | 📋 Backlog | — |
| W2 | Consolidar `AGENTS.md` estilo hit: canónico, tool-neutral (consolida CLAUDE/ONBOARDING/README/docs) + `AGENTS_AUDIT.md` (histórico de consolidación) + `ONBOARDING.md` (handoff de sesión) | `~/Codee/hit/AGENTS.md` · `AGENTS_AUDIT.md` · `ONBOARDING.md` | — | 📋 Backlog | — |
| W3 | Gate estandarizado de verificación tipo hit (`pnpm check` como único gate: typecheck + lint + test + e2e) + `skills-lock.json` (skills pinned con hash) | `~/Codee/hit/skills-lock.json` · AGENTS.md hit (gate) | — | 📋 Backlog | — |
| W4 | Integrar Dredd con board/state de canica (`dredd board`/`status`/`metrics`) y definir el flujo standard completo (spec → task → review → merge) | `~/Codee/hit/.dredd/README.md` | — | 📋 Backlog | — |
| W5 | Asegurar Cloudflare MCP + codebase-memory MCP instalados y usados de forma canónica (codebase-memory por encima de grep/glob del agente). Cloudflare MCP hoy NO está en `opencode.json` (solo hay skills); documentar y habilitar | `~/.config/opencode/opencode.json` · `AGENTS.md` (MCP tooling) | — | 🔄 In Progress (codebase-memory ✅, Cloudflare pendiente) | — |
| W6 | Indexar canica-app en codebase-memory (`index_repository`) para que código + `.specs/` sean consultables vía grafo; evaluar definir `.specs/` como fuente de verdad consultable | `index_repository` · `AGENTS.md` (MCP tooling) | — | ✅ Done (6946 nodos, 21438 edges, indexado) | — |

## Design & Growth

| # | Task | Spec | Branch | Status | PR |
|---|---|---|---|---|---|
| D1 | Research: cómo generar videos promocionales de canica vía skill (tooling, pipeline, ejemplos) | — | — | 📋 Backlog (research) | — |

## Quality & Infra

| # | Task | Spec | Branch | Status | PR |
|---|---|---|---|---|---|
| Q1 | Playwright MCP: fix browser (MCP espera Chrome de marca; apuntar `--executable-path` a Chromium bundled + reiniciar sesión) | `docs/how-to/development.md` | — | 🔜 Ready | — |
| Q2 | E2E suite: verificar Playwright funciona + armar suite completa de flows clave (login, pacientes, consultas, timeline, citas, PDF, audit) | `docs/development-plan.md` (verification policy) | — | 📋 Backlog | — |
| Q3 | Tests automatizados M12–M16 (unit repos + integración API) — hoy solo typecheck | `docs/development-plan.md` | — | 📋 Backlog | — |
| Q4 | Seed idempotente: hoy los pacientes se duplican en cada corrida (sin `ON CONFLICT` en pacientes) | `packages/db/src/seed.ts` | — | 📋 Backlog | — |
| Q5 | Remove `ORG_ID` fallback (API ya no lo lee; limpiar `.env` + docs) | `docs/how-to/development.md` | — | 📋 Backlog | — |
| Q6 | Lint `@canica/api` y `@canica/config`: script falla ("all files ignored") — decidir config por paquete o dropear | `docs/backlog.md` | — | 📋 Backlog | — |

## UI/UX Refresh (audit 2026-08-10)

> Plan aprobado: [`docs/audits/2026-08-10-ui-ux/260810_CANICA_UI_UX_AUDIT_AND_ACTION_PLAN.md`](./docs/audits/2026-08-10-ui-ux/260810_CANICA_UI_UX_AUDIT_AND_ACTION_PLAN.md)  
> Tracker vivo: [`docs/ui-ux-refresh-progress.md`](./docs/ui-ux-refresh-progress.md)

| Phase | Scope | Status | Verification |
|---|---|---|---|
| 0 | Baseline, SDD envelope, spec alignment | ✅ Verified | spec aprobado, baseline typecheck/build/e2e |
| 1 | Canica Clinical tokens + dark mode | ✅ Verified | `globals.css`, light/dark, focus tokens |
| 2 | P0 functional stabilization | ✅ Verified | `/dashboard` canónico, hooks fix, session timeout, títulos acentuados |
| 3 | Shared UI primitives + state compositions | ✅ Verified | `packages/ui` (16 componentes), PatientForm, FormField |
| 4 | Navigation + application chrome | ✅ Verified | sidebar responsive, topbar sticky, theme toggle, `/settings` |
| 5 | Forms + patient workflows | ✅ Verified | PatientForm compartido, FormField, validación accesible |
| 6 | Dashboard, lists, clinical detail, audit | ✅ Verified | summary endpoint, paginación, search, actor resolution, appointment detail |
| 7 | Settings + account experience | ✅ Verified | `/settings`, theme persistence, profile/session |
| 8 | Patient documents + storage | 🔄 In Progress | storage decision: Supabase Storage; implementing `packages/storage`, API, repo, UI |
| 9 | Responsive + accessibility hardening | 🔄 In Progress | touch targets, contrast, aria-live, keyboard nav (commits `b1d6c4e`–`4ad42fd`) |
| 10 | Visual polish + regression closure | 📋 Backlog | visual snapshots light/dark, spacing, animation polish |

**Verification status (2026-08-26):** `pnpm typecheck` ✅ · `pnpm test` 19/19 ✅ · `pnpm build` ✅ (19 rutas) · `pnpm e2e` 7/15 passed (8 failed por API apagada en :3001, 8 skipped)

## Phase 8 — Documents (Supabase Storage)

> Storage decision: **Supabase Storage** (same project as DB, BAA available, fits tech-stack).  
> Specs updated: `.specs/architecture.md` (+`packages/storage`), `.specs/domain-model.md` (Attachment refs), `.specs/security-hipaa.md` (Storage section).

| # | Task | Spec | Branch | Status | PR |
|---|---|---|---|---|---|
| 8.1 | Create `packages/storage` abstraction (Supabase Storage client, upload, signed URL, delete) | `.specs/architecture.md` | — | 🔄 In Progress | — |
| 8.2 | Attachment repository in `packages/db` (CRUD, org-scoped) | `.specs/domain-model.md` | — | 📋 Backlog | — |
| 8.3 | API routes in `apps/api` (POST /attachments upload, GET /attachments list, GET /attachments/:id signed URL, DELETE /attachments/:id) | `.specs/domain-model.md` + `.specs/security-hipaa.md` | — | 📋 Backlog | — |
| 8.4 | Audit events: `attachment.upload`, `attachment.read`, `attachment.delete` | `.specs/security-hipaa.md` | — | 📋 Backlog | — |
| 8.5 | Documents UI: `apps/web/app/(dashboard)/patients/[id]/documents/page.tsx` (list, upload, download, delete) | `.specs/domain-model.md` | — | 📋 Backlog | — |
| 8.6 | Update patient detail Documents tab to link to real route | `.specs/domain-model.md` | — | 📋 Backlog | — |
| 8.7 | E2E tests for documents flow (upload, download, delete, permissions) | `.specs/agent-automation.md` | — | 📋 Backlog | — |

---

## Notas / pendientes documentados hoy (2026-08-26)

- **UI/UX Refresh Phases 0–7 verificadas** — ver sección arriba y tracker detallado en `docs/ui-ux-refresh-progress.md`.
- **Audit files movidos** a `docs/audits/2026-08-10-ui-ux/` (260810_CANICA_REFRESH_UIUX.md + 260810_CANICA_UI_UX_AUDIT_AND_ACTION_PLAN.md).
- **codebase-memory index actualizado** — 6946 nodos, 21438 edges, SHA `4ad42fd` (HEAD). Regla añadida a `AGENTS.md`: codebase-memory es el first source of truth para code discovery.
- **AGENTS.md actualizado** con 3 nuevas reglas: (1) codebase-memory mandatory first, (2) verification gate antes de cada task, (3) progress update obligatorio post-task.
- **E2E status**: 7 smoke tests pasan (anónimos), 8 authenticated tests fallan por API apagada (`ECONNREFUSED :3001`), 8 no corren. Necesita API corriendo para cobertura completa.
- **Phase 8 (Documents) en progreso** — decisión de storage: **Supabase Storage**. Specs actualizados (architecture, domain-model, security-hipaa). Implementando `packages/storage` + API + repo + UI.
- **Lint Q6** sigue abierto — `@canica/api` y `@canica/config` fallan por "all files ignored".
- **Playwright MCP Q1** sigue roto — Chrome binary no encontrado en `/opt/google/chrome/chrome`.
