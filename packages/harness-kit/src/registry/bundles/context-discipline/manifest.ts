import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'context-discipline',
  description: 'Fresh session rules, task decomp guide',
  version: '1.0.0', experimental: false, defaultRole: 'workflow-preset',
  common: { artifacts: [] },
  roles: { 'workflow-preset': { artifacts: [] } },
}
