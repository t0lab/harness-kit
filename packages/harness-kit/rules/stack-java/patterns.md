<!-- Adapted from https://github.com/affaan-m/everything-claude-code/blob/main/rules/java/patterns.md (MIT) -->
# Java — Patterns

## Records for DTOs and value objects

```java
public record Token(String value, Instant expiresAt) {}
```

- Automatic `equals`, `hashCode`, `toString`.
- Compact constructor for validation.
- Prefer records over Lombok `@Data` on new code.

## Sealed types for closed hierarchies

```java
public sealed interface Result<T>
    permits Result.Ok, Result.Err {
    record Ok<T>(T value) implements Result<T> {}
    record Err<T>(String message) implements Result<T> {}
}
```

Pairs with pattern matching:

```java
return switch (result) {
    case Result.Ok<User> ok -> ok.value().email();
    case Result.Err<User> err -> "error: " + err.message();
};
```

## Builder (when constructors get wide)

```java
public class Client {
    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Duration timeout;
        public Builder timeout(Duration d) { this.timeout = d; return this; }
        public Client build() { return new Client(...); }
    }
}
```

## Dependency injection

- Constructor injection — never field injection (`@Autowired` on field is discouraged).
- Final fields assigned in constructor.
- Prefer constructor even in Spring for testability:

```java
@Service
public class UserService {
    private final UserRepository repo;
    public UserService(UserRepository repo) { this.repo = repo; }
}
```

## Repository / DAO

```java
public interface UserRepository {
    Optional<User> findById(String id);
    List<User> findAll();
    User save(User user);
}
```

Spring Data: extend `JpaRepository<User, String>` with typed queries.

## Exception strategy

- Checked exceptions for recoverable domain errors (cautious use).
- RuntimeException for bugs/unexpected.
- Custom hierarchy extending a package-level base.
- Wrap with context: `throw new ParseException("bad manifest: " + path, cause);`.

## Concurrency

- **Virtual threads** (Java 21+) for I/O-heavy workloads: `Executors.newVirtualThreadPerTaskExecutor()`.
- `CompletableFuture` for composing async.
- `java.util.concurrent` primitives over raw `synchronized`.
- `@GuardedBy("lock")` comments on fields with external locking.

## Anti-patterns

- Field injection with `@Autowired`.
- `null` returns for collections — return empty.
- Exception-for-control-flow (e.g., parsing with try/catch as "does this work?").
- Static mutable state.
- Public setters on domain objects — prefer immutability.
- God classes (`*Service` with 30 methods) — split by use case.
