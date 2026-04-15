# supabase

Your agent now follows Supabase's own guidance for Database, Auth, RLS, Edge Functions, Realtime, Storage, and SSR client libraries (`supabase-js`, `@supabase/ssr`) — sourced from Supabase Engineering.

## What it installs

| Artifact | Path (in your project) | Purpose |
|----------|------------------------|---------|
| Skill | `.agents/skills/supabase/` | Protocol the agent follows on any Supabase task — sourced from [supabase/agent-skills](https://github.com/supabase/agent-skills/tree/main/skills/supabase) |
| Rule | `.claude/rules/supabase.md` | Always-loaded pointer: triggers on any Supabase product, client lib, auth flow, schema change, or CLI/MCP work |

## How it works

Supabase has enough surface area — Postgres + RLS + Auth + Edge Functions + Realtime + Storage + multiple SSR integrations — that agents consistently get one layer wrong. Common failures: returning session data client-side when it should be server-only, writing RLS that silently bypasses itself, using `getSession()` where `getUser()` is required, or wiring cookies incorrectly in Next.js/SvelteKit/Remix.

The skill encodes Supabase's own recommendations per product and per framework, so the agent picks the correct auth helper, RLS pattern, or client init for the stack it's actually working in.

The rule loads a pointer into every session, so any mention of Supabase, auth, RLS, or `@supabase/*` packages causes the agent to consult the skill before writing code.

## Setup

No env vars or external accounts required for the skill itself. Your Supabase project will of course need its own `SUPABASE_URL` / anon key — the skill guides you through wiring those correctly.

The skill is fetched from GitHub during `harness-kit add` via `npx skills add`.

## Pairs well with

- `nextjs` / `react` / `vue` — the skill has framework-specific SSR and auth patterns that layer on top of these bundles
- `postgresql` — for deeper Postgres patterns beyond what RLS covers
- `code-review-gates` — enforce RLS and auth checks on every commit
