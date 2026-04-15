import type { BundleManifest } from '../../../types.js'

export const manifest: BundleManifest = {
  name: 'java',
  description: 'Java language base — coding style, patterns, testing, security conventions',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'stack',
  common: {
    artifacts: [
      { type: 'rule',  src: 'rules/stack-java/coding-style.md' },
      { type: 'rule',  src: 'rules/stack-java/patterns.md' },
      { type: 'rule',  src: 'rules/stack-java/testing.md' },
      { type: 'rule',  src: 'rules/stack-java/security.md' },
      { type: 'skill', src: 'skills/stack-java' },
    ],
  },
  roles: {
    stack: { artifacts: [], recommended: true },
  },
}
