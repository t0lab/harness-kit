# No Persistent Memory

This project has no long-term memory backend installed. There are no `search_memories` / `add_memory` MCP tools available — do not call them, do not plan around them.

Rely on:
- The current conversation's context window
- Files in the repo (code, `docs/`, `CLAUDE.md`, `AGENTS.md`) as the system of record
- Git history for why decisions were made

If you find yourself wanting persistent memory, the right move is to write the fact into `docs/` (see `docs-as-code`), not to reach for a memory tool that isn't there.
