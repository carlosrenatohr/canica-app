# Dredd

> *"I am the law."* — Judge Dredd

Dredd is the HIT Cargo workspace's **multi-agent code reviewer**. It lives in this directory and orchestrates Codex (or another agent) in a Herd split-pane to give a 2nd opinion on every change before it lands.

## Who is Dredd

Named after **Judge Dredd** (2000 AD comics / movie), the law-enforcing judge of Mega-City One. The metaphor fits the job:

- **Dredd judges the diff.** No rubber-stamping — the reviewer returns a verdict (Alta / Media / Baja), with `file:line` evidence and a concrete fix for every finding.
- **Dredd is the law.** Security is enforced by `dredd-sentinel` (the security-reviewer skill), the audit counterpart to `dredd-judge` (the reviewer skill). Same uncompromising standard, different domain.
- **Dredd has no appeal.** Findings are severity-tagged, not negotiated. Alta is a blocker; Media is a fix-up; Baja is an ack.
- **Dredd self-evaluates.** Every run ends with a self-evaluation that proposes a prompt improvement. The orchestrator can auto-append good ideas to `.dredd/improvements.md`; you curate; nothing auto-edits the skill.

If we add more agents later, they fit the cast: `dredd-mediator` (perf), `dredd-warden` (a11y), `dredd-informant` (docs). Same pattern, different specialization.

## CLI: `dredd` (at repo root)

A thin wrapper around the recipes in this dir. Always run from the repo root.

```bash
dredd review "backlog-p4.md#spec-p4-05"     # dredd-judge (general)
dredd security "backlog-p4.md#spec-p4-05"   # dredd-sentinel (security)
dredd full "backlog-p4.md#spec-p4-05"       # both in parallel (2 Herd panes)
dredd metrics                               # summary of past reviews
dredd metrics --since=7d --by=week          # last 7 days, aggregated by week
dredd metrics --append                      # also append a row to .dredd/metrics.md
dredd state                                 # show .dredd/state.md
dredd help                                  # this help
```

## Sub-agents (user-level skills)

Both in `~/.config/opencode/skills/`, available to every project:

- **`reviewer/SKILL.md`** → invoked as `dredd-judge`. Adversarial code review.
- **`security-reviewer/SKILL.md`** → invoked as `dredd-sentinel`. Security audit against the HIT checklist (PII allowlist, RLS default-deny, secrets, CSP, SQL/RPCs, auth, headers, session locks).

Both finish with a **self-evaluation** the orchestrator can use to sharpen the next run.

## Recipe: `.dredd/review.sh`

Spawns a reviewer in a Herd split-pane, sends the diff + spec, waits for `done`, prints the result.

```bash
.dredd/review.sh general  "backlog-p4.md#spec-p4-05"
.dredd/review.sh security "backlog-p4.md#spec-p4-05"
```

The `dredd` wrapper is a friendlier front-end. Use it unless you need the raw recipe.

Requirements:
- `herdr 0.7+` (`brew install herdr` or check the install page)
- `codex` CLI on PATH
- run from inside a Herd pane (so the orchestrator's context is reachable)

## Metrics: `dredd metrics`

Reads `.dredd/logs/*.md` and produces a Markdown table of date / type / Alta / Media / Baja / Total. Pure bash + `grep` + `awk` — no MCP, no skill, no external API. The full historical log lives in `.dredd/metrics.md` (one row per `--append` call).

If you want it fully wired up to an MCP later, the most natural fit would be `codebase-memory-mcp` to index `.dredd/logs/` and query patterns — but the bash parser is cheaper and the logs are small.

## State: `dredd state`

`.dredd/state.md` is the live tracker of the workspace's P4 work: in progress, done, queue, backlog file changes. The orchestrator updates it as tasks move. `dredd state` just prints it.

## Auto-improve (opt-in)

`review.sh` can auto-append a row to `.dredd/improvements.md` when the self-eval contains a meaningful "Suggested prompt improvement:". Default OFF. Enable per-run:

```bash
DREDD_AUTO_IMPROVE=1 dredd review "backlog-p4.md#spec-p4-05"
```

Threshold: suggestion must be non-empty, > 30 chars, and not literally "none" / "None.". You still curate `improvements.md` by hand and edit the skill file with a `chore(skills):` commit.

## Workflow

For every coding task:

1. **Orchestrator (opencode) implements** — branch off default, edit, `pnpm check`, draft commit.
2. **STOP for human approval** of the commit message.
3. **Run reviews** (in parallel, in Herd panes):
   ```bash
   dredd full "backlog-p4.md#spec-p4-XX"
   ```
4. **Integrate findings** before commit:
   - **Alta** → fix in this branch, re-run gate, re-review.
   - **Media** → fix in this branch or in a follow-up before merge.
   - **Baja** → ack-only; capture as a note in the PR.
5. **Commit** the orchestrator's diff (not the review fixes; those are separate commits in the same branch).
6. **Append self-eval to improvements** (if `DREDD_AUTO_IMPROVE=1`) or do it by hand.
7. **Refresh Codebase Memory** if the diff was structural — `detect_changes` (cheap), then `index_repository` (expensive, only when significant). The orchestrator decides; nothing is automatic.
8. **Push** the branch: `git push -u origin <branch>`.
9. **Open a PR** with the standard body (What / Why / How verified / Migration / Secrets / Smoke). The human approves and merges — the orchestrator never auto-merges.

## Agent flexibility (`DREDD_AGENT_KIND` + `DREDD_MODEL`)

The reviewer pane is launched via `herdr agent start --kind "$DREDD_AGENT_KIND" --pane … -- -m "$DREDD_MODEL"`. Both env vars override sensible defaults:

```bash
# default: codex with gpt-5.4
dredd review "backlog-p4.md#spec-p4-05"

# switch to Hermes (free tier, lower quality)
DREDD_AGENT_KIND=hermes dredd review "backlog-p4.md#spec-p4-05"

# override just the model
DREDD_MODEL=gpt-5.6-luna dredd review "backlog-p4.md#spec-p4-05"

# both
DREDD_AGENT_KIND=claude DREDD_MODEL=claude-sonnet-4.6 dredd review "backlog-p4.md#spec-p4-05"
```

Run `herdr agent --help` for the full list of supported kinds (`codex`, `hermes`, `claude`, `opencode`, `gemini`, `kimi`, `kiro`, `droid`, `grok`, `amp`, `qodercli`, …). Note: quality varies — codex is the default because its prompt adherence is what the skill prompts were tuned against. Hermes and friends may need a future `DREDD_PROMPT_VARIANT` to follow the same checklist strictly.

## Manual only

Dredd is **never** triggered automatically. There is no `lefthook` entry that calls it, no CI step, no scheduled cron. The only way it runs is when a human types `dredd review`, `dredd security`, or `dredd full` from a Herd pane. This is by design — Dredd is a 2nd-opinion checkpoint, not a gate.

## Layout

```
.dredd/
├── review.sh              # the recipe (tracked)
├── metrics.sh             # metrics parser (tracked)
├── README.md              # this file (tracked)
├── state.md               # live work tracker (tracked)
├── improvements.md        # curated prompt improvements (tracked, append-only)
├── templates/
│   └── review-prompt.md   # prompt template the recipe fills (tracked)
├── logs/                  # per-run output (gitignored) — one file per review
└── runs/                  # per-run state (gitignored) — diffs + raw agent transcripts
dredd                     # wrapper CLI at repo root (tracked, executable)
```

## Self-improvement loop

Dredd's judges and sentinel end every review with a **self-evaluation** that includes a *Suggested prompt improvement* line. Two ways to capture it:

1. **Auto** (opt-in): `DREDD_AUTO_IMPROVE=1 dredd review ...` appends to `.dredd/improvements.md` if the suggestion meets the threshold.
2. **Manual**: the orchestrator (you or the agent) reads the self-eval from `.dredd/logs/...` and appends the good ones.

When you accept an improvement, you edit the skill file yourself (with a `chore(skills):` commit) so the change is reviewable in git. Nothing auto-edits the skill prompts. The human stays in the loop.

## Reuse across projects

Dredd works in any project:

1. Copy `dredd` and `.dredd/` (excluding `logs/` and `runs/`) into the new project.
2. The skills are user-level — already there.
3. Adjust the `BASE` branch detection in `review.sh` if the project uses a different default branch.

For non-HIT projects, edit `.dredd/templates/review-prompt.md` to point at the project-specific security checklist (the HIT checklist lives in the security-reviewer skill).
