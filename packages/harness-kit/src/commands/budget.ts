import chalk from 'chalk'
import { basename } from 'node:path'
import React from 'react'
import { render } from 'ink'
import type { Command } from 'commander'
import type { Artifact, BundleManifest, HarnessConfig } from '@harness-kit/core'
import { harnessExists, readHarnessConfig } from '@/config/harness-reader.js'
import { getAllBundles } from '@/registry/index.js'
import { getRoleData } from '@/utils/bundle-utils.js'
import { computeContextCost, type CostFile } from '@/engine/context-cost.js'
import { BudgetDisplay } from '@/components/budget-display.js'

import {
  DEFAULT_CONTEXT_WINDOW,
  WARN_THRESHOLD_PERCENT,
  type ContextWindowSource,
  type BudgetOptions,
  resolveContextWindow,
} from '@/lib/budget-config.js'

export {
  DEFAULT_CONTEXT_WINDOW,
  WARN_THRESHOLD_PERCENT,
  type ContextWindowSource,
  type BudgetOptions,
  resolveContextWindow,
}

export interface BundleBudget {
  name: string
  files: CostFile[]
  eagerTokens: number
  onDemandTokens: number
}

export interface BudgetReport {
  totals: {
    eager: number
    onDemand: number
    total: number
    percentOfWindow: number
    contextWindow: number
    contextWindowSource: ContextWindowSource
    degraded: boolean
  }
  byBundle: BundleBudget[]
  userAuthored: { files: CostFile[]; eagerTokens: number; onDemandTokens: number }
  warnThresholdPercent: number
}

interface HarnessConfigWithWindow {
  contextWindow?: number
}

interface ManagedPathMap {
  // relPath → bundle name
  exact: Map<string, string>
  // path prefix (e.g. `.claude/skills/tdd/`) → bundle name
  prefix: Array<{ prefix: string; bundleName: string }>
}

function collectArtifacts(bundle: BundleManifest): Artifact[] {
  const rawArtifacts: Artifact[] = [
    ...bundle.common.artifacts,
    ...(getRoleData(bundle, bundle.defaultRole)?.artifacts ?? []),
  ]
  // Expand stack refs so inherited artifacts are also attributed.
  const lookup = new Map(getAllBundles().map((b) => [b.name, b]))
  const expanded: Artifact[] = []
  for (const a of rawArtifacts) {
    if (a.type !== 'stack') {
      expanded.push(a)
      continue
    }
    const target = lookup.get(a.ref)
    if (target) expanded.push(...target.common.artifacts)
  }
  return expanded
}

function skillNameFromSrc(src: string): string | null {
  // Local bundled skill: src like `skills/tdd`
  if (src.startsWith('skills/')) {
    const name = src.slice('skills/'.length).split('/')[0]
    return name || null
  }
  // Remote: take last URL segment as best-effort skill name
  try {
    const url = new URL(src)
    const parts = url.pathname.split('/').filter(Boolean)
    return parts.length > 0 ? parts[parts.length - 1] ?? null : null
  } catch {
    return null
  }
}

export function resolveManagedPaths(config: HarnessConfig): ManagedPathMap {
  const exact = new Map<string, string>()
  const prefix: Array<{ prefix: string; bundleName: string }> = []
  const registry = getAllBundles()

  for (const bundleName of config.bundles) {
    const bundle = registry.find((b) => b.name === bundleName)
    if (!bundle) continue

    for (const artifact of collectArtifacts(bundle)) {
      switch (artifact.type) {
        case 'rule': {
          const dest = `.claude/rules/${artifact.src.replace(/^rules\//, '')}`
          exact.set(dest, bundleName)
          break
        }
        case 'agent': {
          exact.set(`.claude/agents/${basename(artifact.src)}`, bundleName)
          break
        }
        case 'hook': {
          exact.set(`.claude/hooks/${basename(artifact.src)}`, bundleName)
          break
        }
        case 'skill': {
          const name = skillNameFromSrc(artifact.src)
          if (name) prefix.push({ prefix: `.claude/skills/${name}/`, bundleName })
          break
        }
        default:
          // mcp → lives in .mcp.json (already counted in scan), tool/plugin/git-hook/file not eager.
          break
      }
    }
  }
  return { exact, prefix }
}

function lookupBundleForPath(relPath: string, managed: ManagedPathMap): string | null {
  const direct = managed.exact.get(relPath)
  if (direct) return direct
  for (const { prefix, bundleName } of managed.prefix) {
    if (relPath.startsWith(prefix)) return bundleName
  }
  return null
}

export async function computeBudget(cwd: string, options: BudgetOptions = {}): Promise<BudgetReport> {
  if (!(await harnessExists(cwd))) {
    throw new Error('harness.json not found. Run harness-kit init first.')
  }
  const config = await readHarnessConfig(cwd)
  const managed = resolveManagedPaths(config)
  const windowResolved = resolveContextWindow(
    options,
    config as HarnessConfigWithWindow
  )

  // Build a Set of managed rel paths for computeContextCost's classification.
  const managedSet = new Set<string>(managed.exact.keys())

  // For prefix-based (skills), we'll classify after the scan, so first scan all:
  const costReport = await computeContextCost(cwd, { managedPaths: managedSet })

  // Re-attribute files to specific bundles. Start by pulling files into buckets.
  const byBundleMap = new Map<string, BundleBudget>()
  const userFiles: CostFile[] = []
  let userEager = 0
  let userOnDemand = 0

  for (const file of costReport.files) {
    const bundleName = lookupBundleForPath(file.relPath, managed)
    if (bundleName) {
      const existing = byBundleMap.get(bundleName) ?? {
        name: bundleName,
        files: [],
        eagerTokens: 0,
        onDemandTokens: 0,
      }
      // Patch source field for prefix-matched skill files (managedPaths Set didn't include them).
      const patched: CostFile = { ...file, source: 'harness-kit' }
      existing.files.push(patched)
      existing.eagerTokens += file.eagerTokens
      existing.onDemandTokens += file.onDemandTokens
      byBundleMap.set(bundleName, existing)
    } else {
      userFiles.push(file)
      userEager += file.eagerTokens
      userOnDemand += file.onDemandTokens
    }
  }

  const byBundle = [...byBundleMap.values()].sort((a, b) => b.eagerTokens - a.eagerTokens)
  const totalEager = byBundle.reduce((s, b) => s + b.eagerTokens, 0) + userEager
  const totalOnDemand = byBundle.reduce((s, b) => s + b.onDemandTokens, 0) + userOnDemand
  const percent = (totalEager / windowResolved.value) * 100

  return {
    totals: {
      eager: totalEager,
      onDemand: totalOnDemand,
      total: totalEager + totalOnDemand,
      percentOfWindow: Math.round(percent * 100) / 100,
      contextWindow: windowResolved.value,
      contextWindowSource: windowResolved.source,
      degraded: percent > WARN_THRESHOLD_PERCENT,
    },
    byBundle,
    userAuthored: { files: userFiles, eagerTokens: userEager, onDemandTokens: userOnDemand },
    warnThresholdPercent: WARN_THRESHOLD_PERCENT,
  }
}

async function renderHuman(report: BudgetReport): Promise<void> {
  const { unmount } = render(React.createElement(BudgetDisplay, { report }))
  await new Promise((resolve) => setTimeout(resolve, 100))
  unmount()
}

export function registerBudgetCommand(program: Command): void {
  program
    .command('budget')
    .description('Measure context-window cost of installed harness')
    .option('--json', 'output machine-readable JSON')
    .option('--context-window <tokens>', 'override context window (tokens) for budget math', (v) => Number(v))
    .action(async (opts: { json?: boolean; contextWindow?: number }) => {
      try {
        const report = await computeBudget(
          process.cwd(),
          opts.contextWindow !== undefined ? { contextWindow: opts.contextWindow } : {}
        )
        if (opts.json) {
          console.log(JSON.stringify(report, null, 2))
        } else {
          await renderHuman(report)
        }
        if (report.totals.degraded) process.exit(1)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(chalk.red(`✗ ${msg}`))
        process.exit(1)
      }
    })
}
