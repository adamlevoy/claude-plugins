/**
 * Firecrawl API Client
 * Web scraping and crawling for LLM-ready markdown
 */

import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const API_BASE = "https://api.firecrawl.dev";

// Types
export interface ScrapeOptions {
  formats?: ("markdown" | "html" | "rawHtml" | "links" | "screenshot" | "extract")[];
  onlyMainContent?: boolean;
  includeTags?: string[];
  excludeTags?: string[];
  waitFor?: number;
  timeout?: number;
  extract?: ExtractOptions;
}

export interface ExtractOptions {
  schema?: object;
  prompt?: string;
}

export interface CrawlOptions {
  limit?: number;
  maxDepth?: number;
  includePaths?: string[];
  excludePaths?: string[];
  allowBackwardLinks?: boolean;
  allowExternalLinks?: boolean;
  scrapeOptions?: ScrapeOptions;
}

export interface MapOptions {
  search?: string;
  ignoreSitemap?: boolean;
  includeSubdomains?: boolean;
  sitemapOnly?: boolean;
  limit?: number;
}

export interface SearchOptions {
  limit?: number;
  lang?: string;
  country?: string;
  scrapeOptions?: ScrapeOptions;
}

export interface PageMetadata {
  title?: string;
  description?: string;
  language?: string;
  keywords?: string;
  sourceURL: string;
  statusCode: number;
}

export interface ScrapeResult {
  success: boolean;
  data: {
    markdown?: string;
    html?: string;
    rawHtml?: string;
    links?: string[];
    screenshot?: string;
    extract?: object;
    metadata: PageMetadata;
  };
}

export interface CrawlStartResult {
  success: boolean;
  id: string;
  url: string;
}

export interface CrawlStatusResult {
  success: boolean;
  status: "scraping" | "completed" | "failed" | "cancelled";
  completed: number;
  total: number;
  creditsUsed: number;
  expiresAt?: string;
  data: Array<{
    markdown?: string;
    html?: string;
    links?: string[];
    metadata: PageMetadata;
  }>;
}

export interface MapResult {
  success: boolean;
  links: Array<{
    url: string;
    title?: string;
    description?: string;
  }> | string[];
}

export interface SearchResult {
  success: boolean;
  data: Array<{
    url: string;
    title: string;
    description?: string;
    markdown?: string;
    html?: string;
    metadata?: PageMetadata;
  }>;
}

export interface BatchScrapeStartResult {
  success: boolean;
  id: string;
  url: string;
}

function loadApiKey(): string {
  const credPath = join(homedir(), ".firecrawl-credentials");

  if (!existsSync(credPath)) {
    throw new Error(
      `Credentials file not found at ${credPath}\n` +
      `Create it with: echo "FIRECRAWL_API_KEY=fc-your_key" > ~/.firecrawl-credentials && chmod 600 ~/.firecrawl-credentials`
    );
  }

  const content = readFileSync(credPath, "utf-8");
  const match = content.match(/FIRECRAWL_API_KEY=(.+)/);

  if (!match) {
    throw new Error("FIRECRAWL_API_KEY not found in credentials file");
  }

  return match[1].trim();
}

export class FirecrawlClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || loadApiKey();
    this.baseUrl = API_BASE;
  }

  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" | "DELETE" = "GET",
    body?: object
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Firecrawl API error (${response.status}): ${error}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Scrape a single URL
   */
  async scrape(url: string, options: ScrapeOptions = {}): Promise<ScrapeResult> {
    const payload: Record<string, unknown> = { url };

    if (options.formats) payload.formats = options.formats;
    if (options.onlyMainContent !== undefined) payload.onlyMainContent = options.onlyMainContent;
    if (options.includeTags) payload.includeTags = options.includeTags;
    if (options.excludeTags) payload.excludeTags = options.excludeTags;
    if (options.waitFor) payload.waitFor = options.waitFor;
    if (options.timeout) payload.timeout = options.timeout;
    if (options.extract) payload.extract = options.extract;

    return this.request<ScrapeResult>("/v2/scrape", "POST", payload);
  }

  /**
   * Start an async crawl job
   */
  async crawlAsync(url: string, options: CrawlOptions = {}): Promise<CrawlStartResult> {
    const payload: Record<string, unknown> = { url };

    if (options.limit) payload.limit = options.limit;
    if (options.maxDepth) payload.maxDepth = options.maxDepth;
    if (options.includePaths) payload.includePaths = options.includePaths;
    if (options.excludePaths) payload.excludePaths = options.excludePaths;
    if (options.allowBackwardLinks !== undefined) payload.allowBackwardLinks = options.allowBackwardLinks;
    if (options.allowExternalLinks !== undefined) payload.allowExternalLinks = options.allowExternalLinks;
    if (options.scrapeOptions) payload.scrapeOptions = options.scrapeOptions;

    return this.request<CrawlStartResult>("/v2/crawl", "POST", payload);
  }

  /**
   * Get crawl job status and results
   */
  async getCrawlStatus(jobId: string): Promise<CrawlStatusResult> {
    return this.request<CrawlStatusResult>(`/v2/crawl/${jobId}`);
  }

  /**
   * Cancel a running crawl job
   */
  async cancelCrawl(jobId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/v2/crawl/${jobId}`, "DELETE");
  }

  /**
   * Crawl and wait for completion (convenience method)
   */
  async crawl(
    url: string,
    options: CrawlOptions = {},
    pollIntervalMs: number = 2000,
    onProgress?: (status: CrawlStatusResult) => void
  ): Promise<CrawlStatusResult> {
    const job = await this.crawlAsync(url, options);

    while (true) {
      const status = await this.getCrawlStatus(job.id);

      if (onProgress) onProgress(status);

      if (status.status === "completed" || status.status === "failed" || status.status === "cancelled") {
        return status;
      }

      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
  }

  /**
   * Map all URLs from a website
   */
  async map(url: string, options: MapOptions = {}): Promise<MapResult> {
    const payload: Record<string, unknown> = { url };

    if (options.search) payload.search = options.search;
    if (options.ignoreSitemap !== undefined) payload.ignoreSitemap = options.ignoreSitemap;
    if (options.includeSubdomains !== undefined) payload.includeSubdomains = options.includeSubdomains;
    if (options.sitemapOnly !== undefined) payload.sitemapOnly = options.sitemapOnly;
    if (options.limit) payload.limit = options.limit;

    return this.request<MapResult>("/v2/map", "POST", payload);
  }

  /**
   * Search the web and optionally scrape results
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult> {
    const payload: Record<string, unknown> = { query };

    if (options.limit) payload.limit = options.limit;
    if (options.lang) payload.lang = options.lang;
    if (options.country) payload.country = options.country;
    if (options.scrapeOptions) payload.scrapeOptions = options.scrapeOptions;

    return this.request<SearchResult>("/v2/search", "POST", payload);
  }

  /**
   * Start an async batch scrape job
   */
  async batchScrapeAsync(urls: string[], options: ScrapeOptions = {}): Promise<BatchScrapeStartResult> {
    const payload: Record<string, unknown> = { urls };

    if (options.formats) payload.formats = options.formats;
    if (options.onlyMainContent !== undefined) payload.onlyMainContent = options.onlyMainContent;
    if (options.extract) payload.extract = options.extract;

    return this.request<BatchScrapeStartResult>("/v2/batch/scrape", "POST", payload);
  }

  /**
   * Get batch scrape job status (same format as crawl)
   */
  async getBatchScrapeStatus(jobId: string): Promise<CrawlStatusResult> {
    return this.request<CrawlStatusResult>(`/v2/batch/scrape/${jobId}`);
  }

  /**
   * Batch scrape and wait for completion (convenience method)
   */
  async batchScrape(
    urls: string[],
    options: ScrapeOptions = {},
    pollIntervalMs: number = 2000,
    onProgress?: (status: CrawlStatusResult) => void
  ): Promise<CrawlStatusResult> {
    const job = await this.batchScrapeAsync(urls, options);

    while (true) {
      const status = await this.getBatchScrapeStatus(job.id);

      if (onProgress) onProgress(status);

      if (status.status === "completed" || status.status === "failed" || status.status === "cancelled") {
        return status;
      }

      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
  }
}

// Default export for convenience
export default FirecrawlClient;
