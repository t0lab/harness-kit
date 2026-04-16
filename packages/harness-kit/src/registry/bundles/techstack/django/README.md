---
title: Django
description: Your agent now works on Django projects across four specialized skills — architecture patterns, security, TDD with pytest-django, and pre-release verification loops.
category: techstack
slug: django
---
# Django

Your agent now works on Django projects across four specialized skills — architecture patterns, security, TDD with pytest-django, and pre-release verification loops.

## What it installs

| Artifact | Path (in your project) | Purpose |
|----------|------------------------|---------|
| Stack ref | *(inherits python bundle)* | Python coding style, typing, testing, and security rules |
| Skill | `.agents/skills/django-patterns/` | Architecture, DRF REST API design, ORM, caching, signals, middleware |
| Skill | `.agents/skills/django-security/` | Auth, authZ, CSRF, SQL injection, XSS, secure deployment |
| Skill | `.agents/skills/django-tdd/` | pytest-django, factory_boy, mocking, coverage, DRF testing |
| Skill | `.agents/skills/django-verification/` | Migrations, linting, tests, security scans, pre-release checks |
| Rule | `.claude/rules/django.md` | Always-loaded pointer: routes the agent to the right skill per task |

Skills sourced from [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code/tree/main/skills).

## How it works

Django is broad enough that a single skill would either be too shallow or too sprawling. This bundle splits the work by axis — patterns for design, security for hardening, TDD for test discipline, verification for the pre-merge gate — so the agent pulls in only the guidance that matches the current task. The rule tells it how to route.

Typical flow:
1. **Designing** a new view or model → `django-patterns`.
2. **Adding auth / exposing data** → `django-security` alongside.
3. **Writing code** → `django-tdd` for the test-first loop.
4. **Before PR / release** → `django-verification` runs the gate (migrations applied, lints clean, coverage met, security scans pass).

The rule loads a pointer into every session, so the agent reaches for the right skill automatically — no explicit invocation needed.

## Setup

No env vars or external accounts required. Skills fetched from GitHub during `harness-kit add` via `npx skills add`.

## Pairs well with

- `postgresql` — ORM query patterns on top of Postgres-native schema rules
- `code-review-gates` — enforces the `django-verification` loop on every commit
- `pre-commit-hooks` — runs lint / migration checks locally before push
