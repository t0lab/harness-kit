---
name: memory-compact
description: >
  Save and compact important project context into long-term memory files at the end of a session.
  Invoke this skill when: the conversation is getting long, significant decisions were made, architecture
  changed, implementation progressed, or a Stop hook reminds you. The goal is that the next session
  starts with full project awareness instead of re-discovering context. Even if the user doesn't ask,
  invoke this proactively when the session has been substantive.
---

# Memory Compact

Preserve what matters from this session so the next conversation starts with full context — not
from scratch. Think of this as writing a compact, accurate briefing for a future version of yourself
who has no memory of today's work.

## When to invoke

**Do invoke** when the session involved:
- Implementation progress (something built, started, or unblocked)
- Architectural or design decisions (especially with trade-offs discussed)
- Bugs, blockers, or gotchas encountered
- Package/dependency changes or publish events
- Direction changes or scope adjustments

**Skip** if: the session was short or trivial — a quick question with no decisions or implementation.

## Memory files

Derive the memory directory from the current working directory:
```bash
MEMORY_DIR="$HOME/.claude/projects/$(pwd | sed 's|/|-|g')/memory"
```

All files live in that directory.

| File | What goes here |
|------|----------------|
| `project-state.md` | What's built, what's in-progress, what's next — the "where are we" snapshot |
| `decisions.md` | Architectural/design decisions + the reason behind each one |
| `gotchas.md` | Things tried that failed, project quirks, warnings for future sessions |

Each file uses this frontmatter format:

```markdown
---
name: <file-name>
description: <one-line description used to decide relevance in future sessions>
type: project
---

<content>
```

## Process

Work through these steps in order:

1. **Read existing memory** — read all 3 files (if they exist) to understand current state before overwriting anything

2. **Scan the session** — identify what's new and worth keeping:
   - What was built or changed in this session?
   - What decisions were made, and why?
   - What failed or caused friction?
   - What changed from what memory currently says?

3. **Update each file** — merge new information into existing content:
   - `project-state.md`: move completed items out of "In Progress", update "Next" based on what was discussed
   - `decisions.md`: append new decisions with rationale; don't duplicate existing ones
   - `gotchas.md`: append new gotchas; remove ones that are no longer relevant

4. **Prune for compactness** — each file should stay under ~300 words. If over:
   - Cut resolved/stale items
   - Merge related entries
   - Compress verbose entries to their essence

5. **Update MEMORY.md index** — ensure `memory/MEMORY.md` has a one-line pointer to each file:

```markdown
- [Project State](project-state.md) — what's built, in-progress, and next
- [Decisions](decisions.md) — architectural decisions and their rationale
- [Gotchas](gotchas.md) — failed approaches, quirks, things to watch out for
```

## Quality bar

**Zero knowledge loss, minimal redundancy, maximum scannability.**

- A future session reading these files should know everything a developer needs to pick up where this one left off
- No duplicate information across the 3 files — each has a clear lane
- Concrete and specific, not vague ("published @harness-kit/cli@0.1.1 to npm" > "did publishing stuff")
- Decisions file explains *why*, not just *what* — the why is what's easy to forget

## Example entry shapes

**project-state.md:**
```markdown
## Built
- @harness-kit/core@0.1.1 and @harness-kit/cli@0.1.1 published to npm
- Monorepo scaffold: pnpm workspaces, tsup, vitest, TypeScript project references
- .agents/skills/git-conventional + .claude/rules/ (typescript, coding)

## In Progress
- memory-compact skill (this session)

## Next
- Stop hook to trigger memory-compact automatically
- CLI commands: init, add, list, status
```

**decisions.md:**
```markdown
## @harness-kit/core published separately (not bundled into cli)
Sets up foundation for future plugin ecosystem. At v0.1.x, no backwards-compat cost.
If ecosystem doesn't materialize, can deprecate later.

## harness-kit-alias package removed
npm blocked publish (too similar to `harnesskit`). @harness-kit/cli already registers
the `harness-kit` bin command directly — alias was redundant.
```

**gotchas.md:**
```markdown
## npm publish requires granular token, not browser login token
Session token from `npm login` browser flow is read-only. Granular access token needed
for publish. Scoped packages (@harness-kit/*) also need org to exist first on npmjs.com.

## @clack/prompts v1 doesn't exist
Only v0.7.x is published. Don't reference ^1.0.0.

## import.meta.url guard needed in CLI entry
Commander's parseAsync() must be guarded — vitest imports the module and would consume
process.argv during test runs without the guard.
```
