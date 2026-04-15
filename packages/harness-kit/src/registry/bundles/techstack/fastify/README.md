# fastify

Your agent now builds Fastify backends against best practices maintained by Fastify co-creator Matteo Collina — routes, plugins, JSON Schema validation, lifecycle hooks, Pino logging, security headers, and the full request lifecycle.

## What it installs

| Artifact | Path (in your project) | Purpose |
|----------|------------------------|---------|
| Stack ref | *(inherits typescript bundle)* | TypeScript coding style, patterns, testing, and security rules |
| Skill | `.agents/skills/fastify-best-practices/` | Protocol the agent follows on Fastify work — sourced from [mcollina/skills](https://github.com/mcollina/skills/tree/main/skills/fastify) |
| Rule | `.claude/rules/fastify.md` | Always-loaded pointer: triggers on any Fastify route, plugin, hook, or `app.ts` / `server.ts` work |

## How it works

Fastify rewards schema-first thinking and punishes Express-style improvisation. The skill encodes the canonical patterns: define routes with JSON Schema for validation **and** serialization speedup, encapsulate feature slices as plugins, use `onRequest` / `preHandler` / `onSend` hooks correctly, configure Pino for structured logs, set security headers, and integrate TypeScript via strip types.

The rule loads a pointer into every session, so the agent consults the skill before writing a route, plugin, hook, or auth/CORS config — no explicit invocation needed.

## Setup

No env vars or external accounts required. The skill is fetched from GitHub during `harness-kit add` via `npx skills add`.

## Pairs well with

- `postgresql` — async DB patterns fit naturally with Fastify's async route handlers
- `redis` — session / cache integration via Fastify plugins
- `code-review-gates` — enforce schema-first + plugin-encapsulation patterns on every commit
