# Vision

> **Project:** canica  
> **Organization:** Nativerse  
> **Status:** Approved  
> **Version:** 1.0

---

## What is canica?

canica is an **AI-first Clinical Workspace**, not simply another Electronic Medical Record (EMR).

The objective is to reduce the administrative burden on physicians through intelligent automation while maintaining complete control, privacy, traceability, and regulatory compliance.

---

## Mission

Help physicians focus on patients. canica quietly handles documentation, organization, and administrative workload in the background.

> Technology should disappear into the background.

---

## Goals

- Reduce time spent on clinical documentation
- Keep the physician in full control of every clinical decision
- Protect patient data with privacy, security, and full auditability
- Deliver a calm, premium product experience for daily clinical work
- Start simple for independent physicians and small clinics
- Architect from day one to scale internationally

---

## Non-goals (v1)

- Replacing clinical judgment with autonomous AI decisions
- Full hospital HIS / ERP coverage
- Multi-product monorepo for other Nativerse products
- Kubernetes, microservices, message brokers, or distributed systems before there is a real need
- Claiming HIPAA certification (we follow HIPAA-inspired practices; certification is a separate track)
- Parallel public REST surface alongside GraphQL (GraphQL is the product API)
- Building every specialty workflow on day one

---

## Target users

### Primary

- Independent physicians in Nicaragua
- Small private clinics (few doctors + reception)

### Secondary (near-term)

- Clinic administrators
- Reception staff coordinating appointments and intake

### Future

- Multi-location clinic networks
- Specialists collaborating on shared patients
- Broader Latin America, then international markets

---

## Core principles

### 1. AI assists physicians

The AI never replaces clinical judgment.

It assists with:

- Documentation
- Summaries
- Recommendations
- Organization
- Administrative tasks

The physician always makes the final decision.

### 2. Data belongs to the patient

Every product and architecture decision prioritizes:

- Privacy
- Security
- Traceability
- Integrity

### 3. Simplicity over complexity

Do not introduce infrastructure until there is a demonstrated need.

### 4. Type safety everywhere

Shared types across database, backend, SDK, and frontend. No duplicated interfaces.

### 5. AI remains isolated

The application never depends directly on a specific AI provider. Providers are swappable behind an AI layer.

---

## Product promise

canica should feel like a modern clinical workspace: fast, trustworthy, and calm — closer to Linear or Notion than to legacy hospital software.
