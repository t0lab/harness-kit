import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'conventional-commits',
  description: 'Conventional Commits format with semantic versioning — type/scope/breaking-change protocol for machine-readable git history',
  version: '1.0.0', experimental: false, defaultRole: 'git-workflow',
  common: {
    artifacts: [
      { type: 'skill', src: 'skills/git-conventional' },
      { type: 'rule', src: 'rules/git-workflow.md' },
    ],
  },
  roles: { 'git-workflow': { artifacts: [], recommended: true } },
}
