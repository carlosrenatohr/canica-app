# Backlog — post-MVP tasks & technical debt

Pending work that is not part of the current milestone. Items move into
`progress.md` as milestones when scoped. Anything here is fair game to pick up
once the MVP loop is complete.

## How to use

- One line per item, prefixed with status: `[ ]` open, `[x]` done.
- Link the item to a milestone when it becomes one.
- Add anything discovered during work that we chose not to fix now.

---

## Open

- [ ] **Audit login / failed-login / logout** — not yet written to `audit_logs`.
      Planned hook point is Better Auth `hooks.after`; needs DB access inside
      `packages/auth`. See `docs/how-to/auth.md` → Known gaps. Target M16.
- [ ] **Admin endpoint for role changes** — roles are currently seed/data-only.
      `user:manage` permission exists but no route uses it. Needs an admin
      "update user role" endpoint (invite/role management).
- [ ] **Lint failing for `@canica/api` and `@canica/config`** — pre-existing:
      root `eslint.config` ignores `**/*.ts` by design (TS validated by tsc), so
      those packages' `lint` scripts error with "all files ignored". Not caused by
      M9. Decide: per-package eslint config for TS or drop the script.
- [ ] **M7 GraphQL unpark** — duplicate `graphql@16/17` module issue; see
      `docs/how-to/graphql-known-issue.md`. Resuming GraphQL is tracked with M7.
- [ ] **Remove `ORG_ID` dev fallback** — `.env` still has `ORG_ID`; the API no
      longer reads it (session actor is authoritative). Clean up env + docs.
- [ ] **Audit tests for cross-org access** — org-scoping is verified manually and
      by repo shape; add automated cross-org denial tests once a DB test harness
      exists (currently unit tests mock the DB).
- [ ] **MFA / SSO / passwordless** — future per `security-hipaa.md`; Better Auth
      plugins exist. Revisit after MVP.
- [ ] **`getPermissionsForRole` cache** — per-request memoized in middleware but
      not global; fine for now, revisit if authz becomes a hot path.

## Done

(none yet — populate as items close)

---

## Milestone linkage

- Audit login events → M16 (audit log UI) when that milestone starts.
- Role management endpoint → likely a Phase 1 admin slice; candidate for M11+.
