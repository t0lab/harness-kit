import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'quality-gates',
  description: 'Tests pass before done (Stop hook)',
  version: '1.0.0', experimental: false, defaultRole: 'workflow-preset',
  common: { artifacts: [] },
  roles: { 'workflow-preset': { artifacts: [], recommended: true } },
}
