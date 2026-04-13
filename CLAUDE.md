# harness-kit

CLI tool that scaffolds AI agent harness environments. pnpm workspace monorepo:
- `packages/core` — shared constants and types (`@harness-kit/core`)
- `packages/harness-kit` — main CLI package (`@harness-kit/cli`): src/, templates/

## Stack

TypeScript 5, Node 22, pnpm workspaces, tsup (build), vitest (tests), commander (CLI parsing), @clack/prompts (wizard UI), chalk, execa, listr2, Handlebars.

## Key Principles

- **Shadcn model**: copy artifacts into target project; user owns them, no runtime dep
- **Just enough**: every module must justify its context window cost
- **TDD**: write failing test → implement → pass → commit

## Conventions

- Commits: Conventional Commits — invoke `git-conventional` skill before committing
- Tests live in `tests/` folder per package (not co-located with src)
- All new functionality starts with a failing vitest test
- Build: `pnpm build` from root or `pnpm --filter <pkg> build` per package
- No `Co-Authored-By` lines in commits

## Structure

See AGENTS.md for full project map.
