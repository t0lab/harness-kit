---
name: tavily
description: Web search, content extraction, site mapping, crawling, and deep research via Tavily — use whenever the user needs current web information, wants to pull clean content from a URL, discover pages on a large site, bulk-extract documentation, or produce a cited multi-source research report. Prefer this skill for any agentic web-research workflow; do not fall back to ad-hoc browsing when Tavily can answer the question more cleanly.
tags: [search, tavily, mcp, cli, web, extract, crawl, map, research]
---

# Tavily

Tavily turns the open web into LLM-ready evidence. Use it when plain search results are not enough: current info, domain-scoped discovery, clean page text, site structure, bulk docs, or cited synthesis.

This skill supports both interfaces Tavily ships:

- **MCP server** (`tavily-mcp`) — tools like `tavily-search`, `tavily-extract`, `tavily-map`, `tavily-crawl`.
- **CLI** (`tvly`) — same capabilities plus `tvly research` for deep multi-source reports.

Pick whichever your environment exposes. The decision flow and parameters are the same; only the call syntax differs.

---

## Pick the right capability

Use the smallest capability that answers the question. Escalate only when needed.

| Need | Capability | Reference |
|------|------------|-----------|
| Find pages on a topic, no URL yet | search | [references/search.md](references/search.md) |
| Pull content from a URL you already have | extract | [references/extract.md](references/extract.md) |
| Locate a specific page on a large site | map | [references/map.md](references/map.md) |
| Bulk content from a site section (e.g. all `/docs/`) | crawl | [references/crawl.md](references/crawl.md) |
| Multi-source synthesis with citations | research | [references/research.md](references/research.md) |
| Install / auth / CLI basics | cli | [references/cli.md](references/cli.md) |

---

## Escalation path

Do not jump straight to crawl or research.

1. **search** — when you do not yet know the right URL
2. **extract** — when you know the exact page you need
3. **map** — when one page is not enough and you need site structure
4. **crawl** — when many pages from the same site are clearly required
5. **research** — when you need a cited report synthesizing many sources

This keeps latency, cost, and context volume under control. Read the reference file for the step you land on; do not load all of them upfront.

---

## Core guardrails

- **Search first, then extract the best URLs.** Do not search again for a page you already have.
- **Prefer official domains** for technical questions (`--include-domains` or MCP equivalent).
- **Keep result sets small** unless breadth is explicitly part of the task.
- **Use `--instructions` + `--chunks-per-source`** when crawling for agent context — returns relevant chunks instead of whole pages, preventing context explosion.
- **Always cap crawls** with `--limit` and conservative `--max-depth`.
- Treat Tavily output as evidence to read, not a substitute for reading the source.

---

## Defaults and noise

Tavily accepts defaults via `DEFAULT_PARAMETERS` (MCP) or CLI flags. Useful ones: `max_results`, `search_depth`, `include_raw_content`, `include_images`. Do not enable everything by default — larger responses mean more noise and more context spent.

---

## See also

- [references/cli.md](references/cli.md) — install, auth, JSON output, exit codes
- Tavily docs: https://docs.tavily.com
