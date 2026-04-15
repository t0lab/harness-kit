import type { BundleManifest } from '@/registry/types.js'

export const manifest: BundleManifest = {
  name: 'parallel-agents',
  description: 'Parallel-subagent dispatch protocol — fan-out, briefing, output contracts',
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
