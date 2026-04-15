import type { BundleManifest } from '@/registry/types.js'
export const manifest: BundleManifest = {
  name: 'code-review-gates',
  description: 'Self-review + PR review + feedback-response protocol (Ship/Show/Ask)',
  version: '1.0.0', experimental: false, defaultRole: 'workflow-preset',
  common: {
    artifacts: [
      { type: 'skill', src: 'skills/code-review' },
      { type: 'rule', src: 'rules/git-workflow.md' },
      { type: 'agent', src: 'agents/code-reviewer.md' },
    ],
  },
  roles: { 'workflow-preset': { artifacts: [], recommended: true } },
}
