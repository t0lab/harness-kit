# @harness-kit/cli

CLI tool that scaffolds AI agent harness environments for projects.

## Install

```bash
npm install -g @harness-kit/cli
# or use directly
npx @harness-kit/cli init
```

## Usage

```bash
harness-kit init     # interactive wizard — sets up CLAUDE.md, MCP config, rules, and harness.json
```

## What gets scaffolded

- `CLAUDE.md` — project instructions for Claude
- `AGENTS.md` — project map for AI agents
- `harness.json` — harness state (installed bundles)
- `llms.txt` — LLM-friendly project summary
- `.claude/settings.json` — Claude tool permissions
- `.mcp.json` — MCP server configuration (based on selected tools)

## License

MIT
