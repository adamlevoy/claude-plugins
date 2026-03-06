#!/usr/bin/env bun
/**
 * Link Mapper CLI - Crawl and analyze internal link structure
 *
 * Usage:
 *   bun link_mapper.ts <command> <url> [options]
 *
 * Commands:
 *   crawl <url>    Crawl internal links from starting URL
 *   audit <url>    Full link audit with issues report
 */

// ============================================================================
// Types
// ============================================================================

interface PageLink {
  from: string;
  to: string;
  anchor_text: string;
  is_internal: boolean;
}

interface PageData {
  url: string;
  title: string;
  status: number;
  internal_links_out: PageLink[];
  internal_links_in: PageLink[];
  external_links_out: PageLink[];
  depth: number;
}

interface CrawlResult {
  base_url: string;
  pages_crawled: number;
  pages: Map<string, PageData>;
  all_links: PageLink[];
}

interface AuditIssue {
  type: "error" | "warning" | "info";
  category: string;
  url: string;
  detail: string;
}

interface CliOptions {
  depth: number;
  limit: number;
  format: "table" | "json";
}

// ============================================================================
// URL Helpers
// ============================================================================

function normalizeUrl(url: string, base: string): string | null {
  try {
    const resolved = new URL(url, base);
    // Remove fragment and trailing slash for consistency
    resolved.hash = "";
    let path = resolved.pathname.replace(/\/+$/, "") || "/";
    return `${resolved.origin}${path}${resolved.search}`;
  } catch {
    return null;
  }
}

function isInternal(url: string, baseOrigin: string): boolean {
  try {
    return new URL(url).origin === baseOrigin;
  } catch {
    return false;
  }
}

function getOrigin(url: string): string {
  return new URL(url).origin;
}

// ============================================================================
// Crawler
// ============================================================================

async function crawlSite(startUrl: string, options: CliOptions): Promise<CrawlResult> {
  const baseOrigin = getOrigin(startUrl);
  const visited = new Set<string>();
  const queue: Array<{ url: string; depth: number }> = [{ url: normalizeUrl(startUrl, startUrl)!, depth: 0 }];
  const pages = new Map<string, PageData>();
  const allLinks: PageLink[] = [];

  while (queue.length > 0 && visited.size < options.limit) {
    const { url, depth } = queue.shift()!;

    if (visited.has(url) || depth > options.depth) continue;
    visited.add(url);

    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "SEOSkill-LinkMapper/1.0" },
        redirect: "follow",
      });

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) continue;

      const html = await response.text();

      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : "";

      // Extract links
      const linkRegex = /<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      const internalLinksOut: PageLink[] = [];
      const externalLinksOut: PageLink[] = [];
      let linkMatch;

      while ((linkMatch = linkRegex.exec(html)) !== null) {
        const href = linkMatch[1];
        const anchorHtml = linkMatch[2];
        // Strip HTML tags from anchor text
        const anchorText = anchorHtml.replace(/<[^>]+>/g, "").trim().substring(0, 100);

        // Skip non-http links
        if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:") || href === "#") {
          continue;
        }

        const resolved = normalizeUrl(href, url);
        if (!resolved) continue;

        const link: PageLink = {
          from: url,
          to: resolved,
          anchor_text: anchorText,
          is_internal: isInternal(resolved, baseOrigin),
        };

        allLinks.push(link);

        if (link.is_internal) {
          internalLinksOut.push(link);
          // Queue for crawling if not visited
          if (!visited.has(resolved) && depth + 1 <= options.depth) {
            queue.push({ url: resolved, depth: depth + 1 });
          }
        } else {
          externalLinksOut.push(link);
        }
      }

      pages.set(url, {
        url,
        title,
        status: response.status,
        internal_links_out: internalLinksOut,
        internal_links_in: [], // populated after crawl
        external_links_out: externalLinksOut,
        depth,
      });

      // Progress indicator
      if (visited.size % 10 === 0) {
        process.stderr.write(`Crawled ${visited.size} pages...\r`);
      }
    } catch (error) {
      pages.set(url, {
        url,
        title: "",
        status: 0,
        internal_links_out: [],
        internal_links_in: [],
        external_links_out: [],
        depth,
      });
    }
  }

  // Populate inbound links
  for (const link of allLinks) {
    if (link.is_internal && pages.has(link.to)) {
      pages.get(link.to)!.internal_links_in.push(link);
    }
  }

  process.stderr.write("\n");

  return {
    base_url: startUrl,
    pages_crawled: pages.size,
    pages,
    all_links: allLinks,
  };
}

// ============================================================================
// Audit Logic
// ============================================================================

function auditCrawl(result: CrawlResult): AuditIssue[] {
  const issues: AuditIssue[] = [];

  for (const [url, page] of result.pages) {
    // Orphan pages (no internal links pointing to them, except homepage)
    if (page.internal_links_in.length === 0 && page.depth > 0) {
      issues.push({
        type: "error",
        category: "Orphan Page",
        url,
        detail: "No internal links point to this page",
      });
    }

    // Deep pages (click depth > 3)
    if (page.depth > 3) {
      issues.push({
        type: "warning",
        category: "Deep Page",
        url,
        detail: `Click depth: ${page.depth} (should be ≤3)`,
      });
    }

    // Under-linked pages (fewer than 3 internal links in)
    if (page.internal_links_in.length > 0 && page.internal_links_in.length < 3 && page.depth > 0) {
      issues.push({
        type: "warning",
        category: "Under-linked",
        url,
        detail: `Only ${page.internal_links_in.length} internal link(s) pointing here`,
      });
    }

    // Over-linked pages (more than 100 outbound links)
    if (page.internal_links_out.length > 100) {
      issues.push({
        type: "warning",
        category: "Over-linked",
        url,
        detail: `${page.internal_links_out.length} outbound internal links (excessive)`,
      });
    }

    // Pages with no outbound internal links
    if (page.internal_links_out.length === 0) {
      issues.push({
        type: "warning",
        category: "Dead End",
        url,
        detail: "No outbound internal links (dead-end page)",
      });
    }

    // Error status codes
    if (page.status >= 400) {
      issues.push({
        type: "error",
        category: "HTTP Error",
        url,
        detail: `Status ${page.status}`,
      });
    } else if (page.status === 0) {
      issues.push({
        type: "error",
        category: "Unreachable",
        url,
        detail: "Failed to fetch page",
      });
    }

    // Empty anchor text
    const emptyAnchors = page.internal_links_out.filter((l) => !l.anchor_text);
    if (emptyAnchors.length > 0) {
      issues.push({
        type: "info",
        category: "Empty Anchors",
        url,
        detail: `${emptyAnchors.length} link(s) with empty/image-only anchor text`,
      });
    }
  }

  // Check for duplicate anchor text pointing to different pages
  const anchorMap = new Map<string, Set<string>>();
  for (const link of result.all_links) {
    if (link.is_internal && link.anchor_text) {
      const key = link.anchor_text.toLowerCase();
      if (!anchorMap.has(key)) anchorMap.set(key, new Set());
      anchorMap.get(key)!.add(link.to);
    }
  }

  for (const [anchor, targets] of anchorMap) {
    if (targets.size > 1 && anchor.length > 3) {
      issues.push({
        type: "info",
        category: "Anchor Conflict",
        url: `"${anchor}"`,
        detail: `Same anchor text links to ${targets.size} different pages`,
      });
    }
  }

  return issues;
}

// ============================================================================
// Output
// ============================================================================

function printCrawlResults(result: CrawlResult, options: CliOptions) {
  if (options.format === "json") {
    const output = {
      base_url: result.base_url,
      pages_crawled: result.pages_crawled,
      pages: Array.from(result.pages.values()).map((p) => ({
        url: p.url,
        title: p.title,
        status: p.status,
        depth: p.depth,
        internal_links_in: p.internal_links_in.length,
        internal_links_out: p.internal_links_out.length,
        external_links_out: p.external_links_out.length,
      })),
    };
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  console.log(`\nInternal Link Map: ${result.base_url}`);
  console.log(`Pages crawled: ${result.pages_crawled}\n`);

  // Sort by depth, then by inbound links (descending)
  const sorted = Array.from(result.pages.values()).sort((a, b) => {
    if (a.depth !== b.depth) return a.depth - b.depth;
    return b.internal_links_in.length - a.internal_links_in.length;
  });

  // Header
  const header = "URL                                              | Depth | In  | Out | Ext | Title";
  console.log(header);
  console.log("-".repeat(header.length));

  for (const page of sorted) {
    const urlShort = page.url.replace(getOrigin(result.base_url), "").substring(0, 48).padEnd(48);
    const depth = String(page.depth).padEnd(5);
    const inLinks = String(page.internal_links_in.length).padEnd(3);
    const outLinks = String(page.internal_links_out.length).padEnd(3);
    const extLinks = String(page.external_links_out.length).padEnd(3);
    const title = (page.title || "").substring(0, 40);
    console.log(`${urlShort} | ${depth} | ${inLinks} | ${outLinks} | ${extLinks} | ${title}`);
  }

  console.log(`\n${result.pages_crawled} pages | ${result.all_links.filter((l) => l.is_internal).length} internal links | ${result.all_links.filter((l) => !l.is_internal).length} external links`);
}

function printAuditResults(issues: AuditIssue[], result: CrawlResult, options: CliOptions) {
  if (options.format === "json") {
    console.log(JSON.stringify({ summary: { pages: result.pages_crawled, issues: issues.length }, issues }, null, 2));
    return;
  }

  // Summary
  console.log(`\nLink Audit: ${result.base_url}`);
  console.log(`Pages: ${result.pages_crawled} | Issues: ${issues.length}`);

  const errors = issues.filter((i) => i.type === "error");
  const warnings = issues.filter((i) => i.type === "warning");
  const info = issues.filter((i) => i.type === "info");

  console.log(`Errors: ${errors.length} | Warnings: ${warnings.length} | Info: ${info.length}`);

  if (errors.length > 0) {
    console.log(`\n--- Errors ---`);
    for (const issue of errors) {
      console.log(`  [${issue.category}] ${issue.url}`);
      console.log(`    ${issue.detail}`);
    }
  }

  if (warnings.length > 0) {
    console.log(`\n--- Warnings ---`);
    for (const issue of warnings) {
      console.log(`  [${issue.category}] ${issue.url}`);
      console.log(`    ${issue.detail}`);
    }
  }

  if (info.length > 0) {
    console.log(`\n--- Info ---`);
    for (const issue of info) {
      console.log(`  [${issue.category}] ${issue.url}`);
      console.log(`    ${issue.detail}`);
    }
  }
}

// ============================================================================
// CLI
// ============================================================================

function parseArgs(argv: string[]): { command: string; args: string[]; options: CliOptions } {
  const command = argv[0] ?? "help";
  const args: string[] = [];
  const options: CliOptions = { depth: 3, limit: 100, format: "table" };

  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--depth=")) {
      options.depth = parseInt(arg.split("=")[1], 10);
    } else if (arg.startsWith("--limit=")) {
      options.limit = parseInt(arg.split("=")[1], 10);
    } else if (arg.startsWith("--format=")) {
      options.format = arg.split("=")[1] as any;
    } else if (!arg.startsWith("--")) {
      args.push(arg);
    }
  }

  return { command, args, options };
}

function printHelp() {
  console.log(`
Link Mapper CLI - Internal Link Structure Analysis

USAGE:
  bun link_mapper.ts <command> <url> [options]

COMMANDS:
  crawl <url>     Crawl internal links and show structure
  audit <url>     Full audit with issues (orphans, depth, anchors)

OPTIONS:
  --depth=<n>       Max crawl depth (default: 3)
  --limit=<n>       Max pages to crawl (default: 100)
  --format=<type>   Output: table, json (default: table)

EXAMPLES:
  bun link_mapper.ts crawl https://example.com
  bun link_mapper.ts crawl https://example.com --depth=2 --limit=50
  bun link_mapper.ts audit https://example.com --format=json
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
      case "crawl": {
        if (!args[0]) throw new Error("Provide a URL");
        const result = await crawlSite(args[0], options);
        printCrawlResults(result, options);
        break;
      }
      case "audit": {
        if (!args[0]) throw new Error("Provide a URL");
        const result = await crawlSite(args[0], options);
        printCrawlResults(result, options);
        const issues = auditCrawl(result);
        printAuditResults(issues, result, options);
        break;
      }
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
