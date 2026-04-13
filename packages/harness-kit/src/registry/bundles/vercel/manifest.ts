import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'vercel',
  description: 'Vercel — deployments, domains, logs, env vars',
  version: '1.0.0', experimental: false, defaultRole: 'cloud-infra',
  common: {
    artifacts: [{ type: 'mcp', command: 'npx', args: ['-y', '@vercel/mcp-adapter'], env: { VERCEL_TOKEN: '${VERCEL_TOKEN}' } }],
    env: [{ key: 'VERCEL_TOKEN', description: 'API token from vercel.com/account/tokens', required: true }],
  },
  roles: { 'cloud-infra': { artifacts: [] } },
}
