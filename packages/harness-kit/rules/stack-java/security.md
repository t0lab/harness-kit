<!-- Adapted from https://github.com/affaan-m/everything-claude-code/blob/main/rules/java/security.md (MIT) -->
# Java — Security

## Secrets

- Never hardcode. Load from env / secret manager at startup.
- Spring: `@ConfigurationProperties` + `@Validated` for typed config.
- Fail fast on missing required values.
- Commit `.env.example` / `application-example.yml`, never with real values.

## Input validation

- Validate at every boundary: REST, messaging, CLI.
- **Jakarta Bean Validation** (`@NotNull`, `@Size`, `@Email`, `@Valid`).
- `@Valid` on controller method params — framework triggers validation.
- Custom validators implement `ConstraintValidator<A, T>`.

## SQL / injection

- Parameterized queries only: JPA `@Query`, PreparedStatement, jOOQ typed.
- Never concat user input into SQL / JPQL / HQL.
- Native queries: always bind params, never string-build.

## Deserialization

- **Jackson** `ObjectMapper` — disable `FAIL_ON_UNKNOWN_PROPERTIES=false` carefully; prefer strict.
- Never deserialize untrusted data with `ObjectInputStream` (Java serialization = RCE risk).
- Use allowlist for polymorphic deserialization (`@JsonTypeInfo` with `allowedSubtypes`).

## XXE / XML

- Disable external entities:

```java
var factory = DocumentBuilderFactory.newInstance();
factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
```

## Authentication

- Password hashing: **BCrypt** or **Argon2** (spring-security-crypto).
- Never MD5/SHA-1/plain SHA-256 for passwords.
- Sessions: HTTP-only + Secure + SameSite cookies. Stateful > stateless for web.

## HTTP / Spring Security

- CSRF protection enabled for state-changing endpoints.
- CORS allowlist — not `*` in production.
- Security headers: `X-Content-Type-Options: nosniff`, HSTS, CSP.
- Method-level `@PreAuthorize` for sensitive ops.

## Dependencies

- **OWASP Dependency-Check** or **Snyk** in CI.
- Review CVE advisories before merging dep bumps.
- Pin versions in `pom.xml` / `build.gradle.kts` + lockfile.

## Error messages

- Don't return stack traces to clients. Log + return correlation ID.
- `@ControllerAdvice` with global handler to sanitize.
