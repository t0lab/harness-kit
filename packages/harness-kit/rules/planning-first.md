# Planning First

For any multi-step, multi-file, or architecturally-novel task: **plan before coding, then execute with discipline.**

Planning gate:
- **Explore the code first** — never plan against an unverified mental model.
- **One clarifying question per message.** No batching.
- **Propose 2–3 approaches with trade-offs** before picking one.
- **Hard gate:** do not write implementation code until the user approves the plan. "Simple" projects included.
- Skip the gate only for trivial single-file work (≤30 min, obvious shape).

Execution discipline (once the plan is approved):
- **Critique the plan first** — fresh-eye pass for gaps, ambiguity, forward references. Escalate concerns before starting.
- **Never implement on `main`/`master`** without explicit consent.
- **Verify after every task** using the check named in the plan. No check named = plan bug.
- **Stop on failure.** A failing verification is a blocker, not a speed bump — escalate, don't force through.
- **If reality diverges, update the plan before coding further.** Code-plan drift is worse than no plan.

See `.agents/skills/planning-first/` for the full protocol, plan structure, and anti-patterns.
