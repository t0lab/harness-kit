import chalk from 'chalk'

export const MIN_HEIGHT = 16

export function applySymbolFix(): void {
  // Clack uses ◆ (U+25C6) and ◇ (U+25C7) for its step indicators. These are
  // East Asian Width "Ambiguous" — many fonts (especially CJK/Vietnamese) render
  // their glyphs wider than one terminal cell, causing every character that follows
  // to shift right.
  //
  // We replace them with ● (U+25CF BLACK CIRCLE) and ○ (U+25CB WHITE CIRCLE),
  // which are East Asian Width "Narrow" (always 1 column) in all major fonts.
  //
  // Patching clack's exported constants directly is not possible — ESM namespace
  // exports are non-configurable (assignment and Object.defineProperty both throw).
  // Instead, intercept process.stdout.write and substitute at output time.
  const origWrite = process.stdout.write.bind(process.stdout)
  ;(process.stdout as NodeJS.WriteStream & { write: unknown }).write = (
    chunk: string | Uint8Array,
    ...rest: unknown[]
  ) => {
    if (typeof chunk === 'string') {
      chunk = chunk.replaceAll('\u25C6', '\u25CF').replaceAll('\u25C7', '\u25CB')
    }
    return (origWrite as (...a: unknown[]) => boolean)(chunk, ...rest)
  }
}

// ─── Pixel-art harness logo ──────────────────────────────────────────────────
export const LOGO_PLAIN = [
  "   ╔═══════╗   ",
  "  ╔╝       ╚╗  ",
  "  ║  ╔═══╗  ║  ",
  "  ║  ║   ║  ║  ",
  "  ║  ╚═══╝  ║  ",
  "  ╚╗       ╔╝  ",
  "   ╚═══════╝   ",
  "       ║ ║     ",
  "    ═══╝ ╚═══  ",
] as const

const ANSI_RE = /\x1b\[[0-9;]*[mGKHFJABCDsu]/g

export function visibleWidth(s: string): number {
  return s.replace(ANSI_RE, '').length
}

export function centerLine(line: string, cols: number): string {
  const pad = Math.max(0, Math.floor((cols - visibleWidth(line)) / 2))
  return ' '.repeat(pad) + line
}

// Centered logo + warning for when the terminal is too small.
export function renderTooSmall(rows: number, cols: number): string {
  const logo = LOGO_PLAIN.map((l) => chalk.yellow(l))
  const warning = [
    chalk.yellow('⚠  Terminal too small'),
    chalk.dim(`   ${rows} rows — need at least ${MIN_HEIGHT}`),
    '',
    chalk.dim('   Resize the terminal to continue…'),
  ]
  const withLogo = [...logo, '', ...warning]
  const content = rows >= withLogo.length ? withLogo : warning
  const topPad = Math.max(0, Math.floor((rows - content.length) / 2))
  const lines: string[] = [
    ...Array(topPad).fill(''),
    ...content.map((l) => centerLine(l, cols)),
  ]
  while (lines.length < rows) lines.push('')
  return lines.join('\n')
}

// Returns a promise that resolves the next time the terminal is resized.
function waitForResize(): Promise<void> {
  return new Promise((resolve) => { process.stdout.once('resize', resolve) })
}

/**
 * Block until the terminal has at least MIN_HEIGHT rows.
 * Renders the "too small" warning and waits for SIGWINCH between checks.
 * Call this before any wizard step that needs screen space.
 */
export async function guardMinHeight(): Promise<void> {
  if ((process.stdout.rows ?? 24) >= MIN_HEIGHT) return

  // Terminal is too small — show warning and wait for resize events.
  do {
    const rows = process.stdout.rows ?? 24
    const cols = process.stdout.columns ?? 80
    process.stdout.write('\x1b[2J\x1b[H' + renderTooSmall(rows, cols))
    await waitForResize()
  } while ((process.stdout.rows ?? 24) < MIN_HEIGHT)

  // Clear the warning frame so the next prompt starts on a clean screen.
  process.stdout.write('\x1b[2J\x1b[H')
}
