---
title: Local Memory
description: File-based long-term memory for your agent — personal learnings stay on your machine, team-shared context lives in the repo. Zero dependencies.
category: workflow
slug: local-memory
---
# Local Memory

File-based long-term memory for your agent — personal learnings stay on your machine, team-shared context lives in the repo. Zero dependencies.

## What it installs

| Artifact | Path (in your project) | Purpose |
|----------|-----------------------|---------|
| Rule | `.claude/rules/memory.md` | Always-loaded contract: 4 memory types, routing local vs repo, injection-safety rule |
| Skill | `.claude/skills/memory/` | Protocol the agent follows when writing or recalling a memory |
| Skill | `.claude/skills/memory-merge/` | Protocol for resolving git conflicts and consolidating duplicate memories |
| Stop hook | `hooks/memory-stop-reminder.sh` | Reminds the agent to run the `memory` skill at end of session |
| Pre-commit check | `.githooks/pre-commit.d/local-memory.sh` | Blocks commits with unresolved conflict markers in `.claude/memory/`. Runs under the canonical dispatcher installed at `.githooks/pre-commit`, composing cleanly with other bundles' pre-commit checks |

## How it works

Long-term memory for coding agents has two failure modes: bloat (hot cache grows until it's useless) and loss (something written 6 months ago that nobody can find). This bundle addresses both through a **two-tier, two-scope** layout.

**Two scopes (where it lives):**
- Personal memory — `user` preferences and `feedback` corrections — stays in `~/.claude/projects/<hash>/memory/`. Not shared with the team.
- Team memory — `project` decisions and `reference` pointers to external systems — lives in `.claude/memory/` and is committed to the repo.

**Two tiers (how it's loaded):**
- Hot cache files (`project.md`, `reference.md`, `MEMORY.md`) are index-only — 1-line pointers to deep files, kept under ~100 lines. Always in context.
- Deep store files (`project/{topic}.md`, `reference/{topic}.md`, etc.) are atomic — one topic per file. Loaded on demand.

The agent writes a new memory by picking the right type, picking the right scope, and creating a `kebab-case.md` file with frontmatter (`created`, `last-updated`, optional `confidence`). The hot cache gets a 1-line pointer; content stays in the deep file.

When two devs edit the same memory file and hit a git conflict, the `memory-merge` skill walks through detection → proposal → merge → verification, with a `supersedes: [...]` audit trail so nothing silently disappears.

The `confidence` field on `feedback` memories (0.3 / 0.7 / 0.9) lets future sessions know what's tentative vs rock-solid — so a single contradictory observation doesn't instantly overwrite a validated rule.

## Setup

On first invocation the `memory` skill bootstraps `.claude/memory/` with `INDEX.md`, `project.md`, `reference.md`, and the empty `project/` and `reference/` subdirectories. It also appends two import directives to your `CLAUDE.md`:

```md
@.claude/memory/project.md
@.claude/memory/reference.md
```

If you prefer not to share memory via git, add `.claude/memory/` to `.gitignore` — the bundle still works, just without the team-sharing benefit.

**Hooks install automatically** when you `harness-kit add local-memory`:

- Stop hook writes to `.claude/hooks/memory-stop-reminder.sh` and merges an entry into `.claude/settings.json`.
- Pre-commit check writes to `.githooks/pre-commit.d/local-memory.sh`; the engine installs/maintains a canonical dispatcher at `.githooks/pre-commit` that runs every `*.sh` in `.d/` in sorted order — so installing other bundles' pre-commit checks (e.g. `pre-commit-hooks`) composes without collision.
- Activation is centralized in **`npx harness-kit activate`** — one command that runs all post-install wiring for any bundle (sets `core.hooksPath=.githooks`, plus any future activation steps).
- **Teammates who clone the repo** run `npx harness-kit activate` once. Git does not persist `core.hooksPath` in-tree, so this is required per-clone. Add it to `package.json` `"postinstall"` or `Makefile` if you want it zero-friction.
- The activate command is idempotent and skips safely if `cwd` is not the git top-level — no surprise side-effects in monorepo sub-dirs.

### Why not husky or pre-commit framework?

- **husky**: adds a runtime dep + owns its own hook dir (`.husky/`), conflicts with the copy-own philosophy.
- **pre-commit (Python)**: requires `pip install pre-commit` per dev, heavyweight for one shell script.
- `core.hooksPath` + `.githooks/` is zero-dep and ships in Git ≥ 2.9. Upgrade path to husky/pre-commit stays open if hook count grows.

## Pairs well with

- `context-discipline` — both manage what lives in the context window; memory handles persistence across sessions, context-discipline handles hygiene within one.
- `docs-as-code` — memory is for ephemeral project state and decisions-in-flight; `docs/design-docs/` is for ratified architectural decisions. The `memory` skill explicitly redirects you to docs when the memory is actually a permanent decision.
- `spec-driven` — specs live in `docs/`; memory holds the context around why a spec looks the way it does.
