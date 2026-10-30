<!-- agentflow-version: 0.5.0 -- managed by agentflow-init, do not edit by hand -->
<!-- Owned by the agentflow plugin. Bootstrapped into consuming
     projects as .claude/rules/agentflow.md, where Claude Code auto-loads it.
     Do not describe project- or stack-specific things here (repo layout, build
     commands, coding standards) -- those belong in the project's own CLAUDE.md
     or its other .claude/rules/ files. Everything here describes the plugin's
     own skills, so it ships and versions with them. Deliberately carries no
     `paths:` frontmatter: these rules apply to every task, not just to work
     under a particular directory. -->

# Agent Flow Rules

Provided by the `agentflow` plugin.

## Mandatory workflow rules

1. **Feature implementation** — new features, user stories and larger changes MUST go
   through the `feature-implementation` skill: Superpowers brainstorming →
   writing-plans → subagent-driven-development. Never jump straight into coding a
   feature.
2. **Code navigation and edits** — prefer Serena MCP tools (`find_symbol`,
   `find_referencing_symbols`, symbol-level edits) over plain text search and
   whole-file reads when locating or modifying existing code. Read whole files only
   where symbolic tools do not apply (configs, markdown, small files).
3. **Library documentation** — when the work involves a third-party library or
   framework, look its current documentation up via Context7 MCP
   (`resolve-library-id`, then `query-docs`) before designing an API contract against
   it or writing code that calls it. Do not work from memory for library APIs, and
   prefer what Context7 returns over a remembered signature when the two disagree.
   Unlike the rules around it, this one degrades gracefully: if Context7 is
   unavailable or has no entry for the library, say so and carry on. Context7 is
   an external service: ask it about the library, never about our code. Keep
   proprietary source, customer data and credentials out of the query.
4. **UI verification** — whenever frontend/UI code changed, the work is NOT done until
   the `ui-verification` skill has run with Playwright MCP and passed. This applies to
   any UI change, not only to work that went through `feature-implementation`.
5. **Cost tracking** — every completed implementation MUST end with the `cost-tracking`
   skill. No exceptions: a feature without documented AI usage is incomplete. This too
   applies to all work, not only to full feature workflows.

## User stories

Each story lives in its own folder, `docs/stories/US-XXXX-slug/` (see
`docs/stories/TEMPLATE/`):

- `story.md` — description, acceptance criteria, status, UI verification note
- `design.md`, `plan.md` — written by the brainstorming and writing-plans phases
- `ai-usage.md` — cost/duration/token record, written by `cost-tracking`'s
  `ai-cost-breakdown.mjs` script, not typed by hand
- `ui-testing/` — Playwright screenshots from `ui-verification`

When the user references a story — by ID, folder name, or "the story about …" — read
`story.md` first and treat its acceptance criteria as the requirements baseline.

Status is maintained inside `story.md`. AI usage and screenshots live in their own
file/folder as above, never inline in `story.md`; `story.md` keeps only a short
pointer to `ai-usage.md` under its own "## AI Usage" heading.

## UI designs

`docs/design/` holds the project's UI designs and mockups — exported screens,
wireframes, annotated screenshots. They are **inputs**: Phase 1 discusses the UI
contract against what the screens actually show, and Phase 4 verifies the built UI
against them. A design that belongs to exactly one story may live in that story's
folder instead.

Do not confuse this with the `design.md` Phase 1 writes. That is a produced
document and it belongs in the story folder, never in `docs/design/`.

## Definition of Done — the agent-flow part

Add these to whatever the project's own Definition of Done requires:

- UI changes verified via Playwright MCP (`ui-verification` skill) and passing
- AI usage documented (`cost-tracking` skill), with the phase and per-model tables
  written by the breakdown script
