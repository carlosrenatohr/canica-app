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

## Post-Fase-4 gap list (design-system-driven frontend rebuild)

Completed work (PRs in session): Fase 1 (tokens + dark mode), Fase 2 (sidebar collapse + topbar),
Fase 3 (shared `packages/ui` components), and Fase 4 pages (pacientes, consultas, timeline, citas, auditoría).
The following remain **scoped and explicitly deferred**:

### Fase 2 (layout)
- [x] **Dashboard role-based layout** — sidebar `Consultas` nav item missing; the role-aware nav
      (doctor/receptionist/admin) is wired via `user.role` but the schema field isn't seeded
      consistently. Defer until RBAC schema is final. Created `/consultations` top-level route
      and added nav item with `ClipboardList` icon.
- [x] **Drawer sidebar on mobile** — sidebar collapses to 72px/260px desktop but has no mobile drawer.
      Implemented mobile drawer with backdrop overlay, escape key close, and route change close.
      Uses `motion-dialog` class for reduced-motion compliance.

### Fase 5 (HIPAA-conscious UX)
- [x] **PHI-safe browser titles** — `/patients/[id]` page renders `{patient.firstName}` in
      `<title>`; per security spec, titles must not include PHI. Add `usePageTitle()` hook
      that emits generic titles (`Canica — Paciente`). **Open action.**
- [x] **Session timeout** — `SessionTimeout` component added with inactivity timer (5 min) and
      warning modal (30s prior). Wired into dashboard layout for global protection.
- [x] **Auto-lock on tab hidden** — `SessionTimeout` now checks `document.visibilityState`. When
      tab is hidden, timer shortens to 1 minute (HIPAA compliance). Restores normal timer when
      tab is visible again. Countdown shows remaining seconds in warning modal.
- [ ] **Avatar blur** — patient detail uses an icon placeholder; no avatar image blur-on-load
      behavior implemented yet. Defer until upload feature lands.

### Fase 6 (motion / polish)
- [x] **`motion-page` transition** — declared in globals and applied to dashboard layout root.
      Added reduced-motion guard in globals.css.
- [x] **Dialog animations** — `motion-dialog` token defined for future modals. Applied to
      mobile sidebar drawer for consistent transition behavior.
- [x] **Reduced-motion** — global `prefers-reduced-motion: reduce` rule sets
      `transition-duration: 0.01ms !important` for all elements. Specific guards added for
      `motion-card:hover` (scale), `motion-page` (opacity), and `motion-dialog` (opacity).
      Sidebar width transition uses `transition-[width]` which is covered by global rule.

### Technical debt / bugs caught during Fase 2–5 work
- [x] **`Sidebar` extra scroll container removed** during width-token refactor — confirm
      overflow-y behavior on sub-260px windows. (No regression observed in build.)
- [x] **`Topbar` role `Badge`** now renders `user.role` raw (lowercase); should be mapped to
      human-readable labels (Doctor / Recepcionista / Administrador). Created `src/lib/roles.ts`
      with `getRoleLabel()` mapping. Applied to topbar Badge component.
- [x] **`packages/ui` consumed by apps/web** — migrated all apps/web imports to
      `@canica/ui`, added workspace dependency + tsconfig path aliases, deleted duplicate
      `apps/web/src/components/ui/` directory. Added `@radix-ui/react-slot` + `@radix-ui/react-label`
      to packages/ui deps. EmptyState icon prop fixed (ElementType → React.ReactNode).
      Button now supports `asChild` via Radix Slot.

---

## Session summary (design-system-driven frontend rebuild)

### Completed this session
- **PHI-safe titles** — `useSafePageTitle` hook applied to all dashboard routes (patients, consultas, timeline, citas, auditoría, dashboard). Titles now show generic labels like "Paciente — Canica" instead of patient names.
- **Topbar role labels** — `getRoleLabel()` helper maps role strings to Spanish labels (Médico, Recepcionista, Administrador, etc.). Applied to topbar Badge component.
- **Session timeout** — 5-minute inactivity timer with 30-second warning modal, wired into dashboard layout globally. Added `visibilitychange` listener for HIPAA compliance (1-min lock when tab hidden).
- **Motion tokens** — `motion-card:hover` with `scale(1.01)` applied, guarded by `prefers-reduced-motion: no-preference`.
- **Motion-page** — applied to dashboard layout root for route transition animations.
- **Sidebar width tokens** — fixed to DS spec (72px/260px) with proper `transition-[width] duration-200 ease-out`.
- **Topbar role Badge** — user role now shown as `<Badge>` component instead of raw text.
- **Backlog updated** — all completed items marked with `[x]`, remaining gaps documented.

### Files modified this session
- `src/hooks/usePageTitle.ts` — new hook for PHI-safe browser titles
- `src/components/layout/sidebar.tsx` — width tokens 72px/260px, motion transition, added Consultas nav, mobile drawer with backdrop
- `src/components/layout/topbar.tsx` — role Badge, removed unused `cn` import, added getRoleLabel
- `src/lib/roles.ts` — new helper for human-readable role labels
- `app/(dashboard)/consultations/page.tsx` — new top-level consultations list page
- `app/(dashboard)/layout.tsx` — motion-page, SessionTimeout
- `app/(dashboard)/page.tsx` — useSafePageTitle("Dashboard")
- `app/(dashboard)/patients/page.tsx` — useSafePageTitle("Pacientes")
- `app/(dashboard)/patients/[id]/page.tsx` — useSafePageTitle("Paciente")
- `app/(dashboard)/patients/[id]/timeline/page.tsx` — useSafePageTitle("Historial clínico")
- `app/(dashboard)/patients/[id]/consultations/page.tsx` — useSafePageTitle("Consultas")
- `app/(dashboard)/patients/[id]/consultations/[consultationId]/page.tsx` — useSafePageTitle("Consulta")
- `app/(dashboard)/patients/[id]/consultations/new/page.tsx` — useSafePageTitle("Nueva consulta")
- `app/(dashboard)/appointments/page.tsx` — useSafePageTitle("Citas")
- `app/(dashboard)/appointments/new/page.tsx` — useSafePageTitle("Nueva cita")
- `app/(dashboard)/audit/page.tsx` — useSafePageTitle("Registro de auditoría")
- `app/globals.css` — motion-card:hover, motion-page, reduced-motion guards
- `src/components/dashboard/session-timeout.tsx` — new component (5min timeout + warning)

### Verification
- `tsc --noEmit` (web) ✓ 0 errors
- `tsc --noEmit` (ui) ✓ 0 errors
- `next build` ✓ all 12 routes compile
- prettier ✓ all files formatted

### Remaining explicit gaps (documented in backlog.md)
- Avatar blur (deferred until upload feature)

### packages/ui → apps/web migration (completed this session)
- Added `exports` map to `packages/ui/package.json`
- Added `@canica/ui: "workspace:*"` to `apps/web/package.json`
- Added path aliases in `apps/web/tsconfig.json`
- Installed missing deps: `@radix-ui/react-slot`, `@radix-ui/react-label`
- Added `asChild` prop to Button via Radix Slot
- Fixed EmptyState `icon` prop type (ElementType → React.ReactNode)
- Migrated all 18 apps/web files from `@/components/ui/*` → `@canica/ui`
- Deleted `apps/web/src/components/ui/` directory

