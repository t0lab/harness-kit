---
name: decisions
type: project
created: 2026-04-14
last-updated: 2026-04-15
---

# Architectural Decisions

## Distribution & packaging

- **Copy-own distribution (shadcn model)** — artifacts copied into user repo; no runtime dep on `@harness-kit/cli`.
- **`@harness-kit/core` published separately** — foundation for plugin ecosystem; zero backwards-compat cost at v0.1.x.
- **`sourcemap: false` in tsup** — prevents source leakage in published packages.
- **Unscoped `harness-kit` name permanently blocked on npm** (too similar to `harnesskit`). Use scoped `@harness-kit/*`.

## Architecture

- **Everything is a bundle** — wizard fully data-driven from registry; adding a bundle never touches wizard code.
- **`BundleManifest` = `common` + `roles`** — `common.artifacts` shared across roles; role keys are `BundleCategory` values.
- **Copy-type artifacts declare only `src`** — no `dest`; installer derives destination. Applies to rule, hook, agent, command, file, skill.
- **Centralized local artifacts** — `packages/harness-kit/{skills,rules,agents,git-hooks}/` shared across bundles, not per-bundle dirs.
- **Rule as router** — rules are always-loaded pointers to installed skills; never inline skill content (pays token cost on every call).
- **Layered enforcement** — skill teaches, rule reminds, hook blocks. Example: `git-conventional` skill + `git-workflow.md` rule + `commit-msg` hook.
- **Workflow-preset bundles ship skill + rule pair** — quality-gates, security-review, spec-driven, systematic-debugging, tdd.
- **config/ layer owns `harness.json` and `.mcp.json` I/O** — no other layer reads/writes these files.
- **Wizard uses xstate v5** — BACK navigation requires formal state machine.

## Artifact authoring

- **Skill/agent frontmatter: only `name` + `description`** — `tags:` is non-standard; triggering is driven entirely by description.
- **Skill trigger descriptions must be concrete** — "same file read 3+ times" beats "when context feels bloated". Model cannot self-detect vague cues.
- **Rule text must be conditional** — "when this project enforces X" not "this project requires X", so bundle can install for learning before enforcement.
- **Prefer remote skill refs over local copies** — upstream owns improvements; only copy when upstream is abandoned/poor quality or needs material edits. (See local `feedback_bundle_skill_sources.md` memory.)

## Tool choice

- **CLI + skill preferred over MCP** for browser/tools — skill is lazy-loaded while MCP schema is always in context. MCP only when no CLI alternative.
- **`browser-use` switched from MCP → tool+skill** — upstream MCP hardcoded gpt-4o (redundant LLM, double cost).
- **`claude-mem` is AGPL-3.0** — only the `ragtime/` subdir is PolyForm NC.

## CLI UX

- **`list --category` filters by `defaultRole`** not by registry directory.
