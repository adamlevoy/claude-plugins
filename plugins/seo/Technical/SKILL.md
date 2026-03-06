---
name: technical
description: Technical SEO auditing including Lighthouse, Core Web Vitals, and crawl/indexing analysis. Sub-skill of SEO.
---

# Technical - Technical SEO Sub-Skill

Lighthouse performance audits, Core Web Vitals analysis, and crawlability/indexing checks. Uses PageSpeed Insights API (free, no auth) and DataForSEO OnPage API.

## Workflow Routing

| Trigger | Workflow | Tool |
|---------|----------|------|
| lighthouse, page speed, performance score | Lighthouse Audit | `scripts/lighthouse_audit.ts` |
| core web vitals, CWV, LCP, FID, CLS, INP | Core Web Vitals | `scripts/cwv_check.ts` |
| crawl, indexing, robots, sitemap, canonical, technical audit | Crawl Audit | `scripts/crawl_audit.ts` |
| fix performance, fix lighthouse | Fix Patterns | `references/lighthouse-fixes.md` |

## CLI Tools

### Lighthouse Audit

Run Google PageSpeed Insights (Lighthouse) audits. No API key required.

```bash
bun ~/.claude/skills/SEO/Technical/scripts/lighthouse_audit.ts <command> [options]
```

| Command | Purpose |
|---------|---------|
| `audit <url>` | Full Lighthouse audit (performance, accessibility, SEO, best practices) |
| `performance <url>` | Performance-only audit with Core Web Vitals |
| `batch <url1> <url2> ...` | Audit multiple URLs |

| Option | Default | Description |
|--------|---------|-------------|
| `--strategy=<s>` | mobile | `mobile` or `desktop` |
| `--format=<f>` | table | `table`, `json`, or `csv` |
| `--category=<c>` | all | Filter: `performance`, `accessibility`, `seo`, `best-practices` |

### Core Web Vitals Check

Detailed CWV analysis using DataForSEO OnPage API.

```bash
bun ~/.claude/skills/SEO/Technical/scripts/cwv_check.ts <command> [options]
```

| Command | Purpose |
|---------|---------|
| `check <url>` | CWV metrics for a single URL |
| `batch <url1> <url2> ...` | CWV for multiple URLs |

| Option | Default | Description |
|--------|---------|-------------|
| `--format=<f>` | table | `table` or `json` |

### Crawl Audit

Analyze crawlability and indexing signals using DataForSEO OnPage API.

```bash
bun ~/.claude/skills/SEO/Technical/scripts/crawl_audit.ts <command> [options]
```

| Command | Purpose |
|---------|---------|
| `page <url>` | Single page technical audit |
| `batch <url1> <url2> ...` | Audit multiple pages |

| Option | Default | Description |
|--------|---------|-------------|
| `--format=<f>` | table | `table` or `json` |

## Audit Workflows

### Full Technical Audit

1. Run Lighthouse on key pages (homepage, top landing pages):
   ```bash
   bun lighthouse_audit.ts batch <homepage> <landing1> <landing2> --strategy=mobile
   ```
2. Check Core Web Vitals:
   ```bash
   bun cwv_check.ts batch <same urls>
   ```
3. Run crawl audit on key pages:
   ```bash
   bun crawl_audit.ts batch <same urls>
   ```
4. Cross-reference issues with `references/lighthouse-fixes.md` for fix patterns
5. Prioritize: CWV issues first (ranking signal), then SEO issues, then best practices

### Page Speed Optimization

1. Run performance audit: `bun lighthouse_audit.ts performance <url>`
2. Identify largest bottlenecks (LCP, TBT, CLS)
3. Look up fix patterns in `references/lighthouse-fixes.md`
4. Implement fixes, re-audit to verify

### Pre-Launch Technical Check

For new pages or site migrations:

1. Crawl audit: check canonical, robots, meta robots, status codes
2. Lighthouse: confirm performance scores acceptable
3. Schema validation (via OnPage sub-skill): confirm structured data
4. Internal links (via OnPage sub-skill): confirm page is linked

## Scoring Thresholds

### Lighthouse Scores

| Score | Rating | Action |
|:-----:|--------|--------|
| 90-100 | Good | Monitor |
| 50-89 | Needs Improvement | Optimize top issues |
| 0-49 | Poor | Urgent fixes needed |

### Core Web Vitals

| Metric | Good | Needs Improvement | Poor |
|--------|:----:|:-----------------:|:----:|
| LCP (Largest Contentful Paint) | ≤ 2.5s | 2.5-4.0s | > 4.0s |
| INP (Interaction to Next Paint) | ≤ 200ms | 200-500ms | > 500ms |
| CLS (Cumulative Layout Shift) | ≤ 0.1 | 0.1-0.25 | > 0.25 |
| FCP (First Contentful Paint) | ≤ 1.8s | 1.8-3.0s | > 3.0s |
| TTFB (Time to First Byte) | ≤ 0.8s | 0.8-1.8s | > 1.8s |
| TBT (Total Blocking Time) | ≤ 200ms | 200-600ms | > 600ms |

## Integration with Other Sub-Skills

| From | To Technical | For |
|------|-------------|-----|
| Content (new page) | Lighthouse + crawl | Pre-publish performance check |
| OnPage (link audit) | Crawl audit | Verify crawlability of linked pages |
| Keywords (SERP) | Performance check | Compare page speed to competitors |
| Content (audit) | Full technical audit | Site-wide health assessment |

## Fix Reference

See `references/lighthouse-fixes.md` for categorized fix patterns covering:
- Performance (LCP, TBT, CLS optimization)
- Accessibility (contrast, alt text, ARIA)
- SEO (meta tags, canonicals, structured data)
- Best practices (HTTPS, console errors, image formats)
