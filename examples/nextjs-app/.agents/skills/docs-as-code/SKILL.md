---
name: docs-as-code
description: Repository-as-system-of-record protocol for multi-step or decision-heavy work. Invoke when a task spans >=3 tracked tasks, changes architecture/module boundaries, introduces or reverses important technical decisions, affects release/governance docs, audits AGENTS.md/CLAUDE.md, sets up docs/, or asks where durable project context should live. Do not invoke for small single-task edits unless the user asks for doc hygiene.
---

# Docs-as-Code

**The repository is the system of record.** If a decision, plan, or constraint lives only in chat or someone's head, it doesn't exist for the agent.

---

## Context tiers

Design every doc for one tier. Hot docs crowd out the task, so they must earn every line.

| Tier | Loads | Budget | Examples |
|------|-------|--------|----------|
| **Hot** | Every session | < 200 lines total | `AGENTS.md`, `CLAUDE.md`, always-loaded rules |
| **Warm** | Task-specific | Thorough | `docs/exec-plans/active/`, `ARCHITECTURE.md` |
| **Cold** | On demand | Thorough, indexed | `docs/design-docs/`, `docs/references/` |

---

## Route to the right doc type

| Situation | Doc type | Location | Read |
|-----------|----------|----------|------|
| Plan ≥3 tasks, in progress | Exec plan | `docs/exec-plans/active/` | `references/exec-plan.md` |
| Completed plan | — | `docs/exec-plans/completed/` | `references/exec-plan.md` |
| Known tech debt / quirk | Tech debt entry | `docs/exec-plans/tech-debt-tracker.md` | `references/exec-plan.md` |
| Why a decision was made | Design doc / ADR | `docs/design-docs/<topic>.md` | `references/design-doc.md` |
| Product direction, non-goals | Product spec | `docs/product-specs/<feature>.md` | `references/design-doc.md` |
| How to use a library correctly | Reference | `docs/references/<lib>-llms.txt` | `references/agent-readable.md` |
| Module map, dependency direction | Architecture | `ARCHITECTURE.md` | `references/doc-structure.md` |
| Setting up docs/ from scratch | All | — | `references/doc-structure.md` |
| Writing or auditing AGENTS.md | Hot doc discipline | `AGENTS.md` | `references/agents-md.md` |

When in doubt: write an ADR. Decisions are the highest-value thing to capture — code shows *what*, only docs show *why*.

---

## Trigger guardrails

Invoke this skill when at least one is true:
- Work is multi-step (>=3 tracked tasks) or spans more than one module
- A design or architecture decision must be captured
- Refactor risk can stale docs/config boundaries
- Release/governance expectations changed
- User asks where to document durable context

Do not invoke this skill for:
- Single-file, single-task implementation edits
- Pure bug fixes with no decision/process change
- Cosmetic doc edits that do not affect process or architecture

If unsure, use a lightweight check: "Will missing docs likely cause the next agent to make a wrong decision?" If yes, invoke.

---

## Divergence rule

Docs that contradict code are a critical failure — an agent following stale docs confidently implements the wrong thing. **Trust the code, fix the doc.**

Triggers for a doc sweep:
- Renamed function, class, or type
- Moved file or changed module boundary
- Reversed decision
- Completed exec plan task

After **any refactor**, read `references/freshness-refactor.md`. It covers the full surface: `docs/`, `AGENTS.md`, `ARCHITECTURE.md`, JSDoc in source, test descriptions, tsconfig paths, `package.json` exports, barrel files. This is where agents most often miss things.

---

## Repo maturity profiles (fallback behavior)

Adapt protocol to repository maturity to avoid process overkill:

- **Startup/minimal repo**
  - Required: `AGENTS.md`, `ARCHITECTURE.md`, `CHANGELOG.md`
  - Required when applicable: `docs/exec-plans/active/<initiative>.md`, one ADR in `docs/design-docs/`
  - Optional until needed: roadmap, release plans, evaluations, governance docs

- **Growing repo**
  - Add `docs/product-specs/ROADMAP.md`
  - Add `docs/exec-plans/tech-debt-tracker.md`
  - Add governance docs once external contributors or on-call/support exists

- **Mature/enterprise repo**
  - Maintain full standard set in `references/standards-docs.md`
  - Treat missing/stale governance docs as release blockers

If a referenced file does not exist, create minimum scaffold first, then continue implementation.

---

## Hotfix exception policy

For urgent production hotfixes, implementation may proceed before full docs updates if and only if:
- The hotfix PR includes a follow-up docs task in the active exec plan
- `CHANGELOG.md` is updated before release
- Decision changes are captured in ADR within the same release train

Default remains docs-coupled development; this exception is for time-critical incidents only.

---

## Reference index

Load one or two at a time — don't load everything.

- **`references/doc-structure.md`** — `docs/` layout, initial scaffolding, ARCHITECTURE.md conventions
- **`references/exec-plan.md`** — exec plan template, committable-unit task rule, tech debt entry format, active → completed lifecycle
- **`references/design-doc.md`** — ADR template with Better/Worse/Must-now-be-true, rejected alternatives, product spec structure
- **`references/agent-readable.md`** — concrete-over-abstract, symptom→cause→fix tables, library reference files
- **`references/agents-md.md`** — what belongs in AGENTS.md, 100-line target, anti-patterns
- **`references/freshness-refactor.md`** — post-refactor checklist across docs, source JSDoc, configs, barrels, tests; completed-plan annotation rule
