import type { BundleManifest } from '../../../types.js'

export const manifest: BundleManifest = {
  name: 'systematic-debugging',
  description: 'Root-cause debugging — reproduce, isolate, test one hypothesis, then fix',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'workflow-preset',
  common: {
    artifacts: [
      { type: 'skill', src: 'skills/systematic-debugging' },
      { type: 'rule', src: 'rules/systematic-debugging.md' },
    ],
  },
  roles: {
    'workflow-preset': { artifacts: [], recommended: true },
  },
}
