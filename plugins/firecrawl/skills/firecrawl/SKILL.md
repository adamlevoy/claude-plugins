---
name: Firecrawl
description: Web scraping and crawling via Firecrawl API. USE WHEN user asks to scrape websites OR crawl sites for markdown OR build knowledge bases OR competitive analysis OR SEO research OR extract structured data from web pages OR map website URLs OR search the web.
---

# Firecrawl

Web scraping and crawling API that converts websites into LLM-ready markdown. Use for knowledge base creation, research, competitive analysis, and SEO.

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **Direct API** | All operations | Uses `firecrawl_client.ts` directly |

## API Capabilities

### Core Operations

| Action | Method | Notes |
|--------|--------|-------|
| Scrape URL | `scrape(url, options)` | Single page to markdown/HTML/screenshot |
| Crawl site | `crawlAsync(url, options)` | Async multi-page crawl |
| Check crawl | `getCrawlStatus(jobId)` | Poll crawl job status |
| Cancel crawl | `cancelCrawl(jobId)` | Stop running crawl |
| Map URLs | `map(url, options)` | Discover all site URLs |
| Search web | `search(query, options)` | Web search + optional scrape |
| Batch scrape | `batchScrapeAsync(urls, options)` | Multiple URLs in parallel |
| Extract data | `scrape(url, { extract: {...} })` | LLM-powered structured extraction |

---

## Scrape Endpoint

**POST** `https://api.firecrawl.dev/v2/scrape`

Scrapes a single URL and returns content in multiple formats.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | URL to scrape |
| `formats` | array | No | Output formats: `markdown`, `html`, `rawHtml`, `links`, `screenshot`, `extract` |
| `onlyMainContent` | boolean | No | Exclude nav/headers/footers |
| `includeTags` | array | No | HTML tags/classes/IDs to include |
| `excludeTags` | array | No | HTML tags/classes/IDs to exclude |
| `waitFor` | number | No | Milliseconds to wait before scraping |
| `timeout` | number | No | Request timeout in ms |

### Response

```json
{
  "success": true,
  "data": {
    "markdown": "# Page Title\n\nContent here...",
    "html": "<!DOCTYPE html>...",
    "links": ["https://example.com/page1", "https://example.com/page2"],
    "screenshot": "data:image/png;base64,...",
    "metadata": {
      "title": "Page Title",
      "description": "Meta description",
      "language": "en",
      "sourceURL": "https://example.com",
      "statusCode": 200
    }
  }
}
```

---

## Crawl Endpoint

**POST** `https://api.firecrawl.dev/v2/crawl`

Async crawl that follows links and scrapes multiple pages.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | Starting URL |
| `limit` | number | No | Max pages to crawl (default: 10) |
| `maxDepth` | number | No | Max link depth to follow |
| `includePaths` | array | No | URL patterns to include |
| `excludePaths` | array | No | URL patterns to exclude |
| `allowBackwardLinks` | boolean | No | Allow crawling back to parent paths |
| `allowExternalLinks` | boolean | No | Allow crawling external domains |
| `scrapeOptions` | object | No | Same options as scrape endpoint |

### Start Response

```json
{
  "success": true,
  "id": "crawl_abc123",
  "url": "https://api.firecrawl.dev/v2/crawl/crawl_abc123"
}
```

### Status Check

**GET** `https://api.firecrawl.dev/v2/crawl/{id}`

```json
{
  "success": true,
  "status": "completed",
  "completed": 15,
  "total": 15,
  "creditsUsed": 15,
  "data": [
    {
      "markdown": "# Page Content...",
      "metadata": { "url": "https://...", "title": "..." }
    }
  ]
}
```

Status values: `scraping`, `completed`, `failed`, `cancelled`

---

## Map Endpoint

**POST** `https://api.firecrawl.dev/v2/map`

Discovers all URLs from a website using sitemap analysis and intelligent crawling.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | Base URL to map |
| `search` | string | No | Filter URLs by search query |
| `ignoreSitemap` | boolean | No | Skip sitemap, crawl only |
| `includeSubdomains` | boolean | No | Include subdomain URLs |
| `sitemapOnly` | boolean | No | Only return sitemap URLs |
| `limit` | number | No | Max links to return (default: 100, max: 5000) |

### Response

```json
{
  "success": true,
  "links": [
    { "url": "https://docs.example.com", "title": "Docs", "description": "..." },
    { "url": "https://docs.example.com/api", "title": "API Reference", "description": "..." }
  ]
}
```

---

## Search Endpoint

**POST** `https://api.firecrawl.dev/v2/search`

Web search with optional content scraping of results.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search query |
| `limit` | number | No | Max results (default: 5) |
| `lang` | string | No | Language code (e.g., "en") |
| `country` | string | No | Country code (e.g., "us") |
| `scrapeOptions` | object | No | Scrape each result with these options |

### Response

```json
{
  "success": true,
  "data": [
    {
      "url": "https://example.com/article",
      "title": "Article Title",
      "description": "Search snippet...",
      "markdown": "# Full content if scrapeOptions provided..."
    }
  ]
}
```

---

## Batch Scrape Endpoint

**POST** `https://api.firecrawl.dev/v2/batch/scrape`

Scrape multiple URLs in parallel (async operation).

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `urls` | array | Yes | List of URLs to scrape |
| `formats` | array | No | Output formats |
| `extract` | object | No | Extraction schema/prompt |

### Response

Returns job ID, then poll for status like crawl endpoint.

---

## LLM Extraction

Add `extract` to formats for structured data extraction.

### Schema-Based Extraction

```json
{
  "url": "https://news.ycombinator.com",
  "formats": ["markdown", "extract"],
  "extract": {
    "schema": {
      "type": "object",
      "properties": {
        "topStories": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "title": { "type": "string" },
              "points": { "type": "number" },
              "author": { "type": "string" }
            }
          },
          "maxItems": 5
        }
      }
    }
  }
}
```

### Prompt-Based Extraction

```json
{
  "url": "https://example.com/about",
  "formats": ["extract"],
  "extract": {
    "prompt": "Extract the company mission, key features, and pricing tiers."
  }
}
```

---

## Examples

**Example 1: Scrape page to markdown for knowledge base**
```
User: "Scrape the Stripe API docs homepage"
-> scrape("https://docs.stripe.com/api", { formats: ["markdown"], onlyMainContent: true })
-> Returns clean markdown without navigation
```

**Example 2: Crawl entire documentation site**
```
User: "Crawl the Firecrawl docs for my knowledge base"
-> crawlAsync("https://docs.firecrawl.dev", { limit: 100, scrapeOptions: { formats: ["markdown"] } })
-> Poll getCrawlStatus(jobId) until completed
-> Returns array of all pages as markdown
```

**Example 3: Map competitor's website structure**
```
User: "Map all the URLs on competitor.com"
-> map("https://competitor.com", { limit: 500 })
-> Returns full URL tree for analysis
```

**Example 4: Research topic with web search**
```
User: "Search for recent AI agent frameworks"
-> search("AI agent frameworks 2024", { limit: 10, scrapeOptions: { formats: ["markdown"] } })
-> Returns search results with full content scraped
```

**Example 5: Extract structured product data**
```
User: "Extract pricing from this SaaS website"
-> scrape(url, { formats: ["extract"], extract: { prompt: "Extract all pricing tiers with features and costs" } })
-> Returns structured JSON with pricing data
```

**Example 6: SEO analysis - get all page links**
```
User: "Get all internal links from my site for SEO audit"
-> map("https://mysite.com", { limit: 5000 })
-> Then batch scrape for metadata: batchScrapeAsync(urls, { formats: ["links"] })
-> Returns complete link graph
```

---

## Authentication

**Credentials:** `~/.firecrawl-credentials` (chmod 600)
```
FIRECRAWL_API_KEY=fc-your_api_key_here
```

**API Base URL:** `https://api.firecrawl.dev`

Get your API key from: https://www.firecrawl.dev/app/api-keys

---

## Rate Limits & Credits

- Each page scraped uses 1 credit
- Crawl operations use 1 credit per page discovered
- Map operations use 1 credit per 100 URLs
- Free tier: 500 credits/month
- Check usage at: https://www.firecrawl.dev/app/usage

---

## Files

```
~/.claude/skills/Firecrawl/
├── SKILL.md              # This file
├── firecrawl_client.ts   # TypeScript API wrapper
└── Tools/                # CLI tools (reserved)
```

---

## Usage

```typescript
import { FirecrawlClient } from './firecrawl_client';

const client = new FirecrawlClient();

// Scrape single URL
const page = await client.scrape("https://example.com", {
  formats: ["markdown", "links"],
  onlyMainContent: true
});
console.log(page.data.markdown);

// Async crawl
const job = await client.crawlAsync("https://docs.example.com", { limit: 50 });
let status = await client.getCrawlStatus(job.id);
while (status.status === "scraping") {
  await new Promise(r => setTimeout(r, 2000));
  status = await client.getCrawlStatus(job.id);
}
console.log(`Crawled ${status.data.length} pages`);

// Map site URLs
const urls = await client.map("https://example.com", { limit: 100 });
console.log(urls.links);

// Web search + scrape
const results = await client.search("web scraping tools", {
  limit: 5,
  scrapeOptions: { formats: ["markdown"] }
});

// Extract structured data
const extracted = await client.scrape("https://news.ycombinator.com", {
  formats: ["extract"],
  extract: {
    prompt: "Extract the top 5 story titles with their point counts"
  }
});
```
