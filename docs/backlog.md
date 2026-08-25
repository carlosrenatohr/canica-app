# Backlog — post-MVP tasks & technical debt

Pending work that is not part of the current milestone. Items move into
`progress.md` as milestones when scoped. Anything here is fair game to pick up
once the MVP loop is complete.

## How to use

- One line per item, prefixed with status: `[ ]` open, `[x]` done.
- Link the item to a milestone when it becomes one.
- Add anything discovered during work that we chose not to fix now.

---

## Open

- [ ] **Automated tests M12–M16** — estos módulos se verificaron solo con `pnpm typecheck`
      + smoke manual. Falta: unit tests de repos/lógica, tests de integración API y
      Playwright e2e de los flujos clave (encuentro clínico, timeline, citas, descarga PDF,
      acceso a auditoría). Exigido por la regla de completitud de módulo.
- [ ] **M14 reminders** — el milestone pedía "Reminder abstraction with email stub";
      se implementó el ciclo de citas pero no la capa de recordatorios.
- [ ] **M14 visit-to-consultation link** — crear consulta desde una cita; no implementado.
- [ ] **M15 prescription export** — el milestone pedía "Prescription export" además del de
      consulta; solo existe `POST /consultations/:id/export/pdf`.
- [ ] **M15 persistir `document_exports`** — el repo `createDocumentExport` existe pero el
      endpoint de export no inserta la fila (solo audita). Faltan metadata, storage pointer
      y un listado de exports descargables.
- [ ] **Audit login / failed-login / logout** — no yet written to `audit_logs`.
      Planned hook point is Better Auth `hooks.after`; needs DB access inside
      `packages/auth`. See `docs/how-to/auth.md` → Known gaps. Target M16 (still open).
- [ ] **Admin endpoint for role changes** — roles are currently seed/data-only.
      `user:manage` permission exists but no route uses it. Needs an admin
      "update user role" endpoint (invite/role management).
- [ ] **Lint failing for `@canica/api` and `@canica/config`** — pre-existing:
      root `eslint.config` ignores `**/*.ts` by design (TS validated by tsc), so
      those packages' `lint` scripts error with "all files ignored". Not caused by
      M9. Decide: per-package eslint config for TS or drop the script.
- [ ] **M7 GraphQL unpark** — duplicate `graphql@16/17` module issue; see
      `docs/how-to/graphql-known-issue.md`. Resuming GraphQL is tracked with M7.
- [ ] **Remove `ORG_ID` dev fallback** — `.env` still has `ORG_ID`; the API no
      longer reads it (session actor is authoritative). Clean up env + docs.
- [ ] **Audit tests for cross-org access** — org-scoping is verified manually and
      by repo shape; add automated cross-org denial tests once a DB test harness
      exists (currently unit tests mock the DB).
- [ ] **MFA / SSO / passwordless** — future per `security-hipaa.md`; Better Auth
      plugins exist. Revisit after MVP.
- [ ] **`getPermissionsForRole` cache** — per-request memoized in middleware but
      not global; fine for now, revisit if authz becomes a hot path.

## Done

- [x] **M12 consultations/diagnoses/prescriptions** — repos + endpoints + UI (PRs #6/#8/#9).
- [x] **M13 medical record timeline** — repo + endpoint + UI (PR #10).
- [x] **M14 appointments CRUD** — repo + endpoints + UI (PR #11).
- [x] **M15 consultation PDF export** — endpoint + audit + UI button (PR #12).
- [x] **M16 audit log query + UI** — listAuditLogs + GET /audit + página (PR #13).

---

## Milestone linkage

- Audit login events → M16 (audit log UI) when that milestone starts.
- Role management endpoint → likely a Phase 1 admin slice; candidate for M11+.
- Automated tests M12–M16 → prerequisite to mark those modules fully `verified`.

---

## Post-audit 2026-08-10 gaps (UI/UX Refresh)

> Fuente: `docs/audits/2026-08-10-ui-ux/260810_CANICA_UI_UX_AUDIT_AND_ACTION_PLAN.md`  
> Tracker: `docs/ui-ux-refresh-progress.md`

### Phase 8 — Patient documents (blocked)

- [ ] **Storage contract decision** — Supabase Storage vs R2 vs otro. Requiere gate humano.
- [ ] **Attachment API endpoints** — upload, list, signed URL, delete. No existen en `apps/api`.
- [ ] **Attachment repository** — `packages/db` tiene schema `attachments` pero no repo functions.
- [ ] **Audit events** — `attachment.upload`, `attachment.read`, `attachment.delete` no existen.
- [ ] **Documents UI** — `apps/web/app/(dashboard)/patients/[id]/documents/page.tsx` no existe.
- [ ] **Spec changes** — `.specs/domain-model.md`, `.specs/security-hipaa.md`, `.specs/architecture.md` necesitan update antes de implementar.

### Phase 9 — Responsive + accessibility (in progress)

- [ ] **Keyboard-only navigation audit** — test all core journeys sin mouse.
- [ ] **Mobile/tablet breakpoints** — verificar 320, 390, 768, 1024, 1440px.
- [ ] **Audit table responsive** — transform a cards/rows en mobile.
- [ ] **Dialog focus trap** — verificar escape, return focus en todos los diálogos.
- [ ] **axe-core o equivalente** — integrar accessibility scanner en e2e si está aprobado en tech-stack.

### Phase 10 — Visual polish (planned)

- [ ] **Visual regression snapshots** — capturar light/dark por pantalla (login, dashboard, patients, chart, timeline, consultation, appointments, audit, settings).
- [ ] **Drift check** — no raw `text-2xl` sueltos, no colores hardcoded, radius consistente.
- [ ] **Animation audit** — confirmar no-overuse, `prefers-reduced-motion` correcto.
- [ ] **Definition of Done** — revisar 22 casillas del plan y reportar cuáles quedan fuera de scope.

### Residual from audit P0–P2

- [ ] **Dashboard role-based coverage** — endpoint summary existe (commit `3afcbe0`) pero cobertura real por rol (médico/admin/recepcionista) no validada contra `security-hipaa.md`.
- [ ] **N+1 patient lookups** — consultas y appointments hacen fetch individual por paciente. Necesita batch o response shaping.
- [ ] **Breadcrumbs** — no implementados en deep routes (patient chart, consultation detail, appointment detail).

---

## Historical — design-system-driven frontend rebuild (pre-audit, 2026-08-08)

> Este trabajo fue supersedido por el audit UI/UX de 2026-08-10. Las fases 1–7 del refresh
> incorporan y extienden lo que se hizo aquí. Se mantiene como referencia histórica.

### Completed (pre-audit)

- Fase 1: tokens + dark mode → absorbed into Phase 1 del refresh
- Fase 2: sidebar collapse + topbar → absorbed into Phase 4
- Fase 3: shared `packages/ui` components → absorbed into Phase 3
- Fase 4: pages (pacientes, consultas, timeline, citas, auditoría) → absorbed into Phase 5–6
- PHI-safe titles (`useSafePageTitle`) → absorbed into Phase 2
- Session timeout (5min + visibilitychange) → absorbed into Phase 2
- Motion tokens (motion-card, motion-page, motion-dialog) → absorbed into Phase 1
- Sidebar width tokens (72px/260px) → absorbed into Phase 4
- Topbar role Badge + `getRoleLabel()` → absorbed into Phase 4
- `packages/ui` → `apps/web` migration (18 files) → absorbed into Phase 3

### Still open from pre-audit

- [ ] **Avatar blur** — patient detail uses icon placeholder; defer until upload feature lands (Phase 8).

