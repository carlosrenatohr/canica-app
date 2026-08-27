# Prompt Relator — Workflow de Agentes en el Workspace HIT Cargo

## Propósito

Este prompt resume cómo realmente funciona el **workflow de agentes de coding asistido por IA** en el workspace `~/Codee/hit`. Sirve como punto de partida para cualquier agente (humano o IA) que se una al proyecto: explica el orquestador (Dredd), los sub-agents, el gate de verificación, el ciclo de revision, y cómo el sistema se auto-documenta y crece junto al código.

---

## 1. Arquitectura del workspace

El workspace `~/Codee/hit` es un monorepo-local que agrupa 3 repos activos de GitHub (`carlosrenatohr/…`):

| Carpeta | Repo | Rama default | Rol |
|---|---|---|---|
| `hit-cargo-web-v-1.2` | `hit-landing` | `master` | Sitio público (Astro 6 + Preact + Tailwind + Cloudflare Pages SSG) |
| `hit-ever2` | `hit-ever` | `feat/tracker-api` | Worker Hono: API tracking + scraper Cargotrack + ingesta a InsForge (Cloudflare Workers) |
| `hit-panel` | `hit-panel` | `main` | Panel interno (Astro 6 + Preact + InsForge directo con JWT/RLS) |
| `backlog-p4.md` | — | — | Specs/P4 (ideas sin owner) |
| `board.md` | — | — | Kanban de tareas (única fuente de tracking) |
| `AGENTS.md` | — | — | **Fuente de verdad canónica** — reglas, convenciones, ADRs, workflow |
| `ONBOARDING.md` | — | — | Estado vivo de sesión + handoff |

**Datos**: una sola DB InsForge compartida. El Worker es el único scraper y el único con admin key. El sitio lee vía Worker (`/track/:id`). El panel lee/escribe InsForge directo con JWT por usuario (RLS por rol). El Worker no se toca desde el panel, ni viceversa.

---

## 2. El orquestador: Dredd

**Dredd** es el revisor multi-agente del workspace. No corre automáticamente — es un checkpoint de 2da opinión, invocado a mano por un humano desde un pane de Herd (tmux). Está implementado en:

- `.dredd/` — directorio raíz del workspace (review.sh, metrics.sh, state.md, config, specs/, logs/, runs/)
- `dredd` — wrapper CLI en `~/.local/bin/dredd` (encontrado en PATH)

### Cómo funciona Dredd

```bash
# Desde un pane de Herd, en cualquier sub-repo (sube el árbol para encontrar .dredd/):
dredd review "board.md#01"       # dredd-judge  (general adversarial review)
dredd security "board.md#01"    # dredd-sentinel (security audit)
dredd full "board.md#01"        # ambos en paralelo (2 panes)
dredd board                     # kanban coloreado
dredd status                    # estado del trabajo P4
dredd metrics                   # tabla de findings históricos
```

**Provider**: `.dredd/config` dice `DREDD_AGENT_KIND=hermes` (default). Se puede override con env var: `DREDD_AGENT_KIND=codex dredd review "spec"`. Los providers soportados incluyen `hermes`, `codex`, `claude`, `cmdc` (command-code), `freebuff`, `opencode`, `kimi`. `codex` es el default de calidad (los skills están tuneados para él), pero el usuario cambió a `hermes` como default.

El workflow por debajo:
1. `dredd` (wrapper) detecta `.dredd/` caminando hacia arriba desde el repo raíz.
2. Carga `.dredd/config` (persistent settings).
3. Llama a `.dredd/review.sh <general|security> <spec-ref>`.
4. `review.sh`: genera un diff (`git diff BASE...BRANCH`), lo salva en `.dredd/runs/<timestamp>-<type>.diff`, spawnea un agente en un split-pane de Herd (`herdr agent start`), le envía el prompt template (`.dredd/templates/review-prompt.md` interpolado con el skill path, diff path, spec-ref), espera a que termine (`--wait --timeout 180000`), y lee el resultado.
5. El resultado se salva en `.dredd/logs/<timestamp>-<type>.md` y se imprime a stdout.
6. Si `DREDD_AUTO_IMPROVE=1`, auto-extrae la sugerencia de self-eval y la apenda a `.dredd/improvements.md`.

### Sub-agents (skills)

Los skills de los reviewers viven en `~/.config/opencode/skills/`:
- **`reviewer/SKILL.md`** → `dredd-judge`: adversarial code review. Checklist: acceptance criteria, regressions, edge cases, error paths, idempotencia, tests, estilo. Output: Coverage ✅/❌/⚠ + Findings [Alta]/[Media]/[Baja] + Self-evaluation.
- **`security-reviewer/SKILL.md`** → `dredd-sentinel`: security audit. Checklist: PII allowlist, RLS default-deny, viewer no-write, secrets en `wrangler secret` (nunca en `[vars]`), CSP/header, SQL injection (parameterized), session lock, rate limit en endpoints públicos. Output: Security Audit + Findings + Self-evaluation.

Ambos skills terminan con un **self-evaluation** que incluye una *Suggested prompt improvement*. El orquestador (humano) curatea `.dredd/improvements.md` y aplica las mejoras al skill con un commit `chore(skills):`.

### Command Code (cmdc) integration

Hay un directorio `.commandcode/` con agentes predefinidos (`dredd-judge.md`, `dredd-sentinel.md`). El `cmdc` es un backend alternativo (command-code CLI v1.12.0). Se invoca con `dredd cmdc review "spec"` o `DREDD_AGENT_KIND=cmdc dredd review "spec"`. El prompt se le pasa al agente de command-code en el pane.

### Metrics

`.dredd/metrics.sh` parsea `.dredd/logs/*.md` y produce una tabla Markdown con conteos de Alta/Media/Baja por fecha y tipo. Usa `grep -c` para contar findings. GNU-specific (`date -d`), funciona en Linux/WSL pero no en macOS. La tabla histórica se guarda en `.dredd/metrics.md` con `--append`.

---

## 3. Cómo se documenta y autoforma

El workflow está **documentado dentro del workspace mismo**, no en memoria alguna:

- **`AGENTS.md`** (raíz) — fuente de verdad canónica: arquitectura, coding standards, ADRs, reglas de seguridad, workflow de migraciones, etc.
- **`ONBOARDING.md`** (raíz) — estado vivo de sesión: qué se hizo, qué falta, entorno & secretos, reglas Cargotrack, hilos abiertos.
- **`backlog.md`** (raíz) — prioridad P0–P3 (acciones concretas).
- **`backlog-p4.md`** (raíz) — P4 specs (ideas sin owner). Cada spec tiene: contexto, objetivo, alcance mínimo, criterios de aceptación, archivos a tocar.
- **`board.md`** (raíz) — Kanban: `# | Task | Spec | Branch | Status | PR`. Status: 📋 Backlog → 🔜 Ready → 🔄 In Progress → 🔍 In Review → ✅ Done.
- **`.dredd/specs/`** — specs formalizadas de tasks de Dredd (ej. `PANEL-01-ci.md`, `PANEL-08-refresh.md`).
- **`.dredd/state.md`** — estado vivo de P4 (in progress, done, queue).
- **`.dredd/improvements.md`** — sugerencias de prompt curadas, append-only, una por fila con `applied? (yes/no)`.
- **`.dredd/logs/`** — salida completa de cada review (gitignored).
- **`.dredd/runs/`** — diffs + transcripts raw de cada review (gitignored).
- **`AGENTS_AUDIT.md`** — histórico de cómo se consolidó AGENTS.md (agosto 2026).

**Autoformación**: el sistema crece documentando cada decision. Cuando Dredd revisa un diff, el log queda en `.dredd/logs/`. Las specs capturan criterios de aceptación. El `state.md` y `board.md` trackingan estado. `improvements.md` captura lecciones. El `backlog-p4.md` auto-registra qué specs se resolvieron ("Hecho" al final).

---

## 4. El ciclo de trabajo (inseparable del gate)

Todo cambio — humano o IA — pasa por este ciclo (documentado en `AGENTS.md` § *AI Agent Workflow*):

1. **Explorar** (agente read-only) — lee docs, codebase memory, graphify. No confiar en memoria.
2. **Planear** — spec revisable antes de escribir (para cambios no triviales). Specs viven en `backlog-p4.md` o `.dredd/specs/`.
3. **Implementar** — commits pequeños y atómicos (un commit = una idea). Rama desde default branch.
4. **Verificar** — correr el gate local: **`pnpm check`**. Iterar hasta verde. Esto es lo que hace confiable el trabajo asistido por IA.
   - Sitio: `vitest run && astro build`
   - Worker: `vitest run && wrangler deploy --dry-run`
   - Panel: `vitest run && astro check`
5. **Revisar** — Dredd (2da opinión): `dredd full "spec-ref"`. Findings: [Alta] → fix in branch; [Media] → fix o follow-up; [Baja] → ack.
6. **Entregar** — PR → CI verde + 1 review → merge → deploy → smoke.

El gate `pnpm check` es el contrato durable. CI en GitHub (`.github/workflows/ci.yml`) corre el mismo gate en cada PR. El sitio y el worker ya lo tienen; el panel lo agregó en P0.1 (merged 2026-08-05).

---

## 5. Ejemplo de una review real (P4-12)

**Tarea**: P4-12 · "Panel no carga los pesos de Cargotrack (clobber bug)"
- **Spec**: `backlog-p4.md#SPEC-P4-12`
- **Repo**: `hit-ever2`
- **Branch**: `fix/worker-preserve-list-only-fields`
- **Commit**: `5116a75`

**Flujo real**:
1. El orquestador (opencode/hermes) implementa el fix: evita que `toPackageRow` haga `null` en columnas list-only, previniendo el clobber en refrescos parciales.
2. Corre `pnpm check` → 22 archivos / 119 tests + wrangler dry-run OK. ✅
3. Corre `dredd review "backlog-p4.md#spec-p4-12"`.
4. Dredd generó el log en `.dredd/logs/20260805T023332Z-general.md`. El output (extraído de los archivos de runs) fue:
   - **Coverage**: 4/5 ❌ (el spec pide un fix de panel en kg, pero el diff solo toca el worker). 1/5 ⚠ (mitiga el clobber pero no puebe first-seen detail-only sin peso).
   - **Findings [Alta]**: "Spec P4-12 is still not implemented for users — the patch fixes one backend overwrite path, but the requested behavior was 'panel shows the real weight in kg with a clear unit.' The worker still stores/returns pounds."
   - **Findings [Media]**: "Detail-only ingestion still cannot populate a missing weight" + "README tells operators to send the hook secret in the query string (autocontradictorio con la auditoría de seguridad)."
   - **Self-evaluation**: propuso una mejora de prompt → "Explicitly tell the reviewer to flag repo-scope mismatches when the spec targets another repo or UI surface than the diff actually changes." → apendida a `improvements.md`.

Este ejemplo muestra dos cosas clave del workflow:
- **Dredd es adversarial** — no rubber-stampea. Si el diff no cubre el spec completo, lo dice con [Alta] y pide fix o estrechamiento de scope.
- **Dredd se autoforma** — el self-evaluation propone mejoras que se capturan y luego se aplican al skill.

---

## 6. Reglas clave que Dredd impone (del skill)

- **Siempre usar Codebase Memory** (`search_graph`, `trace_path`, `get_code_snippet`, `query_graph`) antes de read/grep. Graphify para onboarding/docs, no para lookup de símbolos.
- **Nunca editar código sin entender** dependencias inbound + outbound (`trace_path both directions`).
- **`pnpm check` es la verdad** — no afirmar "tests pass" sin haberlos corrido.
- **Un PR = un repo = un cambio lógico.** Excepto `AGENTS.md` raíz (cross-cutting).
- **Una rama = una idea** → commits atómicos.
- **Una migración InsForge por branch** → `db migrations new` con timestamp actual; bumpear si el head remoto avanzó. No cross-commitear migraciones.
- **No confiar en `organization_id`, roles o permisos enviados por el frontend** — resolver server-side desde la sesión/RPC.
- **No exponer IDs internos (UUID) en URLs** — usar `public_id`/opaque IDs.
- **No commitear** `.dev.vars`, `.env`, `.insforge/project.json`, ni `ADMIN-CREDENTIALS.local.txt`.

---

## 7. Cómo unirse y empezar a trabajar

1. Lee esto (prompt relator) → luego `AGENTS.md` § que te apunte → luego el `README.md`/`AGENTS.md` del repo específico.
2. Estado vivo: `ONBOARDING.md` + `backlog.md` + `board.md`.
3. Para una task: buscala en `board.md` (kanban) → leé el spec (`backlog-p4.md#SPEC-P4-XX` o `.dredd/specs/`) → implementá → `pnpm check` → `dredd review` → PR.
4. Si no hay spec escrita, el patrón es: leer el bug/cambio → formularlo como spec (contexto, objetivo, alcance, criterios de aceptación) → ponerlo en `backlog-p4.md` o `.dredd/specs/` → luego implementar.

---

## 8. Estado actual (agosto 2026)

- **Hecho**: Dredd instalado + 3 providers (hermes default, codex, cmdc). Panel CI + pins (P0.1, PR #15). Botón refresh en panel (P4-08, deployed). Fix clobber pesos (P4-12, commit `5116a75`). Test suite del panel (9-11 vitest). Board kanban + metrics.
- **En curso**: P4-01 (Banner de promoción del mes).
- **Bloqueado**: P4-02 (faltan URLs sociales), P4-06 (faltan fotos de Kevin).
- **Pendiente (P1 seguridad)**: Rotar `ADMIN_SECRET` + todos los secretos del working tree. Rate-limit en `/admin/*`/`/hooks/*`. DKIM/SPF en handler `email()`. Fix timezone. Session lock. Audit log del panel. GTM triggers que consuman los eventos del dataLayer.
- **En progreso (P2)**: Botón "refresh now" en el panel con constraint de sesión única. Domain custom `api.hit-cargo.com`. Email-trigger bridge a Make.com.

---

*Este prompt se auto-documenta: cuando el workflow cambie, actualizalo. Las fechas y cifras que caducan deben apuntar a `backlog.md` / `ONBOARDING.md`, no estar hardcodeadas aquí.*
