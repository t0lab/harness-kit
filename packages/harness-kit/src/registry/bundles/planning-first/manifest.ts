import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'planning-first',
  description: 'Draft plan → review → implement',
  version: '1.0.0', experimental: false, defaultRole: 'workflow-preset',
  common: { artifacts: [] },
  roles: { 'workflow-preset': { artifacts: [], recommended: true } },
}
