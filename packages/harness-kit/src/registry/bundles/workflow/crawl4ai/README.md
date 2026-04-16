---
title: Crawl4AI
description: Open-source web scraping with JavaScript rendering, LLM extraction, deep crawl, and YouTube/PDF processing — self-hosted, no API key required.
category: workflow
slug: crawl4ai
---
# Crawl4AI

Open-source web scraping with JavaScript rendering, LLM extraction, deep crawl, and YouTube/PDF processing — self-hosted, no API key required.

## What it installs

| Artifact | Path (in your project) | Purpose |
|----------|----------------------|---------|
| MCP server | `.mcp.json` → crawl4ai | 19 tools via walksoda/crawl-mcp |
| Skill | `.agents/skills/crawl4ai/` | Tool selection guide, LLM extraction, context overflow prevention |

## Setup

Requires Python 3 and `uv`:

```bash
pip install uv   # or: curl -LsSf https://astral.sh/uv/install.sh | sh
```

The MCP server installs automatically on first use via `uvx`.

## Key tools

| Category | Tools |
|----------|-------|
| Single page | `crawl_url`, `extract_structured`, `extract_entities`, `extract_schema` |
| Multi-page | `crawl_deep`, `crawl_multiple` |
| YouTube | `youtube_transcript`, `youtube_metadata`, `youtube_batch` |
| Files | PDF, Word, Excel, PowerPoint → markdown |

## LLM extraction

`extract_structured` uses an LLM to extract semantically — useful when data is scattered or requires reasoning rather than CSS selection. Set `extraction_type: schema` and provide `instructions`.

## Avoiding context overflow

Pass `output_path` on large crawls to write results to disk instead of returning inline:
```
tool: crawl_deep, seed_url: ..., output_path: /tmp/result.md
```
The tool returns a summary + file path. Read specific sections as needed.

## vs Firecrawl

| | crawl4ai | Firecrawl |
|---|---|---|
| Cost | Free (self-hosted) | $16–$83/month SaaS |
| Setup | Medium (needs Python/uv) | Zero (just API key) |
| Privacy | On-premise | Cloud |
| YouTube/PDF | Yes | No |
| Scale | Unlimited | Tier-limited |

**Choose crawl4ai** for high-volume, privacy-sensitive, or Python-native workflows.  
**Choose Firecrawl** for zero-setup, quick HTML→markdown scraping.

## Self-hosted Docker (optional)

For production or high-volume use:

```bash
docker run -d -p 11235:11235 --shm-size=1g unclecode/crawl4ai:latest
```

Connect via MCP SSE at `http://localhost:11235/mcp/sse`.

## Pairs well with

- `firecrawl` — complementary: Firecrawl for quick scrapes, crawl4ai for deep/structured/video extraction
- `brave-search` — find URLs to crawl, then extract with crawl4ai
- `tavily` — Tavily for search + AI answers, crawl4ai for raw page content
