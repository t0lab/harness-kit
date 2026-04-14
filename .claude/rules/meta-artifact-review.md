# Meta-Artifact Review

When reviewing, editing, or evaluating markdown files that define agent behavior — **skills** (`.claude/skills/**/SKILL.md`, `.agents/skills/**/SKILL.md`), **subagents** (`.claude/agents/*.md`, `packages/harness-kit/agents/*.md`), or **rules** (`.claude/rules/*.md`, `packages/harness-kit/rules/*.md`) — invoke both skills below in the same pass:

- **`skill-creator`** — judges triggering, scope, actionability, structure, collision with sibling skills/agents, and risk of misleading claims.
- **`token-optimization`** — audits token density: removes filler, tightens instructions, flags sections that don't earn their tokens. These files run on *every* invocation they trigger, so waste compounds.

## Why

Skill/agent/rule files are loaded into model context and shape behavior everywhere. A vague trigger wastes calls; an oversized body wastes tokens forever. One-time editing doesn't justify one-time review — both quality axes matter.

## How to apply

1. When the user asks to "review", "evaluate", "audit", or "improve" a file of this kind — run both lenses, not just one.
2. When authoring a new skill/agent/rule — draft, then self-review through both skills before declaring done.
3. Report findings together: triggering/content issues (skill-creator) alongside token-density issues (token-optimization), so edits can be batched.
4. Do **not** blindly minimize tokens at the cost of clarity — `token-optimization`'s own rule ("don't over-compress to the point of ambiguity") governs. If the two lenses conflict, clarity wins; flag the tradeoff for the user.
