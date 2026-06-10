# Create Spec Workflow

If an architecture-focused agent (e.g., `Architect`) is available, route this workflow to it. Otherwise, run it in the main session.

## Output Location

Create artifacts in `specs/<feature-slug>/` at the project root. Use a short kebab-case name for the feature (e.g., `specs/user-auth/`, `specs/payment-flow/`). For single-feature projects, use `specs/core/`.

Create the directory before writing artifacts.

## Process

### Phase 1: Clarify

Before writing anything, ensure the idea is well-understood. If coming from a conversation, summarize what's been discussed. If starting fresh, ask up to 5 targeted questions to reduce ambiguity:

- What problem does this solve and for whom?
- What does success look like?
- What are the hard constraints (budget, timeline, platform, existing systems)?
- What's explicitly out of scope?
- Is there prior art or inspiration to reference?

Don't over-clarify. Make informed assumptions for anything with a reasonable default and document them in the spec.

### Phase 2: Specify → `spec.md`

The spec defines WHAT we're building and WHY. No implementation details.

```markdown
# Spec: [Project Name]

**Created**: [DATE]
**Status**: Draft

## Problem
[What problem exists and why it matters. 2-4 sentences.]

## User Stories

### US1: [Title] (Priority: P1)
[Plain language description of what the user can do]

**Acceptance criteria:**
- Given [context], when [action], then [result]
- Given [context], when [action], then [result]

### US2: [Title] (Priority: P2)
[...]

### US3: [Title] (Priority: P3)
[...]

## Requirements

### Functional
- **FR-001**: [System MUST/SHOULD capability]
- **FR-002**: [System MUST/SHOULD capability]

### Non-Functional
- **NFR-001**: [Performance, security, accessibility requirement]

## Success Criteria
- **SC-001**: [Measurable, technology-agnostic outcome]
- **SC-002**: [User-focused outcome]

## Assumptions
- [Reasonable defaults documented here]

## Out of Scope
- [Explicitly excluded items]
```

**Rules:**
- User stories are independently testable MVP slices, prioritized P1-P3
- P1 stories form the MVP — the project is shippable with just P1 complete
- Requirements use MUST/SHOULD language and are testable
- Success criteria are measurable and technology-agnostic
- Maximum 3 ambiguity markers `[NEEDS CLARIFICATION]` — make informed guesses for everything else

### Phase 3: Plan → `plan.md`

The plan defines HOW we'll build it. Technical translation of the spec.

```markdown
# Plan: [Project Name]

**Spec**: [link to spec.md]
**Created**: [DATE]

## Summary
[Primary requirement + technical approach in 2-3 sentences]

## Technical Context
- **Platform**: [e.g., Web, macOS, CLI]
- **Stack**: [e.g., Astro, Tailwind, shadcn/ui, Lucide]
- **Language**: [e.g., TypeScript]
- **Storage**: [e.g., SQLite, Neon Postgres, none]
- **Hosting**: [e.g., Vercel, Cloudflare, local]

## Architecture

[How the system is structured. Include a diagram if helpful (mermaid). Describe the key components, how they interact, and why this structure was chosen.]

## Key Decisions

| Decision | Choice | Rationale | Alternatives Considered |
|----------|--------|-----------|------------------------|
| [What] | [Chosen approach] | [Why] | [What else was evaluated] |

## Project Structure
[Concrete directory layout]

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| [What could go wrong] | [Consequence] | [How to prevent or handle] |

## Open Questions
[Anything that needs resolution before or during implementation]
```

**Rules:**
- Reference the spec — every technical choice should trace back to a requirement
- Prefer the user's known stack (check CLAUDE.md for preferences)
- Document key decisions with rationale AND alternatives considered
- Keep it concise — this is a plan, not documentation

### Phase 4: Tasks → `tasks.md`

Dependency-ordered, executable task list organized by user story.

```markdown
# Tasks: [Project Name]

**Plan**: [link to plan.md]
**Created**: [DATE]

## Phase 1: Setup
- [ ] T001 [description with file path if known]
- [ ] T002 [P] [description] — [P] = can run in parallel

## Phase 2: Foundation (blocks all user stories)
- [ ] T003 [description]
- [ ] T004 [P] [description]
**Checkpoint**: Foundation complete, ready for user stories

## Phase 3: US1 — [Title] (P1 — MVP)
- [ ] T005 [US1] [description]
- [ ] T006 [P] [US1] [description]
- [ ] T007 [US1] [description]
**Checkpoint**: US1 independently functional

## Phase 4: US2 — [Title] (P2)
- [ ] T008 [US2] [description]
- [ ] T009 [P] [US2] [description]
**Checkpoint**: US2 complete

## Phase 5: Polish
- [ ] T010 [P] Documentation
- [ ] T011 [P] Final review
```

**Rules:**
- Every task is a checkbox: `- [ ] T### [P?] [US#?] Description`
- `[P]` marks tasks that can run in parallel (different files, no dependencies)
- Organized by user story so each is independently shippable
- Include file paths where known
- Phases have checkpoints — natural stopping points where the project is in a working state
- Models before services, services before UI

### Phase 5: Progress → `progress.md`

Initialized by the spec author, updated by whoever implements.

```markdown
# Progress: [Project Name]

**Spec**: [link] | **Plan**: [link] | **Tasks**: [link]
**Started**: [DATE]
**Status**: Not Started

## Current Phase
[Which phase from tasks.md is active]

## Completed
- [DATE] — [What was done]

## Blockers
- [Any current blockers]

## Decisions Made During Implementation
- [DATE] — [Decision and why, if it deviated from plan]

## Notes
[Anything worth capturing that doesn't fit above]
```

### Phase 6: HTML Overview → `overview.html`

**This phase is required.** Generate a single self-contained HTML file that presents the entire spec as an interactive overview, using the **`html-artifacts`** skill (bundled in this plugin). This is the artifact stakeholders actually read — the markdown files are the source of truth for execution; the HTML overview is the source of truth for understanding.

Requirements for `overview.html`:

1. **Self-contained** — one file, inline CSS and JS, no external dependencies, no build step. Opens directly in a browser.
2. **Tabbed or sectioned navigation** covering: Problem & Goals, User Stories (with priority badges P1/P2/P3), Requirements (FR/NFR with MUST/SHOULD highlighting), Architecture (render the plan's structure as an inline SVG or styled diagram — do not embed unrendered mermaid), Key Decisions table, Task Board (phases as columns or grouped lists, checkpoints marked), and Risks.
3. **Status-aware** — visually distinguish priority levels, parallelizable tasks `[P]`, and checkpoints with color coding and badges.
4. **Export affordance** — a "Copy as Markdown" button on the user stories and tasks sections so content can be pasted back into prompts or issues.
5. **Readable design** — system font stack, generous spacing, supports `prefers-color-scheme` dark mode. No placeholder lorem ipsum; every element is populated from the real spec artifacts.

After writing the file, open it in the user's browser (e.g., `open specs/<feature-slug>/overview.html` on macOS) so they can review it immediately.

### Phase 7: Kickoff Prompt → `kickoff.md`

**This phase is required.** Before ending the turn, generate a self-contained execution prompt that the user (or a fresh Claude Code session) can run to actually build the spec. The kickoff prompt encodes the agent orchestration and skill routing so execution doesn't require re-discovering context.

#### What goes in the kickoff prompt

The prompt must be **self-contained** — assume the reader has no memory of the conversation that produced the spec. Include:

1. **Artifact paths** — absolute or repo-relative paths to `spec.md`, `plan.md`, `tasks.md`, and `progress.md`
2. **Execution agent** — if the environment has specialized agents, route implementation to an engineering-focused agent (ideally one using TDD in an isolated worktree). Use a design-focused agent instead when the work is primarily UI/UX. If no specialized agents exist, instruct the session to implement directly.
3. **Validation agent** — route to a QA/validation agent after each user story checkpoint, if one is available
4. **Skill routing** — list every skill the implementer should invoke during execution, based on what the plan calls for. See "Skill routing matrix" below.
5. **Progress protocol** — instruct the executor to update `progress.md` after each completed task and at every checkpoint
6. **Stopping points** — call out the checkpoints from `tasks.md` as natural review gates

#### Skill routing matrix

Inspect `plan.md` and surface the relevant skills **from those available in the environment** — check the session's available-skills list rather than assuming. Common mappings:

| Signal in plan | Skill to invoke (if available) |
|----------------|--------------------------------|
| React, Next.js components | React/Next.js best-practices skill |
| Any frontend / UI work | Web design guidelines / UI review skill (review pass before each US checkpoint) |
| Document outputs (.docx, .xlsx, .pptx, .pdf) | The matching document skill |
| Anthropic SDK / Claude API code | Claude API reference skill |
| MCP server build | MCP builder skill |
| Browser automation / e2e | Browser automation skill |
| Spec/plan/review presentation | `html-artifacts` (bundled in this plugin) |

Only list skills the plan actually needs — don't pad. If the plan touches none of these, omit the skill section entirely and say so.

#### Template

Write the following to `specs/<feature-slug>/kickoff.md`:

```markdown
# Kickoff: [Project Name]

Paste this prompt into a fresh Claude Code session at the project root to execute the spec.

---

Execute the spec at `specs/<feature-slug>/`. The artifacts are:

- **Spec** (WHAT/WHY): `specs/<feature-slug>/spec.md`
- **Plan** (HOW): `specs/<feature-slug>/plan.md`
- **Tasks** (execution order): `specs/<feature-slug>/tasks.md`
- **Progress** (live tracking): `specs/<feature-slug>/progress.md`
- **Overview** (HTML summary): `specs/<feature-slug>/overview.html`

## Agent orchestration

1. Read the spec, plan, tasks, and progress artifacts before starting. The plan and tasks list are authoritative — deviate only with a recorded decision in `progress.md`.
2. Delegate implementation to an engineering agent if available (prefer isolated worktrees and TDD); otherwise implement directly. Work through `tasks.md` in dependency order, marking checkboxes as you go.
3. After every user-story checkpoint in `tasks.md`, validate against that user story's acceptance criteria from `spec.md` (via a QA agent if available). Do not advance to the next user story until validation passes.
4. [If UI-heavy:] Run a design review pass before each user-story checkpoint that touches the UI.

## Required skills during execution

Invoke these skills when their triggers fire:

- [List relevant skills from the routing matrix that exist in this environment]

If the plan doesn't call for any specialized skills beyond default tooling, this section is empty.

## Progress protocol

- Update `progress.md` after each completed task: tick the box in `tasks.md`, append a one-line entry to "Completed" with date and task ID.
- At each checkpoint, update the "Current Phase" field and note the validation verdict.
- Record any deviation from `plan.md` in "Decisions Made During Implementation" with the reasoning.

## Stopping points

Pause for user review at every checkpoint listed in `tasks.md` (the **Checkpoint:** lines between phases). At each pause, post a short status: tasks completed, validation result, any decisions logged, and the next phase. Do not auto-continue past a checkpoint.

## First step

Start with Phase 1 (Setup) from `tasks.md`.
```

After writing `kickoff.md`, also output the prompt body (the section between the `---` markers) to the user as the final message so they can copy-paste it directly without opening the file.

## Output

After creating all artifacts (spec, plan, tasks, progress, **overview.html**, **and kickoff**), present a summary:
- Number of user stories (by priority)
- Number of tasks (with parallelizable count)
- Key technical decisions
- Skills routed for execution
- Path to `overview.html` (opened in browser) and `kickoff.md`, with the kickoff prompt body ready to copy
