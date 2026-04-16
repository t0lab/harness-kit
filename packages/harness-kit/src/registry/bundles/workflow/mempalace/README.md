---
title: MemPalace
description: Local, offline long-term memory for your agent — a spatial palace (wings → rooms → halls) of verbatim memories retrieved by semantic search + metadata filter. No API keys, no cloud, no LLM calls on write.
category: workflow
slug: mempalace
---
# MemPalace

Local, offline long-term memory for your agent — a spatial palace (wings → rooms → halls) of verbatim memories retrieved by semantic search + metadata filter. No API keys, no cloud, no LLM calls on write.

## What it installs

| Artifact | Path (in your project) | Purpose |
|----------|-----------------------|---------|
| Plugin | Claude Code plugin marketplace → `MemPalace/mempalace` | Ships ~29 MCP tools (`search_memories`, `add_memory`, `wake_up`, `recall_room`, …) plus a Claude Code skill teaching wing/room/hall scoping |

## How it works

MemPalace stores memories as verbatim chunks in a local [ChromaDB](https://www.trychroma.com/) vector store at `~/.mempalace/palace`. Memories are organized spatially:

- **Wing** — coarse domain (e.g. `code`, `convos`, `life`)
- **Room** — topic (e.g. `auth-migration`)
- **Hall** — memory type (fixed set: facts, events, discoveries, preferences, advice)

Retrieval quality hinges on scoping: unfiltered semantic search is ~61% R@10, but passing `wing` + `room` filters pushes it to ~95%. The plugin ships a skill that teaches the agent to always scope, pick the right hall on write, and store raw text (not summaries) — that last part is what lets MemPalace report 96.6% on LongMemEval R@5 in raw mode.

Because everything is local, there's no API cost per turn and nothing leaves your machine. The trade-off: memories don't sync across devices without manually copying `~/.mempalace/palace`.

## Setup

`harness-kit add mempalace` records the bundle but does not run Claude Code's plugin installer. Complete the install yourself:

```
claude plugin marketplace add MemPalace/mempalace
claude plugin install --scope project mempalace
```

Restart Claude Code after install. Project scope means the plugin loads when Claude Code is opened inside this repo — matching how `harness.json` declares bundles per-project. On first use the plugin will initialize `~/.mempalace/palace`.

(Optional, one-time) Bootstrap the palace with existing project/chat history before you start chatting:

```
uvx mempalace init ~/my-project
uvx mempalace mine ~/my-project --mode projects
```

After mining, the agent reads/writes via MCP — you don't run the CLI again.

**Requires:** Python 3.10+ available on `PATH`. No Docker, no API keys.

## Sharing memory across a team

Don't. MemPalace is per-developer by design — the palace at `~/.mempalace/palace` captures how *you* work, not team canon. Trying to share it via git (committing ChromaDB files) produces merge hell and forces embedding-model lockstep across the team; trying to share via a remote ChromaDB defeats the zero-infra promise (at that point `mem0` hosted is cheaper).

If you need team-shared facts/decisions, put them in `docs/` (see `docs-as-code`) — that's the system of record. Memory is for personalizing the agent's working context, not for substituting documentation.

## Pairs well with

- `context-discipline` — MemPalace makes retrieval cheap, so you can run leaner system prompts and pull facts on demand.

## Not to be confused with

- `mem0` — hosted cloud memory with LLM-based extraction. Opposite trade-off: mem0 extracts facts for you but requires an API key and network calls per add/search; MemPalace stores verbatim locally but asks you to scope writes correctly.
- `claude-mem` — another Claude Code plugin for session memory, but hybrid semantic + keyword with heavier runtime (Bun + Chrome). Pick one primary memory system; using multiple fragments recall.
