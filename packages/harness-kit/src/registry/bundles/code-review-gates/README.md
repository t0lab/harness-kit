# code-review-gates

Self-review checklist and PR review protocol for Claude Code.

## What it installs

| Artifact | Path (in your project) | Purpose |
|----------|----------------------|---------|
| Skill | `.agents/skills/code-review/` | Self-review checklist, Ship/Show/Ask, PR template, reviewer protocol |
| Rule | `.claude/rules/git-workflow.md` | Always-loaded pointer — routes Claude to the skill before any commit or PR |

## How it works

The **rule** loads on every Claude Code session. It tells Claude to consult the code-review skill before creating branches, committing, or opening PRs. No explicit `/code-review` invocation required — Claude runs it as part of the pre-commit workflow.

The **skill** gives Claude a structured protocol:

1. **Self-review gate** — 7-point checklist run against `git diff --staged` before committing
2. **Ship / Show / Ask** — decides the right review track for each change
3. **PR description template** — what + why + how to verify
4. **Reviewer protocol** — what to block on, what not to block on, comment tone conventions

## Self-review checklist (summary)

Before every commit or PR, Claude checks:

1. **Correctness** — solves the stated problem, error paths handled
2. **Tests** — new behavior has a failing-then-passing test
3. **Security** — input validation, no secrets in code, auth boundaries correct
4. **Design** — simplest solution, no premature abstractions, functions ≤ 20 lines
5. **Naming** — readable in 6 months without context
6. **Side effects** — no resource leaks, no stray console.log/debugger/TODO
7. **Diff size** — > 400 lines suggests splitting

## Ship / Show / Ask

| Track | When | Action |
|-------|------|--------|
| Ship | Typo, trivial chore, no logic change | Merge directly |
| Show | New feature, accepted design | Open PR, merge immediately, notify team |
| Ask | Novel approach, breaking change, security-sensitive | Open PR, wait for approval |

## Pairs well with

- `branch-strategy` — branch naming and PR size conventions (also installs `git-workflow.md` rule)
- `git-conventional` — commit message format
- `tdd` — ensures tests exist before self-review gate runs
