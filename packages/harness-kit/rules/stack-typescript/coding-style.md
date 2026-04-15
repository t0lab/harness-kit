<!-- Adapted from https://github.com/affaan-m/everything-claude-code/blob/main/rules/typescript/coding-style.md (MIT) -->
# TypeScript/JavaScript — Coding Style

## Types

- Annotate exported functions, public class methods, and shared utilities — params and return.
- Let TS infer obvious locals; don't annotate `const x = 1`.
- Extract repeated inline object shapes into named `interface`/`type`.
- `interface` for object shapes that may be extended or implemented.
- `type` for unions, intersections, tuples, mapped/utility types.
- String literal unions > `enum` unless interop requires `enum`.
- Never `any`. Use `unknown` at boundaries then narrow; generics when a value's type depends on caller.
- Prefer `param?: T` over `param: T | undefined`.
- No type assertions (`as`) without a comment explaining why.

## Naming

| Construct | Convention | Example |
|-----------|-----------|---------|
| Variables, functions, params | `lowerCamelCase` | `errorCount`, `parseManifest` |
| Classes, interfaces, types, enums | `UpperCamelCase` | `ModuleRegistry` |
| Global constants, enum values | `UPPER_SNAKE_CASE` | `MAX_TOKEN_BUDGET` |
| Acronyms | Treat as one word | `loadHttpUrl`, not `loadHTTPURL` |

- No `_` prefix for private members — use `private`.
- No abbreviations unless universal (`url`, `id`, `cli`).

## File layout

- Source: `kebab-case.ts`. Tests: `kebab-case.test.ts` in `tests/`. Type-only: `kebab-case.types.ts`.
- `index.ts` = barrel, re-exports only.
- One module/class per file; file name matches primary export.

## Functions

- Named decl: `function foo() {}` not `const foo = function() {}`.
- Arrow functions for callbacks / preserving `this`.
- No `arguments` — use `(...args: T[])`.
- Max ~20 lines; extract helpers beyond.
- Params ≤3; options object for 4+.
- Return early — guard clauses over `if/else` pyramids.
- Verb names: `parseManifest()`, not `manifest()`.

## Modules

- Named exports only — no default exports.
- `const` by default; `let` only when reassignment needed. No `var`.
- No `export let`.

## Immutability

Prefer spread over mutation:

```ts
// WRONG
user.name = name

// CORRECT
const updated = { ...user, name }
```

## Error handling

Narrow `unknown` errors safely; never `catch { }`:

```ts
try {
  await risky()
} catch (error: unknown) {
  if (error instanceof Error) logger.error(error.message)
  throw error
}
```

## Input validation

Use Zod at boundaries; infer types from schemas:

```ts
const userSchema = z.object({ email: z.string().email() })
type UserInput = z.infer<typeof userSchema>
```

## Logging & comments

- No `console.log` in production — use pino/winston/structured logger.
- No commented-out code — delete, git has history.
- JSDoc only for exported public API.
- Comment *why*, not *what*. Named identifiers describe the what.
