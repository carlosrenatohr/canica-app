# Prompt improvements (curated)

Append-only log of prompt-improvement suggestions extracted from reviewer and security-reviewer self-evaluations. The orchestrator writes here; a human reads + applies.

Format:
- `YYYY-MM-DD — <skill> — <review-type>` — suggestion — applied? (yes/no)

- 2026-08-04 — reviewer — general — Explicitly tell the reviewer to flag repo-scope mismatches when the spec targets another repo or UI surface than the diff actually changes — applied? no (source: P4-12 review on hit-ever2, where the spec called for a panel fix but the patch only touched the worker; the reviewer caught it as [Alta] and recommended this prompt tweak in the self-eval).
- 2026-08-05 — reviewer — general — When reviewing CI workflow additions that mirror existing repo patterns, diff the new workflow against the sibling repos' CI yml file by file, and verify local gate parity (pnpm check) by actually running it rather than trusting the spec's claim of test count — applied? no (source: P0.1 panel CI review via hermes; reviewer also confirmed pnpm/action-setup@v4 resolves packageManager when no version: input is given).
