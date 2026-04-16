---
title: FastAPI
description: Your agent now scaffolds and reviews FastAPI applications against production-ready templates — async patterns, dependency injection, Pydantic models, middleware, and comprehensive error handling.
category: techstack
slug: fastapi
---
# FastAPI

Your agent now scaffolds and reviews FastAPI applications against production-ready templates — async patterns, dependency injection, Pydantic models, middleware, and comprehensive error handling.

## What it installs

| Artifact | Path (in your project) | Purpose |
|----------|------------------------|---------|
| Stack ref | *(inherits python bundle)* | Python coding style, typing, testing, and security rules |
| Skill | `.agents/skills/fastapi-templates/` | Protocol the agent follows when scaffolding or extending FastAPI projects — sourced from [wshobson/agents](https://github.com/wshobson/agents/tree/main/plugins/api-scaffolding/skills/fastapi-templates) |
| Rule | `.claude/rules/fastapi.md` | Always-loaded pointer: triggers on any FastAPI route, dependency, or model work |

## How it works

FastAPI projects age badly when the early decisions are wrong — sync routes inside an async stack, dependency scopes chosen by accident, error handlers glued on after the fact. The skill encodes a production-shaped template: consistent project layout, properly async routes + DB calls, typed `Depends()` with clear scope, Pydantic v2 models with validation, middleware for cross-cutting concerns, and a unified exception handler.

The rule loads a pointer into every session, so the agent consults the skill before writing a new router, `Depends`, or Pydantic model — no explicit invocation needed.

## Setup

No env vars or external accounts required. The skill is fetched from GitHub during `harness-kit add` via `npx skills add`.

## Pairs well with

- `postgresql` — async SQLAlchemy / asyncpg patterns that match the template's async design
- `supabase` — when Postgres + auth + storage is your backend
- `code-review-gates` — enforce async discipline and Pydantic validation on every commit
