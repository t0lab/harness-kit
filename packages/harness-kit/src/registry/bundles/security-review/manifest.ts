import type { BundleManifest } from '../../types.js'

export const manifest: BundleManifest = {
  name: 'security-review',
  description: 'Dedicated security review protocol - auth, access control, secrets, injection, risky commands, and agent config boundaries',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'workflow-preset',
  common: {
    artifacts: [
      { type: 'skill', src: 'skills/security-review' },
      { type: 'rule', src: 'rules/security-review.md' },
    ],
  },
  roles: {
    'workflow-preset': { artifacts: [] },
  },
}
