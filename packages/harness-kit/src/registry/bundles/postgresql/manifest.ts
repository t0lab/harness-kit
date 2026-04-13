import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'postgresql',
  description: 'PostgreSQL — read-only queries (Anthropic official)',
  version: '1.0.0', experimental: false, defaultRole: 'cloud-infra',
  common: {
    artifacts: [{ type: 'mcp', command: 'npx', args: ['-y', '@modelcontextprotocol/server-postgres'], env: { POSTGRES_CONNECTION_STRING: '${POSTGRES_CONNECTION_STRING}' } }],
    env: [{ key: 'POSTGRES_CONNECTION_STRING', description: 'PostgreSQL connection string (postgres://user:pass@host/db)', required: true }],
  },
  roles: { 'cloud-infra': { artifacts: [] } },
}
