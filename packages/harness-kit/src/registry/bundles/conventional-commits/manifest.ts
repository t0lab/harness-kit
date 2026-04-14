import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'conventional-commits',
  description: 'Conventional Commits format with semantic versioning — type/scope/breaking-change protocol for machine-readable git history, enforced at commit-msg via a git hook',
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
