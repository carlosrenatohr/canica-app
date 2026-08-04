# Specification Driven Development (SDD)

> **Status:** Approved  
> **Version:** 1.0  
> **Audience:** humans, in-repo coding agents, and external orchestrators (e.g. Hermes)

canica is built **spec-first**. Code is a consequence of approved specifications — never the other way around for lasting product behavior.

---

## Why SDD

- Clinical software cannot afford silent product drift
- AI agents accelerate implementation only when the target behavior is written down
- Reviewers (human or automated) can validate diffs against a stable contract
- Natural-language task runners can map intent → spec change → implementation without inventing scope

---

## Source of truth

| Layer | Location | Authority |
| --- | --- | --- |
| Approved product & architecture | `.specs/**` | **Highest** for behavior and constraints |
| Agent operating rules | `AGENTS.md` | How to work (not product truth) |
| Human overview | `README.md` | Onboarding; points to `.specs/` |
| Drafts / exploration | `docs/**` | Non-binding until promoted into `.specs/` |

If code and `.specs/` disagree, **the spec wins** until the spec is deliberately changed.

---

## The mandatory cycle

Every **significant** change follows this order. Skipping steps is a process failure.

```text
1. INTENT
   Natural language request (human, Hermes, issue, chat)

2. SPEC
   Update or add the relevant document(s) under .specs/

3. REVIEW
   Check consistency across vision, architecture, domain, security, stack
   Confirm non-goals and constraints still hold

4. PLAN
   Short implementation plan derived from the spec (not instead of it)

5. IMPLEMENT
   Code that realizes the approved spec only

6. VERIFY
   Tests, typecheck, lint; manual checks for PHI/authz paths when relevant

7. CLOSE
   Update docs if the change revealed missing spec detail
   Leave the tree consistent: specs ↔ code ↔ README pointers
```

### What counts as “significant”

Must go through SDD:

- New user-visible behavior
- New domain entities or fields with product meaning
- Auth, authz, audit, PHI handling
- API/schema surface (GraphQL types, mutations, subscriptions)
- Stack or deployment changes
- Anything that would surprise a physician or a security reviewer

May be code-only (still follow `AGENTS.md`):

- Typos, formatting, pure refactors with no behavior change
- Test-only hardening of existing behavior
- Dependency patches that do not change public contracts

When unsure: **update the spec**.

---

## Which spec to edit

| Change type | Primary doc | Also check |
| --- | --- | --- |
| Goals / users / non-goals | `vision.md` | `roadmap.md` |
| Boundaries, packages, deploy, GraphQL placement | `architecture.md` | `tech-stack.md` |
| Libraries & versions | `tech-stack.md` | `architecture.md` |
| UI language | `design-system.md` | — |
| Entities & relationships | `domain-model.md` | `security-hipaa.md` |
| Privacy, roles, audit | `security-hipaa.md` | `domain-model.md` |
| Phases / sequencing | `roadmap.md` | `vision.md` |
| How agents must work | `AGENTS.md` + this file | `agent-automation.md` |

Promote lasting decisions from `docs/` → `.specs/` in the same change set when possible.

---

## Spec quality bar

A good spec change is:

1. **Behavioral** — states what the system should do, not a dump of implementation trivia
2. **Scoped** — names what is in and out
3. **Consistent** — does not contradict other `.specs/` files
4. **Testable** — a reviewer can tell if an implementation matches
5. **Stable** — avoids sprint-ticket noise; tickets reference specs, they do not replace them

Avoid:

- Embedding full code listings in specs (examples OK, systems of record are not)
- Duplicating the same rule in five files — link instead
- “We might someday…” without a roadmap phase

---

## Natural language → work (contract)

External schedulers and agents (Hermes, cron+LLM, GitHub Actions + agent, chatops) **must** normalize free text into a structured work item before coding.

### Canonical task envelope

```yaml
# Logical shape — store as issue body, JSON, or agent memory
id: optional-stable-id
source: hermes | human | ci | other
requested_at: ISO-8601
natural_language: |
  Original user text, unmodified
intent_summary: one-line restatement
type: feature | fix | chore | docs | spike
specs_to_read:
  - .specs/architecture.md
  - .specs/domain-model.md
specs_to_change: [] # fill after analysis; required non-empty if behavior changes
constraints:
  - honor AGENTS.md
  - no PHI in logs or commits
acceptance_criteria:
  - bullet list of observable outcomes
out_of_scope:
  - explicit non-goals for this task
phase_alignment: Phase 1 | Phase 2 | ... | n/a
risk: low | medium | high
```

### Agent decision rules

1. **Parse** natural language into the envelope (do not start coding yet).
2. **Read** listed specs + `AGENTS.md`.
3. If behavior changes → **write/update specs first** and stop for review when the change is high-risk (auth, PHI, clinical writes, stack).
4. **Implement** only acceptance criteria covered by specs.
5. **Verify** with repo commands when available.
6. **Report** back: files changed, specs touched, residual risks, suggested next tasks.

### Refusal / escalate conditions

Stop and ask (or open a blocked task) when:

- Request conflicts with `.specs/` and no authority to change specs
- Request implies silent clinical AI writes or PHI exfiltration
- Stack choice is not in `tech-stack.md`
- Scope spans multiple roadmap phases without prioritization

---

## Review checklist (humans or agents)

Before merging implementation:

- [ ] Spec updated (or explicitly N/A with reason)
- [ ] No contradiction with vision non-goals
- [ ] GraphQL/schema impact considered
- [ ] Authz + audit impact considered for PHI
- [ ] AI paths still isolated via `packages/ai`
- [ ] Types flow DB → API → SDK → web without parallel interfaces
- [ ] Tests/typecheck/lint addressed

---

## Relationship to automation

See [agent-automation.md](./agent-automation.md) for:

- Hermes / scheduled natural-language jobs
- Allowed automated actions
- Safety rails for unattended runs

This file defines the **methodology**. That file defines the **runtime automation contract**.

---

## Anti-patterns

| Anti-pattern | Correct approach |
| --- | --- |
| “Just code it, update docs later” | Spec first |
| Agent invents entities not in domain model | Extend `domain-model.md` first |
| Parallel REST + GraphQL “for now” | GraphQL is the product API; see architecture |
| Copying stack choices into AGENTS.md | Point to `tech-stack.md` |
| Treating `docs/` drafts as approved | Promote to `.specs/` |

---

## Versioning specs

- Specs carry a short status/version header when material
- Breaking product decisions bump the relevant doc version and note the date in the change description
- Do not delete history blindly; prefer explicit “Superseded” notes for major reversals (e.g. API style changes)
