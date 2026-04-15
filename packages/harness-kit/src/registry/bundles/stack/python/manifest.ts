import type { BundleManifest } from '../../../types.js'

export const manifest: BundleManifest = {
  name: 'python',
  description: 'Python language base — coding style, patterns, testing, security conventions',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'stack',
  common: {
    artifacts: [
      { type: 'rule',  src: 'rules/stack-python/coding-style.md' },
      { type: 'rule',  src: 'rules/stack-python/patterns.md' },
      { type: 'rule',  src: 'rules/stack-python/testing.md' },
      { type: 'rule',  src: 'rules/stack-python/security.md' },
      { type: 'skill', src: 'skills/stack-python' },
    ],
  },
  roles: {
    stack: { artifacts: [], recommended: true },
  },
}
