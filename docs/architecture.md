# 🩺 canica
## Architecture Decision Record (ADR) v1.0

> **Project:** canica
>
> **Organization:** Nativerse
>
> **Status:** Approved (Initial Architecture)
>
> **Version:** 1.1
>
> **Note:** Approved living specs are under `.specs/`. This file is a working ADR draft; prefer `.specs/architecture.md`, `.specs/tech-stack.md`, `.specs/spec-driven-development.md`, and `.specs/agent-automation.md`.

---

# Vision

canica is an **AI-first Clinical Workspace**, not simply another Electronic Medical Record (EMR).

The objective is to reduce the administrative burden on physicians through intelligent automation while maintaining complete control, privacy, traceability and regulatory compliance.

The first version focuses on independent physicians and small clinics in Nicaragua, while being architected from day one to scale internationally.

---

# Core Principles

## 1. AI assists physicians

The AI never replaces clinical judgment.

It assists with:

- Documentation
- Summaries
- Recommendations
- Organization
- Administrative tasks

The physician always makes the final decision.

---

## 2. Data belongs to the patient

Every architectural decision must prioritize:

- Privacy
- Security
- Traceability
- Integrity

---

## 3. Simplicity over complexity

Do not introduce infrastructure until there is a demonstrated need.

Avoid:

- Kubernetes
- Message brokers
- Event buses
- Microservices
- Distributed systems

until the product actually requires them.

---

## 4. Type Safety Everywhere

Every layer should share types.

```
Database

↓

Drizzle

↓

Backend

↓

SDK

↓

Frontend
```

No duplicated interfaces.

---

## 5. AI must remain isolated

The application should never depend directly on a specific AI provider.

Instead:

```
Application

↓

AI Layer

↓

OpenAI
Claude
Gemini
Local Models
```

Changing providers should require minimal changes.

---

# Repository Strategy

One repository.

One product.

One monorepo.

```
canica/
```

No multi-product repository.

Each future Nativerse product should own its own repository.

---

# Monorepo Structure

```
canica/

apps/

    web/

    api/


packages/

    ai/

    auth/

    db/

    graphql/

    sdk/

    types/

    validation/

    ui/

    config/

    eslint/

    tsconfig/


docs/

infra/

.github/

package.json

turbo.json

pnpm-workspace.yaml
```

---

# Why a Monorepo?

Benefits

- Shared types
- Shared validation
- Shared UI
- Shared authentication
- Single CI/CD pipeline
- Better developer experience
- Easier refactoring
- Easier onboarding

---

# Technology Stack

## Runtime

Node.js

Latest Active LTS

(Current recommendation: Node.js 24 LTS)

---

## Package Manager

pnpm 10+

Reasons

- Fastest installs
- Workspace support
- Excellent monorepo experience
- Efficient disk usage

---

## Monorepo

Turborepo 2+

Reasons

- Incremental builds
- Build cache
- Parallel execution
- Production-ready

---

## Frontend

Next.js 16+

React 19

TypeScript 7+

Reasons

- Modern App Router
- Server Components
- Mature ecosystem
- Excellent DX
- Ideal for dashboard applications

---

## Styling

Tailwind CSS 4

---

## UI Components

shadcn/ui

Built on

- Radix UI
- Tailwind

Reasons

- Accessible
- Modern
- Customizable
- No vendor lock-in

---

## Icons

Lucide React

---

## Forms

React Hook Form

+

Zod

---

## Remote State

TanStack Query v5+

---

## Local State

React State

Use Context only when necessary.

Avoid Redux.

Avoid Zustand unless a real need appears.

---

# Backend

Hono 4+

Reasons

- Extremely lightweight
- Fast
- Type-safe
- Excellent Cloudflare support
- Portable to Node.js
- Portable to Docker
- Portable to Bun
- Portable to Deno

---

## ORM

Drizzle ORM 0.44+

Reasons

- SQL-first
- Type-safe
- Lightweight
- Excellent migrations

---

## Database

Supabase PostgreSQL

Reasons

- Managed PostgreSQL
- Daily backups
- Dashboard
- Great free tier
- Easy local development

---

## Authentication

Better Auth

Reasons

- Provider agnostic
- Modern
- Type-safe
- Self-hostable
- Future-proof

---

## Storage

Supabase Storage

Store

- PDFs
- Medical images
- Attachments

---

## Validation

Zod

Shared between frontend and backend.

---

## Logging

Pino

---

## Error Tracking

Sentry

---

## Emails

Resend

---

## PDF Generation

React PDF

or

PDF-Lib

---

# AI Stack

Provider

OpenAI

Future Providers

- Claude
- Gemini
- Local LLMs

---

AI Architecture

```
packages/

    ai/

        providers/

            openai

            anthropic

            gemini

        agents/

            history

            summary

            prescription

            trends

            coding

        prompts/

        tools/
```

No AI code should exist inside the business logic.

---

# Deployment Strategy

## Frontend

Cloudflare Pages

---

## Backend

Cloudflare Workers

One Worker.

Not multiple.

```
Internet

↓

Cloudflare

↓

Worker

↓

Hono

↓

Supabase
```

No need for multiple Workers initially.

---

## Why One Worker?

Current expected traffic is low.

Benefits

- Simpler deployment
- Lower maintenance
- Single endpoint
- Easier debugging

Future

```
Worker

↓

API

↓

AI Worker

↓

OCR Worker

↓

Import Worker
```

Only when needed.

---

# Cloudflare Architecture

```
Users

↓

Cloudflare DNS

↓

Cloudflare Pages

↓

Next.js

↓

HTTPS

↓

Cloudflare Worker

↓

Hono API

↓

Supabase PostgreSQL

↓

Supabase Storage
```

---

# Deployment Flow

Git Push

↓

GitHub

↓

GitHub Actions

↓

Cloudflare Pages

↓

Cloudflare Worker

↓

Production

Automatic deployment.

No manual servers.

---

# API Strategy

GraphQL is the product API.

No parallel public REST domain API.

Reasons

- Selective queries for clinical chart views
- Single evolvable schema as contract
- Strong codegen into TypeScript 7+ / SDK
- Fits nested clinical domain without endpoint explosion

Limited non-GraphQL HTTP only for health, auth callbacks, and binary upload/download when needed.

Authoritative detail: `.specs/architecture.md` and `.specs/tech-stack.md`.

---

# SDK

The frontend never calls fetch / raw GraphQL from feature code.

Instead use the typed GraphQL SDK (`@canica/sdk`):

```
client.patients.create({ input })

client.consultations.update({ id, input })

client.query.patientById({ id })
```

Benefits

- Centralized API
- Better typing via codegen
- Easier testing

---

# Package Responsibilities

## db

Drizzle schema

Migrations

Database access

---

## validation

Every Zod schema.

---

## types

Shared types.

---

## auth

Authentication utilities.

---

## graphql

Schema, resolvers, context (or under apps/api until split).

---

## sdk

Typed GraphQL client (codegen).

---

## ui

Reusable UI.

---

## ai

Providers

Agents

Prompts

---

# Initial Modules

Authentication

Patients

Consultations

Medical Records

Diagnoses

Appointments

PDF Export

Audit Logs

AI Assistant

---

# HIPAA-Inspired Design

Although the first market is Nicaragua, the system should be designed following HIPAA principles from day one.

This does **not** mean canica is HIPAA certified.

It means its architecture aligns with many of the security and privacy practices expected for handling Protected Health Information (PHI).

## Core Principles

### Confidentiality

Only authorized users may access patient information.

Implement:

- Role-Based Access Control (RBAC)
- Secure authentication
- Session expiration
- Least-privilege access

---

### Integrity

Medical records must not be modified without traceability.

Every important action should generate an immutable audit log.

Examples:

- Record created
- Diagnosis updated
- Prescription edited
- PDF generated
- User login
- Failed login

---

### Availability

Patient information must remain accessible to authorized users.

Implement:

- Automatic backups
- Disaster recovery plan
- Database redundancy (future)

---

### Encryption

Encrypt all communication using TLS.

Store sensitive data securely.

Backups should also be encrypted.

---

### Auditability

Every action should be recorded.

Examples

- Who accessed the record
- When
- IP Address
- Browser
- Changes made

---

### Authentication

Support future

- MFA
- Passwordless login
- SSO

---

### Authorization

Roles

Doctor

Receptionist

Administrator

Future

Clinic Owner

Specialist

Assistant

---

### Data Minimization

Collect only the information necessary for patient care.

Avoid storing unnecessary personal information.

---

### Consent

When AI features analyze patient data, the system should clearly indicate this and allow organizations to define their consent policy.

---

### AI Transparency

Every AI-generated suggestion must be identifiable.

Never present AI output as physician-written documentation without confirmation.

---

# Design Language

canica should communicate

Professionalism

Trust

Precision

Calm

Technology

Never

Corporate blue overload

Medical clichés

Outdated gradients

---

## Visual Identity

Style

Modern SaaS

Minimal

Elegant

Clean

Premium

Inspired by

Linear

Raycast

Notion

Stripe

Vercel

---

## Color Palette

Primary

Deep Navy

Secondary

Emerald

Accent

Sky Blue

Background

Warm White

Neutral Gray

Avoid

Bright reds

Hospital greens

Old-fashioned blues

---

## Typography

Geist

Inter

---

## Icons

Rounded

Minimal

Outlined

---

## UI Principles

Large spacing

Rounded corners

Glass effects only when appropriate

Subtle shadows

Excellent accessibility

Dark mode from day one

---

# Logo Direction

The logo should avoid clichés such as:

- Red crosses
- Hearts
- Stethoscopes
- ECG lines
- Medical shields

Instead, it should represent:

- Intelligence
- Precision
- Trust
- Modern software
- Clinical workflow

Possible concepts:

- Abstract monogram "C"
- Geometric folded shape
- Neural-inspired minimal symbol
- Medical record abstraction
- Connected nodes representing clinical intelligence

The logo must be simple enough to work as:

- App icon
- Browser favicon
- Mobile application icon
- Lettermark
- Social profile image

---

# Future Evolution

Phase 1

Digital Medical Records

↓

Phase 2

AI Documentation

↓

Phase 3

Appointments

↓

Phase 4

Multi-agent Clinical Workspace

↓

Phase 5

Clinic Platform

↓

Phase 6

Healthcare Ecosystem

---

# Guiding Philosophy

> Technology should disappear into the background.

> Physicians should focus on patients, while canica quietly handles the administrative workload behind the scenes.