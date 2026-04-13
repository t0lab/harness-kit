import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'pre-commit-hooks',
  description: 'Lint + typecheck + test before commit',
  version: '1.0.0', experimental: false, defaultRole: 'git-workflow',
  common: { artifacts: [] },
  roles: { 'git-workflow': { artifacts: [], recommended: true } },
}
