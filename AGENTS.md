# harness-kit — Project Map

> Pointer map for AI agents. For implementation details, follow file links.

## What This Project Does

CLI that scaffolds AI agent harness environments. `harness-kit init` → wizard → copies `.claude/`, `CLAUDE.md`, `AGENTS.md`, `harness.json`, hooks, rules, skills into the user's project.

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
    wizard/     → interactive prompt flow, tech stack detection
    engine/     → compose, merge, apply artifacts, token budget
    registry/   → load modules, resolve presets, validate manifests
  registry/     → artifact library shipped with package
    skills/     → SKILL.md + manifest.json per skill
    rules/      → rule.md + manifest.json per rule
    hooks/      → hook.sh + manifest.json per hook
    docs/       → doc templates
    agents/     → agent definitions
  presets/      → JSON bundle declarations
  templates/    → Handlebars base templates (CLAUDE.md, AGENTS.md, harness.json)
```

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

- Design spec: `docs/specs/2026-04-10-harness-kit-design.md`
- Implementation plans: `docs/plans/`

## Key Files

- `packages/harness-kit/src/index.ts` — CLI entry point
- `harness.json` — this project's own harness state (modules installed)
- `.env.local` — AI provider config (gitignored, optional)
