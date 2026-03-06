---
name: content
description: Content strategy, topic clusters, content briefs, GEO optimization, and content audits. Sub-skill of SEO.
---

# Content - Content Strategy Sub-Skill

Create data-driven content strategies, topic clusters, individual content briefs, and GEO-optimized content. Uses DataForSEO data from the Keywords sub-skill for research.

## Workflow Routing

| Trigger | Workflow | Reference |
|---------|----------|-----------|
| content strategy, content plan, content calendar | Full Strategy | `references/topic-cluster.md` |
| topic cluster, pillar page, hub and spoke | Topic Cluster | `references/topic-cluster.md` |
| content brief, article brief, write brief | Content Brief | `references/content-brief.md` |
| GEO, generative engine, AI optimization, LLM optimization | GEO Optimization | `references/geo-optimization.md` |
| content audit, audit existing content, thin content | Content Audit | `references/content-audit.md` |

## Quick Start

### Build a Topic Cluster

1. Run keyword research via Keywords sub-skill:
   ```bash
   bun ~/.claude/skills/SEO/Keywords/scripts/keyword_research.ts suggest "<seed keyword>" --limit=200
   bun ~/.claude/skills/SEO/Keywords/scripts/keyword_research.ts intent <top keywords>
   ```
2. Group keywords by intent and semantic relevance into:
   - **1 pillar page** (broad, high-volume head term)
   - **8-15 cluster pages** (specific, long-tail supporting content)
   - **Internal link map** connecting cluster → pillar
3. Output using strategy template: `assets/strategy-template.md`

### Write a Content Brief

1. Research the target keyword (volume, difficulty, intent, SERP)
2. Analyze top 5-10 ranking pages for the keyword
3. Identify content gaps, required subtopics, and target word count
4. Generate brief using template: `assets/brief-template.md`

### GEO Optimization

1. Check AI overview presence for target keywords:
   ```bash
   bun ~/.claude/skills/SEO/Keywords/scripts/keyword_research.ts serp "<keyword>"
   ```
2. Analyze which sources are cited in AI overviews
3. Apply GEO optimization framework from `references/geo-optimization.md`

## Content Strategy Process

### Phase 1: Research
- Pull domain's ranked keywords to understand existing coverage
- Identify competitor content gaps via keyword gap analysis
- Map search intent distribution (informational vs commercial vs transactional)

### Phase 2: Architecture
- Define pillar topics (3-5 per site depending on scope)
- Build cluster map per pillar (8-15 supporting articles each)
- Assign priority based on: business value + search volume + difficulty

### Phase 3: Prioritization Matrix

Score each content piece on these factors:

| Factor | Weight | Scoring |
|--------|--------|---------|
| Search volume | 2x | High (3) / Med (2) / Low (1) |
| Keyword difficulty | 2x | Easy <30 (3) / Med 30-60 (2) / Hard >60 (1) |
| Business relevance | 3x | Direct revenue (3) / Supporting (2) / Awareness (1) |
| Content gap | 1x | No coverage (3) / Weak coverage (2) / Covered (1) |
| GEO opportunity | 1x | AI overview present (3) / PAA present (2) / Neither (1) |

Prioritize: highest weighted score first.

### Phase 4: Deliverables
- Content strategy document (use `assets/strategy-template.md`)
- Individual briefs per article (use `assets/brief-template.md`)
- Internal linking plan (hand off to OnPage sub-skill)
- Schema recommendations per content type (hand off to OnPage sub-skill)

## Content Types by Intent

| Intent | Content Type | Format | Typical KD |
|--------|-------------|--------|------------|
| Informational | Guide, How-to, Explainer | Long-form (2000-4000w) | Low-Med |
| Commercial | Comparison, Review, "Best X" | List + detail (2500-3500w) | Med-High |
| Transactional | Landing page, Product page | Conversion-focused (800-1500w) | High |
| Navigational | Brand/product page | Concise (500-1000w) | Varies |

## Integration with Other Sub-Skills

| After Content... | Hand Off To | For |
|-------------------|-------------|-----|
| Cluster defined | Keywords | Validate volumes + difficulty |
| Briefs written | OnPage | Schema markup recommendations |
| Pages published | OnPage | Internal linking implementation |
| Pages published | Technical | Lighthouse + indexing check |
| Content audited | Keywords | Gap analysis for refreshes |

## Deliverable Templates

- **Strategy document**: `assets/strategy-template.md` - Full content strategy with clusters, timeline, priorities
- **Content brief**: `assets/brief-template.md` - Individual article brief with target keyword, outline, requirements
