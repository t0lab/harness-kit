# express

Your agent now builds production-ready Express servers — middleware stacks, routing, authentication, robust error handling, and database integration patterns for REST APIs.

## What it installs

| Artifact | Path (in your project) | Purpose |
|----------|------------------------|---------|
| Skill | `.agents/skills/nodejs-express-server/` | Protocol the agent follows on Express work — sourced from [aj-geddes/useful-ai-prompts](https://github.com/aj-geddes/useful-ai-prompts/tree/main/skills/nodejs-express-server) |
| Rule | `.claude/rules/express.md` | Always-loaded pointer: triggers on any Express router, middleware, or server setup work |

## How it works

Express is unopinionated — which means agents keep inventing project structures, forgetting error middleware, and scattering auth logic across handlers. The skill locks in a production shape: layered middleware (security → parsing → auth → routes → error handler), centralized error handling via `next(err)` and a dedicated handler, input validation, sensible defaults for CORS / helmet / rate limiting, and consistent patterns for DB access.

The rule loads a pointer into every session, so the agent consults the skill before writing a router, middleware, or auth logic — no explicit invocation needed.

## Setup

No env vars or external accounts required. The skill is fetched from GitHub during `harness-kit add` via `npx skills add`.

## Pairs well with

- `postgresql` / `redis` — database and cache integration patterns
- `code-review-gates` — enforce middleware ordering and error-handler presence on every commit
- `spec-driven` — design REST contracts before wiring routes
