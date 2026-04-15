import type { BundleManifest } from '../../../types.js'
export const manifest: BundleManifest = {
  name: 'commit-signing',
  description: 'GPG and SSH commit signing — setup, verification, and troubleshooting for signed git commits',
  version: '1.0.0', experimental: false, defaultRole: 'git-workflow',
  common: {
    artifacts: [
      { type: 'skill', src: 'skills/commit-signing' },
      { type: 'rule', src: 'rules/signed-commits.md' },
    ],
  },
  roles: { 'git-workflow': { artifacts: [] } },
}
