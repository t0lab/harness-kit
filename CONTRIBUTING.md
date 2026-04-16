# Contributing to harness-kit

Thanks for contributing to `harness-kit`.
This guide explains how to contribute safely and efficiently.

## Before you start

- Read `README.md`, `AGENTS.md`, and `CLAUDE.md` to understand repo conventions.
- Search existing issues and pull requests before opening a new one.
- For non-trivial changes, open an issue first to align scope.

## Development setup

Prerequisites:

- Node.js 22+
- `pnpm` (workspace package manager)

Setup:

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

## Branch and commit conventions

- Create a topic branch from `main`.
- Use Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
- Keep PRs focused and reasonably small.

Examples:

- `feat(cli): add bundle drift check command`
- `fix(wizard): prevent duplicate render on reopen`
- `docs: update release process smoke test steps`

## What to change where

- CLI/runtime code: `packages/harness-kit/src/`
- Shared types/constants: `packages/core/src/`
- Bundle manifests: `packages/harness-kit/src/registry/bundles/`
- Docs/plans/design decisions: `docs/`
- Generated harness artifacts in root (`.agents/`, `.claude/`) should be changed via their upstream source in `packages/harness-kit/` whenever possible.

## Test expectations

Before opening a PR, run:

```bash
pnpm test
pnpm typecheck
pnpm build
```

If you touched CLI behavior, include one manual smoke test note in PR description, for example:

- `harness-kit init`
- `harness-kit add <bundle>`
- `harness-kit status`

## Documentation expectations

Contributions that change behavior should also update relevant docs:

- `CHANGELOG.md` for user-visible changes
- `docs/exec-plans/active/` for ongoing multi-task work
- `docs/design-docs/` for architectural decisions
- `docs/exec-plans/tech-debt-tracker.md` when deferring known debt

## Pull request checklist

- [ ] Scope is clear and limited
- [ ] Tests updated or added (where applicable)
- [ ] `pnpm test`, `pnpm typecheck`, and `pnpm build` pass locally
- [ ] Docs updated for behavior/API changes
- [ ] Changelog entry added for notable user-facing changes

## Review and merge

- At least one maintainer approval is required.
- All required CI checks must pass.
- Maintainers may request splitting large PRs for faster review.

## Code of conduct

Be respectful, constructive, and specific in all discussions.
