import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { McpManifest } from './types.js'

export async function loadMcpManifests(mcpDir: string): Promise<McpManifest[]> {
  let entries: string[]
  try {
    entries = await readdir(mcpDir)
  } catch {
    return []
  }

  const manifests: McpManifest[] = []
  for (const entry of entries) {
    const manifestPath = join(mcpDir, entry, 'manifest.json')
    try {
      const raw = await readFile(manifestPath, 'utf-8')
      manifests.push(JSON.parse(raw) as McpManifest)
    } catch (err: unknown) {
      // skip only if file doesn't exist; re-throw parse errors
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
    }
  }
  return manifests
}
