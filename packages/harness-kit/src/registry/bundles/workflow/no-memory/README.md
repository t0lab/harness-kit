---
title: No Memory
description: Explicit opt-out of persistent memory. Installs a short rule telling the agent that no memory backend exists in this project — so it stops trying (or pretending) to use one.
category: workflow
slug: no-memory
---
# No Memory

Explicit opt-out of persistent memory. Installs a short rule telling the agent that no memory backend exists in this project — so it stops trying (or pretending) to use one.

## What it installs

| Artifact | Path (in your project) | Purpose |
|----------|-----------------------|---------|
| Rule | `.claude/rules/no-memory.md` | One-paragraph directive: no `search_memories`/`add_memory` tools available, rely on conversation context + repo files + git history |

## Why opt out explicitly

Picking "no memory" in the wizard could just leave the slot empty — but then nothing documents the choice, and a future agent (or teammate) might install a memory bundle out of habit. Installing `no-memory` makes the decision explicit and visible in `harness.json` + `.claude/rules/`.

It also prevents a subtle failure mode: without the rule, an agent may hallucinate memory tools or plan workflows assuming a memory MCP is available. The rule short-circuits that.

## When to choose this

- Single-session / throwaway projects where memory wouldn't pay off
- Strict context hygiene workflows where every fact should come from the repo, not an opaque vector store
- Compliance / data-residency reasons that forbid third-party memory services

If you later want memory, `harness-kit add mem0` (or `mempalace`, `local-memory`) — they'll replace `no-memory` in `harness.json`.

## Pairs well with

- `docs-as-code` — the natural complement: if memory isn't an option, documentation *is* the memory. Writing decisions into `docs/` becomes the discipline.
- `context-discipline` — both push the same philosophy: keep the agent working from fresh, observable sources rather than cached state.
