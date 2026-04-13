import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'cloudflare',
  description: 'Cloudflare — Workers, R2, D1, KV, AI Gateway',
  version: '1.0.0', experimental: false, defaultRole: 'cloud-infra',
  common: { artifacts: [{ type: 'mcp', command: 'npx', args: ['-y', '@cloudflare/mcp-server-cloudflare'] }] },
  roles: { 'cloud-infra': { artifacts: [] } },
}
