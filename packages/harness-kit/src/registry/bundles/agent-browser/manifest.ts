import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'agent-browser',
  description: 'Token-efficient browser automation via accessibility snapshots (~200-400 tokens/page)',
  version: '1.0.0', experimental: false, defaultRole: 'browser',
  common: { artifacts: [{ type: 'tool', installCmd: 'npm install -g agent-browser' }] },
  roles: { browser: { artifacts: [], recommended: true } },
}
