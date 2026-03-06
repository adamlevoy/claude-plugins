#!/usr/bin/env bun
/**
 * Lighthouse Audit CLI - PageSpeed Insights API (free, no auth required)
 *
 * Usage:
 *   bun lighthouse_audit.ts <command> <url> [options]
 *
 * Commands:
 *   audit <url>                Full Lighthouse audit
 *   performance <url>          Performance-only with CWV details
 *   batch <url1> <url2> ...    Audit multiple URLs
 */

const PSI_API = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

// Load API key from ~/.google-credentials (optional — falls back to anonymous)
// File format: PSI_API_KEY=your_key_here
function loadApiKey(): string | null {
  try {
    const home = process.env.HOME || process.env.USERPROFILE || "";
    const content = require("fs").readFileSync(`${home}/.google-credentials`, "utf8");
    const match = content.match(/^PSI_API_KEY=(.+)$/m);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

const PSI_API_KEY = process.env.PSI_API_KEY || loadApiKey();

// ============================================================================
// Types
// ============================================================================

interface CliOptions {
  strategy: "mobile" | "desktop";
  format: "table" | "json" | "csv";
  category: string;
}

interface AuditResult {
  url: string;
  strategy: string;
  scores: {
    performance: number;
    accessibility: number;
    seo: number;
    best_practices: number;
  };
  cwv: {
    fcp: number;
    lcp: number;
    tbt: number;
    cls: number;
    si: number;
    ttfb: number;
  };
  opportunities: Array<{
    id: string;
    title: string;
    savings_ms?: number;
    savings_bytes?: number;
  }>;
  diagnostics: Array<{
    id: string;
    title: string;
    description: string;
  }>;
}

// ============================================================================
// API
// ============================================================================

async function runPageSpeedInsights(url: string, strategy: string, category?: string): Promise<any> {
  const params = new URLSearchParams({
    url,
    strategy,
    ...(PSI_API_KEY ? { key: PSI_API_KEY } : {}),
  });

  // Add categories
  if (category && category !== "all") {
    params.append("category", category.toUpperCase().replace("-", "_"));
  } else {
    params.append("category", "PERFORMANCE");
    params.append("category", "ACCESSIBILITY");
    params.append("category", "SEO");
    params.append("category", "BEST_PRACTICES");
  }

  const apiUrl = `${PSI_API}?${params.toString()}`;
  const response = await fetch(apiUrl);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PageSpeed Insights API error (${response.status}): ${error}`);
  }

  return response.json();
}

function parseResult(data: any, url: string, strategy: string): AuditResult {
  const lh = data.lighthouseResult;
  const categories = lh?.categories || {};
  const audits = lh?.audits || {};

  // Scores (0-100)
  const scores = {
    performance: Math.round((categories.performance?.score ?? 0) * 100),
    accessibility: Math.round((categories.accessibility?.score ?? 0) * 100),
    seo: Math.round((categories.seo?.score ?? 0) * 100),
    best_practices: Math.round((categories["best-practices"]?.score ?? 0) * 100),
  };

  // Core Web Vitals
  const cwv = {
    fcp: audits["first-contentful-paint"]?.numericValue ?? 0,
    lcp: audits["largest-contentful-paint"]?.numericValue ?? 0,
    tbt: audits["total-blocking-time"]?.numericValue ?? 0,
    cls: audits["cumulative-layout-shift"]?.numericValue ?? 0,
    si: audits["speed-index"]?.numericValue ?? 0,
    ttfb: audits["server-response-time"]?.numericValue ?? 0,
  };

  // Opportunities (potential savings)
  const opportunities: AuditResult["opportunities"] = [];
  for (const [id, audit] of Object.entries(audits) as any[]) {
    if (audit.details?.type === "opportunity" && audit.score !== null && audit.score < 1) {
      opportunities.push({
        id,
        title: audit.title,
        savings_ms: audit.details.overallSavingsMs,
        savings_bytes: audit.details.overallSavingsBytes,
      });
    }
  }
  opportunities.sort((a, b) => (b.savings_ms ?? 0) - (a.savings_ms ?? 0));

  // Diagnostics (failing audits)
  const diagnostics: AuditResult["diagnostics"] = [];
  for (const [id, audit] of Object.entries(audits) as any[]) {
    if (audit.score !== null && audit.score < 1 && audit.details?.type !== "opportunity") {
      if (audit.scoreDisplayMode === "binary" || audit.scoreDisplayMode === "numeric") {
        diagnostics.push({
          id,
          title: audit.title,
          description: audit.description?.split(".")[0] || "",
        });
      }
    }
  }

  return { url, strategy, scores, cwv, opportunities, diagnostics };
}

// ============================================================================
// Output
// ============================================================================

function ratingColor(score: number): string {
  if (score >= 90) return "GOOD";
  if (score >= 50) return "NEEDS WORK";
  return "POOR";
}

function cwvRating(metric: string, value: number): string {
  const thresholds: Record<string, [number, number]> = {
    fcp: [1800, 3000],
    lcp: [2500, 4000],
    tbt: [200, 600],
    cls: [0.1, 0.25],
    si: [3400, 5800],
    ttfb: [800, 1800],
  };
  const [good, poor] = thresholds[metric] || [Infinity, Infinity];
  if (value <= good) return "GOOD";
  if (value <= poor) return "NEEDS WORK";
  return "POOR";
}

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function printAudit(result: AuditResult, options: CliOptions) {
  if (options.format === "json") {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`\nLighthouse Audit: ${result.url}`);
  console.log(`Strategy: ${result.strategy}\n`);

  // Scores
  console.log("Category Scores:");
  console.log(`  Performance:    ${result.scores.performance}/100 (${ratingColor(result.scores.performance)})`);
  console.log(`  Accessibility:  ${result.scores.accessibility}/100 (${ratingColor(result.scores.accessibility)})`);
  console.log(`  SEO:            ${result.scores.seo}/100 (${ratingColor(result.scores.seo)})`);
  console.log(`  Best Practices: ${result.scores.best_practices}/100 (${ratingColor(result.scores.best_practices)})`);

  // CWV
  console.log("\nCore Web Vitals:");
  console.log(`  FCP:  ${formatMs(result.cwv.fcp).padEnd(8)} (${cwvRating("fcp", result.cwv.fcp)})`);
  console.log(`  LCP:  ${formatMs(result.cwv.lcp).padEnd(8)} (${cwvRating("lcp", result.cwv.lcp)})`);
  console.log(`  TBT:  ${formatMs(result.cwv.tbt).padEnd(8)} (${cwvRating("tbt", result.cwv.tbt)})`);
  console.log(`  CLS:  ${result.cwv.cls.toFixed(3).padEnd(8)} (${cwvRating("cls", result.cwv.cls)})`);
  console.log(`  SI:   ${formatMs(result.cwv.si).padEnd(8)} (${cwvRating("si", result.cwv.si)})`);
  console.log(`  TTFB: ${formatMs(result.cwv.ttfb).padEnd(8)} (${cwvRating("ttfb", result.cwv.ttfb)})`);

  // Opportunities
  if (result.opportunities.length > 0) {
    console.log("\nTop Opportunities:");
    for (const opp of result.opportunities.slice(0, 10)) {
      let savings = "";
      if (opp.savings_ms) savings += `~${formatMs(opp.savings_ms)}`;
      if (opp.savings_bytes) savings += savings ? ` / ${formatBytes(opp.savings_bytes)}` : `~${formatBytes(opp.savings_bytes)}`;
      console.log(`  - ${opp.title}${savings ? ` (${savings})` : ""}`);
    }
  }

  // Failing diagnostics
  const failingDiag = result.diagnostics.slice(0, 5);
  if (failingDiag.length > 0) {
    console.log("\nDiagnostics:");
    for (const d of failingDiag) {
      console.log(`  - ${d.title}`);
    }
  }
}

function printBatchSummary(results: AuditResult[], options: CliOptions) {
  if (options.format === "json") {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  if (options.format === "csv") {
    console.log("URL,Strategy,Performance,Accessibility,SEO,Best Practices,LCP,FCP,TBT,CLS");
    for (const r of results) {
      console.log([
        r.url, r.strategy,
        r.scores.performance, r.scores.accessibility, r.scores.seo, r.scores.best_practices,
        formatMs(r.cwv.lcp), formatMs(r.cwv.fcp), formatMs(r.cwv.tbt), r.cwv.cls.toFixed(3),
      ].join(","));
    }
    return;
  }

  console.log(`\nBatch Lighthouse Audit (${results[0]?.strategy || "mobile"})\n`);

  const header = "URL                                        | Perf | A11y | SEO  | BP   | LCP     | CLS";
  console.log(header);
  console.log("-".repeat(header.length));

  for (const r of results) {
    const url = r.url.replace(/^https?:\/\//, "").substring(0, 42).padEnd(42);
    const perf = String(r.scores.performance).padEnd(4);
    const a11y = String(r.scores.accessibility).padEnd(4);
    const seo = String(r.scores.seo).padEnd(4);
    const bp = String(r.scores.best_practices).padEnd(4);
    const lcp = formatMs(r.cwv.lcp).padEnd(7);
    const cls = r.cwv.cls.toFixed(3);
    console.log(`${url} | ${perf} | ${a11y} | ${seo} | ${bp} | ${lcp} | ${cls}`);
  }

  console.log(`\n${results.length} pages audited`);
}

// ============================================================================
// Commands
// ============================================================================

async function cmdAudit(url: string, options: CliOptions) {
  console.log(`Running Lighthouse (${options.strategy})...`);
  const data = await runPageSpeedInsights(url, options.strategy, options.category);
  const result = parseResult(data, url, options.strategy);
  printAudit(result, options);
}

async function cmdPerformance(url: string, options: CliOptions) {
  console.log(`Running performance audit (${options.strategy})...`);
  const data = await runPageSpeedInsights(url, options.strategy, "performance");
  const result = parseResult(data, url, options.strategy);
  printAudit(result, options);
}

async function cmdBatch(urls: string[], options: CliOptions) {
  const results: AuditResult[] = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    process.stderr.write(`[${i + 1}/${urls.length}] Auditing ${url}...\r`);

    try {
      const data = await runPageSpeedInsights(url, options.strategy, options.category);
      results.push(parseResult(data, url, options.strategy));
    } catch (error) {
      process.stderr.write(`\nError auditing ${url}: ${error}\n`);
      results.push({
        url,
        strategy: options.strategy,
        scores: { performance: 0, accessibility: 0, seo: 0, best_practices: 0 },
        cwv: { fcp: 0, lcp: 0, tbt: 0, cls: 0, si: 0, ttfb: 0 },
        opportunities: [],
        diagnostics: [{ id: "error", title: "Audit failed", description: String(error) }],
      });
    }

    // Rate limit: PSI allows ~1 req/sec for free
    if (i < urls.length - 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  process.stderr.write("\n");
  printBatchSummary(results, options);
}

// ============================================================================
// CLI
// ============================================================================

function parseArgs(argv: string[]): { command: string; args: string[]; options: CliOptions } {
  const command = argv[0] ?? "help";
  const args: string[] = [];
  const options: CliOptions = { strategy: "mobile", format: "table", category: "all" };

  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--strategy=")) {
      options.strategy = arg.split("=")[1] as any;
    } else if (arg.startsWith("--format=")) {
      options.format = arg.split("=")[1] as any;
    } else if (arg.startsWith("--category=")) {
      options.category = arg.split("=")[1];
    } else if (!arg.startsWith("--")) {
      args.push(arg);
    }
  }

  return { command, args, options };
}

function printHelp() {
  console.log(`
Lighthouse Audit CLI - Google PageSpeed Insights (free, no auth)

USAGE:
  bun lighthouse_audit.ts <command> <url> [options]

COMMANDS:
  audit <url>                 Full Lighthouse audit (all categories)
  performance <url>           Performance-only with CWV details
  batch <url1> <url2> ...     Audit multiple URLs (summary table)

OPTIONS:
  --strategy=mobile|desktop   Device strategy (default: mobile)
  --format=table|json|csv     Output format (default: table)
  --category=<cat>            Filter: performance, accessibility, seo, best-practices

EXAMPLES:
  bun lighthouse_audit.ts audit https://example.com
  bun lighthouse_audit.ts audit https://example.com --strategy=desktop
  bun lighthouse_audit.ts performance https://example.com --format=json
  bun lighthouse_audit.ts batch https://example.com https://example.com/blog
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
      case "audit":
        if (!args[0]) throw new Error("Provide a URL");
        await cmdAudit(args[0], options);
        break;
      case "performance":
        if (!args[0]) throw new Error("Provide a URL");
        await cmdPerformance(args[0], options);
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
