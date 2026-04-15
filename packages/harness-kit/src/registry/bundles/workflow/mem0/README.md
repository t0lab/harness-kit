# mem0

Hosted long-term memory for your agent — searchable facts that persist across sessions, extracted automatically from conversation.

## What it installs

| Artifact | Path (in your project) | Purpose |
|----------|-----------------------|---------|
| MCP server | `.mcp.json` → `mem0` entry | Connects the agent to mem0 cloud — 8+ memory tools (`search_memories`, `add_memory`, `update_memory`, …) |
| Skill | `.claude/skills/mem0/` | Protocol the agent follows: search-before-answer, scope-by-user-id, let mem0 extract facts from raw messages |

## How it works

mem0 is a managed memory layer. You send it the `messages[]` of a turn; its LLM extracts the salient facts, dedupes them against existing memories, and indexes for semantic + graph retrieval. On the next turn your agent calls `search_memories(query)` to pull the top-K relevant facts and injects them into reasoning.

The skill teaches the agent the workflow that separates useful memory from noise:

- **Always scope by `user_id`** — without it, every user's memories land in the same bucket.
- **Search every turn**, not just session start — memories mutate.
- **Pass raw messages** to `add_memory`, never pre-summarized text — mem0's extractor is the whole point.
- **Add at end-of-turn** — one extraction call per resolved task.

Without the skill, agents commonly: forget `user_id`, store raw transcripts (bloat), or only search on session start (stale recall).

## Setup

1. Sign up at https://app.mem0.ai and create an API key at https://app.mem0.ai/settings/api-keys.
2. Export in your shell or `.env`:
   ```
   MEM0_API_KEY=m0-...
   ```
3. Restart Claude Code so the MCP server picks up the env var.

No Docker, no self-hosted infra — this bundle targets the hosted platform. Self-hosted mem0 (BYO LLM + vector store) is possible but not covered here.

## Pairs well with

- `local-memory` — mem0 is cloud-hosted and team-shareable via API scope; `local-memory` is file-based and repo-committable. Pick one primary memory system; using both fragments recall.
- `context-discipline` — mem0 reduces the need to keep facts hot in context because retrieval is cheap. The two together let you run leaner system prompts.
