import type { BundleManifest } from '../../types.js'

export const manifest: BundleManifest = {
  name: 'mempalace',
  description: 'MemPalace — local spatial long-term memory (Claude Code plugin: 29 MCP tools + skill, ChromaDB, zero API calls)',
  version: '1.0.0',
  experimental: true,
  defaultRole: 'memory',
  common: {
    artifacts: [{ type: 'plugin', installSource: 'MemPalace/mempalace' }],
    requires: ['python3'],
  },
  roles: {
    memory: { artifacts: [] },
    'mcp-tool': { artifacts: [] },
  },
}
