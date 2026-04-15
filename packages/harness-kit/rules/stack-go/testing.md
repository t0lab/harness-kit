<!-- Adapted from https://github.com/affaan-m/everything-claude-code/blob/main/rules/golang/testing.md (MIT) -->
# Go — Testing

## Framework

- **Standard library `testing`** — no Jest-equivalent needed.
- Assertions: prefer stdlib. Use **testify/assert** only in large suites where readability wins.
- Run with `-race` in CI: `go test -race ./...`.

## Layout

- Tests co-located with source: `manifest.go` + `manifest_test.go` in same package.
- External test package for API-only coverage: `package parse_test`.

## Naming

- `Test<Function>_<Scenario>` — `TestParse_InvalidJSON`.
- Subtests with `t.Run("name", func(t *testing.T) { ... })` for variants.

## Table-driven tests (default form)

```go
func TestCount(t *testing.T) {
    tests := []struct {
        name string
        in   string
        want int
    }{
        {"empty", "", 0},
        {"one word", "hi", 1},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            if got := Count(tt.in); got != tt.want {
                t.Errorf("Count(%q) = %d, want %d", tt.in, got, tt.want)
            }
        })
    }
}
```

## Helpers

- Mark helpers with `t.Helper()` so failures point at the call site.
- `t.Cleanup(func() { ... })` for teardown instead of `defer` in Setup.

## Benchmarks

```go
func BenchmarkParse(b *testing.B) {
    for i := 0; i < b.N; i++ {
        _, _ = Parse(input)
    }
}
```

Run: `go test -bench=. -benchmem`.

## Mocks & fakes

- Prefer hand-rolled fakes that implement the consumer's interface.
- **gomock** / **moq** acceptable for large interfaces with many methods.
- `httptest.NewServer` for HTTP clients — real wire protocol.

## Coverage

- `go test -cover ./...`. Target 100% on domain/pure packages.
- Don't chase coverage on `main` / `cmd/`.
