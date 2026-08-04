# 📁 Repository Documentation Structure

This document defines how project documentation is organized.

The objective is to make the repository understandable for both humans and AI coding agents.

---

# Philosophy

Documentation should answer four questions.

1. Why are we building this?
2. What are we building?
3. How should it be built?
4. How should contributors and AI agents work?

Everything else is implementation.

---

# Repository Structure

```text
calnica/

.specs/

    README.md

    vision.md

    architecture.md

    tech-stack.md

    design-system.md

    domain-model.md

    security-hipaa.md

    roadmap.md

AGENTS.md

README.md

apps/

packages/

...
```

---

# Root README.md

The repository README is intended for humans.

It should answer:

- What is Calnica?
- Why does it exist?
- Current project status
- Technology stack
- Getting started
- Repository structure
- Development commands
- Links to documentation

It should **not** contain architectural decisions.

Instead, it should point to `.specs/`.

---

# .specs/

This directory is the project's source of truth.

Every important architectural decision should be documented here before implementation.

Specifications describe the intended behavior of the system.

Implementation should follow the specifications.

---

# Documentation Order

The recommended reading order is:

1. README.md
2. .specs/vision.md
3. .specs/architecture.md
4. .specs/tech-stack.md
5. .specs/design-system.md
6. .specs/domain-model.md
7. .specs/security-hipaa.md
8. .specs/roadmap.md
9. AGENTS.md


---

# Purpose of each document

## vision.md

Explains

- project vision
- goals
- non-goals
- target users

---

## architecture.md

Explains

- overall architecture
- repository structure
- deployment
- application boundaries
- package responsibilities

---

## tech-stack.md

Defines

- official technologies
- approved versions
- reasons for choosing them

Only this document should define the project's official stack.

---

## design-system.md

Defines

- visual language
- UI principles
- typography
- colors
- spacing
- component guidelines
- logo direction

---

## domain-model.md

Defines the core business entities.

Example

- Patient
- Consultation
- Diagnosis
- Appointment
- Prescription

---

## security-hipaa.md

Defines

- privacy principles
- audit logging
- authentication
- authorization
- encryption
- HIPAA-inspired practices

---

## roadmap.md

Describes future project phases.

It should never define implementation details.

---

# Specification Driven Development

Calnica follows a Specification Driven Development workflow.

Every significant feature should follow this order.

1. Update specification.
2. Review specification.
3. Implement feature.
4. Test.
5. Update documentation if necessary.

The specification is the source of truth.

---

# AGENTS.md

Unlike the documentation inside `.specs/`,
`AGENTS.md` contains instructions for AI coding agents.

It should describe **how to work** with the project.

It should not duplicate the project documentation.

Instead, it should reference the specification documents.

Example:

- coding conventions
- workflow
- repository rules
- architectural constraints
- implementation expectations

Avoid placing product documentation inside `AGENTS.md`.

The agent should consult `.specs/` whenever project context is required.

# 