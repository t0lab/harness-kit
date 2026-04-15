import type { BundleManifest } from '@/registry/types.js'

export const manifest: BundleManifest = {
  name: 'agent-browser',
  description: 'Token-efficient browser automation via accessibility snapshots (~200-400 tokens/page)',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'browser',
  common: {
    artifacts: [
      { type: 'tool', installCmd: 'npm install -g agent-browser && agent-browser install' },
      { type: 'skill', src: 'https://github.com/vercel-labs/agent-browser --skill agent-browser' },
    ],
    requires: ['chrome'],
  },
  roles: {
    browser: { artifacts: [] },
  },
}
