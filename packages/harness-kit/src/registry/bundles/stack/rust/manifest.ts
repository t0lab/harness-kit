import type { BundleManifest } from '@/registry/types.js'

export const manifest: BundleManifest = {
  name: 'rust',
  description: 'Rust language base — coding style, patterns, testing, security conventions',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'stack',
  common: {
    artifacts: [
      { type: 'rule',  src: 'rules/stack-rust/coding-style.md' },
      { type: 'rule',  src: 'rules/stack-rust/patterns.md' },
      { type: 'rule',  src: 'rules/stack-rust/testing.md' },
      { type: 'rule',  src: 'rules/stack-rust/security.md' },
      { type: 'skill', src: 'skills/stack-rust' },
    ],
  },
  roles: {
    stack: { artifacts: [], recommended: true },
  },
}
