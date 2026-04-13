import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'security-review',
  description: 'Validate bash, block dangerous ops',
  version: '1.0.0', experimental: false, defaultRole: 'workflow-preset',
  common: { artifacts: [] },
  roles: { 'workflow-preset': { artifacts: [] } },
}
