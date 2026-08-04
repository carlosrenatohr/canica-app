# canica — Specifications

This directory is the **source of truth** for canica.

Specifications describe intended system behavior. Implementation must follow these documents.

**Process:** [Specification Driven Development](./spec-driven-development.md)  
**Automation:** [Agent automation](./agent-automation.md) (Hermes and other orchestrators)

---

## Reading order

1. [../README.md](../README.md) — project overview (humans)
2. [vision.md](./vision.md) — why we build canica
3. [architecture.md](./architecture.md) — how the system is structured
4. [tech-stack.md](./tech-stack.md) — official technologies and versions
5. [design-system.md](./design-system.md) — visual language and UI principles
6. [domain-model.md](./domain-model.md) — core business entities
7. [security-hipaa.md](./security-hipaa.md) — privacy, security, audit
8. [roadmap.md](./roadmap.md) — product phases
9. [spec-driven-development.md](./spec-driven-development.md) — how work is done
10. [agent-automation.md](./agent-automation.md) — scheduled / NL agents (e.g. Hermes)
11. [../AGENTS.md](../AGENTS.md) — concise operating rules for coding agents

---

## Specification Driven Development (summary)

Every significant feature follows this order:

1. Capture intent (natural language OK)
2. **Update specification**
3. Review specification for consistency
4. Implement feature
5. Test / typecheck / lint
6. Update documentation if necessary

Full rules, task envelope, and quality bar: [spec-driven-development.md](./spec-driven-development.md).

The specification is the source of truth. Code that conflicts with `.specs/` is wrong until the spec is deliberately changed.

---

## Document ownership

| Document | Owns |
| --- | --- |
| `vision.md` | Goals, non-goals, users |
| `architecture.md` | Boundaries, monorepo, deployment, GraphQL placement |
| `tech-stack.md` | Official stack only (incl. TypeScript 7+, GraphQL) |
| `design-system.md` | UI language, tokens, logo direction |
| `domain-model.md` | Business entities and relationships |
| `security-hipaa.md` | Privacy, authz, audit, PHI practices |
| `roadmap.md` | Phases — no implementation detail |
| `spec-driven-development.md` | SDD methodology & NL → work contract |
| `agent-automation.md` | Hermes/orchestrator tiers, safety, reporting |

Draft / working notes may live under `docs/`. **Approved decisions live here.**
