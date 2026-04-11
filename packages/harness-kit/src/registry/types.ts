export interface McpManifest {
  name: string
  type: 'mcp'
  description: string
  version: string
  command: string
  args: string[]
  env?: Record<string, string>
}
