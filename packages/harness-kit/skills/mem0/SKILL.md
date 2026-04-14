---
name: mem0
description: Guide for using mem0 MCP tools — invoke whenever you add, search, or recall long-term memory across sessions. Use this before answering any user turn that references "last time", "we decided", or "my preferences".
tags: [memory, mem0, mcp]
---

# mem0 MCP

Cloud-hosted long-term memory. mem0's LLM extracts + dedupes facts automatically — you pass messages, it stores atoms.

## Golden rules

1. **Search before you answer.** Call `search_memories` on every user turn that could benefit from prior context. Memories mutate between sessions; stale in-context recall is the #1 bug.
2. **Always scope by `user_id`.** Omitting it pollutes the default bucket and makes retrieval useless across users. Add `agent_id` / `run_id` when the workflow has multiple agents or sessions.
3. **Pass messages, not summaries.** `add_memory` expects the raw `messages[]` array. mem0's extractor picks salient facts. Do NOT pre-summarize (`"User said X"`) — that bloats storage and degrades search.
4. **Add at end-of-turn, not mid-turn.** One `add_memory` call per resolved task, after the answer. Extraction costs an LLM call (~gpt-4.1-nano) — budget for it.

## Tools

| Tool | When to use |
|------|------------|
| `search_memories` | Retrieve top-K relevant facts for the current query — call at turn start |
| `add_memory` | Store the just-resolved exchange — call at turn end |
| `get_memories` | List+paginate all memories for a user (admin/debug) |
| `get_memory` | Fetch a single memory by id |
| `update_memory` | Overwrite a specific memory's content |
| `delete_memory` | Remove one memory by id |
| `delete_all_memories` | Wipe scope (user_id required) — destructive, confirm first |
| `list_entities` / `delete_entities` | Graph-memory entity operations (only if graph enabled) |

## Workflow

```
user turn
  ├─ search_memories(query: <user message>, user_id: <id>, limit: 5)
  ├─ inject top hits into system prompt / reasoning
  ├─ answer
  └─ add_memory(messages: [user_msg, assistant_msg], user_id: <id>)
```

## Params

- **`user_id`** (required) — scope key. Use a stable identifier per end-user.
- **`agent_id`** (optional) — sub-scope for multi-agent systems.
- **`run_id`** (optional) — session-level scope (rarely needed).
- **`limit`** (search) — default 10; 3-5 is usually enough for context injection.
- **`filters`** (search) — metadata filters, e.g. `{"category": "preferences"}`.
- **`metadata`** (add) — attach tags so later searches can filter.

## Common pitfalls

- **Storing raw transcripts** — pass `messages[]` to `add_memory`, let mem0 extract. Do not paste the whole convo.
- **Forgetting `user_id`** — memories land in the default bucket; cross-user contamination follows.
- **Searching only on session start** — memories change; search every turn that references prior state.
- **Calling `delete_all_memories` without scope** — always pair with `user_id`. Double-check before running.
- **API key in commits** — `MEM0_API_KEY` belongs in `.env` / shell, never in source.

## Hosted vs self-hosted

This bundle uses the **hosted** endpoint (`@mem0/mcp-server` → `app.mem0.ai`). Get your key at https://app.mem0.ai/settings/api-keys. Self-hosted mem0 (BYO LLM + vector store) exists but is not covered by this bundle.
