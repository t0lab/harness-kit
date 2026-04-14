# claude-mem

> **Experimental** — heavy dependencies (Bun, ChromaDB via uv/Python). Powerful but complex setup.

Persistent session memory for Claude Code — auto-captures tool use, compresses via Claude Agent SDK, retrieves with hybrid semantic + keyword search.

## Artifacts

| Type | Detail |
|------|--------|
| `plugin` | `github:thedotmack/claude-mem` — installs via `npx claude-mem install` |

## Requirements

- Bun >= 1.0.0 (auto-installed if missing)
- Node.js >= 18
- Chrome/Chromium
- uv + ChromaDB (auto-installed if missing)

## What it does

Plugin that gives Claude Code persistent memory across sessions:

- **6 hooks** auto-capture every tool use, compress observations, inject context on session start
- **3 MCP tools** for 3-layer retrieval: `search` → `timeline` → `get_observations` (~10x token savings)
- **7 skills** including `mem-search`, `smart-explore` (tree-sitter AST, 24 languages), `knowledge-agent`
- **Web UI** at `localhost:37777` for browsing memory stream
- **Worker daemon** (Bun) runs in background, manages DB writes, embedding, summarization

### Hooks

| Hook | Trigger | What it does |
|------|---------|-------------|
| SessionStart | startup/clear/compact | Start worker, inject relevant past context |
| UserPromptSubmit | every prompt | Initialize session tracking |
| PostToolUse | every tool result | Capture and compress observation |
| PreToolUse (Read) | file read | Inject file-specific memory |
| Stop | session end | Compress session summary |

### MCP tools

| Tool | Description |
|------|-------------|
| `search` | Full-text + semantic search over memory index |
| `timeline` | Chronological context around a specific observation |
| `get_observations` | Batch-fetch full observation details by ID |

### Storage

- **SQLite** (FTS5) — keyword search, primary storage (bundled)
- **ChromaDB** — vector embeddings for semantic search

## Setup

1. Run `harness-kit add claude-mem`
2. Restart Claude Code
3. Everything else is automatic — hooks, MCP, worker startup

## License

AGPL-3.0 (core). `ragtime/` subdirectory is PolyForm Noncommercial 1.0.0.

## Notes

- `npm install -g claude-mem` is NOT enough — must use `npx claude-mem install` to register hooks and MCP
- Worker daemon starts automatically on SessionStart, health-checks on port 37777
- Settings stored in `~/.claude-mem/settings.json`
