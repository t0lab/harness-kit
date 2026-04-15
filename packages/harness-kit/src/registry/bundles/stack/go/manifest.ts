import type { BundleManifest } from '@/registry/types.js'

export const manifest: BundleManifest = {
  name: 'go',
  description: 'Go language base — coding style, patterns, testing, security conventions',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'stack',
  common: {
    artifacts: [
      { type: 'rule',  src: 'rules/stack-go/coding-style.md' },
      { type: 'rule',  src: 'rules/stack-go/patterns.md' },
      { type: 'rule',  src: 'rules/stack-go/testing.md' },
      { type: 'rule',  src: 'rules/stack-go/security.md' },
      { type: 'skill', src: 'skills/stack-go' },
    ],
  },
  roles: {
    stack: { artifacts: [], recommended: true },
  },
}
