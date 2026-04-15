import type { BundleManifest } from '../../../types.js'

export const manifest: BundleManifest = {
  name: 'planning-first',
  description: 'Brainstorm → spec → approval → plan → execute — hard gate before coding, plus execution discipline (critique plan, verify after each task, stop on failure, no implementing on main)',
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
