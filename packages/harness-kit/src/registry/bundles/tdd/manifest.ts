import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'tdd',
  description: 'Write failing test before implementing',
  version: '1.0.0', experimental: false, defaultRole: 'workflow-preset',
  common: { artifacts: [] },
  roles: { 'workflow-preset': { artifacts: [], recommended: true } },
}
