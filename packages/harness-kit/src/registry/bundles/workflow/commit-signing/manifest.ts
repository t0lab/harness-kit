import type { BundleManifest } from '@/registry/types.js'
export const manifest: BundleManifest = {
  name: 'commit-signing',
  description: 'GPG/SSH commit signing — setup, verification, troubleshooting',
  version: '1.0.0', experimental: false, defaultRole: 'git-workflow',
  common: {
    artifacts: [
      { type: 'skill', src: 'skills/commit-signing' },
      { type: 'rule', src: 'rules/signed-commits.md' },
    ],
  },
  roles: { 'git-workflow': { artifacts: [] } },
}
