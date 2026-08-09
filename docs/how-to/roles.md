# Roles & Test Users

How role-based access control works in canica and test credentials for local development.

## Role-permission matrix

Permissions are stored in `role_permissions` table and seeded by `packages/db/src/seed.ts`.

| Permission | Doctor | Receptionist | Administrator |
| --- | --- | --- | --- |
| `patient:read` | ✅ | ✅ | — |
| `patient:write` | ✅ | — | — |
| `patient:archive` | ✅ | — | — |
| `consultation:read` | ✅ | — | — |
| `consultation:write` | ✅ | — | — |
| `consultation:finalize` | ✅ | — | — |
| `diagnosis:read` | ✅ | — | — |
| `diagnosis:write` | ✅ | — | — |
| `prescription:read` | ✅ | — | — |
| `prescription:write` | ✅ | — | — |
| `appointment:read` | ✅ | ✅ | — |
| `appointment:write` | ✅ | ✅ | — |
| `attachment:read` | ✅ | — | — |
| `attachment:write` | ✅ | — | — |
| `audit:read` | — | — | ✅ |
| `user:manage` | — | — | ✅ |
| `org:manage` | — | — | ✅ |

## Route access by role

| Route | Doctor | Receptionist | Administrator |
| --- | --- | --- | --- |
| `/` (Dashboard) | ✅ | ✅ | ✅ |
| `/patients` | ✅ | ✅ (read-only) | — |
| `/patients/[id]` | ✅ | ✅ (read-only) | — |
| `/patients/[id]/timeline` | ✅ | — | — |
| `/patients/[id]/consultations` | ✅ | — | — |
| `/patients/[id]/consultations/[id]` | ✅ | — | — |
| `/patients/new` | ✅ | — | — |
| `/appointments` | ✅ | ✅ | — |
| `/appointments/new` | ✅ | ✅ | — |
| `/consultations` | ✅ | — | — |
| `/audit` | — | — | ✅ |
| `/settings` | — | — | ✅ |

## Test users

Created by `pnpm --filter @canica/db db:seed`.

| Email | Password | Role | Use case |
| --- | --- | --- | --- |
| `dr.canica@example.com` | `Doctor123!` | doctor | Test clinical flows (patients, consultations, appointments, timeline) |
| `admin.canica@example.com` | `Admin123!` | administrator | Test admin flows (audit log, settings) |

## How to test

1. Run the seed: `pnpm --filter @canica/db db:seed`
2. Start the app: `pnpm run dev`
3. Open http://localhost:3000
4. Log in with one of the test users above

## How to create users manually (via API)

The API must be running (`pnpm --filter @canica/api dev`).

Sign up (role defaults to `doctor`):

```bash
curl -c cookies.txt -X POST http://localhost:3001/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","password":"Pass123!","name":"Dr X","organizationId":"<ORG_ID>"}'
```

> **Note:** Role is `input: false` in Better Auth config — users cannot self-assign `administrator`.
> Roles are set only via seed or direct DB update.

## Key files

| File | Purpose |
| --- | --- |
| `packages/db/src/seed.ts` | Creates org, users, patients, and role-permission matrix |
| `packages/db/src/schema.ts` | `organizationRole` enum, `rolePermissions` table |
| `packages/db/src/repos/permissions.ts` | `getPermissionsForRole()` — reads matrix from DB |
| `packages/auth/src/auth.ts` | Better Auth config — role defaults to `doctor`, `input: false` |
| `apps/api/src/auth.middleware.ts` | `requirePermission()` Hono middleware |
| `apps/web/src/lib/roles.ts` | `getRoleLabel()` — maps role strings to Spanish labels |
| `apps/web/src/components/layout/sidebar.tsx` | Role-aware navigation (commonNav vs adminNav) |
