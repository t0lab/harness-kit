import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'mempalace',
  description: 'MemPalace — local knowledge graph, 19 tools (needs Python + ChromaDB)',
  version: '1.0.0', experimental: true, defaultRole: 'memory',
  common: { artifacts: [{ type: 'mcp', command: 'uvx', args: ['mempalace'] }] },
  roles: { memory: { artifacts: [], requires: ['python', 'chromadb'] } },
}
