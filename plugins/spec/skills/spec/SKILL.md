---
name: spec
description: "Create project specifications using Spec-Driven Development. Produces spec.md, plan.md, tasks.md, progress.md, and an interactive HTML overview. Inspired by GitHub SpecKit. USE WHEN user says 'spec', 'create a spec', 'spec this out', 'write a spec', 'let's spec', 'speckit', 'spec-driven', OR when a conversational ideation session is ready to be formalized into artifacts."
---

# Spec

Spec-Driven Development for new projects, features, and ideas. Turns conversational ideation into structured, actionable artifacts.

**Core principle:** Specifications focus on WHAT and WHY. Code is the last mile — maintaining software means evolving specifications.

**Agent routing:** Route spec creation to the **Architect** agent bundled with this plugin. If it isn't available, do the work in the main session.

## Workflow

See [workflows/create.md](workflows/create.md) for the full process.

## Quick Reference

```
/spec                            — Start a new spec (interactive)
/spec "project idea"             — Start a spec with initial context
/spec "project idea" --html      — Also generate the interactive HTML overview
"generate the HTML overview"     — Build overview.html later from existing artifacts
```

## Artifact Location

Specs live in `specs/` at the project root, one subdirectory per feature:

```
project-root/
  specs/
    user-auth/
      spec.md
      plan.md
      tasks.md
      progress.md
      overview.html
    dashboard-redesign/
      spec.md
      plan.md
      tasks.md
      progress.md
      overview.html
```

Directory name should be a short kebab-case slug for the feature (e.g., `user-auth`, `payment-flow`, `search-v2`).

For single-feature projects (the project IS the feature), use `specs/core/`.

## Artifacts

| File | Purpose | Owner |
|------|---------|-------|
| `spec.md` | WHAT and WHY — user stories, requirements, success criteria | Spec author |
| `plan.md` | HOW — technical approach, architecture, dependencies, risks | Spec author |
| `tasks.md` | Execution — dependency-ordered, parallelism-marked task list | Spec author |
| `progress.md` | Tracking — living document updated as work proceeds | Implementer |
| `overview.html` | Interactive single-file HTML overview of the spec (optional, on request) | Spec author |
| `kickoff.md` | Self-contained execution prompt — paste into a fresh session to run the spec | Spec author |

## Completion Requirements

1. **Before ending the turn, always write `kickoff.md`** — a self-contained prompt that orchestrates the agents and skills needed to execute the spec. See [workflows/create.md](workflows/create.md) Phase 7 for the template. Output the prompt to the user as the final message so they can copy it directly.
2. **Offer the HTML overview.** `overview.html` (Phase 6) is generated only when requested — upfront (`--html` / "with an HTML overview") or any time after, since it derives entirely from the markdown artifacts. If it wasn't requested, end the final summary with a one-line offer: *"Want an interactive HTML overview of this spec? Just say so and I'll generate `overview.html`."*
