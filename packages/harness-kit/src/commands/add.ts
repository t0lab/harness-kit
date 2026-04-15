import * as p from '@clack/prompts'
import chalk from 'chalk'
import React from 'react'
import { render } from 'ink'
import { getAllBundles } from '@/registry/index.js'
import { harnessExists, readHarnessConfig, writeHarnessConfig } from '@/config/harness-reader.js'
import { installBundle } from '@/engine/artifact-installer.js'
import { getRoleData } from '@/utils/bundle-utils.js'
import type { EnvVar } from '@harness-kit/core'
import type { Command } from 'commander'
import { AddDisplay } from '@/components/add-display.js'

export interface AddResult {
  bundleName: string
  role: string
  mcpUpdated: boolean
  warnings: string[]
  envVars: EnvVar[]
}

/**
 * Core add logic — testable without Commander or interactive prompts.
 * Throws with a message prefixed by the error code (e.g. "NOT_INITIALIZED: ...").
 */
export async function executeAdd(
  cwd: string,
  bundleName: string,
  opts: { role?: string; yes?: boolean; silent?: boolean }
): Promise<AddResult> {
  if (!(await harnessExists(cwd))) {
    throw new Error('NOT_INITIALIZED: harness.json not found. Run harness-kit init first.')
  }

  const bundle = getAllBundles().find((b) => b.name === bundleName)
  if (!bundle) {
    throw new Error(`UNKNOWN_BUNDLE: Unknown bundle. Run harness-kit list to see available.`)
  }

  const role = opts.role ?? bundle.defaultRole
  if (opts.role && !(opts.role in bundle.roles)) {
    const valid = Object.keys(bundle.roles).join(', ')
    throw new Error(`INVALID_ROLE: ${bundleName} does not support role ${opts.role}. Valid roles: ${valid}`)
  }

  const config = await readHarnessConfig(cwd)
  const alreadyInstalled = config.bundles.includes(bundleName)

  const installOpts: { yes?: boolean; silent?: boolean } = {}
  if (opts.yes) installOpts.yes = true
  if (opts.silent) installOpts.silent = true
  const result = await installBundle(cwd, bundle, role, installOpts)

  const newBundles = alreadyInstalled ? config.bundles : [...config.bundles, bundleName]

  await writeHarnessConfig(cwd, { ...config, bundles: newBundles })

  const envVars: EnvVar[] = [
    ...(bundle.common.env ?? []),
    ...(getRoleData(bundle, role)?.env ?? []),
  ]

  return { bundleName, role, mcpUpdated: result.mcpUpdated, warnings: result.warnings, envVars }
}

// process.exit(1) returns `never`, so TypeScript infers Promise<AddResult> correctly
async function runAdd(
  cwd: string,
  bundleName: string,
  opts: { role?: string; yes?: boolean; silent?: boolean }
): Promise<AddResult> {
  try {
    return await executeAdd(cwd, bundleName, opts)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(msg.replace(/^[A-Z_]+: /, ''))
    process.exit(1)
  }
}

export function registerAddCommand(program: Command): void {
  program
    .command('add <bundle>')
    .description('Add a bundle to the current harness')
    .option('--role <role>', 'override default role')
    .option('-y, --yes', 'skip interactive prompts — auto-confirm sub-commands', false)
    .action(async (bundleName: string, opts: { role?: string; yes?: boolean }) => {
      const cwd = process.cwd()

      // Check if already installed before calling executeAdd, to handle re-install confirm
      const alreadyInstalled =
        (await harnessExists(cwd)) &&
        ((await readHarnessConfig(cwd)).bundles?.includes(bundleName) ?? false)

      if (alreadyInstalled && !opts.yes) {
        const confirm = await p.confirm({
          message: `${bundleName} already added. Re-install? (y/N)`,
          initialValue: false,
        })
        if (p.isCancel(confirm) || !confirm) {
          p.cancel('Cancelled')
          process.exit(0)
        }
      }

      const result = await runAdd(cwd, bundleName, opts)
      
      const { unmount } = render(React.createElement(AddDisplay, { result }))
      await new Promise((resolve) => setTimeout(resolve, 50))
      unmount()
    })
}
