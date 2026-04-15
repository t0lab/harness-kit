import chalk from 'chalk'
import React from 'react'
import { render } from 'ink'
import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { harnessExists, readHarnessConfig } from '@/config/harness-reader.js'
import { readMcpJsonKeys } from '@/config/mcp-reader.js'
import { getRoleData } from '@/utils/bundle-utils.js'
import { getAllBundles } from '@/registry/index.js'
import type { HarnessConfig } from '@harness-kit/core'
import type { Command } from 'commander'
import { StatusDisplay } from '@/components/status-display.js'

const CORE_FILES = [
  'CLAUDE.md',
  'AGENTS.md',
  'harness.json',
  '.mcp.json',
  '.claude/settings.json',
]

async function fileExists(p: string): Promise<boolean> {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

export interface BundleAudit {
  name: string
  category: string
  hasMcp: boolean
  drift: boolean
}

export interface FileAudit {
  path: string
  exists: boolean
}

export interface EnvAudit {
  key: string
  set: boolean
  bundleName: string
  required: boolean
}

export interface AuditResult {
  bundles: BundleAudit[]
  files: FileAudit[]
  envVars: EnvAudit[]
}

function bundleHasMcp(name: string): boolean {
  const bundle = getAllBundles().find((b) => b.name === name)
  if (!bundle) return false
  return (
    bundle.common.artifacts.some((a) => a.type === 'mcp') ||
    Object.values(bundle.roles).some((r) => r?.artifacts.some((a) => a.type === 'mcp'))
  )
}

async function auditBundles(
  config: HarnessConfig,
  mcpKeys: Set<string>
): Promise<BundleAudit[]> {
  const bundles: BundleAudit[] = []
  for (const name of config.bundles) {
    const bundle = getAllBundles().find((b) => b.name === name)
    const category = bundle?.defaultRole ?? 'unknown'
    const hasMcp = bundleHasMcp(name)
    const drift = hasMcp && !mcpKeys.has(name)
    bundles.push({ name, category, hasMcp, drift })
  }
  return bundles
}

async function auditFiles(cwd: string): Promise<FileAudit[]> {
  const files: FileAudit[] = []
  for (const f of CORE_FILES) {
    const exists = await fileExists(join(cwd, f))
    files.push({ path: f, exists })
  }
  return files
}

function collectEnvVars(config: HarnessConfig): EnvAudit[] {
  const envVars: EnvAudit[] = []
  for (const name of config.bundles) {
    const bundle = getAllBundles().find((b) => b.name === name)
    if (!bundle) continue
    const roleEnv = getRoleData(bundle, bundle.defaultRole)?.env ?? []
    const allEnv = [...(bundle.common.env ?? []), ...roleEnv]
    for (const e of allEnv) {
      envVars.push({
        key: e.key,
        set: process.env[e.key] !== undefined,
        bundleName: name,
        required: e.required,
      })
    }
  }
  return envVars
}

export async function auditHarness(cwd: string): Promise<AuditResult> {
  const config = await readHarnessConfig(cwd)
  const mcpKeys = await readMcpJsonKeys(cwd)
  return {
    bundles: await auditBundles(config, mcpKeys),
    files: await auditFiles(cwd),
    envVars: collectEnvVars(config),
  }
}

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Audit harness health')
    .action(async () => {
      const cwd = process.cwd()

      if (!(await harnessExists(cwd))) {
        console.error(`${chalk.red('✗')} harness.json not found. Run harness-kit init first.`)
        process.exit(1)
      }

      const result = await auditHarness(cwd)

      const { unmount } = render(React.createElement(StatusDisplay, { cwd, auditResult: result }))
      await new Promise((resolve) => setTimeout(resolve, 50))
      unmount()

      const driftCount = result.bundles.filter((b) => b.drift).length
      const missingFiles = result.files.filter((f) => !f.exists).length
      const unsetVars = result.envVars.filter((e) => !e.set).length

      if (driftCount > 0 || missingFiles > 0 || unsetVars > 0) {
        process.exit(1)
      }
    })
}
