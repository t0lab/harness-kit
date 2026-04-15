import type { BundleManifest } from '../../../types.js'

export const manifest: BundleManifest = {
  name: 'security-review',
  description: 'Security review protocol + subagent for diffs touching trust boundaries',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'workflow-preset',
  common: {
    artifacts: [
      { type: 'skill', src: 'skills/security-review' },
      { type: 'rule', src: 'rules/security-review.md' },
      { type: 'agent', src: 'agents/security-reviewer.md' },
    ],
  },
  roles: {
    'workflow-preset': { artifacts: [] },
  },
}
