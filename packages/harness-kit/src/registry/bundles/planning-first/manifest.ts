import type { BundleManifest } from '../../types.js'

export const manifest: BundleManifest = {
  name: 'planning-first',
  description: 'Brainstorm → spec → approval → plan → implement — hard gate against coding before the plan is approved',
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
