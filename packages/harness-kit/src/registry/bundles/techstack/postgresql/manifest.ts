import type { BundleManifest } from '@/registry/types.js'

export const manifest: BundleManifest = {
  name: 'postgresql',
  description: 'PostgreSQL — schema design, data types, indexes, constraints, performance patterns',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'techstack',
  common: {
    artifacts: [
      { type: 'skill', src: 'https://github.com/wshobson/agents --skill postgresql-table-design' },
      { type: 'rule', src: 'rules/postgresql.md' },
    ],
  },
  roles: {
    techstack: { artifacts: [], recommended: true },
  },
}
