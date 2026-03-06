# Lighthouse Fix Patterns

Common Lighthouse audit failures and their fix patterns. Organized by category.

## Table of Contents

1. [Performance - LCP](#lcp-largest-contentful-paint)
2. [Performance - TBT / INP](#tbt--inp-interactivity)
3. [Performance - CLS](#cls-cumulative-layout-shift)
4. [Performance - General](#general-performance)
5. [Accessibility](#accessibility)
6. [SEO](#seo)
7. [Best Practices](#best-practices)

---

## LCP (Largest Contentful Paint)

Target: ≤ 2.5s

### Slow server response (TTFB > 800ms)

**Cause:** Server takes too long to respond.
**Fixes:**
- Enable server-side caching (Redis, Varnish, CDN edge caching)
- Use a CDN (Cloudflare, Fastly, CloudFront)
- Optimize database queries
- Upgrade hosting if on shared hosting
- Enable HTTP/2 or HTTP/3

### Large hero image

**Cause:** Above-the-fold image is too large or in wrong format.
**Fixes:**
- Convert to WebP or AVIF format (30-50% smaller)
- Resize to actual display dimensions (don't serve 4000px for a 800px slot)
- Add `fetchpriority="high"` to hero image
- Add `loading="eager"` (not lazy) for above-fold images
- Use responsive `srcset` with multiple sizes
- Preload the hero image: `<link rel="preload" as="image" href="...">`

### Render-blocking CSS/JS

**Cause:** CSS or JS in `<head>` blocks rendering.
**Fixes:**
- Inline critical CSS (above-fold styles) in `<style>` tag
- Load non-critical CSS with `media="print"` + `onload` swap
- Add `async` or `defer` to non-critical scripts
- Move scripts to bottom of `<body>`

### Web fonts blocking render

**Cause:** Custom fonts delay text rendering.
**Fixes:**
- Add `font-display: swap` to @font-face
- Preload critical fonts: `<link rel="preload" as="font" crossorigin ...>`
- Subset fonts to only needed characters
- Use `woff2` format (best compression)
- Consider system font stack for body text

---

## TBT / INP (Interactivity)

Target: TBT ≤ 200ms, INP ≤ 200ms

### Heavy JavaScript execution

**Cause:** Large JS bundles block the main thread.
**Fixes:**
- Code-split: load only what's needed per page
- Tree-shake unused dependencies
- Lazy-load below-fold components
- Move heavy computation to Web Workers
- Audit bundle with `source-map-explorer` or `bundlephobia`

### Third-party scripts

**Cause:** Analytics, ads, chat widgets block main thread.
**Fixes:**
- Load third-party scripts with `async` or `defer`
- Delay non-essential third-party scripts until after load
- Use `loading="lazy"` for third-party iframes
- Self-host critical third-party resources (fonts, analytics)
- Audit with Chrome DevTools > Performance > Third-party

### Long tasks

**Cause:** Individual JS tasks > 50ms block interaction.
**Fixes:**
- Break long tasks with `requestIdleCallback` or `setTimeout(0)`
- Use `requestAnimationFrame` for visual updates
- Debounce/throttle event handlers
- Virtualize long lists (only render visible items)

---

## CLS (Cumulative Layout Shift)

Target: ≤ 0.1

### Images without dimensions

**Cause:** Images load and push content down.
**Fixes:**
- Always set `width` and `height` attributes on `<img>` tags
- Use CSS `aspect-ratio` property
- Use placeholder/skeleton while loading

### Dynamic content injection

**Cause:** Ads, banners, or content loads and shifts layout.
**Fixes:**
- Reserve space with fixed-height containers for ads/embeds
- Use `min-height` on dynamic content areas
- Avoid inserting content above existing content
- Use CSS `contain: layout` on dynamic regions

### Web fonts causing FOUT

**Cause:** Font swap changes text size/spacing.
**Fixes:**
- Use `font-display: optional` (no swap, uses fallback if not cached)
- Match fallback font metrics to web font using `size-adjust`
- Preload fonts to minimize swap delay

### Late-loading CSS

**Cause:** CSS loads after content, changing styles.
**Fixes:**
- Inline critical CSS
- Preload essential stylesheets
- Avoid layout-affecting CSS in async-loaded stylesheets

---

## General Performance

### Uncompressed assets

**Fix:** Enable gzip or Brotli compression on server. Most CDNs handle this automatically.

### No caching headers

**Fix:** Set `Cache-Control` headers:
- Static assets (JS/CSS/images): `max-age=31536000, immutable` (with hash in filename)
- HTML: `max-age=0, must-revalidate` or short TTL
- Fonts: `max-age=31536000`

### Too many HTTP requests

**Fix:**
- Bundle CSS/JS files
- Use CSS sprites or inline SVGs for icons
- Lazy-load below-fold images with `loading="lazy"`
- Remove unused CSS/JS

### Unminified CSS/JS

**Fix:** Use build tools (esbuild, Terser, cssnano) to minify. Most frameworks do this in production builds.

---

## Accessibility

### Insufficient color contrast

**Cause:** Text color too similar to background.
**Fix:** Ensure contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text. Use https://webaim.org/resources/contrastchecker/

### Missing alt text

**Cause:** Images without `alt` attribute.
**Fix:**
- Informative images: describe the content (`alt="Chart showing 30% growth in Q4"`)
- Decorative images: use empty alt (`alt=""`)
- Never skip the `alt` attribute entirely

### Missing form labels

**Cause:** Form inputs without associated `<label>`.
**Fix:** Add `<label for="id">` or wrap input in `<label>`. Use `aria-label` for icon-only buttons.

### Missing heading hierarchy

**Cause:** Skipped heading levels (H1 → H3, no H2).
**Fix:** Use headings in order (H1 → H2 → H3). Don't skip levels.

### Missing landmark regions

**Cause:** No `<main>`, `<nav>`, `<header>`, `<footer>` elements.
**Fix:** Use semantic HTML5 elements for page regions.

### Focus not visible

**Cause:** `outline: none` without replacement.
**Fix:** Never remove focus outline without providing a visible alternative. Use `:focus-visible` for keyboard-only focus styles.

---

## SEO

### Missing title tag

**Fix:** Add `<title>` in `<head>`. Include primary keyword, 50-60 characters.

### Missing meta description

**Fix:** Add `<meta name="description" content="...">`. Include keyword, CTA, under 155 characters.

### Missing canonical

**Fix:** Add `<link rel="canonical" href="...">` pointing to the preferred URL.

### Noindex set

**Cause:** `<meta name="robots" content="noindex">` or `X-Robots-Tag: noindex` header.
**Fix:** Remove if page should be indexed. Verify in HTTP headers too, not just HTML.

### Missing hreflang (multi-language sites)

**Fix:** Add `<link rel="alternate" hreflang="xx" href="...">` for each language version.

### Non-descriptive link text

**Cause:** Links with "click here", "read more" text.
**Fix:** Use descriptive anchor text that tells users and search engines what the link target is about.

### Robots.txt blocking resources

**Cause:** CSS/JS/images blocked by robots.txt.
**Fix:** Allow Googlebot to access all resources needed to render the page.

---

## Best Practices

### Not using HTTPS

**Fix:** Get SSL certificate (free via Let's Encrypt), redirect HTTP → HTTPS.

### Mixed content

**Cause:** HTTPS page loads HTTP resources.
**Fix:** Update all resource URLs to HTTPS. Use `Content-Security-Policy: upgrade-insecure-requests` as stopgap.

### Console errors

**Fix:** Open DevTools console, fix JavaScript errors. Common: 404 resources, undefined variables, CORS issues.

### Deprecated APIs

**Fix:** Check DevTools console for deprecation warnings. Update to modern alternatives.

### Missing `rel="noopener"` on external links

**Fix:** Add `rel="noopener"` to all `target="_blank"` links. Modern browsers handle this by default, but explicit is safer.
