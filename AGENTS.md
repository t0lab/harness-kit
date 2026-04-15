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
      bundles/
        workflow/   → 26 process/opinion bundles (tdd, security-review, conventional-commits…)
        stack/      → 5 language-base bundles (typescript, python, go, rust, java)
        techstack/  → 19 tool/framework bundles (nextjs, docker, langchain…)
      index.ts  → getAllBundles, getBundlesByCategory, getBundle, getRecommendedByCategory
      types.ts  → BundleManifest, BundleCategory, Artifact, EnvVar
  index.ts      → CLI entry point (Commander)
  templates/    → Handlebars base templates (CLAUDE.md, AGENTS.md, harness.json, mcp.json, etc.)
```

## Bundle Registry

Bundles are TypeScript files in `src/registry/bundles/{workflow,stack,techstack}/<name>/manifest.ts`. Each exports a `BundleManifest` object with:
- `common.artifacts` — installed for all roles (usually contains the MCP entry)
- `roles` — keyed by `BundleCategory`; each role entry can mark `recommended: true`
- `defaultRole` — the role used when this bundle is selected

**Bundle categories (9):** `git-workflow`, `workflow-preset`, `memory`, `browser`, `search`, `scrape`, `mcp-tool`, `stack`, `techstack`

- `stack` — language-base bundles (bucket B): forbidden from containing `type:'stack'` artifacts (cycle prevention)
- `techstack` — tool/framework bundles (bucket A): may inherit a stack via `{ type: 'stack', ref: '<lang>' }` artifact

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

- Design specs: `docs/design-docs/`
- Kế hoạch đang active: `docs/exec-plans/active/`
- Kế hoạch hoàn thành: `docs/exec-plans/completed/`
- Technical debt: `docs/exec-plans/tech-debt-tracker.md`

## Key Files

- `packages/harness-kit/src/index.ts` — CLI entry point
- `packages/harness-kit/src/registry/index.ts` — registry query API
- `packages/harness-kit/src/wizard/index.ts` — xstate machine + `runWizard()`
- `harness.json` — this project's own harness state
- `.env.local` — AI provider config (gitignored, optional)
