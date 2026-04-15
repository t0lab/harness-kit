import type { BundleManifest } from '../../types.js'

export const manifest: BundleManifest = {
  name: 'spec-driven',
  description: 'Spec as source of truth - write or update product/design specs before planning and implementing non-trivial work',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'workflow-preset',
  common: {
    artifacts: [
      { type: 'skill', src: 'skills/spec-driven' },
      { type: 'rule', src: 'rules/spec-driven.md' },
    ],
  },
  roles: {
    'workflow-preset': { artifacts: [], recommended: true },
  },
}
