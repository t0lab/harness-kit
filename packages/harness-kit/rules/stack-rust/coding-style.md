<!-- Adapted from https://github.com/affaan-m/everything-claude-code/blob/main/rules/rust/coding-style.md (MIT) -->
# Rust — Coding Style

## Formatting & tooling

- Formatter: **rustfmt** (`cargo fmt`). Default config.
- Linter: **clippy** with `-D warnings` in CI.
- Edition: **2021** or later.
- Rust version: stable; pin in `rust-toolchain.toml` for reproducibility.

## Naming

| Construct | Convention | Example |
|---|---|---|
| Crates, modules, files | `snake_case` | `token_budget`, `parse.rs` |
| Functions, variables | `snake_case` | `parse_manifest`, `error_count` |
| Types, traits, enums | `PascalCase` | `TokenBudget`, `ParseError` |
| Enum variants | `PascalCase` | `Ok`, `Err`, `NotFound` |
| Constants, statics | `SCREAMING_SNAKE_CASE` | `MAX_BUDGET` |
| Lifetimes | Short `'a`, `'b` | `fn foo<'a>(x: &'a str)` |

## Module layout

- `src/lib.rs` or `src/main.rs` as crate root.
- Submodule = file: `mod parse;` → `src/parse.rs` (or `src/parse/mod.rs` for dir).
- `pub use` at crate root to flatten the public API.
- `mod tests { ... }` at end of file for unit tests.

## Functions

- Return early — `?` operator flattens error chains.
- Max ~30 lines; extract helpers.
- Params ≤4; group related into a struct.
- Prefer borrows (`&str`, `&[T]`) in params; return owned types (`String`, `Vec<T>`).

## Error handling

- `Result<T, E>` for recoverable; `panic!` for bugs.
- Define module-level error enum with `thiserror::Error` derive.
- Propagate with `?`. Context via **anyhow** at app boundary, not in libraries.

```rust
#[derive(thiserror::Error, Debug)]
pub enum ParseError {
    #[error("invalid JSON: {0}")]
    Json(#[from] serde_json::Error),
    #[error("missing field: {0}")]
    MissingField(String),
}
```

## Ownership & borrowing

- Prefer `&T` over `&mut T`; mutation locally only.
- Use `Cow<'_, str>` when value may be borrowed or owned.
- `Arc<T>` for shared immutable across threads; `Arc<Mutex<T>>` for shared mutable.
- Avoid `.clone()` in hot paths — prove the borrow.

## Generics & traits

- Derive common: `#[derive(Debug, Clone, PartialEq, Eq)]`.
- Prefer generic functions over `Box<dyn Trait>` unless dyn dispatch needed.
- `impl Trait` for return types when the concrete type is complex.

## Comments

- Doc comments `///` on public items. Start with one-line summary.
- `//!` for module docs at file top.
- No commented-out code.
