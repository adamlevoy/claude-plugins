#!/usr/bin/env bun
/**
 * Keyword Research CLI - DataForSEO powered keyword research
 *
 * Usage:
 *   bun keyword_research.ts <command> [args] [options]
 *
 * Commands:
 *   volume <keywords...>          Search volume + CPC + competition
 *   suggest <keyword>             Keyword suggestions from seed
 *   related <keyword>             Semantically related keywords
 *   ideas <keyword>               Broader keyword discovery
 *   difficulty <keywords...>      Bulk keyword difficulty scores
 *   intent <keywords...>          Classify search intent
 *   ranked <domain>               Keywords a domain ranks for
 *   competitors <keywords...>     SERP competitors for keywords
 *   gap <domain1> <domain2>       Keyword gap between domains
 *   domain-competitors <domain>   Competing domains
 *   overview <keyword>            Full keyword metrics
 *   domain-overview <domain>      Domain rank overview
 *   serp <keyword>                Live SERP results
 */

import { join } from "path";

// Import shared client (two levels up: scripts/ -> Keywords/ -> SEO/)
const clientPath = join(__dirname, "..", "..", "dataforseo_client.ts");
const { DataForSEOClient } = await import(clientPath);

// ============================================================================
// Types
// ============================================================================

interface CliOptions {
  location: number;
  lang: string;
  format: "table" | "json" | "csv";
  limit: number;
  depth: number;
  includeSerpInfo: boolean;
  itemTypes: string[];
}

interface Column {
  key: string;
  label: string;
  width?: number;
  format?: (v: any) => string;
}

// ============================================================================
// Output Formatters
// ============================================================================

function formatNumber(v: any): string {
  if (v == null) return "-";
  return Number(v).toLocaleString();
}

function formatCurrency(v: any): string {
  if (v == null) return "-";
  return `$${Number(v).toFixed(2)}`;
}

function formatPercent(v: any): string {
  if (v == null) return "-";
  return `${(Number(v) * 100).toFixed(1)}%`;
}

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((curr, key) => curr?.[key], obj);
}

function printTable(rows: any[], columns: Column[], title?: string) {
  if (rows.length === 0) {
    console.log("No results found.");
    return;
  }

  if (title) console.log(`\n${title}\n`);

  // Calculate column widths
  const widths = columns.map((col) => col.label.length);

  const formatted = rows.map((row) =>
    columns.map((col, i) => {
      const raw = getNestedValue(row, col.key);
      const str = col.format ? col.format(raw) : String(raw ?? "-");
      widths[i] = Math.max(widths[i], str.length);
      return str;
    })
  );

  // Header
  const header = columns.map((col, i) => col.label.padEnd(widths[i])).join(" | ");
  console.log(header);
  console.log("-".repeat(header.length));

  // Rows
  for (const row of formatted) {
    console.log(row.map((cell, i) => cell.padEnd(widths[i])).join(" | "));
  }

  console.log(`\n${rows.length} results`);
}

function printJson(data: any) {
  console.log(JSON.stringify(data, null, 2));
}

function printCsv(rows: any[], columns: Column[]) {
  console.log(columns.map((c) => c.label).join(","));
  for (const row of rows) {
    const values = columns.map((col) => {
      const raw = getNestedValue(row, col.key);
      const str = col.format ? col.format(raw) : String(raw ?? "");
      return str.includes(",") ? `"${str}"` : str;
    });
    console.log(values.join(","));
  }
}

function output(rows: any[], columns: Column[], options: CliOptions, title?: string) {
  if (options.format === "json") return printJson(rows);
  if (options.format === "csv") return printCsv(rows, columns);
  printTable(rows, columns, title);
}

// ============================================================================
// Commands
// ============================================================================

async function cmdVolume(client: any, keywords: string[], options: CliOptions) {
  const response = await client.searchVolume(keywords, {
    location_code: options.location,
    language_code: options.lang,
  });

  const results = response.tasks?.[0]?.result ?? [];

  const columns: Column[] = [
    { key: "keyword", label: "Keyword" },
    { key: "search_volume", label: "Volume", format: formatNumber },
    { key: "competition", label: "Competition" },
    { key: "competition_index", label: "Comp Idx", format: formatNumber },
    { key: "cpc", label: "CPC", format: formatCurrency },
    { key: "low_top_of_page_bid", label: "Low Bid", format: formatCurrency },
    { key: "high_top_of_page_bid", label: "High Bid", format: formatCurrency },
  ];

  output(results, columns, options, "Search Volume Report");
}

async function cmdSuggest(client: any, keyword: string, options: CliOptions) {
  const items = await client.keywordSuggestions(keyword, {
    location_code: options.location,
    language_code: options.lang,
    limit: options.limit,
    include_serp_info: options.includeSerpInfo,
  });

  const columns: Column[] = [
    { key: "keyword", label: "Keyword" },
    { key: "keyword_info.search_volume", label: "Volume", format: formatNumber },
    { key: "keyword_properties.keyword_difficulty", label: "KD", format: formatNumber },
    { key: "keyword_info.cpc", label: "CPC", format: formatCurrency },
    { key: "keyword_info.competition_level", label: "Competition" },
    { key: "search_intent_info.main_intent", label: "Intent" },
  ];

  output(items, columns, options, `Keyword Suggestions for "${keyword}"`);
}

async function cmdRelated(client: any, keyword: string, options: CliOptions) {
  const items = await client.relatedKeywords(keyword, {
    location_code: options.location,
    language_code: options.lang,
    limit: options.limit,
  });

  const columns: Column[] = [
    { key: "keyword_data.keyword", label: "Keyword" },
    { key: "keyword_data.keyword_info.search_volume", label: "Volume", format: formatNumber },
    { key: "keyword_data.keyword_info.cpc", label: "CPC", format: formatCurrency },
    { key: "keyword_data.keyword_info.competition_level", label: "Competition" },
  ];

  output(items, columns, options, `Related Keywords for "${keyword}"`);
}

async function cmdIdeas(client: any, keyword: string, options: CliOptions) {
  const items = await client.keywordIdeas(keyword, {
    location_code: options.location,
    language_code: options.lang,
    limit: options.limit,
  });

  const columns: Column[] = [
    { key: "keyword", label: "Keyword" },
    { key: "keyword_info.search_volume", label: "Volume", format: formatNumber },
    { key: "keyword_properties.keyword_difficulty", label: "KD", format: formatNumber },
    { key: "keyword_info.cpc", label: "CPC", format: formatCurrency },
    { key: "keyword_info.competition_level", label: "Competition" },
  ];

  output(items, columns, options, `Keyword Ideas for "${keyword}"`);
}

async function cmdDifficulty(client: any, keywords: string[], options: CliOptions) {
  const items = await client.bulkKeywordDifficulty(keywords, {
    location_code: options.location,
    language_code: options.lang,
  });

  const columns: Column[] = [
    { key: "keyword", label: "Keyword" },
    { key: "keyword_difficulty", label: "Difficulty" },
    { key: "search_volume", label: "Volume", format: formatNumber },
  ];

  output(items, columns, options, "Keyword Difficulty Report");
}

async function cmdIntent(client: any, keywords: string[], options: CliOptions) {
  const items = await client.searchIntent(keywords, {
    location_code: options.location,
    language_code: options.lang,
  });

  const columns: Column[] = [
    { key: "keyword", label: "Keyword" },
    { key: "keyword_intent.label", label: "Intent" },
    { key: "keyword_intent.probability", label: "Confidence", format: formatPercent },
    { key: "secondary_keyword_intents.0.label", label: "Secondary" },
  ];

  output(items, columns, options, "Search Intent Classification");
}

async function cmdRanked(client: any, domain: string, options: CliOptions) {
  const result = await client.rankedKeywords(domain, {
    location_code: options.location,
    language_code: options.lang,
    limit: options.limit,
    item_types: options.itemTypes.length ? options.itemTypes : undefined,
  });

  if (!result) {
    console.log("No data found for this domain.");
    return;
  }

  // Print domain overview metrics first
  if (result.metrics?.organic && options.format === "table") {
    const m = result.metrics.organic;
    console.log(`\nDomain: ${domain}`);
    console.log(`Organic Keywords: ${formatNumber(m.count)}`);
    console.log(`Est. Traffic: ${formatNumber(m.etv)}`);
    console.log(`Est. Traffic Value: ${formatCurrency(m.estimated_paid_traffic_cost)}`);
    console.log(`Position 1: ${m.pos_1} | 2-3: ${m.pos_2_3} | 4-10: ${m.pos_4_10}`);
  }

  const items = result.items ?? [];

  const columns: Column[] = [
    { key: "keyword_data.keyword", label: "Keyword" },
    { key: "keyword_data.keyword_info.search_volume", label: "Volume", format: formatNumber },
    { key: "ranked_serp_element.serp_item.rank_group", label: "Rank", format: formatNumber },
    { key: "keyword_data.keyword_info.cpc", label: "CPC", format: formatCurrency },
    { key: "ranked_serp_element.serp_item.url", label: "URL" },
  ];

  output(items, columns, options, `\nRanked Keywords for ${domain}`);
}

async function cmdCompetitors(client: any, keywords: string[], options: CliOptions) {
  const items = await client.serpCompetitors(keywords, {
    location_code: options.location,
    language_code: options.lang,
    limit: options.limit,
  });

  const columns: Column[] = [
    { key: "domain", label: "Domain" },
    { key: "avg_position", label: "Avg Pos", format: (v: number) => v?.toFixed(1) ?? "-" },
    { key: "rating", label: "Rating", format: (v: number) => v?.toFixed(2) ?? "-" },
    { key: "etv", label: "Est. Traffic", format: formatNumber },
    { key: "keywords_count", label: "Keywords", format: formatNumber },
    { key: "relevant_serp_items", label: "SERP Items", format: formatNumber },
  ];

  output(items, columns, options, "SERP Competitors");
}

async function cmdGap(client: any, domain1: string, domain2: string, options: CliOptions) {
  const items = await client.domainIntersection(domain1, domain2, {
    location_code: options.location,
    language_code: options.lang,
    limit: options.limit,
  });

  const columns: Column[] = [
    { key: "keyword_data.keyword", label: "Keyword" },
    { key: "keyword_data.keyword_info.search_volume", label: "Volume", format: formatNumber },
    { key: "first_domain_serp_element.serp_item.rank_group", label: `${domain1} Rank`, format: formatNumber },
    { key: "second_domain_serp_element.serp_item.rank_group", label: `${domain2} Rank`, format: formatNumber },
  ];

  output(items, columns, options, `Keyword Gap: ${domain1} vs ${domain2}`);
}

async function cmdDomainCompetitors(client: any, domain: string, options: CliOptions) {
  const items = await client.competitorsDomain(domain, {
    location_code: options.location,
    language_code: options.lang,
    limit: options.limit,
  });

  const columns: Column[] = [
    { key: "domain", label: "Competitor" },
    { key: "avg_position", label: "Avg Pos", format: (v: number) => v?.toFixed(1) ?? "-" },
    { key: "sum_position", label: "Sum Pos", format: formatNumber },
    { key: "intersections", label: "Shared KWs", format: formatNumber },
    { key: "full_domain_metrics.organic.etv", label: "Est. Traffic", format: formatNumber },
    { key: "full_domain_metrics.organic.count", label: "Total KWs", format: formatNumber },
  ];

  output(items, columns, options, `Domain Competitors for ${domain}`);
}

async function cmdOverview(client: any, keyword: string, options: CliOptions) {
  const results = await client.keywordOverview(keyword, {
    location_code: options.location,
    language_code: options.lang,
  });

  if (options.format === "json") {
    printJson(results);
    return;
  }

  const data = results[0];
  if (!data) {
    console.log("No data found.");
    return;
  }

  console.log(`\nKeyword Overview: "${keyword}"\n`);
  console.log(`Search Volume:    ${formatNumber(data.keyword_info?.search_volume)}`);
  console.log(`CPC:              ${formatCurrency(data.keyword_info?.cpc)}`);
  console.log(`Competition:      ${data.keyword_info?.competition_level ?? "-"} (${data.keyword_info?.competition_index ?? "-"})`);
  console.log(`Difficulty:       ${data.keyword_properties?.keyword_difficulty ?? "-"}`);
  console.log(`Search Intent:    ${data.search_intent_info?.main_intent ?? "-"}`);

  if (data.keyword_info?.monthly_searches?.length) {
    console.log(`\nMonthly Trend (last 6 months):`);
    const recent = data.keyword_info.monthly_searches.slice(0, 6);
    for (const m of recent) {
      console.log(`  ${m.year}-${String(m.month).padStart(2, "0")}: ${formatNumber(m.search_volume)}`);
    }
  }
}

async function cmdDomainOverview(client: any, domain: string, options: CliOptions) {
  const result = await client.domainRankOverview(domain, {
    location_code: options.location,
    language_code: options.lang,
  });

  if (options.format === "json") {
    printJson(result);
    return;
  }

  if (!result) {
    console.log("No data found.");
    return;
  }

  console.log(`\nDomain Overview: ${domain}\n`);

  const org = result.metrics?.organic;
  if (org) {
    console.log(`Organic Keywords: ${formatNumber(org.count)}`);
    console.log(`Est. Traffic:     ${formatNumber(org.etv)}`);
    console.log(`Traffic Value:    ${formatCurrency(org.estimated_paid_traffic_cost)}`);
    console.log(`\nPosition Distribution:`);
    console.log(`  #1:    ${formatNumber(org.pos_1)}`);
    console.log(`  #2-3:  ${formatNumber(org.pos_2_3)}`);
    console.log(`  #4-10: ${formatNumber(org.pos_4_10)}`);
    console.log(`  #11-20: ${formatNumber(org.pos_11_20)}`);
    console.log(`  #21-30: ${formatNumber(org.pos_21_30)}`);
  }
}

async function cmdSerp(client: any, keyword: string, options: CliOptions) {
  const result = await client.serpLive(keyword, {
    location_code: options.location,
    language_code: options.lang,
    depth: options.depth,
  });

  if (!result) {
    console.log("No SERP data found.");
    return;
  }

  if (options.format === "json") {
    printJson(result);
    return;
  }

  console.log(`\nSERP Results for "${keyword}"`);
  console.log(`Total Results: ${formatNumber(result.se_results_count)}`);

  // Show SERP features
  const itemTypes = new Set(result.items?.map((i: any) => i.type) ?? []);
  console.log(`SERP Features: ${[...itemTypes].join(", ")}`);

  // Show organic results
  const organic = result.items?.filter((i: any) => i.type === "organic") ?? [];
  console.log(`\nOrganic Results:\n`);

  const columns: Column[] = [
    { key: "rank_group", label: "#", format: formatNumber },
    { key: "title", label: "Title" },
    { key: "domain", label: "Domain" },
    { key: "url", label: "URL" },
  ];

  printTable(organic.slice(0, options.limit), columns);

  // Highlight AI overview if present
  const aiItems = result.items?.filter((i: any) =>
    i.type === "ai_overview" || i.type === "ai_overview_reference"
  ) ?? [];
  if (aiItems.length > 0) {
    console.log(`\n** AI Overview detected (${aiItems.length} items) **`);
  }
}

// ============================================================================
// CLI Parser
// ============================================================================

function parseArgs(argv: string[]): { command: string; args: string[]; options: CliOptions } {
  const command = argv[0] ?? "help";
  const args: string[] = [];
  const options: CliOptions = {
    location: 2840,
    lang: "en",
    format: "table",
    limit: 100,
    depth: 100,
    includeSerpInfo: false,
    itemTypes: [],
  };

  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];

    if (arg.startsWith("--location=")) {
      options.location = parseInt(arg.split("=")[1], 10);
    } else if (arg.startsWith("--lang=")) {
      options.lang = arg.split("=")[1];
    } else if (arg.startsWith("--format=")) {
      options.format = arg.split("=")[1] as any;
    } else if (arg.startsWith("--limit=")) {
      options.limit = parseInt(arg.split("=")[1], 10);
    } else if (arg.startsWith("--depth=")) {
      options.depth = parseInt(arg.split("=")[1], 10);
    } else if (arg === "--include-serp") {
      options.includeSerpInfo = true;
    } else if (arg.startsWith("--item-types=")) {
      options.itemTypes = arg.split("=")[1].split(",");
    } else if (!arg.startsWith("--")) {
      args.push(arg);
    }
  }

  return { command, args, options };
}

function printHelp() {
  console.log(`
Keyword Research CLI - DataForSEO Powered

USAGE:
  bun keyword_research.ts <command> [args] [options]

COMMANDS:
  volume <kw1> [kw2...]         Search volume, CPC, competition
  suggest <keyword>             Keyword suggestions from seed
  related <keyword>             Semantically related keywords
  ideas <keyword>               Broader keyword discovery
  difficulty <kw1> [kw2...]     Bulk keyword difficulty scores
  intent <kw1> [kw2...]         Classify search intent
  ranked <domain>               Keywords a domain ranks for
  competitors <kw1> [kw2...]    SERP competitors for keywords
  gap <domain1> <domain2>       Keyword gap between domains
  domain-competitors <domain>   Competing domains
  overview <keyword>            Full keyword metrics overview
  domain-overview <domain>      Domain rank overview
  serp <keyword>                Live SERP results

OPTIONS:
  --location=<code>     Location code (default: 2840 = US)
  --lang=<code>         Language code (default: en)
  --format=<type>       Output: table, json, csv (default: table)
  --limit=<n>           Max results (default: 100)
  --depth=<n>           SERP depth (default: 100)
  --include-serp        Include SERP info in suggestions
  --item-types=<types>  Filter ranked keywords (e.g., organic,paid)

EXAMPLES:
  bun keyword_research.ts volume "content marketing" "seo tools"
  bun keyword_research.ts suggest "project management" --limit=50
  bun keyword_research.ts ranked example.com --limit=200 --format=json
  bun keyword_research.ts gap mysite.com competitor.com --limit=100
  bun keyword_research.ts serp "best crm software"
`);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const argv = process.argv.slice(2);

  if (argv.length === 0 || argv[0] === "help" || argv[0] === "--help") {
    printHelp();
    process.exit(0);
  }

  const { command, args, options } = parseArgs(argv);
  const client = new DataForSEOClient();

  try {
    switch (command) {
      case "volume":
        if (args.length === 0) throw new Error("Provide at least one keyword");
        await cmdVolume(client, args, options);
        break;
      case "suggest":
        if (!args[0]) throw new Error("Provide a seed keyword");
        await cmdSuggest(client, args[0], options);
        break;
      case "related":
        if (!args[0]) throw new Error("Provide a seed keyword");
        await cmdRelated(client, args[0], options);
        break;
      case "ideas":
        if (!args[0]) throw new Error("Provide a seed keyword");
        await cmdIdeas(client, args[0], options);
        break;
      case "difficulty":
        if (args.length === 0) throw new Error("Provide at least one keyword");
        await cmdDifficulty(client, args, options);
        break;
      case "intent":
        if (args.length === 0) throw new Error("Provide at least one keyword");
        await cmdIntent(client, args, options);
        break;
      case "ranked":
        if (!args[0]) throw new Error("Provide a domain");
        await cmdRanked(client, args[0], options);
        break;
      case "competitors":
        if (args.length === 0) throw new Error("Provide at least one keyword");
        await cmdCompetitors(client, args, options);
        break;
      case "gap":
        if (args.length < 2) throw new Error("Provide two domains");
        await cmdGap(client, args[0], args[1], options);
        break;
      case "domain-competitors":
        if (!args[0]) throw new Error("Provide a domain");
        await cmdDomainCompetitors(client, args[0], options);
        break;
      case "overview":
        if (!args[0]) throw new Error("Provide a keyword");
        await cmdOverview(client, args[0], options);
        break;
      case "domain-overview":
        if (!args[0]) throw new Error("Provide a domain");
        await cmdDomainOverview(client, args[0], options);
        break;
      case "serp":
        if (!args[0]) throw new Error("Provide a keyword");
        await cmdSerp(client, args[0], options);
        break;
      default:
        console.error(`Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

main();
