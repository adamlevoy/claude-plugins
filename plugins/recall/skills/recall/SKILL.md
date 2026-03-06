---
name: recall
description: Load context from vault memory. Temporal queries (yesterday, last week, session history) use native JSONL timeline. Topic queries use QMD BM25 search with query expansion. "recall graph" generates interactive session-file relationship graph. Every recall ends with "One Thing" - the single highest-leverage next action. USE WHEN user says "recall", "what did we work on", "load context about", "remember when we", "prime context", "yesterday", "what was I doing", "last week", "session history", "recall graph", "session graph".
---

# Recall Skill

Three modes: temporal (date-based), topic (BM25 search), and graph (interactive visualization).

## Usage

```
/recall yesterday
/recall last week
/recall 2026-02-25
/recall authentication
/recall graph last week
```

## Workflow

See [workflows/recall.md](workflows/recall.md) for routing logic and step-by-step process.

## Scripts

- `scripts/recall-day.py` - Temporal recall from native JSONL session files
- `scripts/session-graph.py` - Interactive HTML graph visualization (requires networkx + pyvis)
- `scripts/extract-sessions.py` - Extract user messages for QMD indexing

## QMD Collections

- `sessions` - Claude Code session exports in `Claude-Sessions/`
- `notes` - General vault notes

Topic search uses BM25 (`qmd search`) with query expansion (3-4 keyword variants). Always run variants in parallel across collections.
