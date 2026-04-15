<!-- Adapted from https://github.com/affaan-m/everything-claude-code/blob/main/rules/golang/coding-style.md (MIT) -->
# Go — Coding Style

## Formatting & tooling

- Formatter: **gofmt** / **goimports** — no debate.
- Linter: **golangci-lint** with at minimum `govet`, `staticcheck`, `errcheck`, `gosec`, `revive`.
- Go version: current stable. Use generics (1.18+) where they clarify.

## Naming

| Construct | Convention | Example |
|---|---|---|
| Packages | `lowercase`, short, no underscores | `parse`, `httpx` |
| Files | `snake_case.go` | `token_budget.go` |
| Exported | `PascalCase` | `ParseManifest`, `Registry` |
| Unexported | `camelCase` | `parseOne`, `buffer` |
| Acronyms | All caps consistently | `HTTPClient`, `URL`, `ID` |
| Interfaces | Noun + `-er` or behavior name | `Reader`, `Closer`, `TokenBudgeter` |

## Package layout

- One concept per package. Avoid `util`, `common`, `helpers`.
- `cmd/<app>/main.go` for binaries.
- `internal/` for packages not intended for external import.
- Flat > deeply nested; go modules promote short import paths.

## Functions

- Return early — guard clauses. Max ~30 lines.
- Params ≤4; group related into a struct.
- `ctx context.Context` as first param for any I/O-touching function.
- Return `(T, error)` — error is always last.
- Named returns only when they add clarity (docs).

## Errors

- Check every error. Never `_` unless you have a comment explaining why.
- Wrap with context: `fmt.Errorf("parse manifest: %w", err)`.
- Custom error types via `errors.New` or `fmt.Errorf`; sentinel errors as package-level `var Err* = errors.New(...)`.
- Check with `errors.Is` / `errors.As`, not string comparison.

## Concurrency

- Goroutines must have a clear lifecycle — know who stops them.
- `context.Context` for cancellation, not channels-as-flags.
- Protect shared state with `sync.Mutex` or use channels; document invariant.
- `go vet -race` in CI. Run tests with `-race`.

## Comments

- Doc comments on exported identifiers start with the identifier name.
- `// Parse returns a manifest from JSON bytes.`
- No commented-out code.

