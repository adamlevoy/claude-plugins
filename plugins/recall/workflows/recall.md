# Recall Workflow

Load context from vault memory - temporal queries use native JSONL files, topic queries use QMD search.

## Step 1: Classify Query

Parse the user's input after `/recall` and classify:

- **Graph** - starts with "graph": "graph last week", "graph yesterday", "graph today"
  -> Go to Step 2C
- **Temporal** - mentions time: "yesterday", "today", "last week", "this week", a date, "what was I doing", "session history"
  -> Go to Step 2A
- **Topic** - mentions a subject: "QMD video", "authentication", "lab content"
  -> Go to Step 2B
- **Both** - temporal + topic: "what did I do with QMD yesterday"
  -> Go to Step 2A first, then scan results for the topic

## Step 2A: Temporal Recall (JSONL Timeline)

```bash
python3 /Users/adam/.claude/skills/recall/scripts/recall-day.py list DATE_EXPR --all-projects
```

Replace `DATE_EXPR` with the parsed date expression. Supported:
- `yesterday`, `today`
- `YYYY-MM-DD`
- `last monday` .. `last sunday`
- `this week`, `last week`
- `N days ago`, `last N days`

Options:
- `--min-msgs N` - filter noise (default: 3)
- `--all-projects` - scan all projects (use by default)

Present the table to the user. If they pick a session to expand:

```bash
python3 /Users/adam/.claude/skills/recall/scripts/recall-day.py expand SESSION_ID --all-projects
```

## Step 2B: Topic Recall (QMD BM25 with Query Expansion)

BM25 is keyword-based - it only finds exact word matches. Compensate with query expansion.

**Step 2B.1: Expand query into variants.** Generate 3-4 alternative phrasings covering synonyms and related terms. Example:
- User says "disk clean up" -> variants: `"disk cleanup free space"`, `"large files storage"`, `"delete cache bloat GB"`

**Step 2B.2: Run ALL variants across collections in parallel** (fast, ~0.3s each):

```bash
qmd search "VARIANT_1" -c sessions -n 5
qmd search "VARIANT_2" -c sessions -n 5
qmd search "VARIANT_3" -c sessions -n 5
qmd search "VARIANT_1" -c notes -n 5
qmd search "VARIANT_2" -c notes -n 5
```

Run sessions variants in parallel. Notes can use fewer variants.

**Step 2B.3: Deduplicate results** by document path. If same doc appears in multiple searches, keep the highest score. Present top 5 unique results.

## Step 3: Fetch Full Documents (Topic path only)

For the top 3 most relevant results, get the full document:

```bash
qmd get "qmd://collection/path/to/file.md" -l 50
```

Use `-l 50` by default; increase with `-l 100` for more context.

## Step 4: Present Structured Summary

**For temporal queries:** Present the session table and offer to expand any session.

**For topic queries:** Organize results by collection type:

**Sessions**
- What was worked on related to this topic
- Key dates and decisions
- Current status or next steps

**Notes**
- Relevant research findings, plans, or content drafts

Keep this concise - it's context loading, not a full report.

## Step 5: Synthesize "One Thing"

After presenting results, synthesize the single highest-leverage next action.

**How to pick:**
1. What has momentum - sessions with recent activity, things mid-flow
2. What's blocked - removing a blocker unlocks downstream work
3. What's closest to done - finishing > starting

**Format:** Bold line at the end:

> **One Thing: [specific, concrete action]**

If not enough signal, ask "What would you like to work on from here?" instead.

## Step 2C: Graph Visualization

```bash
python3 /Users/adam/.claude/skills/recall/scripts/session-graph.py DATE_EXPR --all-projects
```

Options:
- `--min-files N` - only show sessions touching N+ files (default: 2)
- `--min-msgs N` - filter noise (default: 3)
- `-o PATH` - custom output path (default: /tmp/session-graph.html)
- `--no-open` - don't auto-open browser

## Fallback: No Results Found

```
No results found for "QUERY". Try:
- Different search terms
- Broader keywords / different date range
- --min-msgs 1 to include short sessions
```

## Notes

- Temporal queries use `recall-day.py` (native JSONL, no QMD needed)
- Graph queries use `session-graph.py` (requires networkx + pyvis)
- Topic queries use BM25 (`qmd search`) NOT hybrid (`qmd query`) - 53x faster
- Run collection searches in parallel
- Always use `--all-projects` for temporal/graph queries
