# GraphQL Layer: Known Issue and Temporary Parking

> Status: `parked` — `apps/api` currently serves REST while the GraphQL layer
> is rebuilt. This note records why, and how to resume it.

## Why GraphQL was removed from the active API

On 2026-08-03 the GraphQL layer (`packages/graphql` + `graphql-yoga` in `apps/api`)
hit a blocking dependency issue during the M7 scaffold. It was **parked, not abandoned**:
the spec still targets GraphQL as the product API (`.specs/tech-stack.md`),
and `packages/graphql/` remains on disk but is excluded from the pnpm workspace.

The API now exposes **REST** on Hono for domain CRUD (patients) until GraphQL returns.
This is an explicit, reversible deviation agreed with the maintainer.

## Root cause

### 1. Duplicate `graphql` module instances

`graphql-yoga@5.21.2` declares `graphql` as a flexible peer
(`^15.0.0 || ^16.0.0 || ^17.0.2`). pnpm installed **two** instances side by side:

- `graphql@16.14.2` (used by `apps/api`)
- `graphql@17.0.2` (resolved for part of the `@graphql-tools/*` peer chain)

At runtime GraphQL executes `instanceOf` checks against a single module identity.
A schema built by one copy and executed by the other throws:

```
Cannot use GraphQLSchema "... from another module or realm.
Duplicate "graphql" modules cannot be used at the same time...
```

Yoga masked the real error as `INTERNAL_SERVER_ERROR`, which made it hard to spot.

### 2. `pnpm.overrides` silently ignored

pnpm 11 no longer reads the `pnpm` field in `package.json`. The override
`pnpm.overrides.graphql: "16.14.2"` was **ignored** with a warning:

```
[WARN] The "pnpm" field in package.json is no longer read by pnpm.
```

The correct home is `pnpm-workspace.yaml` `overrides:` (already migrated there,
`graphql: 16.14.2` + `graphql@17: 16.14.2`).

### 3. Stale `typescript@3.9` bin in a workspace package

A leftover `packages/graphql/node_modules/.bin/tsc` shim pointed at
`.pnpm/typescript@3.9.10` from an unrelated earlier project. Running
`pnpm --filter @canica/graphql exec tsc` then used TypeScript 3.9, which
rejects `target: ES2024`, `moduleResolution: bundler`, and
`verbatimModuleSyntax`. Removed by deleting the stale `node_modules/`.

### 4. Global `@types` from the home directory

TS auto-included `/home/renato/node_modules/@types/whatwg-url/index.d.ts`
(a broken, stale install outside the repo). Fixed by scoping
`packages/tsconfig/base.json` to `"types": ["node"]`.

## How to resume (checklist)

1. Re-add `packages/graphql` to `pnpm-workspace.yaml` (`remove` the
   `!packages/graphql` exclusion).
2. Ensure `pnpm-workspace.yaml` overrides pin `graphql` to a single version
   (`graphql: 16.14.2` — already present).
3. `rm -rf packages/graphql/node_modules && pnpm install` to drop any stale
   `.bin` shims.
4. Verify only one `graphql` instance: `ls node_modules/.pnpm | grep -E "^graphql@"`.
5. Re-wire `apps/api` to `createYoga(...).fetch` over the Hono handler, or
   use `@graphql-tools/schema` + one `graphql` instance.
6. Restore the `@canica/sdk` codegen step from the schema (M7).

## What the REST interim keeps for later

- `packages/graphql/` source (SDL schema, resolvers, context, tests) untouched.
- The org-scoping / role guards in resolvers were ported to the REST routes
  (`x-org-id` header, `@canica/db` repos, `@canica/validation` parsing).
- Migrating REST → GraphQL should reuse the same `@canica/db` repositories;
  only the HTTP surface changes.