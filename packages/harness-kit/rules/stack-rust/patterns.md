<!-- Adapted from https://github.com/affaan-m/everything-claude-code/blob/main/rules/rust/patterns.md (MIT) -->
# Rust — Patterns

## Newtype

Wrap primitives for type safety:

```rust
pub struct UserId(pub u64);
pub struct Email(String);

impl Email {
    pub fn parse(s: &str) -> Result<Self, ParseError> {
        if !s.contains('@') { return Err(ParseError::MissingField("@".into())); }
        Ok(Email(s.to_string()))
    }
}
```

## Builder pattern

For structs with many optional fields:

```rust
#[derive(Default)]
pub struct ClientBuilder {
    timeout: Option<Duration>,
    retries: Option<u32>,
}

impl ClientBuilder {
    pub fn timeout(mut self, d: Duration) -> Self { self.timeout = Some(d); self }
    pub fn build(self) -> Client { ... }
}
```

## `From` / `TryFrom` for conversions

```rust
impl From<String> for Email {
    fn from(s: String) -> Self { Email(s) }
}

impl TryFrom<&str> for Email {
    type Error = ParseError;
    fn try_from(s: &str) -> Result<Self, Self::Error> { Email::parse(s) }
}
```

## `impl Trait` for iterators

Return complex iterator types cleanly:

```rust
fn names(&self) -> impl Iterator<Item = &str> + '_ {
    self.users.iter().map(|u| u.name.as_str())
}
```

## Async with tokio

- Use **tokio** runtime; pin version.
- Spawn with `tokio::spawn(async move { ... })`; track handles if you need result.
- `tokio::select!` for race; `tokio::join!` for parallel.
- `Arc<tokio::sync::Mutex<T>>` for shared async mutable state (not `std::sync::Mutex` in async).

## Error context (app layer)

```rust
use anyhow::{Context, Result};

fn load_config(path: &Path) -> Result<Config> {
    let raw = std::fs::read_to_string(path)
        .with_context(|| format!("read config {}", path.display()))?;
    serde_json::from_str(&raw).context("parse config")
}
```

## Anti-patterns

- `.unwrap()` / `.expect()` in library code — return `Result`.
- `clone()` to dodge the borrow checker — rework ownership.
- `Box<dyn Trait>` everywhere — use generics when possible.
- `std::sync::Mutex` in async code — use `tokio::sync::Mutex`.
- Long `match` with wildcard catch-all + `_ => unreachable!()` — prove exhaustion or handle.
- `String` params when `&str` suffices.
