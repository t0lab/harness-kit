import type { BundleManifest } from '../../../types.js'
export const manifest: BundleManifest = {
  name: 'conventional-commits',
  description: 'Conventional Commits — type/scope/breaking-change, enforced via commit-msg hook',
  version: '1.0.0', experimental: false, defaultRole: 'git-workflow',
  common: {
    artifacts: [
      { type: 'skill', src: 'skills/git-conventional' },
      { type: 'rule', src: 'rules/git-workflow.md' },
      { type: 'git-hook', src: 'git-hooks/commit-msg/conventional-commits.sh', hookName: 'commit-msg' },
    ],
    requires: ['git'],
  },
  roles: { 'git-workflow': { artifacts: [], recommended: true } },
}
