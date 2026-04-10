# harness-kit

> CLI tool that scaffolds AI agent harness environments for projects.

Inspired by harness engineering principles from OpenAI — design the environment, not just the code.
Distills best practices from [superpowers](https://github.com/superpowers-dev/superpowers) and [everything-claude-code](https://github.com/affaan-m/everything-claude-code) into artifacts you own directly.

## Install

```bash
npx @harness-kit/cli init
```

## Usage

```bash
harness-kit init                    # interactive wizard — detects existing config
harness-kit add typescript          # add a preset bundle
harness-kit add rules/python        # add a single artifact
harness-kit list                    # browse all available modules
harness-kit list --tag testing      # filter by tag
harness-kit info tdd-workflow       # detail + preview
harness-kit status                  # view installed harness state
```

## Design Principles

- **Shadcn distribution model** — artifacts are copied into your project; you own them, no runtime dependency
- **"Just enough"** — not zero, not everything; each module must justify its context window cost
- **AI-powered with static fallback** — generates contextual config when you provide an API key; Handlebars templates otherwise
- **Claude Code first** — targets Claude Code artifacts (`.claude/`, `CLAUDE.md`, `AGENTS.md`); extensible for other IDEs

## Packages

| Package | Description |
|---------|-------------|
| `@harness-kit/cli` | Main CLI package |
| `@harness-kit/core` | Shared constants and types |

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck   # tsc -b project references
```

## License

MIT
