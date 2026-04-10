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
harness-kit init                    # interactive wizard — detects existing config
harness-kit add typescript          # add a preset bundle
harness-kit add rules/python        # add a single artifact
harness-kit list                    # browse all available modules
harness-kit list --tag testing      # filter by tag
harness-kit info tdd-workflow       # detail + preview
harness-kit status                  # view installed harness state
```

## License

MIT
