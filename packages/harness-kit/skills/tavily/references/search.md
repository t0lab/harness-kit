# Tavily Search

Find pages, recent info, or high-signal URLs when you do not have a specific link yet.

## When to use

- Discovering sources on a topic
- Recent news or changelog-level freshness
- Domain-scoped lookup (`site:` style filtering)
- First step before `extract` on a promising URL

If you already have the URL, use **extract** instead. If you need a cited multi-source report, use **research**.

## Call shape

**MCP:** `tavily-search` tool with `query` plus optional filters.

**CLI:**
```bash
tvly search "your query" --json
tvly search "quantum computing" --depth advanced --max-results 10 --json
tvly search "AI news" --time-range week --topic news --json
tvly search "SEC filings" --include-domains sec.gov,reuters.com --json
tvly search "react hooks tutorial" --include-raw-content --max-results 3 --json
```

## Parameters

| Parameter | Values | Notes |
|-----------|--------|-------|
| `depth` / `search_depth` | `ultra-fast`, `fast`, `basic` (default), `advanced` | Higher = slower + more relevant |
| `max_results` | 0–20 (default 5) | Keep small; every result costs context |
| `topic` | `general`, `news`, `finance` | Switches the source index |
| `time_range` | `day`, `week`, `month`, `year` | Use for recency-sensitive queries |
| `start_date` / `end_date` | `YYYY-MM-DD` | Explicit window |
| `include_domains` | comma list | Whitelist high-trust sources |
| `exclude_domains` | comma list | Drop known-noisy domains |
| `country` | ISO code | Localise results |
| `include_answer` | `basic`, `advanced` | Short AI-generated answer |
| `include_raw_content` | `markdown`, `text` | Full page text inline — skips extract call |
| `include_images` | bool | Image URLs |
| `chunks_per_source` | int | `fast` / `advanced` depth only |

## Depth cheatsheet

| Depth | Speed | Relevance | Best for |
|-------|-------|-----------|----------|
| `ultra-fast` | Fastest | Lower | Real-time chat, autocomplete |
| `fast` | Fast | Good | Needs chunks, latency-sensitive |
| `basic` | Medium | High | General default |
| `advanced` | Slower | Highest | Precision facts, hard queries |

## Query tips

- **Under 400 characters.** Think "search query", not "prompt".
- **Break complex asks into sub-queries.** Two focused searches beat one kitchen-sink query.
- **Name the product, company, or library explicitly.**
- **Use `include_raw_content`** when you want the page text without a separate extract step.
- **Use `include_domains`** when source quality matters.

## Examples

- `"recent OpenAI Responses API changes April 2026"`
- `"AI startup funding news last 7 days"` with `time_range=week`, `topic=news`
- `"MCP remote servers"` with `include_domains=docs.anthropic.com`

## Escalate when

- You need the full page → **extract**
- The site is large and you need the right subpage → **map**
- You need many pages from one site → **crawl**
- You need a cited report, not raw hits → **research**
