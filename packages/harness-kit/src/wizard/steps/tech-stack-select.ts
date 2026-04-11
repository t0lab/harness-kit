import { AutocompletePrompt, isCancel } from "@clack/core";
import chalk from "chalk";
import { detectTechStack } from "../detect-tech.js";
import { MIN_HEIGHT, renderTooSmall } from "../layout.js";
import type { TechOption } from "../types.js";

// TechOption satisfies @clack/core's OptionLike constraint ({ value, label?, disabled? })
// We store the full TechOption as the option object so render() has hint/category/tags access.
type TechOptionLike = TechOption & { value: string };

function toOptionLike(opt: TechOption): TechOptionLike {
  return { ...opt, value: opt.id };
}

// ─── Alternate screen + absolute-status rendering ────────────────────────────
//
// clack is an *inline* prompt library: restoreCursor() moves up by
// `prevFrame.lineCount - 1`. This works for compact 3-8 line frames but breaks
// for full-screen renders in two ways:
//
//   1. Initial position: if the cursor starts mid-terminal, outputting `rows`
//      lines causes scrolling; the cursor lands at the wrong row on next render.
//
//   2. Resize (SIGWINCH): when the terminal height changes between renders,
//      restoreCursor() uses the OLD line count to move up, so the new frame
//      is drawn at the wrong position → duplicate / stale content.
//
// Fixes:
//
//   Fix 1 — Alternate screen buffer (\x1b[?1049h):
//     Gives a clean full-screen canvas with cursor pinned at (1,1). Isolated
//     from the normal scroll buffer. restoreCursor() reliably reaches row 1.
//
//   Fix 2 — Clear-on-resize:
//     When rows/cols change between renders, prepend \x1b[2J\x1b[H to the
//     frame. ANSI codes contain no newlines so clack's lineCount is unaffected.
//
//   Fix 3 — Absolute status bar (\x1b[rows;1H):
//     Status bar is positioned at the last row via cursor save/restore so
//     item lines need no padding. Items fill all available space (flex-1).
//     clack's lineCount only covers content lines; restoreCursor() stays correct.
//
// Layout (rows = terminal height):
//   Line 1:    header
//   Line 2:    blank
//   Line 3:    search bar
//   Line 4:    blank
//   Lines 5…:  items — fills available space
//   Line rows: status bar (absolute)
//
// HEADER_LINES = 4.  vp = max(1, rows - HEADER_LINES - 1 - SEPARATOR_BUDGET).
const HEADER_LINES = 4;

// Budget for category separators (max 5) and scroll indicators (max 2).
const SEPARATOR_BUDGET = 7;

// Clamp scrollOffset so `cursor` stays within the viewport.
function clampScrollOffset(
  cursor: number,
  scrollOffset: number,
  vp: number,
  total: number,
): number {
  let next = scrollOffset;
  if (cursor === 0) next = 0;
  else if (cursor < next) next = cursor;
  else if (cursor >= next + vp) next = cursor - vp + 1;
  return Math.max(0, Math.min(next, Math.max(0, total - vp)));
}

// Build the visible item lines for the current viewport.
function buildItemLines(
  filtered: TechOptionLike[],
  scrollOffset: number,
  vp: number,
  selected: Set<string>,
  focused: string | undefined,
): string[] {
  if (filtered.length === 0) return [chalk.dim("  No matches")];

  const lines: string[] = [];
  if (scrollOffset > 0) lines.push(chalk.dim(`  ↑ ${scrollOffset} more`));

  let prevCategory = "";
  for (const item of filtered.slice(scrollOffset, scrollOffset + vp)) {
    if (item.category !== prevCategory) {
      const sep = "─".repeat(Math.max(0, 45 - item.category.length));
      lines.push(chalk.dim(`  ── ${item.category} ${sep}`));
      prevCategory = item.category;
    }
    const isActive = item.id === focused;
    const checkbox = selected.has(item.id) ? chalk.green("◼") : chalk.dim("◻");
    const label = isActive ? chalk.cyan(item.label) : item.label;
    const prefix = isActive ? chalk.cyan("›") : " ";
    lines.push(`  ${prefix} ${checkbox}  ${label.padEnd(20)} ${chalk.dim(item.hint)}`);
  }

  const remaining = filtered.length - scrollOffset - vp;
  if (remaining > 0) lines.push(chalk.dim(`  ↓ ${remaining} more`));
  return lines;
}

export async function selectTechStack(
  options: TechOption[],
): Promise<string[]> {
  let scrollOffset = 0;
  let lastRows = process.stdout.rows ?? 24;
  let lastCols = process.stdout.columns ?? 80;
  // Transient status message shown after auto-detect, cleared after 2 s.
  let detectFeedback: string | null = null;
  let detectTimer: ReturnType<typeof setTimeout> | null = null;

  // Enter alternate screen: clean full-screen canvas, cursor at (1,1).
  process.stdout.write("\x1b[?1049h\x1b[2J\x1b[H");
  const exitAltScreen = () => process.stdout.write("\x1b[?1049l");
  process.once("exit", exitAltScreen);

  const prompt = new AutocompletePrompt<TechOptionLike>({
    options: options.map(toOptionLike),
    multiple: true,
    filter(query, opt) {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        opt.label.toLowerCase().includes(q) ||
        opt.hint.toLowerCase().includes(q) ||
        opt.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    },
    render() {
      const rows = process.stdout.rows ?? 24;
      const cols = process.stdout.columns ?? 80;
      const vp = Math.max(1, rows - HEADER_LINES - 1 - SEPARATOR_BUDGET);

      const resized = rows !== lastRows || cols !== lastCols;
      if (resized) { lastRows = rows; lastCols = cols; }

      if (rows < MIN_HEIGHT) {
        const msg = renderTooSmall(rows, cols);
        return resized ? `\x1b[2J\x1b[H${msg}` : msg;
      }

      const filtered = this.filteredOptions;
      const selected = new Set(this.selectedValues as string[]);
      scrollOffset = clampScrollOffset(this.cursor, scrollOffset, vp, filtered.length);
      const itemLines = buildItemLines(
        filtered,
        scrollOffset,
        vp,
        selected,
        this.focusedValue as string | undefined,
      );

      const detectHint = detectFeedback ?? chalk.dim("[Ctrl+A] auto-detect");
      const statusLine =
        chalk.dim(`  ${selected.size} selected   [↑↓] navigate   [Space] toggle   `) +
        detectHint +
        chalk.dim(`   [Enter] confirm`);
      // Status bar is absolute-positioned at row `rows` via cursor save/restore.
      // \x1b[s saves, \x1b[rows;1H jumps to bottom, \x1b[u restores — no newlines
      // added so clack's lineCount stays correct for restoreCursor().
      const content = [
        chalk.cyan("?") + " Select your tech stack " + chalk.dim("(type to search, Space to toggle)"),
        "",
        "  Search: " + this.userInputWithCursor,
        "",
        ...itemLines,
      ].join("\n");
      // \x1b[2K clears the full row before writing so leftover chars from a
      // longer previous status line don't bleed through.
      const frame = content + `\x1b[s\x1b[${rows};1H\x1b[2K${statusLine}\x1b[u`;
      return resized ? `\x1b[2J\x1b[H${frame}` : frame;
    },
  });

  // Typed cast for internal clack fields/methods not in the public TypeScript API.
  const p = prompt as unknown as {
    emit: (event: string, ...args: unknown[]) => unknown
    render(): void
    toggleSelected(value: string): void
    selectedValues: string[]
    isNavigating: boolean
  };

  // ── Fix: space always toggles regardless of isNavigating state ───────────────
  // clack's AutocompletePrompt only toggles on space when isNavigating=true
  // (set by pressing arrow keys). When the user types in search, isNavigating
  // is false so space falls through to the search input. We pre-set isNavigating
  // before clack's keypress handler runs by registering BEFORE prompt.prompt()
  // adds clack's listener (event listeners fire in registration order).
  const fixSpaceToggle = (_char: string | undefined, key: { name?: string }) => {
    if (key?.name === "space") p.isNavigating = true;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  process.stdin.on("keypress", fixSpaceToggle as any);

  // ── Prevent cursor wrap + handle Ctrl+D detect ───────────────────────────────
  // clack's d() always wraps (hardcoded). The only safe interception point is
  // prompt.emit(), which is public and fires before the private key handler.
  // Shadowing emit as an own property means internal this.emit() calls inside
  // clack also hit our wrapper (JS property lookup finds own props first).
  const origEmit = p.emit.bind(prompt);
  p.emit = (event, ...args) => {
    if (event === "key") {
      if ((process.stdout.rows ?? 24) < MIN_HEIGHT) return;
      const key = args[1] as { name?: string; ctrl?: boolean } | undefined;

      // Ctrl+A: detect tech stack from project files and pre-select matches.
      // (Ctrl+D is unusable — readline treats \x04 as EOF on empty input and
      // closes the stream before our interceptor fires. Ctrl+A only moves the
      // readline cursor to pos 0, which is harmless as a side effect.)
      // Fallback: match raw sequence '\x01' in case key.name is absent on some terminals.
      const isCtrlA = (key?.ctrl && key.name === "a") || args[0] === "\x01";
      if (isCtrlA) {
        const detected = detectTechStack(process.cwd());
        let newCount = 0;
        for (const id of detected) {
          if (!p.selectedValues.includes(id)) { p.toggleSelected(id); newCount++; }
        }
        detectFeedback = newCount > 0
          ? chalk.green(`✓ ${newCount} detected`)
          : chalk.dim("nothing detected in this project");
        if (detectTimer) clearTimeout(detectTimer);
        detectTimer = setTimeout(() => { detectFeedback = null; detectTimer = null; p.render(); }, 2000);
        p.render();
        return;
      }

      const last = Math.max(0, prompt.filteredOptions.length - 1);
      if (key?.name === "up" && prompt.cursor === 0) return;
      if (key?.name === "down" && prompt.cursor === last) return;
    }
    return origEmit(event, ...args);
  };

  const result = await prompt.prompt();
  exitAltScreen();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  process.stdin.removeListener("keypress", fixSpaceToggle as any);
  process.removeListener("exit", exitAltScreen);

  if (isCancel(result)) return [];
  return (result as string[]) ?? [];
}
