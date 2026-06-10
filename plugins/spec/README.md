# spec

Spec-Driven Development for Claude Code. Turns conversational ideation into structured, executable artifacts — plus an interactive HTML overview you can actually read.

Inspired by [GitHub SpecKit](https://github.com/github/spec-kit) and [The Unreasonable Effectiveness of HTML](https://claude.com/blog/using-claude-code-the-unreasonable-effectiveness-of-html) (Thariq Shihipar, Anthropic).

## What's included

| Component | What it does |
|-----------|--------------|
| `spec` skill | The workflow: clarify → specify → plan → tasks → progress → HTML overview → kickoff prompt |
| `html-artifacts` skill | Self-contained interactive HTML outputs for plans, reviews, reports, and prototypes. Triggers independently of spec work. |
| `Architect` agent | Constraint-first architecture agent the spec skill routes to. Produces the full artifact set. |

## Usage

```
/spec                            — Start a new spec (interactive)
/spec "project idea"             — Start a spec with initial context
/spec "project idea" --html      — Also generate the interactive HTML overview
"generate the HTML overview"     — Build overview.html later from existing artifacts
```

Every spec produces, in `specs/<feature-slug>/`:

- **`spec.md`** — WHAT and WHY: user stories (P1–P3), requirements, success criteria
- **`plan.md`** — HOW: stack, architecture, key decisions with alternatives, risks
- **`tasks.md`** — dependency-ordered checklist with parallelism markers and checkpoints
- **`progress.md`** — living tracking doc for the implementer
- **`kickoff.md`** — a self-contained prompt to paste into a fresh session to execute the spec
- **`overview.html`** *(on request)* — single-file interactive overview, opened in your browser

The HTML overview is opt-in rather than automatic: it's the most token-expensive artifact, and since it derives entirely from the markdown files you can ask for it at any point — during the spec, right after, or once implementation has changed things and you want a fresh one. If you don't ask, the spec ends with a one-line offer so it stays discoverable.

## How I run this

This plugin is the portable core of a larger agent system I use daily. The full setup:

1. **Architect** (bundled here) writes the spec, plan, tasks, and HTML overview. It never writes implementation code.
2. **Engineer** — a principal-level implementation agent that works through `tasks.md` with TDD in an isolated git worktree, ticking checkboxes and updating `progress.md` as it goes.
3. **QATester** — validates each user-story checkpoint against the acceptance criteria in `spec.md` from a user's perspective (browser-based when there's a UI). The Engineer doesn't advance past a checkpoint until QA passes.
4. **Designer** — runs a design review pass before any UI-touching checkpoint.

The `kickoff.md` artifact encodes this orchestration. Only the Architect ships with the plugin — the others are general-purpose enough that you likely have your own equivalents, so the skill and kickoff prompt reference them softly: *if an engineering/QA/design agent exists in your environment, route to it; otherwise the main session does the work.* Nothing breaks without them; checkpoints just become self-review gates instead of agent handoffs.

If you want the full experience, define your own `Engineer`/`QATester`/`Designer` agents in `~/.claude/agents/` — the kickoff prompts will pick them up by behavior, not by name.

## Install

```
/plugin marketplace add adamlevoy/claude-plugins
/plugin install spec@adamlevoy
```
