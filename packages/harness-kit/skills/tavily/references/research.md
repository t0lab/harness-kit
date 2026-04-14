# Tavily Research

AI-powered deep research: gathers sources, analyzes them, and produces a cited report. Takes 30–120 seconds.

## When to use

- Multi-source synthesis with explicit citations
- Comparisons ("X vs Y vs Z"), market reports, literature reviews
- You want a structured answer, not raw hits

For quick facts, use **search**. For single-page content, use **extract**. Research is the heaviest capability — reach for it only when synthesis is the deliverable.

Research is currently exposed via the `tvly` CLI. If your MCP server does not expose it, fall back to search + extract and synthesize yourself.

## Call shape

```bash
tvly research "competitive landscape of AI code assistants"
tvly research "electric vehicle market analysis" --model pro
tvly research "AI agent frameworks comparison" --stream
tvly research "fintech trends 2025" --model pro -o fintech-report.md
tvly research "quantum computing breakthroughs" --json
```

## Parameters

| Parameter | Values | Notes |
|-----------|--------|-------|
| `model` | `mini`, `pro`, `auto` (default) | See model table below |
| `stream` | bool | Stream results in real time |
| `no_wait` | bool | Return `request_id` immediately (async) |
| `output_schema` | path | JSON schema for structured output |
| `citation_format` | `numbered`, `mla`, `apa`, `chicago` | |
| `poll_interval` | seconds (default 10) | Async polling cadence |
| `timeout` | seconds (default 600) | Max wait |
| `-o` | path | Save report to file |
| `--json` | — | Machine-readable output |

## Model selection

| Model | Use for | Speed |
|-------|---------|-------|
| `mini` | Single-topic, targeted research | ~30s |
| `pro` | Multi-angle analysis, comparisons | ~60–120s |
| `auto` | API picks based on complexity | varies |

Rule of thumb: **"What does X do?"** → `mini`. **"X vs Y vs Z"** or **"best way to…"** → `pro`.

## Async workflow

For long runs, detach and poll:

```bash
tvly research "topic" --no-wait --json        # returns request_id
tvly research status <request_id> --json      # check
tvly research poll <request_id> --json -o result.json   # wait + save
```

## Tips

- **Use `--stream`** to watch progress and catch off-topic drift early.
- **Use `--output-schema`** when downstream code needs structured fields.
- **Pick `pro`** for comparisons; `mini` for single-topic summaries.
- **Do not use research for quick facts** — it is expensive and slow.
