import type { BundleManifest } from '../../types.js'

export const manifest: BundleManifest = {
  name: 'pre-commit-hooks',
  description: 'Tech-stack-aware pre-commit gate — auto-detects Node/Python/Go/Rust, blocks conflict markers + obvious secrets, extensible via .githooks/pre-commit.d/',
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
