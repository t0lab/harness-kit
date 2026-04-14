import type { BundleManifest } from '../../types.js'

export const manifest: BundleManifest = {
  name: 'quality-gates',
  description: 'Fresh verification before declaring done - repo-appropriate test/lint/typecheck/build evidence, never "should pass". Wired to Claude Code Stop hook so the reminder fires automatically at end-of-turn.',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'workflow-preset',
  common: {
    artifacts: [
      { type: 'skill', src: 'skills/quality-gates' },
      { type: 'rule', src: 'rules/quality-gates.md' },
      { type: 'hook', src: 'hooks/quality-gates-stop.sh', hookType: 'Stop' },
    ],
  },
  roles: {
    'workflow-preset': { artifacts: [], recommended: true },
  },
}
