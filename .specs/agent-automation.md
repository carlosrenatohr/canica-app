# Agent automation

> **Status:** Approved  
> **Version:** 1.0  
> **Audience:** Hermes, scheduled agents, CI agents, chat-based coding agents

This document is the **automation contract** for running development work on canica from natural language — including unattended or scheduled jobs.

Methodology: [spec-driven-development.md](./spec-driven-development.md)  
Operating rules: [`../AGENTS.md`](../AGENTS.md)

---

## Goals

- Turn natural-language intents into reliable engineering work
- Keep **Specification Driven Development** as the control plane
- Let orchestrators (e.g. **Hermes**) schedule and batch tasks without bypassing specs
- Fail safe on PHI, auth, and clinical authority

---

## Roles

| Role | Examples | Responsibility |
| --- | --- | --- |
| **Orchestrator** | Hermes, cron+agent, chatops bot | Accept NL, schedule, create task envelopes, collect reports |
| **Coding agent** | opencode, Claude Code, Copilot, CI agent | Read specs, edit specs/code, run checks |
| **Human owner** | Maintainers | Approve high-risk spec changes, merge policy, secrets |

Orchestrators **do not** invent architecture. They dispatch work that follows `.specs/` and `AGENTS.md`.

---

## Entry points (what agents must load)

Minimum context pack for any automated run:

1. `AGENTS.md`
2. `.specs/README.md`
3. `.specs/spec-driven-development.md`
4. `.specs/agent-automation.md` (this file)
5. Task-specific specs from the envelope (`vision`, `architecture`, `domain-model`, …)

Optional when relevant:

- `.specs/security-hipaa.md` — any PHI/auth path
- `.specs/tech-stack.md` — dependencies, GraphQL, TypeScript
- `.specs/roadmap.md` — phase alignment

Do **not** treat `docs/**` as approved unless the task is to promote a draft into `.specs/`.

---

## Natural language intake

### Accepted sources

- Scheduled Hermes jobs (“every Monday: …”)
- Ad-hoc chat / issue comments
- CI-triggered maintenance prompts
- Human paste into an agent session

### Normalization (required)

Every run starts by producing a **task envelope** (see SDD doc). Pseudo-flow:

```text
NL text
  → classify (feature | fix | chore | docs | spike)
  → map to roadmap phase
  → list specs to read / change
  → write acceptance criteria + out_of_scope
  → risk score
  → if risk=high: require human gate before implement
  → else: spec → implement → verify → report
```

### Example prompts → expected behavior

| Natural language | Expected agent behavior |
| --- | --- |
| “Add allergy field on patient” | Update `domain-model.md` (+ validation notes), then schema/API/UI |
| “Use REST instead of GraphQL” | **Conflict** with architecture — refuse or propose spec change + human approval |
| “Draft weekly summary of open TODO comments” | Chore/docs only; no product behavior; no PHI from prod |
| “Ship autofill diagnosis without doctor OK” | **Refuse** — violates vision / security AI rules |

---

## Hermes (and similar orchestrators)

Hermes is treated as an **external scheduler + dispatcher**, not as a second source of product truth.

### Recommended job types

| Job type | Cadence (example) | Mode | Notes |
| --- | --- | --- | --- |
| Spec consistency audit | weekly | read-only | Diff mental model: code vs `.specs/` when code exists |
| Dependency / lockfile hygiene | weekly | low-risk PR | Stay inside `tech-stack.md` floors |
| Scaffold / feature slices | on demand | SDD full cycle | Always spec-first |
| Lint/typecheck fix batches | on fail | bounded | No behavior change |
| Roadmap grooming notes | biweekly | docs only | Propose, don’t silently rewrite vision |

### Job definition template (for Hermes config)

```yaml
name: canica-sdd-task
project: canica
instructions_files:
  - AGENTS.md
  - .specs/spec-driven-development.md
  - .specs/agent-automation.md
prompt: |
  {{natural_language}}
policy:
  spec_first: true
  allow_spec_edit: true
  allow_code_edit: true
  allow_git_push: false          # human or separate controlled pipeline
  allow_production_access: false
  allow_phi_fixtures: false
  require_human_for:
    - security-hipaa.md changes
    - tech-stack.md changes
    - auth/session behavior
    - clinical finalization rules
outputs:
  - task_envelope
  - summary_markdown
  - files_changed
  - verification_commands_run
```

### Scheduling tips

- Prefer **small, well-scoped** NL prompts over “build the whole EMR”
- One envelope per job; chain jobs explicitly (“job B depends on job A report”)
- Keep secrets in the orchestrator vault — never ask the agent to commit `.env`
- Point working directory at the canica repo root

---

## Permission tiers

### Tier 0 — Read-only

- Read repo and specs
- Produce reports, envelopes, plans
- No file writes

### Tier 1 — Spec + docs

- Edit `.specs/**`, `docs/**`, `README.md`, `AGENTS.md` when asked
- No application code
- Ideal for scheduled “document the decision” jobs

### Tier 2 — Implementation (default for coding agents)

- Tier 1 + application code
- Must run verify commands when available
- No force-push, no secret commit, no prod credentials

### Tier 3 — Release / deploy

- **Humans or locked CI only** by default
- Agents may open PRs if the environment allows; merging/deploy stays policy-gated

Unattended Hermes jobs should default to **Tier 0 or 1**, promote to Tier 2 only with explicit job config.

---

## Safety rails (non-negotiable)

1. **No PHI** in prompts logged to third parties when avoidable; never commit PHI
2. **No production database** access from coding agents unless a separate hardened runbook exists
3. **No silent clinical writes** — AI features remain suggest → physician confirm
4. **Authz is server-side** — do not “trust the UI”
5. **Stack stays approved** — GraphQL + TypeScript 7+ per `tech-stack.md`
6. **One product monorepo** — do not create sibling products here
7. **Spec conflicts** → stop; propose spec patch; do not “just make it work”

---

## Reporting format (agent → orchestrator)

After each run, return:

```markdown
## Result
- status: success | blocked | failed
- envelope_id: ...

## Specs
- read: ...
- changed: ...

## Code
- packages/apps touched: ...

## Verification
- commands: ...
- outcomes: ...

## Risks / follow-ups
- ...
```

Blocked runs must state **which rule** blocked them (spec conflict, tier, missing human gate).

---

## CI integration (future)

When CI exists, preferred pattern:

```text
PR opened (human or agent)
  → lint / typecheck / test
  → optional "spec-touch" check: behavior PRs must change .specs/** or include N/A rationale
  → human review for high-risk paths
```

Exact workflows live under `.github/` when added; they must not contradict this contract.

---

## Out of scope for automation

- Legal certification filings
- Production incident commander role
- Irreversible data deletions on real PHI stores
- Changing org-wide security policy without human approval
