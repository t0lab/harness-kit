import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'exa',
  description: 'Exa — semantic search, optimized for code + GitHub',
  version: '1.0.0', experimental: false, defaultRole: 'search',
  common: {
    artifacts: [{ type: 'mcp', command: 'npx', args: ['-y', 'exa-mcp-server'], env: { EXA_API_KEY: '${EXA_API_KEY}' } }],
    env: [{ key: 'EXA_API_KEY', description: 'API key from exa.ai', required: true }],
  },
  roles: { search: { artifacts: [] } },
}
