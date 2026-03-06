# Content Audit Workflow

Systematic process for auditing existing site content and recommending actions.

## Table of Contents

1. [Inventory](#1-inventory)
2. [Performance Data](#2-performance-data)
3. [Quality Assessment](#3-quality-assessment)
4. [Action Assignment](#4-action-assignment)
5. [Prioritization](#5-prioritization)

---

## 1. Inventory

Collect all indexable content URLs. Use Firecrawl skill if available:

```bash
# Map all site URLs (if Firecrawl available)
# OR use DataForSEO ranked keywords to find indexed pages:
bun ~/.claude/skills/SEO/Keywords/scripts/keyword_research.ts ranked <domain> --limit=1000 --format=json
```

From ranked keywords response, extract unique URLs to build the inventory.

For each URL, record:
- URL path
- Page title
- Primary keyword (highest-volume keyword it ranks for)
- Current rank for primary keyword
- Content type (blog, landing page, product, etc.)
- Publish/last update date (if available)

## 2. Performance Data

For each page's primary keyword, gather metrics:

```bash
# Volumes for all primary keywords
bun ~/.claude/skills/SEO/Keywords/scripts/keyword_research.ts volume <kw1> <kw2> ...
```

Categorize pages into performance tiers:

| Tier | Criteria | Typical Action |
|------|----------|----------------|
| Winners | Rank 1-3, good volume | Protect, optimize for GEO |
| Strikers | Rank 4-10, good volume | Optimize to push into top 3 |
| Potential | Rank 11-20, decent volume | Refresh + improve |
| Underperformers | Rank 21+, had volume | Major refresh or consolidate |
| Zero traffic | No rankings, no traffic | Consolidate, redirect, or remove |
| Thin content | <300 words, no rankings | Expand, merge, or remove |

## 3. Quality Assessment

For pages in Strikers, Potential, and Underperformers tiers, evaluate:

### Content Quality Signals
- **Depth**: Does it comprehensively cover the topic?
- **Freshness**: When was it last updated? Is info current?
- **Accuracy**: Any outdated statistics, broken claims?
- **Uniqueness**: Is this substantially different from other pages on the site?
- **Structure**: Clear headings, scannable format, proper hierarchy?
- **Media**: Images, videos, charts where appropriate?

### SEO Quality Signals
- **Title tag**: Contains primary keyword, compelling, proper length?
- **Meta description**: Contains keyword, has CTA, under 155 chars?
- **Heading structure**: H1 with keyword, logical H2/H3 hierarchy?
- **Internal links**: Links to/from pillar and related pages?
- **Schema markup**: Appropriate structured data present?
- **Word count**: Competitive with top-ranking pages?

### GEO Quality Signals
- **Extractable answers**: Clear definitions and direct answers?
- **Structured data**: Tables, lists, step-by-step content?
- **Authority signals**: Author attribution, citations, data?

## 4. Action Assignment

Assign one action per page:

| Action | When | What to Do |
|--------|------|------------|
| **Keep** | Winners performing well | Monitor, minor updates only |
| **Optimize** | Strikers close to top 3 | Improve on-page, add depth, internal links |
| **Refresh** | Potential with dated content | Update stats, add sections, improve structure |
| **Rewrite** | Underperformers with good keywords | Full rewrite targeting same keyword |
| **Consolidate** | Multiple thin pages on same topic | Merge into one comprehensive page, redirect others |
| **Redirect** | Zero value, related page exists | 301 redirect to relevant page |
| **Remove** | Zero value, no related page, no backlinks | Noindex or delete (check backlinks first!) |

### Consolidation Rules
Consolidate when:
- 2+ pages target the same/very similar keyword
- Multiple thin pages (<500w) on related subtopics
- Old + new version of same content exists

Always:
- Keep the URL with more backlinks/history
- 301 redirect removed URLs to the kept URL
- Combine the best content from all merged pages

## 5. Prioritization

Order audit actions by impact:

**Highest priority:**
1. Strikers (rank 4-10) with high volume — quickest wins
2. Consolidation opportunities — reduce cannibalization
3. Potential pages (rank 11-20) with high volume

**Medium priority:**
4. GEO optimization for winners — protect top positions
5. Refresh for pages with declining traffic
6. Internal linking improvements

**Lower priority:**
7. Underperformer rewrites (high effort)
8. Remove/redirect zero-value pages
9. Thin content expansion

### Audit Deliverable

Output as a table:

```markdown
| URL | Primary KW | Vol | Rank | Tier | Action | Priority | Notes |
|-----|-----------|-----|------|------|--------|----------|-------|
| /blog/guide | main kw | 5400 | 6 | Striker | Optimize | High | Add 2 sections, update stats |
```
