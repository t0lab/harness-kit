---
title: LangChain
description: Your agent now builds LangChain apps using the modern agent runtime — `create_agent()`, `@tool` decorator, middleware for custom flows, and standard patterns for human-in-the-loop and error handling. Sourced from LangChain AI.
category: techstack
slug: langchain
---
# LangChain

Your agent now builds LangChain apps using the modern agent runtime — `create_agent()`, `@tool` decorator, middleware for custom flows, and standard patterns for human-in-the-loop and error handling. Sourced from LangChain AI.

## What it installs

| Artifact | Path (in your project) | Purpose |
|----------|------------------------|---------|
| Skill | `.agents/skills/langchain-fundamentals/` | Protocol the agent follows on LangChain work — sourced from [langchain-ai/langchain-skills](https://github.com/langchain-ai/langchain-skills/tree/main/config/skills/langchain-fundamentals) |
| Rule | `.claude/rules/langchain.md` | Always-loaded pointer: mandates `create_agent()` + middleware, triggers on any LangChain import |

## How it works

LangChain has churned through many agent abstractions (`AgentExecutor`, `LCEL`, `OpenAIAgent`, ...). Most tutorials and older training data still reference deprecated patterns. The skill locks the agent onto the current, supported path: `create_agent()` for the runtime, `@tool` / `tool()` for tools, middleware for anything custom (retries, approval gates, logging), and documented streaming + error handling.

The rule loads a pointer into every session, so the agent consults the skill before writing imports from `langchain` / `@langchain/core` — no explicit invocation needed.

## Setup

No env vars or external accounts required for the skill. Your provider API keys (OpenAI, Anthropic, etc.) are still needed to actually run agents. Skill fetched from GitHub during `harness-kit add` via `npx skills add`.

## Pairs well with

- `langgraph` — graph-based orchestration on top of LangChain agents
- `redis` — LangCache for LLM response caching
- `code-review-gates` — enforce middleware + error-handling patterns on every commit
