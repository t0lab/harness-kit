# Product Design — docs/DESIGN.md

Diátaxis type: **Explanation** (product-level). DESIGN.md captures where the product is going — phases, non-goals, and core technical bets. Agents read this to avoid implementing features that conflict with the product trajectory.

---

## When to update

- Product phase changes (Phase 1 → Phase 2)
- A new non-goal is identified and agreed upon
- A core technical bet is made that affects all future work
- The target user profile shifts meaningfully

This file changes slowly. If it's being updated more than once a month, something is unstable at the product level — that instability should probably be resolved before documenting it.

---

## Structure

```markdown
# harness-kit — Product Design

## Là gì
One paragraph: what the tool does and for whom. Be concrete — not "developer tooling" but "CLI that scaffolds AI agent harness environments into existing projects."

## Đang ở đâu / Đi đâu
Current phase and next phases. Keep phases concrete: what ships, not aspirations.
- Phase 1: CLI tool — current
- Phase 2: Web docs/landing — next
- Phase 3: Open source

## Non-goals
Things this tool will never do, each with a reason.
The reason is load-bearing — without it, an agent can't judge whether a proposed feature violates the non-goal or just touches adjacent territory.

## Quyết định kỹ thuật cốt lõi
Technical bets that shape all future architecture decisions.
Example: "Copy-own distribution — artifacts are copied into the target project; no runtime dependency on harness-kit."
```

---

## Relationship to other docs

| Question | Right doc |
|----------|-----------|
| Where is the product going? | `docs/DESIGN.md` (this file) |
| Why do we build it this way? | `docs/design-docs/core-beliefs.md` |
| How is it built today? | `docs/design-docs/architecture-overview.md` |

Don't duplicate content. If a technical decision belongs in `core-beliefs.md`, a one-line pointer from `DESIGN.md` is sufficient.

---

## Non-goals are as important as goals

A non-goal without a reason gets overridden by the first agent that sees a plausible use case. Write non-goals as: `<what> — <why not>`.

Example: "No plugin runtime — harness-kit copies artifacts into the target project at init time; a plugin runtime would introduce a hard runtime dependency, contradicting the copy-own principle."
