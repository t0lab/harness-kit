---
name: playwright
description: Terminal-driven browser automation via the Playwright CLI — invoke when the agent needs to open a page, interact with a form, click through a flow, or verify UI state. Use this (not the test framework, not screenshot-only scraping) for live browser work. Triggers on "open the browser", "click through", "fill the form", "reproduce the UI bug", "check what the page shows".
---

# Playwright CLI

Drive a real browser from the terminal. Snapshot the accessibility tree, interact by element **ref** (stable IDs like `e3`, `e15`), not by CSS selectors. Screenshots are for humans; the agent works from the snapshot.

---

## Prerequisites

First time on a machine, ensure Playwright and browser binaries are installed:

```bash
npx playwright install chromium
```

The `npx @playwright/mcp` or `npx playwright-cli` entry points run the CLI without a global install. If a command fails with "browser not installed," run the install step above and retry.

---

## Session lifecycle

```bash
playwright-cli open <url>                    # launch default browser, navigate
playwright-cli open <url> --headed           # visible window for debugging
playwright-cli -s=<name> open <url> --persistent   # named session, survives across commands
playwright-cli list                          # list open sessions
playwright-cli close / close-all
```

Use `--headed` when you need to see what's happening or when the user will watch. Headless is the default for speed.

---

## The core loop

For every interaction, follow this cycle:

1. **Snapshot** — `playwright-cli snapshot` returns the accessibility tree with stable refs (`e3`, `e15`, …)
2. **Act by ref** — `click e15`, `fill e7 "hello"`, `press Enter`
3. **Re-snapshot** after anything that changes the DOM (navigation, modal, tab switch, form submit, dynamic load)
4. **Verify** via snapshot, console, or (if a human needs to see it) screenshot

Refs are only valid against the **most recent snapshot**. A stale ref is the #1 failure mode — when a command fails, re-snapshot before retrying.

---

## Command reference

### Navigation
```bash
goto <url>       go-back       go-forward       reload
```

### Interaction (all use refs from latest snapshot)
```bash
click e15                    type "text"            press Enter
fill e7 "email@x.com"        select e9 "option"
check e3 / uncheck e3        hover e5               drag e1 e2
dialog-accept / dialog-dismiss
upload e2 ./file.pdf
```

### State capture
```bash
snapshot [--filename=name.yaml] [--depth=4]
screenshot [--path=output/playwright/foo.png]
eval "document.title"                # escape hatch; prefer CLI commands
```

### Tabs
```bash
tab-new <url>     tab-select <index>     tab-close
```

### Storage & session
```bash
cookie-set key value --domain=example.com --httpOnly
localstorage-set theme dark
state-save auth.json     # capture cookies + storage
state-load auth.json     # restore — skip login next run
```

### Network & debugging
```bash
route "**/*.jpg" --status=404       # mock/block requests
console [log|warn|error]            # dump browser console
network                             # dump network activity
tracing-start / tracing-stop        # record trace for post-mortem
```

---

## When to use Playwright CLI vs. alternatives

| Task | Use |
|------|-----|
| Click through a live UI, fill forms, reproduce a bug | **Playwright CLI** (this skill) |
| Write a persistent E2E test suite | `@playwright/test` (different tool — only pivot if the user asks) |
| Scrape static content at scale | `firecrawl` / `crawl4ai` — faster, no real browser |
| Natural-language browser goals ("book me a flight") | `browser-use` — agent-driven loop, not step-by-step |
| Read a single accessibility tree without interaction | `snapshot` via this CLI is still fine |

---

## Guardrails

- **Never reuse a ref across DOM mutations.** Always snapshot after navigation or dynamic change.
- **Prefer CLI commands over `eval`/`run-code`.** Only drop to JS when no CLI verb covers the action, and say why.
- **Do not pivot to `@playwright/test`** (writing spec files, running a test runner) unless the user explicitly asks for tests.
- **Screenshots go to `output/playwright/`.** Don't scatter PNGs across the repo.
- **Close sessions when done** — `close-all` at end of task, or the browser process lingers.

---

## Common failure modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Element not found: e15" | DOM changed since last snapshot | Re-snapshot, find new ref |
| Browser won't launch | Binaries missing | `npx playwright install chromium` |
| Flaky clicks on dynamic pages | Acting before content loaded | Add a snapshot poll, or wait for expected ref to appear |
| Actions work but nothing visible | Running headless when you wanted to watch | Add `--headed` |
| Session state lost between commands | Not using `--persistent` + `-s=<name>` | Name the session, persist it |
| Screenshot used where snapshot would do | Over-reliance on pixels | Snapshot first; screenshot only for human eyes |
