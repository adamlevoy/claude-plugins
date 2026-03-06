# Topic Cluster Workflow

Step-by-step process for building a topic cluster from research to deliverable.

## Table of Contents

1. [Seed Research](#1-seed-research)
2. [Keyword Expansion](#2-keyword-expansion)
3. [Intent Mapping](#3-intent-mapping)
4. [Cluster Architecture](#4-cluster-architecture)
5. [Pillar Page Design](#5-pillar-page-design)
6. [Cluster Page Assignment](#6-cluster-page-assignment)
7. [Internal Link Map](#7-internal-link-map)
8. [Full Strategy Assembly](#8-full-strategy-assembly)

---

## 1. Seed Research

Start with 1-3 seed keywords representing the core topic.

```bash
# Get initial suggestions
bun ~/.claude/skills/SEO/Keywords/scripts/keyword_research.ts suggest "<seed>" --limit=200

# Expand with ideas
bun ~/.claude/skills/SEO/Keywords/scripts/keyword_research.ts ideas "<seed>" --limit=200

# Check what competitors rank for
bun ~/.claude/skills/SEO/Keywords/scripts/keyword_research.ts ranked <competitor-domain> --limit=300
```

Collect all unique keywords into a master list.

## 2. Keyword Expansion

From the master list, get volumes and difficulty:

```bash
# Bulk volume check (max 1000 per request)
bun ~/.claude/skills/SEO/Keywords/scripts/keyword_research.ts volume <kw1> <kw2> ... --format=json

# Bulk difficulty
bun ~/.claude/skills/SEO/Keywords/scripts/keyword_research.ts difficulty <kw1> <kw2> ...
```

Filter to keywords with:
- Search volume > 100/mo (unless highly specific/transactional)
- Relevance to core topic
- Reasonable difficulty for the domain's authority

## 3. Intent Mapping

Classify all remaining keywords:

```bash
bun ~/.claude/skills/SEO/Keywords/scripts/keyword_research.ts intent <kw1> <kw2> ...
```

Group into intent buckets:
- **Informational** → Blog posts, guides, how-tos
- **Commercial** → Comparison pages, reviews, "best X"
- **Transactional** → Product/service pages, pricing
- **Navigational** → Brand pages (usually skip these)

## 4. Cluster Architecture

### Select Pillar Topic
The pillar should be:
- Broadest head term (highest volume in the cluster)
- Informational or commercial intent
- Comprehensive enough to link to 8-15 subtopics
- Aligned with business goals

### Group Cluster Pages
For each remaining keyword, assign to the cluster if:
- Semantically related to pillar
- More specific/long-tail than pillar
- Could naturally link to/from pillar
- Covers a distinct subtopic (avoid cannibalization)

### Target Structure
```
Pillar: "content marketing" (22,000 vol, KD 78)
├── "content marketing strategy" (12,100 vol, KD 67) - Guide
├── "content marketing examples" (6,600 vol, KD 45) - Listicle
├── "content marketing for small business" (2,400 vol, KD 32) - Guide
├── "content marketing ROI" (1,900 vol, KD 41) - How-to
├── "content marketing tools" (3,600 vol, KD 55) - Comparison
├── "content marketing vs copywriting" (880 vol, KD 22) - Explainer
├── "B2B content marketing" (4,400 vol, KD 52) - Guide
├── "content marketing funnel" (1,600 vol, KD 38) - How-to
├── "content marketing metrics" (1,300 vol, KD 35) - Guide
└── "how to start content marketing" (1,100 vol, KD 28) - How-to
```

## 5. Pillar Page Design

Pillar pages are comprehensive, long-form resources (3000-5000+ words):

- Cover the broad topic at a high level
- Include sections for each cluster subtopic (2-3 paragraphs each)
- Link to each cluster page from the relevant section
- Include a table of contents
- Target featured snippet opportunities (definitions, lists, tables)
- Use schema markup (Article or WebPage)

## 6. Cluster Page Assignment

For each cluster page, define:

| Field | Description |
|-------|-------------|
| Primary keyword | Target keyword for the page |
| Secondary keywords | 3-5 related terms to incorporate naturally |
| Search intent | Informational / Commercial / Transactional |
| Content type | Guide / How-to / Listicle / Comparison / Explainer |
| Target word count | Based on SERP analysis of top rankings |
| Priority score | From prioritization matrix in SKILL.md |

Generate individual content briefs using `assets/brief-template.md`.

## 7. Internal Link Map

Define the linking structure:

```
Cluster Page → Pillar Page (always, contextual anchor text)
Pillar Page → Cluster Page (always, from relevant section)
Cluster Page → Related Cluster Page (when topically relevant)
```

Rules:
- Every cluster page links to the pillar (required)
- Pillar links to every cluster page (required)
- Cross-links between cluster pages where natural (3-5 per page)
- Anchor text should include target keyword variations (not exact match every time)
- Link from within content body, not just navigation

Hand off to OnPage sub-skill for implementation.

## 8. Full Strategy Assembly

Compile everything into a strategy document using `assets/strategy-template.md`:

1. Executive summary (business goals + opportunity)
2. Pillar overview with cluster map
3. Prioritized content calendar
4. Individual briefs per content piece
5. Internal linking plan
6. Schema markup recommendations per page type
7. KPIs and measurement plan
