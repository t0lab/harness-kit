---
name: planning-first
description: Brainstorm → spec → approval → plan → implement. Invoke before any multi-step, multi-file, or architecturally-novel task, and whenever the user says "implement X", "build Y", "add a feature", "refactor Z". Do NOT skip to code — every non-trivial task passes through this gate first.
tags: [planning, brainstorming, spec, design, workflow]
---

# Planning First

Write the plan before the code. Most wasted work comes from implementing the wrong thing, or the right thing in a way that won't survive review — both are planning failures, not coding failures.

This skill has **two modes**, gated by task size:

- **Light** — single-file change, obvious shape, ≤30 minutes of work. Skip to implementation; no spec, no approval gate.
- **Full** — anything else. Follow the 5 phases below.

When in doubt, go Full. The cost of an unnecessary plan is minutes; the cost of a wrong implementation is hours.

---

## Phase 1 — Explore first

Do **not** ask questions or propose approaches before reading the code. Planning against the wrong mental model produces a perfect plan that solves the wrong problem.

Before anything else:

- Read the relevant files (Grep to locate, Read with offset/limit for targeted sections)
- Scan recent commits in the area (`git log -- <path>`) for context on recent decisions
- Skim `docs/` and `CLAUDE.md` / `AGENTS.md` for existing conventions
- Check if a similar feature already exists — reuse > invent

Only then start asking questions.

---

## Phase 2 — Clarify, one question at a time

**One question per message.** Don't batch. Don't bundle a question with a summary. Don't ask an open-ended question when a multiple-choice works.

Ask about, in priority order:
1. **Purpose** — what problem does this solve, who's the user, what's the success criterion?
2. **Constraints** — performance budgets, API compatibility, security, deadlines
3. **Scope boundaries** — explicitly what's in and what's out

If the task spans multiple independent subsystems, **stop and decompose first** — propose splitting it into separate planning passes. A single plan that crosses unrelated subsystems is almost always too coarse.

---

## Phase 3 — Propose 2–3 approaches with trade-offs

Don't lock in the first idea. Put 2–3 viable approaches on the table with honest trade-offs, and **lead with your recommendation and why**.

Format:

> **Recommendation: Approach A** — <one-sentence reason>
>
> - **A. <name>** — how it works, pros, cons
> - **B. <name>** — how it works, pros, cons
> - **C. <name>** (optional) — how it works, pros, cons

Let the user pick or redirect. Do not write the plan until an approach is chosen.

---

## Phase 4 — Write the plan

A plan is **immediately actionable**. No placeholders, no hand-waving.

Required sections:

1. **Goal** — one sentence, verifiable
2. **Context / architecture** — 2–3 sentences, where this sits in the system
3. **Requirements / success criteria** — bulleted, each independently checkable
4. **Tasks, grouped into phases** — each phase independently mergeable
5. **Per task**: exact file paths, concrete code sketches (not "add validation"), commands with expected output, dependencies on prior tasks, risks
6. **Testing strategy** — per phase
7. **Risks & mitigations**

Red flags to scrub before calling it done:

- "TBD", "TODO", "add X", "handle edge cases", "similar to Task N"
- Forward references to symbols no earlier task defines
- Tasks that span multiple unrelated files
- Signatures that don't match between tasks

For larger work, save the plan to `docs/exec-plans/active/<name>.md` so it survives the session.

---

## Phase 5 — Gate, then implement

**Hard gate: do not write implementation code, scaffold files, run installers, or touch the filesystem outside the plan doc until the user approves the plan.** This applies to "simple" projects too — simple projects hide the unexamined assumption.

When presenting the plan, ask for explicit approval. Don't treat silence or "sure" as a green light if the plan is non-trivial; confirm.

After approval:

- Work phase by phase
- At each phase boundary, re-open the plan — check off what's done, flag what changed
- If reality diverges from the plan, **pause and update the plan** before continuing. Don't let code and plan drift.

---

## Anti-patterns

| Anti-pattern | Why it fails |
|--------------|--------------|
| "This is too simple to plan" | The assumptions you didn't examine are the ones that bite |
| Planning before reading the code | Plan references wrong files, wrong patterns, non-existent helpers |
| Batched clarifying questions | User answers one, ignores the others, plan proceeds on half-context |
| Single-approach plan | First idea locked in without seeing alternatives |
| Placeholder tasks | "add error handling" — no test, no diff, no way to verify |
| Self-approval | Exiting the gate without explicit user signoff |
| Plan-code drift | Phase 3 diverged from the plan; subsequent phases compound the mismatch |
| Over-planning | 200-line plan for a 5-line fix — wastes a session's attention budget |
