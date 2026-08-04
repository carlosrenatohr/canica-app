# Domain Model

> **Status:** Approved (initial)  
> **Version:** 1.0

Core business entities for canica. This document defines **what** exists and how entities relate — not table DDL or API paths.

Security/RBAC detail: [security-hipaa.md](./security-hipaa.md).  
Module list / boundaries: [architecture.md](./architecture.md).

---

## Design rules

- Collect only information necessary for care (**data minimization**)
- Clinical content is immutable in spirit: corrections create history / audit, not silent overwrites
- AI suggestions are never first-class clinical facts until a physician accepts them
- Multi-tenant readiness: data is scoped to an organization (clinic) even if v1 is single-clinic deployments

---

## Context map (high level)

```text
Organization
  ├── User (Doctor | Receptionist | Administrator | …)
  ├── Patient
  │     ├── MedicalRecord (aggregate chart)
  │     ├── Consultation
  │     │     ├── Diagnosis
  │     │     ├── Prescription
  │     │     ├── Attachment
  │     │     └── AiSuggestion
  │     └── Appointment
  └── AuditLog
```

---

## Entities

### Organization

A clinic or practice that owns users, patients, and configuration.

**Responsibilities**

- Tenant boundary for data access
- Branding / clinic profile (future)
- Consent and AI policy settings

---

### User

A person who authenticates into canica.

**Roles (initial)**

- Doctor
- Receptionist
- Administrator

**Roles (future)**

- Clinic Owner
- Specialist
- Assistant

**Notes**

- A user belongs to one or more organizations (v1 may constrain to one)
- Permissions are role-based; least privilege by default

---

### Patient

A person receiving care.

**Core concepts**

- Demographics needed for identification and care
- Identifiers appropriate to local practice (e.g. national ID when collected)
- Contact information for coordination
- Soft-delete / archive preferred over hard-delete where legally allowed

**Rules**

- Access always authorized and audited
- No patient payload in logs beyond necessary identifiers for support

---

### MedicalRecord

The longitudinal chart for a patient within an organization.

**Contains / references**

- Historical consultations
- Active problem list (derived or explicit — product decision per phase)
- Documents and attachments
- Key allergies / alerts (when modeled)

Treat as the patient-centric aggregate root for clinical history views.

---

### Consultation

A clinical encounter between a physician and a patient.

**Typical content**

- Date/time, physician, location/mode (in-person / future telehealth)
- Chief complaint / reason for visit
- History, examination notes
- Assessment and plan
- Linked diagnoses, prescriptions, attachments
- Status: draft | finalized | amended

**Rules**

- Finalizing a consultation is a deliberate physician action
- Amendments remain traceable
- AI-drafted notes require explicit accept/edit before becoming the record

---

### Diagnosis

A clinical assessment entry associated with a consultation (and visible on the chart).

**Concepts**

- Free-text clinical description
- Optional coding system reference (future agent: coding)
- Primary vs secondary (when applicable)
- Status: active | resolved | ruled-out (as product needs evolve)

---

### Prescription

Medication or therapeutic order issued from a consultation.

**Concepts**

- Medication name / strength / form
- Dose, route, frequency, duration
- Instructions
- Prescriber
- Status: active | cancelled | completed

**Rules**

- Edits after issue are audited
- PDF export must match the signed clinical intent

---

### Appointment

A scheduled interaction (visit) with a patient.

**Concepts**

- Patient, provider, start/end, status
- Reason / notes for reception
- Links to a consultation when the visit occurs (optional until check-in)

**Statuses (illustrative)**

- scheduled | confirmed | checked-in | completed | cancelled | no-show

---

### Attachment

A file related to a patient or consultation.

**Examples**

- Lab PDFs
- Imaging
- Referral letters
- Signed consent scans

**Storage**

- Binary in object storage (Supabase Storage)
- Metadata and access control in the database
- Access is authorized and audited like other PHI

---

### AiSuggestion

An AI-generated proposal that has not yet become clinical truth.

**Types (aligned with agents)**

- History draft
- Summary
- Prescription draft
- Trend insight
- Coding suggestion

**Rules**

- Always labeled as AI-generated in UI
- Linked to source context (patient/consultation)
- Lifecycle: proposed → accepted | rejected | edited
- Acceptance copies/transforms content into the real clinical entity and records audit

---

### AuditLog

Immutable record of security- and clinically-relevant actions.

**Examples**

- Login / failed login
- Record created or viewed
- Diagnosis updated
- Prescription edited
- PDF generated
- AI suggestion accepted or rejected

**Minimum fields (conceptual)**

- Actor (user)
- Action
- Target entity + id
- Timestamp
- IP / user agent when available
- Change summary or diff reference

Audit logs are append-only from the application’s perspective.

---

### DocumentExport (PDF)

A generated artifact (e.g. consultation summary, prescription).

**Concepts**

- Template / type
- Source entities
- Storage pointer
- Generated by + timestamp
- Audit on generate and download

---

## Initial modules ↔ entities

| Module | Primary entities |
| --- | --- |
| Authentication | User, Organization, AuditLog |
| Patients | Patient, MedicalRecord |
| Consultations | Consultation, Diagnosis, Prescription, Attachment |
| Medical records | MedicalRecord, Consultation history |
| Diagnoses | Diagnosis |
| Appointments | Appointment |
| PDF export | DocumentExport |
| Audit logs | AuditLog |
| AI assistant | AiSuggestion (+ agents in `packages/ai`) |

---

## Out of scope for early domain (explicit)

- Full billing / insurance claims engine
- Inpatient ADT / bed management
- Lab instrument integration
- National HIE interoperability standards (revisit by market)

These may appear in later roadmap phases without forcing v1 schema complexity.
