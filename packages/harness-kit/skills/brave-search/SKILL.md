---
name: brave-search
description: Guide for using Brave Search MCP tools — invoke when searching the web, news, images, videos, or local results via Brave. Use this whenever you need to search online or look something up.
tags: [search, brave, mcp, web]
---

# Brave Search MCP

## Tools

| Tool | When to use |
|------|------------|
| `brave_web_search` | General web search — pages, docs, APIs |
| `brave_news_search` | Recent news, events, announcements |
| `brave_video_search` | Video content, tutorials |
| `brave_image_search` | Image lookup |
| `brave_local_search` | Location-based results (businesses, places) |
| `brave_summarizer` | Summarize a web result (requires prior `brave_web_search` with `summary: true`) |

## Search Operators

Operators go inside the `query` string:

| Operator | Example | Effect |
|----------|---------|--------|
| `site:` | `site:github.com react hooks` | Restrict to domain |
| `ext:` | `ext:pdf typescript handbook` | Filter by file type |
| `"..."` | `"exact phrase"` | Exact match |
| `intitle:` | `intitle:migration guide` | Term must be in title |
| `AND` | `react AND vue` | Both terms required |
| `OR` | `pnpm OR yarn` | Either term |
| `NOT` | `javascript NOT typescript` | Exclude term |
| `lang:` | `lang:en react tutorial` | Filter by language |

Operators combine: `site:docs.anthropic.com "tool use" ext:md`

## Key Params

**freshness** — filter by recency:
- `pd` past day, `pw` past week, `pm` past month, `py` past year
- Date range: `2024-01-01to2024-06-30`

**count** — results per request:
- Web/news: 1-20 (default 20)
- Video/news: 1-50
- Image: 1-200

**safesearch** — `off`, `moderate` (default), `strict`

**country** — 2-letter code or `ALL` (default: US)

**result_filter** — comma-separated: `web,news,videos,discussions,faq,infobox,locations`

**goggles** — custom result ranking. Boost trusted sources, suppress spam, or focus on specific domains. Pass a Goggle URL or inline rules.

**summary** — set `true` on `brave_web_search`, then call `brave_summarizer` with the returned key.

**extra_snippets** — longer snippet text for each result (useful for extracting more context without visiting pages).

## Examples

**Recent docs for a library:**
```
brave_web_search(query: "vite 6 migration guide", freshness: "pm", count: 5)
```

**Search within a specific site:**
```
brave_web_search(query: "site:docs.anthropic.com tool use streaming")
```

**News from past week:**
```
brave_news_search(query: "anthropic claude", freshness: "pw", count: 10)
```

**PDF files only:**
```
brave_web_search(query: "ext:pdf machine learning survey 2024", count: 5)
```

**Search + summarize:**
```
brave_web_search(query: "react server components", summary: true, count: 3)
brave_summarizer(key: <summary_key from result>)
```

## Response

Results include: title, URL, description, published date, thumbnail, and structured data (products, recipes, articles, ratings, FAQs). Check `has_more` for pagination via `offset`.
