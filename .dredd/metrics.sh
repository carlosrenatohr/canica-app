#!/usr/bin/env bash
# .dredd/metrics.sh — read .dredd/logs/*.md and produce a summary table.
#
# Usage:
#   dredd metrics                       # last 30 days, all types
#   dredd metrics --since=7d            # last 7 days
#   dredd metrics --type=general        # only general reviews
#   dredd metrics --by=week             # aggregate per ISO week
#   dredd metrics --append              # also append a row to .dredd/metrics.md (historical log)
#
# Self-contained: pure bash + grep. No external deps beyond standard Unix tools.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
# Walk up from REPO_ROOT to find the Dredd orchestration (mirrors the wrapper's logic).
if [[ -z "${DREDD_DIR:-}" ]]; then
  _dir="$REPO_ROOT"
  while [[ "$_dir" != "/" ]]; do
    if [[ -f "$_dir/.dredd/metrics.sh" ]]; then
      DREDD_DIR="$_dir/.dredd"
      break
    fi
    _dir="$(dirname "$_dir")"
  done
fi
DREDD_DIR="${DREDD_DIR:-$REPO_ROOT/.dredd}"
LOG_DIR="$DREDD_DIR/logs"
HIST_FILE="$DREDD_DIR/metrics.md"

# Defaults
SINCE_DAYS=30d
FILTER_TYPE=""
BY=""
APPEND=0

for arg in "$@"; do
  case "$arg" in
    --since=*) SINCE_DAYS="${arg#*=}" ;;
    --type=*)  FILTER_TYPE="${arg#*=}" ;;
    --by=*)    BY="${arg#*=}" ;;
    --append)  APPEND=1 ;;
    *) echo "Unknown arg: $arg" >&2; exit 2 ;;
  esac
done

if [[ ! -d "$LOG_DIR" ]]; then
  echo "No logs yet. Run 'dredd review' or 'dredd security' first." >&2
  exit 0
fi

# Cutoff: N days ago (epoch seconds)
if [[ "$SINCE_DAYS" =~ ^[0-9]+d$ ]]; then
  DAYS="${SINCE_DAYS%d}"
  CUTOFF_EPOCH=$(($(date +%s) - DAYS * 86400))
else
  CUTOFF_EPOCH=0
fi

# Read all log files, filter by date + type, parse counts.
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

for f in "$LOG_DIR"/*.md; do
  [[ -f "$f" ]] || continue
  base="$(basename "$f" .md)"  # e.g. 20260804T183000Z-general
  ts="${base%%-*}"              # 20260804T183000Z
  type="${base##*-}"            # general | security

  # Date in YYYY-MM-DD from YYYYMMDD
  date_part="${ts%%T*}"
  y="${date_part:0:4}"; m="${date_part:4:2}"; d="${date_part:6:2}"
  iso_date="$y-$m-$d"

  # Filter by date
  file_epoch=$(date -d "$iso_date" +%s 2>/dev/null || echo 0)
  [[ "$file_epoch" -ge "$CUTOFF_EPOCH" ]] || continue

  # Filter by type
  [[ -n "$FILTER_TYPE" && "$type" != "$FILTER_TYPE" ]] && continue

  # Count findings (lines starting with "**[" or "- **[")
  alta=$(grep -cE '^\s*-\s*\*\*\[Alta\]\*\*' "$f" || true)
  media=$(grep -cE '^\s*-\s*\*\*\[Media\]\*\*' "$f" || true)
  baja=$(grep -cE '^\s*-\s*\*\*\[Baja\]\*\*' "$f" || true)
  total=$((alta + media + baja))

  echo -e "$iso_date\t$type\t$alta\t$media\t$baja\t$total" >> "$TMP"
done

if [[ ! -s "$TMP" ]]; then
  echo "No reviews in the last ${SINCE_DAYS} (type=${FILTER_TYPE:-all})." >&2
  exit 0
fi

# Print the table
echo "| Date | Type | Alta | Media | Baja | Total |"
echo "| --- | --- | --- | --- | --- | --- |"
sort -t$'\t' -k1,1 "$TMP" | awk -F'\t' '{ printf "| %s | %s | %d | %d | %d | %d |\n", $1, $2, $3, $4, $5, $6 }'

# Aggregate by week or by type
if [[ -n "$BY" ]]; then
  echo
  echo "## Aggregated by $BY"
  echo
  case "$BY" in
    week)
      echo "| Week | Type | Alta | Media | Baja | Total |"
      echo "| --- | --- | --- | --- | --- | --- |"
      sort -t$'\t' -k1,1 "$TMP" | awk -F'\t' '{
        cmd = "date -d " $1 " +%G-W%V"; cmd | getline wk; close(cmd)
        key = wk SUBSEP $2
        a[key]+=$3; m[key]+=$4; b[key]+=$5; t[key]+=$6
      }
      END {
        for (k in a) {
          split(k, parts, SUBSEP)
          printf "| %s | %s | %d | %d | %d | %d |\n", parts[1], parts[2], a[k], m[k], b[k], t[k]
        }
      }' | sort
      ;;
    type)
      echo "| Type | Alta | Media | Baja | Total |"
      echo "| --- | --- | --- | --- | --- | --- |"
      awk -F'\t' '{
        a[$2]+=$3; m[$2]+=$4; b[$2]+=$5; t[$2]+=$6
      }
      END {
        for (k in a) printf "| %s | %d | %d | %d | %d |\n", k, a[k], m[k], b[k], t[k]
      }' "$TMP" | sort
      ;;
  esac
fi

# Totals
echo
total_alta=$(awk -F'\t' '{s+=$3} END {print s+0}' "$TMP")
total_media=$(awk -F'\t' '{s+=$4} END {print s+0}' "$TMP")
total_baja=$(awk -F'\t' '{s+=$5} END {print s+0}' "$TMP")
total_all=$(awk -F'\t' '{s+=$6} END {print s+0}' "$TMP")
echo "**Totals:** Alta=$total_alta, Media=$total_media, Baja=$total_baja, all=$total_all"

# Optionally append a row to the historical log
if [[ "$APPEND" -eq 1 ]]; then
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  mkdir -p "$(dirname "$HIST_FILE")"
  if [[ ! -f "$HIST_FILE" ]]; then
    {
      echo "# Dredd historical metrics"
      echo
      echo "Auto-appended by \`dredd metrics --append\`. One row per invocation."
      echo
      echo "| Run | Since | Type filter | By | Alta | Media | Baja | Total |"
      echo "| --- | --- | --- | --- | --- | --- | --- | --- |"
    } > "$HIST_FILE"
  fi
  echo "| $ts | $SINCE_DAYS | ${FILTER_TYPE:-all} | ${BY:-none} | $total_alta | $total_media | $total_baja | $total_all |" >> "$HIST_FILE"
  echo
  echo "Appended to $HIST_FILE"
fi
