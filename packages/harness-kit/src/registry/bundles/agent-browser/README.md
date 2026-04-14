# agent-browser

Token-efficient browser automation via accessibility snapshots (~200-400 tokens/page).

## Artifacts

| Type | Detail |
|------|--------|
| `tool` | `npm install -g agent-browser && agent-browser install` |
| `skill` | [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser) |

## Requirements

- Chrome/Chromium installed
- Linux servers: `libasound2t64` package + `--no-sandbox` flag (AppArmor)

## What it does

Gives Claude browser control using accessibility tree snapshots instead of screenshots. Each page costs ~200-400 tokens (vs ~2000+ for screenshot-based approaches).

Capabilities:
- Navigate, click, type, scroll, wait
- Extract structured data from web pages
- Fill forms, interact with SPAs
- Multi-step workflows (login → navigate → extract)

## Setup

1. Ensure Chrome is installed
2. Run `harness-kit add agent-browser`
   - Installs `agent-browser` CLI globally
   - Installs Playwright browsers via `agent-browser install`
   - Adds the agent-browser skill via `npx skills add`

## Notes

- Accessibility snapshots are text-based — no vision model needed
- Works with headless Chrome (CI/server environments)
- Skill source: [skills.sh/vercel-labs/agent-browser](https://skills.sh/vercel-labs/agent-browser/agent-browser)
