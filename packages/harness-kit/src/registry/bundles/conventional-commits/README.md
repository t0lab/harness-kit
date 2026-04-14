# conventional-commits

Conventional Commits format for AI-assisted git workflows — structured commit messages that map directly to semantic versioning.

## What it installs

| Artifact | Path (in your project) | Purpose |
|----------|----------------------|---------|
| Skill | `.agents/skills/git-conventional/` | Commit format, type table, semver mapping, examples |
| Rule | `.claude/rules/git-workflow.md` | Always-loaded pointer — Claude checks the skill before every commit |
| Git hook | `.githooks/commit-msg.d/conventional-commits.sh` | Mechanical enforcement at commit time — rejects non-conformant subjects with an actionable error; exempts merge/revert/fixup/squash |

## How it works

The **rule** loads on every Claude Code session. It tells Claude to consult the `git-conventional` skill before writing any commit message — before `git commit`, before suggesting a commit message, before any git history work.

The **skill** gives Claude:
- Complete format reference: `<type>[(<scope>)][!]: <description>`
- 11 commit types with usage guidance
- Semver implication table (`feat` → minor, `fix` → patch, `feat!` → major)
- Examples including breaking changes, issue references, and multi-footer commits
- Scope conventions for larger codebases

## Semver mapping

```
fix:   → 0.0.X  (patch)
feat:  → 0.X.0  (minor)
feat!: → X.0.0  (major)
```

This makes commit history machine-readable for tools like `semantic-release`, `changelogithub`, and `release-please`.

## Pairs well with

- `branch-strategy` — also installs `git-workflow.md` rule; adds branch naming and PR size conventions
- `commit-signing` — GPG/SSH signing for verified commits
- `pre-commit-hooks` — `commitlint` enforcement so non-conforming messages are blocked at commit time
