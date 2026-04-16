import type { BundleManifest } from '@/registry/types.js'

export const manifest: BundleManifest = {
  name: 'mempalace',
  description: 'MemPalace — local spatial memory (Claude Code plugin, ChromaDB, no API)',
  version: '1.0.0',
  experimental: true,
  defaultRole: 'memory',
  common: {
    artifacts: [{ type: 'plugin', installCmd: 'pip install mempalace' }],
    requires: ['python3'],
  },
  roles: {
    memory: { artifacts: [] },
    'mcp-tool': { artifacts: [] },
  },
}
