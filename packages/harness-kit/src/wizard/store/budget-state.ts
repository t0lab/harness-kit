import chalk from 'chalk'
import Handlebars from 'handlebars'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { countTokens } from '@harness-kit/core'
import { estimateBundlesCost } from '@/engine/estimate-bundle-cost.js'
import { getAllBundles } from '@/registry/index.js'
import { resolveContextWindow, WARN_THRESHOLD_PERCENT } from '@/commands/budget.js'

const __dir = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = __dir.includes('/dist') ? join(__dir, '..') : join(__dir, '../..')

export interface BundleCost { eager: number; onDemand: number }
export type CostMap = Map<string, BundleCost>

export interface ProjectText {
  projectName: string
  projectPurpose: string
  projectUsers: string
  projectConstraints: string
}

export class BudgetState {
  costMap: CostMap = new Map()
  projectText: ProjectText = { projectName: '', projectPurpose: '', projectUsers: '', projectConstraints: '' }
  selectedTech: string[] = []
  selectedBundles: string[] = []
  private claudeTemplate: HandlebarsTemplateDelegate | null = null
  private listeners = new Set<() => void>()

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn)
    return () => { this.listeners.delete(fn) }
  }

  notify(): void {
    for (const fn of this.listeners) fn()
  }

  setProjectText(patch: Partial<ProjectText>): void {
    this.projectText = { ...this.projectText, ...patch }
    this.notify()
  }

  setSelectedTech(tech: string[]): void {
    this.selectedTech = tech
    this.notify()
  }

  setSelectedBundles(bundles: string[]): void {
    this.selectedBundles = bundles
    this.notify()
  }

  async initialize(): Promise<void> {
    // Pre-compute bundle cost map.
    const names = getAllBundles().map((b: { name: string }) => b.name)
    const { byBundle } = await estimateBundlesCost(names)
    for (const b of byBundle) this.costMap.set(b.name, { eager: b.eager, onDemand: b.onDemand })

    // Pre-compile CLAUDE.md template for realtime re-render.
    const tplPath = join(PKG_ROOT, 'templates/CLAUDE.md.hbs')
    try {
      const raw = await readFile(tplPath, 'utf-8')
      Handlebars.registerHelper('includes', (list: unknown, item: unknown) =>
        Array.isArray(list) && list.includes(item)
      )
      Handlebars.registerHelper('ifEqual', function (this: unknown, a: unknown, b: unknown, opts: Handlebars.HelperOptions) {
        return a === b ? opts.fn(this) : opts.inverse(this)
      })
      this.claudeTemplate = Handlebars.compile(raw)
    } catch {
      this.claudeTemplate = null
    }
  }

  private renderClaudeMd(): string {
    if (!this.claudeTemplate) {
      return [
        `# ${this.projectText.projectName}`,
        this.projectText.projectPurpose,
        this.projectText.projectUsers,
        this.projectText.projectConstraints,
      ].filter(Boolean).join('\n\n')
    }
    try {
      return this.claudeTemplate({
        ...this.projectText,
        selectedTech: this.selectedTech,
        gitWorkflow: [],
        workflowPresets: [],
        memory: '',
      })
    } catch {
      return ''
    }
  }

  computeTotals(): { eager: number; onDemand: number; contextWindow: number; source: string; pct: number } {
    const { value: contextWindow, source } = resolveContextWindow({})
    // Project-derived CLAUDE.md tokens (eager — always in context).
    const projectEager = countTokens(this.renderClaudeMd()).tokens
    // Bundle tokens.
    const unique = new Set([...this.selectedTech, ...this.selectedBundles])
    let eager = projectEager
    let onDemand = 0
    for (const name of unique) {
      const c = this.costMap.get(name)
      if (!c) continue
      eager += c.eager
      onDemand += c.onDemand
    }
    const pct = Math.round((eager / contextWindow) * 10000) / 100
    return { eager, onDemand, contextWindow, source, pct }
  }

  renderFooter(cols: number): string {
    const { eager, onDemand, contextWindow, source, pct } = this.computeTotals()
    const color = pct > WARN_THRESHOLD_PERCENT ? chalk.red : pct > 20 ? chalk.yellow : chalk.green
    const windowLabel = source === 'default' ? `${contextWindow.toLocaleString()} (estimate)` : `${contextWindow.toLocaleString()}`
    const text =
      chalk.bold(' Budget ') +
      chalk.cyan(`${eager.toLocaleString()} eager`) +
      chalk.gray(` + ${onDemand.toLocaleString()} on-demand `) +
      color(`${pct}%`) +
      chalk.gray(` of ${windowLabel}`)
    const visible = text.replace(/\x1b\[[0-9;]*m/g, '')
    if (visible.length <= cols) return text
    return color(` ${pct}% `) + chalk.cyan(`${eager.toLocaleString()}t eager`)
  }
}
