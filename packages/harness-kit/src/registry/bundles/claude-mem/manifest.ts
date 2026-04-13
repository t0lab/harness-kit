import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'claude-mem',
  description: 'Session memory for Claude Code, hybrid semantic search (PolyForm NC license)',
  version: '1.0.0', experimental: true, defaultRole: 'memory',
  common: { artifacts: [{ type: 'plugin', installSource: 'github:thedotmack/claude-mem' }] },
  roles: { memory: { artifacts: [], requires: ['bun', 'chromadb', 'sqlite'] } },
}
