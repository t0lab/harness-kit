---
title: Redis
description: Your agent now follows Redis Engineering's own guidance for data structures, the Query Engine (RQE), vector search with RedisVL, semantic caching with LangCache, and performance tuning.
category: techstack
slug: redis
---
# Redis

Your agent now follows Redis Engineering's own guidance for data structures, the Query Engine (RQE), vector search with RedisVL, semantic caching with LangCache, and performance tuning.

## What it installs

| Artifact | Path (in your project) | Purpose |
|----------|------------------------|---------|
| Skill | `.agents/skills/redis-development/` | Protocol the agent follows on Redis work — sourced from [redis/agent-skills](https://github.com/redis/agent-skills/tree/main/skills/redis-development) |
| Rule | `.claude/rules/redis.md` | Always-loaded pointer: triggers on Redis data structures, RQE queries, RedisVL, LangCache, or perf work |

## How it works

Redis looks like a simple KV store until you hit production — wrong data structure choices (hashes vs. strings), missing TTLs, hot keys, unbounded lists, blocking commands on the main thread. The skill encodes Redis's own guidance: pick the right structure per access pattern, use RQE for secondary indexes instead of `KEYS *`, choose RedisVL for vector similarity, and use LangCache for LLM response caching.

The rule loads a pointer into every session, so the agent consults the skill before writing Redis client code or designing a keyspace — no explicit invocation needed.

## Setup

No env vars or external accounts required. The skill is fetched from GitHub during `harness-kit add` via `npx skills add`.

## Pairs well with

- `langchain` / `langgraph` — LangCache fits naturally on top of LLM pipelines
- `postgresql` — Redis as cache/queue in front of Postgres as source of truth
- `code-review-gates` — enforce TTL and blocking-command checks on every commit
