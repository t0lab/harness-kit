---
title: LangGraph
description: Your agent now models LangGraph workflows as directed graphs correctly — `StateGraph`, state schemas, nodes, edges, `Command`, `Send`, `invoke`, streaming, and error handling. Sourced from LangChain AI.
category: techstack
slug: langgraph
---
# LangGraph

Your agent now models LangGraph workflows as directed graphs correctly — `StateGraph`, state schemas, nodes, edges, `Command`, `Send`, `invoke`, streaming, and error handling. Sourced from LangChain AI.

## What it installs

| Artifact | Path (in your project) | Purpose |
|----------|------------------------|---------|
| Skill | `.agents/skills/langgraph-fundamentals/` | Protocol the agent follows on LangGraph work — sourced from [langchain-ai/langchain-skills](https://github.com/langchain-ai/langchain-skills/tree/main/config/skills/langgraph-fundamentals) |
| Rule | `.claude/rules/langgraph.md` | Always-loaded pointer: triggers on any LangGraph import, `StateGraph`, or graph node/edge work |

## How it works

LangGraph's power is also its footgun: graphs compose beautifully when state schemas, node signatures, and control flow (`Command`, `Send`) are right — and fail opaquely when they aren't. The skill encodes the canonical patterns: declaring state via `TypedDict` / Pydantic, adding nodes + conditional edges, using `Command` for explicit state + routing, using `Send` for map-reduce, wiring checkpointers for persistence, and streaming events to clients.

The rule loads a pointer into every session, so the agent consults the skill before writing any `StateGraph` or node function — no explicit invocation needed.

## Setup

No env vars or external accounts required for the skill. Provider API keys needed to run the underlying LLMs. Skill fetched from GitHub during `harness-kit add` via `npx skills add`.

## Pairs well with

- `langchain` — `create_agent()` runtime for individual nodes
- `redis` — checkpointer storage for durable graph state
- `code-review-gates` — enforce state-schema and edge-condition checks on every commit
