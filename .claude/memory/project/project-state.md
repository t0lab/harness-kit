---
name: project-state
type: project
created: 2026-04-14
last-updated: 2026-04-15
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

See [harness-kit-evaluation](../../../docs/tmp/harness-kit-evaluation.md) for P0–P3 roadmap: hooks bundle, eval-harness, context-budget, subagents orchestration, telemetry-otel, drift-doctor.

## Next concrete steps

1. Bundle `workflow/skill-authoring` — gather the 4 orphan manual skills.
2. Bundle `workflow/hooks-guardrails` (P0).
3. Add `contextCost` field to `BundleManifest`.
4. Tests for rule / agent / git-hook artifact types; init → add → status integration test.
