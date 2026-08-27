# Canica UI/UX Audit & Action Plan

**Status:** Draft for human review and approval  
**Date:** 2026-08-10  
**Audience:** The implementation agent, product owner, frontend engineers, reviewers, and QA  
**Scope:** Frontend experience, shared UI, frontend-adjacent API support, accessibility, responsive behavior, and regression safety  
**Source brief:** `260810_CANICA_REFRESH_UIUX.md`  

> This document is a plan, not an implementation. No redesign work should begin until a human reviewer explicitly approves this document and the implementation agent has converted the approved work into the required SDD task envelope.

## 1. Executive Summary

Canica already contains meaningful clinical functionality: authentication, role-aware access, patients, consultations, diagnoses, prescriptions, appointments, timelines, PDF export, and audit logs. The product is not an empty shell and its business logic must be preserved.

The frontend currently presents that functionality as an inconsistent, partially migrated interface. Some screens use semantic tokens, shared cards, skeletons, and a calm SaaS visual language. Other screens still use an older bare-form style. Several token classes are referenced but not defined, causing silent visual failures. Important links lead to 404 pages, one page contains a hooks-order bug, the global search does not filter anything, and several controls are visually present but functionally inert.

The quality problem is therefore not solved by changing colors alone. Canica needs a controlled frontend rehabilitation:

1. Stabilize broken visual and functional foundations.
2. Establish one coherent healthcare-grade design language.
3. Make the shared UI package the actual source of reusable primitives.
4. Rebuild navigation, dashboards, forms, lists, patient context, and feedback states around real workflows.
5. Add complete settings, appointment detail, and patient documents experiences without inventing fake data.
6. Protect all existing clinical, permission, audit, and persistence behavior with explicit tests.

The recommended direction is **Canica Clinical**: a warm, neutral-first interface with deep teal as the primary product accent and iris reserved for AI-generated or insight-oriented content. The result should feel calm, premium, efficient, and clinically trustworthy without looking like a generic admin template or a hospital ERP.

### Primary outcomes

- No broken semantic token classes in production UI.
- No known frontend 404 entry points.
- No route conflict at `/`.
- No React hooks-order violation.
- One consistent language: neutral professional Spanish.
- Complete light and dark themes with a user-controlled toggle.
- Keyboard-accessible navigation and interactive cards.
- Consistent states for loading, empty, error, success, disabled, and forbidden content.
- Reusable UI primitives actually used by `apps/web`.
- Complete settings, appointment detail, and patient documents flows.
- Authenticated Playwright coverage for the highest-risk journeys.
- Existing API contracts, permissions, audit behavior, and clinical data semantics preserved unless an approved spec change says otherwise.

### Non-negotiable quality bar

If Canica were shown to a serious US healthcare organization, the interface should read as a mature healthcare SaaS product rather than an internal CRUD application. Visual polish is subordinate to clarity, safety, accessibility, and workflow efficiency.

## 2. Product Understanding

### What Canica does

Canica is a healthcare SaaS platform for digital medical records and clinic operations. The current product supports:

- User authentication and session management.
- Organization-scoped roles and permissions.
- Patient records and patient search.
- Patient editing and archival behavior.
- Clinical consultations.
- Diagnoses and prescriptions associated with consultations.
- Patient timelines.
- Appointment creation and status management.
- PDF export of consultation information.
- Audit-log visibility for important actions.
- A planned AI layer that must remain visually identifiable and physician-confirmable.

The current API is an interim Hono/REST implementation. The architecture specification identifies GraphQL as the target product API, but GraphQL is currently parked. This UI plan must not silently introduce a parallel GraphQL migration. Any frontend-adjacent API work in this plan must use the existing API boundary unless a separate approved architecture decision changes that boundary.

### Current primary users

The existing interface is primarily for:

- **Physicians:** review patients, work through consultations, inspect histories, create clinical records, and manage follow-up work.
- **Clinic administrators:** manage operational data, users, appointments, and audit visibility according to permissions.
- **Reception or operations staff:** partially represented by appointment and patient workflows; the current role-specific experience must be verified against actual seeded roles before new dashboard content is invented.

### Patient-facing scope

There is no separate patient portal in the current frontend. Patient-facing onboarding, appointment self-scheduling, messages, and patient history are not to be invented as part of this refresh. They belong in a future product phase. The existing patient entity is clinical data viewed by authorized staff, not a patient-facing product surface.

### Important workflows

The implementation must preserve and validate these workflows:

1. Sign in and sign out.
2. Session timeout warning, continuation, and forced logout.
3. Load the role-appropriate dashboard.
4. Search for a patient globally and from the patient list.
5. Open a patient chart and retain patient context while navigating.
6. Create, edit, and archive a patient according to permissions.
7. Review the patient timeline.
8. Create and inspect a consultation.
9. Review diagnoses and prescriptions.
10. Export consultation information to PDF.
11. Create, inspect, and update an appointment.
12. Review the audit log and apply understandable filters.
13. Manage account, appearance, and session settings.
14. Upload, list, open/download, and remove patient documents only when authorized.

### Clinical safety principles

- Do not alter clinical persistence semantics as a visual side effect.
- Do not turn AI output into a silent clinical write.
- Make AI-generated content visually identifiable and physician-confirmable.
- Do not fabricate allergies, statuses, metrics, document metadata, or operational counts.
- Do not expose PHI in browser titles, notification previews, URLs where avoidable, or logs.
- Destructive actions require an accessible confirmation flow.
- Authorization is enforced on the server; hiding a navigation item is only an additional usability layer.

## 3. Current Architecture Summary

### Repository and package boundaries

The repository is a pnpm monorepo:

```text
apps/web          Next.js frontend
apps/api          Hono API / Worker-facing backend
packages/ui       Shared UI primitives and utilities
packages/auth     Authentication utilities
packages/db       Drizzle schema and repositories
packages/graphql  GraphQL work, currently parked
packages/sdk      Typed client boundary, target architecture
packages/types    Shared types
packages/validation Shared Zod schemas
packages/ai       AI providers and workflows
```

### Frontend stack observed

- Next.js 16 App Router.
- React 19.
- TypeScript 7+.
- Tailwind CSS v4 with CSS-first configuration.
- Geist Sans loaded by `apps/web/app/layout.tsx`.
- Lucide React icons.
- Radix primitives used by selected shared components.
- Class Variance Authority, `clsx`, and `tailwind-merge`.
- Better Auth client hooks.
- Existing frontend API helper in `apps/web/src/lib/api.ts`.

### Architectural constraints for the implementation agent

- Use `pnpm` only.
- Preserve the monorepo boundaries.
- Do not replace Next.js, Hono, Tailwind, Better Auth, or the persistence layer.
- Do not add a public REST domain API parallel to the approved API direction without an explicit architecture decision.
- Do not make the frontend call raw GraphQL or create ad-hoc feature-level API clients.
- Reuse `packages/ui` and `packages/validation` instead of creating local duplicates.
- Do not put AI provider SDKs in the web app or domain modules.
- Keep authorization and organization scoping server-side.
- Audit important PHI mutations and document operations.
- Do not log PHI, credentials, signed URLs, or document contents.

### Known tooling reality

- Root scripts include `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm e2e`, and `pnpm build`.
- Vitest has API and package unit tests, but frontend component coverage is minimal.
- Existing Playwright coverage is mostly anonymous smoke coverage.
- `apps/web` has a Playwright suite with a local web server configuration, but its trace option is misspelled (`traceOn` instead of `trace`).
- The root Playwright configuration does not start a web server.
- The Playwright MCP browser could not start because the configured Chrome distribution was unavailable at `/opt/google/chrome/chrome`. This is a known environment issue, not evidence that the application is visually correct.
- ESLint currently ignores TypeScript files globally and is known to fail in some packages because files are considered ignored. This must be reported separately from frontend redesign failures and should not be silently declared fixed by changing unrelated lint architecture.
- CI deploys but does not currently run the full verification suite.

## 4. Existing Design System

### Existing strengths to preserve

- `packages/ui` already contains a useful starting library.
- `globals.css` already contains semantic color, radius, shadow, motion, and typography concepts.
- Geist is already loaded and is a reasonable primary UI family.
- Lucide icons provide a consistent outlined icon language.
- `Card`, `Button`, `Badge`, `Skeleton`, `EmptyState`, `Tabs`, and `Logo` are already used on several screens.
- Reduced-motion handling is already present and must be retained.
- The existing patient detail header and timeline are closer to the target quality bar than the legacy forms.

### Existing UI package inventory

| Component | Current state | Action |
|---|---|---|
| `Button` | Used broadly; references undefined `ring-ring`; five variants | Preserve API where practical, fix tokens and dark contrast |
| `Input` | Used; semantic tokens mostly correct | Standardize labels, descriptions, invalid state, search variant |
| `Textarea` | Exists but consultation form bypasses it | Adopt everywhere |
| `Label` | Radix-based; includes junk class | Clean and standardize |
| `Card` | Good foundation; repeated hand-rolled card compositions remain | Preserve and create documented compositions |
| `Badge` | Used; hardcoded `ring-gray-200`; div semantics | Replace with semantic status treatment and appropriate role only when needed |
| `Tabs` | Used only in consultation detail; dark text bug | Fix contrast and use for patient context where appropriate |
| `Dialog` | Unused; close label remains English | Adopt for confirmation, session, and document actions |
| `Table` | Unused; audit page hand-rolls a table | Adopt for audit and dense operational views |
| `Breadcrumb` | Unused; uses plain anchors | Adopt on deep routes and use Next navigation semantics |
| `Pagination` | Unused | Adopt when API pagination is available |
| `EmptyState` | Used and useful | Standardize copy, icon, CTA, and loading/error relationship |
| `Skeleton` | Used in several pages | Add named composition patterns |
| `Avatar` | Unused; currently forces grayscale and blur | Fix privacy API and adopt only where real imagery exists |
| `Logo` | Used in sidebar | Preserve and check accessible naming |
| `utils/cn` | Duplicated in app and package | Consolidate imports without breaking package boundaries |

### Current token defects

The implementation plan must first remove or alias all legacy references. The following classes are used but not defined by the current CSS token system:

- `text-muted-foreground`.
- `text-destructive`.
- `border-input`.
- `bg-background`.
- `bg-background/60`.
- `ring-ring`.
- `ring-offset-background`.

The implementation must not solve this by adding an indiscriminate compatibility layer that hides bad naming forever. It should migrate usages to the approved semantic names, then retain aliases only if a concrete shared-package compatibility need exists.

## 5. UX Audit

### Cross-cutting findings

#### P0 findings

1. Two pages currently resolve toward `/`: `apps/web/app/page.tsx` and `apps/web/app/(dashboard)/page.tsx`. Establish one canonical root route and redirect or remove the other deliberately.
2. `apps/web/app/(dashboard)/appointments/page.tsx` calls `useMemo` after an early session return. Move all hooks before conditional returns or move the guard into a shared boundary.
3. The sidebar, topbar, and patient detail expose routes that do not exist: `/settings`, `/appointments/[id]`, and the patient Documents route.
4. Topbar search pushes `?search=` but the patients page does not read or apply the query parameter.
5. Session timeout logout redirects without reliably calling the auth sign-out operation.
6. Form error classes can be invisible because `text-destructive` is undefined.
7. The interface renders potentially false data as fact: a universal active badge, a hardcoded allergy statement, and zero dashboard counts when data loading fails.

#### P1 findings

1. Patients new/edit and consultation new belong to a legacy visual era and bypass shared patterns.
2. Destructive confirmation and PDF failure feedback use native `confirm()` and `alert()` rather than the existing accessible primitives.
3. Several list cards are clickable `<div>` elements without keyboard behavior or semantic links.
4. Audit filters expect users to know internal enum strings and audit rows show truncated UUIDs instead of meaningful actors.
5. Dashboard counts are calculated by fetching entire collections.
6. Consultations and appointments perform N+1 patient lookups.
7. Topbar buttons for notifications/settings are visually present but partly inert or route to 404 pages.
8. The topbar is inside the scrolling content column and is not persistent.

#### P2 findings

1. No pagination or large-data strategy is visible in patient, consultation, appointment, or audit views.
2. Empty states and skeletons are not yet represented by a shared page-level state contract.
3. Breadcrumbs are absent from deep clinical routes.
4. Mobile treatment for dense lists, tables, and detailed clinical layouts is not explicit.

### UX rules for all redesigned screens

- The primary action must be visually and semantically obvious.
- The page must communicate current loading, success, error, empty, disabled, and permission states.
- Every error must explain what happened and what the user can do next.
- Every destructive action must be reversible where domain behavior allows it, or confirmed with a clear consequence.
- Do not require users to remember internal enum values, UUIDs, or route structures.
- Use progressive disclosure for clinical depth, not decorative hiding of important safety information.
- Keep patient context visible inside a chart.

## 6. UI / Visual Audit

### Current visual problems

- Two incompatible form layouts: bare max-width forms and card-based, tokenized forms.
- Heading scale mixes custom classes (`text-display`, `text-h3`) with raw `text-2xl`, `text-3xl`, `text-sm`, and `text-xs`.
- Color and status mapping is duplicated across pages.
- The current primary Navy/Emerald implementation is too broad and lacks a reserved AI semantic channel.
- Overlays, errors, and focus rings are visually broken by undefined tokens.
- Cards are used as navigation without a clear link treatment.
- The audit table displays opaque identifiers and weak operational hierarchy.
- The dashboard is structurally clean but operationally shallow and fails silently on data errors.
- The current sidebar is functional but looks like a first-pass shell rather than a mature product chrome.
- Empty states are inconsistent: some use `EmptyState`, others use muted paragraphs.

### Visual principles for the target

- Warm neutral canvas; avoid a white wall of disconnected cards.
- Deep teal for product actions and active context, used sparingly.
- Iris only for AI/insight content.
- One clear surface hierarchy: page background, surface, elevated surface, overlay.
- Borders are quiet; hierarchy comes from spacing, typography, and selective elevation.
- Data-heavy screens may be dense in the content area but must retain calm chrome.
- Clinical status must use text/icon/shape in addition to color.
- Avoid gradients, decorative glass effects, cartoon medical illustrations, and excessive rounded containers.

## 7. Healthcare UX Findings

### Patient identity

- Patient name, date of birth/age, identifier, and relevant status must be clear and consistently ordered.
- Do not display a status badge unless it is sourced from actual patient status data.
- Do not invent allergies. Show a truthful unavailable state when allergy data is not in the current contract.
- Keep patient context in the patient chart header and deep clinical routes.

### Clinical workflows

- Consultation sections should visually distinguish incomplete draft information from finalized clinical information.
- Finalization must show a confirmation summary and preserve existing persistence semantics.
- Diagnosis and prescription statuses must use human-readable Spanish labels.
- AI-generated suggestions must use the iris channel and a clear "AI-generated" label until physician confirmation.

### Operational workflows

- Appointments need clear date, time, patient, provider, reason, and status hierarchy.
- Appointment status changes need explicit feedback and permission-aware actions.
- Audit records must remain auditable: meaningful actor/entity labels, exact timestamps, action labels, and filters that do not require database knowledge.

### Privacy-conscious UX

- Do not place PHI in document titles, browser titles, toast previews, or notification snippets unless necessary.
- Keep session timeout and auto-lock behavior visible but calm.
- Document operations must be permission checked, audited, and protected against leaking signed URLs.
- Never use blurred avatars as a substitute for actual authorization.

## 8. Accessibility Findings

### Current issues

- Interactive cards are often non-focusable `<div>` elements.
- Several search controls rely on placeholder text instead of an accessible label.
- Some native alerts/dialogs are inaccessible and inconsistent.
- Undefined focus-ring tokens weaken keyboard visibility.
- Some shared labels contain invalid or meaningless utility classes.
- A dialog close label remains in English.
- Some icon-only controls lack a reliable accessible name.

### Required baseline

- Target WCAG 2.2 AA for core workflows.
- All interactive elements keyboard reachable and operable.
- Focus rings visible in light and dark themes.
- Minimum 44px touch targets for primary controls.
- Labels separate from placeholders.
- Error messages associated with their fields and announced where appropriate.
- No color-only status communication.
- `aria-live` only for meaningful asynchronous feedback, not every visual change.
- Respect `prefers-reduced-motion`.
- Use semantic links for navigation and buttons for actions.
- Test with keyboard-only navigation and an automated accessibility scanner where available.

## 9. Responsive Findings

### Current issues

- Desktop grid assumptions dominate patient and consultation lists.
- Audit table does not have a defined mobile representation.
- Deep patient details need an intentional narrow-screen hierarchy.
- Topbar and sidebar behavior is not documented as a responsive system.

### Target responsive behavior

- **Desktop:** persistent sidebar, sticky topbar, wide clinical content, dense tables where justified.
- **Tablet:** collapsed sidebar or drawer, two-column layouts where content remains readable, filters may become a drawer.
- **Mobile:** drawer navigation, single-column cards, stacked patient header, horizontal tab scrolling or a compact menu, tables transformed to labeled records, dialogs become full-height sheets when necessary.
- Never merely shrink a desktop table until it is unreadable.
- Keep primary actions reachable without excessive scrolling.
- Test at minimum 1440px, 1024px, 768px, 390px, and 320px widths.

## 10. Functional Baseline

### Working or substantially working

- Authentication screens render and use Better Auth client behavior.
- Patients list/detail/new/edit flows exist.
- Consultations, diagnoses, prescriptions, and timeline flows exist.
- Appointment creation exists.
- PDF export exists.
- Audit log screen exists.
- Session timeout UI exists.
- Several pages have skeleton, empty, and error states.
- Server-side authorization and organization scoping exist in the backend layers and must remain authoritative.

### Working but visually problematic

- Patient new/edit forms.
- New consultation form.
- Global and patient lists.
- Audit table.
- Sidebar/topbar shell.
- Session timeout modal.
- Consultation detail empty states and raw status labels.

### Known broken or high-risk

- Duplicate `/` route ownership.
- React hooks-order violation in appointments.
- Broken `/settings` links.
- Appointment list links to missing appointment detail.
- Patient Documents tab points to a missing screen.
- Global search query is ignored.
- Session timeout logout does not reliably sign out.
- Undefined token classes produce incorrect or missing styling.
- Dark mode text contrast defects.
- Native `alert()`/`confirm()` flows.
- Hardcoded or misleading clinical display values.

### Unknowns requiring validation before implementation

- Exact role matrix and which roles should see each dashboard section.
- Existing appointment detail API shape and all allowed status transitions.
- Existing Supabase Storage conventions for attachments.
- Whether current organization settings data exists or must be introduced.
- Whether audit actor names can be resolved from existing repositories without a schema change.
- Whether patient allergy fields exist in the current data contract.
- Whether production currently uses the same route behavior as the local build.

## 11. Critical User Journeys

| Journey | Entry | Expected outcome | Main regression risk |
|---|---|---|---|
| Sign in | `/login` | Authenticated user reaches canonical dashboard | Session and redirect behavior |
| Sign out | User menu/session timeout | Session invalidated and user reaches login | Cookie/session remains active |
| Dashboard | `/` | Correct role view, truthful data, recoverable errors | Existing queries and role data |
| Global patient search | Topbar search | Patient list opens with applied query | Query parameter ignored |
| Create patient | Patients → New patient | Valid patient persisted and appears in list | Validation and API payload |
| Edit patient | Patient → Edit | Existing values preserved and update persists | Duplicate form drift |
| Archive patient | Patient detail → Archive | Confirmation, mutation, truthful status | Destructive action safety |
| Patient chart | Patient list → patient | Context remains visible across tabs | Deep route navigation |
| Timeline | Patient → Timeline | Events grouped and linked correctly | Event type/status mapping |
| Create consultation | Patient → New consultation | Draft consultation persists | Clinical field semantics |
| Consultation detail | Consultation list/detail | Sections, diagnoses, prescriptions render truthfully | Status and empty states |
| PDF export | Consultation detail | Download works or actionable error appears | Blob handling and PHI exposure |
| Create appointment | Appointments → New | Appointment persists with patient/provider/date | Date/time and status mapping |
| Appointment detail | Appointment list → item | Details and authorized actions work | Missing route/API contract |
| Audit review | Sidebar → Audit | Human-readable and filterable records | Actor/entity resolution |
| Documents | Patient → Documents | Authorized upload/list/open/delete with audit | Storage, signed URLs, PHI |
| Settings | Topbar/sidebar → Settings | Profile, theme, session preferences work | New route and persistence |

## 12. Screen-by-Screen Findings

### Root route `/`

- **Files:** `apps/web/app/page.tsx`, `apps/web/app/(dashboard)/page.tsx`.
- **Purpose:** Public/session gate versus authenticated dashboard.
- **Current problems:** Both route trees target `/`; copy is mixed language; public page is visually bare; dashboard query failures become fake zero counts.
- **Priority:** P0.
- **Recommendation:** Keep `/` as the intentional public landing/session gate and use `/dashboard` as the single authenticated dashboard route. Authenticated users reaching `/` are redirected to `/dashboard`; unauthenticated users see the public entry point. Do not leave two pages mapped to `/`.
- **Testing:** Anonymous root, authenticated root, role-specific root, data failure state.

### Login

- **File:** `apps/web/app/login/page.tsx`.
- **Current strengths:** Clear card shell, visible labels, loading state, Spanish labels.
- **Problems:** English subtitle/fallback, error not announced as an alert, plain anchor navigation.
- **Priority:** P1.
- **Recommendation:** Use the new brand palette, neutral Spanish copy, `next/link`, accessible error region, password guidance, and a consistent auth shell. Preserve Better Auth behavior.

### Signup

- **File:** `apps/web/app/signup/page.tsx`.
- **Problems:** Required raw organization UUID input, no network error handling, no password confirmation, English fallback.
- **Priority:** P0/P1.
- **Recommendation:** Replace UUID entry with an approved organization invitation/selection contract. If the backend cannot support that yet, keep the field technically compatible but present it as an explicit development-only flow and do not expose a fake production experience. Add try/catch, field errors, password confirmation if supported by validation, and neutral Spanish copy.

### Dashboard

- **File:** `apps/web/app/(dashboard)/page.tsx`.
- **Problems:** Full collections fetched only to calculate counts; role content is shallow; errors become zeros; "Consultations pending" links to patients.
- **Priority:** P1 after P0 stabilization.
- **Recommendation:** Create a truthful role-aware dashboard. Use server/API counts or a bounded summary query, preserve existing actions, and separate primary operational information, today's work, pending actions, and alerts. A loading state must not be confused with zero. Every failed card can retry or expose an actionable error.

### Patients list

- **File:** `apps/web/app/(dashboard)/patients/page.tsx`.
- **Problems:** Search lacks a label; cards are div navigation; active status is hardcoded; a decorative calendar icon has no meaning; archive handler is dead; no pagination strategy.
- **Priority:** P1.
- **Recommendation:** Use semantic links, real status data only, a reusable patient summary card, applied URL search state, pagination or bounded loading, and an intentional empty state. Preserve list query behavior and patient access permissions.

### New patient

- **File:** `apps/web/app/(dashboard)/patients/new/page.tsx`.
- **Problems:** Legacy bare layout, broken select/error tokens, duplicated form logic, no field-level validation presentation.
- **Priority:** P0/P1.
- **Recommendation:** Extract a shared patient form composition using existing Zod schemas and React Hook Form where supported. Use visible labels, descriptions, invalid state, consistent select, cancel behavior, and accessible submit feedback.

### Patient detail

- **File:** `apps/web/app/(dashboard)/patients/[id]/page.tsx`.
- **Current strengths:** Sticky header, visible patient context, useful summary/contact/audit cards.
- **Problems:** Documents route missing; allergies are hardcoded; active badge conditional is incorrect; tabs are buttons instead of semantic navigation.
- **Priority:** P0/P1.
- **Recommendation:** Preserve the overall composition. Replace fake values with truthful unavailable states, use route links or accessible tabs with correct URL behavior, add breadcrumbs, and integrate the complete Documents section.

### Edit patient

- **File:** `apps/web/app/(dashboard)/patients/[id]/edit/page.tsx`.
- **Problems:** Duplicated legacy form, broken tokens, plain loading text, no dirty-state protection.
- **Priority:** P1.
- **Recommendation:** Use the shared patient form with edit defaults, skeleton loading, dirty-form confirmation only when needed, and server validation handling.

### Patient timeline

- **File:** `apps/web/app/(dashboard)/patients/[id]/timeline/page.tsx`.
- **Current strengths:** Clear vertical timeline and event cards.
- **Problems:** Status/type mapping is duplicated; "most recent" uses warning semantics; deep navigation lacks consistent breadcrumb/context.
- **Priority:** P1/P2.
- **Recommendation:** Preserve the timeline. Extract event metadata and status mapping, use a neutral recency treatment, add filter semantics and responsive behavior, and preserve links to consultation details.

### Patient consultations list

- **File:** `apps/web/app/(dashboard)/patients/[id]/consultations/page.tsx`.
- **Problems:** Clickable div cards, duplicated status mapping, limited filters, legacy icon tile duplication.
- **Priority:** P1.
- **Recommendation:** Use reusable consultation cards with semantic links, truthful status labels, empty/loading/error states, and an obvious new consultation action.

### New consultation

- **File:** `apps/web/app/(dashboard)/patients/[id]/consultations/new/page.tsx`.
- **Problems:** Raw textarea bypasses `Textarea`, broken tokens, patient UUID may be shown while loading, sparse clinical flow, errors not consistently visible.
- **Priority:** P1.
- **Recommendation:** Migrate to the shared form field system, show patient context safely, preserve current API payload, and use progressive disclosure only where the current data model supports it. Do not invent clinical fields or silent AI writes.

### Consultation detail

- **File:** `apps/web/app/(dashboard)/patients/[id]/consultations/[consultationId]/page.tsx`.
- **Problems:** Native alert for PDF failure, raw enum statuses, inconsistent empty states, typo in copy, read-only "progress" framing.
- **Priority:** P1.
- **Recommendation:** Add shared status translation, accessible toast/dialog feedback, truthful section states, consistent tabs, clear finalized/draft treatment, and no implication of editing if no editing capability exists.

### Global consultations list

- **File:** `apps/web/app/(dashboard)/consultations/page.tsx`.
- **Problems:** N+1 patient fetches, no new/filters/pagination, clickable cards, undefined muted token.
- **Priority:** P1/P2.
- **Recommendation:** Use a bounded API response or batch patient resolution, semantic links, filters supported by actual API capabilities, and consistent list states.

### Appointments list

- **File:** `apps/web/app/(dashboard)/appointments/page.tsx`.
- **Problems:** Hooks-order violation, missing detail route, N+1 patient fetches, no filters or calendar strategy.
- **Priority:** P0.
- **Recommendation:** Fix hook order first. Add appointment detail route, use semantic links, extract status mapping, preserve date grouping, add filters, and define mobile card behavior. A calendar view is not required unless the current data and workflow justify it; list/grouped view is the first priority.

### New appointment

- **File:** `apps/web/app/(dashboard)/appointments/new/page.tsx`.
- **Current strengths:** Strongest current form composition and correct select tokens.
- **Problems:** Patient fetch errors are silently swallowed; provider identity is implicit; no explicit success feedback described.
- **Priority:** P1.
- **Recommendation:** Preserve the structure, improve error/retry behavior, explain provider context, use shared field components, and provide accessible success feedback.

### Appointment detail

- **File to create:** `apps/web/app/(dashboard)/appointments/[id]/page.tsx`.
- **Purpose:** View appointment context and authorized status/actions.
- **Priority:** P1.
- **Recommendation:** Add a real route and use the existing appointment contract. Include patient, provider, date/time, reason, status, notes where authorized, audit-relevant action feedback, and a safe status transition control. Do not invent billing or reminder features.

### Audit log

- **File:** `apps/web/app/(dashboard)/audit/page.tsx`.
- **Problems:** Hand-rolled table, truncated actor/entity IDs, raw internal enum filter input, no pagination/date-range strategy, English fragment.
- **Priority:** P1.
- **Recommendation:** Adopt `Table`, use readable labels with safe identifier fallback, select filters with human labels, date range when supported, pagination, and accessible status/action indicators. Never remove the underlying identifiers from the data contract; improve presentation.

### Settings

- **File to create:** `apps/web/app/(dashboard)/settings/page.tsx`.
- **Purpose:** Account, appearance, session/privacy, and available organization preferences.
- **Priority:** P1.
- **Recommendation:** Build a complete but bounded settings screen using existing data. Include profile summary, appearance/theme toggle, session/privacy explanation, logout, and only organization settings backed by real contracts. Do not fabricate clinic configuration fields.

### Patient documents

- **File to create:** `apps/web/app/(dashboard)/patients/[id]/documents/page.tsx`.
- **Purpose:** Authorized patient document management.
- **Priority:** P1 high risk, dependent on storage/API/spec work.
- **Recommendation:** Implement a real, minimal complete workflow: list metadata, upload allowed file types, upload progress, success/error state, open/download via short-lived signed URL, delete with confirmation, permission-aware empty state, and audit event. Do not display document contents in logs or expose permanent public URLs. If the storage contract is not available, stop at the dependency gate rather than shipping fake documents.

## 13. Component Audit

### Preserve

- `Button`, `Input`, `Card`, `Skeleton`, `EmptyState`, `Logo`, and the existing reduced-motion foundations.
- Existing Radix primitives where they solve keyboard and focus behavior.

### Redesign or consolidate

- `Badge` → semantic status component with text and optional icon; remove hardcoded gray ring.
- `Tabs` → fix dark contrast, focus, URL integration where navigation is involved.
- `Avatar` → support explicit privacy mode rather than always applying blur/grayscale.
- `Dialog` → standardize confirmation and action dialogs; translate close labels.
- `Table` → use in audit and other genuinely dense data contexts.
- `Breadcrumb` → use `Link` semantics and patient context.
- `Pagination` → connect to real API pagination only.
- `Label`, `Input`, `Textarea` → standardize descriptions, errors, required state, and IDs.

### New shared compositions

Create only if repeated patterns are verified during implementation:

- `PageHeader` for title, description, breadcrumbs, primary action.
- `StatusBadge` backed by one shared domain-to-label map.
- `IconTile` for the repeated icon-in-circle pattern.
- `PatientContextHeader` for deep chart pages.
- `FormField` for label, control, description, error, and required state.
- `ConfirmDialog` for destructive actions.
- `FeedbackToast` or a small toast provider for success/error feedback.
- `ListState` composition for loading, empty, error, and forbidden states.
- `StatCard` for truthful dashboard summary values.

Do not create a component for every one-off arrangement. Prefer composition over abstraction.

## 14. Recommended Visual Direction

### Design name

**Canica Clinical**

### Personality

Calm, precise, premium, warm, technically sophisticated, clinically serious, and human. It should reduce cognitive load rather than decorate medical workflows.

### Color direction

Use the palette below as the proposed replacement for the currently approved Navy/Emerald/Sky direction. Because this is a lasting user-visible decision, the implementation must update `.specs/design-system.md` before code changes and review consistency with `.specs/vision.md`, `.specs/security-hipaa.md`, and `.specs/roadmap.md`.

#### Light theme tokens

```css
--color-primary: #0F766E;
--color-primary-hover: #115E59;
--color-primary-light: #CCFBF1;
--color-ai: #4F46E5;
--color-ai-hover: #4338CA;
--color-ai-light: #EEF2FF;
--color-info: #0284C7;
--color-info-light: #E0F2FE;
--color-success: #16A34A;
--color-warning: #D97706;
--color-danger: #DC2626;
--color-bg: #FAFAF9;
--color-surface: #FFFFFF;
--color-surface-elevated: #FFFFFF;
--color-secondary-bg: #F5F5F4;
--color-border: #E7E5E4;
--color-text: #1C1917;
--color-muted: #78716C;
```

#### Dark theme tokens

```css
--color-primary: #2DD4BF;
--color-primary-hover: #5EEAD4;
--color-primary-light: #134E4A;
--color-ai: #A5B4FC;
--color-ai-hover: #C7D2FE;
--color-ai-light: #312E81;
--color-info: #38BDF8;
--color-info-light: #0C4A6E;
--color-success: #4ADE80;
--color-warning: #FBBF24;
--color-danger: #F87171;
--color-bg: #0B1120;
--color-surface: #111A2E;
--color-surface-elevated: #1A2540;
--color-secondary-bg: #182338;
--color-border: #293750;
--color-text: #F1F5F9;
--color-muted: #94A3B8;
```

The implementation must verify contrast for text, controls, focus rings, badges, and disabled states. Brand colors must not be used as a substitute for semantic status colors. The iris channel must not be used for arbitrary decoration.

### Typography

- Use Geist Sans as the primary family.
- Use one documented scale: display 40px, H1 32px, H2 24px, H3 20px, body 16px, small 14px, caption 12px.
- Use weights 400–700 only.
- Remove raw page-level typography classes where the semantic scale applies.
- Never use placeholder text as the only field label.

### Surfaces, radius, and elevation

- Page background: warm neutral.
- Surface: white/light dark card.
- Elevated: only for dialogs, menus, and purposeful emphasis.
- Buttons: 12px radius.
- Inputs: 14px radius.
- Cards: 18px radius.
- Dialogs: 24px radius where appropriate.
- Use subtle shadows only; do not stack multiple shadows on every card.
- Use borders selectively, especially for data tables and form grouping.

### Iconography and motion

- Lucide, outlined, consistent 2px stroke.
- Icon-only buttons require accessible names and visible focus.
- Motion durations: 150ms, 200ms, 250ms maximum.
- Ease-out transitions; no bounce.
- Respect reduced motion globally and at component level.

## 15. Design System Recommendations

### Foundations

Implement and document:

- Semantic light/dark color tokens.
- Surface hierarchy.
- Typography scale.
- Spacing scale and page gutters.
- Radius tokens.
- Shadow/elevation tokens.
- Motion tokens and reduced-motion rules.
- Breakpoints and responsive behavior.
- Focus-ring tokens.
- Status and AI semantic colors.

### Component contracts

Every shared component must define:

- Keyboard behavior.
- Focus behavior.
- Disabled behavior.
- Invalid/error behavior where relevant.
- Light/dark appearance.
- Responsive behavior where relevant.
- Accessible name/description requirements.

### State patterns

Each major screen must have a predictable state model:

```text
session pending
loading
loaded with data
loaded empty
recoverable error
forbidden
mutation pending
mutation success
mutation error
```

Do not render fake zero values while a request failed. Do not render an empty state while data is still loading.

### Package hygiene

- Runtime Radix dependencies used by `packages/ui` must be declared as runtime dependencies of that package.
- Do not create a second `cn` implementation unless a package boundary truly requires it.
- Keep app-specific compositions in `apps/web`; keep reusable primitives in `packages/ui`.

## 16. Navigation & Information Architecture

### Target root navigation

Maximum seven root sections, role-aware:

1. Overview.
2. Patients.
3. Appointments.
4. Consultations/Clinical.
5. Audit.
6. Settings.
7. Administration only when the role is authorized.

Do not show a link to an unimplemented route. Do not rely on client-side hiding for authorization.

### Sidebar

- Desktop expanded width around 260px; collapsed width around 72px.
- Persist collapse preference only if this does not introduce unnecessary client complexity.
- Active state must be obvious without excessive saturated color.
- Mobile uses a drawer with accessible focus handling and an overlay that actually dims.
- Navigation labels use neutral Spanish.

### Topbar

- Keep sticky within the main shell.
- Provide labeled global patient search that actually applies the query.
- Provide working theme toggle or an obvious settings entry point.
- Provide a real user menu with profile/settings/logout actions.
- Keep notifications hidden or explicitly marked as unavailable until a real notification contract exists; do not ship inert decorative controls.

### Deep navigation

- Use breadcrumbs on patient, consultation, appointment, audit, settings, and documents routes where they reduce disorientation.
- Use links for route changes and buttons for mutations.
- Preserve browser back behavior.
- Do not use a generic "Back" button as the only way to navigate deep pages.

## 17. Dashboard Strategy

### Dashboard rule

The dashboard must answer: **What do I need to know and what do I need to do right now?**

### Doctor view

Only render data supported by current contracts:

- Today's patients or appointments.
- Next appointment.
- Draft/pending consultations if available.
- Clinically relevant alerts if the backend provides them.
- Recent patient/consultation activity if permission allows.

### Administrative/operations view

- Operational appointment summary.
- Patient and consultation counts from bounded summary queries.
- Pending operational actions.
- Audit activity where authorized.

Do not display reception, billing, clinic, or payment metrics unless the current product contract supports them. The old design document's role examples are direction, not permission to invent data.

### Technical requirements

- Prefer a dedicated summary/count API query over fetching full collections.
- Show skeletons while loading.
- Show a retryable error state when a summary fails.
- Preserve links/actions from the current dashboard unless they are proven incorrect.
- Add tests for role differences and failure states.

## 18. Patient Experience

This section refers to the staff-facing patient chart experience, not a patient portal.

### Patient list

- Search first, clear create action, truthful status.
- Card or table presentation based on data density; cards are acceptable for moderate datasets, but do not force cards if pagination and operational density require a table.
- Keyboard-accessible navigation.
- URL-persisted query where useful.
- Clear no-results state distinct from no-patients state.

### Patient chart

- Persistent patient identity header.
- Summary first, clinical depth progressively disclosed.
- Timeline, consultations, and documents as real navigable sections.
- No fake allergies or metadata.
- Archive action protected by accessible confirmation.

### Patient form

- One shared create/edit form.
- Visible labels and field descriptions.
- Inline validation connected to controls.
- Preserve existing API payload and validation constraints.
- Do not add clinical fields without updating the domain/spec contract.

## 19. Doctor Experience

- Optimize for scan speed: patient name, appointment state, next action, and clinical status first.
- Keep patient context visible on consultation and timeline screens.
- Use meaningful status labels instead of raw backend enums.
- Make draft/finalized state unmistakable.
- Do not hide critical clinical information behind decorative interaction.
- Keep common actions close to the content they affect.
- Avoid excessive confirmation for safe navigation; require confirmation for destructive or clinical-finalization actions.
- Reserve iris for AI-generated content, never use it to imply physician validation.

## 20. Admin Experience

- Preserve information density where it helps operations.
- Use filters with human-readable options.
- Use tables for audit and other genuinely tabular data.
- Provide pagination or bounded results before large datasets are exposed.
- Show actor/entity labels rather than only truncated UUIDs.
- Keep permission-based visibility and server-side authorization intact.
- Settings should not expose controls that have no persistence contract.

## 21. Responsive Strategy

### Desktop

- Two-column patient/chart layouts where readability supports it.
- Sticky patient context where appropriate.
- Dense but calm audit table.
- Sidebar and sticky topbar.

### Tablet

- Collapsed sidebar or drawer.
- Collapse two-column clinical summaries when width is insufficient.
- Move complex filters into a sheet/drawer.
- Keep primary action visible.

### Mobile

- Single-column content.
- Full-width primary actions where appropriate.
- Patient header stacks identity and actions.
- Tabs become horizontally scrollable or a compact accessible selector.
- Tables become labeled cards/rows, not clipped horizontal content by default.
- Dialogs can become bottom sheets/full-height sheets while preserving focus trapping.
- Upload controls must work with touch and provide progress/error feedback.

## 22. Accessibility Strategy

### Implementation checklist

- Replace clickable div navigation with `Link`/`a` or keyboard-operable buttons.
- Add accessible labels to topbar search, patient search, icon-only buttons, and filter controls.
- Connect error text with `aria-describedby` and invalid controls with `aria-invalid`.
- Use `role="alert"` or `aria-live` only for actionable asynchronous errors/success.
- Add visible `:focus-visible` rings using semantic tokens.
- Verify dialog focus trap, close behavior, escape handling, and return focus.
- Ensure dark theme contrast for every semantic variant.
- Use semantic headings in order.
- Keep status meaning in text and icon, not color alone.
- Test keyboard flow through patient creation, archive confirmation, appointment creation, PDF failure, settings, and documents.

### Automated checks

Add an accessibility audit to high-value Playwright routes if the approved toolchain permits it. If no axe dependency is approved, use browser assertions and manual keyboard checklists without adding an unnecessary dependency.

## 23. Interaction & Motion Strategy

- Button hover/press states must communicate action without layout shift.
- Cards may use subtle elevation/transform only when they are interactive and reduced motion permits it.
- Skeletons should reflect the final content shape.
- Toasts confirm successful mutations; errors remain visible long enough to read and provide next action.
- Confirmation dialogs explain consequence and primary/destructive labels.
- Navigation transitions must not delay clinical work.
- Theme changes must not flash incorrect colors or lose the current route.
- Session timeout countdown must remain understandable and accessible.
- Upload progress must communicate active, succeeded, failed, and canceled states.

## 24. Testing Strategy

### Unit tests

Add or extend Vitest coverage for:

- Status-to-label and status-to-variant mappings.
- Age/date formatting if extracted.
- Patient search query parsing.
- Dashboard summary state mapping.
- Document file validation and metadata mapping.
- Theme preference parsing/persistence helpers.
- Safe page title handling with accented Spanish characters.

Do not test implementation details of presentational components when behavior can be verified through user-facing tests.

### Integration/API tests

Where API changes are introduced, add tests for:

- Organization scoping.
- Permission denial.
- Dashboard summary counts.
- Patient search filtering.
- Appointment detail and allowed status transitions.
- Audit actor/entity resolution.
- Document upload metadata validation.
- Signed URL authorization and expiration behavior.
- Document delete audit event.

No PHI should appear in test logs or fixtures beyond the minimum synthetic seed data.

### End-to-end tests

Expand Playwright from anonymous smoke coverage to authenticated workflows using seeded synthetic users. Prefer stable role/label/test IDs over CSS structure selectors.

Required core suite:

1. Anonymous root and login render.
2. Successful doctor login.
3. Successful administrator login.
4. Dashboard loads without fake zero values on success.
5. Dashboard failure shows retryable error.
6. Global patient search applies the query.
7. Patient list card/link is keyboard accessible.
8. Create patient.
9. Edit patient.
10. Archive patient confirmation and resulting state.
11. Patient chart navigation across summary/timeline/consultations/documents.
12. Create consultation.
13. Consultation detail tabs and human-readable statuses.
14. PDF export success or actionable failure.
15. Create appointment.
16. Appointment detail and authorized status action.
17. Audit filters and readable actor/entity display.
18. Settings theme toggle and persistence.
19. Session timeout continuation and forced logout.
20. Documents upload/list/open/delete with a synthetic file and permission coverage.

### Visual regression

Capture stable screenshots at light and dark themes for:

- Login.
- Dashboard for doctor and admin.
- Patient list with data and empty state.
- Patient chart summary.
- Timeline.
- Consultation detail.
- Appointment list and appointment detail.
- Audit table.
- Settings.
- Documents empty, upload progress, and populated state.

Use visual snapshots to detect accidental regressions, not to force pixel identity when intentional design changes are approved.

### Build, lint, and type checks

At minimum, run:

```bash
pnpm typecheck
pnpm test
pnpm build
cd apps/web && pnpm e2e
```

Run `pnpm lint` and report known repository lint failures separately. Do not widen the redesign scope by silently rewriting lint configuration unless that is explicitly approved as a separate task.

## 25. Prioritized Action Plan

### P0 — Critical

| ID | Action | Files/area | Impact | Effort | Risk |
|---|---|---|---|---|---|
| P0-01 | Resolve duplicate `/` route ownership | `apps/web/app/page.tsx`, dashboard page | High | Medium | Medium |
| P0-02 | Fix appointments hooks-order violation | appointments page | High | Low | Low |
| P0-03 | Replace undefined semantic token usages | `globals.css`, shared components, forms | High | Medium | Medium |
| P0-04 | Fix dark-mode contrast and focus tokens | globals, Button, Badge, Tabs, timeout | High | Medium | Medium |
| P0-05 | Make session timeout logout invalidate the session | session timeout/auth client | High | Low | High |
| P0-06 | Remove fake dashboard zero/error behavior | dashboard data state | High | Medium | Medium |
| P0-07 | Remove fake patient/allergy status claims | patient pages | High | Low | Medium |
| P0-08 | Eliminate known 404 entry points or implement routes before exposing them | settings, appointment detail, documents | High | High | High |
| P0-09 | Keep PHI/authz behavior intact and audit any new document mutation | backend boundaries | High | High | High |

### P1 — High

| ID | Action | Impact | Effort | Risk |
|---|---|---|---|---|
| P1-01 | Update design spec and implement Canica Clinical palette | High | Medium | Medium |
| P1-02 | Add full theme toggle and persistence | High | Medium | Medium |
| P1-03 | Rebuild sticky topbar and role-aware sidebar | High | Medium | Medium |
| P1-04 | Make global search functional | High | Medium | Medium |
| P1-05 | Adopt Dialog, Table, Breadcrumb, Avatar, Pagination where justified | High | Medium | Medium |
| P1-06 | Extract shared patient form | High | Medium | Medium |
| P1-07 | Migrate legacy consultation form | High | Medium | Medium |
| P1-08 | Rebuild dashboard around truthful role-based summaries | High | High | Medium |
| P1-09 | Create appointment detail screen | High | Medium | Medium |
| P1-10 | Create complete settings screen backed by real data | Medium | Medium | Medium |
| P1-11 | Improve audit table and filters | High | Medium | High |
| P1-12 | Expand authenticated E2E safety net | High | High | Medium |

### P2 — Medium

| ID | Action | Impact | Effort | Risk |
|---|---|---|---|---|
| P2-01 | Implement complete documents experience and storage integration | High | High | High |
| P2-02 | Remove N+1 patient lookups through API batching/response shaping | Medium | High | Medium |
| P2-03 | Add pagination to large operational screens | Medium | Medium | Medium |
| P2-04 | Add responsive audit/table transformations | Medium | Medium | Low |
| P2-05 | Standardize empty/loading/error/forbidden compositions | Medium | Medium | Low |
| P2-06 | Add breadcrumbs and deep-route context | Medium | Low | Low |
| P2-07 | Add visual regression snapshots | Medium | Medium | Low |

### P3 — Low

- Refine illustration language for empty states without using stock medical imagery.
- Add carefully selected non-essential microinteractions.
- Explore a command palette only after global search has a reliable contract.
- Add calendar view only if appointment workflows demonstrate a real need.
- Add a patient portal only through a separate product/spec phase.

## 26. Impact / Effort Matrix

### High impact / low-to-medium effort: do first

1. Resolve duplicate root route.
2. Fix hooks-order bug.
3. Replace undefined tokens.
4. Fix dark contrast and focus rings.
5. Fix session timeout sign-out.
6. Remove false status/allergy/dashboard values.
7. Migrate legacy forms to shared patterns.
8. Make cards and navigation keyboard accessible.
9. Make global search functional.

### High impact / high effort: schedule with gates

1. Role-aware dashboard summary architecture.
2. Complete appointment detail.
3. Complete settings.
4. Patient documents and storage.
5. Authenticated E2E suite.

### Medium impact / medium effort: follow core flows

1. Audit redesign and pagination.
2. Shared state compositions.
3. Responsive table strategy.
4. N+1 reduction.
5. Visual snapshots.

### Low impact or speculative: defer

1. Decorative illustrations.
2. Command palette before search contract.
3. Calendar view without workflow evidence.
4. Patient portal.

## 27. Implementation Phases

### Phase 0 — Baseline and SDD gate

**Objective:** Establish an honest before-state and obtain approval for lasting behavior changes.

Steps:

1. Read `AGENTS.md`, `.specs/README.md`, relevant `.specs/` documents, this plan, and the existing design documents.
2. Create the SDD task envelope.
3. Update `.specs/design-system.md` for the approved Canica Clinical palette and Spanish-neutral UI direction before changing code.
4. Review security and domain impact for settings, documents, and session behavior.
5. Fix or document Playwright browser setup before relying on visual tests.
6. Run the existing typecheck, tests, build, and web E2E baseline.
7. Capture baseline screenshots if the browser environment works.
8. Record all pre-existing failures separately.

**Exit criteria:** Human-approved spec changes, reproducible baseline, known test failures documented.

### Phase 1 — Foundation and token repair

**Objective:** Make the visual substrate correct before redesigning screens.

Steps:

1. Replace current palette tokens with approved Canica Clinical tokens.
2. Define focus-ring, input, destructive, background, foreground, surface, and overlay semantics explicitly.
3. Remove invalid `var()/alpha` CSS syntax in `.btn-ghost:hover`.
4. Remove or migrate legacy `text-muted-foreground`, `text-destructive`, `border-input`, `bg-background`, `ring-ring`, and related classes.
5. Unify light/dark theme resolution and prevent incorrect-theme flash.
6. Decide whether system preference is the initial default and persist explicit user choice.
7. Keep `prefers-reduced-motion` behavior.
8. Add a small token/component verification page or test fixture if useful.

**Exit criteria:** No undefined token class remains in changed frontend code; light and dark screenshots show readable controls and overlays.

### Phase 2 — P0 functional stabilization

**Objective:** Remove blockers before visual work obscures them.

Steps:

1. Resolve `/` route ownership.
2. Move appointments hooks before conditional returns or centralize the session guard.
3. Fix session timeout sign-out and redirect behavior.
4. Preserve accented Spanish characters in safe page titles.
5. Remove fake dashboard zero-on-error behavior.
6. Remove hardcoded patient status/allergy claims.
7. Replace known dead links with implemented routes or temporarily block them until the corresponding phase is complete.

**Exit criteria:** P0 regression tests pass and no known broken route is exposed by navigation.

### Phase 3 — Shared UI and state compositions

**Objective:** Stop page-by-page visual drift.

Steps:

1. Fix and document `Button`, `Input`, `Textarea`, `Label`, `Badge`, `Tabs`, `Dialog`, `Table`, `Breadcrumb`, `Avatar`, and `Skeleton`.
2. Move runtime Radix packages to the correct package dependency section.
3. Add `PageHeader`, `StatusBadge`, `IconTile`, `FormField`, `ConfirmDialog`, `ListState`, and `StatCard` only where repeated usage is demonstrated.
4. Consolidate status label/variant maps.
5. Consolidate the duplicate `cn` utility where safe.
6. Add accessible names and keyboard behavior to icon-only controls.

**Exit criteria:** Shared components render correctly in both themes and at least two consuming screens use each new shared composition where applicable.

### Phase 4 — Navigation and application chrome

**Objective:** Make the product feel coherent before redesigning individual modules.

Steps:

1. Build a sticky topbar inside a stable shell.
2. Add a functional global patient search.
3. Add a real theme toggle.
4. Build a working user menu and settings route.
5. Remove or implement inert notification controls.
6. Make sidebar links role-aware and free of 404s.
7. Add breadcrumbs/deep context.
8. Preserve mobile drawer focus and Escape behavior.

**Exit criteria:** All visible chrome actions work, navigation is keyboard accessible, and no shell link targets a missing page.

### Phase 5 — Forms and core patient workflows

**Objective:** Replace the legacy form era without changing data semantics.

Steps:

1. Extract shared patient create/edit form.
2. Use validation schemas from `packages/validation`.
3. Migrate all patient form fields to shared controls.
4. Migrate consultation textarea and form fields.
5. Add field-level errors and accessible descriptions.
6. Add unsaved-change handling only where editing can actually lose work.
7. Preserve API payloads, permissions, and routing.

**Exit criteria:** Create/edit patient and create consultation E2E flows pass; no duplicate form markup remains without a documented reason.

### Phase 6 — Dashboard, lists, and clinical detail

**Objective:** Make the most-used screens operationally clear.

Steps:

1. Implement role-aware dashboard summaries using truthful data.
2. Add bounded summary/count API support if required.
3. Redesign patients list with functional search and accessible navigation.
4. Preserve and refine patient detail header/context.
5. Refine timeline and consultations screens.
6. Add human-readable status translation.
7. Replace native alert/confirm with accessible dialog/toast patterns.
8. Add appointment detail and connect appointment list links.
9. Redesign audit table and filters.

**Exit criteria:** Core authenticated journeys pass; no fake data is rendered; all state variants are covered.

### Phase 7 — Settings and account experience

**Objective:** Make all existing shell actions meaningful.

Steps:

1. Build settings page using real user/session data.
2. Add theme preference control.
3. Add profile/session/privacy information supported by current contracts.
4. Keep organization/admin controls constrained to backed behavior.
5. Add logout and session behavior tests.

**Exit criteria:** Settings route works for authorized roles, theme preference persists, and no unsupported controls are shown.

### Phase 8 — Patient documents

**Objective:** Deliver the complete Documents route selected by the product owner, without fake storage behavior.

#### Required scope

- Patient document list with name/type/size/date/status metadata.
- Authorized upload with allowed file types and size limits.
- Upload progress and retryable failure.
- Empty state explaining the next action.
- Open/download through short-lived authorized signed URLs.
- Delete with confirmation and server-side authorization.
- Audit events for upload, access/download where required, and delete.
- No public permanent URLs.
- No document bytes or PHI in logs.

#### Dependency gate

This phase depends on the storage contract and the attachments work represented by board task #07. The implementation agent must first inspect existing Supabase Storage conventions, database metadata needs, permission checks, and audit requirements. If the storage contract cannot be completed safely in the current work item, the agent must stop the Documents phase and report the blocker rather than ship a fake interface. The Documents tab must not expose non-functional controls.

#### Required spec changes

- `.specs/domain-model.md` if a document/attachment entity or metadata changes.
- `.specs/security-hipaa.md` for access, signed URL, retention, and audit behavior.
- `.specs/architecture.md` if storage/API boundaries change.
- `.specs/roadmap.md` if #07 sequencing changes.

**Exit criteria:** A synthetic file can be uploaded, listed, opened/downloaded, and deleted by an authorized user; unauthorized access is denied; mutations are audited; no PHI leaks into logs.

### Phase 9 — Responsive and accessibility hardening

**Objective:** Make the redesigned product work on real viewport sizes and input methods.

Steps:

1. Test desktop/tablet/mobile layouts.
2. Transform dense tables intentionally on small screens.
3. Test keyboard navigation through all critical journeys.
4. Verify focus, labels, errors, dialogs, and touch targets.
5. Verify light/dark contrast.
6. Verify reduced motion.

**Exit criteria:** Accessibility and responsive checklist passes for high-value screens.

### Phase 10 — Visual polish and regression closure

**Objective:** Apply final quality polish only after correctness is proven.

Steps:

1. Run visual snapshots at approved viewport/theme combinations.
2. Remove remaining raw color/typography drift.
3. Refine spacing and hierarchy.
4. Confirm no unnecessary animation or decoration was introduced.
5. Run typecheck, tests, build, E2E, and lint reporting.
6. Review the final diff against this plan and all updated specs.

**Exit criteria:** Definition of Done is fully met and residual risks are explicitly reported.

## 28. E2E Regression Checklist

### Authentication and session

- [ ] Anonymous user can load public root.
- [ ] Login shows accessible validation errors.
- [ ] Valid doctor login reaches the correct dashboard.
- [ ] Valid admin login reaches the correct dashboard.
- [ ] Logout invalidates session and prevents authenticated access.
- [ ] Session timeout warning can be dismissed by continuing.
- [ ] Session timeout forced logout invalidates session.

### Navigation and search

- [ ] `/` has one canonical owner.
- [ ] Sidebar links do not produce 404s.
- [ ] Topbar search applies the patient query.
- [ ] Settings link opens a real settings screen.
- [ ] Deep patient/consultation/appointment routes show useful context.
- [ ] Keyboard can traverse navigation and interactive cards.

### Patient workflows

- [ ] Patient list loading, data, empty, no-results, error, and forbidden states render correctly.
- [ ] Create patient succeeds with valid data.
- [ ] Invalid patient data shows visible field errors.
- [ ] Edit patient loads existing values and persists changes.
- [ ] Archive requires accessible confirmation.
- [ ] Patient chart shows truthful identity/status information.
- [ ] Timeline links open the correct consultation.
- [ ] Patient Documents route is accessible only when authorized.

### Clinical workflows

- [ ] New consultation preserves patient context.
- [ ] New consultation validation is visible and associated with fields.
- [ ] Consultation detail shows human-readable statuses.
- [ ] Diagnoses/prescriptions tabs work in both themes.
- [ ] PDF export succeeds or shows an actionable non-native error.
- [ ] AI-labeled content, if present, is visibly distinct and not silently finalized.

### Appointment workflows

- [ ] Appointments list loads without hooks-order errors.
- [ ] Appointment status labels are human-readable.
- [ ] Appointment item opens appointment detail.
- [ ] Appointment creation handles patient-loading failure visibly.
- [ ] Appointment detail shows authorized actions only.
- [ ] Status transition gives success/error feedback and preserves server behavior.

### Audit and documents

- [ ] Audit filter controls use human-readable values.
- [ ] Audit actor/entity display remains useful even when a name is unavailable.
- [ ] Audit pagination/bounded loading behaves predictably.
- [ ] Authorized document upload works with a synthetic file.
- [ ] Document upload failure is retryable.
- [ ] Document open/download uses authorization and does not expose a permanent URL.
- [ ] Document delete requires confirmation and creates the expected audit event.
- [ ] Unauthorized document operations are denied.

### Theme and responsive checks

- [ ] Theme toggle changes the current UI without route loss.
- [ ] Explicit theme preference persists after reload.
- [ ] Light theme has no low-contrast controls.
- [ ] Dark theme has no white-on-light primary controls.
- [ ] Screens pass at desktop, tablet, and mobile target widths.
- [ ] Reduced-motion mode does not break interaction.

## 29. Definition of Done

The redesign is complete only when all of the following are true:

### Product and UX

- [ ] The interface uses neutral professional Spanish consistently.
- [ ] The Canica Clinical palette is approved and reflected in `.specs/design-system.md` and implementation tokens.
- [ ] Light and dark themes are complete, user-toggleable, persistent, and readable.
- [ ] Navigation is coherent, role-aware, and free of exposed 404 links.
- [ ] Dashboard content is role-aware only where real data supports it.
- [ ] Patient, consultation, appointment, audit, settings, and documents journeys are explicit and testable.
- [ ] Loading, empty, error, success, disabled, and forbidden states exist for major workflows.

### Functional safety

- [ ] No duplicate root route remains.
- [ ] The appointments hooks-order defect is fixed.
- [ ] Session timeout logout truly invalidates the session.
- [ ] No fake status, allergy, or error-as-zero display remains.
- [ ] Existing permissions, org scoping, clinical persistence, and audit behavior remain intact.
- [ ] Document operations are authorized, audited, and storage-backed if the Documents phase is marked complete.

### Engineering quality

- [ ] Shared UI primitives are used instead of avoidable local duplicates.
- [ ] Undefined token classes are removed from changed code.
- [ ] Runtime dependencies are declared in the correct package.
- [ ] No unnecessary framework or infrastructure rewrite was introduced.
- [ ] `pnpm typecheck` passes.
- [ ] `pnpm test` passes or all pre-existing failures are documented.
- [ ] `pnpm build` passes.
- [ ] `cd apps/web && pnpm e2e` passes.
- [ ] `pnpm lint` is run and known repository-level lint failures are separately documented.

### Accessibility and regression

- [ ] Keyboard navigation works for all core journeys.
- [ ] Labels, errors, focus, dialog behavior, contrast, and reduced motion meet the agreed baseline.
- [ ] Visual regression snapshots are reviewed for approved changes.
- [ ] The final implementation diff has been reviewed against this plan and the updated specs.

## 30. Risks & Warnings

### Documents and PHI storage — high risk

Documents are not a cosmetic route. They introduce or complete storage, metadata, authorization, signed URLs, audit, file validation, and potentially retention behavior. Do not ship mock upload buttons or local-only state. Require the SDD spec gate and security review.

### Palette change — product decision

The proposed teal/iris palette supersedes the current approved Navy/Emerald/Sky direction. The implementation agent must not change `.specs/design-system.md` silently. The spec change must be reviewed and then implemented consistently.

### API boundary drift

The current API is interim REST while the architecture target is GraphQL. Do not use this refresh as an excuse to create parallel domain APIs or bypass the SDK boundary. Any temporary API additions must be narrow, typed, authorized, and documented.

### Clinical data invention

Do not add dashboard metrics, allergy fields, appointment capabilities, billing data, reminders, or clinic settings merely because they appear in generic healthcare product examples. Only render real contracts.

### Authentication and session behavior

Session timeout, theme persistence, settings, and user menus touch auth/session UX. Preserve server behavior and verify sign-out, redirects, cookie invalidation, and role access.

### Existing testing gaps

The current E2E suite does not provide sufficient protection for authenticated clinical flows. A green existing smoke suite is not enough. Do not declare completion without the expanded suite or a documented environment blocker.

### Known lint/Playwright infrastructure failures

Do not conflate the redesign with unrelated repository lint configuration defects. Report them, fix them only under explicit scope, and do not suppress failures. Resolve the Playwright browser/configuration issue before relying on visual evidence.

### Over-abstraction

Do not create a giant design system or replace every page with generic wrappers. Extract only repeated patterns that improve consistency and maintainability.

### Dark mode mismatch

Do not use hardcoded white text against a variable primary background. Every component must be checked against both themes, especially tabs, buttons, badges, dialogs, overlays, and session timeout.

## 31. Recommended Next Steps

The next implementation agent must follow this order:

1. Read `AGENTS.md`, `.specs/README.md`, `.specs/spec-driven-development.md`, `.specs/design-system.md`, `.specs/architecture.md`, `.specs/domain-model.md`, `.specs/security-hipaa.md`, `.specs/tech-stack.md`, and this plan.
2. Inspect the current worktree and do not overwrite unrelated user changes.
3. Create a structured SDD task envelope for the approved implementation.
4. Stop for human review of the palette, language, documents scope, and spec changes if approval has not already been recorded.
5. Update the relevant `.specs/` files before implementing lasting behavior changes.
6. Run the current baseline commands and record pre-existing failures.
7. Fix Phase 1 token defects and Phase 2 P0 functional defects before broad visual changes.
8. Implement shared primitives and chrome.
9. Migrate forms and core screens in the phase order above.
10. Implement appointment detail, settings, and then documents behind their dependency gates.
11. Add and run authenticated E2E tests continuously, not only at the end.
12. Test light, dark, keyboard, reduced motion, desktop, tablet, and mobile states.
13. Run `pnpm typecheck`, `pnpm test`, `pnpm build`, `cd apps/web && pnpm e2e`, and `pnpm lint` with known failures reported.
14. Review the final diff against this plan, updated specs, permissions, audit requirements, and PHI rules.
15. Report files changed, specs changed, tests run, residual risks, and any deferred items.

### Implementation agent working rules

- Do not implement the entire redesign in one unverified sweep.
- Keep each phase reviewable and leave the application runnable.
- Preserve existing API calls until a replacement contract is tested.
- Never replace a failed request with fake success data.
- Never hide a security or storage blocker behind a polished UI.
- Prefer the smallest change that creates a measurable UX improvement.
- Ask for a human gate when a change affects auth, PHI, clinical finalization, storage, or a lasting product specification.

## Appendix A — Recommended Model Operating Profile

The available model catalog was inspected on 2026-08-10. Exact pricing can vary by account, routing, and provider, so the ranking below is a quality/cost recommendation rather than a billing guarantee.

### Recommended primary implementation model

**`opencode-go/gpt-5.6-luna`**

Use this as the main implementation agent for the complete plan. It is the best default quality/cost candidate among the requested OpenCode GO + GPT-5.6 Luna options:

- Strong enough for multi-file TypeScript/React work.
- Suitable for preserving project constraints and following a long implementation plan.
- Better cost posture than routing every task through the premium provider endpoint.
- Appropriate for iterative phase-by-phase work with tests and review gates.

### Premium fallback for difficult phases

**`openai/gpt-5.6-luna`**

Use this when the implementation reaches:

- Patient documents and storage.
- Authentication/session behavior.
- Authorization, audit, or PHI-sensitive code.
- Complex API contract changes.
- Large regression debugging after a failed test/build.
- Final review of a broad multi-phase diff.

### Fast variant for focused bursts

**`openai/gpt-5.6-luna-fast`**

Use for short, well-scoped tasks such as:

- Mechanical token migrations after the semantic mapping is approved.
- Updating copy and labels.
- Adding repetitive tests from an already-established pattern.
- Reviewing a small isolated diff.

Do not use the fast variant as the only agent for storage, auth, or clinical safety work.

### Optional independent review model

**`opencode/claude-opus-4-8`**

Use as an adversarial reviewer for the final frontend diff, especially accessibility, UX regressions, and missed edge states. It should review, not independently rewrite the implementation unless explicitly assigned.

### Recommended routing strategy

```text
Planning and phase execution:  opencode-go/gpt-5.6-luna
PHI/auth/storage/API hard parts: openai/gpt-5.6-luna
Small mechanical follow-ups:    openai/gpt-5.6-luna-fast
Independent final review:       opencode/claude-opus-4-8
```

### How the primary agent should work

1. Work one phase at a time.
2. Read the relevant source and specs before editing.
3. Use Codebase Memory for structural discovery.
4. Use `apply_patch` for manual edits.
5. Run the narrowest relevant test after each logical change.
6. Run the full verification gate at every phase boundary.
7. Never commit unless explicitly instructed.
8. Stop and request review for palette/spec, auth, PHI, clinical, or storage changes.

## Appendix B — Audit Evidence and Repository References

### Primary evidence consulted

- `260810_CANICA_REFRESH_UIUX.md`.
- `.specs/README.md` and relevant approved specs.
- `.specs/design-system.md`.
- `.specs/architecture.md`.
- `.specs/spec-driven-development.md`.
- `docs/styles-design.md`.
- `docs/design-system-plan.md`.
- `apps/web/app/globals.css`.
- `apps/web/app/layout.tsx`.
- `apps/web/app/(dashboard)/layout.tsx`.
- `apps/web/app/` route inventory.
- `apps/web/src/` component and utility inventory.
- `packages/ui/src/` component inventory.
- Root and package scripts/configuration.
- Existing test and Playwright configuration.
- Codebase Memory architecture and route graph for `canica-app`.

### Important source files for implementation

- `apps/web/app/globals.css` — token/theme foundation.
- `apps/web/app/(dashboard)/layout.tsx` — application shell.
- `apps/web/src/components/layout/sidebar.tsx` — navigation.
- `apps/web/src/components/layout/topbar.tsx` — search and account chrome.
- `apps/web/src/components/dashboard/session-timeout.tsx` — session privacy UX.
- `apps/web/src/lib/api.ts` — current frontend API boundary.
- `apps/web/src/lib/usePageTitle.ts` — PHI-safe page titles.
- `apps/web/app/(dashboard)/page.tsx` — dashboard.
- `apps/web/app/(dashboard)/patients/` — patient workflows.
- `apps/web/app/(dashboard)/appointments/` — appointment workflows.
- `apps/web/app/(dashboard)/consultations/` — consultation workflows.
- `apps/web/app/(dashboard)/audit/page.tsx` — audit UI.
- `packages/ui/src/components/` — reusable component foundation.

### Final review gate

This document is intentionally awaiting human review. The implementation agent must not begin the redesign merely because the file exists. Approval must explicitly confirm:

- The Canica Clinical palette.
- Neutral Spanish language direction.
- Full dark mode with a toggle.
- P0 functional fixes included.
- Complete settings and appointment detail scope.
- Documents scope and its storage/security dependency gate.
- API-minimal support changes.
- Expanded authenticated E2E expectations.
