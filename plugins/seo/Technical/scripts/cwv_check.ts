#!/usr/bin/env bun
/**
 * Core Web Vitals Check CLI - DataForSEO OnPage API
 *
 * Usage:
 *   bun cwv_check.ts <command> <url> [options]
 *
 * Commands:
 *   check <url>              CWV metrics for a single URL
 *   batch <url1> <url2> ...  CWV for multiple URLs
 */

import { join } from "path";

const clientPath = join(__dirname, "..", "..", "dataforseo_client.ts");
const { DataForSEOClient } = await import(clientPath);

// ============================================================================
// Types
// ============================================================================

interface CliOptions {
  format: "table" | "json";
}

interface CwvResult {
  url: string;
  status_code: number;
  time_to_interactive: number;
  dom_size: number;
  total_dom_size: number;
  total_page_size: number;
  total_transfer_size: number;
  resources_count: number;
  scripts_count: number;
  css_count: number;
  images_count: number;
  fonts_count: number;
  media_count: number;
  total_scripts_size: number;
  total_css_size: number;
  total_images_size: number;
  is_https: boolean;
  is_http2: boolean;
  has_render_blocking: boolean;
}

// ============================================================================
// Commands
// ============================================================================

function formatBytes(bytes: number): string {
  if (!bytes) return "-";
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function formatMs(ms: number): string {
  if (!ms) return "-";
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

async function cmdCheck(url: string, options: CliOptions) {
  const client = new DataForSEOClient();

  console.log(`Analyzing ${url}...`);
  const result = await client.instantPageAudit(url);

  if (!result) {
    console.log("No data returned for this URL.");
    return;
  }

  if (options.format === "json") {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const items = result.items ?? [];
  if (items.length === 0) {
    console.log("No page data returned.");
    return;
  }

  const page = items[0];
  const meta = page.meta ?? {};
  const checks = page.checks ?? {};
  const resources = page.page_timing ?? {};

  console.log(`\nCore Web Vitals & Technical Analysis: ${url}\n`);

  // Page meta
  console.log("Page Meta:");
  console.log(`  Status:     ${page.status_code || "-"}`);
  console.log(`  Title:      ${meta.title || "-"}`);
  console.log(`  H1:         ${meta.htags?.h1?.[0] || "-"}`);
  console.log(`  Canonical:  ${page.canonical || "-"}`);
  console.log(`  HTTPS:      ${page.is_https ? "Yes" : "No"}`);
  console.log(`  HTTP/2:     ${page.is_http2 ? "Yes" : "No"}`);

  // Page size
  console.log("\nPage Size:");
  console.log(`  Total size:       ${formatBytes(page.total_transfer_size)}`);
  console.log(`  HTML size:        ${formatBytes(page.total_dom_size)}`);
  console.log(`  DOM elements:     ${page.dom_size || "-"}`);
  console.log(`  Resources:        ${page.total_count || "-"}`);

  // Resource breakdown
  if (page.resource_errors?.length > 0) {
    console.log(`\nResource Errors: ${page.resource_errors.length}`);
    for (const err of page.resource_errors.slice(0, 5)) {
      console.log(`  - ${err.status_code} ${err.url?.substring(0, 80)}`);
    }
  }

  // Timing
  if (resources) {
    console.log("\nPage Timing:");
    console.log(`  Time to Interactive: ${formatMs(resources.time_to_interactive)}`);
    console.log(`  DOM Complete:        ${formatMs(resources.dom_complete)}`);
    console.log(`  Connection Time:     ${formatMs(resources.connection_time)}`);
    console.log(`  Waiting Time:        ${formatMs(resources.waiting_time)}`);
    console.log(`  Download Time:       ${formatMs(resources.download_time)}`);
  }

  // SEO checks
  if (checks) {
    const issues: string[] = [];
    if (checks.no_title) issues.push("Missing title tag");
    if (checks.no_description) issues.push("Missing meta description");
    if (checks.no_h1_tag) issues.push("Missing H1 tag");
    if (checks.has_meta_refresh_redirect) issues.push("Meta refresh redirect detected");
    if (checks.is_4xx_code) issues.push(`4xx status code: ${page.status_code}`);
    if (checks.is_5xx_code) issues.push(`5xx status code: ${page.status_code}`);
    if (checks.canonical_to_broken) issues.push("Canonical points to broken URL");
    if (checks.has_render_blocking_resources) issues.push("Render-blocking resources detected");
    if (checks.low_content_rate) issues.push("Low content-to-code ratio");
    if (checks.high_loading_time) issues.push("High loading time");
    if (checks.is_broken) issues.push("Page is broken");
    if (checks.no_image_alt) issues.push("Images missing alt attributes");
    if (checks.no_image_title) issues.push("Images missing title attributes");

    if (issues.length > 0) {
      console.log("\nIssues Found:");
      for (const issue of issues) {
        console.log(`  - ${issue}`);
      }
    } else {
      console.log("\nNo critical issues detected.");
    }
  }
}

async function cmdBatch(urls: string[], options: CliOptions) {
  const client = new DataForSEOClient();
  const results: any[] = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    process.stderr.write(`[${i + 1}/${urls.length}] Checking ${url}...\r`);

    try {
      const result = await client.instantPageAudit(url);
      const page = result?.items?.[0];
      results.push({
        url,
        status: page?.status_code ?? 0,
        dom_size: page?.dom_size ?? 0,
        total_size: page?.total_transfer_size ?? 0,
        resources: page?.total_count ?? 0,
        tti: page?.page_timing?.time_to_interactive ?? 0,
        https: page?.is_https ?? false,
        h2: page?.is_http2 ?? false,
        issues: Object.entries(page?.checks ?? {}).filter(([_, v]) => v === true).length,
      });
    } catch (error) {
      results.push({ url, status: 0, dom_size: 0, total_size: 0, resources: 0, tti: 0, https: false, h2: false, issues: -1 });
    }
  }

  process.stderr.write("\n");

  if (options.format === "json") {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  console.log(`\nCore Web Vitals Batch Report\n`);

  const header = "URL                                        | Status | DOM   | Size     | TTI     | Issues";
  console.log(header);
  console.log("-".repeat(header.length));

  for (const r of results) {
    const url = r.url.replace(/^https?:\/\//, "").substring(0, 42).padEnd(42);
    const status = String(r.status).padEnd(6);
    const dom = String(r.dom_size).padEnd(5);
    const size = formatBytes(r.total_size).padEnd(8);
    const tti = formatMs(r.tti).padEnd(7);
    const issues = r.issues >= 0 ? String(r.issues) : "ERR";
    console.log(`${url} | ${status} | ${dom} | ${size} | ${tti} | ${issues}`);
  }

  console.log(`\n${results.length} pages checked`);
}

// ============================================================================
// CLI
// ============================================================================

function parseArgs(argv: string[]): { command: string; args: string[]; options: CliOptions } {
  const command = argv[0] ?? "help";
  const args: string[] = [];
  const options: CliOptions = { format: "table" };

  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--format=")) {
      options.format = arg.split("=")[1] as any;
    } else if (!arg.startsWith("--")) {
      args.push(arg);
    }
  }

  return { command, args, options };
}

function printHelp() {
  console.log(`
Core Web Vitals Check CLI - DataForSEO OnPage API

USAGE:
  bun cwv_check.ts <command> <url> [options]

COMMANDS:
  check <url>              Detailed CWV + technical analysis for a URL
  batch <url1> <url2> ...  Quick CWV summary for multiple URLs

OPTIONS:
  --format=table|json      Output format (default: table)

EXAMPLES:
  bun cwv_check.ts check https://example.com
  bun cwv_check.ts batch https://example.com https://example.com/blog
  bun cwv_check.ts check https://example.com --format=json
`);
}

async function main() {
  const argv = process.argv.slice(2);

  if (argv.length === 0 || argv[0] === "help" || argv[0] === "--help") {
    printHelp();
    process.exit(0);
  }

  const { command, args, options } = parseArgs(argv);

  try {
    switch (command) {
      case "check":
        if (!args[0]) throw new Error("Provide a URL");
        await cmdCheck(args[0], options);
        break;
      case "batch":
        if (args.length === 0) throw new Error("Provide at least one URL");
        await cmdBatch(args, options);
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
