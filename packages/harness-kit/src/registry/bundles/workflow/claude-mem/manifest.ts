import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'claude-mem',
  description: 'Session memory for Claude Code — hybrid semantic + keyword search, auto-compression (AGPL-3.0)',
  version: '1.0.0', experimental: true, defaultRole: 'memory',
  common: {
    artifacts: [{ type: 'plugin', installSource: 'github:thedotmack/claude-mem' }],
    requires: ['bun', 'chrome'],
  },
  roles: { memory: { artifacts: [], recommended: true } },
}
