# Board — canica-app

Kanban del workspace canica. **Single source of truth** para tracking de tareas, planificación
y research. El estado vivo por milestone vive en [`docs/progress.md`](./docs/progress.md); este
board es el plan de trabajo (incluye investigación y no-código).

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
| 06 | Design system: aplicación de tema (paleta navy/emerald/sky, Geist, dark mode, `packages/ui`) — cerrar scope M10 | `.specs/design-system.md` | — | 🔜 Ready | — |
| 07 | Attachments (Phase 1): upload/list/download + Supabase Storage + UI | `.specs/domain-model.md` | — | 📋 Backlog | — |
| 08 | M15 completion: export de prescripción + persistir `document_exports` + listado descargable | `.specs/domain-model.md` | — | 📋 Backlog | — |
| 09 | M14 leftovers: reminders (stub email) + link cita → consulta | `.specs/roadmap.md` (Phase 3) | — | 📋 Backlog | — |
| 10 | M16 completion: audit login / failed-login / logout (hooks Better Auth) | `.specs/security-hipaa.md` | — | 📋 Backlog | — |
| 11 | Admin de roles: endpoint `user:manage` (cambio de rol) + UI | `.specs/security-hipaa.md` | — | 📋 Backlog | — |
| 12 | M17 AI package (stub provider, agents, accept/edit/reject) | `.specs/roadmap.md` (Phase 2) | — | ⏸️ Blocked (decisión: pausado) | — |
| 13 | M7 GraphQL: análisis decidir seguir o dejar REST (unpark vs permanente) | `docs/how-to/graphql-known-issue.md` | — | 📋 Backlog (research) | — |

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

---

## Notas / pendientes documentados hoy (2026-08-05)

- **CSS no cargaba** → faltaba `apps/web/postcss.config.mjs` (Tailwind v4 requiere el plugin
  `@tailwindcss/postcss`). Arreglado + commit `14d18d1`.
- **Signup roto x2**: (1) `organizationId` anidado en `additionalFields` → Better Auth lo
  espera top-level (`400 MISSING_FIELD`); (2) rewrite de Next quitaba el prefijo `/api` →
  `/api/auth/*` daba `404` en la API. Arreglado + commit `9ef1a2e`.
- **API debe correr en `PORT=3001`** para el proxy del web; el default (`3000`) choca con
  Next. Documentado en `docs/how-to/development.md`.
- **Playwright MCP roto** por channel `chrome` (ver Q1) — el browser del MCP no lanza.
- **Cuenta dev creada para pruebas**: `doctor.demo@example.com` / `Demo12345!` (rol doctor,
  org `00000000-0000-0000-0000-000000000000`).
- **Documentación de hoy**: `docs/progress.md`, `docs/development-plan.md`, `docs/backlog.md`,
  `README.md` actualizados con M12–M16 y gaps; commit `8d3b8fb`.
