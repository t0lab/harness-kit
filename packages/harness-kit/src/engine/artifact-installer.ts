import type { BundleManifest } from '@harness-kit/core'
import { execaCommand } from 'execa'
import { readMcpJson, writeMcpJson } from '../config/mcp-reader.js'
import { getRoleData } from '../utils/bundle-utils.js'

export interface InstallResult {
  mcpUpdated: boolean
  warnings: string[]
}

async function runInteractive(cmd: string, cwd: string): Promise<void> {
  await execaCommand(cmd, { cwd, stdio: 'inherit', shell: true })
}

export async function installBundle(
  cwd: string,
  bundle: BundleManifest,
  role: string
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
        await runInteractive(`npx skills add ${artifact.src}`, cwd)
      } catch {
        result.warnings.push(`Failed: npx skills add ${artifact.src}`)
      }
    } else if (artifact.type !== 'mcp') {
      result.warnings.push(`artifact type '${artifact.type}' not yet supported — add manually`)
    }
  }

  return result
}
