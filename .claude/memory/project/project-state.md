---
name: project-state
type: project
created: 2026-04-14
last-updated: 2026-04-17
---

# Project State

## Shipped

- `@harness-kit/core@0.1.1`, `@harness-kit/cli@0.1.1` published on npm.
- Monorepo: pnpm workspaces, tsup, vitest, TypeScript project references.
- Wizard: xstate v5 — project-info → tech-stack-select → detect-tooling → harness-config → preview-apply.
- CLI commands: `init`, `list`, `add`, `status`. Installer handles: mcp, tool, skill, rule, agent, git-hook, command, file.

## Registry (as of 2026-04-15)

**45 bundles across 3 top-level categories:**

- `workflow/` — 26 bundles (covers categories: git-workflow, workflow-preset, memory, browser, search, scrape, mcp-tool)
- `techstack/` — 14 (nextjs, react, vue, express, fastify, fastapi, django, spring, postgresql, redis, supabase, github-actions, langchain, langgraph)
- `stack/` — 5 (typescript, python, go, rust, java) — base language rules, inherited via `type: 'stack'` artifact

Centralized sources: `packages/harness-kit/{skills,rules,agents,git-hooks}/`.

## Self-harness (dogfood)

Repo is scaffolded by its own CLI. `.claude/` contains bundle-installed skills + 4 manual skills (`bundle-creator`, `skill-creator`, `find-skills`, `token-optimization`) that have no bundle yet.

## In flight

See [2026-04-14-harness-engineering evaluation](../../../docs/evaluations/2026-04-14-harness-engineering.md) for P0–P3 roadmap; active plan: [2026-04-15-from-scaffolding-to-harness-toolkit](../../../docs/exec-plans/active/2026-04-15-from-scaffolding-to-harness-toolkit.md).

## 0.2.0-beta.11 planning state (2026-04-17)

- Roadmap and release planning were switched to **owner-driven scope** (no auto-generated roadmap direction).
- Release scope was **snapshot-locked** to explicit plan files instead of "all currently active" wording to avoid scope drift when new plans are created later.
- Plan transition completed: `2026-04-13-cli-commands` moved from `docs/exec-plans/active/` to `docs/exec-plans/completed/`.
- `2026-04-16-harness-web-nextjs-nextra-plan` task status was refreshed from repo evidence:
  - Task 1/2/3/4 complete
  - Task 5/6/7 pending
- New beta.11 web scope added: public `blogs` feature for sharing vibe-coding recommendations.

## Next concrete steps

1. Land skill updates (`docs-as-code`, `release`, research-oriented skill) targeted in beta.11 release docs.
2. Close or re-scope remaining tasks in `2026-04-16-harness-web-nextjs-nextra-plan` (Task 5/6/7 + new Task 8 blogs).
3. Keep roadmap/release/changelog synchronized as source of truth for release cut readiness.
