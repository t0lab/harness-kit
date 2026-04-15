<!-- Adapted from https://github.com/affaan-m/everything-claude-code/blob/main/rules/rust/testing.md (MIT) -->
# Rust — Testing

## Framework

- **Built-in** `cargo test`. No external framework needed for unit.
- Integration: `tests/` dir at crate root (each file = separate crate).
- Async: **tokio::test** macro.
- Property-based: **proptest** for invariants over generated inputs.

## Unit tests

Inline at end of each module:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_valid_email() {
        assert_eq!(Email::parse("a@b").is_ok(), true);
    }
}
```

## Integration tests

`tests/parse.rs` — imports crate as external:

```rust
use mycrate::parse_manifest;

#[test]
fn parses_sample_manifest() { ... }
```

## Assertions

- `assert_eq!(a, b)`, `assert_ne!(a, b)`, `assert!(cond)`.
- `#[should_panic(expected = "msg")]` for panic tests.
- For `Result`, assert shape: `assert!(matches!(r, Err(ParseError::MissingField(_))))`.

## Async tests

```rust
#[tokio::test]
async fn fetches_user() {
    let u = client.get_user(1).await.unwrap();
    assert_eq!(u.id, 1);
}
```

## Fixtures / helpers

- Helper functions in `tests/common/mod.rs` (shared across integration tests).
- `#[cfg(test)]` modules for unit-test-only helpers.

## Doctests

- Code examples in `///` doc comments run as tests automatically.
- Mark setup-only blocks with `# ` prefix to hide in docs but run.

## Coverage

- `cargo llvm-cov` — generates coverage report.
- Target 100% on pure library code; lower bar for binaries.

## Mocks

- Prefer trait-based fakes over mocking frameworks.
- **mockall** acceptable for large trait surfaces.
- **wiremock** for HTTP clients.
