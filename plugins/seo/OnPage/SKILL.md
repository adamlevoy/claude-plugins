---
name: on-page
description: On-page SEO optimization including schema markup, E-E-A-T audits, and internal linking strategy. Sub-skill of SEO.
---

# OnPage - On-Page Optimization Sub-Skill

Schema markup creation/validation, E-E-A-T auditing, and internal linking strategy. Operates at the page and site level.

## Workflow Routing

| Trigger | Workflow | Reference |
|---------|----------|-----------|
| schema, structured data, JSON-LD, rich results | Schema Markup | `references/schema-patterns.md` + `assets/schema-templates/` |
| validate schema, test markup, check structured data | Schema Validation | `scripts/schema_validator.ts` |
| E-E-A-T, expertise, authority, trust, content quality | E-E-A-T Audit | `references/eeat-rubric.md` |
| internal links, link audit, anchor text, link map | Internal Linking | `references/linking-strategy.md` |
| link map, crawl links, site structure | Link Mapping | `scripts/link_mapper.ts` |

## CLI Tools

### Schema Validator

Validate JSON-LD markup against Google's structured data requirements.

```bash
bun ~/.claude/skills/SEO/OnPage/scripts/schema_validator.ts <command> [options]
```

| Command | Purpose |
|---------|---------|
| `validate <url>` | Extract and validate JSON-LD from a live URL |
| `validate-file <path>` | Validate a local JSON-LD file |
| `check <url>` | Quick check: does the page have structured data? |
| `generate <type> [options]` | Generate JSON-LD from a schema template |

Options: `--format=json|table` (default: table)

### Link Mapper

Crawl a site's internal links and analyze structure.

```bash
bun ~/.claude/skills/SEO/OnPage/scripts/link_mapper.ts <command> [options]
```

| Command | Purpose |
|---------|---------|
| `crawl <url>` | Crawl internal links from a starting URL |
| `audit <url>` | Full link audit (orphans, depth, anchor text) |

Options: `--depth=<n>` (default: 3), `--limit=<n>` (default: 100), `--format=json|table`

## Schema Markup

### Quick Start

1. Determine the appropriate schema type (see `references/schema-patterns.md`)
2. Start from a template in `assets/schema-templates/`
3. Customize with page-specific data
4. Validate with `scripts/schema_validator.ts`
5. Implement as `<script type="application/ld+json">` in page `<head>`

### Available Templates

| Template | Schema Type | Use For |
|----------|------------|---------|
| `article.json` | Article | Blog posts, guides, news |
| `faq.json` | FAQPage | FAQ sections, PAA targeting |
| `howto.json` | HowTo | Step-by-step tutorials |
| `local-business.json` | LocalBusiness | Local business pages |
| `product.json` | Product | Product/service pages |
| `breadcrumb.json` | BreadcrumbList | Site navigation breadcrumbs |
| `organization.json` | Organization | About/company pages |

### When to Use Which Schema

See `references/schema-patterns.md` for the decision tree.

## E-E-A-T Audit

Score pages against Google's Experience, Expertise, Authoritativeness, and Trustworthiness signals.

### Quick Audit

For a single page, evaluate across 4 dimensions (scoring 1-5 each):

| Dimension | Key Question |
|-----------|-------------|
| **Experience** | Does the content demonstrate first-hand experience? |
| **Expertise** | Is the author qualified on this topic? |
| **Authoritativeness** | Is this site/author recognized as an authority? |
| **Trustworthiness** | Is the content accurate, transparent, and safe? |

See `references/eeat-rubric.md` for the full scoring rubric with actionable fix recommendations.

### YMYL Considerations

Pages covering health, finance, safety, or legal topics (Your Money Your Life) are held to a **higher E-E-A-T standard**. For YMYL content:
- Author credentials are required, not optional
- Claims must cite authoritative sources
- Content must be reviewed/fact-checked
- Contact information and editorial policies should be visible

## Internal Linking

### Quick Audit

1. Map current links: `scripts/link_mapper.ts crawl <url>`
2. Identify issues: orphan pages, deep pages, over/under-linked pages
3. Design linking strategy per `references/linking-strategy.md`
4. Implement with appropriate anchor text variation

### Link Health Indicators

| Metric | Healthy | Warning | Action |
|--------|---------|---------|--------|
| Click depth | ≤3 from home | 4-5 | Add links from higher pages |
| Orphan pages | 0 | Any | Link from relevant content |
| Links to page | 3+ internal | 0-2 | Add contextual links |
| Links from page | 3-10 | 0-2 or 20+ | Balance link distribution |

## Integration with Other Sub-Skills

| From | To OnPage | For |
|------|-----------|-----|
| Content (brief) | Schema patterns | Recommend schema type per content |
| Content (cluster) | Linking strategy | Build internal link map |
| Content (audit) | E-E-A-T rubric | Score existing content quality |
| Keywords (SERP) | Schema patterns | Match SERP features to schema |
| Technical (audit) | Link mapper | Identify structural issues |
