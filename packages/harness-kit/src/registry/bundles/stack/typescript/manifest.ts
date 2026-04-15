import type { BundleManifest } from '../../../types.js'

export const manifest: BundleManifest = {
  name: 'typescript',
  description: 'TypeScript/JavaScript language base — coding style, patterns, testing, security conventions',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'stack',
  common: {
    artifacts: [
      { type: 'rule',  src: 'rules/stack-typescript/coding-style.md' },
      { type: 'rule',  src: 'rules/stack-typescript/patterns.md' },
      { type: 'rule',  src: 'rules/stack-typescript/testing.md' },
      { type: 'rule',  src: 'rules/stack-typescript/security.md' },
      { type: 'skill', src: 'skills/stack-typescript' },
    ],
  },
  roles: {
    stack: { artifacts: [], recommended: true },
  },
}
