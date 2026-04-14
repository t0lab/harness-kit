import type { BundleManifest } from '../../types.js'

export const manifest: BundleManifest = {
  name: 'no-memory',
  description: 'Explicit opt-out of memory — installs a rule telling the agent no persistent memory is available',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'memory',
  common: {
    artifacts: [{ type: 'rule', src: 'rules/no-memory.md' }],
  },
  roles: {
    memory: { artifacts: [] },
  },
}
