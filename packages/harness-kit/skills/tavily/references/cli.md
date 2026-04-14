# Tavily CLI & Environment

Install, auth, and general usage notes for the `tvly` CLI. The MCP server (`tavily-mcp`) needs only `TAVILY_API_KEY`; this file mainly covers the CLI path.

## Install

```bash
curl -fsSL https://cli.tavily.com/install.sh | bash
```

Alternatives:

```bash
uv tool install tavily-cli
pip install tavily-cli
```

Check with:

```bash
tvly --status
```

## Authenticate

```bash
# OAuth (opens browser)
tvly login

# Explicit API key
tvly login --api-key tvly-YOUR_KEY

# Env var (works for both CLI and MCP)
export TAVILY_API_KEY=tvly-YOUR_KEY
```

API keys come from https://app.tavily.com.

## MCP server

This bundle wires an MCP entry:

```json
{
  "mcpServers": {
    "tavily": {
      "command": "npx",
      "args": ["-y", "tavily-mcp@latest"],
      "env": { "TAVILY_API_KEY": "${TAVILY_API_KEY}" }
    }
  }
}
```

Set `TAVILY_API_KEY` in your environment (shell profile, `.envrc`, or the runner's secret store) before starting the agent.

## Output conventions

- `--json` — structured output, used by every command
- `-o <path>` — save output to file
- `--output-dir <path>` — (crawl only) one `.md` per page
- Stdin with `-` — e.g. `echo "query" | tvly search - --json`

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | success |
| 2 | bad input |
| 3 | auth error |
| 4 | API error |

## Shell hygiene

- **Always quote URLs.** Shells interpret `?` and `&`; unquoted URLs break silently.
- **Pin models/flags** in scripts so reruns are reproducible.

## Help

```bash
tvly --help
tvly <command> --help
```

Full docs: https://docs.tavily.com
