# Security & HIPAA-Inspired Practices

> **Status:** Approved (principles)  
> **Version:** 1.1  
> **Changes (1.1):** permission-based RBAC (role→permission matrix in DB), Vendor & BAA readiness section

Although the first market is **Nicaragua**, canica is designed following HIPAA-inspired principles from day one.

This does **not** mean canica is HIPAA certified.

It means architecture and product behavior align with security and privacy practices expected when handling Protected Health Information (PHI).

---

## Guiding statement

Every architectural decision must prioritize:

- Privacy
- Security
- Traceability
- Integrity

**Data belongs to the patient.**

---

## Core principles

### Confidentiality

Only authorized users may access patient information.

Implement:

- Role-Based Access Control (RBAC)
- Secure authentication
- Session expiration
- Least-privilege access
- Organization (tenant) scoping on every PHI query

### Integrity

Medical records must not be modified without traceability.

- Prefer amend / version patterns over silent overwrite for finalized clinical content
- Every important action generates an audit log entry

### Availability

Patient information must remain accessible to authorized users.

- Automatic backups (Supabase)
- Disaster recovery plan (document and test as the product matures)
- Database redundancy (future)

### Encryption

- TLS for all communication in transit
- Store sensitive data securely at rest (platform defaults + review)
- Encrypted backups

### Auditability

Record security- and clinically-relevant actions, including:

- Who
- What
- When
- Target resource
- IP address
- Browser / user agent
- Change summary where applicable

### Data minimization

Collect only information necessary for patient care. Avoid storing unnecessary personal data.

### Consent

When AI features analyze patient data:

- Indicate this clearly in the product
- Allow organizations to define consent / AI-use policy
- Do not send PHI to AI providers beyond what the feature requires

### AI transparency

- Every AI-generated suggestion must be identifiable in the UI
- Never present AI output as physician-written documentation without confirmation
- Accept / reject / edit flows are first-class

---

## Authentication

**Provider:** Better Auth (see [tech-stack.md](./tech-stack.md)).

### Initial

- Email/password (or equivalent solid baseline supported by Better Auth)
- Secure session management
- Session expiration and revocation paths

### Future

- MFA
- Passwordless login
- SSO

### Logging

- Successful login
- Failed login
- Logout / session revoke (as applicable)

Never log raw passwords or full session secrets.

---

## Authorization

### Model: permission-based RBAC

Authorization asks **“does this user’s role grant permission X?”** — never
hard-coded role comparisons (`role === "doctor"`). Roles are the assignable unit
on a user; permissions derive from the role via a matrix. Adding a future role
(Specialist, Resident, Intern, …) is a data change, not an application rewrite.

- A user carries exactly one role (`users.role`).
- The role → permission matrix lives in the database (`role_permissions`,
  seeded). Granting, revoking, or adding a role only changes seed/data.
- Application code calls `hasPermission(actor, Permission.PATIENT_READ)` and
  similar; business logic never checks roles directly.
- Deny by default: no matching grant row = denied.

### Initial roles (assignable to users)

| Role | Intent |
| --- | --- |
| Doctor | Clinical read/write for assigned care context |
| Receptionist | Scheduling, limited patient demographics; no unrestricted chart rewrite |
| Administrator | User/org configuration; access policy without casual PHI browsing |

### Future roles

- Clinic Owner
- Specialist
- Assistant
- Resident / Intern (may map to existing permission sets; no code change required)

### Initial permission catalog (non-exhaustive)

| Permission | Meaning |
| --- | --- |
| `patient:read` / `patient:write` / `patient:archive` | Patient demographics lifecycle |
| `consultation:read` / `consultation:write` / `consultation:finalize` | Consultations |
| `diagnosis:read` / `diagnosis:write` | Diagnoses |
| `prescription:read` / `prescription:write` | Prescriptions |
| `appointment:read` / `appointment:write` | Appointments |
| `attachment:read` / `attachment:write` | Attachments |
| `user:manage` | Invite / configure users (Administrator) |
| `audit:read` | Read audit logs (Administrator) |
| `org:manage` | Org configuration (Administrator) |

The exact matrix (which role grants which permission) is seed data in
`packages/db`. New permissions are added to the catalog + seed, never by editing
checks throughout the app.

### Rules

- Deny by default
- Enforce authorization in the **API** (never only in the UI)
- Scope all PHI by organization
- Prefer explicit checks near data access (`packages/db` / API middleware), not scattered ad-hoc logic
- Business logic uses `hasPermission`, not direct role comparisons

---

## Audit logging

### Must audit (non-exhaustive)

- Record created
- Record viewed (PHI access)
- Diagnosis updated
- Prescription edited
- PDF generated / downloaded
- Attachment uploaded / downloaded
- User login / failed login
- Role or permission changes
- AI suggestion accepted / rejected

### Properties

- Append-only from application perspective
- Retained per policy (define retention as compliance needs grow)
- Access to audit logs restricted to appropriate admin roles

---

## PHI handling rules

- No PHI in client-side analytics without review
- No PHI in error trackers beyond minimized IDs if unavoidable — configure Sentry scrubbing
- No PHI in application logs at info level; prefer opaque IDs
- Secrets only in environment / secret managers — never in git
- Production and development data are separated; no production PHI on laptops without explicit process

---

## Storage & files

- PDFs, medical images, attachments in **Supabase Storage**
- Signed or authorized access only
- Downloads and uploads audited when they contain PHI

---

## AI & third parties

- All model calls go through `packages/ai`
- Document which providers receive what categories of data
- Prefer minimization and de-identification where the feature still works
- Provider changes must not bypass security review

---

## Vendor & BAA readiness

PHI rests in or transits through third-party vendors (database, object storage,
email, AI). Not every “modern” provider signs a Business Associate Agreement
(BAA) where the target market requires one. A technically excellent architecture
is worthless if a required vendor cannot sign a BAA.

- Access any PHI-touching provider **only** through an abstraction package
  (`packages/ai`, `packages/email`, `packages/storage`, …). Swapping a vendor is a
  configuration decision, not a rewrite.
- When a vendor is onboarded, record BAA availability in `docs/how-to/*`.
- If a BAA is required and the vendor cannot provide one, the vendor must be
  replaced — provider SDKs stay inside their abstraction package so this is cheap.
- Provider-specific SDKs never leak into domain/business modules.

---

## Operational security (baseline)

- HTTPS everywhere (Cloudflare)
- Dependency updates and lockfile commits
- CI without exposing secrets in logs
- Principle of least privilege for cloud credentials (Supabase, Cloudflare, OpenAI, Resend, Sentry)

---

## Incident readiness (lightweight v1)

- Define who is notified if PHI may have been exposed
- Ability to revoke sessions
- Ability to rotate API keys and provider credentials
- Preserve audit logs during incident response

---

## Explicit non-claims

- canica is **not** claiming HIPAA certification in v1
- “HIPAA-inspired” is an engineering bar, not a legal certification badge in the product UI
