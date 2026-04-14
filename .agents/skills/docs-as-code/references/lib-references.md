# Library References — docs/references/

Diátaxis type: **Reference**. Library reference docs are lookup material — precise, scannable, and scoped entirely to how harness-kit uses the library. They are not tutorials or general library introductions.

An agent reads these instead of the library's official docs. They contain project-specific patterns, anti-patterns, and conventions that differ from the library's defaults.

---

## Existing reference docs

| File | Library | Key patterns documented |
|------|---------|------------------------|
| `commander.md` | Commander.js | `register*Command(program)` pattern, thin `index.ts` entry point |
| `clack-prompts.md` | @clack/prompts | `isCancel()` guard, `p.log.*` instead of `console.log`, spinner wrapping async work |
| `xstate-v5.md` | XState v5 | `createMachine`/`createActor` (v5 API, not v4), inline type params, while-loop dispatch pattern |
| `listr2.md` | Listr2 | Single-level task list, throw-on-error behavior, when to use vs `p.spinner()` |
| `handlebars.md` | Handlebars | `readFile` + `compile` + `template(ctx)` pattern, `TEMPLATES_DIR` dual-path resolution |

---

## When to create a new reference doc

Create one when a new library is added to the stack AND its usage in harness-kit diverges from the library's official docs in a way that will trip up an agent (custom patterns, forbidden features, project-specific conventions).

Don't create one just to summarize the library's general API — link official docs for that.

---

## Template

```markdown
# <Library name> — harness-kit reference

## Standard pattern

```ts
// Copied from actual source — not invented
// File: src/path/to/actual-usage.ts
<real code>
```

## Don't do this

- **Anti-pattern** — specific reason it breaks in this project's context (not generic advice)

## Project conventions

- Harness-kit–specific rules that differ from the library's defaults or general advice
```

---

## Critical rule

Every code example must come from the actual codebase, not invented. Write the real usage first, then document what you wrote. If you create a reference doc before the implementation exists, the example will drift as soon as the implementation is written.

---

## Known failure mode — symptom / cause / fix

| Symptom | Cause | Fix |
|---------|-------|-----|
| Agent uses `console.log` inside a clack wizard | Reference doc doesn't explicitly call out the anti-pattern | Add `## Don't do this` entry: `console.log` breaks clack's cursor control |
| Agent wraps every task in a Listr nested sublist | Reference doc shows the pattern but not the constraint | Add: "Single-level only — nested Listr breaks the renderer in this version" |
| Agent uses XState v4 API (`Machine()`, `interpret()`) | Reference doc example wasn't explicit about version | Add version note and show v5 imports (`createMachine`, `createActor`) at the top |
