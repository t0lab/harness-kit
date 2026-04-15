<!-- Adapted from https://github.com/affaan-m/everything-claude-code/blob/main/rules/golang/patterns.md (MIT) -->
# Go — Patterns

## Interfaces at use sites

- Define interfaces where they're consumed, not where implemented.
- Small interfaces compose (`io.Reader`, `io.Closer`) — accept interfaces, return structs.

```go
// in consumer package
type Tokenizer interface {
    Tokenize(s string) []string
}

func Count(t Tokenizer, s string) int { return len(t.Tokenize(s)) }
```

## Options struct / functional options

For functions with many optional params:

```go
type Option func(*Config)

func WithTimeout(d time.Duration) Option {
    return func(c *Config) { c.Timeout = d }
}

func New(opts ...Option) *Client { ... }
```

## Context plumbing

- `ctx` first param on every I/O function.
- Derive scoped ctx: `ctx, cancel := context.WithTimeout(parent, 5*time.Second); defer cancel()`.
- Never store ctx in a struct field — pass it.

## Error wrapping

```go
if err := db.Query(q); err != nil {
    return fmt.Errorf("fetch users: %w", err)
}
```

- `%w` preserves the chain for `errors.Is` / `errors.As`.
- Wrap once per layer — don't double-wrap the same context.

## Goroutines with errgroup

```go
g, ctx := errgroup.WithContext(ctx)
for _, id := range ids {
    id := id
    g.Go(func() error { return process(ctx, id) })
}
if err := g.Wait(); err != nil { return err }
```

## Table-driven tests

```go
tests := []struct {
    name string
    in   string
    want int
}{
    {"empty", "", 0},
    {"one", "a", 1},
}
for _, tt := range tests {
    t.Run(tt.name, func(t *testing.T) {
        if got := Count(tt.in); got != tt.want {
            t.Errorf("got %d, want %d", got, tt.want)
        }
    })
}
```

## Anti-patterns

- `interface{}` / `any` to smuggle types — use generics.
- `panic` for recoverable errors — return `error`.
- Empty interfaces in public APIs.
- Goroutines without a way to stop them.
- Ignoring errors (`_ = f()`) without a comment.
- Over-using global state / `init()` functions.
