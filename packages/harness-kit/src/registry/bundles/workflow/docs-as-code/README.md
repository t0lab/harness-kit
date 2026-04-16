---
title: Docs as Code
description: The agent treats the repository as the system of record — decisions, plans, and constraints that aren't in the repo don't exist for the agent.
category: workflow
slug: docs-as-code
---
# Docs as Code

The agent treats the repository as the system of record — decisions, plans, and constraints that aren't in the repo don't exist for the agent.

## What it installs

| Artifact | Path (in your project) | Purpose |
|----------|----------------------|---------|
| Skill | `.agents/skills/docs-as-code/` | Doc types, structures (exec plan, ADR, reference), freshness rules, agent-readability principles |
| Rule | `.claude/rules/docs-as-code.md` | Always-loaded: check exec plans before starting, update docs after implementing, keep AGENTS.md as table of contents |

## How it works

The central insight from agent-first teams: **agents can only reason over what they can read**. Knowledge in chat threads, people's heads, or Google Docs is invisible to the agent — it might as well not exist. This bundle encodes the practices that make a repository legible to an agent across sessions.

**The rule** loads on every session. It tells the agent to check `docs/exec-plans/active/` before starting any feature (to avoid duplicating work), update docs after implementing (so the next session doesn't read stale state), and write architectural decisions to `docs/design-docs/` when they happen.

**The skill** gives the agent a complete protocol:

1. **Progressive disclosure structure** — AGENTS.md as a ~100-line table of contents, with deeper docs in `docs/` loaded on demand. Avoids the failure mode of a single monolithic instructions file that crowds out actual task context.

2. **Context tiers** — hot docs (always loaded, must be dense), warm docs (task-specific), cold docs (on-demand). Every doc is designed for its loading pattern.

3. **Doc type routing** — exec plans for active work, design docs/ADRs for architectural decisions, references for library usage, product specs for direction. Each type has a template.

4. **Agent-readability principles** — concrete commands over abstract descriptions, symptom→cause→fix tables for known failures, every line justifying its context cost.

5. **Freshness discipline** — validate file paths with Glob, function names with Grep, move completed exec plans, don't let doc divergence accumulate.

## The docs/ structure this bundle establishes

```
AGENTS.md                     ← table of contents only; ~100 lines max
ARCHITECTURE.md               ← package map with dependency direction
docs/
├── design-docs/              ← architectural decisions (ADRs)
├── exec-plans/
│   ├── active/               ← in-progress implementation plans
│   ├── completed/            ← finished plans
│   └── tech-debt-tracker.md
├── product-specs/            ← product direction and feature specs
└── references/               ← distilled library docs for agent consumption
```

## Why AGENTS.md must stay short

Teams that tried a single large AGENTS.md hit the same failure modes:
- A giant instructions file crowds out the task, the code, and the relevant docs
- When everything is "important," nothing is — agents pattern-match locally instead of navigating
- Monolithic files rot instantly; no one maintains them; the agent can't tell what's still true
- Blobs don't lend themselves to freshness checks or cross-link validation

This bundle enforces the alternative: AGENTS.md as map, docs/ as territory.

## Pairs well with

- `planning-first` — spec before implementation; exec plans live in `docs/exec-plans/active/`
- `context-discipline` — task decomposition into session-sized chunks, session handoff via commit
- `spec-driven` — brainstorm → spec → plan → implement; specs land in `docs/product-specs/`
- `code-review-gates` — enforces that doc updates ship with the code change that triggered them
