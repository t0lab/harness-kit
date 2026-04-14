import type { BundleManifest, ClaudeHookType } from '@harness-kit/core'
import { execaCommand } from 'execa'
import { copyFile, mkdir, readFile, writeFile, chmod, access } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readMcpJson, writeMcpJson } from '../config/mcp-reader.js'
import { getRoleData } from '../utils/bundle-utils.js'

const __dir = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = __dir.includes('/dist') ? join(__dir, '..') : join(__dir, '../..')

export interface InstallResult {
  mcpUpdated: boolean
  warnings: string[]
}

export interface InstallOptions {
  yes?: boolean
}

async function runInteractive(cmd: string, cwd: string): Promise<void> {
  await execaCommand(cmd, { cwd, stdio: 'inherit', shell: true })
}

interface ClaudeHookEntry {
  matcher: string
  hooks: Array<{ type: 'command'; command: string }>
}

interface ClaudeSettings {
  permissions?: { allow?: string[]; deny?: string[] }
  hooks?: Partial<Record<ClaudeHookType, ClaudeHookEntry[]>>
  [key: string]: unknown
}

async function upsertClaudeHook(
  cwd: string,
  hookType: ClaudeHookType,
  command: string,
  matcher: string
): Promise<void> {
  const settingsPath = join(cwd, '.claude/settings.json')
  let settings: ClaudeSettings = {}
  try {
    settings = JSON.parse(await readFile(settingsPath, 'utf-8')) as ClaudeSettings
  } catch {
    settings = {}
  }
  settings.hooks = settings.hooks ?? {}
  const bucket = settings.hooks[hookType] ?? []
  const exists = bucket.some((e) => e.hooks.some((h) => h.command === command))
  if (!exists) {
    bucket.push({ matcher, hooks: [{ type: 'command', command }] })
    settings.hooks[hookType] = bucket
  }
  await mkdir(dirname(settingsPath), { recursive: true })
  await writeFile(settingsPath, `${JSON.stringify(settings, null, 2)}\n`)
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

export async function installBundle(
  cwd: string,
  bundle: BundleManifest,
  role: string,
  options: InstallOptions = {}
): Promise<InstallResult> {
  const allArtifacts = [
    ...bundle.common.artifacts,
    ...(getRoleData(bundle, role)?.artifacts ?? []),
  ]

  const result: InstallResult = { mcpUpdated: false, warnings: [] }

  const mcpArtifacts = allArtifacts.filter((a) => a.type === 'mcp')
  if (mcpArtifacts.length > 0) {
    const mcpJson = await readMcpJson(cwd)
    for (const artifact of mcpArtifacts) {
      const entry = { command: artifact.command, args: artifact.args, ...(artifact.env !== undefined && { env: artifact.env }) }
      mcpJson.mcpServers[bundle.name] = entry
    }
    await writeMcpJson(cwd, mcpJson)
    result.mcpUpdated = true
  }

  for (const artifact of allArtifacts) {
    if (artifact.type === 'tool') {
      try {
        await runInteractive(artifact.installCmd, cwd)
      } catch {
        result.warnings.push(`Failed: ${artifact.installCmd}`)
      }
    } else if (artifact.type === 'skill') {
      try {
        const src = artifact.src.startsWith('skills/')
          ? join(PKG_ROOT, artifact.src)
          : artifact.src
        const yesFlag = options.yes ? ' --yes' : ''
        await runInteractive(`npx skills add ${src}${yesFlag}`, cwd)
      } catch {
        result.warnings.push(`Failed: npx skills add ${artifact.src}`)
      }
    } else if (artifact.type === 'rule') {
      try {
        const srcPath = join(PKG_ROOT, artifact.src)
        const destPath = join(cwd, '.claude/rules', basename(artifact.src))
        await mkdir(dirname(destPath), { recursive: true })
        await copyFile(srcPath, destPath)
      } catch {
        result.warnings.push(`Failed to copy rule: ${artifact.src}`)
      }
    } else if (artifact.type === 'hook') {
      try {
        const srcPath = join(PKG_ROOT, artifact.src)
        const destPath = join(cwd, '.claude/hooks', basename(artifact.src))
        await mkdir(dirname(destPath), { recursive: true })
        await copyFile(srcPath, destPath)
        await chmod(destPath, 0o755)
        const relCmd = `bash .claude/hooks/${basename(artifact.src)}`
        await upsertClaudeHook(cwd, artifact.hookType, relCmd, artifact.matcher ?? '')
      } catch (err) {
        result.warnings.push(`Failed to install hook: ${artifact.src} (${err instanceof Error ? err.message : String(err)})`)
      }
    } else if (artifact.type === 'git-hook') {
      try {
        const srcPath = join(PKG_ROOT, artifact.src)
        const hookPath = join(cwd, '.githooks', artifact.hookName)
        await mkdir(dirname(hookPath), { recursive: true })
        if (await fileExists(hookPath)) {
          const [srcBuf, destBuf] = await Promise.all([readFile(srcPath), readFile(hookPath)])
          if (srcBuf.equals(destBuf)) {
            // identical — nothing to do
          } else if (options.yes) {
            await copyFile(srcPath, hookPath)
            await chmod(hookPath, 0o755)
            result.warnings.push(`.githooks/${artifact.hookName} overwritten (--yes) — run 'npx harness-kit activate' to enable`)
          } else {
            result.warnings.push(`.githooks/${artifact.hookName} has local edits — not overwritten. Re-run with --yes to overwrite, or merge manually from ${artifact.src}`)
          }
        } else {
          await copyFile(srcPath, hookPath)
          await chmod(hookPath, 0o755)
          result.warnings.push(`git-hook copied to .githooks/${artifact.hookName} — run 'npx harness-kit activate' to enable`)
        }
      } catch (err) {
        result.warnings.push(`Failed to install git-hook: ${artifact.src} (${err instanceof Error ? err.message : String(err)})`)
      }
    } else if (artifact.type !== 'mcp') {
      result.warnings.push(`artifact type '${artifact.type}' not yet supported — add manually`)
    }
  }

  return result
}
