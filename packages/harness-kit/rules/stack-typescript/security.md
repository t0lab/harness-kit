<!-- Adapted from https://github.com/affaan-m/everything-claude-code/blob/main/rules/typescript/security.md (MIT) -->
# TypeScript/JavaScript — Security

## Secrets

- Never hardcode secrets. Read from `process.env.X`.
- Fail fast if required env missing:

```ts
const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) throw new Error('OPENAI_API_KEY missing')
```

- Commit `.env.example` (placeholders), never `.env` (values).
- Use `dotenv-safe` / `envalid` / `zod` to validate env at startup.

## Input validation

- Validate at every boundary: HTTP handlers, CLI args, queue messages, webhooks.
- Zod schemas, parse don't cast:

```ts
const input = bodySchema.parse(req.body)   // throws on mismatch
```

- Never trust `req.body`, `req.query`, `req.params` as typed — always parse.

## SQL / injection

- Parameterized queries only. Use `pg` placeholders, Prisma typed queries, Drizzle, Kysely.
- Never template-string SQL with user input.

## XSS (browser/React)

- Never `dangerouslySetInnerHTML` with user content — sanitize with DOMPurify if must.
- Escape user content in `innerHTML`; prefer `textContent`.
- Set `Content-Security-Policy` headers.

## Authentication

- Password hashing: `bcrypt` (cost ≥12) or `argon2`.
- Sessions: HTTP-only, Secure, SameSite=Lax cookies.
- JWT: verify signature, check `exp`; don't store sensitive data in payload.

## Dependencies

- `pnpm audit` / `npm audit` in CI; block on high/critical.
- Pin exact versions for security-critical deps.
- Review `postinstall` scripts before adding new deps.

## Error messages

- Don't leak stack traces to clients. Log internally, return generic message.
- Include correlation ID for support without exposing internals.

## Agent / tool

- Pair with `security-review` bundle for full audit pass before release.
