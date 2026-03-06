#!/usr/bin/env bun
/**
 * Schema Validator CLI - Validate and generate JSON-LD structured data
 *
 * Usage:
 *   bun schema_validator.ts <command> [args] [options]
 *
 * Commands:
 *   validate <url>             Extract and validate JSON-LD from a URL
 *   validate-file <path>       Validate a local JSON-LD file
 *   check <url>                Quick check: does the page have structured data?
 *   generate <type> [options]  Generate JSON-LD from a template
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import { join, resolve } from "path";

const TEMPLATES_DIR = join(__dirname, "..", "assets", "schema-templates");

// ============================================================================
// Types
// ============================================================================

interface ValidationResult {
  valid: boolean;
  schema_type: string;
  errors: string[];
  warnings: string[];
  fields_present: string[];
  fields_missing: string[];
  fields_recommended: string[];
}

interface CliOptions {
  format: "table" | "json";
}

// ============================================================================
// Schema Type Requirements (Google's required/recommended fields)
// ============================================================================

const SCHEMA_REQUIREMENTS: Record<string, { required: string[]; recommended: string[] }> = {
  Article: {
    required: ["@type", "headline", "author", "datePublished", "image"],
    recommended: ["dateModified", "publisher", "description", "mainEntityOfPage"],
  },
  NewsArticle: {
    required: ["@type", "headline", "author", "datePublished", "image"],
    recommended: ["dateModified", "publisher", "description"],
  },
  BlogPosting: {
    required: ["@type", "headline", "author", "datePublished", "image"],
    recommended: ["dateModified", "publisher", "description", "wordCount"],
  },
  FAQPage: {
    required: ["@type", "mainEntity"],
    recommended: [],
  },
  Question: {
    required: ["@type", "name", "acceptedAnswer"],
    recommended: [],
  },
  HowTo: {
    required: ["@type", "name", "step"],
    recommended: ["description", "image", "totalTime", "estimatedCost", "supply", "tool"],
  },
  HowToStep: {
    required: ["@type", "text"],
    recommended: ["name", "image", "url"],
  },
  Product: {
    required: ["@type", "name", "image"],
    recommended: ["description", "brand", "offers", "review", "aggregateRating", "sku"],
  },
  Offer: {
    required: ["@type", "price", "priceCurrency"],
    recommended: ["availability", "url", "priceValidUntil"],
  },
  LocalBusiness: {
    required: ["@type", "name", "address"],
    recommended: ["telephone", "url", "openingHoursSpecification", "image", "priceRange", "geo"],
  },
  Organization: {
    required: ["@type", "name", "url"],
    recommended: ["logo", "sameAs", "contactPoint", "description", "foundingDate"],
  },
  BreadcrumbList: {
    required: ["@type", "itemListElement"],
    recommended: [],
  },
  ListItem: {
    required: ["@type", "position", "item"],
    recommended: ["name"],
  },
  WebPage: {
    required: ["@type", "name"],
    recommended: ["description", "url", "breadcrumb", "mainEntity"],
  },
  Person: {
    required: ["@type", "name"],
    recommended: ["url", "image", "jobTitle", "sameAs"],
  },
  Review: {
    required: ["@type", "author", "reviewRating"],
    recommended: ["datePublished", "reviewBody"],
  },
  AggregateRating: {
    required: ["@type", "ratingValue", "reviewCount"],
    recommended: ["bestRating", "worstRating"],
  },
};

// ============================================================================
// Validation Logic
// ============================================================================

function validateSchema(schema: any): ValidationResult {
  const schemaType = schema["@type"];
  const result: ValidationResult = {
    valid: true,
    schema_type: schemaType || "UNKNOWN",
    errors: [],
    warnings: [],
    fields_present: [],
    fields_missing: [],
    fields_recommended: [],
  };

  // Check @context
  if (!schema["@context"]) {
    result.errors.push("Missing @context (should be 'https://schema.org')");
    result.valid = false;
  } else if (!String(schema["@context"]).includes("schema.org")) {
    result.errors.push(`Invalid @context: ${schema["@context"]} (should be 'https://schema.org')`);
    result.valid = false;
  }

  // Check @type
  if (!schemaType) {
    result.errors.push("Missing @type");
    result.valid = false;
    return result;
  }

  const requirements = SCHEMA_REQUIREMENTS[schemaType];
  if (!requirements) {
    result.warnings.push(`Schema type '${schemaType}' not in validation rules — skipping field checks`);
    return result;
  }

  // Check required fields
  for (const field of requirements.required) {
    if (field === "@type") continue;
    if (schema[field] != null) {
      result.fields_present.push(field);
    } else {
      result.fields_missing.push(field);
      result.errors.push(`Missing required field: ${field}`);
      result.valid = false;
    }
  }

  // Check recommended fields
  for (const field of requirements.recommended) {
    if (schema[field] != null) {
      result.fields_present.push(field);
    } else {
      result.fields_recommended.push(field);
      result.warnings.push(`Missing recommended field: ${field}`);
    }
  }

  // Type-specific validation
  if (schemaType === "FAQPage" && schema.mainEntity) {
    if (!Array.isArray(schema.mainEntity)) {
      result.errors.push("FAQPage.mainEntity should be an array of Question objects");
      result.valid = false;
    } else {
      for (let i = 0; i < schema.mainEntity.length; i++) {
        const q = schema.mainEntity[i];
        if (q["@type"] !== "Question") {
          result.errors.push(`mainEntity[${i}] @type should be 'Question', got '${q["@type"]}'`);
        }
        if (!q.name) {
          result.errors.push(`mainEntity[${i}] missing 'name' (the question text)`);
        }
        if (!q.acceptedAnswer) {
          result.errors.push(`mainEntity[${i}] missing 'acceptedAnswer'`);
        } else if (q.acceptedAnswer["@type"] !== "Answer") {
          result.errors.push(`mainEntity[${i}].acceptedAnswer @type should be 'Answer'`);
        }
      }
    }
  }

  if (schemaType === "HowTo" && schema.step) {
    if (!Array.isArray(schema.step)) {
      result.errors.push("HowTo.step should be an array of HowToStep objects");
      result.valid = false;
    } else {
      for (let i = 0; i < schema.step.length; i++) {
        const s = schema.step[i];
        if (!s.text && !s.itemListElement) {
          result.errors.push(`step[${i}] missing 'text' or 'itemListElement'`);
        }
      }
    }
  }

  if (schemaType === "BreadcrumbList" && schema.itemListElement) {
    if (!Array.isArray(schema.itemListElement)) {
      result.errors.push("BreadcrumbList.itemListElement should be an array");
      result.valid = false;
    } else {
      for (let i = 0; i < schema.itemListElement.length; i++) {
        const item = schema.itemListElement[i];
        if (item.position !== i + 1) {
          result.warnings.push(`itemListElement[${i}] position is ${item.position}, expected ${i + 1}`);
        }
      }
    }
  }

  return result;
}

function validateMultiple(schemas: any[]): ValidationResult[] {
  return schemas.map(validateSchema);
}

// ============================================================================
// URL Extraction
// ============================================================================

async function extractJsonLdFromUrl(url: string): Promise<any[]> {
  const response = await fetch(url, {
    headers: { "User-Agent": "SEOSkill-SchemaValidator/1.0" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();

  // Extract all <script type="application/ld+json"> blocks
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const schemas: any[] = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      // Handle @graph arrays
      if (parsed["@graph"]) {
        schemas.push(...parsed["@graph"]);
      } else if (Array.isArray(parsed)) {
        schemas.push(...parsed);
      } else {
        schemas.push(parsed);
      }
    } catch (e) {
      schemas.push({ _parse_error: `Failed to parse JSON-LD: ${e}`, _raw: match[1].substring(0, 200) });
    }
  }

  return schemas;
}

// ============================================================================
// Template Generation
// ============================================================================

function listTemplates(): string[] {
  if (!existsSync(TEMPLATES_DIR)) return [];
  return readdirSync(TEMPLATES_DIR).filter((f) => f.endsWith(".json"));
}

function loadTemplate(type: string): any {
  const filename = `${type}.json`;
  const filepath = join(TEMPLATES_DIR, filename);

  if (!existsSync(filepath)) {
    const available = listTemplates().map((f) => f.replace(".json", ""));
    throw new Error(
      `Template '${type}' not found.\nAvailable: ${available.join(", ")}`
    );
  }

  return JSON.parse(readFileSync(filepath, "utf-8"));
}

// ============================================================================
// Output
// ============================================================================

function printValidationResult(result: ValidationResult, options: CliOptions) {
  if (options.format === "json") {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const status = result.valid ? "VALID" : "INVALID";
  const icon = result.valid ? "+" : "x";

  console.log(`\n[${icon}] ${result.schema_type}: ${status}`);

  if (result.errors.length > 0) {
    console.log("\n  Errors:");
    for (const err of result.errors) {
      console.log(`    - ${err}`);
    }
  }

  if (result.warnings.length > 0) {
    console.log("\n  Warnings:");
    for (const warn of result.warnings) {
      console.log(`    ~ ${warn}`);
    }
  }

  if (result.fields_present.length > 0) {
    console.log(`\n  Present: ${result.fields_present.join(", ")}`);
  }
  if (result.fields_recommended.length > 0) {
    console.log(`  Missing (recommended): ${result.fields_recommended.join(", ")}`);
  }
}

// ============================================================================
// Commands
// ============================================================================

async function cmdValidateUrl(url: string, options: CliOptions) {
  console.log(`Fetching ${url}...`);
  const schemas = await extractJsonLdFromUrl(url);

  if (schemas.length === 0) {
    console.log("\nNo JSON-LD structured data found on this page.");
    return;
  }

  console.log(`\nFound ${schemas.length} schema(s):`);

  const results = validateMultiple(schemas);

  if (options.format === "json") {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  for (const result of results) {
    printValidationResult(result, options);
  }

  const validCount = results.filter((r) => r.valid).length;
  console.log(`\n${validCount}/${results.length} valid`);
}

async function cmdValidateFile(filepath: string, options: CliOptions) {
  const absPath = resolve(filepath);
  if (!existsSync(absPath)) {
    throw new Error(`File not found: ${absPath}`);
  }

  const content = readFileSync(absPath, "utf-8");
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e}`);
  }

  const schemas = Array.isArray(parsed) ? parsed : parsed["@graph"] ? parsed["@graph"] : [parsed];
  const results = validateMultiple(schemas);

  if (options.format === "json") {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  console.log(`Validating ${absPath}:`);
  for (const result of results) {
    printValidationResult(result, options);
  }
}

async function cmdCheck(url: string, options: CliOptions) {
  const schemas = await extractJsonLdFromUrl(url);

  if (options.format === "json") {
    console.log(JSON.stringify({
      url,
      has_structured_data: schemas.length > 0,
      schema_count: schemas.length,
      types: schemas.map((s) => s["@type"] || "unknown"),
    }, null, 2));
    return;
  }

  if (schemas.length === 0) {
    console.log(`${url}: No structured data found`);
  } else {
    const types = schemas.map((s) => s["@type"] || "unknown");
    console.log(`${url}: ${schemas.length} schema(s) found`);
    console.log(`Types: ${types.join(", ")}`);
  }
}

async function cmdGenerate(type: string, options: CliOptions) {
  const template = loadTemplate(type);
  console.log(JSON.stringify(template, null, 2));
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
  const templates = listTemplates().map((f) => f.replace(".json", ""));
  console.log(`
Schema Validator CLI - JSON-LD Structured Data Tool

USAGE:
  bun schema_validator.ts <command> [args] [options]

COMMANDS:
  validate <url>           Extract and validate JSON-LD from a live URL
  validate-file <path>     Validate a local JSON-LD file
  check <url>              Quick check: does the page have structured data?
  generate <type>          Output a JSON-LD template

OPTIONS:
  --format=table|json      Output format (default: table)

AVAILABLE TEMPLATES:
  ${templates.join(", ")}

SUPPORTED SCHEMA TYPES:
  ${Object.keys(SCHEMA_REQUIREMENTS).join(", ")}

EXAMPLES:
  bun schema_validator.ts validate https://example.com/blog/post
  bun schema_validator.ts validate-file ./schema.json
  bun schema_validator.ts check https://example.com
  bun schema_validator.ts generate article
  bun schema_validator.ts generate faq --format=json
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
      case "validate":
        if (!args[0]) throw new Error("Provide a URL");
        await cmdValidateUrl(args[0], options);
        break;
      case "validate-file":
        if (!args[0]) throw new Error("Provide a file path");
        await cmdValidateFile(args[0], options);
        break;
      case "check":
        if (!args[0]) throw new Error("Provide a URL");
        await cmdCheck(args[0], options);
        break;
      case "generate":
        if (!args[0]) throw new Error("Provide a schema type");
        await cmdGenerate(args[0], options);
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
