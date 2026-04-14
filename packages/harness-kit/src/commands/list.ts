import chalk from 'chalk'
import { getAllBundles } from '../registry/index.js'
import { harnessExists, readHarnessConfig } from '../config/harness-reader.js'
import type { BundleManifest, BundleCategory } from '@harness-kit/core'
import type { Command } from 'commander'

const BUNDLE_CATEGORIES: BundleCategory[] = [
  'git-workflow', 'workflow-preset', 'memory', 'browser', 'search', 'scrape',
  'mcp-tool',
]

function isBundleCategory(v: string): v is BundleCategory {
  return (BUNDLE_CATEGORIES as string[]).includes(v)
}

export function groupBundlesByDefaultRole(
  bundles: BundleManifest[]
): Map<string, BundleManifest[]> {
  const groups = new Map<string, BundleManifest[]>()
  for (const bundle of bundles) {
    const existing = groups.get(bundle.defaultRole) ?? []
    existing.push(bundle)
    groups.set(bundle.defaultRole, existing)
  }
  return groups
}

export function filterByInstalled(
  bundles: BundleManifest[],
  installed: Set<string>
): BundleManifest[] {
  return bundles.filter((b) => installed.has(b.name))
}

export function registerListCommand(program: Command): void {
  program
    .command('list')
    .description('List available bundles')
    .option('--category <cat>', 'filter by category')
    .option('--installed', 'show only installed bundles')
    .action(async (opts: { category?: string; installed?: boolean }) => {
      const cwd = process.cwd()

      if (opts.category && !isBundleCategory(opts.category)) {
        console.error(`Unknown category: ${opts.category}`)
        console.error(`Valid categories: ${BUNDLE_CATEGORIES.join(', ')}`)
        process.exit(1)
      }

      if (opts.installed && !(await harnessExists(cwd))) {
        console.error('harness.json not found. Run harness-kit init first.')
        process.exit(1)
      }

      const installedNames = new Set<string>()
      if (await harnessExists(cwd)) {
        const config = await readHarnessConfig(cwd)
        for (const name of config.bundles ?? []) installedNames.add(name)
      }

      // Filter by defaultRole — consistent with grouping (bundles appear once, under defaultRole)
      const all = getAllBundles()
      const byCategory = opts.category
        ? all.filter((b) => b.defaultRole === opts.category)
        : all

      const filtered = opts.installed ? filterByInstalled(byCategory, installedNames) : byCategory

      if (opts.installed && filtered.length === 0) {
        console.log('No bundles tracked — use harness-kit add <bundle> or re-run init.')
        return
      }

      const groups = groupBundlesByDefaultRole(filtered)

      for (const [category, members] of [...groups.entries()].sort()) {
        console.log(`\n${chalk.bold(category)} (${members.length})`)
        for (const b of [...members].sort((a, c) => a.name.localeCompare(c.name))) {
          const marker = installedNames.has(b.name) ? chalk.green('✓') : ' '
          const tag = b.experimental ? chalk.yellow(' [experimental]') : ''
          console.log(`  ${b.name.padEnd(22)} ${marker}  ${b.description}${tag}`)
        }
      }
    })
}
