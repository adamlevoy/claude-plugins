# Schema Markup Patterns

Decision guide for choosing, implementing, and testing JSON-LD structured data.

## Table of Contents

1. [Decision Tree](#decision-tree)
2. [Schema Types by Page](#schema-types-by-page)
3. [Implementation Rules](#implementation-rules)
4. [Common Mistakes](#common-mistakes)
5. [Rich Result Eligibility](#rich-result-eligibility)
6. [Testing](#testing)

---

## Decision Tree

Use this to determine which schema type(s) to apply:

```
What is the page?
├── Blog post / Article → Article (+ FAQPage if FAQ section)
├── How-to / Tutorial → HowTo (+ Article)
├── FAQ page → FAQPage
├── Product page → Product (+ Offer + AggregateRating)
├── Service page → Service (+ Offer)
├── Local business page → LocalBusiness
├── About / Company page → Organization (+ Person for team)
├── Author profile → Person
├── Category / Hub page → CollectionPage (+ BreadcrumbList)
├── Homepage → WebSite (+ Organization + SearchAction)
└── Any page with breadcrumbs → BreadcrumbList (add to above)
```

**Multiple schemas per page is normal.** Most pages should have at least 2 (e.g., Article + BreadcrumbList).

---

## Schema Types by Page

### Article / BlogPosting

**Use for:** Blog posts, news articles, guides, opinion pieces.

**When to use Article vs BlogPosting:**
- `Article` — general default, works for everything
- `BlogPosting` — explicitly a blog post (subset of Article)
- `NewsArticle` — timely news content

**Required for rich results:**
- `headline` — article title (max 110 chars)
- `image` — at least one image (1200px wide recommended)
- `datePublished` — ISO 8601 format
- `author` — Person or Organization with `name`

**Template:** `assets/schema-templates/article.json`

### FAQPage

**Use for:** Any page with a question-and-answer section. Can be combined with Article.

**Eligibility rule:** The page must visibly display the FAQ. Hidden/accordion FAQs are fine as long as the content is in the HTML.

**Structure:** Array of `Question` objects, each with an `acceptedAnswer` of type `Answer`.

**Template:** `assets/schema-templates/faq.json`

### HowTo

**Use for:** Step-by-step tutorials, guides with ordered instructions.

**Rich result display:** Steps shown directly in SERP with optional images per step.

**Key fields:**
- `step[]` — array of HowToStep with `text` (required) and `name` (recommended)
- `totalTime` — ISO 8601 duration (e.g., "PT30M" for 30 minutes)
- `estimatedCost` — MonetaryAmount if applicable
- `supply[]` / `tool[]` — materials needed

**Template:** `assets/schema-templates/howto.json`

### Product

**Use for:** Product pages, SaaS pricing pages, service offerings.

**Required for rich results:**
- `name` — product name
- `image` — product image
- `offers` — with `price`, `priceCurrency`, `availability`

**Recommended:**
- `aggregateRating` — star rating
- `review` — individual reviews
- `brand` — brand name
- `sku` / `gtin` — product identifiers

**Template:** `assets/schema-templates/product.json`

### LocalBusiness

**Use for:** Business location pages, contact pages for local businesses.

**Required:**
- `name`, `address` (PostalAddress)

**Strongly recommended:**
- `telephone`, `url`, `geo` (latitude/longitude)
- `openingHoursSpecification` — business hours
- `image`, `priceRange`

**Template:** `assets/schema-templates/local-business.json`

### Organization

**Use for:** About pages, company pages, footer/site-wide.

**Key fields:**
- `name`, `url`, `logo`
- `sameAs` — array of social profile URLs
- `contactPoint` — customer service info
- `foundingDate`, `description`

**Template:** `assets/schema-templates/organization.json`

### BreadcrumbList

**Use for:** Any page with navigation breadcrumbs. Add alongside other schemas.

**Structure:** Ordered `itemListElement` array with `position`, `name`, and `item` (URL).

**Template:** `assets/schema-templates/breadcrumb.json`

---

## Implementation Rules

### Placement
- Always use `<script type="application/ld+json">` in the `<head>` section
- One JSON-LD block per schema type (or combine with `@graph`)
- Never use microdata or RDFa for new implementations

### `@graph` Pattern
For multiple schemas on one page, use `@graph`:
```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Article", ... },
    { "@type": "BreadcrumbList", ... }
  ]
}
```

### Content Match Rule
Schema data MUST match the visible page content. Google penalizes mismatches:
- Schema `headline` must match the visible H1/title
- Schema `author` must match the visible author name
- Schema `price` must match the visible price
- FAQ questions must be visibly displayed on the page

### Image Requirements
- Minimum 1200px wide for Article rich results
- Aspect ratios: 16:9, 4:3, or 1:1
- Format: JPEG, PNG, GIF, or WebP
- Must be crawlable (not blocked by robots.txt)

---

## Common Mistakes

| Mistake | Impact | Fix |
|---------|--------|-----|
| Missing `@context` | Schema ignored entirely | Add `"@context": "https://schema.org"` |
| `@type` typo | Schema not recognized | Check exact casing (e.g., `FAQPage` not `FaqPage`) |
| FAQ not visible on page | Manual action risk | Ensure FAQ content is in visible HTML |
| Price in wrong format | No rich result | Use number, not string (e.g., `29.99` not `"$29.99"`) |
| Missing `image` on Article | No rich result | Add at least one image URL |
| Stale dates | Reduced trust | Update `dateModified` when content changes |
| Over-marking | Spam risk | Only mark up content that exists on the page |

---

## Rich Result Eligibility

| Schema Type | Rich Result | Requirements |
|------------|------------|--------------|
| Article | Article carousel | headline, image, datePublished, author |
| FAQPage | FAQ accordion in SERP | mainEntity with Question/Answer pairs |
| HowTo | Step display in SERP | name, step array with text |
| Product | Price, rating, availability | name, offers with price |
| LocalBusiness | Knowledge panel, maps | name, address, geo |
| BreadcrumbList | Breadcrumb trail in SERP | itemListElement array |
| Review | Star rating in SERP | reviewRating with ratingValue |

---

## Testing

### Validation Flow

1. **Generate** from template: `bun schema_validator.ts generate <type>`
2. **Customize** with page-specific data
3. **Validate locally**: `bun schema_validator.ts validate-file schema.json`
4. **Implement** on page
5. **Validate live**: `bun schema_validator.ts validate <url>`
6. **Test with Google**: https://search.google.com/test/rich-results
7. **Monitor** in Google Search Console → Enhancements

### Google Rich Results Test
Always run through Google's official tester before launch:
- https://search.google.com/test/rich-results (live URL or code snippet)
- Shows exactly which rich results are eligible
- Identifies errors Google sees vs. what our validator catches
