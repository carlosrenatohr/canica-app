# Domain Types

Canonical clinical domain types live in `packages/types`.

## Running checks

```bash
pnpm --filter @canica/types test
pnpm --filter @canica/types typecheck
```

## Source of truth

Types mirror [`.specs/domain-model.md`](../.specs/domain-model.md). If behavior changes, update the spec first.
