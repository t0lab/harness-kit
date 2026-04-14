# Tavily Extract

Pull clean markdown or text from one or more URLs you already have.

## When to use

- You have a specific URL and want its content
- You need text from JavaScript-rendered pages
- A search result looks promising and you want the full page

If you do not have the URL yet, run **search** or **map** first.

## Call shape

**MCP:** `tavily-extract` with a list of URLs and optional query/depth.

**CLI:**
```bash
tvly extract "https://example.com/article" --json
tvly extract "https://example.com/page1" "https://example.com/page2" --json
tvly extract "https://example.com/docs" --query "authentication API" --chunks-per-source 3 --json
tvly extract "https://app.example.com" --extract-depth advanced --json
tvly extract "https://example.com/article" -o article.md
```

## Parameters

| Parameter | Values | Notes |
|-----------|--------|-------|
| `urls` | 1–20 URLs | Batch larger lists into multiple calls |
| `query` | string | Rerank chunks by relevance to this query |
| `chunks_per_source` | 1–5 | Requires `query`; returns only relevant chunks |
| `extract_depth` | `basic` (default), `advanced` | `advanced` for JS-heavy SPAs, dynamic tables |
| `format` | `markdown` (default), `text` | |
| `include_images` | bool | Image URLs in output |
| `timeout` | 1–60s | Raise for slow pages |

## Depth cheatsheet

| Depth | Use when |
|-------|----------|
| `basic` | Simple pages — try this first |
| `advanced` | JS-rendered SPAs, dynamic tables, anti-bot pages |

## Tips

- **Max 20 URLs per request.** Split larger batches.
- **Use `query` + `chunks_per_source`** to return only relevant slices — cheaper and cleaner context.
- **Start with `basic`, escalate to `advanced`** if the result is empty or broken.
- **Set `timeout`** generously (up to 60s) for slow pages.
- If your earlier search used `include_raw_content`, you may not need a separate extract call at all.

## Escalate when

- Content is scattered across many pages → **crawl**
- You still have not found the right URL → **map**
- You need a synthesized, cited answer rather than raw text → **research**
