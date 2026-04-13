import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'

// Loose schema for reading — preserves any existing entries regardless of shape
const McpJsonReadSchema = z.object({
  mcpServers: z.record(z.string(), z.unknown()).default({}),
})

export interface McpServerEntry {
  command: string
  args: string[]
  env?: Record<string, string>
}

export interface McpJson {
  mcpServers: Record<string, unknown>
}

export async function readMcpJson(cwd: string): Promise<McpJson> {
  try {
    const raw = await readFile(join(cwd, '.mcp.json'), 'utf-8')
    const parsed: unknown = JSON.parse(raw)
    const result = McpJsonReadSchema.safeParse(parsed)
    return result.success ? result.data : { mcpServers: {} }
  } catch {
    return { mcpServers: {} }
  }
}

export async function writeMcpJson(cwd: string, data: McpJson): Promise<void> {
  await writeFile(join(cwd, '.mcp.json'), JSON.stringify(data, null, 2), 'utf-8')
}

export async function readMcpJsonKeys(cwd: string): Promise<Set<string>> {
  const data = await readMcpJson(cwd)
  return new Set(Object.keys(data.mcpServers))
}
