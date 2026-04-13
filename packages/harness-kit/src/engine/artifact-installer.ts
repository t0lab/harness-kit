import type { BundleManifest } from '@harness-kit/core'
import { readMcpJson, writeMcpJson } from '../config/mcp-reader.js'
import { getRoleData } from '../utils/bundle-utils.js'

export interface InstallResult {
  mcpUpdated: boolean
  warnings: string[]
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
      result.warnings.push(`Run: ${artifact.installCmd}`)
    } else if (artifact.type !== 'mcp') {
      result.warnings.push(`artifact type '${artifact.type}' not yet supported — add manually`)
    }
  }

  return result
}
