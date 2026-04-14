# planning-first

Installs the brainstorm-then-plan-then-execute discipline — the habit of exploring the code, asking one clarifying question at a time, putting 2–3 approaches on the table with trade-offs, waiting for explicit approval before touching the filesystem, and then executing the approved plan with proper verification gates between tasks.

## What it installs

| Artifact | Path (in your project) | Purpose |
|----------|-----------------------|---------|
| Skill | `.agents/skills/planning-first/` | 5-phase protocol: explore → clarify → propose approaches → write plan → gate-and-execute (with critique, per-task verification, stop-on-failure, divergence handling) |
| Rule | `.claude/rules/planning-first.md` | Always-loaded gate — no implementation code until the plan is approved; one clarifying question per message; stop-on-failure during execution |

## How it works

Most wasted agent sessions come from implementing the wrong thing fast, not from implementing the right thing slow. This bundle inverts the default — the agent **plans first, then codes**, and the plan is a real artifact the user can redirect before any code is written.

The rule stays in context at all times and enforces the hard gate. The skill adds the structure:

1. **Explore first.** Read the code, scan recent commits, check existing conventions — *before* asking questions. Planning against the wrong mental model produces a perfect plan that solves the wrong problem.
2. **One clarifying question per message.** No batching. Purpose → constraints → scope.
3. **2–3 approaches with trade-offs.** Recommendation leads; alternatives are honest. User picks before the plan is written.
4. **Write an actionable plan.** Exact file paths, concrete code sketches, per-phase testing — no "TBD" / "add X" / "handle edge cases".
5. **Hard gate on approval, then disciplined execution.** No filesystem writes outside the plan doc until the user signs off (applies to "simple" projects too). After approval: critique the plan with fresh eyes, never run on `main`, verify after every task, stop on failure, update the plan first if reality diverges.

A **Light mode** escape exists for trivial single-file work (≤30 min, obvious shape) — the bundle is not dogmatic; it's dogmatic about non-trivial work.

## When it fires

- Any "implement X", "build Y", "add a feature", "refactor Z" request
- Multi-file changes, architectural decisions, new abstractions
- Anything where the user would be annoyed if the agent guessed wrong and burned an hour

## Pairs well with

- `spec-driven` — if spec-driven is installed, the plan phase produces a spec doc in `docs/` instead of scratch; the two stack cleanly
- `systematic-debugging` — debugging is *not* planning; use that skill for reproduce→isolate→fix, and this one for implementation work
- `parallel-agents` — once a plan exists, the phases often reveal what can run concurrently; delegate from the plan, not from scratch
- `context-discipline` — both push the same philosophy: think about what you're about to do before you spend context doing it
