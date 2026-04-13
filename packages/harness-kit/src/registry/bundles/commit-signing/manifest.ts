import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'commit-signing',
  description: 'GPG / SSH commit signing',
  version: '1.0.0', experimental: false, defaultRole: 'git-workflow',
  common: { artifacts: [] },
  roles: { 'git-workflow': { artifacts: [] } },
}
