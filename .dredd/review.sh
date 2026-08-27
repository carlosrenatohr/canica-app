#!/usr/bin/env bash
# Dredd — provider-agnostic code reviewer.
# Spawns an agent in a split pane, sends the diff + spec,
# waits for completion, prints findings + self-evaluation.
#
# Usage:
#   .dredd/review.sh general [spec-ref]     # adversarial code review
#   .dredd/review.sh security [spec-ref]    # security audit
#
# spec-ref: optional path, URL, or anchor (e.g. "backlog-p4.md#spec-p4-05")
#
# Provider-agnostic: works with any agent kind supported by herdr.
# Set DREDD_AGENT_KIND to switch: hermes (default), codex, claude, opencode, kimi, freebuff, cmdc ...
# Set DREDD_MODEL to override the model (optional, backend-dependent).
#
# Requires:
#   - herdr 0.7+ (https://herdr.dev)
#   - run from a Herd pane (so the orchestrator is in a Herdr context)

set -euo pipefail

REVIEW_TYPE="${1:-}"
SPEC_REF="${2:-}"
REPO_ROOT="${REPO_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"

# --- Dredd directory resolution ---
if [[ -z "${DREDD_DIR:-}" ]]; then
  _dir="$REPO_ROOT"
  while [[ "$_dir" != "/" ]]; do
    if [[ -f "$_dir/.dredd/review.sh" ]]; then
      DREDD_DIR="$_dir/.dredd"
      break
    fi
    _dir="$(dirname "$_dir")"
  done
fi
if [[ -z "${DREDD_DIR:-}" ]]; then
  echo "Could not find .dredd/ in $REPO_ROOT or any parent directory." >&2
  exit 1
fi

# --- Provider config (env vars, with sane defaults) ---
: "${DREDD_AGENT_KIND:=hermes}"
# Model: only codex needs -m flag explicitly; others may ignore it or use their own config
: "${DREDD_MODEL:=}"

# --- Skill + agent name by review type ---
case "$REVIEW_TYPE" in
  general)
    SKILL_FILE="${DREDD_REVIEWER_SKILL:-$HOME/.config/opencode/skills/reviewer/SKILL.md}"
    AGENT_NAME="dredd-judge"
    ;;
  security)
    SKILL_FILE="${DREDD_SENTINEL_SKILL:-$HOME/.config/opencode/skills/security-reviewer/SKILL.md}"
    AGENT_NAME="dredd-sentinel"
    ;;
  *)
    echo "Usage: $0 [general|security] [spec-ref]" >&2
    exit 2
    ;;
esac

if [[ ! -f "$SKILL_FILE" ]]; then
  echo "Skill file not found: $SKILL_FILE" >&2
  exit 1
fi

# --- Diff generation (provider-agnostic) ---
TS="$(date -u +%Y%m%dT%H%M%SZ)"
DIFF_FILE="$DREDD_DIR/runs/${TS}-${REVIEW_TYPE}.diff"
mkdir -p "$(dirname "$DIFF_FILE")"

BRANCH="$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo HEAD)"
DEFAULT_BRANCH="$(
  git -C "$REPO_ROOT" symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null \
    | sed 's@^origin/@@' \
    || true
)"
if [[ -z "$DEFAULT_BRANCH" ]]; then
  for cand in main master; do
    if git -C "$REPO_ROOT" show-ref --verify --quiet "refs/remotes/origin/$cand"; then
      DEFAULT_BRANCH="$cand"
      break
    fi
  done
fi
DEFAULT_BRANCH="${DEFAULT_BRANCH:-main}"
BASE="$(
  git -C "$REPO_ROOT" merge-base "$BRANCH" "origin/$DEFAULT_BRANCH" 2>/dev/null \
    || git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD@{upstream} 2>/dev/null \
    || echo HEAD
)"
if git -C "$REPO_ROOT" diff --quiet "$BASE"..."$BRANCH" 2>/dev/null; then
  echo "No diff vs $BASE. Did you forget to commit?" >&2
  exit 1
fi
git -C "$REPO_ROOT" diff "$BASE"..."$BRANCH" > "$DIFF_FILE"

# --- Log file ---
LOG_FILE="$DREDD_DIR/logs/${TS}-${REVIEW_TYPE}.md"
mkdir -p "$(dirname "$LOG_FILE")"

# --- Spawn agent in a split pane ---
SPLIT_JSON="$(herdr pane split --current --direction right --no-focus)"
REVIEWER_PANE="$(printf '%s\n' "$SPLIT_JSON" | jq -r '.result.pane.pane_id')"

# Rename stale agent with same name (Herd keeps alias until process exits)
if herdr agent get "$AGENT_NAME" >/dev/null 2>&1; then
  STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
  herdr agent rename "$AGENT_NAME" "${AGENT_NAME}-stale-${STAMP}" >/dev/null 2>&1 || true
fi

# --- Build provider-specific args for herdr agent start ---
# Different agents accept different CLI flags after `--`.
# codex:  -m <model>            (model override)
# hermes: (no args needed, model from herd.json)
# claude: --model <model>       (model override)
# opencode: (no args needed)
AGENT_ARGS=()
case "$DREDD_AGENT_KIND" in
  codex)
    [[ -n "$DREDD_MODEL" ]] && AGENT_ARGS+=(-m "$DREDD_MODEL")
    ;;
  claude)
    [[ -n "$DREDD_MODEL" ]] && AGENT_ARGS+=(--model "$DREDD_MODEL")
    ;;
  hermes|gemini|opencode|kimi|copilot|cursor)
    # These backends use their own config; model override is optional
    [[ -n "$DREDD_MODEL" ]] && AGENT_ARGS+=("$DREDD_MODEL")
    ;;
  *)
    # Unknown backend — pass model as positional arg (best effort)
    [[ -n "$DREDD_MODEL" ]] && AGENT_ARGS+=("$DREDD_MODEL")
    ;;
esac

# --- Build prompt (provider-agnostic — same prompt for all backends) ---
PROMPT="$(cat "$DREDD_DIR/templates/review-prompt.md")"
PROMPT="${PROMPT//\{\{REVIEW_TYPE\}\}/$REVIEW_TYPE}"
PROMPT="${PROMPT//\{\{SKILL_FILE\}\}/$SKILL_FILE}"
PROMPT="${PROMPT//\{\{DIFF_FILE\}\}/$DIFF_FILE}"
PROMPT="${PROMPT//\{\{SPEC_REF\}\}/$SPEC_REF}"
PROMPT="${PROMPT//\{\{REPO_ROOT\}\}/$REPO_ROOT}"

# --- command-code (cmdc) — runs directly in tmux pane, not via herdr ---
if [[ "$DREDD_AGENT_KIND" == "cmdc" ]]; then
  # Resolve the agent definition
  CMDC_AGENT_FILE="$DREDD_DIR/../.commandcode/agents/${AGENT_NAME}.md"
  if [[ ! -f "$CMDC_AGENT_FILE" ]]; then
    echo "Command Code agent not found: $CMDC_AGENT_FILE" >&2
    exit 1
  fi

  # Send the prompt to the split pane and run cmd
  herdr pane send-keys "$REVIEWER_PANE" "cmd -p \"$(printf '%s' "$PROMPT" | sed 's/"/\\"/g')\" --auto-accept --add-dir \"$REPO_ROOT\" 2>&1 | tee /tmp/dredd-cmdc-$$.log" Enter

  # Wait for completion (poll for prompt or exit)
  TIMEOUT=180
  ELAPSED=0
  while [[ $ELAPSED -lt $TIMEOUT ]]; do
    sleep 2
    ELAPSED=$((ELAPSED + 2))
    # Check if cmd finished by looking for the shell prompt
    PANE_CONTENT="$(herdr pane capture "$REVIEWER_PANE" 2>/dev/null || true)"
    if echo "$PANE_CONTENT" | grep -qE '^\$|^(cmdc|cmd)|root@|renato@'; then
      break
    fi
  done

  RESULT="$(cat /tmp/dredd-cmdc-$$.log 2>/dev/null || echo 'No output captured')"
  rm -f "/tmp/dredd-cmdc-$$.log"
elif [[ "$DREDD_AGENT_KIND" == "freebuff" ]]; then
  # Freebuff — runs directly in the tmux pane (TUI, alternate screen — no pipe).
  # Result is captured from the per-project chat log (~/.config/manicode/projects),
  # not from the pane, because the TUI never writes through stdout.
  if ! command -v freebuff >/dev/null 2>&1; then
    echo "freebuff not found. Install with: npm i -g freebuff" >&2
    exit 1
  fi
  CRED_FILE="$HOME/.config/manicode/credentials.json"
  if [[ ! -f "$CRED_FILE" ]] || ! grep -q '"authToken"' "$CRED_FILE" 2>/dev/null; then
    echo "freebuff not logged in. Run 'freebuff login' once first." >&2
    exit 1
  fi

  CHAT_ROOT="$HOME/.config/manicode/projects"
  PRE_SNAPSHOT="$(ls -t "$CHAT_ROOT"/*/chats/*/chat-messages.json 2>/dev/null | head -1 || true)"

  # Launch freebuff in the split pane (direct, no pipe — the TUI uses an alternate screen)
  herdr pane send-keys "$REVIEWER_PANE" "freebuff --cwd \"$REPO_ROOT\"" Enter

  # Wait for the TUI to boot; fall back to a fixed sleep if the marker never shows
  herdr pane wait-output --regex 'Freebuff|freebuff' --timeout 30000 "$REVIEWER_PANE" >/dev/null 2>&1 || sleep 8

  # Paste the prompt (send-text preserves newlines) and submit
  herdr pane send-text "$REVIEWER_PANE" "$PROMPT"
  herdr pane send-keys "$REVIEWER_PANE" Enter

  # Poll the chat log for a complete assistant message
  TIMEOUT=1800
  ELAPSED=0
  RESULT=""
  while [[ $ELAPSED -lt $TIMEOUT ]]; do
    sleep 5
    ELAPSED=$((ELAPSED + 5))
    RESULT="$(python3 "$DREDD_DIR/scripts/freebuff-extract.py" "$CHAT_ROOT" "$PRE_SNAPSHOT" 2>/dev/null || true)"
    if [[ -n "$RESULT" ]]; then
      break
    fi
  done

  # Close the session
  herdr pane send-keys "$REVIEWER_PANE" "/exit" Enter 2>/dev/null || true

  if [[ -z "$RESULT" ]]; then
    RESULT="No output captured — timed out after ${TIMEOUT}s. Check the freebuff pane (a project picker or login prompt may have appeared)."
  fi
else
  # --- herdr-based agents (codex, hermes, claude, opencode, etc.) ---
  if [[ ${#AGENT_ARGS[@]} -gt 0 ]]; then
    herdr agent start "$AGENT_NAME" --kind "$DREDD_AGENT_KIND" --pane "$REVIEWER_PANE" -- "${AGENT_ARGS[@]}"
  else
    herdr agent start "$AGENT_NAME" --kind "$DREDD_AGENT_KIND" --pane "$REVIEWER_PANE"
  fi

  # --- Send prompt and wait for completion ---
  herdr agent prompt "$AGENT_NAME" "$PROMPT" --wait --timeout 180000

  # --- Read result ---
  RESULT="$(herdr agent read "$AGENT_NAME" --source recent-unwrapped --lines 400)"
fi

# --- Persist to log ---
{
  echo "# $REVIEW_TYPE review — $TS"
  echo
  echo "- repo: $REPO_ROOT"
  echo "- branch: $BRANCH"
  echo "- base: $BASE"
  echo "- spec: $SPEC_REF"
  echo "- diff: $DIFF_FILE"
  echo "- provider: $DREDD_AGENT_KIND"
  [[ -n "$DREDD_MODEL" ]] && echo "- model: $DREDD_MODEL"
  echo
  echo "## Findings + self-evaluation"
  echo
  printf '%s\n' "$RESULT"
} > "$LOG_FILE"

# --- Print to stdout ---
printf '%s\n' "$RESULT"

# --- Auto-append to improvements.md (opt-in) ---
if [[ "${DREDD_AUTO_IMPROVE:-0}" == "1" ]]; then
  SUGGESTION="$(printf '%s\n' "$RESULT" \
    | awk '/^### Self-evaluation/{flag=1; next} /^### /{flag=0} flag' \
    | sed -n 's/^[[:space:]]*-\s*Suggested prompt improvement:[[:space:]]*//p' \
    | head -1)"
  if [[ -n "$SUGGESTION" && "${#SUGGESTION}" -gt 30 && "$SUGGESTION" != "none" && "$SUGGESTION" != "None." ]]; then
    IMPROVE_FILE="$DREDD_DIR/improvements.md"
    DATE="$(date -u +%Y-%m-%d)"
    SKILL_NAME="reviewer"
    [[ "$REVIEW_TYPE" == "security" ]] && SKILL_NAME="security-reviewer"
    printf '%s — %s — %s — %s — %s — applied? no\n' \
      "$DATE" "$SKILL_NAME" "$REVIEW_TYPE" "$DREDD_AGENT_KIND" "$SUGGESTION" >> "$IMPROVE_FILE"
  fi
fi
