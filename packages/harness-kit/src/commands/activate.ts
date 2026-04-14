import chalk from 'chalk'
import { execaCommand } from 'execa'
import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { harnessExists, readHarnessConfig } from '../config/harness-reader.js'
import { getAllBundles } from '../registry/index.js'
import { getRoleData } from '../utils/bundle-utils.js'
import type { HarnessConfig } from '@harness-kit/core'
import type { Command } from 'commander'

export interface ActivationStep {
  name: string
  status: 'ok' | 'skipped' | 'failed'
  detail: string
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

function bundlesDeclareGitHook(config: HarnessConfig): boolean {
  for (const name of config.bundles) {
    const bundle = getAllBundles().find((b) => b.name === name)
    if (!bundle) continue
    const roleArtifacts = getRoleData(bundle, bundle.defaultRole)?.artifacts ?? []
    const all = [...bundle.common.artifacts, ...roleArtifacts]
    if (all.some((a) => a.type === 'git-hook')) return true
  }
  return false
}

async function activateGitHooks(cwd: string, config: HarnessConfig): Promise<ActivationStep> {
  if (!bundlesDeclareGitHook(config)) {
    return { name: 'git-hooks', status: 'skipped', detail: 'no installed bundle declares a git-hook' }
  }
  const hasDir = await fileExists(join(cwd, '.githooks'))
  if (!hasDir) {
    return { name: 'git-hooks', status: 'skipped', detail: 'no .githooks/ directory' }
  }
  try {
    const topLevel = (await execaCommand('git rev-parse --show-toplevel', { cwd, shell: true })).stdout.trim()
    if (topLevel !== cwd) {
      return {
        name: 'git-hooks',
        status: 'skipped',
        detail: `cwd is not git top-level (top-level: ${topLevel}) — init a git repo here first`,
      }
    }
    await execaCommand('git config core.hooksPath .githooks', { cwd, stdio: 'ignore', shell: true })
    return { name: 'git-hooks', status: 'ok', detail: 'core.hooksPath=.githooks' }
  } catch (err) {
    return {
      name: 'git-hooks',
      status: 'failed',
      detail: err instanceof Error ? err.message : String(err),
    }
  }
}

export async function runActivate(cwd: string): Promise<ActivationStep[]> {
  const config = await readHarnessConfig(cwd)
  return [await activateGitHooks(cwd, config)]
}

function renderStep(step: ActivationStep): void {
  const icon =
    step.status === 'ok' ? chalk.green('✓') : step.status === 'skipped' ? chalk.gray('–') : chalk.red('✗')
  console.log(`  ${icon} ${step.name.padEnd(14)} ${step.detail}`)
}

export function registerActivateCommand(program: Command): void {
  program
    .command('activate')
    .description('Run all post-install activations for installed bundles (idempotent)')
    .action(async () => {
      const cwd = process.cwd()

      if (!(await harnessExists(cwd))) {
        console.error(`${chalk.red('✗')} harness.json not found. Run harness-kit init first.`)
        process.exit(1)
      }

      console.log(`\nharness-kit activate — ${cwd}\n`)
      const steps = await runActivate(cwd)
      for (const s of steps) renderStep(s)

      const failed = steps.filter((s) => s.status === 'failed').length
      if (failed > 0) process.exit(1)
    })
}
