# Dredd state

Live view of the workspace's P4 work. The orchestrator (opencode = the agent) updates this file as tasks move through the queue. Committed with each move (in the same branch as the code change, or as a standalone `chore(dredd): state` commit).

## In progress

- **P4-01 — Banner de promoción del mes** (next up, not started yet — paused per user decision)

## Done

- **P0.1 — Panel CI + pins** (hit-panel, branch `chore/panel-ci`, PR #15) — **merged 2026-08-05**. Dredd verdict: ready to ship (6/6 ✅, 0 findings; hermes). CI green on PR #15 (both checks pass, ~20s each). `.github/workflows/ci.yml` (F3 gate), `.nvmrc` 22, `packageManager` pnpm@10.32.1, `check` = `vitest run && astro check`, `pnpm-workspace.yaml` (allowBuilds). `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY` seen locally is non-defect (only outside TTY; GitHub Actions sets CI=true). Freebuff (backup backend) helped drive this task during the token shortage.

- **P4-05 — Doble request al cargar lista de envíos (parpadeo)** — repo `hit-panel`, branch `fix/panel-shipments-double-load`, commit `f1a61bc`. Diagnosis: search-debounce effect unconditionally rewrote `filters` on mount, creating a new object that re-triggered the `listPackages` effect 350 ms later. Fix: idempotent setters + seed initial search. Gate: `astro check` 0/0. Not yet reviewed by Dredd (first Dredd commit landed after — see backlog below).
- **P4-12 — Panel no carga los pesos de Cargotrack (clobber bug)** — repo `hit-ever2`, branch `fix/worker-preserve-list-only-fields`, commit `5116a75`. Diagnosis: `toPackageRow` emitted `null` for every list-only column when called with no list (email trigger, refresh-open), and the `merge-duplicates` upsert clobbered the original values. Fix: row now omits absent columns; same trick `manual_status*` already used. 8 new tests in `src/services/ingest.test.ts` covering omit-on-absent. Gate: `pnpm check` 22 files / 119 tests + wrangler dry-run OK. **Note for the operator:** the case #955165 is the user's reported "missing row". This fix protects future re-scrapes; historical clobbers need a one-time backfill (separate task).
- **Dredd setup (intro)** — repo workspace root, branch `feat/agent-orchestration`, commit `687b37c`. Adds `.dredd/review.sh`, "Who is Dredd" doc, section in `AGENTS.md`. No reviews run yet (Dredd can't review himself on day one).
- **Dredd automation + metrics + state** — repo workspace root, branch `feat/agent-orchestration`, commit `104fee6`. Adds `dredd` wrapper CLI, `.dredd/metrics.sh`, this state file, auto-improve hook in `review.sh`.
- **Dredd walk-up fix** — repo workspace root, branch `feat/agent-orchestration`, commit `64a5ff2`. The wrapper now walks up from the git toplevel to find `.dredd/`, so sub-repos inherit the workspace-level orchestration without a copy. Plus a `~/.local/bin/dredd` symlink for the user.

## Process notes

- **Independencia de reviewers:** los reviewers adversariales (`reviewer`, `security-reviewer`) usaron el mismo modelo/agente que el desarrollador (opencode/laguna-s-2.1-free). Esto reduce la independencia — el agente puede compartir patrones de error con el codegen original. **Optimización pendiente:** Dredd debería rotar los reviewers a través de agentes intercambiables (Hermes, Codex, otro CLI configurado) para reviews críticas, especialmente security. Anotado como follow-up P4-bajo (process improvement). Hasta que esté resuelto, las findings de security-reviewer deben ser validadas manualmente o con un segundo par de ojos humanos.

## Done (2026-08-14 smoke & deploy)

- **Módulo Configuración (Orbit)** — Worker PR #19 merged into `feat/tracker-api` (158/158 vitest + wrangler dry-run OK). Panel PR #24 merged to `main` (vitest 18/18 + astro check 0 errors, 2/2 CI checks SUCCESS). Panel deployed a `https://hit-panel.pages.dev` (HTTP 200, TTFB 286ms CDN). Worker live en `https://hit-ever-scraper.nativerse.workers.dev` (endpoints `/api/config/{branding,rates,audit}` responden 401 = activos). DB verificado vía InsForge CLI + PostgREST: 2 agencies, 4 rate_tables seedadas, 5 rate_rows por tabla, audit_logs = 0 rows. Función `config_reader()` incluye `'billing'`; índice `idx_audit_logs_request_id` aplicado. CSP img-src incluye `insforge.app` + `cdn.insforge.dev`. Router test nuevo para encoding inválido (`/envio/%zz` → overview). Smoke manual pendiente (requiere JWT): upload logo, CRUD tarifas, audit log. Branch `feat/config-module` borrada del panel.

## Backlog queue (from `backlog-p4.md`)

In order of when we'll tackle them (easiest / clearest first per the audit in backlog-p4.md intro):

1. **P4-01 — Banner de promoción del mes** — sitio, config-driven. ~70% claro. Repo `hit-cargo-web-v-1.2`. (now in progress)
2. **P4-02 — Conectar con redes (social)** — sitio, footer. ~60% claro. Repo `hit-cargo-web-v-1.2`. *Bloqueado: faltan URLs oficiales.*
3. **P4-10 — Auditoría de la landing con Kimi K3** — research, no code. ~70% claro. No sprint-able a producto.
4. **P4-08 — Botón refresh + carga manual** — panel, refinamiento de P2. ~70% claro. Repo `hit-panel`. *Solapa con P2 (refresh now).*
5. **P4-13 — Selección múltiple → batch de facturas** — panel, UI + RPC. ~65% claro. Repo `hit-panel`. *Depende de P2 audit log.*
6. **P4-07 — Asignar clientes manual** — panel, modal + autocomplete. ~65% claro. Repo `hit-panel`. *Depende de P2 audit log.*
7. **P4-03 — Analytics OJO** — sitio, GTM + GA4 + Meta. ~50% claro. Repo `hit-cargo-web-v-1.2`. *Solapa con P2 GTM triggers.*
8. **P4-09 — Skeleton lib + new loading (midu)** — sitio/panel, refactor visual. ~50% claro. *Sin design tokens definidos.*
9. **P4-04 — Ada auto (asistente AI)** — sitio, chatbot. ~40% claro. Decisiones de producto abiertas.
10. **P4-11 — Panel navegable por página (no one-page)** — panel, reescritura. ~60% claro. 1-2 sprints.
11. **P4-06 — Facturar / salida — alineación visual** — panel. **BLOQUEADO** por las fotos de referencia de Kevin.

## Backlog file changes

- `backlog.md` (workspace root) — modified by the user this session (+397 lines, added a P4 section summarizing the P4 specs in the main file). Untouched by Dredd; the user owns this.
- `backlog-p4.md` (workspace root) — the source of truth for P4 specs. Dredd reformulated **SPEC-P4-05** to point at `hit-panel` instead of the site (per the user's correction), with full diagnosis + acceptance criteria adjusted to the panel context.
