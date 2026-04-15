---
name: stack-typescript
description: Use when editing .ts/.tsx/.js/.jsx files. Loads TypeScript/JavaScript coding style, patterns, testing, and security rules from .claude/rules/stack-typescript/ before making changes.
---

# TypeScript/JavaScript — language base

Before editing TypeScript/JavaScript code, read the rules in `.claude/rules/stack-typescript/`:

- `coding-style.md` — naming, file layout, types
- `patterns.md` — idioms and anti-patterns
- `testing.md` — test structure, framework conventions
- `security.md` — input validation, secret handling, common vulnerabilities

Apply these as the baseline; a selected framework (Next.js, FastAPI, Spring, ...) may layer additional rules on top.
