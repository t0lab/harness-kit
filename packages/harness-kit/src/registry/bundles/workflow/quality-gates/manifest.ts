import type { BundleManifest } from '@/registry/types.js'

export const manifest: BundleManifest = {
  name: 'quality-gates',
  description: 'Fresh verification before done — test/lint/typecheck evidence, wired to Stop hook',
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
