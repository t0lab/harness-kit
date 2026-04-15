---
name: stack-rust
description: Use when editing .rs files. Loads Rust coding style, patterns, testing, and security rules from .claude/rules/stack-rust/ before making changes.
---

# Rust — language base

Before editing Rust code, read the rules in `.claude/rules/stack-rust/`:

- `coding-style.md` — naming, file layout, types
- `patterns.md` — idioms and anti-patterns
- `testing.md` — test structure, framework conventions
- `security.md` — input validation, secret handling, common vulnerabilities

Apply these as the baseline; a selected framework (Next.js, FastAPI, Spring, ...) may layer additional rules on top.
