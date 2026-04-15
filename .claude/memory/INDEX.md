# Memory Index

Human-maintained TOC of all memory files in this repo. Update on every new memory file.

## project/

- [project-state.md](./project/project-state.md) — what's built, registry state, in-flight roadmap
- [decisions.md](./project/decisions.md) — architectural decisions and rationale
- [gotchas.md](./project/gotchas.md) — failed approaches, tooling quirks, silent failures

## reference/

_Empty._

## Conventions

- Scope split: `project` + `reference` live here (committed); `user` + `feedback` live in `~/.claude/projects/<hash>/memory/` (local).
- One topic per file, `kebab-case.md`, frontmatter required (`name`, `type`, `created`, `last-updated`).
- Hot caches (`project.md`, `reference.md`) are pointers only — <100 lines, no content.
- When two files cover the same topic, invoke the `memory-merge` skill.
