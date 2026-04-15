import type { BundleManifest } from '../../types.js'

export const manifest: BundleManifest = {
  name: 'tdd',
  description: 'Red-green-refactor workflow - write the failing test first, prove it fails, then implement the minimum code',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'workflow-preset',
  common: {
    artifacts: [
      { type: 'skill', src: 'skills/tdd' },
      { type: 'rule', src: 'rules/tdd.md' },
    ],
  },
  roles: {
    'workflow-preset': { artifacts: [], recommended: true },
  },
}
