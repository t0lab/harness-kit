---
title: Vue
description: Your agent now writes and reviews Vue 3 code following a vetted Composition API workflow — `<script setup>` with TypeScript, Pinia for state, Vue Router patterns, SSR, and Vite conventions.
category: techstack
slug: vue
---
# Vue

Your agent now writes and reviews Vue 3 code following a vetted Composition API workflow — `<script setup>` with TypeScript, Pinia for state, Vue Router patterns, SSR, and Vite conventions.

## What it installs

| Artifact | Path (in your project) | Purpose |
|----------|------------------------|---------|
| Stack ref | *(inherits typescript bundle)* | TypeScript coding style, patterns, testing, and security rules |
| Skill | `.agents/skills/vue-best-practices/` | Protocol the agent follows when writing or reviewing Vue code — sourced from [hyf0/vue-skills](https://github.com/hyf0/vue-skills/tree/main/skills/vue-best-practices) |
| Rule | `.claude/rules/vue.md` | Always-loaded pointer: defaults the agent to Composition API + `<script setup>` and tells it to consult the skill on any Vue work |

## How it works

Vue's biggest trap for agents is legacy drift — mixing Options API, `defineComponent`, and Composition API in the same codebase, or reaching for patterns that don't compose well with `<script setup>`. The skill encodes a single default: Composition API + `<script setup>` + TypeScript, with concrete guidance for reactivity, components, Pinia stores, Vue Router, SSR, and Vite.

When the agent touches `.vue` files, Pinia stores, or Router config, it consults the skill before suggesting patterns — catching stale syntax, wrong reactivity primitives (`ref` vs `reactive`), and SSR hydration bugs.

The rule loads a pointer into every session, so the agent reaches for the skill automatically — no explicit invocation needed.

## Setup

No env vars or external accounts required. The skill is fetched from GitHub during `harness-kit add` via `npx skills add`.

## Pairs well with

- `tdd` — pair with Vue Testing Library / Vitest for component tests before refactoring
- `code-review-gates` — enforce Composition API conventions on every commit
- `spec-driven` — design component contracts (props, emits) before wiring reactivity
