# Dredd — Context State (survives compaction)

## Current session (Aug 4, 2026)
- Created command-code (cmdc) integration for Dredd
- Files: `.commandcode/agents/dredd-judge.md`, `dredd-sentinel.md`, `README.md`
- Updated: `.dredd/review.sh` (cmdc case), `~/.local/bin/dredd` (shortcuts)
- cmdc v1.12.0 installed at `~/.nvm/versions/node/v24.18.1/bin/cmd`
- Usage: `dredd cmdc review "spec-ref"` or `DREDD_AGENT_KIND=cmdc dredd review`

## Completed today
- Fixed CI lockfile mismatch (hit-cargo-web-v-1.2, pushed to master)
- Voted workflow: Dredd decides → cron/humans implement → Dredd reviews → human integrates/releases
- Rewrote dredd wrapper provider-agnostic (codex/hermes/claude/opencode/cmdc/kimi)
- Default changed from codex → hermes
- Created hit-panel test suite (9 vitest smoke tests, all passing)
- Created board.md kanban for all 3 projects
- Added `dredd board` and `dredd status` colored commands
- Fixed malformed hit-cargo-web/package.json
- Created `.dredd/config` (DREDD_AGENT_KIND=hermes)
- Added cmdc as Dredd backend (just completed)

## Active tasks
- User is reviewing PRs (hit-panel #12, hit-cargo-web-v-1.2 master)
- User flagged context limit — compact after documenting

## Blocked
- hit-panel pnpm check fails (preact/astro compat) — needs fix for tests in CI
- git mcp not installed
- Codex login broken (Google auth error)
- command-code not yet paid for by user (installed but free tier)

## Key commands
- `dredd board` — colored kanban
- `dredd status` — Dredd state
- `dredd review "spec"` — adversarial review (hermes default)
- `dredd cmdc review "spec"` — adversarial review (command-code)
- `dredd security "spec"` — security audit
- `dredd full "spec"` — both in parallel

## Agent providers
- hermes (default) — Gemini 3 Pro via GEMINI_API_KEY
- codex — OpenAI Codex CLI (broken auth)
- cmdc — Command Code v1.12.0 (installed, not paid)
- claude — Claude CLI
- opencode — opencode.ai CLI (currently active session)
