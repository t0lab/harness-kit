<!-- Adapted from https://github.com/affaan-m/everything-claude-code/blob/main/rules/java/testing.md (MIT) -->
# Java — Testing

## Framework

- **JUnit 5** (Jupiter) — `@Test`, `@ParameterizedTest`, `@Nested`.
- Assertions: **AssertJ** — fluent and informative diffs.
- Mocks: **Mockito** for collaborators; **WireMock** for HTTP.
- Integration: **Testcontainers** for real DB/queue/broker instead of embedded.

## Layout

- `src/test/java/<pkg>/` mirrors `src/main/java/<pkg>/`.
- File name: `<ClassName>Test.java`; integration: `<ClassName>IT.java` (maven-failsafe).

## Naming

- Method: `shouldDoXWhenY()` or `parsesValidManifest()`.
- `@DisplayName("rejects invalid JSON")` for spec-style readability.

## Structure — AAA

```java
@Test
void parsesValidEmail() {
    // Arrange
    var input = "a@b.com";

    // Act
    var result = Email.parse(input);

    // Assert
    assertThat(result).isEqualTo(new Email("a@b.com"));
}
```

## Parameterized

```java
@ParameterizedTest
@CsvSource({"1, 1", "'', 0"})
void counts(String in, int expected) {
    assertThat(Count.of(in)).isEqualTo(expected);
}
```

## Nested for grouping

```java
@Nested
class WhenInputIsInvalid {
    @Test void throwsOnMissingField() { ... }
    @Test void throwsOnMalformedJson() { ... }
}
```

## Mocks

- Prefer real deps; mock only at boundaries (HTTP, DB, clock).
- `@Mock` + `@InjectMocks` for the unit under test.
- Verify interaction only when it's the behavior; prefer asserting state.

## Spring tests

- `@SpringBootTest` — full context; slow. Only for end-to-end.
- `@WebMvcTest` / `@DataJpaTest` — sliced context; fast.
- **Testcontainers** + `@DynamicPropertySource` for real PostgreSQL in tests.

## Coverage

- **JaCoCo** in Maven/Gradle. Target 80%+ on domain code.
- Don't chase coverage on DTOs/records — auto-generated equals/hashCode covered by usage.
