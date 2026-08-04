# Shared Validation

Input/output Zod schemas live in `packages/validation`.

## Running checks

```bash
pnpm --filter @canica/validation test
pnpm --filter @canica/validation typecheck
pnpm --filter @canica/validation lint
```

## Source of truth

Schemas mirror [`.specs/domain-model.md`](../.specs/domain-model.md) and stay aligned with types in `packages/types`. Update the spec first when a clinical field changes.

## Patterns

- Input schemas end in `Input` and are `partial` friendly where edits are partial
- Status enums use `z.enum` with exact domain values
- Defaults live on the schema (e.g. `status: PrescriptionStatus.default("active")`)
- PHI inputs validated at GraphQL/service boundaries, never logged raw
