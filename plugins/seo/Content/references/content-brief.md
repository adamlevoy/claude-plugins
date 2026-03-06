# Content Brief Workflow

Process for creating a data-driven content brief for a single article.

## Table of Contents

1. [Keyword Research](#1-keyword-research)
2. [SERP Analysis](#2-serp-analysis)
3. [Content Gap Analysis](#3-content-gap-analysis)
4. [Brief Assembly](#4-brief-assembly)

---

## 1. Keyword Research

For the target keyword, gather:

```bash
# Full keyword overview
bun ~/.claude/skills/SEO/Keywords/scripts/keyword_research.ts overview "<keyword>"

# Related keywords for semantic coverage
bun ~/.claude/skills/SEO/Keywords/scripts/keyword_research.ts related "<keyword>" --limit=50

# Search intent classification
bun ~/.claude/skills/SEO/Keywords/scripts/keyword_research.ts intent "<keyword>"
```

Record:
- Primary keyword + volume + difficulty + CPC
- 3-5 secondary keywords (related terms, high relevance)
- Search intent classification
- Monthly trend (growing/declining/stable)

## 2. SERP Analysis

Analyze the current SERP landscape:

```bash
bun ~/.claude/skills/SEO/Keywords/scripts/keyword_research.ts serp "<keyword>"
```

For the top 5-10 organic results, analyze:

| Factor | What to Record |
|--------|----------------|
| Content type | Guide / Listicle / Review / Tool / Video |
| Word count | Approximate length of each |
| Heading structure | H2/H3 patterns and topics covered |
| SERP features | Featured snippet type, PAA questions, AI overview |
| Content freshness | Publication/update dates |
| Domain authority | Relative strength of ranking domains |

### Key Questions
- What format dominates? (if all top 5 are listicles, write a listicle)
- What subtopics do ALL top pages cover? (required topics)
- What do NONE of them cover well? (content gap = your edge)
- Is there a featured snippet? What format wins it?
- Is there an AI overview? What sources are cited?

## 3. Content Gap Analysis

Compare top-ranking content to identify opportunities:

**Required subtopics** — covered by 4+ of top 5 pages:
- These MUST be in your content
- Skipping them signals thin content to search engines

**Differentiator subtopics** — covered by 0-1 of top 5 pages:
- These are your opportunity to add unique value
- Prioritize ones with related search volume

**Structural gaps:**
- Missing visuals (diagrams, charts, screenshots)
- Missing practical examples or case studies
- Missing data/statistics (original data is a strong signal)
- Missing downloadable resources (templates, checklists)

## 4. Brief Assembly

Use `assets/brief-template.md` to compile the brief. Key sections:

### Target Keyword Block
- Primary keyword, volume, difficulty, intent
- Secondary keywords (3-5)
- Target URL slug

### Content Requirements
- **Format**: Based on SERP analysis (guide/listicle/comparison/etc.)
- **Word count**: Based on average of top 5 rankings, +10-20% if competing on depth
- **Heading outline**: H2/H3 structure covering all required subtopics + differentiators
- **Required elements**: What must be included (data, examples, visuals, CTAs)

### SEO Requirements
- Title tag formula (include primary keyword, front-loaded)
- Meta description guidance (include keyword, CTA, under 155 chars)
- Internal links to include (pillar page + related cluster pages)
- Schema markup type (Article, HowTo, FAQ, etc.)

### GEO Requirements
- If AI overview present: see `references/geo-optimization.md`
- Include structured claims, cited statistics, clear definitions
- Format for extractability (short paragraphs, lists, tables)

### Competitive Benchmarks
- Top 3 competing URLs with strengths/weaknesses
- Specific differentiation angle for this content
