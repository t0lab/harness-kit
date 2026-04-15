# firecrawl

Hosted web scraping, search, crawling, and browser interaction via the Firecrawl CLI — clean markdown output shaped for LLM context windows.

## What it installs

| Artifact | Path (in your project) | Purpose |
|----------|----------------------|---------|
| Tool | `firecrawl` CLI (global npm install) | Runs scrape / search / map / crawl / agent / interact / download commands |
| Skill | `.agents/skills/firecrawl/` | Escalation workflow (search → scrape → map → crawl → interact), output conventions, credit-saving patterns |

## How it works

The agent calls the `firecrawl` CLI directly via Bash instead of an MCP server. The skill teaches it the right escalation order — `search` when there's no URL, `scrape` when there is, `map` before committing to a `crawl`, `interact` only when clicks/forms/login are required — and pushes results into a `.firecrawl/` directory with `-o` so large outputs don't flood the context window.

Under the hood, the CLI hits Firecrawl's hosted API, so JS rendering, anti-bot escalation, and markdown cleanup happen server-side. Your agent just quotes the URL and reads the output file.

No explicit invocation needed. When the agent needs to fetch external web content, the skill triggers on phrases like "scrape this page", "find articles about", or any URL reference outside the repo.

## Setup

`firecrawl init --browser` runs as part of the install and will:

1. Install the `firecrawl` CLI globally
2. Open a browser for login and write `FIRECRAWL_API_KEY` into your shell profile
3. Register the skill with every detected AI editor (Claude Code, Cursor, Windsurf)

Verify with `firecrawl --status` — it should show you authenticated with a credit balance.

If you prefer manual auth, grab a key from [firecrawl.dev](https://firecrawl.dev) and `export FIRECRAWL_API_KEY=fc-...`.

Add `.firecrawl/` to `.gitignore` — that's where scrape output lands.

## Pairs well with

- `crawl4ai` — complementary: Firecrawl for zero-setup hosted scrapes, crawl4ai for self-hosted/YouTube/PDF workloads
- `brave-search` / `tavily` — alternate search providers if you don't want scraping credits burned on discovery
- `agent-browser` — deeper browser automation when Firecrawl's `interact` isn't enough (long multi-step flows, custom DOM scripting)
