import type { BundleManifest } from '@/registry/types.js'

export const manifest: BundleManifest = {
  name: 'no-memory',
  description: 'Opt out of memory — installs a rule disabling persistent memory',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'memory',
  common: {
    artifacts: [{ type: 'rule', src: 'rules/no-memory.md' }],
  },
  roles: {
    memory: { artifacts: [] },
  },
}
