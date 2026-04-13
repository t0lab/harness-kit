import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'e2b',
  description: 'E2B — secure cloud sandbox, billed per second',
  version: '1.0.0', experimental: false, defaultRole: 'code-execution',
  common: {
    artifacts: [{ type: 'mcp', command: 'npx', args: ['-y', '@e2b/mcp-server'], env: { E2B_API_KEY: '${E2B_API_KEY}' } }],
    env: [{ key: 'E2B_API_KEY', description: 'API key from e2b.dev', required: true }],
  },
  roles: { 'code-execution': { artifacts: [] } },
}
