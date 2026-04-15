import type { BundleManifest } from '../../../types.js'
export const manifest: BundleManifest = {
  name: 'branch-strategy',
  description: 'Feature/fix/chore naming, PR < 400 lines',
  version: '1.0.0', experimental: false, defaultRole: 'git-workflow',
  common: {
    artifacts: [
      { type: 'skill', src: 'skills/branch-strategy' },
      { type: 'rule', src: 'rules/git-workflow.md' },
    ],
  },
  roles: { 'git-workflow': { artifacts: [], recommended: true } },
}
