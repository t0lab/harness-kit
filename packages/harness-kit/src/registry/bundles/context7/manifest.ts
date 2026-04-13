import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'context7',
  description: 'Context7 — version-specific docs for any package',
  version: '1.0.0', experimental: false, defaultRole: 'library-docs',
  common: { artifacts: [{ type: 'mcp', command: 'npx', args: ['-y', '@upstash/context7-mcp'] }] },
  roles: { 'library-docs': { artifacts: [] } },
}
