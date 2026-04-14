---
name: crawl4ai
description: crawl4ai web scraping — invoke when scraping a known URL, extracting structured data from pages, crawling docs/sites deeply, or processing YouTube transcripts / PDFs / Office files. Use AFTER you already have URLs (e.g. from a search tool); crawl4ai fetches and extracts content, it does not search the web. Picks the right tool from the full set and avoids context overflow on large results.
---

# crawl4ai

Open-source web scraping with JS rendering and LLM extraction. Several categories of MCP tools — pick the right one rather than defaulting to `crawl_url` every time.

---

## Tool selection guide

### Single page
| Goal | Tool |
|------|------|
| Scrape a URL, get clean markdown | `crawl_url` |
| Extract structured fields (name, price, date…) | `extract_structured` |
| Extract emails, phones, custom entities | `extract_entities` |
| Get a defined JSON schema from a page | `extract_schema` |

### Multi-page
| Goal | Tool |
|------|------|
| Crawl a whole site / docs section | `crawl_deep` |
| Batch several specific URLs | `crawl_multiple` |

### YouTube
| Goal | Tool |
|------|------|
| Get transcript with timestamps | `youtube_transcript` |
| Get video metadata (no API key needed) | `youtube_metadata` |
| Batch several videos | `youtube_batch` |

### Files
Use the file-processing tools for PDF, Word, Excel, PowerPoint, ZIP → markdown.

---

## LLM extraction

`extract_structured` and `extract_schema` use an LLM to extract meaning, not just structure. When to use:
- Data is scattered across the page (not in a clean table or CSS-selectable element)
- You need semantic reasoning ("extract all risks mentioned in this report")
- You want a typed JSON output defined by a schema

```
tool: extract_structured
url: https://example.com/product
instructions: "Extract: product name, price, availability, specs as JSON"
extraction_type: schema
```

The underlying LLM comes from your environment — pass `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` in your `.llm.env` if using the self-hosted Docker instance.

---

## Avoiding context overflow

Large pages and deep crawls produce massive outputs. Use `output_path` to write results to disk instead of returning everything inline:

```
tool: crawl_deep
seed_url: https://docs.example.com
max_depth: 3
max_pages: 50
output_path: /tmp/docs-crawl.md
```

With `output_path` set, the tool returns a summary and file path instead of dumping the full content. Read specific sections from the file as needed. This prevents context overflow on large sites.

---

## Deep crawl parameters

`crawl_deep` key settings:
- `max_depth` — how many link hops from seed (1–6, default 2)
- `max_pages` — total page cap (5–5000, default 50)
- `same_domain_only` — stay on the seed domain (default true)
- `include_pattern` / `exclude_pattern` — regex to filter URLs

Start narrow (`max_depth: 2`, `max_pages: 20`) and expand only if needed.

---

## JS rendering and anti-bot

JS rendering + proxy/anti-bot escalation are handled automatically — no manual config needed for most cases.

---

## Self-hosted Docker (production)

For high-volume or privacy-sensitive use, run `unclecode/crawl4ai` (port 11235) and connect via MCP SSE at `http://localhost:11235/mcp/sse`. See the crawl4ai docs for Docker args and `.llm.env` setup.
