---
name: stack-java
description: Use when editing .java files. Loads Java coding style, patterns, testing, and security rules from .claude/rules/stack-java/ before making changes.
---

# Java — language base

Before editing Java code, read the rules in `.claude/rules/stack-java/`:

- `coding-style.md` — naming, file layout, types
- `patterns.md` — idioms and anti-patterns
- `testing.md` — test structure, framework conventions
- `security.md` — input validation, secret handling, common vulnerabilities

Apply these as the baseline; a selected framework (Next.js, FastAPI, Spring, ...) may layer additional rules on top.
