# Tavily Crawl

Extract content from many pages on the same site. Supports saving each page as a local markdown file.

## When to use

- You need content from many pages on a site (e.g. all of `/docs/`)
- You want to mirror documentation for offline use
- One page is not enough and you already know the relevant section

Run **map** first when site structure is unclear — crawling a whole domain blindly is wasteful.

## Call shape

**MCP:** `tavily-crawl` with root URL plus depth/breadth/filters.

**CLI:**
```bash
tvly crawl "https://docs.example.com" --json
tvly crawl "https://docs.example.com" --output-dir ./docs/
tvly crawl "https://docs.example.com" --max-depth 2 --limit 50 --json
tvly crawl "https://example.com" --select-paths "/api/.*,/guides/.*" --exclude-paths "/blog/.*" --json
tvly crawl "https://docs.example.com" --instructions "Find authentication docs" --chunks-per-source 3 --json
```

## Parameters

| Parameter | Values | Notes |
|-----------|--------|-------|
| `max_depth` | 1–5 (default 1) | Link hops from root |
| `max_breadth` | int (default 20) | Links per page |
| `limit` | int (default 50) | Hard cap on pages crawled |
| `instructions` | string | Natural-language semantic focus |
| `chunks_per_source` | 1–5 | Requires `instructions`; returns chunks not full pages |
| `extract_depth` | `basic` (default), `advanced` | `advanced` for JS-rendered pages |
| `format` | `markdown` (default), `text` | |
| `select_paths` / `exclude_paths` | comma regex list | Path filtering |
| `select_domains` / `exclude_domains` | comma regex list | Domain filtering |
| `allow_external` | bool | Follow external links |
| `include_images` | bool | |
| `timeout` | 10–150s | |
| `output_dir` (CLI) | path | Write one `.md` per page |

## Two modes

**Agent context (feeding an LLM):** always pass `instructions` + `chunks_per_source`. Returns only the relevant slices — prevents context explosion.

```bash
tvly crawl "https://docs.example.com" --instructions "API authentication" --chunks-per-source 3 --json
```

**Data collection (saving files):** pass `output_dir`, skip `chunks_per_source`. Produces full markdown files.

```bash
tvly crawl "https://docs.example.com" --max-depth 2 --output-dir ./docs/
```

## Tips

- **Start conservative.** `max_depth=1`, `limit=20`, then scale up.
- **Always set `limit`.** Runaway crawls are the #1 way to waste budget.
- **Filter paths.** `select_paths` beats crawling the whole site.
- **Map first** when you do not know the structure.

## Escalate / de-escalate

- One or two pages → **extract** is cheaper
- You have not found the right section → **map** first
- You need a cited synthesis, not raw pages → **research**
