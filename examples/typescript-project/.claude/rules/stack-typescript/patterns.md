<!-- Adapted from https://github.com/affaan-m/everything-claude-code/blob/main/rules/typescript/patterns.md (MIT) -->
# TypeScript/JavaScript — Patterns

## Async

- `async/await` > `.then()` chains. Chain only for simple passthrough.
- `Promise.all([...])` for parallel independent work; `Promise.allSettled` if partial-success matters.
- Never mix `await` inside `.forEach` — it won't await. Use `for...of` or `Promise.all(arr.map(...))`.
- Return promises, don't `await` and re-return unless you need to catch.

## API response shape

Consistent envelope for HTTP APIs:

```ts
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string }
  meta?: { total: number; page: number; limit: number }
}
```

## Repository pattern

Isolate persistence from business logic:

```ts
interface Repository<T, Id = string> {
  findAll(filters?: Filters): Promise<T[]>
  findById(id: Id): Promise<T | null>
  create(data: CreateDto): Promise<T>
  update(id: Id, data: UpdateDto): Promise<T>
  delete(id: Id): Promise<void>
}
```

## Result pattern (alt to exceptions for expected failures)

```ts
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E }
```

Use for domain errors (validation, not-found). Reserve `throw` for bugs/unexpected.

## Custom React hooks

- Extract reusable stateful logic; name `use*`.
- Stable deps in arrays — use `useCallback`/`useMemo` only when needed (profiling).
- No effect on mount to fetch — prefer route loaders, React Query, RSC.

## Anti-patterns

- Deeply nested callbacks — flatten with `async/await`.
- `any` to silence TS — fix the type or use `unknown`.
- Mutating props or state — spread/immer.
- Catching to swallow — always rethrow or log + throw.
- Exporting huge utility modules ("utils.ts" with 30 unrelated fns) — split by concern.
- Floating promises (`doWork()` without `await` or `void`) — ESLint `no-floating-promises`.
