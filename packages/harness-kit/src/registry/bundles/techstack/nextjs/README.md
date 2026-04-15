# nextjs

Your agent now follows Next.js App Router best practices — RSC boundaries, async APIs, data fetching patterns, error handling, and image/font optimization.

## What it installs

| Artifact | Path (in your project) | Purpose |
|----------|------------------------|---------|
| Stack ref | *(inherits typescript bundle)* | TypeScript coding style, patterns, testing, and security rules |
| Skill | `.agents/skills/next-best-practices/` | Protocol the agent follows when writing or reviewing Next.js code — sourced from [vercel-labs/next-skills](https://github.com/vercel-labs/next-skills) |
| Rule | `.claude/rules/nextjs.md` | Always-loaded pointer: tells the agent to consult the skill when working with Next.js files |

## How it works

Next.js App Router introduces patterns that trip up agents unfamiliar with RSC boundaries, async params/cookies in v15+, and the distinction between Server Components, Server Actions, and Route Handlers.

The `next-best-practices` skill encodes these rules: which component patterns are invalid, when to await `params`/`searchParams`, how to avoid data waterfalls, how to handle errors with `error.tsx` and `notFound()`, and when to use `next/image` vs `<img>`.

The rule loads a pointer into every session, so the agent checks the skill before writing any App Router code — no explicit invocation needed.

## Setup

No env vars or external accounts required. The skill is fetched from GitHub during `harness-kit add`.

## Pairs well with

- `tdd` — write failing tests before implementing server actions and route handlers
- `spec-driven` — design API contracts before wiring up route handlers
- `code-review-gates` — enforce RSC boundary and data-fetching checks before every commit
