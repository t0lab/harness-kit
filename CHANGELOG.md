# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added

- **docs**: added `docs/product-specs/ROADMAP.md` to track near-term product direction
- **docs**: added `docs/releases/0.2.0-beta.11.md` as release train plan scaffold

### Changed

- **docs**: updated `CLAUDE.md` and `AGENTS.md` pointers to include roadmap and release-plan locations
- **docs**: revised roadmap/release docs to owner-provided beta.11 priorities (skill updates + active plan completion), removing auto-generated future direction
- **docs**: refreshed exec-plan statuses for beta.11 snapshot, moved `2026-04-13-cli-commands` from `active/` to `completed/`, and updated harness-web task checklist from repository evidence
- **docs**: added beta.11 scope for public harness-web blogs feature focused on vibe-coding recommendations

---

## [0.2.0-beta.10] — 2026-04-16

### Breaking Changes

- **registry**: `dev-integration` category and the `github` bundle have been removed — migrate affected bundles to `'mcp-tool'` or another appropriate category; `WizardContext.devIntegrations` field is gone

### Added

#### CLI & Wizard
- **cli**: new `list`, `add`, and `status` commands for managing installed bundles
- **cli**: IDE selection step in `add` workflow — harness is now scoped to your editor
- **wizard**: full Ink-based TUI rewrite — clack dependency fully removed
- **wizard**: tool install deferred to after the preview step; skill installs run in parallel with an accurate summary
- **commands/budget**: budget output redesigned with Ink components

#### Registry & Bundles
- **registry**: bundle definitions migrated from JSON to TypeScript — full type safety on bundle configs
- **registry**: MCP manifests wired for 10 integrations
- **registry**: new `stack` and `techstack` categories with corresponding artifact type
- **registry**: techstack bundles for TypeScript, Python, Go, Rust, Java, and NextJS
- **registry**: 13 framework bundles wired with specialist remote skills — React (Vercel best-practices), Vue, Supabase, PostgreSQL, Redis, GitHub Actions, Spring, LangChain, LangGraph, FastAPI, Fastify, Express, Django
- **bundles**: 21 workflow bundles fleshed out with skills, rules, and artifacts — `tdd`, `spec-driven`, `planning-first`, `quality-gates`, `security-review`, `code-review-gates`, `systematic-debugging`, `context-discipline`, `parallel-agents`, `pre-commit-hooks`, `conventional-commits`, `commit-signing`, `docs-as-code`, `playwright`, `mem0`, `mempalace`, `local-memory`, `no-memory`, `firecrawl`, `crawl4ai`, `tavily`

#### Engine & Installer
- **engine**: `agent`, `hook`, `git-hook`, and `plugin` artifact types now supported
- **engine**: `activate` command wires git-hook dispatcher (`.githooks/pre-commit.d/`) — bundles compose cleanly without overwriting each other
- **engine**: plugin artifacts install via `claude plugin` CLI
- **installer**: tool and skill artifacts execute interactively during install

#### Skills
- **skills**: `agent-browser`, `docs-as-code`, `bundle-creator`, `token-optimization`, `tui-design`, `ui-ux-pro-max`, `web-design-guidelines` added to the skill library
- **skills**: `skill-evaluator` subagent and meta-artifact review rule for self-auditing skills
- **code-review-gates**: reviewer agent added; receiving-review flow covered
- **security-review**: dedicated `security-reviewer` subagent
- **hooks**: pre-commit enforcement for quality gates and commit format

#### Web Docs
- **web**: harness-web docs portal launched with bundle browsing, README metadata validation, and redesigned onboarding

### Fixed

- **cli**: npx wrapper now resolves correctly when installed globally via symlink
- **wizard**: no more duplicate React crash when reopening wizard without restart
- **wizard**: Go and Rust removed from tech options (not yet supported); unknown bundle installs now surfaced explicitly
- **engine**: symlinks followed correctly in context-cost scanner
- **init**: plugin install now uses explicit commands instead of a generic installer
- **release**: pnpm-safe CLI package published correctly to npm
- **pre-commit-hooks**: gates tightened; test runner removed from pre-commit scope
- **playwright**: correct package is `@playwright/cli` (Microsoft's agent CLI), not bare `playwright`
- **registry**: workflow manifest import paths corrected

### Notes

> Refactors: wizard fully migrated from clack to Ink; registry reorganized into `workflow/` subfolder; skill triggers sharpened across brave-search, branch-strategy, context-discipline, commit-signing, crawl4ai, docs-as-code, local-memory, mem0; bundle descriptions trimmed for token efficiency.
> CI: GitHub Pages deployment added for harness-web at [harness-kit.liamlee.cloud](https://harness-kit.liamlee.cloud).
> Docs: restructured to Diátaxis layout.

---

[0.2.0-beta.10]: https://github.com/t0lab/harness-kit/commits/HEAD
