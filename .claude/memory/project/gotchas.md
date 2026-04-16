---
name: gotchas
type: project
created: 2026-04-14
last-updated: 2026-04-15
---

# Gotchas

## npm / publishing

- **Granular access token required** — browser login from `npm login` is read-only; need "Read and write" Granular Access Token.
- **`import.meta.url` guard in CLI entry** — Commander's `parseAsync()` consumes `process.argv` on import, breaking vitest.

## Build / templates

- **`harness.json.hbs`: build arrays in code** — Handlebars `{{#if}}` in arrays produces trailing commas → invalid JSON.
- **`tsconfig.rootDir: "src"`** — manifests must live in `src/registry/bundles/`.
- **`template-renderer.ts` uses `__dir.includes('/dist')`** — fragile path detection; known debt.
- **`execaCommand` does NOT interpret shell operators** — use `shell: true` for `&&`, pipes, etc.

## Wizard UX

- **Diamond symbol width override**: intercept `stdout.write`, not `Object.defineProperty` — ESM namespace exports are non-configurable.
- **Multiselect with 0 options crashes** — guard with length check.

## Artifact quirks

- **`git-workflow.md` rule shared by 3 bundles** (branch-strategy, code-review-gates, conventional-commits). Edit once → affects all.
- **Rule files load on every invocation** — never inline skill content; caught `code-review`'s 6-phase protocol leaked into `git-workflow.md` on 2026-04-14.
- **Pre-commit Node loop runs lint + typecheck only, NOT test** — too slow/flaky for pre-commit. Secret regex covers AKIA, OpenSSH/RSA/EC/DSA/PGP keys, Slack `xox*`, GitHub `gh[pousr]_`, Anthropic `sk-ant-`, OpenAI `sk-*`, Stripe `sk_live_`, Google `AIza*`.
- **Lockfile glob is `package-lock.json`**, not `*lock.json` (too broad).
- **`tags:` frontmatter scrubbed 2026-04-14** — still present in `examples/basic-node/.agents/skills/` test fixtures; leave alone.

## Wizard silent failures (fixed 2026-04-15)

- **`executeAdd` errors were swallowed by `catch {}`** — user selecting a tech without a techstack bundle saw "scaffolded" but got nothing. `go` and `rust` removed from tech-options until techstack bundles exist. Underlying `catch {}` still in `preview-apply.ts:43-45` — pending fix.

## Browser / external tools

- **agent-browser on Linux** needs `libasound2t64` + `--no-sandbox` (AppArmor).
- **`browser-use-mcp-server` hardcodes gpt-4o** — requires `OPENAI_API_KEY`; reason we switched to CLI+skill.
- **`@playwright/cli` ≠ `@playwright/test` ≠ `@playwright/mcp`** — all distinct Microsoft packages. Binary is `playwright-cli`. Drives via accessibility-tree refs (snapshot → click `eN` → re-snapshot).
