# Design Docs — docs/design-docs/

Diátaxis type: **Explanation**. Design docs record why decisions were made — the rationale, trade-offs, and rejected alternatives that don't live in the code. They protect correct decisions from being reversed by an agent that sees the outcome but not the reasoning.

---

## Files

| File | Purpose | When to update |
|------|---------|----------------|
| `architecture-overview.md` | API surface for every module — exports, signatures, dependency graph | New export added, signature changed, new module created |
| `core-beliefs.md` | 5 guiding principles behind all decisions | Only when a core principle changes — rare |
| `<topic>.md` | Decision record for a specific architectural choice | When making a non-obvious design decision others will question |

---

## architecture-overview.md

### When to update

- New exported function or type added
- Function signature changed
- New module or file created
- Import dependency between modules changes

When a function is removed or renamed, remove the old row immediately. Stale entries mislead agents more than missing entries.

### Module section template

```markdown
## Module: <Name> (`packages/harness-kit/src/<path>/`)

**Trách nhiệm:** One sentence — what this module owns and what it explicitly does not own.

**File:** `src/<path>/index.ts`

| Export | Signature | Mô tả |
|--------|-----------|-------|
| `functionName` | `(param: Type): ReturnType` | What it does. Any gotchas or restrictions. |

**Không nên gọi:** What callers should avoid and why (not just "don't call X" — explain the consequence).
```

After adding a new module, also update the dependency diagram at the bottom of the file. The diagram is the fastest way for an agent to understand import boundaries.

---

## Decision record template

Write one when making an architectural choice that:
- Isn't obvious from the code
- A future contributor will likely question
- Has meaningful rejected alternatives

```markdown
# <Decision title>

## Bối cảnh
Why this problem came up. What constraints existed. What failure this is responding to.

## Quyết định
The direction chosen and the concrete reasoning — not "it felt right" but "because X, we chose Y."

## Hệ quả
What changes. Trade-offs accepted. Who or what is affected downstream.

## Các hướng đã loại bỏ
Each rejected alternative and the specific reason it was rejected in this context.
```

File name: `<kebab-case-topic>.md`, no date prefix — these are evergreen.

Examples: `wizard-state-machine.md`, `copy-own-distribution.md`, `registry-typescript-only.md`

---

## Relationship to other doc types

| Question | Right doc |
|----------|-----------|
| Why was this decision made? | `design-docs/<topic>.md` |
| What is the product trying to become? | `docs/DESIGN.md` |
| What are the engineering principles? | `design-docs/core-beliefs.md` |
| What does this module's API look like? | `design-docs/architecture-overview.md` |

Don't duplicate content across these. If a decision belongs in `core-beliefs.md`, a pointer from `DESIGN.md` is enough.
