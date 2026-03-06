---
name: keywords
description: Keyword research and competitor analysis via DataForSEO API. Sub-skill of SEO.
---

# Keywords - Keyword Research Sub-Skill

Keyword research, competitive analysis, and SERP analysis using DataForSEO APIs.

## CLI Tool

All keyword operations run via `scripts/keyword_research.ts`:

```bash
bun ~/.claude/skills/SEO/Keywords/scripts/keyword_research.ts <command> [options]
```

### Commands

| Command | Purpose | Key Options |
|---------|---------|-------------|
| `volume <kw1> <kw2> ...` | Search volume + CPC + competition | `--location`, `--lang` |
| `suggest <keyword>` | Keyword suggestions from seed | `--limit`, `--include-serp` |
| `related <keyword>` | Semantically related keywords | `--limit` |
| `ideas <keyword>` | Broader keyword discovery | `--limit` |
| `difficulty <kw1> <kw2> ...` | Bulk keyword difficulty scores | |
| `intent <kw1> <kw2> ...` | Classify search intent | |
| `ranked <domain>` | Keywords a domain ranks for | `--limit`, `--item-types` |
| `competitors <kw1> <kw2> ...` | SERP competitors for keywords | `--limit` |
| `gap <domain1> <domain2>` | Keyword gap between domains | `--limit` |
| `domain-competitors <domain>` | Competing domains | `--limit` |
| `overview <keyword>` | Full keyword metrics overview | |
| `domain-overview <domain>` | Domain rank overview | |
| `serp <keyword>` | Live SERP results | `--depth` |

### Global Options

| Option | Default | Description |
|--------|---------|-------------|
| `--location=<code>` | 2840 (US) | Location code |
| `--lang=<code>` | en | Language code |
| `--format=<type>` | table | Output: table, json, csv |
| `--limit=<n>` | varies | Max results |

### Common Location Codes

| Code | Country |
|------|---------|
| 2840 | United States |
| 2826 | United Kingdom |
| 2124 | Canada |
| 2036 | Australia |
| 2276 | Germany |
| 2250 | France |

## Workflows

### Keyword Research (Seed → Cluster)

1. Start with seed keyword: `suggest <seed> --limit=200`
2. Expand with ideas: `ideas <seed> --limit=200`
3. Get search volumes: `volume <top keywords>`
4. Check difficulty: `difficulty <top keywords>`
5. Classify intent: `intent <top keywords>`
6. Group by intent + topic for content planning

### Competitor Gap Analysis

1. Get your ranked keywords: `ranked <your-domain> --limit=500`
2. Get competitor keywords: `ranked <competitor> --limit=500`
3. Find gaps: `gap <your-domain> <competitor> --limit=200`
4. Analyze competing domains: `domain-competitors <your-domain>`
5. Prioritize: high volume + low difficulty + not currently ranking

### SERP Feature Analysis

1. Run SERP check: `serp <keyword>`
2. Note featured snippets, PAA, AI overview presence
3. Cross-reference with `intent` classification
4. Identify content format opportunities (listicle, how-to, comparison)

## Output Format

Results are formatted as tables by default. Use `--format=json` for programmatic use or `--format=csv` for export.

Example output:
```
Keyword Suggestions for "content marketing"

Keyword                          | Volume | KD  | CPC   | Intent
---------------------------------|--------|-----|-------|-------------
content marketing strategy       | 12100  | 67  | $4.50 | informational
content marketing examples       | 6600   | 45  | $3.20 | informational
content marketing agency         | 4400   | 72  | $12.80| commercial
what is content marketing        | 8100   | 38  | $2.10 | informational
```

## API Reference

For detailed endpoint parameters, filters, and response fields: see `references/dataforseo-keywords.md`.

## Rate Limits

- Google Ads endpoints (search volume): 12 requests/minute
- Labs endpoints: 2000 requests/minute
- Max keywords per request: 1000 (volume, difficulty, intent)
- Max keyword length: 80 characters, 10 words
