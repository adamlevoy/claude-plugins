# Internal Linking Strategy

Patterns and best practices for internal link architecture.

## Table of Contents

1. [Link Architecture Models](#link-architecture-models)
2. [Anchor Text Strategy](#anchor-text-strategy)
3. [Link Placement Rules](#link-placement-rules)
4. [Audit Checklist](#audit-checklist)
5. [Implementation Workflow](#implementation-workflow)

---

## Link Architecture Models

### Hub and Spoke (Topic Clusters)

The primary model for content-driven sites. Aligns with the Content sub-skill's topic cluster architecture.

```
          ┌──── Cluster Page A
          │
Pillar ───┼──── Cluster Page B
(Hub)     │
          ├──── Cluster Page C
          │
          └──── Cluster Page D
```

**Rules:**
- Every spoke links TO the hub (required)
- Hub links to every spoke (required)
- Spokes cross-link where topically relevant (3-5 links per page)
- Hub is the strongest page — receives most internal links
- Anchor text from spokes to hub uses pillar keyword variations

### Flat Architecture

For smaller sites or sites where all pages are roughly equal priority.

```
Home ─── Page A ─── Page B
  │       │           │
  └───── Page C ─────┘
```

**Rules:**
- All important pages reachable within 2-3 clicks from home
- Horizontal linking between related pages
- Navigation provides primary link paths
- Contextual body links supplement navigation

### Silo Architecture

For large sites with distinct topic categories that shouldn't bleed authority.

```
Home
├── Silo A (Topic 1)
│   ├── Page A1
│   ├── Page A2 ←→ A3
│   └── Page A3
├── Silo B (Topic 2)
│   ├── Page B1
│   └── Page B2
└── Silo C (Topic 3)
    └── ...
```

**Rules:**
- Pages within a silo link freely to each other
- Cross-silo links should be minimal and intentional
- Each silo has a landing/pillar page that receives most links
- Navigation reflects silo structure

### Hybrid (Recommended for most sites)

Combine hub-and-spoke within silos, with selective cross-silo links for related topics.

---

## Anchor Text Strategy

### Distribution Guidelines

Anchor text should look natural — varied, not over-optimized.

| Anchor Type | Target % | Example |
|-------------|----------|---------|
| Exact match keyword | 10-15% | "content marketing strategy" |
| Partial match / variation | 30-40% | "your content strategy", "marketing content plans" |
| Branded | 10-15% | "Acme's guide", "on our blog" |
| Generic | 10-15% | "read more", "this guide", "learn more here" |
| Long-tail / natural | 20-30% | "the full guide to building a content calendar" |

### Anchor Text Rules

**Do:**
- Vary anchor text across different linking pages
- Use descriptive text that tells the user what they'll find
- Front-load keywords in anchor text when natural
- Use surrounding context to reinforce topical relevance

**Don't:**
- Use the same exact-match anchor on every internal link to a page
- Use "click here" or "read more" as the sole anchor pattern
- Stuff keywords unnaturally into anchor text
- Link irrelevant pages just to pass authority

### Anchor Text for Different Link Types

| Link Direction | Anchor Strategy |
|---------------|-----------------|
| Cluster → Pillar | Primary keyword variation (e.g., "content marketing guide") |
| Pillar → Cluster | Cluster page's target keyword (e.g., "content marketing for small business") |
| Cluster → Cluster | Natural descriptive phrase related to target page topic |
| Navigation links | Page title or short descriptive label |
| Footer links | Standard labels (About, Contact, Privacy) |

---

## Link Placement Rules

### Priority by Position

Links in different positions carry different weight and user engagement:

| Position | SEO Value | User Click Rate | Use For |
|----------|-----------|-----------------|---------|
| Body content (first 1/3) | Highest | Highest | Most important internal links |
| Body content (middle) | High | Medium | Supporting contextual links |
| Body content (bottom) | Medium | Lower | Related reading, next steps |
| Sidebar | Medium-Low | Low | Category/archive links |
| Navigation | Medium | High (but diluted) | Primary site structure |
| Footer | Low | Very low | Legal, sitemap, utility links |

### Per-Page Guidelines

| Metric | Target Range | Notes |
|--------|-------------|-------|
| Total internal links out | 5-15 | From body content (excluding nav/footer) |
| Links to pillar page | 1-2 | Don't over-link to same page |
| Links to related cluster pages | 3-5 | Contextually relevant |
| Links to conversion pages | 1-2 | Natural CTAs where appropriate |
| Total unique link targets | 5-10 | From body content |

### Contextual Link Pattern

Links should appear in context, within relevant paragraphs:

**Good:**
> When developing your strategy, start with keyword research to identify the topics your audience cares about. Our [comprehensive keyword research guide](/keyword-research-guide) walks through the full process using DataForSEO data.

**Bad:**
> Here is a list of related articles:
> - [Keyword Research Guide](/keyword-research-guide)
> - [Content Strategy Tips](/content-strategy)

---

## Audit Checklist

Run the link mapper, then check each item:

```bash
bun ~/.claude/skills/SEO/OnPage/scripts/link_mapper.ts audit <url> --depth=3 --limit=200
```

### Critical Issues (Fix Immediately)

- [ ] **Orphan pages** — pages with zero internal links pointing to them
- [ ] **Broken internal links** — 404 status on link targets
- [ ] **Redirect chains** — internal links pointing to redirects (link directly to final URL)

### High Priority

- [ ] **Deep pages** — important pages more than 3 clicks from homepage
- [ ] **Under-linked pages** — pages with fewer than 3 internal links pointing to them
- [ ] **Missing pillar links** — cluster pages not linking to their pillar page
- [ ] **No outbound links** — dead-end pages with no internal links out

### Medium Priority

- [ ] **Anchor text over-optimization** — same exact-match anchor repeated many times
- [ ] **Anchor conflicts** — same anchor text pointing to different pages
- [ ] **Link distribution imbalance** — some pages have 50+ inbound links, others have 1
- [ ] **Cross-silo leakage** — excessive links between unrelated topic areas

### Low Priority

- [ ] **Empty anchor text** — image links without alt text or aria-label
- [ ] **Nofollow internal links** — internal links with rel="nofollow" (usually unnecessary)
- [ ] **Over-linked pages** — pages with 100+ outbound links (dilutes link value)

---

## Implementation Workflow

### For New Content

1. Before publishing, identify 5-10 internal link targets:
   - 1-2 links to pillar/hub page
   - 3-5 links to related cluster/topic pages
   - 1-2 links to conversion pages (where natural)
2. Write links into content body with varied anchor text
3. After publishing, add links FROM existing pages TO new page:
   - Update pillar page to link to new cluster page
   - Add links from 3-5 most relevant existing pages

### For Existing Content (Audit-Driven)

1. Run link audit: `bun link_mapper.ts audit <url>`
2. Fix critical issues first (orphans, broken links)
3. Address under-linked pages by adding links from relevant pages
4. Flatten deep pages by adding links from higher-level pages
5. Balance anchor text distribution across the site
6. Re-audit to verify fixes

### Ongoing Maintenance

- **Per-publish:** Add 5-10 internal links to/from new content
- **Monthly:** Spot-check top 20 pages for link health
- **Quarterly:** Full site link audit with mapper tool
