<!-- Adapted from https://github.com/affaan-m/everything-claude-code/blob/main/rules/rust/security.md (MIT) -->
# Rust — Security

## Secrets

- Never hardcode. `std::env::var("X")` with required-check:

```rust
let key = std::env::var("OPENAI_API_KEY")
    .context("OPENAI_API_KEY missing")?;
```

- Use **figment** or **config** crate for layered typed config; validate at startup.
- Commit `.env.example`, never `.env`.

## `unsafe`

- Every `unsafe` block has a `// SAFETY: ...` comment explaining invariants.
- Isolate unsafe in small wrappers with safe APIs.
- Enable `#![forbid(unsafe_code)]` in crates that don't need it.

## Input validation

- Validate at every boundary. Parse → typed.
- **serde** with custom `deserialize_with` for format checks.
- **validator** crate for struct-tag-based validation.
- Never `String` fields as-is for emails/URLs/UUIDs — newtype them.

## SQL

- **sqlx** with compile-time checked queries, or **diesel** typed queries.
- Never `format!` SQL with user input.

## HTTP

- Timeouts on every outbound call: `reqwest::ClientBuilder::default().timeout(Duration::from_secs(10))`.
- TLS by default; reject invalid certs (don't disable verification).
- Set security headers on responses (axum + tower-http).

## Crypto

- **ring** or **rustcrypto** — audited implementations.
- Never write crypto primitives yourself.
- Password hashing: **argon2** crate.
- Random: `rand::thread_rng()` or `rand::rngs::OsRng` for security-critical.

## Deserialization

- `serde_json::from_str` is safe. `bincode`/custom formats require care on size limits.
- Set max depth / size with `serde_json::Deserializer::from_reader` + budget.

## Dependencies

- **cargo-audit** in CI — blocks on RUSTSEC advisories.
- **cargo-deny** for license + supply chain policy.
- Minimize deps; review `Cargo.lock` changes.

## Error messages

- Don't expose internal state in user-facing errors.
- Use **thiserror** internal, **anyhow** at edges; strip details for API responses.
