import type { BundleManifest } from '../../../types.js'
export const manifest: BundleManifest = {
  name: 'claude-mem',
  description: 'Claude Code session memory — semantic + keyword search, auto-compression',
  version: '1.0.0', experimental: true, defaultRole: 'memory',
  common: {
    artifacts: [{ type: 'plugin', installSource: 'github:thedotmack/claude-mem' }],
    requires: ['bun', 'chrome'],
  },
  roles: { memory: { artifacts: [] } },
}
