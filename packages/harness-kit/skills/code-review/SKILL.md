---
name: code-review
description: Self-review checklist and PR review protocol — invoke before committing, pushing, or opening a PR, and when reviewing someone else's diff. Use this whenever the user says "review my changes", "before I commit", "self-review my diff", "should I open a PR for this?", "review this PR", or asks what to check before merging. Run this proactively before any git commit or PR action.
tags: [code-review, pr, git, workflow, quality]
---

# Code Review

Two modes: **self-review** (before you commit/push) and **PR review** (when reviewing someone else's diff).

---

## Self-Review Gate

Run before every commit or PR. The goal is catching the things that are obvious in retrospect but invisible when you're inside the problem.

**Start by reading the full diff:**
```bash
git diff --staged          # what's about to be committed
git diff main...HEAD       # full branch diff for a PR
```

Then work through these seven checks in order:

### 1. Correctness
- Does this actually solve the stated problem?
- What happens on the error path — handled or propagated?
- Any assumptions that aren't validated at the boundary?

### 2. Tests
- Does new behavior have a test?
- Would the test actually fail before this change and pass after?
- Edge cases covered: empty input, null/undefined, concurrent writes, large data?
- No test = undocumented assumption. Write it or open a tracking issue.

### 3. Security
- Any user input that reaches a database, shell, file path, or HTML? Validate it.
- Any new secrets or API keys? Must be in env, never in code, never in logs.
- Auth/authz: does this expose a resource to the wrong caller?
- If touching payment, PII, session tokens, or cryptography: flag for a dedicated security review.

### 4. Design
- Is this the simplest thing that could work?
- Any new abstraction with only one consumer? Probably premature.
- Any function longer than ~20 lines? Can it be named helpers?
- Any copy-paste from elsewhere? Extract it.

### 5. Naming and Readability
- Would a teammate understand this diff in 6 months without asking you?
- Functions named as verbs, variables as nouns?
- Any magic numbers without a named constant?

### 6. Side Effects
- Any global state mutation that could surprise callers?
- Any resource (file handle, DB connection, timer) opened but not closed?
- Any `console.log`, `debugger`, or stray `TODO` comment left behind?
- Any async call without error handling?

### 7. Diff Size
- More than 400 lines changed? Is this actually one logical change?
- Refactoring mixed with feature work? Split them into separate commits or PRs.
- Large diffs get reviewed worse — splitting is a quality decision, not a bureaucratic one.

If a check surfaces a real issue: fix it before committing. If it's an intentional trade-off or known debt, document it inline with `// DEBT:` and a brief explanation.

---

## Ship / Show / Ask

Before opening a PR, decide which track this change belongs on:

| Track | What | When |
|-------|------|------|
| **Ship** | Merge directly to main (or self-approve) | Typo fix, trivial docs, routine chore with no logic change |
| **Show** | Open PR, merge immediately, notify team | New feature following accepted design; want async eyes but don't need a gate |
| **Ask** | Open PR, wait for approval before merging | Novel approach, architectural decision, breaking change, security-sensitive code |

When in doubt: **Ask**. The cost of a held PR is low; the cost of merging a subtle design mistake is high.

---

## PR Description

A PR description answers three questions for the reviewer:

1. **What** — what changed? (one sentence, not "see diff")
2. **Why** — what problem does this solve? Link the issue.
3. **How to verify** — what should the reviewer run or look at?

```
## What
<one-sentence summary>

## Why
Closes #<issue> / <brief motivation if no issue>

## How to verify
- [ ] <specific test command or manual step>
- [ ] <regression check, if relevant>
```

Add screenshots for UI changes. Add before/after numbers for performance changes. Add migration notes for schema or API changes.

---

## Reviewing Someone Else's Code

Your job: **help the author ship good code**, not protect yourself from blame.

**Read the PR description first.** If it's missing or unclear, ask before diving into the diff — a vague description is a signal the change isn't ready.

**Use the same 7 checks as self-review** (above). Focus comments on things that:
- Could cause a bug in production
- Will be hard to change later (API surface, schema, public interface)
- A test would have caught

### What NOT to block on
- Code style (that's for linters and formatters)
- Personal preference when both approaches are reasonable
- Hypothetical future requirements ("what if we need X later?")
- Anything you'd accept if you'd written it yourself

### Comment tone

Use explicit labels so the author knows what's required:

- **Blocking**: "This will panic on nil input when the user hasn't set a config — must fix before merge"
- **Suggestion**: "Consider extracting this loop to `filterActiveUsers()` — easier to test in isolation"
- **Nitpick**: "nit: `userList` → `users` (shorter, idiomatic)"

Authors resolve nitpicks at their discretion. Blockers must be addressed. Suggestions are invitations, not mandates.

### LGTM discipline

Don't approve to be polite. But don't hold up a PR over nitpicks either. **Approve with comments** for small things that don't block correctness.

Definition of "good enough to merge": **is this better than what exists, and does it not make things measurably worse?**
