import type { BundleManifest } from '@/registry/types.js'

export const manifest: BundleManifest = {
  name: 'pre-commit-hooks',
  description: 'Pre-commit gate — auto-detects stack, blocks conflict markers + secrets, extensible',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'git-workflow',
  common: {
    artifacts: [
      { type: 'git-hook', src: 'git-hooks/pre-commit/tech-gates.sh', hookName: 'pre-commit' },
      { type: 'rule', src: 'rules/pre-commit-hooks.md' },
    ],
    requires: ['git'],
  },
  roles: {
    'git-workflow': { artifacts: [], recommended: true },
  },
}
