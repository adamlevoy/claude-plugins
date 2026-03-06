---
name: granola
description: "Sync Granola meeting notes and transcripts to the Obsidian vault. Two operations: (1) Ingest - export meetings from the local Granola cache to vault markdown files; (2) Backfill - fetch missing transcripts from the Granola API for meetings already in the vault. Use when asked to sync, export, ingest, or update Granola meetings, or when vault meeting files are missing transcripts. Always re-indexes QMD after writing files."
---

# Granola

Two operations for keeping the Obsidian vault's `Granola-Meetings/` folder in sync.

## Operation 1: Ingest (cache → vault)

Exports meetings from the local Granola cache file to vault markdown. Run this when new meetings need to be added to the vault.

```bash
python3 ~/.claude/skills/granola/scripts/ingest_granola.py \
  --vault "$VAULT_DIR" [OPTIONS]
```

| Flag | Default | Description |
|------|---------|-------------|
| `--vault DIR` | `$VAULT_DIR` or cwd | Vault root |
| `--output DIR` | `Granola-Meetings` | Subfolder within vault |
| `--days N` | all | Only meetings from last N days |
| `--transcripts` | — | Only meetings that have transcripts in cache |
| `--list` | — | Preview without writing |
| `--dry-run` | — | Show what would be exported |

Cache location: `~/Library/Application Support/Granola/cache-v4.json`

**Note:** The local cache only stores transcripts for ~6 recent meetings. For full transcript coverage, run the backfill after ingesting.

## Operation 2: Backfill (API → vault)

Fetches transcripts from the Granola API for meetings already in the vault that are missing them. Run after ingest, or any time `has_transcript: false` files exist.

```bash
python3 ~/.claude/skills/granola/scripts/backfill_granola_transcripts.py \
  --vault "$VAULT_DIR" [OPTIONS]
```

| Flag | Default | Description |
|------|---------|-------------|
| `--vault DIR` | `$VAULT_DIR` | Vault root |
| `--output DIR` | `Granola-Meetings` | Subfolder within vault |
| `--dry-run` | — | Preview without writing |
| `--force` | — | Re-fetch even if `has_transcript: true` |
| `--delay N` | `0.3` | Seconds between API calls |

Auth token: `~/Library/Application Support/Granola/supabase.json` → `workos_tokens.access_token`. If API calls fail, re-open Granola to refresh the token.

## Standard Workflow (full sync)

```bash
# 1. Ingest new meetings from cache
python3 ~/.claude/skills/granola/scripts/ingest_granola.py --vault "$VAULT_DIR"

# 2. Backfill missing transcripts from API
python3 ~/.claude/skills/granola/scripts/backfill_granola_transcripts.py --vault "$VAULT_DIR"

# 3. Re-index QMD
qmd update
```

## Notes

- Ingest skips unchanged files (size-based check); backfill skips `has_transcript: true` files
- Meetings with no recorded audio return an empty transcript list from the API (expected, not an error)
- `qmd update` re-indexes for BM25 search; `qmd embed` generates vectors for semantic search (optional)
