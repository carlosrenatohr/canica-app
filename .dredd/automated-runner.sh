#!/usr/bin/env bash
# Dredd automated runner — picks tasks from the queue and executes them.
#
# Usage:
#   .dredd/automated-runner.sh [task-id]
#
# Without task-id: picks the next "Ready" task from .dredd/queue.md
# With task-id:    executes that specific task
#
# Workflow per task:
#   1. Read spec from queue
#   2. Create feature branch
#   3. Implement (via hermitty or agent)
#   4. Run gate (pnpm check / pnpm test)
#   5. Commit + push
#   6. Open PR (if gh CLI available)
#   7. Update board status to "In Review"
#   8. STOP — human reviews and merges
#
# Provider: uses DREDD_AGENT_KIND env var (default: codex)
# Codebase Memory: the implementor agent should use CM tools first.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
DREDD_DIR="${DREDD_DIR:-$REPO_ROOT/.dredd}"
BOARD_FILE="$REPO_ROOT/board.md"

# --- Provider config ---
: "${DREDD_AGENT_KIND:=codex}"
: "${DREDD_MODEL:=}"

# --- Helpers ---
log() { echo "[$(date -u +%H:%M:%S)] $*"; }
err() { echo "[$(date -u +%H:%M:%S)] ERROR: $*" >&2; }

# Parse board.md and extract tasks with status "Ready"
get_ready_tasks() {
  if [[ ! -f "$BOARD_FILE" ]]; then
    err "Board file not found: $BOARD_FILE"
    exit 1
  fi
  # Format: | # | Title | Spec | Repo | Status | Branch | PR |
  grep -E "^\|[0-9]" "$BOARD_FILE" | grep -i "ready" || true
}

# Extract task fields from a queue line
parse_task() {
  local line="$1"
  TASK_ID="$(echo "$line" | cut -d'|' -f2 | xargs)"
  TASK_TITLE="$(echo "$line" | cut -d'|' -f3 | xargs)"
  TASK_SPEC="$(echo "$line" | cut -d'|' -f4 | xargs)"
  TASK_REPO="$(echo "$line" | cut -d'|' -f5 | xargs)"
  TASK_BRANCH="$(echo "$line" | cut -d'|' -f6 | xargs)"
}

# Update board status
update_board_status() {
  local task_id="$1"
  local new_status="$2"
  local pr_url="${3:-}"
  
  if [[ -f "$BOARD_FILE" ]]; then
    # Simple sed replacement — works for markdown tables
    sed -i "s/^\(| *$task_id *|.*|\) *[A-Za-z ]* *\(|.*|\)/\1 $new_status \2/" "$BOARD_FILE"
    if [[ -n "$pr_url" ]]; then
      sed -i "s/^\(| *$task_id *|.*|.*|.*|\) *[A-Za-z ]* *\(|.*|\)/\1 $pr_url \2/" "$BOARD_FILE"
    fi
  fi
}

# --- Main ---
TASK_ID="${1:-}"

if [[ -z "$TASK_ID" ]]; then
  log "Looking for next Ready task..."
  READY_TASKS="$(get_ready_tasks)"
  if [[ -z "$READY_TASKS" ]]; then
    log "No Ready tasks in queue. Nothing to do."
    exit 0
  fi
  # Pick the first Ready task
  FIRST_LINE="$(echo "$READY_TASKS" | head -1)"
  parse_task "$FIRST_LINE"
  log "Selected task #$TASK_ID: $TASK_TITLE"
else
  # Find the task by ID
  TASK_LINE="$(grep -E "^\| *$TASK_ID *|" "$BOARD_FILE" || true)"
  if [[ -z "$TASK_LINE" ]]; then
    err "Task #$TASK_ID not found in board."
    exit 1
  fi
  parse_task "$TASK_LINE"
fi

# Validate
if [[ -z "$TASK_REPO" || "$TASK_REPO" == "-" ]]; then
  err "Task #$TASK_ID has no repo specified."
  exit 1
fi

REPO_DIR="$REPO_ROOT/$TASK_REPO"
if [[ ! -d "$REPO_DIR" ]]; then
  err "Repo directory not found: $REPO_DIR"
  exit 1
fi

# Create branch
BRANCH_NAME="dredd/task-${TASK_ID}-$(echo "$TASK_TITLE" | tr ' ' '-' | tr '[:upper:]' '[:lower:]' | head -c 40)"
log "Creating branch: $BRANCH_NAME in $TASK_REPO"
cd "$REPO_DIR"
git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"

# Mark as In Progress
update_board_status "$TASK_ID" "🔄 In Progress"

# --- Implementation via agent ---
# The agent should:
# 1. Use Codebase Memory MCP tools first (search_graph, trace_path, get_code_snippet)
# 2. Read the spec from the task
# 3. Implement the change
# 4. Run the gate (pnpm check)
# 5. Commit with conventional commit message

log "Launching implementor agent ($DREDD_AGENT_KIND)..."
log "Task: $TASK_TITLE"
log "Spec: $TASK_SPEC"
log ""
log "Agent should use Codebase Memory MCP tools first."
log "Gate: cd $REPO_DIR && pnpm check"
log ""

# For now, this is a placeholder — the actual implementation happens via hermitty or agent
# When cron is enabled, this script will be called by the cron job
# The agent reads the spec, implements, gates, commits, and pushes

log "READY TO IMPLEMENT"
log "Branch: $BRANCH_NAME"
log "Repo: $REPO_DIR"
log ""
log "Run hermitty start in $REPO_DIR to begin implementation."
log "After implementation, run: dredd review $TASK_SPEC"
log ""

# Update board
update_board_status "$TASK_ID" "🔍 In Review"

log "Done. Waiting for human review."
