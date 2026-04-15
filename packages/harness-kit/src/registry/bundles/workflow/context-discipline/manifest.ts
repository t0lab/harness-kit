import type { BundleManifest } from '../../../types.js'
export const manifest: BundleManifest = {
  name: 'context-discipline',
  description: 'Context hygiene — targeted reads, /clear+/compact discipline, task decomposition',
  version: '1.0.0', experimental: false, defaultRole: 'workflow-preset',
  common: {
    artifacts: [
      { type: 'skill', src: 'skills/context-discipline' },
      { type: 'rule', src: 'rules/context-discipline.md' },
    ],
  },
  roles: { 'workflow-preset': { artifacts: [], recommended: true } },
}
