#!/usr/bin/env bun
/**
 * Crawl Audit CLI - Crawlability & indexing checks via DataForSEO OnPage API
 *
 * Usage:
 *   bun crawl_audit.ts <command> <url> [options]
 *
 * Commands:
 *   page <url>               Single page technical audit
 *   batch <url1> <url2> ...  Audit multiple pages
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

interface CrawlIssue {
  severity: "error" | "warning" | "info";
  category: string;
  detail: string;
}

// ============================================================================
// Analysis
// ============================================================================

function analyzePage(page: any): CrawlIssue[] {
  const issues: CrawlIssue[] = [];
  const meta = page.meta ?? {};
  const checks = page.checks ?? {};

  // Status code
  if (page.status_code >= 500) {
    issues.push({ severity: "error", category: "Status Code", detail: `Server error: ${page.status_code}` });
  } else if (page.status_code >= 400) {
    issues.push({ severity: "error", category: "Status Code", detail: `Client error: ${page.status_code}` });
  } else if (page.status_code >= 300) {
    issues.push({ severity: "warning", category: "Redirect", detail: `Redirect: ${page.status_code}` });
  }

  // Title
  if (!meta.title) {
    issues.push({ severity: "error", category: "Title", detail: "Missing title tag" });
  } else if (meta.title.length > 60) {
    issues.push({ severity: "warning", category: "Title", detail: `Title too long: ${meta.title.length} chars (max 60)` });
  } else if (meta.title.length < 30) {
    issues.push({ severity: "info", category: "Title", detail: `Title short: ${meta.title.length} chars (aim for 50-60)` });
  }

  // Meta description
  if (!meta.description) {
    issues.push({ severity: "error", category: "Meta Description", detail: "Missing meta description" });
  } else if (meta.description.length > 160) {
    issues.push({ severity: "warning", category: "Meta Description", detail: `Description too long: ${meta.description.length} chars (max 155)` });
  } else if (meta.description.length < 70) {
    issues.push({ severity: "info", category: "Meta Description", detail: `Description short: ${meta.description.length} chars (aim for 120-155)` });
  }

  // H1
  const h1s = meta.htags?.h1 ?? [];
  if (h1s.length === 0) {
    issues.push({ severity: "error", category: "H1", detail: "Missing H1 tag" });
  } else if (h1s.length > 1) {
    issues.push({ severity: "warning", category: "H1", detail: `Multiple H1 tags: ${h1s.length} (should be 1)` });
  }

  // Canonical
  if (!page.canonical) {
    issues.push({ severity: "warning", category: "Canonical", detail: "No canonical tag found" });
  } else if (page.canonical !== page.url) {
    issues.push({ severity: "info", category: "Canonical", detail: `Canonical differs from URL: ${page.canonical}` });
  }
  if (checks.canonical_to_broken) {
    issues.push({ severity: "error", category: "Canonical", detail: "Canonical points to broken URL" });
  }

  // Robots
  if (page.meta_robots) {
    const robots = String(page.meta_robots).toLowerCase();
    if (robots.includes("noindex")) {
      issues.push({ severity: "warning", category: "Robots", detail: `Meta robots: noindex set` });
    }
    if (robots.includes("nofollow")) {
      issues.push({ severity: "info", category: "Robots", detail: `Meta robots: nofollow set` });
    }
  }

  // HTTPS
  if (!page.is_https) {
    issues.push({ severity: "error", category: "Security", detail: "Not served over HTTPS" });
  }

  // HTTP/2
  if (!page.is_http2) {
    issues.push({ severity: "info", category: "Protocol", detail: "Not using HTTP/2" });
  }

  // Performance signals
  if (checks.high_loading_time) {
    issues.push({ severity: "warning", category: "Performance", detail: "High loading time detected" });
  }
  if (checks.has_render_blocking_resources) {
    issues.push({ severity: "warning", category: "Performance", detail: "Render-blocking resources detected" });
  }
  if (checks.low_content_rate) {
    issues.push({ severity: "warning", category: "Content", detail: "Low content-to-code ratio (thin content signal)" });
  }

  // Images
  if (checks.no_image_alt) {
    issues.push({ severity: "warning", category: "Images", detail: "Images missing alt attributes" });
  }

  // Redirects
  if (checks.has_meta_refresh_redirect) {
    issues.push({ severity: "warning", category: "Redirect", detail: "Meta refresh redirect (use 301 instead)" });
  }

  return issues;
}

// ============================================================================
// Output
// ============================================================================

function printPageAudit(page: any, issues: CrawlIssue[], options: CliOptions) {
  if (options.format === "json") {
    console.log(JSON.stringify({ page_data: page, issues }, null, 2));
    return;
  }

  const meta = page.meta ?? {};

  console.log(`\nCrawl Audit: ${page.url}\n`);

  // Page info
  console.log("Page Info:");
  console.log(`  Status:        ${page.status_code}`);
  console.log(`  Title:         ${(meta.title || "-").substring(0, 70)}`);
  console.log(`  Description:   ${(meta.description || "-").substring(0, 70)}`);
  console.log(`  H1:            ${meta.htags?.h1?.[0] || "-"}`);
  console.log(`  Canonical:     ${page.canonical || "-"}`);
  console.log(`  Meta Robots:   ${page.meta_robots || "none"}`);
  console.log(`  HTTPS:         ${page.is_https ? "Yes" : "No"}`);
  console.log(`  HTTP/2:        ${page.is_http2 ? "Yes" : "No"}`);
  console.log(`  Content Type:  ${page.content_type || "-"}`);

  // Heading structure
  const htags = meta.htags ?? {};
  const h2Count = htags.h2?.length ?? 0;
  const h3Count = htags.h3?.length ?? 0;
  console.log(`\nHeading Structure: H1:${meta.htags?.h1?.length ?? 0} H2:${h2Count} H3:${h3Count}`);

  if (h2Count > 0 && h2Count <= 10) {
    for (const h2 of htags.h2.slice(0, 10)) {
      console.log(`  - H2: ${h2.substring(0, 60)}`);
    }
  }

  // Issues
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const info = issues.filter((i) => i.severity === "info");

  console.log(`\nIssues: ${errors.length} errors, ${warnings.length} warnings, ${info.length} info`);

  if (errors.length > 0) {
    console.log("\n  Errors:");
    for (const i of errors) console.log(`    [${i.category}] ${i.detail}`);
  }
  if (warnings.length > 0) {
    console.log("\n  Warnings:");
    for (const i of warnings) console.log(`    [${i.category}] ${i.detail}`);
  }
  if (info.length > 0) {
    console.log("\n  Info:");
    for (const i of info) console.log(`    [${i.category}] ${i.detail}`);
  }

  if (issues.length === 0) {
    console.log("  No issues found.");
  }
}

function printBatchAudit(results: Array<{ url: string; status: number; errors: number; warnings: number; title: string }>, options: CliOptions) {
  if (options.format === "json") {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  console.log(`\nCrawl Audit Batch Report\n`);

  const header = "URL                                        | Status | Errors | Warnings | Title";
  console.log(header);
  console.log("-".repeat(header.length));

  for (const r of results) {
    const url = r.url.replace(/^https?:\/\//, "").substring(0, 42).padEnd(42);
    const status = String(r.status).padEnd(6);
    const errors = String(r.errors).padEnd(6);
    const warnings = String(r.warnings).padEnd(8);
    const title = (r.title || "-").substring(0, 30);
    console.log(`${url} | ${status} | ${errors} | ${warnings} | ${title}`);
  }

  const totalErrors = results.reduce((s, r) => s + r.errors, 0);
  const totalWarnings = results.reduce((s, r) => s + r.warnings, 0);
  console.log(`\n${results.length} pages | ${totalErrors} total errors | ${totalWarnings} total warnings`);
}

// ============================================================================
// Commands
// ============================================================================

async function cmdPage(url: string, options: CliOptions) {
  const client = new DataForSEOClient();

  console.log(`Auditing ${url}...`);
  const result = await client.instantPageAudit(url);

  if (!result?.items?.[0]) {
    console.log("No data returned for this URL.");
    return;
  }

  const page = result.items[0];
  const issues = analyzePage(page);
  printPageAudit(page, issues, options);
}

async function cmdBatch(urls: string[], options: CliOptions) {
  const client = new DataForSEOClient();
  const results: Array<{ url: string; status: number; errors: number; warnings: number; title: string }> = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    process.stderr.write(`[${i + 1}/${urls.length}] Auditing ${url}...\r`);

    try {
      const result = await client.instantPageAudit(url);
      const page = result?.items?.[0];

      if (page) {
        const issues = analyzePage(page);
        results.push({
          url,
          status: page.status_code ?? 0,
          errors: issues.filter((i) => i.severity === "error").length,
          warnings: issues.filter((i) => i.severity === "warning").length,
          title: page.meta?.title ?? "",
        });
      } else {
        results.push({ url, status: 0, errors: 1, warnings: 0, title: "No data" });
      }
    } catch (error) {
      results.push({ url, status: 0, errors: 1, warnings: 0, title: "Fetch error" });
    }
  }

  process.stderr.write("\n");
  printBatchAudit(results, options);
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
Crawl Audit CLI - Crawlability & Indexing Analysis (DataForSEO OnPage API)

USAGE:
  bun crawl_audit.ts <command> <url> [options]

COMMANDS:
  page <url>               Full technical audit for a single page
  batch <url1> <url2> ...  Quick audit summary for multiple pages

OPTIONS:
  --format=table|json      Output format (default: table)

CHECKS:
  Status codes, title tag, meta description, H1, canonical,
  meta robots, HTTPS, HTTP/2, content ratio, render-blocking,
  image alt text, heading structure, redirect issues

EXAMPLES:
  bun crawl_audit.ts page https://example.com
  bun crawl_audit.ts page https://example.com/blog/post --format=json
  bun crawl_audit.ts batch https://example.com https://example.com/about
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
      case "page":
        if (!args[0]) throw new Error("Provide a URL");
        await cmdPage(args[0], options);
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
