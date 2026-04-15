<!-- Adapted from https://github.com/affaan-m/everything-claude-code/blob/main/rules/java/coding-style.md (MIT) -->
# Java — Coding Style

## Formatting & tooling

- Formatter: **google-java-format** or **spotless** with Google style.
- Linter: **Checkstyle** + **SpotBugs** + **ErrorProne**.
- Build: **Maven** (`pom.xml`) or **Gradle** (Kotlin DSL preferred).
- Java version: **LTS** — 17 or 21. Use modern features (records, pattern matching, text blocks).

## Naming

| Construct | Convention | Example |
|---|---|---|
| Packages | `all.lowercase` dot-separated | `com.example.token` |
| Classes, interfaces, enums, records | `PascalCase` | `TokenBudget`, `UserRepository` |
| Methods, variables, params | `camelCase` | `parseManifest`, `errorCount` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_BUDGET` |
| Type parameters | Single upper letter | `T`, `E`, `K`, `V` |

- No Hungarian notation. No `I` prefix on interfaces.
- Getters: `getX()` for property, `isX()` for boolean. Records use accessor `x()`.

## Package layout

- `src/main/java/<pkg>/` + `src/main/resources/`.
- `src/test/java/<pkg>/` + `src/test/resources/`.
- Module-info for JPMS if building a library.
- One public class per file; file name = class name.

## Records > classes for DTOs

```java
public record User(String id, String email) {
    public User {
        if (email == null || !email.contains("@")) throw new IllegalArgumentException("bad email");
    }
}
```

## Methods

- Return early. Max ~20 lines.
- Params ≤4; use a record or builder for more.
- Immutable params; avoid reassignment.
- Name verbs: `parseManifest`, not `manifest`.

## Nullability

- **Optional<T>** for return when absence is meaningful. Never `null` return for collections — return empty.
- `@NonNull` / `@Nullable` annotations (JSpecify / Checker Framework).
- Never `Optional<T>` as a field or param — only return type.

## Immutability

- `final` on fields by default. `List.copyOf`, `Map.copyOf` for defensive copies.
- Records are immutable — prefer them for value types.

## Streams

- Use streams for transformations. Don't abuse for simple loops.
- `toList()` (Java 16+) over `collect(Collectors.toList())`.
- Never mutate source inside stream ops.

## Comments

- Javadoc on public API. First sentence = summary.
- `@param`, `@return`, `@throws` for methods.
- No commented-out code.
