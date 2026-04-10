# TypeScript Coding Rules

## File Naming

- Source files: `kebab-case.ts` — e.g., `manifest-loader.ts`, `token-budget.ts`
- Test files: `kebab-case.test.ts` — mirrors source name, lives in `tests/`
- Type-only files: `kebab-case.types.ts` — e.g., `harness-config.types.ts`
- Index barrel: `index.ts` — re-exports only, no logic
- One module/class per file; file name matches its primary export

## Naming

| Construct | Convention | Example |
|-----------|-----------|---------|
| Variables, functions, params | `lowerCamelCase` | `errorCount`, `parseManifest` |
| Classes, interfaces, types, enums | `UpperCamelCase` | `ModuleRegistry`, `HarnessConfig` |
| Global constants, enum values | `UPPER_SNAKE_CASE` | `MAX_TOKEN_BUDGET` |
| Acronyms | Treat as one word | `loadHttpUrl`, not `loadHTTPURL` |

- No `_` prefix for private members — use `private` keyword
- No abbreviations unless universal (url, id, cli are fine)

## Types

- Rely on inference — omit annotations for trivially inferred types
- Never use `any` — use `unknown`, narrow with type guards, or define a specific type
- Prefer `interface` for object shapes; `type` for unions, tuples, mapped types
- Use `T[]` for simple arrays; `Array<T>` for complex union element types
- Prefer `param?: Type` over `param: Type | undefined`
- No type assertions (`as`) without a comment explaining why

## Functions

- Named functions: `function foo() {}` (not `const foo = function() {}`)
- Arrow functions for callbacks and to preserve `this` in class methods
- No `arguments` object — use rest params `(...args: string[])`

## Exports & Modules

- Named exports only — no default exports
- No `export let` — constants only; expose via getters if mutation is needed
- One logical concept per file

## Variables

- `const` by default; `let` only when reassignment is necessary
- No `var`

## What to Avoid

- `any` — leaves bugs for runtime
- Wrapper objects: `new String()`, `new Boolean()`, `new Number()`
- `for...in` on arrays — use `for...of` or `.forEach()`
- Modifying built-in prototypes
