<!-- Adapted from https://github.com/affaan-m/everything-claude-code/blob/main/rules/golang/security.md (MIT) -->
# Go — Security

## Secrets

- Never hardcode. Read from env with required-check:

```go
key := os.Getenv("OPENAI_API_KEY")
if key == "" { return errors.New("OPENAI_API_KEY missing") }
```

- Load at startup, pass via struct — don't call `os.Getenv` mid-request.
- Commit `.env.example`, never `.env`.

## Input validation

- Validate at every boundary (HTTP, RPC, CLI flags, config).
- Use **go-playground/validator** on struct tags for HTTP payloads.
- Never trust path params or query — decode + validate.

## SQL

- Parameterized queries: `db.QueryContext(ctx, "SELECT ... WHERE id = $1", id)`.
- Never `fmt.Sprintf` SQL with user input.
- Prefer **sqlc** (generated typed queries) or **squirrel** query builder.

## HTTP

- `http.Server` with `ReadTimeout`, `WriteTimeout`, `IdleTimeout` — default none is a DoS vector.
- `context.WithTimeout` on every outbound call.
- Set CSP, HSTS, `X-Content-Type-Options` headers.
- Body size limits: `http.MaxBytesReader`.

## Crypto

- **crypto/rand** for random; never `math/rand` for security.
- Password hashing: `golang.org/x/crypto/bcrypt` or `argon2`.
- TLS: `tls.Config{MinVersion: tls.VersionTLS12}`.

## Subprocess

- Never `exec.Command("sh", "-c", userInput)`.
- Pass args as slice: `exec.CommandContext(ctx, "git", "log", userInput)`.
- Validate allowlist before exec.

## Dependencies

- `govulncheck ./...` in CI — blocks on known CVEs.
- `go mod tidy` and review `go.sum` changes.
- Minimal deps; stdlib covers most needs.

## Error messages

- Don't expose internal errors to clients. Log + return opaque message.
- Include correlation ID for support.
