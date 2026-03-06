# GEO (Generative Engine Optimization) Workflow

Optimize content for visibility in AI-generated answers (Google AI Overviews, ChatGPT, Perplexity, Claude).

## Table of Contents

1. [GEO vs Traditional SEO](#geo-vs-traditional-seo)
2. [Detection](#detection)
3. [Content Optimization Strategies](#content-optimization-strategies)
4. [Structural Optimization](#structural-optimization)
5. [Authority Signals](#authority-signals)
6. [Measurement](#measurement)

---

## GEO vs Traditional SEO

| Aspect | Traditional SEO | GEO |
|--------|----------------|-----|
| Target | Search engine rankings | AI-generated answers |
| Signal | Backlinks, keywords, technical | Clarity, authority, structure |
| Format | Optimized for clicks | Optimized for extraction |
| Success metric | Position + CTR | Citation + reference |
| Content style | Engaging, keyword-rich | Factual, concise, well-structured |

GEO is additive — it doesn't replace SEO, it layers on top. Well-structured, authoritative content serves both.

## Detection

Check if a keyword triggers AI overviews:

```bash
bun ~/.claude/skills/SEO/Keywords/scripts/keyword_research.ts serp "<keyword>"
```

Look for:
- `ai_overview` items in SERP results
- `ai_overview_reference` items (sources cited)
- People Also Ask boxes (often feed AI answers)

If AI overview is present, identify:
- Which domains are cited as sources
- What format the cited content uses (lists, definitions, data)
- Whether any of your content is already cited

## Content Optimization Strategies

### 1. Authoritative Definitions
Place clear, concise definitions near the top of content. LLMs extract these as quotable answers.

**Pattern:**
```
[Term] is [clear 1-2 sentence definition]. [Supporting context sentence].
```

Avoid: vague openings, "In this article we'll discuss..." intros.

### 2. Structured Claims with Citations
Back up claims with specific data points. LLMs prefer content with verifiable facts.

**Pattern:**
```
According to [Source] ([year]), [specific statistic or finding].
```

Include: percentages, dollar amounts, study findings, survey results.

### 3. Comprehensive Lists and Steps
LLMs frequently extract numbered lists and step-by-step processes.

**Pattern:**
- Use numbered lists for processes (H2 > step > explanation)
- Use bullet lists for features, benefits, comparisons
- Keep each item concise (1-3 sentences)
- Front-load the key information in each item

### 4. Direct Question-Answer Format
Match the exact questions users (and LLMs) ask.

**Pattern:**
```
## What is [topic]?

[Direct answer in first sentence]. [Supporting detail]. [Example or context].
```

Sources:
- People Also Ask questions from SERP analysis
- Related keywords with question modifiers (how, what, why, when)

### 5. Comparison Tables
LLMs extract structured comparisons effectively.

**Pattern:**
```markdown
| Feature | Option A | Option B | Option C |
|---------|----------|----------|----------|
| Price   | $X/mo    | $Y/mo    | $Z/mo    |
```

Use for: product comparisons, tool comparisons, method comparisons.

### 6. Expert Perspective
LLMs weight content with clear expertise signals.

**Include:**
- Author name and credentials
- First-person experience ("In my experience working with 200+ clients...")
- Specific case studies with real numbers
- Original data or research

## Structural Optimization

### Page-Level Structure
- **Title**: Include the exact query phrase where possible
- **First 100 words**: Must contain a direct, extractable answer
- **Headings**: Use question-format H2s that match common queries
- **Paragraphs**: Keep to 2-4 sentences. LLMs struggle with wall-of-text
- **Summary/TL;DR**: Include at top or bottom with key takeaways

### Schema Markup for GEO
Schema helps LLMs understand content structure:

| Content Type | Schema | GEO Benefit |
|-------------|--------|-------------|
| How-to guide | HowTo | Steps are extractable |
| FAQ page | FAQPage | Q&A pairs are directly quotable |
| Article | Article | Author + publish date signals |
| Review | Review | Ratings are structured data |
| Product | Product | Specs are extractable |

Hand off to OnPage sub-skill for schema implementation.

### Internal Authority Signals
- Link to authoritative external sources (studies, official docs)
- Link from high-authority pages on your site to GEO-target pages
- Ensure consistent entity information (author bios, about page, schema)

## Authority Signals

LLMs evaluate source authority through:

| Signal | Action |
|--------|--------|
| Domain authority | Build quality backlinks (outside SEO skill scope) |
| Author expertise | Author bio with credentials, schema Person markup |
| Content freshness | Regular updates, visible "last updated" dates |
| Citation network | Cite reputable sources, be cited by others |
| Consistency | Consistent facts across your content, no contradictions |
| Depth | Comprehensive coverage signals topical authority |

## Measurement

Currently limited, but track:

1. **AI Overview presence**: Periodically check target keywords for AI overview citation
2. **Referral traffic from AI**: Monitor analytics for `ai-overview` or LLM referral traffic
3. **Brand mentions in LLM outputs**: Periodically query ChatGPT/Perplexity/Claude with target queries
4. **DataForSEO AI Optimization API**: Check for LLM mentions (when available in client)

### Review Cadence
- Monthly: Spot-check top 10 target keywords for AI overview presence
- Quarterly: Full GEO audit of all pillar/cluster content
- Per-publish: Apply GEO checklist to all new content before publishing
