import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'code-review-gates',
  description: 'Review before commit/merge',
  version: '1.0.0', experimental: false, defaultRole: 'workflow-preset',
  common: { artifacts: [] },
  roles: { 'workflow-preset': { artifacts: [] } },
}
