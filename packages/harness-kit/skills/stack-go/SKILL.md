---
name: stack-go
description: Use when editing .go files. Loads Go coding style, patterns, testing, and security rules from .claude/rules/stack-go/ before making changes.
---

# Go — language base

Before editing Go code, read the rules in `.claude/rules/stack-go/`:

- `coding-style.md` — naming, file layout, types
- `patterns.md` — idioms and anti-patterns
- `testing.md` — test structure, framework conventions
- `security.md` — input validation, secret handling, common vulnerabilities

Apply these as the baseline; a selected framework (Next.js, FastAPI, Spring, ...) may layer additional rules on top.
