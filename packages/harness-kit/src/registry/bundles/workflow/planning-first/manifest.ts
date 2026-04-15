import type { BundleManifest } from '@/registry/types.js'

export const manifest: BundleManifest = {
  name: 'planning-first',
  description: 'Brainstorm → spec → plan → execute — hard gate before coding, with execution discipline',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'workflow-preset',
  common: {
    artifacts: [
      { type: 'skill', src: 'skills/planning-first' },
      { type: 'rule', src: 'rules/planning-first.md' },
    ],
  },
  roles: {
    'workflow-preset': { artifacts: [], recommended: true },
  },
}
