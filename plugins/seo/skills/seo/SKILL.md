---
name: seo
description: Comprehensive SEO and GEO (Generative Engine Optimization) skill using DataForSEO API. USE WHEN keyword research OR content strategy OR topic clusters OR content briefs OR schema markup OR E-E-A-T audit OR internal linking OR Lighthouse audit OR Core Web Vitals OR technical SEO OR on-page optimization OR GEO optimization OR competitive analysis OR SERP analysis OR content audit OR crawl audit OR search volume OR keyword difficulty OR competitor gap OR domain analysis OR search intent OR site audit.
---

# SEO - Master Skill

Routes SEO and GEO tasks to the appropriate sub-skill based on intent.

## Sub-Skill Routing

| Trigger | Route To | Purpose |
|---------|----------|---------|
| keyword, search volume, difficulty, suggestions, competitor gap, SERP competitors, search intent, domain keywords | `Keywords/SKILL.md` | Keyword research via DataForSEO |
| content strategy, topic cluster, content brief, GEO, content audit, pillar page, content calendar | `Content/SKILL.md` | Content strategy + deliverables |
| schema, E-E-A-T, internal links, on-page, optimize page, anchor text, structured data | `OnPage/SKILL.md` | Page-level optimization |
| lighthouse, core web vitals, page speed, crawl, indexing, technical audit, sitemap | `Technical/SKILL.md` | Technical SEO audits |

## Compound Workflows

Chain sub-skills for multi-step operations:

| Workflow | Chain | Trigger |
|----------|-------|---------|
| Full content strategy | Keywords → Content (topic-cluster) → OnPage (links + schema) | "build content strategy for [domain]" |
| Page optimization | Technical (lighthouse) → OnPage (eeat + schema + links) | "optimize [URL]" |
| New topic cluster | Keywords (cluster research) → Content (briefs) → OnPage (schema + links) | "create topic cluster for [keyword]" |
| Competitive analysis | Keywords (ranked + competitors + gap) | "analyze competitors for [domain]" |
| Full site audit | Technical (crawl) → OnPage (eeat) → Keywords (ranked) | "audit [domain]" |

## Directory Structure

```
~/.claude/skills/SEO/
├── SKILL.md                    # This file - master routing
├── dataforseo_client.ts        # Shared DataForSEO API client
├── SITES.md                    # Managed domains registry
├── Keywords/                   # Keyword research sub-skill
│   ├── SKILL.md
│   ├── scripts/                # CLI tools for DataForSEO
│   └── references/             # API endpoint docs
├── Content/                    # Content strategy sub-skill
│   ├── SKILL.md
│   ├── references/             # Workflow guides
│   └── assets/                 # Deliverable templates
├── OnPage/                     # On-page optimization sub-skill
│   ├── SKILL.md
│   ├── scripts/                # Validators, link mapper
│   ├── references/             # E-E-A-T rubric, schema patterns
│   └── assets/schema-templates # JSON-LD templates
└── Technical/                  # Technical SEO sub-skill
    ├── SKILL.md
    ├── scripts/                # Lighthouse, crawl tools
    └── references/             # Fix patterns
```

## DataForSEO API Client

All sub-skills share `dataforseo_client.ts`. Run scripts with `bun`.

**Credentials:** `~/.dataforseo-credentials` (chmod 600)
```
LOGIN=your_api_login
PASSWORD=your_api_password
```

Get credentials at: https://app.dataforseo.com/api-access

### Available API Coverage

| API | Methods | Used By |
|-----|---------|---------|
| Keywords Data (Google Ads) | searchVolume, keywordsForSite | Keywords |
| DataForSEO Labs | keywordSuggestions, relatedKeywords, keywordIdeas, bulkKeywordDifficulty, searchIntent, keywordOverview | Keywords |
| Labs - Competitors | rankedKeywords, serpCompetitors, domainIntersection, competitorsDomain, domainRankOverview | Keywords |
| SERP API | serpLive, aiOverviewCheck | Keywords, Content (GEO) |
| OnPage API | instantPageAudit | Technical, OnPage |
| Content Analysis | contentSearch | Content |
| Backlinks API | backlinksSummary | OnPage |

### Default Location

All API calls default to `location_code: 2840` (United States) and `language_code: "en"`. Override per-request with options.

## SITES.md

Track managed domains in `SITES.md`. Update when starting work on a new site:

```markdown
## example.com
- **Primary keywords**: [main topics]
- **Competitors**: [competitor domains]
- **Location**: US (2840)
- **Notes**: [context]
```
