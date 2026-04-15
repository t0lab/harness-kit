---
name: stack-python
description: Use when editing .py files. Loads Python coding style, patterns, testing, and security rules from .claude/rules/stack-python/ before making changes.
---

# Python — language base

Before editing Python code, read the rules in `.claude/rules/stack-python/`:

- `coding-style.md` — naming, file layout, types
- `patterns.md` — idioms and anti-patterns
- `testing.md` — test structure, framework conventions
- `security.md` — input validation, secret handling, common vulnerabilities

Apply these as the baseline; a selected framework (Next.js, FastAPI, Spring, ...) may layer additional rules on top.
