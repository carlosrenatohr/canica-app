# Authentication & Authorization (M9)

How auth works in canica and how to test it locally against Supabase Cloud.

## Stack

- **Identity & sessions:** Better Auth (`packages/auth`) — email/password, sessions in `sessions` table.
- **Authorization:** permission-based RBAC, matrix stored in `role_permissions` (seeded).
- **Org scoping:** every PHI repo query filters by `organization_id` from the session actor.

## Flow

```
Request → /api/auth/* (Better Auth) → sessionMiddleware (sets actor) → requirePermission (checks role permissions) → org-scoped repo → audit_logs
```

## Key files

| File | Purpose |
| --- | --- |
| `packages/auth/src/auth.ts` | `createAuth()` — Better Auth instance, Drizzle adapter, `additionalFields: organizationId, role` |
| `packages/auth/src/permissions.ts` | `Permission` catalog + `hasPermission` / `requirePermission` |
| `packages/db/src/repos/permissions.ts` | `getPermissionsForRole()` — reads matrix from `role_permissions` |
| `packages/db/src/repos/audit.ts` | `writeAudit()` — append-only audit entries |
| `apps/api/src/auth.middleware.ts` | `sessionMiddleware` + `requirePermission` Hono middleware |
| `apps/api/src/index.ts` | Route wiring: `/api/auth/*`, `/me`, patients CRUD |

## Security decisions

- **`role` is NOT client-input** (`input: false`, default `"doctor"`). A user cannot
  self-assign `administrator` at signup. Roles are changed by data/seed for now.
- **Deny by default:** `requirePermission` returns 403 when the role lacks the permission.
- **Org scoping is server-enforced** in every repo call via the actor's `organizationId` —
  never trusted from request headers.
- PHI write actions (`patient.create/update/archive`) are audited to `audit_logs`.

## Manual verification (Supabase Cloud)

Start the API:

```bash
pnpm --filter @canica/api dev
```

Sign up (role defaults to `doctor`):

```bash
curl -c cookies.txt -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"dr@example.com","password":"TestPass!123","name":"Dr X","organizationId":"<ORG_ID>"}'
```

Sign in:

```bash
curl -c cookies.txt -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"dr@example.com","password":"TestPass!123"}'
```

Acting on the session:

```bash
curl -b cookies.txt http://localhost:3000/me
curl -b cookies.txt http://localhost:3000/patients
```

Denial checks:

```bash
# no session → 401
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/patients
# receptionist role without patient:write → 403 (POST)
# other-org user reading org A patient → 404
```

## Known gaps (tracked)

- Login / failed-login / logout are **not yet audited**. Better Auth `hooks.after`
  is the planned hook point; requires DB access inside the auth package. Tracked in
  M16 (audit UI) work.
- Role changes have no admin endpoint yet (seed/data only).
- No MFA / SSO / passwordless (future per `security-hipaa.md`).
