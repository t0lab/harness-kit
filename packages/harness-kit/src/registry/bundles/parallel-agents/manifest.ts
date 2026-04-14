import type { BundleManifest } from '../../types.js'

export const manifest: BundleManifest = {
  name: 'parallel-agents',
  description: 'Dispatch protocol for parallel subagents — when to fan out, how to brief, how to contract output',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'workflow-preset',
  common: {
    artifacts: [
      { type: 'skill', src: 'skills/parallel-agents' },
      { type: 'rule', src: 'rules/parallel-agents.md' },
    ],
  },
  roles: {
    'workflow-preset': { artifacts: [] },
  },
}
