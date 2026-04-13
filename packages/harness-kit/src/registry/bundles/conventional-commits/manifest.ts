import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'conventional-commits',
  description: 'Commit format + semantic versioning',
  version: '1.0.0', experimental: false, defaultRole: 'git-workflow',
  common: { artifacts: [] },
  roles: { 'git-workflow': { artifacts: [], recommended: true } },
}
