# TUI Design Guide

Design decisions, patterns, and conventions for all terminal UI in harness-kit.

## Stack

- **Ink** (v7) + React — all TUI components render through Ink
- **chalk** — colors outside Ink alt-screen (error messages, pre-render)
- No `process.stdout.write` ANSI from component code — causes render conflicts

## Layout Principles

### Panel / Card Style

Every logical section is a `borderStyle="round"` Box. Border color signals health:

| Color    | Meaning                         |
|----------|---------------------------------|
| `cyan`   | Healthy / informational         |
| `green`  | All good / success              |
| `yellow` | Warning (e.g. env vars unset)   |
| `red`    | Error / drift / missing         |
| `gray`   | Neutral / no data               |

```tsx
<Box borderStyle="round" borderColor="cyan" flexDirection="column" paddingX={1} gap={1}>
  <Text bold>Section title</Text>
  {/* rows */}
</Box>
```

### Two-Panel Navigation (Miller Columns)

Used by `list` — interactive commands that have too much data to show at once.

```
╭─ Categories ────────╮ ╭─ git-workflow  2/3 installed ───────────────╮
│  ▶ git-workflow  2/3│ │  ✓  claude-api          Claude API integ... │
│    mcp-tool      0/2│ │  ✓  git-conventional    Conventional Com... │
│    memory        1/1│ │  ·  security-review     Security code re... │
╰─────────────────────╯ ╰─────────────────────────────────────────────╯
╭─────────────────────────────────────────────────────────────────────╮
│  ✓ 3 installed  · 4 available   [↑↓/jk] navigate  [q] quit         │
╰─────────────────────────────────────────────────────────────────────╯
```

Left panel = index (fixed width). Right panel = detail (`flexGrow={1}`). Footer = summary + keybindings.

### Single-Panel Commands

Static output commands (`activate`, `add`, `status`) render stacked panels, then exit.

```
╭─ <title> ────────────────────────────────────────╮
│  rows...                                         │
╰──────────────────────────────────────────────────╯
╭─ Summary panel ──────────────────────────────────╮
│  ✓ All healthy  /  ✗ 1 drift  ⚠ 2 env vars unset│
╰──────────────────────────────────────────────────╯
```

## Icons

| Icon | Meaning           |
|------|-------------------|
| `✓`  | Success / present |
| `✗`  | Failure / missing |
| `–`  | Skipped           |
| `·`  | Available (not installed) |
| `▶`  | Selected (navigation cursor) |
| `⚠`  | Warning           |
| `↳`  | Sub-action / side-effect |

## Keyboard Model

Interactive components (`useInput`) follow vim-style bindings:

| Key          | Action          |
|--------------|-----------------|
| `↑` / `k`   | Move up         |
| `↓` / `j`   | Move down       |
| `q` / `Esc` | Quit / go back  |

Always show bindings in the footer panel.

## Commands Overview

| Command    | UI Type     | Pattern                                                |
|------------|-------------|--------------------------------------------------------|
| `init`     | Wizard      | Alt-screen, xstate machine, multi-step, Budget footer  |
| `list`     | Interactive | `waitUntilExit()` — Miller Columns, `useInput`         |
| `add`      | Static      | `unmount()` — stacked panels                           |
| `activate` | Static      | `unmount()` — stacked panels                           |
| `status`   | Static      | `unmount()` — stacked panels                           |

---

## Wizard (`init`)

`init` is the most complex UI in the project. It runs a full-screen alt-screen wizard — not a display component — managed by an xstate state machine.

### Architecture

```
runWizard()  (src/wizard/index.ts)
  │
  ├── enters alt-screen  (\x1b[?1049h)
  ├── creates xstate actor (wizardMachine)
  └── event loop: while (state !== 'done') → render step → send event

Steps (src/components/steps/):
  projectInfo      → stepProjectInfo()
  techStackSelect  → selectTechStack()
  detectTooling    → stepDetectTooling()
  harnessConfig    → stepHarnessConfig()
  preview          → stepPreviewApply()
  apply            → stepApply()
```

Each step is an async function that renders an Ink component via `runInk()` and resolves with data when the user confirms, or rejects with `Error('Cancelled')` on Esc.

### xstate Flow

```
projectInfo → techStackSelect → detectTooling → harnessConfig → preview → apply → done
                                      ↑                ↑
                              (skipped if no          BACK allowed
                               tech selected)         from preview
```

The machine accumulates `WizardContext` through `assign()` on each `NEXT` event.

### WizardShell layout

Every step renders inside `WizardShell` — a persistent chrome that wraps all step content:

```
┌─────────────────────────────────────────────────────────────┐  ← alt-screen top
│ harness-kit init · step 3/5 — Harness config                │  ← step header
├──────────────────┬──────────────────────────────────────────┤
│ Steps            │                                          │
│ ✓ Project info   │   step content (SelectList / TextInput)  │
│ ✓ Tech stack     │                                          │
│ ▸ Harness config │                                          │
│ ○ Preview        │                                          │
│ ○ Apply          │                                          │
├──────────────────┴──────────────────────────────────────────┤
│ Budget  1,234 eager + 567 on-demand  12% of 128,000         │  ← Footer
└─────────────────────────────────────────────────────────────┘
```

- **Left pane** (`Summary`) — step progress sidebar, visible only when `cols >= 80`
- **Right pane** — active step content; `flexGrow={1}`, `borderStyle="single"`, `borderColor="cyan"`
- **Footer** (`Footer`) — live token budget bar, always visible

Both panes use `borderStyle="single"` (not `"round"`) to distinguish wizard chrome from display-command panels.

Minimum terminal size: **60 × 16** — `WizardShell` renders a resize warning below that.

### Step contract

```ts
// Each step is an async function:
export async function stepFoo(ctx: WizardContext, budget: BudgetState): Promise<Partial<WizardContext>>

// Internally it renders via runInk():
return runInk<Partial<WizardContext>>((resolve, reject) =>
  <FooScreen ctx={ctx} budget={budget} onDone={resolve} onCancel={() => reject(new Error('Cancelled'))} />
)
```

`runInk()` wraps `render()` + `waitUntilExit()` and wires `onDone`/`onCancel` to resolve/reject the promise.

### Keyboard model (wizard)

| Key            | Action                       |
|----------------|------------------------------|
| `Enter`        | Confirm / advance field      |
| `Space`        | Toggle selection (SelectList)|
| `↑` / `↓`     | Move cursor (SelectList)     |
| `Backspace`    | Delete last char (search)    |
| `Tab`          | Clear search query           |
| `Esc` / `Ctrl+C` | Cancel wizard              |
| Type anything  | Live search filter (SelectList) |

### SelectList component

Reusable picker used by `techStackSelect` and `harnessConfig` steps.

Features:
- **Live fuzzy search** — type to filter by label or hint
- **Virtual scroll** — shows `rows - 10` items; `↑ N more` / `↓ N more` indicators
- **Multi / single** mode — `●/○` vs `◉/○` markers
- **Category labels** — inserted automatically from `item.category`
- **Recommended badge** — `★` suffix for recommended bundles
- `[^D]` triggers auto-detect in steps that support it

### Budget Footer

`BudgetState` tracks token counts (eager + on-demand) and the model's context window. The `Footer` component reads from a reactive snapshot via `useBudgetSnapshot()` and updates as the user makes selections. Color: green → yellow → red as usage approaches the limit.

### Rules

- **No non-Ink inline prompts inside wizard** — direct stdout writes conflict with Ink's alt-screen renderer
- **No `process.stdout.write` ANSI from step components** — use Ink primitives only
- **Each step owns its own `useInput`** — `WizardShell` does not intercept keyboard
- **Cancel always throws `Error('Cancelled')`** — the wizard loop catches it and exits cleanly

---

## Command Lifecycle

**Static** (activate, add, status):

```ts
const { unmount } = render(React.createElement(MyDisplay, props))
await new Promise((resolve) => setTimeout(resolve, 50))
unmount()
```

**Interactive** (list):

```ts
const { waitUntilExit } = render(React.createElement(MyDisplay, props))
await waitUntilExit()
// Component calls exit() from useApp() on q/Esc
```

## Component Anatomy

```
src/components/
  <command>-display.tsx   — Ink component (pure presentation)

src/commands/
  <command>.ts            — Business logic + render call
```

Display components receive data as props — no fetching, no side effects inside them.

## Adding a New Command UI

1. Create `src/components/<name>-display.tsx` with typed props interface
2. Use `borderStyle="round"` panels; set `borderColor` from the color table above
3. Export a named function: `export function <Name>Display(...)`
4. In the command file, call `render()` + either `unmount()` (static) or `waitUntilExit()` (interactive)
5. For interactive: add `useInput` + `useApp` — never block the render loop
