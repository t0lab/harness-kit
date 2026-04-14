# Related Skills

Skills to invoke alongside docs-as-code work.

---

## git-conventional

Invoke before committing any documentation change.

Docs-only changes use commit type `docs`. The scope is optional but useful when targeting a specific doc area:

```
docs: add exec plan for remove command
docs(architecture-overview): add env-checker module API surface
docs(references): add zod library reference
docs(tech-debt): log filter.ts dead code
```

Rule: a commit that includes both a code change and a docs update for that change should use the code change's type (`feat`, `fix`, `refactor`), not `docs`. Use `docs` only when documentation is the entire change.

---

## memory-compact

Invoke at the end of a session where significant docs were written or updated — especially:

- A new exec plan was created (captures what's in flight)
- An architectural decision was recorded (captures the rationale)
- The tech-debt tracker was updated (captures what's known)

The memory-compact skill saves a session summary so the next session starts with full project awareness instead of re-reading all docs from scratch.
