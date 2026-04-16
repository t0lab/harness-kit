<!-- Adapted from https://github.com/affaan-m/everything-claude-code/blob/main/rules/typescript/testing.md (MIT) -->
# TypeScript/JavaScript — Testing

## Framework

- Unit/integration: **vitest** (fast, native ESM, `describe`/`it`/`expect`).
- E2E: **Playwright** for critical user flows — one spec per flow.
- Jest only for legacy projects — otherwise vitest.

## Layout

- Tests in `tests/` directory, mirror source path — `src/parse/manifest.ts` → `tests/parse/manifest.test.ts`.
- File name: `<source-stem>.test.ts`.
- One concern per `describe` block; use nested `describe` for sub-behaviors.

## Names

- `describe('parseManifest', () => { ... })` — name = unit under test.
- `it('rejects invalid JSON', ...)` — behavior in imperative present tense.

## Assertions

- Prefer focused: `expect(result).toEqual({...})` over deep `toMatchObject`.
- Use `expect(fn).toThrow(/regex/)` for error matching.
- Avoid snapshots except for stable structured output (CLI text, generated HTML).

## Coverage targets

- Public exports: 100% lines (enforce via vitest `--coverage`).
- Internal helpers: covered transitively — don't write tests to hit coverage.
- Integration over unit when units are trivial — test the seam.

## Mocks

- Prefer real implementations; mock only at system boundaries (HTTP, fs, clock).
- `vi.mock()` at module level, not inside `it`.
- Never mock the thing under test.

## Async tests

- Return or `await` the promise — un-awaited promises silently fail.
- Use `vi.useFakeTimers()` for time-dependent logic; restore in `afterEach`.
