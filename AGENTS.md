# harness-kit — Project Map

> Pointer map for AI agents. For implementation details, follow file links.

## What This Project Does

CLI that scaffolds AI agent harness environments. `harness-kit init` → wizard → copies `.claude/`, `CLAUDE.md`, `AGENTS.md`, `harness.json`, MCP config, rules, and skills into the user's project.

## Monorepo Packages

| Package | Path | Role |
|---------|------|------|
| `@harness-kit/core` | `packages/core/` | Shared constants, types |
| `@harness-kit/cli` | `packages/harness-kit/` | Main CLI — all commands |

## Main Package Source Layout

```
packages/harness-kit/
  src/
    cli/        → command definitions (init, add, list, status)
    wizard/     → interactive prompt flow (xstate v5 machine)
      steps/    → project-info, tech-stack-select, detect-tooling, harness-config, preview-apply
    engine/     → template-renderer, scaffolder, detector
    registry/   → bundle registry (TypeScript manifests, query API)
      bundles/  → one folder per bundle, each with manifest.ts (40 bundles)
      index.ts  → getAllBundles, getBundlesByCategory, getBundle, getRecommendedByCategory
      types.ts  → BundleManifest, BundleCategory, Artifact, EnvVar
  index.ts      → CLI entry point (Commander)
  templates/    → Handlebars base templates (CLAUDE.md, AGENTS.md, harness.json, mcp.json, etc.)
```

## Bundle Registry

Bundles are TypeScript files in `src/registry/bundles/<name>/manifest.ts`. Each exports a `BundleManifest` object with:
- `common.artifacts` — installed for all roles (usually contains the MCP entry)
- `roles` — keyed by `BundleCategory`; each role entry can mark `recommended: true`
- `defaultRole` — the role used when this bundle is selected

**Bundle categories (13):** `git-workflow`, `workflow-preset`, `memory`, `browser`, `search`, `scrape`, `library-docs`, `doc-conversion`, `code-execution`, `dev-integration`, `cloud-infra`, `observability`, `mcp-tool`

Adding a new option = add a bundle manifest, no wizard code change.

## Wizard Flow

```
projectInfo → techStackSelect → detectTooling → harnessConfig → previewApply
```

- `harnessConfig` — multiselect per zone, all options from registry (`getBundlesByCategory`)
- `previewApply` — renders templates, writes files via Listr2
- All default selections from `getRecommendedByCategory`

## Project Harness

```
.agents/skills/         → skill source of truth (symlinked into .claude/skills/)
  git-conventional/     → Conventional Commits workflow
.claude/skills/         → symlinks to .agents/skills/*
examples/               → manual test projects (not in pnpm workspace)
  basic-node/           → plain Node.js project
  typescript-project/   → TS project with tsconfig (tests smart detection)
```

## Specs & Plans

- Design specs: `docs/specs/`
- Implementation plans: `docs/plans/`

## Key Files

- `packages/harness-kit/src/index.ts` — CLI entry point
- `packages/harness-kit/src/registry/index.ts` — registry query API
- `packages/harness-kit/src/wizard/index.ts` — xstate machine + `runWizard()`
- `harness.json` — this project's own harness state
- `.env.local` — AI provider config (gitignored, optional)
