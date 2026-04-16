---
title: Context Discipline
description: Context hygiene rules and task decomposition guide for Claude Code sessions.
category: workflow
slug: context-discipline
---
# Context Discipline

Context hygiene rules and task decomposition guide for Claude Code sessions.

## What it installs

| Artifact | Path (in your project) | Purpose |
|----------|----------------------|---------|
| Skill | `.agents/skills/context-discipline/` | Decomposition framework, session handoff, red flags |
| Rule | `.claude/rules/context-discipline.md` | Always-loaded: targeted reads, /compact and /clear triggers |

## The problem

Long sessions degrade. Context fills with stale errors, redundant file dumps, and abandoned reasoning threads. Large tasks attempted in one shot overflow context mid-implementation.

## What it enforces (rule — always active)

- **Targeted reads**: Grep first, then Read with offset/limit — never dump full files for partial changes
- **`/compact`** before large implementation phases
- **`/clear`** when switching to an unrelated task, or after 3+ failed attempts
- **Decompose before starting** any task that looks too large for one session

## Decomposition framework (skill — invoked for planning)

| Split by | When |
|----------|------|
| Type/interface boundary | New schemas before logic that uses them |
| Layer boundary | Data → logic → API → UI |
| Feature phase | Plan → core impl → tests → integration |
| File boundary | One module at a time |

Each chunk: reviewable diff (< 400 lines), clear done condition, codebase stays working.

## Red flags

The skill lists signals to stop and re-plan:
- Task "almost done" for 2+ sessions
- Same file read 3+ times in one session
- 4+ requirements added mid-session without re-scoping
- About to make a breaking change to fix another breaking change

## Pairs well with

- `memory-compact` skill — persists state at the end of each chunk for next-session handoff
- `planning-first` bundle — spec before implementation, same philosophy
- `code-review-gates` — small diff discipline enforced at commit time
