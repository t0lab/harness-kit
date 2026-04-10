---
name: git-conventional
description: Guide writing Conventional Commits — invoke before committing
tags: [git, commit, workflow]
---

# Git Conventional Commits

## Format

```
<type>[(<scope>)][!]: <description>

[body]

[footer(s)]
```

- Description: imperative mood, present tense, ≤72 chars, no period
- Body: explain **what** and **why**, not how (blank line after subject)
- Breaking change: append `!` to type (`feat!:`) or footer `BREAKING CHANGE: <desc>`

## Types

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Restructure without feature/fix |
| `test` | Add or update tests |
| `chore` | Maintenance, deps, tooling |
| `build` | Build system changes |
| `ci` | CI/CD config |
| `perf` | Performance improvement |
| `style` | Formatting only (no logic change) |
| `revert` | Revert a previous commit |

## Examples

**Simple feat/fix:**
```
feat(cli): add zone-based tech stack selector
fix(registry): resolve manifest path on Windows
```

**With scope + body (explain why):**
```
refactor(engine): extract token budget into separate module

Token budget logic was growing inside applyModules() and made
it hard to test independently. No behavior change.
```

**Breaking change:**
```
feat!(cli): replace --preset flag with interactive wizard

BREAKING CHANGE: --preset flag is removed. Use `harness-kit init`
for the interactive flow or `harness-kit add <preset>` directly.
```

**Multi-footer with issue reference:**
```
fix(wizard): skip tsconfig detection when no src/ dir found

Closes #42
Refs #38
```

**Chore / maintenance:**
```
chore: bump tsup to v8
build: add @types/node to harness-kit devDependencies
ci: add pnpm cache to GitHub Actions workflow
```

## Rules

- One logical change per commit — keep commits atomic
- Reference issues in footer: `Closes #123` or `Refs #456`
- Never add `Co-Authored-By` lines
- Never use `--no-verify` — fix the hook failure instead
- Hook fails after commit attempt → fix issue, create **new** commit (never `--amend`)
