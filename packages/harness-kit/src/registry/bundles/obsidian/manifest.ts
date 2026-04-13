import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'obsidian',
  description: 'Obsidian — sync with Obsidian vault',
  version: '1.0.0', experimental: false, defaultRole: 'memory',
  common: {
    artifacts: [{
      type: 'mcp', command: 'npx', args: ['-y', 'obsidian-mcp-server'],
      env: { OBSIDIAN_API_KEY: '${OBSIDIAN_API_KEY}', OBSIDIAN_HOST: 'http://localhost:27123' },
    }],
    env: [
      { key: 'OBSIDIAN_API_KEY', description: 'API key from Obsidian Local REST API plugin', required: true },
      { key: 'OBSIDIAN_HOST', description: 'Obsidian REST API host', required: false, default: 'http://localhost:27123' },
    ],
  },
  roles: { memory: { artifacts: [] } },
}
