<!-- Adapted from https://github.com/affaan-m/everything-claude-code/blob/main/rules/python/security.md (MIT) -->
# Python — Security

## Secrets

- Never hardcode. Read from `os.environ` with default-less lookup for required keys.

```python
import os
api_key = os.environ['OPENAI_API_KEY']   # raises KeyError if missing
```

- Use `pydantic-settings` (`BaseSettings`) for typed env config; validates at startup.
- Commit `.env.example`, never `.env`.

## Input validation

- Validate at every boundary: HTTP, CLI, queue, file.
- Pydantic `BaseModel.model_validate()` — never cast dict → typed.
- Never trust headers, query, body without parsing.

## SQL / injection

- Parameterized queries only. SQLAlchemy `text(...).bindparams()`, or ORM with typed queries.
- Never f-string SQL with user input.
- For raw SQL, use driver placeholders (`%s` for psycopg, `?` for sqlite).

## Deserialization

- Never `pickle.loads()` untrusted data — it's RCE.
- Never `yaml.load()` without `SafeLoader` — use `yaml.safe_load()`.
- JSON is safe by default.

## Authentication

- Password hashing: **argon2-cffi** or **bcrypt**. Never MD5/SHA1/plain SHA256.
- Sessions: server-side store (Redis, DB) > JWT for stateful apps.
- JWT: verify signature, check `exp` / `nbf` / `iss`. Short-lived tokens + refresh.

## Subprocess

- Never `shell=True` with untrusted input.
- Pass args as list: `subprocess.run(['git', 'log', user_input], check=True)`.
- Prefer library over shelling out when possible.

## Dependencies

- `pip audit` or `safety check` in CI; block on high/critical.
- Pin versions in `pyproject.toml` / lockfile (uv.lock, poetry.lock).
- Review package before adding — typosquatting is common (e.g., `requests` vs `request`).

## Error messages

- Log stack traces internally, return generic messages to clients.
- Include correlation ID without exposing internals.
