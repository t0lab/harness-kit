# harness-kit

CLI tool that scaffolds AI agent harness environments. pnpm workspace monorepo:
- `packages/core` — shared constants and types (`@harness-kit/core`)
- `packages/harness-kit` — main CLI package (`@harness-kit/cli`): src/, templates/

## Stack

TypeScript 5, Node 22, pnpm workspaces, tsup (build), vitest (tests), commander (CLI parsing), Ink + React (wizard TUI), xstate (wizard state machine), chalk, execa, listr2, Handlebars.

## Key Principles

- **Copy-own distribution**: copy artifacts into target project; user owns them, no runtime dep
- **Just enough**: every module must justify its context window cost
- **TDD**: write failing test → implement → pass → commit

## Conventions

- Commits: Conventional Commits — invoke `git-conventional` skill before committing
- Tests live in `tests/` folder per package (not co-located with src)
- All new functionality starts with a failing vitest test
- Build: `pnpm build` from root or `pnpm --filter <pkg> build` per package
- No `Co-Authored-By` lines in commits
- **Wizard = Ink only** — every wizard step renders through Ink components. No `process.stdout.write` ANSI from step code, no inline prompts that write directly to stdout inside the wizard alt-screen (causes render conflict)

## Docs

> Repository là system of record. Mọi quyết định sống trong repo — không trong Slack, không trong đầu người.

| Khi cần...                              | Đọc                                    |
|-----------------------------------------|----------------------------------------|
| Hiểu layer nào code này thuộc về        | `ARCHITECTURE.md`                      |
| Hiểu tại sao một quyết định được đưa ra | `docs/design-docs/core-beliefs.md`     |
| Biết product đang đi đâu                | `docs/product-specs/ROADMAP.md`        |
| Nắm phạm vi một release cụ thể          | `docs/releases/<version>.md`           |
| Xem định hướng sản phẩm hiện tại        | `docs/DESIGN.md`                       |
| Xem spec của một feature cụ thể         | `docs/design-docs/<feature>.md`        |
| Xem plan đang active                    | `docs/exec-plans/active/`              |
| Biết technical debt nào đã biết         | `docs/exec-plans/tech-debt-tracker.md` |
| Dùng commander / ink / listr2 đúng      | `docs/references/<lib>.md`             |

## Structure

See AGENTS.md for full project map.

## Memory

@.claude/memory/project.md
@.claude/memory/reference.md
