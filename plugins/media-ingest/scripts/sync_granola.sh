#!/bin/bash
# Sync Granola meetings to vault and update QMD index
set -euo pipefail

VAULT="/Users/adam/Documents/Obsidian Vault"
SKILL_DIR="/Users/adam/.claude/skills/granola/scripts"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')] granola-sync"

notify_failure() {
    osascript -e "display notification \"$1\" with title \"Granola Sync Failed\" sound name \"Basso\"" 2>/dev/null || true
}

echo "$LOG_PREFIX: starting"

# Step 1: Ingest from local cache
echo "$LOG_PREFIX: ingest (cache → vault)"
if ! python3 "$SKILL_DIR/ingest_granola.py" --vault "$VAULT"; then
    notify_failure "ingest_granola.py failed"
    exit 1
fi

# Step 2: Backfill missing transcripts from API
echo "$LOG_PREFIX: backfill (API → vault)"
if ! python3 "$SKILL_DIR/backfill_granola_transcripts.py" --vault "$VAULT"; then
    notify_failure "backfill_granola_transcripts.py failed"
    exit 1
fi

# Step 3: Re-index QMD
if command -v qmd > /dev/null 2>&1; then
    echo "$LOG_PREFIX: qmd update"
    qmd update 2>/dev/null
fi

echo "$LOG_PREFIX: done"
