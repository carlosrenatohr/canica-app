# Roadmap

> **Status:** Approved (directional)  
> **Version:** 1.0

This document describes **product phases**, not implementation tasks, ticket breakdowns, or sprint plans.

Detailed how-to-build lives in architecture and tech-stack specs when a phase starts.

---

## Phase overview

```text
Phase 1 — Digital Medical Records
  →
Phase 2 — AI Documentation
  →
Phase 3 — Appointments
  →
Phase 4 — Multi-agent Clinical Workspace
  →
Phase 5 — Clinic Platform
  →
Phase 6 — Healthcare Ecosystem
```

---

## Phase 1 — Digital Medical Records

**Outcome:** Physicians can run day-to-day charting digitally with trust and auditability.

**Includes (product intent)**

- Authentication and roles
- Organization / clinic tenancy baseline
- Patients and medical records
- Consultations, diagnoses, prescriptions
- Attachments
- PDF export
- Audit logs
- Calm, accessible UI (light + dark)

**Does not include**

- Autonomous clinical AI decisions
- Full multi-clinic network features
- External lab/HIS integrations

---

## Phase 2 — AI Documentation

**Outcome:** AI reduces documentation time while the physician stays in control.

**Includes (product intent)**

- AI-assisted note drafts and summaries
- Clear AI labeling and accept/edit/reject flows
- Org-level AI consent / policy hooks
- Isolated provider layer (`packages/ai`) with OpenAI first

**Does not include**

- Unsupervised auto-finalization of charts
- Multi-agent orchestration as the default UX

---

## Phase 3 — Appointments

**Outcome:** Front desk and physicians share one schedule tied to the chart.

**Includes (product intent)**

- Appointment lifecycle
- Reception-friendly workflows
- Link from visit → consultation
- Reminders (email first; channels may expand later)

---

## Phase 4 — Multi-agent Clinical Workspace

**Outcome:** Specialized AI agents support history, summary, prescription drafts, trends, and coding — still assistive only.

**Includes (product intent)**

- Multiple agents behind the AI package
- Richer clinical workspace UX
- Stronger transparency and audit around agent actions

---

## Phase 5 — Clinic Platform

**Outcome:** canica supports clinic operations beyond a single physician desk.

**Includes (product intent)**

- Richer admin and multi-user operations
- Expanded roles (owner, specialist, assistant)
- Clinic configuration, reporting foundations
- Hardening for broader production load (split workers only if needed)

---

## Phase 6 — Healthcare Ecosystem

**Outcome:** canica participates in a wider care network.

**Includes (product intent)**

- Interoperability paths appropriate to target markets
- Partner integrations
- Internationalization and multi-market compliance tracks
- Possible certification efforts where commercially and legally required

---

## Principles across all phases

- **Specification Driven Development** — see [spec-driven-development.md](./spec-driven-development.md)
- Spec before implementation
- Simplicity over premature infrastructure
- AI assists; physicians decide
- Privacy, security, and audit are not “later” work
- GraphQL schema evolves with the domain; SDK stays codegen-aligned

---

## Near-term engineering sequence (planning only)

When implementation begins, expected scaffolding order (still not tickets):

1. Monorepo tooling (pnpm, turbo, shared tsconfig/eslint on **TypeScript 7+**)
2. `packages/db` + Supabase
3. `packages/auth` + auth HTTP callbacks on Hono
4. GraphQL layer on `apps/api` (schema, context, authz) + codegen → `packages/sdk`
5. `apps/web` shell + `packages/ui` wired to SDK
6. Patients → consultations → audit (GraphQL types/mutations first in specs/domain)
7. PDF export
8. AI package + first documentation agent

Automation (Hermes, scheduled NL jobs) may drive slices of this sequence only via the SDD envelope and [agent-automation.md](./agent-automation.md).

This sequence may be refined after specs are reviewed; it must not override phase intent above.
