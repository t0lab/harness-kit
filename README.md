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
harness-kit add tdd                 # add a bundle by name
harness-kit add nextjs              # add a techstack bundle (inherits its stack)
harness-kit list                    # browse all available bundles
harness-kit list --category memory  # filter by BundleCategory
harness-kit list --installed        # show only installed bundles
harness-kit status                  # audit harness state (bundles, files, env vars)
```

## Design Principles

- **Copy-own distribution** — artifacts are copied into your project; you own them, no runtime dependency
- **"Just enough"** — not zero, not everything; each module must justify its context window cost
- **Registry is data, not code** — adding a bundle never touches wizard or command code
- **Claude Code first** — targets Claude Code artifacts (`.claude/`, `CLAUDE.md`, `AGENTS.md`); universal skills also install to `.agents/skills/` for other IDEs

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
