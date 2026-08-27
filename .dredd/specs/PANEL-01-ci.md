# SPEC-PANEL-01: CI del panel (harness P0.1)

**Repo:** hit-panel
**Fuente:** backlog.md §P0.1 — "agregar CI (`.github/workflows/ci.yml`) + `.nvmrc` / `packageManager` pin + tests mínimos. Hoy `pnpm check` es solo `astro check` (typecheck)."
**Estado:** Draft
**Autor:** Buffy (orchestrator)

---

## Resumen

Cerrar el hueco del harness de entrega del panel: hoy `pnpm check` es solo `astro check` (typecheck local) y no hay CI que corra el gate en PRs. El sitio y el worker ya tienen CI idéntico (`.github/workflows/ci.yml` → `pnpm install --frozen-lockfile && pnpm check`). El panel tiene tests vitest (11) que ningún CI corre.

## Problema

- Sin CI en PRs: un PR con gate rojo puede mergearse (branch protection no puede exigir CI que no existe).
- `pnpm check` no corre los tests: el gate local no detecta regresiones en `Overview`/`Shipments`/`ShipmentDetail`.
- Sin `.nvmrc` ni `packageManager`: la versión de Node/pnpm queda implícita y puede divergir entre devs y CI (deploy.yml ya usa Node 22 + pnpm 10 hardcodeados, pero no está pindado en el repo).

## Solución

1. `.github/workflows/ci.yml` — clon del de sitio/worker (F3 merge gate): checkout → `pnpm/action-setup@v4` → `setup-node@v4` con `node-version-file: .nvmrc` → `pnpm install --frozen-lockfile` → `pnpm check`.
2. `.nvmrc` — `22` (consistente con deploy.yml y el sitio).
3. `package.json` — `"packageManager": "pnpm@10.32.1"` (mismo pin que sitio/worker) y `"check": "vitest run && astro check"` (gate = tests + typecheck, mismo espíritu que sitio `vitest run && astro build`).
4. `pnpm-workspace.yaml` — `allowBuilds` para `esbuild`/`sharp` (estaba untracked; pnpm 10 bloquea postinstall de esbuild/sharp sin esto → `pnpm install --frozen-lockfile` en CI fallaría).

## Out of scope

- Branch protection en GitHub (acción del owner).
- CI del worker/sitio (ya existen).
- Migrar tests existentes.

## Acceptance Criteria

- [ ] `.github/workflows/ci.yml` corre `pnpm check` en PRs y pushes a branches no-default.
- [ ] CI usa `.nvmrc` (Node 22) y el pin `packageManager` (pnpm 10.32.1).
- [ ] `pnpm check` local = `vitest run && astro check` → 0 errores + tests verdes (11 tests).
- [ ] `pnpm install --frozen-lockfile` funciona en CI (allowBuilds de esbuild/sharp commiteado).
- [ ] No rompe `deploy.yml` existente (Direct Upload a Pages).
- [ ] El gate local pasa: `pnpm check` (11 tests + astro check 0 errores).

## Archivos

- `hit-panel/.github/workflows/ci.yml` — nuevo
- `hit-panel/.nvmrc` — nuevo
- `hit-panel/package.json` — `packageManager` + script `check`
- `hit-panel/pnpm-workspace.yaml` — commiteado (antes untracked)
