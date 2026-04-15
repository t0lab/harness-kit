<!-- Adapted from https://github.com/affaan-m/everything-claude-code/blob/main/rules/python/patterns.md (MIT) -->
# Python — Patterns

## Async

- Use `asyncio` consistently — don't mix with `threading` unless necessary.
- `async def` + `await`; `asyncio.gather(*tasks)` for parallel.
- Never call blocking I/O from async code — wrap with `asyncio.to_thread(blocking_fn)`.
- Cancellation is cooperative — handle `asyncio.CancelledError` in long ops.

## Context managers

- Use `with` for any acquired resource: files, locks, DB sessions, HTTP clients.
- Define custom with `@contextmanager` for setup/teardown pairs.

## Dataclasses / records

```python
from dataclasses import dataclass

@dataclass(slots=True, frozen=True)
class Token:
    value: str
    expires_at: datetime
```

`slots=True` saves memory; `frozen=True` makes hashable and safe to share.

## Pydantic for I/O

```python
from pydantic import BaseModel, Field

class UserCreate(BaseModel):
    email: str = Field(pattern=r'.+@.+')
    age: int = Field(ge=0, le=150)

user = UserCreate.model_validate(request.json())
```

## Repository pattern

```python
from typing import Protocol

class UserRepo(Protocol):
    async def find_by_id(self, id: str) -> User | None: ...
    async def create(self, data: UserCreate) -> User: ...
```

Protocols are structural — any class with matching methods satisfies it.

## Result / Option

For expected failures, return a tuple or sentinel instead of raising:

```python
def parse_int(s: str) -> int | None:
    try:
        return int(s)
    except ValueError:
        return None
```

Reserve exceptions for bugs/exceptional states.

## Anti-patterns

- Mutable default args (`def f(x=[])`) — use `None` + init inside.
- `from module import *` — pollutes namespace.
- Bare `except:` or `except Exception:` without rethrow — hides bugs.
- Global mutable state — pass it in, or use dependency injection.
- Manual resource cleanup in `try/finally` — use `with` instead.
- Type-erased wrappers (`def f(x: Any)`) — define a real type.
