<!-- Adapted from https://github.com/affaan-m/everything-claude-code/blob/main/rules/python/coding-style.md (MIT) -->
# Python — Coding Style

## Formatting & tooling

- Formatter: **ruff format** (or black). 88-char line.
- Linter: **ruff** with `E,F,I,UP,B,SIM,RUF` at minimum.
- Type checker: **mypy** or **pyright** in strict mode for new modules.
- Python version: 3.11+. Use modern syntax (match, `|` unions, PEP 604).

## Naming

| Construct | Convention | Example |
|---|---|---|
| Modules, packages, files | `snake_case` | `token_budget.py` |
| Variables, functions | `snake_case` | `parse_manifest`, `error_count` |
| Classes, exceptions, type vars | `PascalCase` | `TokenBudget`, `ParseError` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_BUDGET` |
| Private | `_leading_underscore` | `_internal_cache` |

## Types

- Type-annotate all public functions (params + return).
- Use `from __future__ import annotations` or 3.11+ native.
- Prefer `list[T]`, `dict[K, V]`, `X | None` over `List`/`Dict`/`Optional`.
- `TypedDict` for structured dicts; `dataclass(slots=True, frozen=True)` for immutable records.
- `Protocol` for structural typing (duck-typed interfaces).
- Never `Any` — use `object`, narrow with `isinstance`, or define a proper type.

## Functions

- Return early — guard clauses. Max ~20 lines.
- Params ≤3; use keyword-only (`*,`) for 4+.
- Default values: never mutable (`def f(x=[])` — bug). Use `None` and init inside.
- Pure > stateful. Side effects explicit in name (`write_*`, `send_*`).

## Imports

- Order: stdlib → third-party → local, separated by blank lines (ruff's isort).
- Never `from x import *`.
- Relative imports within a package only if the package is stable.

## Dataclasses vs pydantic

- `dataclass` for in-process value objects.
- **pydantic** `BaseModel` for I/O boundaries (HTTP bodies, config files, LLM outputs).

## Logging & errors

- `logging` stdlib with structured formatter, never `print` in libs.
- Raise specific exceptions, not `Exception`. Subclass a module-level base.
- `try` blocks narrow — only wrap the risky call.

## Comments

- Docstrings on public API only. One-line summary first, blank, then details.
- No commented-out code. Comment *why*, not *what*.
