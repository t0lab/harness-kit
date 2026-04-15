import type { BundleManifest, ClaudeHookType, Artifact } from '@harness-kit/core'
import { execaCommand } from 'execa'
import { copyFile, mkdir, readFile, writeFile, chmod, access } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readMcpJson, writeMcpJson } from '../config/mcp-reader.js'
import { getRoleData } from '../utils/bundle-utils.js'
import { getAllBundles } from '../registry/index.js'

const __dir = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = __dir.includes('/dist') ? join(__dir, '..') : join(__dir, '../..')

export interface InstallResult {
  mcpUpdated: boolean
  warnings: string[]
}

export interface InstallOptions {
  yes?: boolean
  silent?: boolean
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

const DISPATCHER_TEMPLATE = `#!/usr/bin/env bash
# harness-kit canonical git-hook dispatcher. Runs every *.sh in <hook>.d/ in sorted order.
# Any non-zero exit blocks the git operation. Do not edit — add checks via *.sh files in the .d/ directory.
set -e
HOOK_NAME="$(basename "$0")"
HOOK_DIR="$(dirname "$0")/$HOOK_NAME.d"
[ -d "$HOOK_DIR" ] || exit 0
shopt -s nullglob
for script in "$HOOK_DIR"/*.sh; do
  [ -x "$script" ] || chmod +x "$script" 2>/dev/null || true
  if ! bash "$script" "$@"; then
    echo "" >&2
    echo "✗ $HOOK_NAME check failed: $script" >&2
    exit 1
  fi
done
exit 0
`

async function installGitHook(
  cwd: string,
  bundleName: string,
  hookName: string,
  srcPath: string,
  result: InstallResult
): Promise<void> {
  const hookDir = join(cwd, '.githooks')
  const dispatcherPath = join(hookDir, hookName)
  const dSubdir = join(hookDir, `${hookName}.d`)
  const dTarget = join(dSubdir, `${bundleName}.sh`)

  await mkdir(dSubdir, { recursive: true })

  if (await fileExists(dispatcherPath)) {
    const current = await readFile(dispatcherPath, 'utf-8')
    if (current !== DISPATCHER_TEMPLATE) {
      const legacyPath = join(dSubdir, '00-legacy.sh')
      if (!(await fileExists(legacyPath))) {
        await writeFile(legacyPath, current)
        await chmod(legacyPath, 0o755)
        result.warnings.push(`Migrated existing .githooks/${hookName} → .githooks/${hookName}.d/00-legacy.sh`)
      }
      await writeFile(dispatcherPath, DISPATCHER_TEMPLATE)
      await chmod(dispatcherPath, 0o755)
    }
  } else {
    await writeFile(dispatcherPath, DISPATCHER_TEMPLATE)
    await chmod(dispatcherPath, 0o755)
    result.warnings.push(`git-hook dispatcher installed at .githooks/${hookName} — run 'npx harness-kit activate' to enable`)
  }

  await copyFile(srcPath, dTarget)
  await chmod(dTarget, 0o755)
}

export async function installBundle(
  cwd: string,
  bundle: BundleManifest,
  role: string,
  options: InstallOptions = {}
): Promise<InstallResult> {
  const rawArtifacts: Artifact[] = [
    ...bundle.common.artifacts,
    ...(getRoleData(bundle, role)?.artifacts ?? []),
  ]

  // Expand type:'stack' refs into the referenced stack bundle's artifacts.
  const stackLookup = new Map(getAllBundles().map((b) => [b.name, b]))
  const allArtifacts: Artifact[] = []
  for (const a of rawArtifacts) {
    if (a.type !== 'stack') { allArtifacts.push(a); continue }
    const stackBundle = stackLookup.get(a.ref)
    if (!stackBundle) { continue }
    allArtifacts.push(...stackBundle.common.artifacts)
  }

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

  const skillArtifacts: Extract<Artifact, { type: 'skill' }>[] = []

  for (const artifact of allArtifacts) {
    if (artifact.type === 'tool') {
      try {
        await runInteractive(artifact.installCmd, cwd)
      } catch {
        result.warnings.push(`Failed: ${artifact.installCmd}`)
      }
    } else if (artifact.type === 'skill') {
      skillArtifacts.push(artifact)
    } else if (artifact.type === 'rule') {
      try {
        const srcPath = join(PKG_ROOT, artifact.src)
        const destPath = join(cwd, '.claude/rules', artifact.src.replace(/^rules\//, ''))
        await mkdir(dirname(destPath), { recursive: true })
        await copyFile(srcPath, destPath)
      } catch {
        result.warnings.push(`Failed to copy rule: ${artifact.src}`)
      }
    } else if (artifact.type === 'agent') {
      try {
        const srcPath = join(PKG_ROOT, artifact.src)
        const destPath = join(cwd, '.claude/agents', basename(artifact.src))
        await mkdir(dirname(destPath), { recursive: true })
        await copyFile(srcPath, destPath)
      } catch {
        result.warnings.push(`Failed to copy agent: ${artifact.src}`)
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
        await installGitHook(cwd, bundle.name, artifact.hookName, join(PKG_ROOT, artifact.src), result)
      } catch (err) {
        result.warnings.push(`Failed to install git-hook: ${artifact.src} (${err instanceof Error ? err.message : String(err)})`)
      }
    } else if (artifact.type === 'plugin') {
      const source = artifact.installSource
      if (source.includes(':')) {
        result.warnings.push(`plugin '${source}' — install manually (see bundle README)`)
        continue
      }
      try {
        await runInteractive(`claude plugin marketplace add ${source}`, cwd)
        await runInteractive(`claude plugin install --scope project ${bundle.name}`, cwd)
      } catch {
        result.warnings.push(
          `plugin install failed — run manually: 'claude plugin marketplace add ${source}' then 'claude plugin install --scope project ${bundle.name}'`
        )
      }
    } else if (artifact.type !== 'mcp') {
      result.warnings.push(`artifact type '${artifact.type}' not yet supported — add manually`)
    }
  }

  const yesFlag = options.yes ? ' --yes' : ''
  const installOneSkill = async (artifact: Extract<Artifact, { type: 'skill' }>): Promise<void> => {
    const src = artifact.src.startsWith('skills/') ? join(PKG_ROOT, artifact.src) : artifact.src
    try {
      if (options.silent) {
        await execaCommand(`npx skills add ${src}${yesFlag}`, { cwd, stdio: 'pipe', shell: true })
      } else {
        await runInteractive(`npx skills add ${src}${yesFlag}`, cwd)
      }
    } catch {
      result.warnings.push(`Failed: npx skills add ${artifact.src}`)
    }
  }

  if (options.silent) {
    await Promise.all(skillArtifacts.map(installOneSkill))
  } else {
    for (const artifact of skillArtifacts) await installOneSkill(artifact)
  }

  return result
}
