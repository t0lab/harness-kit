import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'code-review-gates',
  description: 'Self-review checklist + PR review protocol — Ship/Show/Ask decision, 7-point gate before every commit or PR',
  version: '1.0.0', experimental: false, defaultRole: 'workflow-preset',
  common: {
    artifacts: [
      { type: 'skill', src: 'skills/code-review' },
      { type: 'rule', src: 'rules/git-workflow.md' },
    ],
  },
  roles: { 'workflow-preset': { artifacts: [], recommended: true } },
}
