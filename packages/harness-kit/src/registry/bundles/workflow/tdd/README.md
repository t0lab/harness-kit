---
title: TDD
description: Test-driven development for agent sessions. The agent stops coding first and instead grows behavior through small red-green-refactor loops.
category: workflow
slug: tdd
---
# TDD

Test-driven development for agent sessions. The agent stops coding first and instead grows behavior through small red-green-refactor loops.

## What it installs

| Artifact | Path (in your project) | Purpose |
|----------|------------------------|---------|
| Skill | `.agents/skills/tdd/` | TDD protocol for writing the smallest failing test first, proving the failure, implementing the minimum code, and refactoring safely |
| Rule | `.claude/rules/tdd.md` | Always-loaded pointer - Claude must start non-trivial behavior work with a failing test or explicitly explain why TDD is being skipped |

## How it works

This bundle addresses a common AI-agent failure mode: the code gets written first, and tests are added afterward to justify it. That often misses edge cases, overfits to the implementation, and weakens design pressure on the API.

The skill enforces a tight loop:

- start from behavior, not internal code shape
- write one small test for the next behavior slice
- run it and confirm it fails for the expected reason
- write the minimum production code to get green
- refactor while the test protects behavior
- repeat for the next slice instead of batching work

It also has a bug-fix mode: once a bug is understood, capture it as a failing regression test before the real fix lands.

This is an implementation workflow, not a completion gate. Pair it with `quality-gates` if you also want explicit final verification before the agent claims success.

## Pairs well with

- `quality-gates` - TDD creates confidence during implementation; quality-gates requires fresh verification before the final completion claim
- `systematic-debugging` - when the bug is not yet understood, systematic-debugging gets you to a real repro that TDD can then lock in as a regression test
- `spec-driven` - explicit acceptance criteria in the spec make it easier to know what behavior the first failing test should encode
- `code-review-gates` - TDD improves correctness before review; code-review-gates improves how the resulting diff gets reviewed and described
