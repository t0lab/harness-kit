# Coding Rules

## Core Principles

- **YAGNI** — build what the task requires, not what might be needed later
- **DRY** — extract duplication only when the pattern is stable; 3 copies is the threshold
- **Single responsibility** — one function does one thing; if you need "and" to describe it, split it
- **Fail fast** — validate at boundaries (user input, external APIs); trust internal code

## Functions

- Max ~20 lines; if longer, extract named helpers
- Params: ≤3 preferred; use an options object for 4+
- Return early to avoid nested conditionals — guard clauses over `if/else` pyramids
- Pure functions preferred — same input → same output, no hidden side effects
- Name functions as verbs: `parseManifest()`, `resolvePreset()`, not `manifest()`, `preset()`

## Comments

- Code should read without comments; comment **why**, never **what**
- No commented-out code — delete it, git has history
- JSDoc (`/** */`) for exported public API only

## Error Handling

- Handle errors at the boundary where you have context to act
- Throw specific error types or Error subclasses, not plain strings
- Never silently swallow errors (`catch {}` is always wrong)

## Code Review Checklist (before committing)

- [ ] No `any` types
- [ ] No dead code or unused imports
- [ ] New logic has a test in `tests/`
- [ ] Function names are verbs, variables are nouns
