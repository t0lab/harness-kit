type ItemStatus = 'pending' | 'running' | 'done' | 'error' | 'skip'

interface Item {
  label: string
  status: ItemStatus
}

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

function icon(status: ItemStatus, frame: number): string {
  if (status === 'running') return SPINNER_FRAMES[frame % SPINNER_FRAMES.length]!
  const icons: Record<Exclude<ItemStatus, 'running'>, string> = {
    pending: '◼',
    done:    '✔',
    error:   '✖',
    skip:    '─',
  }
  return icons[status]
}

const COLORS: Record<ItemStatus, string> = {
  pending: '\x1b[2m',
  running: '\x1b[36m',
  done:    '\x1b[32m',
  error:   '\x1b[31m',
  skip:    '\x1b[2m',
}

const RESET = '\x1b[0m'

/**
 * Compact grid progress display for long lists of tasks.
 * Renders all items in a multi-column grid, updates in-place via cursor moves,
 * and animates spinner frames for running items.
 */
export class CompactProgress {
  private items: Item[]
  private cols: number
  private cellWidth: number
  private lineCount: number
  private rendered = false
  private frame = 0
  private timer: NodeJS.Timeout | null = null
  private animate: boolean

  constructor(
    labels: string[],
    termWidth: number,
    opts?: { animate?: boolean },
  ) {
    this.items = labels.map((label) => ({ label, status: 'pending' as ItemStatus }))
    const maxLen = Math.max(4, ...labels.map((l) => l.length))
    this.cellWidth = maxLen + 3   // icon(1) + space(1) + label + trailing space(1)
    this.cols = Math.max(1, Math.floor((termWidth - 2) / (this.cellWidth + 2)))
    this.lineCount = Math.ceil(labels.length / this.cols)

    const isInteractive = process.stdout.isTTY && (process.env.TERM ?? '') !== 'dumb'
    this.animate = opts?.animate ?? isInteractive
  }

  render(): void {
    process.stdout.write(this.buildGrid() + '\n')
    this.rendered = true
    if (!this.animate) return
    this.timer = setInterval(() => {
      this.frame++
      this.redraw()
    }, 80)
  }

  update(label: string, status: ItemStatus): void {
    const item = this.items.find((i) => i.label === label)
    if (!item) return
    item.status = status
    this.redraw()
  }

  stop(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null }
    this.redraw()
  }

  /**
   * Render the current grid as a plain string.
   * Useful when you want the caller (e.g. Listr2) to own rendering.
   */
  getGrid(): string {
    return this.buildGrid()
  }

  private redraw(): void {
    if (!this.rendered) return
    process.stdout.write(`\x1b[${this.lineCount + 1}A` + this.buildGrid() + '\n')
  }

  private buildGrid(): string {
    const lines: string[] = []
    for (let r = 0; r < this.lineCount; r++) {
      const cells: string[] = []
      for (let c = 0; c < this.cols; c++) {
        const idx = r * this.cols + c
        if (idx >= this.items.length) {
          cells.push(' '.repeat(this.cellWidth + 2))
          continue
        }
        const { label, status } = this.items[idx]!
        const col = COLORS[status]
        const ic = icon(status, this.frame)
        const padded = label.padEnd(this.cellWidth - 2)
        cells.push(`${col}${ic} ${padded}${RESET}`)
      }
      // Listr2 already indents `task.output`; avoid extra left padding to prevent terminal wrapping.
      lines.push(cells.join('  '))
    }
    return lines.join('\n')
  }
}
