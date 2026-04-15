import type { BundleManifest } from '../../../types.js'

export const manifest: BundleManifest = {
  name: 'tdd',
  description: 'TDD — red/green/refactor, failing test first, minimum code to pass',
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
