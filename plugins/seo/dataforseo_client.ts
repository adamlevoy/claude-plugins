#!/usr/bin/env bun
/**
 * DataForSEO API Client
 * Shared client for all SEO sub-skills
 *
 * Auth: Basic auth via ~/.dataforseo-credentials
 * Docs: https://docs.dataforseo.com/v3/
 */

import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const API_BASE = "https://api.dataforseo.com/v3";
const CREDENTIALS_PATH = join(homedir(), ".dataforseo-credentials");

// ============================================================================
// Types
// ============================================================================

export interface LocationOptions {
  location_code?: number;
  location_name?: string;
  language_code?: string;
  language_name?: string;
}

export interface SearchVolumeOptions extends LocationOptions {
  search_partners?: boolean;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
}

export interface LabsOptions extends LocationOptions {
  limit?: number;
  offset?: number;
  filters?: any[];
  order_by?: string[];
  include_serp_info?: boolean;
  include_clickstream_data?: boolean;
}

export interface KeywordSuggestionsOptions extends LabsOptions {
  include_seed_keyword?: boolean;
  exact_match?: boolean;
  ignore_synonyms?: boolean;
}

export interface RankedKeywordsOptions extends LabsOptions {
  item_types?: string[];
  ignore_synonyms?: boolean;
}

export interface SerpCompetitorsOptions extends LabsOptions {}

export interface DomainIntersectionOptions extends LabsOptions {
  intersections?: boolean;
}

// Response types
export interface ApiResponse<T = any> {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: ApiTask<T>[];
}

export interface ApiTask<T = any> {
  id: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  result_count: number;
  result: T[];
}

export interface KeywordData {
  keyword: string;
  search_volume: number;
  competition: string;
  competition_index: number;
  cpc: number;
  low_top_of_page_bid: number;
  high_top_of_page_bid: number;
  monthly_searches: Array<{ year: number; month: number; search_volume: number }>;
}

export interface KeywordSuggestionItem {
  keyword: string;
  keyword_info: {
    search_volume: number;
    competition: number;
    competition_level: string;
    cpc: number;
    low_top_of_page_bid: number;
    high_top_of_page_bid: number;
    monthly_searches: Array<{ year: number; month: number; search_volume: number }>;
  };
  keyword_properties: {
    core_keyword: string;
    keyword_difficulty: number;
    words_count: number;
  };
  search_intent_info?: {
    main_intent: string;
    foreign_intent: string[];
  };
  serp_info?: any;
}

export interface RankedKeywordItem {
  keyword_data: {
    keyword: string;
    keyword_info: {
      search_volume: number;
      cpc: number;
      competition_level: string;
    };
  };
  ranked_serp_element: {
    serp_item: {
      rank_group: number;
      rank_absolute: number;
      url: string;
    };
  };
}

export interface SerpCompetitorItem {
  domain: string;
  avg_position: number;
  median_position: number;
  rating: number;
  etv: number;
  keywords_count: number;
  relevant_serp_items: number;
}

export interface DomainMetrics {
  organic: {
    pos_1: number;
    pos_2_3: number;
    pos_4_10: number;
    pos_11_20: number;
    pos_21_30: number;
    etv: number;
    count: number;
    estimated_paid_traffic_cost: number;
  };
}

// ============================================================================
// Client
// ============================================================================

function loadCredentials(): { login: string; password: string } {
  if (!existsSync(CREDENTIALS_PATH)) {
    throw new Error(
      `Credentials not found at ${CREDENTIALS_PATH}\n` +
      `Create with:\n  echo "LOGIN=your_login\\nPASSWORD=your_password" > ~/.dataforseo-credentials && chmod 600 ~/.dataforseo-credentials\n` +
      `Get credentials at: https://app.dataforseo.com/api-access`
    );
  }

  const content = readFileSync(CREDENTIALS_PATH, "utf-8");
  const creds: Record<string, string> = {};

  for (const line of content.split("\n")) {
    if (line && line.includes("=")) {
      const [key, ...val] = line.split("=");
      creds[key.trim()] = val.join("=").trim();
    }
  }

  if (!creds.LOGIN || !creds.PASSWORD) {
    throw new Error("LOGIN and PASSWORD required in ~/.dataforseo-credentials");
  }

  return { login: creds.LOGIN, password: creds.PASSWORD };
}

export class DataForSEOClient {
  private authHeader: string;

  constructor(login?: string, password?: string) {
    if (login && password) {
      this.authHeader = `Basic ${btoa(`${login}:${password}`)}`;
    } else {
      const creds = loadCredentials();
      this.authHeader = `Basic ${btoa(`${creds.login}:${creds.password}`)}`;
    }
  }

  private async request<T>(endpoint: string, body: any[]): Promise<ApiResponse<T>> {
    const url = `${API_BASE}${endpoint}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": this.authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DataForSEO API error (${response.status}): ${error}`);
    }

    return response.json() as Promise<ApiResponse<T>>;
  }

  /**
   * Extract items from a standard DataForSEO response
   */
  private extractItems<T>(response: ApiResponse<any>): T[] {
    const items: T[] = [];
    for (const task of response.tasks) {
      if (task.status_code === 20000 && task.result) {
        for (const result of task.result) {
          if (result.items) {
            items.push(...result.items);
          }
        }
      }
    }
    return items;
  }

  /**
   * Extract results (non-items) from response
   */
  private extractResults<T>(response: ApiResponse<T>): T[] {
    const results: T[] = [];
    for (const task of response.tasks) {
      if (task.status_code === 20000 && task.result) {
        results.push(...task.result);
      }
    }
    return results;
  }

  // ==========================================================================
  // Keywords Data API
  // ==========================================================================

  /**
   * Get search volume for keywords (Google Ads data)
   * Endpoint: /v3/keywords_data/google_ads/search_volume/live
   * Rate limit: 12 requests/minute
   * Max: 1000 keywords per request
   */
  async searchVolume(
    keywords: string[],
    options: SearchVolumeOptions = {}
  ): Promise<ApiResponse<{ result: KeywordData[] }>> {
    return this.request("/keywords_data/google_ads/search_volume/live", [{
      keywords,
      location_code: options.location_code ?? 2840,
      language_code: options.language_code ?? "en",
      ...options,
    }]);
  }

  /**
   * Get keyword suggestions for a site (Google Ads data)
   * Endpoint: /v3/keywords_data/google_ads/keywords_for_site/live
   */
  async keywordsForSite(
    target: string,
    options: SearchVolumeOptions = {}
  ): Promise<ApiResponse<any>> {
    return this.request("/keywords_data/google_ads/keywords_for_site/live", [{
      target,
      location_code: options.location_code ?? 2840,
      language_code: options.language_code ?? "en",
      ...options,
    }]);
  }

  // ==========================================================================
  // DataForSEO Labs API - Keyword Research
  // ==========================================================================

  /**
   * Get keyword suggestions based on seed keyword
   * Endpoint: /v3/dataforseo_labs/google/keyword_suggestions/live
   */
  async keywordSuggestions(
    keyword: string,
    options: KeywordSuggestionsOptions = {}
  ): Promise<KeywordSuggestionItem[]> {
    const response = await this.request("/dataforseo_labs/google/keyword_suggestions/live", [{
      keyword,
      location_code: options.location_code ?? 2840,
      language_code: options.language_code ?? "en",
      limit: options.limit ?? 100,
      ...options,
    }]);
    return this.extractItems(response);
  }

  /**
   * Get related keywords (semantically similar)
   * Endpoint: /v3/dataforseo_labs/google/related_keywords/live
   */
  async relatedKeywords(
    keyword: string,
    options: LabsOptions = {}
  ): Promise<any[]> {
    const response = await this.request("/dataforseo_labs/google/related_keywords/live", [{
      keyword,
      location_code: options.location_code ?? 2840,
      language_code: options.language_code ?? "en",
      limit: options.limit ?? 100,
      ...options,
    }]);
    return this.extractItems(response);
  }

  /**
   * Get keyword ideas (broader discovery)
   * Endpoint: /v3/dataforseo_labs/google/keyword_ideas/live
   */
  async keywordIdeas(
    keyword: string,
    options: LabsOptions = {}
  ): Promise<KeywordSuggestionItem[]> {
    const response = await this.request("/dataforseo_labs/google/keyword_ideas/live", [{
      keyword,
      location_code: options.location_code ?? 2840,
      language_code: options.language_code ?? "en",
      limit: options.limit ?? 100,
      ...options,
    }]);
    return this.extractItems(response);
  }

  /**
   * Bulk keyword difficulty check
   * Endpoint: /v3/dataforseo_labs/google/bulk_keyword_difficulty/live
   * Max: 1000 keywords per request
   */
  async bulkKeywordDifficulty(
    keywords: string[],
    options: LocationOptions = {}
  ): Promise<any[]> {
    const response = await this.request("/dataforseo_labs/google/bulk_keyword_difficulty/live", [{
      keywords,
      location_code: options.location_code ?? 2840,
      language_code: options.language_code ?? "en",
    }]);
    return this.extractItems(response);
  }

  /**
   * Classify search intent for keywords
   * Endpoint: /v3/dataforseo_labs/google/search_intent/live
   * Max: 1000 keywords per request
   */
  async searchIntent(
    keywords: string[],
    options: LocationOptions = {}
  ): Promise<any[]> {
    const response = await this.request("/dataforseo_labs/google/search_intent/live", [{
      keywords,
      location_code: options.location_code ?? 2840,
      language_code: options.language_code ?? "en",
    }]);
    return this.extractItems(response);
  }

  /**
   * Get keyword overview (comprehensive metrics for a single keyword)
   * Endpoint: /v3/dataforseo_labs/google/keyword_overview/live
   */
  async keywordOverview(
    keyword: string,
    options: LocationOptions = {}
  ): Promise<any[]> {
    const response = await this.request("/dataforseo_labs/google/keyword_overview/live", [{
      keyword,
      location_code: options.location_code ?? 2840,
      language_code: options.language_code ?? "en",
    }]);
    return this.extractResults(response);
  }

  // ==========================================================================
  // DataForSEO Labs API - Competitor Analysis
  // ==========================================================================

  /**
   * Get keywords a domain ranks for
   * Endpoint: /v3/dataforseo_labs/google/ranked_keywords/live
   */
  async rankedKeywords(
    target: string,
    options: RankedKeywordsOptions = {}
  ): Promise<any> {
    const response = await this.request("/dataforseo_labs/google/ranked_keywords/live", [{
      target,
      location_code: options.location_code ?? 2840,
      language_code: options.language_code ?? "en",
      limit: options.limit ?? 100,
      ...options,
    }]);
    return response.tasks?.[0]?.result?.[0] ?? null;
  }

  /**
   * Find SERP competitors for given keywords
   * Endpoint: /v3/dataforseo_labs/google/serp_competitors/live
   */
  async serpCompetitors(
    keywords: string[],
    options: SerpCompetitorsOptions = {}
  ): Promise<SerpCompetitorItem[]> {
    const response = await this.request("/dataforseo_labs/google/serp_competitors/live", [{
      keywords,
      location_code: options.location_code ?? 2840,
      language_code: options.language_code ?? "en",
      limit: options.limit ?? 20,
      ...options,
    }]);
    return this.extractItems(response);
  }

  /**
   * Find keyword intersection between domains
   * Endpoint: /v3/dataforseo_labs/google/domain_intersection/live
   */
  async domainIntersection(
    target1: string,
    target2: string,
    options: DomainIntersectionOptions = {}
  ): Promise<any[]> {
    const response = await this.request("/dataforseo_labs/google/domain_intersection/live", [{
      target1,
      target2,
      location_code: options.location_code ?? 2840,
      language_code: options.language_code ?? "en",
      limit: options.limit ?? 100,
      ...options,
    }]);
    return this.extractItems(response);
  }

  /**
   * Get competitors for a domain
   * Endpoint: /v3/dataforseo_labs/google/competitors_domain/live
   */
  async competitorsDomain(
    target: string,
    options: LabsOptions = {}
  ): Promise<any[]> {
    const response = await this.request("/dataforseo_labs/google/competitors_domain/live", [{
      target,
      location_code: options.location_code ?? 2840,
      language_code: options.language_code ?? "en",
      limit: options.limit ?? 20,
      ...options,
    }]);
    return this.extractItems(response);
  }

  /**
   * Domain rank overview
   * Endpoint: /v3/dataforseo_labs/google/domain_rank_overview/live
   */
  async domainRankOverview(
    target: string,
    options: LocationOptions = {}
  ): Promise<any> {
    const response = await this.request("/dataforseo_labs/google/domain_rank_overview/live", [{
      target,
      location_code: options.location_code ?? 2840,
      language_code: options.language_code ?? "en",
    }]);
    return response.tasks?.[0]?.result?.[0] ?? null;
  }

  // ==========================================================================
  // SERP API
  // ==========================================================================

  /**
   * Get live SERP results for a keyword
   * Endpoint: /v3/serp/google/organic/live/advanced
   */
  async serpLive(
    keyword: string,
    options: LocationOptions & { depth?: number } = {}
  ): Promise<any> {
    const response = await this.request("/serp/google/organic/live/advanced", [{
      keyword,
      location_code: options.location_code ?? 2840,
      language_code: options.language_code ?? "en",
      depth: options.depth ?? 100,
    }]);
    return response.tasks?.[0]?.result?.[0] ?? null;
  }

  // ==========================================================================
  // OnPage API
  // ==========================================================================

  /**
   * Run instant on-page analysis for a URL
   * Endpoint: /v3/on_page/instant_pages
   */
  async instantPageAudit(
    url: string,
    options: { enable_javascript?: boolean } = {}
  ): Promise<any> {
    const response = await this.request("/on_page/instant_pages", [{
      url,
      enable_javascript: options.enable_javascript ?? true,
    }]);
    return response.tasks?.[0]?.result?.[0] ?? null;
  }

  // ==========================================================================
  // Content Analysis API
  // ==========================================================================

  /**
   * Search for content across the web
   * Endpoint: /v3/content_analysis/search/live
   */
  async contentSearch(
    keyword: string,
    options: { page_type?: string[]; limit?: number } = {}
  ): Promise<any[]> {
    const response = await this.request("/content_analysis/search/live", [{
      keyword,
      page_type: options.page_type,
      limit: options.limit ?? 10,
    }]);
    return this.extractItems(response);
  }

  // ==========================================================================
  // Backlinks API
  // ==========================================================================

  /**
   * Get backlinks summary for a domain
   * Endpoint: /v3/backlinks/summary/live
   */
  async backlinksSummary(target: string): Promise<any> {
    const response = await this.request("/backlinks/summary/live", [{ target }]);
    return response.tasks?.[0]?.result?.[0] ?? null;
  }

  // ==========================================================================
  // AI Optimization API (GEO)
  // ==========================================================================

  /**
   * Check AI overview / LLM mentions
   * Endpoint: /v3/serp/google/organic/live/advanced (with AI overview items)
   */
  async aiOverviewCheck(
    keyword: string,
    options: LocationOptions = {}
  ): Promise<any> {
    const response = await this.request("/serp/google/organic/live/advanced", [{
      keyword,
      location_code: options.location_code ?? 2840,
      language_code: options.language_code ?? "en",
      depth: 10,
    }]);
    const result = response.tasks?.[0]?.result?.[0];
    if (!result) return null;

    // Filter for AI overview items
    const aiItems = result.items?.filter((item: any) =>
      item.type === "ai_overview" || item.type === "ai_overview_reference"
    ) ?? [];

    return { ...result, ai_items: aiItems };
  }
}

export default DataForSEOClient;
