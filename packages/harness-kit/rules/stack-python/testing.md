<!-- Adapted from https://github.com/affaan-m/everything-claude-code/blob/main/rules/python/testing.md (MIT) -->
# Python — Testing

## Framework

- **pytest** — not unittest. Use `pytest-asyncio` for async, `pytest-cov` for coverage.
- Config in `pyproject.toml` under `[tool.pytest.ini_options]`.

## Layout

- `tests/` at project root, mirror source path — `src/parse/manifest.py` → `tests/parse/test_manifest.py`.
- File prefix: `test_*.py` (pytest discovery).
- Test function: `def test_<behavior>():`.

## Assertions

- Plain `assert result == expected` — pytest rewrites for clear diffs.
- `pytest.raises(ValueError, match="regex")` for error matching.
- Avoid comparing to snapshot unless the output is stable (CLI, serialized).

## Fixtures

- `@pytest.fixture` for setup; scope `function` default, `session` for expensive setup (DB, Docker).
- Prefer fixtures over `setUp/tearDown`.
- `conftest.py` at directory level for shared fixtures.

## Parametrize

```python
@pytest.mark.parametrize("input,expected", [
    ("1", 1),
    ("abc", None),
])
def test_parse_int(input, expected):
    assert parse_int(input) == expected
```

## Async tests

```python
import pytest

@pytest.mark.asyncio
async def test_fetch():
    result = await fetch("/users/1")
    assert result.status == 200
```

## Mocks

- Prefer real deps; mock at system boundary only (HTTP, DB, filesystem).
- `pytest-mock`'s `mocker` fixture or `unittest.mock.patch`.
- Patch where used, not where defined: `mocker.patch('myapp.service.httpx.get')`.

## Coverage

- Target 100% on pure/public modules; don't chase coverage on CLI/entry points.
- `pytest --cov=src --cov-report=term-missing`.
