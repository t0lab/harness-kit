---
name: docs-as-code
description: >
  Write and maintain technical documentation for harness-kit following the project's docs-as-code
  conventions. Trigger when: user wants to add a spec, exec plan, library reference, tech debt
  entry, or update architecture-overview; when starting a new feature implementation; when code
  has changed but docs haven't caught up; when asked "where should I document this?". This skill
  ensures every technical decision lives in the repo — not in people's heads, not in Slack.
tags: [docs, documentation, spec, planning]
---

# Docs-as-Code

The repository is the system of record. If it's not in the repo, it doesn't exist for the agent.

This skill guides you to the right doc type, right location, and right structure. Read `CLAUDE.md` → `## Docs` first if you're not sure where to start.

---

## Context tiers

Documentation in this project is designed for three loading patterns:

| Tier | What gets loaded | When | Examples |
|------|-----------------|------|---------|
| **Hot** | Always in agent context | Every session | `CLAUDE.md`, `AGENTS.md` |
| **Warm** | Loaded for specific tasks | When working on that feature/layer | `docs/exec-plans/active/`, `ARCHITECTURE.md` |
| **Cold** | Read on demand | When the agent explicitly needs it | `docs/references/`, `docs/design-docs/` |

Write docs to match their tier. Hot docs must be dense and short. Cold docs can be thorough.

---

## Route to the right doc type

| I need to record... | Type | Read |
|---|---|---|
| Implementation plan for a feature (≥ 3 tasks) | Exec plan | `references/exec-plans.md` |
| Known technical debt or edge-case quirk | Tech debt entry | `references/exec-plans.md` |
| Why an architectural decision was made | Decision record | `references/design-docs.md` |
| API surface of a new or changed module | Architecture overview update | `references/design-docs.md` |
| How to correctly use a library in this project | Library reference | `references/lib-references.md` |
| Product direction, phases, non-goals | Product design update | `references/product-design.md` |

---

## What makes a doc agent-readable

Concrete over abstract — one real code snippet outweighs three paragraphs. Executable commands over tool names (`pnpm test --filter harness-kit` not "run tests"). Symptom → cause → fix tables for known failure modes. Every line earns its place: if you can't point to a past agent mistake that this line prevents, cut it.

See `references/principles.md` for the full research-backed principles.

---

## Language rule (applies to all docs in this project)

Docs in this project are written in Vietnamese with English for code, paths, and library names. This is a project convention, not a skill convention — the skill itself is English, but the docs you write using this skill should follow the project's bilingual pattern.

---

## Freshness rule

Before committing any doc:

1. **File paths** — `Glob` to confirm the file exists
2. **Function names** — `Grep` to confirm the name matches source
3. **Line numbers** (tech-debt entries) — re-check with `Grep`; they shift as code evolves
4. **Completed exec plans** — move from `active/` to `completed/`, update status field

---

## After writing

See `references/related-skills.md` — which skills to invoke after docs work (commit message format, session memory).
