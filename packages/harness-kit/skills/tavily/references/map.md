# Tavily Map

Discover URLs on a website without fetching content. Fast reconnaissance before extract or crawl.

## When to use

- You know the site but not the exact page
- You want a URL list before deciding what to extract or crawl
- You want to understand site shape before committing to a full crawl

Map returns URLs only — no content. Pair it with **extract** for targeted retrieval.

## Call shape

**MCP:** `tavily-map` with a root URL and optional filters.

**CLI:**
```bash
tvly map "https://docs.example.com" --json
tvly map "https://docs.example.com" --instructions "Find API docs and guides" --json
tvly map "https://example.com" --select-paths "/blog/.*" --limit 500 --json
tvly map "https://example.com" --max-depth 3 --limit 200 --json
```

## Parameters

| Parameter | Values | Notes |
|-----------|--------|-------|
| `max_depth` | 1–5 (default 1) | Link hops from root |
| `max_breadth` | int (default 20) | Links followed per page |
| `limit` | int (default 50) | Hard cap on URLs returned |
| `instructions` | string | Natural-language URL filter |
| `select_paths` | comma regex list | Include matching paths |
| `exclude_paths` | comma regex list | Drop matching paths |
| `select_domains` / `exclude_domains` | comma regex list | Domain-level filtering |
| `allow_external` | bool | Follow external links |
| `timeout` | 10–150s | |

## Map + Extract pattern

Often cheaper than crawling:

```bash
# 1. Find candidates
tvly map "https://docs.example.com" --instructions "authentication" --json

# 2. Extract only the page(s) you actually need
tvly extract "https://docs.example.com/api/authentication" --json
```

## Tips

- **Map is reconnaissance, not retrieval.** No content is fetched.
- **Use `instructions`** for semantic filtering when regex is not enough.
- **Map + extract beats crawl** when you need a handful of pages.
- **Keep `limit` modest** until you know the site; it grows fast.

## Escalate when

- Two pages is enough → **extract**
- You need dozens from one section → **crawl**
