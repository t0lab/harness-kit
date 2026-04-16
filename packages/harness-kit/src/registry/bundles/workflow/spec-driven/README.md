---
title: Spec Driven
description: Spec before plan for non-trivial work. The agent stops letting implementation become the first precise statement of scope and writes the source-of-truth spec in the repo first.
category: workflow
slug: spec-driven
---
# Spec Driven

Spec before plan for non-trivial work. The agent stops letting implementation become the first precise statement of scope and writes the source-of-truth spec in the repo first.

## What it installs

| Artifact | Path (in your project) | Purpose |
|----------|------------------------|---------|
| Skill | `.agents/skills/spec-driven/` | Protocol for choosing the right spec type, writing a minimum viable spec, and gating planning on it |
| Rule | `.claude/rules/spec-driven.md` | Always-loaded pointer - Claude writes or updates a spec in `docs/` before planning or implementing scope-sensitive work |

## How it works

This bundle handles a specific failure mode common in agent workflows: everyone agrees to "build X", but the first precise version of X only appears after code already exists. By then, scope, non-goals, and acceptance criteria are implicit in the implementation instead of explicit in the repo.

The skill makes the agent establish the source of truth first:

- choose whether the work needs a product spec, a design doc, or both
- write the smallest spec that removes ambiguity about goals, non-goals, boundaries, and success criteria
- separate settled decisions from open questions
- require the execution plan to reference the spec instead of reinventing scope
- update the spec first if implementation forces a change in shape

This is narrower than `docs-as-code` and more spec-specific than `planning-first`. `docs-as-code` defines the whole docs system; `planning-first` governs how the agent explores and proposes plans. `spec-driven` is the contract layer between intent and implementation.

## Pairs well with

- `planning-first` - once a spec exists, planning-first can turn it into a concrete execution plan without re-litigating scope in chat
- `docs-as-code` - spec-driven decides when a spec is required; docs-as-code provides the repo structure and doc conventions it should live in
- `quality-gates` - after implementation, quality-gates verifies the built result; spec-driven makes sure the team agreed what should be built in the first place
- `tdd` - once acceptance criteria are explicit in the spec, TDD can translate them into tests with less guesswork
