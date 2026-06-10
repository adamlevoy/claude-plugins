---
name: html-artifacts
description: "Produce self-contained, interactive HTML files instead of markdown when presenting plans, specs, code reviews, reports, comparisons, prototypes, or diagrams. Based on Anthropic's 'The Unreasonable Effectiveness of HTML' (Thariq Shihipar) and the anthropics/html-effectiveness example gallery. USE WHEN user asks for an 'HTML overview', 'HTML report', 'interactive summary', 'visual explainer', 'render this as a page', OR when output is long/structured enough (100+ lines, multi-section, comparative, or data-heavy) that markdown would be hard to scan."
---

# HTML Artifacts

Markdown is for source-of-truth documents; HTML is for *reading and deciding*. A single self-contained HTML file carries richer information density (tables, SVG, color, layout), stays readable past 100 lines (tabs, navigation, collapsible sections), supports two-way interaction (sliders, toggles, copy-back buttons), and shares trivially — anyone can open it in a browser.

Reference gallery: [anthropics/html-effectiveness](https://github.com/anthropics/html-effectiveness) — 20 self-contained examples. Article: [Using Claude Code: The Unreasonable Effectiveness of HTML](https://claude.com/blog/using-claude-code-the-unreasonable-effectiveness-of-html).

## When to reach for HTML

| Use case | What the artifact looks like |
|----------|------------------------------|
| **Exploration** | Side-by-side grid comparing 2–4 approaches or visual directions, with trade-off callouts |
| **Code review** | Rendered diff with inline margin annotations, severity color-coding, summary flowchart |
| **Code understanding** | Architecture explainer with SVG diagrams, component cards, data-flow arrows |
| **Specs / plans** | Tabbed overview: problem, stories, requirements, architecture, task board, risks |
| **Reports** | Status/incident/research reports with stat cards, timelines, and charts |
| **Prototypes** | Live interactive component with parameter sliders and "copy values" export |
| **Custom editors** | Purpose-built micro-UI (triage board, config editor, prompt tuner) with JSON export |

Don't use HTML for: short answers, source-of-truth docs that get diffed in git (keep those markdown), or content the user will edit by hand.

## Hard requirements

Every artifact MUST be:

1. **One file, zero dependencies.** Inline all CSS and JS. No CDN links, no external fonts, no build step, no network requests. It must render identically offline via `file://`.
2. **Real data only.** Populate every element from the actual task content. No lorem ipsum, no placeholder rows. If data is unknown, omit the section rather than fake it.
3. **Self-navigating.** Past ~3 sections, add sticky top navigation or tabs. The reader should never scroll to orient themselves.
4. **Dark-mode aware.** Define colors as CSS custom properties and honor `prefers-color-scheme: dark`.
5. **Opened for the user.** After writing, open it (`open file.html` on macOS, `xdg-open` on Linux) and tell the user the path.

## Design defaults

- **Typography:** system font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`); `ui-monospace, SFMono-Regular, Menlo, monospace` for code. Body 15–16px, line-height 1.6, max content width ~1100px centered.
- **Color:** neutral background, one accent color, and a small semantic palette (green = good/done, amber = warning/medium, red = risk/high, blue = info). Use badges and left-border accents rather than large filled blocks.
- **Layout:** CSS grid for comparisons (side-by-side columns), cards for enumerable items, sticky headers for long tables.
- **Diagrams:** draw inline SVG (boxes, arrows, swim lanes). Never embed un-rendered mermaid/graphviz source.
- **Code:** `<pre><code>` blocks with a copy button; for diffs, color added/removed lines and put annotations in the margin, not inline comments.

## Interactivity patterns

Add interaction only where it changes a decision:

- **Tabs/accordions** for parallel alternatives or long appendices (vanilla JS, no framework).
- **Sliders/toggles** when tuning parameters (animation timing, config values) — always paired with a **"Copy values"** button that writes JSON or a prompt-ready snippet to the clipboard, so changes flow back into the conversation.
- **"Copy as Markdown" buttons** on any section the user may paste into issues, PRs, or prompts.
- **Filter/sort controls** on tables longer than ~15 rows.
- Keep total JS small and inline; no state libraries, no fetch calls.

## Workflow

1. Pick the closest use-case shape from the table above and structure the file around it.
2. Write the file next to the content it describes (e.g., `specs/<slug>/overview.html`, `review/<branch>.html`, or the working directory).
3. Verify: open the file, confirm it renders with no console errors and no network requests.
4. Report the file path and a one-line description of what it shows.
