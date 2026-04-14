# Docs-as-Code

The repository is the system of record. If a decision, plan, or constraint isn't in the repo, it doesn't exist for the agent.

- Before starting any feature with ≥3 tasks: create or update a plan in `docs/exec-plans/active/`
- Exec plan tasks must be committable units with observable done conditions — not week/phase buckets
- Any architectural decision worth disagreeing about: write an ADR in `docs/design-docs/` with Context, Decision, Alternatives, and Consequences (Better / Worse / Must now be true)
- After a refactor, stale docs are actively harmful. Grep for old names across `docs/`, `AGENTS.md`, `ARCHITECTURE.md`, JSDoc in source, test descriptions, tsconfig paths, `package.json` exports, and barrel files until only intentional hits remain
- Completed exec plans are historical record: annotate with a dated note, never rewrite the body
- `AGENTS.md` is a table of contents, not an encyclopedia — target ~100 lines, hard ceiling 150

Invoke the `docs-as-code` skill for templates, full checklists, and the reference library (doc-structure, exec-plan, design-doc, agent-readable, agents-md, freshness-refactor).
